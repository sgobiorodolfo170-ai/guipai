import api from '@/utils/api'

/**
 * 获取笔记列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getNoteList = (params = {}) => {
  return api.get('/notes', { params })
}

/**
 * 获取笔记详情
 * @param {number} id 笔记ID
 * @returns {Promise}
 */
export const getNoteDetail = (id) => {
  return api.get(`/notes/${id}`)
}

/**
 * 创建笔记
 * @param {Object} noteData 笔记数据
 * @returns {Promise}
 */
export const createNote = (noteData) => {
  return api.post('/notes', noteData)
}

/**
 * 更新笔记
 * @param {number} id 笔记ID
 * @param {Object} noteData 笔记数据
 * @returns {Promise}
 */
export const updateNote = (id, noteData) => {
  return api.put(`/notes/${id}`, noteData)
}

/**
 * 删除笔记
 * @param {number} id 笔记ID
 * @returns {Promise}
 */
export const deleteNote = (id) => {
  return api.delete(`/notes/${id}`)
}

/**
 * 获取笔记分类
 * @returns {Promise}
 */
export const getNoteCategories = () => {
  return api.get('/notes/categories')
}

/**
 * 创建笔记分类
 * @param {Object} categoryData 分类数据
 * @returns {Promise}
 */
export const createNoteCategory = (categoryData) => {
  return api.post('/notes/categories', categoryData)
}

/**
 * 更新笔记分类
 * @param {number} id 分类ID
 * @param {Object} categoryData 分类数据
 * @returns {Promise}
 */
export const updateNoteCategory = (id, categoryData) => {
  return api.put(`/notes/categories/${id}`, categoryData)
}

/**
 * 删除笔记分类
 * @param {number} id 分类ID
 * @returns {Promise}
 */
export const deleteNoteCategory = (id) => {
  return api.delete(`/notes/categories/${id}`)
}

/**
 * 搜索笔记
 * @param {string} keyword 关键词
 * @returns {Promise}
 */
export const searchNotes = (keyword) => {
  return api.get('/notes/search', { params: { keyword } })
}

/**
 * 获取笔记标签
 * @returns {Promise}
 */
export const getNoteTags = () => {
  return api.get('/notes/tags')
}

/**
 * 上传笔记附件
 * @param {FormData} formData 文件数据
 * @returns {Promise}
 */
export const uploadNoteAttachment = (formData) => {
  return api.post('/notes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}