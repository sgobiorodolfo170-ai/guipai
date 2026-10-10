'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')

const router = express.Router()

function ok(res, data, msg = '成功') { res.json({ code: 200, msg, data }) }
function errMsg(res, msg) { res.json({ code: 500, msg }) }

// 市场概况
// 双层缓存：正常缓存 60s（命中直接返回）；"上次成功"兜底缓存 7200s（当前拉取失败时返回旧数据，
// 避免休市/源不可用导致页面空白）。空结果不落正常缓存，但可落兜底缓存。
router.get('/overview', async (req, res) => {
  const cacheKey = 'market:overview'
  const fallbackKey = 'market:overview:fallback'
  try {
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const indices = await aktools.getStockIndexSpot('沪深重要指数')
    const overview = (indices || []).map(m => ({
      code: m['代码'] || m['指数代码'], name: m['名称'] || m['指数名称'],
      price: Number(m['最新价']) || 0, change: Number(m['涨跌额']) || 0,
      changePercent: Number(m['涨跌幅']) || 0
    }))
    if (overview.length) {
      cache.set(cacheKey, overview, 60)
      cache.set(fallbackKey, overview, 7200)
      ok(res, overview)
    } else {
      // 空结果：优先兜底缓存，无则返回空
      const fallback = cache.get(fallbackKey)
      ok(res, fallback || [], fallback ? '成功(兜底缓存)' : '成功')
    }
  } catch (e) {
    // 拉取失败：返回兜底缓存，避免页面空白
    const fallback = cache.get(fallbackKey)
    if (fallback) {
      return ok(res, fallback, '成功(兜底缓存)')
    }
    errMsg(res, e.message)
  }
})

// 热门股票 (按成交额排序)
router.get('/hot', async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const cacheKey = 'market:hot'
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached.slice(0, Number(limit)))

    const raw = await aktools.getStockSpot()
    const list = (raw || []).map(m => ({
      code: m['代码'], name: m['名称'],
      price: Number(m['最新价']) || 0,
      changePercent: Number(m['涨跌幅']) || 0,
      turnover: Number(m['成交额']) || 0
    })).filter(s => s.code).sort((a, b) => b.turnover - a.turnover)

    cache.set(cacheKey, list, 60)
    ok(res, list.slice(0, Number(limit)))
  } catch (e) { errMsg(res, e.message) }
})

// 指数K线数据
// 调用 aktools.getIndexDailyData（东财 push2his → 腾讯 fqkline 兜底），返回与个股K线相同结构。
// 支持 period=daily|weekly|monthly，adjust 参数对指数无意义（指数不除权），保留兼容。
router.get('/index-kline', async (req, res) => {
  try {
    const { code, period = 'daily', startDate, endDate } = req.query
    if (!code) return errMsg(res, '缺少 code 参数')

    const cacheKey = `market:index-kline:${code}:${period}:${startDate || ''}:${endDate || ''}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const effEnd = (endDate || '').replace(/-/g, '') || today
    const raw = await aktools.getIndexDailyData({
      symbol: code,
      period,
      start_date: (startDate || '').replace(/-/g, ''),
      end_date: effEnd
    })

    // 中文键 → snake_case，与 routes/stock.js KLINE_ROW_MAP 保持一致
    const kline = (raw || []).map(m => ({
      date: m['日期'], open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
      high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
      volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
      turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
    }))

    if (kline.length) cache.set(cacheKey, kline, 300)
    ok(res, kline)
  } catch (e) {
    if (e.retryAfterSec) {
      return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    }
    errMsg(res, e.message)
  }
})

module.exports = router
