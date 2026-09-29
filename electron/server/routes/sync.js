'use strict'

/**
 * 数据同步路由 —— 行情数据写入已从 sql.js 迁移至 DolphinDB。
 *
 * 分工（混合架构）：
 *   - 行情数据（stock_limit_pool / plate_market_quotation / stock_zh_index_daily）→ DolphinDB
 *     批量写入采用 upload(DdbTable) + tableInsert(loadTable, var) 模式。
 *   - 同步状态元数据（data_sync_status）→ sql.js（关系型，保留原 UPSERT 语义）
 *
 * 取数链路不变：AKTools(HTTP) → converter → 行对象 → 入库。
 */

const express = require('express')
const { getDb } = require('../db')
const aktools = require('../aktools')
const converter = require('../converter')
const ddb = require('../../dolphindb/client')
const cache = require('../cache')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const DB = 'dfs://tradeinsight'

const DATA_TYPES = [
  { code: 'LIMIT_UP', desc: '涨停板数据', endpoint: 'getStockLimitPool', converter: 'convertStockLimitPool', table: 'stock_limit_pool' },
  { code: 'LIMIT_DOWN', desc: '跌停板数据', endpoint: 'getStockDropPool', converter: 'convertStockLimitPool', table: 'stock_limit_pool' },
  { code: 'PLATE_MARKET', desc: '板块行情数据', endpoint: 'getStockIndustry', converter: 'convertPlateMarket', table: 'plate_market_quotation' },
  { code: 'INDEX_DAILY', desc: '指数日K数据', endpoint: null, converter: 'convertIndexDaily', table: 'stock_zh_index_daily' }
]

// 列定义（顺序必须与 ensureSchema 中 DFS 表列序一致，tableInsert 按位置匹配）
const COLS = {
  stock_limit_pool: [
    { name: 'data_type', type: 'symbol' }, { name: 'trade_date', type: 'date' },
    { name: 'stock_code', type: 'symbol' }, { name: 'stock_name', type: 'symbol' },
    { name: 'industry', type: 'string' }, { name: 'increase_rate', type: 'double' },
    { name: 'latest_price', type: 'double' }, { name: 'turnover', type: 'long' },
    { name: 'circulation_market_value', type: 'double' }, { name: 'total_market_value', type: 'double' },
    { name: 'turnover_rate', type: 'double' }, { name: 'limit_funds', type: 'long' },
    { name: 'first_limit_time', type: 'string' }, { name: 'limit_stats', type: 'string' },
    { name: 'dynamic_pe', type: 'double' }, { name: 'limit_turnover', type: 'long' },
    { name: 'continuous_limit', type: 'int' }, { name: 'last_limit_time', type: 'string' },
    { name: 'blast_times', type: 'int' }, { name: 'create_time', type: 'timestamp' }
  ],
  plate_market_quotation: [
    { name: 'trade_date', type: 'date' }, { name: 'plate', type: 'symbol' },
    { name: 'increase_rate', type: 'double' }, { name: 'total_volume', type: 'double' },
    { name: 'total_turnover', type: 'double' }, { name: 'net_inflow', type: 'double' },
    { name: 'up_count', type: 'int' }, { name: 'down_count', type: 'int' },
    { name: 'average_price', type: 'double' }, { name: 'leading_stock', type: 'string' },
    { name: 'leading_stock_price', type: 'double' }, { name: 'leading_stock_increase', type: 'double' },
    { name: 'create_time', type: 'timestamp' }
  ],
  stock_zh_index_daily: [
    { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
    { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
    { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
    { name: 'volume', type: 'double' }, { name: 'amount', type: 'double' },
    { name: 'amplitude', type: 'double' }, { name: 'change', type: 'double' },
    { name: 'price_change', type: 'double' }, { name: 'turnover_rate', type: 'double' },
    { name: 'create_time', type: 'timestamp' }, { name: 'update_time', type: 'timestamp' }
  ]
}

// 'YYYY-MM-DD' -> 'YYYY.MM.DD' (DolphinDB DATE 字面量)
function dd(s) { return String(s || '').replace(/-/g, '.') }
// 兼容 'YYYYMMDD' / 'YYYY-MM-DD' -> 'YYYY-MM-DD'
function normDate(v) {
  if (!v) return null
  const s = String(v).replace(/\D/g, '')
  if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  return String(v)
}
function fmtDate(d) {
  const s = normDate(d) || ''
  return s.replace(/-/g, '')
}

// 按 dataType+tradeDate 删除 DFS 表数据
async function deleteDdb(table, tradeDate, dataType) {
  const where = dataType
    ? `trade_date=${dd(tradeDate)} and data_type='${dataType}'`
    : `trade_date=${dd(tradeDate)}`
  await ddb.execute(`t = loadTable("${DB}", "${table}"); delete from t where ${where}`)
  // 清除当日 statistics 内存缓存，避免读取过期数据
  cache.delByPattern(`stats:*${tradeDate}*`)
}

async function syncOne(tradeDate, dataType) {
  const dt = DATA_TYPES.find(d => d.code === dataType)
  if (!dt) return { success: false, message: '未知数据类型' }

  const dateStr = normDate(tradeDate)
  const dateCompact = fmtDate(dateStr)

  // 检查是否已存在（仅涨跌停池做幂等检查）
  if (dataType === 'LIMIT_UP' || dataType === 'LIMIT_DOWN') {
    const c = await ddb.count(`select count(*) as c from loadTable("${DB}", "stock_limit_pool") where trade_date=${dd(dateStr)} and data_type='${dataType}'`)
    if (c > 0) return { success: true, message: `当日数据已存在 ${c} 条，跳过同步`, successCount: c, failCount: 0 }
  }

  try {
    let rawData, rows
    if (dataType === 'LIMIT_UP') {
      rawData = await aktools.getStockLimitPool(dateCompact)
      rows = converter.convertStockLimitPool(rawData, dateStr, 'LIMIT_UP')
    } else if (dataType === 'LIMIT_DOWN') {
      rawData = await aktools.getStockDropPool(dateCompact)
      rows = converter.convertStockLimitPool(rawData, dateStr, 'LIMIT_DOWN')
    } else if (dataType === 'PLATE_MARKET') {
      rawData = await aktools.getStockIndustry()
      rows = converter.convertPlateMarket(rawData, dateStr)
    } else if (dataType === 'INDEX_DAILY') {
      const indices = ['000001', '399001', '399006']
      let allRows = []
      for (const sym of indices) {
        const d = await aktools.getIndexDailyData({ symbol: sym, start_date: dateCompact, end_date: dateCompact })
        allRows = allRows.concat(converter.convertIndexDaily(d, sym))
      }
      rows = allRows
    }

    if (!rows || rows.length === 0) return { success: false, message: '未获取到数据', successCount: 0, failCount: 0 }

    // 补齐 create_time（指数还需 update_time），并规整 trade_date
    const now = new Date()
    rows.forEach(r => {
      r.trade_date = normDate(r.trade_date)
      r.create_time = now
      if (dataType === 'INDEX_DAILY') r.update_time = now
    })

    // 批量写入 DolphinDB
    await ddb.insertRows(dt.table, COLS[dt.table], rows)
    // 清除当日 statistics 内存缓存，使新数据立即可见
    cache.delByPattern(`stats:*${dateStr}*`)

    return { success: true, message: `同步完成，成功${rows.length}条`, successCount: rows.length, failCount: 0 }
  } catch (e) {
    return { success: false, message: '同步失败: ' + e.message, successCount: 0, failCount: 1 }
  }
}

function saveSyncStatus(db, dataType, tradeDate, result) {
  const status = result.success ? (result.message.includes('跳过') ? 3 : 1) : 2
  db.prepare(`INSERT INTO data_sync_status (data_type, trade_date, status, success_count, fail_count, message, sync_time)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'))
    ON CONFLICT(data_type, trade_date) DO UPDATE SET status=excluded.status, success_count=excluded.success_count,
    fail_count=excluded.fail_count, message=excluded.message, sync_time=excluded.sync_time`)
    .run(dataType, normDate(tradeDate), status, result.successCount || 0, result.failCount || 0, result.message)
}

// ---- 查询接口（data_sync_status，sql.js）----
router.get('/list', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM data_sync_status ORDER BY sync_time DESC, trade_date DESC`).all()
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

router.get('/by-date', (req, res) => {
  try {
    const { tradeDate } = req.query
    const rows = getDb().prepare(`SELECT * FROM data_sync_status WHERE trade_date=? ORDER BY data_type`).all(normDate(tradeDate))
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

router.get('/recent', (req, res) => {
  try {
    const days = Math.min(Math.max(req.query.days || 7, 1), 30)
    const rows = getDb().prepare(`SELECT * FROM data_sync_status
      WHERE trade_date >= date('now','localtime','-'||?||' days') ORDER BY sync_time DESC`).all(days)
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

router.get('/by-type', (req, res) => {
  try {
    const { dataType, days = 7 } = req.query
    const rows = getDb().prepare(`SELECT * FROM data_sync_status WHERE data_type=? AND trade_date >= date('now','localtime','-'||?||' days') ORDER BY sync_time DESC`).all(dataType, Math.min(days, 30))
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

router.get('/statistics', (req, res) => {
  try {
    const days = Math.min(Math.max(req.query.days || 7, 1), 30)
    const rows = getDb().prepare(`SELECT data_type,
      COUNT(*) AS totalRecords, SUM(CASE WHEN status=1 THEN 1 ELSE 0 END) AS successCount,
      SUM(CASE WHEN status=2 THEN 1 ELSE 0 END) AS failCount, SUM(CASE WHEN status=3 THEN 1 ELSE 0 END) AS skipCount,
      SUM(success_count) AS totalSuccessData, SUM(fail_count) AS totalFailData
    FROM data_sync_status WHERE trade_date >= date('now','localtime','-'||?||' days') GROUP BY data_type`).all(days)
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

router.get('/data-types', (req, res) => {
  ok(res, DATA_TYPES.map(d => ({ code: d.code, desc: d.desc })))
})

// ---- 手动操作 ----
router.delete('/manual/delete', async (req, res) => {
  try {
    const { tradeDate, dataType } = req.query
    const dateStr = normDate(tradeDate)
    let table = null
    if (dataType === 'LIMIT_UP' || dataType === 'LIMIT_DOWN') table = 'stock_limit_pool'
    else if (dataType === 'PLATE_MARKET') table = 'plate_market_quotation'
    else if (dataType === 'INDEX_DAILY') table = 'stock_zh_index_daily'
    if (!table) return errMsg(res, '未知数据类型')
    // 删除前计数
    const where = dataType ? `trade_date=${dd(dateStr)} and data_type='${dataType}'` : `trade_date=${dd(dateStr)}`
    const c = await ddb.count(`select count(*) as c from loadTable("${DB}", "${table}") where ${where}`)
    await deleteDdb(table, dateStr, dataType === 'LIMIT_UP' || dataType === 'LIMIT_DOWN' ? dataType : null)
    ok(res, { deleted: c })
  } catch (e) { errMsg(res, e.message) }
})

router.post('/manual/sync', async (req, res) => {
  try {
    const { tradeDate, dataType, forceUpdate } = req.query
    const dateStr = normDate(tradeDate)
    const db = getDb()
    if (forceUpdate === 'true') {
      const table = dataType === 'LIMIT_UP' || dataType === 'LIMIT_DOWN' ? 'stock_limit_pool'
        : dataType === 'PLATE_MARKET' ? 'plate_market_quotation'
        : dataType === 'INDEX_DAILY' ? 'stock_zh_index_daily' : null
      if (table) await deleteDdb(table, dateStr, dataType === 'LIMIT_UP' || dataType === 'LIMIT_DOWN' ? dataType : null)
    }
    const result = await syncOne(dateStr, dataType)
    saveSyncStatus(db, dataType, dateStr, result)
    ok(res, result)
  } catch (e) { errMsg(res, e.message) }
})

router.post('/manual/full-sync', async (req, res) => {
  try {
    const { tradeDate, forceUpdate } = req.query
    const dateStr = normDate(tradeDate)
    const db = getDb()
    for (const dt of DATA_TYPES) {
      if (forceUpdate === 'true') {
        await deleteDdb(dt.table, dateStr, dt.code === 'LIMIT_UP' || dt.code === 'LIMIT_DOWN' ? dt.code : null)
      }
      const result = await syncOne(dateStr, dt.code)
      saveSyncStatus(db, dt.code, dateStr, result)
    }
    const rows = db.prepare(`SELECT * FROM data_sync_status WHERE trade_date=? ORDER BY data_type`).all(dateStr)
    ok(res, rows, '完整收盘任务执行完成')
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
