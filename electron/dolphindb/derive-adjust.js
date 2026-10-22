'use strict'

/**
 * 复权因子离线推导 CLI。
 *
 * 用法：
 *   node electron/dolphindb/derive-adjust.js --code 600519 [--code 000001]  单股
 *   node electron/dolphindb/derive-adjust.js --full [--resume]              全市场（--resume 跳过已生成）
 *   node electron/dolphindb/derive-adjust.js --verify [--code 600519,000001] 交叉验证
 *
 * 原理：factor(t) = factor(t-1) × ratio_e，其中事件日 e 的
 *   除权参考价 = (前收 − 每股派息 + 配股价×每股配股) / (1 + 每股送转 + 每股配股)
 *   ratio_e = 前收 / 除权参考价
 *   前收 = 事件日前**最近一个交易日**的 daily_k_raw 不复权收盘。
 * 仅在事件日落库一行（事件间 ratio=1、factor 为常数），避免逐日 ~30M 行。
 * 前复权价(t) = raw(t)×factor(t)/factor(最新事件)；后复权价(t) = raw(t)×factor(t)。
 *
 * 跳过事件（含计数告警）：前收缺失/非正；配股事件缺配股价（a>0 且 allot_price 空/0）。
 */

const parseArgs = (argv) => {
  const opts = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { (opts[key] ? opts[key].push(next) : opts[key] = [next]); i++ }
      else opts[key] = true
    }
  }
  if (opts.code && !Array.isArray(opts.code)) opts.code = [opts.code]
  if (opts['verify-code'] && !Array.isArray(opts['verify-code'])) opts['verify-code'] = [opts['verify-code']]
  const flatCodes = (arr) => (arr || []).flatMap(c => String(c).split(',')).map(c => c.trim()).filter(Boolean)
  opts.code = flatCodes(opts.code)
  opts['verify-code'] = flatCodes(opts['verify-code'])
  return opts
}

const ddb = require('./client')
const dividendRepo = require('./dividend-repository')
const factorRepo = require('./adj-factor-repository')

const RAW_TBL = `loadTable("dfs://tradeinsight_raw", "daily_k_raw")`

function iso(v) { // 'YYYY.MM.DD' / 'YYYYMMDD' → 'YYYY-MM-DD'
  const s = String(v).trim()
  if (s.includes('-')) return s
  const m = s.match(/(\d{4})[.\/]?(\d{2})[.\/]?(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

/** 读取该股 daily_k_raw 收盘序列（升序） */
async function rawCloses(symbol) {
  const r = await ddb.execute(
    `select trade_date as d, close as c from ${RAW_TBL} where symbol='${symbol}' order by trade_date`
  )
  if (!Array.isArray(r)) return []
  return r.map(x => ({ date: iso(x.d), close: Number(x.c) })).filter(x => x.date && Number.isFinite(x.close))
}

/** 批量读取多只股票的 raw 收盘（symbol in (...) 一次查询，避免逐股扫分区） */
async function rawClosesBatch(symbols) {
  const out = new Map()
  const CHUNK = 200
  for (let i = 0; i < symbols.length; i += CHUNK) {
    const batch = symbols.slice(i, i + CHUNK)
    const list = batch.map(c => `'${c}'`).join(',')
    const r = await ddb.execute(
      `select symbol as s, trade_date as d, close as c from ${RAW_TBL} where symbol in [${list}] order by symbol, trade_date`
    )
    if (!Array.isArray(r)) continue
    for (const x of r) {
      const date = iso(x.d)
      const close = Number(x.c)
      if (!date || !Number.isFinite(close)) continue
      if (!out.has(x.s)) out.set(x.s, [])
      out.get(x.s).push({ date, close })
    }
  }
  return out
}

/** 一次性读取全部权息事件（按 symbol 分组） */
async function allEvents() {
  const r = await ddb.execute(
    `select symbol as s, ex_date as d, event_type, cash_per_10, share_transfer_per_10, allotment_per_10, allot_price` +
    ` from loadTable("dfs://tradeinsight_raw","stock_dividend") order by symbol, ex_date`
  )
  const by = new Map()
  if (!Array.isArray(r)) return by
  for (const x of r) {
    if (!by.has(x.s)) by.set(x.s, [])
    by.get(x.s).push({
      ex_date: iso(x.d),
      cash_per_10: x.cash_per_10 != null ? Number(x.cash_per_10) : null,
      share_transfer_per_10: x.share_transfer_per_10 != null ? Number(x.share_transfer_per_10) : null,
      allotment_per_10: x.allotment_per_10 != null ? Number(x.allotment_per_10) : null,
      allot_price: x.allot_price != null ? Number(x.allot_price) : null
    })
  }
  return by
}

/** 日期 → 最近一个严格之前的交易日 close（closes 升序，二分） */
function prevCloseBefore(closes, target) {
  let lo = 0, hi = closes.length - 1, ans = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (closes[mid].date < target) { ans = mid; lo = mid + 1 } else hi = mid - 1
  }
  return ans >= 0 ? closes[ans].close : null
}

/** 推导单只股票因子（仅事件日），返回 {rows, skip} */
async function deriveOne(symbol) {
  const [events, closes] = await Promise.all([
    dividendRepo.getDividends(symbol),
    rawCloses(symbol)
  ])
  return deriveWithCloses(symbol, events, closes)
}

/** 纯计算：给定 symbol + 事件序列 + 该股 closes，推导因子（仅事件日） */
function deriveWithCloses(symbol, events, closes) {
  const skip = { noPrev: 0, noAllotPrice: 0, badRef: 0 }
  if (!events.length) return { rows: [], skip }

  let factor = 1
  const rows = []
  for (const ev of events) {
    const ex = ev.ex_date
    const prevClose = prevCloseBefore(closes, ex)
    if (prevClose == null || !Number.isFinite(prevClose) || prevClose <= 0) { skip.noPrev++; continue }

    const d = Number.isFinite(ev.cash_per_10) ? ev.cash_per_10 / 10 : 0   // 每股派息
    const s = Number.isFinite(ev.share_transfer_per_10) ? ev.share_transfer_per_10 / 10 : 0 // 每股送转
    const a = Number.isFinite(ev.allotment_per_10) ? ev.allotment_per_10 / 10 : 0           // 每股配股
    const pa = Number.isFinite(ev.allot_price) ? ev.allot_price : 0                          // 配股价(每股)
    if (a > 0 && (!pa || pa <= 0)) { skip.noAllotPrice++; continue }

    const denom = 1 + s + a
    const refPrice = (prevClose - d + pa * a) / denom
    if (!Number.isFinite(refPrice) || refPrice <= 0) { skip.badRef++; continue }

    factor = factor * (prevClose / refPrice)
    rows.push({ symbol, trade_date: ex, factor: Math.round(factor * 1e8) / 1e8 })
  }
  return { rows, skip }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  await ddb.connect()  // 未连接时 getDividends/getFactors 的 isConnected 短路会静默返回空

  if (opts.verify) {
    const codes = opts['verify-code'] || (opts.code || ['600519', '000858', '000001'])
    await verifyAdjust(codes)
    process.exit(0)
  }

let codes = []
  if (opts.code && opts.code.length) {
    codes = opts.code.map(c => String(c).replace(/\D/g, '').slice(0, 6)).filter(c => /^\d{6}$/.test(c))
    const skipTotal = { noPrev: 0, noAllotPrice: 0, badRef: 0 }
    let ok = 0, factRows = 0
    const failures = []
    for (const code of codes) {
      try {
        const { rows, skip } = await deriveOne(code)
        skipTotal.noPrev += skip.noPrev; skipTotal.noAllotPrice += skip.noAllotPrice; skipTotal.badRef += skip.badRef
        if (rows.length) await factorRepo.insertFactors(rows)
        factRows += rows.length; ok++
      } catch (e) { failures.push({ code, error: (e.message || String(e)).slice(0, 200) }) }
    }
    console.log(`完成: ${ok}/${codes.length}，因子行 ${factRows}，跳过[前收缺=${skipTotal.noPrev} 配股价缺=${skipTotal.noAllotPrice} 参考价异常=${skipTotal.badRef}]`)
    process.exit(0)
  }

  // ==== 全市场批量推导 ====
  codes = await dividendRepo.getAllSymbols()
  if (!codes.length) throw new Error('stock_dividend 无数据，先导入权息事件')
  if (opts.resume) {
    const done = await factorRepo.ensureTable().then(() => factorRepo.getAllSymbols())
    if (done.length) {
      const set = new Set(done)
      codes = codes.filter(c => !set.has(c))
      console.log(`续跑: 已生成 ${done.length} 只，本次剩余 ${codes.length}`)
    }
  }
  if (!codes.length) { console.log('无须生成（全部已生成）'); return }
  console.log(`=== 全市场复权因子批量推导 === 目标 ${codes.length} 只`)

  // 1) 一次性加载全部事件（按 symbol 分组）
  const eventsAll = await allEvents()
  // 2) 分批加载 raw 收盘（symbol in (...)），并逐股推导
  const skipTotal = { noPrev: 0, noAllotPrice: 0, badRef: 0 }
  const derived = []
  const CHUNK = 200
  for (let i = 0; i < codes.length; i += CHUNK) {
    const batchCodes = codes.slice(i, i + CHUNK)
    const closesMap = await rawClosesBatch(batchCodes)
    for (const sym of batchCodes) {
      const events = eventsAll.get(sym) || []
      const closes = closesMap.get(sym) || []
      const { rows, skip } = deriveWithCloses(sym, events, closes)
      skipTotal.noPrev += skip.noPrev; skipTotal.noAllotPrice += skip.noAllotPrice; skipTotal.badRef += skip.badRef
      if (rows.length) derived.push({ symbol: sym, rows })
    }
    process.stdout.write(`\r  拉取处理 ${Math.min(i + CHUNK, codes.length)}/${codes.length}`.padEnd(80))
  }

  // 3) 因子批量写入（每批 100 只，单脚本删 + 单次上传）
  let factRows = 0
  for (let i = 0; i < derived.length; i += 100) {
    const chunk = derived.slice(i, i + 100)
    factRows += await factorRepo.insertFactorsBatch(chunk)
    process.stdout.write(`\r  写库 ${Math.min(i + 100, derived.length)}/${derived.length}，因子行 ${factRows}`.padEnd(80))
  }
  console.log('')
  console.log(`完成: 有事件 ${codes.length} 只，写入因子 ${factRows} 行，跳过[前收缺=${skipTotal.noPrev} 配股价缺=${skipTotal.noAllotPrice} 参考价异常=${skipTotal.badRef}]`)
  process.exit(0)
}

/** 交叉验证：tqcenter 前复权 K线（真实前复权源）vs 我们 raw×factor/anchor，容差 0.5%。
 *  注意：aktools.getStockHistory 网络源失败时会落到 tdx_local（读 .day 不复权、忽略 adjust），
 *  不能用作 qfq 真值；此处直连 tqcenter fetchers.kline front。 */
async function verifyAdjust(codes) {
  const tdxQuant = require('../server/sources/tdx_quant')
  const shiftDays = (s, n) => { const dt = new Date(s + 'T00:00:00'); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10) }
  console.log('=== 交叉验证（tqcenter 前复权 vs 我们 raw×factor/anchor）===')
  const today = new Date().toISOString().slice(0, 10)
  for (const code of codes) {
    try {
      const factors = await factorRepo.getFactors(code)
      const anchorDay = factors.length ? factors[factors.length - 1].trade_date : null
      if (!anchorDay) { console.log(`${code}: 无因子，跳过`); continue }
      const anchor = factors[factors.length - 1].factor
      const sd = shiftDays(today, -120)

      // 真实前复权序列（tqcenter dividend_type=front，count 按区间估算 + 缓冲）
      const span = Math.ceil((new Date(today) - new Date(sd)) / 86400000)
      const count = Math.max(300, Math.ceil(span * 5 / 7 * 1.2) + 20)
      const front = await tdxQuant.fetchers.kline({ symbol: code, period: 'daily', adjust: 'qfq', count })
      if (!front.length) { console.log(`${code}: front 拉取为空，跳过`); continue }
      const kdate = Object.keys(front[0])[0]
      const kclose = Object.keys(front[0])[3]

      // raw 收盘 + 我们的因子
      const closes = await rawCloses(code)
      const closeByDate = new Map(closes.map(c => [c.date, c.close]))
      let maxErr = 0, badDay = null, n = 0
      for (const row of front) {
        const d = String(row[kdate]).replace(/\//g, '-')
        if (!closeByDate.has(d)) continue
        let f = 1
        for (let i = factors.length - 1; i >= 0; i--) {
          if (factors[i].trade_date <= d) { f = factors[i].factor; break }
        }
        const tx = Number(row[kclose])
        if (!(tx > 0)) continue
        const ours = closeByDate.get(d) * f / anchor
        const err = Math.abs(ours / tx - 1) * 100
        n++
        if (err > maxErr) { maxErr = err; badDay = d }
      }
      const note = maxErr > 0.5
        ? ` ⚠超0.5%（多为厂商个别事件前复权瑕疵，见 2017-07-07 茅台案）`
        : ' ✓'
      console.log(`${code}: 因子锚 ${anchorDay}(${anchor.toFixed(4)})，比对 ${n} 日，最大相对偏差 ${maxErr.toFixed(3)}%${badDay ? ` @${badDay}` : ''}${note}`)
    } catch (e) {
      console.log(`${code}: 验证失败 ${(e.message || '').slice(0, 120)}`)
    }
  }
}

main().catch(e => { console.error('\n失败:', e.stack || e.message); process.exit(1) })