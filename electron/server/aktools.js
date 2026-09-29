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
 *   - getStockIndustry                                          → 17.push2 clist（行业板块，替代同花顺反爬）
 *   已真机验证：涨停池/跌停池/指数日K/昨日涨停/股东。其余与已验证函数同构（push2his/clist 限流期待补测）。
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

/** 通用 HTTP GET 取 JSON（支持 http/https，用 Node 核心 http/https 模块，不依赖 undici）。
 *  含重试退避（应对东财偶发 ECONNRESET/超时，akshare 同款策略）。 */
async function getJson(url, { headers = {}, timeout = 30000, retries = 2 } = {}) {
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
          let body = ''
          res.on('data', (c) => { body += c })
          res.on('end', () => {
            if (res.statusCode !== 200) return reject(new Error(`东财返回 ${res.statusCode}: ${url}`))
            try { resolve(JSON.parse(body)) } catch { reject(new Error(`东财返回非 JSON: ${url}`)) }
          })
        })
        req.on('error', (e) => reject(new Error(`东财请求失败 (${e.code || e.message}): ${url}`)))
        req.on('timeout', () => { req.destroy(new Error(`东财请求超时: ${url}`)) })
        req.end()
      })
    } catch (e) {
      lastErr = e
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
    }
  }
  throw lastErr
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
      // 东财返回空：可能是限流软封或确实无数据。配置了 Tushare 则兜底尝试。
      const token = settings.getTushareToken()
      if (token) { console.log('[aktools] 东财涨停池返回空，尝试 Tushare 兜底'); return await tushare.getLimitListD(date, 'U', token) }
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
      const token = settings.getTushareToken()
      if (token) { console.log('[aktools] 东财跌停池返回空，尝试 Tushare 兜底'); return await tushare.getLimitListD(date, 'D', token) }
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
async function fallbackTushare(eastError, date, limitType, label) {
  const token = settings.getTushareToken()
  if (!token) throw eastError
  console.log(`[aktools] 东财${label}失败，回退 Tushare: ${eastError.message.slice(0, 80)}`)
  return await tushare.getLimitListD(date, limitType, token)
}

/** 指数日K（index_zh_a_hist 等价）；klines 逗号串：日期,开,收,高,低,量,额,振幅,涨跌幅,涨跌额,换手率 */
async function getIndexDailyData({ symbol, start_date, end_date, period = 'daily' }) {
  const klt = period === 'weekly' ? '102' : period === 'monthly' ? '103' : '101'
  const known = { '000001': '1', '399001': '0', '399006': '0', '000688': '1', '000300': '1', '000905': '1', '000016': '1', '000852': '1' }
  const prefixes = known[symbol] ? [known[symbol]] : ['1', '0', '2', '47']
  let klines = null
  for (const pf of prefixes) {
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${pf}.${symbol}&ut=${UT}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=${klt}&fqt=0&beg=0&end=20500000`
    const json = await getJson(url)
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
  const sd = (start_date || '00000000').replace(/\D/g, '')
  const ed = (end_date || '99999999').replace(/\D/g, '')
  return rows.filter((r) => {
    const d = String(r['日期']).replace(/\D/g, '')
    return d >= sd && d <= ed
  })
}

/** 个股日K/周K/月K（stock_zh_a_hist 等价）；market: 6开头→上交所(1)，否则→深交所(0) */
async function getStockHistory({ symbol, period = 'daily', start_date, end_date, adjust = 'qfq' }) {
  try {
    const market = symbol.startsWith('6') ? 1 : 0
    const klt = period === 'weekly' ? '102' : period === 'monthly' ? '103' : '101'
    const fqt = adjust === 'qfq' ? '1' : adjust === 'hfq' ? '2' : '0'
    const beg = (start_date || '19700101').replace(/\D/g, '')
    const end = (end_date || '20500101').replace(/\D/g, '')
    const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f116&ut=${UT}&klt=${klt}&fqt=${fqt}&secid=${market}.${symbol}&beg=${beg}&end=${end}`
    const json = await getJson(url)
    const klines = json && json.data && json.data.klines
    if (!klines || !klines.length) {
      if (period === 'daily') return await fallbackKlineTushare(symbol, start_date, end_date)
      return []
    }
    return klines.map((line) => {
      const p = line.split(',')
      return {
        '日期': p[0], '股票代码': symbol, '开盘': +p[1], '收盘': +p[2], '最高': +p[3], '最低': +p[4],
        '成交量': +p[5], '成交额': +p[6], '振幅': +p[7], '涨跌幅': +p[8], '涨跌额': +p[9], '换手率': +p[10]
      }
    })
  } catch (e) {
    if (period === 'daily') return await fallbackKlineTushare(symbol, start_date, end_date, e)
    throw e
  }
}

/** 东财日K失败 → Tushare pro_bar(adj=qfq) 兜底 */
async function fallbackKlineTushare(symbol, startDate, endDate, eastError) {
  const token = settings.getTushareToken()
  if (!token) throw eastError || new Error('东财日K返回空且未配置 Tushare')
  console.log(`[aktools] 东财日K(${symbol})失败，回退 Tushare pro_bar: ${(eastError ? eastError.message : '空数据').slice(0, 80)}`)
  return await tushare.getDailyBar(symbol, startDate, endDate, token)
}

/** 沪深京 A 股实时行情（stock_zh_a_spot_em 等价）；pz=2000 分页取全市场 */
async function getStockSpot() {
  const all = []
  let pn = 1
  while (pn <= 5) { // 最多 5 页 × 2000 = 10000，安全上限
    const url = `https://82.push2.eastmoney.com/api/qt/clist/get?pn=${pn}&pz=2000&po=1&np=1&ut=${UT_SPOT}&fltt=2&invt=2&fid=f12&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048&fields=f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11`
    const json = await getJson(url)
    const list = json && json.data && json.data.list
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
  return all
}

/** 指数实时行情（stock_zh_index_spot_em 等价）；沪深重要指数→33.push2 fs=b:MK0010 data.diff，其余→48.push2 data.list */
async function getStockIndexSpot(symbol = '上证系列指数') {
  if (symbol === '沪深重要指数') {
    const url = `https://33.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&ut=${UT_SPOT}&fltt=2&invt=2&dect=1&wbp2u=|0|0|0|web&fid=&fs=b:MK0010&fields=f2,f3,f4,f5,f6,f7,f10,f12,f14,f15,f16,f17,f18`
    const json = await getJson(url)
    const diff = json && json.data && json.data.diff
    if (!diff) return []
    return diff.map((it, i) => mapIndexSpot(it, i))
  }
  const symbolMap = { '上证系列指数': 'm:1+t:1', '深证系列指数': 'm:0+t:5', '指数成份': 'm:1+s:3,m:0+t:5', '中证系列指数': 'm:2' }
  const fs = symbolMap[symbol] || 'm:1+t:1'
  const url = `https://48.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=500&po=1&np=1&ut=${UT_SPOT}&fltt=2&invt=2&wbp2u=|0|0|0|web&fid=f12&fs=${fs}&fields=f2,f3,f4,f5,f6,f7,f10,f12,f14,f15,f16,f17,f18`
  const json = await getJson(url)
  const list = json && json.data && json.data.list
  if (!list) return []
  return list.map((it, i) => mapIndexSpot(it, i))
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

/** 个股分时（stock_zh_a_hist_min_em 等价）；period=1→trends2(8字段)，5/15/30/60→kline(11字段) */
async function getStockMinute({ symbol, period = '5', start_date, end_date, adjust = '' }) {
  const market = symbol.startsWith('6') ? 1 : 0
  const fqt = adjust === 'qfq' ? '1' : adjust === 'hfq' ? '2' : '0'
  if (period === '1') {
    const url = `https://push2his.eastmoney.com/api/qt/stock/trends2/get?fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58&ut=${UT}&ndays=5&iscr=0&secid=${market}.${symbol}`
    const json = await getJson(url)
    const trends = json && json.data && json.data.trends
    if (!trends || !trends.length) return []
    return trends.map((line) => {
      const p = line.split(',')
      return { '时间': p[0], '开盘': +p[1], '收盘': +p[2], '最高': +p[3], '最低': +p[4], '成交量': +p[5], '成交额': +p[6], '均价': +p[7] }
    }).filter((r) => inRange(r['时间'], start_date, end_date))
  }
  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&ut=${UT}&klt=${period}&fqt=${fqt}&secid=${market}.${symbol}&beg=0&end=20500000`
  const json = await getJson(url)
  const klines = json && json.data && json.data.klines
  if (!klines || !klines.length) return []
  return klines.map((line) => {
    const p = line.split(',')
    return { '时间': p[0], '开盘': +p[1], '收盘': +p[2], '最高': +p[3], '最低': +p[4], '成交量': +p[5], '成交额': +p[6], '振幅': +p[7], '涨跌幅': +p[8], '涨跌额': +p[9], '换手率': +p[10] }
  }).filter((r) => inRange(r['时间'], start_date, end_date))
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

/** 行业板块一览（stock_board_industry_summary_ths 等价，改用东财 clist JSON 替代同花顺反爬）；
 *  fs=m:90+t:2 行业板块，pz=200 一次取全（~100 板块）。
 *  字段：f14=板块名 f3=涨跌幅 f5=总成交量 f6=总成交额 f62=净流入 f104=上涨家数 f105=下跌家数 f128=领涨股名 f140=领涨股涨跌幅。
 *  均价/领涨股-最新价：东财 clist 未确认对应 f 码，暂 null（converter 可处理 null），待限流缓解后补测确认。 */
async function getStockIndustry() {
  const url = `https://17.push2.eastmoney.com/api/qt/clist/get?pn=1&pz=200&po=1&np=1&ut=${UT_SPOT}&fltt=2&invt=2&fid=f3&fs=m:90+t:2+f:!50&fields=f12,f14,f3,f5,f6,f62,f104,f105,f128,f140`
  const json = await getJson(url)
  const list = json && json.data && json.data.list
  if (!list) return []
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

module.exports = {
  getStockSpot,
  getStockHistory,
  getStockMinute,
  getStockInfo,
  getStockHolding,
  getStockLimitPool,
  getStockDropPool,
  getStockIndustry,
  getZtPoolPrevious,
  getStockIndexSpot,
  getIndexDailyData
}
