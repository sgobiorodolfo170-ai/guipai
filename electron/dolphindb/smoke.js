'use strict'

/**
 * DolphinDB 真机冒烟脚本（手动运行，验证 client.js 的连接/建表/写入/查询/删除全链路）。
 *
 * 用法：
 *   1. 启动 DolphinDB（默认 8848，admin/123456）
 *   2. node electron/dolphindb/smoke.js
 *   3. 环境变量可覆盖：DOLPHINDB_URL / DOLPHINDB_USER / DOLPHINDB_PASSWORD / DOLPHINDB_DB
 *
 * 该脚本用临时测试行（stock_code='SMOKE_TEST', trade_date=2024-01-01）写入→查询→删除，
 * 不污染真实数据。任一步失败即非零退出并打印错误。
 */

const ddb = require('./client')

// stock_limit_pool 列定义（须与 ensureSchema 列序一致）
const COLS = [
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
]

const dd = (s) => String(s).replace(/-/g, '.')
const TEST_DATE = '2024-01-01'
const TEST_CODE = 'SMOKE_TEST'
const TBL = `loadTable("dfs://tradeinsight","stock_limit_pool")`

async function clean() {
  await ddb.execute(`t = ${TBL}; delete from t where trade_date=${dd(TEST_DATE)} and stock_code='${TEST_CODE}'`)
}

async function main() {
  console.log('[smoke] 1/6 连接 + 建表...')
  await ddb.connect()
  console.log('[smoke]    已连接，schema 已就绪')

  console.log('[smoke] 2/6 清理旧测试行...')
  await clean()

  console.log('[smoke] 3/6 insertRows 写入 1 行（含 null 字段 dynamic_pe/limit_turnover）...')
  const row = [{
    data_type: 'LIMIT_UP', trade_date: TEST_DATE, stock_code: TEST_CODE, stock_name: '冒烟测试',
    industry: '测试行业', increase_rate: 10.0, latest_price: 10.5, turnover: 1000000,
    circulation_market_value: 200000000, total_market_value: 300000000, turnover_rate: 5.0,
    limit_funds: 50000000, first_limit_time: '09:30:00', limit_stats: '1/1', dynamic_pe: null,
    limit_turnover: null, continuous_limit: 1, last_limit_time: '09:30:00', blast_times: 0, create_time: new Date()
  }]
  const n = await ddb.insertRows('stock_limit_pool', COLS, row)
  console.log('[smoke]    写入返回:', n)
  if (n !== 1) throw new Error('写入行数不符')

  console.log('[smoke] 4/6 count 查询验证...')
  const c = await ddb.count(`select count(*) as c from ${TBL} where trade_date=${dd(TEST_DATE)} and stock_code='${TEST_CODE}'`)
  console.log('[smoke]    count =', c)
  if (c !== 1) throw new Error('写入后 count 应为 1，实际 ' + c)

  console.log('[smoke] 5/6 聚合查询验证（statistics 风格：iif/sum/avg/isNull）...')
  const r = await ddb.execute(`select
    sum(iif(data_type=='LIMIT_UP',1,0)) as limitUpCount,
    avg(iif(isNull(limit_funds),0,limit_funds)) as avgFunds,
    iif(isNull(industry),'未知行业',industry) as ind
    from ${TBL} where trade_date=${dd(TEST_DATE)}`)
  console.log('[smoke]    聚合结果:', JSON.stringify(r))

  console.log('[smoke] 6/6 清理测试行...')
  await clean()
  const c2 = await ddb.count(`select count(*) as c from ${TBL} where trade_date=${dd(TEST_DATE)} and stock_code='${TEST_CODE}'`)
  console.log('[smoke]    清理后 count =', c2)
  if (c2 !== 0) throw new Error('清理后 count 应为 0')

  ddb.disconnect()
  console.log('[smoke] ✅ 全链路通过')
}

main().catch((e) => {
  console.error('[smoke] ❌ 失败:', e.message)
  try { ddb.disconnect() } catch (_) {}
  process.exit(1)
})
