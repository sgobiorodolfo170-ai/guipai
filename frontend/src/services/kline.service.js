import api from '@/utils/api'

/**
 * 获取随机股票K线数据
 * @param {number} days 所需K线天数
 * @returns {Promise}
 */
export const getRandomKlineData = (days) => {
  return api.get('/kline/random', { params: { days } })
}

/**
 * 提交模拟训练结果
 * @param {Object} trainingData 训练数据
 * @returns {Promise}
 */
export const submitTrainingResult = (trainingData) => {
  return api.post('/sim-training/submit', trainingData)
}

/**
 * 查询用户历史训练记录
 * @param {number} userId 用户ID
 * @returns {Promise}
 */
export const getTrainingHistory = (userId) => {
  return api.get('/sim-training/history', { params: { userId } })
}

/**
 * 查询单条训练详情
 * @param {number} trainingId 训练记录ID
 * @returns {Promise}
 */
export const getTrainingDetail = (trainingId) => {
  return api.get(`/sim-training/detail/${trainingId}`)
}

/**
 * 获取本地用户信息（桌面版无登录模式）
 * @returns {Promise}
 */
export const getLocalUser = () => {
  return api.get('/sim-training/local-user')
}