/**
 * 计算涨跌幅
 * @param {number} current 当前价格
 * @param {number} prev 前一日收盘价
 * @returns {number}
 */
export const calculateChangePercent = (current, prev) => {
  if (!prev || prev === 0) return 0
  return ((current - prev) / prev * 100)
}

/**
 * 计算涨跌额
 * @param {number} current 当前价格
 * @param {number} prev 前一日收盘价
 * @returns {number}
 */
export const calculateChange = (current, prev) => {
  if (!prev) return 0
  return current - prev
}

/**
 * 格式化股票价格
 * @param {number} price 价格
 * @param {number} precision 精度
 * @returns {string}
 */
export const formatPrice = (price, precision = 2) => {
  if (price === null || price === undefined) return '--'
  return Number(price).toFixed(precision)
}

/**
 * 格式化涨跌幅
 * @param {number} percent 涨跌幅
 * @returns {string}
 */
export const formatPercent = (percent) => {
  if (percent === null || percent === undefined) return '--'
  const sign = percent > 0 ? '+' : ''
  return `${sign}${percent.toFixed(2)}%`
}

/**
 * 格式化涨跌额
 * @param {number} change 涨跌额
 * @returns {string}
 */
export const formatChange = (change) => {
  if (change === null || change === undefined) return '--'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}`
}

/**
 * 获取涨跌状态
 * @param {number} value 涨跌值
 * @returns {string} 'up' | 'down' | 'flat'
 */
export const getChangeStatus = (value) => {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'flat'
}

/**
 * 格式化成交量
 * @param {number} volume 成交量
 * @returns {string}
 */
export const formatVolume = (volume) => {
  if (!volume) return '--'
  
  if (volume >= 100000000) {
    return `${(volume / 100000000).toFixed(2)}亿`
  } else if (volume >= 10000) {
    return `${(volume / 10000).toFixed(2)}万`
  }
  return volume.toString()
}

/**
 * 格式化市值
 * @param {number} marketCap 市值
 * @returns {string}
 */
export const formatMarketCap = (marketCap) => {
  if (!marketCap) return '--'
  
  if (marketCap >= 100000000) {
    return `${(marketCap / 100000000).toFixed(2)}亿`
  } else if (marketCap >= 10000) {
    return `${(marketCap / 10000).toFixed(2)}万`
  }
  return marketCap.toString()
}

/**
 * 验证股票代码格式
 * @param {string} code 股票代码
 * @returns {boolean}
 */
export const validateStockCode = (code) => {
  if (!code) return false
  
  // A股代码格式：6位数字
  const aStockPattern = /^[0-9]{6}$/
  
  return aStockPattern.test(code)
}

/**
 * 获取股票市场
 * @param {string} code 股票代码
 * @returns {string}
 */
export const getStockMarket = (code) => {
  if (!code) return ''
  
  const firstDigit = code.charAt(0)
  
  switch (firstDigit) {
    case '0':
    case '3':
      return '深圳'
    case '6':
      return '上海'
    case '8':
      return '北京'
    default:
      return '未知'
  }
}

/**
 * 计算技术指标 - RSI
 * @param {Array} prices 价格数组
 * @param {number} period 周期
 * @returns {Array}
 */
export const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return []
  
  const rsi = []
  let gains = 0
  let losses = 0
  
  // 计算初始平均收益和损失
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) {
      gains += change
    } else {
      losses += Math.abs(change)
    }
  }
  
  let avgGain = gains / period
  let avgLoss = losses / period
  
  // 计算RSI
  for (let i = period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0
    
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    
    const rs = avgGain / avgLoss
    const rsiValue = 100 - (100 / (1 + rs))
    
    rsi.push(rsiValue)
  }
  
  return rsi
}

/**
 * 计算移动平均线
 * @param {Array} prices 价格数组
 * @param {number} period 周期
 * @returns {Array}
 */
export const calculateMA = (prices, period) => {
  if (prices.length < period) return []
  
  const ma = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    ma.push(sum / period)
  }
  
  return ma
}