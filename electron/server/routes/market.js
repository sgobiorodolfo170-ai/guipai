'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const spotRepo = require('../../dolphindb/spot-repository')
const indexSpotRepo = require('../../dolphindb/index-spot-repository')
const converter = require('../converter')
const marketTime = require('../market-time')
const { safeSymbol, safeDate } = require('../../dolphindb/params')

const router = express.Router()

function ok(res, data, msg = '成功', meta = null) {
  const body = { code: 200, msg, data }
  if (meta) body.meta = meta
  res.json(body)
}
function errMsg(res, msg) { res.json({ code: 500, msg }) }

/**
 * 指数代码 → 中文名。
 * stock_index_spot 只存 symbol（无 name 列），而前端 Dashboard.vue 靠 name 匹配
 * '上证'/'深证'/'创业' 来定位三大指数。此处用静态映射补名，避免为了一列名称去改表结构
 * （createPartitionedTable 有 existsTable 守卫，改列对存量库不生效，反而制造迁移分叉）。
 */
const INDEX_NAME_MAP = {
  '000001': '上证指数', '000300': '沪深300', '000905': '中证500', '000016': '上证50',
  '000852': '中证1000', '000010': '上证180', '000688': '科创50', '000688.SH': '科创50',
  '399001': '深证成指', '399006': '创业板指', '399005': '中小100', '399106': '深证综指',
  '399673': '创业板50', '000001.SH': '上证指数', '000300.SH': '沪深300',
  '399001.SZ': '深证成指', '399006.SZ': '创业板指'
}

function indexName(symbol) { return INDEX_NAME_MAP[symbol] || symbol }

// ---- 日期工具 ----
// 背景：DolphinDB 返回 DATE 为 '2026.10.15' 字符串，前端契约用 ISO；
// toISOString 在东八区凌晨会回退一天，故本地日期必须用 getFullYear/getMonth/getDate 手拼。

/** 任意日期形态（'2026-10-15'/'20261015'/'2026.10.15'/Date）→ ISO 'YYYY-MM-DD'；空/非法 → null */
function normDateISO(v) {
  const s = String(v == null ? '' : v).replace(/[^\d]/g, '')
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null
}

/** 本地日期 ISO（不能用 toISOString：东八区凌晨会回退到前一天） */
function localISO(d = new Date()) {
  const p = x => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** ISO 日期 ± n 天（UTC 毫秒运算，避免本地时区偏移）；用于缺口区间的相邻日计算 */
function shiftDay(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86400000)
  const p = x => String(x).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`
}

/** 两个 ISO 日期之间的整天数（a <= b 时为正）；用于判断缺口是否短到可做交易日探测 */
function isoDayDiff(a, b) {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000)
}

/** 最近一个交易日（近似，无节假日历）：周末回退到周五；交易日 09:15 前快照仍属上一交易日。
 *  仅用于网络直返路径的快照日期标注与入库 trade_date——日期与数值同源，保证"日期-数值"对齐；
 *  真正的交易日历需要专门的日历源，此处用时间近似已足够（误差仅出现在节假日当天的标注上）。 */
function latestTradeDateISO(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (now.getHours() * 60 + now.getMinutes() < 9 * 60 + 15) d.setDate(d.getDate() - 1)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1)
  return localISO(d)
}

/** Promise 限时：超时 reject(new Error('timeout'))，供缺口回填这类非关键网络调用防拖死路由 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ])
}

/** stock_zh_index_daily 入库列定义（缺口回填与网络直返两处复用） */
const INDEX_DAILY_COLS = [
  { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
  { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
  { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
  { name: 'volume', type: 'double' }, { name: 'amount', type: 'double' },
  { name: 'amplitude', type: 'double' }, { name: 'change', type: 'double' },
  { name: 'price_change', type: 'double' }, { name: 'turnover_rate', type: 'double' },
  { name: 'create_time', type: 'timestamp' }, { name: 'update_time', type: 'timestamp' }
]

const IDX_TBL = `loadTable("dfs://tradeinsight", "stock_zh_index_daily")`
/** 个股原始日K：仅用于探测某历史区间是否真的开过市（raw 表从 2024 年起） */
const RAW_IDX_TBL = `loadTable("dfs://tradeinsight_raw", "daily_k_raw")`

/** /overview 覆盖的沪深重要指数（与原 stock_index_spot 最新快照的 9 项保持一致） */
const OVERVIEW_CODES = [
  '000001', '000300', '000016', '000688', '000905',
  '399001', '399006', '399005', '399106'
]

/** 最近交易日日期窗口：用于批量读取日K/快照，避免全表扫描 */
const LATEST_LOOKBACK_DAYS = 60

// ---- 指数双源比对（快照 vs 日K）----
// 背景：stock_index_spot 盘后可能停留在旧交易日，而 stock_zh_index_daily 已更新到最新收盘。
// 市场概况与指数K线必须使用同一次比对结果，否则两个卡片会各显示一套日期/数值。
// 规则：日期不同取较晚者；同日盘中（09:15–15:00，含午休）取快照，盘后取日K最终值。

function round2(v) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0
}

function numOrNull(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** DolphinDB timestamp（'2026.10.20 18:24:52.939' / Date）→ Date；无法解析返回 null */
function parseDdbTime(v) {
  if (!v) return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v
  const m = String(v).trim().match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (!m) return null
  return new Date(
    Number(m[1]), Number(m[2]) - 1, Number(m[3]),
    Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)
  )
}

/** 交易日 09:15–15:00（含午休）。marketTime.isTradingTime 会剔除午休，不能直接用于同日取舍。 */
function isIntradaySession(now = new Date()) {
  if (!marketTime.isTradingDay(now)) return false
  const m = now.getHours() * 60 + now.getMinutes()
  return m >= 9 * 60 + 15 && m < 15 * 60
}

/** 涨跌额/涨跌幅：源字段优先，缺失时用最新价与前收计算 */
function calcChange(price, prevClose, storedAmount, storedPct) {
  let change = numOrNull(storedAmount)
  let changePercent = numOrNull(storedPct)
  if (change == null && price > 0 && prevClose > 0) change = price - prevClose
  if (changePercent == null && price > 0 && prevClose > 0) changePercent = ((price - prevClose) / prevClose) * 100
  return { change: round2(change == null ? 0 : change), changePercent: round2(changePercent == null ? 0 : changePercent) }
}

/** stock_index_spot 行 → 快照候选 */
function toSnapshotCandidate(row) {
  if (!row) return null
  const code = safeSymbol(row.symbol)
  const price = numOrNull(row.latest_price)
  const date = normDateISO(row.trade_date)
  if (!code || !date || !(price > 0)) return null
  const prevClose = numOrNull(row.preclose)
  const { change, changePercent } = calcChange(price, prevClose, row.change_amount, row.pct_chg)
  return {
    code, name: indexName(code), date, price,
    open: numOrNull(row.open) || price,
    high: numOrNull(row.high) || price,
    low: numOrNull(row.low) || price,
    volume: numOrNull(row.volume) || 0,
    amount: numOrNull(row.amount) || 0,
    turnoverRate: 0,
    change, changePercent,
    updatedAt: row.timestamp || null,
    source: 'snapshot'
  }
}

/** 行情源中文键行 → 快照候选 */
function toSnapshotRawCandidate(row, date, updatedAt) {
  if (!row) return null
  const code = safeSymbol(row['代码'] || row['指数代码'])
  const price = numOrNull(row['最新价'])
  if (!code || !date || !(price > 0)) return null
  const prevClose = numOrNull(row['昨收'])
  const { change, changePercent } = calcChange(price, prevClose, row['涨跌额'], row['涨跌幅'])
  return {
    code, name: indexName(code), date, price,
    open: numOrNull(row['今开']) || price,
    high: numOrNull(row['最高']) || price,
    low: numOrNull(row['最低']) || price,
    volume: numOrNull(row['成交量']) || 0,
    amount: numOrNull(row['成交额']) || 0,
    turnoverRate: numOrNull(row['换手率']) || 0,
    change, changePercent,
    updatedAt,
    source: 'snapshot'
  }
}

/** stock_zh_index_daily 行 → 日K候选 */
function toDailyCandidate(row, prevClose, code) {
  if (!row) return null
  const sym = safeSymbol(code || row.symbol)
  const price = numOrNull(row.close)
  const date = normDateISO(row.trade_date)
  if (!sym || !date || !(price > 0)) return null
  const { change, changePercent } = calcChange(price, prevClose, row.price_change, row.change)
  return {
    code: sym, name: indexName(sym), date, price,
    open: numOrNull(row.open) || price,
    high: numOrNull(row.high) || price,
    low: numOrNull(row.low) || price,
    volume: numOrNull(row.volume) || 0,
    amount: numOrNull(row.amount) || 0,
    turnoverRate: numOrNull(row.turnover_rate) || 0,
    change, changePercent,
    updatedAt: row.update_time || null,
    source: 'daily'
  }
}

/** 行情源中文键日K行 → 日K候选 */
function toDailyRawCandidate(row, prevClose, code, updatedAt) {
  if (!row) return null
  const sym = safeSymbol(code)
  const price = numOrNull(row['收盘'])
  const date = normDateISO(row['日期'])
  if (!sym || !date || !(price > 0)) return null
  const { change, changePercent } = calcChange(price, prevClose, row['涨跌额'], row['涨跌幅'])
  return {
    code: sym, name: indexName(sym), date, price,
    open: numOrNull(row['开盘']) || price,
    high: numOrNull(row['最高']) || price,
    low: numOrNull(row['最低']) || price,
    volume: numOrNull(row['成交量']) || 0,
    amount: numOrNull(row['成交额']) || 0,
    turnoverRate: numOrNull(row['换手率']) || 0,
    change, changePercent,
    updatedAt,
    source: 'daily'
  }
}

/** 双源取舍：日期优先；同日盘中快照、盘后日K */
function pickLatest(snapshot, daily, now = new Date()) {
  const s = snapshot && snapshot.date && snapshot.price > 0 ? snapshot : null
  const d = daily && daily.date && daily.price > 0 ? daily : null
  if (!s) return d
  if (!d) return s
  if (s.date !== d.date) return s.date > d.date ? s : d
  return isIntradaySession(now) ? s : d
}

/** 盘后判断日K是否仍为盘中旧值，需要刷新当日最终日K */
function needsDailyRefresh(daily, snapshot, now = new Date()) {
  if (isIntradaySession(now)) return false
  const expected = latestTradeDateISO(now)
  if (!daily) return true
  if (daily.date === expected) {
    const t = parseDdbTime(daily.updatedAt)
    if (!t) return true
    const close = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 15, 0, 0)
    return t < close
  }
  if (daily.date < expected) {
    if (snapshot && snapshot.date > daily.date) return true
    return !snapshot
  }
  return false
}

// 指数日K写库串行化：ddb.insertRows 复用会话变量 insData，并发 upload+tableInsert
// 会互相覆盖——实测 6 个指数并发刷新时，全部行被写成最后一个 symbol（399106 重复 6 行）。
// 只串行化写库，网络补拉仍可并行，避免刷新被逐个 8s 超时拖慢。
let idxDailyWriteChain = Promise.resolve()
function queueIdxDailyWrite(task) {
  const run = idxDailyWriteChain.then(task, task)
  idxDailyWriteChain = run.then(() => undefined, () => undefined)
  return run
}

/** 盘后刷新当日最终日K：多取 7 天用于计算涨跌幅，只写入当日一行 */
async function refreshDailyToday(code, now, fallbackPrevClose) {
  const sym = safeSymbol(code)
  if (!sym) return null
  const today = latestTradeDateISO(now)
  const from = shiftDay(today, -7)
  try {
    const fetched = await withTimeout(aktools.getIndexDailyData({
      symbol: sym, period: 'daily',
      start_date: from.replace(/-/g, ''), end_date: today.replace(/-/g, '')
    }), 8000)
    const rows = (Array.isArray(fetched) ? fetched : [])
      .map(row => ({ row, date: normDateISO(row['日期']) }))
      .filter(x => x.date)
      .sort((a, b) => a.date.localeCompare(b.date))
    const idx = rows.findIndex(x => x.date === today)
    if (idx < 0) return null
    const prevClose = idx > 0 ? numOrNull(rows[idx - 1].row['收盘']) : fallbackPrevClose
    const candidate = toDailyRawCandidate(rows[idx].row, prevClose, sym, new Date())
    if (!candidate) return null
    if (ddb.isConnected()) {
      try {
        await queueIdxDailyWrite(async () => {
          const conv = converter.convertIndexDaily([rows[idx].row], sym)
          const ts = new Date()
          conv.forEach(r => { r.create_time = ts; r.update_time = ts })
          await ddb.execute(`t = ${IDX_TBL}; delete from t where symbol='${sym}' and trade_date=${safeDate(today)}`)
          await ddb.insertRows('stock_zh_index_daily', INDEX_DAILY_COLS, conv)
        })
      } catch (e) {
        console.warn(`[market] 当日日K刷新入库失败 ${sym}:`, e.message)
      }
    }
    return candidate
  } catch (e) {
    console.warn(`[market] 当日日K刷新失败 ${sym}:`, e.message)
    return null
  }
}

/**
 * 批量解析指数最新数据，两个路由共用并共享 5s/60s 缓存。
 * 返回 Map<6位代码, { ...chosen, snapshot, daily }>；snapshot/daily 同时保留原始候选，供调试与 meta 使用。
 */
async function resolveLatestBatch(codes, now = new Date()) {
  const syms = [...new Set((Array.isArray(codes) ? codes : []).map(c => safeSymbol(c)).filter(Boolean))]
  const ttl = isIntradaySession(now) ? 5 : 60
  const out = new Map()
  const missing = []
  for (const sym of syms) {
    const cached = cache.get(`market:indexLatest:${sym}`)
    if (cached) out.set(sym, cached)
    else missing.push(sym)
  }
  if (!missing.length) return out

  const since = safeDate(shiftDay(localISO(now), -LATEST_LOOKBACK_DAYS))
  const cond = missing.map(s => `symbol='${s}'`).join(' or ')
  let dailyRows = []
  let snapshotRows = []
  if (ddb.isConnected()) {
    try {
      const [daily, snapshot] = await Promise.all([
        ddb.execute(
          `select symbol, trade_date, open, close, high, low, volume, amount, turnover_rate, change, price_change, update_time` +
          ` from ${IDX_TBL} where (${cond}) and trade_date >= ${since} order by symbol, trade_date desc`
        ),
        indexSpotRepo.getLatestIndexSpot(since)
      ])
      dailyRows = Array.isArray(daily) ? daily : []
      snapshotRows = Array.isArray(snapshot) ? snapshot : []
    } catch (e) {
      console.warn('[market] 双源基础数据查询失败:', e.message)
    }
  }

  const dailyBy = new Map()
  for (const row of dailyRows) {
    const sym = safeSymbol(row.symbol)
    if (!sym || !missing.includes(sym)) continue
    const arr = dailyBy.get(sym) || []
    if (arr.length < 2) arr.push(row)
    dailyBy.set(sym, arr)
  }
  const snapshotBy = new Map()
  for (const row of snapshotRows) {
    const sym = safeSymbol(row.symbol)
    if (sym && missing.includes(sym) && !snapshotBy.has(sym)) snapshotBy.set(sym, row)
  }

  let liveBy = null
  const needLive = isIntradaySession(now) || snapshotRows.length === 0
  if (needLive) {
    try {
      const raw = await withTimeout(aktools.getStockIndexSpot('沪深重要指数'), 8000)
      if (Array.isArray(raw) && raw.length > 0) {
        const snapDate = latestTradeDateISO(now)
        liveBy = new Map()
        for (const row of raw) {
          const c = toSnapshotRawCandidate(row, snapDate, now)
          if (c && missing.includes(c.code)) liveBy.set(c.code, c)
        }
        if (ddb.isConnected()) {
          indexSpotRepo.insertIndexSpot(raw, snapDate).catch(e => console.error('[market] index spot 入库失败:', e.message))
        }
      }
    } catch (e) {
      console.warn('[market] 实时快照获取失败，使用库内快照:', e.message)
    }
  }

  const state = new Map()
  const refreshTasks = []
  for (const sym of missing) {
    const rows = dailyBy.get(sym) || []
    const daily = toDailyCandidate(rows[0], rows[1] ? numOrNull(rows[1].close) : null, sym)
    const dbSnap = toSnapshotCandidate(snapshotBy.get(sym))
    const liveSnap = liveBy ? liveBy.get(sym) : null
    const snapshot = liveSnap || dbSnap || null
    state.set(sym, { snapshot, daily })
    if (needsDailyRefresh(daily, snapshot, now)) {
      refreshTasks.push({ sym, fallbackPrevClose: rows[1] ? numOrNull(rows[1].close) : null })
    }
  }

  await Promise.all(refreshTasks.map(async ({ sym, fallbackPrevClose }) => {
    const refreshed = await refreshDailyToday(sym, now, fallbackPrevClose)
    if (refreshed) state.get(sym).daily = refreshed
  }))

  for (const sym of missing) {
    const { snapshot, daily } = state.get(sym)
    const chosen = pickLatest(snapshot, daily, now)
    if (!chosen) continue
    const result = { ...chosen, snapshot: snapshot || null, daily: daily || null }
    cache.set(`market:indexLatest:${sym}`, result, ttl)
    out.set(sym, result)
  }
  return out
}

function latestMeta(latest) {
  if (!latest) return null
  return {
    latestSource: latest.source,
    latestDate: latest.date,
    snapshotDate: latest.snapshot ? latest.snapshot.date : null,
    dailyDate: latest.daily ? latest.daily.date : null
  }
}

/** 最新候选 → 日K中文键行（供 K 线末根替换/追加与周月聚合复用） */
function latestToDailyRow(latest) {
  return {
    '日期': latest.date,
    '开盘': latest.open || latest.price,
    '收盘': latest.price,
    '最高': latest.high || latest.price,
    '最低': latest.low || latest.price,
    '成交量': latest.volume || 0,
    '成交额': latest.amount || 0,
    '换手率': latest.turnoverRate || 0,
    '涨跌幅': latest.changePercent || 0
  }
}

/** 将最新候选补进日K序列：同日期替换末根，日期更晚则追加；历史窗口不修改 */
function applyLatestToDaily(rows, latest, endISO) {
  if (!latest || !latest.date || !(latest.price > 0)) return rows
  if (!endISO || latest.date > endISO) return rows
  const list = Array.isArray(rows) ? rows.slice() : []
  const bar = latestToDailyRow(latest)
  if (!list.length) return [bar]
  const lastDate = normDateISO(list[list.length - 1]['日期'])
  if (lastDate && latest.date < lastDate) return list
  const idx = list.findIndex(r => normDateISO(r['日期']) === latest.date)
  if (idx >= 0) list[idx] = bar
  else if (!lastDate || latest.date > lastDate) list.push(bar)
  return list
}

/** stock_spot 行 → /hot 前端契约（按成交额倒序，DB 侧不预排序避免污染缓存顺序） */
function toHot(rows) {
  return rows
    .filter(r => r.symbol)
    .map(r => ({
      code: r.symbol, name: r.name || r.symbol,
      price: Number(r.close) || 0,
      changePercent: Number(r.pct_chg) || 0,
      turnover: Number(r.amount) || 0
    }))
    .sort((a, b) => b.turnover - a.turnover)
}

// 全市场快照写库节流（与 stock.js /realtime 同规则：60s 一次，避免全量重写放大）
let lastSpotWriteAt = 0

/** 行情源中文键行 → /hot 前端契约（盘中网络优先路径） */
function toHotRaw(rows) {
  return rows
    .filter(r => r['代码'])
    .map(r => ({
      code: r['代码'], name: r['名称'] || r['代码'],
      price: Number(r['最新价']) || 0,
      changePercent: Number(r['涨跌幅']) || 0,
      turnover: Number(r['成交额']) || 0
    }))
    .sort((a, b) => b.turnover - a.turnover)
}

// 市场概况 — 快照与指数日K双源比对，取最新者；前端只渲染最终值 + 来源标签。
// 盘中实时快照优先，盘后日K优先；stock_index_spot 落后时不会再覆盖较新的日K。
router.get('/overview', async (req, res) => {
  const cacheKey = 'market:overview:compare:v2'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached, '成功(缓存)')
  const ttl = isIntradaySession() ? 5 : 60
  try {
    const latestMap = await resolveLatestBatch(OVERVIEW_CODES)
    const overview = OVERVIEW_CODES.map(code => {
      const v = latestMap.get(code)
      if (!v) return null
      return {
        code: v.code,
        name: indexName(v.code),
        price: v.price,
        change: v.change,
        changePercent: v.changePercent,
        date: v.date,
        source: v.source
      }
    }).filter(Boolean)
    if (overview.length > 0) cache.set(cacheKey, overview, ttl)
    return ok(res, overview, '成功(双源比对)')
  } catch (e) { errMsg(res, e.message) }
})

// 热门股票 — 盘中网络优先（腾讯全市场 ~1s），盘后 DB-first from stock_spot (按成交额排序)
router.get('/hot', async (req, res) => {
  const { limit = 20 } = req.query
  const cacheKey = 'ddb:spot:hot'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached.slice(0, Number(limit)))
  const ttl = marketTime.spotTtl()
  try {
    if (marketTime.isTradingTime()) {
      try {
        const raw = await aktools.getStockSpot()
        if (raw && raw.length > 0) {
          const list = toHotRaw(raw)
          cache.set(cacheKey, list, ttl)
          // 写库节流 60s：insertSpot 为「删今日 + 全量插入」，5s 缓存过期即全量重写会放大写入
          if (ddb.isConnected() && Date.now() - lastSpotWriteAt > 60000) {
            lastSpotWriteAt = Date.now()
            spotRepo.insertSpotSafe(raw).catch(e => console.error('[market] hot 快照入库失败:', e.message))
          }
          return ok(res, list.slice(0, Number(limit)), '成功(实时)')
        }
      } catch (e) {
        console.error('[market] hot 网络优先失败，降级库内:', e.message)
      }
    }
    let data = await spotRepo.getSpot()
    if (data && data.length > 0) {
      const list = toHot(data)
      cache.set(cacheKey, list, ttl)
      return ok(res, list.slice(0, Number(limit)))
    }
    // aktools → write → re-read
    const raw = await aktools.getStockSpot()
    if (raw && raw.length > 0) {
      await spotRepo.insertSpotSafe(raw)
      data = await spotRepo.getSpot()
      if (data && data.length > 0) {
        const list = toHot(data)
        cache.set(cacheKey, list, ttl)
        return ok(res, list.slice(0, Number(limit)), '成功(已入库)')
      }
    }

    // 上游全挂 → 从 daily_k_raw 派生收盘快照兜底
    const derived = await spotRepo.deriveFromRaw()
    if (derived > 0) {
      data = await spotRepo.getSpot()
      if (data && data.length > 0) {
        const list = toHot(data)
        cache.set(cacheKey, list, ttl)
        return ok(res, list.slice(0, Number(limit)), '成功(daily_k_raw 派生快照)')
      }
    }
    ok(res, [])
  } catch (e) { errMsg(res, e.message) }
})

/** 合并库内日K与补拉日K：同日期补拉值优先，按日期升序。
 *  盘中会主动重拉当日K线，若仍让库内旧值覆盖，图表末根会冻结在早盘；
 *  历史缺口补拉与库内行正常情况下同源同值，覆盖无副作用。 */
function mergeDailyRows(dbRows, fetchedRows) {
  const byDate = new Map()
  for (const r of dbRows) {
    const d = normDateISO(r['日期'])
    if (d) byDate.set(d, r)
  }
  for (const r of fetchedRows) {
    const d = normDateISO(r['日期'])
    if (d) byDate.set(d, r) // 同日期补拉值更新，盘中用它覆盖库内旧末根
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(e => e[1])
}

/** ISO 日期 → 所在周的周一（UTC 运算避免时区偏移）；周K 分组键 */
function isoWeekStart(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const back = (dt.getUTCDay() + 6) % 7 // 距周一天数（getUTCDay：0=周日）
  const mon = new Date(dt.getTime() - back * 86400000)
  const p = x => String(x).padStart(2, '0')
  return `${mon.getUTCFullYear()}-${p(mon.getUTCMonth() + 1)}-${p(mon.getUTCDate())}`
}

/** 日K行（中文键，升序）→ 周K/月K行（中文键）：日期取组内首个交易日、开=首、收=末、
 *  高/低=极值、量/额=求和——对齐 kline-repository.getKlineAggregated 的 first/last/max/min/sum 口径。
 *  在 JS 端聚合而非 DolphinDB group-by 的原因：深历史行不在库内（分区下界），
 *  group-by 只能看到库内部分，覆盖不到合并后的数据。 */
function aggregateDailyRows(rows, period) {
  const isWeekly = period === 'weekly'
  const groups = new Map()
  for (const r of rows) {
    const iso = normDateISO(r['日期'])
    if (!iso) continue
    const key = isWeekly ? isoWeekStart(iso) : iso.slice(0, 7)
    const g = groups.get(key)
    if (g) g.push({ iso, r })
    else groups.set(key, [{ iso, r }])
  }
  const out = []
  for (const g of groups.values()) {
    let high = 0, low = 0, volume = 0, amount = 0
    g.forEach(({ r }, i) => {
      const h = Number(r['最高']) || 0
      const l = Number(r['最低']) || 0
      if (i === 0) { high = h; low = l } else { if (h > high) high = h; if (l < low) low = l }
      volume += Number(r['成交量']) || 0
      amount += Number(r['成交额']) || 0
    })
    out.push({
      '日期': g[0].iso,
      '开盘': Number(g[0].r['开盘']) || 0,
      '收盘': Number(g[g.length - 1].r['收盘']) || 0,
      '最高': high, '最低': low, '成交量': volume, '成交额': amount
    })
  }
  return out
}

// 指数K线 — DB-first from stock_zh_index_daily（覆盖检测 + 缺口补拉 + 响应层合并 + 周期聚合）。
//
// 关键约束（本次重写发现，理解它才能改对这个路由）：
//   dfs://tradeinsight 建库脚本 ensureSchema 以 startYear=2024 起分区，分区下界即 2024-01-01；
//   对更早 trade_date 的行 tableInsert 不报错但会被静默丢弃（实测 1998 年起的 644 行补拉写入后
//   表行数零增长）。存量库无法靠 createPartitionedTable 扩范围修复（有 existsTable 守卫），
//   扩分区属不可逆运维操作须单独评审——故不动库结构，在响应层解决：
//   1) 覆盖检测：先读库判窗口内 min/max，对头/尾缺口用日K源补拉（旧实现"读到非空就返回"，
//      库内只有一小段时头/尾缺口永不补拉，历史长期停在旧日期）；
//   2) 响应层合并：库内行 + 本轮补拉行按日期合并（同日期补拉优先，升序）——深历史（<2024）
//      即使入不了库也能完整展示；库只持久化可落库的 >=2024 部分（丢行无害，仅重复拉取）；
//   3) 周/月K 由合并后的日线在 JS 端聚合（口径对齐 kline-repository.getKlineAggregated），
//      绝不落库——旧实现曾把聚合行写进日线表造成数据污染；
//   4) 补拉 best-effort：源失败/超时不阻塞返回，短 TTL 缓存稍后自动重试；仅当源失败或
//      库与补拉都为空时，才落到网络直返兜底。
router.get('/index-kline', async (req, res) => {
  try {
    const { code, period = 'daily', startDate, endDate } = req.query
    if (!code) return errMsg(res, '缺少 code 参数')
    // 净化 query 拼进 DolphinDB 脚本前必须过白名单（脚本无参数绑定）
    // startDate 缺省给默认起始日而非留空：safeDate(undefined) 返回 null 会让下方
    // 校验直接判"参数不合法"，而前端并不总是显式带 startDate。
    const sym = safeSymbol(code)
    const sdISO = normDateISO(startDate) || '1990-01-01'
    const edISO = normDateISO(endDate) || localISO()
    const sd = safeDate(sdISO)
    const ed = safeDate(edISO)
    if (!sym || !sd || !ed) return errMsg(res, '参数不合法')
    const cacheKey = `ddb:index-kline:${sym}:${period}:${startDate || ''}:${endDate || ''}`
    const cached = cache.get(cacheKey)
    if (cached && Array.isArray(cached.kline)) return ok(res, cached.kline, '成功(缓存)', cached.meta)

    const SELECT = `select trade_date as 日期, open as 开盘, close as 收盘, high as 最高, low as 最低,` +
      ` volume as 成交量, amount as 成交额, turnover_rate as 换手率, change as 涨跌幅` +
      ` from ${IDX_TBL} where symbol='${sym}'`
    const toKline = (rows) => rows.map(m => ({
      date: String(m['日期']).replace(/\./g, '-'), open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
      high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
      volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
      turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
    }))

    /** 区间内是否存在任何成交（个股 raw 或任一指数）。
     *  周末/节假日缺口没有任何成交，却会让数据源空等约 8s 才超时；先用一次轻量计数
     *  判定“日历上是否开市”，避免每个默认 900 天窗口的首个请求都白等 8s。
     *  仅对 2024 起且不超过 45 天的历史缺口生效：更深历史 raw 表不覆盖，查询失败也按
     *  “有成交”处理，保持原有补拉行为，避免误跳过真正的数据缺口。 */
    const hasMarketActivity = async (gs, ge) => {
      if (gs < '2024-01-01') return true
      try {
        const raw = await ddb.count(
          `select count(*) as c from ${RAW_IDX_TBL} where trade_date between ${safeDate(gs)} and ${safeDate(ge)}`
        )
        if (raw > 0) return true
        const idx = await ddb.count(
          `select count(*) as c from ${IDX_TBL} where trade_date between ${safeDate(gs)} and ${safeDate(ge)}`
        )
        return idx > 0
      } catch (e) {
        return true
      }
    }

    /** 网络补拉一个缺口区间 [gs, ge]（ISO，闭区间）。
     *  返回 { ok, rows }：
     *   - ok=false：源失败/超时（调用方按"未补齐"短 TTL 缓存，稍后自动重试）；
     *   - ok=true：源成功应答，rows 为区间内取到的日K行（可能为空——如区间尚未成为交易日，
     *     此时也返回 ok=true，避免对"日历上无数据"的区间做无意义重试风暴）。
     *  rows 无论是否入库成功都参与本次响应：tradeinsight 分区下界是 2024-01-01，更早的行
     *  入库会被静默丢弃（原因见路由头注释），深历史只能靠响应层合并兜住。
     *  写库（delete+insert）单独 try/catch：写失败只降级为"未缓存"、不能丢已取到的行，
     *  更不能把整次补拉判为源失败。只回填日K：非 daily 语义由上层聚合承担。 */
    const backfillGap = async (gs, ge) => {
      if (!(gs <= ge)) return { ok: true, rows: [] }
      // 历史短缺口先探测是否真的开过市；纯周末/节假日直接视为“已覆盖”，不发起网络补拉。
      // 今日及未来（盘中重拉）必须放行，避免 raw 表尚未写入当日数据时被误判为非交易日。
      if (gs >= '2024-01-01' && ge < todayISO && isoDayDiff(gs, ge) <= 45) {
        const gapKey = `market:nonTradingGap:${gs}:${ge}`
        if (cache.get(gapKey)) return { ok: true, rows: [] }
        if (!(await hasMarketActivity(gs, ge))) {
          cache.set(gapKey, true, 3600)
          console.log(`[market] index-kline 跳过非交易日缺口 ${sym} ${gs}~${ge}`)
          return { ok: true, rows: [] }
        }
      }
      try {
        const fetched = await withTimeout(aktools.getIndexDailyData({
          symbol: code, period: 'daily',
          start_date: gs.replace(/-/g, ''), end_date: ge.replace(/-/g, '')
        }), 8000)
        if (!Array.isArray(fetched) || !fetched.length) return { ok: true, rows: [] }
        // 防御：只取缺口区间内的行（源端理论上已按区间过滤，双保险防越界覆盖已有数据）
        const inGap = fetched.filter(r => {
          const d = normDateISO(r['日期'])
          return d && d >= gs && d <= ge
        })
        if (inGap.length && ddb.isConnected()) {
          try {
            await queueIdxDailyWrite(async () => {
              const conv = converter.convertIndexDaily(inGap, sym)
              const ts = new Date()
              conv.forEach(r => { r.create_time = ts; r.update_time = ts })
              await ddb.execute(`t = ${IDX_TBL}; delete from t where symbol='${sym}' and trade_date between ${safeDate(gs)} and ${safeDate(ge)}`)
              await ddb.insertRows('stock_zh_index_daily', INDEX_DAILY_COLS, conv)
            })
          } catch (e) {
            // 写库失败不丢数据：本次响应仍合并 inGap；>=2024 部分下轮请求会重新触发补拉
            console.warn(`[market] index-kline 回填入库失败 ${sym} ${gs}~${ge}: ${e.message}`)
          }
        }
        return { ok: true, rows: inGap }
      } catch (e) {
        console.warn(`[market] index-kline 缺口补拉失败 ${sym} ${gs}~${ge}: ${e.message}`)
        return { ok: false, rows: [] }
      }
    }

    const isWeekly = period === 'weekly'
    const isMonthly = period === 'monthly'
    const todayISO = localISO()
    const intraday = isIntradaySession()
    const klineTtl = intraday ? 5 : (marketTime.isTradingDay() ? 60 : 300)

    // 1. DB 路径：覆盖检测 → 缺口补拉 → 库内行与补拉行合并 → 读取（daily）或端上聚合（weekly/monthly）
    if (ddb.isConnected()) {
      let complete = true
      const fetchedRows = [] // 本轮补拉到的日K行（含入不了库的 <2024 深历史）
      try {
        const cov = await ddb.execute(
          `select min(trade_date) as mn, max(trade_date) as mx from ${IDX_TBL}` +
          ` where symbol='${sym}' and trade_date between ${sd} and ${ed}`
        )
        const mn = cov && cov[0] ? normDateISO(cov[0].mn) : null
        const mx = cov && cov[0] ? normDateISO(cov[0].mx) : null
        if (!mn || !mx) {
          // 窗口内无任何数据：整窗补拉（首次使用该指数或窗口完全在库外）
          const r = await backfillGap(sdISO, edISO)
          complete = r.ok
          fetchedRows.push(...r.rows)
        } else {
          // 头/尾缺口各自补拉；任一缺口源失败都按"未补齐"处理（短 TTL 缓存稍后重试）
          if (mn > sdISO) {
            const r = await backfillGap(sdISO, shiftDay(mn, -1))
            complete = r.ok && complete
            fetchedRows.push(...r.rows)
          }
          if (mx < edISO) {
            const r = await backfillGap(shiftDay(mx, 1), edISO)
            complete = r.ok && complete
            fetchedRows.push(...r.rows)
          } else if (intraday && edISO >= todayISO) {
            // 盘中库内已有当日行时也要重拉：否则早盘首次回填后末根会冻结到收盘
            const r = await backfillGap(todayISO, todayISO)
            complete = r.ok && complete
            fetchedRows.push(...r.rows)
          }
        }
      } catch (e) {
        console.error('[market] index-kline 覆盖检测失败:', e.message)
        complete = false
      }

      const dbRows = await ddb.execute(`${SELECT} and trade_date between ${sd} and ${ed} order by trade_date`)
      const daily = mergeDailyRows(Array.isArray(dbRows) ? dbRows : [], fetchedRows)
      if (daily.length > 0) {
        // 快照/日K双源比对：盘中末根跟随快照，盘后跟随日K最终值
        const latest = (await resolveLatestBatch([sym])).get(sym) || null
        const patched = applyLatestToDaily(daily, latest, edISO)
        // 周/月K：先补/改日线，再在端上聚合（不信任/不写入聚合行）
        const kline = toKline(isWeekly || isMonthly ? aggregateDailyRows(patched, period) : patched)
        const meta = latestMeta(latest)
        cache.set(cacheKey, { kline, meta }, complete ? klineTtl : 30)
        return ok(res, kline, complete ? '成功' : '成功(部分覆盖)', meta)
      }
      // 库内与补拉均为空（该指数无数据或补拉全失败）→ 落到网络直返兜底
    }

    // 2. 数据源直返：DDB 不可用，或库内与补拉都为空。
    //    一律按日K取数（源端周/月聚合口径不可控且未必支持），周/月由 aggregateDailyRows 端上聚合；
    //    DDB 可用时把日K补一次入库（best-effort，不阻塞返回；<2024 行会被静默丢弃，无副作用）。
    const raw = await aktools.getIndexDailyData({
      symbol: code,
      period: 'daily',
      start_date: sdISO.replace(/-/g, ''),
      end_date: edISO.replace(/-/g, '')
    })
    if (raw && raw.length > 0) {
      if (ddb.isConnected()) {
        try {
          await queueIdxDailyWrite(async () => {
            const rows = converter.convertIndexDaily(raw, sym)
            const ts = new Date()
            rows.forEach(r => { r.create_time = ts; r.update_time = ts })
            await ddb.execute(`t = ${IDX_TBL}; delete from t where symbol='${sym}' and trade_date between ${safeDate(sdISO)} and ${safeDate(edISO)}`)
            await ddb.insertRows('stock_zh_index_daily', INDEX_DAILY_COLS, rows)
          })
        } catch (e) { console.error('[market] index-kline 入库失败:', e.message) }
      }
      // 直接映射返回网络数据（DDB 入库是加分项，不应阻塞展示），末根仍跟随双源比对结果
      const latest = (await resolveLatestBatch([sym])).get(sym) || null
      const patched = applyLatestToDaily(raw, latest, edISO)
      const kline = toKline(isWeekly || isMonthly ? aggregateDailyRows(patched, period) : patched)
      const meta = latestMeta(latest)
      cache.set(cacheKey, { kline, meta }, klineTtl)
      return ok(res, kline, '成功(网络)', meta)
    }

    // 日K源也为空时，只要双源里有快照数据，仍返回单点K线，避免卡片空白
    const latest = (await resolveLatestBatch([sym])).get(sym) || null
    const fallbackDaily = applyLatestToDaily([], latest, edISO)
    if (fallbackDaily.length > 0) {
      const kline = toKline(fallbackDaily)
      const meta = latestMeta(latest)
      cache.set(cacheKey, { kline, meta }, klineTtl)
      return ok(res, kline, '成功(快照单点)', meta)
    }

    res.json({ code: 503, msg: '数据不可用', data: [] })
  } catch (e) {
    if (e.retryAfterSec) return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    errMsg(res, e.message)
  }
})

module.exports = router
