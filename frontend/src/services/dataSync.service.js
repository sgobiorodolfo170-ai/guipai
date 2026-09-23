import api from '@/utils/api'

/**
 * 数据同步状态管理服务
 */

/**
 * 查询所有数据同步状态
 * @returns {Promise}
 */
export const getAllSyncStatus = () => {
    return api.get('/sync-status/list')
}

/**
 * 根据交易日期查询同步状态
 * @param {string} tradeDate 交易日期 YYYY-MM-DD
 * @returns {Promise}
 */
export const getSyncStatusByDate = (tradeDate) => {
    return api.get('/sync-status/by-date', {
        params: { tradeDate }
    })
}

/**
 * 查询最近N天的数据同步状态
 * @param {number} days 查询天数 1-30
 * @returns {Promise}
 */
export const getRecentSyncStatus = (days = 7) => {
    return api.get('/sync-status/recent', {
        params: { days }
    })
}

/**
 * 根据数据类型查询同步状态
 * @param {string} dataType 数据类型
 * @param {number} days 查询天数
 * @returns {Promise}
 */
export const getSyncStatusByType = (dataType, days = 7) => {
    return api.get('/sync-status/by-type', {
        params: { dataType, days }
    })
}

/**
 * 获取同步状态统计信息
 * @param {number} days 统计天数
 * @returns {Promise}
 */
export const getSyncStatistics = (days = 7) => {
    return api.get('/sync-status/statistics', {
        params: { days }
    })
}

/**
 * 获取支持的数据类型列表
 * @returns {Promise}
 */
export const getDataTypes = () => {
    return api.get('/sync-status/data-types')
}

/**
 * 手动删除指定日期的特定类型数据
 * @param {string} tradeDate 交易日期 YYYY-MM-DD
 * @param {string} dataType 数据类型
 * @returns {Promise}
 */
export const deleteDataManual = (tradeDate, dataType) => {
    return api.delete('/sync-status/manual/delete', {
        params: { tradeDate, dataType }
    })
}

/**
 * 手动重新同步指定日期的特定类型数据
 * @param {string} tradeDate 交易日期 YYYY-MM-DD
 * @param {string} dataType 数据类型
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {Promise}
 */
export const syncDataManual = (tradeDate, dataType, forceUpdate = false) => {
    return api.post('/sync-status/manual/sync', null, {
        params: { tradeDate, dataType, forceUpdate }
    })
}

/**
 * 手动执行指定日期的完整收盘任务
 * @param {string} tradeDate 交易日期 YYYY-MM-DD
 * @param {boolean} forceUpdate 是否强制更新
 * @returns {Promise}
 */
export const fullSyncManual = (tradeDate, forceUpdate = false) => {
    return api.post('/sync-status/manual/full-sync', null, {
        params: { tradeDate, forceUpdate }
    })
}