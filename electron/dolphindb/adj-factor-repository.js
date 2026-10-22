'use strict'

/**
 * 复权因子仓库（DolphinDB dfs://tradeinsight_raw / stock_adj_factor）。
 *
 * factor = 后复权累计因子（自首个可算交易日累乘除权系数），只在**除权事件日**落一行：
 * 事件间无事件日为常数（ratio=1），故无需逐日存（避免 ~30M 行爆炸）。
 * 前复权价(t) = raw(t) × factor(t) / factor(最新事件)；
 * 后复权价(t) = raw(t) × factor(t)。
 * 推导输入：daily_k_raw（不复权收盘作前收）+ stock_dividend（权息事件，含配股价）。
 *
 * 写路径约束同 dividend-repository：raw 库不走 client.insertRows，必须 upload+tableInsert。
 */

const ddb = require('./client')
const { safeSymbol, safeDate } = require('./params')

const RAW_DB = 'dfs://tradeinsight_raw'
const TBL = `loadTable("${RAW_DB}", "stock_adj_factor")`

// 列定义（须与 ensureSchema 建表列序一致）
const FACTOR_COLS = [
  { name: 'symbol', type: 'symbol' },
  { name: 'trade_date', type: 'date' },
  { name: 'factor', type: 'double' },
  { name: 'create_time', type: 'timestamp' }
]

/** 进程内只探测一次建表（批量生成时避免逐只往返） */
let tableEnsured = false
async function ensureTable() {
  if (tableEnsured) return
  if (!ddb.isConnected()) await ddb.connect()
  await ddb.execute(
    `if (!existsTable("${RAW_DB}", "stock_adj_factor")) {\n` +
    `  t = table(1:0, \`symbol\`trade_date\`factor\`create_time, ` +
    `[SYMBOL, DATE, DOUBLE, TIMESTAMP]);\n` +
    `  db = database("${RAW_DB}"); db.createPartitionedTable(t, \`stock_adj_factor, \`trade_date)\n` +
    `}`
  )
  tableEnsured = true
}

/**
 * 写入单只股票的因子序列（幂等：预删该 symbol 全部旧因子 + 批量插入）。
 * @param rows [{ symbol, trade_date, factor }] 仅事件日
 * @returns 写入行数
 */
async function insertFactors(rows) {
  if (!rows || rows.length === 0) return 0
  await ensureTable()
  const cleaned = rows.map(r => ({
    symbol: safeSymbol(r.symbol) || r.symbol,
    trade_date: r.trade_date,
    factor: Number(r.factor)
  })).filter(r => safeSymbol(r.symbol) && safeDate(r.trade_date) && Number.isFinite(r.factor) && r.factor > 0)
  if (!cleaned.length) return 0

  const symbol = safeSymbol(cleaned[0].symbol)
  if (!symbol) return 0
  await ddb.execute(`t = ${TBL}; delete from t where symbol='${symbol}'`)

  const mod = await import('dolphindb')
  const colVecs = FACTOR_COLS.map(c => {
    const vals = cleaned.map(r => r[c.name])
    switch (c.type) {
      case 'symbol': return new mod.DdbVectorSymbol(vals.map(v => (v == null ? '' : String(v))))
      case 'date': return new mod.DdbVectorDate(vals)
      case 'double': return new mod.DdbVectorDouble(vals)
      case 'timestamp': return new mod.DdbVectorTimeStamp(vals)
      default: throw new Error('未知列类型: ' + c.type)
    }
  })
  const tbl = new mod.DdbTable(colVecs)
  await ddb.getClient().upload(['facData'], [tbl])
  await ddb.execute(`tableInsert{${TBL}}(facData)`)
  return cleaned.length
}

/**
 * 读取单只股票因子序列（按交易日升序）。
 * @returns [{ symbol, trade_date: 'YYYY-MM-DD', factor }]
 */
async function getFactors(symbol) {
  if (!ddb.isConnected()) return []
  const sym = safeSymbol(symbol)
  if (!sym) return []
  const r = await ddb.execute(
    `select symbol, trade_date, factor from ${TBL} where symbol='${sym}' order by trade_date`
  )
  if (!Array.isArray(r)) return []
  return r.map(x => ({
    symbol: x.symbol,
    trade_date: x.trade_date != null ? String(x.trade_date).replace(/\./g, '-') : null,
    factor: x.factor != null ? Number(x.factor) : null
  })).filter(x => x.trade_date && x.factor != null)
}

/** 全表行数（数据总览用） */
async function countAll() {
  if (!ddb.isConnected()) return 0
  return await ddb.count(`select count(*) as c from ${TBL}`)
}

/**
 * 批量写入多只股票的因子序列（幂等：每只预删，单脚本批量删 + 单次上传插入）。
 * @param stockRows [{ symbol, rows: [{ trade_date, factor }] }]
 * @returns 写入行数
 */
async function insertFactorsBatch(stockRows) {
  const stocks = (Array.isArray(stockRows) ? stockRows : []).filter(s => s && Array.isArray(s.rows) && s.rows.length)
  if (!stocks.length) return 0
  await ensureTable()

  const all = []
  const dels = []
  for (const s of stocks) {
    const cleaned = s.rows.map(r => ({
      symbol: safeSymbol(r.symbol) || r.symbol,
      trade_date: r.trade_date,
      factor: Number(r.factor)
    })).filter(r => safeSymbol(r.symbol) && safeDate(r.trade_date) && Number.isFinite(r.factor) && r.factor > 0)
    if (!cleaned.length) continue
    const symbol = safeSymbol(cleaned[0].symbol)
    if (!symbol) continue
    dels.push(`t = ${TBL}; delete from t where symbol='${symbol}'`)
    all.push(...cleaned)
  }
  if (!all.length) return 0

  if (dels.length) await ddb.execute(dels.join('\n'))

  const mod = await import('dolphindb')
  const colVecs = FACTOR_COLS.map(c => {
    const vals = all.map(r => r[c.name])
    switch (c.type) {
      case 'symbol': return new mod.DdbVectorSymbol(vals.map(v => (v == null ? '' : String(v))))
      case 'date': return new mod.DdbVectorDate(vals)
      case 'double': return new mod.DdbVectorDouble(vals)
      case 'timestamp': return new mod.DdbVectorTimeStamp(vals)
      default: throw new Error('未知列类型: ' + c.type)
    }
  })
  const tbl = new mod.DdbTable(colVecs)
  await ddb.getClient().upload(['facData'], [tbl])
  await ddb.execute(`tableInsert{${TBL}}(facData)`)
  return all.length
}

/** 已生成因子的 symbol 列表（供续跑跳过） */
async function getAllSymbols() {
  if (!ddb.isConnected()) return []
  const r = await ddb.execute(`select distinct symbol as symbol from ${TBL}`)
  if (!Array.isArray(r)) return []
  return r.map(x => String(x.symbol)).filter(Boolean)
}

module.exports = {
  ensureTable,
  insertFactors,
  insertFactorsBatch,
  getFactors,
  getAllSymbols,
  countAll,
  FACTOR_COLS
}
