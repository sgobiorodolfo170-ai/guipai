'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const klineRepo = require('../../dolphindb/kline-repository')
const ddb = require('../../dolphindb/client')
const spotRepo = require('../../dolphindb/spot-repository')
const { getDb } = require('../db')
const akshareSource = require('../sources/akshare')

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

/** 把全市场股票基础信息批量 upsert 进 stock_basic（库内数据只由显式同步动作维护）。
 *  stocks 项可携带元数据：total_shares/float_shares/is_st/is_suspended（spot 派生）；
 *  list_date/delist_date 由 upsertListDates 单独补（akshare 批量，异步）。 */
function upsertStockBasics(stocks) {
  if (!stocks || !stocks.length) return 0
  const db = getDb()
  const now = nowLocal()
  db.transaction(() => {
    for (const s of stocks) {
      db.prepare(`INSERT INTO stock_basic (code, name, market, is_st, is_suspended, total_shares, float_shares, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET name=excluded.name, market=excluded.market,
          is_st=excluded.is_st, is_suspended=excluded.is_suspended,
          total_shares=excluded.total_shares, float_shares=excluded.float_shares,
          updated_at=excluded.updated_at`)
        .run(s.code, s.name, classifyMarket(s.code),
          s.is_st ?? 0, s.is_suspended ?? 0, s.total_shares ?? null, s.float_shares ?? null, now)
    }
  })
  return stocks.length
}

/** 用 akshare 批量元数据（上市日）补 stock_basic.list_date/delist_date。
 *  仅更新已存在的行（不新增）；akshare 不可用时静默跳过。 */
function upsertListDates(metaList) {
  if (!metaList || !metaList.length) return 0
  const db = getDb()
  const now = nowLocal()
  let n = 0
  const upd = db.prepare(`UPDATE stock_basic SET list_date=?, delist_date=?, updated_at=? WHERE code=?`)
  db.transaction(() => {
    for (const m of metaList) {
      if (!m.code || (!m.list_date && !m.delist_date)) continue
      const r = upd.run(m.list_date || null, m.delist_date || null, now, m.code)
      if (r.changes > 0) n++
    }
  })
  return n
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

// 同步股票基础信息入库：从行情源一次性拉取全市场列表，派生元数据写入本地库。
// spot 派生：总/流通股本=市值÷价、is_st=名称含ST、is_suspended=价=0（无需 akshare）。
// akshare 可用时追加：上市/退市日（批量，沪/深/北交所 stock_info_*_name_code）。
router.post('/basic/sync', async (req, res) => {
  try {
    const raw = await aktools.getStockSpot()
    const list = (raw || [])
      .filter(s => s['代码'])
      .map(s => {
        const price = Number(s['最新价']) || 0
        const tmv = Number(s['总市值']) || 0
        const fmv = Number(s['流通市值']) || 0
        return {
          code: s['代码'], name: s['名称'],
          total_shares: price > 0 ? (tmv / price) : null,     // 总市值÷价 = 总股本
          float_shares: price > 0 ? (fmv / price) : null,     // 流通市值÷价 = 流通股本
          is_st: /ST/.test(String(s['名称'])) ? 1 : 0,         // 名称含 ST/*ST
          is_suspended: price === 0 ? 1 : 0                   // 价=0 视为停牌
        }
      })
    if (!list.length) return errMsg(res, '行情源返回空列表，未写入')
    const written = upsertStockBasics(list)

    // 上市/退市日（akshare 批量，best-effort：不可用则跳过，元数据其余列已写入）
    let listDateUpdated = 0
    try {
      if (akshareSource.available()) {
        const meta = await akshareSource.fetchers.stockMeta()
        listDateUpdated = upsertListDates(meta)
      }
    } catch (e) {
      console.warn('[stock] list_date 同步跳过（akshare 不可用）:', e.message)
    }

    ok(res, { ...stockBasicStats(), updatedAt: nowLocal(), listDateUpdated },
      `同步完成，共 ${written} 只（上市日补 ${listDateUpdated} 条）`)
  } catch (e) { errMsg(res, e.message) }
})

// 定向补录股票基础信息（upsert）：供一次性回填/补新上市股，不入库不存在的非个股代码。
// body: { stocks: [{code,name,market?}], listDates: [{code,list_date}] }
// 复用 upsertStockBasics/upsertListDates（内部已按 code 幂等 upsert）。
router.post('/basic/upsert', (req, res) => {
  try {
    const { stocks, listDates } = req.body || {}
    const cleanStocks = (Array.isArray(stocks) ? stocks : [])
      .filter(s => s && s.code && s.name)
      .map(s => ({ code: String(s.code).trim(), name: String(s.name).trim() }))
    const cleanDates = (Array.isArray(listDates) ? listDates : [])
      .filter(m => m && m.code)
      .map(m => ({ code: String(m.code).trim(), list_date: m.list_date || null, delist_date: m.delist_date || null }))
    const written = upsertStockBasics(cleanStocks)
    const dateUpdated = upsertListDates(cleanDates)
    ok(res, { ...stockBasicStats(), written, dateUpdated, updatedAt: nowLocal() },
      `补录 ${written} 只，上市日补 ${dateUpdated} 条`)
  } catch (e) { errMsg(res, e.message) }
})

// 搜索股票：仅查本地 stock_basic 库（不再回退 aktools 直返）
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query
    const db = getDb()
    const kw = `%${String(keyword || '').trim()}%`
    const results = db.prepare(
      `SELECT code, name, market FROM stock_basic WHERE code LIKE ? OR name LIKE ? LIMIT 20`
    ).all(kw, kw)
    ok(res, results)
  } catch (e) { errMsg(res, e.message) }
})

/**
 * stock_spot 数据库行 → 前端契约。
 * DB 用 snake_case 存列名（symbol/pct_chg/...），前端 StockList.vue / stock.store.js 按
 * code/price/changePercent/turnover/totalMarketValue 取值，故在路由边界做一次显式映射，
 * 避免把存储层字段名泄漏给前端。
 */
function mapSpotRow(r) {
  return {
    code: r.symbol,
    name: r.name || r.symbol,
    price: r.close != null ? Number(r.close) : 0,
    changePercent: r.pct_chg != null ? Number(r.pct_chg) : 0,
    turnover: r.amount != null ? Number(r.amount) : 0,
    volume: r.volume != null ? Number(r.volume) : 0,
    totalMarketValue: r.total_market_value != null ? Number(r.total_market_value) : 0,
    market: 'A股'
  }
}

// 实时行情 — DB-first from stock_spot
// 三层：内存缓存 → DolphinDB → aktools 补写后读回。任一层命中即返回，全程不直连行情源。
router.get('/realtime', async (req, res) => {
  const cacheKey = 'ddb:spot:realtime'
  const { codes } = req.query
  const codeList = codes ? String(codes).split(',') : []
  try {
    // 1. 内存缓存
    let cached = cache.get(cacheKey)
    if (!cached) {
      // 2. DolphinDB
      cached = await spotRepo.getSpot()
      if (cached && cached.length) cache.set(cacheKey, cached, 60)
    }
    if (cached && cached.length) {
      const list = (codeList.length ? cached.filter(s => codeList.includes(s.symbol)) : cached).map(mapSpotRow)
      return ok(res, list, '成功(缓存)')
    }

    // 3. aktools → 转换入库 → 读回（保证前端只见数据库数据）
    let raw = await aktools.getStockSpot()
    if (raw && raw.length) {
      await spotRepo.insertSpotSafe(raw)
      const rows = await spotRepo.getSpot()
      if (rows && rows.length) {
        cache.set(cacheKey, rows, 60)
        const list = (codeList.length ? rows.filter(s => codeList.includes(s.symbol)) : rows).map(mapSpotRow)
        return ok(res, list, '成功(已入库)')
      }
    }

    // 4. 上游全挂 → 从 daily_k_raw 派生收盘快照兜底
    const derived = await spotRepo.deriveFromRaw()
    if (derived > 0) {
      const rows = await spotRepo.getSpot()
      if (rows && rows.length) {
        cache.set(cacheKey, rows, 60)
        const list = (codeList.length ? rows.filter(s => codeList.includes(s.symbol)) : rows).map(mapSpotRow)
        return ok(res, list, '成功(daily_k_raw 派生快照)')
      }
    }
    ok(res, [], '成功(空数据)')
  } catch (e) { errMsg(res, e.message) }
})

// 股票详情 — DB-first from stock_spot
// 两级降级：stock_spot 快照 → sql.js stock_basic 基础信息。不再直连行情源。
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const nameOf = () => {
      try {
        const r = getDb().prepare('SELECT name FROM stock_basic WHERE code = ?').get(code)
        return r && r.name ? r.name : null
      } catch { return null }
    }
    // 1. stock_spot 快照（按代码直查，避免拉全市场）
    let row = null
    try {
      row = await spotRepo.getSpotByCode(code)
    } catch (_) { /* DolphinDB 不可用，走基础信息兜底 */ }
    if (row) return ok(res, { ...mapSpotRow(row), name: nameOf() || row.name || code, market: 'A股' })

    // 2. 基础信息兜底：只读本地 stock_basic，price 给 0 由前端展示 '--'
    const info = (() => {
      try { return getDb().prepare('SELECT code, name, market FROM stock_basic WHERE code = ?').get(code) } catch { return null }
    })()
    if (info) return ok(res, { code, name: info.name || code, price: 0, market: info.market || 'A股' })
    errMsg(res, '未找到股票信息，请先在数据管理同步股票列表')
  } catch (e) { errMsg(res, e.message) }
})

/** 日期前移 n 天（YYYY-MM-DD）；用于缺口回拉时的重叠对账窗口 */
function shiftDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/** K线查询默认起始日：与 dfs://tradeinsight_raw 分区起点一致，覆盖通达信 1998 至今全历史。
 *  必须显式给默认值而非留空——safeDate(undefined) 返回 null 会让库查询与 raw 兜底双双返回空，误报 503。 */
const DEFAULT_KLINE_START = '1990-01-01'

/** query 日期 → ISO 'YYYY-MM-DD'；空/非法 → fallback。
 *  必须统一为 ISO：前端传紧凑 YYYYMMDD，而库返回 ISO，两者混用会让 `latest < effEnd`
 *  字符串比较恒真（'2026-10-13' < '20261013'），导致每次请求都白跑一次增量拉取。
 *  上游源（东财/腾讯/TDX）均以 replace(/\D/g,'') 归一化，接收 ISO 无损。 */
function normDateISO(v, fallback) {
  const s = String(v || '').trim().replace(/[^\d]/g, '')
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : fallback
}

/** Promise 限时：超时 reject(new Error('timeout'))，供补齐缺口这类非关键网络调用防拖死路由。 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ])
}

const KLINE_ROW_MAP = (m) => ({
  date: m['日期'], open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
  high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
  volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
  turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
})

// 股票元数据（详情页用）：上市日/退市日/ST/停牌/总流通股本，来自本地 stock_basic
router.get('/:code/meta', (req, res) => {
  try {
    const { code } = req.params
    const row = getDb().prepare(
      `SELECT code, name, market, list_date, delist_date, is_st, is_suspended,
              total_shares, float_shares, updated_at
       FROM stock_basic WHERE code = ?`
    ).get(code)
    if (!row) return errMsg(res, '本地库无该股票元数据，请先同步股票列表')
    ok(res, row)
  } catch (e) { errMsg(res, e.message) }
})

// 股票财报（详情页用）：最近 N 季三大表+指标，来自本地 stock_financial
router.get('/:code/financial', (req, res) => {
  try {
    const { code } = req.params
    const n = Math.min(Math.max(Number(req.query.n) || 8, 1), 40)
    const rows = getDb().prepare(
      `SELECT code, report_date, revenue, net_profit, net_profit_excl_nonrec,
              total_assets, net_assets, debt_ratio, operating_cashflow,
              gross_margin, roe, roa
       FROM stock_financial WHERE code = ? ORDER BY report_date DESC LIMIT ?`
    ).all(code, n)
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

// 同步单只股票财报入库（akshare 三大表+指标合并，最近 N 季）
// 属逐只数据维护动作（详情页/数据拉取页触发）；akshare 不可用时返回提示。
router.post('/:code/financial/sync', async (req, res) => {
  try {
    const { code } = req.params
    const n = Math.min(Math.max(Number(req.query.n) || 8, 1), 40)
    if (!akshareSource.available()) return errMsg(res, 'AKShare 服务未就绪，无法拉取财报（请到设置页启用）')
    const rows = await akshareSource.fetchers.financial({ symbol: code, n })
    if (!rows || !rows.length) return errMsg(res, 'akshare 财报返回空')
    const db = getDb()
    const now = nowLocal()
    const upsert = db.prepare(`INSERT INTO stock_financial
      (code, report_date, revenue, net_profit, net_profit_excl_nonrec, total_assets, net_assets,
       debt_ratio, operating_cashflow, gross_margin, roe, roa, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(code, report_date) DO UPDATE SET
        revenue=excluded.revenue, net_profit=excluded.net_profit,
        net_profit_excl_nonrec=excluded.net_profit_excl_nonrec,
        total_assets=excluded.total_assets, net_assets=excluded.net_assets,
        debt_ratio=excluded.debt_ratio, operating_cashflow=excluded.operating_cashflow,
        gross_margin=excluded.gross_margin, roe=excluded.roe, roa=excluded.roa, updated_at=excluded.updated_at`)
    let written = 0
    db.transaction(() => {
      for (const r of rows) {
        if (!r.report_date) continue
        upsert.run(code, r.report_date, r.revenue ?? null, r.net_profit ?? null,
          r.net_profit_excl_nonrec ?? null, r.total_assets ?? null, r.net_assets ?? null,
          r.debt_ratio ?? null, r.operating_cashflow ?? null, r.gross_margin ?? null,
          r.roe ?? null, r.roa ?? null, now)
        written++
      }
    })
    ok(res, { written, n: rows.length }, `财报同步完成，写入 ${written} 季`)
  } catch (e) { errMsg(res, e.message) }
})

// 股票估值指标快照（详情页用）：PE/PB/PS/PCF/股息率，来自本地 stock_indicator
router.get('/:code/indicator', (req, res) => {
  try {
    const { code } = req.params
    const row = getDb().prepare(
      `SELECT code, trade_date, pe_ttm, pb, ps, pcf, dividend_yield, updated_at
       FROM stock_indicator WHERE code = ?`
    ).get(code)
    ok(res, row || null)
  } catch (e) { errMsg(res, e.message) }
})

// 同步单只股票估值指标入库（akshare 百度估值 5 指标取最新）
router.post('/:code/indicator/sync', async (req, res) => {
  try {
    const { code } = req.params
    if (!akshareSource.available()) return errMsg(res, 'AKShare 服务未就绪，无法拉取估值指标（请到设置页启用）')
    const r = await akshareSource.fetchers.indicator({ symbol: code })
    if (!r || !r.trade_date) return errMsg(res, 'akshare 估值指标返回空')
    const db = getDb()
    const now = nowLocal()
    db.prepare(`INSERT INTO stock_indicator
      (code, trade_date, pe_ttm, pb, ps, pcf, dividend_yield, updated_at)
      VALUES (?,?,?,?,?,?,?,?)
      ON CONFLICT(code) DO UPDATE SET
        trade_date=excluded.trade_date, pe_ttm=excluded.pe_ttm, pb=excluded.pb,
        ps=excluded.ps, pcf=excluded.pcf, dividend_yield=excluded.dividend_yield,
        updated_at=excluded.updated_at`)
      .run(code, r.trade_date, r.pe_ttm ?? null, r.pb ?? null, r.ps ?? null,
        r.pcf ?? null, r.dividend_yield ?? null, now)
    ok(res, r, '估值指标同步完成')
  } catch (e) { errMsg(res, e.message) }
})

// K线数据 — DolphinDB first，DolphinDB 覆盖不足/不可用时回退行情源网络直取。
// 架构说明：优先读 DB（daily_k 前复权 → daily_k_raw 不复权），两表均 miss 或 DDB
// 未连接时，为保证前端 K 线可显示，末级回退 aktools 多源（TDX→腾讯→东财）网络直取，
// 并把日K非阻塞回填 daily_k 供下次 DB 读命中。
// 健壮性：daily_k 查询限时 3s——该表若存在分区/副本问题会慢/挂起，超时视为 miss
// 直接走 daily_k_raw，避免拖死整条路由。
router.get('/:code/kline', async (req, res) => {
  try {
    const { code } = req.params
    const { period = 'daily', startDate, endDate, adjust = 'qfq' } = req.query

    // 日期全部归一为 ISO 后再比较/查询（见 normDateISO 注释）
    const today = new Date().toISOString().slice(0, 10)
    const effEnd = normDateISO(endDate, today)
    const effStart = normDateISO(startDate, DEFAULT_KLINE_START)

    const cacheKey = `stocks:kline:${code}:${period}:${adjust}:${effStart}:${effEnd}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    // 1. DolphinDB daily_k（前复权）— 3s 限时，慢则降级
    if (ddb.isConnected()) {
      try {
        const existing = (await withTimeout(klineRepo.getDailyK(code, effStart, effEnd), 3000)) || []
        const latest = existing.length ? existing.map(r => r['日期']).sort().pop() : null
        // 补齐缺口：8s 限时，返回「库内已有 merged 网络新数据」，插入非阻塞不回查
        if (latest && latest < effEnd) {
          const fetchStart = shiftDays(latest, -7)
          try {
            const raw = await withTimeout(
              aktools.getStockHistory({ symbol: code, period: 'daily', adjust, start_date: fetchStart, end_date: effEnd }),
              8000
            )
            if (raw && raw.length) {
              // 非阻塞回填，不阻塞响应
              klineRepo.insertDailyK(raw).catch(e => console.warn(`[stock] daily_k backfill failed(${code}):`, e.message))
              // 合并库内已有 + 新缺口，去重按日期排序直接返回
              const byDate = new Map()
              for (const r of existing) byDate.set(r['日期'], KLINE_ROW_MAP(r))
              for (const r of raw) byDate.set(r['日期'], KLINE_ROW_MAP(r))
              const merged = [...byDate.values()]
                .filter(r => r.date >= effStart && r.date <= effEnd)
                .sort((a, b) => (a.date < b.date ? -1 : 1))
              if (merged.length) {
                // 多周期：对齐按最近交易日聚合；daily 直接用合并行
                if (period !== 'daily') {
                  const agg = await withTimeout(klineRepo.getKlineAggregated(code, effStart, effEnd, period), 3000).catch(() => null)
                  if (agg && agg.length) {
                    const kline = agg.map(KLINE_ROW_MAP)
                    cache.set(cacheKey, kline, 300)
                    return ok(res, kline)
                  }
                }
                cache.set(cacheKey, merged, 300)
                return ok(res, merged)
              }
            }
          } catch (e) {
            if (e.retryAfterSec && existing.length) {
              const partial = existing.map(KLINE_ROW_MAP)
              return ok(res, partial, `部分数据（增量获取受限，约 ${e.retryAfterSec} 秒后可补齐）`)
            }
            console.warn(`[stock] kline 增量补齐失败(${code})，降级返回库内已有:`, e.message)
          }
        }
        // 库内已覆盖，直接返回（daily 或聚合）
        const all = await withTimeout(
          period === 'daily' ? Promise.resolve(existing) : klineRepo.getKlineAggregated(code, effStart, effEnd, period),
          3000
        )
        if (all && all.length) {
          const kline = all.map(KLINE_ROW_MAP)
          cache.set(cacheKey, kline, 300)
          return ok(res, kline)
        }
      } catch (e) {
        if (e.retryAfterSec) {
          return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
        }
        if (e.message !== 'timeout') console.error('[stock] DolphinDB daily_k query failed:', e.message)
      }
    }

    // 1b. 主表限时读取未命中或超时 → daily_k 全量直接查一遍（聚合周期需要）降级路径
    if (ddb.isConnected() && period !== 'daily') {
      try {
        const all = await withTimeout(klineRepo.getKlineAggregated(code, effStart, effEnd, period), 3000)
        if (all && all.length) {
          const kline = all.map(KLINE_ROW_MAP)
          cache.set(cacheKey, kline, 300)
          return ok(res, kline)
        }
      } catch (e) { if (e.message !== 'timeout') console.error('[stock] aggregated query failed:', e.message) }
    }

    // 2. daily_k 覆盖不足 → daily_k_raw 兜底（不复权，仅 8 列，限时 5s）
    //    raw 是 TDX 不复权价，与 daily_k 前复权口径不同，不与 daily_k 混算。
    //    缺 turnover_rate/pct_chg/amplitude 时前端按缺失渲染。
    if (ddb.isConnected()) {
      try {
        const raw = await withTimeout(klineRepo.getDailyKRaw(code, effStart, effEnd), 5000)
        if (raw && raw.length) {
          const kline = raw.map(KLINE_ROW_MAP)
          cache.set(cacheKey, kline, 300)
          return ok(res, kline, '成功(daily_k_raw 不复权兜底)')
        }
      } catch (e2) { if (e2.message !== 'timeout') console.error('[stock] daily_k_raw fallback failed:', e2.message) }
    }

    // 3. 网络兜底：DDB 未连接或两表均无数据 → aktools 多源直取，保证前端可显示。
    //    日K非阻塞回填 daily_k（DDB 可用时），下次请求命中 DB。
    try {
      const raw = await aktools.getStockHistory({ symbol: code, period, adjust, start_date: effStart, end_date: effEnd })
      if (raw && raw.length) {
        const kline = raw.map(KLINE_ROW_MAP)
        if (period === 'daily' && ddb.isConnected()) {
          klineRepo.insertDailyK(raw).catch(e => console.error('[stock] daily_k backfill failed:', e.message))
        }
        cache.set(cacheKey, kline, 300)
        return ok(res, kline)
      }
    } catch (e) {
      if (e.retryAfterSec) {
        return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
      }
      console.error('[stock] kline network fallback failed:', e.message)
    }

    // 4. 全部失败：按原因分级提示，避免"什么都不可用"这类无法操作的文案
    if (!ddb.isConnected()) {
      return res.json({ code: 503, msg: 'K线数据不可用：DolphinDB 未连接且行情源暂不可用，请确认 DolphinDB（默认 ws://127.0.0.1:8848）与数据源服务已启动', data: [] })
    }
    res.json({ code: 503, msg: `K线数据不可用：${code} 在 daily_k 与 daily_k_raw 均无数据，行情源也未返回（可能尚未下载该股的通达信日K，或区间内长期停牌）`, data: [] })
  } catch (e) {
    if (e.retryAfterSec) {
      return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    }
    errMsg(res, e.message)
  }
})

// 历史数据 — 已合并到 kline 端点（GET /:code/kline），此端点标记废弃
router.get('/:code/history', async (req, res) => {
  res.json({ code: 410, msg: '此端点已废弃，请使用 GET /api/stocks/:code/kline' })
})

module.exports = router
