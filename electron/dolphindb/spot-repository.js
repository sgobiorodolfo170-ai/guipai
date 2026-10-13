'use strict'

/**
 * 全市场实时行情快照仓库（DolphinDB stock_spot 表）。
 * write-on-miss 模式：cache miss → aktools 取数 → 预删除今日 + insertRows → 重读。
 */

const ddb = require('./client')
const { safeSymbol } = require('./params')

const SPOT_COLS = [
  { name: 'symbol', type: 'symbol' },
  { name: 'trade_date', type: 'date' },
  { name: 'timestamp', type: 'timestamp' },
  { name: 'open', type: 'double' },
  { name: 'close', type: 'double' },
  { name: 'high', type: 'double' },
  { name: 'low', type: 'double' },
  { name: 'preclose', type: 'double' },
  { name: 'volume', type: 'long' },
  { name: 'amount', type: 'double' },
  { name: 'pct_chg', type: 'double' },
  { name: 'change_amount', type: 'double' },
  { name: 'turnover_rate', type: 'double' },
  { name: 'amplitude', type: 'double' },
  { name: 'total_market_value', type: 'double' },
  { name: 'circulation_market_value', type: 'double' },
  { name: 'pe_ttm', type: 'double' },
  { name: 'pb', type: 'double' }
]

const TBL = `loadTable("dfs://tradeinsight", "stock_spot")`

// 单飞锁：同一时刻只有一个 spot 写入操作
let spotInFlight = null

/**
 * 写入全市场快照（预删除今日 + insertRows，幂等）。
 * @param rawRows aktools.getStockSpot 返回的中文键行数组
 * @returns 写入行数
 */
async function insertSpot(rawRows) {
  if (!rawRows || rawRows.length === 0) return 0
  if (!ddb.isConnected()) return 0

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
  const now = new Date()

  const rows = rawRows.map(r => ({
    symbol: r['代码'],
    trade_date: today.replace(/\./g, '-'),
    timestamp: now,
    open: toDouble(r['今开']),
    close: toDouble(r['最新价']),
    high: toDouble(r['最高']),
    low: toDouble(r['最低']),
    preclose: toDouble(r['昨收']),
    volume: toLong(r['成交量']),
    amount: toDouble(r['成交额']),
    pct_chg: toDouble(r['涨跌幅']),
    change_amount: toDouble(r['涨跌额']),
    turnover_rate: toDouble(r['换手率']),
    amplitude: toDouble(r['振幅']),
    total_market_value: toDouble(r['总市值']),
    circulation_market_value: toDouble(r['流通市值']),
    pe_ttm: toDouble(r['市盈率-动态']),
    pb: toDouble(r['市净率'])
  })).filter(r => r.symbol)

  // 预删除今日数据（幂等）
  await ddb.execute(`t = ${TBL}; delete from t where trade_date=${today}`)
  // 插入
  await ddb.insertRows('stock_spot', SPOT_COLS, rows)
  return rows.length
}

/**
 * 写入快照（带单飞锁）。
 * 并发请求时复用同一个 in-flight Promise，避免互相删除。
 */
async function insertSpotSafe(rawRows) {
  if (spotInFlight) return spotInFlight
  spotInFlight = insertSpot(rawRows)
  try {
    return await spotInFlight
  } finally {
    spotInFlight = null
  }
}

/**
 * 读取全市场快照（最新交易日）。
 */
async function getSpot() {
  if (!ddb.isConnected()) return []
  const r = await ddb.execute(`select * from ${TBL} where trade_date = (select max(trade_date) from ${TBL})`)
  return Array.isArray(r) ? r : []
}

/**
 * 读取指定股票快照（最新交易日）。
 * @returns 单行对象，无数据/非法代码/未连接返回 null（注意是 null 而非 [] —— 调用方按单对象消费）
 */
async function getSpotByCode(code) {
  if (!ddb.isConnected()) return null
  const sym = safeSymbol(code)
  if (!sym) return null
  const r = await ddb.execute(`select * from ${TBL} where symbol='${sym}' and trade_date = (select max(trade_date) from ${TBL})`)
  return Array.isArray(r) && r.length ? r[0] : null
}

/**
 * 读取最新快照时间戳。
 */
async function getLatestSpotTimestamp() {
  if (!ddb.isConnected()) return null
  const r = await ddb.execute(`select max(timestamp) as ts from ${TBL}`)
  return r && r[0] ? r[0].ts : null
}

function toDouble(v) { return v == null ? null : Number(v) }
function toLong(v) { return v == null ? null : Math.abs(Math.round(Number(v))) }

/**
 * 从 daily_k_raw 派生全市场快照（每只股票最新一行）。
 *
 * 用途：stock_spot 表为空且上游行情源全挂时，用 raw 的最新收盘数据兜底，
 * 让 /realtime /hot /:code 在离线环境下仍有数据。
 *
 * 限制：raw 只有 8 列（symbol/trade_date/open/close/high/low/volume/amount），
 * 缺 pct_chg/turnover_rate/pe/pb/总市值等 10 列，这些填 null。
 * raw 是收盘价非实时价，trade_date 是最近交易日而非今日。
 *
 * @returns 写入 stock_spot 的行数
 */
async function deriveFromRaw() {
  if (!ddb.isConnected()) return 0
  // context by symbol last — DolphinDB 取每 symbol 最后一行
  const raw = await ddb.execute(
    `select symbol, trade_date, open, close, high, low, volume, amount` +
    ` from loadTable("dfs://tradeinsight_raw", "daily_k_raw")` +
    ` context by symbol last`
  )
  if (!Array.isArray(raw) || !raw.length) return 0

  const today = new Date().toISOString().slice(0, 10)
  const now = new Date()
  const todayDdb = today.replace(/-/g, '.')

  const rows = raw.map(r => ({
    symbol: r.symbol,
    trade_date: today,
    timestamp: now,
    open: toDouble(r.open),
    close: toDouble(r.close),
    high: toDouble(r.high),
    low: toDouble(r.low),
    preclose: null,
    volume: toLong(r.volume),
    amount: toDouble(r.amount),
    pct_chg: null,
    change_amount: null,
    turnover_rate: null,
    amplitude: null,
    total_market_value: null,
    circulation_market_value: null,
    pe_ttm: null,
    pb: null
  })).filter(r => r.symbol)

  // 预删除今日数据（幂等）
  await ddb.execute(`t = ${TBL}; delete from t where trade_date=${todayDdb}`)
  await ddb.insertRows('stock_spot', SPOT_COLS, rows)
  return rows.length
}

module.exports = { insertSpot, insertSpotSafe, getSpot, getSpotByCode, getLatestSpotTimestamp, deriveFromRaw, SPOT_COLS }
