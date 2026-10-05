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
 * 个股日K线（Tushare pro daily + adj_factor，自算前复权）。
 * @param symbol 股票代码（纯数字如 600519，函数内转 .SZ/.SH）
 * @param startDate YYYYMMDD
 * @param endDate YYYYMMDD
 * @param token Tushare token
 * @returns 中文键对象数组（与东财 getStockHistory 输出同构）
 *
 * 实现说明：Tushare Pro **没有 pro_bar 接口**（那是 AKShare 的封装名，直接调用会返回
 * "请指定正确的接口名"）。前复权需自己拼：daily（不复权行情）+ adj_factor（复权因子），
 * 前复权价 = 不复权价 × 当日因子 / 锚点因子（这样最新一天价格与实际一致）。
 * adj_factor 取不到时降级为不复权（仍返回可用行情）。
 *
 * 口径对齐（关键，写入 daily_k 后与东财数据同表混存，必须一致）：
 *   - 锚点取"当前可得的最新因子"而非区间末日。取区间末日会让 endDate 落在过去时
 *     与东财 fqt=1 的前复权价对不上，同一 symbol 会出现两套锚点的价格序列。
 *   - 涨跌幅/振幅等衍生字段与腾讯兜底（mapTxKline）一致，一律由前复权价推导，
 *     不用 daily 原始 pct_chg —— 原始涨跌幅基于不复权价，与 涨跌额(=前复权价差) 自相矛盾。
 */
async function getDailyBar(symbol, startDate, endDate, token) {
  // 纯数字 → Tushare ts_code（6开头=.SH，8/4/92开头=.BJ，其余=.SZ）
  const tsCode = symbol.startsWith('6')
    ? `${symbol}.SH`
    : /^(4|8|92)/.test(symbol) ? `${symbol}.BJ` : `${symbol}.SZ`
  const sd = String(startDate).replace(/\D/g, '')
  const ed = String(endDate).replace(/\D/g, '')
  // turnover_rate(换手率%) 是 daily 原生列且 daily_k 会持久化它，不取就永久为 null
  // （前端换手率显示 0）。amp / pct_chg / pre_close 一律不取：振幅与涨跌幅改由前复权价推导，
  // 见上方口径说明——原始值基于不复权价，与 涨跌额(=前复权价差) 自相矛盾。
  const data = await callTushare('daily', {
    ts_code: tsCode,
    start_date: sd,
    end_date: ed
  }, 'ts_code,trade_date,open,high,low,close,vol,amount,turnover_rate', token)
  const records = toRecords(data)
  if (!records.length) return []

  // 复权因子：区间起点 → 今天（而不是区间终点），以便拿到最新可得因子做锚点。失败则按不复权输出。
  const factors = {}
  try {
    const f = await callTushare('adj_factor', { ts_code: tsCode, start_date: sd, end_date: todayCompact() }, 'ts_code,trade_date,adj_factor', token)
    for (const r of toRecords(f)) {
      const v = Number(r.adj_factor)
      if (Number.isFinite(v) && v > 0) factors[String(r.trade_date)] = v
    }
  } catch (e) {
    // 忽略：降级为不复权
  }
  // 锚点 = 因子表里最大交易日对应的因子；无因子时 anchor=1，即 ratio 恒为 1（不复权）
  const anchorDay = Object.keys(factors).sort().pop()
  const anchor = anchorDay ? factors[anchorDay] : 1

  // Tushare 返回按日期倒序，统一升序，便于计算涨跌额
  records.sort((a, b) => String(a.trade_date).localeCompare(String(b.trade_date)))
  // 前复权系数：把锚点日的价格锚定为真实价格
  const qfq = (v, day) => {
    const f = factors[day]
    const ratio = f ? f / anchor : 1
    return Number((Number(v) * ratio).toFixed(2))
  }

  const out = []
  let prevClose = null
  for (const r of records) {
    const day = String(r.trade_date)
    const close = qfq(r.close, day)
    const open = qfq(r.open, day)
    const high = qfq(r.high, day)
    const low = qfq(r.low, day)
    const chg = prevClose == null ? null : Number((close - prevClose).toFixed(2))
    out.push({
      '日期': fmtDate(day),
      '股票代码': symbol,
      '开盘': open,
      '收盘': close,
      '最高': high,
      '最低': low,
      '成交量': +r.vol,          // Tushare vol 单位为手（与东财口径一致）
      '成交额': r.amount != null ? Math.round(+r.amount * 1000) : null, // Tushare amount 单位为千元 → ×1000 统一为元
      // 首行无前收盘 → 振幅/涨跌幅为 null（与腾讯兜底 mapTxKline 的处理保持一致）
      '振幅': chg == null || prevClose === 0 ? null : round2((high - low) / prevClose * 100),
      '涨跌幅': chg == null || prevClose === 0 ? null : round2(chg / prevClose * 100),
      '涨跌额': chg,
      '换手率': r.turnover_rate != null ? +r.turnover_rate : null
    })
    prevClose = close
  }
  return out
}

/** 今天 YYYYMMDD（把复权因子取到最新，使前复权锚定最近一个因子） */
function todayCompact() {
  const d = new Date()
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
}

/** 保留两位小数（百分比类字段）；非有限数返回 null，避免 NaN 进 JSON 变脏值 */
function round2(x) {
  return Number.isFinite(x) ? Math.round(x * 100) / 100 : null
}

/** YYYYMMDD → YYYY-MM-DD */
function fmtDate(s) {
  s = String(s || '').replace(/\D/g, '')
  return s.length === 8 ? `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}` : s
}

module.exports = { callTushare, toRecords, getLimitListD, getDailyBar, stripSuffix }
