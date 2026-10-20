'use strict'

/**
 * 通达信官方数据包读取库（下载 / ZIP / 日线 / 财务），纯 I/O 与二进制解析，不触碰数据库。
 *
 * 为什么不用第三方 unzip 依赖：本应用只需读取通达信固定结构的 ZIP（deflate/store），
 * 用 Node 内置 zlib 解析中央目录即可，避免为一个功能引入供应链依赖（AGENTS.md 质量护栏）。
 *
 * 已实测的数据包结构（2026-10）：
 *   - hsjday.zip（券商全量日线，549MB，含 sh/sz/bj 三个市场，12210 个 .day 文件）
 *   - shzsday.zip / szzsday.zip（上证/深证指数日线，.day 文件）
 *   - 每日 g3day/YYYYMMDD.zip（约 1.9MB，仅含 sh/sz 的 mdt+cod，不含 .day）
 *       mdt 每条 256B：+4 昨收、+8 开、+12 高、+16 低、+20 收、+32 成交量、+40 成交额（均为 float32，
 *       成交量例外：+32 为 int32）；cod 每条 150B，前 6 字节为 6 位代码。
 *       已与同日的 sh000001.day 逐字段核对一致。
 *   - bjlday.zip（北交所全量 .day，约 9.4MB，每日整包更新，取末条即当日）
 *   - tdxfin.zip（专业财务，546MB，gpcwYYYYMMDD.dat 按季度全量）
 *       gpcw 结构：20B 头 + count×11B 目录（6 位代码 + uint32 块偏移）+ count×2336B 数据块
 *       （584 个 float32 字段）；count 在 +6，块大小在 +12。字段映射经平安银行/浦发/北交所样本交叉验证。
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const zlib = require('zlib')

const URLS = {
  daily: (compact) => `https://www.tdx.com.cn/products/data/data/g3day/${compact}.zip`,
  bjDaily: 'https://www.tdx.com.cn/products/data/data/vipdoc/bjlday.zip',
  full: 'https://data.tdx.com.cn/vipdoc/hsjday.zip',
  indexSh: 'https://www.tdx.com.cn/products/data/data/vipdoc/shzsday.zip',
  indexSz: 'https://www.tdx.com.cn/products/data/data/vipdoc/szzsday.zip',
  financial: 'https://data.tdx.com.cn/vipdoc/tdxfin.zip'
}

const DAY_RECORD_SIZE = 32
const MDT_RECORD_SIZE = 256

/** gpcw 财务字段映射（1-based，来自通达信专业财务字段编号，已用真实样本验证） */
const GPCW_FIELDS = {
  total_assets: 40,
  net_assets: 72,
  revenue: 74,
  net_profit: 96,
  operating_cashflow: 107,
  roe: 197,
  roa: 200,
  gross_margin: 202,
  net_profit_excl_nonrec: 206,
  debt_ratio: 210
}

// ---- 下载 ----

/**
 * 发起 HTTP(S) 请求并自动跟随重定向。
 * 不直接使用 fetch：需要可控的流式写入与长连接空闲超时（数据包最大 549MB）。
 */
function openResponse(url, { method = 'GET', headers = {}, redirects = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : http
    const req = lib.request(url, {
      method,
      // 强制 IPv4：本机双栈环境下 Node 直连 www.tdx.com.cn 会挂起（curl 正常），
      // 指定 family=4 后恢复（实测 100ms 响应）。
      family: 4,
      headers: { 'User-Agent': 'Mozilla/5.0', ...headers }
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
        res.resume()
        const next = new URL(res.headers.location, url).toString()
        return openResponse(next, { method, headers, redirects: redirects + 1 }).then(resolve, reject)
      }
      resolve(res)
    })
    req.on('error', reject)
    // 空闲超时：CDN 首字节可能慢（实测 ~8s），但流一旦中断最多等 120s
    req.setTimeout(120000, () => req.destroy(new Error('连接空闲超时')))
    req.end()
  })
}

async function head(url) {
  const res = await openResponse(url, { method: 'HEAD' })
  res.resume()
  return { status: res.statusCode, headers: res.headers }
}

/**
 * 下载到本地文件（先写 .part 再原子改名）。
 * 跳过策略：
 *   - immutable=true：文件已存在即跳过（按日期命名的每日包，内容不会变）；
 *   - 否则比较 Content-Length 与 Last-Modified，一致即跳过（bjlday/tdxfin 这种整包更新文件）。
 */
async function download(url, dest, { force = false, immutable = false, onProgress } = {}) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  if (!force && fs.existsSync(dest)) {
    const st = fs.statSync(dest)
    if (immutable && st.size > 0) return { path: dest, skipped: true, size: st.size }
    try {
      const h = await head(url)
      const remoteLen = Number(h.headers['content-length']) || 0
      const remoteMtime = Date.parse(h.headers['last-modified'] || '')
      const fresh = h.status === 200 && remoteLen === st.size && (!Number.isFinite(remoteMtime) || st.mtimeMs >= remoteMtime)
      if (fresh) return { path: dest, skipped: true, size: st.size }
    } catch (_) { /* HEAD 不可用 → 直接下载 */ }
  }

  const res = await openResponse(url)
  if (res.statusCode === 404) {
    res.resume()
    const e = new Error('数据包不存在（404，可能尚未发布或非交易日）')
    e.statusCode = 404
    throw e
  }
  if (res.statusCode !== 200 && res.statusCode !== 206) {
    res.resume()
    throw new Error(`下载失败 HTTP ${res.statusCode}`)
  }

  const total = Number(res.headers['content-length']) || 0
  const tmp = `${dest}.part`
  try {
    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(tmp)
      let received = 0
      let lastTick = 0
      res.on('data', (chunk) => {
        received += chunk.length
        const now = Date.now()
        if (onProgress && now - lastTick > 500) {
          lastTick = now
          onProgress({ received, total })
        }
      })
      res.on('error', reject)
      out.on('error', reject)
      out.on('finish', () => {
        if (total > 0 && received !== total) reject(new Error(`下载不完整：${received}/${total}`))
        else resolve()
      })
      res.pipe(out)
    })
  } catch (e) {
    try { fs.unlinkSync(tmp) } catch (_) { /* 清理残留 .part */ }
    throw e
  }
  fs.renameSync(tmp, dest)
  return { path: dest, skipped: false, size: fs.statSync(dest).size }
}

// ---- ZIP 解析 ----

function readFd(fd, position, length) {
  const buf = Buffer.alloc(length)
  let off = 0
  while (off < length) {
    const n = fs.readSync(fd, buf, off, length - off, position + off)
    if (!n) break
    off += n
  }
  return off === length ? buf : buf.slice(0, off)
}

/** 读取 ZIP 中央目录（不支持 ZIP64；通达信包均 <4GB 且条目 <65535，实测 12210 条） */
function listZip(zipPath) {
  const size = fs.statSync(zipPath).size
  const fd = fs.openSync(zipPath, 'r')
  try {
    const tailLen = Math.min(size, 65558)
    const tail = readFd(fd, size - tailLen, tailLen)
    let eocd = -1
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
    }
    if (eocd < 0) throw new Error('ZIP 结构损坏：未找到 EOCD')
    const entries = tail.readUInt16LE(eocd + 10)
    const cdSize = tail.readUInt32LE(eocd + 12)
    const cdOffset = tail.readUInt32LE(eocd + 16)
    if (cdOffset === 0xffffffff || cdSize === 0xffffffff) throw new Error('暂不支持 ZIP64')
    const cd = readFd(fd, cdOffset, cdSize)
    const out = []
    let p = 0
    for (let i = 0; i < entries; i++) {
      if (p + 46 > cd.length || cd.readUInt32LE(p) !== 0x02014b50) throw new Error('ZIP 中央目录损坏')
      const method = cd.readUInt16LE(p + 10)
      const compSize = cd.readUInt32LE(p + 20)
      const uncompSize = cd.readUInt32LE(p + 24)
      const nameLen = cd.readUInt16LE(p + 28)
      const extraLen = cd.readUInt16LE(p + 30)
      const commentLen = cd.readUInt16LE(p + 32)
      const localOffset = cd.readUInt32LE(p + 42)
      const name = cd.slice(p + 46, p + 46 + nameLen).toString('utf8')
      out.push({ name, method, compSize, uncompSize, localOffset })
      p += 46 + nameLen + extraLen + commentLen
    }
    return out
  } finally {
    fs.closeSync(fd)
  }
}

function readEntryFd(fd, entry) {
  const hdr = readFd(fd, entry.localOffset, 30)
  if (hdr.length < 30 || hdr.readUInt32LE(0) !== 0x04034b50) throw new Error(`ZIP 局部头损坏: ${entry.name}`)
  const nameLen = hdr.readUInt16LE(26)
  const extraLen = hdr.readUInt16LE(28)
  const start = entry.localOffset + 30 + nameLen + extraLen
  const comp = readFd(fd, start, entry.compSize)
  if (entry.method === 0) return comp
  if (entry.method === 8) return zlib.inflateRawSync(comp)
  throw new Error(`不支持的压缩方式 ${entry.method}: ${entry.name}`)
}

/** 读取单个条目（按文件名后缀匹配） */
function readZipEntry(zipPath, matcher) {
  const entries = listZip(zipPath)
  const hit = entries.find(e => (typeof matcher === 'function' ? matcher(e) : e.name === matcher))
  if (!hit) throw new Error('ZIP 中未找到条目: ' + matcher)
  const fd = fs.openSync(zipPath, 'r')
  try {
    return { entry: hit, data: readEntryFd(fd, hit) }
  } finally {
    fs.closeSync(fd)
  }
}

/**
 * 逐条读取 zip 内容（单 fd 顺序读，避免大包（如 bjlday 622 条）反复 open）。
 * cb 返回 false 可提前终止。
 */
function forEachZipEntry(zipPath, filter, cb) {
  const entries = listZip(zipPath)
  const fd = fs.openSync(zipPath, 'r')
  try {
    for (const e of entries) {
      if (filter && !filter(e)) continue
      if (cb(e, readEntryFd(fd, e)) === false) break
    }
  } finally {
    fs.closeSync(fd)
  }
}

/** 解压匹配的条目到目录（保持 zip 内相对路径；拒绝路径穿越） */
function extractZip(zipPath, destDir, filter, onProgress) {
  const entries = listZip(zipPath)
  const root = path.resolve(destDir)
  const fd = fs.openSync(zipPath, 'r')
  let files = 0
  try {
    for (const e of entries) {
      if (filter && !filter(e)) continue
      const data = readEntryFd(fd, e)
      const rel = e.name.replace(/\\/g, '/').replace(/^\/+/, '')
      const out = path.resolve(root, rel)
      if (out !== root && !out.startsWith(root + path.sep)) continue
      fs.mkdirSync(path.dirname(out), { recursive: true })
      fs.writeFileSync(out, data)
      files++
      if (onProgress && files % 200 === 0) onProgress({ files, entries: entries.length })
    }
  } finally {
    fs.closeSync(fd)
  }
  return { files }
}

function basename(name) {
  return String(name).replace(/\\/g, '/').split('/').pop()
}

// ---- 日期与数值工具 ----

function compact(v) {
  return String(v || '').replace(/\D/g, '')
}

function compactToISO(s) {
  const t = compact(s)
  return t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : null
}

function isoToCompact(s) {
  return compact(s)
}

function round2(v) {
  return Math.round(Number(v) * 100) / 100
}

function finiteOrNull(v) {
  return Number.isFinite(v) ? v : null
}

// ---- .day / mdt+cod 解析 ----

/** 市场 + 代码是否 A 股（daily_k_raw 只补个股；指数/基金/债券不写入） */
function isAStock(market, code) {
  if (market === 'sh') return /^6\d{5}$/.test(code)
  if (market === 'sz') return /^(00|30)\d{4}$/.test(code)
  if (market === 'bj') return /^[489]\d{5}$/.test(code)
  return false
}

/** 解析 .day 二进制（32B/条：date, open, high, low, close, amount(float), volume, reserved） */
function parseDayBuffer(buf, symbol, { from, to } = {}) {
  const count = Math.floor(buf.length / DAY_RECORD_SIZE)
  const sd = from ? Number(compact(from)) : 0
  const ed = to ? Number(compact(to)) : 0
  const rows = []
  for (let i = 0; i < count; i++) {
    const off = i * DAY_RECORD_SIZE
    const date = buf.readInt32LE(off)
    if (sd && date < sd) continue
    if (ed && date > ed) continue
    const open = buf.readInt32LE(off + 4) / 100
    const high = buf.readInt32LE(off + 8) / 100
    const low = buf.readInt32LE(off + 12) / 100
    const close = buf.readInt32LE(off + 16) / 100
    const amount = buf.readFloatLE(off + 20)
    const volume = buf.readInt32LE(off + 24)
    if (open <= 0 || close <= 0) continue
    const ds = String(date)
    rows.push({
      symbol,
      trade_date: `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`,
      open, close, high, low,
      volume: Math.abs(volume),
      amount: Math.abs(amount)
    })
  }
  return rows
}

/**
 * 解析每日行情包（mdt + cod，sh/sz 各一份）为个股行。
 * 字段位置见文件头说明；价格 float32 四舍五入到 2 位，与 .day 的“分”口径一致。
 */
function parseMarketSnapshot(mdtBuf, codBuf, market, dateISO) {
  if (mdtBuf.length % MDT_RECORD_SIZE !== 0) throw new Error(`mdt 长度异常: ${mdtBuf.length}`)
  const count = mdtBuf.length / MDT_RECORD_SIZE
  const recSize = codBuf.length / count
  if (!Number.isInteger(recSize) || recSize < 24) throw new Error(`cod 记录长度异常: ${codBuf.length}/${count}`)
  const rows = []
  for (let i = 0; i < count; i++) {
    const co = i * recSize
    const code = codBuf.toString('latin1', co, co + 6)
    if (!/^\d{6}$/.test(code) || !isAStock(market, code)) continue
    const o = i * MDT_RECORD_SIZE
    const open = mdtBuf.readFloatLE(o + 8)
    const high = mdtBuf.readFloatLE(o + 12)
    const low = mdtBuf.readFloatLE(o + 16)
    const close = mdtBuf.readFloatLE(o + 20)
    if (!(open > 0 && close > 0 && high > 0 && low > 0)) continue
    rows.push({
      symbol: code,
      trade_date: dateISO,
      open: round2(open),
      close: round2(close),
      high: round2(high),
      low: round2(low),
      volume: Math.abs(mdtBuf.readInt32LE(o + 32)),
      amount: round2(Math.abs(mdtBuf.readFloatLE(o + 40)))
    })
  }
  return rows
}

const INDEX_CODES = { sh: ['000001'], sz: ['399001', '399006'] }

/** 从每日行情包提取三大指数日K（含涨跌幅/振幅等派生列，口径对齐 converter.convertIndexDaily） */
function parseIndexSnapshot(mdtBuf, codBuf, market, dateISO) {
  const wanted = INDEX_CODES[market]
  if (!wanted) return []
  if (mdtBuf.length % MDT_RECORD_SIZE !== 0) throw new Error(`mdt 长度异常: ${mdtBuf.length}`)
  const count = mdtBuf.length / MDT_RECORD_SIZE
  const recSize = codBuf.length / count
  if (!Number.isInteger(recSize) || recSize < 24) throw new Error(`cod 记录长度异常: ${codBuf.length}/${count}`)
  const now = new Date()
  const out = []
  for (let i = 0; i < count; i++) {
    const co = i * recSize
    const code = codBuf.toString('latin1', co, co + 6)
    if (!wanted.includes(code)) continue
    const o = i * MDT_RECORD_SIZE
    const prevClose = mdtBuf.readFloatLE(o + 4)
    const open = mdtBuf.readFloatLE(o + 8)
    const high = mdtBuf.readFloatLE(o + 12)
    const low = mdtBuf.readFloatLE(o + 16)
    const close = mdtBuf.readFloatLE(o + 20)
    if (!(open > 0 && close > 0)) continue
    const pc = prevClose > 0 ? prevClose : null
    out.push({
      symbol: code,
      trade_date: dateISO,
      open: round2(open),
      close: round2(close),
      high: round2(high),
      low: round2(low),
      volume: Math.abs(mdtBuf.readInt32LE(o + 32)),
      amount: round2(Math.abs(mdtBuf.readFloatLE(o + 40))),
      amplitude: pc ? round2(((high - low) / pc) * 100) : null,
      change: pc ? round2(((close - pc) / pc) * 100) : null,
      price_change: pc ? round2(close - pc) : null,
      turnover_rate: null,
      create_time: now,
      update_time: now
    })
  }
  return out
}

/** 给 .day 解析结果补齐指数派生列（用于全量导入） */
function withIndexDerived(rows) {
  const now = new Date()
  const sorted = rows.slice().sort((a, b) => (a.trade_date < b.trade_date ? -1 : 1))
  let prev = null
  return sorted.map((r) => {
    const out = {
      ...r,
      amplitude: prev && prev.close > 0 ? round2(((r.high - r.low) / prev.close) * 100) : null,
      change: prev && prev.close > 0 ? round2(((r.close - prev.close) / prev.close) * 100) : null,
      price_change: prev && prev.close > 0 ? round2(r.close - prev.close) : null,
      turnover_rate: null,
      create_time: now,
      update_time: now
    }
    prev = r
    return out
  })
}

// ---- 财务 gpcw 解析 ----

/**
 * 解析 gpcwYYYYMMDD.dat → stock_financial 行（10 个指标列 + code/report_date）。
 * 结构校验失败会抛错（旧季度格式可能不同，调用方按文件跳过并记录）。
 */
function parseGpcw(buf, reportDate) {
  if (buf.length < 20) throw new Error('gpcw 文件过短')
  const count = buf.readUInt16LE(6)
  const blockSize = buf.readUInt16LE(12)
  const dataStart = 20 + count * 11
  if (!count || blockSize < 100 || dataStart + count * blockSize > buf.length) {
    throw new Error(`gpcw 结构异常: count=${count} block=${blockSize} len=${buf.length}`)
  }
  const rows = []
  for (let i = 0; i < count; i++) {
    const o = 20 + i * 11
    const code = buf.toString('latin1', o, o + 6)
    if (!/^\d{6}$/.test(code)) continue
    const off = buf.readUInt32LE(o + 7)
    if (off + blockSize > buf.length) continue
    const row = { code, report_date: reportDate }
    let any = false
    for (const [key, fi] of Object.entries(GPCW_FIELDS)) {
      const pos = off + (fi - 1) * 4
      const v = pos + 4 <= off + blockSize ? finiteOrNull(buf.readFloatLE(pos)) : null
      row[key] = v
      if (v != null && Math.abs(v) > 1e-9) any = true
    }
    if (!any) continue
    rows.push(row)
  }
  return rows
}

module.exports = {
  URLS,
  download,
  head,
  listZip,
  readZipEntry,
  forEachZipEntry,
  extractZip,
  basename,
  compact,
  compactToISO,
  isoToCompact,
  parseDayBuffer,
  parseMarketSnapshot,
  parseIndexSnapshot,
  withIndexDerived,
  parseGpcw,
  isAStock
}
