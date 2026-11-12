'use strict'

/**
 * 数据流转日志写入门控。
 *
 * 记录范围只包含“外部取数/导入”：行情源调度、AKShare 直连、Tushare、
 * 通达信数据包导入。纯 DB 查询、路由缓存、健康探针和启动预热不落日志。
 *
 * 为什么用 AsyncLocalStorage：
 *   registry 的 failover/race 会并发调用多个源，普通模块级变量无法区分
 *   每个源尝试。这里给每次源尝试建立独立子上下文，DNS/HTTP 层只需
 *   noteHost()，最终由成功分支的上下文决定渠道，避免竞速时串源。
 *
 * 写入策略：
 *   取数链路只做内存入队，500ms 批量事务写 sql.js，失败仅告警不抛出；
 *   日志永远不能影响业务数据获取。
 */

const { AsyncLocalStorage } = require('async_hooks')
const { getDb } = require('./db')

const MAX_ROWS = 20000
const FLUSH_DELAY_MS = 500
const PRUNE_EVERY = 200

const DATA_TYPE_LABELS = {
  kline: 'K线',
  spot: '实时行情',
  minute: '分时/分钟K',
  indexDaily: '指数日K',
  indexSpot: '指数实时',
  limitPool: '涨停池',
  dropPool: '跌停池',
  ztPrev: '昨日涨停',
  industry: '行业板块',
  info: '个股信息',
  holding: '十大股东',
  financial: '财报',
  indicator: '估值指标',
  stockMeta: '股票元数据',
  boardList: '板块列表',
  boardCons: '板块成分',
  packageDaily: '每日数据包',
  packageFull: '全量数据包',
  packageIndex: '指数数据包',
  packageFinancial: '财报数据包',
  akshare: 'AKShare'
}

const SOURCE_LABELS = {
  tencent: '腾讯',
  tdx_local: '通达信本地',
  tdx_quant: '通达信量化',
  tdx_server: '通达信 tqs',
  tdx_package: '通达信官网数据包'
}

const als = new AsyncLocalStorage()
let queue = []
let flushTimer = null
let insertedSincePrune = 0
let writeWarned = false

function typeLabel(dataType) {
  return DATA_TYPE_LABELS[dataType] || dataType || '未知'
}

function sourceLabel(sourceKey) {
  return SOURCE_LABELS[sourceKey] || sourceKey || null
}

function current() {
  return als.getStore() || null
}

function createRoot(meta = {}) {
  return {
    dataType: meta.dataType || 'unknown',
    action: meta.action || typeLabel(meta.dataType),
    params: meta.params === undefined ? null : meta.params,
    sourceKey: meta.sourceKey || null,
    sourceLabel: meta.sourceLabel || null,
    detail: meta.detail || null,
    startedAt: Date.now(),
    attempts: [],
    channel: null,
    channels: new Set(),
    cacheHit: false,
    finished: false
  }
}

function createChild(sourceKey) {
  return {
    sourceKey,
    startedAt: Date.now(),
    channel: null,
    channels: new Set(),
    cacheHit: false,
    finished: false
  }
}

function run(meta, fn) {
  const ctx = createRoot(meta)
  return als.run(ctx, () => fn(ctx))
}

function runWith(ctx, fn) {
  return als.run(ctx, fn)
}

/** 按域名识别真实上游渠道（用于记录实际打到哪个厂商，而非调度器里的源名）。 */
function channelFromHost(hostname) {
  const h = String(hostname || '').toLowerCase()
  if (!h) return null
  if (h === 'gtimg.cn' || h.endsWith('.gtimg.cn') || h === 'qq.com' || h.endsWith('.qq.com')) return '腾讯'
  return null
}

function noteHost(hostname) {
  const ctx = current()
  if (!ctx || ctx.finished) return
  const label = channelFromHost(hostname)
  if (!label) return
  ctx.channels.add(label)
  ctx.channel = label
}

function noteChannel(label) {
  const ctx = current()
  if (!ctx || ctx.finished || !label) return
  ctx.channels.add(label)
  ctx.channel = label
}

function markCacheHit() {
  const ctx = current()
  if (!ctx || ctx.finished) return
  ctx.cacheHit = true
}

function countRows(data) {
  if (Array.isArray(data)) return data.length
  if (data == null) return 0
  if (typeof data === 'object' && Number.isFinite(Number(data.row_count))) return Number(data.row_count)
  return 1
}

function summarizeParams(params) {
  if (params == null || params === '') return null
  if (typeof params === 'string' || typeof params === 'number') {
    return { value: String(params).slice(0, 300) }
  }
  if (Array.isArray(params)) {
    return { count: params.length, sample: params.slice(0, 6) }
  }
  if (typeof params !== 'object') return { value: String(params).slice(0, 300) }

  const keys = ['symbol', 'codes', 'period', 'start_date', 'end_date', 'adjust', 'date', 'n', 'indicator', 'mode', 'fromDate', 'endDate', 'startDate']
  const out = {}
  for (const k of keys) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      out[k] = Array.isArray(params[k]) ? params[k].slice(0, 6) : params[k]
    }
  }
  return Object.keys(out).length ? out : params
}

function safeJson(value, maxLength) {
  if (value == null) return null
  try {
    const text = JSON.stringify(value)
    if (!text) return null
    return text.length > maxLength ? text.slice(0, maxLength) : text
  } catch (_) {
    return null
  }
}

function attempt(parent, data) {
  if (!parent || parent.finished) return
  const label = data.channel || sourceLabel(data.sourceKey) || data.sourceLabel || data.sourceKey || '未知'
  parent.attempts.push({
    source: data.sourceKey || null,
    source_label: label,
    status: data.status,
    row_count: Number(data.rowCount) || 0,
    duration_ms: Number(data.durationMs) || 0,
    error: data.error ? String(data.error).slice(0, 500) : null
  })
  if (data.cacheHit) parent.cacheHit = true
  if (data.status === 'success' && !parent.sourceKey) {
    parent.sourceKey = data.sourceKey || parent.sourceKey
    parent.sourceLabel = label
  }
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, FLUSH_DELAY_MS)
  if (flushTimer.unref) flushTimer.unref()
}

function finish(ctx, result = {}) {
  if (!ctx || ctx.finished) return
  ctx.finished = true

  const status = result.status || 'success'
  // 全市场 spot 等进程内缓存命中不是外部取数，按约定不落日志。
  if (ctx.cacheHit && status === 'success') return

  const rowCount = Number(result.rowCount) || 0
  const lastAttempt = ctx.attempts.length ? ctx.attempts[ctx.attempts.length - 1] : null
  const sourceKey = ctx.sourceKey || lastAttempt?.source || null
  const label = ctx.sourceLabel || (sourceKey ? sourceLabel(sourceKey) : null) || lastAttempt?.source_label || null
  const detail = result.detail || ctx.detail

  queue.push({
    created_at: new Date().toISOString(),
    data_type: ctx.dataType,
    action: ctx.action || typeLabel(ctx.dataType),
    source_key: sourceKey,
    source_label: label,
    status,
    row_count: rowCount,
    duration_ms: Date.now() - ctx.startedAt,
    params: safeJson(ctx.params, 1500),
    attempts: safeJson(ctx.attempts, 6000),
    error: result.error ? String(result.error).slice(0, 1500) : null,
    detail: safeJson(detail, 3000)
  })
  scheduleFlush()
}

function wrap(meta, fn, summarize) {
  return run(meta, async (ctx) => {
    try {
      const result = await fn()
      if (!ctx.sourceKey && meta.sourceKey) {
        ctx.sourceKey = meta.sourceKey
        ctx.sourceLabel = ctx.channel || meta.sourceLabel || sourceLabel(meta.sourceKey)
      }
      const outcome = summarize
        ? summarize(result)
        : { status: countRows(result) > 0 ? 'success' : 'empty', rowCount: countRows(result) }
      finish(ctx, outcome)
      return result
    } catch (e) {
      finish(ctx, { status: 'fail', error: e.message, detail: { reasons: e.reasons } })
      throw e
    }
  })
}

function prune(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM data_fetch_log').get()?.c || 0
  if (count <= MAX_ROWS) return
  db.prepare('DELETE FROM data_fetch_log WHERE id IN (SELECT id FROM data_fetch_log ORDER BY id ASC LIMIT ?)').run(count - MAX_ROWS)
}

function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }
  if (!queue.length) return

  const batch = queue.splice(0, queue.length)
  try {
    const db = getDb()
    db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO data_fetch_log
          (created_at, data_type, action, source_key, source_label, status,
           row_count, duration_ms, params, attempts, error, detail)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `)
      for (const e of batch) {
        stmt.run(
          e.created_at, e.data_type, e.action, e.source_key, e.source_label, e.status,
          e.row_count, e.duration_ms, e.params, e.attempts, e.error, e.detail
        )
      }
    })
    writeWarned = false
    insertedSincePrune += batch.length
    if (insertedSincePrune >= PRUNE_EVERY) {
      insertedSincePrune = 0
      prune(db)
    }
  } catch (e) {
    // 日志写入失败不能反向影响取数；控制台只提示一次，避免刷屏。
    if (!writeWarned) {
      writeWarned = true
      console.warn('[fetch-log] 写入失败:', e.message)
    }
  }
}

function flushSync() {
  flush()
}

function init() {
  try {
    prune(getDb())
  } catch (e) {
    console.warn('[fetch-log] 初始化清理失败:', e.message)
  }
}

module.exports = {
  MAX_ROWS,
  current,
  run,
  runWith,
  createChild,
  noteHost,
  noteChannel,
  markCacheHit,
  countRows,
  summarizeParams,
  typeLabel,
  sourceLabel,
  channelFromHost,
  attempt,
  finish,
  wrap,
  init,
  flush,
  flushSync
}
