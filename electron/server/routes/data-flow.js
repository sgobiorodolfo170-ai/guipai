'use strict'

/**
 * 数据流转日志 API。
 *
 * 只读查询 + 清空；写入由 fetch-log.js 在取数链路旁路完成。
 * created_at 统一为 ISO UTC（fetch-log.js 生成），时间筛选按 ISO 字符串比较。
 */

const express = require('express')
const { getDb } = require('../db')
const fetchLog = require('../fetch-log')

const router = express.Router()

function ok(res, data, msg = '成功') { res.json({ code: 200, msg, data }) }
function errMsg(res, msg) { res.json({ code: 500, msg }) }

function clamp(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}

function cutoffISO(hours) {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString()
}

router.get('/logs', (req, res) => {
  try {
    const page = clamp(req.query.page, 1, 100000, 1)
    const pageSize = clamp(req.query.pageSize, 10, 200, 50)
    const rawHours = Number(req.query.hours)
    const hours = Number.isFinite(rawHours) ? Math.min(Math.max(Math.trunc(rawHours), 0), 720) : 0 // 0 = 不限时间
    const where = []
    const args = []

    if (hours > 0) {
      where.push('created_at >= ?')
      args.push(cutoffISO(hours))
    }
    if (req.query.dataType) { where.push('data_type = ?'); args.push(String(req.query.dataType)) }
    if (req.query.source) { where.push('source_label = ?'); args.push(String(req.query.source)) }
    if (req.query.status) { where.push('status = ?'); args.push(String(req.query.status)) }
    if (req.query.keyword) {
      where.push('(action LIKE ? OR source_label LIKE ? OR error LIKE ? OR params LIKE ?)')
      const kw = `%${String(req.query.keyword).trim()}%`
      args.push(kw, kw, kw, kw)
    }

    const db = getDb()
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const total = db.prepare(`SELECT COUNT(*) AS c FROM data_fetch_log ${whereSql}`).get(...args)?.c || 0
    const rows = db.prepare(`
      SELECT id, created_at, data_type, action, source_key, source_label, status,
             row_count, duration_ms, params, attempts, error, detail
      FROM data_fetch_log ${whereSql}
      ORDER BY id DESC LIMIT ? OFFSET ?
    `).all(...args, pageSize, (page - 1) * pageSize)

    ok(res, { total, page, pageSize, rows })
  } catch (e) { errMsg(res, e.message) }
})

router.get('/stats', (req, res) => {
  try {
    const rawHours = Number(req.query.hours)
    const hours = Number.isFinite(rawHours) ? Math.min(Math.max(Math.trunc(rawHours), 0), 720) : 24
    const base = hours > 0 ? 'FROM data_fetch_log WHERE created_at >= ?' : 'FROM data_fetch_log WHERE 1=1'
    const args = hours > 0 ? [cutoffISO(hours)] : []
    const db = getDb()

    const summary = db.prepare(`
      SELECT COUNT(*) AS total,
             COALESCE(SUM(CASE WHEN status='success' THEN 1 ELSE 0 END), 0) AS success,
             COALESCE(SUM(CASE WHEN status='empty' THEN 1 ELSE 0 END), 0) AS empty,
             COALESCE(SUM(CASE WHEN status='fail' THEN 1 ELSE 0 END), 0) AS fail,
             COALESCE(AVG(duration_ms), 0) AS avg_duration_ms
      ${base}
    `).get(...args)

    const bySource = db.prepare(`
      SELECT COALESCE(source_label, '未知') AS source_label, COUNT(*) AS count,
             COALESCE(SUM(CASE WHEN status='fail' THEN 1 ELSE 0 END), 0) AS fail
      ${base}
      GROUP BY COALESCE(source_label, '未知')
      ORDER BY count DESC
    `).all(...args)

    const byType = db.prepare(`
      SELECT data_type AS data_type, COUNT(*) AS count,
             COALESCE(SUM(CASE WHEN status='fail' THEN 1 ELSE 0 END), 0) AS fail
      ${base}
      GROUP BY data_type
      ORDER BY count DESC
      LIMIT 20
    `).all(...args)

    const recentFails = db.prepare(`
      SELECT id, created_at, data_type, action, source_label, error
      ${base} AND status='fail'
      ORDER BY id DESC LIMIT 10
    `).all(...args)

    const capacity = db.prepare('SELECT COUNT(*) AS total FROM data_fetch_log').get()?.total || 0
    const latest = db.prepare('SELECT MAX(created_at) AS at FROM data_fetch_log').get()?.at || null

    const total = Number(summary.total) || 0
    ok(res, {
      hours,
      total,
      success: Number(summary.success) || 0,
      empty: Number(summary.empty) || 0,
      fail: Number(summary.fail) || 0,
      success_rate: total ? Math.round(((Number(summary.success) || 0) / total) * 1000) / 10 : 0,
      avg_duration_ms: Math.round(Number(summary.avg_duration_ms) || 0),
      by_source: bySource,
      by_type: byType,
      recent_fails: recentFails,
      capacity: { used: capacity, max: fetchLog.MAX_ROWS },
      latest_at: latest
    })
  } catch (e) { errMsg(res, e.message) }
})

router.delete('/logs', (req, res) => {
  try {
    // 先落盘待写日志再清空，避免清空后定时器把内存队列补写回来。
    fetchLog.flushSync()
    const info = getDb().prepare('DELETE FROM data_fetch_log').run()
    ok(res, { deleted: info.changes || 0 }, '数据流转日志已清空')
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
