'use strict'

/**
 * 权息事件仓库（DolphinDB dfs://tradeinsight_raw / stock_dividend）。
 *
 * 数据来源：tqcenter get_divid_factors（逐股全历史除权除息事件：每10股派息/送股/转增/配股）。
 * 存储位置与 daily_k_raw 同库（1990 起 RANGE 分区，事件最早 2002 年落在分区桶内）。
 *
 * 写路径约束：raw 库不走 client.insertRows（其固定写 dfs://tradeinsight），
 * 必须走 upload(DdbTable) + tableInsert(loadTable(...)) 模式（同 tdx-import/package-import）。
 * 幂等：按 symbol 预删整只旧数据再插入，可重跑。
 */

const ddb = require('./client')
const { safeSymbol, safeDate } = require('./params')

const RAW_DB = 'dfs://tradeinsight_raw'
const TBL = `loadTable("${RAW_DB}", "stock_dividend")`

// 列定义（须与 ensureSchema 建表列序一致）
// 语义（经 tqs Bonus/AllotPrice/ShareBonus/Allotment 交叉验证）：
//   cash_per_10=每10股派息(税前元)、share_transfer_per_10=每10股送转(送+转合并,源不拆分)、
//   allotment_per_10=每10股配股比、allot_price=配股价(元)
const DIVIDEND_COLS = [
  { name: 'symbol', type: 'symbol' }, { name: 'ex_date', type: 'date' },
  { name: 'event_type', type: 'int' },
  { name: 'cash_per_10', type: 'double' }, { name: 'share_transfer_per_10', type: 'double' },
  { name: 'allotment_per_10', type: 'double' }, { name: 'allot_price', type: 'double' },
  { name: 'create_time', type: 'timestamp' }
]

/** ISO 日期 → DolphinDB 日期字面量（2026-06-26 → 2026.06.26） */
function ddbDate(iso) {
  return String(iso).replace(/-/g, '.')
}

/** 数值安全转 Number；非法 → null（null 会被 DdbVector 按 NULL 写入） */
function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** 确保 stock_dividend 表存在（幂等，existsTable 短路；与 client.ensureSchema 建表脚本一致）。
 *  进程内只探测一次：批量导入高频调用时避免逐只往返。 */
let tableEnsured = false
async function ensureTable() {
  if (tableEnsured) return
  if (!ddb.isConnected()) await ddb.connect()
  await ddb.execute(
    `if (!existsTable("${RAW_DB}", "stock_dividend")) {\n` +
    `  t = table(1:0, \`symbol\`ex_date\`event_type\`cash_per_10\`share_transfer_per_10\`allotment_per_10\`allot_price\`create_time, ` +
    `[SYMBOL, DATE, INT, DOUBLE, DOUBLE, DOUBLE, DOUBLE, TIMESTAMP]);\n` +
    `  db = database("${RAW_DB}"); db.createPartitionedTable(t, \`stock_dividend, \`ex_date)\n` +
    `}`
  )
  tableEnsured = true
}

/** 行净化：safeSymbol/safeDate 白名单校验 + 数值收敛（供单条与批量共用） */
function cleanRows(rows) {
  return rows.map(r => ({
    symbol: safeSymbol(r['股票代码']) || r['股票代码'],
    ex_date: r['除权除息日'],
    event_type: num(r['事件类型']),
    cash_per_10: num(r['每10股派息']),
    share_transfer_per_10: num(r['每10股送转']),
    allotment_per_10: num(r['每10股配股']),
    allot_price: num(r['配股价']),
    create_time: new Date()
  })).filter(r => safeSymbol(r.symbol) && safeDate(r.ex_date))
}

/** 列向量构造（raw 库专用 upload+tableInsert 写路径） */
function buildVecs(mod, cleaned) {
  return DIVIDEND_COLS.map(c => {
    const vals = cleaned.map(r => r[c.name])
    switch (c.type) {
      case 'symbol': return new mod.DdbVectorSymbol(vals.map(v => (v == null ? '' : String(v))))
      case 'date': return new mod.DdbVectorDate(vals.map(v => (v == null ? null : v)))
      case 'int': return new mod.DdbVectorInt(vals)
      case 'double': return new mod.DdbVectorDouble(vals)
      case 'timestamp': return new mod.DdbVectorTimeStamp(vals)
      default: throw new Error('未知列类型: ' + c.type)
    }
  })
}

/** 归一化 DolphinDB 返回行：日期 2026.06.26 → 2026-06-26，缺列补 null */
function normRows(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map(r => ({
    symbol: r.symbol != null ? r.symbol : null,
    ex_date: r.ex_date != null ? String(r.ex_date).replace(/\./g, '-') : null,
    event_type: r.event_type != null ? Number(r.event_type) : null,
    cash_per_10: r.cash_per_10 != null ? Number(r.cash_per_10) : null,
    share_transfer_per_10: r.share_transfer_per_10 != null ? Number(r.share_transfer_per_10) : null,
    allotment_per_10: r.allotment_per_10 != null ? Number(r.allotment_per_10) : null,
    allot_price: r.allot_price != null ? Number(r.allot_price) : null,
    create_time: r.create_time != null ? r.create_time : null
  }))
}

/**
 * 写入单只股票的权息事件（幂等：预删该 symbol 全部旧数据 + 批量插入）。
 * @param rows 中文键行数组（与 tdx_quant.getDividFactors 输出同构）
 * @returns 写入行数；DDB 未连接或空输入返回 0
 */
async function insertDividends(rows) {
  if (!rows || rows.length === 0) return 0
  await ensureTable()

  const cleaned = cleanRows(rows)
  if (!cleaned.length) return 0
  const symbol = safeSymbol(cleaned[0].symbol)
  if (!symbol) return 0
  await ddb.execute(`t = ${TBL}; delete from t where symbol='${symbol}'`)

  const mod = await import('dolphindb')
  const tbl = new mod.DdbTable(buildVecs(mod, cleaned))
  await ddb.getClient().upload(['divData'], [tbl])
  await ddb.execute(`tableInsert{${TBL}}(divData)`)
  return cleaned.length
}

/**
 * 批量写入多只股票的权息事件（幂等：每只预删，单脚本批量删 + 单次上传插入）。
 * 比逐只调用省 ~2×N 次 DolphinDB 往返，用于全量导入。
 * @param stockRows [{ symbol, rows: 中文键行数组 }]
 * @param opts.skipDelete true 时跳过预删（仅用于续跑：只插新 symbol，无旧数据可删）
 * @returns 写入行数
 */
async function insertDividendsBatch(stockRows, opts = {}) {
  const stocks = (Array.isArray(stockRows) ? stockRows : []).filter(s => s && Array.isArray(s.rows) && s.rows.length)
  if (!stocks.length) return 0
  await ensureTable()

  const all = []
  const dels = []
  for (const s of stocks) {
    const cleaned = cleanRows(s.rows)
    if (!cleaned.length) continue
    const symbol = safeSymbol(cleaned[0].symbol)
    if (!symbol) continue
    if (!opts.skipDelete) dels.push(`t = ${TBL}; delete from t where symbol='${symbol}'`)
    all.push(...cleaned)
  }
  if (!all.length) return 0

  // 单脚本批量删（多语句一次往返；skipDelete 时省略），再单次上传插入
  if (dels.length) await ddb.execute(dels.join('\n'))

  const mod = await import('dolphindb')
  const tbl = new mod.DdbTable(buildVecs(mod, all))
  await ddb.getClient().upload(['divData'], [tbl])
  await ddb.execute(`tableInsert{${TBL}}(divData)`)
  return all.length
}

/** 已入库的全部 symbol（供续跑跳过） */
async function getAllSymbols() {
  if (!ddb.isConnected()) return []
  const r = await ddb.execute(
    `select distinct symbol as symbol from ${TBL}`
  )
  if (!Array.isArray(r)) return []
  return r.map(x => String(x.symbol)).filter(Boolean)
}

/**
 * 查询单只股票的权息事件序列（按除权除息日升序）。
 * @returns 英文键行数组（symbol/ex_date/event_type/cash_per_10/...）
 */
async function getDividends(symbol, { startDate, endDate } = {}) {
  if (!ddb.isConnected()) return []
  const sym = safeSymbol(symbol)
  if (!sym) return []
  let cond = `symbol='${sym}'`
  const sd = safeDate(startDate), ed = safeDate(endDate)
  if (sd) cond += ` and ex_date >= ${ddbDate(sd)}`
  if (ed) cond += ` and ex_date <= ${ddbDate(ed)}`
  const r = await ddb.execute(
    `select symbol, ex_date, event_type, cash_per_10, share_transfer_per_10, allotment_per_10, allot_price, create_time` +
    ` from ${TBL} where ${cond} order by ex_date`
  )
  return normRows(r)
}

/** 单只股票最新除权除息日（YYYY-MM-DD 或 null） */
async function getLatestExDate(symbol) {
  if (!ddb.isConnected()) return null
  const sym = safeSymbol(symbol)
  if (!sym) return null
  const r = await ddb.execute(`select max(ex_date) as latest from ${TBL} where symbol='${sym}'`)
  if (!Array.isArray(r) || !r.length || r[0].latest == null) return null
  return String(r[0].latest).replace(/\./g, '-')
}

/** 全表行数（数据总览用） */
async function countAll() {
  if (!ddb.isConnected()) return 0
  return await ddb.count(`select count(*) as c from ${TBL}`)
}

module.exports = {
  ensureTable,
  insertDividends,
  insertDividendsBatch,
  getAllSymbols,
  getDividends,
  getLatestExDate,
  countAll,
  DIVIDEND_COLS
}
