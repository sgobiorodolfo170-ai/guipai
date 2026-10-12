'use strict'

/**
 * 指数实时行情快照仓库（DolphinDB stock_index_spot 表）。
 */

const ddb = require('./client')

const COLS = [
  { name: 'symbol', type: 'symbol' },
  { name: 'trade_date', type: 'date' },
  { name: 'timestamp', type: 'timestamp' },
  { name: 'latest_price', type: 'double' },
  { name: 'pct_chg', type: 'double' },
  { name: 'change_amount', type: 'double' },
  { name: 'volume', type: 'long' },
  { name: 'amount', type: 'double' },
  { name: 'high', type: 'double' },
  { name: 'low', type: 'double' },
  { name: 'open', type: 'double' },
  { name: 'close', type: 'double' },
  { name: 'preclose', type: 'double' }
]

const TBL = `loadTable("dfs://tradeinsight", "stock_index_spot")`

async function insertIndexSpot(rawList, tradeDate) {
  if (!rawList || rawList.length === 0) return 0
  if (!ddb.isConnected()) return 0
  const today = tradeDate || new Date().toISOString().slice(0, 10)
  const now = new Date()
  const rows = rawList.map(r => ({
    symbol: r['代码'],
    trade_date: today,
    timestamp: now,
    latest_price: toDouble(r['最新价']),
    pct_chg: toDouble(r['涨跌幅']),
    change_amount: toDouble(r['涨跌额']),
    volume: toLong(r['成交量']),
    amount: toDouble(r['成交额']),
    high: toDouble(r['最高']),
    low: toDouble(r['最低']),
    open: toDouble(r['今开']),
    close: toDouble(r['最新价']),
    preclose: toDouble(r['昨收'])
  })).filter(r => r.symbol)
  const d = today.replace(/-/g, '.')
  await ddb.execute(`t = ${TBL}; delete from t where trade_date=${d}`)
  await ddb.insertRows('stock_index_spot', COLS, rows)
  return rows.length
}

async function getIndexSpot() {
  if (!ddb.isConnected()) return []
  const r = await ddb.execute(`select * from ${TBL} where trade_date = (select max(trade_date) from ${TBL})`)
  return Array.isArray(r) ? r : []
}

function toDouble(v) { return v == null ? null : Number(v) }
function toLong(v) { return v == null ? null : Math.abs(Math.round(Number(v))) }

module.exports = { insertIndexSpot, getIndexSpot, COLS }
