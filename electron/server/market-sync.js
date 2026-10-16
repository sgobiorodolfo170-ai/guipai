'use strict'

/**
 * 全市场数据同步任务 + 数据可视化查询路由（/api/market-sync）。
 *
 * 定位：收盘数据同步页的「全市场数据同步」。一次「开始」依次执行：
 *   1. 全市场个股日K —— 逐只拉当日/所选日期K线（前复权），写入 DolphinDB daily_k（幂等）。
 *   2. 四类收盘数据 —— 涨停池 / 跌停池 → stock_limit_pool；板块行情 → plate_market_quotation；
 *      指数日K（000001/399001/399006）→ stock_zh_index_daily。
 *
 * 设计要点：
 *   - 内存态单飞任务：同一时刻只允许一个全市场任务在跑（并发重复会加倍压行情源）。
 *   - 日K阶段并发池可配（默认 3，上限 8），每只独立计数；连续触发行情源限流（retryAfterSec）
 *     达阈值后优雅暂停并上报，避免把全市场同步变成对上游的压测。
 *   - 进度实时暴露给前端轮询（/status）；四类收盘数据并入同一任务，页面统一展示。
 *   - 数据可视化：/completeness（完整性：逐日覆盖 + 按市场拆分 + 四类收盘存在性）、
 *     /validate（数据验证：日K异常分类计数）。
 */

const express = require('express')
const aktools = require('./aktools')
const converter = require('./converter')
const cache = require('./cache')
const ddb = require('../dolphindb/client')
const klineRepo = require('../dolphindb/kline-repository')
const { safeDate } = require('../dolphindb/params')
const { _COLS_MAP, normDate } = require('./col-defs')
const { getDb } = require('./db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const DB = 'dfs://tradeinsight'
const MAX_CONCURRENCY = 8
const MAX_CONSECUTIVE_RATE_LIMIT = 20 // 连续 N 只触发限流即暂停，避免压源

/** 今日 ISO 日期（YYYY-MM-DD） */
function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** 归一化 DolphinDB 返回的任意结果形状 → 行对象数组 */
function rowsOf(r) {
  if (Array.isArray(r)) return r
  if (r && r.rows && r.columns) return r.rows.map(x => { const o = {}; r.columns.forEach((c, i) => { o[c] = x[i] }); return o })
  if (r && typeof r === 'object') {
    const ks = Object.keys(r)
    if (ks.length && Array.isArray(r[ks[0]])) {
      const n = r[ks[0]].length
      const out = []
      for (let i = 0; i < n; i++) { const o = {}; ks.forEach(k => { o[k] = r[k][i] }); out.push(o) }
      return out
    }
  }
  return []
}

// ---- 任务状态（内存态，单飞） ----

const state = {
  running: false,
  phase: null,
  phaseLabel: '',
  date: null,
  adjust: 'qfq',
  concurrency: 3,
  includePools: true,
  total: 0,
  done: 0,
  ok: 0,
  empty: 0,
  error: 0,
  rows: 0,
  pools: { limit_up: null, limit_down: null, plate: null, index: null },
  startedAt: null,
  updatedAt: null,
  stopRequested: false,
  message: '',
  lastCompleted: null,
  history: []
}

function stateSnapshot() {
  return {
    running: state.running,
    phase: state.phase,
    phaseLabel: state.phaseLabel,
    date: state.date,
    adjust: state.adjust,
    concurrency: state.concurrency,
    includePools: state.includePools,
    total: state.total,
    done: state.done,
    ok: state.ok,
    empty: state.empty,
    error: state.error,
    rows: state.rows,
    pools: state.pools,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
    stopRequested: state.stopRequested,
    message: state.message,
    lastCompleted: state.lastCompleted,
    history: state.history
  }
}

// ---- 股票池 ----

/** 全市场股票代码列表：优先 sql.js stock_basic；为空则回退行情源全市场 spot。 */
async function stockUniverse() {
  try {
    const rows = getDb().prepare('SELECT code FROM stock_basic').all()
    const codes = rows.map(r => String(r.code || '').trim()).filter(c => /^\d{6}$/.test(c))
    if (codes.length) return codes
  } catch (_) { /* stock_basic 表未就绪 → 走行情源兜底 */ }
  const spot = await aktools.getStockSpot()
  return (spot || []).map(s => String(s['代码'] || '').trim()).filter(c => /^\d{6}$/.test(c))
}

// ---- 四类收盘数据 ----

const POOL_PHASES = [
  { phase: 'limit_up', label: '涨停池', table: 'stock_limit_pool', dataType: 'LIMIT_UP' },
  { phase: 'limit_down', label: '跌停池', table: 'stock_limit_pool', dataType: 'LIMIT_DOWN' },
  { phase: 'plate', label: '板块行情', table: 'plate_market_quotation', dataType: null },
  { phase: 'index', label: '指数日K', table: 'stock_zh_index_daily', dataType: null }
]

/** 某类收盘数据当日是否已存在的计数 SQL（d 为 DolphinDB 日期字面量 YYYY.MM.DD） */
function existCheckSql(phase, d) {
  switch (phase) {
    case 'limit_up': return `select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_UP'`
    case 'limit_down': return `select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_DOWN'`
    case 'plate': return `select count(*) as c from loadTable("${DB}", "plate_market_quotation") where trade_date=${d}`
    case 'index': return `select count(*) as c from loadTable("${DB}", "stock_zh_index_daily") where trade_date=${d}`
    default: return null
  }
}

/**
 * 同步单个四类收盘数据项。已存在（且非 force）时跳过；写入前先删当日，保证幂等。
 * @returns { status:'ok'|'skipped'|'empty'|'error', rows, message }
 */
async function syncPool(p, dateStr, force = false) {
  const d = safeDate(dateStr)
  const compact = String(dateStr).replace(/-/g, '')
  const existSql = existCheckSql(p.phase, d)
  if (!force && existSql) {
    const c = await ddb.count(existSql)
    if (c > 0) return { status: 'skipped', rows: 0, message: '当日数据已存在' }
  }
  let rows = []
  try {
    if (p.dataType) {
      const raw = p.dataType === 'LIMIT_UP' ? await aktools.getStockLimitPool(compact) : await aktools.getStockDropPool(compact)
      rows = converter.convertStockLimitPool(raw, dateStr, p.dataType)
    } else if (p.phase === 'plate') {
      const raw = await aktools.getStockIndustry()
      rows = converter.convertPlateMarket(raw, dateStr)
    } else if (p.phase === 'index') {
      const indices = ['000001', '399001', '399006']
      const all = []
      for (const sym of indices) {
        const dta = await aktools.getIndexDailyData({ symbol: sym, start_date: compact, end_date: compact })
        all.push(...converter.convertIndexDaily(dta, sym))
      }
      rows = all
    }
  } catch (e) {
    return { status: 'error', rows: 0, message: e.message }
  }
  if (!rows.length) return { status: 'empty', rows: 0, message: '未获取到数据（可能非交易日）' }

  const now = new Date()
  rows.forEach(r => {
    r.trade_date = normDate(r.trade_date) || dateStr
    r.create_time = now
    if (p.phase === 'index') r.update_time = now
  })
  // 先删当日对应数据再插入（幂等，force 语义自然成立）
  const where = p.dataType
    ? `trade_date=${d} and data_type='${p.dataType}'`
    : `trade_date=${d}`
  await ddb.execute(`t = loadTable("${DB}", "${p.table}"); delete from t where ${where}`)
  await ddb.insertRows(p.table, _COLS_MAP[p.table], rows)
  // 当日统计缓存失效，让复盘/涨跌停页读到新数据
  cache.delByPattern(`stats:*${dateStr}*`)
  return { status: 'ok', rows: rows.length, message: `写入 ${rows.length} 行` }
}

/** 供外部（e2e 等）按 dataType 直调单项收盘同步。 */
async function syncPoolByType(dateStr, dataType, force = false) {
  const p = POOL_PHASES.find(x => x.dataType === dataType || (dataType && x.phase === String(dataType).toLowerCase()))
  if (!p) throw new Error('未知数据类型: ' + dataType)
  return await syncPool(p, dateStr, force)
}

// ---- 全市场个股日K ----

/**
 * 并发池逐只同步日K：getStockHistory(当日) → klineRepo.insertDailyK（幂等）。
 * 计数写 state；连续限流达阈值则置 stopRequested 优雅暂停。
 */
async function runDailyK(codes, dateStr) {
  const adjust = state.adjust
  const concurrency = state.concurrency
  let idx = 0
  let consecutiveFail = 0

  const worker = async () => {
    while (!state.stopRequested) {
      const i = idx++
      if (i >= codes.length) return
      const code = codes[i]
      try {
        const raw = await aktools.getStockHistory({ symbol: code, period: 'daily', start_date: dateStr, end_date: dateStr, adjust })
        if (!raw || !raw.length) {
          state.empty++
        } else {
          const written = await klineRepo.insertDailyK(raw)
          if (written > 0) { state.ok++; state.rows += written }
          else state.error++
        }
        consecutiveFail = 0
      } catch (e) {
        state.error++
        if (e.retryAfterSec) {
          consecutiveFail++
          if (consecutiveFail >= MAX_CONSECUTIVE_RATE_LIMIT) {
            state.stopRequested = true
            state.message = `连续 ${consecutiveFail} 只触发行情源限流（约 ${e.retryAfterSec}s 后可恢复），已自动暂停。恢复后再点「开始同步」续拉，已完成的股票不会重复写入。`
          }
        } else {
          consecutiveFail = 0
        }
      }
      state.done++
      state.updatedAt = new Date()
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker())
  await Promise.all(workers)
}

/** 四类收盘数据阶段（串行执行，各自独立计数）。 */
async function runPools(dateStr, force) {
  for (const p of POOL_PHASES) {
    if (state.stopRequested) return
    state.phase = p.phase
    state.phaseLabel = p.label
    state.updatedAt = new Date()
    const r = await syncPool(p, dateStr, force)
    state.pools[p.phase] = { status: r.status, rows: r.rows, message: r.message }
  }
  state.phase = null
  state.phaseLabel = ''
}

/** 任务编排：日K → 四类收盘。 */
async function runTask(codes, dateStr, force) {
  await runDailyK(codes, dateStr)
  if (state.stopRequested) return
  if (state.includePools) await runPools(dateStr, force)
}

function commitSummary(message) {
  state.running = false
  const summary = {
    endedAt: new Date(),
    date: state.date,
    total: state.total,
    ok: state.ok,
    empty: state.empty,
    error: state.error,
    rows: state.rows,
    pools: state.pools,
    message: message || state.message
  }
  state.lastCompleted = summary
  state.history.unshift(summary)
  if (state.history.length > 10) state.history.length = 10
}

// ---- 路由：任务控制 ----

/**
 * POST /api/market-sync/start  body: { date?, adjust?, concurrency?, includePools?, force? }
 * 启动全市场同步（单飞）。返回 { started, total, date }。
 */
router.post('/start', async (req, res) => {
  try {
    if (state.running) return errMsg(res, '已有全市场同步任务在执行中，请等待完成后再试')
    const b = req.body || {}
    const dateStr = b.date ? normDate(b.date) : todayISO()
    if (!dateStr || !safeDate(dateStr)) return errMsg(res, '日期格式应为 YYYY-MM-DD')
    if (!ddb.isConnected()) return errMsg(res, 'DolphinDB 未连接，无法写入。请先在本页连接后再同步')

    const codes = await stockUniverse()
    if (!codes.length) return errMsg(res, '未获取到股票列表（stock_basic 为空且行情源不可用），请先在数据总览同步股票基础信息')

    state.running = true
    state.phase = 'daily_k'
    state.phaseLabel = '全市场个股日K'
    state.date = dateStr
    state.adjust = b.adjust === 'hfq' ? 'hfq' : 'qfq'
    state.concurrency = Math.min(Math.max(Number(b.concurrency) || 3, 1), MAX_CONCURRENCY)
    state.includePools = b.includePools !== false
    state.total = codes.length
    state.done = 0
    state.ok = 0
    state.empty = 0
    state.error = 0
    state.rows = 0
    state.pools = { limit_up: null, limit_down: null, plate: null, index: null }
    state.startedAt = new Date()
    state.updatedAt = state.startedAt
    state.stopRequested = false
    state.message = ''

    // 后台执行，不阻塞响应
    runTask(codes, dateStr, b.force === true)
      .then(() => {
        const stopped = state.stopRequested
        commitSummary(stopped ? `已停止（${state.done}/${state.total}）` : `完成：成功 ${state.ok}、无数据 ${state.empty}、失败 ${state.error}，写入 ${state.rows} 行`)
      })
      .catch((e) => {
        commitSummary('任务中断: ' + e.message)
      })

    ok(res, { started: true, total: codes.length, date: dateStr }, `全市场同步已启动：${codes.length} 只股票 × ${dateStr}`)
  } catch (e) { errMsg(res, e.message) }
})

/** POST /api/market-sync/stop —— 优雅停止（当前批次结束后置停顿）。 */
router.post('/stop', (req, res) => {
  if (!state.running) return ok(res, { stopped: false }, '当前没有运行中的任务')
  state.stopRequested = true
  ok(res, { stopped: true }, '将在当前批次结束后停止')
})

/** GET /api/market-sync/status —— 任务进度 + daily_k 存储概况（前端轮询）。 */
router.get('/status', async (req, res) => {
  try {
    const elapsedSec = state.startedAt
      ? Math.max((Date.now() - new Date(state.startedAt).getTime()) / 1000, 0)
      : 0
    const rate = elapsedSec > 0 && state.done > 0 ? state.done / elapsedSec : 0
    const etaSec = state.running && rate > 0 ? Math.round((state.total - state.done) / rate) : 0
    const percent = state.total > 0 ? Math.round((state.done / state.total) * 100) : 0

    const ddbInfo = { connected: ddb.isConnected(), totalRows: 0, totalSymbols: 0, latestDate: null }
    if (ddbInfo.connected) {
      try {
        const r = await ddb.execute(`select count(*) as totalRows, max(trade_date) as latestDate from loadTable("${DB}", "daily_k")`)
        const rows = rowsOf(r)
        if (rows.length) {
          ddbInfo.totalRows = Number(rows[0].totalRows) || 0
          ddbInfo.latestDate = rows[0].latestDate ? String(rows[0].latestDate).replace(/\./g, '-') : null
        }
      } catch (_) { /* 单表查询失败不影响进度返回 */ }
      try {
        const g = await ddb.execute(`select count(*) as c from loadTable("${DB}", "daily_k") group by symbol`)
        ddbInfo.totalSymbols = Array.isArray(g) ? g.length : 0
      } catch (_) { /* 同上 */ }
    }

    ok(res, {
      ...stateSnapshot(),
      ddb: ddbInfo,
      rate: +rate.toFixed(2),
      etaSec,
      percent,
      elapsedSec: Math.round(elapsedSec)
    })
  } catch (e) { errMsg(res, e.message) }
})

// ---- 路由：数据可视化 ----

/**
 * GET /api/market-sync/completeness?days=10&date=
 * 数据完整性：近 N 天 daily_k 逐日覆盖（股票数 vs 全市场总数）；
 * 指定日期（默认最新交易日）按市场分类覆盖拆分；四类收盘数据当日存在性。
 */
router.get('/completeness', async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 10, 1), 30)
    const date = normDate(req.query.date) || todayISO()

    let expected = 0
    try { expected = getDb().prepare('SELECT COUNT(*) AS c FROM stock_basic').get()?.c || 0 } catch (_) { /* stock_basic 未就绪 */ }

    // 近 N 个自然日（倒序）→ 逐日覆盖
    const list = []
    for (let i = 0; i < days; i++) { const d = new Date(); d.setDate(d.getDate() - i); list.push(d.toISOString().slice(0, 10)) }
    const from = list[list.length - 1]
    const counts = new Map()
    if (ddb.isConnected()) {
      try {
        const r = await ddb.execute(`select trade_date, count(*) as c from loadTable("${DB}", "daily_k") where trade_date >= ${safeDate(from)} group by trade_date`)
        for (const row of rowsOf(r)) counts.set(normDate(row.trade_date), Number(row.c) || 0)
      } catch (_) { /* 查询失败 → 全部按 0 */ }
    }
    const byDate = list.map(d => {
      const covered = counts.get(d) || 0
      return { date: d, covered, expected, percent: expected > 0 ? Math.round((covered / expected) * 100) : 0 }
    })

    // 按市场分类覆盖拆分（sql.js market ↔ DDB symbol 在 JS 侧 join）
    let marketBreakdown = []
    if (ddb.isConnected()) {
      const marketOf = new Map()
      try { for (const r of getDb().prepare('SELECT code, market FROM stock_basic').all()) marketOf.set(r.code, r.market) } catch (_) { /* stock_basic 未就绪 */ }
      const covered = new Set()
      try { for (const r of rowsOf(await ddb.execute(`select symbol from loadTable("${DB}", "daily_k") where trade_date=${safeDate(date)}`))) covered.add(String(r.symbol)) } catch (_) { /* 单日查询失败 */ }
      const agg = {}
      for (const [code, market] of marketOf) {
        if (!market) continue
        agg[market] = agg[market] || { market, total: 0, covered: 0 }
        agg[market].total++
        if (covered.has(code)) agg[market].covered++
      }
      marketBreakdown = Object.values(agg).map(m => ({
        market: m.market,
        total: m.total,
        covered: m.covered,
        missing: m.total - m.covered,
        percent: m.total > 0 ? Math.round((m.covered / m.total) * 100) : 0
      }))
    }

    // 四类收盘数据当日存在性
    const pools = { limitUp: 0, limitDown: 0, plate: 0, index: 0 }
    if (ddb.isConnected()) {
      const d = safeDate(date)
      try { pools.limitUp = await ddb.count(`select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_UP'`) } catch (_) { }
      try { pools.limitDown = await ddb.count(`select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_DOWN'`) } catch (_) { }
      try { pools.plate = await ddb.count(`select count(*) as c from loadTable("${DB}", "plate_market_quotation") where trade_date=${d}`) } catch (_) { }
      try { pools.index = await ddb.count(`select count(*) as c from loadTable("${DB}", "stock_zh_index_daily") where trade_date=${d}`) } catch (_) { }
    }

    ok(res, { date, days, expected, byDate, marketBreakdown, pools })
  } catch (e) { errMsg(res, e.message) }
})

/**
 * GET /api/market-sync/validate?date=
 * 数据验证：当日 daily_k 异常分类计数（OHLC 逻辑冲突 / 非正价格 / 成交量 / 字段缺失）。
 */
router.get('/validate', async (req, res) => {
  try {
    const date = normDate(req.query.date) || todayISO()
    const d = safeDate(date)
    if (!d) return errMsg(res, '日期格式应为 YYYY-MM-DD')
    if (!ddb.isConnected()) return ok(res, { date, connected: false, message: 'DolphinDB 未连接，无法校验' })

    const dailyT = `loadTable("${DB}", "daily_k")`
    const total = await ddb.count(`select count(*) as c from ${dailyT} where trade_date=${d}`)

    const checkDefs = [
      { key: 'high_lt_low', label: '最高 < 最低', sql: 'high < low' },
      { key: 'high_lt_oc', label: '最高 < 开盘/收盘', sql: 'high < open or high < close' },
      { key: 'low_gt_oc', label: '最低 > 开盘/收盘', sql: 'low > open or low > close' },
      { key: 'close_le_zero', label: '收盘 ≤ 0', sql: 'close <= 0' },
      { key: 'open_le_zero', label: '开盘 ≤ 0', sql: 'open <= 0' },
      { key: 'volume_lt_zero', label: '成交量 < 0', sql: 'volume < 0' },
      { key: 'pct_chg_null', label: '涨跌幅缺失', sql: 'pct_chg is null' },
      { key: 'amount_null', label: '成交额缺失/为负', sql: 'amount is null or amount < 0' }
    ]
    const checks = []
    for (const c of checkDefs) {
      try {
        checks.push({ key: c.key, label: c.label, count: await ddb.count(`select count(*) as c from ${dailyT} where trade_date=${d} and ${c.sql}`) })
      } catch (e) {
        checks.push({ key: c.key, label: c.label, count: 0, error: e.message })
      }
    }
    const issues = checks.reduce((s, r) => s + (r.count || 0), 0)
    ok(res, {
      date,
      connected: true,
      total,
      issues,
      rate: total > 0 ? +((issues / total) * 100).toFixed(2) : 0,
      checks
    })
  } catch (e) { errMsg(res, e.message) }
})

module.exports = { router, syncPoolByType, state }
