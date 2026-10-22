'use strict'

/**
 * 资金流热力图数据路由（矩形树图）。
 *
 *   GET /api/money-flow?type=stock|industry|market&date=YYYYMMDD
 *
 * 数据源：Tushare moneyflow（按交易日全市场，需积分权限；无权限时返回明确错误）。
 * 聚合：
 *   - stock    ：逐股净流入/主力（大单+特大单）资金
 *   - industry ：按通达信子行业（tdx_local.getStockIndustryMap）聚合
 *   - market   ：全市场合计
 *
 * net_inflow 单位为元。tree 里绝对值大的面积大，颜色按净流入正负。
 */

const express = require('express')
const tushare = require('../tushare')
const tdxLocal = require('../sources/tdx_local')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

/** 上周一~五（无节假日历，近似最近交易日） */
function lastWeekday() {
  const d = new Date()
  do {
    d.setDate(d.getDate() - 1)
  } while (d.getDay() === 0 || d.getDay() === 6)
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

function normDate(v) {
  const s = String(v || '').replace(/\D/g, '')
  return s.length === 8 ? s : lastWeekday()
}

function nameMap() {
  try {
    const { getDb } = require('../db')
    const rows = getDb().prepare('SELECT code, name FROM stock_basic').all()
    return new Map(rows.map(r => [r.code, r.name]))
  } catch (_) { return new Map() }
}

router.get('/', async (req, res) => {
  try {
    const type = String(req.query.type || 'stock')
    const date = normDate(req.query.date)
    // 资金流数据源暂为占位（后期接入 Tushare moneyflow 需积分权限，或东财资金流接口）。
    // tushare.getMoneyFlow 已就绪，接入时把下面占位替换为聚合逻辑即可。
    return ok(res, {
      date,
      type,
      placeholder: true,
      message: '资金流数据源未接入（占位）。后期接入 Tushare moneyflow（需积分权限）或东财资金流接口后启用。'
    })
  } catch (e) {
    errMsg(res, `资金流查询失败：${e.message}`)
  }
})

module.exports = router