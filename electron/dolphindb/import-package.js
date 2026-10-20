'use strict'

/**
 * 通达信数据包导入 CLI（独立于 Electron 运行，便于排查与首次全量导入）。
 *
 * 用法：
 *   node electron/dolphindb/import-package.js daily [YYYY-MM-DD] [--days N] [--force]
 *   node electron/dolphindb/import-package.js full [--start 1990-01-01] [--end YYYY-MM-DD] [--refresh]
 *   node electron/dolphindb/import-package.js index [--from 2024-01-01]
 *   node electron/dolphindb/import-package.js financial [--from 2010-01-01]
 *   node electron/dolphindb/import-package.js status
 *
 * 通用参数：--cache <目录>（默认 <userData>/tdx-packages）、--data-dir <目录>（SQLite，财务需要）
 */

const path = require('path')
const os = require('os')
const fs = require('fs')

function parseArgs(argv) {
  const positional = []
  const opts = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) { opts[key] = next; i++ } else opts[key] = true
    } else positional.push(a)
  }
  return { positional, opts }
}

function defaultDataDir() {
  if (process.env.GUIPAI_DATA_DIR) return process.env.GUIPAI_DATA_DIR
  const base = process.platform === 'win32'
    ? (process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'))
    : path.join(os.homedir(), '.config')
  return path.join(base, 'guipai', 'data')
}

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2))
  const mode = positional[0] || 'status'
  const importer = require('./package-import')

  if (opts.cache) process.env.TDX_PACKAGE_CACHE = path.resolve(String(opts.cache))
  const cacheDir = importer.getCacheDir()

  const onProgress = (p) => {
    const detail = p.detail
      ? (p.detail.total ? ` ${(p.detail.received / 1048576).toFixed(1)}/${(p.detail.total / 1048576).toFixed(1)}MB`
        : ` ${p.detail.files || ''}`)
      : ''
    process.stdout.write(`\r[${String(p.percent || 0).padStart(3)}%] ${p.phase}${detail}`.padEnd(100))
  }

  if (mode === 'daily') {
    const dates = positional[1]
      ? [positional[1]]
      : importer.recentWeekdays(Number(opts.days || 1))
    for (const d of dates) {
      try {
        const r = await importer.syncDaily(d, { cacheDir, force: !!opts.force })
        console.log(`\n${d}: ${r.empty ? '无数据（非交易日或未发布）' : `个股 ${r.raw} 条 / 指数 ${r.index} 条`}`)
      } catch (e) {
        console.log(`\n${d}: 跳过（${e.message}）`)
      }
    }
  } else if (mode === 'full') {
    const r = await importer.importFull({
      cacheDir,
      startDate: opts.start || '1990-01-01',
      endDate: opts.end || importer.isoToday(),
      mode: opts.refresh ? 'refresh' : 'full',
      onProgress
    })
    console.log(`\n全量导入完成: ${JSON.stringify(r)}`)
  } else if (mode === 'index') {
    const r = await importer.importIndex({ cacheDir, fromDate: opts.from || '2024-01-01', onProgress })
    console.log(`\n指数导入完成: ${JSON.stringify(r)}`)
  } else if (mode === 'financial') {
    const dataDir = path.resolve(String(opts['data-dir'] || defaultDataDir()))
    if (!fs.existsSync(dataDir)) throw new Error('数据目录不存在: ' + dataDir)
    const db = require('../server/db')
    await db.initDb(dataDir)
    const r = await importer.importFinancial({ cacheDir, fromDate: opts.from || '2010-01-01', onProgress })
    db.closeDb()
    console.log(`\n财报导入完成: ${JSON.stringify(r)}`)
  } else if (mode === 'status') {
    const ddb = require('./client')
    const connected = await ddb.connect().then(() => true).catch(() => false)
    if (!connected) {
      console.log('DolphinDB 未连接；缓存目录:', cacheDir)
      if (fs.existsSync(cacheDir)) console.log(fs.readdirSync(cacheDir).join(', '))
      return
    }
    const recent = await ddb.execute(
      `select top 10 trade_date, count(*) as cnt from loadTable("${importer.RAW_DB}", "daily_k_raw") group by trade_date order by trade_date desc`
    )
    console.log('缓存目录:', cacheDir)
    console.log('daily_k_raw 最近 10 日:', JSON.stringify(recent))
  } else {
    console.log('未知模式:', mode)
    console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(3, 12).join('\n'))
    process.exitCode = 1
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('\n失败:', e && e.message ? e.message : e)
  process.exit(1)
})
