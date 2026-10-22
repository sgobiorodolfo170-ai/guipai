import api from '@/utils/api'

/**
 * 驾驶舱 API 服务层
 * 与后端 /api/cockpit 路由对应，字段 camelCase 直接消费。
 */

// ---- 交易流水 ----
export const getTrades = (params = {}) => api.get('/cockpit/trades', { params })
export const createTrade = (data) => api.post('/cockpit/trades', data)
export const updateTrade = (id, data) => api.put(`/cockpit/trades/${id}`, data)
export const deleteTrade = (id) => api.delete(`/cockpit/trades/${id}`)
export const loadDemoTrades = () => api.post('/cockpit/trades/demo')
export const clearDemoTrades = () => api.delete('/cockpit/trades/demo')

// ---- 持仓 ----
export const getPositions = () => api.get('/cockpit/positions')
export const getSummary = () => api.get('/cockpit/summary')

// ---- 资金 ----
export const getCapital = () => api.get('/cockpit/capital')
export const putCapital = (initialCapital) => api.put('/cockpit/capital', { initialCapital })

// ---- 风控 ----
export const getRiskOverview = (prices) => api.post('/cockpit/risk/overview', { prices })
export const getRiskSnapshots = (days = 30) => api.get('/cockpit/risk/snapshots', { params: { days } })
export const getRiskThresholds = () => api.get('/cockpit/risk/thresholds')
export const putRiskThresholds = (data) => api.put('/cockpit/risk/thresholds', data)
export const resetRiskThresholds = () => api.post('/cockpit/risk/thresholds/reset')
