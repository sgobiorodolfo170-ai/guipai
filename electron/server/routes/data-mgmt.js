'use strict'

/**
 * 数据管理总览路由 —— 给前端「数据总览」页提供一站式存储视图。
 *
 * 覆盖两个存储：
 *   - sql.js (tradeinsight.db)：业务元数据（用户/自选/笔记/模板/模拟训练/同步状态）。
 *     stock_limit_pool / stock_zh_index_daily / plate_market_quotation 三张表是
 *     旧方案残留（数据已迁至 DolphinDB），正常应为 0 行，展示时标记 legacy 便于识别。
 *   - DolphinDB (dfs://tradeinsight)：时序行情（daily_k / stock_limit_pool /
 *     plate_market_quotation / stock_zh_index_daily / stock_basic）。
 *     未连接时返回 connected:false + 各表计数为 null，由前端展示提示，不影响 sql.js 部分。
 */

const express = require('express')
const fs = require('fs')
const path = require('path')
const { getDb, getDataDir } = require('../db')
const ddb = require('../../dolphindb/client')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

/** sql.js 各表的中文说明（表名 → 用途），用于总览页展示 */
const SQLITE_TABLE_LABELS = {
  user: '用户',
  watchlist: '自选股',
  watchlist_group: '自选分组',
  price_alert: '价格提醒',
  note: '笔记',
  note_category: '笔记分类',
  template: '复盘模板',
  template_category: '模板分类',
  sim_single_training: '模拟训练记录',
  data_sync_status: '收盘同步状态',
  stock_basic: '股票基础信息(本地库)',
  stock_limit_pool: '涨跌停池(旧表,已迁至DolphinDB)',
  stock_zh_index_daily: '指数日K(旧表,已迁至DolphinDB)',
  plate_market_quotation: '板块行情(旧表,已迁至DolphinDB)'
}
const SQLITE_LEGACY_TABLES = new Set(['stock_limit_pool', 'stock_zh_index_daily', 'plate_market_quotation'])

/** DolphinDB 各表及日期列（stock_basic 无日期列） */
const DDB_TABLES = [
  { name: 'daily_k', label: '个股日K(前复权)', dateCol: 'trade_date' },
  { name: 'stock_limit_pool', label: '涨跌停池', dateCol: 'trade_date' },
  { name: 'plate_market_quotation', label: '板块行情', dateCol: 'trade_date' },
  { name: 'stock_zh_index_daily', label: '指数日K', dateCol: 'trade_date' },
  { name: 'stock_basic', label: '股票基础信息', dateCol: null },
  { name: 'tick', label: 'Tick(预留,暂无数据)', dateCol: 'trade_date' }
]

/**
 * GET /api/data-mgmt/overview
 * 返回: { sqlite: { fileSize, tables: [{name,label,rows,legacy}] },
 *         dolphindb: { connected, tables: [{name,label,rows,latestDate}] } }
 */
router.get('/overview', async (req, res) => {
  try {
    // ---- sql.js：遍历 sqlite_master 所有用户表并计数 ----
    const db = getDb()
    const tables = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
    ).all()
    const sqliteTables = tables.map(({ name }) => {
      let rows = 0
      try { rows = db.prepare(`SELECT COUNT(*) AS c FROM "${name}"`).get()?.c || 0 } catch (_) { /* 单表失败不阻断整体 */ }
      return { name, label: SQLITE_TABLE_LABELS[name] || name, rows, legacy: SQLITE_LEGACY_TABLES.has(name) }
    })
    // tradeinsight.db 文件大小（sql.js 是内存库+定时落盘，文件可能略滞后于内存）
    let fileSize = 0
    try {
      const p = path.join(getDataDir(), 'tradeinsight.db')
      if (fs.existsSync(p)) fileSize = fs.statSync(p).size
    } catch (_) { /* 取不到文件大小不影响其他数据 */ }

    // ---- DolphinDB：未连接时快速返回，避免每次打开总览页都等连接超时 ----
    const ddbTables = DDB_TABLES.map(t => ({ name: t.name, label: t.label, dateCol: t.dateCol, rows: null, latestDate: null }))
    const connected = ddb.isConnected()
    if (connected) {
      await Promise.all(ddbTables.map(async (t) => {
        try {
          const datePart = t.dateCol ? `, max(${t.dateCol}) as latestDate` : ''
          const r = await ddb.execute(
            `select count(*) as rows${datePart} from loadTable("dfs://tradeinsight", "${t.name}")`
          )
          if (Array.isArray(r) && r.length) {
            t.rows = Number(r[0].rows) || 0
            t.latestDate = r[0].latestDate ? String(r[0].latestDate).replace(/\./g, '-') : null
          }
        } catch (e) {
          t.error = e.message // 单表失败（如表不存在）不阻断整体
        }
      }))
    }

    ok(res, {
      sqlite: { file: 'tradeinsight.db', fileSize, tables: sqliteTables },
      dolphindb: { connected, database: 'dfs://tradeinsight', tables: ddbTables }
    })
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
