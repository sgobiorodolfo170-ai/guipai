'use strict'

/**
 * 数据源真机冒烟（手动运行，验证新浪/网易/调度器 failover）。
 *
 * 用法：node electron/server/sources/_smoke.js
 *
 * 测试项：
 *   1) 新浪 K线（600519 近 5 交易日）
 *   2) 新浪 指数日K（000001 上证指数 近 5 交易日）
 *   3) 网易 K线（600519 近 5 交易日）
 *   4) 调度器 failover：注册一个必失败的 mock main + sina，验证 main 空时自动切新浪
 *   5) 新浪全市场快照（spot，重型，可选）
 *
 * 任一步失败即非零退出。网络不通时新浪/网易也会失败——这是源本身问题而非代码 bug。
 */

const registry = require('./registry')
const sina = require('./sina')
const netease = require('./netease')

const TODAY = new Date()
const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, '')
const END = fmt(TODAY)
const START = fmt(new Date(TODAY.getTime() - 7 * 86400000))

function head(arr, n = 3) {
  return JSON.stringify((arr || []).slice(0, n)).slice(0, 200)
}

async function step(n, label, fn) {
  console.log(`[smoke] ${n} ${label}...`)
  try {
    const t0 = Date.now()
    const r = await fn()
    const ok = Array.isArray(r) ? r.length : (r != null)
    console.log(`[smoke]    ✅ ${Array.isArray(r) ? r.length + ' 行' : 'OK'} (${Date.now() - t0}ms) ${Array.isArray(r) ? head(r) : ''}`)
    return r
  } catch (e) {
    console.error(`[smoke]    ❌ ${e.message}`)
    throw e
  }
}

async function main() {
  await step('1/5', '新浪 K线 600519', () => sina.fetchers.kline({ symbol: '600519', period: 'daily', start_date: START, end_date: END }))
  await step('2/5', '新浪 指数日K 000001(上证指数)', () => sina.fetchers.indexDaily({ symbol: '000001', start_date: START, end_date: END }))
  await step('3/5', '网易 K线 600519', () => netease.fetchers.kline({ symbol: '600519', period: 'daily', start_date: START, end_date: END }))

  // failover 验证：mock 一个必失败的 main + 真实 sina，调度应自动切到 sina
  console.log('[smoke] 4/5 调度器 failover（mock main 必失败，应自动切新浪）...')
  const reg2 = { registerSource: registry.registerSource, dispatch: registry.dispatch }
  // 注意：registry 是单例，main 已在 aktools.js 注册；这里再注册会覆盖。
  // 为隔离测试，用独立 capabilities 名避免污染：
  // 实际上直接用 kline：mock main 返回空，sina 真实，看是否切到 sina。
  // 但 main 已注册为真实复合链——为不污染，注册一个 _smoke_mock 源并临时覆盖优先级。
  registry.registerSource({
    name: '_smoke_mock',
    capabilities: ['kline'],
    fetchers: { kline: async () => [] }, // 必返回空
    available: () => true
  })
  const t0 = Date.now()
  try {
    const r = await registry.dispatch('kline', { symbol: '600519', period: 'daily', start_date: START, end_date: END }, { sources: ['_smoke_mock', 'sina'] })
    const arr = Array.isArray(r) ? r : []
    if (!arr.length) throw new Error('failover 后仍为空')
    console.log(`[smoke]    ✅ 切到 sina，${arr.length} 行 (${Date.now() - t0}ms) ${head(arr)}`)
  } catch (e) {
    console.error(`[smoke]    ❌ failover 失败: ${e.message}`)
    throw e
  }

  // spot 较重，放最后，可选
  console.log('[smoke] 5/5 新浪全市场快照（spot，较重）...')
  try {
    const t1 = Date.now()
    const r = await sina.fetchers.spot()
    const arr = Array.isArray(r) ? r : []
    if (!arr.length) throw new Error('新浪 spot 返回空')
    console.log(`[smoke]    ✅ ${arr.length} 只 (${Date.now() - t1}ms) ${head(arr)}`)
  } catch (e) {
    console.warn(`[smoke]    ⚠ 新浪 spot 失败（可接受，网络/接口问题）: ${e.message}`)
  }

  // 健康状态
  console.log('[smoke] 源健康状态:', JSON.stringify(registry.getHealthStatus().map(s => ({ name: s.name, ok: s.ok, fail: s.fail, healthy: s.healthy }))))

  console.log('[smoke] ✅ 全链路通过')
}

main().catch(e => {
  console.error('[smoke] ❌ 失败:', e.message)
  process.exit(1)
})
