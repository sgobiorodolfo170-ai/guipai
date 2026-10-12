'use strict'

/**
 * 全市场实时行情快照仓库（DolphinDB stock_spot 表）。
 * write-on-miss 模式：cache miss → aktools 取数 → 预删除今日 + insertRows → 重读。
 */

const ddb = require('./client')

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
 * 读取指定股票快照。
 */
async function getSpotByCode(code) {
  if (!ddb.isConnected()) return []
  const r = await ddb.execute(`select * from ${TBL} where symbol='${code}' and trade_date = (select max(trade_date) from ${TBL})`)
  return Array.isArray(r) ? r : []
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

module.exports = { insertSpot, insertSpotSafe, getSpot, getSpotByCode, getLatestSpotTimestamp, SPOT_COLS }
