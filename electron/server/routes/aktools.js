'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const klineRepo = require('../../dolphindb/kline-repository')
const converter = require('../converter')
const { getDb } = require('../db')

const router = express.Router()

/**
 * DB-first with write-on-miss 模式：
 * 1. cache 命中 → 返回（缓存的数据源自 DB）
 * 2. cache miss → 查 DB → 有数据 → cache.set → 返回
 * 3. DB miss → aktools 取数 → converter → DB 写入 → DB 重读 → cache.set → 返回
 * 4. aktools 失败 → 返回 DB 旧数据（如有）或错误
 */
function dbFirst(opts) {
  const { cacheKey, cacheTtl, dbRead, fetchFromSource, writeToDb, readFromDbAfterWrite } = opts
  return async (req, res) => {
    // 1. cache
    const cached = cache.get(cacheKey)
    if (cached) return res.json({ code: 200, msg: '成功(缓存)', data: cached })
    try {
      // 2. DB 读
      let data = await dbRead(req)
      if (data && (!Array.isArray(data) || data.length > 0)) {
        cache.set(cacheKey, data, cacheTtl)
        return res.json({ code: 200, msg: '成功', data })
      }
      // 3. aktools → write → re-read
      const raw = await fetchFromSource(req)
      if (raw && raw.length > 0) {
        await writeToDb(raw, req)
        data = await readFromDbAfterWrite(req)
        if (data && data.length > 0) {
          cache.set(cacheKey, data, cacheTtl)
          return res.json({ code: 200, msg: '成功(已入库)', data })
        }
      }
      // 4. aktools 返回空或 DB 无数据
      res.json({ code: 200, msg: '成功(空数据)', data: raw || [] })
    } catch (e) {
      if (e.retryAfterSec) {
        return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
      }
      res.json({ code: 500, msg: e.message })
    }
  }
}

// ==================== C2: 已有表 bypass 修复 ====================

// /stock/history → DB-first from daily_k
router.get('/stock/history', dbFirst({
  cacheKey: (req) => {
    const p = req.query
    const sd = p.start_date || p.startDate || ''
    const ed = p.end_date || p.endDate || ''
    return `ddb:history:${p.symbol}:${p.period}:${p.adjust}:${sd}:${ed}`
  },
  cacheTtl: 300,
  dbRead: async (req) => {
    if (!ddb.isConnected()) return []
    const p = req.query
    const sd = p.start_date || p.startDate
    const ed = p.end_date || p.endDate
    return await klineRepo.getDailyK(p.symbol, sd, ed)
  },
  fetchFromSource: (req) => {
    const p = req.query
    return aktools.getStockHistory({ ...p, start_date: p.start_date || p.startDate, end_date: p.end_date || p.endDate })
  },
  writeToDb: async (raw) => { await klineRepo.insertDailyK(raw) },
  readFromDbAfterWrite: (req) => klineRepo.getDailyK(req.query.symbol, req.query.start_date || req.query.startDate, req.query.end_date || req.query.endDate)
}))

// /stock/limit → DB-first from stock_limit_pool (data_type='LIMIT_UP')
router.get('/stock/limit', dbFirst({
  cacheKey: (req) => `ddb:limit:${req.query.date}`,
  cacheTtl: 30,
  dbRead: async (req) => {
    if (!ddb.isConnected()) return []
    const d = String(req.query.date).replace(/-/g, '.')
    const r = await ddb.execute(`select * from loadTable("dfs://tradeinsight", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_UP'`)
    return Array.isArray(r) ? r : []
  },
  fetchFromSource: (req) => aktools.getStockLimitPool(req.query.date),
  writeToDb: async (raw, req) => {
    const rows = converter.convertStockLimitPool(raw, req.query.date, 'LIMIT_UP')
    const COLS = require('../sync')._COLS_MAP['stock_limit_pool']
    await ddb.insertRows('stock_limit_pool', COLS, rows)
    cache.delByPattern(`stats:*${req.query.date}*`)
  },
  readFromDbAfterWrite: async (req) => {
    const d = String(req.query.date).replace(/-/g, '.')
    const r = await ddb.execute(`select * from loadTable("dfs://tradeinsight", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_UP'`)
    return Array.isArray(r) ? r : []
  }
}))

// /stock/drop → DB-first from stock_limit_pool (data_type='LIMIT_DOWN')
router.get('/stock/drop', dbFirst({
  cacheKey: (req) => `ddb:drop:${req.query.date}`,
  cacheTtl: 60,
  dbRead: async (req) => {
    if (!ddb.isConnected()) return []
    const d = String(req.query.date).replace(/-/g, '.')
    const r = await ddb.execute(`select * from loadTable("dfs://tradeinsight", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_DOWN'`)
    return Array.isArray(r) ? r : []
  },
  fetchFromSource: (req) => aktools.getStockDropPool(req.query.date),
  writeToDb: async (raw, req) => {
    const rows = converter.convertStockLimitPool(raw, req.query.date, 'LIMIT_DOWN')
    const COLS = require('../sync')._COLS_MAP['stock_limit_pool']
    await ddb.insertRows('stock_limit_pool', COLS, rows)
    cache.delByPattern(`stats:*${req.query.date}*`)
  },
  readFromDbAfterWrite: async (req) => {
    const d = String(req.query.date).replace(/-/g, '.')
    const r = await ddb.execute(`select * from loadTable("dfs://tradeinsight", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_DOWN'`)
    return Array.isArray(r) ? r : []
  }
}))

// /stock/industry → DB-first from plate_market_quotation
router.get('/stock/industry', dbFirst({
  cacheKey: 'ddb:industry',
  cacheTtl: 60,
  dbRead: async (req) => {
    if (!ddb.isConnected()) return []
    // 取最新交易日的板块行情
    const r = await ddb.execute(`select * from loadTable("dfs://tradeinsight", "plate_market_quotation") context by trade_date limit -1 by plate`)
    return Array.isArray(r) ? r : []
  },
  fetchFromSource: (req) => aktools.getStockIndustry(),
  writeToDb: async (raw, req) => {
    const today = new Date().toISOString().slice(0, 10)
    const rows = converter.convertPlateMarket(raw, today)
    const COLS = require('../sync')._COLS_MAP['plate_market_quotation']
    await ddb.insertRows('plate_market_quotation', COLS, rows)
    cache.delByPattern('stats:*')
  },
  readFromDbAfterWrite: async (req) => {
    const r = await ddb.execute(`select * from loadTable("dfs://tradeinsight", "plate_market_quotation") context by trade_date limit -1 by plate`)
    return Array.isArray(r) ? r : []
  }
}))

// /stock/info → DB-first from sql.js stock_basic
router.get('/stock/info', dbFirst({
  cacheKey: (req) => `ddb:info:${req.query.symbol}`,
  cacheTtl: 10000,
  dbRead: async (req) => {
    const db = getDb()
    const row = db.prepare('SELECT code as 股票代码, name as 股票简称, market as 市场, list_date as 上市日期 FROM stock_basic WHERE code = ?').get(req.query.symbol)
    return row ? [row] : []
  },
  fetchFromSource: (req) => aktools.getStockInfo(req.query.symbol),
  writeToDb: async (raw, req) => {
    if (!raw || !raw.length) return
    const db = getDb()
    const item = raw[0]
    db.prepare(`INSERT OR REPLACE INTO stock_basic (code, name, market, updated_at) VALUES (?, ?, ?, datetime('now','localtime')`).run(
      req.query.symbol,
      item['股票简称'] || item['名称'] || '',
      'A股'
    )
  },
  readFromDbAfterWrite: async (req) => {
    const db = getDb()
    const row = db.prepare('SELECT code as 股票代码, name as 股票简称, market as 市场, list_date as 上市日期 FROM stock_basic WHERE code = ?').get(req.query.symbol)
    return row ? [row] : []
  }
}))

// ==================== C3-C4 端点（暂保留 withCache，后续 C3-C4 改为 DB-first） ====================
router.get('/stock/spot', withCache('aktools:stock:spot', 60, () => aktools.getStockSpot()))
router.get('/stock/minute', (req, res) => {
  const p = req.query
  const params = { ...p, start_date: p.start_date || p.startDate, end_date: p.end_date || p.endDate }
  const cacheKey = `aktools:stock:minute:${p.symbol}:${p.period}:${params.start_date || ''}:${params.end_date || ''}`
  withCache(cacheKey, 60, () => aktools.getStockMinute(params))(req, res)
})
router.get('/stock/holding', (req, res) => {
  const p = req.query
  withCache(`aktools:stock:holding:${p.date}:${p.indicator}:${p.symbol}`, 10000, () => aktools.getStockHolding(p))(req, res)
})
router.get('/stock/ztPoolPrevious', (req, res) => {
  const { date } = req.query
  withCache(`aktools:stock:ztPoolPrevious:${date}`, 60, () => aktools.getZtPoolPrevious(date))(req, res)
})
router.get('/stock/indexSpot', (req, res) => {
  const { symbol } = req.query
  const valid = ['沪深重要指数', '上证系列指数', '深证系列指数', '指数成份', '中证系列指数']
  if (!valid.includes(symbol)) return res.json({ code: 400, msg: '参数错误' })
  withCache(`aktools:stock:indexSpot:${symbol}`, 60, () => aktools.getStockIndexSpot(symbol), { cacheEmpty: false })(req, res)
})

// ==================== 启动预热 ====================
async function primeCache() {
  try {
    const spot = await aktools.getStockSpot()
    if (Array.isArray(spot) && spot.length) cache.set('aktools:stock:spot', spot, 300)
  } catch (e) { /* 忽略预热失败 */ }
}

module.exports = router
module.exports.primeCache = primeCache
