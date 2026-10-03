'use strict'

/**
 * 模板路由 —— sql.js 本地持久化（template / template_category）
 *
 * 设计说明：
 *   - 归属本地用户 user_id=1（桌面版无登录）；
 *   - fields 以 JSON 数组字符串存储（[{label,key,type,required,placeholder,options}]），返回时解析为数组；
 *   - isOwner / isShared / shareCode 由后端计算：本用户创建即 isOwner=true；
 *   - 列表返回 { list, total }，公共模板接口按 is_public=1 过滤。
 */

const express = require('express')
const { getDb } = require('../db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const USER_ID = 1

function rowToTemplate(r) {
  let fields = []
  try { fields = JSON.parse(r.fields || '[]') || [] } catch { fields = [] }
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    content: r.content,
    categoryId: r.category_id,
    category: r.category_name != null ? { id: r.category_id, name: r.category_name } : null,
    isPublic: !!r.is_public,
    isShared: !!r.is_shared,
    shareCode: r.share_code,
    useCount: r.use_count || 0,
    isOwner: r.user_id === USER_ID,
    author: r.is_shared && r.user_id !== USER_ID ? { username: '分享用户' } : null,
    fields,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

function rowToCategory(r) {
  return { id: r.id, name: r.name }
}

function genShareCode(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

/** 仅接受数字型 id；静态路径（public/categories 等）直接跳过此路由 */
function numericId(req, res, next) {
  if (!/^\d+$/.test(req.params.id || '')) return next('route')
  next()
}

// 模板列表（GET /templates?page=&pageSize=&categoryId=&keyword=）
router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, categoryId, keyword } = req.query
    const db = getDb()
    const where = []
    const params = []
    // 列表返回自己的 + 分享给我的（is_shared=1 且非本人）
    where.push(`(t.user_id = ? OR (t.is_shared = 1 AND t.is_public = 1))`)
    params.push(USER_ID)
    if (categoryId) { where.push('t.category_id = ?'); params.push(Number(categoryId)) }
    if (keyword) { where.push('(t.name LIKE ? OR t.description LIKE ? OR t.content LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`) }

    const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM template t WHERE ${where.join(' AND ')}`).get(...params)
    const total = totalRow ? totalRow.c : 0
    const rows = db.prepare(`SELECT t.*, c.name AS category_name, u.username FROM template t
      LEFT JOIN template_category c ON t.category_id = c.id
      LEFT JOIN user u ON t.user_id = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY t.updated_at DESC LIMIT ? OFFSET ?`)
      .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize))
    ok(res, { list: rows.map(rowToTemplate), total })
  } catch (e) { errMsg(res, e.message) }
})

// 模板详情
router.get('/:id', numericId, (req, res) => {
  try {
    const row = getDb().prepare(`SELECT t.*, c.name AS category_name, u.username FROM template t
      LEFT JOIN template_category c ON t.category_id = c.id
      LEFT JOIN user u ON t.user_id = u.id
      WHERE t.id=?`).get(req.params.id)
    if (!row) return errMsg(res, '模板不存在')
    ok(res, rowToTemplate(row))
  } catch (e) { errMsg(res, e.message) }
})

// 创建模板
router.post('/', (req, res) => {
  try {
    const b = req.body || {}
    if (!b.name) return errMsg(res, '缺少模板名称')
    const db = getDb()
    const fields = JSON.stringify(Array.isArray(b.fields) ? b.fields : [])
    db.prepare(`INSERT INTO template (user_id, name, description, content, category_id, fields, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(USER_ID, b.name, b.description || '', b.content || '', b.categoryId ?? null, fields, b.isPublic ? 1 : 0)
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    db.prepare(`UPDATE template SET updated_at=datetime('now','localtime') WHERE id=?`).run(id)
    const row = db.prepare(`SELECT t.*, c.name AS category_name, u.username FROM template t
      LEFT JOIN template_category c ON t.category_id = c.id
      LEFT JOIN user u ON t.user_id = u.id WHERE t.id=?`).get(id)
    ok(res, rowToTemplate(row))
  } catch (e) { errMsg(res, e.message) }
})

// 更新模板
router.put('/:id', numericId, (req, res) => {
  try {
    const b = req.body || {}
    const db = getDb()
    const fields = b.fields !== undefined ? JSON.stringify(Array.isArray(b.fields) ? b.fields : []) : null
    db.prepare(`UPDATE template SET
        name=COALESCE(?, name),
        description=COALESCE(?, description),
        content=COALESCE(?, content),
        category_id=?,
        fields=COALESCE(?, fields),
        is_public=COALESCE(?, is_public),
        updated_at=datetime('now','localtime')
      WHERE id=? AND user_id=?`)
      .run(b.name ?? null, b.description ?? null, b.content ?? null, b.categoryId ?? null, fields, b.isPublic !== undefined ? (b.isPublic ? 1 : 0) : null, req.params.id, USER_ID)
    const row = db.prepare(`SELECT t.*, c.name AS category_name, u.username FROM template t
      LEFT JOIN template_category c ON t.category_id = c.id
      LEFT JOIN user u ON t.user_id = u.id WHERE t.id=? AND t.user_id=?`).get(req.params.id, USER_ID)
    if (!row) return errMsg(res, '模板不存在或无权修改')
    ok(res, rowToTemplate(row))
  } catch (e) { errMsg(res, e.message) }
})

// 删除模板
router.delete('/:id', numericId, (req, res) => {
  try {
    getDb().prepare(`DELETE FROM template WHERE id=? AND user_id=?`).run(req.params.id, USER_ID)
    ok(res, null, '已删除')
  } catch (e) { errMsg(res, e.message) }
})

// 复制模板
router.post('/:id/copy', numericId, (req, res) => {
  try {
    const db = getDb()
    const src = db.prepare(`SELECT * FROM template WHERE id=?`).get(req.params.id)
    if (!src) return errMsg(res, '模板不存在')
    db.prepare(`INSERT INTO template (user_id, name, description, content, category_id, fields, is_public)
      VALUES (?, ?, ?, ?, ?, ?, 0)`)
      .run(USER_ID, `${src.name}（副本）`, src.description || '', src.content || '', src.category_id, src.fields)
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    const row = db.prepare(`SELECT t.*, c.name AS category_name, u.username FROM template t
      LEFT JOIN template_category c ON t.category_id = c.id
      LEFT JOIN user u ON t.user_id = u.id WHERE t.id=?`).get(id)
    ok(res, rowToTemplate(row))
  } catch (e) { errMsg(res, e.message) }
})

// 分享模板（返回 shareCode）
router.post('/:id/share', numericId, (req, res) => {
  try {
    const db = getDb()
    const row = db.prepare(`SELECT * FROM template WHERE id=? AND user_id=?`).get(req.params.id, USER_ID)
    if (!row) return errMsg(res, '模板不存在或无权分享')
    const code = row.share_code || genShareCode()
    db.prepare(`UPDATE template SET is_shared=1, share_code=?, is_public=1, updated_at=datetime('now','localtime') WHERE id=?`).run(code, req.params.id)
    ok(res, { shareCode: code, isShared: true })
  } catch (e) { errMsg(res, e.message) }
})

// 取消分享
router.post('/:id/unshare', numericId, (req, res) => {
  try {
    getDb().prepare(`UPDATE template SET is_shared=0, share_code=NULL, updated_at=datetime('now','localtime') WHERE id=? AND user_id=?`).run(req.params.id, USER_ID)
    ok(res, { isShared: false, shareCode: null })
  } catch (e) { errMsg(res, e.message) }
})

// 公共模板（分享给我的）
router.get('/public', (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const db = getDb()
    const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM template WHERE is_public=1 AND is_shared=1 AND user_id != ?`).get(USER_ID)
    const total = totalRow ? totalRow.c : 0
    const rows = db.prepare(`SELECT t.*, c.name AS category_name, u.username FROM template t
      LEFT JOIN template_category c ON t.category_id = c.id
      LEFT JOIN user u ON t.user_id = u.id
      WHERE t.is_public=1 AND t.is_shared=1 AND t.user_id != ?
      ORDER BY t.use_count DESC, t.updated_at DESC LIMIT ? OFFSET ?`)
      .all(USER_ID, Number(pageSize), (Number(page) - 1) * Number(pageSize))
    ok(res, { list: rows.map(rowToTemplate), total })
  } catch (e) { errMsg(res, e.message) }
})

// ---- 分类 ----
router.get('/categories', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM template_category WHERE user_id=? ORDER BY id ASC`).all(USER_ID)
    ok(res, rows.map(rowToCategory))
  } catch (e) { errMsg(res, e.message) }
})

// 使用模板创建笔记（生成笔记落库，返回笔记对象）
router.post('/:id/create-note', numericId, (req, res) => {
  try {
    const db = getDb()
    const tpl = db.prepare(`SELECT * FROM template WHERE id=? AND (user_id=? OR (is_shared=1 AND is_public=1))`).get(req.params.id, USER_ID)
    if (!tpl) return errMsg(res, '模板不存在')
    const b = req.body || {}
    db.prepare(`INSERT INTO note (user_id, title, content) VALUES (?, ?, ?)`)
      .run(USER_ID, b.title || tpl.name, b.content || (tpl.content || ''))
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    // 使用计数 +1
    db.prepare(`UPDATE template SET use_count=use_count+1 WHERE id=?`).run(tpl.id)
    const row = db.prepare(`SELECT n.*, c.name AS category_name FROM note n LEFT JOIN note_category c ON n.category_id=c.id WHERE n.id=?`).get(id)
    ok(res, {
      id: row.id, title: row.title, content: row.content,
      categoryId: row.category_id, tags: [], isPublic: !!row.is_public,
      createdAt: row.created_at, updatedAt: row.updated_at
    })
  } catch (e) { errMsg(res, e.message) }
})

// 分类创建/更新/删除
router.post('/categories', (req, res) => {
  try {
    const { name } = req.body || {}
    if (!name) return errMsg(res, '缺少分类名称')
    const db = getDb()
    db.prepare(`INSERT INTO template_category (user_id, name) VALUES (?, ?)`).run(USER_ID, name)
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    ok(res, rowToCategory(db.prepare(`SELECT * FROM template_category WHERE id=?`).get(id)))
  } catch (e) { errMsg(res, e.message) }
})

router.put('/categories/:id', (req, res) => {
  try {
    const { name } = req.body || {}
    getDb().prepare(`UPDATE template_category SET name=? WHERE id=? AND user_id=?`).run(name || '', req.params.id, USER_ID)
    ok(res, rowToCategory(getDb().prepare(`SELECT * FROM template_category WHERE id=?`).get(req.params.id)))
  } catch (e) { errMsg(res, e.message) }
})

router.delete('/categories/:id', (req, res) => {
  try {
    const db = getDb()
    db.prepare(`UPDATE template SET category_id=NULL WHERE user_id=? AND category_id=?`).run(USER_ID, req.params.id)
    db.prepare(`DELETE FROM template_category WHERE id=? AND user_id=?`).run(req.params.id, USER_ID)
    ok(res, null, '分类已删除')
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router