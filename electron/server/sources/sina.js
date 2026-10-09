'use strict'

/**
 * 新浪财经数据源（免费、无 key、无严格限流）。
 *
 * 覆盖：
 *   - kline：money.finance.sina.com.cn getKLineData（JSON，日K/分钟K，不复权）
 *   - spot：vip.stock.finance.sina.com.cn Market_Center.getHQNodeData（全A股分页）
 *   - indexDaily：同 getKLineData 接口，指数代码前缀 sh/sz
 *
 * 单位口径与东财对齐：价格元、成交量手、成交额元。
 * 新浪不复权，作为兜底用不复权行情（与腾讯兜底 mapTxKline 一致；前复权由 DolphinDB/调用方降级处理）。
 * 涨跌额/涨跌幅由前收推导（新浪行无涨跌字段），首行无前收 → null（与腾讯兜底口径一致）。
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function getJson(url, { timeout = 10000, retries = 1, retryDelay = 1000 } = {}) {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const buf = await new Promise((resolve, reject) => {
        const u = new URL(url)
        const lib = u.protocol === 'https:' ? https : http
        const req = lib.request({
          hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search, method: 'GET',
          headers: { 'User-Agent': UA, Referer: 'https://finance.sina.com.cn/' }, timeout
        }, (res) => {
          const chunks = []
          res.on('data', c => chunks.push(c))
          res.on('end', () => {
            if (res.statusCode !== 200) return reject(new Error(`新浪返回 ${res.statusCode}`))
            resolve(Buffer.concat(chunks))
          })
        })
        req.on('error', e => reject(new Error(`新浪请求失败(${e.code || e.message})`)))
        req.on('timeout', () => req.destroy(new Error('新浪请求超时')))
        req.end()
      })
      const text = buf.toString('utf8')
      // 新浪 getKLineData 返回的是 JSON 数组，但有时带额外包裹；去可能的前后非 JSON 字符
      const start = text.indexOf('[')
      const end = text.lastIndexOf(']')
      if (start < 0 || end < 0) throw new Error('新浪返回非 JSON 数组')
      return JSON.parse(text.slice(start, end + 1))
    } catch (e) {
      lastErr = e
      if (attempt < retries && retryDelay > 0) await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)))
    }
  }
  throw lastErr
}

/** A股代码 → 新浪前缀：6开头→sh，3/0开头→sz，8/4/920开头→bj */
function sinaPrefix(code) {
  const c = String(code || '')
  if (/^(43|83|87|88|92)/.test(c)) return 'bj'
  return c.startsWith('6') ? 'sh' : 'sz'
}

/** 日期 'YYYYMMDD'/'YYYY-MM-DD' → 'YYYY-MM-DD'（新浪返回 day 字段已是该格式） */
function normDate(v) {
  const s = String(v || '').replace(/\D/g, '')
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : String(v || '')
}

/** 按日期区间过滤（新浪只支持 datalen=count，不支持 start/end，故拉足量后过滤） */
function inRange(day, sd, ed) {
  const d = String(day || '').replace(/\D/g, '')
  if (!d) return false
  const s = String(sd || '').replace(/\D/g, '')
  const e = String(ed || '').replace(/\D/g, '')
  return (!s || d >= s) && (!e || d <= e)
}

/** 保留两位小数；非有限数返回 null */
function round2(x) { return Number.isFinite(x) ? Math.round(x * 100) / 100 : null }
function nv(v) { const n = Number(v); return Number.isFinite(n) ? n : null }

/** 估算 datalen：区间天数 → 交易日(≈2/3) → 多要 20% 兜底，最少 200 */
function estimateDatalen(sd, ed) {
  if (!sd || !ed) return 640
  const a = new Date(normDate(sd) + 'T00:00:00')
  const b = new Date(normDate(ed) + 'T00:00:00')
  const days = Math.ceil((b - a) / 86400000) + 1
  if (!Number.isFinite(days) || days <= 0) return 640
  return Math.max(200, Math.ceil(days * 5 / 7 * 1.2))
}

/**
 * 个股日K/分钟K（新浪 getKLineData，不复权）。
 * @param {symbol, period, start_date, end_date, adjust} period: daily/weekly/monthly → scale=240；
 *        分钟 period '5'/'15'/'30'/'60' → scale 同名
 * 返回中文键对象数组（与东财 getStockHistory 同构，缺换手率/成交额部分）
 */
async function getKLine({ symbol, period = 'daily', start_date, end_date, adjust }) {
  const code = sinaPrefix(symbol) + symbol
  // 新浪 scale：240=日K；周/月K 新浪不支持直接，按日拉后由调用方聚合（此处仍按日返回）
  // 分钟 K：period='5'/'15'/'30'/'60' 直接作 scale
  const scale = /^\d+$/.test(String(period)) ? period : '240'
  const datalen = estimateDatalen(start_date, end_date)
  const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${code}&scale=${scale}&ma=no&datalen=${datalen}`
  const rows = await getJson(url, { retries: 0, timeout: 10000 })
  if (!Array.isArray(rows)) return []
  let prevClose = null
  const out = []
  for (const r of rows) {
    const day = r.day
    if (!day || !inRange(day, start_date, end_date)) continue
    const o = nv(r.open), c = nv(r.close), h = nv(r.high), l = nv(r.low)
    const chg = prevClose == null ? null : round2(c - prevClose)
    out.push({
      '日期': day, '股票代码': symbol,
      '开盘': o, '收盘': c, '最高': h, '最低': l,
      '成交量': nv(r.volume), '成交额': nv(r.amount),
      '振幅': prevClose == null || prevClose === 0 ? null : round2((h - l) / prevClose * 100),
      '涨跌幅': chg == null || prevClose === 0 ? null : round2(chg / prevClose * 100),
      '涨跌额': chg,
      '换手率': null   // 新浪无换手率
    })
    if (c != null) prevClose = c
  }
  return out
}

/**
 * 指数日K（新浪 getKLineData，指数代码前缀 sh/sz）。
 * 指数代码：000xxx→sh，399xxx→sz。
 */
async function getIndexDaily({ symbol, start_date, end_date, period = 'daily' }) {
  const prefix = String(symbol).startsWith('399') ? 'sz' : 'sh'
  const code = prefix + symbol
  const datalen = estimateDatalen(start_date, end_date)
  const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${code}&scale=240&ma=no&datalen=${datalen}`
  const rows = await getJson(url, { retries: 0, timeout: 10000 })
  if (!Array.isArray(rows)) return []
  let prevClose = null
  const out = []
  for (const r of rows) {
    const day = r.day
    if (!day || !inRange(day, start_date, end_date)) continue
    const o = nv(r.open), c = nv(r.close), h = nv(r.high), l = nv(r.low)
    const chg = prevClose == null ? null : round2(c - prevClose)
    out.push({
      '日期': day, '开盘': o, '收盘': c, '最高': h, '最低': l,
      '成交量': nv(r.volume), '成交额': nv(r.amount),
      '振幅': prevClose == null || prevClose === 0 ? null : round2((h - l) / prevClose * 100),
      '涨跌幅': chg == null || prevClose === 0 ? null : round2(chg / prevClose * 100),
      '涨跌额': chg, '换手率': null
    })
    if (c != null) prevClose = c
  }
  return out
}

/**
 * 全A股实时快照（新浪 Market_Center.getHQNodeData，分页取全市场）。
 * node=hs_a 覆盖沪深A股；北交所 node=bj_a 单独取后合并。
 * 返回中文键对象数组（与东财 getStockSpot 输出同构，mapSpotItem 可消费）。
 */
async function getSpot() {
  const all = []
  // 沪深A股
  await fetchNodePages('hs_a', all)
  // 北交所（新浪可能不提供，失败静默）
  try { await fetchNodePages('bj_a', all) } catch (_) { /* 新浪无北交所节点则跳过 */ }
  if (!all.length) throw new Error('新浪全市场行情返回空')
  return all
}

async function fetchNodePages(node, sink) {
  const PAGE = 100
  let page = 1
  while (page <= 60) { // 安全上限 60×100=6000
    const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=${PAGE}&node=${node}&sort=symbol&asc=1`
    const rows = await getJson(url, { retries: 1, timeout: 10000 })
    if (!Array.isArray(rows) || !rows.length) break
    for (const r of rows) {
      const code = String(r.code || '').replace(/^(sh|sz|bj)/, '')
      if (!code) continue
      const price = nv(r.trade)
      const prevClose = nv(r.settlement)
      const chg = (price != null && prevClose != null && prevClose !== 0) ? round2(price - prevClose) : null
      sink.push({
        '序号': sink.length + 1, '代码': code, '名称': r.name,
        '最新价': price, '涨跌额': chg,
        '涨跌幅': (chg != null && prevClose !== 0) ? round2(chg / prevClose * 100) : null,
        '成交量': nv(r.volume), '成交额': nv(r.amount),
        '振幅': null, '最高': nv(r.high), '最低': nv(r.low),
        '今开': nv(r.open), '昨收': prevClose, '量比': null,
        '换手率': null, '市盈率-动态': null, '市净率': null,
        '总市值': null, '流通市值': null, '涨速': null, '5分钟涨跌': null,
        '60日涨跌幅': null, '年初至今涨跌幅': null
      })
    }
    if (rows.length < PAGE) break
    page++
  }
}

module.exports = {
  name: 'sina',
  capabilities: ['kline', 'spot', 'indexDaily'],
  fetchers: { kline: getKLine, spot: getSpot, indexDaily: getIndexDaily },
  available: () => true
}
