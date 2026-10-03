'use strict'

/**
 * 笔记路由 —— sql.js 本地持久化（note / note_category）
 *
 * 设计说明：
 *   - 归属本地用户 user_id=1（桌面版无登录）；
 *   - tags 以 JSON 数组字符串存储，返回时解析为数组；
 *   - 列表返回 { list, total }，支持 page/pageSize/categoryId/keyword 过滤；
 *   - 字段统一转换 camelCase，前端 store 直接消费。
 */

const express = require('express')
const { getDb } = require('../db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const USER_ID = 1

function rowToNote(r) {
  let tags = []
  try { tags = JSON.parse(r.tags || '[]') || [] } catch { tags = [] }
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    summary: r.content ? r.content.substring(0, 100) : '',
    categoryId: r.category_id,
    category: r.category_name != null ? { id: r.category_id, name: r.category_name } : null,
    tags,
    isPublic: !!r.is_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

function rowToCategory(r) {
  return { id: r.id, name: r.name }
}

/** 仅接受数字型 id；静态路径（search/categories/tags/upload 等）直接跳过此路由 */
function numericId(req, res, next) {
  if (!/^\d+$/.test(req.params.id || '')) return next('route')
  next()
}

// 笔记列表（GET /notes?page=&pageSize=&categoryId=&keyword=）
router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, categoryId, keyword } = req.query
    const db = getDb()
    const where = ['n.user_id = ?']
    const params = [USER_ID]
    if (categoryId) { where.push('n.category_id = ?'); params.push(Number(categoryId)) }
    if (keyword) { where.push('(n.title LIKE ? OR n.content LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`) }

    const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM note n WHERE ${where.join(' AND ')}`).get(...params)
    const total = totalRow ? totalRow.c : 0
    const rows = db.prepare(`SELECT n.*, c.name AS category_name FROM note n
      LEFT JOIN note_category c ON n.category_id = c.id
      WHERE ${where.join(' AND ')}
      ORDER BY n.updated_at DESC LIMIT ? OFFSET ?`)
      .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize))
    ok(res, { list: rows.map(rowToNote), total })
  } catch (e) { errMsg(res, e.message) }
})

// 笔记详情
router.get('/:id', numericId, (req, res) => {
  try {
    const row = getDb().prepare(`SELECT n.*, c.name AS category_name FROM note n
      LEFT JOIN note_category c ON n.category_id = c.id WHERE n.id=? AND n.user_id=?`).get(req.params.id, USER_ID)
    if (!row) return errMsg(res, '笔记不存在')
    ok(res, rowToNote(row))
  } catch (e) { errMsg(res, e.message) }
})

// 创建笔记
router.post('/', (req, res) => {
  try {
    const b = req.body || {}
    if (!b.title) return errMsg(res, '缺少标题')
    const db = getDb()
    const tags = JSON.stringify(Array.isArray(b.tags) ? b.tags : [])
    db.prepare(`INSERT INTO note (user_id, title, content, category_id, tags, is_public) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(USER_ID, b.title, b.content || '', b.categoryId ?? null, tags, b.isPublic ? 1 : 0)
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    db.prepare(`UPDATE note SET updated_at=datetime('now','localtime') WHERE id=?`).run(id)
    const row = db.prepare(`SELECT n.*, c.name AS category_name FROM note n
      LEFT JOIN note_category c ON n.category_id = c.id WHERE n.id=?`).get(id)
    ok(res, rowToNote(row))
  } catch (e) { errMsg(res, e.message) }
})

// 更新笔记
router.put('/:id', numericId, (req, res) => {
  try {
    const b = req.body || {}
    const db = getDb()
    const tags = b.tags !== undefined ? JSON.stringify(Array.isArray(b.tags) ? b.tags : []) : null
    db.prepare(`UPDATE note SET
        title=COALESCE(?, title),
        content=COALESCE(?, content),
        category_id=?, tags=COALESCE(?, tags),
        is_public=COALESCE(?, is_public),
        updated_at=datetime('now','localtime')
      WHERE id=? AND user_id=?`)
      .run(b.title ?? null, b.content ?? null, b.categoryId ?? null, tags, b.isPublic !== undefined ? (b.isPublic ? 1 : 0) : null, req.params.id, USER_ID)
    const row = db.prepare(`SELECT n.*, c.name AS category_name FROM note n
      LEFT JOIN note_category c ON n.category_id = c.id WHERE n.id=? AND n.user_id=?`).get(req.params.id, USER_ID)
    if (!row) return errMsg(res, '笔记不存在')
    ok(res, rowToNote(row))
  } catch (e) { errMsg(res, e.message) }
})

// 删除笔记
router.delete('/:id', numericId, (req, res) => {
  try {
    getDb().prepare(`DELETE FROM note WHERE id=? AND user_id=?`).run(req.params.id, USER_ID)
    ok(res, null, '已删除')
  } catch (e) { errMsg(res, e.message) }
})

// 搜索笔记
router.get('/search', (req, res) => {
  try {
    const { keyword = '' } = req.query
    const rows = getDb().prepare(`SELECT n.*, c.name AS category_name FROM note n
      LEFT JOIN note_category c ON n.category_id = c.id
      WHERE n.user_id=? AND (n.title LIKE ? OR n.content LIKE ?)
      ORDER BY n.updated_at DESC LIMIT 50`).all(USER_ID, `%${keyword}%`, `%${keyword}%`)
    ok(res, rows.map(rowToNote))
  } catch (e) { errMsg(res, e.message) }
})

// ---- 分类 ----
router.get('/categories', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM note_category WHERE user_id=? ORDER BY id ASC`).all(USER_ID)
    ok(res, rows.map(rowToCategory))
  } catch (e) { errMsg(res, e.message) }
})

router.post('/categories', (req, res) => {
  try {
    const { name } = req.body || {}
    if (!name) return errMsg(res, '缺少分类名称')
    const db = getDb()
    db.prepare(`INSERT INTO note_category (user_id, name) VALUES (?, ?)`).run(USER_ID, name)
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    ok(res, rowToCategory(db.prepare(`SELECT * FROM note_category WHERE id=?`).get(id)))
  } catch (e) { errMsg(res, e.message) }
})

router.put('/categories/:id', (req, res) => {
  try {
    const { name } = req.body || {}
    getDb().prepare(`UPDATE note_category SET name=? WHERE id=? AND user_id=?`).run(name || '', req.params.id, USER_ID)
    ok(res, rowToCategory(getDb().prepare(`SELECT * FROM note_category WHERE id=?`).get(req.params.id)))
  } catch (e) { errMsg(res, e.message) }
})

router.delete('/categories/:id', (req, res) => {
  try {
    const db = getDb()
    db.prepare(`UPDATE note SET category_id=NULL WHERE user_id=? AND category_id=?`).run(USER_ID, req.params.id)
    db.prepare(`DELETE FROM note_category WHERE id=? AND user_id=?`).run(req.params.id, USER_ID)
    ok(res, null, '分类已删除')
  } catch (e) { errMsg(res, e.message) }
})

// ---- 标签 ----
router.get('/tags', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT tags FROM note WHERE user_id=?`).all(USER_ID)
    const tagSet = new Set()
    for (const r of rows) {
      try { (JSON.parse(r.tags || '[]') || []).forEach(t => tagSet.add(t)) } catch {}
    }
    ok(res, [...tagSet])
  } catch (e) { errMsg(res, e.message) }
})

// ---- 附件上传（保存到数据目录 attachments/，返回相对 url） ----
router.post('/upload', (req, res) => {
  try {
    const fs = require('fs')
    const path = require('path')
    const { getDataDir } = require('../db')
    const b = req.body || {}
    const { fileName, fileContent } = b
    if (!fileName || !fileContent) return errMsg(res, '缺少文件数据')
    const dataDir = getDataDir()
    if (!dataDir) return errMsg(res, '数据目录未初始化')
    const attachDir = path.join(dataDir, 'attachments')
    fs.mkdirSync(attachDir, { recursive: true })
    const safe = fileName.replace(/[\\/:*?"<>|]/g, '_')
    fs.writeFileSync(path.join(attachDir, safe), Buffer.from(fileContent, 'base64'))
    ok(res, { url: `attachments/${safe}`, fileName: safe })
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router