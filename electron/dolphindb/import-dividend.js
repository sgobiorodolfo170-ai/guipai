'use strict'

/**
 * 权息事件导入 CLI（独立于 Electron 运行，用于首次全量导入与单股冒烟）。
 *
 * 用法：
 *   node electron/dolphindb/import-dividend.js full [--concurrency 8] [--data-dir <dir>]
 *   node electron/dolphindb/import-dividend.js stock --code 600519 [--code 000001]
 *
 * 数据源：tqcenter get_divid_factors（逐股全历史除权除息事件）。
 * 写入：dfs://tradeinsight_raw / stock_dividend（按 symbol 幂等覆盖，可重跑）。
 * 依赖：DolphinDB 8848 已启动；full 模式需本地 stock_basic 已同步（供代码池）。
 */

const path = require('path')
const os = require('os')

const tdxQuant = require('../server/sources/tdx_quant')
const dividendRepo = require('./dividend-repository')
const fetchLog = require('../server/fetch-log')

function parseArgs(argv) {
  const positional = []
  const opts = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { (opts[key] ? opts[key].push(next) : opts[key] = [next]); i++ }
      else opts[key] = true
    } else positional.push(a)
  }
  // --code 支持单值归一
  if (opts.code && !Array.isArray(opts.code)) opts.code = [opts.code]
  return { positional, opts }
}

function defaultDataDir() {
  if (process.env.GUIPAI_DATA_DIR) return process.env.GUIPAI_DATA_DIR
  const base = process.platform === 'win32'
    ? (process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'))
    : path.join(os.homedir(), '.config')
  return path.join(base, 'guipai', 'data')
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/** 单只拉取 + 重试（空事件视为正常未分红，返回 []；网络/接口错误重试） */
async function fetchOne(symbol, retries = 2) {
  let lastErr = null
  for (let i = 0; i <= retries; i++) {
    try {
      const rows = await tdxQuant.getDividFactors(symbol)
      return rows // 空数组 = 该股无事件，正常
    } catch (e) {
      lastErr = e
      if (i < retries) await sleep(500 * (i + 1))
    }
  }
  throw lastErr
}

/** 并发池：逐 symbol 拉取 + 入库 */
async function runPool(items, limit, worker) {
  const out = new Array(items.length)
  let next = 0
  const lanes = Array.from({ length: Math.max(1, Math.min(limit, items.length || 1)) }, async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await worker(items[i], i)
    }
  })
  await Promise.all(lanes)
  return out
}

/** 分批批量写入 DDB（每批 100 只；skipDelete 续跑时纯追加无删除） */
async function flushBatch(stocks, skipDelete) {
  if (!stocks.length) return 0
  const n = await dividendRepo.insertDividendsBatch(stocks, { skipDelete })
  return n
}

async function importAll({ codes, concurrency, skipDelete, onProgress }) {
  // 1) 并行拉取全市场事件（内存中攒齐，分批批量写库）
  const results = new Array(codes.length)
  await runPool(codes, concurrency, async (code, i) => {
    try {
      results[i] = { symbol: code, rows: await fetchOne(code), error: null }
    } catch (e) {
      results[i] = { symbol: code, rows: [], error: (e.message || String(e)).slice(0, 200) }
    }
    if (onProgress && (i + 1) % 100 === 0) {
      const doneOk = results.slice(0, i + 1).filter(r => !r.error).length
      const evt = results.slice(0, i + 1).reduce((s, r) => s + (r.rows ? r.rows.length : 0), 0)
      const fails = results.slice(0, i + 1).filter(r => r.error).length
      onProgress(i + 1, codes.length, evt, fails, doneOk)
    }
  })

  // 2) 分批批量写入（幂等，每只覆盖重写；skipDelete 续跑只追加）
  const withEvents = results.filter(r => !r.error && r.rows && r.rows.length)
  const batchSize = 100
  let totalEvents = 0
  for (let i = 0; i < withEvents.length; i += batchSize) {
    const chunk = withEvents.slice(i, i + batchSize)
    totalEvents += await flushBatch(chunk, skipDelete)
    if (onProgress) onProgress(codes.length, codes.length, totalEvents, results.filter(r => r.error).length, 0)
  }

  return { total: codes.length, done: results.filter(r => !r.error).length, events: totalEvents, failures: results.filter(r => r.error) }
}

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2))
  const mode = positional[0] || 'full'
  const dataDir = path.resolve(String(opts['data-dir'] || defaultDataDir()))

  // fetch-log 依赖 sql.js，CLI 需先初始化（full 模式的代码池也走 stock_basic）
  const db = require('../server/db')
  await db.initDb(dataDir)
  fetchLog.init()

  const concurrency = Math.max(1, Number(opts.concurrency) || 16)
  const resume = !!opts.resume
  const onProgress = (done, total, events, fails) => {
    process.stdout.write(`\r  [${done}/${total}] 事件 ${events} 条 | 失败 ${fails}`.padEnd(100))
  }

  if (mode === 'stock') {
    const codes = (opts.code || []).map(c => String(c).replace(/\D/g, '').slice(0, 6)).filter(c => /^\d{6}$/.test(c))
    if (!codes.length) throw new Error('stock 模式需 --code（如 --code 600519 --code 000001）')
    console.log(`=== 单股权息事件导入: ${codes.join(',')} ===`)
    for (const code of codes) {
      const rows = await fetchOne(code)
      const n = await dividendRepo.insertDividends(rows)
      const latest = await dividendRepo.getLatestExDate(code)
      console.log(`  ${code}: 事件 ${rows.length} 条（写入 ${n}），最新除权日 ${latest || '无'}，库内最新 ${latest || '-'}`)
    }
  } else {
    const { getDb } = require('../server/db')
    // 代码池优先 stock_basic（含新上市/北交所）；为空时回退通达信本地 base.dbf（离线全市场）
    let codes = getDb().prepare('SELECT code FROM stock_basic').all().map(r => String(r.code).trim()).filter(c => /^\d{6}$/.test(c))
    let universeSource = 'stock_basic'
    if (!codes.length) {
      const tdxLocal = require('../server/sources/tdx_local')
      const base = tdxLocal.readBaseDbf()
      codes = base.map(m => m.code).filter(c => /^\d{6}$/.test(c))
      universeSource = '通达信 base.dbf'
      if (!codes.length) throw new Error('stock_basic 为空且通达信 base.dbf 不可读，无法获取全市场代码池')
    }
    console.log(`=== 全 A 股权息事件全量导入 ===`)
    console.log(`代码池: ${codes.length} 只（来源 ${universeSource}）| 并发: ${concurrency}${resume ? ' | 续跑(跳过已入库)':''}`)

    if (resume) {
      // 先连接 DDB 再查已入库 symbol（未连接时 getAllSymbols 返回 []，会让续跑退化成全量追加）
      await dividendRepo.ensureTable()
      const existing = await dividendRepo.getAllSymbols()
      if (existing.length) {
        const exSet = new Set(existing)
        codes = codes.filter(c => !exSet.has(c))
        console.log(`续跑: 已入库 ${existing.length} 只，本次剩余 ${codes.length} 只`)
      }
    }
    if (!codes.length) {
      console.log('无需导入（全部已入库）')
      const count0 = await dividendRepo.countAll()
      console.log(`stock_dividend 全表行数: ${count0.toLocaleString()}`)
      fetchLog.flushSync()
      db.closeDb()
      process.exit(0)
    }

    const r = await fetchLog.wrap({
      dataType: 'dividend',
      action: '权息事件全量导入',
      sourceKey: 'tdx_quant',
      params: { mode: 'full', concurrency, resume }
    }, () => importAll({ codes, concurrency, skipDelete: resume, onProgress }), (res) => ({
      status: res.events > 0 ? 'success' : 'empty',
      rowCount: res.events,
      detail: { stocks: res.done, failures: res.failures.length }
    }))

    console.log('')
    console.log(`\n导入完成: ${r.done}/${r.total} 只成功，事件 ${r.events.toLocaleString()} 条，失败 ${r.failures.length}`)
    if (r.failures.length) {
      console.log('失败清单（前 20）:')
      for (const f of r.failures.slice(0, 20)) console.log(`  ${f.code}: ${f.error}`)
    }
  }

  const count = await dividendRepo.countAll()
  console.log(`\nstock_dividend 全表行数: ${count.toLocaleString()}`)

  fetchLog.flushSync()
  db.closeDb()
  process.exit(0)
}

main().catch(e => {
  console.error('\n导入失败:', e.stack || e.message)
  try { require('../server/fetch-log').flushSync() } catch (_) {}
  process.exit(1)
})
