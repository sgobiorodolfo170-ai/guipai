'use strict'

const express = require('express')
const { getDb } = require('../db')
const aktools = require('../aktools')
const converter = require('../converter')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const DATA_TYPES = [
  { code: 'LIMIT_UP', desc: '涨停板数据', endpoint: 'getStockLimitPool', converter: 'convertStockLimitPool', table: 'stock_limit_pool' },
  { code: 'LIMIT_DOWN', desc: '跌停板数据', endpoint: 'getStockDropPool', converter: 'convertStockLimitPool', table: 'stock_limit_pool' },
  { code: 'PLATE_MARKET', desc: '板块行情数据', endpoint: 'getStockIndustry', converter: 'convertPlateMarket', table: 'plate_market_quotation' },
  { code: 'INDEX_DAILY', desc: '指数日K数据', endpoint: null, converter: 'convertIndexDaily', table: 'stock_zh_index_daily' }
]

function fmtDate(d) {
  const dt = new Date(d)
  const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), day = String(dt.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

async function syncOne(tradeDate, dataType) {
  const dt = DATA_TYPES.find(d => d.code === dataType)
  if (!dt) return { success: false, message: '未知数据类型' }

  const db = getDb()
  const dateStr = typeof tradeDate === 'string' ? tradeDate : tradeDate.toISOString().slice(0, 10)
  const dateCompact = fmtDate(dateStr)

  // 检查是否已存在
  if (dataType === 'LIMIT_UP' || dataType === 'LIMIT_DOWN') {
    const exists = db.prepare(`SELECT COUNT(*) AS c FROM stock_limit_pool WHERE trade_date=? AND data_type=?`).get(dateStr, dataType)
    if (exists.c > 0) return { success: true, message: `当日数据已存在 ${exists.c} 条，跳过同步`, successCount: exists.c, failCount: 0 }
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

    // 批量插入
    const table = dt.table
    const cols = Object.keys(rows[0])
    const placeholders = cols.map(() => '?').join(',')
    const insertSql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`
    const stmt = db.prepare(insertSql)
    const tx = db.transaction((items) => {
      for (const item of items) stmt.run(...cols.map(c => item[c]))
    })
    tx(rows)

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
    .run(dataType, tradeDate, status, result.successCount || 0, result.failCount || 0, result.message)
}

// ---- 查询接口 ----
router.get('/list', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM data_sync_status ORDER BY sync_time DESC, trade_date DESC`).all()
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

router.get('/by-date', (req, res) => {
  try {
    const { tradeDate } = req.query
    const rows = getDb().prepare(`SELECT * FROM data_sync_status WHERE trade_date=? ORDER BY data_type`).all(tradeDate)
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
    const db = getDb()
    let count = 0
    if (dataType === 'LIMIT_UP' || dataType === 'LIMIT_DOWN') {
      const r = db.prepare(`DELETE FROM stock_limit_pool WHERE trade_date=? AND data_type=?`).run(tradeDate, dataType)
      count = r.changes
    } else if (dataType === 'PLATE_MARKET') {
      const r = db.prepare(`DELETE FROM plate_market_quotation WHERE trade_date=?`).run(tradeDate)
      count = r.changes
    } else if (dataType === 'INDEX_DAILY') {
      const r = db.prepare(`DELETE FROM stock_zh_index_daily WHERE trade_date=?`).run(tradeDate)
      count = r.changes
    }
    ok(res, { deleted: count })
  } catch (e) { errMsg(res, e.message) }
})

router.post('/manual/sync', async (req, res) => {
  try {
    const { tradeDate, dataType, forceUpdate } = req.query
    const db = getDb()
    if (forceUpdate === 'true') {
      if (dataType === 'LIMIT_UP' || dataType === 'LIMIT_DOWN') {
        db.prepare(`DELETE FROM stock_limit_pool WHERE trade_date=? AND data_type=?`).run(tradeDate, dataType)
      } else if (dataType === 'PLATE_MARKET') {
        db.prepare(`DELETE FROM plate_market_quotation WHERE trade_date=?`).run(tradeDate)
      } else if (dataType === 'INDEX_DAILY') {
        db.prepare(`DELETE FROM stock_zh_index_daily WHERE trade_date=?`).run(tradeDate)
      }
    }
    const result = await syncOne(tradeDate, dataType)
    saveSyncStatus(db, dataType, tradeDate, result)
    ok(res, result)
  } catch (e) { errMsg(res, e.message) }
})

router.post('/manual/full-sync', async (req, res) => {
  try {
    const { tradeDate, forceUpdate } = req.query
    const db = getDb()
    for (const dt of DATA_TYPES) {
      if (forceUpdate === 'true') {
        if (dt.code === 'LIMIT_UP' || dt.code === 'LIMIT_DOWN') {
          db.prepare(`DELETE FROM stock_limit_pool WHERE trade_date=? AND data_type=?`).run(tradeDate, dt.code)
        } else if (dt.code === 'PLATE_MARKET') {
          db.prepare(`DELETE FROM plate_market_quotation WHERE trade_date=?`).run(tradeDate)
        } else if (dt.code === 'INDEX_DAILY') {
          db.prepare(`DELETE FROM stock_zh_index_daily WHERE trade_date=?`).run(tradeDate)
        }
      }
      const result = await syncOne(tradeDate, dt.code)
      saveSyncStatus(db, dt.code, tradeDate, result)
    }
    const rows = db.prepare(`SELECT * FROM data_sync_status WHERE trade_date=? ORDER BY data_type`).all(tradeDate)
    ok(res, rows, '完整收盘任务执行完成')
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
