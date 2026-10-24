'use strict'

/**
 * 前复权日K物化 job —— daily_k_raw（不复权） × stock_adj_factor（复权因子） → daily_k_qfq。
 *
 * 动机：未复权价在除权/除息/送转日会机械跳空（高送转可下拉 50%），直接按不复权收盘算
 * 涨跌幅会把除权当"跌停"、把涨停链打断。复盘/涨跌停指标必须以**前复权口径**为准。
 *
 * 因子语义（见 derive-adjust.js / adj-factor-repository.js）：
 *   factor(t) = 事件日的后复权累计因子（事件间常数），前复权价(t) = raw(t) × factor(t) / anchor
 *   anchor = 该股最新事件 factor（使最新价与真实一致）。本 job 只用同一函数统一换算，
 *   保证 daily_k_qfq 的 OHLC 全部为"前复权价"，且同日各价同乘、`high==low` 等号关系保持。
 *
 * 表：dfs://tradeinsight / daily_k_qfq，列序与 ensureSchema/col-defs.js 一致。
 * 写路径：先删窗口再分批插入（幂等），仅物化最近窗口（默认 180 自然日 ≈ 125 交易日），
 * 由每晚 package-sync 完成 raw 同步后调用（可挂 CLI 手动执行）。
 *
 * 用法：
 *   node electron/dolphindb/qfq-materialize.js                    # 最近 180 自然日 → 今天
 *   node electron/dolphindb/qfq-materialize.js --days=300          # 更大窗口
 *   node electron/dolphindb/qfq-materialize.js --end=2026-10-21    # 指定截止日
 *   node electron/dolphindb/qfq-materialize.js --start=... --end=...
 */

const ddb = require('./client')
const { safeDate } = require('./params')

const RAW_DB = 'dfs://tradeinsight_raw'
const RAW_TBL = `loadTable("${RAW_DB}", "daily_k_raw")`
const QFQ_TBL = `loadTable("dfs://tradeinsight", "daily_k_qfq")`

function iso(v) {
  const s = String(v == null ? '' : v).trim()
  if (s.includes('-')) return s
  const m = s.match(/(\d{4})[.\/]?(\d{2})?[.\/]?(\d{2})?/)
  if (!m) return null
  return m[2] && m[3] ? `${m[1]}-${m[2]}-${m[3]}` : null
}

function localISO(d) {
  const p = x => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function shiftISO(isoStr, n) {
  const [y, m, d] = isoStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86400000)
  const p = x => String(x).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`
}

/** 读取全部复权因子（symbol,date,factor）按 symbol 分组升序。 */
async function loadFactors() {
  const r = await ddb.execute(
    `select symbol, trade_date, factor from loadTable("${RAW_DB}", "stock_adj_factor") order by symbol, trade_date`
  )
  const by = new Map()
  if (!Array.isArray(r)) return by
  for (const x of r) {
    const sym = String(x.symbol)
    const d = iso(x.trade_date)
    const f = Number(x.factor)
    if (!sym || !d || !Number.isFinite(f) || f <= 0) continue
    if (!by.has(sym)) by.set(sym, [])
    by.get(sym).push({ date: d, factor: f })
  }
  return by
}

/** 给定因子序列，在 date 处的前复权系数 k = factor(date)/anchor（无事件默认 1）。 */
function qfqScale(factors, date) {
  let f = 1
  for (const e of factors) {
    if (e.date <= date) f = e.factor
    else break
  }
  const anchor = factors.length ? factors[factors.length - 1].factor : 1
  return f / anchor
}

const round4 = (v) => Math.round((v + Number.EPSILON) * 10000) / 10000

/**
 * 物化 [startISO, endISO] 窗口（闭区间）的前复权行。
 * @returns {Promise<{raw:number, inserted:number}>}
 */
async function materialize({ startISO, endISO }) {
  const sd = safeDate(startISO)
  const ed = safeDate(endISO)
  if (!sd || !ed) throw new Error('日期参数不合法')
  const COLS = require('../server/col-defs').COLS.daily_k_qfq
  const factors = await loadFactors()

  const r = await ddb.execute(
    `select symbol, trade_date, open, high, low, close, amount from ${RAW_TBL}` +
    ` where trade_date between ${sd} and ${ed} order by symbol, trade_date`
  )
  if (!Array.isArray(r) || !r.length) return { raw: 0, inserted: 0 }

  // 按 symbol 分组并保序
  const bySym = new Map()
  for (const x of r) {
    const sym = String(x.symbol)
    const d = iso(x.trade_date)
    if (!sym || !d) continue
    if (!bySym.has(sym)) bySym.set(sym, [])
    bySym.get(sym).push({
      date: d,
      open: Number(x.open), high: Number(x.high), low: Number(x.low),
      close: Number(x.close), amount: Number(x.amount)
    })
  }

  const ts = new Date()
  const rows = []
  for (const [sym, list] of bySym) {
    const fac = factors.get(sym) || []
    for (const b of list) {
      const k = qfqScale(fac, b.date)
      rows.push({
        symbol: sym,
        trade_date: b.date,
        open: round4(b.open * k),
        high: round4(b.high * k),
        low: round4(b.low * k),
        close: round4(b.close * k),
        raw_close: b.close,
        amount: b.amount,
        create_time: ts
      })
    }
  }

  await ddb.execute(`t = ${QFQ_TBL}; delete from t where trade_date between ${sd} and ${ed}`)
  const CHUNK = 1500
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    await ddb.insertRows('daily_k_qfq', COLS, chunk)
    inserted += chunk.length
  }
  return { raw: r.length, inserted }
}

async function main() {
  const args = process.argv.slice(2)
  let days = 180
  let start, end
  for (const a of args) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a)
    if (!m) continue
    if (m[1] === 'days') days = Number(m[2])
    else if (m[1] === 'start') start = m[2]
    else if (m[1] === 'end') end = m[2]
  }
  const todayISO = localISO(new Date())
  const endISO = end || todayISO
  const startISO = start || shiftISO(endISO, -(days - 1))

  console.log(`=== 前复权物化 === 窗口 ${startISO} ~ ${endISO}`)
  const r = await materialize({ startISO, endISO })
  console.log(`完成: raw ${r.raw} 行 → daily_k_qfq 写入 ${r.inserted} 行`)
  process.exit(0)
}

if (require.main === module) {
  main().catch(e => { console.error('失败:', e.stack || e.message); process.exit(1) })
}

module.exports = { materialize }