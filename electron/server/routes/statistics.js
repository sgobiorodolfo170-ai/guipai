'use strict'

const express = require('express')
const { getDb } = require('../db')
const cache = require('../cache')

const router = express.Router()

function ok(res, data) { res.json({ code: 200, msg: '成功', data }) }
function err(res, msg) { res.json({ code: 500, msg }) }

function q(sql, params = []) {
  return getDb().prepare(sql).all(...params)
}
function qone(sql, params = []) {
  return getDb().prepare(sql).get(...params)
}

// ---- 基础统计 ----
router.get('/basic/:date', (req, res) => {
  try {
    const { date } = req.params
    const cached = cache.get(`stats:basic:${date}`)
    if (cached) return ok(res, cached)
    const row = qone(`SELECT
      ? AS tradeDate,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
      SUM(CASE WHEN data_type='LIMIT_UP' AND last_limit_time<='09:26:00' THEN 1 ELSE 0 END) AS limitUpOneWordCount,
      SUM(CASE WHEN data_type='LIMIT_UP' AND blast_times>0 THEN 1 ELSE 0 END) AS limitUpBlastResealCount,
      MAX(CASE WHEN data_type='LIMIT_UP' THEN continuous_limit ELSE 0 END) AS limitUpMaxContinuous,
      CASE WHEN SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END)>0
        THEN ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),2) ELSE 0 END AS limitUpContinuousRate,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN COALESCE(limit_funds,0) ELSE 0 END) AS limitUpTotalSealFunds,
      AVG(CASE WHEN data_type='LIMIT_UP' THEN COALESCE(limit_funds,0) END) AS limitUpAvgSealFunds,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' AND last_limit_time<='09:26:00' THEN 1 ELSE 0 END) AS limitDownOneWordCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' AND blast_times>0 THEN 1 ELSE 0 END) AS limitDownOpenCount,
      MAX(CASE WHEN data_type='LIMIT_DOWN' THEN continuous_limit ELSE 0 END) AS limitDownMaxContinuous,
      CASE WHEN SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END)>0
        THEN ROUND(SUM(CASE WHEN data_type='LIMIT_DOWN' AND continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),2) ELSE 0 END AS limitDownContinuousRate,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN COALESCE(limit_funds,0) ELSE 0 END) AS limitDownTotalSealFunds,
      AVG(CASE WHEN data_type='LIMIT_DOWN' THEN COALESCE(limit_funds,0) END) AS limitDownAvgSealFunds,
      CASE WHEN SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END)>0
        THEN ROUND(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END)*1.0/SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),2) ELSE NULL END AS limitUpDownRatio,
      SUM(total_market_value) AS totalMarketValue
    FROM stock_limit_pool WHERE trade_date=?`, [date, date])
    cache.set(`stats:basic:${date}`, row, 300)
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/basic/range', (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const rows = q(`SELECT trade_date AS tradeDate,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
      SUM(CASE WHEN data_type='LIMIT_UP' AND first_limit_time<='09:26:00' THEN 1 ELSE 0 END) AS limitUpOneWordCount,
      SUM(CASE WHEN data_type='LIMIT_UP' AND blast_times>0 THEN 1 ELSE 0 END) AS limitUpBlastResealCount,
      MAX(CASE WHEN data_type='LIMIT_UP' THEN continuous_limit ELSE 0 END) AS limitUpMaxContinuous,
      CASE WHEN SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END)>0
        THEN ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),2) ELSE 0 END AS limitUpContinuousRate,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN COALESCE(limit_funds,0) ELSE 0 END) AS limitUpTotalSealFunds,
      AVG(CASE WHEN data_type='LIMIT_UP' THEN COALESCE(limit_funds,0) END) AS limitUpAvgSealFunds,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' AND blast_times>0 THEN 1 ELSE 0 END) AS limitDownOpenCount,
      MAX(CASE WHEN data_type='LIMIT_DOWN' THEN continuous_limit ELSE 0 END) AS limitDownMaxContinuous,
      CASE WHEN SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END)>0
        THEN ROUND(SUM(CASE WHEN data_type='LIMIT_DOWN' AND continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),2) ELSE 0 END AS limitDownContinuousRate,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN COALESCE(limit_funds,0) ELSE 0 END) AS limitDownTotalSealFunds,
      SUM(total_market_value) AS totalMarketValue
    FROM stock_limit_pool WHERE trade_date BETWEEN ? AND ? GROUP BY trade_date ORDER BY trade_date`, [startDate, endDate])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 涨跌停板详细统计 ----
router.get('/detail/:date', (req, res) => {
  try {
    const { date } = req.params
    const { dataType } = req.query
    const isUp = dataType === 'LIMIT_UP'
    const row = qone(`SELECT
      ? AS tradeDate, ? AS dataType,
      COUNT(*) AS totalCount,
      SUM(CASE WHEN blast_times=0 THEN 1 ELSE 0 END) AS oneWordBoardCount,
      MAX(continuous_limit) AS maxContinuousLimit,
      SUM(COALESCE(limit_funds,0)) AS totalSealFunds,
      AVG(COALESCE(limit_funds,0)) AS avgSealFunds,
      ${isUp ? `SUM(CASE WHEN blast_times>0 THEN 1 ELSE 0 END) AS blastAndResealCount` : '0 AS blastAndResealCount'},
      ${!isUp ? `SUM(CASE WHEN blast_times>0 THEN 1 ELSE 0 END) AS openBoardCount, AVG(COALESCE(dynamic_pe,0)) AS avgDynamicPe` : '0 AS openBoardCount, 0 AS avgDynamicPe'}
    FROM stock_limit_pool WHERE trade_date=? AND data_type=?`, [date, dataType, date, dataType])
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/detail/range', (req, res) => {
  try {
    const { startDate, endDate, dataType } = req.query
    const isUp = dataType === 'LIMIT_UP'
    const rows = q(`SELECT trade_date AS tradeDate,
      COUNT(*) AS totalCount,
      SUM(CASE WHEN blast_times=0 THEN 1 ELSE 0 END) AS oneWordBoardCount,
      MAX(continuous_limit) AS maxContinuousLimit,
      SUM(COALESCE(limit_funds,0)) AS totalSealFunds,
      AVG(COALESCE(limit_funds,0)) AS avgSealFunds,
      ${isUp ? `SUM(CASE WHEN blast_times>0 THEN 1 ELSE 0 END) AS blastAndResealCount` : '0 AS blastAndResealCount'},
      ${!isUp ? `SUM(CASE WHEN blast_times>0 THEN 1 ELSE 0 END) AS openBoardCount, AVG(COALESCE(dynamic_pe,0)) AS avgDynamicPe` : '0 AS openBoardCount, 0 AS avgDynamicPe'}
    FROM stock_limit_pool WHERE trade_date BETWEEN ? AND ? AND data_type=? GROUP BY trade_date ORDER BY trade_date`, [startDate, endDate, dataType])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 涨跌停对比分析 ----
router.get('/comparison/:date', (req, res) => {
  try {
    const { date } = req.params
    const row = qone(`SELECT
      ? AS tradeDate,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN COALESCE(limit_funds,0) ELSE 0 END) AS limitUpTotalFunds,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN COALESCE(limit_funds,0) ELSE 0 END) AS limitDownTotalFunds,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND blast_times=0 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),0),2) AS limitUpOneWordRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_DOWN' AND blast_times=0 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),0),2) AS limitDownOneWordRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),0),2) AS limitUpContinuousRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_DOWN' AND continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),0),2) AS limitDownContinuousRate
    FROM stock_limit_pool WHERE trade_date=?`, [date, date])
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/comparison/range', (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const rows = q(`SELECT trade_date AS tradeDate,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN COALESCE(limit_funds,0) ELSE 0 END) AS limitUpTotalFunds,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN COALESCE(limit_funds,0) ELSE 0 END) AS limitDownTotalFunds,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND blast_times=0 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),0),2) AS limitUpOneWordRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_DOWN' AND blast_times=0 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),0),2) AS limitDownOneWordRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),0),2) AS limitUpContinuousRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_DOWN' AND continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),0),2) AS limitDownContinuousRate
    FROM stock_limit_pool WHERE trade_date BETWEEN ? AND ? GROUP BY trade_date ORDER BY trade_date`, [startDate, endDate])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 质量分析 ----
router.get('/quality/:date', (req, res) => {
  try {
    const { date } = req.params
    const { dataType } = req.query
    const isUp = dataType === 'LIMIT_UP'
    const row = qone(`SELECT
      ? AS tradeDate, ? AS dataType,
      ROUND(SUM(CASE WHEN blast_times=0 THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS oneWordBoardRate,
      ROUND(SUM(CASE WHEN first_limit_time IS NOT NULL AND first_limit_time<'10:30:00' THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS earlyLimitRate,
      ROUND(SUM(CASE WHEN first_limit_time IS NOT NULL AND first_limit_time BETWEEN '10:30:00' AND '14:30:00' THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS noonLimitRate,
      ROUND(SUM(CASE WHEN first_limit_time IS NOT NULL AND first_limit_time>='14:30:00' THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS lateLimitRate,
      AVG(COALESCE(limit_funds,0)) AS avgSealStrength,
      ROUND(SUM(CASE WHEN COALESCE(limit_funds,0)>10000000 THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS strongSealRate,
      ${isUp ? `SUM(CASE WHEN blast_times>0 THEN 1 ELSE 0 END) AS blastCount, SUM(CASE WHEN blast_times>0 THEN 1 ELSE 0 END) AS resealCount, AVG(CASE WHEN blast_times>0 THEN blast_times END) AS avgBlastTimes` : '0 AS blastCount, 0 AS resealCount, 0 AS avgBlastTimes'},
      ${!isUp ? `AVG(COALESCE(dynamic_pe,0)) AS avgDynamicPe, ROUND(SUM(CASE WHEN COALESCE(dynamic_pe,0)>0 AND dynamic_pe<20 THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS lowPeRate, SUM(CASE WHEN blast_times>0 THEN 1 ELSE 0 END) AS openBoardCount, AVG(CASE WHEN blast_times>0 THEN blast_times END) AS avgOpenTimes` : '0 AS avgDynamicPe, 0 AS lowPeRate, 0 AS openBoardCount, 0 AS avgOpenTimes'}
    FROM stock_limit_pool WHERE trade_date=? AND data_type=?`, [date, dataType, date, dataType])
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

// ---- 行业分布 ----
router.get('/industry/:date', (req, res) => {
  try {
    const { date } = req.params
    const { dataType } = req.query
    const rows = q(`SELECT
      COALESCE(industry,'未知行业') AS industry,
      COUNT(*) AS count,
      ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),2) AS percentage,
      AVG(COALESCE(limit_funds,0)) AS avgSealFunds,
      AVG(total_market_value) AS avgMarketValue,
      ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS rank
    FROM stock_limit_pool WHERE trade_date=? AND data_type=?
    GROUP BY COALESCE(industry,'未知行业') ORDER BY count DESC`, [date, dataType])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

router.get('/industry/trend/:date', (req, res) => {
  try {
    const { date } = req.params
    const rows = q(`SELECT COALESCE(industry,'未知行业') AS industry, trade_date AS tradeDate,
      COUNT(*) AS count, SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount
    FROM stock_limit_pool WHERE trade_date BETWEEN date(?,'-7 days') AND ?
    GROUP BY COALESCE(industry,'未知行业'), trade_date ORDER BY industry, trade_date`, [date, date])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 连板分布 ----
router.get('/continuous/distribution/:date', (req, res) => {
  try {
    const { date } = req.params
    const { dataType } = req.query
    const rows = q(`SELECT continuous_limit AS continuousLimit, COUNT(*) AS count,
      ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),2) AS percentage,
      AVG(COALESCE(limit_funds,0)) AS avgSealFunds, AVG(total_market_value) AS avgMarketValue
    FROM stock_limit_pool WHERE trade_date=? AND data_type=? GROUP BY continuous_limit ORDER BY continuous_limit`, [date, dataType])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

router.get('/continuous-success-rate', (req, res) => {
  try {
    const { startDate, endDate, dataType } = req.query
    const rows = q(`WITH continuous_stats AS (
      SELECT continuous_limit, COUNT(*) AS totalCount FROM stock_limit_pool
      WHERE trade_date BETWEEN ? AND ? AND data_type=? AND continuous_limit>=2 GROUP BY continuous_limit
    ), success_stats AS (
      SELECT t1.continuous_limit, COUNT(*) AS successCount FROM stock_limit_pool t1
      INNER JOIN stock_limit_pool t2 ON t1.stock_code=t2.stock_code
        AND t2.trade_date=date(t1.trade_date,'+1 day') AND t2.data_type=?
      WHERE t1.trade_date BETWEEN ? AND ? AND t1.data_type=? AND t1.continuous_limit>=2
      GROUP BY t1.continuous_limit
    )
    SELECT cs.continuous_limit AS continuousLimit, cs.totalCount,
      COALESCE(ss.successCount,0) AS successCount,
      ROUND(COALESCE(ss.successCount,0)*100.0/cs.totalCount,2) AS successRate
    FROM continuous_stats cs LEFT JOIN success_stats ss ON cs.continuous_limit=ss.continuous_limit
    ORDER BY cs.continuous_limit`, [startDate, endDate, dataType, dataType, startDate, endDate, dataType])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 时间分布 ----
router.get('/time/distribution/:date', (req, res) => {
  try {
    const { date } = req.params
    const { dataType } = req.query
    const rows = q(`SELECT
      CASE WHEN first_limit_time IS NULL OR first_limit_time<'09:30:00' THEN '09:30-10:00'
        WHEN first_limit_time<'10:00:00' THEN '09:30-10:00'
        WHEN first_limit_time<'10:30:00' THEN '10:00-10:30'
        WHEN first_limit_time<'11:00:00' THEN '10:30-11:00'
        WHEN first_limit_time<'11:30:00' THEN '11:00-11:30'
        WHEN first_limit_time<'13:00:00' THEN '11:30-13:00'
        WHEN first_limit_time<'13:30:00' THEN '13:00-13:30'
        WHEN first_limit_time<'14:00:00' THEN '13:30-14:00'
        WHEN first_limit_time<'14:30:00' THEN '14:00-14:30'
        WHEN first_limit_time<'15:00:00' THEN '14:30-15:00'
        ELSE '15:00-15:00' END AS timeRange,
      COUNT(*) AS count, ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),2) AS percentage
    FROM stock_limit_pool WHERE trade_date=? AND data_type=? GROUP BY timeRange
    ORDER BY MIN(COALESCE(first_limit_time,'09:30:00'))`, [date, dataType])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 封单强度分布 ----
router.get('/seal-strength/:date', (req, res) => {
  try {
    const { date } = req.params
    const { dataType } = req.query
    const rows = q(`SELECT
      CASE WHEN COALESCE(limit_funds,0)=0 THEN '无封单'
        WHEN limit_funds<1000000 THEN '0-100万'
        WHEN limit_funds<5000000 THEN '100-500万'
        WHEN limit_funds<10000000 THEN '500-1000万'
        WHEN limit_funds<50000000 THEN '1000-5000万'
        WHEN limit_funds<100000000 THEN '5000万-1亿'
        ELSE '1亿以上' END AS range,
      COUNT(*) AS count, ROUND(COUNT(*)*100.0/SUM(COUNT(*)) OVER(),2) AS percentage
    FROM stock_limit_pool WHERE trade_date=? AND data_type=? GROUP BY range
    ORDER BY CASE WHEN COALESCE(limit_funds,0)=0 THEN 0 WHEN limit_funds<1000000 THEN 1 WHEN limit_funds<5000000 THEN 2 WHEN limit_funds<10000000 THEN 3 WHEN limit_funds<50000000 THEN 4 WHEN limit_funds<100000000 THEN 5 ELSE 6 END`, [date, dataType])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 跌停反弹分析 ----
router.get('/rebound/:date', (req, res) => {
  try {
    const { date } = req.params
    const row = qone(`SELECT
      ? AS tradeDate, COUNT(*) AS totalLimitDownCount,
      SUM(CASE WHEN t2.increase_rate>0 THEN 1 ELSE 0 END) AS reboundCount,
      AVG(CASE WHEN t2.increase_rate>0 THEN t2.increase_rate END) AS avgReboundIncrease
    FROM stock_limit_pool t1 LEFT JOIN stock_limit_pool t2
      ON t1.stock_code=t2.stock_code AND t2.trade_date=date(t1.trade_date,'+1 day')
    WHERE t1.trade_date=? AND t1.data_type='LIMIT_DOWN'`, [date, date])
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/rebound/consecutive/:date', (req, res) => {
  try {
    const { date } = req.params
    const rows = q(`SELECT
      t1.continuous_limit AS consecutiveLimit, COUNT(*) AS totalLimitDownCount,
      SUM(CASE WHEN t2.increase_rate>0 THEN 1 ELSE 0 END) AS reboundCount,
      AVG(CASE WHEN t2.increase_rate>0 THEN t2.increase_rate END) AS avgReboundIncrease
    FROM stock_limit_pool t1 LEFT JOIN stock_limit_pool t2
      ON t1.stock_code=t2.stock_code AND t2.trade_date=date(t1.trade_date,'+1 day')
    WHERE t1.trade_date=? AND t1.data_type='LIMIT_DOWN' GROUP BY t1.continuous_limit ORDER BY t1.continuous_limit`, [date])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

router.get('/rebound/industry/:date', (req, res) => {
  try {
    const { date } = req.params
    const rows = q(`SELECT
      COALESCE(t1.industry,'未知行业') AS industry, COUNT(*) AS totalLimitDownCount,
      SUM(CASE WHEN t2.increase_rate>0 THEN 1 ELSE 0 END) AS reboundCount,
      AVG(CASE WHEN t2.increase_rate>0 THEN t2.increase_rate END) AS avgReboundIncrease
    FROM stock_limit_pool t1 LEFT JOIN stock_limit_pool t2
      ON t1.stock_code=t2.stock_code AND t2.trade_date=date(t1.trade_date,'+1 day')
    WHERE t1.trade_date=? AND t1.data_type='LIMIT_DOWN' GROUP BY COALESCE(t1.industry,'未知行业') ORDER BY reboundCount DESC`, [date])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

router.get('/rebound/pe/:date', (req, res) => {
  try {
    const { date } = req.params
    const rows = q(`SELECT
      CASE WHEN t1.dynamic_pe IS NULL THEN '未知'
        WHEN t1.dynamic_pe<=0 THEN '负值或零'
        WHEN t1.dynamic_pe<20 THEN '0-20'
        WHEN t1.dynamic_pe<50 THEN '20-50'
        WHEN t1.dynamic_pe<100 THEN '50-100'
        ELSE '100以上' END AS peRange,
      COUNT(*) AS totalLimitDownCount,
      SUM(CASE WHEN t2.increase_rate>0 THEN 1 ELSE 0 END) AS reboundCount,
      AVG(CASE WHEN t2.increase_rate>0 THEN t2.increase_rate END) AS avgReboundIncrease
    FROM stock_limit_pool t1 LEFT JOIN stock_limit_pool t2
      ON t1.stock_code=t2.stock_code AND t2.trade_date=date(t1.trade_date,'+1 day')
    WHERE t1.trade_date=? AND t1.data_type='LIMIT_DOWN' GROUP BY peRange ORDER BY reboundCount DESC`, [date])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 市场情绪指标 ----
router.get('/sentiment/:date', (req, res) => {
  try {
    const { date } = req.params
    const row = qone(`SELECT
      ? AS tradeDate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END)*1.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),0),2) AS limitUpDownRatio,
      ROUND(SUM(CASE WHEN continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS continuousLimitRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND blast_times>0 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),0),2) AS blastRate,
      SUM(COALESCE(limit_funds,0)) AS totalSealFunds, AVG(COALESCE(limit_funds,0)) AS avgSealFunds,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND first_limit_time IS NOT NULL AND first_limit_time<'10:30:00' THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),0),2) AS earlyLimitRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND first_limit_time IS NOT NULL AND first_limit_time>='14:30:00' THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),0),2) AS lateLimitRate
    FROM stock_limit_pool WHERE trade_date=?`, [date, date])
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/sentiment/trend', (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const rows = q(`SELECT trade_date AS tradeDate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END)*1.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),0),2) AS limitUpDownRatio,
      ROUND(SUM(CASE WHEN continuous_limit>=2 THEN 1 ELSE 0 END)*100.0/COUNT(*),2) AS continuousLimitRate,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' AND blast_times>0 THEN 1 ELSE 0 END)*100.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END),0),2) AS blastRate,
      SUM(COALESCE(limit_funds,0)) AS totalSealFunds, AVG(COALESCE(limit_funds,0)) AS avgSealFunds,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount
    FROM stock_limit_pool WHERE trade_date BETWEEN ? AND ? GROUP BY trade_date ORDER BY trade_date`, [startDate, endDate])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

// ---- 历史对比 & 分位数 ----
router.get('/historical-compare/:targetDate', (req, res) => {
  try {
    const { targetDate } = req.params
    const { days = 30 } = req.query
    const rows = q(`SELECT trade_date AS tradeDate,
      SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount,
      ROUND(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END)*1.0/NULLIF(SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),0),2) AS limitUpDownRatio,
      SUM(COALESCE(limit_funds,0)) AS totalSealFunds
    FROM stock_limit_pool WHERE trade_date BETWEEN date(?,'-'||?||' days') AND ? GROUP BY trade_date ORDER BY trade_date`, [targetDate, days, targetDate])
    ok(res, rows)
  } catch (e) { err(res, e.message) }
})

router.get('/percentile/:targetDate', (req, res) => {
  try {
    const { targetDate } = req.params
    const { days = 60 } = req.query
    const row = qone(`WITH target_data AS (
      SELECT SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS tLimitUpCount,
        SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS tLimitDownCount,
        SUM(COALESCE(limit_funds,0)) AS tTotalSealFunds
      FROM stock_limit_pool WHERE trade_date=?
    ), hist AS (
      SELECT trade_date,
        SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
        SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount,
        SUM(COALESCE(limit_funds,0)) AS totalSealFunds
      FROM stock_limit_pool WHERE trade_date BETWEEN date(?,'-'||?||' days') AND ? GROUP BY trade_date
    )
    SELECT ? AS targetDate, td.tLimitUpCount, td.tLimitDownCount, td.tTotalSealFunds,
      COUNT(h.trade_date) AS totalDays,
      SUM(CASE WHEN h.limitUpCount<=td.tLimitUpCount THEN 1 ELSE 0 END) AS limitUpCountLessEqualDays,
      SUM(CASE WHEN h.limitDownCount<=td.tLimitDownCount THEN 1 ELSE 0 END) AS limitDownCountLessEqualDays,
      SUM(CASE WHEN h.totalSealFunds<=td.tTotalSealFunds THEN 1 ELSE 0 END) AS totalFundsLessEqualDays
    FROM target_data td CROSS JOIN hist h
    GROUP BY td.tLimitUpCount, td.tLimitDownCount, td.tTotalSealFunds`, [targetDate, targetDate, days, targetDate, targetDate])
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

// ---- 数据可用性 & 最新日期 ----
router.get('/data/availability/:date', (req, res) => {
  try {
    const { date } = req.params
    const row = qone(`SELECT
      (SELECT COUNT(*) FROM stock_limit_pool WHERE trade_date=? AND data_type='LIMIT_UP') AS limitUpCount,
      (SELECT COUNT(*) FROM stock_limit_pool WHERE trade_date=? AND data_type='LIMIT_DOWN') AS limitDownCount,
      (SELECT COUNT(*) FROM plate_market_quotation WHERE trade_date=?) AS plateCount,
      (SELECT COUNT(*) FROM stock_zh_index_daily WHERE trade_date=?) AS indexCount
    `, [date, date, date, date])
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

router.get('/data/latest', (req, res) => {
  try {
    const row = qone(`SELECT MAX(trade_date) AS latestDate FROM stock_limit_pool`)
    ok(res, row)
  } catch (e) { err(res, e.message) }
})

// ---- 异常检测 ----
router.get('/anomaly/detect/:date', (req, res) => {
  try {
    const { date } = req.params
    const row = qone(`SELECT
      SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END) AS limitUpCount,
      SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END) AS limitDownCount,
      CASE WHEN SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END)>0
        THEN ROUND(SUM(CASE WHEN data_type='LIMIT_UP' THEN 1 ELSE 0 END)*1.0/SUM(CASE WHEN data_type='LIMIT_DOWN' THEN 1 ELSE 0 END),2) ELSE NULL END AS ratio,
      MAX(continuous_limit) AS maxContinuous
    FROM stock_limit_pool WHERE trade_date=?`, [date])
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

module.exports = router
