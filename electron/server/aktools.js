'use strict'

/**
 * 行情数据访问层。
 *
 * 迁移进度（Path C：Node 原生直连东财，去 AKTools/Python）：
 *   ✅ 全部 11 个函数已移植为 Node 直连东财，运行时零 Python/AKTools 依赖。
 *   - getStockLimitPool / getStockDropPool / getZtPoolPrevious  → push2ex（涨停/跌停/昨日涨停）
 *   - getIndexDailyData / getStockHistory / getStockMinute       → push2his（指数日K/个股日K/分时）
 *   - getStockSpot / getStockIndexSpot                           → 82/33/48.push2 clist（全市场/指数 spot）
 *   - getStockInfo                                               → push2 stock/get
 *   - getStockHolding                                           → datacenter-web
 *   - getStockIndustry                                          → 17.push2 clist（行业板块）
 *   已真机验证：涨停池/跌停池/指数日K/昨日涨停/股东/指数 spot。
 *
 * 跨厂商兜底（本机网络下东财 push2/push2his 的 /api/qt/* 被 WAF 直接 RST，ECONNRESET）：
 *   - 指数 spot      → 腾讯 qt.gtimg.cn（GBK，见 getStockIndexSpot 三源竞速）
 *   - K 线/分时      → 腾讯 web.ifzq.gtimg.cn（fqkline / mkline / day·minute query）
 *   - 全市场 spot    → 腾讯 proxy.finance.qq.com getBoardRankList(board_code=aStock)
 *   - 行业板块       → 同花顺 q.10jqka.com.cn/thshy（GBK 静态页）
 *   触发时机：主源抛错（网络拦截）或返回空（spot/industry）时降级；命中后 console.warn 留痕。
 *   返回键与东财口径保持一致（单位折算见各兜底函数注释），converter/前端无需改动。
 *
 * 已移植函数返回"中文键对象数组"（与 akshare 输出一致），故 converter.js 无需改动。
 * 字段映射依据 akshare 1.18.97 源码 + 东财真实返回字段键（c/m/n/p/zdp/amount/ltsz/tshare/hs/lbc/fbt/lbt/fund/zbc/hybk/zttj 等）。
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')
const settings = require('./settings')
const tushare = require('./tushare')

const UT = '7eea3edcaed734bea9cbfc24409ed989' // 东财 kline/涨停池 公开 token（akshare 同款）
const UT_SPOT = 'bd1d9ddb04089700cf9c27f6f7426281' // 东财 clist（spot/指数spot）公开 token（akshare 同款）
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** 通用 HTTP GET 取字节流（Node 核心 http/https 模块，不依赖 undici）。
 *  含重试退避（应对东财偶发 ECONNRESET/超时，akshare 同款策略）。
 *  retryDelay: 重试间隔基数（ms），默认 1500；传 0 表示立即重试（用于"首请求必卡 5s"的腾讯场景）。 */
async function getBuffer(url, { headers = {}, timeout = 30000, retries = 2, retryDelay = 1500 } = {}) {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const u = new URL(url)
        const lib = u.protocol === 'https:' ? https : http
        const req = lib.request({
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search,
          method: 'GET',
          headers: { 'User-Agent': UA, 'Referer': 'https://quote.eastmoney.com/', ...headers },
          timeout
        }, (res) => {
          const chunks = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () => {
            if (res.statusCode !== 200) return reject(new Error(`东财返回 ${res.statusCode}: ${url}`))
            resolve(Buffer.concat(chunks))
          })
        })
        req.on('error', (e) => reject(new Error(`东财请求失败 (${e.code || e.message}): ${url}`)))
        req.on('timeout', () => { req.destroy(new Error(`东财请求超时: ${url}`)) })
        req.end()
      })
    } catch (e) {
      lastErr = e
      if (attempt < retries && retryDelay > 0) await new Promise((r) => setTimeout(r, retryDelay * (attempt + 1)))
    }
  }
  throw lastErr
}

/** 取文本；encoding 可传 gbk/gb18030（腾讯行情返回 GBK，按 utf8 解码会乱码）。 */
async function getText(url, { encoding = 'utf8', ...opts } = {}) {
  const buf = await getBuffer(url, opts)
  return encoding === 'utf8' ? buf.toString('utf8') : new TextDecoder(encoding).decode(buf)
}

/** 取 JSON（getText + JSON.parse，对外签名与原实现一致，调用方无感知）。 */
async function getJson(url, opts = {}) {
  const text = await getText(url, opts)
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`东财返回非 JSON: ${url}`)
  }
}

/** 6 位时间补零：92500 -> "092500"。 */
function pad6(n) { return n == null ? null : String(n).padStart(6, '0') }

// ---- ✅ 全部直连东财（无 AKTools/Python 依赖） ----

/** 涨停股池（stock_zt_pool_em 等价）；东财失败时自动回退 Tushare limit_list_d */
async function getStockLimitPool(date) {
  try {
    const url = `https://push2ex.eastmoney.com/getTopicZTPool?ut=${UT}&dpt=wz.ztzt&Pageindex=0&pagesize=10000&sort=fbt:asc&date=${date}`
    const json = await getJson(url)
    const pool = json && json.data && json.data.pool
    if (!pool || !pool.length) {
      // 东财返回空：可能是限流软封或确实无数据。配置了 Tushare 则兜底尝试（账号池自动选号）。
      if (settings.isTushareConfigured()) { console.log('[aktools] 东财涨停池返回空，尝试 Tushare 兜底'); return await tushare.getLimitListD(date, 'U') }
      return []
    }
    return pool.map((it) => ({
      '代码': it.c,
      '名称': it.n,
      '最新价': it.p / 1000,
      '涨跌幅': it.zdp,
      '成交额': it.amount,
      '流通市值': it.ltsz,
      '总市值': it.tshare,
      '换手率': it.hs,
      '封板资金': it.fund,
      '首次封板时间': pad6(it.fbt),
      '最后封板时间': pad6(it.lbt),
      '炸板次数': it.zbc,
      '涨停统计': it.zttj ? `${it.zttj.days}/${it.zttj.ct}` : null,
      '连板数': it.lbc,
      '所属行业': it.hybk
    }))
  } catch (e) { return fallbackTushare(e, date, 'U', '涨停池') }
}

/** 跌停股池（stock_zt_pool_dtgc_em 等价）；东财失败时自动回退 Tushare limit_list_d */
async function getStockDropPool(date) {
  try {
    const url = `https://push2ex.eastmoney.com/getTopicDTPool?ut=${UT}&dpt=wz.ztzt&Pageindex=0&pagesize=10000&sort=fund:asc&date=${date}`
    const json = await getJson(url)
    const pool = json && json.data && json.data.pool
    if (!pool || !pool.length) {
      if (settings.isTushareConfigured()) { console.log('[aktools] 东财跌停池返回空，尝试 Tushare 兜底'); return await tushare.getLimitListD(date, 'D') }
      return []
    }
    return pool.map((it) => ({
      '代码': it.c,
      '名称': it.n,
      '最新价': it.p / 1000,
      '涨跌幅': it.zdp,
      '成交额': it.amount,
      '流通市值': it.ltsz,
      '总市值': it.tshare,
      '动态市盈率': it.pe,
      '换手率': it.hs,
      '封单资金': it.fund,
      '最后封板时间': pad6(it.lbt),
      '板上成交额': it.fba,
      '连续跌停': it.days,
      '开板次数': it.oc,
      '所属行业': it.hybk
    }))
  } catch (e) { return fallbackTushare(e, date, 'D', '跌停池') }
}

/** 东财失败 → Tushare 兜底（需在设置页配置 Tushare token） */
/** 东财涨跌停池失败 → Tushare 兜底（账号池自动选号；Tushare 也失败时抛带 retryAfterSec 的受限错误） */
async function fallbackTushare(eastError, date, limitType, label) {
  if (!settings.isTushareConfigured()) throw eastError
  console.log(`[aktools] 东财${label}失败，回退 Tushare: ${eastError.message.slice(0, 80)}`)
  try {
    return await tushare.getLimitListD(date, limitType)
  } catch (e) {
    throw makeRestrictedError(label, [`东财: ${eastError.message.slice(0, 40)}`, `Tushare: ${e.message.slice(0, 50)}`])
  }
}

/** 指数日K（index_zh_a_hist 等价）；klines 逗号串：日期,开,收,高,低,量,额,振幅,涨跌幅,涨跌额,换手率
 *  取数顺序：东财 push2his → 腾讯 fqkline（东财域名被网络拦截时跨厂商兜底） */
async function getIndexDailyData({ symbol, start_date, end_date, period = 'daily' }) {
  const klt = period === 'weekly' ? '102' : period === 'monthly' ? '103' : '101'
  const known = { '000001': '1', '399001': '0', '399006': '0', '000688': '1', '000300': '1', '000905': '1', '000016': '1', '000852': '1' }
  const prefixes = known[symbol] ? [known[symbol]] : ['1', '0', '2', '47']
  let lastErr = null
  try {
    let klines = null
    // retries:0 —— 网络被拦时快速失败进兜底，避免多前缀×重试退避叠加超过前端超时
    for (const pf of prefixes) {
      const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${pf}.${symbol}&ut=${UT}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${klt}&fqt=0&beg=0&end=20500000`
      const json = await getJson(url, { retries: 0, timeout: 10000 })
      if (json && json.data && json.data.klines) { klines = json.data.klines; break }
    }
    if (!klines || !klines.length) return []
    const rows = klines.map((line) => {
      const [d, o, c, h, l, vol, amt, amp, chg, pc, tr] = line.split(',')
      return {
        '日期': d, '开盘': +o, '收盘': +c, '最高': +h, '最低': +l,
        '成交量': +vol, '成交额': +amt, '振幅': +amp, '涨跌幅': +chg, '涨跌额': +pc, '换手率': +tr
      }
    })
    return filterRowsByDate(rows, start_date, end_date)
  } catch (e) {
    lastErr = e
  }
  // 腾讯兜底：东财只在网络层失败时走到这里（空数据视为真无数据直接返回 []）
  try {
    const periodKey = period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'day'
    const raw = await getKlineFromTencent({ symbol, isIndex: true, periodKey, fq: '', start: start_date, end: end_date })
    if (raw.length) {
      console.warn(`[aktools] 东财指数K线不可用(${symbol})，切换腾讯 fqkline 兜底(${raw.length} 根)`)
      return filterRowsByDate(mapTxKline(raw), start_date, end_date)
    }
  } catch (e) {
    lastErr = lastErr || e
  }
  throw lastErr || new Error(`指数K线各源均失败(${symbol},${period})`)
}

/** 多源全部失败时组装"受限错误"：携带各源失败原因 + retryAfterSec（秒）。
 *  重试时长取 Tushare 账号池最近恢复时间；未配置 Tushare 时默认 60s。
 *  路由层据此返回 code=429 + "请约 N 秒后重试"的用户提示。 */
function makeRestrictedError(label, reasons) {
  let retryAfterSec = 60
  if (settings.isTushareConfigured()) {
    const left = tushare.getPoolRetryAfterSec()
    if (left != null && left > 0) retryAfterSec = left
  }
  const e = new Error(`${label}获取受限/失败（${reasons.join('；')}）`)
  e.retryAfterSec = retryAfterSec
  return e
}

/** 个股日K/周K/月K（stock_zh_a_hist 等价）；market: 6开头→上交所(1)，否则→深交所(0)
 *  取数顺序：东财 push2his → 腾讯 fqkline（跨厂商兜底） → Tushare daily+adj_factor（仅日K，需配置 token）
 *  全部失败时抛出带 retryAfterSec 的受限错误（前端据此提示"N 秒后重试"）。 */
async function getStockHistory({ symbol, period = 'daily', start_date, end_date, adjust = 'qfq' }) {
  const periodKey = period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'day'
  const fq = adjust === 'qfq' ? 'qfq' : adjust === 'hfq' ? 'hfq' : ''
  const reasons = []
  try {
    const market = symbol.startsWith('6') ? 1 : 0
    const klt = period === 'weekly' ? '102' : period === 'monthly' ? '103' : '101'
    const fqt = adjust === 'qfq' ? '1' : adjust === 'hfq' ? '2' : '0'
    const beg = (start_date || '19700101').replace(/\D/g, '')
    const end = (end_date || '20500101').replace(/\D/g, '')
    // retries:0 —— 网络被拦时快速失败进兜底，不再叠加 1.5s/3s 退避
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f116&ut=${UT}&klt=${klt}&fqt=${fqt}&secid=${market}.${symbol}&beg=${beg}&end=${end}`
    const json = await getJson(url, { retries: 0, timeout: 10000 })
    const klines = json && json.data && json.data.klines
    if (klines && klines.length) {
      return klines.map((line) => {
        const p = line.split(',')
        return {
          '日期': p[0], '股票代码': symbol, '开盘': +p[1], '收盘': +p[2], '最高': +p[3], '最低': +p[4],
          '成交量': +p[5], '成交额': +p[6], '振幅': +p[7], '涨跌幅': +p[8], '涨跌额': +p[9], '换手率': +p[10]
        }
      })
    }
    return []
  } catch (e) {
    reasons.push(`东财: ${e.message.slice(0, 50)}`)
  }
  // 腾讯 fqkline 兜底：东财仅在网络层失败时走到这里（空区间视为真无数据返回 []）
  try {
    const raw = await getKlineFromTencent({ symbol, periodKey, fq, start: start_date, end: end_date })
    if (raw.length) {
      console.warn(`[aktools] 东财K线不可用(${symbol})，切换腾讯 fqkline 兜底(${raw.length} 根)`)
      return filterRowsByDate(mapTxKline(raw, { symbol }), start_date, end_date)
    }
    reasons.push('腾讯: 返回空')
  } catch (e) {
    reasons.push(`腾讯: ${e.message.slice(0, 50)}`)
  }
  // 日K 最后一道兜底：Tushare（受限时把账号池恢复时长带给用户）
  if (period === 'daily' && settings.isTushareConfigured()) {
    try {
      console.log(`[aktools] 东财/腾讯日K(${symbol})不可用，回退 Tushare daily+adj_factor`)
      return await tushare.getDailyBar(symbol, start_date, end_date)
    } catch (e) {
      reasons.push(`Tushare: ${e.message.slice(0, 50)}`)
    }
  }
  throw makeRestrictedError(`${symbol} ${period}K线`, reasons)
}

/** 沪深京 A 股实时行情（stock_zh_a_spot_em 等价）；pz=2000 分页取全市场
 *  取数顺序：东财 clist → 腾讯 aStock 榜单（push2 被拦或返回空时跨厂商兜底）
 *
 *  进程内共享memo：spot 是最重的接口（腾讯兜底要分页拉 28 页，1.5~4s），
 *  而 /api/stocks、/api/market/hot、/api/market/overview 都要它。
 *  这里做 TTL 记忆化 + 在途请求去重，避免同一份全市场快照被重复拉取
 *  （路由层的 withCache 只缓存各自整形后的结果，救不了重复取数）。 */
const SPOT_MEMO_MS = 60000
let spotMemo = { at: 0, data: null }
let spotInFlight = null

async function fetchStockSpot() {
  let lastErr = null
  try {
    const all = []
    let pn = 1
    while (pn <= 5) { // 最多 5 页 × 2000 = 10000，安全上限
      const url = `https://82.push2.eastmoney.com/api/qt/clist/get?pn=${pn}&pz=2000&po=1&np=1&ut=${UT_SPOT}&fltt=2&invt=2&fid=f12&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048&fields=f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11`
      const json = await getJson(url, { retries: 0, timeout: 10000 })
      // 东财 clist 返回 data.diff（np=1 为数组），不是 data.list——原实现误读 list 恒为空
      const diff = json && json.data && json.data.diff
      const list = Array.isArray(diff) ? diff : diff ? Object.values(diff) : null
      if (!list || !list.length) break
      for (let i = 0; i < list.length; i++) {
        const it = list[i]
        all.push({
          '序号': all.length + 1, '代码': it.f12, '名称': it.f14, '最新价': it.f2, '涨跌幅': it.f3, '涨跌额': it.f4,
          '成交量': it.f5, '成交额': it.f6, '振幅': it.f7, '最高': it.f15, '最低': it.f16, '今开': it.f17, '昨收': it.f18,
          '量比': it.f10, '换手率': it.f8, '市盈率-动态': it.f9, '市净率': it.f23, '总市值': it.f20, '流通市值': it.f21,
          '涨速': it.f22, '5分钟涨跌': it.f11, '60日涨跌幅': it.f24, '年初至今涨跌幅': it.f25
        })
      }
      if (list.length < 2000) break
      pn++
    }
    if (all.length) return all
    lastErr = new Error('东财全市场行情返回空')
  } catch (e) {
    lastErr = e
  }
  try {
    const rows = await getStockSpotFromTencent()
    if (rows.length) {
      console.warn(`[aktools] 东财全市场行情不可用(${lastErr && lastErr.message})，切换腾讯 aStock 兜底(${rows.length} 只)`)
      return rows
    }
  } catch (e) {
    lastErr = lastErr || e
  }
  throw lastErr || new Error('全市场行情各源均返回空')
}

async function getStockSpot() {
  if (spotMemo.data && Date.now() - spotMemo.at < SPOT_MEMO_MS) return spotMemo.data
  if (!spotInFlight) {
    spotInFlight = fetchStockSpot()
      .then((rows) => {
        spotMemo = { at: Date.now(), data: rows }
        return rows
      })
      .finally(() => { spotInFlight = null })
  }
  return await spotInFlight
}

/** 兜底 secids 清单：clist 不可用时按代码精确取数（覆盖复盘三指数 + 仪表盘核心指数） */
const INDEX_FALLBACK_SECIDS = {
  '沪深重要指数': '1.000001,1.000300,1.000016,1.000688,1.000905,0.399001,0.399006,0.399005,0.399106',
  '上证系列指数': '1.000001,1.000002,1.000003,1.000016,1.000300,1.000688,1.000905,1.000852',
  '深证系列指数': '0.399001,0.399002,0.399003,0.399005,0.399006,0.399106,0.399673',
  '中证系列指数': '1.000300,1.000905,1.000852,1.000016',
  '指数成份': '1.000300,1.000016,0.399001,0.399006'
}

/** 并行竞速取数：多个源同时发起，取最先成功者；全部失败抛出首个错误。
 *  串行降级在弱网下会叠加每级超时（实测单次连接可达 7~8s，超过前端 15s 请求超时），故改为竞速。 */
async function firstFulfilled(fns) {
  return await new Promise((resolve, reject) => {
    let pending = fns.length
    let firstErr = null
    fns.forEach((fn) => {
      Promise.resolve()
        .then(fn)
        .then(resolve, (e) => {
          if (!firstErr) firstErr = e
          if (--pending === 0) reject(firstErr || new Error('全部行情源均失败'))
        })
    })
  })
}

/** 指数实时行情（stock_zh_index_spot_em 等价）。
 *  三源并行竞速：东财 clist（全量系列）/ 东财 ulist.np（按 secids）/ 腾讯 qt.gtimg.cn（跨厂商兜底）。
 *  兜底原因：东财 push2 域名下 /api/qt/* 在部分网络会被 WAF 直接 RST（ECONNRESET），
 *  单靠东财会整页空白，故末级切厂商保证指数卡片有数。 */
async function getStockIndexSpot(symbol = '上证系列指数') {
  const source = (name, fn) => async () => {
    try {
      const list = await fn()
      if (list && list.length) return list
      throw new Error('返回空')
    } catch (e) {
      console.warn(`[aktools] 指数源 ${name}(${symbol}) 失败: ${e.message}`)
      throw e
    }
  }
  return await firstFulfilled([
    source('clist', () => getIndexSpotFromClist(symbol)),
    source('ulist', () => getIndexSpotFromUlist(symbol)),
    source('tencent', () => getIndexSpotFromTencent(symbol))
  ])
}

/** 主路径：东财 clist（沪深重要指数→33.push2 fs=b:MK0010，其余→48.push2 按系列 fs） */
async function getIndexSpotFromClist(symbol) {
  if (symbol === '沪深重要指数') {
    const url = `https://33.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&ut=${UT_SPOT}&fltt=2&invt=2&dect=1&wbp2u=|0|0|0|web&fid=&fs=b:MK0010&fields=f2,f3,f4,f5,f6,f7,f10,f12,f14,f15,f16,f17,f18`
    const json = await getJson(url, { retries: 0, timeout: 8000 })
    const diff = json && json.data && json.data.diff
    if (!diff) return []
    return diff.map((it, i) => mapIndexSpot(it, i))
  }
  const symbolMap = { '上证系列指数': 'm:1+t:1', '深证系列指数': 'm:0+t:5', '指数成份': 'm:1+s:3,m:0+t:5', '中证系列指数': 'm:2' }
  const fs = symbolMap[symbol] || 'm:1+t:1'
  const url = `https://48.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=500&po=1&np=1&ut=${UT_SPOT}&fltt=2&invt=2&wbp2u=|0|0|0|web&fid=f12&fs=${fs}&fields=f2,f3,f4,f5,f6,f7,f10,f12,f14,f15,f16,f17,f18`
  const json = await getJson(url, { retries: 0, timeout: 8000 })
  // 东财 clist 返回的是 data.diff（对象数组），不是 data.list；原实现误读 list 恒为空
  const diff = json && json.data && json.data.diff
  if (!diff) return []
  return diff.map((it, i) => mapIndexSpot(it, i))
}

/** 兜底路径：ulist.np/get?secids=... 按指数代码精确取数，字段与 clist 同为 f2/f3/f12/f14... */
async function getIndexSpotFromUlist(symbol) {
  const secids = INDEX_FALLBACK_SECIDS[symbol] || INDEX_FALLBACK_SECIDS['上证系列指数']
  const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&secids=${secids}&fields=f2,f3,f4,f5,f6,f7,f10,f12,f14,f15,f16,f17,f18`
  const json = await getJson(url, { retries: 0, timeout: 8000 })
  const diff = json && json.data && json.data.diff
  if (!diff || !diff.length) throw new Error(`指数行情兜底接口返回空(${symbol})`)
  return diff.map((it, i) => mapIndexSpot(it, i))
}

/** 末级兜底：腾讯行情 qt.gtimg.cn（东财 push2 域名不可达时切厂商）。
 *  返回 GBK 文本，行格式 v_s_sh000001="1~上证指数~000001~3842.19~11.74~0.31~414560247~67939899~~682245.82~ZS~";
 *  字段序：0市场标识 1名称 2代码 3最新价 4涨跌额 5涨跌幅 6成交量(手) 7成交额(万元)。
 *  价格/涨跌幅口径与东财 fltt=2 一致，可直接复用 mapIndexSpot。 */
async function getIndexSpotFromTencent(symbol) {
  const secids = INDEX_FALLBACK_SECIDS[symbol] || INDEX_FALLBACK_SECIDS['上证系列指数']
  const q = secids.split(',').map((id) => {
    const [market, code] = id.split('.')
    return `s_${market === '1' ? 'sh' : 'sz'}${code}`
  }).join(',')
  const text = await getText(`https://qt.gtimg.cn/q=${q}`, {
    encoding: 'gbk',
    headers: { Referer: 'https://gu.qq.com/' },
    retries: 0, timeout: 14000
  })
  const out = []
  const re = /v_s_(?:sh|sz)(\d{6})="([^"]*)"/g
  let m
  while ((m = re.exec(text)) !== null) {
    const f = m[2].split('~')
    if (f.length < 6 || f[3] === '') continue
    const price = Number(f[3])
    const change = Number(f[4])
    const amountWan = Number(f[7])
    out.push(mapIndexSpot({
      f12: m[1], f14: f[1],
      f2: price, f3: Number(f[5]), f4: change,
      f5: Number(f[6]),
      // 腾讯成交额单位为万元，转成与东财一致的元；字段缺失时不写 NaN（JSON 会变成 null）
      f6: Number.isFinite(amountWan) ? amountWan * 10000 : undefined,
      f18: Number.isFinite(price) && Number.isFinite(change) ? Math.round((price - change) * 100) / 100 : undefined
    }, out.length))
  }
  if (!out.length) throw new Error(`腾讯行情兜底返回空(${symbol})`)
  return out
}

function mapIndexSpot(it, i) {
  return {
    '序号': i + 1, '代码': it.f12, '名称': it.f14, '最新价': it.f2, '涨跌幅': it.f3, '涨跌额': it.f4,
    '成交量': it.f5, '成交额': it.f6, '振幅': it.f7, '最高': it.f15, '最低': it.f16, '今开': it.f17, '昨收': it.f18, '量比': it.f10
  }
}

/** 昨日涨停股池（stock_zt_pool_previous_em 等价）；字段键 c/m/n/p/ztp/zdp/amount/ltsz/tshare/hs/zf/zs/yfbt/ylbc/hybk/zttj */
async function getZtPoolPrevious(date) {
  const url = `https://push2ex.eastmoney.com/getYesterdayZTPool?ut=${UT}&dpt=wz.ztzt&Pageindex=0&pagesize=5000&sort=zs:desc&date=${date}`
  const json = await getJson(url)
  const pool = json && json.data && json.data.pool
  if (!pool || !pool.length) return []
  return pool.map((it) => ({
    '代码': it.c, '名称': it.n, '最新价': it.p / 1000, '涨停价': it.ztp / 1000, '涨跌幅': it.zdp,
    '成交额': it.amount, '流通市值': it.ltsz, '总市值': it.tshare, '换手率': it.hs, '振幅': it.zf,
    '涨速': it.zs, '昨日封板时间': pad6(it.yfbt), '昨日连板数': it.ylbc, '所属行业': it.hybk,
    '涨停统计': it.zttj ? `${it.zttj.days}/${it.zttj.ct}` : null
  }))
}

/** 时间在区间内（粗粒度日期级，用于分钟数据过滤） */
function inRange(t, sd, ed) {
  if (!sd && !ed) return true
  const s = String(sd || '').replace(/\D/g, ''), e = String(ed || '').replace(/\D/g, '')
  const x = String(t || '').replace(/\D/g, '').slice(0, 8)
  return (!s || x >= s.slice(0, 8)) && (!e || x <= e.slice(0, 8))
}

/** 个股分时（stock_zh_a_hist_min_em 等价）；period=1→trends2(8字段)，5/15/30/60→kline(11字段)
 *  取数顺序：东财 push2his → 腾讯 day·minute query / mkline（东财域名被拦时跨厂商兜底） */
async function getStockMinute({ symbol, period = '5', start_date, end_date, adjust = '' }) {
  const market = symbol.startsWith('6') ? 1 : 0
  const fqt = adjust === 'qfq' ? '1' : adjust === 'hfq' ? '2' : '0'
  let lastErr = null
  try {
    if (period === '1') {
      const url = `https://push2his.eastmoney.com/api/qt/stock/trends2/get?fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58&ut=${UT}&ndays=5&iscr=0&secid=${market}.${symbol}`
      const json = await getJson(url, { retries: 0, timeout: 10000 })
      const trends = json && json.data && json.data.trends
      if (!trends || !trends.length) return []
      return trends.map((line) => {
        const p = line.split(',')
        return { '时间': p[0], '开盘': +p[1], '收盘': +p[2], '最高': +p[3], '最低': +p[4], '成交量': +p[5], '成交额': +p[6], '均价': +p[7] }
      }).filter((r) => inRange(r['时间'], start_date, end_date))
    }
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&ut=${UT}&klt=${period}&fqt=${fqt}&secid=${market}.${symbol}&beg=0&end=20500000`
    const json = await getJson(url, { retries: 0, timeout: 10000 })
    const klines = json && json.data && json.data.klines
    if (!klines || !klines.length) return []
    return klines.map((line) => {
      const p = line.split(',')
      return { '时间': p[0], '开盘': +p[1], '收盘': +p[2], '最高': +p[3], '最低': +p[4], '成交量': +p[5], '成交额': +p[6], '振幅': +p[7], '涨跌幅': +p[8], '涨跌额': +p[9], '换手率': +p[10] }
    }).filter((r) => inRange(r['时间'], start_date, end_date))
  } catch (e) {
    lastErr = e
  }
  // 腾讯兜底（仅东财网络层失败时触发；东财返回空视为真无数据）
  try {
    const rows = period === '1'
      ? await getMinuteFromTencent(symbol, start_date, end_date)
      : await getMklineFromTencent(symbol, period, start_date, end_date)
    if (rows.length) {
      console.warn(`[aktools] 东财分时不可用(${symbol},p${period}: ${lastErr && lastErr.message})，切换腾讯兜底(${rows.length} 行)`)
      return rows
    }
  } catch (e) {
    lastErr = lastErr || e
  }
  throw lastErr || new Error(`东财/腾讯分时均返回空(${symbol},${period})`)
}

/** 个股信息（stock_individual_info_em 等价）；返回 [{item,value}]（akshare 同构） */
async function getStockInfo(symbol) {
  const market = symbol.startsWith('6') ? 1 : 0
  const url = `https://push2.eastmoney.com/api/qt/stock/get?fltt=2&invt=2&fields=f57,f58,f84,f85,f127,f116,f117,f189,f43&secid=${market}.${symbol}`
  const json = await getJson(url)
  const d = json && json.data
  if (!d) return []
  const map = { f57: '股票代码', f58: '股票简称', f84: '总股本', f85: '流通股', f127: '行业', f116: '总市值', f117: '流通市值', f189: '上市时间', f43: '最新' }
  return Object.entries(map).map(([k, label]) => ({ item: label, value: d[k] }))
}

/** 十大股东持股明细（stock_gdfx_holding_detail_em 等价）；datacenter-web，取首页 50 条（全量分页不现实） */
async function getStockHolding({ date, indicator = '个人', symbol: change = '新进' }) {
  const d = String(date || '')
  const endDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
  const filter = `(HOLDER_NEWTYPE="${indicator}")(HOLDNUM_CHANGE_NAME="${change}")(END_DATE='${endDate}')`
  const url = `https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=NOTICE_DATE,SECURITY_CODE,RANK&sortTypes=-1,1,1&pageSize=50&pageNumber=1&reportName=RPT_DMSK_HOLDERS&columns=ALL&source=WEB&client=WEB&filter=${encodeURIComponent(filter)}`
  const json = await getJson(url)
  const rows = json && json.result && json.result.data
  if (!rows) return []
  return rows.map((it, i) => ({
    '序号': i + 1, '股东名称': it.HOLDER_NAME, '股东类型': it.HOLDER_NEWTYPE, '股票代码': it.SECURITY_CODE,
    '股票简称': it.SECURITY_NAME_ABBR, '报告期': it.END_DATE, '期末持股-数量': it.HOLD_NUM,
    '期末持股-数量变化': it.HOLD_NUM_CHANGE, '期末持股-数量变化比例': it.HOLD_RATIO_CHANGE,
    '期末持股-持股变动': it.HOLDNUM_CHANGE_NAME, '期末持股-流通市值': it.HOLDER_MARKET_CAP, '公告日': it.NOTICE_DATE, '股东排名': it.RANK
  }))
}

/** 行业板块一览（stock_board_industry_summary_ths 等价，主源东财 clist JSON）；
 *  fs=m:90+t:2 行业板块，pz=200 一次取全（~100 板块）。
 *  字段：f14=板块名 f3=涨跌幅 f5=总成交量 f6=总成交额 f62=净流入 f104=上涨家数 f105=下跌家数 f128=领涨股名 f140=领涨股涨跌幅。
 *  均价/领涨股-最新价：东财 clist 未确认对应 f 码，暂 null（converter 可处理 null），待限流缓解后补测确认。
 *  取数顺序：东财 clist → 同花顺 thshy 静态页（push2 被拦或返回空时兜底，单位折算见 parseThsIndustryRows）。 */
async function getStockIndustry() {
  let lastErr = null
  try {
    const url = `https://17.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=200&po=1&np=1&ut=${UT_SPOT}&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f12,f14,f3,f5,f6,f62,f104,f105,f128,f140`
    const json = await getJson(url, { retries: 0, timeout: 10000 })
    // 东财 clist 返回 data.diff（np=1 为数组），不是 data.list——原实现误读 list 恒为空
    const diff = json && json.data && json.data.diff
    const list = Array.isArray(diff) ? diff : diff ? Object.values(diff) : null
    if (list && list.length) {
      return list.map((it) => ({
        '板块': it.f14,
        '涨跌幅': it.f3,
        '总成交量': it.f5,
        '总成交额': it.f6,
        '净流入': it.f62,
        '上涨家数': it.f104,
        '下跌家数': it.f105,
        '均价': null,
        '领涨股': it.f128,
        '领涨股-最新价': null,
        '领涨股-涨跌幅': it.f140
      })).filter((r) => r['板块'])
    }
    lastErr = new Error('东财行业板块返回空')
  } catch (e) {
    lastErr = e
  }
  try {
    const rows = await getStockIndustryFromThs()
    console.warn(`[aktools] 东财行业板块不可用(${lastErr && lastErr.message})，切换同花顺 thshy 兜底(${rows.length} 个)`)
    return rows
  } catch (e) {
    throw lastErr || e
  }
}

// ==== 跨厂商兜底数据源（东财 push2/push2his 的 /api/qt/* 被网络 WAF RST 时的降级路径） ====
// 依赖：腾讯 web.ifzq.gtimg.cn / ifzq.gtimg.cn / proxy.finance.qq.com（行情 JSON），同花顺 q.10jqka.com.cn（GBK 静态页）。
// 这些厂商本身不可达时，兜底抛错并沿用东财原始错误，不影响主路径语义。

/** A股代码 → 腾讯代码前缀：北交所(43/8x/920)→bj，6 开头→sh，其余(0/3 深市)→sz */
function txStockPrefix(code) {
  const c = String(code)
  if (/^(43|8[2-9]|920)/.test(c)) return 'bj'
  return c.startsWith('6') ? 'sh' : 'sz'
}

/** 指数代码 → 腾讯前缀：399 深证系列→sz，其余(000 上证系列/中证)→sh */
function txIndexPrefix(code) { return String(code).startsWith('399') ? 'sz' : 'sh' }

/** '20260901' / '2026-09-01' / '' → '2026-09-01' / ''（腾讯 fqkline 日期参数要求 YYYY-MM-DD） */
function fmtDashedDate(v) {
  const d = String(v || '').replace(/\D/g, '')
  return d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : ''
}

/** 数值解析：空串/非数字 → null（避免 NaN 进 JSON 变 null 的脏值） */
function nv(v) { const n = Number(v); return Number.isFinite(n) ? n : null }

/** 保留两位小数（百分比类字段） */
function round2(x) { return Number.isFinite(x) ? Math.round(x * 100) / 100 : null }

/** 按日期区间过滤（数字串比较，兼容 '2026-09-01' / '20260901' / 空=不过滤） */
function filterRowsByDate(rows, sd, ed, dateKey = '日期') {
  const s = String(sd || '').replace(/\D/g, '')
  const e = String(ed || '').replace(/\D/g, '')
  if (!s && !e) return rows
  return rows.filter((r) => {
    const d = String(r[dateKey]).replace(/\D/g, '')
    return (!s || d >= s) && (!e || d <= e)
  })
}

/** 简单并发池：最多 limit 个 worker 并发消费 items，结果按输入顺序返回 */
async function runPool(items, limit, worker) {
  const out = new Array(items.length)
  let next = 0
  const lanes = Array.from({ length: Math.max(1, Math.min(limit, items.length || 1)) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await worker(items[i], i)
    }
  })
  await Promise.all(lanes)
  return out
}

/** 腾讯 K 线原始行 → 与东财 klines 同构的中文键行。
 *  腾讯行结构 [date, open, close, high, low, volume(手), ...]；成交额/换手率腾讯不提供 → null。
 *  涨跌额/涨跌幅/振幅按前一根收盘价计算，首根无前收 → null（前端 Number(null)||0 显示 0）。 */
function mapTxKline(rawRows, { symbol = null, dateKey = '日期' } = {}) {
  let prevClose = null
  return rawRows.map((p) => {
    const o = nv(p[1]), c = nv(p[2]), h = nv(p[3]), l = nv(p[4])
    const chg = prevClose == null || c == null ? null : round2(c - prevClose)
    const row = {
      [dateKey]: p[0],
      ...(symbol ? { '股票代码': symbol } : {}),
      '开盘': o, '收盘': c, '最高': h, '最低': l, '成交量': nv(p[5]),
      '成交额': null,
      '振幅': prevClose == null ? null : round2((h - l) / prevClose * 100),
      '涨跌幅': prevClose == null ? null : round2(chg / prevClose * 100),
      '涨跌额': chg,
      '换手率': null
    }
    if (c != null) prevClose = c
    return row
  })
}

/** 估算腾讯 fqkline 需要的 count。
 *  下限 200 是实测结论：区间请求时 count 过小会命中腾讯服务端的慢路径——
 *  count=43 在同一 URL 上出现过 5s(超时)/2.7s/79ms 的巨大抖动，而 count≥200 稳定 ~75ms（3/3 次）。
 *  上限 2000（实测 3000 即返回 bad params）。多要一些根数不影响返回体大小（区间内只有真实交易日那么多行）。 */
function estimateTxKlineCount(start, end, periodKey) {
  const MIN_COUNT = 200
  const DEFAULT_COUNT = 640 // 无区间时约 2.5 年交易日，足够图表展示
  const MAX_COUNT = 2000
  if (!start || !end) return DEFAULT_COUNT
  const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1
  if (!Number.isFinite(days) || days <= 0) return DEFAULT_COUNT
  const per = periodKey === 'week' ? 7 : periodKey === 'month' ? 30 : 1
  return Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.ceil(days / per) + 10))
}

/** 腾讯 fqkline 单次请求（并发对冲）。
 *  实测 2026-10：腾讯同一 URL 的耗时在 75ms 与 5s 之间跳（服务端会话冷启动/坏节点），
 *  串行"短超时+立即重试"仍可能连续两次都撞上坏状态（实测 2.5s × 2 = 5s）。
 *  因此改成并发对冲：先发一条，600ms 还没动静就并发补一条，谁先成功用谁——
 *  实测对冲把冷启动那次的等待从 5s 压到 ~0.5s，最坏情形约 4s（单条超时上限）。 */
async function txFetchKline(code, periodKey, fq, start, end, count) {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},${periodKey},${fmtDashedDate(start)},${fmtDashedDate(end)},${count},${fq}`
  const once = () => getJson(url, { retries: 0, timeout: 4000, headers: { Referer: 'https://gu.qq.com/' } })
  let hedgeTimer = null
  const hedge = new Promise((resolve, reject) => {
    hedgeTimer = setTimeout(() => { once().then(resolve, reject) }, 600)
  })
  let json
  try {
    json = await Promise.race([once(), hedge])
  } finally {
    if (hedgeTimer) clearTimeout(hedgeTimer)
  }
  const box = json && json.data && json.data[code]
  if (!box) return []
  // 返回键名随复权参数变化：day/qfqday/hfqday、week/qfqweek...，故按后缀探测
  const key = [`${fq}${periodKey}`, periodKey, `qfq${periodKey}`, `hfq${periodKey}`]
    .find((k) => Array.isArray(box[k]) && box[k].length)
  return key ? box[key] : []
}

/** 腾讯 fqkline（K 线兜底）；periodKey: day|week|month，fq: ''(不复权)|qfq|hfq。
 *  count 未显式指定时按区间估算（上限 2000，实测 3000 即 bad params）。 */
async function getKlineFromTencent({ symbol, isIndex = false, periodKey = 'day', fq = '', start, end, count }) {
  const code = (isIndex ? txIndexPrefix(symbol) : txStockPrefix(symbol)) + symbol
  return await txFetchKline(code, periodKey, fq, start, end, count || estimateTxKlineCount(start, end, periodKey))
}

/** 上游预热（best-effort，fire-and-forget，失败静默）。
 *  背景（实测 2026-10）：腾讯 fqkline/榜单/分时、同花顺行业页、东财 push2ex、Tushare daily
 *  都存在"进程内首次请求被服务端挂起 3~10s、之后 ~100ms"的冷启动现象
 *  （腾讯 10 次连测：前 2 次 5s/3.2s、后 8 次全 ~80ms；Tushare 首次 10.6s、第二次 37ms）。
 *  这是连接/会话冷启动而非参数问题，对策是启动后台按"长超时"把每个源打热：
 *  - 必须用长超时：用户侧请求用短超时（否则预热自己会被掐断，起不到作用）；
 *  - 慢/失败再打一次：冷启动只影响"第一次"，补打一次基本必然命中热路径；
 *  - 并发执行：串行会累加（5+8+8+10s ≈ 30s），期间用户仍会撞冷启动。 */
async function warmupUpstream() {
  const SLOW = { retries: 0, timeout: 20000 } // 预热专用：宁可等 20s 也要把连接打通
  const SLOW_GBK = Object.assign({ encoding: 'gbk' }, SLOW)
  const TX_H = { headers: { Referer: 'https://gu.qq.com/' } }
  const RANK_H = { headers: { Referer: 'https://stockapp.finance.qq.com/' } }
  const EM_H = { headers: { Referer: 'https://quote.eastmoney.com/' } }
  const tasks = [
    // 1) 腾讯 fqkline（日K 前复权，count 取下限 200 —— count 过小会命中腾讯慢路径）
    () => getJson('https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh600519,day,,,200,qfq', Object.assign({}, TX_H, SLOW)),
    // 2) 腾讯全市场榜单（proxy.finance.qq.com）：打第一页即可建立连接
    () => getJson('https://proxy.finance.qq.com/cgi/cgi-bin/rank/hs/getBoardRankList?_appver=11.17.0&board_code=aStock&sort_type=price&direct=down&offset=0&count=10', Object.assign({}, RANK_H, SLOW)),
    // 3) 同花顺行业页（q.10jqka.com.cn，GBK）
    () => getText('https://q.10jqka.com.cn/thshy/', SLOW_GBK),
    // 4) 腾讯分时 day/query（p1 分时兜底路径，实测首请求 ~7.7s）
    () => getJson('https://web.ifzq.gtimg.cn/appstock/app/day/query?code=sh600519', Object.assign({}, TX_H, SLOW)),
    // 5) 腾讯分钟 mkline（p5/p15/p30/p60 兜底路径）
    () => getJson('https://ifzq.gtimg.cn/appstock/app/kline/mkline?param=sh600519,m5,,50', Object.assign({}, TX_H, SLOW)),
    // 6) 腾讯实时行情 qt.gtimg.cn（指数快照兜底，GBK）
    () => getText('https://qt.gtimg.cn/q=s_sh000001,s_sz399001', Object.assign({ encoding: 'gbk' }, SLOW)),
    // 7) 东财 push2ex 涨停池（涨停/跌停/昨日涨停池数据源，实测首请求可卡 7s+）
    () => getJson(`https://push2ex.eastmoney.com/getTopicZTPool?ut=${UT}&dpt=wz.ztzt&Pageindex=0&pagesize=10&sort=fbt:asc&date=20260101`, Object.assign({}, EM_H, SLOW)),
    // 8) Tushare daily + adj_factor（若已配置账号）：实测首次调用 ~10s
    async () => {
      if (!settings.isTushareConfigured()) return null
      return await tushare.getDailyBar('600519', '20260101', '20260131')
    }
  ]
  // 慢或失败再补打一次：冷启动只影响第一次请求，第二发基本必然命中热路径
  const runWithRetry = async (t) => {
    const s = Date.now()
    try {
      await t()
      if (Date.now() - s > 1500) await t() // 首打就慢 → 说明命中冷启动，补打一次
    } catch (e) {
      try { await t() } catch (e2) { /* 预热失败无副作用 */ }
    }
  }
  await Promise.all(tasks.map(runWithRetry))
}

/** 腾讯全市场榜单（getBoardRankList board_code=aStock，UTF-8）。
 *  count 实测上限 200（500 即报错），全市场 ~5600 只需分页 + 并发拉取。
 *  单位折算：turnover=万元→元，zsz/ltsz=亿元→元；成交量(手)/换手率/涨跌幅与东财口径一致。
 *  腾讯榜单无 高/低/开/昨收/量比 字段 → 置 null（mapSpotItem 兜底为 0）。
 *  单页 timeout 取 4s（不是 15s）：28 页中任一页卡住都会拖垮整体（6 并发 × 15s ≈ 75s），
 *  而腾讯的卡顿都是"进程内冷启动"级别，warmupUpstream 已提前打通连接。 */
async function getStockSpotFromTencent() {
  const PAGE = 200
  const MAX_PAGES = 40
  const fetchPage = async (offset) => {
    const url = `https://proxy.finance.qq.com/cgi/cgi-bin/rank/hs/getBoardRankList?_appver=11.17.0&board_code=aStock&sort_type=price&direct=down&offset=${offset}&count=${PAGE}`
    const json = await getJson(url, { retries: 1, timeout: 4000, retryDelay: 0, headers: { Referer: 'https://stockapp.finance.qq.com/' } })
    const d = json && json.data
    return { list: (d && d.rank_list) || [], total: (d && d.total) || 0 }
  }
  const first = await fetchPage(0)
  if (!first.list.length) throw new Error('腾讯全市场行情返回空')
  const total = first.total || first.list.length
  const offsets = []
  for (let o = PAGE; o < total && offsets.length < MAX_PAGES - 1; o += PAGE) offsets.push(o)
  const rest = offsets.length ? await runPool(offsets, 6, fetchPage) : []
  const all = first.list.concat(...rest.map((r) => r.list))
  return all.map((it, i) => ({
    '序号': i + 1,
    '代码': String(it.code || '').replace(/^(sh|sz|bj)/, ''),
    '名称': it.name,
    '最新价': nv(it.zxj), '涨跌幅': nv(it.zdf), '涨跌额': nv(it.zd),
    '成交量': nv(it.volume),
    '成交额': nv(it.turnover) == null ? null : nv(it.turnover) * 10000,
    '振幅': nv(it.zf),
    '最高': null, '最低': null, '今开': null, '昨收': null, '量比': null,
    '换手率': nv(it.hsl), '市盈率-动态': nv(it.pe_ttm), '市净率': nv(it.pn),
    '总市值': nv(it.zsz) == null ? null : nv(it.zsz) * 1e8,
    '流通市值': nv(it.ltsz) == null ? null : nv(it.ltsz) * 1e8,
    '涨速': nv(it.speed), '5分钟涨跌': null,
    '60日涨跌幅': nv(it.zdf_d60), '年初至今涨跌幅': nv(it.zdf_y)
  })).filter((r) => r['代码'])
}

/** 腾讯分钟 K 线兜底（ifzq.gtimg.cn mkline，参数 m5/m15/m30/m60）。
 *  行结构 ['YYYYMMDDHHmm', open, close, high, low, volume(手), {}, ...]，对齐东财分钟 K 线 11 字段。 */
async function getMklineFromTencent(symbol, period, start_date, end_date) {
  const code = txStockPrefix(symbol) + symbol
  const url = `https://ifzq.gtimg.cn/appstock/app/kline/mkline?param=${code},m${period},,2000`
  const json = await getJson(url, { retries: 1, timeout: 4000, retryDelay: 0, headers: { Referer: 'https://gu.qq.com/' } })
  const box = json && json.data && json.data[code]
  const raw = box && box[`m${period}`]
  if (!raw || !raw.length) return []
  let prevClose = null
  const rows = raw.map((p) => {
    const stamp = String(p[0] || '')
    const time = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)} ${stamp.slice(8, 10)}:${stamp.slice(10, 12)}`
    const o = nv(p[1]), c = nv(p[2]), h = nv(p[3]), l = nv(p[4])
    const chg = prevClose == null || c == null ? null : round2(c - prevClose)
    const row = {
      '时间': time, '开盘': o, '收盘': c, '最高': h, '最低': l, '成交量': nv(p[5]),
      '成交额': null,
      '振幅': prevClose == null ? null : round2((h - l) / prevClose * 100),
      '涨跌幅': prevClose == null ? null : round2(chg / prevClose * 100),
      '涨跌额': chg, '换手率': null
    }
    if (c != null) prevClose = c
    return row
  })
  return rows.filter((r) => inRange(r['时间'], start_date, end_date))
}

/** 腾讯分时兜底（period=1）：day/query 取指定日区间，无数据再退 minute/query（仅最近交易日）。
 *  行为 ['HHmm', 现价, 累计成交量(手), 累计成交额(元)]——腾讯给累计值，差分成单分钟量额；
 *  单分钟只有成交价：开盘取前一分钟收盘价，高/低取端点，均价=单分钟额/(量×100)。 */
async function getMinuteFromTencent(symbol, start_date, end_date) {
  const code = txStockPrefix(symbol) + symbol
  // timeout 4s（不是 15s）：腾讯被限流时整站请求会挂在 5s+，15s 只会让用户干等；
  // 拿不到就返回空，由上层按"空数据"处理（分时没有第三方兜底源）。
  const opts = { retries: 0, timeout: 4000, headers: { Referer: 'https://gu.qq.com/' } }
  let days = []
  try {
    const ed = String(end_date || '').replace(/\D/g, '')
    const json = await getJson(`https://web.ifzq.gtimg.cn/appstock/app/day/query?code=${code}${ed ? `&date=${ed}` : ''}`, opts)
    days = (json && json.data && json.data[code] && json.data[code].data) || []
    if (!Array.isArray(days)) days = []
  } catch { days = [] }
  if (!days.length) {
    const json = await getJson(`https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${code}`, opts)
    const box = json && json.data && json.data[code] && json.data[code].data
    if (box && box.date) days = [{ date: box.date, data: box.data }]
  }
  const rows = []
  for (const day of days) {
    const d = String(day.date || '')
    if (d.length !== 8) continue
    let prevPx = null, prevVol = 0, prevAmt = 0
    for (const line of day.data || []) {
      const p = String(line).split(' ')
      if (p.length < 4) continue
      const price = nv(p[1]), vol = nv(p[2]), amt = nv(p[3])
      if (price == null || vol == null || amt == null) continue
      const perVol = Math.max(vol - prevVol, 0)
      const perAmt = Math.max(amt - prevAmt, 0)
      rows.push({
        '时间': `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)} ${p[0].slice(0, 2)}:${p[0].slice(2, 4)}`,
        '开盘': prevPx == null ? price : prevPx,
        '收盘': price,
        '最高': prevPx == null ? price : Math.max(prevPx, price),
        '最低': prevPx == null ? price : Math.min(prevPx, price),
        '成交量': perVol,
        '成交额': perAmt,
        '均价': perVol > 0 ? round2(perAmt / (perVol * 100)) : null
      })
      prevPx = price; prevVol = vol; prevAmt = amt
    }
  }
  return rows.filter((r) => inRange(r['时间'], start_date, end_date))
}

/** 同花顺行业板块兜底（q.10jqka.com.cn/thshy，GBK 静态页；每页 50 行，全行业 ~90 个两页取完）。
 *  列序：序号|板块|涨跌幅(%)|总成交量(万手)|总成交额(亿元)|净流入(亿元)|上涨家数|下跌家数|均价|领涨股|领涨股最新价|领涨股涨跌幅。
 *  单位折算为东财口径：万手→手(×1e4)，亿元→元(×1e8)，保证 DolphinDB plate_market_quotation 存量数据同构。 */
async function getStockIndustryFromThs() {
  const pages = ['', 'index/page/2/', 'index/page/3/']
  const out = []
  for (const p of pages) {
    const html = await getText(`https://q.10jqka.com.cn/thshy/${p}`, {
      encoding: 'gbk', retries: 0, timeout: 15000,
      headers: { Referer: 'https://q.10jqka.com.cn/thshy/' }
    })
    const rows = parseThsIndustryRows(html)
    if (!rows.length) break
    out.push(...rows)
    if (rows.length < 50) break // 末页不满一页即结束
  }
  if (!out.length) throw new Error('同花顺行业板块返回空')
  return out
}

/** 解析同花顺 thshy 表格行（仅取含板块详情链接的 <tr>，表头/翻档行自动跳过） */
function parseThsIndustryRows(html) {
  const out = []
  for (const tr of String(html).split('<tr>').slice(1)) {
    if (!tr.includes('detail/code/')) continue
    const cells = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1].replace(/<[^>]*>/g, '').trim())
    if (cells.length < 12 || !cells[1]) continue
    const vol = nv(cells[3]), amt = nv(cells[4]), inflow = nv(cells[5])
    out.push({
      '板块': cells[1],
      '涨跌幅': nv(cells[2]),
      '总成交量': vol == null ? null : vol * 1e4,
      '总成交额': amt == null ? null : amt * 1e8,
      '净流入': inflow == null ? null : inflow * 1e8,
      '上涨家数': nv(cells[6]) || 0,
      '下跌家数': nv(cells[7]) || 0,
      '均价': nv(cells[8]),
      '领涨股': cells[9],
      '领涨股-最新价': nv(cells[10]),
      '领涨股-涨跌幅': nv(cells[11])
    })
  }
  return out
}

// ---- 多源调度注册 ----
// 把现有"东财→腾讯→Tushare"复合链整体注册为 main 源（capabilities 全集），
// 再注册新浪/网易为兜底层。公开函数改为委托 registry.dispatch，
// 由调度器统一做空结果判定（软封空数组 → 试下一源）与健康度记忆。
// 不改动各复合函数内部逻辑：main 返回空/抛错时，调度器自动切新浪→网易，
// 等价于把"软封空结果"的兜底从函数内上提到调度层，且新浪无腾讯的冷启动开销。
const registry = require('./sources/registry')
registry.registerSource({
  name: 'main',
  capabilities: ['kline', 'spot', 'indexDaily', 'indexSpot', 'minute', 'limitPool', 'dropPool', 'ztPrev', 'industry', 'info', 'holding'],
  fetchers: {
    kline: getStockHistory,
    spot: getStockSpot,
    indexDaily: getIndexDailyData,
    indexSpot: getStockIndexSpot,
    minute: getStockMinute,
    limitPool: getStockLimitPool,
    dropPool: getStockDropPool,
    ztPrev: getZtPoolPrevious,
    industry: getStockIndustry,
    info: getStockInfo,
    holding: getStockHolding
  },
  available: () => true
})
registry.registerSource(require('./sources/sina'))
// 通达信本地数据源（Path A：纯 Node 读 .day 文件，离线兜底）。
// 直接读通达信安装目录 vipdoc\<sh|sz|bj>\lday\*.day，标准 32 字节格式，
// 零网络零 Python，9527 只历史日K。提为 kline 首选源（registry PRIORITY 已调）。
// 协议路径（tdx_proto，连公网 7709 取实时/分钟）因 pytdx/tdxpy 数据命令返回 None 暂缓，待协议兼容解决。
registry.registerSource(require('./sources/tdx_local'))
// 通达信量化 HTTP 源（Path B：tqcenter 模式，17709）。
// 经运行中已登录 TdxW 取数，实时+全市场+K线/财报/涨跌停。提为 kline/spot/info/limitPool 首选。
// main.js 启动时探测 17709 可达 → setAvailable(true)；TdxW 未运行时 available=false 自动降级。
const tdxQuantSource = require('./sources/tdx_quant')
registry.registerSource(tdxQuantSource)
// 通达信 tqs 源（tqserver/tdxaidata，免客户端，Key 鉴权直连后端）。
// 经 Python 桥 /tdxs_* 端点调用 tdxaidata.tqs。无需 TdxW 运行。提为 kline 最首位。
const tdxServerSource = require('./sources/tdx_server')
registry.registerSource(tdxServerSource)
// 网易财经历史K线端点(chddata.html)已废弃（502/DNS失效），暂不注册；
// 文件保留待 Phase 3 经 AKShare Python 桥接网易数据时复活。
// registry.registerSource(require('./sources/netease'))
// AKShare Python 桥接（Phase 3）：main.js spawn aktools_server.exe 后调 setAvailable(true) 激活；
// 未激活时 available()=false，调度器跳过，零开销。
const akshareSource = require('./sources/akshare')
registry.registerSource(akshareSource)

module.exports = {
  getStockSpot: (codes) => registry.dispatch('spot', codes),
  getStockHistory: (p) => registry.dispatch('kline', p),
  getStockMinute: (p) => registry.dispatch('minute', p),
  getStockInfo: (s) => registry.dispatch('info', s),
  getStockHolding: (p) => registry.dispatch('holding', p),
  getStockLimitPool: (d) => registry.dispatch('limitPool', d),
  getStockDropPool: (d) => registry.dispatch('dropPool', d),
  getStockIndustry: () => registry.dispatch('industry'),
  getZtPoolPrevious: (d) => registry.dispatch('ztPrev', d),
  getStockIndexSpot: (s) => registry.dispatch('indexSpot', s),
  getIndexDailyData: (p) => registry.dispatch('indexDaily', p),
  warmupUpstream,
  // 暴露调度器供数据总览页查询各源健康度
  getSourceHealth: registry.getHealthStatus
}
