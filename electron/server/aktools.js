'use strict'

const http = require('http')
const { URL } = require('url')

const AKTOOLS_BASE = process.env.AKTOOLS_API_URL || 'http://localhost:8888/api/public'

function callAktools(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(AKTOOLS_BASE + '/' + endpoint)
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') u.searchParams.append(k, v)
    }
    const opts = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
      timeout: 30000
    }
    const req = http.request(opts, (res) => {
      let body = ''
      res.on('data', (c) => { body += c })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`AKTools returned ${res.statusCode}`))
        }
        try { resolve(JSON.parse(body)) }
        catch { reject(new Error('AKTools returned invalid JSON')) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(new Error('AKTools request timeout')) })
    req.end()
  })
}

module.exports = {
  getStockSpot: () => callAktools('stock_zh_a_spot_em'),
  getStockHistory: (p) => callAktools('stock_zh_a_hist', p),
  getStockMinute: (p) => callAktools('stock_zh_a_hist_min_em', p),
  getStockInfo: (symbol) => callAktools('stock_individual_info_em', { symbol }),
  getStockHolding: (p) => callAktools('stock_gdfx_holding_detail_em', p),
  getStockLimitPool: (date) => callAktools('stock_zt_pool_em', { date }),
  getStockDropPool: (date) => callAktools('stock_zt_pool_dtgc_em', { date }),
  getStockIndustry: () => callAktools('stock_board_industry_summary_ths'),
  getZtPoolPrevious: (date) => callAktools('stock_zt_pool_previous_em', { date }),
  getStockIndexSpot: (symbol) => callAktools('stock_zh_index_spot_em', { symbol }),
  getIndexDailyData: (p) => callAktools('index_zh_a_hist', p)
}
