'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const klineRepo = require('../../dolphindb/kline-repository')
const ddb = require('../../dolphindb/client')
const { getDb } = require('../db')

const router = express.Router()

function ok(res, data, msg = '成功') { res.json({ code: 200, msg, data }) }
function errMsg(res, msg) { res.json({ code: 500, msg }) }

/** 本地时间 'YYYY-MM-DD HH:MM:SS'（与 sql.js 默认 datetime('now','localtime') 口径一致） */
function nowLocal() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

// ---- A股市场分类（股票列表页「按市场分类」的归类规则） ----
// 按代码前缀判断所属板块：
//   沪市主板 600/601/603/605；科创板 688/689；
//   深市主板 000/001/002/003（中小板已并入主板）；创业板 300/301；
//   北交所 43/83/87/88/920。
function classifyMarket(code) {
  const c = String(code || '')
  if (/^(600|601|603|605)/.test(c)) return '沪市主板'
  if (/^(688|689)/.test(c)) return '科创板'
  if (/^(000|001|002|003)/.test(c)) return '深市主板'
  if (/^(300|301)/.test(c)) return '创业板'
  if (/^(43|83|87|88|92)/.test(c)) return '北交所'
  return '其他'
}

/** 把全市场股票基础信息批量 upsert 进 stock_basic（库内数据只由显式同步动作维护）。 */
function upsertStockBasics(stocks) {
  if (!stocks || !stocks.length) return 0
  const db = getDb()
  const now = nowLocal()
  db.transaction(() => {
    for (const s of stocks) {
      db.prepare(`INSERT INTO stock_basic (code, name, market, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET name=excluded.name, market=excluded.market, updated_at=excluded.updated_at`)
        .run(s.code, s.name, classifyMarket(s.code), now)
    }
  })
  return stocks.length
}

/** 汇总 stock_basic 各市场数量（股票列表页分类 tabs 用）。 */
function stockBasicStats() {
  const db = getDb()
  const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM stock_basic`).get()
  const marketRows = db.prepare(`SELECT market, COUNT(*) AS c FROM stock_basic GROUP BY market`).all()
  const byMarket = {}
  for (const r of marketRows) byMarket[r.market] = r.c
  return { total: totalRow?.c || 0, byMarket }
}

function mapSpotItem(m) {
  return {
    code: m['代码'], name: m['名称'],
    price: Number(m['最新价']) || 0,
    change: Number(m['涨跌额']) || 0,
    changePercent: Number(m['涨跌幅']) || 0,
    volume: Number(m['成交量']) || 0,
    turnover: Number(m['成交额']) || 0,
    totalMarketValue: Number(m['总市值']) || 0,
    circulationMarketValue: Number(m['流通市值']) || 0,
    turnoverRate: Number(m['换手率']) || 0,
    high: Number(m['最高']) || 0,
    low: Number(m['最低']) || 0,
    open: Number(m['开盘']) || 0,
    amplitude: Number(m['振幅']) || 0,
    market: 'A股'
  }
}

// 两级缓存，各自独立 key：
//   SPOT_RAW_KEY    —— aktools 原始行（中文列名）。与 /api/aktools/stock/spot 及启动预热 primeCache 共用，
//                     预热写入的就是这份数据，本模块只读不写形状，避免同 key 两种结构互相污染。
//   SPOT_MAPPED_KEY —— 映射后的列表，仅本模块使用，缓存它是为了避免每请求重复映射 5500+ 行。
const SPOT_RAW_KEY = 'aktools:stock:spot'
const SPOT_MAPPED_KEY = 'aktools:stock:spot:mapped'

async function getSpotList() {
  const mapped = cache.get(SPOT_MAPPED_KEY)
  if (mapped) return mapped
  // 优先复用预热/其它路由已缓存的原始数据，避免全市场快照重复冷调用（1.5~4s）
  const raw = cache.get(SPOT_RAW_KEY) || await aktools.getStockSpot()
  const list = (raw || []).map(mapSpotItem).filter(s => s.code)
  // 空结果不落缓存：上游被拦时返回空包，缓存会让首屏"无数据"固化一个 TTL 周期
  if (list.length) cache.set(SPOT_MAPPED_KEY, list, 60)
  return list
}

// 股票列表 —— 只读本地 stock_basic 库，不再每次直连行情源。
// 支持 market（沪市主板/科创板/深市主板/创业板/北交所）分类过滤、代码/名称搜索、分页。
router.get('/', (req, res) => {
  try {
    const { search, market, page = 1, pageSize = 50 } = req.query
    const where = []
    const params = []
    if (search) {
      const kw = `%${String(search).trim()}%`
      where.push('(code LIKE ? OR name LIKE ?)')
      params.push(kw, kw)
    }
    if (market && market !== '全部') {
      where.push('market = ?')
      params.push(String(market))
    }
    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const totalRow = getDb().prepare(`SELECT COUNT(*) AS c FROM stock_basic ${whereSql}`).get(...params)
    const total = totalRow?.c || 0
    const start = Math.max((Number(page) - 1) * Number(pageSize), 0)
    const items = getDb().prepare(
      `SELECT code, name, market FROM stock_basic ${whereSql} ORDER BY code LIMIT ? OFFSET ?`
    ).all(...params, Number(pageSize), start)
    ok(res, { list: items, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (e) { errMsg(res, e.message) }
})

// 股票基础信息状态：总数量 + 各市场数量（分类 tabs 数据源）
router.get('/basic/status', (req, res) => {
  try {
    const stats = stockBasicStats()
    const updatedAt = getDb().prepare(`SELECT MAX(updated_at) AS at FROM stock_basic`).get()?.at || null
    ok(res, { ...stats, updatedAt })
  } catch (e) { errMsg(res, e.message) }
})

// 同步股票基础信息入库：从行情源一次性拉取全市场列表写入本地库。
// 属显式数据维护动作（首次使用/定期刷新时由用户触发），页面读取不直连行情源。
router.post('/basic/sync', async (req, res) => {
  try {
    const raw = await aktools.getStockSpot()
    const list = (raw || [])
      .filter(s => s['代码'])
      .map(s => ({ code: s['代码'], name: s['名称'] }))
    if (!list.length) return errMsg(res, '行情源返回空列表，未写入')
    const written = upsertStockBasics(list)
    ok(res, { ...stockBasicStats(), updatedAt: nowLocal() },
      `同步完成，共 ${written} 只`)
  } catch (e) { errMsg(res, e.message) }
})

// 搜索股票（数据拉取页选股用）：优先查本地库；库为空（未同步）时回退行情源，
// 保证数据拉取流程在首次同步前仍可用。
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query
    const db = getDb()
    const countRow = db.prepare(`SELECT COUNT(*) AS c FROM stock_basic`).get()
    if ((countRow?.c || 0) > 0) {
      const kw = `%${String(keyword || '').trim()}%`
      const results = db.prepare(
        `SELECT code, name, market FROM stock_basic WHERE code LIKE ? OR name LIKE ? LIMIT 20`
      ).all(kw, kw)
      return ok(res, results)
    }
    const list = await getSpotList()
    const results = list.filter(s =>
      s.code.includes(keyword) || s.name.includes(keyword)
    ).slice(0, 20)
    ok(res, results)
  } catch (e) { errMsg(res, e.message) }
})

// 实时行情
router.get('/realtime', async (req, res) => {
  try {
    const { codes } = req.query
    const codeList = codes ? codes.split(',') : []
    const list = await getSpotList()
    const results = codeList.length
      ? list.filter(s => codeList.includes(s.code))
      : list.slice(0, 50)
    ok(res, results)
  } catch (e) { errMsg(res, e.message) }
})

// 股票详情
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const list = await getSpotList()
    const stock = list.find(s => s.code === code)
    if (stock) {
      ok(res, { ...stock, market: 'A股' })
    } else {
      try {
        const info = await aktools.getStockInfo(code)
        ok(res, { code, name: info?.[0]?.['股票简称'] || code, price: 0, market: 'A股' })
      } catch {
        errMsg(res, '未找到股票信息')
      }
    }
  } catch (e) { errMsg(res, e.message) }
})

/** 日期前移 n 天（YYYY-MM-DD）；用于缺口回拉时的重叠对账窗口 */
function shiftDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

const KLINE_ROW_MAP = (m) => ({
  date: m['日期'], open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
  high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
  volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
  turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
})

// K线数据 —— 断点续传：DolphinDB 已有部分只补缺口，不重复拉全量。
//
// 流程（DDB 可用时）：
//   1. 查库内 [startDate, endDate] 已有数据
//   2. 覆盖完整 → 直接返回（零网络调用）
//   3. 有缺口 → 只拉缺口段，且起点回退 7 天做重叠对账
//      （前复权锚点会随新分红漂移，重叠段以新数据为准并回写，自动修正接缝）
//   4. 缺口拉取受限（429 类错误）→ 不报错，返回库内已有部分 + msg 注明"增量受限 N 秒后可补齐"
// DDB 不可用时退化为网络全量（aktools 内含东财→腾讯→Tushare 多源兜底）。
router.get('/:code/kline', async (req, res) => {
  try {
    const { code } = req.params
    const { period = 'daily', startDate, endDate, adjust = 'qfq' } = req.query
    const cacheKey = `stocks:kline:${code}:${period}:${adjust}:${startDate || ''}:${endDate || ''}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    const today = new Date().toISOString().slice(0, 10)
    const effEnd = endDate || today

    // 1. DolphinDB 断点续传
    if (ddb.isConnected()) {
      try {
        const existing = await klineRepo.getDailyK(code, startDate, effEnd)
        const latest = existing.length ? existing.map(r => r['日期']).sort().pop() : null
        if (!latest || latest < effEnd) {
          // 有缺口：只补 [latest-7天, effEnd]（无存量则全量）
          const fetchStart = latest ? shiftDays(latest, -7) : startDate
          try {
            const raw = await aktools.getStockHistory({ symbol: code, period: 'daily', adjust, start_date: fetchStart, end_date: effEnd })
            if (raw && raw.length) await klineRepo.insertDailyK(raw)
          } catch (e) {
            // 增量受限：库内有部分数据则先给部分，msg 带恢复时长提示前端
            if (e.retryAfterSec && existing.length) {
              const partial = existing.map(KLINE_ROW_MAP)
              return ok(res, partial, `部分数据（增量获取受限，约 ${e.retryAfterSec} 秒后可补齐）`)
            }
            throw e
          }
        }
        const all = await klineRepo.getDailyK(code, startDate, effEnd)
        if (all.length) {
          const rows = period === 'daily' ? all : await klineRepo.getKlineAggregated(code, startDate, effEnd, period)
          if (rows && rows.length) {
            const kline = rows.map(KLINE_ROW_MAP)
            cache.set(cacheKey, kline, 300)
            return ok(res, kline)
          }
        }
      } catch (e) {
        if (e.retryAfterSec) throw e // 受限错误继续外抛，走下方 429 响应
        console.error('[stock] DolphinDB 断点续传失败，退化为网络全量:', e.message)
      }
    }

    // 2. 无 DolphinDB 或续传失败：网络全量（aktools 内含多源兜底）
    const raw = await aktools.getStockHistory({ symbol: code, period, adjust, start_date: startDate, end_date: endDate })
    const kline = (raw || []).map(KLINE_ROW_MAP)

    // 3. 异步回填 DolphinDB（仅 daily，非阻塞——用户无感知地积累数据）
    if (period === 'daily' && raw && raw.length > 0) {
      klineRepo.insertDailyK(raw).catch(e => console.error('[stock] daily_k backfill failed:', e.message))
    }

    // 空结果不落缓存：上游被拦/限流时可能返回空数组，缓存会让 K 线图在 TTL 内一直空白
    if (kline.length) cache.set(cacheKey, kline, 300)
    ok(res, kline)
  } catch (e) {
    // 上游受限：429 + 恢复时长提示（前端据此提示"约 N 秒后重试"）
    if (e.retryAfterSec) {
      return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    }
    errMsg(res, e.message)
  }
})

// 历史数据 (同kline)
router.get('/:code/history', async (req, res) => {
  try {
    const { code } = req.params
    const { period = 'daily', startDate, endDate, adjust = 'qfq' } = req.query
    const raw = await aktools.getStockHistory({ symbol: code, period, adjust, start_date: startDate, end_date: endDate })
    ok(res, raw)
  } catch (e) { errMsg(res, e.message) }
})

// 技术指标 (暂无数据源，返回空)
router.get('/:code/indicators', (req, res) => ok(res, []))

// 财务数据 (暂无数据源，返回空)
router.get('/:code/financial', (req, res) => ok(res, {}))

// 新闻 (暂无数据源，返回空)
router.get('/:code/news', (req, res) => ok(res, []))

module.exports = router
