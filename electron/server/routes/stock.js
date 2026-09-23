'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')

const router = express.Router()

function ok(res, data, msg = '成功') { res.json({ code: 200, msg, data }) }
function errMsg(res, msg) { res.json({ code: 500, msg }) }

function mapSpotItem(m) {
  return {
    code: m['代码'], name: m['名称'],
    price: Number(m['最新价']) || 0,
    change: Number(m['涨跌额']) || 0,
    changePercent: Number(m['涨跌幅']) || 0,
    volume: Number(m['成交量']) || 0,
    turnover: Number(m['成交额']) || 0,
    totalMarketValue: Number(m['总市值']) || 0,
    circulationMarketValue: Number(m['流通市值']) || 0,
    turnoverRate: Number(m['换手率']) || 0,
    high: Number(m['最高']) || 0,
    low: Number(m['最低']) || 0,
    open: Number(m['开盘']) || 0,
    amplitude: Number(m['振幅']) || 0,
    market: 'A股'
  }
}

async function getSpotList() {
  const cached = cache.get('aktools:stock:spot')
  if (cached) return cached
  const raw = await aktools.getStockSpot()
  const list = (raw || []).map(mapSpotItem).filter(s => s.code)
  cache.set('aktools:stock:spot', list, 60)
  return list
}

// 股票列表
router.get('/', async (req, res) => {
  try {
    let list = await getSpotList()
    const { search, page = 1, pageSize = 50 } = req.query
    if (search) {
      list = list.filter(s => s.code.includes(search) || s.name.includes(search))
    }
    const total = list.length
    const start = (page - 1) * pageSize
    const items = list.slice(start, start + Number(pageSize))
    ok(res, { list: items, total, page: Number(page), pageSize: Number(pageSize) })
  } catch (e) { errMsg(res, e.message) }
})

// 搜索股票
router.get('/search', async (req, res) => {
  try {
    const { keyword } = req.query
    const list = await getSpotList()
    const results = list.filter(s =>
      s.code.includes(keyword) || s.name.includes(keyword)
    ).slice(0, 20)
    ok(res, results)
  } catch (e) { errMsg(res, e.message) }
})

// 实时行情
router.get('/realtime', async (req, res) => {
  try {
    const { codes } = req.query
    const codeList = codes ? codes.split(',') : []
    const list = await getSpotList()
    const results = codeList.length
      ? list.filter(s => codeList.includes(s.code))
      : list.slice(0, 50)
    ok(res, results)
  } catch (e) { errMsg(res, e.message) }
})

// 股票详情
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params
    const list = await getSpotList()
    const stock = list.find(s => s.code === code)
    if (stock) {
      ok(res, { ...stock, market: 'A股' })
    } else {
      try {
        const info = await aktools.getStockInfo(code)
        ok(res, { code, name: info?.[0]?.['股票简称'] || code, price: 0, market: 'A股' })
      } catch {
        errMsg(res, '未找到股票信息')
      }
    }
  } catch (e) { errMsg(res, e.message) }
})

// K线数据
router.get('/:code/kline', async (req, res) => {
  try {
    const { code } = req.params
    const { period = 'daily', startDate, endDate, adjust = 'qfq' } = req.query
    const raw = await aktools.getStockHistory({ symbol: code, period, adjust, start_date: startDate, end_date: endDate })
    const kline = (raw || []).map(m => ({
      date: m['日期'], open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
      high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
      volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
      turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
    }))
    ok(res, kline)
  } catch (e) { errMsg(res, e.message) }
})

// 历史数据 (同kline)
router.get('/:code/history', async (req, res) => {
  try {
    const { code } = req.params
    const { period = 'daily', startDate, endDate, adjust = 'qfq' } = req.query
    const raw = await aktools.getStockHistory({ symbol: code, period, adjust, start_date: startDate, end_date: endDate })
    ok(res, raw)
  } catch (e) { errMsg(res, e.message) }
})

// 技术指标 (暂无数据源，返回空)
router.get('/:code/indicators', (req, res) => ok(res, []))

// 财务数据 (暂无数据源，返回空)
router.get('/:code/financial', (req, res) => ok(res, {}))

// 新闻 (暂无数据源，返回空)
router.get('/:code/news', (req, res) => ok(res, []))

module.exports = router
