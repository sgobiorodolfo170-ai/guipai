'use strict'

/**
 * 行业板块路由 —— 板块列表 + 成分股。
 *
 * 数据源：新浪（akshare stock_sector_spot / stock_sector_detail），经 akshare Python 桥。
 * 板块列表含 label（板块标识）+ 板块名 + 涨跌幅 + 公司家数 + 领涨股；点击板块按 label 取成分股。
 * akshare 不可用时（Python 服务未起）返回提示，板块列表与成分股均无法获取。
 *
 * 挂在 /api/boards（独立路由，避免 stock.js 的 /:code 单段占位冲突）。
 */

const express = require('express')
const akshareSource = require('../sources/akshare')
const cache = require('../cache')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

// 板块列表（缓存 60s：板块行情高频变动，但 60s 足够看盘，且避免每次打开页面都打新浪）
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'boards:list'
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')
    if (!akshareSource.available()) return errMsg(res, 'AKShare 服务未就绪，无法获取板块列表（请到设置页启用）')
    const data = await akshareSource.fetchers.boardList()
    if (data && data.length) cache.set(cacheKey, data, 60)
    ok(res, data)
  } catch (e) { errMsg(res, e.message) }
})

// 板块成分股（缓存 300s：成分股低频变动）
router.get('/:label/cons', async (req, res) => {
  try {
    const { label } = req.params
    if (!label) return errMsg(res, 'label 不能为空')
    const cacheKey = `boards:cons:${label}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')
    if (!akshareSource.available()) return errMsg(res, 'AKShare 服务未就绪，无法获取成分股')
    const data = await akshareSource.fetchers.boardCons(label)
    if (data && data.length) cache.set(cacheKey, data, 300)
    ok(res, data)
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
