'use strict'

const express = require('express')
const { getDb } = require('../db')
const ddb = require('../../dolphindb/client')
const klineRepo = require('../../dolphindb/kline-repository')

const router = express.Router()

const TBL = `loadTable("dfs://tradeinsight", "daily_k")`

// 摸箱训练专用样本池：覆盖沪深主板/创业板/科创板头部标的，够散够随机。
// 硬编码而非随机取库：避免抽中已退市或长期停牌的低流动性标的，保证模拟盘可成交。
const SAMPLE_STOCKS = [
  '000001', '000002', '000063', '000333', '000651', '000725', '000858',
  '002007', '002027', '002230', '002415', '002475', '002594', '002714',
  '300015', '300059', '300122', '300124', '300274', '300750',
  '600000', '600009', '600016', '600019', '600028', '600029', '600030',
  '600036', '600048', '600050', '600089', '600104', '600196', '600276',
  '600406', '600438', '600519', '600585', '600588', '600660', '600703',
  '600745', '600809', '600886', '600887', '600900', '601012', '601066',
  '601138', '601166', '601169', '601236', '601318', '601398', '601601',
  '601628', '601633', '601668', '601688', '601728', '601766', '601800',
  '601818', '601857', '601888', '601919', '601985', '601988', '601989',
  '603160', '603259', '603288', '603501', '603799', '603833', '603899'
]

function fmt(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

router.get('/random', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 250
    const symbol = SAMPLE_STOCKS[Math.floor(Math.random() * SAMPLE_STOCKS.length)]

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days - 60)

    const sd = fmt(startDate), ed = fmt(endDate)

    // 1. DB 读（daily_k）
    let rows = await klineRepo.getDailyK(symbol, sd, ed)

    // 2. 抽样校验：只要样本池个股在 daily_k 缺数据就不补抓（模拟盘场景用全量日K能覆盖样本池）
    if (!rows || rows.length < days) {
      return res.json({ code: 500, msg: `数据库缺少 ${symbol} 的日K数据（仅 ${rows ? rows.length : 0} 条，需 ${days} 条），请先在数据管理同步历史K线` })
    }

    const data = rows.slice(-days)

    // 名称从 sql.js stock_basic 取（daily_k 不带名称列，避免 DolphinDB 关联查询）
    let codeName = symbol
    try {
      const db = getDb()
      const r = db.prepare('SELECT name FROM stock_basic WHERE code = ?').get(symbol)
      if (r && r.name) codeName = r.name
    } catch { /* 名称缺失不影响K线展示 */ }

    const klineData = data.map(item => ({
      date: item['日期'], open: Number(item['开盘']), close: Number(item['收盘']),
      high: Number(item['最高']), low: Number(item['最低']),
      volume: Number(item['成交量']), amount: Number(item['成交额']),
      turnover: Number(item['换手率']), pctChg: Number(item['涨跌幅']),
      pctChange: Number(item['涨跌幅'])
    }))

    res.json({ code: 200, msg: '成功', data: { code: symbol, codeName, klineData, source: 'daily_k' } })
  } catch (e) {
    res.json({ code: 500, msg: e.message })
  }
})

module.exports = router
