'use strict'

/**
 * 通达信数据包同步路由（/api/package-sync）+ 定时调度。
 *
 * 与 market-sync 的分工：
 *   - market-sync：盘中/收盘的「股票池」同步（涨停池、板块行情、快照）；
 *   - package-sync：收盘后从通达信官网数据包补「全市场日K + 指数 + 季度财报」，
 *     不再逐只走行情源，避免把全市场日K变成对上游接口的压测。
 *
 * 触发策略（用户确认）：
 *   - 18:10 定时：当日个股日K（g3day）+ 三大指数；
 *   - 启动补跑：回溯最近 5 个交易日，只补 daily_k_raw 缺失的日期；
 *   - 财务：距上次成功导入 ≥30 天时随收盘任务执行（整包 546MB，不每天下）。
 *
 * 前端只读 /status 轮询；/start /stop /connect 为手动兜底。
 */

const express = require('express')
const fs = require('fs')
const path = require('path')

const importer = require('../dolphindb/package-import')
const ddb = require('../dolphindb/client')
const { getDataDir } = require('./db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const DAILY_HOUR = 18
const DAILY_MINUTE = 10
const TICK_MS = 10 * 60 * 1000
const FINANCIAL_INTERVAL_DAYS = 30
const STARTUP_DELAY_MS = 8000
const LOG_LIMIT = 200

const state = {
  running: false,
  stopRequested: false,
  phase: '',
  percent: 0,
  message: '',
  startedAt: null,
  updatedAt: null,
  lastResult: null,
  log: []
}

let timer = null
let startupTimer = null
let runningPromise = null

function nowISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function pushLog(level, text) {
  state.log.push({ ts: new Date().toISOString(), level, text: String(text) })
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT)
  state.updatedAt = new Date().toISOString()
}

function setProgress(p) {
  if (p.phase) state.phase = p.phase
  if (typeof p.percent === 'number') state.percent = p.percent
  state.updatedAt = new Date().toISOString()
}

function financialStatePath() {
  const dataDir = getDataDir()
  return dataDir ? path.join(path.dirname(dataDir), 'tdx-packages', 'financial-state.json') : null
}

function readFinancialState() {
  const p = financialStatePath()
  if (!p || !fs.existsSync(p)) return {}
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch (_) { return {} }
}

function writeFinancialState(patch) {
  const p = financialStatePath()
  if (!p) return
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, JSON.stringify({ ...readFinancialState(), ...patch }, null, 2))
  } catch (_) { /* 状态文件写失败不影响主流程 */ }
}

/** 最近 N 日 daily_k_raw 覆盖（限制日期范围，走日期分区裁剪） */
async function recentCoverage(days = 10) {
  if (!ddb.isConnected()) return []
  const from = new Date()
  from.setDate(from.getDate() - days * 2)
  const start = `${from.getFullYear()}.${String(from.getMonth() + 1).padStart(2, '0')}.${String(from.getDate()).padStart(2, '0')}`
  // 只统计 A 股：历史 raw 中还混有基金/债券（15/16/50/51 等前缀），不与当前口径混算
  const r = await ddb.execute(
    `select trade_date, count(*) as cnt from loadTable("${importer.RAW_DB}", "daily_k_raw") ` +
    `where trade_date>=${start} and (symbol like "6%" or symbol like "0%" or symbol like "3%" or symbol like "4%" or symbol like "8%" or symbol like "92%") ` +
    `group by trade_date order by trade_date desc`
  )
  const rows = importer.rowsOf(r)
  return rows.slice(0, 10).map(x => ({ date: String(x.trade_date).replace(/\./g, '-').slice(0, 10), count: Number(x.cnt) }))
}

async function dailyExists(dateISO) {
  try {
    return (await importer.countRawDate(dateISO)) > 0
  } catch (_) {
    return false
  }
}

/** 财务是否需要更新（30 天窗口由调用方判定，这里只给数据） */
function financialDue() {
  const st = readFinancialState()
  if (!st.lastSuccess) return true
  const days = (Date.now() - Date.parse(st.lastSuccess)) / 86400000
  return days >= FINANCIAL_INTERVAL_DAYS
}

async function runFinancial() {
  setProgress({ phase: '导入季度财报', percent: 0 })
  const r = await importer.importFinancial({
    onProgress: setProgress
  })
  writeFinancialState({ lastSuccess: new Date().toISOString(), lastResult: r })
  pushLog('info', `财报导入完成：${r.files} 个季度 / ${r.rows} 行${r.errors.length ? `，跳过 ${r.errors.length} 个季度` : ''}`)
  for (const e of r.errors.slice(0, 5)) pushLog('warn', `财报跳过 ${e.quarter}: ${e.error}`)
  return r
}

/**
 * 执行一次收盘同步：先补日K，再按 30 天窗口补财务。
 * @param {string[]} dates 需要同步的交易日（升序）
 */
async function runBatch(dates, { force = false, financial = true } = {}) {
  const list = (dates || []).slice().sort()

  state.running = true
  state.stopRequested = false
  state.startedAt = new Date().toISOString()
  state.lastResult = null
  pushLog('info', list.length
    ? `开始收盘同步：${list.join(', ')}（共 ${list.length} 个交易日）`
    : '开始财报更新')
  let totalRaw = 0
  let totalIndex = 0
  const done = []
  const skipped = []

  try {
    for (const d of list) {
      if (state.stopRequested) {
        pushLog('warn', '收到停止请求，剩余日期不再执行')
        break
      }
      try {
        const r = await importer.syncDaily(d, { force, onProgress: setProgress })
        totalRaw += r.raw
        totalIndex += r.index
        if (r.empty) {
          skipped.push({ date: d, reason: '无数据（非交易日或包未发布）' })
          pushLog('warn', `${d} 无数据，按非交易日跳过`)
        } else {
          done.push(d)
          pushLog('info', `${d} 完成：个股 ${r.raw} 条 / 指数 ${r.index} 条`)
        }
      } catch (e) {
        if (e.statusCode === 404) {
          skipped.push({ date: d, reason: '数据包未发布' })
          pushLog('warn', `${d} 数据包未发布，跳过`)
        } else {
          skipped.push({ date: d, reason: e.message })
          pushLog('error', `${d} 失败：${e.message}`)
        }
      }
    }

    let fin = null
    if (financial && !state.stopRequested && financialDue()) {
      try {
        fin = await runFinancial()
      } catch (e) {
        pushLog('error', `财报导入失败：${e.message}`)
      }
    }

    state.lastResult = { dates: done, skipped, raw: totalRaw, index: totalIndex, financial: fin }
    pushLog('info', `收盘同步结束：写入个股 ${totalRaw} 条 / 指数 ${totalIndex} 条`)
    try {
      const removed = importer.pruneDailyCache()
      if (removed > 0) pushLog('info', `已清理 ${removed} 个 30 天前的每日包缓存`)
    } catch (_) { /* 缓存清理失败不影响同步结果 */ }
    return state.lastResult
  } finally {
    state.running = false
    state.phase = ''
    state.percent = 0
    state.updatedAt = new Date().toISOString()
  }
}

function startBatch(dates, opts = {}) {
  if (runningPromise) return runningPromise
  runningPromise = runBatch(dates, opts)
    .catch((e) => { pushLog('error', `同步任务异常：${e.message}`) })
    .finally(() => { runningPromise = null })
  return runningPromise
}

// ---- 调度 ----

function isTradingWeekday(d) {
  const wd = d.getDay()
  return wd !== 0 && wd !== 6
}

async function catchUpMissing() {
  if (!(await ensureDdb())) {
    pushLog('warn', 'DolphinDB 未连接，跳过启动补跑')
    return
  }
  const now = new Date()
  const beforeClose = now.getHours() * 60 + now.getMinutes() < DAILY_HOUR * 60 + DAILY_MINUTE
  const today = nowISO()
  const dates = importer.recentWeekdays(5).reverse()
    // 收盘前启动时今日包通常尚未发布，跳过以避免无意义的 404
    .filter(d => !(beforeClose && d === today))
  const missing = []
  for (const d of dates) {
    if (!(await dailyExists(d))) missing.push(d)
  }
  if (!missing.length) return
  pushLog('info', `启动补跑：缺 ${missing.length} 个交易日（${missing.join(', ')}）`)
  await startBatch(missing, { financial: false })
}

/** 确保 DolphinDB 可用（启动阶段可能尚未就绪，失败仅告警） */
async function ensureDdb() {
  if (ddb.isConnected()) return true
  try {
    await ddb.connect()
    return true
  } catch (_) {
    return false
  }
}

async function tick() {
  if (runningPromise) return
  const now = new Date()
  const hm = now.getHours() * 60 + now.getMinutes()
  if (hm < DAILY_HOUR * 60 + DAILY_MINUTE) return
  if (!isTradingWeekday(now)) return
  if (!(await ensureDdb())) return
  const today = nowISO()
  if (await dailyExists(today)) {
    if (financialDue()) {
      try {
        await startBatch([], { financial: true })
      } catch (e) {
        pushLog('error', `财报导入失败：${e.message}`)
      }
    }
    return
  }
  // 当日缺失：连同最近 5 日一起补（避免前几日漏跑）
  const dates = importer.recentWeekdays(5).reverse()
  const missing = []
  for (const d of dates) {
    if (!(await dailyExists(d))) missing.push(d)
  }
  if (missing.length) await startBatch(missing)
}

function startScheduler() {
  if (timer) return
  startupTimer = setTimeout(() => {
    catchUpMissing().catch(e => pushLog('error', `启动补跑失败：${e.message}`))
  }, STARTUP_DELAY_MS)
  if (startupTimer.unref) startupTimer.unref()
  timer = setInterval(() => {
    tick().catch(e => pushLog('error', `定时任务失败：${e.message}`))
  }, TICK_MS)
  if (timer.unref) timer.unref()
  pushLog('info', `调度已启动：每天 18:10 同步，启动后 ${STARTUP_DELAY_MS / 1000}s 补跑最近 5 个交易日`)
}

function stopScheduler() {
  if (timer) { clearInterval(timer); timer = null }
  if (startupTimer) { clearTimeout(startupTimer); startupTimer = null }
}

// ---- 路由 ----

router.get('/status', async (req, res) => {
  try {
    let recent = []
    let lastDaily = null
    let ddbConnected = ddb.isConnected()
    if (!ddbConnected) {
      try { await ddb.connect(); ddbConnected = true } catch (_) { ddbConnected = false }
    }
    if (ddbConnected) {
      try {
        recent = await recentCoverage(10)
        lastDaily = recent.length ? recent[0].date : null
      } catch (e) {
        pushLog('warn', `读取 daily_k_raw 覆盖失败：${e.message}`)
      }
    }
    let financial = null
    try {
      const { getDb } = require('./db')
      financial = getDb().prepare('SELECT max(report_date) AS report_date, count(*) AS cnt FROM stock_financial').get()
    } catch (_) { /* SQLite 尚未初始化 */ }

    ok(res, {
      ddbConnected,
      running: state.running,
      stopRequested: state.stopRequested,
      phase: state.phase,
      percent: state.percent,
      message: state.message,
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
      lastResult: state.lastResult,
      recent,
      lastDaily,
      financial: {
        lastSuccess: readFinancialState().lastSuccess || null,
        reportDate: financial && financial.report_date ? String(financial.report_date).slice(0, 10) : null,
        rows: financial ? Number(financial.cnt) : 0
      },
      log: state.log.slice(-60).reverse()
    })
  } catch (e) {
    errMsg(res, e.message)
  }
})

router.post('/start', async (req, res) => {
  if (runningPromise) return errMsg(res, '同步任务进行中，请等待完成')
  let dates = Array.isArray(req.body && req.body.dates) ? req.body.dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)) : []
  if (!dates.length) {
    const days = Math.max(1, Math.min(30, Number(req.body && req.body.days) || 5))
    dates = importer.recentWeekdays(days).reverse()
  }
  try {
    await ddb.connect()
  } catch (e) {
    return errMsg(res, 'DolphinDB 未连接：' + e.message)
  }
  startBatch(dates, { force: !!(req.body && req.body.force) })
  ok(res, { dates })
})

router.post('/stop', (req, res) => {
  if (!runningPromise) return ok(res, { running: false })
  state.stopRequested = true
  pushLog('warn', '已请求停止：当前日期写完后退出')
  ok(res, { running: true, stopRequested: true })
})

router.post('/connect', async (req, res) => {
  try {
    await ddb.connect({ force: true })
    ok(res, { connected: true })
  } catch (e) {
    errMsg(res, '连接失败：' + e.message)
  }
})

module.exports = { router, state, startScheduler, stopScheduler, runBatch, startBatch, recentCoverage }
