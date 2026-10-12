'use strict'

/**
 * 分钟K线仓库（DolphinDB minute_k 表）。
 */

const ddb = require('./client')

const COLS = [
  { name: 'symbol', type: 'symbol' },
  { name: 'trade_date', type: 'date' },
  { name: 'timestamp', type: 'timestamp' },
  { name: 'period', type: 'int' },
  { name: 'open', type: 'double' },
  { name: 'close', type: 'double' },
  { name: 'high', type: 'double' },
  { name: 'low', type: 'double' },
  { name: 'volume', type: 'long' },
  { name: 'amount', type: 'double' },
  { name: 'avg_price', type: 'double' },
  { name: 'amplitude', type: 'double' },
  { name: 'pct_chg', type: 'double' },
  { name: 'change_amount', type: 'double' },
  { name: 'turnover_rate', type: 'double' }
]

const TBL = `loadTable("dfs://tradeinsight", "minute_k")`

const dd = (s) => String(s || '').replace(/-/g, '.')

async function insertMinuteK(rawRows, symbol, period) {
  if (!rawRows || rawRows.length === 0) return 0
  if (!ddb.isConnected()) return 0
  const rows = rawRows.map(r => ({
    symbol,
    trade_date: r['时间'] ? r['时间'].slice(0, 10) : new Date().toISOString().slice(0, 10),
    timestamp: r['时间'] || new Date().toISOString(),
    period: Number(period) || 5,
    open: toDouble(r['开盘']),
    close: toDouble(r['收盘']),
    high: toDouble(r['最高']),
    low: toDouble(r['最低']),
    volume: toLong(r['成交量']),
    amount: toDouble(r['成交额']),
    avg_price: toDouble(r['均价']),
    amplitude: toDouble(r['振幅']),
    pct_chg: toDouble(r['涨跌幅']),
    change_amount: toDouble(r['涨跌额']),
    turnover_rate: toDouble(r['换手率'])
  }))
  // 预删除该股该日该周期的数据
  const d = rows[0]?.trade_date?.replace(/-/g, '.') || ''
  if (d) {
    await ddb.execute(`t = ${TBL}; delete from t where symbol='${symbol}' and trade_date=${d} and period=${Number(period) || 5}`)
  }
  await ddb.insertRows('minute_k', COLS, rows)
  return rows.length
}

async function getMinuteK(symbol, tradeDate, period) {
  if (!ddb.isConnected()) return []
  const d = dd(tradeDate)
  const r = await ddb.execute(`select * from ${TBL} where symbol='${symbol}' and trade_date=${d} and period=${Number(period) || 5} order by timestamp`)
  return Array.isArray(r) ? r : []
}

async function getMinuteKLatest(symbol) {
  if (!ddb.isConnected()) return null
  const r = await ddb.execute(`select max(trade_date) as latest from ${TBL} where symbol='${symbol}'`)
  return r && r[0] ? r[0].latest : null
}

function toDouble(v) { return v == null ? null : Number(v) }
function toLong(v) { return v == null ? null : Math.abs(Math.round(Number(v))) }

module.exports = { insertMinuteK, getMinuteK, getMinuteKLatest, COLS }
