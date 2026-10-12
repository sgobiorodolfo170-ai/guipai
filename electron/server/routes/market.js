'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const spotRepo = require('../../dolphindb/spot-repository')
const indexSpotRepo = require('../../dolphindb/index-spot-repository')
const converter = require('../converter')

const router = express.Router()

function ok(res, data, msg = '成功') { res.json({ code: 200, msg, data }) }
function errMsg(res, msg) { res.json({ code: 500, msg }) }

// 市场概况 — DB-first from stock_index_spot
router.get('/overview', async (req, res) => {
  const cacheKey = 'ddb:indexSpot:overview'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached)
  try {
    let data = await indexSpotRepo.getIndexSpot()
    if (data && data.length > 0) {
      const overview = data.map(m => ({
        code: m.symbol, name: m.symbol, price: Number(m.latest_price) || 0,
        change: Number(m.change_amount) || 0, changePercent: Number(m.pct_chg) || 0
      }))
      cache.set(cacheKey, overview, 60)
      return ok(res, overview)
    }
    // aktools → write → re-read
    const raw = await aktools.getStockIndexSpot('沪深重要指数')
    if (raw && raw.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      await indexSpotRepo.insertIndexSpot(raw, today)
      data = await indexSpotRepo.getIndexSpot()
      if (data && data.length > 0) {
        const overview = data.map(m => ({
          code: m.symbol, name: m.symbol, price: Number(m.latest_price) || 0,
          change: Number(m.change_amount) || 0, changePercent: Number(m.pct_chg) || 0
        }))
        cache.set(cacheKey, overview, 60)
        return ok(res, overview, '成功(已入库)')
      }
    }
    ok(res, [])
  } catch (e) { errMsg(res, e.message) }
})

// 热门股票 — DB-first from stock_spot (按成交额排序)
router.get('/hot', async (req, res) => {
  const { limit = 20 } = req.query
  const cacheKey = 'ddb:spot:hot'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached.slice(0, Number(limit)))
  try {
    let data = await spotRepo.getSpot()
    if (data && data.length > 0) {
      const list = data.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      cache.set(cacheKey, list, 60)
      return ok(res, list.slice(0, Number(limit)))
    }
    // aktools → write → re-read
    const raw = await aktools.getStockSpot()
    if (raw && raw.length > 0) {
      await spotRepo.insertSpotSafe(raw)
      data = await spotRepo.getSpot()
      if (data && data.length > 0) {
        const list = data.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
        cache.set(cacheKey, list, 60)
        return ok(res, list.slice(0, Number(limit)), '成功(已入库)')
      }
    }
    ok(res, [])
  } catch (e) { errMsg(res, e.message) }
})

// 指数K线 — DB-first from stock_zh_index_daily
router.get('/index-kline', async (req, res) => {
  try {
    const { code, period = 'daily', startDate, endDate } = req.query
    if (!code) return errMsg(res, '缺少 code 参数')
    const cacheKey = `ddb:index-kline:${code}:${period}:${startDate || ''}:${endDate || ''}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const effEnd = (endDate || '').replace(/-/g, '') || today
    const sd = (startDate || '').replace(/-/g, '')
    const ed = effEnd

    if (ddb.isConnected()) {
      const r = await ddb.execute(`select trade_date as 日期, open as 开盘, close as 收盘, high as 最高, low as 最低, volume as 成交量, amount as 成交额, turnover_rate as 换手率, change as 涨跌幅 from loadTable("dfs://tradeinsight", "stock_zh_index_daily") where symbol='${code}' and trade_date between ${sd.replace(/-/g,'.')} and ${ed.replace(/-/g,'.')} order by trade_date`)
      if (r && Array.isArray(r) && r.length > 0) {
        const kline = r.map(m => ({
          date: String(m['日期']).replace(/\./g, '-'), open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
          high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
          volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
          turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
        }))
        cache.set(cacheKey, kline, 300)
        return ok(res, kline)
      }
    }

    // aktools → converter → write → re-read
    const raw = await aktools.getIndexDailyData({ symbol: code, period, start_date: sd, end_date: ed })
    if (raw && raw.length > 0 && ddb.isConnected()) {
      const rows = converter.convertIndexDaily(raw, code)
      const IDX_COLS = [
        { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
        { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
        { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
        { name: 'volume', type: 'double' }, { name: 'amount', type: 'double' },
        { name: 'amplitude', type: 'double' }, { name: 'change', type: 'double' },
        { name: 'price_change', type: 'double' }, { name: 'turnover_rate', type: 'double' },
        { name: 'create_time', type: 'timestamp' }, { name: 'update_time', type: 'timestamp' }
      ]
      await ddb.execute(`t = loadTable("dfs://tradeinsight", "stock_zh_index_daily"); delete from t where symbol='${code}' and trade_date between ${sd.replace(/-/g,'.')} and ${ed.replace(/-/g,'.')}`)
      await ddb.insertRows('stock_zh_index_daily', IDX_COLS, rows)
      // re-read
      if (ddb.isConnected()) {
        const r2 = await ddb.execute(`select trade_date as 日期, open as 开盘, close as 收盘, high as 最高, low as 最低, volume as 成交量, amount as 成交额, turnover_rate as 换手率, change as 涨跌幅 from loadTable("dfs://tradeinsight", "stock_zh_index_daily") where symbol='${code}' and trade_date between ${sd.replace(/-/g,'.')} and ${ed.replace(/-/g,'.')} order by trade_date`)
        if (r2 && Array.isArray(r2) && r2.length > 0) {
          const kline = r2.map(m => ({
            date: String(m['日期']).replace(/\./g, '-'), open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
            high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
            volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
            turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
          }))
          cache.set(cacheKey, kline, 300)
          return ok(res, kline, '成功(已入库)')
        }
      }
    }

    res.json({ code: 503, msg: '数据不可用', data: [] })
  } catch (e) {
    if (e.retryAfterSec) return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    errMsg(res, e.message)
  }
})

module.exports = router
