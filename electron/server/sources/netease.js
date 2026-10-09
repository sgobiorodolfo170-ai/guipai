'use strict'

/**
 * 网易财经数据源（免费、无 key）。
 *
 * 覆盖：
 *   - kline：quotes.money.163.com/service/chddata.html（CSV，历史日K，不复权）
 *
 * 不覆盖：spot（网易全市场榜单接口已下线/不稳定，spot 由新浪兜底）、
 *         分钟K（网易无分钟接口）、北交所（网易无北交所数据）。
 *
 * 单位口径与东财对齐：价格元、成交量手、成交额元。
 * 网易 code 前缀：0=上交所(sh,6开头)，1=深交所(sz,0/3开头)。
 * CSV 表头中文，含 涨跌幅/涨跌额/振幅/换手率，但基于不复权价，与 涨跌额(=不复权价差) 自洽。
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function getText(url, { timeout = 15000, retries = 1, retryDelay = 1000, encoding = 'utf8' } = {}) {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const buf = await new Promise((resolve, reject) => {
        const u = new URL(url)
        const lib = u.protocol === 'https:' ? https : http
        const req = lib.request({
          hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search, method: 'GET',
          headers: { 'User-Agent': UA, Referer: 'https://quotes.money.163.com/' }, timeout
        }, (res) => {
          const chunks = []
          res.on('data', c => chunks.push(c))
          res.on('end', () => {
            if (res.statusCode !== 200) return reject(new Error(`网易返回 ${res.statusCode}`))
            resolve(Buffer.concat(chunks))
          })
        })
        req.on('error', e => reject(new Error(`网易请求失败(${e.code || e.message})`)))
        req.on('timeout', () => req.destroy(new Error('网易请求超时')))
        req.end()
      })
      return encoding === 'utf8' ? buf.toString('utf8') : new TextDecoder(encoding).decode(buf)
    } catch (e) {
      lastErr = e
      if (attempt < retries && retryDelay > 0) await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)))
    }
  }
  throw lastErr
}

/** 6开头→sh→前缀0；0/3开头→sz→前缀1；北交所→网易无数据，返回空标记 */
function neteasePrefix(code) {
  const c = String(code || '')
  if (/^(43|83|87|88|92)/.test(c)) return null // 北交所，网易无数据
  return c.startsWith('6') ? '0' : '1'
}

function nv(v) { const n = Number(v); return Number.isFinite(n) ? n : null }
function round2(x) { return Number.isFinite(x) ? Math.round(x * 100) / 100 : null }

/** 'YYYYMMDD'/'YYYY-MM-DD' → 'YYYYMMDD'（网易 chddata 用紧凑日期） */
function compactDate(v) {
  const s = String(v || '').replace(/\D/g, '')
  return s.length === 8 ? s : ''
}

/**
 * 个股历史日K（网易 chddata CSV，不复权）。
 * @param {symbol, period, start_date, end_date, adjust} period 仅 daily 有效（网易无周/月/分钟）
 * 返回中文键对象数组（与东财 getStockHistory 同构）。
 */
async function getKLine({ symbol, period = 'daily', start_date, end_date, adjust }) {
  const prefix = neteasePrefix(symbol)
  if (prefix === null) return [] // 北交所网易无数据，交回调度器试下一源
  if (period && period !== 'daily') return [] // 网易仅支持日K
  const sd = compactDate(start_date) || compactDate(end_date) || ''
  const ed = compactDate(end_date) || compactDate(start_date) || ''
  // fields：日期,股票代码,名称,收盘价,最高价,最低价,开盘价,前收盘,涨跌额,涨跌幅,换手率,成交量,成交额,振幅
  const fields = 'TCLOSE;HIGH;LOW;TOPEN;LCLOSE;CHG;PCHG;TOR;VOT;VAT;TCAP;MCAP;AMPLITUDE'
  const url = `https://quotes.money.163.com/service/chddata.html?code=${prefix}${symbol}&start=${sd}&end=${ed}&fields=${fields}`
  const text = await getText(url, { encoding: 'utf8', retries: 0, timeout: 12000 })
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []
  // 表头行（中文），建字段索引
  const header = parseCsvLine(lines[0])
  const idx = {}
  header.forEach((h, i) => { idx[h.trim()] = i })
  const out = []
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i])
    if (cells.length < 4) continue
    const day = (cells[idx['日期']] || '').trim()
    if (!day) continue
    const close = nv(cells[idx['收盘价']])
    const open = nv(cells[idx['开盘价']])
    const high = nv(cells[idx['最高价']])
    const low = nv(cells[idx['最低价']])
    const chg = nv(cells[idx['涨跌额']])
    const pct = nv(cells[idx['涨跌幅']])
    const vol = nv(cells[idx['成交量']])
    const amt = nv(cells[idx['成交额']])
    out.push({
      '日期': day, '股票代码': symbol,
      '开盘': open, '收盘': close, '最高': high, '最低': low,
      '成交量': vol, '成交额': amt,
      '振幅': nv(cells[idx['振幅']]),
      '涨跌幅': pct, '涨跌额': chg, '换手率': nv(cells[idx['换手率']])
    })
  }
  // 网易返回按日期倒序，统一升序（与东财一致）
  out.sort((a, b) => String(a['日期']).localeCompare(String(b['日期'])))
  return out
}

/** 简易 CSV 行解析：处理引号包裹的字段（网易 CSV 含逗号在引号内的情况） */
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuote = !inQuote; continue }
    if (ch === ',' && !inQuote) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out
}

module.exports = {
  name: 'netease',
  capabilities: ['kline', 'indexDaily'],
  fetchers: { kline: getKLine, indexDaily: getKLine }, // 指数日K网易同接口（指数 code 走 sz 前缀）
  available: () => true
}
