'use strict'

/**
 * AKShare 数据源（Python 桥接）。
 *
 * 通过 HTTP 调用本机 AKShare 桥接服务（python/aktools_server，由 Electron 主进程 spawn）。
 * akshare DataFrame 列名本就是中文键，服务端已 df.to_dict('records')，本模块只做 HTTP 取数。
 *
 * 可用性：服务由 main.js 生命周期管理（startAkshareServer/stopAkshareServer）。
 * main.js 在服务就绪后调 setAvailable(true, port)，停止/退出时 setAvailable(false)。
 * 未就绪时 available() 返回 false，调度器直接跳过本源（不浪费 HTTP 尝试）。
 *
 * 优先级：kline/spot/indexDaily 等放 main/sina 之后作末级兜底；
 * limitPool/dropPool/ztPrev 作 main（东财/Tushare）之后的第二源——这是关键补强，
 * 因涨跌停池此前仅有东财+Tushare（Tushare 未配置时单点）。
 */

const http = require('http')

let serverPort = 8889
let available = false  // 由 main.js 生命周期设置；默认 false，避免服务未起时浪费请求

function setAvailable(up, port) {
  available = !!up
  if (port) serverPort = Number(port) || serverPort
}

/** GET JSON（中文键对象数组）。服务端返回 {code,msg,data}，取 data。 */
function call(endpoint, { timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = `http://127.0.0.1:${serverPort}${endpoint}`
    const req = http.get(url, { timeout }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`AKShare服务返回 ${res.statusCode}`))
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (json.code !== 200) return reject(new Error(`AKShare服务: ${json.msg || '未知错误'}`))
          resolve(json.data || [])
        } catch (e) {
          reject(new Error('AKShare服务返回非JSON'))
        }
      })
    })
    req.on('error', e => reject(new Error(`AKShare服务请求失败(${e.code || e.message})`)))
    req.on('timeout', () => req.destroy(new Error('AKShare服务请求超时')))
  })
}

/** 日期/参数拼到 query string */
function qs(params) {
  const p = {}
  for (const [k, v] of Object.entries(params || {})) {
    if (v != null && v !== '') p[k] = v
  }
  return new URLSearchParams(p).toString()
}

const fetchers = {
  kline: (p) => call('/kline?' + qs(p)),
  spot: () => call('/spot'),
  indexDaily: (p) => call('/index_daily?' + qs(p)),
  limitPool: (d) => call('/limit_pool?date=' + encodeURIComponent(d)),
  dropPool: (d) => call('/drop_pool?date=' + encodeURIComponent(d)),
  ztPrev: (d) => call('/zt_prev?date=' + encodeURIComponent(d)),
  industry: () => call('/industry'),
  info: (s) => call('/info?symbol=' + encodeURIComponent(s)),
  minute: (p) => call('/minute?' + qs(p)),
  // 定期财报（三大表+指标合并，最近 N 季）——逐只，供财报同步路由调用
  financial: (p) => call('/financial?' + qs(p), { timeout: 60000 }),
  // 衍生估值指标快照（PE-TTM/PB/PS/PCF/股息率，百度估值）——逐只，供指标同步路由调用
  indicator: (p) => call('/indicator?' + qs(p), { timeout: 60000 }),
  // 行业板块列表（新浪源，49 板块，含 label/板块/涨跌幅/领涨股）
  boardList: () => call('/board_list', { timeout: 30000 }),
  // 板块成分股（新浪源，label 如 new_blhy）
  boardCons: (label) => call('/board_cons?label=' + encodeURIComponent(label), { timeout: 30000 }),
  // 批量股票元数据（上市日，沪/深/北交所全量）——供 stock_basic 同步派生 list_date
  stockMeta: () => call('/stock_meta_batch', { timeout: 60000 })
}

module.exports = {
  name: 'akshare',
  capabilities: ['kline', 'spot', 'indexDaily', 'limitPool', 'dropPool', 'ztPrev', 'industry', 'info', 'minute'],
  fetchers,
  available: () => available,
  setAvailable,
  getPort: () => serverPort,
  // 健康探针：供 main.js / 路由层检查服务是否真在跑
  health: () => call('/health', { timeout: 3000 })
}
