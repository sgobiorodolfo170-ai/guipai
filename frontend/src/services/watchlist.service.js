import api from '@/utils/api'

/**
 * 获取自选股列表
 * @returns {Promise}
 */
export const getWatchlist = () => {
  return api.get('/watchlist')
}

/**
 * 添加自选股
 * @param {string} code 股票代码
 * @param {number} [groupId] 归入的分组 ID（缺省入默认分组 0）
 * @param {string} [name] 股票名称（用于自选列表名称列，缺省后端置空）
 * @returns {Promise}
 */
export const addToWatchlist = (code, groupId, name) => {
  return api.post('/watchlist', { code, groupId, name })
}

/**
 * 移除自选股
 * @param {string} code 股票代码
 * @returns {Promise}
 */
export const removeFromWatchlist = (code) => {
  return api.delete(`/watchlist/${code}`)
}

/**
 * 检查是否在自选股中
 * @param {string} code 股票代码
 * @returns {Promise}
 */
export const isInWatchlist = (code) => {
  return api.get(`/watchlist/check/${code}`)
}

/**
 * 批量添加自选股
 * @param {Array} codes 股票代码数组
 * @returns {Promise}
 */
export const batchAddToWatchlist = (codes) => {
  return api.post('/watchlist/batch', { codes })
}

/**
 * 批量移除自选股
 * @param {Array} codes 股票代码数组
 * @returns {Promise}
 */
export const batchRemoveFromWatchlist = (codes) => {
  return api.delete('/watchlist/batch', { data: { codes } })
}

/**
 * 获取自选股分组
 * @returns {Promise}
 */
export const getWatchlistGroups = () => {
  return api.get('/watchlist/groups')
}

/**
 * 创建自选股分组
 * @param {Object} groupData 分组数据
 * @returns {Promise}
 */
export const createWatchlistGroup = (groupData) => {
  return api.post('/watchlist/groups', groupData)
}

/**
 * 更新自选股分组
 * @param {number} id 分组ID
 * @param {Object} groupData 分组数据
 * @returns {Promise}
 */
export const updateWatchlistGroup = (id, groupData) => {
  return api.put(`/watchlist/groups/${id}`, groupData)
}

/**
 * 删除自选股分组
 * @param {number} id 分组ID
 * @returns {Promise}
 */
export const deleteWatchlistGroup = (id) => {
  return api.delete(`/watchlist/groups/${id}`)
}

/**
 * 移动股票到分组
 * @param {string} code 股票代码
 * @param {number} groupId 分组ID
 * @returns {Promise}
 */
export const moveToGroup = (code, groupId) => {
  return api.put(`/watchlist/${code}/group`, { groupId })
}

/**
 * 设置自选股备注
 * @param {string} code 股票代码
 * @param {string} note 备注
 * @returns {Promise}
 */
export const setWatchlistNote = (code, note) => {
  return api.put(`/watchlist/${code}/note`, { note })
}

/**
 * 设置价格提醒
 * @param {string} code 股票代码
 * @param {Object} alertData 提醒数据
 * @returns {Promise}
 */
export const setPriceAlert = (code, alertData) => {
  return api.post(`/watchlist/${code}/alert`, alertData)
}

/**
 * 获取价格提醒
 * @param {string} code 股票代码
 * @returns {Promise}
 */
export const getPriceAlerts = (code) => {
  return api.get(`/watchlist/${code}/alerts`)
}

/**
 * 删除价格提醒
 * @param {number} alertId 提醒ID
 * @returns {Promise}
 */
export const deletePriceAlert = (alertId) => {
  return api.delete(`/watchlist/alerts/${alertId}`)
}