'use strict'

const express = require('express')
const { getDb } = require('../db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

router.get('/local-user', (req, res) => {
  try {
    const db = getDb()
    let user = db.prepare(`SELECT * FROM user ORDER BY id LIMIT 1`).get()
    if (!user) {
      db.prepare(`INSERT INTO user (username, password, status, total_simulation_assets, total_transaction_count) VALUES ('local', '', 1, 100000, 0)`).run()
      user = db.prepare(`SELECT * FROM user ORDER BY id LIMIT 1`).get()
    }
    ok(res, user)
  } catch (e) { errMsg(res, e.message) }
})

router.post('/submit', (req, res) => {
  try {
    const db = getDb()
    const t = req.body
    const totalProfit = Number(t.finalCapital) - Number(t.initialCapital)
    const operationRate = Number(t.initialCapital) !== 0
      ? Number((totalProfit / t.initialCapital * 100).toFixed(4)) : 0
    const excessRate = Number((operationRate - t.stockRangeProfitRate).toFixed(4))

    let userId = t.userId
    let user = db.prepare(`SELECT * FROM user WHERE id=?`).get(userId)
    if (!user) {
      db.prepare(`INSERT INTO user (username, password, status, total_simulation_assets, total_transaction_count) VALUES ('local', '', 1, 100000, 0)`).run()
      userId = db.prepare(`SELECT id FROM user ORDER BY id LIMIT 1`).get().id
      user = db.prepare(`SELECT * FROM user WHERE id=?`).get(userId)
    }

    const result = db.prepare(`INSERT INTO sim_single_training
      (user_id, stock_name, stock_code, start_time, end_time, initial_capital, final_capital,
       total_profit, operation_profit_rate, excess_profit_rate, stock_range_profit_rate,
       trade_times, trade_datas, status, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,datetime('now','localtime'))`).run(
      userId, t.stockName, t.stockCode, t.startTime, t.endTime,
      t.initialCapital, t.finalCapital, totalProfit, operationRate, excessRate,
      t.stockRangeProfitRate, t.tradeTimes, JSON.stringify(t.tradeDatas)
    )

    db.prepare(`UPDATE user SET total_transaction_count = COALESCE(total_transaction_count,0)+1,
      total_simulation_assets = ? WHERE id=?`).run(t.finalCapital, userId)

    const row = db.prepare(`SELECT * FROM sim_single_training WHERE id=?`).get(result.lastInsertRowid)
    ok(res, row)
  } catch (e) { errMsg(res, e.message) }
})

router.get('/history', (req, res) => {
  try {
    const { userId } = req.query
    const rows = getDb().prepare(`SELECT * FROM sim_single_training WHERE user_id=? ORDER BY created_at DESC`).all(userId)
    ok(res, rows)
  } catch (e) { errMsg(res, e.message) }
})

router.get('/detail/:trainingId', (req, res) => {
  try {
    const row = getDb().prepare(`SELECT * FROM sim_single_training WHERE id=?`).get(req.params.trainingId)
    if (!row) return errMsg(res, '模拟记录不存在')
    ok(res, row)
  } catch (e) { errMsg(res, e.message) }
})

module.exports = router
