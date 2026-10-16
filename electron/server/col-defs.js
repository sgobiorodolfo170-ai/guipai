'use strict'

/**
 * DolphinDB 行情表列定义 —— 供写库方（market-sync / aktools 路由 DB-first 写回）共用。
 *
 * 源：原 routes/sync.js（四类收盘同步）删除后，把这几个表的 COLS 定义独立成共享模块。
 * 注意：列顺序必须与 ensureSchema 中 DFS 表列序一致，tableInsert 按位置匹配。
 */

const COLS = {
  stock_limit_pool: [
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
  ],
  plate_market_quotation: [
    { name: 'trade_date', type: 'date' }, { name: 'plate', type: 'symbol' },
    { name: 'increase_rate', type: 'double' }, { name: 'total_volume', type: 'double' },
    { name: 'total_turnover', type: 'double' }, { name: 'net_inflow', type: 'double' },
    { name: 'up_count', type: 'int' }, { name: 'down_count', type: 'int' },
    { name: 'average_price', type: 'double' }, { name: 'leading_stock', type: 'string' },
    { name: 'leading_stock_price', type: 'double' }, { name: 'leading_stock_increase', type: 'double' },
    { name: 'create_time', type: 'timestamp' }
  ],
  stock_zh_index_daily: [
    { name: 'symbol', type: 'symbol' }, { name: 'trade_date', type: 'date' },
    { name: 'open', type: 'double' }, { name: 'close', type: 'double' },
    { name: 'high', type: 'double' }, { name: 'low', type: 'double' },
    { name: 'volume', type: 'double' }, { name: 'amount', type: 'double' },
    { name: 'amplitude', type: 'double' }, { name: 'change', type: 'double' },
    { name: 'price_change', type: 'double' }, { name: 'turnover_rate', type: 'double' },
    { name: 'create_time', type: 'timestamp' }, { name: 'update_time', type: 'timestamp' }
  ]
}

/** 兼容旧引用：原 routes/sync.js 导出 `_COLS_MAP['表名']`，aktools 路由曾按此取列。 */
const _COLS_MAP = COLS

// ---- 非依赖查询（保持 NSM 共享模块，避免 require 环路）----

/** 'YYYYMMDD' / 'YYYY-MM-DD' -> 'YYYY-MM-DD'；非法返回 null */
function normDate(v) {
  if (!v) return null
  const s = String(v).replace(/\D/g, '')
  if (s.length === 8) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  return String(v)
}

module.exports = { COLS, _COLS_MAP, normDate }