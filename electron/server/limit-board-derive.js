'use strict'

/**
 * 复盘涨跌停指标自研推导（零上游依赖，只读库内前复权日K）。
 *
 * 数据源：dfs://tradeinsight / daily_k_qfq（前复权 OHLC，由 daily_k_raw × stock_adj_factor 物化）+ stock_basic（名称/行业）。
 * 口径与 tdx_pool 一致：涨停/跌停按板块阈值（主板±9.8%、创业/科创±19.8%、北交所±29.8%，容差 0.05）判定。
 * 所有涨跌幅基于**前复权**收盘计算：除权/送转的机械跳空已被复权因子修正，不再误判。
 *
 * 指标（炸板回封数留空 → 待 tick 数据联动，当前返回 null，前端显示 '--'）：
 *   limit_up_count / limit_down_count / max_continuous_level / continuous_limit_rate /
 *   one_word_count（涨停股中 high==low，全天单一价位即一字封死）/ yesterday_limitup_avg_change。
 * 连板数(X,D) = 在前复权序列上，从 D 向前回溯 X 连续收盘涨停的交易日数（窗口 90 自然日）。
 */

const ddb = require('../dolphindb/client')
const cache = require('./cache')
const { safeSymbol, safeDate } = require('../dolphindb/params')

const QFQ_TBL = `loadTable("dfs://tradeinsight", "daily_k_qfq")`

/** 板块涨停/跌停阈值（与 tdx_pool.boardThreshold 同口径）。 */
function boardThreshold(code) {
  const c = String(code || '')
  if (/^(3|68)/.test(c)) return 19.8 // 创业板 300/301、科创板 688/689
  if (/^(43|83|87|88|92)/.test(c)) return 29.8 // 北交所
  return 9.8
}

function iso(v) {
  const s = String(v == null ? '' : v).trim()
  if (s.includes('-')) return s
  const m = s.match(/(\d{4})[.\/]?(\d{2})[.\/]?(\d{2})?/)
  return m && m[2] && m[3] ? `${m[1]}-${m[2]}-${m[3]}` : null
}

function shiftISO(isoStr, n) {
  const [y, m, d] = isoStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86400000)
  const p = x => String(x).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`
}

const round2 = v => Math.round((v + Number.EPSILON) * 100) / 100

/** 构建单只股票的前复权序列（升序），每行附带相对自身前一交易日的涨跌幅。 */
function buildSeries(rawList) {
  const list = []
  const byDate = new Map()
  let prevClose = null
  for (const r of rawList) {
    const d = iso(r.trade_date)
    if (!d) continue
    const close = Number(r.close)
    const high = Number(r.high)
    const low = Number(r.low)
    if (!Number.isFinite(close)) continue
    const row = {
      date: d, close, high: Number.isFinite(high) ? high : close, low: Number.isFinite(low) ? low : close,
      raw_close: Number(r.raw_close) || close,
      amount: Number(r.amount) || 0,
      pctChg: prevClose != null && prevClose > 0 ? (close / prevClose - 1) * 100 : null
    }
    list.push(row)
    byDate.set(d, row)
    prevClose = close
  }
  return { list, byDate }
}

/**
 * 加载 [startISO, endISO] 窗口的前复权数据（一次全市场读取，供单日/范围复用）。
 * @returns {{bySym: Map, dates: string[]}} bySym: symbol → {list, byDate}；dates 升序去重
 */
async function loadWindow(startISO, endISO) {
  const sd = safeDate(startISO)
  const ed = safeDate(endISO)
  if (!sd || !ed) throw new Error('日期参数不合法')
  const r = await ddb.execute(
    `select symbol, trade_date, high, low, close, raw_close, amount from ${QFQ_TBL}` +
    ` where trade_date between ${sd} and ${ed} order by symbol, trade_date`
  )
  const bySym = new Map()
  const dates = new Set()
  if (Array.isArray(r)) {
    const bucket = new Map()
    for (const x of r) {
      const sym = safeSymbol(x.symbol)
      const d = iso(x.trade_date)
      if (!sym || !d) continue
      if (!bucket.has(sym)) bucket.set(sym, [])
      bucket.get(sym).push({ trade_date: d, high: x.high, low: x.low, close: x.close, raw_close: x.raw_close, amount: x.amount })
      dates.add(d)
    }
    for (const [sym, rows] of bucket) bySym.set(sym, buildSeries(rows))
  }
  return { bySym, dates: [...dates].sort() }
}

/** D 的涨停股集合 → Map<symbol, row>（前复权口径）。 */
function limitUpSetFor(window, d) {
  const out = new Map()
  for (const [sym, ser] of window.bySym) {
    const row = ser.byDate.get(d)
    if (!row || row.pctChg == null) continue
    if (row.pctChg >= boardThreshold(sym) - 0.05) out.set(sym, row)
  }
  return out
}

function limitDownSetFor(window, d) {
  const out = new Map()
  for (const [sym, ser] of window.bySym) {
    const row = ser.byDate.get(d)
    if (!row || row.pctChg == null) continue
    if (row.pctChg <= -(boardThreshold(sym) - 0.05)) out.set(sym, row)
  }
  return out
}

/** 计算 D 日最高连板数 + 连板≥2 计数 + 每只涨停股的连板数。 */
function levelMetrics(window, upSet) {
  let maxLevel = 0
  let cont2 = 0
  const levels = {}
  for (const [sym, row] of upSet) {
    const ser = window.bySym.get(sym)
    const idx = ser.list.findIndex(r => r.date === row.date)
    const th = boardThreshold(sym) - 0.05
    let level = 1
    for (let i = idx - 1; i >= 0; i--) {
      const p = ser.list[i].pctChg
      if (p != null && p >= th) level++
      else break
    }
    levels[sym] = level
    if (level > maxLevel) maxLevel = level
    if (level >= 2) cont2++
  }
  return { maxLevel, cont2, levels }
}

/** 对窗口导出 D 日复盘指标（不加缓存，调用方决定）。 */
function computeDayFromWindow(window, d) {
  const upSet = limitUpSetFor(window, d)
  const downCount = limitDownSetFor(window, d).size
  const limitUpCount = upSet.size
  const { maxLevel, cont2, levels } = levelMetrics(window, upSet)

  let oneWord = 0
  for (const row of upSet.values()) {
    if (Math.abs(row.high - row.low) < 1e-6) oneWord++
  }

  // 昨日涨停涨幅：上一全局交易日涨停股在 D 的平均涨跌幅
  let yesterdayAvg = null
  const prevDate = [...window.dates].filter(dd => dd < d).pop() || null
  if (prevDate) {
    const prevUp = limitUpSetFor(window, prevDate)
    let sum = 0
    let cnt = 0
    for (const [sym, _r] of prevUp) {
      const today = window.bySym.get(sym) && window.bySym.get(sym).byDate.get(d)
      if (today && today.pctChg != null) { sum += today.pctChg; cnt++ }
    }
    if (cnt > 0) yesterdayAvg = round2(sum / cnt)
  }

  return {
    tradeDate: d,
    maxContinuousLevel: maxLevel,
    limitUpCount,
    limitDownCount: downCount,
    oneWordCount: oneWord,
    continuousLimitRate: limitUpCount > 0 ? round2(cont2 / limitUpCount * 100) : 0,
    blastResealCount: null, // 待 tick 数据联动（当前无数据，前端显示 '--'）
    yesterdayLimitupAvgChange: yesterdayAvg,
    levels
  }
}

/** 单日推导（带 5 分钟结果缓存）。 */
async function deriveDay(dateISO) {
  const d = iso(dateISO)
  if (!d) throw new Error('日期参数不合法')
  const cacheKey = `derive:day:${d}`
  const cached = cache.get(cacheKey)
  if (cached) return cached
  const window = await loadWindow(shiftISO(d, -95), d)
  const out = computeDayFromWindow(window, d)
  cache.set(cacheKey, out, 300)
  return out
}

/**
 * 单日推导（盘中口径）：请求日无前复权数据（盘中未收盘落库/未来日期）时，
 * 自动回退到最近一个已有数据的交易日（≤ 请求日），返回的 tradeDate 即生效日。
 */
async function deriveEffectiveDay(dateISO) {
  const d = iso(dateISO)
  if (!d) throw new Error('日期参数不合法')
  const window = await loadWindow(shiftISO(d, -95), d)
  const eff = [...window.dates].filter(x => x <= d).pop() || null
  if (!eff) throw new Error('无前复权数据可用')
  const cacheKey = `derive:day:${eff}`
  let out = cache.get(cacheKey)
  if (!out) {
    out = computeDayFromWindow(window, eff)
    cache.set(cacheKey, out, 300)
  }
  return out
}

/** 范围推导（按 qfq 实际交易日返回数组，升序；含 5 分钟结果缓存）。 */
async function deriveRange(startISO, endISO) {
  const sd = iso(startISO)
  const ed = iso(endISO)
  if (!sd || !ed) throw new Error('日期参数不合法')
  const cacheKey = `derive:range:${sd}:${ed}`
  const cached = cache.get(cacheKey)
  if (cached) return cached
  const window = await loadWindow(shiftISO(sd, -95), ed)
  const out = window.dates
    .filter(dd => dd >= sd && dd <= ed)
    .map(dd => computeDayFromWindow(window, dd))
  cache.set(cacheKey, out, 300)
  return out
}

/** 名称（sql.js stock_basic）与行业（tdxLocal 本地映射）——均库内/本地，非网络源。 */
function stockMetaMaps() {
  const nameMap = new Map()
  try {
    const { getDb } = require('./db')
    const rows = getDb().prepare('SELECT code, name FROM stock_basic').all()
    for (const x of rows) nameMap.set(String(x.code), x.name)
  } catch (e) { console.warn('[derive] sql.js stock_basic 名称读取失败:', e.message) }
  let indMap = {}
  try { indMap = require('./sources/tdx_local').getStockIndustryMap() } catch (e) { indMap = {} }
  return { nameMap, indMap }
}

/**
 * 昨日涨停池自研推导（/zt-previous 改用，替代已无源的 zt_pool_previous）：
 * 最近完整交易日(D)的前一交易日(Dprev)收盘涨停股，附 D 日前复权涨跌幅/不复权展示价/成交额。
 * 返回行 {symbol, name, latest_price, pct_chg, amount, turnover_rate, industry, consecutive_limit, limit_stats}。
 */
async function deriveZtPrevious(dateISO) {
  const d = iso(dateISO)
  if (!d) throw new Error('日期参数不合法')
  const window = await loadWindow(shiftISO(d, -95), d)
  const effDate = [...window.dates].filter(x => x <= d).pop() || null
  if (!effDate) return []
  const prevDate = [...window.dates].filter(x => x < effDate).pop() || null
  if (!prevDate) return []
  const prevUp = limitUpSetFor(window, prevDate)
  const syms = [...prevUp.keys()]
  if (!syms.length) return []

  const { nameMap, indMap } = stockMetaMaps()
  const { levels: prevLevels } = levelMetrics(window, prevUp)
  const out = []
  for (const [sym, _r] of prevUp) {
    const today = window.bySym.get(sym) && window.bySym.get(sym).byDate.get(effDate)
    out.push({
      symbol: sym,
      name: nameMap.get(sym) || sym,
      latest_price: today ? round2(today.raw_close) : null, // 展示用实际价（不复权）
      pct_chg: today && today.pctChg != null ? round2(today.pctChg) : null,
      amount: today ? today.amount : null,
      turnover_rate: null,
      industry: indMap[sym] || null,
      consecutive_limit: prevLevels[sym] != null ? prevLevels[sym] : 1,
      limit_stats: null
    })
  }
  return out
}

/**
 * 当日涨停池列表自研推导（/limit-pool 改用，Option A：列表与卡片同源 daily_k_qfq）。
 * 返回按连板数降序的行 {stock_code, stock_name, industry, increase_rate(前复权),
 * latest_price(不复权展示价), turnover(成交额), turnover_rate(null), continuous_limit, limit_stats(null)}。
 * 富字段（换手率/封板时间/封单/炸板）待 tick 数据落地后统一接入，当前为 null。
 */
async function deriveLimitUpPool(dateISO) {
  const d = iso(dateISO)
  if (!d) throw new Error('日期参数不合法')
  const window = await loadWindow(shiftISO(d, -95), d)
  const effDate = [...window.dates].filter(x => x <= d).pop() || null
  if (!effDate) return []
  const upSet = limitUpSetFor(window, effDate)
  if (!upSet.size) return []
  const { levels } = levelMetrics(window, upSet)
  const syms = [...upSet.keys()].sort((a, b) => (levels[b] || 1) - (levels[a] || 1))

  const { nameMap, indMap } = stockMetaMaps()
  const out = []
  for (const sym of syms) {
    const row = upSet.get(sym)
    out.push({
      stock_code: sym,
      stock_name: nameMap.get(sym) || sym,
      industry: indMap[sym] || null,
      increase_rate: round2(row.pctChg),
      latest_price: round2(row.raw_close),
      turnover: row.amount,
      turnover_rate: null,
      continuous_limit: levels[sym] != null ? levels[sym] : 1,
      limit_stats: null
    })
  }
  return out
}

module.exports = { deriveDay, deriveEffectiveDay, deriveRange, deriveZtPrevious, deriveLimitUpPool, loadWindow, computeDayFromWindow, boardThreshold }