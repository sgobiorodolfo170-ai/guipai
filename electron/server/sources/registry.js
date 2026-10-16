'use strict'

/**
 * 多数据源健康度感知调度器。
 *
 * 设计目标：把"主源失败 → 切下一源"的兜底逻辑从各函数里抽出来统一管理，
 * 解决两个长期痛点：
 *   1) 软封空结果歧义：东财被 WAF 软封时返回空数组（非抛错），原实现把空数组
 *      当"真无数据"直接 return，跳过兜底。本调度器把"空数组"一律视为"该源未命中"
 *      继续试下一源，只有所有源都空才判定真无数据。
 *   2) 健康度记忆：某源连续失败 N 次进入冷却期，后续 dispatch 直接跳过，
 *      不再每请求都白等一次超时；冷却到期自动试探恢复。
 *
 * 两种策略：
 *   - failover（默认）：按优先级串行，首个返回非空数据者胜出
 *   - race：并发竞速取首个非空成功（用于 spot/指数 spot 等热接口）
 *
 * 每源记 {ok, fail, consecutiveFail, cooldownUntil, lastError}。
 * 空结果不记 fail（可能是真无数据，避免误伤）；抛错才记 fail + 冷却。
 */

const FAIL_THRESHOLD = 3      // 连续失败 N 次进冷却
const COOLDOWN_MS = 30000     // 冷却时长（秒级，够上游恢复）

const stats = new Map()       // name -> {ok, fail, consecutiveFail, cooldownUntil, lastError, lastUsedAt}
const sources = []            // [{name, capabilities:Set, fetchers, available}]

function statOf(name) {
  if (!stats.has(name)) {
    stats.set(name, { ok: 0, fail: 0, consecutiveFail: 0, cooldownUntil: 0, lastError: null, lastUsedAt: 0 })
  }
  return stats.get(name)
}

function markOk(name) {
  const st = statOf(name)
  st.ok++; st.consecutiveFail = 0; st.cooldownUntil = 0; st.lastUsedAt = Date.now()
}

function markFail(name, err) {
  const st = statOf(name)
  st.fail++; st.consecutiveFail++; st.lastError = err && err.message; st.lastUsedAt = Date.now()
  if (st.consecutiveFail >= FAIL_THRESHOLD) {
    st.cooldownUntil = Date.now() + COOLDOWN_MS
    console.warn(`[sources] ${name} 连续失败 ${st.consecutiveFail} 次，进入 ${COOLDOWN_MS / 1000}s 冷却`)
  }
}

function isHealthy(name) {
  const st = statOf(name)
  return st.cooldownUntil <= Date.now()
}

/** 注册一个数据源。
 *  @param {Object} src { name, capabilities:[dataType...], fetchers:{dataType->fn}, available?:()=>bool } */
function registerSource(src) {
  if (sources.some(s => s.name === src.name)) {
    console.warn(`[sources] 源 ${src.name} 已注册，覆盖`)
    const i = sources.findIndex(s => s.name === src.name)
    sources.splice(i, 1)
  }
  sources.push({
    name: src.name,
    capabilities: new Set(src.capabilities || []),
    fetchers: src.fetchers || {},
    available: src.available || (() => true)
  })
  statOf(src.name)
}

/** 各数据类型的源优先级（首源为主，后续为兜底）。可被 settings 覆盖（Phase 3）。 */
// ⚠ 临时冻结非 TDX 源（用户要求测试通达信源效果）。恢复时把 PRIORITY_TDX_ONLY 改回 false。
const PRIORITY_TDX_ONLY = true

// 原始优先级（恢复时用）：
const PRIORITY_FULL = {
  kline: ['tdx_server', 'tdx_quant', 'tdx_local', 'main', 'sina', 'akshare'],
  spot: ['main', 'sina', 'akshare'],
  indexDaily: ['main', 'sina', 'akshare'],
  indexSpot: ['main', 'sina'],
  minute: ['tdx_server', 'tdx_quant', 'main', 'sina', 'akshare'],
  limitPool: ['tdx_server', 'tdx_quant', 'main', 'akshare'],
  dropPool: ['main', 'akshare'],
  ztPrev: ['main', 'akshare'],
  industry: ['main', 'akshare'],
  info: ['tdx_server', 'tdx_quant', 'main', 'akshare'],
  holding: ['main']
}

// TDX-only 优先级（冻结 main/sina/akshare，仅 tdx_server/tdx_quant/tdx_local）
// indexDaily 增加 tdx_local 兜底：tqs 桥（tdx_server）未运行时回落读本机 vipdoc
// 指数 .day 文件（1998 起深历史），保证 TDX 冻结模式下指数K线仍可回填历史。
const PRIORITY_TDX = {
  kline: ['tdx_server', 'tdx_quant', 'tdx_local'],
  spot: ['tdx_server', 'tdx_quant'],
  indexDaily: ['tdx_server', 'tdx_local'],
  indexSpot: ['tdx_server'],
  minute: ['tdx_server', 'tdx_quant'],
  limitPool: ['tdx_server', 'tdx_quant'],
  dropPool: ['tdx_server', 'tdx_quant'],
  ztPrev: ['tdx_server'],
  industry: ['tdx_server'],
  info: ['tdx_server', 'tdx_quant'],
  financial: ['tdx_server', 'tdx_quant'],
  holding: ['tdx_server'],
}

const PRIORITY = PRIORITY_TDX_ONLY ? PRIORITY_TDX : PRIORITY_FULL

/** 串行 failover：按优先级逐源尝试，空数组/抛错都继续下一源，全部失败抛聚合错误。 */
async function failover(dataType, params, order) {
  const reasons = []
  let lastErr = null
  for (const name of order) {
    const src = sources.find(s => s.name === name)
    if (!src) continue
    if (!src.capabilities.has(dataType)) { reasons.push(`${name}:无${dataType}能力`); continue }
    if (src.available() === false) { reasons.push(`${name}:不可用`); continue }
    if (!isHealthy(name)) { reasons.push(`${name}:冷却中`); continue }
    const fn = src.fetchers[dataType]
    if (typeof fn !== 'function') { reasons.push(`${name}:无${dataType}fetcher`); continue }
    const t0 = Date.now()
    try {
      const data = await fn(params)
      const arr = Array.isArray(data) ? data : (data == null ? [] : [data])
      if (arr.length > 0) {
        markOk(name)
        if (name !== order[0]) {
          console.warn(`[sources] ${dataType} 主源未命中，由 ${name} 提供(${arr.length} 行,${Date.now() - t0}ms)`)
        }
        return data
      }
      // 空结果：不记 fail（可能是真无数据），但记原因继续下一源
      reasons.push(`${name}:空`)
    } catch (e) {
      reasons.push(`${name}:${String((e && e.message) || e).slice(0, 60)}`)
      lastErr = e
      markFail(name, e)
    }
  }
  // 全链失败：优先抛最后一个真实异常（保留原始类型/堆栈，如 retryAfterSec 等附加属性），
  // 但必须把各源原因聚合进 message —— 否则上层只看到最后一个源的报错，
  // 表现为「Cannot read properties of undefined」这类无信息量错误，极难定位。
  const reasonStr = reasons.length ? `（${reasons.join('；')}）` : ''
  if (lastErr) {
    lastErr.message = `${lastErr.message || '数据源失败'}${reasonStr}`
    lastErr.reasons = reasons
    lastErr.dataType = dataType
    throw lastErr
  }
  const err = new Error(`${dataType} 各源均返回空${reasonStr}`)
  err.reasons = reasons
  err.dataType = dataType
  throw err
}

/** 并发竞速：多源同时发起，取首个非空成功；全部失败抛聚合错误。 */
async function race(dataType, params, order) {
  const fns = order
    .map(name => {
      const src = sources.find(s => s.name === name)
      if (!src || !src.capabilities.has(dataType)) return null
      if (src.available() === false || !isHealthy(name)) return null
      const fn = src.fetchers[dataType]
      return typeof fn === 'function' ? { name, fn } : null
    })
    .filter(Boolean)
  if (!fns.length) {
    const e = new Error(`${dataType} 无可用源`); e.dataType = dataType; throw e
  }
  return await new Promise((resolve, reject) => {
    let pending = fns.length
    let firstErr = null
    const reasons = []
    fns.forEach(({ name, fn }) => {
      Promise.resolve().then(() => fn(params)).then(
        (data) => {
          const arr = Array.isArray(data) ? data : (data == null ? [] : [data])
          if (arr.length > 0) { markOk(name); resolve(data) }
          else { reasons.push(`${name}:空`); if (--pending === 0) finish() }
        },
        (e) => { reasons.push(`${name}:${e.message.slice(0, 60)}`); markFail(name, e); firstErr = firstErr || e; if (--pending === 0) finish() }
      )
    })
    function finish() {
      const err = firstErr || new Error(`${dataType} 各源竞速均空（${reasons.join('；')}）`)
      err.reasons = reasons; err.dataType = dataType; reject(err)
    }
  })
}

/** 调度入口。
 *  @param dataType 数据类型（kline/spot/indexDaily/...）
 *  @param params 透传给源 fetcher 的参数
 *  @param opts {strategy:'failover'|'race', sources?:[name...]覆盖优先级} */
async function dispatch(dataType, params, opts = {}) {
  const order = opts.sources || PRIORITY[dataType] || ['main']
  if (opts.strategy === 'race') return race(dataType, params, order)
  return failover(dataType, params, order)
}

/** 各源健康状态（供数据总览页展示）。 */
function getHealthStatus() {
  const now = Date.now()
  return sources.map(s => {
    const st = statOf(s.name)
    return {
      name: s.name,
      capabilities: [...s.capabilities],
      available: s.available(),
      healthy: isHealthy(s.name),
      ok: st.ok,
      fail: st.fail,
      cooldownLeftSec: st.cooldownUntil > now ? Math.ceil((st.cooldownUntil - now) / 1000) : 0,
      lastError: st.lastError
    }
  })
}

module.exports = { registerSource, dispatch, getHealthStatus, markOk, markFail, isHealthy }
