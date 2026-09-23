import api from '@/utils/api'

/**
 * 获取基础统计数据
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getBasicStatistics = (date) => {
  return api.get(`/limit-board-statistics/basic/${date}`)
}

/**
 * 获取范围基础统计数据
 * @param {string} startDate 开始日期 (yyyy-MM-dd)
 * @param {string} endDate 结束日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getBasicStatisticsRange = (startDate, endDate) => {
  return api.get('/limit-board-statistics/basic/range', {
    params: { startDate, endDate }
  })
}

/**
 * 获取涨跌停板详细统计
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @param {string} dataType 数据类型 (LIMIT_UP/LIMIT_DOWN)
 * @returns {Promise}
 */
export const getDetailStatistics = (date, dataType) => {
  return api.get(`/limit-board-statistics/detail/${date}`, {
    params: { dataType }
  })
}

/**
 * 获取范围详细统计数据
 * @param {string} startDate 开始日期 (yyyy-MM-dd)
 * @param {string} endDate 结束日期 (yyyy-MM-dd)
 * @param {string} dataType 数据类型 (LIMIT_UP/LIMIT_DOWN)
 * @returns {Promise}
 */
export const getDetailStatisticsRange = (startDate, endDate, dataType) => {
  return api.get('/limit-board-statistics/detail/range', {
    params: { startDate, endDate, dataType }
  })
}

/**
 * 获取涨跌停对比分析
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getComparisonAnalysis = (date) => {
  return api.get(`/limit-board-statistics/comparison/${date}`)
}

/**
 * 获取范围对比分析
 * @param {string} startDate 开始日期 (yyyy-MM-dd)
 * @param {string} endDate 结束日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getComparisonAnalysisRange = (startDate, endDate) => {
  return api.get('/limit-board-statistics/comparison/range', {
    params: { startDate, endDate }
  })
}

/**
 * 获取质量分析
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @param {string} dataType 数据类型 (LIMIT_UP/LIMIT_DOWN)
 * @returns {Promise}
 */
export const getQualityAnalysis = (date, dataType) => {
  return api.get(`/limit-board-statistics/quality/${date}`, {
    params: { dataType }
  })
}

/**
 * 获取行业分布统计
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @param {string} dataType 数据类型 (LIMIT_UP/LIMIT_DOWN/ALL)
 * @returns {Promise}
 */
export const getIndustryDistribution = (date, dataType = 'LIMIT_UP') => {
  return api.get(`/limit-board-statistics/industry/${date}`, {
    params: { dataType }
  })
}

/**
 * 获取行业趋势分析
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getIndustryTrend = (date) => {
  return api.get(`/limit-board-statistics/industry/trend/${date}`)
}

/**
 * 获取跌停板反弹分析
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getReboundAnalysis = (date) => {
  return api.get(`/limit-board-statistics/rebound/${date}`)
}

/**
 * 按连跌停数反弹分析
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getReboundByConsecutive = (date) => {
  return api.get(`/limit-board-statistics/rebound/consecutive/${date}`)
}

/**
 * 按行业反弹分析
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getReboundByIndustry = (date) => {
  return api.get(`/limit-board-statistics/rebound/industry/${date}`)
}

/**
 * 按市盈率反弹分析
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getReboundByPe = (date) => {
  return api.get(`/limit-board-statistics/rebound/pe/${date}`)
}

/**
 * 获取连板成功率分析
 * @param {string} startDate 开始日期 (yyyy-MM-dd)
 * @param {string} endDate 结束日期 (yyyy-MM-dd)
 * @param {string} dataType 数据类型 (LIMIT_UP/LIMIT_DOWN)
 * @returns {Promise}
 */
export const getContinuousSuccessRate = (startDate, endDate, dataType) => {
  return api.get('/limit-board-statistics/continuous-success-rate', {
    params: { startDate, endDate, dataType }
  })
}

/**
 * 获取市场情绪指标
 * @param {string} date 查询日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getSentimentIndicator = (date) => {
  return api.get(`/limit-board-statistics/sentiment/${date}`)
}

/**
 * 获取市场情绪趋势
 * @param {string} startDate 开始日期 (yyyy-MM-dd)
 * @param {string} endDate 结束日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const getSentimentTrend = (startDate, endDate) => {
  return api.get('/limit-board-statistics/sentiment/trend', {
    params: { startDate, endDate }
  })
}

/**
 * 获取历史对比分析
 * @param {string} targetDate 目标日期 (yyyy-MM-dd)
 * @param {number} days 历史对比天数，默认30天
 * @returns {Promise}
 */
export const getHistoricalCompare = (targetDate, days = 30) => {
  return api.get(`/limit-board-statistics/historical-compare/${targetDate}`, {
    params: { days }
  })
}

/**
 * 获取分位数分析
 * @param {string} targetDate 目标日期 (yyyy-MM-dd)
 * @param {number} days 历史天数，默认60天
 * @returns {Promise}
 */
export const getPercentileAnalysis = (targetDate, days = 60) => {
  return api.get(`/limit-board-statistics/percentile/${targetDate}`, {
    params: { days }
  })
}

/**
 * 刷新统计缓存
 * @param {string} date 日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const refreshCache = (date) => {
  return api.post(`/limit-board-statistics/cache/refresh/${date}`)
}

/**
 * 清除统计缓存
 * @param {string} date 日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const clearCache = (date) => {
  return api.delete(`/limit-board-statistics/cache/clear/${date}`)
}

/**
 * 预热统计缓存
 * @param {string} startDate 开始日期 (yyyy-MM-dd)
 * @param {string} endDate 结束日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const warmupCache = (startDate, endDate) => {
  return api.post('/limit-board-statistics/cache/warmup', null, {
    params: { startDate, endDate }
  })
}

/**
 * 检查数据可用性
 * @param {string} date 日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const checkDataAvailability = (date) => {
  return api.get(`/limit-board-statistics/data/availability/${date}`)
}

/**
 * 获取最新数据日期
 * @returns {Promise}
 */
export const getLatestDataDate = () => {
  return api.get('/limit-board-statistics/data/latest')
}

/**
 * 检测市场异常
 * @param {string} date 日期 (yyyy-MM-dd)
 * @returns {Promise}
 */
export const detectAnomalies = (date) => {
  return api.get(`/limit-board-statistics/anomaly/detect/${date}`)
}