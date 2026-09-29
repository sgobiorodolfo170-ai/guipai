'use strict'

/**
 * E2E：sync(涨停池, 直连东财 push2ex) → DolphinDB → statistics → delete → 校验。
 * 不依赖 AKTools/Python/mock；涨停池走 push2ex（不受 push2 集群限流影响）。
 * 断言基于 sync 返回的 successCount（真实数据，非硬编码）。
 *
 * 前置：DolphinDB(8848) + Express(8080) 已运行。
 */
const ddb = require('./client')

const DATE = '2026-09-25'
const dd = (s) => String(s).replace(/-/g, '.')
const TBL = `loadTable("dfs://tradeinsight","stock_limit_pool")`
const API = 'http://localhost:8080/api'

let pass = 0, fail = 0
function chk(name, actual, expected) {
  const a = actual == null ? null : Number(actual)
  const e = expected == null ? null : Number(expected)
  const ok = (e == null) ? (a == null) : (a != null && Math.abs(a - e) < 0.01)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got=${JSON.stringify(actual)} want=${expected}`)
  if (ok) pass++; else fail++
  return ok
}
async function http(method, path) {
  const r = await fetch(API + path, { method })
  return r.json()
}

async function main() {
  // 0. 预清理
  await ddb.connect()
  await ddb.execute(`t = ${TBL}; delete from t where trade_date=${dd(DATE)}`)
  ddb.disconnect()

  console.log('\n--- 1. POST sync LIMIT_UP（直连东财涨停池 push2ex）---')
  const syncRes = await http('POST', `/sync-status/manual/sync?tradeDate=${DATE}&dataType=LIMIT_UP`)
  console.log('sync result:', JSON.stringify(syncRes.data))
  const N = syncRes.data && syncRes.data.successCount
  chk('sync.success', syncRes.data && syncRes.data.success, 1)
  if (!N || N < 1) {
    console.log('sync 未获取到涨停池数据（东财可能当日无数据或限流），终止')
    process.exit(1)
  }
  console.log(`sync 写入 ${N} 只涨停股`)

  console.log(`\n--- 2. GET basic（断言 limitUpCount=${N}）---`)
  const basic = (await http('GET', `/limit-board-statistics/basic/${DATE}`)).data
  console.log(`basic: limitUpCount=${basic.limitUpCount} limitUpMaxContinuous=${basic.limitUpMaxContinuous} limitUpContinuousRate=${basic.limitUpContinuousRate}`)
  chk('basic.limitUpCount', basic.limitUpCount, N)
  chk('basic.limitDownCount', basic.limitDownCount, 0)
  chk('basic.limitUpMaxContinuous>0', basic.limitUpMaxContinuous > 0 ? 1 : 0, 1)

  console.log(`\n--- 3. GET detail LIMIT_UP（断言 totalCount=${N}）---`)
  const detail = (await http('GET', `/limit-board-statistics/detail/${DATE}?dataType=LIMIT_UP`)).data
  console.log(`detail: totalCount=${detail.totalCount} maxContinuousLimit=${detail.maxContinuousLimit} blastAndResealCount=${detail.blastAndResealCount}`)
  chk('detail.totalCount', detail.totalCount, N)
  chk('detail.maxContinuousLimit>0', detail.maxContinuousLimit > 0 ? 1 : 0, 1)

  console.log(`\n--- 4. GET comparison（断言 limitUpCount=${N}）---`)
  const cmp = (await http('GET', `/limit-board-statistics/comparison/${DATE}`)).data
  chk('cmp.limitUpCount', cmp.limitUpCount, N)

  console.log(`\n--- 5. DELETE sync LIMIT_UP（断言 deleted=${N}）---`)
  const del = (await http('DELETE', `/sync-status/manual/delete?tradeDate=${DATE}&dataType=LIMIT_UP`)).data
  console.log('delete:', JSON.stringify(del))
  chk('sync.delete.deleted', del.deleted, N)

  console.log('\n--- 6. 删除后校验 ---')
  await ddb.connect()
  const cntAfter = await ddb.count(`select count(*) as c from ${TBL} where trade_date=${dd(DATE)} and data_type='LIMIT_UP'`)
  ddb.disconnect()
  chk('afterDelete.count', cntAfter, 0)
  const basic2 = (await http('GET', `/limit-board-statistics/basic/${DATE}`)).data
  chk('afterDelete.limitUpCount(null)', basic2.limitUpCount, null)

  // 清理
  await ddb.connect()
  await ddb.execute(`t = ${TBL}; delete from t where trade_date=${dd(DATE)}`)
  ddb.disconnect()

  console.log(`\n================ E2E: ${pass} passed, ${fail} failed ================`)
  if (fail > 0) process.exit(1)
}
main().catch((e) => { console.error('E2E ERROR', e); process.exit(1) })
