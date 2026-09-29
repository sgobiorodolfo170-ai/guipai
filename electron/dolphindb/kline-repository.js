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

// daily_k 列定义（须与 ensureSchema 列序一致）
const DAILY_K_COLS = [
  { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
  { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
  { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
  { name: 'volume', type: 'long' }, { name: 'amount', type: 'double' },
  { name: 'turnover_rate', type: 'double' }, { name: 'pct_chg', type: 'double' },
  { name: 'amplitude', type: 'double' }, { name: 'create_time', type: 'timestamp' }
]

const TBL = `loadTable("dfs://tradeinsight", "daily_k")`
const dd = (s) => String(s || '').replace(/-/g, '.')

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

/**
 * 写入个股日K（前复权）——预删除(symbol+日期范围) + insertRows，幂等去重。
 * @param rawRows aktools.getStockHistory 返回的中文键行数组
 * @returns 写入行数
 */
async function insertDailyK(rawRows) {
  if (!rawRows || rawRows.length === 0) return 0
  const rows = rawRows.map(r => ({
    symbol: r['股票代码'],
    trade_date: r['日期'],
    open: r['开盘'], close: r['收盘'], high: r['最高'], low: r['最低'],
    volume: r['成交量'], amount: r['成交额'],
    turnover_rate: r['换手率'], pct_chg: r['涨跌幅'], amplitude: r['振幅'],
    create_time: new Date()
  }))
  // 预删除（symbol + 日期范围），保证幂等
  const symbol = rows[0].symbol
  const dates = rows.map(r => dd(r.trade_date)).sort()
  await ddb.execute(`t = loadTable("dfs://tradeinsight", "daily_k"); delete from t where symbol='${symbol}' and trade_date between ${dates[0]} and ${dates[dates.length - 1]}`)
  // 插入
  return await ddb.insertRows('daily_k', DAILY_K_COLS, rows)
}

/**
 * 查询个股日K（DolphinDB first）。
 * @returns 中文键行数组（与 aktools.getStockHistory 输出同构）
 */
async function getDailyK(symbol, startDate, endDate) {
  const sd = dd(startDate), ed = dd(endDate)
  const r = await ddb.execute(
    `select trade_date as 日期, symbol as 股票代码, open as 开盘, close as 收盘,` +
    ` high as 最高, low as 最低, volume as 成交量, amount as 成交额,` +
    ` turnover_rate as 换手率, pct_chg as 涨跌幅, amplitude as 振幅` +
    ` from ${TBL} where symbol='${symbol}' and trade_date between ${sd} and ${ed} order by trade_date`
  )
  return normRows(r)
}

/**
 * 聚合 K 线（周/月/季/年）——从日K即时聚合，不额外存储。
 * @param period 'weekly'|'monthly'|'quarterly'|'yearly'
 */
async function getKlineAggregated(symbol, startDate, endDate, period) {
  const sd = dd(startDate), ed = dd(endDate)
  let groupBy
  if (period === 'weekly') groupBy = 'year(trade_date), weekOfYear(trade_date)'
  else if (period === 'monthly') groupBy = 'year(trade_date), month(trade_date)'
  else if (period === 'quarterly') groupBy = 'year(trade_date), quarter(trade_date)'
  else if (period === 'yearly') groupBy = 'year(trade_date)'
  else return getDailyK(symbol, startDate, endDate) // daily → 直接查

  const r = await ddb.execute(
    `select first(trade_date) as 日期, first(open) as 开盘, last(close) as 收盘,` +
    ` max(high) as 最高, min(low) as 最低, sum(volume) as 成交量, sum(amount) as 成交额` +
    ` from ${TBL} where symbol='${symbol}' and trade_date between ${sd} and ${ed}` +
    ` group by ${groupBy} order by 日期`
  )
  return normRows(r)
}

/**
 * 查某股最新交易日K日期（用于判断数据缺口）。
 * @returns 'YYYY-MM-DD' 或 null
 */
async function getDailyKLatest(symbol) {
  const r = await ddb.execute(`select max(trade_date) as latest from ${TBL} where symbol='${symbol}'`)
  if (!Array.isArray(r) || !r.length) return null
  return normDate(r[0].latest)
}

/** 统计某股日K行数（数据完整性检查） */
async function getDailyKCount(symbol) {
  return await ddb.count(`select count(*) as c from ${TBL} where symbol='${symbol}'`)
}

module.exports = {
  insertDailyK,
  getDailyK,
  getKlineAggregated,
  getDailyKLatest,
  getDailyKCount,
  DAILY_K_COLS
}
