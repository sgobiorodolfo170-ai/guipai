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
 * 获取股票技术指标
 * @param {string} code 股票代码
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getStockIndicators = (code, params = {}) => {
  return api.get(`/stocks/${code}/indicators`, { params })
}

/**
 * 获取股票财务数据
 * @param {string} code 股票代码
 * @returns {Promise}
 */
export const getStockFinancial = (code) => {
  return api.get(`/stocks/${code}/financial`)
}

/**
 * 获取股票新闻
 * @param {string} code 股票代码
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getStockNews = (code, params = {}) => {
  return api.get(`/stocks/${code}/news`, { params })
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