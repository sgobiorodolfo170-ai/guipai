'use strict'

/**
 * 行业板块路由 —— 板块列表 + 成分股。
 *
 * 数据流（只读数据库）：
 *   - 板块列表：读取 DolphinDB plate_market_quotation（由「数据管理 → 收盘数据同步」写入）。
 *   - 成分股：读取 sql.js board_constituents。
 * 本路由不连接行情源、不做 write-on-miss；库内无数据时返回空数组由前端引导同步。
 *
 * 挂在 /api/boards（独立路由，避免 stock.js 的 /:code 单段占位冲突）。
 */

const express = require('express')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const { getDb } = require('../db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const PLATE_TBL = `loadTable("dfs://tradeinsight", "plate_market_quotation")`

function toNum(v) { return v == null ? null : Number(v) }

/**
 * 板块列表 DB 行 → 前端结构。
 * 前端 StockBoards.vue 按新浪源旧契约的中文键渲染（板块/公司家数/涨跌幅/总成交额/平均价格/股票名称/股票代码）
 * 且成分股抽屉需要 label；DB-first 改造后直接返回 DDB 英文键导致列表全列空白。此处统一映射为前端契约：
 *   - label/板块 = plate（plate_market_quotation 只存板块名）；
 *   - 公司家数 = 上涨家数 + 下跌家数；
 *   - 股票名称 = leading_stock（仅名称，代码暂无 → null，前端兼容显示）。
 */
function toBoardRow(r) {
  return {
    label: r.plate,
    plate: r.plate,
    '板块': r.plate,
    '公司家数': (r.up_count || 0) + (r.down_count || 0),
    '涨跌幅': toNum(r.increase_rate),
    '总成交额': toNum(r.total_turnover),
    '平均价格': toNum(r.average_price),
    '股票名称': r.leading_stock || '',
    '股票代码': null,
    '净流入': toNum(r.net_inflow),
    '领涨股': r.leading_stock,
    net_inflow: toNum(r.net_inflow),
    up_count: r.up_count,
    down_count: r.down_count,
    leading_stock: r.leading_stock
  }
}

// 板块列表（缓存 60s：板块行情高频变动，但 60s 足够看盘）
// 只读数据库：板块行情由「数据管理 → 收盘数据同步」写入，本路由不直连行情源。
router.get('/', async (req, res) => {
  const cacheKey = 'ddb:boards:list'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached, '成功(缓存)')
  try {
    // DB 读：取最新交易日的板块行情（按涨跌幅倒序，与东财默认排序一致）
    if (ddb.isConnected()) {
      const r = await ddb.execute(
        `select * from ${PLATE_TBL} where trade_date = (select max(trade_date) from ${PLATE_TBL})` +
        ` order by increase_rate desc nulls last`
      )
      if (Array.isArray(r) && r.length > 0) {
        cache.set(cacheKey, r.map(toBoardRow), 60)
        return ok(res, r.map(toBoardRow))
      }
    }
    // 库内无板块数据 → 空数组，前端引导先同步
    ok(res, [])
  } catch (e) { errMsg(res, e.message) }
})

// 板块成分股（缓存 300s：成分股低频变动）—— 只读数据库，成分股由同步流程维护
router.get('/:label/cons', async (req, res) => {
  try {
    const label = req.params.label
    if (!label) return errMsg(res, 'label 不能为空')
    const cacheKey = `ddb:boards:cons:${label}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    // DB 读：sql.js board_constituents（board_name 存板块名）
    let rows = []
    try {
      const db = getDb()
      rows = db.prepare(
        'SELECT stock_code, stock_name FROM board_constituents WHERE board_name = ? ORDER BY stock_code'
      ).all(label)
    } catch { rows = [] }

    const data = rows.map(r => ({
      symbol: r.stock_code, code: r.stock_code, name: r.stock_name || r.stock_code
    }))
    cache.set(cacheKey, data, 300)
    ok(res, data)
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
