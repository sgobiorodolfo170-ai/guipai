'use strict'

/**
 * 腾讯行情源（独立数据源）。
 *
 * 设计动机（2026-10-20 实测）：
 *   - qt.gtimg.cn 单请求最多约 900 只（950 触发 HTTP 414），800 只/请求、6 并发时
 *     全市场 5580 只约 1.0s / 2.76MB，远快于原「榜单 28 页」方案；
 *   - 88 字段含 开/高/低/昨收/量比/换手/PE/PB/市值/涨跌停价，是免鉴权源里唯一
 *     同时满足「全市场一次取全 + 完整 OHLC」的接口；
 *   - 指数用完整 sh000001（88 字段）而非 s_ 简版，可补齐 高/低/开/昨收；
 *   - 北交所 bj 前缀可用（分时/日K 支持；分钟 K 线仅 320 根且北交所返回空）；
 *   - 分时 day/query|minute/query 与 mkline 均有 320 根上限，只作应急兜底，
 *     分钟链主源仍是 tdx_server（tqs）。
 *
 * 局限：
 *   - fqkline 无成交额/换手率（置 null），日K 仅作应急兜底（主路径为数据包/raw）；
 *   - 全市场代码池优先取本地 stock_basic（含新上市/北交所）；stock_basic 未就绪时
 *     回退腾讯榜单（实测 total=5575，会漏 5 只 2026 新代码，故只作兜底）。
 *
 * 本文件独立实现 HTTP/GBK 解码，不依赖 aktools.js，避免与 main 源互相 require。
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
const TX_REFERER = { Referer: 'https://gu.qq.com/' }
const RANK_REFERER = { Referer: 'https://stockapp.finance.qq.com/' }

const QT_MAX_BATCH = 800       // 实测 900 可用、950 触发 414，800 留安全边界
const QT_CONCURRENCY = 6       // 7×800 全市场实测约 1.0s
const RANK_PAGE_SIZE = 200     // 腾讯榜单单页上限（500 即报错）
const RANK_MAX_PAGES = 40
const RANK_CONCURRENCY = 6
const UNIVERSE_MIN = 3000      // stock_basic 少于该数量视为未同步，回退榜单代码池

/** 指数系列 → 东财 secid 串（与 aktools.js INDEX_FALLBACK_SECIDS 保持同源顺序） */
const INDEX_SERIES = {
  '沪深重要指数': '1.000001,1.000300,1.000016,1.000688,1.000905,0.399001,0.399006,0.399005,0.399106',
  '上证系列指数': '1.000001,1.000002,1.000003,1.000016,1.000300,1.000688,1.000905,1.000852',
  '深证系列指数': '0.399001,0.399002,0.399003,0.399005,0.399006,0.399106,0.399673',
  '中证系列指数': '1.000300,1.000905,1.000852,1.000016',
  '指数成份': '1.000300,1.000016,0.399001,0.399006'
}

// ---- 基础工具 ----

function txStockPrefix(code) {
  const c = String(code || '')
  if (/^(43|8[2-9]|920)/.test(c)) return 'bj'
  return c.startsWith('6') ? 'sh' : 'sz'
}

function txIndexPrefix(code) {
  return String(code || '').startsWith('399') ? 'sz' : 'sh'
}

/** 'sh600519' / '600519.SH' / 600519 / ['600519'] → '600519'；非法 → null */
function normalizeCode(v) {
  const m = String(v == null ? '' : v).match(/(\d{6})/)
  return m ? m[1] : null
}

function nv(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function round2(x) {
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : null
}

function digits(v) {
  return String(v == null ? '' : v).replace(/\D/g, '')
}

/** 日期区间过滤（数字串比较，兼容 '2026-09-01' / '20260901' / 空=不过滤） */
function inRange(t, sd, ed) {
  if (!sd && !ed) return true
  const s = digits(sd).slice(0, 8)
  const e = digits(ed).slice(0, 8)
  const x = digits(t).slice(0, 8)
  return (!s || x >= s) && (!e || x <= e)
}

function filterByDate(rows, sd, ed, key) {
  const s = digits(sd).slice(0, 8)
  const e = digits(ed).slice(0, 8)
  if (!s && !e) return rows
  return rows.filter(r => {
    const d = digits(r[key]).slice(0, 8)
    return (!s || d >= s) && (!e || d <= e)
  })
}

function localCompactDate(d = new Date()) {
  const p = x => String(x).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

function fmtDashedDate(v) {
  const d = digits(v)
  return d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : ''
}

/** 简单并发池：最多 limit 个 worker 并发消费 items，结果按输入顺序返回 */
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

/** 通用 HTTP GET 字节流（腾讯域名；GBK 解码交给 getText）。 */
async function getBuffer(url, { timeout = 8000, retries = 0, headers = {} } = {}) {
  let lastErr = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const u = new URL(url)
        const lib = u.protocol === 'https:' ? https : http
        const req = lib.request({
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search,
          method: 'GET',
          headers: { 'User-Agent': UA, ...headers },
          timeout
        }, (res) => {
          const chunks = []
          res.on('data', c => chunks.push(c))
          res.on('end', () => {
            if (res.statusCode !== 200) return reject(new Error(`腾讯返回 HTTP ${res.statusCode}`))
            resolve(Buffer.concat(chunks))
          })
        })
        req.on('error', e => reject(new Error(`腾讯请求失败(${e.code || e.message})`)))
        req.on('timeout', () => req.destroy(new Error('腾讯请求超时')))
        req.end()
      })
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr
}

async function getText(url, { encoding = 'utf8', ...opts } = {}) {
  const buf = await getBuffer(url, opts)
  return encoding === 'utf8' ? buf.toString('utf8') : new TextDecoder(encoding).decode(buf)
}

async function getJson(url, opts = {}) {
  const text = await getText(url, opts)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('腾讯返回非 JSON')
  }
}

// ---- 行情解析 ----

/** 解析 qt.gtimg.cn 响应：v_sh600519="..." → Map<6位代码, {prefix, fields}> */
function parseQt(text) {
  const out = new Map()
  const re = /v_((?:sh|sz|bj)(\d{6}))="([^"]*)"/g
  let m
  while ((m = re.exec(String(text))) !== null) {
    const prefix = m[1].slice(0, 2)
    const code = m[2]
    const fields = m[3].split('~')
    if (fields.length < 40 || !fields[3]) continue
    out.set(code, { prefix, fields })
  }
  return out
}

/** 个股 88 字段 → 与东财 mapSpotItem 同构的中文键行。
 *  单位：f37 成交额=万元→元；f44/f45 市值=亿元→元；f6 成交量=手。
 *  腾讯不提供的 涨速/5分钟涨跌/60日/年初至今 → null（前端按 0 展示）。 */
function mapQtSpot(f) {
  const price = nv(f[3])
  const prev = nv(f[4])
  const amountWan = nv(f[37])
  let chg = nv(f[31])
  let pct = nv(f[32])
  if (chg == null && price != null && prev != null) chg = round2(price - prev)
  if (pct == null && chg != null && prev) pct = round2(chg / prev * 100)
  return {
    '代码': f[2],
    '名称': f[1] || f[2],
    '最新价': price == null ? 0 : price,
    '涨跌幅': pct == null ? 0 : pct,
    '涨跌额': chg,
    '成交量': nv(f[6]),
    '成交额': amountWan == null ? null : amountWan * 10000,
    '振幅': nv(f[43]),
    '最高': nv(f[33]),
    '最低': nv(f[34]),
    '今开': nv(f[5]),
    '昨收': prev,
    '量比': nv(f[49]),
    '换手率': nv(f[38]),
    '市盈率-动态': nv(f[39]),
    '市净率': nv(f[46]),
    '总市值': nv(f[45]) == null ? null : nv(f[45]) * 1e8,
    '流通市值': nv(f[44]) == null ? null : nv(f[44]) * 1e8,
    '涨速': null,
    '5分钟涨跌': null,
    '60日涨跌幅': null,
    '年初至今涨跌幅': null
  }
}

/** 指数 88 字段 → 与东财 mapIndexSpot 同构（含 OHLC/昨收/量比）。 */
function mapQtIndex(f) {
  const amountWan = nv(f[37])
  return {
    '序号': 0,
    '代码': f[2],
    '名称': f[1] || f[2],
    '最新价': nv(f[3]) == null ? 0 : nv(f[3]),
    '涨跌幅': nv(f[32]) == null ? 0 : nv(f[32]),
    '涨跌额': nv(f[31]),
    '成交量': nv(f[6]),
    '成交额': amountWan == null ? null : amountWan * 10000,
    '振幅': nv(f[43]),
    '最高': nv(f[33]),
    '最低': nv(f[34]),
    '今开': nv(f[5]),
    '昨收': nv(f[4]),
    '量比': nv(f[49])
  }
}

/** 从调度参数中提取代码列表；无有效代码视为「全市场」请求。 */
function extractCodes(params) {
  let raw = null
  if (params == null) raw = null
  else if (Array.isArray(params)) raw = params
  else if (typeof params === 'string') raw = params.split(',')
  else if (typeof params === 'object') {
    const v = params.codes != null ? params.codes : (params.symbol != null ? params.symbol : null)
    raw = Array.isArray(v) ? v : (v == null ? null : String(v).split(','))
  }
  const codes = [...new Set((raw || []).map(normalizeCode).filter(Boolean))]
  return codes.slice(0, 2000)
}

async function fetchQtChunk(codes) {
  const q = codes.map(c => txStockPrefix(c) + c).join(',')
  const text = await getText(`https://qt.gtimg.cn/q=${q}`, {
    encoding: 'gbk', timeout: 8000, retries: 1, headers: TX_REFERER
  })
  const parsed = parseQt(text)
  const rows = []
  for (const code of codes) {
    const rec = parsed.get(code)
    if (rec) rows.push(mapQtSpot(rec.fields))
  }
  return rows
}

/** 指定代码批量快照（800/请求，3 并发）。 */
async function fetchByCodes(codes) {
  const chunks = []
  for (let i = 0; i < codes.length; i += QT_MAX_BATCH) chunks.push(codes.slice(i, i + QT_MAX_BATCH))
  const parts = await runPool(chunks, Math.min(3, chunks.length), (chunk) => fetchQtChunk(chunk).catch(() => []))
  const found = new Map()
  for (const row of parts.flat()) found.set(row['代码'], row)
  const rows = codes.map(c => found.get(c)).filter(Boolean)
  if (!rows.length) throw new Error('腾讯批量行情返回空')
  return rows.map((r, i) => ({ ...r, '序号': i + 1 }))
}

/** 全市场代码池：本地 stock_basic 优先（含新上市/北交所），未同步时回退腾讯榜单。 */
async function getUniverseCodes() {
  try {
    const { getDb } = require('../db')
    const rows = getDb().prepare('SELECT code FROM stock_basic').all()
    const codes = rows.map(r => String(r.code || '').trim()).filter(c => /^\d{6}$/.test(c))
    if (codes.length >= UNIVERSE_MIN) return [...new Set(codes)].sort()
  } catch (_) { /* stock_basic 未就绪 → 榜单兜底 */ }
  return await getRankCodes()
}

async function fetchRankPage(offset) {
  const url = `https://proxy.finance.qq.com/cgi/cgi-bin/rank/hs/getBoardRankList?_appver=11.17.0&board_code=aStock&sort_type=price&direct=down&offset=${offset}&count=${RANK_PAGE_SIZE}`
  const json = await getJson(url, { timeout: 8000, retries: offset === 0 ? 1 : 0, headers: RANK_REFERER })
  const d = json && json.data
  return { list: (d && d.rank_list) || [], total: (d && d.total) || 0 }
}

async function getRankCodes() {
  const first = await fetchRankPage(0)
  if (!first.list.length) throw new Error('腾讯榜单代码池为空')
  const total = first.total || first.list.length
  const offsets = []
  for (let o = RANK_PAGE_SIZE; o < total && offsets.length < RANK_MAX_PAGES - 1; o += RANK_PAGE_SIZE) offsets.push(o)
  const rest = offsets.length ? await runPool(offsets, RANK_CONCURRENCY, (o) => fetchRankPage(o).catch(() => ({ list: [] }))) : []
  const codes = [...first.list, ...rest.flatMap(r => r.list)]
    .map(it => normalizeCode(it.code))
    .filter(Boolean)
  return [...new Set(codes)].sort()
}

/** 全市场快照：7×800、6 并发；单批失败不拖垮整体。 */
async function fetchFullMarket() {
  const codes = await getUniverseCodes()
  if (!codes.length) throw new Error('腾讯全市场代码池为空')
  const chunks = []
  for (let i = 0; i < codes.length; i += QT_MAX_BATCH) chunks.push(codes.slice(i, i + QT_MAX_BATCH))
  const parts = await runPool(chunks, QT_CONCURRENCY, (chunk) => fetchQtChunk(chunk).catch(() => []))
  const found = new Map()
  for (const row of parts.flat()) found.set(row['代码'], row)
  const rows = codes.map(c => found.get(c)).filter(Boolean)
  if (rows.length < 500) throw new Error(`腾讯全市场行情命中率过低(${rows.length}/${codes.length})`)
  return rows.map((r, i) => ({ ...r, '序号': i + 1 }))
}

async function getSpot(params) {
  const codes = extractCodes(params)
  return codes.length ? await fetchByCodes(codes) : await fetchFullMarket()
}

async function getIndexSpot(series) {
  const secids = INDEX_SERIES[series] || INDEX_SERIES['沪深重要指数']
  const list = secids.split(',').map(id => {
    const [market, code] = id.split('.')
    return { code, prefix: txIndexPrefix(code) }
  })
  const q = list.map(x => x.prefix + x.code).join(',')
  const text = await getText(`https://qt.gtimg.cn/q=${q}`, {
    encoding: 'gbk', timeout: 8000, retries: 1, headers: TX_REFERER
  })
  const parsed = parseQt(text)
  const out = []
  for (const x of list) {
    const rec = parsed.get(x.code)
    if (!rec) continue
    const row = mapQtIndex(rec.fields)
    row['序号'] = out.length + 1
    out.push(row)
  }
  if (!out.length) throw new Error(`腾讯指数行情返回空(${series})`)
  return out
}

/** 腾讯分时：day/query（可指定历史日）或 minute/query（仅最近交易日）。 */
async function minuteTrend(code, p) {
  const opts = { timeout: 6000, retries: 0, headers: TX_REFERER }
  const ed = digits(p.end_date).slice(0, 8)
  const today = localCompactDate()
  const fetchDay = async () => {
    const json = await getJson(`https://web.ifzq.gtimg.cn/appstock/app/day/query?code=${code}${ed ? `&date=${ed}` : ''}`, opts)
    const days = json && json.data && json.data[code] && json.data[code].data
    return Array.isArray(days) ? days : []
  }
  const fetchMinute = async () => {
    const json = await getJson(`https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${code}`, opts)
    const box = json && json.data && json.data[code] && json.data[code].data
    return box && box.date ? [{ date: box.date, data: box.data }] : []
  }
  let days = []
  if (ed && ed !== today) {
    days = await fetchDay().catch(() => [])
    if (!days.length) days = await fetchMinute().catch(() => [])
  } else {
    // 当日盘中优先 minute/query（单日、响应更小），失败再退 day/query
    days = await fetchMinute().catch(() => [])
    if (!days.length) days = await fetchDay().catch(() => [])
  }
  // day/query 实测按「新→旧」返回 5 个交易日；统一升序，保证分时行按时间递增（入库/绘图依赖）
  days = days.slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
  const rows = []
  for (const day of days) {
    const d = String(day.date || '')
    if (d.length !== 8) continue
    let prevPx = null
    let prevVol = 0
    let prevAmt = 0
    for (const line of day.data || []) {
      const parts = String(line).split(' ')
      if (parts.length < 4) continue
      const price = nv(parts[1])
      const vol = nv(parts[2])
      const amt = nv(parts[3])
      if (price == null || vol == null || amt == null) continue
      const perVol = Math.max(vol - prevVol, 0)
      const perAmt = Math.max(amt - prevAmt, 0)
      rows.push({
        '时间': `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)} ${parts[0].slice(0, 2)}:${parts[0].slice(2, 4)}`,
        '开盘': prevPx == null ? price : prevPx,
        '收盘': price,
        '最高': prevPx == null ? price : Math.max(prevPx, price),
        '最低': prevPx == null ? price : Math.min(prevPx, price),
        '成交量': perVol,
        '成交额': perAmt,
        '均价': perVol > 0 ? round2(perAmt / (perVol * 100)) : null
      })
      prevPx = price
      prevVol = vol
      prevAmt = amt
    }
  }
  return rows.filter(r => inRange(r['时间'], p.start_date, p.end_date))
}

/** 腾讯分钟 K（m5/m15/m30/m60，最多 320 根；北交所返回空）。 */
async function minuteKline(code, period, p) {
  // 注意：mkline 每个 (code, period, count) 组合首次请求走腾讯慢路径（实测冷 7.7s、热 0.1s），
  // 超时给到 9s；源级预算见 registry.SOURCE_TIMEOUTS.tencent.minute（10s）。
  const json = await getJson(`https://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m${period},,2000`, {
    timeout: 9000, retries: 0, headers: TX_REFERER
  })
  const box = json && json.data && json.data[code]
  const raw = box && box[`m${period}`]
  if (!raw || !raw.length) return []
  let prevClose = null
  const rows = raw.map((row) => {
    const stamp = String(row[0] || '')
    const time = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)} ${stamp.slice(8, 10)}:${stamp.slice(10, 12)}`
    const o = nv(row[1])
    const c = nv(row[2])
    const h = nv(row[3])
    const l = nv(row[4])
    const chg = prevClose == null || c == null ? null : round2(c - prevClose)
    const item = {
      '时间': time, '开盘': o, '收盘': c, '最高': h, '最低': l, '成交量': nv(row[5]),
      '成交额': null,
      '振幅': prevClose == null ? null : round2((h - l) / prevClose * 100),
      '涨跌幅': prevClose == null ? null : round2(chg / prevClose * 100),
      '涨跌额': chg,
      '换手率': null
    }
    if (c != null) prevClose = c
    return item
  })
  return rows.filter(r => inRange(r['时间'], p.start_date, p.end_date))
}

async function getMinute(p) {
  const symbol = String((p && p.symbol) || '').trim()
  if (!symbol) return []
  const period = String((p && p.period) || '5')
  const code = ((p && (p.isIndex || p.is_index)) ? txIndexPrefix(symbol) : txStockPrefix(symbol)) + symbol
  if (period === '1') return await minuteTrend(code, p)
  return await minuteKline(code, period, p)
}

/** 估算 fqkline count：下限 200（实测 count 过小会命中腾讯慢路径），上限 2000（3000 报 bad params）。 */
function estimateKlineCount(start, end, periodKey) {
  const MIN_COUNT = 200
  const DEFAULT_COUNT = 640
  const MAX_COUNT = 2000
  if (!start || !end) return DEFAULT_COUNT
  const days = Math.ceil((new Date(fmtDashedDate(end)).getTime() - new Date(fmtDashedDate(start)).getTime()) / 86400000) + 1
  if (!Number.isFinite(days) || days <= 0) return DEFAULT_COUNT
  const per = periodKey === 'week' ? 7 : periodKey === 'month' ? 30 : 1
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.ceil(days / per) + 10))
}

async function fetchFqKline(code, periodKey, fq, start, end, count) {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},${periodKey},${fmtDashedDate(start)},${fmtDashedDate(end)},${count},${fq}`
  const json = await getJson(url, { timeout: 6000, retries: 1, headers: TX_REFERER })
  const box = json && json.data && json.data[code]
  if (!box) return []
  const key = [`${fq}${periodKey}`, periodKey, `qfq${periodKey}`, `hfq${periodKey}`]
    .find(k => Array.isArray(box[k]) && box[k].length)
  return key ? box[key] : []
}

/** 腾讯原始 K 线 → 中文键行（无成交额/换手率）。 */
function mapTxKline(rawRows, symbol) {
  let prevClose = null
  return rawRows.map((p) => {
    const o = nv(p[1])
    const c = nv(p[2])
    const h = nv(p[3])
    const l = nv(p[4])
    const chg = prevClose == null || c == null ? null : round2(c - prevClose)
    const row = {
      '日期': p[0],
      ...(symbol ? { '股票代码': symbol } : {}),
      '开盘': o, '收盘': c, '最高': h, '最低': l, '成交量': nv(p[5]),
      '成交额': null,
      '振幅': prevClose == null ? null : round2((h - l) / prevClose * 100),
      '涨跌幅': prevClose == null ? null : round2(chg / prevClose * 100),
      '涨跌额': chg,
      '换手率': null
    }
    if (c != null) prevClose = c
    return row
  })
}

async function getKline(p) {
  const symbol = String((p && p.symbol) || '').trim()
  if (!symbol) return []
  const periodKey = p.period === 'weekly' ? 'week' : p.period === 'monthly' ? 'month' : 'day'
  const fq = p.adjust === 'qfq' ? 'qfq' : p.adjust === 'hfq' ? 'hfq' : ''
  const count = Number(p.count) || estimateKlineCount(p.start_date, p.end_date, periodKey)
  const raw = await fetchFqKline(txStockPrefix(symbol) + symbol, periodKey, fq, p.start_date, p.end_date, count)
  if (!raw.length) return []
  return filterByDate(mapTxKline(raw, symbol), p.start_date, p.end_date, '日期')
}

async function getIndexDaily(p) {
  const symbol = String((p && p.symbol) || '').trim()
  if (!symbol) return []
  const periodKey = p.period === 'weekly' ? 'week' : p.period === 'monthly' ? 'month' : 'day'
  const count = Number(p.count) || estimateKlineCount(p.start_date, p.end_date, periodKey)
  const raw = await fetchFqKline(txIndexPrefix(symbol) + symbol, periodKey, '', p.start_date, p.end_date, count)
  if (!raw.length) return []
  return filterByDate(mapTxKline(raw), p.start_date, p.end_date, '日期')
}

async function health() {
  try {
    const text = await getText('https://qt.gtimg.cn/q=sh000001', {
      encoding: 'gbk', timeout: 5000, retries: 0, headers: TX_REFERER
    })
    return { ok: text.includes('v_sh000001') }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

module.exports = {
  name: 'tencent',
  capabilities: ['spot', 'indexSpot', 'minute', 'kline', 'indexDaily'],
  fetchers: {
    spot: getSpot,
    indexSpot: getIndexSpot,
    minute: getMinute,
    kline: getKline,
    indexDaily: getIndexDaily
  },
  // 各数据类型超时（registry 读取；spot 全市场需容纳冷启动与多批并发）
  timeoutMs: { default: 8000, spot: 20000, minute: 6000, kline: 6000, indexDaily: 6000 },
  available: () => true,
  health
}
