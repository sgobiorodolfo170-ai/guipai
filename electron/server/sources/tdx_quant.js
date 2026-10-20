'use strict'

/**
 * 通达信量化 HTTP 数据源（Path B：tqcenter 模式，连运行中已登录的 TdxW）。
 *
 * POST http://127.0.0.1:17709/  body={id,method,params}
 * 方法来自 TdxQuant 文档（help.tdx.com.cn/quant）：
 *   get_market_data(K线) / get_market_snapshot(实时) / get_financial_data(财报)
 *   get_zdt_data(涨跌停) / get_stock_info(基础信息) / get_divid_factors(除权)
 *
 * 只在 TdxW（支持TQ的通达信终端）运行时可用——天然带登录态，无需额外 token。
 * HTTP/JSON 直调，无 pytdx 二进制协议问题。返回实时数据（含当日）。
 *
 * 实测边界（2026-10-20）：
 *   - get_market_snapshot 只接受 stock_code（单只），不支持 stock_list / batch；
 *     tqcenter 未注册 get_market_snapshot_batch（-32601），故批量按单只并发；
 *   - get_market_data 的 1m/5m/15m/30m 对个股/指数/BSE 均返回空，60m 报 period error，
 *     仅 1d/1w 可用 → 分钟K能力已移除（分钟链走 tqs/腾讯）；
 *   - get_zdt_data / get_financial_data 必须带 stock_list / table_list，且日期用紧凑格式。
 */

const http = require('http')
const settings = require('../settings')

let quantPort = 17709
let available = false  // 由 main.js 或路由层探测后调 setAvailable

function setAvailable(up, port) {
  available = !!up
  if (port) quantPort = Number(port) || quantPort
}

/** 代码 → TdxQuant 后缀：6→SH，0/3→SZ，43/83/87/88/920→BJ */
function suffix(code) {
  const c = String(code || '')
  if (/^(43|83|87|88|92)/.test(c)) return 'BJ'
  return c.startsWith('6') ? 'SH' : 'SZ'
}

/** POST JSON-RPC 到 17709，返回 result 字段。 */
function call(method, params, { timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ id: 1, method, params: params || {} })
    const req = http.request({
      hostname: '127.0.0.1', port: quantPort, path: '/', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout
    }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`TdxQuant HTTP ${res.statusCode}`))
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (json.error) return reject(new Error(`TdxQuant: ${json.error.message || json.error.code}`))
          resolve(json.result)
        } catch (e) { reject(new Error('TdxQuant 返回非JSON')) }
      })
    })
    req.on('error', e => reject(new Error(`TdxQuant请求失败(${e.code || e.message})`)))
    req.on('timeout', () => req.destroy(new Error('TdxQuant请求超时')))
    req.write(body)
    req.end()
  })
}

/** period 映射：本项目 daily/weekly/monthly/5/15/30/60 → TdxQuant 1d/1w/1M/5m/15m/30m/60m */
function mapPeriod(period) {
  const p = String(period || 'daily')
  if (p === 'daily' || p === 'day') return '1d'
  if (p === 'weekly' || p === 'week') return '1w'
  if (p === 'monthly' || p === 'month') return '1M'
  if (/^\d+$/.test(p)) return p + 'm'  // 5→5m, 15→15m, 30→30m, 60→60m
  return '1d'
}

/** 日期 'YYYYMMDD'/'YYYY-MM-DD' → 'YYYY-MM-DD'（TdxQuant start_time/end_time 用） */
function dashed(v) {
  const s = String(v || '').replace(/\D/g, '')
  return s.length === 8 ? `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}` : String(v || '')
}

/**
 * 个股K线（get_market_data）。
 * @param {symbol, period, start_date, end_date, count, adjust}
 *   period: daily/weekly/monthly/5/15/30/60
 *   adjust: qfq→front, hfq→back, ''→none
 *   tqcenter(17709) 仅支持 count（不支持 start_time/end_time，返回 ErrorId=3），
 *   故按日期区间估算 count 取最近 N 根，再按日期过滤。
 */
async function getKLine({ symbol, period = 'daily', start_date, end_date, count, adjust }) {
  const code = `${symbol}.${suffix(symbol)}`
  const dt = adjust === 'qfq' ? 'front' : adjust === 'hfq' ? 'back' : 'none'
  // 估算 count：有日期区间时按交易日(≈历日×5/7)+缓冲；无则用传入 count 或默认 320
  let cnt = Number(count) || 320
  const sd = dashed(start_date), ed = dashed(end_date)
  if (start_date && end_date) {
    const days = Math.ceil((new Date(ed) - new Date(sd)) / 86400000) + 1
    cnt = Math.max(200, Math.ceil(days * 5 / 7 * 1.2) + 20)
  }
  const result = await call('get_market_data', {
    stock_list: [code], period: mapPeriod(period), dividend_type: dt, count: cnt
  })
  const v = result && result.Value && result.Value[code]
  if (!v || !v.Date || !v.Date.length) return []
  const sCompact = String(start_date || '').replace(/\D/g, '')
  const eCompact = String(end_date || '').replace(/\D/g, '')
  const n = v.Date.length
  const out = []
  let prevClose = null
  for (let i = 0; i < n; i++) {
    const dcomp = String(v.Date[i])
    if (sCompact && dcomp < sCompact) { prevClose = num(v.Close[i]); continue }
    if (eCompact && dcomp > eCompact) { if (out.length) break; prevClose = num(v.Close[i]); continue }
    const close = num(v.Close[i])
    const open = num(v.Open[i])
    const high = num(v.High[i])
    const low = num(v.Low[i])
    const chg = prevClose == null ? null : Math.round((close - prevClose) * 100) / 100
    out.push({
      '日期': dcomp.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      '股票代码': symbol,
      '开盘': open, '收盘': close, '最高': high, '最低': low,
      '成交量': num(v.Volume[i]), '成交额': num(v.Amount[i]),
      '振幅': prevClose == null || prevClose === 0 ? null : Math.round((high - low) / prevClose * 10000) / 100,
      '涨跌幅': chg == null || prevClose === 0 ? null : Math.round(chg / prevClose * 10000) / 100,
      '涨跌额': chg,
      '换手率': null
    })
    if (close != null) prevClose = close
  }
  return out
}

/** 单只快照 → 中文键行。tqcenter 字段为大写（Now/LastClose/Open/Max/Min/Volume/Amount），
 *  Amount 单位为万元（×10000 转元）；涨跌额/涨跌幅/振幅由昨收推导。 */
function mapSnapshotOne(code, result) {
  if (!result || typeof result !== 'object') return null
  if (result.ErrorId && String(result.ErrorId) !== '0') return null
  const v = result.Value || result.data || result
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const price = num(v.Now != null ? v.Now : v.now)
  const prev = num(v.LastClose != null ? v.LastClose : v.last_close)
  if (price == null) return null
  const open = num(v.Open != null ? v.Open : v.open)
  const high = num(v.Max != null ? v.Max : v.max)
  const low = num(v.Min != null ? v.Min : v.min)
  const vol = num(v.Volume != null ? v.Volume : v.volume)
  const amtWan = num(v.Amount != null ? v.Amount : v.amount)
  const chg = prev == null ? null : round2(price - prev)
  return {
    '代码': code,
    '名称': null,
    '最新价': price,
    '涨跌额': chg,
    '涨跌幅': chg == null || !prev ? null : round2(chg / prev * 100),
    '成交量': vol,
    '成交额': amtWan == null ? null : amtWan * 10000,
    '最高': high,
    '最低': low,
    '今开': open,
    '昨收': prev,
    '振幅': high == null || low == null || !prev ? null : round2((high - low) / prev * 100),
    '量比': null,
    '换手率': null
  }
}

/** 批量响应（数组或 Value 字典）→ 中文键行；兼容不同 tqcenter 版本。 */
function mapSnapshotBatch(result, stockList) {
  if (!result) return []
  const rows = []
  if (Array.isArray(result)) {
    result.forEach((item, i) => {
      const code = String(item.stock_code || item.code || stockList[i] || '').replace(/\.\w+$/, '')
      const mapped = mapSnapshotOne(code, item)
      if (mapped) rows.push(mapped)
    })
    return rows
  }
  const box = result.Value || result.data || result
  if (box && typeof box === 'object') {
    for (const [full, item] of Object.entries(box)) {
      const mapped = mapSnapshotOne(String(full).replace(/\.\w+$/, ''), item)
      if (mapped) rows.push(mapped)
    }
  }
  return rows
}

/**
 * 实时快照（按代码列表）。
 *
 * tqcenter(17709) 实测：get_market_snapshot_batch 未注册（-32601），
 * get_market_snapshot 只接受 stock_code（单只，~20ms），传 stock_list 报错。
 * 因此批量路径改为「先试 batch（兼容其他版本）→ 失败按单只 8 并发」。
 *
 * 调度器派发 spot 时 params 是普通对象（无 codes 字段）→ 返回空数组交由下一源，
 * 避免把 params 对象当代码抛出 TypeError 顶掉整条 failover 链。
 */
async function getSnapshot(codes) {
  const raw = (codes && typeof codes === 'object' && !Array.isArray(codes))
    ? (codes.codes != null ? codes.codes : (codes.symbol != null ? [codes.symbol] : null))
    : codes
  const arr = (Array.isArray(raw) ? raw : (raw != null ? [raw] : []))
    .map(c => (c == null ? null : String(c)))
    .filter(c => c && /^\d{6}/.test(c))
  if (arr.length === 0) return []
  const stockList = [...new Set(arr.map(c => (c.includes('.') ? c : `${c}.${suffix(c)}`)))]
  try {
    const result = await call('get_market_snapshot_batch', { stock_list: stockList }, { timeout: 5000 })
    const list = mapSnapshotBatch(result, stockList)
    if (list.length) return list
  } catch (_) { /* -32601: 当前 tqcenter 不支持批量 */ }
  const rows = await runPool(stockList, 8, async (full) => {
    try {
      const r = await call('get_market_snapshot', { stock_code: full }, { timeout: 5000 })
      return mapSnapshotOne(full.replace(/\.\w+$/, ''), r)
    } catch (_) { return null }
  })
  return rows.filter(Boolean)
}

/** 本地 stock_basic 全量代码（zdt 接口必须显式传 stock_list，无全市场默认语义）。 */
function allLocalCodes() {
  try {
    const { getDb } = require('../db')
    const rows = getDb().prepare('SELECT code FROM stock_basic').all()
    return rows.map(r => String(r.code || '').trim()).filter(c => /^\d{6}$/.test(c))
  } catch (_) { return [] }
}

/** 涨跌停数据（get_zdt_data）。必须传 stock_list + date（紧凑格式）。
 *  返回字段与东财涨停池仅部分同构：价格/名称/换手等 tqcenter 不提供，置 null，
 *  保证 converter 可安全跳过；本源仅作 tqs 之后的兜底。 */
async function getZdt(p) {
  const date = typeof p === 'string' ? p : (p && (p.date || p.start_date))
  const list = (p && typeof p === 'object' && Array.isArray(p.stock_list) && p.stock_list.length)
    ? p.stock_list
    : allLocalCodes()
  if (!list.length) throw new Error('get_zdt_data 需要 stock_list，且本地 stock_basic 为空')
  const params = {
    stock_list: [...new Set(list.map(c => (String(c).includes('.') ? String(c) : `${c}.${suffix(c)}`)))]
  }
  const d = dashed(date).replace(/-/g, '')
  if (d) params.date = d
  const result = await call('get_zdt_data', params, { timeout: 15000 })
  const box = result && (result.Value || result.data)
  if (!box || typeof box !== 'object' || Array.isArray(box)) return []
  const out = []
  for (const [full, r] of Object.entries(box)) {
    if (!r || typeof r !== 'object') continue
    out.push({
      '代码': String(full).replace(/\.\w+$/, ''),
      '名称': null,
      '最新价': null,
      '涨跌幅': null,
      '成交额': null,
      '换手率': null,
      '封板资金': num(r.FDVolMaxZT),
      '首次封板时间': fmtZdtTime(r.FirstTimeZT),
      '最后封板时间': fmtZdtTime(r.LastTimeZT),
      '炸板次数': num(r.OpenTimesZT),
      '连板数': null,
      '所属行业': null
    })
  }
  return out
}

/** 财务数据（get_financial_data）。实测必填：stock_list / table_list / report_type /
 *  start_time / end_time（日期紧凑 YYYYMMDD）。结构随 tqcenter 版本变化，按数组字段容错映射。 */
async function getFinancial(p) {
  const symbol = typeof p === 'string' ? p : (p && p.symbol)
  if (!symbol) return []
  const code = `${String(symbol).replace(/\.\w+$/, '')}.${suffix(symbol)}`
  const params = {
    stock_list: [code],
    table_list: (p && p.table_list) || ['BalanceSheet', 'IncomeStatement', 'CashFlowStatement'],
    report_type: (p && p.report_type) || '1',
    start_time: compact(p && p.start_time) || '20000101',
    end_time: compact(p && p.end_time) || compact(new Date())
  }
  const result = await call('get_financial_data', params, { timeout: 15000 })
  const v = result && result.Value && result.Value[code]
  if (!v || typeof v !== 'object') return []
  const dates = v.Date || v.report_date || []
  if (!Array.isArray(dates) || !dates.length) return []
  const out = []
  for (let i = 0; i < dates.length; i++) {
    out.push({
      code: String(symbol).replace(/\.\w+$/, ''),
      report_date: String(dates[i]).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      revenue: num(v.Revenue ? v.Revenue[i] : null),
      net_profit: num(v.NetProfit ? v.NetProfit[i] : null),
      total_assets: num(v.TotalAssets ? v.TotalAssets[i] : null),
      net_assets: num(v.NetAssets ? v.NetAssets[i] : null),
      roe: num(v.ROE ? v.ROE[i] : null)
    })
  }
  return out
}

function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null }
function round2(x) { return Number.isFinite(x) ? Math.round(x * 100) / 100 : null }
function compact(v) {
  const s = String(v == null ? '' : v).replace(/\D/g, '')
  return s.length === 8 ? s : ''
}
function fmtZdtTime(v) {
  const n = num(v)
  return n ? String(Math.trunc(n)).padStart(6, '0') : null
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

module.exports = {
  name: 'tdx_quant',
  // minute 已移除：tqcenter 的 1m/5m/15m/30m 实测全空、60m 报 period error。
  capabilities: ['kline', 'spot', 'limitPool', 'financial', 'dropPool'],
  fetchers: {
    kline: getKLine,
    spot: getSnapshot,
    limitPool: getZdt,
    dropPool: getZdt,
    financial: getFinancial
  },
  available: () => available,
  setAvailable,
  getPort: () => quantPort,
  // 健康探针：POST get_trading_dates（轻量），返回有数据则 TdxW 量化接口可用
  health: async () => {
    try {
      const r = await call('get_trading_dates', { exchange: '', start_date: '', end_date: '' }, { timeout: 5000 })
      return { ok: true, port: quantPort }
    } catch (e) { return { ok: false, error: e.message } }
  }
}
