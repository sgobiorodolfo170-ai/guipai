'use strict'

function toNum(v) { return v == null ? null : Number(v) }
function toStr(v) { return v == null ? null : String(v) }
function toInt(v) { return v == null ? 0 : parseInt(v) || 0 }

function fmtTime(t) {
  if (!t || String(t).length !== 6) return null
  const s = String(t)
  return `${s[0]}${s[1]}:${s[2]}${s[3]}:${s[4]}${s[5]}`
}

function convertStockLimitPool(rawList, tradeDate, dataType) {
  if (!rawList || !rawList.length) return []
  return rawList.map(m => {
    const row = {
      data_type: dataType,
      trade_date: tradeDate,
      stock_code: toStr(m['代码']),
      stock_name: toStr(m['名称']),
      industry: toStr(m['所属行业']),
      increase_rate: toNum(m['涨跌幅']),
      latest_price: toNum(m['最新价']),
      turnover: toNum(m['成交额']),
      circulation_market_value: toNum(m['流通市值']),
      total_market_value: toNum(m['总市值']),
      turnover_rate: toNum(m['换手率']),
      last_limit_time: fmtTime(m['最后封板时间']),
      limit_funds: toNum(dataType === 'LIMIT_UP' ? m['封板资金'] : m['封单资金']),
      continuous_limit: toInt(dataType === 'LIMIT_UP' ? m['连板数'] : m['连续跌停']),
      blast_times: toInt(dataType === 'LIMIT_UP' ? m['炸板次数'] : m['开板次数'])
    }
    if (dataType === 'LIMIT_UP') {
      row.first_limit_time = fmtTime(m['首次封板时间'])
      row.limit_stats = toStr(m['涨停统计'])
    } else {
      row.dynamic_pe = toNum(m['动态市盈率'])
      row.limit_turnover = toNum(m['板上成交额'])
    }
    return row
  }).filter(r => r.stock_code && r.stock_name)
}

function convertIndexDaily(rawList, symbol) {
  if (!rawList || !rawList.length) return []
  return rawList.map(m => ({
    symbol, trade_date: toStr(m['日期']),
    open: toNum(m['开盘']), close: toNum(m['收盘']),
    high: toNum(m['最高']), low: toNum(m['最低']),
    volume: toNum(m['成交量']), amount: toNum(m['成交额']),
    change: toNum(m['涨跌幅']), turnover_rate: toNum(m['换手率']),
    amplitude: toNum(m['振幅']), price_change: toNum(m['涨跌额'])
  })).filter(r => r.trade_date)
}

function convertPlateMarket(rawList, tradeDate) {
  if (!rawList || !rawList.length) return []
  return rawList.map(m => ({
    trade_date: tradeDate, plate: toStr(m['板块']),
    increase_rate: toNum(m['涨跌幅']), total_volume: toNum(m['总成交量']),
    total_turnover: toNum(m['总成交额']), net_inflow: toNum(m['净流入']),
    up_count: toInt(m['上涨家数']), down_count: toInt(m['下跌家数']),
    average_price: toNum(m['均价']), leading_stock: toStr(m['领涨股']),
    leading_stock_price: toNum(m['领涨股-最新价']),
    leading_stock_increase: toNum(m['领涨股-涨跌幅'])
  })).filter(r => r.plate)
}

module.exports = { convertStockLimitPool, convertIndexDaily, convertPlateMarket }
