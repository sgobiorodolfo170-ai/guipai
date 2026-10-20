'use strict'

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const spotRepo = require('../../dolphindb/spot-repository')
const indexSpotRepo = require('../../dolphindb/index-spot-repository')
const converter = require('../converter')
const marketTime = require('../market-time')
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

// ---- 日期工具 ----
// 背景：DolphinDB 返回 DATE 为 '2026.10.15' 字符串，前端契约用 ISO；
// toISOString 在东八区凌晨会回退一天，故本地日期必须用 getFullYear/getMonth/getDate 手拼。

/** 任意日期形态（'2026-10-15'/'20261015'/'2026.10.15'/Date）→ ISO 'YYYY-MM-DD'；空/非法 → null */
function normDateISO(v) {
  const s = String(v == null ? '' : v).replace(/[^\d]/g, '')
  return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : null
}

/** 本地日期 ISO（不能用 toISOString：东八区凌晨会回退到前一天） */
function localISO(d = new Date()) {
  const p = x => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** ISO 日期 ± n 天（UTC 毫秒运算，避免本地时区偏移）；用于缺口区间的相邻日计算 */
function shiftDay(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86400000)
  const p = x => String(x).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`
}

/** 最近一个交易日（近似，无节假日历）：周末回退到周五；交易日 09:15 前快照仍属上一交易日。
 *  仅用于网络直返路径的快照日期标注与入库 trade_date——日期与数值同源，保证"日期-数值"对齐；
 *  真正的交易日历需要专门的日历源，此处用时间近似已足够（误差仅出现在节假日当天的标注上）。 */
function latestTradeDateISO(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (now.getHours() * 60 + now.getMinutes() < 9 * 60 + 15) d.setDate(d.getDate() - 1)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1)
  return localISO(d)
}

/** Promise 限时：超时 reject(new Error('timeout'))，供缺口回填这类非关键网络调用防拖死路由 */
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ])
}

/** stock_zh_index_daily 入库列定义（缺口回填与网络直返两处复用） */
const INDEX_DAILY_COLS = [
  { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
  { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
  { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
  { name: 'volume', type: 'double' }, { name: 'amount', type: 'double' },
  { name: 'amplitude', type: 'double' }, { name: 'change', type: 'double' },
  { name: 'price_change', type: 'double' }, { name: 'turnover_rate', type: 'double' },
  { name: 'create_time', type: 'timestamp' }, { name: 'update_time', type: 'timestamp' }
]

/** stock_index_spot 行 → /overview 前端契约（含快照日期：前端标题处展示，与指数数值对齐） */
function toOverview(rows) {
  return rows.map(m => ({
    code: m.symbol,
    name: indexName(m.symbol),
    price: Number(m.latest_price) || 0,
    change: Number(m.change_amount) || 0,
    changePercent: Number(m.pct_chg) || 0,
    date: normDateISO(m.trade_date) || ''
  }))
}

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

// 全市场快照写库节流（与 stock.js /realtime 同规则：60s 一次，避免全量重写放大）
let lastSpotWriteAt = 0

/** 行情源中文键行 → /hot 前端契约（盘中网络优先路径） */
function toHotRaw(rows) {
  return rows
    .filter(r => r['代码'])
    .map(r => ({
      code: r['代码'], name: r['名称'] || r['代码'],
      price: Number(r['最新价']) || 0,
      changePercent: Number(r['涨跌幅']) || 0,
      turnover: Number(r['成交额']) || 0
    }))
    .sort((a, b) => b.turnover - a.turnover)
}

/** 行情源中文键行 → /overview 前端契约（与 toOverview 输出同构） */
function rawToOverview(raw) {
  const snapDate = latestTradeDateISO()
  return raw.map(m => ({
    code: m['代码'] || m['指数代码'],
    name: m['名称'] || m['指数名称'],
    price: Number(m['最新价']) || 0,
    change: Number(m['涨跌额']) || 0,
    changePercent: Number(m['涨跌幅']) || 0,
    date: snapDate
  }))
}

// 市场概况 — 盘中网络优先（腾讯单请求含 OHLC / tqs），盘后 DB-first from stock_index_spot；
// DDB 不可用/入库失败时直接返回网络数据，避免空白。
router.get('/overview', async (req, res) => {
  const cacheKey = 'ddb:indexSpot:overview'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached)
  const ttl = marketTime.spotTtl()
  try {
    if (marketTime.isTradingTime()) {
      try {
        const raw = await aktools.getStockIndexSpot('沪深重要指数')
        if (raw && raw.length > 0) {
          const overview = rawToOverview(raw)
          cache.set(cacheKey, overview, ttl)
          const snapDate = latestTradeDateISO()
          if (ddb.isConnected()) {
            indexSpotRepo.insertIndexSpot(raw, snapDate).catch(e => console.error('[market] index spot 入库失败:', e.message))
          }
          return ok(res, overview, '成功(实时)')
        }
      } catch (e) {
        console.error('[market] overview 网络优先失败，降级库内:', e.message)
      }
    }
    let data = await indexSpotRepo.getIndexSpot()
    if (data && data.length > 0) {
      const overview = toOverview(data)
      cache.set(cacheKey, overview, ttl)
      return ok(res, overview)
    }
    // aktools → 直接返回网络数据（DDB 入库异步 best-effort，不阻塞展示）
    const raw = await aktools.getStockIndexSpot('沪深重要指数')
    if (raw && raw.length > 0) {
      // 快照日期取"最近交易日"近似（含 09:15 前回退），与数值同源，保证日期-数值对齐
      const snapDate = latestTradeDateISO()
      const directOverview = rawToOverview(raw)
      cache.set(cacheKey, directOverview, ttl)
      // 入库 best-effort：DDB 不可用时跳过；失败不影响展示
      if (ddb.isConnected()) {
        indexSpotRepo.insertIndexSpot(raw, snapDate).catch(e => console.error('[market] index spot 入库失败:', e.message))
      }
      return ok(res, directOverview)
    }
    ok(res, [])
  } catch (e) { errMsg(res, e.message) }
})

// 热门股票 — 盘中网络优先（腾讯全市场 ~1s），盘后 DB-first from stock_spot (按成交额排序)
router.get('/hot', async (req, res) => {
  const { limit = 20 } = req.query
  const cacheKey = 'ddb:spot:hot'
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached.slice(0, Number(limit)))
  const ttl = marketTime.spotTtl()
  try {
    if (marketTime.isTradingTime()) {
      try {
        const raw = await aktools.getStockSpot()
        if (raw && raw.length > 0) {
          const list = toHotRaw(raw)
          cache.set(cacheKey, list, ttl)
          // 写库节流 60s：insertSpot 为「删今日 + 全量插入」，5s 缓存过期即全量重写会放大写入
          if (ddb.isConnected() && Date.now() - lastSpotWriteAt > 60000) {
            lastSpotWriteAt = Date.now()
            spotRepo.insertSpotSafe(raw).catch(e => console.error('[market] hot 快照入库失败:', e.message))
          }
          return ok(res, list.slice(0, Number(limit)), '成功(实时)')
        }
      } catch (e) {
        console.error('[market] hot 网络优先失败，降级库内:', e.message)
      }
    }
    let data = await spotRepo.getSpot()
    if (data && data.length > 0) {
      const list = toHot(data)
      cache.set(cacheKey, list, ttl)
      return ok(res, list.slice(0, Number(limit)))
    }
    // aktools → write → re-read
    const raw = await aktools.getStockSpot()
    if (raw && raw.length > 0) {
      await spotRepo.insertSpotSafe(raw)
      data = await spotRepo.getSpot()
      if (data && data.length > 0) {
        const list = toHot(data)
        cache.set(cacheKey, list, ttl)
        return ok(res, list.slice(0, Number(limit)), '成功(已入库)')
      }
    }

    // 上游全挂 → 从 daily_k_raw 派生收盘快照兜底
    const derived = await spotRepo.deriveFromRaw()
    if (derived > 0) {
      data = await spotRepo.getSpot()
      if (data && data.length > 0) {
        const list = toHot(data)
        cache.set(cacheKey, list, ttl)
        return ok(res, list.slice(0, Number(limit)), '成功(daily_k_raw 派生快照)')
      }
    }
    ok(res, [])
  } catch (e) { errMsg(res, e.message) }
})

/** 合并库内日K与补拉日K：同日期库内优先，按日期升序。
 *  用途见 /index-kline 路由头注释：tradeinsight 分区下界 2024-01-01，更早的补拉行入不了库，
 *  只能与库内行在响应层合并，深历史才不会在"能取到但存不下"上反复丢。 */
function mergeDailyRows(dbRows, fetchedRows) {
  const byDate = new Map()
  for (const r of fetchedRows) {
    const d = normDateISO(r['日期'])
    if (d) byDate.set(d, r)
  }
  for (const r of dbRows) {
    const d = normDateISO(r['日期'])
    if (d) byDate.set(d, r) // 同日期库内值覆盖补拉值（正常情况下两者同源同值）
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(e => e[1])
}

/** ISO 日期 → 所在周的周一（UTC 运算避免时区偏移）；周K 分组键 */
function isoWeekStart(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const back = (dt.getUTCDay() + 6) % 7 // 距周一天数（getUTCDay：0=周日）
  const mon = new Date(dt.getTime() - back * 86400000)
  const p = x => String(x).padStart(2, '0')
  return `${mon.getUTCFullYear()}-${p(mon.getUTCMonth() + 1)}-${p(mon.getUTCDate())}`
}

/** 日K行（中文键，升序）→ 周K/月K行（中文键）：日期取组内首个交易日、开=首、收=末、
 *  高/低=极值、量/额=求和——对齐 kline-repository.getKlineAggregated 的 first/last/max/min/sum 口径。
 *  在 JS 端聚合而非 DolphinDB group-by 的原因：深历史行不在库内（分区下界），
 *  group-by 只能看到库内部分，覆盖不到合并后的数据。 */
function aggregateDailyRows(rows, period) {
  const isWeekly = period === 'weekly'
  const groups = new Map()
  for (const r of rows) {
    const iso = normDateISO(r['日期'])
    if (!iso) continue
    const key = isWeekly ? isoWeekStart(iso) : iso.slice(0, 7)
    const g = groups.get(key)
    if (g) g.push({ iso, r })
    else groups.set(key, [{ iso, r }])
  }
  const out = []
  for (const g of groups.values()) {
    let high = 0, low = 0, volume = 0, amount = 0
    g.forEach(({ r }, i) => {
      const h = Number(r['最高']) || 0
      const l = Number(r['最低']) || 0
      if (i === 0) { high = h; low = l } else { if (h > high) high = h; if (l < low) low = l }
      volume += Number(r['成交量']) || 0
      amount += Number(r['成交额']) || 0
    })
    out.push({
      '日期': g[0].iso,
      '开盘': Number(g[0].r['开盘']) || 0,
      '收盘': Number(g[g.length - 1].r['收盘']) || 0,
      '最高': high, '最低': low, '成交量': volume, '成交额': amount
    })
  }
  return out
}

// 指数K线 — DB-first from stock_zh_index_daily（覆盖检测 + 缺口补拉 + 响应层合并 + 周期聚合）。
//
// 关键约束（本次重写发现，理解它才能改对这个路由）：
//   dfs://tradeinsight 建库脚本 ensureSchema 以 startYear=2024 起分区，分区下界即 2024-01-01；
//   对更早 trade_date 的行 tableInsert 不报错但会被静默丢弃（实测 1998 年起的 644 行补拉写入后
//   表行数零增长）。存量库无法靠 createPartitionedTable 扩范围修复（有 existsTable 守卫），
//   扩分区属不可逆运维操作须单独评审——故不动库结构，在响应层解决：
//   1) 覆盖检测：先读库判窗口内 min/max，对头/尾缺口用日K源补拉（旧实现"读到非空就返回"，
//      库内只有一小段时头/尾缺口永不补拉，历史长期停在旧日期）；
//   2) 响应层合并：库内行 + 本轮补拉行按日期合并（同日期库内优先，升序）——深历史（<2024）
//      即使入不了库也能完整展示；库只持久化可落库的 >=2024 部分（丢行无害，仅重复拉取）；
//   3) 周/月K 由合并后的日线在 JS 端聚合（口径对齐 kline-repository.getKlineAggregated），
//      绝不落库——旧实现曾把聚合行写进日线表造成数据污染；
//   4) 补拉 best-effort：源失败/超时不阻塞返回，短 TTL 缓存稍后自动重试；仅当源失败或
//      库与补拉都为空时，才落到网络直返兜底。
router.get('/index-kline', async (req, res) => {
  try {
    const { code, period = 'daily', startDate, endDate } = req.query
    if (!code) return errMsg(res, '缺少 code 参数')
    // 净化 query 拼进 DolphinDB 脚本前必须过白名单（脚本无参数绑定）
    // startDate 缺省给默认起始日而非留空：safeDate(undefined) 返回 null 会让下方
    // 校验直接判"参数不合法"，而前端并不总是显式带 startDate。
    const sym = safeSymbol(code)
    const sdISO = normDateISO(startDate) || '1990-01-01'
    const edISO = normDateISO(endDate) || localISO()
    const sd = safeDate(sdISO)
    const ed = safeDate(edISO)
    if (!sym || !sd || !ed) return errMsg(res, '参数不合法')
    const cacheKey = `ddb:index-kline:${sym}:${period}:${startDate || ''}:${endDate || ''}`
    const cached = cache.get(cacheKey)
    if (cached) return ok(res, cached, '成功(缓存)')

    const IDX_TBL = `loadTable("dfs://tradeinsight", "stock_zh_index_daily")`
    const SELECT = `select trade_date as 日期, open as 开盘, close as 收盘, high as 最高, low as 最低,` +
      ` volume as 成交量, amount as 成交额, turnover_rate as 换手率, change as 涨跌幅` +
      ` from ${IDX_TBL} where symbol='${sym}'`
    const toKline = (rows) => rows.map(m => ({
      date: String(m['日期']).replace(/\./g, '-'), open: Number(m['开盘']) || 0, close: Number(m['收盘']) || 0,
      high: Number(m['最高']) || 0, low: Number(m['最低']) || 0,
      volume: Number(m['成交量']) || 0, amount: Number(m['成交额']) || 0,
      turnover: Number(m['换手率']) || 0, pctChg: Number(m['涨跌幅']) || 0
    }))

    /** 网络补拉一个缺口区间 [gs, ge]（ISO，闭区间）。
     *  返回 { ok, rows }：
     *   - ok=false：源失败/超时（调用方按"未补齐"短 TTL 缓存，稍后自动重试）；
     *   - ok=true：源成功应答，rows 为区间内取到的日K行（可能为空——如区间尚未成为交易日，
     *     此时也返回 ok=true，避免对"日历上无数据"的区间做无意义重试风暴）。
     *  rows 无论是否入库成功都参与本次响应：tradeinsight 分区下界是 2024-01-01，更早的行
     *  入库会被静默丢弃（原因见路由头注释），深历史只能靠响应层合并兜住。
     *  写库（delete+insert）单独 try/catch：写失败只降级为"未缓存"、不能丢已取到的行，
     *  更不能把整次补拉判为源失败。只回填日K：非 daily 语义由上层聚合承担。 */
    const backfillGap = async (gs, ge) => {
      if (!(gs <= ge)) return { ok: true, rows: [] }
      try {
        const fetched = await withTimeout(aktools.getIndexDailyData({
          symbol: code, period: 'daily',
          start_date: gs.replace(/-/g, ''), end_date: ge.replace(/-/g, '')
        }), 8000)
        if (!Array.isArray(fetched) || !fetched.length) return { ok: true, rows: [] }
        // 防御：只取缺口区间内的行（源端理论上已按区间过滤，双保险防越界覆盖已有数据）
        const inGap = fetched.filter(r => {
          const d = normDateISO(r['日期'])
          return d && d >= gs && d <= ge
        })
        if (inGap.length && ddb.isConnected()) {
          try {
            const conv = converter.convertIndexDaily(inGap, sym)
            await ddb.execute(`t = ${IDX_TBL}; delete from t where symbol='${sym}' and trade_date between ${safeDate(gs)} and ${safeDate(ge)}`)
            await ddb.insertRows('stock_zh_index_daily', INDEX_DAILY_COLS, conv)
          } catch (e) {
            // 写库失败不丢数据：本次响应仍合并 inGap；>=2024 部分下轮请求会重新触发补拉
            console.warn(`[market] index-kline 回填入库失败 ${sym} ${gs}~${ge}: ${e.message}`)
          }
        }
        return { ok: true, rows: inGap }
      } catch (e) {
        console.warn(`[market] index-kline 缺口补拉失败 ${sym} ${gs}~${ge}: ${e.message}`)
        return { ok: false, rows: [] }
      }
    }

    const isWeekly = period === 'weekly'
    const isMonthly = period === 'monthly'

    // 1. DB 路径：覆盖检测 → 缺口补拉 → 库内行与补拉行合并 → 读取（daily）或端上聚合（weekly/monthly）
    if (ddb.isConnected()) {
      let complete = true
      const fetchedRows = [] // 本轮补拉到的日K行（含入不了库的 <2024 深历史）
      try {
        const cov = await ddb.execute(
          `select min(trade_date) as mn, max(trade_date) as mx from ${IDX_TBL}` +
          ` where symbol='${sym}' and trade_date between ${sd} and ${ed}`
        )
        const mn = cov && cov[0] ? normDateISO(cov[0].mn) : null
        const mx = cov && cov[0] ? normDateISO(cov[0].mx) : null
        if (!mn || !mx) {
          // 窗口内无任何数据：整窗补拉（首次使用该指数或窗口完全在库外）
          const r = await backfillGap(sdISO, edISO)
          complete = r.ok
          fetchedRows.push(...r.rows)
        } else {
          // 头/尾缺口各自补拉；任一缺口源失败都按"未补齐"处理（短 TTL 缓存稍后重试）
          if (mn > sdISO) {
            const r = await backfillGap(sdISO, shiftDay(mn, -1))
            complete = r.ok && complete
            fetchedRows.push(...r.rows)
          }
          if (mx < edISO) {
            const r = await backfillGap(shiftDay(mx, 1), edISO)
            complete = r.ok && complete
            fetchedRows.push(...r.rows)
          }
        }
      } catch (e) {
        console.error('[market] index-kline 覆盖检测失败:', e.message)
        complete = false
      }

      const dbRows = await ddb.execute(`${SELECT} and trade_date between ${sd} and ${ed} order by trade_date`)
      const daily = mergeDailyRows(Array.isArray(dbRows) ? dbRows : [], fetchedRows)
      if (daily.length > 0) {
        // 周/月K：由合并后的日线在端上聚合（不信任/不写入聚合行）
        const kline = toKline(isWeekly || isMonthly ? aggregateDailyRows(daily, period) : daily)
        cache.set(cacheKey, kline, complete ? 300 : 30)
        return ok(res, kline, complete ? '成功' : '成功(部分覆盖)')
      }
      // 库内与补拉均为空（该指数无数据或补拉全失败）→ 落到网络直返兜底
    }

    // 2. 数据源直返：DDB 不可用，或库内与补拉都为空。
    //    一律按日K取数（源端周/月聚合口径不可控且未必支持），周/月由 aggregateDailyRows 端上聚合；
    //    DDB 可用时把日K补一次入库（best-effort，不阻塞返回；<2024 行会被静默丢弃，无副作用）。
    const raw = await aktools.getIndexDailyData({
      symbol: code,
      period: 'daily',
      start_date: sdISO.replace(/-/g, ''),
      end_date: edISO.replace(/-/g, '')
    })
    if (raw && raw.length > 0) {
      if (ddb.isConnected()) {
        try {
          const rows = converter.convertIndexDaily(raw, sym)
          await ddb.execute(`t = ${IDX_TBL}; delete from t where symbol='${sym}' and trade_date between ${sd} and ${ed}`)
          await ddb.insertRows('stock_zh_index_daily', INDEX_DAILY_COLS, rows)
        } catch (e) { console.error('[market] index-kline 入库失败:', e.message) }
      }
      // 直接映射返回网络数据（DDB 入库是加分项，不应阻塞展示）
      const kline = toKline(isWeekly || isMonthly ? aggregateDailyRows(raw, period) : raw)
      cache.set(cacheKey, kline, 300)
      return ok(res, kline)
    }

    res.json({ code: 503, msg: '数据不可用', data: [] })
  } catch (e) {
    if (e.retryAfterSec) return res.json({ code: 429, msg: `${e.message}，请约 ${e.retryAfterSec} 秒后重试`, data: { retryAfterSec: e.retryAfterSec } })
    errMsg(res, e.message)
  }
})

module.exports = router
