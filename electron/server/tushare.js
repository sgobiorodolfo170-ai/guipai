'use strict'

/**
 * Tushare Pro API 客户端（兜底数据源）。
 *
 * 当东财直连接口限流/失败时，自动回退到 Tushare 获取数据。
 * Tushare Pro API: POST http://api.tushare.pro  body={api_name, token, params, fields}
 * 返回: {code:0, data:{fields:[...], items:[[...],...]}}
 */

const http = require('http')
const settings = require('./settings')

const TUSHARE_URL = 'http://api.tushare.pro'

// ---- 多账号池：轮询 + 健康度感知故障转移 ----
// 为什么不是纯轮询：坏账号（无效/限频）会拖垮每一次轮到的请求。这里给每个账号记内存状态，
// 按错误类型分类处置——无效 token 长期停用、限频冷却 60s、网络问题冷却 10s；
// 接口本身的错误（如接口名错误）与账号无关，直接抛出不再换号。
const poolStats = new Map() // token -> { ok, fail, lastError, lastUsedAt, cooldownUntil, invalid }
const COOLDOWN_RATE_LIMIT_MS = 60000  // 限频（Tushare 按积分限制每分钟调用次数）
const COOLDOWN_NETWORK_MS = 10000     // 网络/超时（通常是临时抖动）

/** 错误分类：决定是否换账号重试、以及是否给账号记冷却
 *  注意误伤点：接口名本身可能含 "limit"（如 limit_list_d），限频判定不能简单匹配 limit。
 *  权限错误（no_permission）不是账号坏了——另一个高积分账号可能就有权限，应换号但不冷却。 */
function classifyError(msg) {
  const m = String(msg || '')
  if (/token|凭证/i.test(m)) return 'invalid_token'
  if (/频率超限|每分钟|调用频率|访问次数超限|次数超限/i.test(m)) return 'rate_limit'
  if (/没有接口.*权限|没有权限|权限不足|访问权限/.test(m)) return 'no_permission'
  if (/超时|请求失败|ECONN|网络|timeout/i.test(m)) return 'network'
  return 'api' // 接口/参数错误：与账号无关
}

function statOf(token) {
  if (!poolStats.has(token)) poolStats.set(token, { ok: 0, fail: 0, lastError: null, lastUsedAt: 0, cooldownUntil: 0, invalid: false })
  return poolStats.get(token)
}

function markOk(token) {
  const st = statOf(token)
  st.ok++; st.lastUsedAt = Date.now()
}

function markFail(token, message, kind) {
  const st = statOf(token)
  st.fail++; st.lastUsedAt = Date.now(); st.lastError = message
  if (kind === 'invalid_token') st.invalid = true // 无效 token：长期停用，直至用户在设置页重新编辑
  else if (kind === 'rate_limit') st.cooldownUntil = Date.now() + COOLDOWN_RATE_LIMIT_MS
  else if (kind === 'network') st.cooldownUntil = Date.now() + COOLDOWN_NETWORK_MS
  // no_permission：记失败但不冷却（账号本身没坏，只是没有这个接口的权限）
}

/** 选一个账号：round-robin（lastUsedAt 最久远者优先），跳过停用/冷却中的账号。
 *  exclude: 本次调用已试过的 token 集合。全部冷却时取冷却最早结束的兜底。 */
function pickToken(exclude = new Set()) {
  const accounts = settings.getEnabledTokens().filter(a => !exclude.has(a.token))
  if (!accounts.length) return null
  const now = Date.now()
  const usable = accounts.filter(a => {
    const st = statOf(a.token)
    return !st.invalid && !(st.cooldownUntil > now)
  })
  const pool = usable.length ? usable : accounts // 全冷却 → 强行用（冷却到期前也可能已恢复）
  return pool.reduce((a, b) => (statOf(a.token).lastUsedAt <= statOf(b.token).lastUsedAt ? a : b))
}

/** 带账号池的 Tushare 调用：失败按类型换号重试，最多把所有启用账号试一遍。 */
async function callWithPool(apiName, params, fields) {
  const accounts = settings.getEnabledTokens()
  if (!accounts.length) throw new Error('未配置 Tushare 账号（设置页可添加）')
  let lastErr = null
  const tried = new Set()
  for (let i = 0; i < accounts.length; i++) {
    const acc = pickToken(tried)
    if (!acc) break
    tried.add(acc.token)
    try {
      const data = await callTushare(apiName, params, fields, acc.token)
      markOk(acc.token)
      return data
    } catch (e) {
      const kind = classifyError(e.message)
      markFail(acc.token, e.message, kind)
      lastErr = e
      if (kind === 'api') throw e // 接口本身的问题，换账号无意义
      if (tried.size < accounts.length) {
        const reason = { invalid_token: '无效', rate_limit: '限频', no_permission: '无权限', network: '网络失败' }[kind] || kind
        console.warn(`[tushare] 账号「${acc.name}」${reason}，切换下一账号重试`)
      }
    }
  }
  throw lastErr || new Error('Tushare 无可用账号')
}

/** 账号池状态（供设置页展示）：掩码 token + 内存统计 */
function getTokenPoolStatus() {
  const now = Date.now()
  return settings.getTushareTokens().map(a => {
    const st = statOf(a.token)
    return {
      id: a.id, name: a.name, enabled: a.enabled,
      tokenMasked: maskToken(a.token),
      ok: st.ok, fail: st.fail,
      lastError: st.lastError,
      cooldownLeftSec: st.cooldownUntil > now ? Math.ceil((st.cooldownUntil - now) / 1000) : 0,
      invalid: st.invalid
    }
  })
}

/** token 掩码：前 8 位 + … + 后 4 位（本地桌面应用，足够识别又防窥屏） */
function maskToken(token) {
  const t = String(token || '')
  return t.length > 12 ? `${t.slice(0, 8)}…${t.slice(-4)}` : t
}

/** 测试单个 token 是否可用（trade_cal 是所有账号都可用的零门槛接口） */
async function testToken(token) {
  const data = await callTushare('trade_cal', { exchange: 'SSE', start_date: '20260101', end_date: '20260107' }, 'exchange,cal_date,is_open', token)
  return { ok: true, rows: toRecords(data).length }
}

/** 距任一启用账号恢复可用的秒数（0=立即可用；全部无效/无账号 → null，表示短期内无指望）。
 *  供上层组装"请 N 秒后重试"的用户提示。 */
function getPoolRetryAfterSec() {
  const accounts = settings.getEnabledTokens().filter(a => !statOf(a.token).invalid)
  if (!accounts.length) return null
  const now = Date.now()
  const lefts = accounts.map(a => Math.max(0, (statOf(a.token).cooldownUntil || 0) - now))
  const min = Math.min(...lefts)
  return min === 0 ? 0 : Math.ceil(min / 1000)
}

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
 * @returns 中文键对象数组（与东财输出同构，缺字段为 null）
 */
async function getLimitListD(date, limitType) {
  const fields = 'ts_code,name,close,pct_chg,amp,fd_amount,first_time,last_time,open_times,up_stat,limit_stat'
  const data = await callWithPool('limit_list_d', { trade_date: date, limit_type: limitType }, fields)
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
async function getDailyBar(symbol, startDate, endDate) {
  // 纯数字 → Tushare ts_code（6开头=.SH，8/4/92开头=.BJ，其余=.SZ）
  const tsCode = symbol.startsWith('6')
    ? `${symbol}.SH`
    : /^(4|8|92)/.test(symbol) ? `${symbol}.BJ` : `${symbol}.SZ`
  const sd = String(startDate).replace(/\D/g, '')
  const ed = String(endDate).replace(/\D/g, '')
  // turnover_rate(换手率%) 是 daily 原生列且 daily_k 会持久化它，不取就永久为 null
  // （前端换手率显示 0）。amp / pct_chg / pre_close 一律不取：振幅与涨跌幅改由前复权价推导，
  // 见上方口径说明——原始值基于不复权价，与 涨跌额(=前复权价差) 自相矛盾。
  const data = await callWithPool('daily', {
    ts_code: tsCode,
    start_date: sd,
    end_date: ed
  }, 'ts_code,trade_date,open,high,low,close,vol,amount,turnover_rate')
  const records = toRecords(data)
  if (!records.length) return []

  // 复权因子：区间起点 → 今天（而不是区间终点），以便拿到最新可得因子做锚点。失败则按不复权输出。
  const factors = {}
  try {
    const f = await callWithPool('adj_factor', { ts_code: tsCode, start_date: sd, end_date: todayCompact() }, 'ts_code,trade_date,adj_factor')
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

module.exports = { callTushare, callWithPool, toRecords, getLimitListD, getDailyBar, stripSuffix, getTokenPoolStatus, testToken, getPoolRetryAfterSec }
