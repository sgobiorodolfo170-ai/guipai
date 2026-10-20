'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const klineRepo = require('../../dolphindb/kline-repository')
const converter = require('../converter')
const { getDb } = require('../db')
const marketTime = require('../market-time')

const router = express.Router()

/**
 * 废弃标记中间件：所有 /api/aktools/* 端点已迁移到业务路由。
 * 响应头加 X-Deprecated + 控制台告警，便于发现遗漏的调用方。
 * 端点仍在工作（DB-first 逻辑保留），但不再接收新功能。
 */
router.use((req, _res, next) => {
  _res.setHeader('X-Deprecated', 'true')
  _res.setHeader('X-Deprecated-Message', 'Use business routes: /api/stocks, /api/market, /api/boards, /api/limit-board-statistics')
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[deprecated] /api/aktools${req.url} — 请迁移到业务路由`)
  }
  next()
})

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
    const COLS = require('../col-defs')._COLS_MAP['stock_limit_pool']
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
    const COLS = require('../col-defs')._COLS_MAP['stock_limit_pool']
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
    const COLS = require('../col-defs')._COLS_MAP['plate_market_quotation']
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

// ==================== C3: spot DB-first (write-on-miss) ====================
const spotRepo = require('../../dolphindb/spot-repository')

// /stock/spot → 盘中网络优先，盘后 DB-first from stock_spot (write-on-miss + 单飞锁)
router.get('/stock/spot', async (req, res) => {
  const cacheKey = 'ddb:spot:latest'
  const cached = cache.get(cacheKey)
  if (cached) return res.json({ code: 200, msg: '成功(缓存)', data: cached })
  const ttl = marketTime.spotTtl()
  try {
    // 0. 盘中网络优先：直接取行情源并异步入库；DDB 可用时回读保持响应结构不变
    if (marketTime.isTradingTime()) {
      try {
        const raw = await aktools.getStockSpot()
        if (raw && raw.length > 0) {
          if (ddb.isConnected()) {
            try {
              await spotRepo.insertSpotSafe(raw)
              const rows = await spotRepo.getSpot()
              if (rows && rows.length > 0) {
                cache.set(cacheKey, rows, ttl)
                return res.json({ code: 200, msg: '成功(实时)', data: rows })
              }
            } catch (e) { console.error('[aktools] spot 实时入库失败，直接返回网络数据:', e.message) }
          }
          cache.set(cacheKey, raw, ttl)
          return res.json({ code: 200, msg: '成功(实时)', data: raw })
        }
      } catch (e) { console.error('[aktools] spot 网络优先失败，降级库内:', e.message) }
    }
    // 1. DB 读
    let data = await spotRepo.getSpot()
    if (data && data.length > 0) {
      cache.set(cacheKey, data, ttl)
      return res.json({ code: 200, msg: '成功', data })
    }
    // 2. aktools → write → re-read
    const raw = await aktools.getStockSpot()
    if (raw && raw.length > 0) {
      await spotRepo.insertSpotSafe(raw)
      data = await spotRepo.getSpot()
      if (data && data.length > 0) {
        cache.set(cacheKey, data, ttl)
        return res.json({ code: 200, msg: '成功(已入库)', data })
      }
    }
    res.json({ code: 200, msg: '成功(空数据)', data: raw || [] })
  } catch (e) {
    if (e.retryAfterSec) {
      return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    }
    res.json({ code: 500, msg: e.message })
  }
})

// ==================== C4: indexSpot/minute/holding/ztPrev DB-first ====================
const indexSpotRepo = require('../../dolphindb/index-spot-repository')
const minuteRepo = require('../../dolphindb/minute-repository')
const holdingRepo = require('../../dolphindb/holding-repository')

// /stock/indexSpot → DB-first from stock_index_spot
router.get('/stock/indexSpot', async (req, res) => {
  const { symbol } = req.query
  const valid = ['沪深重要指数', '上证系列指数', '深证系列指数', '指数成份', '中证系列指数']
  if (!valid.includes(symbol)) return res.json({ code: 400, msg: '参数错误' })
  const cacheKey = `ddb:indexSpot:${symbol}`
  const cached = cache.get(cacheKey)
  if (cached) return res.json({ code: 200, msg: '成功(缓存)', data: cached })
  const ttl = marketTime.spotTtl()
  try {
    // 盘中网络优先（腾讯单请求 / tqs），DDB 可用时回读保持响应结构
    if (marketTime.isTradingTime()) {
      try {
        const raw = await aktools.getStockIndexSpot(symbol)
        if (raw && raw.length > 0) {
          const today = new Date().toISOString().slice(0, 10)
          if (ddb.isConnected()) {
            try {
              await indexSpotRepo.insertIndexSpot(raw, today)
              const rows = await indexSpotRepo.getIndexSpot()
              if (rows && rows.length > 0) {
                cache.set(cacheKey, rows, ttl)
                return res.json({ code: 200, msg: '成功(实时)', data: rows })
              }
            } catch (e) { console.error('[aktools] indexSpot 实时入库失败，直接返回网络数据:', e.message) }
          }
          cache.set(cacheKey, raw, ttl)
          return res.json({ code: 200, msg: '成功(实时)', data: raw })
        }
      } catch (e) { console.error('[aktools] indexSpot 网络优先失败，降级库内:', e.message) }
    }
    let data = await indexSpotRepo.getIndexSpot()
    if (data && data.length > 0) {
      cache.set(cacheKey, data, ttl)
      return res.json({ code: 200, msg: '成功', data })
    }
    const raw = await aktools.getStockIndexSpot(symbol)
    if (raw && raw.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      await indexSpotRepo.insertIndexSpot(raw, today)
      data = await indexSpotRepo.getIndexSpot()
      if (data && data.length > 0) {
        cache.set(cacheKey, data, ttl)
        return res.json({ code: 200, msg: '成功(已入库)', data })
      }
    }
    res.json({ code: 200, msg: '成功(空数据)', data: raw || [] })
  } catch (e) {
    if (e.retryAfterSec) return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    res.json({ code: 500, msg: e.message })
  }
})

// /stock/minute → DB-first from minute_k
router.get('/stock/minute', async (req, res) => {
  const p = req.query
  const params = { ...p, start_date: p.start_date || p.startDate, end_date: p.end_date || p.endDate }
  const cacheKey = `ddb:minute:${p.symbol}:${params.start_date || ''}:${params.end_date || ''}:${p.period}`
  const cached = cache.get(cacheKey)
  if (cached) return res.json({ code: 200, msg: '成功(缓存)', data: cached })
  const ttl = marketTime.minuteTtl()
  try {
    // 盘中网络优先（tqs→腾讯），异步入库；失败回落库内
    if (marketTime.isTradingTime()) {
      try {
        const raw = await aktools.getStockMinute(params)
        if (raw && raw.length > 0) {
          cache.set(cacheKey, raw, ttl)
          if (ddb.isConnected()) {
            minuteRepo.insertMinuteK(raw, p.symbol, p.period).catch(e => console.error('[aktools] minute 入库失败:', e.message))
          }
          return res.json({ code: 200, msg: '成功(实时)', data: raw })
        }
      } catch (e) { console.error('[aktools] minute 网络优先失败，降级库内:', e.message) }
    }
    const tradeDate = params.start_date || new Date().toISOString().slice(0, 10)
    let data = await minuteRepo.getMinuteK(p.symbol, tradeDate, p.period)
    if (data && data.length > 0) {
      cache.set(cacheKey, data, ttl)
      return res.json({ code: 200, msg: '成功', data })
    }
    const raw = await aktools.getStockMinute(params)
    if (raw && raw.length > 0) {
      await minuteRepo.insertMinuteK(raw, p.symbol, p.period)
      data = await minuteRepo.getMinuteK(p.symbol, tradeDate, p.period)
      if (data && data.length > 0) {
        cache.set(cacheKey, data, ttl)
        return res.json({ code: 200, msg: '成功(已入库)', data })
      }
    }
    res.json({ code: 200, msg: '成功(空数据)', data: raw || [] })
  } catch (e) {
    if (e.retryAfterSec) return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    res.json({ code: 500, msg: e.message })
  }
})

// /stock/holding → DB-first from stock_holding
router.get('/stock/holding', async (req, res) => {
  const p = req.query
  const cacheKey = `ddb:holding:${p.symbol}:${p.date}`
  const cached = cache.get(cacheKey)
  if (cached) return res.json({ code: 200, msg: '成功(缓存)', data: cached })
  try {
    let data = await holdingRepo.getHolding(p.date, p.symbol)
    if (data && data.length > 0) {
      cache.set(cacheKey, data, 86400)
      return res.json({ code: 200, msg: '成功', data })
    }
    const raw = await aktools.getStockHolding(p)
    if (raw && raw.length > 0) {
      const rows = converter.convertHolding(raw, p.date)
      await holdingRepo.insertHolding(rows, p.date, p.symbol)
      data = await holdingRepo.getHolding(p.date, p.symbol)
      if (data && data.length > 0) {
        cache.set(cacheKey, data, 86400)
        return res.json({ code: 200, msg: '成功(已入库)', data })
      }
    }
    res.json({ code: 200, msg: '成功(空数据)', data: raw || [] })
  } catch (e) {
    if (e.retryAfterSec) return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    res.json({ code: 500, msg: e.message })
  }
})

// /stock/ztPoolPrevious → DB-first from zt_pool_previous
router.get('/stock/ztPoolPrevious', async (req, res) => {
  const { date } = req.query
  const cacheKey = `ddb:ztPrev:${date}`
  const cached = cache.get(cacheKey)
  if (cached) return res.json({ code: 200, msg: '成功(缓存)', data: cached })
  try {
    const d = String(date).replace(/-/g, '.')
    if (ddb.isConnected()) {
      const r = await ddb.execute(`select * from loadTable("dfs://tradeinsight", "zt_pool_previous") where trade_date=${d}`)
      const data = Array.isArray(r) ? r : []
      if (data.length > 0) {
        cache.set(cacheKey, data, 300)
        return res.json({ code: 200, msg: '成功', data })
      }
    }
    const raw = await aktools.getZtPoolPrevious(date)
    if (raw && raw.length > 0 && ddb.isConnected()) {
      const rows = converter.convertZtPrevious(raw, date)
      await ddb.execute(`t = loadTable("dfs://tradeinsight", "zt_pool_previous"); delete from t where trade_date=${String(date).replace(/-/g, '.')}`)
      const ZT_COLS = [
        { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
        { name: 'name', type: 'symbol' }, { name: 'latest_price', type: 'double' },
        { name: 'limit_price', type: 'double' }, { name: 'pct_chg', type: 'double' },
        { name: 'amount', type: 'double' }, { name: 'circulation_mv', type: 'double' },
        { name: 'total_mv', type: 'double' }, { name: 'turnover_rate', type: 'double' },
        { name: 'amplitude', type: 'double' }, { name: 'speed', type: 'double' },
        { name: 'last_limit_time', type: 'string' }, { name: 'consecutive_limit', type: 'int' },
        { name: 'industry', type: 'string' }, { name: 'limit_stats', type: 'string' }
      ]
      await ddb.insertRows('zt_pool_previous', ZT_COLS, rows)
      if (ddb.isConnected()) {
        const r2 = await ddb.execute(`select * from loadTable("dfs://tradeinsight", "zt_pool_previous") where trade_date=${String(date).replace(/-/g, '.')}`)
        const data = Array.isArray(r2) ? r2 : []
        if (data.length > 0) {
          cache.set(cacheKey, data, 300)
          return res.json({ code: 200, msg: '成功(已入库)', data })
        }
      }
    }
    res.json({ code: 200, msg: '成功(空数据)', data: raw || [] })
  } catch (e) {
    if (e.retryAfterSec) return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    res.json({ code: 500, msg: e.message })
  }
})

// ==================== 启动预热 ====================
// 2026-10-20 恢复全市场 spot 预热：主源改为腾讯批量（800/请求、6 并发，~1s），
// 不再是 TDX-only 时期分批拉 5500+ 只（30~60s 占桥）的旧形态。
// 预热打通 rank 代码池 + qt 连接，让首个 /stocks/realtime 或 /market/hot 免冷启动。
// best-effort：失败静默，首个请求仍会自行拉取。
async function primeCache() {
  try { await aktools.getStockSpot() } catch (_) { /* 预热失败无副作用 */ }
}

module.exports = router
module.exports.primeCache = primeCache
