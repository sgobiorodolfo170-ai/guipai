import api from '@/utils/api'

/**
 * 股票笔记服务层 —— 对接 /api/notes（sql.js 本地库，无远程后端）
 *
 * 字段口径（camelCase，与后端 rowToNote 对齐）：
 *   title / stockCode / stockName / direction(buy|sell|add|reduce) /
 *   tradePrice / quantity / fee / tradeDate / holdingStatus(open|closed|partial) /
 *   content(HTML) / klineBlocks([{code,period,startDate,endDate,imageBase64}]) / tags([])
 *   cost 由后端自动算；浮动盈亏由前端取现价补算（见 useNotes.fetchRealtimePnL）。
 */

/** 笔记列表（支持 stockCode/keyword/direction/tags 过滤） */
export const getNoteList = (params = {}) => {
  return api.get('/notes', { params })
}

/** 笔记详情（含 alerts） */
export const getNoteDetail = (id) => {
  return api.get(`/notes/${id}`)
}

/** 创建笔记 */
export const createNote = (noteData) => {
  return api.post('/notes', noteData)
}

/** 更新笔记 */
export const updateNote = (id, noteData) => {
  return api.put(`/notes/${id}`, noteData)
}

/** 删除笔记（级联删提醒） */
export const deleteNote = (id) => {
  return api.delete(`/notes/${id}`)
}

/** 去重股票代码（筛选用下拉） */
export const getNoteStocks = () => {
  return api.get('/notes/stocks')
}

/** 全部标签 */
export const getNoteTags = () => {
  return api.get('/notes/tags')
}

/** 盈亏汇总统计（按股票分组） */
export const getNoteSummary = () => {
  return api.get('/notes/summary')
}

/** 笔记导出（返回 { title, html, md }，前端按 format 生成 Blob 下载） */
export const exportNote = (id) => {
  return api.get(`/notes/${id}/export`)
}

// ---- 提醒 ----

/** 某笔记的提醒列表 */
export const getNoteAlerts = (noteId) => {
  return api.get(`/notes/${noteId}/alerts`)
}

/** 新建提醒 */
export const createNoteAlert = (noteId, alertData) => {
  return api.post(`/notes/${noteId}/alerts`, alertData)
}

/** 更新提醒 */
export const updateNoteAlert = (noteId, alertId, alertData) => {
  return api.put(`/notes/${noteId}/alerts/${alertId}`, alertData)
}

/** 删除提醒 */
export const deleteNoteAlert = (noteId, alertId) => {
  return api.delete(`/notes/${noteId}/alerts/${alertId}`)
}

/** 提醒轮询：返回 { due: 到期日期/重复提醒, price: 启用中的价格提醒 } */
export const checkAlerts = () => {
  return api.post('/notes/alerts/check', {})
}
