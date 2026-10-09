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
 * HTTP/JSON 直调，无 pytdx 二进制协议问题。返回实时数据（含当日）+ 全市场按需。
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

/**
 * 实时快照（get_market_snapshot_batch 或 get_market_snapshot）。
 * @param codes 单代码或数组；返回 [{code,name,price,change,...}] 中文键
 */
async function getSnapshot(codes) {
  const arr = Array.isArray(codes) ? codes : [codes]
  const stockList = arr.map(c => c.includes('.') ? c : `${c}.${suffix(c)}`)
  let result
  try {
    result = await call('get_market_snapshot_batch', { stock_list: stockList })
  } catch (_) {
    result = await call('get_market_snapshot', { stock_list: stockList })
  }
  // 响应结构以 Value 或直接数组；适配两种可能
  const list = (result && (result.Value || result.data)) || result || []
  if (!Array.isArray(list)) return []
  return list.map(r => ({
    '代码': String(r.stock_code || r.code || '').replace(/\.\w+$/, ''),
    '名称': r.stock_name || r.name,
    '最新价': num(r.last_price || r.close || r.price),
    '涨跌额': num(r.price_change || r.change),
    '涨跌幅': num(r.price_change_rate || r.pct_chg || r.changepercent),
    '成交量': num(r.volume || r.vol),
    '成交额': num(r.amount || r.turnover),
    '最高': num(r.high), '最低': num(r.low),
    '今开': num(r.open), '昨收': num(r.pre_close || r.settlement)
  }))
}

/** 涨跌停数据（get_zdt_data）。返回中文键数组（与东财涨停池同构）。 */
async function getZdt(date) {
  const d = dashed(date).replace(/-/g, '')
  const result = await call('get_zdt_data', { date: d })
  const list = (result && (result.Value || result.data)) || result || []
  if (!Array.isArray(list)) return []
  return list.map(r => ({
    '代码': String(r.stock_code || r.code || '').replace(/\.\w+$/, ''),
    '名称': r.stock_name || r.name,
    '涨跌幅': num(r.price_change_rate || r.pct_chg),
    '最新价': num(r.last_price || r.close),
    '成交额': num(r.amount),
    '换手率': num(r.turnover_rate),
    '封板资金': num(r.fund || r.fd_amount),
    '连板数': num(r.lbc || r.continuous_limit),
    '所属行业': r.hybk || r.industry
  }))
}

/** 财务数据（get_financial_data）。返回中文键数组。 */
async function getFinancial({ symbol }) {
  const code = `${symbol}.${suffix(symbol)}`
  const result = await call('get_financial_data', { stock_list: [code] })
  const v = result && result.Value && result.Value[code]
  if (!v) return []
  // 财务数据结构以字段→数组形式返回（如 Revenue:[...], NetProfit:[...]）；按报告期对齐
  const dates = v.Date || v.report_date || []
  if (!dates.length) return []
  const out = []
  for (let i = 0; i < dates.length; i++) {
    out.push({
      code: symbol, report_date: String(dates[i]).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
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

module.exports = {
  name: 'tdx_quant',
  capabilities: ['kline', 'spot', 'limitPool', 'financial', 'minute', 'dropPool'],
  fetchers: {
    kline: getKLine,
    spot: getSnapshot,
    limitPool: getZdt,
    dropPool: getZdt,
    financial: getFinancial,
    minute: getKLine
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
