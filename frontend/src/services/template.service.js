import api from '@/utils/api'

/**
 * 获取模板列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getTemplateList = (params = {}) => {
  return api.get('/templates', { params })
}

/**
 * 获取模板详情
 * @param {number} id 模板ID
 * @returns {Promise}
 */
export const getTemplateDetail = (id) => {
  return api.get(`/templates/${id}`)
}

/**
 * 创建模板
 * @param {Object} templateData 模板数据
 * @returns {Promise}
 */
export const createTemplate = (templateData) => {
  return api.post('/templates', templateData)
}

/**
 * 更新模板
 * @param {number} id 模板ID
 * @param {Object} templateData 模板数据
 * @returns {Promise}
 */
export const updateTemplate = (id, templateData) => {
  return api.put(`/templates/${id}`, templateData)
}

/**
 * 删除模板
 * @param {number} id 模板ID
 * @returns {Promise}
 */
export const deleteTemplate = (id) => {
  return api.delete(`/templates/${id}`)
}

/**
 * 复制模板
 * @param {number} id 模板ID
 * @returns {Promise}
 */
export const copyTemplate = (id) => {
  return api.post(`/templates/${id}/copy`)
}

/**
 * 获取模板分类
 * @returns {Promise}
 */
export const getTemplateCategories = () => {
  return api.get('/templates/categories')
}

/**
 * 获取公共模板
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getPublicTemplates = (params = {}) => {
  return api.get('/templates/public', { params })
}

/**
 * 分享模板
 * @param {number} id 模板ID
 * @returns {Promise}
 */
export const shareTemplate = (id) => {
  return api.post(`/templates/${id}/share`)
}

/**
 * 取消分享模板
 * @param {number} id 模板ID
 * @returns {Promise}
 */
export const unshareTemplate = (id) => {
  return api.post(`/templates/${id}/unshare`)
}

/**
 * 使用模板创建笔记
 * @param {number} id 模板ID
 * @param {Object} noteData 笔记数据
 * @returns {Promise}
 */
export const createNoteFromTemplate = (id, noteData) => {
  return api.post(`/templates/${id}/create-note`, noteData)
}