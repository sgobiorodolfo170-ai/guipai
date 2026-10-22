'use strict'

/**
 * 涨跌停池（腾讯快照主源 + 通达信封板数据 best-effort 补全）。
 *
 * 主源：腾讯全市场快照按涨停/跌停阈值过滤（主板 ±9.8%、创业板/科创板 ±19.8%、北交所 ±29.8%），
 *      天然包含名称/价格/涨跌幅/成交量/成交额/换手/市值。
 * 补全：对命中代码再调 tdx_quant get_zdt_data（按 800 分片）取封板资金/首末封板时间/开板次数；
 *      TdxW 未运行或返回全零时该项留 null，不影响池本身。
 *
 * 输出 converter.convertStockLimitPool 期望的中文键行；替代东财涨跌停池源。
 */

const tdxQuant = require('./tdx_quant')
const tdxLocal = require('./tdx_local')
const tencent = require('./tencent')

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function suffix(code) {
  const c = String(code || '')
  if (/^(43|83|87|88|92)/.test(c)) return 'BJ'
  return c.startsWith('6') ? 'SH' : 'SZ'
}

function fmtZdtTime(v) {
  const n = num(v)
  return n ? String(Math.trunc(n)).padStart(6, '0') : null
}

function boardThreshold(code) {
  const c = String(code || '')
  if (/^(3|68)/.test(c)) return 19.8       // 创业板 300/301、科创板 688/689
  if (/^(43|83|87|88|92)/.test(c)) return 29.8  // 北交所
  return 9.8
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
 * @param {string} date 'YYYY-MM-DD' 或 'YYYYMMDD'
 * @param {'LIMIT_UP'|'LIMIT_DOWN'} dataType
 */
async function fetch(date, dataType) {
  const isUp = dataType === 'LIMIT_UP'
  const spot = await tencent.fetchers.spot()
  if (!spot.length) throw new Error('腾讯全市场行情为空')

  // 本地元数据：名称 + 行业
  let meta = new Map()
  let indMap = {}
  try {
    const { getDb } = require('../db')
    meta = new Map(getDb().prepare('SELECT code, name FROM stock_basic').all().map(x => [x.code, x.name]))
  } catch (_) {}
  try { indMap = tdxLocal.getStockIndustryMap() } catch (_) { indMap = {} }

  // 按阈值过滤
  const hits = []
  for (const r of spot) {
    const code = String(r['代码'])
    const pct = num(r['涨跌幅'])
    if (pct == null) continue
    const t = boardThreshold(code)
    if (isUp ? pct >= t - 0.05 : pct <= -t + 0.05) hits.push(r)
  }
  if (!hits.length) return []

  // 通达信封板数据 best-effort 补全（无则 null）
  const fdMap = new Map()
  if (tdxQuant.available() && hits.length) {
    const d = String(date || '').replace(/\D/g, '')
    const CHUNK = 800
    const list = hits.map(r => `${r['代码']}.${suffix(r['代码'])}`)
    const chunks = []
    for (let i = 0; i < list.length; i += CHUNK) chunks.push(list.slice(i, i + CHUNK))
    const parts = await runPool(chunks, 4, async (codes) => {
      try {
        const r = await tdxQuant.callRaw('get_zdt_data', { stock_list: codes, date: d }, 60000)
        const box = r && (r.Value || r.data)
        return (box && typeof box === 'object' && !Array.isArray(box)) ? box : {}
      } catch (_) { return {} }
    })
    const box = Object.assign({}, ...parts)
    for (const [full, x] of Object.entries(box)) {
      if (x && typeof x === 'object') fdMap.set(String(full).replace(/\.\w+$/, ''), x)
    }
  }

  return hits.map((r) => {
    const code = String(r['代码'])
    const fd = fdMap.get(code) || {}
    const row = {
      '代码': code,
      '名称': meta.get(code) || r['名称'] || null,
      '最新价': num(r['最新价']),
      '涨跌幅': num(r['涨跌幅']),
      '成交量': num(r['成交量']),
      '流通市值': num(r['流通市值']),
      '总市值': num(r['总市值']),
      '换手率': num(r['换手率']),
      '所属行业': indMap[code] || null,
      '最后封板时间': fmtZdtTime(isUp ? fd.FirstTimeZT : fd.LastTimeDT),
      '连板数': null,
      '涨停统计': null
    }
    if (isUp) {
      row['封板资金'] = num(fd.FDVolMaxZT)
      row['首次封板时间'] = fmtZdtTime(fd.FirstTimeZT)
      row['炸板次数'] = num(fd.OpenTimesZT)
    } else {
      row['封单资金'] = num(fd.FDVolMaxDT)
      row['动态市盈率'] = num(r['市盈率-动态'])
      row['板上成交量'] = null
      row['连续跌停'] = null
      row['开板次数'] = num(fd.OpenTimesDT)
    }
    return row
  }).filter(x => x['代码'] && x['名称'])
}

module.exports = { fetch }