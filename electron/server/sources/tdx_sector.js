'use strict'

/**
 * 通达信行业板块行情聚合（替代东财行业板块源）。
 *
 * 数据链路：
 *   - 板块清单：本地 tdxzs.cfg 的子行业（类型 2|1|1，约 110 个，含代码 880xxx + 名称）。
 *   - 板块行情：tqcenter(17709) get_market_snapshot 直接返回板块指数 涨跌幅/总成交量/总成交额/
 *               上涨家数/下跌家数/均价（验证可用，无需聚合成分股）。
 *   - 领涨股：get_stock_list_in_sector 取成分股，腾讯全市场快照找涨幅最大者。
 *
 * 口径差异：与东财 90 行业板块的清单/名称不同（子行业更细，约 110 个），
 * 历史 DolphinDB 数据（东财 90 板）与新数据存在口径不连续——这是上游切换的预期行为。
 *
 * 输出：中文键对象数组，字段与 converter.convertPlateMarket 期望一致；
 * net_inflow 无法从 TDX/Tencent 推导，固定为 null。
 */

const tdxQuant = require('./tdx_quant')
const tdxLocal = require('./tdx_local')
const tencent = require('./tencent')

function round2(x) { return Number.isFinite(x) ? Math.round(x * 100) / 100 : null }

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function runPool(items, limit, worker) {
  const out = new Array(items.length)
  let next = 0
  const lanes = Array.from({ length: Math.max(1, Math.min(limit, items.length || 1)) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await worker(items[i], i)
    }
  })
  await Promise.all(lanes)
  return out
}

/**
 * 生成行业板块行情行。
 * @param {string} tradeDate 'YYYY-MM-DD'（写入 trade_date 用；行情本身是实时快照）
 */
async function fetchPlate(tradeDate) {
  if (!tdxQuant.available()) {
    throw new Error('通达信量化接口(17709)不可用，无法获取板块行情（需运行 TdxW 并开启 TQ）')
  }
  const sectors = tdxLocal.getIndustrySectors()
  if (!sectors.length) throw new Error('本地 tdxzs.cfg 无子行业板块数据')

  // 1) 拉各板块成分股
  const withCons = await runPool(sectors, 8, async (s) => {
    try {
      const list = await tdxQuant.getSectorConsts(s.code + '.SH')
      return { code: s.code, name: s.name, cons: Array.isArray(list) ? list : [] }
    } catch (_) {
      return { code: s.code, name: s.name, cons: [] }
    }
  })

  // 2) 腾讯全市场快照（用于领涨股；按 codes 批量在成分股口径下偶发空结果，故直接用全市场）
  const spotMap = new Map()
  try {
    const spot = await tencent.fetchers.spot()
    for (const r of spot) spotMap.set(String(r['代码']), r)
  } catch (_) { /* 领涨股缺失时不阻断板块行情 */ }

  // 3) 板块快照
  const rows = await runPool(sectors, 8, async (s) => {
    try {
      const snap = await tdxQuant.getSectorSnapshot(s.code + '.SH')
      if (!snap || snap.Now == null) return null
      const now = Number(snap.Now)
      const last = Number(snap.LastClose)
      const cons = withCons.find(c => c.code === s.code)?.cons || []
      let leader = null
      let leaderPct = -Infinity
      for (const c of cons) {
        const r = spotMap.get(String(c).replace(/\.\w+$/, ''))
        const p = num(r && r['涨跌幅'])
        if (p != null && p > leaderPct) { leaderPct = p; leader = r }
      }
      return {
        '板块': s.name,
        '涨跌幅': last > 0 ? round2((now - last) / last * 100) : null,
        '总成交量': num(snap.Volume),
        '总成交额': num(snap.Amount) == null ? null : num(snap.Amount) * 10000,
        '净流入': null,
        '上涨家数': num(snap.UpHome),
        '下跌家数': num(snap.DownHome),
        '均价': num(snap.Average),
        '领涨股': leader ? leader['名称'] : null,
        '领涨股最新价': leader ? num(leader['最新价']) : null,
        '领涨股涨跌幅': leader ? num(leader['涨跌幅']) : null
      }
    } catch (_) { return null }
  })
  return rows.filter(Boolean)
}

module.exports = { fetchPlate, getIndustrySectors: tdxLocal.getIndustrySectors }
