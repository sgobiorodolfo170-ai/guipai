'use strict'

/**
 * 通达信 tqs 数据源（tqserver/tdxaidata，免客户端，Key 鉴权）。
 *
 * 经 akshare Python 桥的 /tdxs_* 端点调用 tdxaidata.tqs（直连通达信数据后端）。
 * 无需 TdxW 运行、无需网络通达信服务器——Key 鉴权后从 aids.tdx.com.cn 直取。
 * tqs 返回实时数据（含当日），覆盖任意股票日K/分钟/财报/涨跌停。
 *
 * 依赖：Python 桥运行（server.py 含 /tdxs_* 端点）+ tdxaidata 已装 + Key 已配。
 * available() 由 main.js 探测 /tdxs_health 后设置。
 */

const http = require('http')
const settings = require('../settings')

let available = false
let bridgePort = 8889

function setAvailable(up, port) {
  available = !!up
  if (port) bridgePort = Number(port) || bridgePort
}

function call(endpoint, { timeout = 30000 } = {}) {
  return new Promise((resolve, reject) => {
    const url = `http://127.0.0.1:${bridgePort}${endpoint}`
    const req = http.get(url, { timeout }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`tqs桥 HTTP ${res.statusCode}`))
        try {
          const json = JSON.parse(Buffer.concat(chunks).toString('utf8'))
          if (json.code !== 200) return reject(new Error(`tqs桥: ${json.msg || '错误'}`))
          resolve(json.data || [])
        } catch (e) { reject(new Error('tqs桥返回非JSON')) }
      })
    })
    req.on('error', e => reject(new Error(`tqs桥请求失败(${e.code || e.message})`)))
    req.on('timeout', () => req.destroy(new Error('tqs桥请求超时')))
  })
}

function qs(params) {
  const p = {}
  for (const [k, v] of Object.entries(params || {})) {
    if (v != null && v !== '') p[k] = v
  }
  return new URLSearchParams(p).toString()
}

const fetchers = {
  // 日K/周K/月K/分钟K：tqs.get_market_data（经桥 /tdxs_kline）
  kline: (p) => call('/tdxs_kline?' + qs(p)),
  // 指数日K：复用 /tdxs_kline，传 is_index=1 让 Python 桥用 _tqs_index_code
  // （000001→000001.SH 上证指数，而非 _tqs_code 的 000001.SZ 平安银行）
  indexDaily: (p) => call('/tdxs_kline?' + qs({ ...p, adjust: p.adjust || 'none', is_index: '1' })),
  // 分钟K：复用 /tdxs_kline，period 传分钟周期
  minute: (p) => call('/tdxs_kline?' + qs(p)),
  // 实时快照：有 codes 走逐股/批量，无 codes 走全市场
  spot: (codes) => {
    if (codes) {
      const arr = Array.isArray(codes) ? codes.join(',') : codes
      return call('/tdxs_snapshot?codes=' + encodeURIComponent(arr))
    }
    return call('/tdxs_market_spot', { timeout: 60000 })
  },
  // 指数实时快照：tqs.get_market_snapshot_batch（预定义指数代码列表）
  indexSpot: (series) => call('/tdxs_index_spot?series=' + encodeURIComponent(series || '沪深重要指数')),
  // 行业板块列表：tqs.get_sector_list
  industry: () => call('/tdxs_sectors'),
  // 涨跌停数据：tqs.get_zdt_data
  limitPool: () => call('/tdxs_zdt'),
  dropPool: () => call('/tdxs_zdt'),
  // 昨日涨停池：传 date 参数让 Python 桥调 get_zdt_data(date=...)
  ztPrev: (date) => call('/tdxs_zdt?' + qs({ date: date || '' })),
  // 财务数据：tqs.get_financial_data
  financial: (p) => call('/tdxs_financial?' + qs(p)),
  // 个股基础信息：tqs.get_stock_info
  info: (code) => call('/tdxs_info?symbol=' + encodeURIComponent(code)),
}

module.exports = {
  name: 'tdx_server',
  capabilities: ['kline', 'indexDaily', 'minute', 'spot', 'industry', 'limitPool', 'dropPool', 'financial', 'info', 'indexSpot', 'ztPrev'],
  fetchers,
  available: () => available,
  setAvailable,
  getPort: () => bridgePort,
  health: () => call('/tdxs_health', { timeout: 20000 })  // tqs 首次调用冷启动(DLL加载+后端连接)较慢，给足时间
}
