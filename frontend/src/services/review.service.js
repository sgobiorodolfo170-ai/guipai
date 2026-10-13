/**
 * Review 页数据适配层 —— 调用业务路由，把英文键映射回 useReview.js 期望的中文键。
 *
 * 背景：C2-C5 把读路径改成 DB-first 后，响应从中文键（代码/涨跌幅/...）
 * 变成了英文键（symbol/pct_chg/...）。useReview.js 和 Review.vue 有 ~33 处
 * 中文键访问。本层做键名翻译，让 useReview.js 只改 import 来源、字段访问不动。
 *
 * 对应关系：
 *   getStockSpot        → GET /stocks/realtime          (stock_spot 表)
 *   getStockIndustry    → GET /boards                    (plate_market_quotation 表)
 *   getStockIndexSpot   → GET /market/overview           (stock_index_spot 表，合并两类指数)
 *   getStockLimit       → GET /limit-board-statistics/limit-pool/:date  (stock_limit_pool LIMIT_UP)
 *   getStockDrop        → GET /limit-board-statistics/drop-pool/:date   (stock_limit_pool LIMIT_DOWN)
 *   getStockLimitYesterday → GET /limit-board-statistics/zt-previous/:date (zt_pool_previous 表)
 */
import api from '@/utils/api'

// ---- 键名映射表 ----

/** stock_spot 行 → 中文键（marketStats 用 成交额/涨跌幅） */
function mapSpotRow(r) {
  return {
    '代码': r.code,
    '名称': r.name || r.code,
    '最新价': r.price,
    '涨跌幅': r.changePercent,
    '成交额': r.turnover,
  }
}

/** plate_market_quotation 行 → 中文键 */
function mapPlateRow(r) {
  return {
    '板块': r.plate,
    '涨跌幅': r.increase_rate,
    '领涨股': r.leading_stock,
    '上涨家数': r.up_count,
    '下跌家数': r.down_count,
    '领涨股-涨跌幅': r.leading_stock_increase,
    '总成交额': r.total_turnover,
    '净流入': r.net_inflow,
  }
}

/** /market/overview 行 → 中文键（指数） */
function mapIndexRow(r) {
  return {
    '代码': r.code,
    '名称': r.name,
    '最新价': r.price,
    '涨跌额': r.change,
    '涨跌幅': r.changePercent,
  }
}

/** stock_limit_pool 行 → 中文键（涨停池/跌停池共用） */
function mapLimitPoolRow(r) {
  return {
    '代码': r.stock_code,
    '名称': r.stock_name,
    '最新价': r.latest_price,
    '涨跌幅': r.increase_rate,
    '连板数': r.continuous_limit,
    '成交额': r.turnover,
    '换手率': r.turnover_rate,
    '所属行业': r.industry,
    '涨停统计': r.limit_stats,
  }
}

/** zt_pool_previous 行 → 中文键（昨日涨停，注意「昨日连板数」≠ 涨停池的「连板数」） */
function mapZtPrevRow(r) {
  return {
    '代码': r.symbol,
    '名称': r.name,
    '最新价': r.latest_price,
    '涨跌幅': r.pct_chg,
    '成交额': r.amount,
    '换手率': r.turnover_rate,
    '所属行业': r.industry,
    '涨停统计': r.limit_stats,
    '昨日连板数': r.consecutive_limit,
  }
}

// ---- 适配函数（签名与 aktools.service.js 保持一致） ----

/** 全市场实时快照 → GET /stocks/realtime */
export const getStockSpot = async () => {
  const resp = await api.get('/stocks/realtime')
  if (resp.code === 200 && Array.isArray(resp.data)) {
    return { code: 200, msg: resp.msg, data: resp.data.map(mapSpotRow) }
  }
  return resp
}

/** 行业板块 → GET /boards */
export const getStockIndustry = async () => {
  const resp = await api.get('/boards')
  if (resp.code === 200 && Array.isArray(resp.data)) {
    return { code: 200, msg: resp.msg, data: resp.data.map(mapPlateRow) }
  }
  return resp
}

/** 指数实时行情 → GET /market/overview
 *  原 aktools 接口按 category 分两次调，但 overview 只取 '沪深重要指数'已覆盖
 *  上证指数/深证成指/创业板指三个，Review 页也只消费这三个。合并为一次调用。 */
export const getStockIndexSpot = async (_category) => {
  const resp = await api.get('/market/overview')
  if (resp.code === 200 && Array.isArray(resp.data)) {
    return { code: 200, msg: resp.msg, data: resp.data.map(mapIndexRow) }
  }
  return resp
}

/** 当日涨停池 → GET /limit-board-statistics/limit-pool/:date */
export const getStockLimit = async (date) => {
  const resp = await api.get(`/limit-board-statistics/limit-pool/${date}`)
  if (resp.code === 200 && Array.isArray(resp.data)) {
    return { code: 200, msg: resp.msg, data: resp.data.map(mapLimitPoolRow) }
  }
  return resp
}

/** 当日跌停池 → GET /limit-board-statistics/drop-pool/:date */
export const getStockDrop = async (date) => {
  const resp = await api.get(`/limit-board-statistics/drop-pool/${date}`)
  if (resp.code === 200 && Array.isArray(resp.data)) {
    return { code: 200, msg: resp.msg, data: resp.data.map(mapLimitPoolRow) }
  }
  return resp
}

/** 昨日涨停 → GET /limit-board-statistics/zt-previous/:date */
export const getStockLimitYesterday = async (date) => {
  const resp = await api.get(`/limit-board-statistics/zt-previous/${date}`)
  if (resp.code === 200 && Array.isArray(resp.data)) {
    return { code: 200, msg: resp.msg, data: resp.data.map(mapZtPrevRow) }
  }
  return resp
}
