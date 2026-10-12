'use strict'

/**
 * 十大股东持股明细仓库（DolphinDB stock_holding 表）。
 */

const ddb = require('./client')

const COLS = [
  { name: 'trade_date', type: 'date' },
  { name: 'symbol', type: 'symbol' },
  { name: 'holder_name', type: 'string' },
  { name: 'holder_type', type: 'symbol' },
  { name: 'hold_num', type: 'long' },
  { name: 'hold_ratio', type: 'double' },
  { name: 'hold_num_change', type: 'long' },
  { name: 'hold_ratio_change', type: 'double' },
  { name: 'change_type', type: 'symbol' },
  { name: 'notice_date', type: 'date' },
  { name: 'rank', type: 'int' }
]

const TBL = `loadTable("dfs://tradeinsight", "stock_holding")`

const dd = (s) => String(s || '').replace(/-/g, '.')

async function insertHolding(rawRows, tradeDate, symbol) {
  if (!rawRows || rawRows.length === 0) return 0
  if (!ddb.isConnected()) return 0
  const rows = rawRows.map(r => ({
    trade_date: tradeDate,
    symbol: r['股票代码'] || symbol,
    holder_name: r['股东名称'],
    holder_type: r['股东类型'],
    hold_num: toLong(r['期末持股-数量']),
    hold_ratio: toDouble(r['期末持股-数量变化比例']),
    hold_num_change: toLong(r['期末持股-数量变化']),
    hold_ratio_change: toDouble(r['期末持股-持股变动']),
    change_type: r['期末持股-持股变动'],
    notice_date: r['公告日'],
    rank: toInt(r['股东排名'])
  })).filter(r => r.symbol && r.holder_name)
  // 预删除该股该报告期的数据
  const d = dd(tradeDate)
  await ddb.execute(`t = ${TBL}; delete from t where symbol='${symbol}' and trade_date=${d}`)
  await ddb.insertRows('stock_holding', COLS, rows)
  return rows.length
}

async function getHolding(tradeDate, symbol) {
  if (!ddb.isConnected()) return []
  const d = dd(tradeDate)
  const r = await ddb.execute(`select * from ${TBL} where symbol='${symbol}' and trade_date=${d} order by rank`)
  return Array.isArray(r) ? r : []
}

function toDouble(v) { return v == null ? null : Number(v) }
function toLong(v) { return v == null ? null : Math.abs(Math.round(Number(v))) }
function toInt(v) { return v == null ? null : parseInt(v) || 0 }

module.exports = { insertHolding, getHolding, COLS }
