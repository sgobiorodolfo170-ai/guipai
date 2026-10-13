'use strict'

/**
 * 行业板块路由 —— 板块列表 + 成分股。
 *
 * 数据流（DB-first，write-on-miss）：
 *   - 板块列表：DolphinDB plate_market_quotation → miss 时走新浪（akshare 源）转换入库后再读回。
 *   - 成分股：sql.js board_constituents → miss 时走新浪源写入 sql.js 后再读回。
 *
 * 挂在 /api/boards（独立路由，避免 stock.js 的 /:code 单段占位冲突）。
 */

const express = require('express')
const akshareSource = require('../sources/akshare')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const converter = require('../converter')
const { getDb } = require('../db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const PLATE_TBL = `loadTable("dfs://tradeinsight", "plate_market_quotation")`

/** plate_market_quotation 列定义（与 ensureSchema 保持一致的子集顺序即可，需覆盖全部 12 列） */
const PLATE_COLS = [
  { name: 'trade_date', type: 'date' }, { name: 'plate', type: 'symbol' },
  { name: 'increase_rate', type: 'double' }, { name: 'total_volume', type: 'double' },
  { name: 'total_turnover', type: 'double' }, { name: 'net_inflow', type: 'double' },
  { name: 'up_count', type: 'int' }, { name: 'down_count', type: 'int' },
  { name: 'average_price', type: 'double' }, { name: 'leading_stock', type: 'symbol' },
  { name: 'leading_stock_price', type: 'double' }, { name: 'leading_stock_increase', type: 'double' }
]

/**
 * 板块列表 DB 行 → 前端结构。
 * DB 无 name/label 列（plate_market_quotation 只存板块名），用 plate 同时充当两者，
 * 与旧新浪数据源的 { label, 板块, 涨跌幅, ... } 键保持一致以兼容前端渲染。
 */
function toBoardList(rows) {
  return rows.map(r => ({
    plate: r.plate,
    rank: null,
    increase_rate: r.increase_rate == null ? null : Number(r.increase_rate),
    total_volume: r.total_volume == null ? null : Number(r.total_volume),
    total_turnover: r.total_turnover == null ? null : Number(r.total_turnover),
    net_inflow: r.net_inflow == null ? 0 : Number(r.net_inflow),
    up_count: r.up_count, down_count: r.down_count,
    average_price: r.average_price == null ? null : Number(r.average_price),
    leading_stock: r.leading_stock,
    leading_stock_price: r.leading_stock_price == null ? null : Number(r.leading_stock_price),
    leading_stock_increase: r.leading_stock_increase == null ? null : Number(r.leading_stock_increase)
  }))
}

// 板块列表（缓存 60s：板块行情高频变动，但 60s 足够看盘）
router.get('/', async (req, res) => {
  const cacheKey = 'ddb:boards:list'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached, '成功(缓存)')
  try {
    // 1. DB 读：取最新交易日的板块行情（按涨跌幅倒序，与东财默认排序一致）
    if (ddb.isConnected()) {
      const r = await ddb.execute(
        `select * from ${PLATE_TBL} where trade_date = (select max(trade_date) from ${PLATE_TBL})` +
        ` order by increase_rate desc nulls last`
      )
      if (Array.isArray(r) && r.length > 0) {
        cache.set(cacheKey, r, 60)
        return ok(res, r)
      }
    }

    // 2. 新浪源 → 转换入库 → 读回。数据源未就绪时明确报错，不再静默返回空数组
    if (!akshareSource.available()) {
      return errMsg(res, '数据库无板块数据，且新浪数据源未就绪（请到设置页启用）')
    }
    const raw = await akshareSource.fetchers.boardList()
    if (!raw || !raw.length) return ok(res, [])

    if (ddb.isConnected()) {
      const tradeDate = new Date().toISOString().slice(0, 10)
      const d = tradeDate.replace(/-/g, '.')
      const rows = converter.convertPlateMarket(raw, tradeDate)
      if (rows.length) {
        // 单日全量替换：先删当日旧数据再插，避免自动任务与手动刷新交叉写入重复行
        await ddb.execute(`t = ${PLATE_TBL}; delete from t where trade_date = ${d}`)
        await ddb.insertRows('plate_market_quotation', PLATE_COLS, rows)
        const r2 = await ddb.execute(
          `select * from ${PLATE_TBL} where trade_date = (select max(trade_date) from ${PLATE_TBL})` +
          ` order by increase_rate desc nulls last`
        )
        if (Array.isArray(r2) && r2.length > 0) {
          cache.set(cacheKey, r2, 60)
          return ok(res, r2, '成功(已入库)')
        }
      }
    }

    // DolphinDB 不可用时的降级：只返回源数据，不缓存（避免脏数据长期驻留）
    ok(res, toBoardList(converter.convertPlateMarket(raw, new Date().toISOString().slice(0, 10))), '成功(未入库)')
  } catch (e) { errMsg(res, e.message) }
})

// 板块成分股（缓存 300s：成分股低频变动）
router.get('/:label/cons', async (req, res) => {
  try {
    const label = req.params.label
    if (!label) return errMsg(res, 'label 不能为空')
    const cacheKey = `ddb:boards:cons:${label}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    // 1. DB 读：sql.js board_constituents（board_name 存板块名）
    let rows = []
    try {
      const db = getDb()
      rows = db.prepare(
        'SELECT stock_code, stock_name FROM board_constituents WHERE board_name = ? ORDER BY stock_code'
      ).all(label)
    } catch { rows = [] }

    if (rows.length > 0) {
      const data = rows.map(r => ({
        symbol: r.stock_code, code: r.stock_code, name: r.stock_name || r.stock_code
      }))
      cache.set(cacheKey, data, 300)
      return ok(res, data)
    }

    // 2. 新浪源 → 写 sql.js → 读回
    if (!akshareSource.available()) return errMsg(res, '数据库无成分股，且新浪数据源未就绪（请到设置页启用）')
    const raw = await akshareSource.fetchers.boardCons(label)
    if (!raw || !raw.length) return ok(res, [])

    const list = raw
      .map(m => ({ code: m['symbol'] || m['代码'] || m['code'], name: m['name'] || m['名称'] }))
      .filter(x => x.code && x.code.match(/^\d{6}$/))
      .map(x => ({ code: x.code, name: x.name }))

    if (list.length) {
      try {
        const db = getDb()
        // 单板块全量替换：先删旧成分再插，保证板块成分调整后不留幽灵股
        const del = db.prepare('DELETE FROM board_constituents WHERE board_name = ?')
        const ins = db.prepare('INSERT OR IGNORE INTO board_constituents (board_name, board_code, stock_code, stock_name) VALUES (?, ?, ?, ?)')
        const tx = db.transaction((board, src) => {
          del.run(board)
          for (const s of src) ins.run(board, null, s.code, s.name)
        })
        tx(label, list)
      } catch (e) {
        // 入库失败不阻断读路径：仍返回源数据让前端可用
        console.warn('[boards] 写 board_constituents 失败:', e.message)
      }

      const re = db.prepare(
        'SELECT stock_code, stock_name FROM board_constituents WHERE board_name = ? ORDER BY stock_code'
      ).all(label)
      const data = re.map(r => ({ symbol: r.stock_code, code: r.stock_code, name: r.stock_name || r.stock_code }))
      cache.set(cacheKey, data, 300)
      return ok(res, data, '成功(已入库)')
    }

    ok(res, [], '成功(空数据)')
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
