'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const spotRepo = require('../../dolphindb/spot-repository')
const indexSpotRepo = require('../../dolphindb/index-spot-repository')
const converter = require('../converter')
const { safeSymbol, safeDate } = require('../../dolphindb/params')

const router = express.Router()

function ok(res, data, msg = '成功') { res.json({ code: 200, msg, data }) }
function errMsg(res, msg) { res.json({ code: 500, msg }) }

/**
 * 指数代码 → 中文名。
 * stock_index_spot 只存 symbol（无 name 列），而前端 Dashboard.vue 靠 name 匹配
 * '上证'/'深证'/'创业' 来定位三大指数。此处用静态映射补名，避免为了一列名称去改表结构
 * （createPartitionedTable 有 existsTable 守卫，改列对存量库不生效，反而制造迁移分叉）。
 */
const INDEX_NAME_MAP = {
  '000001': '上证指数', '000300': '沪深300', '000905': '中证500', '000016': '上证50',
  '000852': '中证1000', '000010': '上证180', '000688': '科创50', '000688.SH': '科创50',
  '399001': '深证成指', '399006': '创业板指', '399005': '中小100', '399106': '深证综指',
  '399673': '创业板50', '000001.SH': '上证指数', '000300.SH': '沪深300',
  '399001.SZ': '深证成指', '399006.SZ': '创业板指'
}

function indexName(symbol) { return INDEX_NAME_MAP[symbol] || symbol }

/** stock_spot 行 → /hot 前端契约（按成交额倒序，DB 侧不预排序避免污染缓存顺序） */
function toHot(rows) {
  return rows
    .filter(r => r.symbol)
    .map(r => ({
      code: r.symbol, name: r.name || r.symbol,
      price: Number(r.close) || 0,
      changePercent: Number(r.pct_chg) || 0,
      turnover: Number(r.amount) || 0
    }))
    .sort((a, b) => b.turnover - a.turnover)
}

/** stock_index_spot 行 → /overview 前端契约 */
function toOverview(rows) {
  return rows.map(m => ({
    code: m.symbol,
    name: indexName(m.symbol),
    price: Number(m.latest_price) || 0,
    change: Number(m.change_amount) || 0,
    changePercent: Number(m.pct_chg) || 0
  }))
}

// 市场概况 — DB-first from stock_index_spot
router.get('/overview', async (req, res) => {
  const cacheKey = 'ddb:indexSpot:overview'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached)
  try {
    let data = await indexSpotRepo.getIndexSpot()
    if (data && data.length > 0) {
      const overview = toOverview(data)
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
        const overview = toOverview(data)
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
      const list = toHot(data)
      cache.set(cacheKey, list, 60)
      return ok(res, list.slice(0, Number(limit)))
    }
    // aktools → write → re-read
    const raw = await aktools.getStockSpot()
    if (raw && raw.length > 0) {
      await spotRepo.insertSpotSafe(raw)
      data = await spotRepo.getSpot()
      if (data && data.length > 0) {
        const list = toHot(data)
        cache.set(cacheKey, list, 60)
        return ok(res, list.slice(0, Number(limit)), '成功(已入库)')
      }
    }

    // 上游全挂 → 从 daily_k_raw 派生收盘快照兜底
    const derived = await spotRepo.deriveFromRaw()
    if (derived > 0) {
      data = await spotRepo.getSpot()
      if (data && data.length > 0) {
        const list = toHot(data)
        cache.set(cacheKey, list, 60)
        return ok(res, list.slice(0, Number(limit)), '成功(daily_k_raw 派生快照)')
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
    // 净化 query 拼进 DolphinDB 脚本前必须过白名单（脚本无参数绑定）
    // startDate 缺省给默认起始日而非留空：safeDate(undefined) 返回 null 会让下方
    // 校验直接判"参数不合法"，而前端并不总是显式带 startDate。
    const today = new Date().toISOString().slice(0, 10)
    const sym = safeSymbol(code)
    const sd = safeDate(startDate || '1990-01-01')
    const ed = safeDate(endDate || today)
    if (!sym || !sd || !ed) return errMsg(res, '参数不合法')
    const cacheKey = `ddb:index-kline:${sym}:${period}:${startDate || ''}:${endDate || ''}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    const IDX_TBL = `loadTable("dfs://tradeinsight", "stock_zh_index_daily")`
    const SELECT = `select trade_date as 日期, open as 开盘, close as 收盘, high as 最高, low as 最低,` +
      ` volume as 成交量, amount as 成交额, turnover_rate as 换手率, change as 涨跌幅` +
      ` from ${IDX_TBL} where symbol='${sym}' and trade_date between ${sd} and ${ed} order by trade_date`
    const toKline = (rows) => rows.map(m => ({
      date: String(m['日期']).replace(/\./g, '-'), open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
      high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
      volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
      turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
    }))

    // 1. DB 读
    if (ddb.isConnected()) {
      const r = await ddb.execute(SELECT)
      if (Array.isArray(r) && r.length > 0) {
        const kline = toKline(r)
        cache.set(cacheKey, kline, 300)
        return ok(res, kline)
      }
    }

    // 2. 数据源 → 转换入库 → 读回
    const raw = await aktools.getIndexDailyData({
      symbol: code,
      period,
      start_date: (startDate || '').replace(/-/g, ''),
      end_date: (endDate || '').replace(/-/g, '') || new Date().toISOString().slice(0, 10).replace(/-/g, '')
    })
    if (raw && raw.length > 0 && ddb.isConnected()) {
      const rows = converter.convertIndexDaily(raw, sym)
      const IDX_COLS = [
        { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
        { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
        { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
        { name: 'volume', type: 'double' }, { name: 'amount', type: 'double' },
        { name: 'amplitude', type: 'double' }, { name: 'change', type: 'double' },
        { name: 'price_change', type: 'double' }, { name: 'turnover_rate', type: 'double' },
        { name: 'create_time', type: 'timestamp' }, { name: 'update_time', type: 'timestamp' }
      ]
      await ddb.execute(`t = ${IDX_TBL}; delete from t where symbol='${sym}' and trade_date between ${sd} and ${ed}`)
      await ddb.insertRows('stock_zh_index_daily', IDX_COLS, rows)
      if (ddb.isConnected()) {
        const r2 = await ddb.execute(SELECT)
        if (Array.isArray(r2) && r2.length > 0) {
          const kline = toKline(r2)
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
