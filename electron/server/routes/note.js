'use strict'

/**
 * 股票笔记路由 —— sql.js 本地持久化（note / note_alert）
 *
 * 设计说明：
 *   - note 表弃用旧通用笔记 schema，重建为结构化股票笔记（交易字段+富文本+K线块+标签）；
 *   - tags / kline_blocks / repeat_rule 以 JSON 字符串存储，返回时解析为对象/数组；
 *   - cost（成本）由服务端自动计算：buy/add = trade_price*quantity + fee；
 *   - 浮动盈亏不落库——前端对 holding_status=open 的笔记调 getStockRealtime 取现价实时算；
 *   - 静态路径（/stocks /tags /summary /alerts/check）需在 /:id 前注册或靠 numericId 跳过；
 *   - 字段统一 camelCase，前端 store 直接消费。
 */

const express = require('express')
const { getDb } = require('../db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const USER_ID = 1

/** 方向常量：买入/卖出/加仓/减仓，对应成本计算口径 */
const BUY_DIRS = new Set(['buy', 'add'])
const SELL_DIRS = new Set(['sell', 'reduce'])

/** 计算单笔成本：买入/加仓 = 价×量＋手续费；卖出/减仓返回 0（由前端按持仓配对算实现盈亏） */
function calcCost(dir, price, qty, fee) {
  if (!price || !qty) return 0
  const f = fee || 0
  return BUY_DIRS.has(dir) ? price * qty + f : 0
}

function rowToNote(r) {
  let tags = []
  try { tags = JSON.parse(r.tags || '[]') || [] } catch { tags = [] }
  let klineBlocks = []
  try { klineBlocks = JSON.parse(r.kline_blocks || '[]') || [] } catch { klineBlocks = [] }
  return {
    id: r.id,
    title: r.title,
    stockCode: r.stock_code,
    stockName: r.stock_name,
    direction: r.direction,
    tradePrice: r.trade_price,
    quantity: r.quantity,
    fee: r.fee,
    tradeDate: r.trade_date,
    cost: r.cost,
    holdingStatus: r.holding_status,
    content: r.content,
    klineBlocks,
    tags,
    isPublic: !!r.is_public,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

function rowToAlert(r) {
  let repeatRule = null
  try { repeatRule = r.repeat_rule ? JSON.parse(r.repeat_rule) : null } catch { repeatRule = null }
  return {
    id: r.id,
    noteId: r.note_id,
    alertType: r.alert_type,
    targetPrice: r.target_price,
    direction: r.direction,
    triggerDate: r.trigger_date,
    triggerTime: r.trigger_time,
    repeatRule,
    enabled: !!r.enabled,
    lastTriggeredAt: r.last_triggered_at,
    status: r.status || 'pending',
    createdAt: r.created_at
  }
}

/** 仅接受数字型 id；静态路径直接跳过此路由 */
function numericId(req, res, next) {
  if (!/^\d+$/.test(req.params.id || '')) return next('route')
  next()
}

// ============================ 静态 GET ============================

// 笔记列表（GET /notes?page=&pageSize=&stockCode=&keyword=&direction=&tags=）
router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, stockCode, keyword, direction, tags } = req.query
    const db = getDb()
    const where = ['n.user_id = ?']
    const params = [USER_ID]
    if (stockCode) { where.push('n.stock_code = ?'); params.push(String(stockCode)) }
    if (direction) { where.push('n.direction = ?'); params.push(String(direction)) }
    if (keyword) { where.push('(n.title LIKE ? OR n.content LIKE ? OR n.stock_name LIKE ? OR n.stock_code LIKE ?)'); const k = `%${keyword}%`; params.push(k, k, k, k) }
    // tags 逗号分隔，命中任一即纳入（JSON 字符串 LIKE 近似匹配）
    if (tags) {
      const tagArr = String(tags).split(',').filter(Boolean)
      const ors = tagArr.map(() => 'n.tags LIKE ?').join(' OR ')
      where.push(`(${ors})`)
      tagArr.forEach(t => params.push(`%"${t}"%`))
    }

    const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM note n WHERE ${where.join(' AND ')}`).get(...params)
    const total = totalRow ? totalRow.c : 0
    const rows = db.prepare(`SELECT * FROM note n
      WHERE ${where.join(' AND ')}
      ORDER BY n.updated_at DESC LIMIT ? OFFSET ?`)
      .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize))
    ok(res, { list: rows.map(rowToNote), total })
  } catch (e) { errMsg(res, e.message) }
})

// 去重股票代码（筛选用下拉）
router.get('/stocks', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT stock_code AS code, MAX(stock_name) AS name, COUNT(*) AS cnt
      FROM note WHERE user_id=? AND stock_code IS NOT NULL AND stock_code<>''
      GROUP BY stock_code ORDER BY cnt DESC`).all(USER_ID)
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

// 全部标签
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

// 盈亏汇总统计（按股票分组，服务端只算落库的投入/回收，浮动盈亏由前端取现价补算）
router.get('/summary', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT stock_code AS code, MAX(stock_name) AS name,
        COUNT(*) AS totalNotes,
        SUM(CASE WHEN direction IN ('buy','add') THEN trade_price*quantity + COALESCE(fee,0) ELSE 0 END) AS totalInvested,
        SUM(CASE WHEN direction IN ('sell','reduce') THEN trade_price*quantity - COALESCE(fee,0) ELSE 0 END) AS totalProceeds,
        SUM(CASE WHEN direction IN ('buy','add') THEN 1 ELSE 0 END) AS buyNotes,
        SUM(CASE WHEN direction IN ('sell','reduce') THEN 1 ELSE 0 END) AS sellNotes
      FROM note WHERE user_id=? AND stock_code IS NOT NULL AND stock_code<>''
      GROUP BY stock_code ORDER BY totalInvested DESC`).all(USER_ID)
    const grand = rows.reduce((acc, r) => {
      acc.totalInvested += r.totalInvested || 0
      acc.totalProceeds += r.totalProceeds || 0
      acc.totalNotes += r.totalNotes || 0
      return acc
    }, { totalInvested: 0, totalProceeds: 0, totalNotes: 0 })
    ok(res, { stocks: rows, grand })
  } catch (e) { errMsg(res, e.message) }
})

// ============================ 提醒检查 ============================

/**
 * POST /alerts/check —— 前端轮询（建议 60s）。
 * 返回 { due: [到期日期/重复提醒], price: [启用中的价格提醒] }。
 * 日期/重复提醒由后端按时间判定；价格提醒返回配置，由前端取现价后判定触发。
 */
router.post('/alerts/check', (req, res) => {
  try {
    const db = getDb()
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10) // YYYY-MM-DD
    const nowTime = now.toTimeString().slice(0, 5)   // HH:MM
    const weekday = now.getDay()                      // 0=周日

    // 所有启用的提醒（联表拿股票信息）
    const rows = db.prepare(`SELECT a.*, n.title AS note_title, n.stock_code, n.stock_name
      FROM note_alert a JOIN note n ON a.note_id=n.id
      WHERE a.user_id=? AND a.enabled=1 AND a.status!='dismissed'`).all(USER_ID)

    const due = []
    const price = []
    for (const r of rows) {
      const alert = rowToAlert(r)
      alert.noteTitle = r.note_title
      alert.stockCode = r.stock_code
      alert.stockName = r.stock_name
      if (r.alert_type === 'price') {
        price.push(alert)
        continue
      }
      // date / repeat：判定是否到期
      const lastDate = r.last_triggered_at ? String(r.last_triggered_at).slice(0, 10) : null
      if (r.alert_type === 'date') {
        const tDate = r.trigger_date || ''
        const tTime = r.trigger_time || '00:00'
        if (tDate < todayStr || (tDate === todayStr && tTime <= nowTime)) {
          if (!lastDate) due.push(alert) // 一次性：从未触发
        }
      } else if (r.alert_type === 'repeat') {
        let rule = null
        try { rule = r.repeat_rule ? JSON.parse(r.repeat_rule) : null } catch {}
        rule = rule || {}
        const tTime = r.trigger_time || '09:30'
        if (tTime > nowTime) continue // 未到时间
        const type = rule.type || 'daily'
        let dayOk = true
        if (type === 'weekly') {
          const weekdays = Array.isArray(rule.weekdays) ? rule.weekdays : []
          dayOk = weekdays.length === 0 || weekdays.includes(weekday)
        } else if (type === 'monthly') {
          dayOk = r.trigger_date ? String(r.trigger_date) === String(now.getDate()) : true
        }
        if (!dayOk) continue
        // 今日是否已触发：last_triggered_at 当天则跳过
        if (lastDate === todayStr) continue
        due.push(alert)
      }
    }
    ok(res, { due, price })
  } catch (e) { errMsg(res, e.message) }
})

// ============================ 笔记 CRUD ============================

// 笔记详情（含提醒列表）
router.get('/:id', numericId, (req, res) => {
  try {
    const row = getDb().prepare(`SELECT * FROM note WHERE id=? AND user_id=?`).get(req.params.id, USER_ID)
    if (!row) return errMsg(res, '笔记不存在')
    const note = rowToNote(row)
    const alerts = getDb().prepare(`SELECT * FROM note_alert WHERE note_id=? ORDER BY id ASC`).all(req.params.id)
    note.alerts = alerts.map(rowToAlert)
    ok(res, note)
  } catch (e) { errMsg(res, e.message) }
})

// 创建笔记
router.post('/', (req, res) => {
  try {
    const b = req.body || {}
    if (!b.title) return errMsg(res, '缺少标题')
    const db = getDb()
    const tags = JSON.stringify(Array.isArray(b.tags) ? b.tags : [])
    const kline = JSON.stringify(Array.isArray(b.klineBlocks) ? b.klineBlocks : [])
    const dir = b.direction || null
    const cost = calcCost(dir, b.tradePrice, b.quantity, b.fee)
    db.prepare(`INSERT INTO note (user_id, title, stock_code, stock_name, direction, trade_price, quantity, fee, trade_date, cost, holding_status, content, kline_blocks, tags, is_public)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(USER_ID, b.title, b.stockCode || null, b.stockName || null, dir,
        b.tradePrice ?? null, b.quantity ?? null, b.fee ?? 0, b.tradeDate || null,
        cost, b.holdingStatus || null, b.content || '', kline, tags, b.isPublic ? 1 : 0)
    const id = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    db.prepare(`UPDATE note SET updated_at=datetime('now','localtime') WHERE id=?`).run(id)
    const row = db.prepare(`SELECT * FROM note WHERE id=?`).get(id)
    ok(res, rowToNote(row))
  } catch (e) { errMsg(res, e.message) }
})

// 更新笔记
router.put('/:id', numericId, (req, res) => {
  try {
    const b = req.body || {}
    const db = getDb()
    const existing = db.prepare(`SELECT * FROM note WHERE id=? AND user_id=?`).get(req.params.id, USER_ID)
    if (!existing) return errMsg(res, '笔记不存在')
    const dir = b.direction !== undefined ? b.direction : existing.direction
    const price = b.tradePrice !== undefined ? b.tradePrice : existing.trade_price
    const qty = b.quantity !== undefined ? b.quantity : existing.quantity
    const fee = b.fee !== undefined ? b.fee : existing.fee
    // 价格/数量/方向有变动时重算成本，否则保留
    const cost = (b.tradePrice !== undefined || b.quantity !== undefined || b.direction !== undefined || b.fee !== undefined)
      ? calcCost(dir, price, qty, fee) : existing.cost
    const tags = b.tags !== undefined ? JSON.stringify(Array.isArray(b.tags) ? b.tags : []) : null
    const kline = b.klineBlocks !== undefined ? JSON.stringify(Array.isArray(b.klineBlocks) ? b.klineBlocks : []) : null
    db.prepare(`UPDATE note SET
        title=COALESCE(?, title),
        stock_code=COALESCE(?, stock_code),
        stock_name=COALESCE(?, stock_name),
        direction=COALESCE(?, direction),
        trade_price=COALESCE(?, trade_price),
        quantity=COALESCE(?, quantity),
        fee=COALESCE(?, fee),
        trade_date=COALESCE(?, trade_date),
        cost=?,
        holding_status=COALESCE(?, holding_status),
        content=COALESCE(?, content),
        kline_blocks=COALESCE(?, kline_blocks),
        tags=COALESCE(?, tags),
        is_public=COALESCE(?, is_public),
        updated_at=datetime('now','localtime')
      WHERE id=? AND user_id=?`)
      .run(b.title ?? null, b.stockCode ?? null, b.stockName ?? null, dir ?? null,
        b.tradePrice ?? null, b.quantity ?? null, b.fee ?? null, b.tradeDate ?? null,
        cost, b.holdingStatus ?? null, b.content ?? null, kline, tags,
        b.isPublic !== undefined ? (b.isPublic ? 1 : 0) : null, req.params.id, USER_ID)
    const row = db.prepare(`SELECT * FROM note WHERE id=?`).get(req.params.id)
    ok(res, rowToNote(row))
  } catch (e) { errMsg(res, e.message) }
})

// 删除笔记（级联删提醒）
router.delete('/:id', numericId, (req, res) => {
  try {
    const db = getDb()
    db.prepare(`DELETE FROM note_alert WHERE note_id=?`).run(req.params.id)
    db.prepare(`DELETE FROM note WHERE id=? AND user_id=?`).run(req.params.id, USER_ID)
    ok(res, null, '已删除')
  } catch (e) { errMsg(res, e.message) }
})

// 笔记导出（返回 html + md 文本，前端按 format 生成 Blob 下载）
router.get('/:id/export', numericId, (req, res) => {
  try {
    const row = getDb().prepare(`SELECT * FROM note WHERE id=? AND user_id=?`).get(req.params.id, USER_ID)
    if (!row) return errMsg(res, '笔记不存在')
    const note = rowToNote(row)
    const dirLabel = { buy: '买入', sell: '卖出', add: '加仓', reduce: '减仓' }[note.direction] || '-'
    const holdLabel = { open: '持仓', closed: '清仓', partial: '部分' }[note.holdingStatus] || '-'

    // HTML：独立文档，含结构化字段表 + 富文本 + K线截图
    const fieldsHtml = `
      <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;margin:12px 0;">
        <tr><th>股票</th><td>${note.stockCode || '-'} ${note.stockName || ''}</td>
            <th>方向</th><td>${dirLabel}</td></tr>
        <tr><th>价格</th><td>${note.tradePrice ?? '-'}</td>
            <th>数量</th><td>${note.quantity ?? '-'}</td></tr>
        <tr><th>手续费</th><td>${note.fee ?? '-'}</td>
            <th>成本</th><td>${note.cost ?? '-'}</td></tr>
        <tr><th>成交日期</th><td>${note.tradeDate || '-'}</td>
            <th>持仓状态</th><td>${holdLabel}</td></tr>
        <tr><th>标签</th><td colspan="3">${(note.tags || []).join(', ') || '-'}</td></tr>
      </table>`
    const klineHtml = (note.klineBlocks || []).map((b, i) => {
      const cfg = `${b.code || ''} · ${(b.period === 'weekly' ? '周K' : b.period === 'monthly' ? '月K' : '日K')} · ${b.startDate || ''}~${b.endDate || ''}`
      return b.imageBase64
        ? `<figure><img src="${b.imageBase64}" style="max-width:100%"/><figcaption>${cfg}</figcaption></figure>`
        : `<p>[K线占位] ${cfg}</p>`
    }).join('')
    const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>${note.title}</title></head>
      <body><h1>${note.title}</h1>${fieldsHtml}${klineHtml}<div>${note.content || ''}</div></body></html>`

    // Markdown：字段表 + 内容（粗去标签）
    const md = `# ${note.title}\n\n` +
      `| 股票 | 方向 | 价格 | 数量 | 成本 | 日期 | 持仓 |\n|---|---|---|---|---|---|---|\n` +
      `| ${note.stockCode || '-'} ${note.stockName || ''} | ${dirLabel} | ${note.tradePrice ?? '-'} | ${note.quantity ?? '-'} | ${note.cost ?? '-'} | ${note.tradeDate || '-'} | ${holdLabel} |\n\n` +
      `**标签**: ${(note.tags || []).join(', ') || '-'}\n\n` +
      (note.content ? note.content.replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n') : '')
    ok(res, { title: note.title, html, md })
  } catch (e) { errMsg(res, e.message) }
})

// ============================ 提醒 CRUD ============================

// 某笔记的提醒列表
router.get('/:id/alerts', numericId, (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM note_alert WHERE note_id=? ORDER BY id ASC`).all(req.params.id)
    ok(res, rows.map(rowToAlert))
  } catch (e) { errMsg(res, e.message) }
})

// 新建提醒
router.post('/:id/alerts', numericId, (req, res) => {
  try {
    const b = req.body || {}
    const db = getDb()
    const exist = db.prepare(`SELECT id FROM note WHERE id=? AND user_id=?`).get(req.params.id, USER_ID)
    if (!exist) return errMsg(res, '笔记不存在')
    if (!b.alertType) return errMsg(res, '缺少提醒类型')
    const repeatRule = b.repeatRule ? JSON.stringify(b.repeatRule) : null
    db.prepare(`INSERT INTO note_alert (note_id, user_id, alert_type, target_price, direction, trigger_date, trigger_time, repeat_rule, enabled, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`)
      .run(req.params.id, USER_ID, b.alertType,
        b.targetPrice ?? null, b.direction || null, b.triggerDate || null, b.triggerTime || null,
        repeatRule, b.enabled !== false ? 1 : 0)
    const aid = db.prepare(`SELECT last_insert_rowid() AS id`).get().id
    const row = db.prepare(`SELECT * FROM note_alert WHERE id=?`).get(aid)
    ok(res, rowToAlert(row))
  } catch (e) { errMsg(res, e.message) }
})

// 更新提醒
router.put('/:id/alerts/:aid', numericId, (req, res) => {
  try {
    const b = req.body || {}
    const db = getDb()
    const repeatRule = b.repeatRule !== undefined ? (b.repeatRule ? JSON.stringify(b.repeatRule) : null) : null
    db.prepare(`UPDATE note_alert SET
        alert_type=COALESCE(?, alert_type),
        target_price=COALESCE(?, target_price),
        direction=COALESCE(?, direction),
        trigger_date=COALESCE(?, trigger_date),
        trigger_time=COALESCE(?, trigger_time),
        repeat_rule=COALESCE(?, repeat_rule),
        enabled=COALESCE(?, enabled),
        status=COALESCE(?, status),
        last_triggered_at=COALESCE(?, last_triggered_at)
      WHERE id=? AND note_id=?`)
      .run(b.alertType || null, b.targetPrice ?? null, b.direction || null,
        b.triggerDate || null, b.triggerTime || null, repeatRule,
        b.enabled !== undefined ? (b.enabled ? 1 : 0) : null,
        b.status || null, b.lastTriggeredAt || null,
        req.params.aid, req.params.id)
    const row = db.prepare(`SELECT * FROM note_alert WHERE id=?`).get(req.params.aid)
    ok(res, rowToAlert(row))
  } catch (e) { errMsg(res, e.message) }
})

// 删除提醒
router.delete('/:id/alerts/:aid', numericId, (req, res) => {
  try {
    getDb().prepare(`DELETE FROM note_alert WHERE id=? AND note_id=?`).run(req.params.aid, req.params.id)
    ok(res, null, '提醒已删除')
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
