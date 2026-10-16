'use strict'

/**
 * 自选股路由 —— sql.js 本地持久化（watchlist / watchlist_group / price_alert）
 *
 * 设计说明：
 *   - 桌面版无多用户登录，统一归属本地用户 user_id=1（与 sim-training 的 local-user 约定一致）；
 *   - 响应字段统一转 camelCase，供前端 store 直接消费（无额外转换层）；
 *   - POST/PUT 返回完整对象（含 id/addTime），前端 store 直接 push/merge。
 */

const express = require('express')
const { getDb } = require('../db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const USER_ID = 1

// snake_case 行 -> camelCase 对象（watchlist 行）
function rowToWatchlist(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    groupId: r.group_id,
    note: r.note,
    addTime: r.add_time,
    createdAt: r.created_at
  }
}

// snake_case 行 -> camelCase 对象（分组行）
function rowToGroup(r) {
  return { id: r.id, name: r.name, description: r.description }
}

// snake_case 行 -> camelCase 对象（提醒行）
function rowToAlert(r) {
  return {
    id: r.id,
    code: r.code,
    targetPrice: r.target_price,
    direction: r.direction,
    note: r.note,
    enabled: !!r.enabled
  }
}

// 自选股列表
router.get('/', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM watchlist WHERE user_id=? ORDER BY add_time DESC, id DESC`).all(USER_ID)
    ok(res, rows.map(rowToWatchlist))
  } catch (e) { errMsg(res, e.message) }
})

// 添加自选股（body: { code, name?, groupId? } —— groupId 指定归入分组，缺省入默认分组 0）
router.post('/', (req, res) => {
  try {
    const { code, name, groupId } = req.body || {}
    if (!code) return errMsg(res, '缺少股票代码')
    const db = getDb()
    // 幂等：已存在则直接返回现有记录
    const exist = db.prepare(`SELECT * FROM watchlist WHERE user_id=? AND code=?`).get(USER_ID, code)
    if (exist) return ok(res, rowToWatchlist(exist))
    db.prepare(`INSERT INTO watchlist (user_id, code, name, group_id) VALUES (?, ?, ?, ?)`).run(USER_ID, code, name || '', groupId || 0)
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    const row = db.prepare(`SELECT * FROM watchlist WHERE id=?`).get(id)
    ok(res, rowToWatchlist(row))
  } catch (e) { errMsg(res, e.message) }
})

// 检查是否在自选股中
router.get('/check/:code', (req, res) => {
  try {
    const row = getDb().prepare(`SELECT 1 AS c FROM watchlist WHERE user_id=? AND code=?`).get(USER_ID, req.params.code)
    ok(res, !!row)
  } catch (e) { errMsg(res, e.message) }
})

// 批量添加（body: { codes: [], nameMap?: {code:name} }）
router.post('/batch', (req, res) => {
  try {
    const { codes, nameMap } = req.body || {}
    if (!Array.isArray(codes)) return errMsg(res, 'codes 必须为数组')
    const db = getDb()
    const added = []
    for (const code of codes) {
      const exist = db.prepare(`SELECT * FROM watchlist WHERE user_id=? AND code=?`).get(USER_ID, code)
      let row = exist
      if (!exist) {
        db.prepare(`INSERT INTO watchlist (user_id, code, name) VALUES (?, ?, ?)`).run(USER_ID, code, nameMap?.[code] || '')
        row = db.prepare(`SELECT * FROM watchlist WHERE user_id=? AND code=?`).get(USER_ID, code)
      }
      added.push(rowToWatchlist(row))
    }
    ok(res, added)
  } catch (e) { errMsg(res, e.message) }
})

// 批量移除（DELETE body: { codes: [] }）
router.delete('/batch', (req, res) => {
  try {
    const { codes } = req.body || {}
    if (!Array.isArray(codes)) return errMsg(res, 'codes 必须为数组')
    const db = getDb()
    for (const code of codes) {
      db.prepare(`DELETE FROM watchlist WHERE user_id=? AND code=?`).run(USER_ID, code)
    }
    ok(res, null, '已批量移除')
  } catch (e) { errMsg(res, e.message) }
})

// 移除自选股（置于 batch 之后，避免 /batch 被 :code 截获）
router.delete('/:code', (req, res) => {
  try {
    getDb().prepare(`DELETE FROM watchlist WHERE user_id=? AND code=?`).run(USER_ID, req.params.code)
    ok(res, null, '已移除')
  } catch (e) { errMsg(res, e.message) }
})

// ---- 分组 ----
router.get('/groups', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM watchlist_group WHERE user_id=? ORDER BY id ASC`).all(USER_ID)
    ok(res, rows.map(rowToGroup))
  } catch (e) { errMsg(res, e.message) }
})

router.post('/groups', (req, res) => {
  try {
    const { name, description } = req.body || {}
    if (!name) return errMsg(res, '缺少分组名称')
    const db = getDb()
    db.prepare(`INSERT INTO watchlist_group (user_id, name, description) VALUES (?, ?, ?)`).run(USER_ID, name, description || '')
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    ok(res, rowToGroup(db.prepare(`SELECT * FROM watchlist_group WHERE id=?`).get(id)))
  } catch (e) { errMsg(res, e.message) }
})

router.put('/groups/:id', (req, res) => {
  try {
    const { name, description } = req.body || {}
    const db = getDb()
    db.prepare(`UPDATE watchlist_group SET name=COALESCE(?, name), description=COALESCE(?, description) WHERE id=? AND user_id=?`)
      .run(name ?? null, description ?? null, req.params.id, USER_ID)
    ok(res, rowToGroup(db.prepare(`SELECT * FROM watchlist_group WHERE id=?`).get(req.params.id)))
  } catch (e) { errMsg(res, e.message) }
})

router.delete('/groups/:id', (req, res) => {
  try {
    const db = getDb()
    const id = req.params.id
    // 将该分组下股票移回默认分组
    db.prepare(`UPDATE watchlist SET group_id=0 WHERE user_id=? AND group_id=?`).run(USER_ID, id)
    db.prepare(`DELETE FROM watchlist_group WHERE id=? AND user_id=?`).run(id, USER_ID)
    ok(res, null, '分组已删除')
  } catch (e) { errMsg(res, e.message) }
})

// ---- 股票分组/备注 ----
router.put('/:code/group', (req, res) => {
  try {
    const { groupId } = req.body || {}
    getDb().prepare(`UPDATE watchlist SET group_id=? WHERE user_id=? AND code=?`).run(groupId || 0, USER_ID, req.params.code)
    ok(res, null, '已移动')
  } catch (e) { errMsg(res, e.message) }
})

router.put('/:code/note', (req, res) => {
  try {
    const { note } = req.body || {}
    getDb().prepare(`UPDATE watchlist SET note=? WHERE user_id=? AND code=?`).run(note || '', USER_ID, req.params.code)
    ok(res, null, '备注已保存')
  } catch (e) { errMsg(res, e.message) }
})

// ---- 价格提醒 ----
router.post('/:code/alert', (req, res) => {
  try {
    const { targetPrice, direction, note, enabled } = req.body || {}
    const db = getDb()
    db.prepare(`INSERT INTO price_alert (user_id, code, target_price, direction, note, enabled) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(USER_ID, req.params.code, targetPrice ?? null, direction || '', note || '', enabled !== false ? 1 : 0)
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    ok(res, rowToAlert(db.prepare(`SELECT * FROM price_alert WHERE id=?`).get(id)))
  } catch (e) { errMsg(res, e.message) }
})

router.get('/:code/alerts', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM price_alert WHERE user_id=? AND code=? ORDER BY id DESC`).all(USER_ID, req.params.code)
    ok(res, rows.map(rowToAlert))
  } catch (e) { errMsg(res, e.message) }
})

router.delete('/alerts/:alertId', (req, res) => {
  try {
    getDb().prepare(`DELETE FROM price_alert WHERE id=? AND user_id=?`).run(req.params.alertId, USER_ID)
    ok(res, null, '提醒已删除')
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router