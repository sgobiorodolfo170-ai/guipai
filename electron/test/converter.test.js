'use strict'

/**
 * 数据转换与交易时段单元测试。
 *
 * 为什么优先测这两块：
 *   1) 缺陷模式统计显示「字段映射/口径不一致」是历史最高频问题（30 个版本里 17 次），
 *      典型如 v1.27.1 详情页 mapSpotRow 缺 OHLC、v1.27.2 名称被代码覆盖、
 *      v1.30.0 卡片 33 vs 池 45+。converter 是外部中文键 → 库内英文键的**唯一收口**，
 *      这里错一个字段名，库表就静默存空值，页面显示 0 或 '--'，极难发现。
 *   2) 交易时段判定错了会让「盘中优先网络、盘后优先库」的策略整体失效：
 *      盘中当成盘后 → 拿到昨收；盘后当成盘中 → 开盘就报错。
 *
 * 断言依据：字段名对照 electron/server/col-defs.js 与各 repository 的建表列；
 * 期望值来自手写输入，不从实现反推。
 */

const test = require('node:test')
const assert = require('node:assert/strict')

const conv = require('../server/converter')
const { isTradingDay, isTradingTime } = require('../server/market-time')

// ============================================================
// 1. 涨跌停池转换
// ============================================================
test('convertStockLimitPool: 涨停池字段完整映射', () => {
  const raw = [{
    代码: '600519', 名称: '贵州茅台', 所属行业: '白酒',
    涨跌幅: 10.01, 最新价: 1680.5, 成交额: 123456789,
    流通市值: 21000000000, 总市值: 21100000000, 换手率: 0.85,
    最后封板时间: '143012', 封板资金: 98765432,
    连板数: 3, 炸板次数: 1, 首次封板时间: '093500', 涨停统计: '3/3'
  }]
  const [row] = conv.convertStockLimitPool(raw, '2026-11-12', 'LIMIT_UP')
  assert.equal(row.data_type, 'LIMIT_UP')
  assert.equal(row.trade_date, '2026-11-12')
  assert.equal(row.stock_code, '600519')
  assert.equal(row.stock_name, '贵州茅台')
  assert.equal(row.industry, '白酒')
  assert.equal(row.increase_rate, 10.01)
  assert.equal(row.last_limit_time, '14:30:12', '6 位时间需格式化为 HH:MM:SS')
  assert.equal(row.first_limit_time, '09:35:00')
  assert.equal(row.limit_funds, 98765432)
  assert.equal(row.continuous_limit, 3)
  assert.equal(row.blast_times, 1)
  assert.equal(row.limit_stats, '3/3')
})

test('convertStockLimitPool: 跌停池取不同的源字段', () => {
  // 跌停池的封单/连跌/开板字段名与涨停池不同，取错会静默变 0
  const raw = [{
    代码: '000001', 名称: '平安银行', 所属行业: '银行',
    涨跌幅: -10.02, 最新价: 9.5, 成交额: 1000,
    封单资金: 555, 连续跌停: 2, 开板次数: 4,
    动态市盈率: 5.6, 板上成交额: 777
  }]
  const [row] = conv.convertStockLimitPool(raw, '2026-11-12', 'LIMIT_DOWN')
  assert.equal(row.limit_funds, 555)
  assert.equal(row.continuous_limit, 2)
  assert.equal(row.blast_times, 4)
  assert.equal(row.dynamic_pe, 5.6)
  assert.equal(row.limit_turnover, 777)
  // 涨停专属字段在跌停行应为空字符串而非 undefined（库表 NOT NULL 友好）
  assert.equal(row.first_limit_time, '')
  assert.equal(row.limit_stats, '')
})

test('convertStockLimitPool: 缺少代码或名称的行被丢弃', () => {
  const raw = [
    { 代码: '600519', 名称: '贵州茅台' },
    { 代码: '', 名称: '无代码' },
    { 代码: '000001', 名称: '' }
  ]
  const rows = conv.convertStockLimitPool(raw, '2026-11-12', 'LIMIT_UP')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].stock_code, '600519')
})

test('convertStockLimitPool: 空输入返回空数组而非报错', () => {
  assert.deepEqual(conv.convertStockLimitPool([], '2026-11-12', 'LIMIT_UP'), [])
  assert.deepEqual(conv.convertStockLimitPool(null, '2026-11-12', 'LIMIT_UP'), [])
  assert.deepEqual(conv.convertStockLimitPool(undefined, '2026-11-12', 'LIMIT_UP'), [])
})

// ============================================================
// 2. 实时快照转换（v1.27.1 曾缺 OHLC，赔付过）
// ============================================================
test('convertSpot: OHLC 与估值字段齐全（v1.27.1 回归点）', () => {
  const raw = [{
    代码: '000001', 今开: 11.5, 最新价: 11.79, 最高: 11.83, 最低: 11.66,
    昨收: 11.71, 成交量: 1082721, 成交额: 1273350000,
    涨跌幅: 0.68, 涨跌额: 0.08, 换手率: 0.56, 振幅: 1.45,
    总市值: 228000000000, 流通市值: 226000000000,
    '市盈率-动态': 5.2, 市净率: 0.62
  }]
  const [row] = conv.convertSpot(raw, '2026-11-12')
  assert.equal(row.symbol, '000001')
  // 这 4 个 OHLC 字段曾经缺失，导致详情页显示 0.00
  assert.equal(row.open, 11.5)
  assert.equal(row.high, 11.83)
  assert.equal(row.low, 11.66)
  assert.equal(row.close, 11.79)
  assert.equal(row.preclose, 11.71)
  assert.equal(row.change_amount, 0.08)
  assert.equal(row.pct_chg, 0.68)
  assert.equal(row.pe_ttm, 5.2)
  assert.equal(row.pb, 0.62)
})

test('convertSpot: 缺失字段转 null 而不是 0 或 NaN', () => {
  // 0 会被前端当成"真实的零"渲染成 0.00；null 才会显示 '--'
  const [row] = conv.convertSpot([{ 代码: '600519' }], '2026-11-12')
  assert.equal(row.open, null)
  assert.equal(row.close, null)
  assert.equal(row.pct_chg, null)
  assert.ok(!Number.isNaN(row.open))
})

test('convertSpot: 空代码行被丢弃', () => {
  const rows = conv.convertSpot([{ 代码: '600519' }, { 代码: '' }, { 名称: '无代码' }], '2026-11-12')
  assert.equal(rows.length, 1)
})

// ============================================================
// 3. 指数日K / 指数快照
// ============================================================
test('convertIndexDaily: 日期与 OHLC 映射正确', () => {
  const raw = [{
    日期: '2026-11-12', 开盘: 3646.57, 收盘: 3689.91, 最高: 3701.59, 最低: 3646.57,
    成交量: 571291638, 成交额: 687010000000, 涨跌幅: 0.39,
    换手率: 1.2, 振幅: 1.39, 涨跌额: 14.3
  }]
  const [row] = conv.convertIndexDaily(raw, '000001')
  assert.equal(row.symbol, '000001')
  assert.equal(row.trade_date, '2026-11-12')
  assert.equal(row.open, 3646.57)
  assert.equal(row.close, 3689.91)
  assert.equal(row.pct_chg, undefined)     // 本表用 change 而非 pct_chg
  assert.equal(row.change, 0.39)
  assert.equal(row.price_change, 14.3)
})

test('convertIndexSpot: close 与 latest_price 同源', () => {
  const [row] = conv.convertIndexSpot([{ 代码: '000001', 最新价: 3689.91, 今开: 3646.57, 昨收: 3675.61 }], '2026-11-12')
  assert.equal(row.latest_price, 3689.91)
  assert.equal(row.close, 3689.91, 'close 应等于最新价，便于与日K统一消费')
  assert.equal(row.open, 3646.57)
  assert.equal(row.preclose, 3675.61)
})

// ============================================================
// 4. 分钟K / 昨日涨停 / 行业板块
// ============================================================
test('convertMinuteK: 时间戳与日期拆分', () => {
  const [row] = conv.convertMinuteK([{ 时间: '2026-11-12 14:30:00', 开盘: 10, 收盘: 10.2, 最高: 10.3, 最低: 9.9, 成交量: 500 }], '600519', '5')
  assert.equal(row.symbol, '600519')
  assert.equal(row.timestamp, '2026-11-12 14:30:00')
  assert.equal(row.trade_date, '2026-11-12', 'trade_date 取时间戳前 10 位')
  assert.equal(row.period, 5)
  assert.equal(row.volume, 500)
})

test('convertMinuteK: period 非法时回落 5', () => {
  const [row] = conv.convertMinuteK([{ 时间: '2026-11-12 14:30:00' }], '600519', 'abc')
  assert.equal(row.period, 5)
})

test('convertZtPrevious: 昨日涨停字段映射', () => {
  const [row] = conv.convertZtPrevious([{
    代码: '600519', 名称: '贵州茅台', 最新价: 1680, 涨停价: 1681,
    涨跌幅: 9.99, 成交额: 100, 流通市值: 200, 总市值: 300, 换手率: 0.5,
    振幅: 8, 涨速: 0.1, 昨日封板时间: '140000', 昨日连板数: 2,
    所属行业: '白酒', 涨停统计: '2/2'
  }], '2026-11-12')
  assert.equal(row.symbol, '600519')
  assert.equal(row.name, '贵州茅台')
  assert.equal(row.limit_price, 1681)
  assert.equal(row.last_limit_time, '14:00:00')
  assert.equal(row.consecutive_limit, 2)
})

test('convertPlateMarket: 板块与领涨股字段', () => {
  const [row] = conv.convertPlateMarket([{
    板块: '半导体', 涨跌幅: 3.2, 总成交量: 100, 总成交额: 200, 净流入: 300,
    上涨家数: 40, 下跌家数: 10, 均价: 15.5, 领涨股: '中芯国际',
    '领涨股-最新价': 55.5, '领涨股-涨跌幅': 9.9
  }], '2026-11-12')
  assert.equal(row.plate, '半导体')
  assert.equal(row.up_count, 40)
  assert.equal(row.down_count, 10)
  assert.equal(row.leading_stock, '中芯国际')
  assert.equal(row.leading_stock_increase, 9.9)
})

// ============================================================
// 5. 交易时段判定
// ============================================================
// 用带时间的本地 Date 构造，避免依赖当前真实时间
const at = (y, m, d, hh, mm) => new Date(y, m - 1, d, hh, mm, 0)

test('isTradingTime: 上午 9:30-11:30 与下午 13:00-15:00 为盘中', () => {
  assert.equal(isTradingTime(at(2026, 11, 12, 9, 30)), true)
  assert.equal(isTradingTime(at(2026, 11, 12, 10, 0)), true)
  assert.equal(isTradingTime(at(2026, 11, 12, 11, 30)), true)
  assert.equal(isTradingTime(at(2026, 11, 12, 13, 0)), true)
  assert.equal(isTradingTime(at(2026, 11, 12, 14, 59)), true)
})

test('isTradingTime: 午休、开盘前、收盘后不算盘中', () => {
  assert.equal(isTradingTime(at(2026, 11, 12, 12, 0)), false, '午休')
  assert.equal(isTradingTime(at(2026, 11, 12, 11, 45)), false)
  assert.equal(isTradingTime(at(2026, 11, 12, 9, 0)), false, '开盘前')
  assert.equal(isTradingTime(at(2026, 11, 12, 15, 30)), false, '收盘后')
  assert.equal(isTradingTime(at(2026, 11, 12, 20, 0)), false)
})

test('isTradingDay: 工作日为交易日，周末不是', () => {
  // 2026-11-12 是周四，2026-11-14 是周六
  assert.equal(isTradingDay(at(2026, 11, 12, 10, 0)), true)
  assert.equal(isTradingDay(at(2026, 11, 14, 10, 0)), false, '周六')
  assert.equal(isTradingDay(at(2026, 11, 15, 10, 0)), false, '周日')
})

test('isTradingTime: 周末的盘中时刻不算交易时段', () => {
  // 这条容易漏：只判时间不判星期几，会让周末自动任务误以为要取实时行情
  assert.equal(isTradingTime(at(2026, 11, 14, 10, 0)), false)
})