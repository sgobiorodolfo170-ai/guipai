'use strict'

/**
 * 涨跌停统计路由 —— 已从 sql.js 迁移至 DolphinDB。
 *
 * 设计原则：
 *   - DolphinDB 只做扫描/聚合/分组（iif/sum/count/avg/max/group by），发挥时序库优势；
 *   - 比率(含除零)、百分比(窗口总数)、次日自连接、时间/封单分桶、分位数等在 JS 侧完成，
 *     规避 DolphinDB 对 NULLIF/窗口函数/CTE/date(t,'+1 day') 的方言差异；
 *   - DolphinDB DATE/TIMESTAMP 以字符串返回（2025.09.24），统一规整为 ISO。
 *
 * 数据来源：loadTable('dfs://tradeinsight','stock_limit_pool') 等 DFS 表。
 */

const express = require('express')
const ddb = require('../../dolphindb/client')
const cache = require('../cache')
const aktools = require('../aktools')
const converter = require('../converter')
const { safeDate } = require('../../dolphindb/params')

const router = express.Router()

const TBL = "loadTable('dfs://tradeinsight','stock_limit_pool')"
const TBL_PLATE = "loadTable('dfs://tradeinsight','plate_market_quotation')"
const TBL_INDEX = "loadTable('dfs://tradeinsight','stock_zh_index_daily')"
const TBL_ZT_PREV = "loadTable('dfs://tradeinsight','zt_pool_previous')"

function ok(res, data) { res.json({ code: 200, msg: '成功', data }) }
function err(res, msg) { res.json({ code: 500, msg }) }

// '2025-09-24' -> '2025.09.24' (DolphinDB DATE 字面量)
function dd(s) { return String(s || '').replace(/-/g, '.') }
// ISO 日期加减天数 -> ISO 'YYYY-MM-DD'
function addDays(iso, n) {
  const d = new Date((iso || '') + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
// DolphinDB 时间字符串 -> ISO
function norm(v) {
  if (typeof v === 'string') {
    if (/^\d{4}\.\d{2}\.\d{2}$/.test(v)) return v.replace(/\./g, '-')
    if (/^\d{4}\.\d{2}\.\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(v)) return v.replace(/(\d{4})\.(\d{2})\.(\d{2})/, '$1-$2-$3')
  }
  return v
}
// 鲁棒提取行：兼容 行数组 / {columns,rows} / 列式对象
function toRows(result) {
  if (result == null) return []
  if (Array.isArray(result)) return result
  if (result.rows && result.columns) {
    return result.rows.map(r => { const o = {}; result.columns.forEach((c, i) => o[c] = r[i]); return o })
  }
  if (typeof result === 'object') {
    const keys = Object.keys(result)
    if (keys.length && Array.isArray(result[keys[0]])) {
      const n = result[keys[0]].length
      const rows = []
      for (let i = 0; i < n; i++) { const o = {}; keys.forEach(k => o[k] = result[k][i]); rows.push(o) }
      return rows
    }
  }
  return [result]
}
function normRows(rows) { return rows.map(r => { for (const k in r) r[k] = norm(r[k]); return r }) }
async function list(script) { return normRows(toRows(await ddb.execute(script))) }
async function one(script) { const rs = await list(script); return rs.length ? rs[0] : null }

// 数值化（DolphinDB 可能返回 null/number）
const N = v => (v == null ? 0 : Number(v))
// 百分比：denom=0 返回 0（对应原 SQL CASE ... ELSE 0）
const pct0 = (n, d) => (!d || d === 0) ? 0 : Math.round(N(n) * 100 / N(d) * 100) / 100
// 百分比：denom=0 返回 null（对应原 SQL NULLIF / 除零）
const pctN = (n, d) => (!d || d === 0) ? null : Math.round(N(n) * 100 / N(d) * 100) / 100
// 比率：denom=0 返回 null
const ratioN = (n, d) => (!d || d === 0) ? null : Math.round(N(n) / N(d) * 100) / 100

// ---- 基础统计 ----
router.get('/basic/:date', async (req, res) => {
  try {
    const { date } = req.params
    const cached = cache.get(`stats:basic:${date}`)
    if (cached) return ok(res, cached)
    const r = await one(`select
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_UP' and last_limit_time<='09:26:00',1,0)) as limitUpOneWordCount,
      sum(iif(data_type=='LIMIT_UP' and blast_times>0,1,0)) as limitUpBlastResealCount,
      max(iif(data_type=='LIMIT_UP',continuous_limit,0)) as limitUpMaxContinuous,
      sum(iif(data_type=='LIMIT_UP' and continuous_limit>=2,1,0)) as limitUpCont2,
      sum(iif(data_type=='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), 0)) as limitUpTotalSealFunds,
      avg(iif(data_type=='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), null)) as limitUpAvgSealFunds,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      sum(iif(data_type=='LIMIT_DOWN' and last_limit_time<='09:26:00',1,0)) as limitDownOneWordCount,
      sum(iif(data_type=='LIMIT_DOWN' and blast_times>0,1,0)) as limitDownOpenCount,
      max(iif(data_type=='LIMIT_DOWN',continuous_limit,0)) as limitDownMaxContinuous,
      sum(iif(data_type=='LIMIT_DOWN' and continuous_limit>=2,1,0)) as limitDownCont2,
      sum(iif(data_type=='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), 0)) as limitDownTotalSealFunds,
      avg(iif(data_type=='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), null)) as limitDownAvgSealFunds,
      sum(iif(isNull(total_market_value),0,total_market_value)) as totalMarketValue
      from ${TBL} where trade_date=${dd(date)}`)
    const row = {
      tradeDate: date,
      limitUpCount: r && r.limitUpCount, limitUpOneWordCount: r && r.limitUpOneWordCount,
      limitUpBlastResealCount: r && r.limitUpBlastResealCount, limitUpMaxContinuous: r && r.limitUpMaxContinuous,
      limitUpContinuousRate: pct0(r && r.limitUpCont2, r && r.limitUpCount),
      limitUpTotalSealFunds: r && r.limitUpTotalSealFunds, limitUpAvgSealFunds: r && r.limitUpAvgSealFunds,
      limitDownCount: r && r.limitDownCount, limitDownOneWordCount: r && r.limitDownOneWordCount,
      limitDownOpenCount: r && r.limitDownOpenCount, limitDownMaxContinuous: r && r.limitDownMaxContinuous,
      limitDownContinuousRate: pct0(r && r.limitDownCont2, r && r.limitDownCount),
      limitDownTotalSealFunds: r && r.limitDownTotalSealFunds, limitDownAvgSealFunds: r && r.limitDownAvgSealFunds,
      totalMarketValue: r && r.totalMarketValue,
      limitUpDownRatio: ratioN(r && r.limitUpCount, r && r.limitDownCount)
    }
    cache.set(`stats:basic:${date}`, row, 300)
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/basic/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const rows = await list(`select trade_date as tradeDate,
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_UP' and first_limit_time<='09:26:00',1,0)) as limitUpOneWordCount,
      sum(iif(data_type=='LIMIT_UP' and blast_times>0,1,0)) as limitUpBlastResealCount,
      max(iif(data_type=='LIMIT_UP',continuous_limit,0)) as limitUpMaxContinuous,
      sum(iif(data_type=='LIMIT_UP' and continuous_limit>=2,1,0)) as limitUpCont2,
      sum(iif(data_type=='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), 0)) as limitUpTotalSealFunds,
      avg(iif(data_type=='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), null)) as limitUpAvgSealFunds,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      sum(iif(data_type=='LIMIT_DOWN' and blast_times>0,1,0)) as limitDownOpenCount,
      max(iif(data_type=='LIMIT_DOWN',continuous_limit,0)) as limitDownMaxContinuous,
      sum(iif(data_type=='LIMIT_DOWN' and continuous_limit>=2,1,0)) as limitDownCont2,
      sum(iif(data_type=='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), 0)) as limitDownTotalSealFunds,
      sum(iif(isNull(total_market_value),0,total_market_value)) as totalMarketValue
      from ${TBL} where trade_date between ${dd(startDate)} and ${dd(endDate)} group by trade_date order by trade_date`)
    rows.forEach(r => {
      r.limitUpContinuousRate = pct0(r.limitUpCont2, r.limitUpCount)
      r.limitDownContinuousRate = pct0(r.limitDownCont2, r.limitDownCount)
      r.limitUpDownRatio = ratioN(r.limitUpCount, r.limitDownCount)
      delete r.limitUpCont2; delete r.limitDownCont2
    })
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 涨跌停板详细统计 ----
router.get('/detail/:date', async (req, res) => {
  try {
    const { date } = req.params
    const dataType = req.query.dataType
    const isUp = dataType === 'LIMIT_UP'
    const extra = isUp
      ? `sum(iif(blast_times>0,1,0)) as blastAndResealCount, 0 as openBoardCount, 0 as avgDynamicPe`
      : `0 as blastAndResealCount, sum(iif(blast_times>0,1,0)) as openBoardCount, avg(iif(isNull(dynamic_pe),0,dynamic_pe)) as avgDynamicPe`
    const r = await one(`select count(*) as totalCount,
      sum(iif(blast_times==0,1,0)) as oneWordBoardCount, max(continuous_limit) as maxContinuousLimit,
      sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds,
      avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, ${extra}
      from ${TBL} where trade_date=${dd(date)} and data_type='${dataType}'`)
    if (r) { r.tradeDate = date; r.dataType = dataType }
    ok(res, r)
  } catch (e) { err(res, e.message) }
})

router.get('/detail/range', async (req, res) => {
  try {
    const { startDate, endDate, dataType } = req.query
    const isUp = dataType === 'LIMIT_UP'
    const extra = isUp
      ? `sum(iif(blast_times>0,1,0)) as blastAndResealCount, 0 as openBoardCount, 0 as avgDynamicPe`
      : `0 as blastAndResealCount, sum(iif(blast_times>0,1,0)) as openBoardCount, avg(iif(isNull(dynamic_pe),0,dynamic_pe)) as avgDynamicPe`
    const rows = await list(`select trade_date as tradeDate, count(*) as totalCount,
      sum(iif(blast_times==0,1,0)) as oneWordBoardCount, max(continuous_limit) as maxContinuousLimit,
      sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds,
      avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, ${extra}
      from ${TBL} where trade_date between ${dd(startDate)} and ${dd(endDate)} and data_type='${dataType}' group by trade_date order by trade_date`)
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 涨跌停对比分析 ----
router.get('/comparison/:date', async (req, res) => {
  try {
    const { date } = req.params
    const r = await one(`select
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      sum(iif(data_type=='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), 0)) as limitUpTotalFunds,
      sum(iif(data_type=='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), 0)) as limitDownTotalFunds,
      sum(iif(data_type=='LIMIT_UP' and blast_times==0,1,0)) as limitUpOneWord,
      sum(iif(data_type=='LIMIT_DOWN' and blast_times==0,1,0)) as limitDownOneWord,
      sum(iif(data_type=='LIMIT_UP' and continuous_limit>=2,1,0)) as limitUpCont2,
      sum(iif(data_type=='LIMIT_DOWN' and continuous_limit>=2,1,0)) as limitDownCont2
      from ${TBL} where trade_date=${dd(date)}`)
    const row = {
      tradeDate: date,
      limitUpCount: r && r.limitUpCount, limitDownCount: r && r.limitDownCount,
      limitUpTotalFunds: r && r.limitUpTotalFunds, limitDownTotalFunds: r && r.limitDownTotalFunds,
      limitUpOneWordRate: pctN(r && r.limitUpOneWord, r && r.limitUpCount),
      limitDownOneWordRate: pctN(r && r.limitDownOneWord, r && r.limitDownCount),
      limitUpContinuousRate: pctN(r && r.limitUpCont2, r && r.limitUpCount),
      limitDownContinuousRate: pctN(r && r.limitDownCont2, r && r.limitDownCount)
    }
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/comparison/range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const rows = await list(`select trade_date as tradeDate,
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      sum(iif(data_type=='LIMIT_UP', iif(isNull(limit_funds),0,limit_funds), 0)) as limitUpTotalFunds,
      sum(iif(data_type=='LIMIT_DOWN', iif(isNull(limit_funds),0,limit_funds), 0)) as limitDownTotalFunds,
      sum(iif(data_type=='LIMIT_UP' and blast_times==0,1,0)) as limitUpOneWord,
      sum(iif(data_type=='LIMIT_DOWN' and blast_times==0,1,0)) as limitDownOneWord,
      sum(iif(data_type=='LIMIT_UP' and continuous_limit>=2,1,0)) as limitUpCont2,
      sum(iif(data_type=='LIMIT_DOWN' and continuous_limit>=2,1,0)) as limitDownCont2
      from ${TBL} where trade_date between ${dd(startDate)} and ${dd(endDate)} group by trade_date order by trade_date`)
    rows.forEach(r => {
      r.limitUpOneWordRate = pctN(r.limitUpOneWord, r.limitUpCount)
      r.limitDownOneWordRate = pctN(r.limitDownOneWord, r.limitDownCount)
      r.limitUpContinuousRate = pctN(r.limitUpCont2, r.limitUpCount)
      r.limitDownContinuousRate = pctN(r.limitDownCont2, r.limitDownCount)
      delete r.limitUpOneWord; delete r.limitDownOneWord; delete r.limitUpCont2; delete r.limitDownCont2
    })
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 质量分析 ----
router.get('/quality/:date', async (req, res) => {
  try {
    const { date } = req.params
    const dataType = req.query.dataType
    const isUp = dataType === 'LIMIT_UP'
    const extra = isUp
      ? `sum(iif(blast_times>0,1,0)) as blastCount, sum(iif(blast_times>0,1,0)) as resealCount, avg(iif(blast_times>0,blast_times,null)) as avgBlastTimes, 0 as avgDynamicPe, 0 as lowPeRaw, 0 as openBoardCount, 0 as avgOpenTimes`
      : `0 as blastCount, 0 as resealCount, 0 as avgBlastTimes, avg(iif(isNull(dynamic_pe),0,dynamic_pe)) as avgDynamicPe, sum(iif(not isNull(dynamic_pe) and dynamic_pe>0 and dynamic_pe<20,1,0)) as lowPeRaw, sum(iif(blast_times>0,1,0)) as openBoardCount, avg(iif(blast_times>0,blast_times,null)) as avgOpenTimes`
    const r = await one(`select count(*) as totalCount,
      sum(iif(blast_times==0,1,0)) as oneWordRaw,
      sum(iif(not isNull(first_limit_time) and first_limit_time<'10:30:00',1,0)) as earlyRaw,
      sum(iif(not isNull(first_limit_time) and first_limit_time>='10:30:00' and first_limit_time<'14:30:00',1,0)) as noonRaw,
      sum(iif(not isNull(first_limit_time) and first_limit_time>='14:30:00',1,0)) as lateRaw,
      avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealStrength,
      sum(iif(iif(isNull(limit_funds),0,limit_funds)>10000000,1,0)) as strongRaw, ${extra}
      from ${TBL} where trade_date=${dd(date)} and data_type='${dataType}'`)
    const tc = r && N(r.totalCount)
    const row = {
      tradeDate: date, dataType,
      oneWordBoardRate: pctN(r && r.oneWordRaw, tc), earlyLimitRate: pctN(r && r.earlyRaw, tc),
      noonLimitRate: pctN(r && r.noonRaw, tc), lateLimitRate: pctN(r && r.lateRaw, tc),
      avgSealStrength: r && r.avgSealStrength, strongSealRate: pctN(r && r.strongRaw, tc),
      blastCount: r && r.blastCount, resealCount: r && r.resealCount, avgBlastTimes: r && r.avgBlastTimes,
      avgDynamicPe: r && r.avgDynamicPe, lowPeRate: pctN(r && r.lowPeRaw, tc),
      openBoardCount: r && r.openBoardCount, avgOpenTimes: r && r.avgOpenTimes
    }
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

// ---- 行业分布 ----
router.get('/industry/:date', async (req, res) => {
  try {
    const { date } = req.params
    const dataType = req.query.dataType
    const rows = await list(`select iif(isNull(industry),'未知行业',industry) as industry, count(*) as count,
      avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, avg(total_market_value) as avgMarketValue
      from ${TBL} where trade_date=${dd(date)} and data_type='${dataType}'
      group by iif(isNull(industry),'未知行业',industry) order by count desc`)
    const total = rows.reduce((s, r) => s + N(r.count), 0)
    let rank = 1
    rows.forEach(r => { r.percentage = pctN(r.count, total); r.rank = rank++ })
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

router.get('/industry/trend/:date', async (req, res) => {
  try {
    const { date } = req.params
    const start = addDays(date, -7)
    const rows = await list(`select iif(isNull(industry),'未知行业',industry) as industry, trade_date as tradeDate,
      count(*) as count, sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount, sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount
      from ${TBL} where trade_date between ${dd(start)} and ${dd(date)}
      group by iif(isNull(industry),'未知行业',industry), trade_date order by industry, trade_date`)
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 连板分布 ----
router.get('/continuous/distribution/:date', async (req, res) => {
  try {
    const { date } = req.params
    const dataType = req.query.dataType
    const rows = await list(`select continuous_limit as continuousLimit, count(*) as count,
      avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds, avg(total_market_value) as avgMarketValue
      from ${TBL} where trade_date=${dd(date)} and data_type='${dataType}' group by continuous_limit order by continuous_limit`)
    const total = rows.reduce((s, r) => s + N(r.count), 0)
    rows.forEach(r => { r.percentage = pctN(r.count, total) })
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

router.get('/continuous-success-rate', async (req, res) => {
  try {
    const { startDate, endDate, dataType } = req.query
    const endPlus1 = addDays(endDate, 1)
    // 当日(范围)目标股
    const t1 = await list(`select stock_code, trade_date, continuous_limit as continuousLimit
      from ${TBL} where trade_date between ${dd(startDate)} and ${dd(endDate)} and data_type='${dataType}' and continuous_limit>=2`)
    // 范围+次日同类型股票集合，用于判定"次日继续"
    const t2 = await list(`select stock_code, trade_date as d from ${TBL}
      where trade_date between ${dd(startDate)} and ${dd(endPlus1)} and data_type='${dataType}'`)
    const present = new Set(t2.map(r => `${r.stock_code}|${r.d}`))
    const map = new Map()
    for (const r of t1) {
      const key = r.continuousLimit
      const o = map.get(key) || { continuousLimit: key, totalCount: 0, successCount: 0 }
      o.totalCount++
      const nextD = norm(r.trade_date) ? addDays(norm(r.trade_date), 1) : null
      if (nextD && present.has(`${r.stock_code}|${dd(nextD)}`)) o.successCount++
      map.set(key, o)
    }
    const rows = [...map.values()].sort((a, b) => N(a.continuousLimit) - N(b.continuousLimit))
    rows.forEach(r => { r.successRate = pct0(r.successCount, r.totalCount) })
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 时间分布 ----
const TIME_BUCKETS = [
  ['09:30-10:00'], ['10:00-10:30'], ['10:30-11:00'], ['11:00-11:30'], ['11:30-13:00'],
  ['13:00-13:30'], ['13:30-14:00'], ['14:00-14:30'], ['14:30-15:00'], ['15:00-15:00']
]
function bucketOf(t) {
  if (!t || t < '09:30:00') return '09:30-10:00'
  if (t < '10:00:00') return '09:30-10:00'
  if (t < '10:30:00') return '10:00-10:30'
  if (t < '11:00:00') return '10:30-11:00'
  if (t < '11:30:00') return '11:00-11:30'
  if (t < '13:00:00') return '11:30-13:00'
  if (t < '13:30:00') return '13:00-13:30'
  if (t < '14:00:00') return '13:30-14:00'
  if (t < '14:30:00') return '14:00-14:30'
  if (t < '15:00:00') return '14:30-15:00'
  return '15:00-15:00'
}
router.get('/time/distribution/:date', async (req, res) => {
  try {
    const { date } = req.params
    const dataType = req.query.dataType
    const rows = await list(`select first_limit_time as t from ${TBL}
      where trade_date=${dd(date)} and data_type='${dataType}' and not isNull(first_limit_time)`)
    const counts = new Map(TIME_BUCKETS.map(([b]) => [b, 0]))
    let total = 0
    for (const r of rows) { const b = bucketOf(r.t); counts.set(b, counts.get(b) + 1); total++ }
    const out = TIME_BUCKETS.map(([b]) => ({ timeRange: b, count: counts.get(b), percentage: pctN(counts.get(b), total) }))
    ok(res, out)
  } catch (e) { err(res, e.message) }
})

// ---- 封单强度分布 ----
function sealRange(f) {
  const v = N(f)
  if (!v) return '无封单'
  if (v < 1000000) return '0-100万'
  if (v < 5000000) return '100-500万'
  if (v < 10000000) return '500-1000万'
  if (v < 50000000) return '1000-5000万'
  if (v < 100000000) return '5000万-1亿'
  return '1亿以上'
}
const SEAL_ORDER = ['无封单', '0-100万', '100-500万', '500-1000万', '1000-5000万', '5000万-1亿', '1亿以上']
router.get('/seal-strength/:date', async (req, res) => {
  try {
    const { date } = req.params
    const dataType = req.query.dataType
    const rows = await list(`select limit_funds as f from ${TBL} where trade_date=${dd(date)} and data_type='${dataType}'`)
    const counts = new Map(SEAL_ORDER.map(s => [s, 0]))
    let total = 0
    for (const r of rows) { const s = sealRange(r.f); counts.set(s, counts.get(s) + 1); total++ }
    const out = SEAL_ORDER.map(s => ({ range: s, count: counts.get(s), percentage: pctN(counts.get(s), total) }))
    ok(res, out)
  } catch (e) { err(res, e.message) }
})

// ---- 跌停反弹分析（次日自连接在 JS 侧完成）----
async function reboundBase(date) {
  const next = addDays(date, 1)
  const day1 = await list(`select stock_code, continuous_limit as cl, industry, dynamic_pe as pe
    from ${TBL} where trade_date=${dd(date)} and data_type='LIMIT_DOWN'`)
  const day2 = await list(`select stock_code, increase_rate as ir from ${TBL} where trade_date=${dd(next)}`)
  const nextMap = new Map()
  for (const r of day2) { if (r.stock_code != null && !nextMap.has(r.stock_code)) nextMap.set(r.stock_code, N(r.ir)) }
  return { day1, nextMap }
}
function reboundStats(rows, nextMap) {
  const total = rows.length
  let rebound = 0, sum = 0, cnt = 0
  for (const r of rows) {
    const ir = nextMap.get(r.stock_code)
    if (ir != null && ir > 0) { rebound++; sum += ir; cnt++ }
  }
  return { totalLimitDownCount: total, reboundCount: rebound, avgReboundIncrease: cnt ? Math.round(sum / cnt * 10000) / 10000 : null }
}
router.get('/rebound/:date', async (req, res) => {
  try {
    const { date } = req.params
    const { day1, nextMap } = await reboundBase(date)
    ok(res, { tradeDate: date, ...reboundStats(day1, nextMap) })
  } catch (e) { err(res, e.message) }
})
router.get('/rebound/consecutive/:date', async (req, res) => {
  try {
    const { date } = req.params
    const { day1, nextMap } = await reboundBase(date)
    const g = new Map()
    for (const r of day1) { const k = r.cl; if (!g.has(k)) g.set(k, []); g.get(k).push(r) }
    const rows = [...g.entries()].sort((a, b) => N(a[0]) - N(b[0])).map(([k, rs]) => ({ consecutiveLimit: k, ...reboundStats(rs, nextMap) }))
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})
router.get('/rebound/industry/:date', async (req, res) => {
  try {
    const { date } = req.params
    const { day1, nextMap } = await reboundBase(date)
    const g = new Map()
    for (const r of day1) { const k = r.industry || '未知行业'; if (!g.has(k)) g.set(k, []); g.get(k).push(r) }
    const rows = [...g.entries()].map(([k, rs]) => ({ industry: k, ...reboundStats(rs, nextMap) })).sort((a, b) => N(b.reboundCount) - N(a.reboundCount))
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})
function peRange(pe) {
  if (pe == null) return '未知'
  const v = N(pe)
  if (v <= 0) return '负值或零'
  if (v < 20) return '0-20'
  if (v < 50) return '20-50'
  if (v < 100) return '50-100'
  return '100以上'
}
router.get('/rebound/pe/:date', async (req, res) => {
  try {
    const { date } = req.params
    const { day1, nextMap } = await reboundBase(date)
    const g = new Map()
    for (const r of day1) { const k = peRange(r.pe); if (!g.has(k)) g.set(k, []); g.get(k).push(r) }
    const rows = [...g.entries()].map(([k, rs]) => ({ peRange: k, ...reboundStats(rs, nextMap) })).sort((a, b) => N(b.reboundCount) - N(a.reboundCount))
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 市场情绪指标 ----
router.get('/sentiment/:date', async (req, res) => {
  try {
    const { date } = req.params
    const r = await one(`select
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      sum(iif(data_type=='LIMIT_UP' and blast_times>0,1,0)) as limitUpBlast,
      sum(iif(continuous_limit>=2,1,0)) as cont2,
      count(*) as total,
      sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds,
      avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds,
      sum(iif(data_type=='LIMIT_UP' and not isNull(first_limit_time) and first_limit_time<'10:30:00',1,0)) as earlyRaw,
      sum(iif(data_type=='LIMIT_UP' and not isNull(first_limit_time) and first_limit_time>='14:30:00',1,0)) as lateRaw
      from ${TBL} where trade_date=${dd(date)}`)
    const row = {
      tradeDate: date,
      limitUpDownRatio: ratioN(r && r.limitUpCount, r && r.limitDownCount),
      continuousLimitRate: pctN(r && r.cont2, r && r.total),
      blastRate: pctN(r && r.limitUpBlast, r && r.limitUpCount),
      totalSealFunds: r && r.totalSealFunds, avgSealFunds: r && r.avgSealFunds,
      earlyLimitRate: pctN(r && r.earlyRaw, r && r.limitUpCount),
      lateLimitRate: pctN(r && r.lateRaw, r && r.limitUpCount)
    }
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/sentiment/trend', async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const rows = await list(`select trade_date as tradeDate,
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      sum(iif(data_type=='LIMIT_UP' and blast_times>0,1,0)) as limitUpBlast,
      sum(iif(continuous_limit>=2,1,0)) as cont2, count(*) as total,
      sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds, avg(iif(isNull(limit_funds),0,limit_funds)) as avgSealFunds
      from ${TBL} where trade_date between ${dd(startDate)} and ${dd(endDate)} group by trade_date order by trade_date`)
    rows.forEach(r => {
      r.limitUpDownRatio = ratioN(r.limitUpCount, r.limitDownCount)
      r.continuousLimitRate = pctN(r.cont2, r.total)
      r.blastRate = pctN(r.limitUpBlast, r.limitUpCount)
      delete r.cont2; delete r.total; delete r.limitUpBlast
    })
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 历史对比 & 分位数 ----
router.get('/historical-compare/:targetDate', async (req, res) => {
  try {
    const { targetDate } = req.params
    const days = Number(req.query.days || 30)
    const start = addDays(targetDate, -days)
    const rows = await list(`select trade_date as tradeDate,
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds
      from ${TBL} where trade_date between ${dd(start)} and ${dd(targetDate)} group by trade_date order by trade_date`)
    rows.forEach(r => { r.limitUpDownRatio = ratioN(r.limitUpCount, r.limitDownCount) })
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

router.get('/percentile/:targetDate', async (req, res) => {
  try {
    const { targetDate } = req.params
    const days = Number(req.query.days || 60)
    const start = addDays(targetDate, -days)
    const t = await one(`select sum(iif(data_type=='LIMIT_UP',1,0)) as tLimitUpCount,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as tLimitDownCount,
      sum(iif(isNull(limit_funds),0,limit_funds)) as tTotalSealFunds
      from ${TBL} where trade_date=${dd(targetDate)}`)
    const hist = await list(`select trade_date,
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      sum(iif(isNull(limit_funds),0,limit_funds)) as totalSealFunds
      from ${TBL} where trade_date between ${dd(start)} and ${dd(targetDate)} group by trade_date`)
    const tUp = N(t && t.tLimitUpCount), tDown = N(t && t.tLimitDownCount), tFunds = N(t && t.tTotalSealFunds)
    let upLess = 0, downLess = 0, fundsLess = 0
    for (const h of hist) {
      if (N(h.limitUpCount) <= tUp) upLess++
      if (N(h.limitDownCount) <= tDown) downLess++
      if (N(h.totalSealFunds) <= tFunds) fundsLess++
    }
    ok(res, {
      targetDate,
      targetLimitUpCount: t && t.tLimitUpCount, targetLimitDownCount: t && t.tLimitDownCount,
      targetTotalSealFunds: t && t.tTotalSealFunds,
      totalDays: hist.length,
      limitUpCountLessEqualDays: upLess, limitDownCountLessEqualDays: downLess, totalFundsLessEqualDays: fundsLess
    })
  } catch (e) { err(res, e.message) }
})

// ---- 数据可用性 & 最新日期 ----
router.get('/data/availability/:date', async (req, res) => {
  try {
    const { date } = req.params
    const d = dd(date)
    const [up, down, plate, idx] = await Promise.all([
      ddb.execute(`select count(*) as c from ${TBL} where trade_date=${d} and data_type='LIMIT_UP'`),
      ddb.execute(`select count(*) as c from ${TBL} where trade_date=${d} and data_type='LIMIT_DOWN'`),
      ddb.execute(`select count(*) as c from ${TBL_PLATE} where trade_date=${d}`),
      ddb.execute(`select count(*) as c from ${TBL_INDEX} where trade_date=${d}`)
    ])
    const g = (x) => { const rs = toRows(x); return rs.length ? N(rs[0].c) : 0 }
    ok(res, { limitUpCount: g(up), limitDownCount: g(down), plateCount: g(plate), indexCount: g(idx) })
  } catch (e) { err(res, e.message) }
})

router.get('/data/latest', async (req, res) => {
  try {
    const r = await one(`select max(trade_date) as latestDate from ${TBL}`)
    ok(res, r)
  } catch (e) { err(res, e.message) }
})

// ---- 异常检测 ----
router.get('/anomaly/detect/:date', async (req, res) => {
  try {
    const { date } = req.params
    const r = await one(`select
      sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
      sum(iif(data_type=='LIMIT_DOWN',1,0)) as limitDownCount,
      max(continuous_limit) as maxContinuous
      from ${TBL} where trade_date=${dd(date)}`)
    const row = {
      limitUpCount: r && r.limitUpCount, limitDownCount: r && r.limitDownCount,
      ratio: ratioN(r && r.limitUpCount, r && r.limitDownCount), maxContinuous: r && r.maxContinuous
    }
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

// ---- 缓存管理 ----
router.post('/cache/refresh/:date', (req, res) => {
  cache.delByPattern(`stats:*${req.params.date}*`)
  ok(res, { refreshed: true })
})
router.delete('/cache/clear/:date', (req, res) => {
  cache.delByPattern(`stats:*${req.params.date}*`)
  ok(res, { cleared: true })
})
router.post('/cache/warmup', (req, res) => {
  cache.clear()
  ok(res, { warmed: true })
})

/** stock_limit_pool 列定义（须与 ensureSchema 列序一致） */
const LIMIT_POOL_COLS = [
  { name: 'data_type', type: 'symbol' }, { name: 'trade_date', type: 'date' },
  { name: 'stock_code', type: 'symbol' }, { name: 'stock_name', type: 'symbol' },
  { name: 'industry', type: 'string' }, { name: 'increase_rate', type: 'double' },
  { name: 'latest_price', type: 'double' }, { name: 'turnover', type: 'long' },
  { name: 'circulation_market_value', type: 'double' }, { name: 'total_market_value', type: 'double' },
  { name: 'turnover_rate', type: 'double' }, { name: 'limit_funds', type: 'long' },
  { name: 'first_limit_time', type: 'string' }, { name: 'limit_stats', type: 'string' },
  { name: 'dynamic_pe', type: 'double' }, { name: 'limit_turnover', type: 'long' },
  { name: 'continuous_limit', type: 'int' }, { name: 'last_limit_time', type: 'string' },
  { name: 'blast_times', type: 'int' }, { name: 'create_time', type: 'timestamp' }
]

// ---- 涨停池 / 跌停池 / 昨日涨停（DB-first，供 Review 页迁移用） ----

/** GET /limit-pool/:date — 某日涨停池全量数据（DB-first from stock_limit_pool LIMIT_UP） */
router.get('/limit-pool/:date', async (req, res) => {
  const { date } = req.params
  const d = safeDate(date)
  if (!d) return err(res, '日期参数不合法')
  const cacheKey = `stats:limit-pool:${d}`
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached)
  try {
    if (ddb.isConnected()) {
      const r = await ddb.execute(`select * from ${TBL} where trade_date=${d} and data_type='LIMIT_UP' order by continuous_limit desc`)
      const rows = normRows(toRows(r))
      if (rows.length) { cache.set(cacheKey, rows, 300); return ok(res, rows) }
    }
    // aktools write-on-miss
    const raw = await aktools.getStockLimitPool(date)
    if (raw && raw.length && ddb.isConnected()) {
      const rows = converter.convertStockLimitPool(raw, date, 'LIMIT_UP')
      await ddb.execute(`t = ${TBL}; delete from t where trade_date=${d} and data_type='LIMIT_UP'`)
      await ddb.insertRows('stock_limit_pool', LIMIT_POOL_COLS, rows)
      const r2 = await ddb.execute(`select * from ${TBL} where trade_date=${d} and data_type='LIMIT_UP' order by continuous_limit desc`)
      const rows2 = normRows(toRows(r2))
      if (rows2.length) { cache.set(cacheKey, rows2, 300); return ok(res, rows2) }
    }
    ok(res, raw || [])
  } catch (e) { err(res, e.message) }
})

/** GET /drop-pool/:date — 某日跌停池全量数据（DB-first from stock_limit_pool LIMIT_DOWN） */
router.get('/drop-pool/:date', async (req, res) => {
  const { date } = req.params
  const d = safeDate(date)
  if (!d) return err(res, '日期参数不合法')
  const cacheKey = `stats:drop-pool:${d}`
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached)
  try {
    if (ddb.isConnected()) {
      const r = await ddb.execute(`select * from ${TBL} where trade_date=${d} and data_type='LIMIT_DOWN'`)
      const rows = normRows(toRows(r))
      if (rows.length) { cache.set(cacheKey, rows, 300); return ok(res, rows) }
    }
    const raw = await aktools.getStockDropPool(date)
    if (raw && raw.length && ddb.isConnected()) {
      const rows = converter.convertStockLimitPool(raw, date, 'LIMIT_DOWN')
      await ddb.execute(`t = ${TBL}; delete from t where trade_date=${d} and data_type='LIMIT_DOWN'`)
      await ddb.insertRows('stock_limit_pool', LIMIT_POOL_COLS, rows)
      const r2 = await ddb.execute(`select * from ${TBL} where trade_date=${d} and data_type='LIMIT_DOWN'`)
      const rows2 = normRows(toRows(r2))
      if (rows2.length) { cache.set(cacheKey, rows2, 300); return ok(res, rows2) }
    }
    ok(res, raw || [])
  } catch (e) { err(res, e.message) }
})

/** GET /zt-previous/:date — 昨日涨停数据（DB-first from zt_pool_previous） */
router.get('/zt-previous/:date', async (req, res) => {
  const { date } = req.params
  const d = safeDate(date)
  if (!d) return err(res, '日期参数不合法')
  const cacheKey = `stats:zt-prev:${d}`
  const cached = cache.get(cacheKey)
  if (cached) return ok(res, cached)
  try {
    if (ddb.isConnected()) {
      const r = await ddb.execute(`select * from ${TBL_ZT_PREV} where trade_date=${d}`)
      const rows = normRows(toRows(r))
      if (rows.length) { cache.set(cacheKey, rows, 300); return ok(res, rows) }
    }
    const raw = await aktools.getZtPoolPrevious(date)
    if (raw && raw.length && ddb.isConnected()) {
      const rows = converter.convertZtPrevious(raw, date)
      const ZT_COLS = [
        { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
        { name: 'name', type: 'symbol' }, { name: 'latest_price', type: 'double' },
        { name: 'limit_price', type: 'double' }, { name: 'pct_chg', type: 'double' },
        { name: 'amount', type: 'double' }, { name: 'circulation_mv', type: 'double' },
        { name: 'total_mv', type: 'double' }, { name: 'turnover_rate', type: 'double' },
        { name: 'amplitude', type: 'double' }, { name: 'speed', type: 'double' },
        { name: 'last_limit_time', type: 'string' }, { name: 'consecutive_limit', type: 'int' },
        { name: 'industry', type: 'string' }, { name: 'limit_stats', type: 'string' }
      ]
      await ddb.execute(`t = ${TBL_ZT_PREV}; delete from t where trade_date=${d}`)
      await ddb.insertRows('zt_pool_previous', ZT_COLS, rows)
      const r2 = await ddb.execute(`select * from ${TBL_ZT_PREV} where trade_date=${d}`)
      const rows2 = normRows(toRows(r2))
      if (rows2.length) { cache.set(cacheKey, rows2, 300); return ok(res, rows2) }
    }
    ok(res, raw || [])
  } catch (e) { err(res, e.message) }
})

module.exports = router
