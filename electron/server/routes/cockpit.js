'use strict'

/**
 * 驾驶舱路由 —— 个人投资管理中枢
 *
 * 设计说明：
 *   - trade 是唯一事实源；position 是 trade 的物化视图，trade 增删改后按 stock_code 全量回放重算；
 *   - 卖出校验：sell 数量 > 当前持仓 → 400；
 *   - 风控指标在 risk/overview 中计算，调用即 upsert 当日 risk_snapshot；
 *   - 现价/市值/浮盈由前端取，后端只维护本地可算的持仓与成本；
 *   - 字段统一 camelCase，前端直接消费。
 */

const express = require('express')
const { getDb } = require('../db')
const settings = require('../settings')
const { replayPosition, validateTimelineEvents } = require('../domain/position')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })
const badReq = (res, msg) => res.json({ code: 400, msg })

const USER_ID = 1

// ============================ 工具函数 ============================

function nowLocal() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function todayStr() {
  return nowLocal().slice(0, 10)
}

/** 由 trade 流水重算某代码的 position（全量回放，数据量小可靠） */
function rebuildPosition(db, stockCode) {
  const rows = db.prepare(`SELECT * FROM trade WHERE user_id=? AND stock_code=? ORDER BY trade_date ASC, id ASC`)
    .all(USER_ID, stockCode)
  // 纯计算下沉到 domain/position.js：公式可被 node:test 直接断言，
  // 不必起服务/造库（历史上 v1.26.1 已实现盈亏虚增就是纯公式 bug）。
  const st = replayPosition(rows)
  const qty = st.quantity, invested = st.totalInvested, proceeds = st.totalProceeds
  const realized = st.realizedPnl, avgCost = st.avgCost
  const now = nowLocal()
  const existing = db.prepare(`SELECT id FROM position WHERE user_id=? AND stock_code=?`).get(USER_ID, stockCode)
  const name = rows.length ? (rows[rows.length - 1].stock_name || '') : ''
  if (existing) {
    db.prepare(`UPDATE position SET stock_name=?, quantity=?, avg_cost=?, total_invested=?, total_proceeds=?, realized_pnl=?, updated_at=? WHERE id=?`)
      .run(name, qty, avgCost, invested, proceeds, realized, now, existing.id)
  } else {
    db.prepare(`INSERT INTO position (user_id, stock_code, stock_name, quantity, avg_cost, total_invested, total_proceeds, realized_pnl, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(USER_ID, stockCode, name, qty, avgCost, invested, proceeds, realized, now)
  }
}

/** 重算全部 position：trade 有流水的代码 + 已存在但流水被删光的代码（避免清除示例后幽灵持仓） */
function rebuildAllPositions(db) {
  const tradeCodes = db.prepare(`SELECT DISTINCT stock_code FROM trade WHERE user_id=?`).all(USER_ID).map(r => r.stock_code)
  const positionCodes = db.prepare(`SELECT stock_code FROM position WHERE user_id=?`).all(USER_ID).map(r => r.stock_code)
  for (const c of new Set([...tradeCodes, ...positionCodes])) rebuildPosition(db, c)
}

/**
 * 按时间顺序回放持仓，校验插入/修改/删除某笔交易后任意时点持仓不为负。
 * candidate 为空表示校验「删除 excludeTradeId 后」的流水；编辑时以原 id 参与同日排序，
 * 新增时分配 maxId+1，与 rebuildPosition 的 ORDER BY trade_date, id 口径一致。
 */
function validateTimeline(db, stockCode, candidate, excludeTradeId = null) {
  const rows = db.prepare(`SELECT id, direction, quantity, trade_date FROM trade WHERE user_id=? AND stock_code=? ${excludeTradeId != null ? 'AND id != ?' : ''}`)
    .all(...[USER_ID, stockCode, ...(excludeTradeId != null ? [excludeTradeId] : [])])
  const events = rows.map(r => ({
    id: Number(r.id), direction: r.direction, quantity: Number(r.quantity) || 0, tradeDate: r.trade_date
  }))
  // 排序与回放在 domain/position.js：与 rebuildPosition 同一口径，避免两处公式漂移
  return validateTimelineEvents(events, candidate, excludeTradeId).ok
}

// ============================ 示例数据 ============================
// 数据集按默认初始资金 10 万元设计，保证首屏现金为正、仓位/单票/重仓指标不触发红级
const DEMO_TRADES = [
  { stockCode: '000001', stockName: '平安银行', direction: 'buy', tradePrice: 12.50, quantity: 1000, fee: 5.00, tradeDate: '2025-01-20', note: '示例：银行配置' },
  { stockCode: '000001', stockName: '平安银行', direction: 'sell', tradePrice: 13.80, quantity: 400, fee: 2.00, tradeDate: '2025-03-05', note: '示例：部分止盈' },
  { stockCode: '600036', stockName: '招商银行', direction: 'buy', tradePrice: 35.00, quantity: 300, fee: 5.00, tradeDate: '2025-02-10', note: '示例：蓝筹配置' },
  { stockCode: '300750', stockName: '宁德时代', direction: 'buy', tradePrice: 200.00, quantity: 100, fee: 5.00, tradeDate: '2025-02-18', note: '示例：新能源布局' },
  { stockCode: '601318', stockName: '中国平安', direction: 'buy', tradePrice: 50.00, quantity: 400, fee: 5.00, tradeDate: '2025-01-28', note: '示例：保险配置' },
  { stockCode: '000858', stockName: '五粮液', direction: 'buy', tradePrice: 140.00, quantity: 100, fee: 5.00, tradeDate: '2025-02-25', note: '示例：消费配置' }
]

router.post('/trades/demo', (req, res) => {
  try {
    const db = getDb()
    const now = nowLocal()
    db.transaction(() => {
      for (const t of DEMO_TRADES) {
        db.prepare(`INSERT INTO trade (user_id, stock_code, stock_name, direction, trade_price, quantity, fee, trade_date, note, is_demo, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?,?)`)
          .run(USER_ID, t.stockCode, t.stockName, t.direction, t.tradePrice, t.quantity, t.fee, t.tradeDate, t.note, now, now)
      }
      rebuildAllPositions(db)
    })
    ok(res, { count: DEMO_TRADES.length }, `已载入 ${DEMO_TRADES.length} 条示例交易`)
  } catch (e) { errMsg(res, e.message) }
})

router.delete('/trades/demo', (req, res) => {
  try {
    const db = getDb()
    db.transaction(() => {
      db.prepare(`DELETE FROM trade WHERE user_id=? AND is_demo=1`).run(USER_ID)
      rebuildAllPositions(db)
    })
    ok(res, null, '已清除示例数据')
  } catch (e) { errMsg(res, e.message) }
})

// ============================ trade CRUD ============================

router.get('/trades', (req, res) => {
  try {
    const { page = 1, pageSize = 20, stockCode, isDemo } = req.query
    const db = getDb()
    const where = ['user_id = ?']
    const params = [USER_ID]
    if (stockCode) { where.push('stock_code = ?'); params.push(String(stockCode)) }
    if (isDemo !== undefined && isDemo !== '') { where.push('is_demo = ?'); params.push(Number(isDemo) ? 1 : 0) }
    const totalRow = db.prepare(`SELECT COUNT(*) AS c FROM trade WHERE ${where.join(' AND ')}`).get(...params)
    const rows = db.prepare(`SELECT * FROM trade WHERE ${where.join(' AND ')} ORDER BY trade_date DESC, id DESC LIMIT ? OFFSET ?`)
      .all(...params, Number(pageSize), (Number(page) - 1) * Number(pageSize))
    ok(res, { list: rows.map(r => ({
      id: r.id, stockCode: r.stock_code, stockName: r.stock_name, direction: r.direction,
      tradePrice: r.trade_price, quantity: r.quantity, fee: r.fee, tradeDate: r.trade_date,
      note: r.note, isDemo: !!r.is_demo, createdAt: r.created_at, updatedAt: r.updated_at
    })), total: totalRow ? totalRow.c : 0 })
  } catch (e) { errMsg(res, e.message) }
})

router.post('/trades', (req, res) => {
  try {
    const { stockCode, stockName, direction, tradePrice, quantity, fee, tradeDate, note } = req.body || {}
    if (!stockCode || !direction || !tradePrice || !quantity || !tradeDate) {
      return badReq(res, '缺少必填字段：stockCode/direction/tradePrice/quantity/tradeDate')
    }
    if (!['buy', 'sell'].includes(direction)) return badReq(res, 'direction 必须为 buy 或 sell')
    if (!validateTimeline(getDb(), String(stockCode), { direction, quantity: Number(quantity), tradeDate })) {
      return badReq(res, direction === 'sell'
        ? '卖出数量超过该日期前的可用持仓（请检查交易日期顺序）'
        : '交易后持仓出现负数，请检查交易日期与数量')
    }
    const db = getDb()
    const now = nowLocal()
    db.transaction(() => {
      db.prepare(`INSERT INTO trade (user_id, stock_code, stock_name, direction, trade_price, quantity, fee, trade_date, note, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
        .run(USER_ID, String(stockCode), String(stockName || ''), direction, Number(tradePrice), Number(quantity), Number(fee) || 0, String(tradeDate), String(note || ''), now, now)
      rebuildPosition(db, String(stockCode))
    })
    ok(res, null, '已记录')
  } catch (e) { errMsg(res, e.message) }
})

router.put('/trades/:id', (req, res) => {
  try {
    const id = Number(req.params.id)
    const { stockCode, stockName, direction, tradePrice, quantity, fee, tradeDate, note } = req.body || {}
    const db = getDb()
    const old = db.prepare(`SELECT * FROM trade WHERE id=? AND user_id=?`).get(id, USER_ID)
    if (!old) return badReq(res, '记录不存在')
    const newCode = String(stockCode || old.stock_code)
    const newDirection = direction || old.direction
    if (!['buy', 'sell'].includes(newDirection)) return badReq(res, 'direction 必须为 buy 或 sell')
    const newQty = quantity != null ? Number(quantity) : Number(old.quantity)
    const newDate = String(tradeDate || old.trade_date)
    if (!validateTimeline(db, newCode, { direction: newDirection, quantity: newQty, tradeDate: newDate }, id)) {
      return badReq(res, '调整后该股票持仓出现负数，请检查交易日期与数量')
    }
    db.transaction(() => {
      db.prepare(`UPDATE trade SET stock_code=?, stock_name=?, direction=?, trade_price=?, quantity=?, fee=?, trade_date=?, note=?, updated_at=? WHERE id=? AND user_id=?`)
        .run(newCode, String(stockName ?? old.stock_name ?? ''), newDirection,
          tradePrice != null ? Number(tradePrice) : old.trade_price,
          newQty, fee != null ? Number(fee) : old.fee, newDate,
          String(note ?? old.note ?? ''), nowLocal(), id, USER_ID)
      rebuildPosition(db, newCode)
      if (old.stock_code !== newCode) rebuildPosition(db, old.stock_code)
    })
    ok(res, null, '已更新')
  } catch (e) { errMsg(res, e.message) }
})

router.delete('/trades/:id', (req, res) => {
  try {
    const id = Number(req.params.id)
    const db = getDb()
    const old = db.prepare(`SELECT stock_code FROM trade WHERE id=? AND user_id=?`).get(id, USER_ID)
    if (!old) return badReq(res, '记录不存在')
    if (!validateTimeline(db, old.stock_code, null, id)) {
      return badReq(res, '删除后该股票持仓出现负数，请先删除对应的卖出记录')
    }
    db.transaction(() => {
      db.prepare(`DELETE FROM trade WHERE id=? AND user_id=?`).run(id, USER_ID)
      rebuildPosition(db, old.stock_code)
    })
    ok(res, null, '已删除')
  } catch (e) { errMsg(res, e.message) }
})

// ============================ position / summary ============================

router.get('/positions', (req, res) => {
  try {
    const rows = getDb().prepare(`SELECT * FROM position WHERE user_id=? AND quantity > 0 ORDER BY quantity * avg_cost DESC`).all(USER_ID)
    ok(res, rows.map(r => ({
      id: r.id, stockCode: r.stock_code, stockName: r.stock_name,
      quantity: r.quantity, avgCost: r.avg_cost,
      totalInvested: r.total_invested, totalProceeds: r.total_proceeds,
      realizedPnl: r.realized_pnl, updatedAt: r.updated_at
    })))
  } catch (e) { errMsg(res, e.message) }
})

router.get('/summary', (req, res) => {
  try {
    const db = getDb()
    // 持仓口径：仅统计仍持有的股票；资金/已实现口径：包含已清仓股票（quantity=0 仍保留累计流水）
    const holdings = db.prepare(`SELECT COUNT(*) AS c, COALESCE(SUM(quantity * avg_cost),0) AS totalCost FROM position WHERE user_id=? AND quantity > 0`).get(USER_ID)
    const pos = db.prepare(`SELECT COALESCE(SUM(realized_pnl),0) AS totalRealized, COALESCE(SUM(total_invested),0) AS totalInvested, COALESCE(SUM(total_proceeds),0) AS totalProceeds FROM position WHERE user_id=?`).get(USER_ID)
    const tradeStats = db.prepare(`SELECT COUNT(*) AS totalTrades,
      SUM(CASE WHEN direction='buy' THEN 1 ELSE 0 END) AS buyCount,
      SUM(CASE WHEN direction='sell' THEN 1 ELSE 0 END) AS sellCount
      FROM trade WHERE user_id=?`).get(USER_ID)
    // 胜率：已实现盈亏为正的股票数 / 有卖出且已实现过盈亏的股票数（含已清仓）
    const winStats = db.prepare(`SELECT COUNT(*) AS winCount FROM position WHERE user_id=? AND realized_pnl > 0`).get(USER_ID)
    const sellStockCount = db.prepare(`SELECT COUNT(*) AS c FROM position WHERE user_id=? AND total_proceeds > 0`).get(USER_ID)
    ok(res, {
      holdingCount: holdings.c || 0,
      // SQL 的 SUM(quantity * avg_cost) 会产生浮点尾数（72023.01000000001），
      // 这里统一按分收敛——金额对外必须是干净的两位小数，否则前端展示与导出会出现"对不上"。
      totalCost: round2(holdings.totalCost || 0),
      totalRealized: round2(pos.totalRealized || 0),
      totalInvested: round2(pos.totalInvested || 0),
      totalProceeds: round2(pos.totalProceeds || 0),
      totalTrades: tradeStats.totalTrades || 0,
      buyCount: tradeStats.buyCount || 0,
      sellCount: tradeStats.sellCount || 0,
      winCount: winStats.winCount || 0,
      sellStockCount: sellStockCount.c || 0
    })
  } catch (e) { errMsg(res, e.message) }
})

// ============================ 资金 / 阈值 ============================

router.get('/capital', (req, res) => {
  ok(res, { initialCapital: settings.getCockpitConfig().initialCapital })
})

router.put('/capital', (req, res) => {
  try {
    const cfg = settings.updateCockpitConfig({ initialCapital: req.body?.initialCapital })
    ok(res, { initialCapital: cfg.initialCapital }, '已保存')
  } catch (e) { badReq(res, e.message) }
})

router.get('/risk/thresholds', (req, res) => {
  ok(res, settings.getCockpitConfig().riskThresholds)
})

router.put('/risk/thresholds', (req, res) => {
  try {
    const cfg = settings.updateCockpitConfig({ riskThresholds: req.body })
    ok(res, cfg.riskThresholds, '已保存')
  } catch (e) { badReq(res, e.message) }
})

router.post('/risk/thresholds/reset', (req, res) => {
  const cfg = settings.resetCockpitConfig()
  ok(res, cfg.riskThresholds, '已恢复默认')
})

// ============================ 风控引擎 ============================

/**
 * GET /risk/overview
 * 输入：position（成本/数量）+ realtimePrices（前端可传 codes→price，或由调用方先取价再回传）
 * 说明：后端不依赖行情链路；调用方（前端）先调 /api/stocks/realtime 取现价，
 *       再以 POST body 传 { prices: { code: price } } 到此端点计算。
 *       若某票未传价，市值类指标按最近成本价兜底并标注 stale。
 */
router.post('/risk/overview', (req, res) => {
  try {
    const prices = (req.body && req.body.prices) || {}
    const db = getDb()
    const cfg = settings.getCockpitConfig()
    const T = cfg.riskThresholds
    const capital = Number(cfg.initialCapital) || 0

    const positions = db.prepare(`SELECT * FROM position WHERE user_id=? AND quantity > 0`).all(USER_ID)
    const summary = db.prepare(`SELECT COALESCE(SUM(total_invested),0) AS invested, COALESCE(SUM(total_proceeds),0) AS proceeds, COALESCE(SUM(realized_pnl),0) AS realized FROM position WHERE user_id=?`).get(USER_ID)

    // 行业/板块映射（个股可能命中多板块，取第一个）
    const boardRows = db.prepare(`SELECT stock_code, board_name FROM board_constituents`).all()
    const boardMap = {}
    for (const b of boardRows) if (!boardMap[b.stock_code]) boardMap[b.stock_code] = b.board_name

    const cash = capital - (summary.invested || 0) + (summary.proceeds || 0)
    let totalMV = 0
    const items = []
    for (const p of positions) {
      const price = prices[p.stock_code] != null ? Number(prices[p.stock_code]) : null
      const mv = price != null ? price * p.quantity : p.avg_cost * p.quantity
      const pnl = price != null ? (price - p.avg_cost) * p.quantity : 0
      const pnlPct = p.avg_cost > 0 && price != null ? ((price - p.avg_cost) / p.avg_cost) * 100 : null
      totalMV += mv
      items.push({
        stockCode: p.stock_code, stockName: p.stock_name, quantity: p.quantity,
        avgCost: p.avg_cost, price, marketValue: mv, pnl, pnlPct,
        industry: boardMap[p.stock_code] || '未知',
        stalePrice: price == null
      })
    }
    for (const it of items) it.positionPct = totalMV > 0 ? (it.marketValue / totalMV) * 100 : 0

    const totalAssets = totalMV + cash
    const totalPnl = items.reduce((s, i) => s + i.pnl, 0)
    const totalPositionPct = totalAssets > 0 ? (totalMV / totalAssets) * 100 : 0
    const maxSinglePct = items.length ? Math.max(...items.map(i => i.positionPct)) : 0
    const heavyCount = items.filter(i => i.positionPct > T.heavyPositionPct).length

    // 行业集中度
    const industryAgg = {}
    for (const i of items) industryAgg[i.industry] = (industryAgg[i.industry] || 0) + i.marketValue
    const topIndustry = Object.entries(industryAgg).sort((a, b) => b[1] - a[1])[0]
    const topIndustryPct = topIndustry && totalMV > 0 ? (topIndustry[1] / totalMV) * 100 : 0

    // 历史峰值回撤
    const peakRow = db.prepare(`SELECT MAX(total_market_value) AS peak FROM risk_snapshot WHERE user_id=?`).get(USER_ID)
    const peak = Math.max(peakRow?.peak || 0, totalMV)
    const drawdown = peak > 0 ? ((totalMV - peak) / peak) * 100 : 0

    // ---- 指标分级 ----
    const indicators = []
    const alerts = []
    const lv = { green: 'green', yellow: 'yellow', red: 'red', blue: 'blue' }

    // 1 总仓位
    {
      let level = lv.green
      if (totalPositionPct > T.totalPositionHigh) level = lv.red
      else if (totalPositionPct > 75) level = lv.yellow
      else if (totalPositionPct < T.totalPositionLow) level = lv.blue
      indicators.push({ key: 'totalPosition', label: '总仓位', value: round2(totalPositionPct), unit: '%', level, ref: `>${T.totalPositionHigh}%满仓 / <${T.totalPositionLow}%空仓` })
      if (level === lv.red) alerts.push({ level, message: `总仓位 ${round2(totalPositionPct)}%，超过满仓线 ${T.totalPositionHigh}%` })
      if (level === lv.blue) alerts.push({ level, message: `总仓位仅 ${round2(totalPositionPct)}%，接近空仓` })
    }
    // 2 单票集中度
    {
      const top = items.slice().sort((a, b) => b.positionPct - a.positionPct)[0]
      let level = lv.green
      if (top && top.positionPct > T.singlePositionHigh) level = lv.red
      else if (top && top.positionPct > T.singlePositionWarn) level = lv.yellow
      indicators.push({ key: 'singlePosition', label: '最大单票仓位', value: round2(maxSinglePct), unit: '%', level, ref: `预警>${T.singlePositionWarn}% 高危>${T.singlePositionHigh}%` })
      if (top && level !== lv.green) alerts.push({ level, message: `${top.stockName || top.stockCode} 仓位 ${round2(top.positionPct)}%${level === lv.red ? '（高危）' : '（预警）'}`, stockCode: top.stockCode })
    }
    // 3 重仓股数
    {
      const level = heavyCount > T.heavyCountWarn ? lv.yellow : lv.green
      indicators.push({ key: 'heavyCount', label: '重仓股数', value: heavyCount, unit: '只', level, ref: `仓位>${T.heavyPositionPct}% 计重仓，>${T.heavyCountWarn} 只预警` })
      if (level === lv.yellow) alerts.push({ level, message: `重仓股 ${heavyCount} 只，过度集中` })
    }
    // 4 行业集中度
    {
      const level = topIndustryPct > T.industryConcentrationWarn ? lv.yellow : lv.green
      indicators.push({ key: 'industry', label: '最大行业占比', value: round2(topIndustryPct), unit: '%', level, ref: `>${T.industryConcentrationWarn}% 预警${topIndustry ? `（${topIndustry[0]}）` : ''}` })
      if (level === lv.yellow && topIndustry) alerts.push({ level, message: `行业「${topIndustry[0]}」占比 ${round2(topIndustryPct)}%，过度集中` })
    }
    // 5/6/7 单票止损/止盈/浮亏金额
    for (const it of items) {
      if (it.pnlPct == null) continue
      if (it.pnlPct <= -T.stopLossPct) {
        alerts.push({ level: lv.red, message: `${it.stockName || it.stockCode} 浮亏 ${round2(it.pnlPct)}%，触及止损线 -${T.stopLossPct}%`, stockCode: it.stockCode })
      } else if (it.pnlPct >= T.takeProfitPct) {
        alerts.push({ level: lv.blue, message: `${it.stockName || it.stockCode} 浮盈 ${round2(it.pnlPct)}%，达止盈线 +${T.takeProfitPct}%`, stockCode: it.stockCode })
      }
      if (it.pnl <= -Number(T.singleLossAmount)) {
        alerts.push({ level: lv.yellow, message: `${it.stockName || it.stockCode} 浮亏 ¥${round2(-it.pnl)}，超过 ${T.singleLossAmount} 元`, stockCode: it.stockCode })
      }
    }
    // 止损汇总指标
    {
      const worst = items.slice().sort((a, b) => (a.pnlPct ?? 0) - (b.pnlPct ?? 0))[0]
      const worstPct = worst && worst.pnlPct != null ? worst.pnlPct : 0
      let level = lv.green
      if (worstPct <= -T.stopLossPct) level = lv.red
      else if (worstPct <= -T.stopLossPct * 0.7) level = lv.yellow
      indicators.push({ key: 'stopLoss', label: '最大单票浮亏', value: round2(worstPct), unit: '%', level, ref: `止损线 -${T.stopLossPct}%` })
    }
    // 8 持仓回撤
    {
      let level = lv.green
      if (drawdown < -15) level = lv.red
      else if (drawdown < -8) level = lv.yellow
      indicators.push({ key: 'drawdown', label: '持仓回撤', value: round2(drawdown), unit: '%', level, ref: '<-8% 黄 / <-15% 红' })
      if (level !== lv.green) alerts.push({ level, message: `持仓市值回撤 ${round2(drawdown)}%` })
    }
    // 汇总指标：总浮盈
    indicators.push({ key: 'totalPnl', label: '浮动盈亏', value: round2(totalPnl), unit: '元', level: totalPnl >= 0 ? lv.red : lv.green, ref: '' })

    // ---- 落库当日快照 ----
    const today = todayStr()
    const snapshot = {
      totalMarketValue: round2(totalMV), totalPnl: round2(totalPnl),
      totalPositionPct: round2(totalPositionPct), maxSinglePositionPct: round2(maxSinglePct),
      heavyCount, drawdownFromPeak: round2(drawdown)
    }
    db.prepare(`INSERT INTO risk_snapshot (user_id, snapshot_date, total_market_value, total_pnl, total_position_pct, max_single_position_pct, heavy_count, drawdown_from_peak, detail, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(user_id, snapshot_date) DO UPDATE SET total_market_value=excluded.total_market_value, total_pnl=excluded.total_pnl,
        total_position_pct=excluded.total_position_pct, max_single_position_pct=excluded.max_single_position_pct,
        heavy_count=excluded.heavy_count, drawdown_from_peak=excluded.drawdown_from_peak, detail=excluded.detail`)
      .run(USER_ID, today, snapshot.totalMarketValue, snapshot.totalPnl, snapshot.totalPositionPct,
        snapshot.maxSinglePositionPct, heavyCount, snapshot.drawdownFromPeak,
        JSON.stringify(items.map(i => ({ code: i.stockCode, mv: round2(i.marketValue), pnl: round2(i.pnl), pct: round2(i.positionPct) }))),
        nowLocal())

    ok(res, {
      indicators, alerts,
      snapshot,
      cash: round2(cash), totalAssets: round2(totalAssets),
      stalePrices: items.filter(i => i.stalePrice).map(i => i.stockCode)
    })
  } catch (e) { errMsg(res, e.message) }
})

router.get('/risk/snapshots', (req, res) => {
  try {
    const days = Math.min(Number(req.query.days) || 30, 365)
    const rows = getDb().prepare(`SELECT snapshot_date, total_market_value, total_pnl, total_position_pct, drawdown_from_peak
      FROM risk_snapshot WHERE user_id=? ORDER BY snapshot_date DESC LIMIT ?`).all(USER_ID, days)
    ok(res, rows.reverse().map(r => ({
      date: r.snapshot_date, marketValue: r.total_market_value, pnl: r.total_pnl,
      positionPct: r.total_position_pct, drawdown: r.drawdown_from_peak
    })))
  } catch (e) { errMsg(res, e.message) }
})

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100 }

module.exports = router
