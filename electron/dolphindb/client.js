'use strict'

/**
 * DolphinDB 客户端（Electron 主进程侧）
 *
 * 架构定位：
 *   渲染进程(Vue) ──ipc──> 主进程(本模块) ──WebSocket──> 独立 DolphinDB 进程
 *
 * 采用官方 `dolphindb` npm 包（WebSocket JS API），不使用原生 C++ addon。
 * 该包为 ESM，而本项目为 CommonJS，故以动态 import() 加载。
 *
 * DolphinDB 负责tick存储/因子计算/流计算；本模块仅提供连接管理与脚本执行入口，
 * 具体业务查询由各 IPC handler / Express 路由按需调用。
 */

// Polyfill: dolphindb 的 WebSocket 经 undici 实现，undici 的 webidl 用
// `require('node:worker_threads').markAsUncloneable`（Node 22+ API）标记对象不可被 structuredClone。
// Electron 33 内置 Node 20.18 缺该 API，补一个 no-op（这些对象仅在主进程内使用，不跨进程克隆，no-op 安全）。
// 必须在 import('dolphindb') 之前执行。
try {
  const wt = require('node:worker_threads')
  if (typeof wt.markAsUncloneable !== 'function') {
    wt.markAsUncloneable = function () {}
  }
} catch (_) {}

const log = (...a) => console.log('[dolphindb]', ...a)
const warn = (...a) => console.warn('[dolphindb]', ...a)

const DEFAULT_URL = process.env.DOLPHINDB_URL || 'ws://127.0.0.1:8848'
const DEFAULT_USER = process.env.DOLPHINDB_USER || 'admin'
const DEFAULT_PWD = process.env.DOLPHINDB_PASSWORD || '123456'
const DEFAULT_DB = process.env.DOLPHINDB_DB || 'dfs://tradeinsight'

let DDB = null // 动态导入后赋值为 DDB 类
let DMOD = null // dolphindb 模块命名空间（含 DdbVector* / DdbTable）
let ddb = null // 当前连接实例
let connected = false
let connecting = null // 进行中的连接 Promise（防并发重连）
let lastConnectFailAt = 0 // 上次连接失败时间戳
const CONNECT_FAIL_COOLDOWN_MS = 30000 // 连接失败冷却窗：本机没起 DolphinDB 时，
// 每次 execute 都会 connect() 一次，而每次失败要耗 ~10s（实测），
// 于是"K线路由"等每次请求都要先白等 10s 才走网络兜底。冷却期内直接判定"不可用"并立即返回。

/** 动态加载 dolphindb 模块（ESM），缓存命名空间。 */
async function loadMod() {
  if (!DMOD) DMOD = await import('dolphindb')
  if (!DDB) DDB = DMOD.DDB
  return DMOD
}

/** 建立与 DolphinDB 的 WebSocket 连接（幂等、可重入）。
 *  opts.force: true 时忽略失败冷却（用户手动重连/设置页触发）。 */
async function connect(opts = {}) {
  if (connected && ddb) return ddb
  if (connecting) return connecting
  // 冷却期内且未强制：直接拒绝，避免每次查询都白等一次连接超时
  if (!opts.force && Date.now() - lastConnectFailAt < CONNECT_FAIL_COOLDOWN_MS) {
    throw new Error('DolphinDB 处于连接失败冷却期（暂不可用），请确认本机已启动 DolphinDB 服务')
  }

  connecting = (async () => {
    try {
      await loadMod()
      const url = opts.url || DEFAULT_URL
      ddb = new DDB(url, {
        autologin: true,
        username: opts.username || DEFAULT_USER,
        password: opts.password || DEFAULT_PWD
      })
      await ddb.connect()
      connected = true
      lastConnectFailAt = 0
      log('已连接', url)
      // 连接成功后确保库表存在（失败仅告警，不阻断）
      try {
        await ensureSchema(opts.database || DEFAULT_DB)
      } catch (e) {
        warn('库表初始化失败（行情功能可能受限）:', e.message)
      }
      return ddb
    } catch (e) {
      connected = false
      ddb = null
      lastConnectFailAt = Date.now()
      warn('连接 DolphinDB 失败（行情功能不可用）:', e.message)
      throw e
    } finally {
      connecting = null
    }
  })()
  return connecting
}

/** 断开连接，释放 WebSocket 资源。 */
function disconnect() {
  if (ddb && connected) {
    try { ddb.disconnect() } catch (_) {}
  }
  connected = false
  ddb = null
}

function getClient() { return ddb }
function isConnected() { return connected }

/**
 * 执行 DolphinDB 脚本，返回原生 JS 值（DdbObj.data()）。
 * 未连接时自动尝试连接。
 */
async function execute(script) {
  if (!connected) await connect()
  return ddb.execute(script)
}

/** 调用 DolphinDB 函数，传入原生 JS 数组作为参数。 */
async function invoke(func, args) {
  if (!connected) await connect()
  return ddb.invoke(func, args)
}

/** 执行 `select count(*) as c ...` 形式的计数查询，返回数值（兼容多种结果形状）。 */
async function count(sql) {
  const r = await execute(sql)
  let rows = []
  if (Array.isArray(r)) rows = r
  else if (r && r.rows && r.columns) rows = r.rows.map(x => { const o = {}; r.columns.forEach((c, i) => o[c] = x[i]); return o })
  else if (r && typeof r === 'object') {
    const ks = Object.keys(r)
    if (ks.length && Array.isArray(r[ks[0]])) {
      const n = r[ks[0]].length
      for (let i = 0; i < n; i++) { const o = {}; ks.forEach(k => o[k] = r[k][i]); rows.push(o) }
    }
  }
  return rows.length ? Number(rows[0].c ?? 0) : 0
}

/**
 * 按 key 幂等写入（upsert!）—— 存在则更新，不存在则插入。
 * 用于日K重同步：同股同日不产生重复行。
 *
 * @param tableName DFS 表名
 * @param keyColumns 去重键列名数组（如 ['symbol', 'trade_date']）
 * @param columns 列定义 [{ name, type }]（同 insertRows）
 * @param rows 行数据
 * @returns 写入行数
 */
async function upsertRows(tableName, keyColumns, columns, rows) {
  if (!rows || rows.length === 0) return 0
  const mod = await loadMod()
  if (!connected) await connect()
  const cols = columns.map(c => buildVector(mod, c, rows))
  const table = new mod.DdbTable(cols)
  await ddb.upload(['insData'], [table])
  const keyList = keyColumns.map(k => `\`${k}`).join('')
  await ddb.execute(`upsert!{loadTable("${DEFAULT_DB}", "${tableName}"), keys=${keyList}}(insData)`)
  return rows.length
}

/**
 * 批量插入行到 DolphinDB DFS 表。
 * 采用 upload(DdbTable) + execute(tableInsert(loadTable, var)) 模式（官方推荐的批量写入方式）。
 *
 * @param tableName DFS 表名
 * @param columns 列定义 [{ name, type }]，type ∈ symbol|string|int|long|double|date|timestamp
 * @param rows 行数据 [{ colName: value, ... }]，缺失/null 值按 NULL 写入
 * @returns 写入行数
 */
async function insertRows(tableName, columns, rows) {
  if (!rows || rows.length === 0) return 0
  const mod = await loadMod()
  if (!connected) await connect()
  const cols = columns.map(c => buildVector(mod, c, rows))
  const table = new mod.DdbTable(cols)
  // 上传内存表为会话变量（变量名首字符须为字母），再追加到 DFS 表
  await ddb.upload(['insData'], [table])
  await ddb.execute(`tableInsert(loadTable("${DEFAULT_DB}", "${tableName}"), insData)`)
  return rows.length
}

/** 按列定义从 rows 构造 DolphinDB 列向量。 */
function buildVector(mod, c, rows) {
  const vals = rows.map(r => r[c.name])
  switch (c.type) {
    case 'symbol':
      return new mod.DdbVectorSymbol(vals.map(v => (v == null ? '' : String(v))), c.name)
    case 'string':
      return new mod.DdbVectorString(vals.map(v => (v == null ? null : String(v))), c.name)
    case 'int':
      return new mod.DdbVectorInt(vals.map(v => (v == null ? null : Number(v))), c.name)
    case 'long':
      return new mod.DdbVectorLong(vals.map(v => (v == null ? null : Number(v))), c.name)
    case 'double':
      return new mod.DdbVectorDouble(vals.map(v => (v == null ? null : Number(v))), c.name)
    case 'date':
      return new mod.DdbVectorDate(vals, c.name)
    case 'timestamp':
      return new mod.DdbVectorTimeStamp(vals.map(v => (v == null ? null : v)), c.name)
    default:
      throw new Error('未知列类型: ' + c.type)
  }
}

/**
 * 确保行情/因子存储所需的库表存在（幂等）。
 * 当前建立最小集：dfs://tradeinsight（按 trade_date 年度 RANGE 分区）+ tick 表。
 * 流表与因子表将在后续按需补充。
 *
 * 快速短路：库与关键表（daily_k）已存在时只做 1 次 existsTable 往返即返回。
 * 动机：每次 connect() 都串行跑 14+ 个 createTable if-not-exists，首次 K 线请求
 * 会因此阻塞 10~30s 触发前端超时，进而被连接失败冷却误伤。数据表已存在时完全没必要。
 */
async function ensureSchema(dbPath) {
  // 快速短路：tradeinsight 库 + daily_k 表都已存在 → 跳过全套建表检查
  try {
    const hasTable = await execute(`existsTable("${dbPath}", "daily_k")`)
    if (hasTable) return
  } catch (_) { /* 库不存在或查询失败 → 走下方完整建表 */ }

  const startYear = 2024
  const endYear = new Date().getFullYear() + 5
  const bounds = []
  for (let y = startYear; y <= endYear; y++) bounds.push(`${y}.01.01`)
  const boundaries = bounds.join(',')

  // 库
  await execute(
    `if (!existsDatabase("${dbPath}")) { ` +
    `db = database("${dbPath}", RANGE, [${boundaries}]) }\n` +
    `db = database("${dbPath}")`
  )
  // tick 表（历史/批量落盘）
  await execute(
    `if (!existsTable("${dbPath}", "tick")) {\n` +
    `  t = table(1:0, \`trade_date\`timestamp\`symbol\`price\`volume\`amount, ` +
    `[DATE, TIMESTAMP, SYMBOL, DOUBLE, LONG, DOUBLE]);\n` +
    `  db.createPartitionedTable(t, \`tick, \`trade_date)\n` +
    `}`
  )
  // 涨跌停池表（industry/limit_stats 可空，用 STRING 而非 SYMBOL 以确保 null 支持；first/last_limit_time 以 STRING 存 HH:mm:ss）
  await execute(
    `if (!existsTable("${dbPath}", "stock_limit_pool")) {\n` +
    `  t = table(1:0, \`data_type\`trade_date\`stock_code\`stock_name\`industry\`increase_rate\`latest_price\`turnover\`circulation_market_value\`total_market_value\`turnover_rate\`limit_funds\`first_limit_time\`limit_stats\`dynamic_pe\`limit_turnover\`continuous_limit\`last_limit_time\`blast_times\`create_time, ` +
    `[SYMBOL, DATE, SYMBOL, SYMBOL, STRING, DOUBLE, DOUBLE, LONG, DOUBLE, DOUBLE, DOUBLE, LONG, STRING, STRING, DOUBLE, LONG, INT, STRING, INT, TIMESTAMP]);\n` +
    `  db.createPartitionedTable(t, \`stock_limit_pool, \`trade_date)\n` +
    `}`
  )
  // 板块行情表（leading_stock 可空 → STRING）
  await execute(
    `if (!existsTable("${dbPath}", "plate_market_quotation")) {\n` +
    `  t = table(1:0, \`trade_date\`plate\`increase_rate\`total_volume\`total_turnover\`net_inflow\`up_count\`down_count\`average_price\`leading_stock\`leading_stock_price\`leading_stock_increase\`create_time, ` +
    `[DATE, SYMBOL, DOUBLE, DOUBLE, DOUBLE, DOUBLE, INT, INT, DOUBLE, STRING, DOUBLE, DOUBLE, TIMESTAMP]);\n` +
    `  db.createPartitionedTable(t, \`plate_market_quotation, \`trade_date)\n` +
    `}`
  )
  // 指数日K表（change 为关键字，以单反引号引用；列名单反引号连续书写）
  await execute(
    `if (!existsTable("${dbPath}", "stock_zh_index_daily")) {\n` +
    `  t = table(1:0, \`symbol\`trade_date\`open\`close\`high\`low\`volume\`amount\`amplitude\`change\`price_change\`turnover_rate\`create_time\`update_time, ` +
    `[SYMBOL, DATE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, TIMESTAMP, TIMESTAMP]);\n` +
    `  db.createPartitionedTable(t, \`stock_zh_index_daily, \`trade_date)\n` +
    `}`
  )
  // 个股日K表（前复权 qfq，查询用）
  // volume 为 LONG：行情源成交量（手）带小数，写入前由 kline-repository.toInt() 取整，
  // 避免 "cannot be converted to a BigInt"。改列类型需重建分区表，故统一按 LONG 落库。
  await execute(
    `if (!existsTable("${dbPath}", "daily_k")) {\n` +
    `  t = table(1:0, \`symbol\`trade_date\`open\`close\`high\`low\`volume\`amount\`turnover_rate\`pct_chg\`amplitude\`create_time, ` +
    `[SYMBOL, DATE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, LONG, DOUBLE, DOUBLE, DOUBLE, DOUBLE, TIMESTAMP]);\n` +
    `  db.createPartitionedTable(t, \`daily_k, \`trade_date)\n` +
    `}`
  )
  // 原始不复权日K表（daily_k_raw）—— 通达信 .day 全量导入 + 每日数据包增量维护
  // 1998-01-05 起全史，独立库 dfs://tradeinsight_raw（分区从1990起，支持历史数据）
  // 每日 18:10 由 package-sync 写入当日全市场（个股 + 北交所），按日期先删后插保证幂等。
  const rawBounds = []
  for (let y = 1990; y <= endYear; y++) rawBounds.push(`${y}.01.01`)
  await execute(
    `if (!existsDatabase("dfs://tradeinsight_raw")) { database("dfs://tradeinsight_raw", RANGE, [${rawBounds.join(',')}]) }\n` +
    `if (!existsTable("dfs://tradeinsight_raw", "daily_k_raw")) {\n` +
    `  t = table(1:0, \`symbol\`trade_date\`open\`close\`high\`low\`volume\`amount, ` +
    `[SYMBOL, DATE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, LONG, DOUBLE]);\n` +
    `  db = database("dfs://tradeinsight_raw"); db.createPartitionedTable(t, \`daily_k_raw, \`trade_date)\n` +
    `}`
  )
  // 股票基础信息（维度表，不分区）
  await execute(
    `if (!existsTable("${dbPath}", "stock_basic")) {\n` +
    `  t = table(1:0, \`code\`name\`industry\`list_date\`exchange\`status, ` +
    `[SYMBOL, SYMBOL, SYMBOL, DATE, SYMBOL, STRING]);\n` +
    `  db.createTable(t, \`stock_basic)\n` +
    `}`
  )
  // 全市场实时行情快照（每次 cache miss 时 aktools → 写入 → 读取）
  await execute(
    `if (!existsTable("${dbPath}", "stock_spot")) {\n` +
    `  t = table(1:0, \`symbol\`trade_date\`timestamp\`open\`close\`high\`low\`preclose\`volume\`amount\`pct_chg\`change_amount\`turnover_rate\`amplitude\`total_market_value\`circulation_market_value\`pe_ttm\`pb, ` +
    `[SYMBOL, DATE, TIMESTAMP, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, LONG, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE]);\n` +
    `  db.createPartitionedTable(t, \`stock_spot, \`trade_date)\n` +
    `}`
  )
  // 指数实时行情快照
  await execute(
    `if (!existsTable("${dbPath}", "stock_index_spot")) {\n` +
    `  t = table(1:0, \`symbol\`trade_date\`timestamp\`latest_price\`pct_chg\`change_amount\`volume\`amount\`high\`low\`open\`close\`preclose, ` +
    `[SYMBOL, DATE, TIMESTAMP, DOUBLE, DOUBLE, DOUBLE, LONG, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE]);\n` +
    `  db.createPartitionedTable(t, \`stock_index_spot, \`trade_date)\n` +
    `}`
  )
  // 分钟K线（period=1 有均价无振幅；period=5/15/30/60 有振幅/涨跌幅等）
  await execute(
    `if (!existsTable("${dbPath}", "minute_k")) {\n` +
    `  t = table(1:0, \`symbol\`trade_date\`timestamp\`period\`open\`close\`high\`low\`volume\`amount\`avg_price\`amplitude\`pct_chg\`change_amount\`turnover_rate, ` +
    `[SYMBOL, DATE, TIMESTAMP, INT, DOUBLE, DOUBLE, DOUBLE, DOUBLE, LONG, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE]);\n` +
    `  db.createPartitionedTable(t, \`minute_k, \`trade_date)\n` +
    `}`
  )
  // 十大股东持股明细
  await execute(
    `if (!existsTable("${dbPath}", "stock_holding")) {\n` +
    `  t = table(1:0, \`trade_date\`symbol\`holder_name\`holder_type\`hold_num\`hold_ratio\`hold_num_change\`hold_ratio_change\`change_type\`notice_date\`rank, ` +
    `[DATE, SYMBOL, STRING, SYMBOL, LONG, DOUBLE, LONG, DOUBLE, SYMBOL, DATE, INT]);\n` +
    `  db.createPartitionedTable(t, \`stock_holding, \`trade_date)\n` +
    `}`
  )
  // 昨日涨停股池（独立于 stock_limit_pool，含涨停价/振幅/涨速等独有字段）
  await execute(
    `if (!existsTable("${dbPath}", "zt_pool_previous")) {\n` +
    `  t = table(1:0, \`symbol\`trade_date\`name\`latest_price\`limit_price\`pct_chg\`amount\`circulation_mv\`total_mv\`turnover_rate\`amplitude\`speed\`last_limit_time\`consecutive_limit\`industry\`limit_stats, ` +
    `[SYMBOL, DATE, SYMBOL, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, DOUBLE, STRING, INT, STRING, STRING]);\n` +
    `  db.createPartitionedTable(t, \`zt_pool_previous, \`trade_date)\n` +
    `}`
  )
}

module.exports = {
  connect,
  disconnect,
  getClient,
  isConnected,
  execute,
  invoke,
  insertRows,
  upsertRows,
  count
}
