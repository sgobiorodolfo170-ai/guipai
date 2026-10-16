/**
 * @deprecated 此文件已废弃，所有函数已迁移到 review.service.js。
 *
 * C6 之后前端不再调用 /api/aktools/* 路由。以下函数保留仅为兼容性，
 * 实际转发到 review.service.js 的对应函数。请更新 import 来源：
 *   import { getStockSpot, ... } from '@/services/review.service'
 */
import {
  getStockSpot,
  getStockIndustry,
  getStockIndexSpot,
  getStockLimit,
  getStockDrop,
  getStockLimitYesterday
} from './review.service'

export {
  getStockSpot,
  getStockIndustry,
  getStockIndexSpot,
  getStockLimit,
  getStockDrop,
  getStockLimitYesterday
}

// 以下函数在前端无直接引用（grep 确认）。getStockHistory/getStockInfo 已重定向到业务路由。
// C6 收尾：getStockMinute/getStockHolding 也已重定向到新建的业务路由 /:code/minute, /:code/holding。
import api from '@/utils/api'

export const getStockHistory = (params) => {
  console.warn('[deprecated] getStockHistory — 请使用 stock.service.getStockKLine')
  return api.get(`/stocks/${params.symbol}/kline`, { params })
}

export const getStockMinute = (params) => {
  console.warn('[deprecated] getStockMinute — 请使用 GET /api/stocks/:code/minute')
  return api.get(`/stocks/${params.symbol}/minute`, { params })
}

export const getStockInfo = (symbol) => {
  console.warn('[deprecated] getStockInfo — 请使用 stock.service.getStockMeta')
  return api.get(`/stocks/${symbol}/meta`)
}

export const getStockHolding = (params) => {
  console.warn('[deprecated] getStockHolding — 请使用 GET /api/stocks/:code/holding')
  return api.get(`/stocks/${params.symbol}/holding`, { params })
}
