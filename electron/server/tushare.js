'use strict'

/**
 * Tushare Pro API 客户端（兜底数据源）。
 *
 * 当东财直连接口限流/失败时，自动回退到 Tushare 获取数据。
 * Tushare Pro API: POST http://api.tushare.pro  body={api_name, token, params, fields}
 * 返回: {code:0, data:{fields:[...], items:[[...],...]}}
 */

const http = require('http')

const TUSHARE_URL = 'http://api.tushare.pro'

/** POST JSON 到 Tushare，返回 data={fields, items}。 */
function callTushare(apiName, params, fields, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ api_name: apiName, token, params, fields })
    const req = http.request(
      { hostname: 'api.tushare.pro', port: 80, path: '/', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }, timeout: 30000 },
      (res) => {
        let data = ''
        res.on('data', (c) => { data += c })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.code !== 0) return reject(new Error(`Tushare: ${json.msg || '未知错误'}`))
            resolve(json.data)
          } catch (e) { reject(new Error('Tushare: 返回非 JSON')) }
        })
      }
    )
    req.on('error', (e) => reject(new Error(`Tushare 请求失败 (${e.code || e.message})`)))
    req.on('timeout', () => { req.destroy(new Error('Tushare 请求超时')) })
    req.write(body)
    req.end()
  })
}

/** 将 Tushare 列式结果 {fields, items} 转为对象数组。 */
function toRecords(data) {
  if (!data || !data.fields || !data.items) return []
  return data.items.map((row) => {
    const obj = {}
    data.fields.forEach((f, i) => { obj[f] = row[i] })
    return obj
  })
}

/** 去掉 ts_code 的 .SZ/.SH 后缀 → 纯数字代码。 */
function stripSuffix(tsCode) {
  return tsCode ? String(tsCode).replace(/\.(SZ|SH|BJ)$/i, '') : tsCode
}

/**
 * 涨停/跌停股池（Tushare limit_list_d）。
 * @param date YYYYMMDD
 * @param limitType 'U'=涨停, 'D'=跌停
 * @param token Tushare token
 * @returns 中文键对象数组（与东财输出同构，缺字段为 null）
 */
async function getLimitListD(date, limitType, token) {
  const fields = 'ts_code,name,close,pct_chg,amp,fd_amount,first_time,last_time,open_times,up_stat,limit_stat'
  const data = await callTushare('limit_list_d', { trade_date: date, limit_type: limitType }, fields, token)
  const records = toRecords(data)
  return records.map((r) => {
    const code = stripSuffix(r.ts_code)
    const isUp = limitType === 'U'
    return {
      '代码': code,
      '名称': r.name,
      '最新价': r.close,
      '涨跌幅': r.pct_chg,
      '成交额': null,
      '流通市值': null,
      '总市值': null,
      '换手率': null,
      '封板资金': isUp ? r.fd_amount : r.fd_amount, // 涨停=封板资金, 跌停=封单资金（Tushare 统一用 fd_amount）
      '首次封板时间': isUp ? padTime(r.first_time) : null,
      '最后封板时间': padTime(r.last_time),
      '炸板次数': isUp ? r.open_times : r.open_times, // 涨停=炸板次数, 跌停=开板次数
      '涨停统计': r.limit_stat,
      '连板数': isUp ? parseContinuous(r.up_stat) : parseContinuous(r.up_stat),
      '所属行业': null,
      // 跌停特有
      ...(isUp ? {} : { '动态市盈率': null, '板上成交额': null, '连续跌停': parseContinuous(r.up_stat), '开板次数': r.open_times })
    }
  })
}

/** Tushare 时间格式 "092500" 或 "09:25:00" → 统一 6 位数字串 "092500"（converter fmtTime 需 6 位）。 */
function padTime(t) {
  if (!t) return null
  const s = String(t).replace(/:/g, '')
  return s.length < 6 ? s.padStart(6, '0') : s.slice(0, 6)
}

/** 从 Tushare up_stat 解析连板数（如 "3" 或 "3连板" → 3）。 */
function parseContinuous(upStat) {
  if (!upStat) return null
  const m = String(upStat).match(/(\d+)/)
  return m ? parseInt(m[1], 10) : null
}

/**
 * 个股日K线（Tushare pro_bar，前复权 adj=qfq）。
 * @param symbol 股票代码（纯数字如 600519，函数内转 .SZ/.SH）
 * @param startDate YYYYMMDD
 * @param endDate YYYYMMDD
 * @param token Tushare token
 * @returns 中文键对象数组（与东财 getStockHistory 输出同构）
 */
async function getDailyBar(symbol, startDate, endDate, token) {
  // 纯数字 → Tushare ts_code（6开头=.SH，否则=.SZ）
  const tsCode = symbol.startsWith('6')
    ? `${symbol}.SH`
    : `${symbol}.SZ`
  const sd = String(startDate).replace(/\D/g, '')
  const ed = String(endDate).replace(/\D/g, '')
  const data = await callTushare('pro_bar', {
    ts_code: tsCode,
    start_date: sd,
    end_date: ed,
    adj: 'qfq',
    freq: 'D'
  }, 'ts_code,trade_date,open,high,low,close,vol,amount,turnover_rate,pct_chg,amp', token)
  const records = toRecords(data)
  return records.map((r) => ({
    '日期': fmtDate(r.trade_date),       // YYYYMMDD → YYYY-MM-DD
    '股票代码': symbol,
    '开盘': +r.open,
    '收盘': +r.close,
    '最高': +r.high,
    '最低': +r.low,
    '成交量': +r.vol,
    '成交额': +r.amount,
    '振幅': +r.amp,
    '涨跌幅': +r.pct_chg,
    '换手率': +r.turnover_rate
  }))
}

/** YYYYMMDD → YYYY-MM-DD */
function fmtDate(s) {
  s = String(s || '').replace(/\D/g, '')
  return s.length === 8 ? `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}` : s
}

module.exports = { callTushare, toRecords, getLimitListD, getDailyBar, stripSuffix }
