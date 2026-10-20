'use strict'

/**
 * 通达信数据包 → 本地库导入编排。
 *
 * 覆盖三类数据：
 *   1. 每日全市场个股日K（g3day 的 mdt/cod）→ DolphinDB daily_k_raw（不复权基线）
 *      + 北交所（bjlday.zip 取当日末条）→ 同一张表。
 *   2. 三大指数日K（shzsday/szzsday 全史，或每日包当日）→ stock_zh_index_daily。
 *   3. 季度财务（tdxfin.zip 内 gpcwYYYYMMDD.dat）→ SQLite stock_financial。
 *
 * 为什么不复用 tdx-import.insertRows：它按 symbol 逐只预删除（5000 只 = 5000 次
 * DolphinDB 往返，分钟级），日更场景改为“按日期一次 delete + 批量 insert”。
 *
 * 写入口径：
 *   - daily_k_raw 与 tdx-import 全量导入一致（7 列 + 日期），不复权；
 *   - stock_zh_index_daily 只写 2024 年起（dfs://tradeinsight 分区起点，更早会被静默丢弃）。
 */

const fs = require('fs')
const path = require('path')
const os = require('os')

const tdx = require('./tdx-package')

const RAW_DB = 'dfs://tradeinsight_raw'
const MAIN_DB = 'dfs://tradeinsight'
const INDEX_SYMBOLS = ['000001', '399001', '399006']
const INDEX_MIN_DATE = '2024-01-01'

const RAW_COLS = [
  { name: 'symbol', type: 'symbol' },
  { name: 'trade_date', type: 'date' },
  { name: 'open', type: 'double' },
  { name: 'close', type: 'double' },
  { name: 'high', type: 'double' },
  { name: 'low', type: 'double' },
  { name: 'volume', type: 'long' },
  { name: 'amount', type: 'double' }
]

const INDEX_COLS = [
  { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
  { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
  { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
  { name: 'volume', type: 'double' }, { name: 'amount', type: 'double' },
  { name: 'amplitude', type: 'double' }, { name: 'change', type: 'double' },
  { name: 'price_change', type: 'double' }, { name: 'turnover_rate', type: 'double' },
  { name: 'create_time', type: 'timestamp' }, { name: 'update_time', type: 'timestamp' }
]

const FINANCIAL_SQL = `INSERT OR REPLACE INTO stock_financial
  (code, report_date, revenue, net_profit, net_profit_excl_nonrec,
   total_assets, net_assets, debt_ratio, operating_cashflow, gross_margin, roe, roa)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

/** 默认缓存目录：与 sqlite data 同级（<userData>/tdx-packages），CLI 环境回退临时目录。 */
function getCacheDir() {
  if (process.env.TDX_PACKAGE_CACHE) return process.env.TDX_PACKAGE_CACHE
  try {
    const { getDataDir } = require('../server/db')
    const dir = getDataDir()
    if (dir) return path.join(path.dirname(dir), 'tdx-packages')
  } catch (_) { /* db 未初始化（纯 CLI）→ 临时目录 */ }
  return path.join(os.tmpdir(), 'guipai-tdx-packages')
}

function ddbDate(iso) {
  return String(iso).replace(/-/g, '.')
}

async function ensureDdb() {
  const ddb = require('./client')
  if (!ddb.isConnected()) await ddb.connect()
  return ddb
}

function rowsOf(r) {
  if (Array.isArray(r)) return r
  if (r && r.rows && r.columns) return r.rows.map(x => { const o = {}; r.columns.forEach((c, i) => { o[c] = x[i] }); return o })
  if (r && typeof r === 'object') {
    const ks = Object.keys(r)
    if (ks.length && Array.isArray(r[ks[0]])) {
      const out = []
      for (let i = 0; i < r[ks[0]].length; i++) {
        const o = {}
        ks.forEach(k => { o[k] = r[k][i] })
        out.push(o)
      }
      return out
    }
  }
  return []
}

/** 批量写 daily_k_raw（调用方保证同日期旧数据已删） */
async function insertRawRows(rows) {
  if (!rows || !rows.length) return 0
  const ddb = await ensureDdb()
  const mod = await import('dolphindb')
  const colVecs = RAW_COLS.map((c) => {
    const vals = rows.map(r => r[c.name])
    switch (c.type) {
      case 'symbol': return new mod.DdbVectorSymbol(vals.map(v => (v == null ? '' : String(v))))
      case 'date': return new mod.DdbVectorDate(vals)
      case 'double': return new mod.DdbVectorDouble(vals)
      case 'long': return new mod.DdbVectorLong(vals)
      default: throw new Error('未知列类型: ' + c.type)
    }
  })
  const tbl = new mod.DdbTable(colVecs)
  await ddb.getClient().upload(['pkgRaw'], [tbl])
  await ddb.execute(`tableInsert{loadTable("${RAW_DB}", "daily_k_raw")}(pkgRaw)`)
  return rows.length
}

async function deleteRawDate(dateISO) {
  const ddb = await ensureDdb()
  const d = ddbDate(dateISO)
  await ddb.execute(`t = loadTable("${RAW_DB}", "daily_k_raw"); delete from t where trade_date=${d}`)
}

/** 某日 daily_k_raw 行数 */
async function countRawDate(dateISO) {
  const ddb = await ensureDdb()
  return ddb.count(`select count(*) as c from loadTable("${RAW_DB}", "daily_k_raw") where trade_date=${ddbDate(dateISO)}`)
}

/** 最近 N 个交易日（按工作日回溯，节假日会被 404/空数据自然跳过） */
function recentWeekdays(n, endDate = new Date()) {
  const out = []
  const d = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
  while (out.length < n) {
    const wd = d.getDay()
    if (wd !== 0 && wd !== 6) {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      out.push(`${y}-${m}-${day}`)
    }
    d.setDate(d.getDate() - 1)
  }
  return out
}

function isoToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 提取每日包中某市场 mdt/cod 条目（文件名形如 sh261019.mdt） */
function findDailyEntries(entries, compactDate) {
  const tag = compactDate.slice(2)
  const mdt = entries.find(e => tdx.basename(e.name).toLowerCase() === `sh${tag}.mdt`)
  const shCod = entries.find(e => tdx.basename(e.name).toLowerCase() === `sh${tag}.cod`)
  const szMdt = entries.find(e => tdx.basename(e.name).toLowerCase() === `sz${tag}.mdt`)
  const szCod = entries.find(e => tdx.basename(e.name).toLowerCase() === `sz${tag}.cod`)
  return { sh: [mdt, shCod], sz: [szMdt, szCod] }
}

/**
 * 同步单个交易日的个股日K + 指数日K。
 * 数据包 404 → 抛出 err.statusCode=404（调用方视为非交易日/尚未发布）。
 */
async function syncDaily(dateISO, { cacheDir = getCacheDir(), force = false, onProgress = () => {} } = {}) {
  const iso = String(dateISO || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error('日期格式应为 YYYY-MM-DD: ' + dateISO)
  const compact = iso.replace(/-/g, '')

  const dailyZip = path.join(cacheDir, 'daily', `${compact}.zip`)
  onProgress({ phase: `下载每日行情包 ${compact}`, percent: 5 })
  await tdx.download(tdx.URLS.daily(compact), dailyZip, {
    immutable: !force,
    onProgress: p => onProgress({ phase: `下载每日行情包 ${compact}`, percent: 10, detail: p })
  })

  const entries = tdx.listZip(dailyZip)
  const picked = findDailyEntries(entries, compact)
  if (!picked.sh[0] || !picked.sh[1] || !picked.sz[0] || !picked.sz[1]) {
    throw new Error(`每日行情包内容不完整（${compact}）：缺少 sh/sz 的 mdt/cod`)
  }

  const shMdt = tdx.readZipEntry(dailyZip, picked.sh[0].name).data
  const shCod = tdx.readZipEntry(dailyZip, picked.sh[1].name).data
  const szMdt = tdx.readZipEntry(dailyZip, picked.sz[0].name).data
  const szCod = tdx.readZipEntry(dailyZip, picked.sz[1].name).data
  onProgress({ phase: '解析每日行情', percent: 35 })

  const rows = [
    ...tdx.parseMarketSnapshot(shMdt, shCod, 'sh', iso),
    ...tdx.parseMarketSnapshot(szMdt, szCod, 'sz', iso)
  ]
  const indexRows = [
    ...tdx.parseIndexSnapshot(shMdt, shCod, 'sh', iso),
    ...tdx.parseIndexSnapshot(szMdt, szCod, 'sz', iso)
  ]

  // 北交所：整包每日更新，逐文件取末条 = 当日有成交的股票（停牌/退市自然缺失）
  const bjZip = path.join(cacheDir, 'bjlday.zip')
  onProgress({ phase: '下载北交所日线包', percent: 45 })
  await tdx.download(tdx.URLS.bjDaily, bjZip, {
    onProgress: p => onProgress({ phase: '下载北交所日线包', percent: 50, detail: p })
  })
  onProgress({ phase: '解析北交所日线', percent: 60 })
  tdx.forEachZipEntry(bjZip, e => /\.day$/i.test(e.name), (e, data) => {
    const symbol = tdx.basename(e.name).replace(/\.day$/i, '').replace(/^bj/i, '')
    if (!tdx.isAStock('bj', symbol)) return
    const got = tdx.parseDayBuffer(data, symbol, { from: compact, to: compact })
    if (got.length) rows.push(got[0])
  })

  if (!rows.length) return { date: iso, raw: 0, index: 0, empty: true }

  onProgress({ phase: '写入 DolphinDB', percent: 80 })
  await ensureDdb()
  await deleteRawDate(iso)
  const rawWritten = await insertRawRows(rows)

  let indexWritten = 0
  if (indexRows.length && iso >= INDEX_MIN_DATE) {
    const ddb = await ensureDdb()
    const d = ddbDate(iso)
    // 只删本链路负责的三大指数，避免误删其他来源写入的指数（如 000300）
    const cond = INDEX_SYMBOLS.map(s => `symbol='${s}'`).join(' or ')
    await ddb.execute(`t = loadTable("${MAIN_DB}", "stock_zh_index_daily"); delete from t where trade_date=${d} and (${cond})`)
    indexWritten = await ddb.insertRows('stock_zh_index_daily', INDEX_COLS, indexRows)
  }

  onProgress({ phase: '完成', percent: 100 })
  return { date: iso, raw: rawWritten, index: indexWritten, empty: false }
}

/**
 * 全量导入个股日K（hsjday.zip，含沪深北）。
 * 解压后把 TDX_PATH 指到解压目录，复用 tdx-import 的遍历/幂等逻辑。
 * tdx-import 在模块加载时读取 TDX_PATH，因此必须先设 env 再 require。
 *
 * mode：
 *   - full（默认）只补库内缺失的 symbol，适合首次建库；
 *   - refresh 强制重刷区间内所有 symbol（已有历史需要补深/纠错时用）。
 */
async function importFull({ cacheDir = getCacheDir(), startDate = '1990-01-01', endDate = isoToday(), mode = 'full', onProgress = () => {} } = {}) {
  const zip = path.join(cacheDir, 'hsjday.zip')
  onProgress({ phase: '下载全量日线包（约 550MB）', percent: 2 })
  await tdx.download(tdx.URLS.full, zip, {
    immutable: true,
    onProgress: p => onProgress({ phase: '下载全量日线包（约 550MB）', percent: 5, detail: p })
  })

  const root = path.join(cacheDir, 'hsjday')
  const marker = path.join(root, '.extracted')
  if (!fs.existsSync(marker)) {
    onProgress({ phase: '解压全量日线包', percent: 30 })
    tdx.extractZip(zip, root, e => /\.day$/i.test(e.name), p => onProgress({
      phase: '解压全量日线包', percent: 35, detail: p
    }))
    fs.writeFileSync(marker, new Date().toISOString())
  }

  process.env.TDX_PATH = root
  const modPath = require.resolve('./tdx-import')
  delete require.cache[modPath]
  const importer = require('./tdx-import')
  onProgress({ phase: '写入 daily_k_raw', percent: 70 })
  const res = await importer.importLocal({ mode, startDate, endDate })
  onProgress({ phase: '完成', percent: 100 })
  return res
}

/**
 * 指数全量导入（shzsday/szzsday，写 stock_zh_index_daily）。
 * 只取 2024 年起：DolphinDB 该表按年分区且起始 year=2024，更早数据写不进去。
 */
async function importIndex({ cacheDir = getCacheDir(), fromDate = INDEX_MIN_DATE, onProgress = () => {} } = {}) {
  const src = [
    { url: tdx.URLS.indexSh, zip: 'shzsday.zip', symbol: '000001', file: 'sh000001.day' },
    { url: tdx.URLS.indexSz, zip: 'szzsday.zip', symbol: '399001', file: 'sz399001.day' },
    { url: tdx.URLS.indexSz, zip: 'szzsday.zip', symbol: '399006', file: 'sz399006.day' }
  ]
  const ddb = await ensureDdb()
  const picked = new Map()
  for (const item of src) {
    if (!picked.has(item.zip)) {
      const dest = path.join(cacheDir, item.zip)
      onProgress({ phase: `下载指数日线包 ${item.zip}`, percent: 10 })
      await tdx.download(item.url, dest, {
        immutable: false,
        onProgress: p => onProgress({ phase: `下载指数日线包 ${item.zip}`, percent: 15, detail: p })
      })
      picked.set(item.zip, dest)
    }
  }

  let written = 0
  let i = 0
  for (const item of src) {
    i++
    const dest = picked.get(item.zip)
    onProgress({ phase: `导入指数 ${item.symbol}`, percent: 20 + i * 20 })
    const { data } = tdx.readZipEntry(dest, e => tdx.basename(e.name).toLowerCase() === item.file)
    const rows = tdx.withIndexDerived(tdx.parseDayBuffer(data, item.symbol))
      .filter(r => r.trade_date >= fromDate)
    if (!rows.length) continue
    const d = ddbDate(fromDate)
    await ddb.execute(`t = loadTable("${MAIN_DB}", "stock_zh_index_daily"); delete from t where symbol='${item.symbol}' and trade_date>=${d}`)
    written += await ddb.insertRows('stock_zh_index_daily', INDEX_COLS, rows)
  }
  onProgress({ phase: '完成', percent: 100 })
  return { index: written }
}

/** 列出 tdxfin.zip 内 gpcw 季度文件（过滤区间；升序） */
function listFinancialQuarters(zipPath, fromDate) {
  const from = String(fromDate).replace(/\D/g, '')
  return tdx.listZip(zipPath)
    .map((e) => {
      const m = /^gpcw(\d{8})\.dat$/i.exec(tdx.basename(e.name))
      return m ? { entry: e, compact: m[1] } : null
    })
    .filter(v => v && v.compact >= from)
    .sort((a, b) => (a.compact < b.compact ? -1 : 1))
}

/**
 * 导入季度财务到 SQLite。默认 2010 年起：更早季度的 gpcw 块布局可能不同，
 * 解析器会做结构校验，异常文件跳过并记入 errors。
 */
async function importFinancial({ cacheDir = getCacheDir(), fromDate = '2010-01-01', onProgress = () => {} } = {}) {
  const { getDb } = require('../server/db')
  const db = getDb()
  const zip = path.join(cacheDir, 'tdxfin.zip')
  onProgress({ phase: '下载财务包（约 550MB）', percent: 2 })
  await tdx.download(tdx.URLS.financial, zip, {
    onProgress: p => onProgress({ phase: '下载财务包（约 550MB）', percent: 5, detail: p })
  })

  const quarters = listFinancialQuarters(zip, fromDate)
  if (!quarters.length) throw new Error('财务包内未找到 gpcw 季度数据')

  let files = 0
  let rows = 0
  const errors = []
  for (const q of quarters) {
    const reportDate = `${q.compact.slice(0, 4)}-${q.compact.slice(4, 6)}-${q.compact.slice(6, 8)}`
    let parsed
    try {
      const { data } = tdx.readZipEntry(zip, e => e.name === q.entry.name || tdx.basename(e.name) === tdx.basename(q.entry.name))
      parsed = tdx.parseGpcw(data, reportDate)
    } catch (e) {
      errors.push({ quarter: q.compact, error: e.message })
      continue
    }
    if (!parsed.length) {
      errors.push({ quarter: q.compact, error: '无有效记录（可能为部分文件）' })
      continue
    }
    db.transaction(() => {
      const stmt = db.prepare(FINANCIAL_SQL)
      for (const r of parsed) {
        stmt.run(
          r.code, r.report_date, r.revenue, r.net_profit, r.net_profit_excl_nonrec,
          r.total_assets, r.net_assets, r.debt_ratio, r.operating_cashflow,
          r.gross_margin, r.roe, r.roa
        )
      }
    })
    files++
    rows += parsed.length
    onProgress({ phase: `导入财报 ${q.compact}（${parsed.length} 只）`, percent: Math.min(95, 10 + Math.round((files / quarters.length) * 85)) })
  }
  onProgress({ phase: '完成', percent: 100 })
  return { files, rows, errors }
}

/** 清理过期的每日包缓存（默认保留 30 天；每日包约 1.9MB，不清理会持续膨胀） */
function pruneDailyCache(cacheDir = getCacheDir(), keepDays = 30) {
  const dir = path.join(cacheDir, 'daily')
  if (!fs.existsSync(dir)) return 0
  const cutoff = Date.now() - keepDays * 86400000
  let removed = 0
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    try {
      if (fs.statSync(p).mtimeMs < cutoff) { fs.unlinkSync(p); removed++ }
    } catch (_) { /* 单个文件删除失败不影响整体 */ }
  }
  return removed
}

module.exports = {
  RAW_DB,
  MAIN_DB,
  INDEX_SYMBOLS,
  INDEX_MIN_DATE,
  getCacheDir,
  recentWeekdays,
  isoToday,
  syncDaily,
  importFull,
  importIndex,
  importFinancial,
  countRawDate,
  pruneDailyCache,
  rowsOf
}
