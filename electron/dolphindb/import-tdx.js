'use strict'

/**
 * 通达信 .day 文件批量导入 DolphinDB daily_k_raw（一次性任务）
 *
 * 数据来源：C:\new_tdx64\vipdoc\{sh,sz,bj}\lday\*.day
 * 格式：每条 32 字节（date int32, open/high/low/close int32 分, amount float32 元, volume int32 手, reserved int32）
 * 目标表：daily_k_raw（不复权原始数据，只读基线）
 * 范围：1998-01-01 ~ 2026-10-08，9529 只股票，~2428 万条
 *
 * 用法：node electron/dolphindb/import-tdx.js
 */

const fs = require('fs')
const path = require('path')
const ddb = require('./client')

const TDX_BASE = process.env.TDX_PATH || 'C:\\new_tdx64\\vipdoc'
const RAW_DB = 'dfs://tradeinsight_raw'  // 原始数据独立库（分区从1990起，支持历史数据）
const MARKETS = [
  { dir: 'sh', prefix: 'sh', exchange: 'SSE' },
  { dir: 'sz', prefix: 'sz', exchange: 'SZSE' },
  { dir: 'bj', prefix: 'bj', exchange: 'BSE' }
]

const RECORD_SIZE = 32
const BATCH_FILES = 50  // 每批处理 50 个文件

const RAW_COLS = [
  { name: 'symbol', type: 'symbol' },
  { name: 'trade_date', type: 'date' },
  { name: 'open', type: 'double' },
  { name: 'close', type: 'double' },
  { name: 'high', type: 'double' },
  { name: 'low', type: 'double' },
  { name: 'volume', type: 'long' },
  { name: 'amount', type: 'double' }
]

/** 解析单个 .day 文件 → 行数组 */
function parseDayFile(filePath, symbol) {
  const buf = fs.readFileSync(filePath)
  const count = Math.floor(buf.length / RECORD_SIZE)
  const rows = []
  for (let i = 0; i < count; i++) {
    const off = i * RECORD_SIZE
    const date = buf.readInt32LE(off)
    if (date < 19980101) continue  // 跳过 1998 年前的数据（通达信早期数据质量差）
    if (date > 20261008) continue  // 截止日期
    const open = buf.readInt32LE(off + 4) / 100
    const high = buf.readInt32LE(off + 8) / 100
    const low = buf.readInt32LE(off + 12) / 100
    const close = buf.readInt32LE(off + 16) / 100
    const amount = buf.readFloatLE(off + 20)
    const volume = buf.readInt32LE(off + 24)
    // 跳过无效数据（价格为 0 或负数）
    if (open <= 0 || close <= 0) continue
    rows.push({
      symbol,
      trade_date: `${String(date).slice(0,4)}-${String(date).slice(4,6)}-${String(date).slice(6,8)}`,
      open, close, high, low,
      volume: Math.abs(volume),
      amount: Math.abs(amount)
    })
  }
  return rows
}

/** 收集所有 .day 文件 */
function collectFiles() {
  const allFiles = []
  for (const m of MARKETS) {
    const dir = path.join(TDX_BASE, m.dir, 'lday')
    if (!fs.existsSync(dir)) continue
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.day'))
    for (const f of files) {
      const symbol = f.replace(/\.day$/, '').replace(/^(sh|sz|bj)/, '')
      if (symbol.length < 5 || !/^\d+$/.test(symbol)) continue
      allFiles.push({ path: path.join(dir, f), symbol, market: m.prefix })
    }
  }
  return allFiles
}

/** 检查已导入的 symbol 列表（用于断点续传，从新库查） */
async function getImportedSymbols() {
  try {
    const r = await ddb.execute(`exec distinct symbol from loadTable("${RAW_DB}", "daily_k_raw")`)
    if (Array.isArray(r) && r.length) return new Set(r)
    return new Set()
  } catch (_) { return new Set() }
}

async function main() {
  console.log('=== 通达信数据导入 DolphinDB daily_k_raw ===')
  console.log('数据源:', TDX_BASE)

  await ddb.connect()
  console.log('DolphinDB 已连接')

  const files = collectFiles()
  console.log(`共 ${files.length} 个 .day 文件`)

  // 断点续传：检查已导入的 symbol
  const imported = await getImportedSymbols()
  if (imported.size > 0) {
    console.log(`已导入 ${imported.size} 只股票，跳过已导入的，继续未完成的...`)
  }

  const toImport = files.filter(f => !imported.has(f.symbol))
  console.log(`待导入: ${toImport.length} 个文件`)

  let totalRows = 0
  let totalFiles = 0
  const startTime = Date.now()

  for (let batch = 0; batch * BATCH_FILES < toImport.length; batch++) {
    const batchFiles = toImport.slice(batch * BATCH_FILES, (batch + 1) * BATCH_FILES)
    const batchRows = []

    for (const f of batchFiles) {
      try {
        const rows = parseDayFile(f.path, f.symbol)
        if (rows.length > 0) {
          batchRows.push(...rows)
          totalFiles++
        }
      } catch (e) {
        console.error(`  [跳过] ${f.symbol}: ${e.message.slice(0, 60)}`)
      }
    }

    // 整批一次写入（upload DdbTable + tableInsert）
    if (batchRows.length > 0) {
      try {
        const ddbMod = await import('dolphindb')
        const colVecs = RAW_COLS.map(c => {
          const vals = batchRows.map(r => r[c.name])
          switch (c.type) {
            case 'symbol': return new ddbMod.DdbVectorSymbol(vals.map(v => v == null ? '' : String(v)))
            case 'date': return new ddbMod.DdbVectorDate(vals)
            case 'double': return new ddbMod.DdbVectorDouble(vals)
            case 'long': return new ddbMod.DdbVectorLong(vals)
          }
        })
        const tbl = new ddbMod.DdbTable(colVecs)
        await ddb.getClient().upload(['rawData'], [tbl])
        await ddb.execute(`tableInsert{loadTable("${RAW_DB}", "daily_k_raw")}(rawData)`)
        totalRows += batchRows.length
      } catch (e) {
        console.error(`  批次 ${batch + 1} 写入失败: ${e.message.slice(0, 80)}`)
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const done = (batch + 1) * BATCH_FILES
    const pct = (done / toImport.length * 100).toFixed(1)
    console.log(`[${pct}%] 批次${batch + 1}: ${batchFiles.length}文件 ${batchRows.length}行 | 累计${totalFiles}文件 ${totalRows}行 | ${elapsed}s`)

    await new Promise(r => setTimeout(r, 50))
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n=== 导入完成 ===`)
  console.log(`文件: ${totalFiles}/${toImport.length}`)
  console.log(`行数: ${totalRows}`)
  console.log(`耗时: ${elapsed}s`)

  // 验证
  const r = await ddb.execute(`select count(*) as c from loadTable("${RAW_DB}", "daily_k_raw")`)
  console.log(`DolphinDB 总行数: ${r && r[0] ? r[0].c : '查不到'}`)
  const r2 = await ddb.execute(`select min(trade_date) as mn, max(trade_date) as mx from loadTable("${RAW_DB}", "daily_k_raw")`)
  if (r2 && r2[0]) console.log(`日期范围: ${r2[0].mn} ~ ${r2[0].mx}`)
  const r3 = await ddb.execute(`select count(*) as s from (select distinct symbol from loadTable("${RAW_DB}", "daily_k_raw"))`)
  if (r3 && r3[0]) console.log(`股票数: ${r3[0].s}`)

  ddb.disconnect()
}

main().catch(e => { console.error('导入失败:', e.message); try { ddb.disconnect() } catch (_) {}; process.exit(1) })
