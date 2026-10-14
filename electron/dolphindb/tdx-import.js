'use strict'

/**
 * 通达信 .day 数据包导入库（可复用）
 *
 * 职责：把本机通达信 vipdoc 日K数据包作为**不可变基线**一次性导入
 * DolphinDB daily_k_raw（dfs://tradeinsight_raw），并支持幂等重跑与缺口校验。
 *
 * 边界约定（与项目架构一致）：
 *   - daily_k_raw 是本地通达信基线，只存 [startDate, endDate] 区间的**不复权**数据；
 *   - 区间之后的新交易日走 aktools 网络接口（stock.js 增量拉取写入 daily_k 前复权表）；
 *   - 本库不触碰 daily_k（前复权查询层）。
 *
 * 用法（CLI）：node electron/dolphindb/import-tdx.js [--mode full|incremental|verify|refresh]
 *   全量基线导入      --mode full --start=19980101 --end=20261008
 *   增量导入(只补缺)  --mode incremental --start=19980101 --end=20261008
 *   校验缺口          --mode verify --start=19980101 --end=20261008
 *   强制重刷区间      --mode refresh --start=19980101 --end=20261008
 */

const fs = require('fs')
const path = require('path')

const TDX_BASE = process.env.TDX_PATH || 'C:\\new_tdx64\\vipdoc'
const RAW_DB = 'dfs://tradeinsight_raw'
const RECORD_SIZE = 32

const DEFAULT_START = '19980101'
const DEFAULT_END = '20261008' // 本次一次性导入的本地基线截止；之后走 aktools

const MARKETS = [
  { dir: 'sh', prefix: 'sh' },
  { dir: 'sz', prefix: 'sz' },
  { dir: 'bj', prefix: 'bj' }
]

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

/** 'YYYYMMDD' / 'YYYY-MM-DD' → 紧凑数字串 */
function compact(v) {
  return String(v || '').replace(/\D/g, '')
}

/** 解析单个 .day 文件 → 行数组（限定日期区间） */
function parseDayFile(filePath, symbol, startDate, endDate) {
  const buf = fs.readFileSync(filePath)
  const count = Math.floor(buf.length / RECORD_SIZE)
  const sd = compact(startDate)
  const ed = compact(endDate)
  const rows = []
  for (let i = 0; i < count; i++) {
    const off = i * RECORD_SIZE
    const date = buf.readInt32LE(off)
    if (sd && date < Number(sd)) continue
    if (ed && date > Number(ed)) continue
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

/** 判定某市场+代码是否为非个股（daily_k_raw 只存个股，指数/基金走独立表）。
 *  - sh 市场的 000xxx：上证指数系列（000001 上证指数 / 000300 沪深300 / 000016 上证50 等）
 *  - sz 市场的 399xxx：深证指数系列（399001 深证成指 / 399006 创业板指 等）
 *  - sh 市场的 88xxxx：东财可转债/基金/板块指数（880001 东财可转债等权指数 等，非个股）
 *  注意：sz 市场的 000xxx 是深市个股（000001 平安银行），必须保留。
 *  历史 bug：collectFiles 只剥前缀不判市场，sh000001(上证指数) 与 sz000001(平安银行)
 *  撞进同一 symbol=000001，导入 daily_k_raw 后同日期出现"指数点位+股价"两条，K 线混叠。
 *  88xxxx 同理：通达信把可转债/基金指数放 sh 目录，误当个股导入。 */
function isIndexFile(market, symbol) {
  if (market === 'sh' && /^00\d{4}$/.test(symbol)) return true
  if (market === 'sh' && /^88\d{4}$/.test(symbol)) return true
  if (market === 'sz' && /^399\d{3}$/.test(symbol)) return true
  return false
}

/** 收集本地全部 .day 文件（含每文件首/末日期、记录数，供校验用）。跳过指数文件。 */
function collectFiles() {
  const out = []
  for (const m of MARKETS) {
    const dir = path.join(TDX_BASE, m.dir, 'lday')
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.day')) continue
      const symbol = f.replace(/\.day$/, '').replace(/^(sh|sz|bj)/, '')
      if (symbol.length < 5 || !/^\d+$/.test(symbol)) continue
      if (isIndexFile(m.prefix, symbol)) continue // 指数不进 daily_k_raw
      const p = path.join(dir, f)
      const buf = fs.readFileSync(p)
      const n = Math.floor(buf.length / RECORD_SIZE)
      out.push({
        symbol,
        market: m.prefix,
        filePath: p,
        records: n,
        firstDate: n ? buf.readInt32LE(0) : 0,
        lastDate: n ? buf.readInt32LE((n - 1) * RECORD_SIZE) : 0
      })
    }
  }
  return out
}

/** 批量写入 daily_k_raw（幂等：先预删该批 symbol 的日期区间，再插入） */
async function insertRows(rows) {
  if (!rows || !rows.length) return 0
  const ddb = require('./client')
  if (!ddb.isConnected()) await ddb.connect()

  // 预删除：按 symbol 分组，删除这些 symbol 在本次区间内的旧数据，保证可重跑
  const bySym = new Map()
  for (const r of rows) {
    if (!bySym.has(r.symbol)) bySym.set(r.symbol, [])
    bySym.get(r.symbol).push(r)
  }
  for (const [symbol, symRows] of bySym) {
    const dates = symRows.map(r => r.trade_date).sort()
    const sd = dates[0].replace(/-/g, '.')
    const ed = dates[dates.length - 1].replace(/-/g, '.')
    await ddb.execute(`t = loadTable("${RAW_DB}", "daily_k_raw"); delete from t where symbol='${symbol}' and trade_date between ${sd} and ${ed}`)
  }

  const ddbMod = await import('dolphindb')
  const colVecs = RAW_COLS.map(c => {
    const vals = rows.map(r => r[c.name])
    switch (c.type) {
      case 'symbol': return new ddbMod.DdbVectorSymbol(vals.map(v => (v == null ? '' : String(v))))
      case 'date': return new ddbMod.DdbVectorDate(vals)
      case 'double': return new ddbMod.DdbVectorDouble(vals)
      case 'long': return new ddbMod.DdbVectorLong(vals)
      default: throw new Error('未知列类型: ' + c.type)
    }
  })
  const tbl = new ddbMod.DdbTable(colVecs)
  await ddb.getClient().upload(['rawData'], [tbl])
  await ddb.execute(`tableInsert{loadTable("${RAW_DB}", "daily_k_raw")}(rawData)`)
  return rows.length
}

/** 统计 daily_k_raw 各 symbol 行数（限定日期区间） */
async function ddbCountBySymbol(startDate, endDate) {
  const ddb = require('./client')
  if (!ddb.isConnected()) await ddb.connect()
  const sd = compact(startDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')
  const ed = compact(endDate).replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')
  const r = await ddb.execute(
    `select symbol, count(*) as cnt from loadTable("${RAW_DB}", "daily_k_raw")` +
    ` where trade_date between ${sd} and ${ed} group by symbol`
  )
  const map = new Map()
  for (const row of Array.isArray(r) ? r : []) {
    map.set(String(row.symbol), Number(row.cnt))
  }
  return map
}

/** 校验本地数据包 vs daily_k_raw 缺口（只读） */
async function verify({ startDate = DEFAULT_START, endDate = DEFAULT_END } = {}) {
  const local = collectFiles()
  const localCnt = new Map() // symbol -> 区间内应有条数
  for (const f of local) {
    const rows = parseDayFile(f.filePath, f.symbol, startDate, endDate)
    localCnt.set(f.symbol, (localCnt.get(f.symbol) || 0) + rows.length)
  }

  const ddb = require('./client')
  if (!ddb.isConnected()) await ddb.connect()
  const dbCnt = await ddbCountBySymbol(startDate, endDate)

  const missingSym = [...localCnt.keys()].filter(s => !dbCnt.has(s)) // 本地有、库无
  const onlyDb = [...dbCnt.keys()].filter(s => !localCnt.has(s)) // 库有、本地无
  const countMismatch = []
  for (const s of localCnt.keys()) {
    if (dbCnt.has(s) && dbCnt.get(s) !== localCnt.get(s)) {
      countMismatch.push({ symbol: s, local: localCnt.get(s), db: dbCnt.get(s) })
    }
  }

  const localTotal = [...localCnt.values()].reduce((a, b) => a + b, 0)
  const dbTotal = [...dbCnt.values()].reduce((a, b) => a + b, 0)

  return {
    range: { start: compact(startDate), end: compact(endDate) },
    localFiles: local.length,
    localSymbols: localCnt.size,
    dbSymbols: dbCnt.size,
    localRows: localTotal,
    dbRows: dbTotal,
    missingSymbols: missingSym,
    onlyInDb: onlyDb,
    countMismatch
  }
}

/**
 * 执行导入。
 * @param {Object} opts
 *  - mode: 'full' 全量（本地有而库缺的 symbol 都导入；已存在且条数一致的跳过）
 *  - incremental 增量（仅本地有而库缺的 symbol 导入）
 *  - refresh 强制重刷区间（所有本地 symbol 的 [start,end] 先删后插）
 */
async function importLocal({ mode = 'incremental', startDate = DEFAULT_START, endDate = DEFAULT_END, onProgress } = {}) {
  const ddb = require('./client')
  if (!ddb.isConnected()) await ddb.connect()

  const local = collectFiles()
  // 全量/增量：只处理库内缺失的 symbol；refresh：全部重刷
  let targets = local
  if (mode !== 'refresh') {
    const dbCnt = await ddbCountBySymbol(startDate, endDate)
    targets = local.filter(f => !dbCnt.has(f.symbol))
  }

  const totalFiles = targets.length
  const totalRows = targets.reduce((s, f) => s + parseDayFile(f.filePath, f.symbol, startDate, endDate).length, 0)

  let doneFiles = 0
  let doneRows = 0
  const start = Date.now()
  const BATCH_FILES = 50

  for (let b = 0; b * BATCH_FILES < totalFiles; b++) {
    const batchFiles = targets.slice(b * BATCH_FILES, (b + 1) * BATCH_FILES)
    const batchRows = []
    for (const f of batchFiles) {
      try {
        const rows = parseDayFile(f.filePath, f.symbol, startDate, endDate)
        batchRows.push(...rows)
      } catch (e) {
        console.error(`  [跳过] ${f.symbol}: ${e.message.slice(0, 60)}`)
      }
    }
    if (batchRows.length) {
      await insertRows(batchRows)
      doneRows += batchRows.length
    }
    doneFiles += batchFiles.length
    const pct = ((doneFiles / totalFiles) * 100).toFixed(1)
    const el = ((Date.now() - start) / 1000).toFixed(1)
    if (onProgress) onProgress({ pct, doneFiles, totalFiles, doneRows, elapsed: el })
  }

  return { mode, files: totalFiles, rows: totalRows, doneFiles, doneRows, elapsedSec: ((Date.now() - start) / 1000).toFixed(1) }
}

module.exports = { collectFiles, parseDayFile, insertRows, verify, importLocal, compact, DEFAULT_START, DEFAULT_END }
