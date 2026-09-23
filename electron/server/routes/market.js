'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')

const router = express.Router()

function ok(res, data, msg = '成功') { res.json({ code: 200, msg, data }) }
function errMsg(res, msg) { res.json({ code: 500, msg }) }

// 市场概况
router.get('/overview', async (req, res) => {
  try {
    const cacheKey = 'market:overview'
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached)

    const indices = await aktools.getStockIndexSpot('沪深重要指数')
    const overview = (indices || []).map(m => ({
      code: m['代码'] || m['指数代码'], name: m['名称'] || m['指数名称'],
      price: Number(m['最新价']) || 0, change: Number(m['涨跌额']) || 0,
      changePercent: Number(m['涨跌幅']) || 0
    }))
    cache.set(cacheKey, overview, 60)
    ok(res, overview)
  } catch (e) { errMsg(res, e.message) }
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

module.exports = router
