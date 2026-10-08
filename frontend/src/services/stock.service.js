import api from '@/utils/api'

/**
 * 获取股票列表（只读本地库，支持 market 市场分类过滤）
 * @param {Object} params 查询参数 { search, market, page, pageSize }
 * @returns {Promise}
 */
export const getStockList = (params = {}) => {
  return api.get('/stocks', { params })
}

/**
 * 获取股票元数据（上市日/ST/停牌/股本等，来自本地库）
 * @param {string} code 股票代码
 * @returns {Promise}
 */
export const getStockMeta = (code) => {
  return api.get(`/stocks/${code}/meta`)
}

/**
 * 获取股票财报（最近 N 季，来自本地库）
 * @param {string} code 股票代码
 * @param {number} n 季数
 * @returns {Promise}
 */
export const getStockFinancial = (code, n = 8) => {
  return api.get(`/stocks/${code}/financial`, { params: { n } })
}

/**
 * 获取股票估值指标快照（PE/PB/PS/PCF/股息率，来自本地库）
 * @param {string} code 股票代码
 * @returns {Promise}
 */
export const getStockIndicator = (code) => {
  return api.get(`/stocks/${code}/indicator`)
}

/**
 * 同步单只股票财报入库
 * @param {string} code 股票代码
 * @param {number} n 季数
 * @returns {Promise}
 */
export const syncStockFinancial = (code, n = 8) => {
  return api.post(`/stocks/${code}/financial/sync`, null, { params: { n }, timeout: 60000, skipRetry: true })
}

/**
 * 同步单只股票估值指标入库
 * @param {string} code 股票代码
 * @returns {Promise}
 */
export const syncStockIndicator = (code) => {
  return api.post(`/stocks/${code}/indicator/sync`, null, { timeout: 60000, skipRetry: true })
}

/**
 * 获取股票基础信息状态（总数量 + 各市场数量）
 * @returns {Promise}
 */
export const getStockBasicStatus = () => {
  return api.get('/stocks/basic/status')
}

/**
 * 同步股票基础信息入库（全市场列表写入本地库）
 * @returns {Promise}
 */
export const syncStockBasic = () => {
  return api.post('/stocks/basic/sync')
}

/**
 * 获取股票详情
 * @param {string} code 股票代码
 * @returns {Promise}
 */
export const getStockDetail = (code) => {
  return api.get(`/stocks/${code}`)
}

/**
 * 获取股票K线数据
 * @param {string} code 股票代码
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getStockKLine = (code, params = {}) => {
  return api.get(`/stocks/${code}/kline`, { params })
}

/**
 * 获取股票实时数据
 * @param {string|Array} codes 股票代码
 * @returns {Promise}
 */
export const getStockRealtime = (codes) => {
  const codesParam = Array.isArray(codes) ? codes.join(',') : codes
  return api.get('/stocks/realtime', { params: { codes: codesParam } })
}

/**
 * 搜索股票
 * @param {string} keyword 关键词
 * @returns {Promise}
 */
export const searchStocks = (keyword) => {
  return api.get('/stocks/search', { params: { keyword } })
}

/**
 * 获取股票历史数据
 * @param {string} code 股票代码
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getStockHistory = (code, params = {}) => {
  return api.get(`/stocks/${code}/history`, { params })
}

/**
 * 获取市场概况
 * @returns {Promise}
 */
export const getMarketOverview = () => {
  return api.get('/market/overview')
}

/**
 * 获取热门股票
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getHotStocks = (params = {}) => {
  return api.get('/market/hot', { params })
}

/**
 * 获取指数K线数据
 * @param {string} code 指数代码（如 000001 上证 / 399001 深证 / 399006 创业板）
 * @param {Object} params 查询参数 { period, startDate, endDate }
 * @returns {Promise}
 */
export const getIndexKLine = (code, params = {}) => {
  return api.get('/market/index-kline', { params: { code, ...params } })
}