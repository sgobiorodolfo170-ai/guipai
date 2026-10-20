'use strict'

/**
 * 收盘股票池同步任务 + 数据可视化查询路由（/api/market-sync）。
 *
 * 定位：收盘数据同步页的「股票池同步」。一次「开始」依次执行：
 *   涨停池 / 跌停池 → stock_limit_pool；板块行情 → plate_market_quotation；
 *   全市场实时行情快照 → stock_spot。
 *
 * 全市场个股日K 与指数日K 已迁出本模块（2026-10）：改由通达信官网数据包
 * （package-sync，收盘后 18:10 自动同步）写入 daily_k_raw / stock_zh_index_daily，
 * 不再逐只调用行情源，避免把全市场同步变成对上游接口的压测。
 * 本模块的完整性/验证统计读取 daily_k_raw（不复权基线）。
 *
 * 设计要点：
 *   - 内存态单飞任务：同一时刻只允许一个同步任务在跑。
 *   - 进度实时暴露给前端轮询（/status）；各池并入同一任务，页面统一展示。
 *   - 数据可视化：/completeness（逐日覆盖 + 按市场拆分 + 收盘池存在性）、
 *     /validate（日K异常分类计数）。
 */

const express = require('express')
const aktools = require('./aktools')
const converter = require('./converter')
const cache = require('./cache')
const ddb = require('../dolphindb/client')
const { safeDate } = require('../dolphindb/params')
const { _COLS_MAP, normDate } = require('./col-defs')
const { getDb } = require('./db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const DB = 'dfs://tradeinsight'
/** 全市场日K基线（由通达信数据包写入，本模块只读） */
const RAW_TBL = `loadTable("dfs://tradeinsight_raw", "daily_k_raw")`
/**
 * A 股口径过滤：raw 历史数据里混有基金/债券（15/16/50/51/52/56/58/11/12/13 等前缀），
 * 统计覆盖率时只算 A 股，避免旧日期覆盖数虚高（旧口径约 8100 行/日，A 股约 5500 只）。
 * 覆盖：沪市 6xxxxx、深市 00/30、北交所 43/83/87/88/92。
 */
const A_SHARE_FILTER = '(symbol like "6%" or symbol like "0%" or symbol like "3%" or symbol like "4%" or symbol like "8%" or symbol like "92%")'

/** Date → 本地 ISO 日期（YYYY-MM-DD） */
function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 今日 ISO 日期（YYYY-MM-DD，本地时区；避免 toISOString 在东八区 0-8 点回退一天） */
function todayISO() {
  return ymd(new Date())
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
  pools: { limit_up: null, limit_down: null, plate: null, spot: null },
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
    pools: state.pools,
    startedAt: state.startedAt,
    updatedAt: state.updatedAt,
    stopRequested: state.stopRequested,
    message: state.message,
    lastCompleted: state.lastCompleted,
    history: state.history
  }
}

// ---- 收盘股票池 ----

const POOL_PHASES = [
  { phase: 'limit_up', label: '涨停池', table: 'stock_limit_pool', dataType: 'LIMIT_UP' },
  { phase: 'limit_down', label: '跌停池', table: 'stock_limit_pool', dataType: 'LIMIT_DOWN' },
  { phase: 'plate', label: '板块行情', table: 'plate_market_quotation', dataType: null },
  { phase: 'spot', label: '全市场实时行情', table: 'stock_spot', dataType: null }
]

/** 某类收盘数据当日是否已存在的计数 SQL（d 为 DolphinDB 日期字面量 YYYY.MM.DD） */
function existCheckSql(phase, d) {
  switch (phase) {
    case 'limit_up': return `select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_UP'`
    case 'limit_down': return `select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_DOWN'`
    case 'plate': return `select count(*) as c from loadTable("${DB}", "plate_market_quotation") where trade_date=${d}`
    case 'spot': return `select count(*) as c from loadTable("${DB}", "stock_spot") where trade_date=${d}`
    default: return null
  }
}

/**
 * 同步单个收盘数据项。已存在（且非 force）时跳过；写入前先删当日，保证幂等。
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
    } else if (p.phase === 'spot') {
      const raw = await aktools.getStockSpot()
      rows = converter.convertSpot(raw, dateStr)
    }
  } catch (e) {
    return { status: 'error', rows: 0, message: e.message }
  }
  if (!rows.length) return { status: 'empty', rows: 0, message: '未获取到数据（可能非交易日）' }

  const now = new Date()
  rows.forEach(r => {
    r.trade_date = normDate(r.trade_date) || dateStr
    r.create_time = now
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

/** 收盘数据阶段（串行执行，各自独立计数）。 */
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

function poolsSummary() {
  return POOL_PHASES.map((p) => {
    const r = state.pools[p.phase]
    if (!r) return `${p.label} 未执行`
    if (r.status === 'ok') return `${p.label} ${r.rows} 行`
    if (r.status === 'skipped') return `${p.label} 已存在`
    if (r.status === 'empty') return `${p.label} 无数据`
    return `${p.label} 失败`
  }).join('，')
}

function commitSummary(message) {
  state.running = false
  const summary = {
    endedAt: new Date(),
    date: state.date,
    pools: state.pools,
    message: message || state.message
  }
  state.lastCompleted = summary
  state.history.unshift(summary)
  if (state.history.length > 10) state.history.length = 10
}

// ---- 路由：任务控制 ----

/**
 * POST /api/market-sync/start  body: { date?, force? }
 * 启动收盘股票池同步（单飞）。返回 { started, date }。
 */
router.post('/start', async (req, res) => {
  try {
    if (state.running) return errMsg(res, '已有同步任务在执行中，请等待完成后再试')
    const b = req.body || {}
    const dateStr = b.date ? normDate(b.date) : todayISO()
    if (!dateStr || !safeDate(dateStr)) return errMsg(res, '日期格式应为 YYYY-MM-DD')
    if (!ddb.isConnected()) return errMsg(res, 'DolphinDB 未连接，无法写入。请先在本页连接后再同步')

    state.running = true
    state.phase = null
    state.phaseLabel = ''
    state.date = dateStr
    state.pools = { limit_up: null, limit_down: null, plate: null, spot: null }
    state.startedAt = new Date()
    state.updatedAt = state.startedAt
    state.stopRequested = false
    state.message = ''

    // 后台执行，不阻塞响应
    runPools(dateStr, b.force === true)
      .then(() => {
        commitSummary(state.stopRequested ? '已停止：' + poolsSummary() : '完成：' + poolsSummary())
      })
      .catch((e) => {
        commitSummary('任务中断: ' + e.message)
      })

    ok(res, { started: true, date: dateStr }, `收盘数据同步已启动：${dateStr}`)
  } catch (e) { errMsg(res, e.message) }
})

/** POST /api/market-sync/stop —— 优雅停止（当前阶段结束后置停顿）。 */
router.post('/stop', (req, res) => {
  if (!state.running) return ok(res, { stopped: false }, '当前没有运行中的任务')
  state.stopRequested = true
  ok(res, { stopped: true }, '将在当前阶段结束后停止')
})

/** GET /api/market-sync/status —— 任务进度 + daily_k_raw 存储概况（前端轮询）。 */
router.get('/status', async (req, res) => {
  try {
    const elapsedSec = state.startedAt
      ? Math.max((Date.now() - new Date(state.startedAt).getTime()) / 1000, 0)
      : 0
    const donePhases = POOL_PHASES.filter(p => state.pools[p.phase]).length
    const percent = state.running ? Math.round((donePhases / POOL_PHASES.length) * 100) : (state.lastCompleted ? 100 : 0)

    const ddbInfo = { connected: ddb.isConnected(), totalRows: 0, totalSymbols: 0, latestDate: null }
    if (ddbInfo.connected) {
      try {
        const r = await ddb.execute(`select count(*) as totalRows, max(trade_date) as latestDate from ${RAW_TBL}`)
        const rows = rowsOf(r)
        if (rows.length) {
          ddbInfo.totalRows = Number(rows[0].totalRows) || 0
          ddbInfo.latestDate = rows[0].latestDate ? String(rows[0].latestDate).replace(/\./g, '-') : null
        }
      } catch (_) { /* 单表查询失败不影响进度返回 */ }
      try {
        ddbInfo.totalSymbols = getDb().prepare('SELECT COUNT(*) AS c FROM stock_basic').get()?.c || 0
      } catch (_) { /* stock_basic 未就绪 */ }
    }

    ok(res, {
      ...stateSnapshot(),
      ddb: ddbInfo,
      rate: 0,
      etaSec: 0,
      percent,
      elapsedSec: Math.round(elapsedSec)
    })
  } catch (e) { errMsg(res, e.message) }
})

// ---- 路由：数据可视化 ----

/**
 * GET /api/market-sync/completeness?days=10&date=
 * 数据完整性：近 N 天 daily_k_raw 逐日覆盖（股票数 vs 全市场总数）；
 * 指定日期（默认今日）按市场分类覆盖拆分；收盘股票池当日存在性。
 */
router.get('/completeness', async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 10, 1), 30)
    const date = normDate(req.query.date) || todayISO()

    let expected = 0
    let universeSource = 'stock_basic'
    try { expected = getDb().prepare('SELECT COUNT(*) AS c FROM stock_basic').get()?.c || 0 } catch (_) { /* stock_basic 未就绪 */ }

    // 近 N 个自然日（倒序，本地时区）→ 逐日覆盖
    const list = []
    for (let i = 0; i < days; i++) { const d = new Date(); d.setDate(d.getDate() - i); list.push(ymd(d)) }
    const from = list[list.length - 1]
    const counts = new Map()
    if (ddb.isConnected()) {
      try {
        const r = await ddb.execute(`select trade_date, count(*) as c from ${RAW_TBL} where trade_date >= ${safeDate(from)} and ${A_SHARE_FILTER} group by trade_date`)
        for (const row of rowsOf(r)) counts.set(normDate(row.trade_date), Number(row.c) || 0)
      } catch (_) { /* 查询失败 → 全部按 0 */ }
    }
    // stock_basic 未同步（新库/未点「同步股票列表」）时，用窗口内已覆盖峰值估算分母，
    // 否则覆盖率恒为 0；前端会注明这是估算值。
    if (!expected) {
      const peak = Math.max(0, ...list.map(d => counts.get(d) || 0))
      if (peak > 0) { expected = peak; universeSource = 'recent_peak' }
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
      try { for (const r of rowsOf(await ddb.execute(`select symbol from ${RAW_TBL} where trade_date=${safeDate(date)}`))) covered.add(String(r.symbol)) } catch (_) { /* 单日查询失败 */ }
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

    // 收盘股票池当日存在性
    const pools = { limitUp: 0, limitDown: 0, plate: 0 }
    if (ddb.isConnected()) {
      const d = safeDate(date)
      try { pools.limitUp = await ddb.count(`select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_UP'`) } catch (_) { }
      try { pools.limitDown = await ddb.count(`select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${d} and data_type='LIMIT_DOWN'`) } catch (_) { }
      try { pools.plate = await ddb.count(`select count(*) as c from loadTable("${DB}", "plate_market_quotation") where trade_date=${d}`) } catch (_) { }
    }

    ok(res, { date, days, expected, universeSource, byDate, marketBreakdown, pools })
  } catch (e) { errMsg(res, e.message) }
})

/**
 * GET /api/market-sync/validate?date=
 * 数据验证：当日 daily_k_raw 异常分类计数（OHLC 逻辑冲突 / 非正价格 / 成交量 / 成交额）。
 * 注意：raw 表不含 pct_chg，涨跌幅缺失检查不再适用。
 */
router.get('/validate', async (req, res) => {
  try {
    const date = normDate(req.query.date) || todayISO()
    const d = safeDate(date)
    if (!d) return errMsg(res, '日期格式应为 YYYY-MM-DD')
    if (!ddb.isConnected()) return ok(res, { date, connected: false, message: 'DolphinDB 未连接，无法校验' })

    const total = await ddb.count(`select count(*) as c from ${RAW_TBL} where trade_date=${d}`)

    const checkDefs = [
      { key: 'high_lt_low', label: '最高 < 最低', sql: 'high < low' },
      { key: 'high_lt_oc', label: '最高 < 开盘/收盘', sql: 'high < open or high < close' },
      { key: 'low_gt_oc', label: '最低 > 开盘/收盘', sql: 'low > open or low > close' },
      { key: 'close_le_zero', label: '收盘 ≤ 0', sql: 'close <= 0' },
      { key: 'open_le_zero', label: '开盘 ≤ 0', sql: 'open <= 0' },
      { key: 'volume_lt_zero', label: '成交量 < 0', sql: 'volume < 0' },
      { key: 'amount_null', label: '成交额缺失/为负', sql: 'amount is null or amount < 0' }
    ]
    const checks = []
    for (const c of checkDefs) {
      try {
        checks.push({ key: c.key, label: c.label, count: await ddb.count(`select count(*) as c from ${RAW_TBL} where trade_date=${d} and ${c.sql}`) })
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
