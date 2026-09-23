import api from '@/utils/api'

/**
 * 获取全市场A股实时行情
 * @returns {Promise}
 */
export const getStockSpot = () => {
    return api.get('/aktools/stock/spot')
}

/**
 * 获取股票历史数据
 * @param {Object} params 查询参数
 * @param {string} params.symbol 股票代码
 * @param {string} params.period 周期 daily/weekly/monthly
 * @param {string} params.startDate 开始日期 20230812
 * @param {string} params.endDate 结束日期 20230819
 * @param {string} params.adjust 复权类型 qfq
 * @returns {Promise}
 */
export const getStockHistory = (params) => {
    return api.get('/aktools/stock/history', {params})
}

/**
 * 获取股票分钟级K线数据
 * @param {Object} params 查询参数
 * @param {string} params.symbol 股票代码
 * @param {number} params.period 分钟周期 1,5,15,30,60
 * @param {string} params.startDate 开始日期
 * @param {string} params.endDate 结束日期
 * @param {string} params.adjust 复权类型
 * @returns {Promise}
 */
export const getStockMinute = (params) => {
    return api.get('/aktools/stock/minute', {params})
}

/**
 * 获取个股基础信息
 * @param {string} symbol 股票代码
 * @returns {Promise}
 */
export const getStockInfo = (symbol) => {
    return api.get('/aktools/stock/info', {params: {symbol}})
}

/**
 * 获取十大股东持股明细
 * @param {Object} params 查询参数
 * @param {string} params.date 财报截止日 20230930
 * @param {string} params.indicator 股东类型
 * @param {string} params.symbol 持股变动
 * @returns {Promise}
 */
export const getStockHolding = (params) => {
    return api.get('/aktools/stock/holding', {params})
}

/**
 * 获取当日涨停池
 * @param {string} date 涨停日期 20230930
 * @returns {Promise}
 */
export const getStockLimit = (date) => {
    return api.get('/aktools/stock/limit', {params: {date}})
}

/**
 * 获取当日跌停池
 * @param {string} date 跌停日期 20230930
 * @returns {Promise}
 */
export const getStockDrop = (date) => {
    return api.get('/aktools/stock/drop', {params: {date}})
}

/**
 * 获取板块行业一览表
 * @returns {Promise}
 */
export const getStockIndustry = () => {
    return api.get('/aktools/stock/industry')
}

/**
 * 获取昨天涨停板数据
 * @param {string} date 涨停日期 20230930
 * @returns {Promise}
 */
export const getStockLimitYesterday = (date) => {
    return api.get('/aktools/stock/ztPoolPrevious', {params: {date}})
}

/**
 * 获取指数数据
 * @param symbol symbol="上证系列指数"；choice of {"沪深重要指数", "上证系列指数", "深证系列指数", "指数成份", "中证系列指数"}
 * @return 指数数据
 */
export const getStockIndexSpot = (symbol) => {
    return api.get('/aktools/stock/indexSpot', {params: {symbol}})
}