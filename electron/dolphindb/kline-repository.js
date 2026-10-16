'use strict'

/**
 * K 线数据仓库（DolphinDB 数据访问层）。
 *
 * 职责：
 *   - 个股日K的写入（upsert! 幂等去重）、查询、聚合（周/月/季/年K）。
 *   - "DolphinDB first"策略的数据层实现——路由层先查此模块，miss 后回退东财/Tushare。
 *
 * 数据全部前复权（qfq），存储于 DolphinDB dfs://tradeinsight / daily_k 表。
 */

const ddb = require('./client')
const { safeSymbol, safeDate } = require('./params')

// daily_k 列定义（须与 ensureSchema 列序一致）
// volume 为 LONG：与 daily_k 建表脚本一致；写入前由 toInt() 取整以容纳行情源的小数成交量。
const DAILY_K_COLS = [
  { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
  { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
  { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
  { name: 'volume', type: 'long' }, { name: 'amount', type: 'double' },
  { name: 'turnover_rate', type: 'double' }, { name: 'pct_chg', type: 'double' },
  { name: 'amplitude', type: 'double' }, { name: 'create_time', type: 'timestamp' }
]

const TBL = `loadTable("dfs://tradeinsight", "daily_k")`
// 原始基线表：独立的 dfs://tradeinsight_raw 库（1990 起 RANGE 分区，覆盖 1998 至今）。
// 与 TBL 分开存放的理由见 README_RAW_DATA.md：raw 是不可变基线，工作表写入不应污染它。
const RAW_TBL = `loadTable("dfs://tradeinsight_raw", "daily_k_raw")`

/** DolphinDB 日期串 → ISO（2026.09.25 → 2026-09-25） */
function normDate(v) {
  if (v == null) return null
  let s = String(v)
  if (s.includes('.')) return s.replace(/\./g, '-')
  return s
}

/** 统一行规范化（DolphinDB 返回的日期可能为 2026.09.25 格式） */
function normRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map(r => {
    if (r['日期']) r['日期'] = normDate(r['日期'])
    return r
  })
}

/** DolphinDB 是否可用（已连接）。
 *  本机没起 DolphinDB 时必须走这里快速短路：否则每次读库都会触发一次 connect()，
 *  而连接失败要耗 ~10s（实测），表现为"K线接口每次都要等十几秒才返回"。 */
function ddbReady() { return ddb.isConnected() }

/** 数值安全转整数：行情源成交量（手）带小数，写入 LONG 列会报 BigInt 转换失败。
 *  存量表 daily_k.volume 若为 LONG 类型（建表早于 DOUBLE 修正），靠此处取整兜底。 */
function toInt(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n) : 0
}

/**
 * 写入个股日K（前复权）——预删除(symbol+日期范围) + insertRows，幂等去重。
 * @param rawRows aktools.getStockHistory 返回的中文键行数组
 * @returns 写入行数
 */
async function insertDailyK(rawRows) {
  if (!rawRows || rawRows.length === 0) return 0
  if (!ddbReady()) return 0 // 本机无 DolphinDB：跳过回填，避免无谓的连接尝试
  const rows = rawRows.map(r => ({
    symbol: safeSymbol(r['股票代码']) || r['股票代码'],
    trade_date: r['日期'],
    open: r['开盘'], close: r['收盘'], high: r['最高'], low: r['最低'],
    volume: toInt(r['成交量']), amount: r['成交额'],
    turnover_rate: r['换手率'], pct_chg: r['涨跌幅'], amplitude: r['振幅'],
    create_time: new Date()
  })).filter(r => safeSymbol(r.symbol) && safeDate(r.trade_date))
  if (!rows.length) return 0
  // 预删除（symbol + 日期范围），保证幂等
  // symbol 已在 filter 步骤经 safeSymbol 校验，此处显式再校验一次——
  // 即使上游重构移除了 filter，execute 这一层仍然安全。
  const symbol = safeSymbol(rows[0].symbol)
  if (!symbol) return 0
  const dates = rows.map(r => safeDate(r.trade_date)).sort()
  await ddb.execute(`t = loadTable("dfs://tradeinsight", "daily_k"); delete from t where symbol='${symbol}' and trade_date between ${dates[0]} and ${dates[dates.length - 1]}`)
  // 插入
  return await ddb.insertRows('daily_k', DAILY_K_COLS, rows)
}

/**
 * 查询个股日K（DolphinDB first）。
 * @returns 中文键行数组（与 aktools.getStockHistory 输出同构）
 */
async function getDailyK(symbol, startDate, endDate) {
  if (!ddbReady()) return [] // 未连接 → 直接判 miss，让路由走网络兜底（避免白等 ~10s 连接超时）
  const sym = safeSymbol(symbol), sd = safeDate(startDate), ed = safeDate(endDate)
  if (!sym || !sd || !ed) return []
  const r = await ddb.execute(
    `select trade_date as 日期, symbol as 股票代码, open as 开盘, close as 收盘,` +
    ` high as 最高, low as 最低, volume as 成交量, amount as 成交额,` +
    ` turnover_rate as 换手率, pct_chg as 涨跌幅, amplitude as 振幅` +
    ` from ${TBL} where symbol='${sym}' and trade_date between ${sd} and ${ed} order by trade_date`
  )
  return normRows(r)
}

/**
 * 聚合 K 线（周/月/季/年）——从日K即时聚合，不额外存储。
 * @param period 'weekly'|'monthly'|'quarterly'|'yearly'
 */
async function getKlineAggregated(symbol, startDate, endDate, period) {
  if (!ddbReady()) return [] // 同上：未连接直接判 miss
  const sym = safeSymbol(symbol), sd = safeDate(startDate), ed = safeDate(endDate)
  if (!sym || !sd || !ed) return []
  let groupBy
  if (period === 'weekly') groupBy = 'year(trade_date), weekOfYear(trade_date)'
  else if (period === 'monthly') groupBy = 'year(trade_date), month(trade_date)'
  else if (period === 'quarterly') groupBy = 'year(trade_date), quarter(trade_date)'
  else if (period === 'yearly') groupBy = 'year(trade_date)'
  else return getDailyK(symbol, startDate, endDate) // daily → 直接查

  const r = await ddb.execute(
    `select first(trade_date) as 日期, first(open) as 开盘, last(close) as 收盘,` +
    ` max(high) as 最高, min(low) as 最低, sum(volume) as 成交量, sum(amount) as 成交额` +
    ` from ${TBL} where symbol='${sym}' and trade_date between ${sd} and ${ed}` +
    ` group by ${groupBy} order by 日期`
  )
  return normRows(r)
}

/**
 * 查某股最新交易日K日期（用于判断数据缺口）。
 * @returns 'YYYY-MM-DD' 或 null
 */
async function getDailyKLatest(symbol) {
  if (!ddbReady()) return null
  const sym = safeSymbol(symbol)
  if (!sym) return null
  const r = await ddb.execute(`select max(trade_date) as latest from ${TBL} where symbol='${sym}'`)
  if (!Array.isArray(r) || !r.length) return null
  return normDate(r[0].latest)
}

/**
 * 读取原始日K基线表（dfs://tradeinsight_raw / daily_k_raw，TDX 不复权全量）。
 *
 * 用途：daily_k（工作表，只存 aktools 拉取过的前复权日K）覆盖不足时用它兜底历史区间。
 * 仅 8 列（无 turnover_rate/pct_chg/amplitude），这三列返回 null，由前端按缺失渲染。
 * 注意：raw 是**不复权**价，与 daily_k 的前复权口径不同，故仅作长周期兜底、不参与混算。
 *
 * @returns 中文键行数组，与 getDailyK 同构
 */
async function getDailyKRaw(symbol, startDate, endDate) {
  if (!ddbReady()) return []
  const sym = safeSymbol(symbol), sd = safeDate(startDate), ed = safeDate(endDate)
  if (!sym || !sd || !ed) return []
  const r = await ddb.execute(
    `select trade_date as 日期, symbol as 股票代码, open as 开盘, close as 收盘,` +
    ` high as 最高, low as 最低, volume as 成交量, amount as 成交额,` +
    ` null as 换手率, null as 涨跌幅, null as 振幅` +
    ` from ${RAW_TBL} where symbol='${sym}' and trade_date between ${sd} and ${ed} order by trade_date`
  )
  return normRows(r)
}

/** 原始基线表是否有该股数据（决定是否兜底，避免多打一次库） */
async function hasDailyKRaw(symbol) {
  if (!ddbReady()) return false
  const sym = safeSymbol(symbol)
  if (!sym) return false
  return (await ddb.count(`select count(*) as c from ${RAW_TBL} where symbol='${sym}'`)) > 0
}

/** 统计某股日K行数（数据完整性检查） */
async function getDailyKCount(symbol) {
  if (!ddbReady()) return 0
  const sym = safeSymbol(symbol)
  if (!sym) return 0
  return await ddb.count(`select count(*) as c from ${TBL} where symbol='${sym}'`)
}

module.exports = {
  ddbReady,
  insertDailyK,
  getDailyK,
  getKlineAggregated,
  getDailyKLatest,
  getDailyKCount,
  getDailyKRaw,
  hasDailyKRaw,
  DAILY_K_COLS
}
