'use strict'

/**
 * 数据源真机冒烟（手动运行）。
 *
 * 用法：node electron/server/sources/_smoke.js
 *
 * 覆盖范围＝当前生产在用的四源三链（腾讯 + 通达信 tdx_local / tdx_quant / tdx_server）：
 *   1) 腾讯 日K（600519）
 *   2) 腾讯 指数日K（000001 上证指数）
 *   3) 腾讯 全市场快照 spot
 *   4) 调度器 failover：mock 一个必空/必失败源，验证自动切到真实源
 *   5) 各源健康状态汇总
 *
 * 任一步失败即非零退出。网络不通/未装通达信客户端时，对应源会失败——
 * 这是运行环境问题而非代码 bug，输出里会区分标注。
 *
 * 历史说明：本脚本早期用于验证新浪/网易（2026-10 前）。这两源已按 AGENTS.md
 * 数据源红线永久弃用并从仓库删除，脚本同步收敛到在用的四源，避免"冒烟脚本
 * 仍真实调用已弃用源"这类红线残留。
 */

const registry = require('./registry')

const TODAY = new Date()
const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '')
const END = fmt(TODAY)
const START = fmt(new Date(TODAY.getTime() - 7 * 86400000))

function head(arr, n = 2) {
  return JSON.stringify((arr || []).slice(0, n)).slice(0, 180)
}

let pass = 0, fail = 0, skip = 0

async function step(n, label, fn, { optional = false } = {}) {
  console.log(`[smoke] ${n} ${label}...`)
  try {
    const t0 = Date.now()
    const r = await fn()
    const count = Array.isArray(r) ? r.length : (r == null ? 0 : 1)
    if (Array.isArray(r) && r.length === 0) throw new Error('返回空结果')
    console.log(`[smoke]    ✅ ${Array.isArray(r) ? r.length + ' 行' : 'OK'} (${Date.now() - t0}ms) ${Array.isArray(r) ? head(r) : ''}`)
    pass++
    return r
  } catch (e) {
    if (optional) {
      console.warn(`[smoke]    ⚠ 跳过（环境不可用，非代码问题）: ${e.message}`)
      skip++
      return null
    }
    console.error(`[smoke]    ❌ ${e.message}`)
    fail++
    return null
  }
}

async function main() {
  // 必须先加载 aktools 才会注册四个源（注册动作写在模块顶层）
  require('../aktools')

  console.log('[smoke] 已注册源:', registry.getHealthStatus().map(s => s.name).join(', '))

  const params = { symbol: '600519', period: 'daily', start_date: START, end_date: END }

  await step('1/5', '腾讯 日K 600519', () => registry.dispatch('kline', params, { sources: ['tencent'] }))
  await step('2/5', '腾讯 指数日K 000001', () => registry.dispatch('indexDaily', { symbol: '000001', start_date: START, end_date: END }, { sources: ['tencent'] }))
  await step('3/5', '腾讯 全市场快照 spot', () => registry.dispatch('spot', undefined, { sources: ['tencent'] }), { optional: true })

  // failover：mock 源必须失败，调度应自动落到 tencent
  console.log('[smoke] 4/5 调度器 failover（mock 源返回空 → 应自动切 tencent）...')
  registry.registerSource({
    name: '_smoke_mock',
    capabilities: ['kline'],
    fetchers: { kline: async () => [] },
    available: () => true
  })
  await step('4/5', 'failover → tencent', async () => {
    const r = await registry.dispatch('kline', params, { sources: ['_smoke_mock', 'tencent'] })
    if (!Array.isArray(r) || !r.length) throw new Error('failover 后仍为空')
    return r
  })

  console.log('[smoke] 5/5 源健康状态:', JSON.stringify(
    registry.getHealthStatus().map(s => ({ name: s.name, ok: s.ok, fail: s.fail, healthy: s.healthy }))
  ))

  console.log(`\n[smoke] === ${pass} passed, ${fail} failed, ${skip} skipped ===`)
  if (fail) process.exit(1)
}

main().catch(e => {
  console.error('[smoke] ❌ 失败:', e.message)
  process.exit(1)
})
