'use strict'

/**
 * 领域逻辑单元测试（node:test，零依赖、零网络、零数据库）。
 *
 * 运行：npm test
 *
 * 覆盖原则：只测「纯函数 + 有明确公式定义」的部分，不测路由、不连 DDB、不连并网。
 * 这些正是历史上出过错、且出了错最难靠肉眼发现的地方：
 *   - 已实现盈亏公式（v1.26.1 曾虚增 34 倍）
 *   - 连板数/涨停判定（v1.30.0 卡片 33 vs 池 45+）
 *   - 复权因子（除权跳空导致涨跌幅断裂）
 *   - DolphinDB 脚本注入白名单（字符串直接拼脚本）
 *
 * 断言里的期望值全部由「手算公式」得出并写进注释，不从实现反推——
 * 否则测试只能证明"代码没变"，不能证明"代码是对的"。
 */

const test = require('node:test')
const assert = require('node:assert/strict')

const { safeSymbol, safeDate, safeNum } = require('../dolphindb/params')
const { boardThreshold } = require('../server/limit-board-derive')
const { replayPosition, validateTimelineEvents } = require('../server/domain/position')
const { computeDayFromWindow } = require('../server/limit-board-derive')

// ============================================================
// 1. DolphinDB 脚本注入白名单
//    背景：DDB 脚本没有参数绑定，原实现把 query 的 symbol/date 直接拼进脚本字符串。
//    这几个函数是唯一防线，被 90 处引用，一旦放行就等同于开放脚本注入。
// ============================================================
test('safeSymbol: 接受 6 位纯数字股票代码与带后缀写法', () => {
  assert.equal(safeSymbol('600519'), '600519')
  assert.equal(safeSymbol('000001'), '000001')
  assert.equal(safeSymbol('600519.SH'), '600519.SH')
  assert.equal(safeSymbol(' 600519 '), '600519')  // 首尾空白容忍
  // 注意：本函数只接受字符串形态的 6 位代码，数字 1 不会被补零成 '000001'
  //（补零是 pad6 的职责，两者不要混用）
  assert.equal(safeSymbol(1), null)
})

test('safeSymbol: 拒绝注入载荷与非法输入', () => {
  const attacks = [
    '600519"; dropTable(t)',      // 引号闭合
    "600519'); dropTable(t);//",
    '600519\n dropTable(t)',
    '60051',                       // 位数不足
    '6005199',                     // 位数过多
    'abcdef',
    '',
    null,
    undefined
  ]
  for (const a of attacks) {
    assert.equal(safeSymbol(a), null, `应拒绝: ${JSON.stringify(a)}`)
  }
})

test('safeDate: 接受多种日期写法规整为 YYYY.MM.DD', () => {
  assert.equal(safeDate('2026-11-12'), '2026.11.12')
  assert.equal(safeDate('20261112'), '2026.11.12')
  assert.equal(safeDate('2026.11.12'), '2026.11.12')
})

test('safeDate: 拒绝注入载荷与不存在的日期', () => {
  assert.equal(safeDate('2026-11-12"; dropTable(t)'), null)
  assert.equal(safeDate('20261301'), null, '13 月应拒绝')
  assert.equal(safeDate('20260230'), null, '2 月 30 日应拒绝')
  assert.equal(safeDate('2026-1'), null)
  assert.equal(safeDate(''), null)
})

test('safeDate: 闰年 2 月 29 日按年判断', () => {
  assert.equal(safeDate('20240229'), '2024.02.29')  // 2024 闰年
  assert.equal(safeDate('20260229'), null)          // 2026 平年
})

test('safeNum: 非有限数值一律回落', () => {
  assert.equal(safeNum('3.5'), 3.5)
  assert.equal(safeNum('abc', 0), 0)
  assert.equal(safeNum(NaN, -1), -1)
  assert.equal(safeNum(Infinity, 7), 7)
  // Number(null) === 0 且是有限数，故按 0 返回而非 fallback。
  // 这是 JS 语义的既有行为，调用方若需"null 取默认值"应自行判空。
  assert.equal(safeNum(null, 2), 0)
})

// ============================================================
// 2. 板块涨跌停阈值
//    不同板块涨跌幅限制不同，用错阈值会让 20cm 板块的涨停被算成"没涨停"。
// ============================================================
test('boardThreshold: 主板 10cm / 创业板科创板 20cm / 北交所 30cm', () => {
  assert.equal(boardThreshold('600519'), 9.8)   // 沪主板
  assert.equal(boardThreshold('000001'), 9.8)   // 深主板
  assert.equal(boardThreshold('300750'), 19.8)  // 创业板
  assert.equal(boardThreshold('688981'), 19.8)  // 科创板
  assert.equal(boardThreshold('430047'), 29.8)  // 北交所
  assert.equal(boardThreshold('830799'), 29.8)
  assert.equal(boardThreshold('920001'), 29.8)
  assert.equal(boardThreshold(''), 9.8)         // 空值按主板兜底，不抛错
})

// ============================================================
// 3. 持仓回放与盈亏公式
//    口径：买入含费计入成本；卖出已实现 = 卖出净额 − 均价 × 实际卖出股数。
// ============================================================
test('replayPosition: 单笔买入的均价含手续费', () => {
  // 买 1000 股 @10 元，费 5 元 → 成本 10005，均价 10.005
  const st = replayPosition([
    { direction: 'buy', trade_price: 10, quantity: 1000, fee: 5 }
  ])
  assert.equal(st.quantity, 1000)
  assert.equal(st.avgCost, 10.005)
  assert.equal(st.totalInvested, 10005)
  assert.equal(st.realizedPnl, 0)
})

test('replayPosition: 部分卖出按实际卖出股数结转成本（v1.26.1 回归点）', () => {
  // 买 1000@10 费5 → 均价 10.005
  // 卖 400@13.8 费2 → 净额 5520-2=5518；成本结转 10.005*400=4002 → 已实现 1516
  // 注意浮点：10.005*400 = 4002.0000000000005，不收敛会得到 1515.9999999999995
  const st = replayPosition([
    { direction: 'buy', trade_price: 10, quantity: 1000, fee: 5 },
    { direction: 'sell', trade_price: 13.8, quantity: 400, fee: 2 }
  ])
  assert.equal(st.quantity, 600)
  assert.equal(st.realizedPnl, 1516, '已实现盈亏必须是干净的两位小数')
  assert.equal(st.totalProceeds, 5518)
  // 剩余持仓均价不变
  assert.equal(st.avgCost, 10.005)
})

test('replayPosition: 金额不残留浮点尾数', () => {
  // 0.1+0.2 类误差的典型放大器：多笔小数金额累加
  const st = replayPosition([
    { direction: 'buy', trade_price: 10.1, quantity: 300, fee: 0.1 },
    { direction: 'buy', trade_price: 10.2, quantity: 300, fee: 0.2 }
  ])
  assert.equal(st.totalInvested, 6090.3)   // 3030.1 + 3060.2 = 6090.3
  assert.equal(String(st.totalInvested), '6090.3', '序列化后不能出现 6090.299999')
  assert.equal(st.avgCost, 10.1505)        // (3030.1+3060.2)/600
})

test('replayPosition: 全部卖出后持仓与均价归零', () => {
  const st = replayPosition([
    { direction: 'buy', trade_price: 10, quantity: 100, fee: 0 },
    { direction: 'sell', trade_price: 12, quantity: 100, fee: 0 }
  ])
  assert.equal(st.quantity, 0)
  assert.equal(st.avgCost, 0)        // 不留幽灵成本
  assert.equal(st.realizedPnl, 200)
})

test('replayPosition: 多次买入按加权平均，卖出不受后续买入影响', () => {
  // 买 100@10 费0 → 均价10；买 100@20 费0 → 均价15
  // 卖 100@25 费0 → 已实现 = 2500 - 15*100 = 1000
  const st = replayPosition([
    { direction: 'buy', trade_price: 10, quantity: 100, fee: 0 },
    { direction: 'buy', trade_price: 20, quantity: 100, fee: 0 },
    { direction: 'sell', trade_price: 25, quantity: 100, fee: 0 }
  ])
  assert.equal(st.quantity, 100)
  assert.equal(st.avgCost, 15)
  assert.equal(st.realizedPnl, 1000)
})

test('replayPosition: 空流水返回全零，不抛错', () => {
  const st = replayPosition([])
  assert.deepEqual(st, { quantity: 0, avgCost: 0, totalInvested: 0, totalProceeds: 0, realizedPnl: 0 })
})

// ============================================================
// 4. 交易时间线校验
// ============================================================
test('validateTimeline: 正常买卖序列通过', () => {
  const r = validateTimelineEvents([
    { id: 1, direction: 'buy', quantity: 1000, tradeDate: '2026-01-05' },
    { id: 2, direction: 'sell', quantity: 400, tradeDate: '2026-01-08' }
  ])
  assert.equal(r.ok, true)
})

test('validateTimeline: 卖出早于买入被拒', () => {
  const r = validateTimelineEvents([
    { id: 1, direction: 'buy', quantity: 1000, tradeDate: '2026-01-08' },
    { id: 2, direction: 'sell', quantity: 400, tradeDate: '2026-01-05' }
  ])
  assert.equal(r.ok, false)
  assert.match(r.error, /持仓为负/)
})

test('validateTimeline: 卖出量超过当时持仓被拒', () => {
  const r = validateTimelineEvents([
    { id: 1, direction: 'buy', quantity: 100, tradeDate: '2026-01-05' },
    { id: 2, direction: 'sell', quantity: 200, tradeDate: '2026-01-06' }
  ])
  assert.equal(r.ok, false)
})

test('validateTimeline: 删除买入导致后续卖出悬空时被拒', () => {
  // 现有：买1000 → 卖400。删除买1后，卖2 就成了无持仓卖出
  const r = validateTimelineEvents(
    [
      { id: 1, direction: 'buy', quantity: 1000, tradeDate: '2026-01-05' },
      { id: 2, direction: 'sell', quantity: 400, tradeDate: '2026-01-08' }
    ],
    null,
    1
  )
  assert.equal(r.ok, false)
})

test('validateTimeline: 同日按 id 排序（同日买入先于卖出）', () => {
  const r = validateTimelineEvents([
    { id: 2, direction: 'sell', quantity: 100, tradeDate: '2026-01-05' },
    { id: 1, direction: 'buy', quantity: 100, tradeDate: '2026-01-05' }
  ])
  assert.equal(r.ok, true, 'id=1 的买入应先回放')
})

test('validateTimeline: 编辑场景沿用原 id 参与排序', () => {
  const r = validateTimelineEvents(
    [{ id: 1, direction: 'buy', quantity: 100, tradeDate: '2026-01-05' }],
    { direction: 'sell', quantity: 100, tradeDate: '2026-01-06' },
    1
  )
  // 排除 id=1 的原买入，再把编辑后的卖出（沿用 id=1）加回 → 只剩卖出，必然为负
  assert.equal(r.ok, false)
})

// ============================================================
// 5. 复盘指标（连板/涨停/一字板）
//    用手工构造的 window，避免连 DDB。
// ============================================================
function makeWindow(seriesMap) {
  // seriesMap: { '600519': [{date, pctChg, high, low, close}, ...] }
  const bySym = new Map()
  const allDates = new Set()
  for (const [sym, list] of Object.entries(seriesMap)) {
    const asc = [...list].sort((a, b) => (a.date < b.date ? -1 : 1))
    const byDate = new Map()
    asc.forEach((r, i) => {
      allDates.add(r.date)
      byDate.set(r.date, { ...r, raw_close: r.close })
    })
    bySym.set(sym, { list: asc, byDate })
  }
  return { bySym, dates: [...allDates].sort() }
}

test('computeDayFromWindow: 主板 9.8% 判涨停，9.7% 不判', () => {
  const w = makeWindow({
    '600519': [{ date: '2026-11-10', pctChg: 9.9, high: 10, low: 9.5, close: 10 }],
    '000001': [{ date: '2026-11-10', pctChg: 9.7, high: 10, low: 9.5, close: 10 }]
  })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.limitUpCount, 1, '只有 9.9% 那只算涨停')
})

test('computeDayFromWindow: 创业板要用 19.8% 阈值', () => {
  const w = makeWindow({
    '300750': [{ date: '2026-11-10', pctChg: 15, high: 10, low: 9, close: 10 }],  // 未达 20cm 涨停
    '300751': [{ date: '2026-11-10', pctChg: 19.9, high: 10, low: 9, close: 10 }] // 达涨停
  })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.limitUpCount, 1)
})

test('computeDayFromWindow: 连续涨停日数 = 连板数', () => {
  // 600519 连续 3 日涨停 → 连板 3
  const w = makeWindow({
    '600519': [
      { date: '2026-11-06', pctChg: 10, high: 10, low: 9.5, close: 10 },
      { date: '2026-11-09', pctChg: 10, high: 11, low: 10.5, close: 11 },
      { date: '2026-11-10', pctChg: 10, high: 12.1, low: 11.6, close: 12.1 }
    ]
  })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.maxContinuousLevel, 3)
  assert.equal(r.levels['600519'], 3)
})

test('computeDayFromWindow: 断板后连板数从 1 重新计数', () => {
  const w = makeWindow({
    '600519': [
      { date: '2026-11-06', pctChg: 10, high: 10, low: 9.5, close: 10 },
      { date: '2026-11-09', pctChg: 2, high: 10.5, low: 10, close: 10.2 },   // 断板
      { date: '2026-11-10', pctChg: 10, high: 11.2, low: 10.8, close: 11.2 }
    ]
  })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.levels['600519'], 1)
  assert.equal(r.maxContinuousLevel, 1)
})

test('computeDayFromWindow: 一字板 = 最高价等于最低价', () => {
  const w = makeWindow({
    '600519': [{ date: '2026-11-10', pctChg: 10, high: 11, low: 11, close: 11 }],   // 一字
    '000001': [{ date: '2026-11-10', pctChg: 10, high: 11, low: 10.5, close: 11 }]  // 非一字
  })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.oneWordCount, 1)
})

test('computeDayFromWindow: 连板率 = 连板≥2 数 / 涨停数 * 100', () => {
  // 4 只涨停，其中 2 只连板≥2 → 50%
  const w = makeWindow({
    '600519': [
      { date: '2026-11-09', pctChg: 10, high: 10, low: 9.5, close: 10 },
      { date: '2026-11-10', pctChg: 10, high: 11, low: 10.5, close: 11 }
    ],
    '000001': [
      { date: '2026-11-09', pctChg: 10, high: 10, low: 9.5, close: 10 },
      { date: '2026-11-10', pctChg: 10, high: 11, low: 10.5, close: 11 }
    ],
    '600036': [{ date: '2026-11-10', pctChg: 10, high: 11, low: 10.5, close: 11 }],
    '601318': [{ date: '2026-11-10', pctChg: 10, high: 11, low: 10.5, close: 11 }]
  })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.limitUpCount, 4)
  assert.equal(r.continuousLimitRate, 50)
})

test('computeDayFromWindow: 无涨停时连板率为 0 而非 NaN', () => {
  const w = makeWindow({ '600519': [{ date: '2026-11-10', pctChg: 1, high: 10, low: 9.5, close: 10 }] })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.limitUpCount, 0)
  assert.equal(r.continuousLimitRate, 0)
  assert.ok(!Number.isNaN(r.continuousLimitRate))
})

test('computeDayFromWindow: 炸板回封数暂无数据源，返回 null 而不是 0', () => {
  // 0 会被前端当成"真的没有炸板回封"，null 才会显示 '--'
  const w = makeWindow({ '600519': [{ date: '2026-11-10', pctChg: 10, high: 11, low: 10, close: 11 }] })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.blastResealCount, null)
})

test('computeDayFromWindow: 昨日涨停股今日平均涨幅', () => {
  const w = makeWindow({
    '600519': [
      { date: '2026-11-09', pctChg: 10, high: 10, low: 9.5, close: 10 },   // 昨涨停
      { date: '2026-11-10', pctChg: 4, high: 11, low: 10, close: 10.4 }
    ],
    '000001': [
      { date: '2026-11-09', pctChg: 10, high: 10, low: 9.5, close: 10 },   // 昨涨停
      { date: '2026-11-10', pctChg: -2, high: 10, low: 9.5, close: 9.8 }
    ]
  })
  const r = computeDayFromWindow(w, '2026-11-10')
  assert.equal(r.yesterdayLimitupAvgChange, 1)  // (4 + -2)/2 = 1
})
