'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const klineRepo = require('../../dolphindb/kline-repository')

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

// 两级缓存，各自独立 key：
//   SPOT_RAW_KEY    —— aktools 原始行（中文列名）。与 /api/aktools/stock/spot 及启动预热 primeCache 共用，
//                     预热写入的就是这份数据，本模块只读不写形状，避免同 key 两种结构互相污染。
//   SPOT_MAPPED_KEY —— 映射后的列表，仅本模块使用，缓存它是为了避免每请求重复映射 5500+ 行。
const SPOT_RAW_KEY = 'aktools:stock:spot'
const SPOT_MAPPED_KEY = 'aktools:stock:spot:mapped'

async function getSpotList() {
  const mapped = cache.get(SPOT_MAPPED_KEY)
  if (mapped) return mapped
  // 优先复用预热/其它路由已缓存的原始数据，避免全市场快照重复冷调用（1.5~4s）
  const raw = cache.get(SPOT_RAW_KEY) || await aktools.getStockSpot()
  const list = (raw || []).map(mapSpotItem).filter(s => s.code)
  // 空结果不落缓存：上游被拦时返回空包，缓存会让首屏"无数据"固化一个 TTL 周期
  if (list.length) cache.set(SPOT_MAPPED_KEY, list, 60)
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

// K线数据（DolphinDB first → 东财/腾讯/Tushare 兜底 → 异步回填 DolphinDB）
// 进程内缓存 300s：K线是"看图必查"的重接口，且上游（东财被拦、腾讯会限流）单次耗时在
// 0.1s~8s 之间剧烈波动；没有缓存时每次打开图都会重新走一遍网络（实测同一区间第二次仍要 4s+）。
router.get('/:code/kline', async (req, res) => {
  try {
    const { code } = req.params
    const { period = 'daily', startDate, endDate, adjust = 'qfq' } = req.query
    const cacheKey = `stocks:kline:${code}:${period}:${adjust}:${startDate || ''}:${endDate || ''}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    // 1. DolphinDB first（daily 直接查；weekly/monthly/quarterly/yearly 从 daily_k 聚合）
    try {
      let ddbData
      if (period === 'daily') {
        ddbData = await klineRepo.getDailyK(code, startDate, endDate)
      } else {
        ddbData = await klineRepo.getKlineAggregated(code, startDate, endDate, period)
      }
      if (ddbData && ddbData.length > 0) {
        const kline = ddbData.map(m => ({
          date: m['日期'], open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
          high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
          volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
          turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
        }))
        cache.set(cacheKey, kline, 300)
        return ok(res, kline, '成功(缓存)')
      }
    } catch (e) {
      console.error('[stock] DolphinDB kline query failed, fallback to 东财:', e.message)
    }

    // 2. DolphinDB miss → 东财/Tushare（aktools 内含 Tushare 兜底）
    const raw = await aktools.getStockHistory({ symbol: code, period, adjust, start_date: startDate, end_date: endDate })
    const kline = (raw || []).map(m => ({
      date: m['日期'], open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
      high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
      volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
      turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
    }))

    // 3. 异步回填 DolphinDB（仅 daily，非阻塞——用户无感知地积累数据）
    if (period === 'daily' && raw && raw.length > 0) {
      klineRepo.insertDailyK(raw).catch(e => console.error('[stock] daily_k backfill failed:', e.message))
    }

    // 空结果不落缓存：上游被拦/限流时可能返回空数组，缓存会让 K 线图在 TTL 内一直空白，
    // 即使上游已恢复。与 /stock/indexSpot 的 cacheEmpty:false 策略保持一致。
    if (kline.length) cache.set(cacheKey, kline, 300)
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
