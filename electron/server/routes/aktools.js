'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')

const router = express.Router()

function withCache(key, ttl, fetcher) {
  return async (req, res) => {
    const cached = cache.get(key)
    if (cached) return res.json({ code: 200, msg: '成功(缓存)', data: cached })
    try {
      const data = await fetcher(req)
      cache.set(key, data, ttl)
      res.json({ code: 200, msg: '成功', data })
    } catch (e) {
      res.json({ code: 500, msg: e.message })
    }
  }
}

router.get('/stock/spot', withCache('aktools:stock:spot', 60, () => aktools.getStockSpot()))
router.get('/stock/history', (req, res) => {
  const p = req.query
  // 兼容前端驼峰参数（startDate/endDate）与后端蛇形参数（start_date/end_date）
  const params = {
    ...p,
    start_date: p.start_date || p.startDate,
    end_date: p.end_date || p.endDate,
  }
  const cacheKey = `aktools:stock:history:${p.symbol}:${p.period}:${p.adjust}:${params.start_date || ''}:${params.end_date || ''}`
  withCache(cacheKey, 300, () => aktools.getStockHistory(params))(req, res)
})
router.get('/stock/minute', (req, res) => {
  const p = req.query
  // 兼容前端驼峰参数（startDate/endDate）与后端蛇形参数（start_date/end_date）
  const params = {
    ...p,
    start_date: p.start_date || p.startDate,
    end_date: p.end_date || p.endDate,
  }
  const cacheKey = `aktools:stock:minute:${p.symbol}:${p.period}:${params.start_date || ''}:${params.end_date || ''}`
  withCache(cacheKey, 60, () => aktools.getStockMinute(params))(req, res)
})
router.get('/stock/info', (req, res) => {
  const { symbol } = req.query
  withCache(`aktools:stock:info:${symbol}`, 10000, () => aktools.getStockInfo(symbol))(req, res)
})
router.get('/stock/holding', (req, res) => {
  const p = req.query
  withCache(`aktools:stock:holding:${p.date}:${p.indicator}:${p.symbol}`, 10000, () => aktools.getStockHolding(p))(req, res)
})
router.get('/stock/limit', (req, res) => {
  const { date } = req.query
  withCache(`aktools:stock:limit:${date}`, 30, () => aktools.getStockLimitPool(date))(req, res)
})
router.get('/stock/drop', (req, res) => {
  const { date } = req.query
  withCache(`aktools:stock:drop:${date}`, 60, () => aktools.getStockDropPool(date))(req, res)
})
router.get('/stock/industry', withCache('aktools:stock:industry', 60, () => aktools.getStockIndustry()))
router.get('/stock/ztPoolPrevious', (req, res) => {
  const { date } = req.query
  withCache(`aktools:stock:ztPoolPrevious:${date}`, 60, () => aktools.getZtPoolPrevious(date))(req, res)
})
router.get('/stock/indexSpot', (req, res) => {
  const { symbol } = req.query
  const valid = ['沪深重要指数', '上证系列指数', '深证系列指数', '指数成份', '中证系列指数']
  if (!valid.includes(symbol)) return res.json({ code: 400, msg: '参数错误' })
  withCache(`aktools:stock:indexSpot:${symbol}`, 60, () => aktools.getStockIndexSpot(symbol))(req, res)
})

module.exports = router
