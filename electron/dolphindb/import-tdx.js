'use strict'

/**
 * 通达信 .day 数据包导入 DolphinDB daily_k_raw（CLI 封装）
 *
 * 复用 tdx-import.js 库，支持幂等重跑与缺口校验。数据边界：
 *   - 导入区间 [startDate, endDate] 的**不复权**日K → dfs://tradeinsight_raw / daily_k_raw
 *   - 区间之后（用户场景 = 2026-10-08 之后）的新交易日走 aktools 网络接口增量拉取
 *     （由 stock.js kline 路由的断点续传完成，写入 daily_k 前复权查询层；raw 为本地基线不追加网络数据）
 *
 * 用法：
 *   node electron/dolphindb/import-tdx.js                       # 默认 full：19980101~20261008
 *   node electron/dolphindb/import-tdx.js --mode=verify         # 只校验缺口，不写入
 *   node electron/dolphindb/import-tdx.js --mode=full           # 全量（缺的补，已有的跳过）
 *   node electron/dolphindb/import-tdx.js --mode=incremental    # 仅补库内缺失的 symbol
 *   node electron/dolphindb/import-tdx.js --mode=refresh        # 强制重刷 [start,end]（先删后插）
 *   node electron/dolphindb/import-tdx.js --start=19980101 --end=20261008
 */

const { verify, importLocal } = require('./tdx-import')

function parseArgs(argv) {
  const args = { mode: 'full', start: undefined, end: undefined }
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a)
    if (!m) continue
    switch (m[1]) {
      case 'mode': args.mode = m[2] || 'full'; break
      case 'start': args.start = m[2]; break
      case 'end': args.end = m[2]; break
    }
  }
  return args
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const opts = { mode: args.mode }
  if (args.start) opts.startDate = args.start
  if (args.end) opts.endDate = args.end

  console.log('=== 通达信数据导入 DolphinDB daily_k_raw ===')
  console.log('模式:', opts.mode, ' 区间:', opts.startDate || '19980101', '~', opts.endDate || '20261008')
  console.log('数据源:', process.env.TDX_PATH || 'C:\\new_tdx64\\vipdoc')
  console.log('')

  if (opts.mode === 'verify') {
    const v = await verify(opts)
    console.log(`本地文件: ${v.localFiles}   本地symbol(区间内): ${v.localSymbols}`)
    console.log(`库内symbol: ${v.dbSymbols}`)
    console.log(`本地行数: ${v.localRows.toLocaleString()}    库内行数: ${v.dbRows.toLocaleString()}`)
    console.log(`本地有/库缺 symbol: ${v.missingSymbols.length}`)
    if (v.missingSymbols.length) console.log('  ' + v.missingSymbols.join(', '))
    console.log(`库有/本地无 symbol: ${v.onlyInDb.length}`)
    if (v.onlyInDb.length) console.log('  ' + v.onlyInDb.join(', '))
    console.log(`条数不一致 symbol: ${v.countMismatch.length}`)
    for (const c of v.countMismatch.slice(0, 20)) {
      console.log(`  ${c.symbol}: 本地=${c.local} 库=${c.db} 差=${c.local - c.db}`)
    }
    if (v.missingSymbols.length === 0 && v.onlyInDb.length === 0 && v.countMismatch.length === 0) {
      console.log('\n✅ 数据完整，零缺口')
    } else {
      console.log('\n⚠ 存在缺口，需执行导入')
    }
    process.exit(0)
  }

  const r = await importLocal({
    ...opts,
    onProgress: ({ pct, doneFiles, totalFiles, doneRows, elapsed }) => {
      process.stdout.write(`\r  [${pct}%] ${doneFiles}/${totalFiles} 文件 | ${doneRows} 行 | ${elapsed}s`)
    }
  })
  console.log('')
  console.log(`\n导入完成: 模式=${r.mode} 文件=${r.doneFiles}/${r.files} 行=${r.doneRows.toLocaleString()} 耗时=${r.elapsedSec}s`)

  // 终验
  console.log('\n=== 终验 ===')
  const v = await verify(opts)
  console.log(`本地行数: ${v.localRows.toLocaleString()}    库内行数: ${v.dbRows.toLocaleString()}`)
  console.log(`缺口: 缺symbol=${v.missingSymbols.length}  库多余=${v.onlyInDb.length}  条数不一致=${v.countMismatch.length}`)
  if (v.missingSymbols.length === 0 && v.onlyInDb.length === 0 && v.countMismatch.length === 0) {
    console.log('✅ 数据完整，零缺口')
  }
  process.exit(0)
}

main().catch(e => { console.error('\n导入失败:', e.stack || e.message); process.exit(1) })