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

/** 全市场实时行情快照转换（东财中文键 → stock_spot 英文键） */
function convertSpot(rawList, tradeDate) {
  if (!rawList || !rawList.length) return []
  return rawList.map(m => ({
    symbol: toStr(m['代码']),
    trade_date: tradeDate,
    open: toNum(m['今开']),
    close: toNum(m['最新价']),
    high: toNum(m['最高']),
    low: toNum(m['最低']),
    preclose: toNum(m['昨收']),
    volume: toNum(m['成交量']),
    amount: toNum(m['成交额']),
    pct_chg: toNum(m['涨跌幅']),
    change_amount: toNum(m['涨跌额']),
    turnover_rate: toNum(m['换手率']),
    amplitude: toNum(m['振幅']),
    total_market_value: toNum(m['总市值']),
    circulation_market_value: toNum(m['流通市值']),
    pe_ttm: toNum(m['市盈率-动态']),
    pb: toNum(m['市净率'])
  })).filter(r => r.symbol)
}

/** 指数实时行情转换 */
function convertIndexSpot(rawList, tradeDate) {
  if (!rawList || !rawList.length) return []
  return rawList.map(m => ({
    symbol: toStr(m['代码']),
    trade_date: tradeDate,
    latest_price: toNum(m['最新价']),
    pct_chg: toNum(m['涨跌幅']),
    change_amount: toNum(m['涨跌额']),
    volume: toNum(m['成交量']),
    amount: toNum(m['成交额']),
    high: toNum(m['最高']),
    low: toNum(m['最低']),
    open: toNum(m['今开']),
    close: toNum(m['最新价']),
    preclose: toNum(m['昨收'])
  })).filter(r => r.symbol)
}

/** 分钟K线转换 */
function convertMinuteK(rawList, symbol, period) {
  if (!rawList || !rawList.length) return []
  return rawList.map(m => ({
    symbol,
    trade_date: toStr(m['时间']).slice(0, 10),
    timestamp: toStr(m['时间']),
    period: Number(period) || 5,
    open: toNum(m['开盘']),
    close: toNum(m['收盘']),
    high: toNum(m['最高']),
    low: toNum(m['最低']),
    volume: toNum(m['成交量']),
    amount: toNum(m['成交额']),
    avg_price: toNum(m['均价']),
    amplitude: toNum(m['振幅']),
    pct_chg: toNum(m['涨跌幅']),
    change_amount: toNum(m['涨跌额']),
    turnover_rate: toNum(m['换手率'])
  }))
}

/** 昨日涨停转换 */
function convertZtPrevious(rawList, tradeDate) {
  if (!rawList || !rawList.length) return []
  return rawList.map(m => ({
    symbol: toStr(m['代码']),
    trade_date: tradeDate,
    name: toStr(m['名称']),
    latest_price: toNum(m['最新价']),
    limit_price: toNum(m['涨停价']),
    pct_chg: toNum(m['涨跌幅']),
    amount: toNum(m['成交额']),
    circulation_mv: toNum(m['流通市值']),
    total_mv: toNum(m['总市值']),
    turnover_rate: toNum(m['换手率']),
    amplitude: toNum(m['振幅']),
    speed: toNum(m['涨速']),
    last_limit_time: fmtTime(m['昨日封板时间']),
    consecutive_limit: toInt(m['昨日连板数']),
    industry: toStr(m['所属行业']),
    limit_stats: toStr(m['涨停统计'])
  })).filter(r => r.symbol)
}

/** 股东持股转换 */
function convertHolding(rawList, tradeDate) {
  if (!rawList || !rawList.length) return []
  return rawList.map(m => ({
    trade_date: tradeDate,
    symbol: toStr(m['股票代码']),
    holder_name: toStr(m['股东名称']),
    holder_type: toStr(m['股东类型']),
    hold_num: toNum(m['期末持股-数量']),
    hold_ratio: toNum(m['期末持股-数量变化比例']),
    hold_num_change: toNum(m['期末持股-数量变化']),
    hold_ratio_change: toStr(m['期末持股-持股变动']),
    change_type: toStr(m['期末持股-持股变动']),
    notice_date: toStr(m['公告日']),
    rank: toInt(m['股东排名'])
  })).filter(r => r.symbol && r.holder_name)
}

module.exports = {
  convertStockLimitPool, convertIndexDaily, convertPlateMarket,
  convertSpot, convertIndexSpot, convertMinuteK, convertZtPrevious, convertHolding
}
