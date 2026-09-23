'use strict'

const express = require('express')
const aktools = require('../aktools')

const router = express.Router()

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

router.get('/random', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 250
    const symbol = SAMPLE_STOCKS[Math.floor(Math.random() * SAMPLE_STOCKS.length)]

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days - 60)

    const fmt = (d) => {
      const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
      return `${y}${m}${day}`
    }

    const data = await aktools.getStockHistory({
      symbol,
      period: 'daily',
      adjust: 'qfq',
      start_date: fmt(startDate),
      end_date: fmt(endDate)
    })

    if (!data || !data.length) {
      return res.json({ code: 500, msg: '未获取到K线数据' })
    }

    const klineData = data.slice(-days).map(item => ({
      date: item['日期'],
      open: Number(item['开盘']),
      close: Number(item['收盘']),
      high: Number(item['最高']),
      low: Number(item['最低']),
      volume: Number(item['成交量']),
      amount: Number(item['成交额']),
      turnover: Number(item['换手率']),
      pctChg: Number(item['涨跌幅']),
      pctChange: Number(item['涨跌幅'])
    }))

    res.json({
      code: 200,
      msg: '成功',
      data: {
        code: symbol,
        codeName: data[0]?.['名称'] || symbol,
        klineData
      }
    })
  } catch (e) {
    res.json({ code: 500, msg: e.message })
  }
})

module.exports = router
