'use strict'

const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

let sqljs = null
let db = null
let dbPath = null
let dataDirPath = null
let saveTimer = null

class PreparedStatement {
  constructor(rawDb, sql) {
    this._raw = rawDb
    this._stmt = rawDb.prepare(sql)
  }
  all(...params) {
    this._stmt.bind(params)
    const rows = []
    while (this._stmt.step()) rows.push(this._stmt.getAsObject())
    this._stmt.reset()
    return rows
  }
  get(...params) {
    this._stmt.bind(params)
    const row = this._stmt.step() ? this._stmt.getAsObject() : null
    this._stmt.reset()
    return row
  }
  run(...params) {
    this._stmt.bind(params)
    this._stmt.step()
    this._stmt.reset()
    return { changes: this._raw.getRowsModified() }
  }
}

class DatabaseWrapper {
  constructor(rawDb) { this._raw = rawDb }
  exec(sql) { this._raw.exec(sql) }
  prepare(sql) { return new PreparedStatement(this._raw, sql) }
  transaction(fn) {
    this._raw.exec('BEGIN')
    try { fn(); this._raw.exec('COMMIT') }
    catch (e) { this._raw.exec('ROLLBACK'); throw e }
  }
  exportData() { return this._raw.export() }
  close() { this._raw.close() }
}

function persist() {
  if (db && dbPath) {
    try {
      fs.writeFileSync(dbPath, Buffer.from(db.exportData()))
    } catch (e) {
      console.error('[db] persist failed:', e.message)
    }
  }
}

/**
 * stock_basic 列迁移：旧库建表时无元数据列，此处按 pragma 检查补列。
 * SQLite 无 ADD COLUMN IF NOT EXISTS，必须逐列探测后 ALTER。
 * 新列默认允许 NULL，不破坏已有数据。
 */
function migrateStockBasicColumns(db) {
  const cols = new Set(db.prepare(`PRAGMA table_info(stock_basic)`).all().map(r => r.name))
  const additions = [
    { name: 'list_date', def: 'TEXT' },
    { name: 'delist_date', def: 'TEXT' },
    { name: 'is_st', def: 'INTEGER DEFAULT 0' },
    { name: 'is_suspended', def: 'INTEGER DEFAULT 0' },
    { name: 'total_shares', def: 'REAL' },
    { name: 'float_shares', def: 'REAL' }
  ]
  for (const c of additions) {
    if (!cols.has(c.name)) {
      db.exec(`ALTER TABLE stock_basic ADD COLUMN ${c.name} ${c.def}`)
    }
  }
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    persist()
  }, 2000)
}

// ============================================================
// 备份与完整性校验（P1-5）
//
// 不变量：交易流水/持仓/笔记只存在这一个 sql.js 文件里，而它是「全量 export 后
// 整体覆盖写」——单文件损坏即全丢，没有任何历史副本。备份是这里唯一可行的兜底。
//   - 每日首次启动做一份快照 data/backups/YYYY-MM-DD.db，保留 7 份；
//   - 只在「当天还没有快照」时写，避免频繁重启把好备份轮换掉；
//   - 正常退出再覆盖写一份 backups/last-session.db，把可恢复点前移到最后一次关闭；
//   - 写快照用「先写 .tmp 再 rename」，防止备份过程中中断留下半个文件；
//   - 快照本身也做 integrity_check，校验不过就不认它（宁缺勿错）。
// ============================================================
const BACKUP_DIRNAME = 'backups'
const BACKUP_KEEP = 7
/** 正常退出时写的滚动快照：不参与 7 份轮换，始终代表「最后一次干净关闭时的库」 */
const LAST_SESSION_FILE = 'last-session.db'

function backupDir() {
  return path.join(dataDirPath, BACKUP_DIRNAME)
}

/** 本地日期（备份按用户本地"哪一天"归档，不能用 UTC，否则东八区凌晨会错日） */
function localDateStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 用 sql.js 打开字节流并跑 integrity_check；任何异常都算坏文件 */
function isDbBytesHealthy(bytes) {
  let probe = null
  try {
    probe = new sqljs.Database(bytes)
    const r = probe.exec('PRAGMA integrity_check')
    const verdict = r && r[0] && r[0].values && r[0].values[0] ? String(r[0].values[0][0]) : ''
    return verdict.toLowerCase() === 'ok'
  } catch (_) {
    return false
  } finally {
    try { probe && probe.close() } catch (_) { /* 关闭失败不影响判定 */ }
  }
}

/** 列出有效备份，最新在前 */
function listBackups() {
  const dir = backupDir()
  if (!fs.existsSync(dir)) return []
  const daily = fs.readdirSync(dir)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .reverse()
    .map(f => ({ name: f, path: path.join(dir, f), date: f.slice(0, 10) }))
  // 滚动快照排在最前：它代表最近一次干净关闭的完整状态，比"当天启动时的样子"更新。
  const last = path.join(dir, LAST_SESSION_FILE)
  if (fs.existsSync(last)) {
    daily.unshift({ name: LAST_SESSION_FILE, path: last, date: 'last-session' })
  }
  return daily
}

/**
 * 正常退出时的滚动快照。
 * 每日备份是在「启动时」拍的，只覆盖到昨天为止的数据；今天记的账若在退出前损坏，
 * 当日备份里没有。这里在 closeDb 的 persist 之后再存一份，把可恢复点前移到最后一刻。
 * 单个文件覆盖写（不是每日多份），不占额外空间、不受 7 份轮换影响。
 */
function snapshotOnClose() {
  if (!db || !dbPath) return
  try {
    fs.mkdirSync(backupDir(), { recursive: true })
    const target = path.join(backupDir(), LAST_SESSION_FILE)
    const tmp = `${target}.tmp`
    fs.writeFileSync(tmp, Buffer.from(db.exportData()))
    fs.renameSync(tmp, target)
  } catch (e) {
    console.error('[db] 退出快照失败:', e.message)
  }
}

/** 每日快照：当天已有则跳过；成功写盘后裁掉多余历史 */
function backupDailyIfNeeded() {
  if (!db || !dbPath || !fs.existsSync(dbPath)) return { skipped: 'no-db' }
  const today = localDateStr()
  const target = path.join(backupDir(), `${today}.db`)
  if (fs.existsSync(target)) return { skipped: 'exists', file: target }

  try {
    fs.mkdirSync(backupDir(), { recursive: true })
    const tmp = `${target}.tmp`
    fs.writeFileSync(tmp, Buffer.from(db.exportData()))
    fs.renameSync(tmp, target)
  } catch (e) {
    console.error('[db] 每日备份失败:', e.message)
    return { error: e.message }
  }

  // 只保留最近 BACKUP_KEEP 份（文件名即日期，字典序＝时间序）
  try {
    const all = fs.readdirSync(backupDir()).filter(f => /^\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort()
    for (const f of all.slice(0, Math.max(0, all.length - BACKUP_KEEP))) {
      fs.unlinkSync(path.join(backupDir(), f))
    }
  } catch (e) {
    console.warn('[db] 清理旧备份失败:', e.message)
  }
  return { file: target }
}

/**
 * 打开既有库：校验 → 损坏则留档 → 从最新有效备份恢复 → 都不行才建空库。
 * 返回值一定是可用的 sqljs.Database。
 */
async function openExistingDb() {
  const bytes = new Uint8Array(fs.readFileSync(dbPath))
  if (isDbBytesHealthy(bytes)) {
    return new sqljs.Database(bytes)
  }

  // 坏了：把现场留档，绝不静默丢弃（用户可能还要人工捞数据）
  const brokenPath = `${dbPath}.broken-${Date.now()}`
  try {
    fs.renameSync(dbPath, brokenPath)
    console.error(`[db] 主库完整性校验失败，已留档至 ${brokenPath}`)
  } catch (e) {
    console.error('[db] 主库损坏且留档失败:', e.message)
  }

  for (const b of listBackups()) {
    try {
      const bb = new Uint8Array(fs.readFileSync(b.path))
      if (isDbBytesHealthy(bb)) {
        console.warn(`[db] 已从备份恢复：${b.name}`)
        return new sqljs.Database(bb)
      }
      console.warn(`[db] 备份不可用（校验失败）：${b.name}`)
    } catch (e) {
      console.warn(`[db] 读取备份失败 ${b.name}: ${e.message}`)
    }
  }

  console.error('[db] 无可用备份，已新建空库——请从留档文件人工恢复')
  return new sqljs.Database()
}

/**
 * note 表结构迁移：旧版 note 表（无 stock_code 列）已被弃用，
 * 需在 CREATE TABLE IF NOT EXISTS 之前 DROP 掉旧 note + note_category。
 * 此操作清除旧笔记数据——已由用户授权弃用。
 * 已迁移到新 schema（含 stock_code 列）则跳过，保证幂等。
 */
function migrateNoteSchema(db) {
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN ('note','note_category')`).all().map(r => r.name)
  if (!tables.includes('note')) return // note 不存在，由后续 CREATE 创建
  const cols = new Set(db.prepare(`PRAGMA table_info(note)`).all().map(r => r.name))
  if (cols.has('stock_code')) return // 已是新 schema
  // 旧 schema：弃用旧表（用户已授权）
  db.exec(`DROP TABLE IF EXISTS note; DROP TABLE IF EXISTS note_category;`)
}

async function initDb(dataDir) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  dataDirPath = dataDir
  dbPath = path.join(dataDir, 'tradeinsight.db')

  if (!sqljs) {
    const wasmPath = path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    sqljs = await initSqlJs({ locateFile: () => wasmPath })
  }

  let rawDb
  if (fs.existsSync(dbPath)) {
    // ---- 启动前完整性校验 ----
    // sql.js 是「全量 export 覆盖写」的单文件持久化：断电/进程被杀可能留下截断文件，
    // 而 new Database(bytes) 抛错后整个服务起不来、用户看到的是"打不开应用"。
    // 这里先做 integrity_check，损坏则把坏文件改名留档（不删，便于人工取证/捞数据），
    // 再尝试从最近一份有效备份恢复；两者都失败才建空库并告警。
    rawDb = await openExistingDb()
  } else {
    rawDb = new sqljs.Database()
  }

  db = new DatabaseWrapper(rawDb)

  // note 表结构迁移：必须先 DROP 旧表，CREATE TABLE IF NOT EXISTS 才能用新 schema 重建
  migrateNoteSchema(db)

  db.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT DEFAULT '',
      email TEXT, phone TEXT, avatar TEXT, nickname TEXT, bio TEXT,
      status INTEGER DEFAULT 1,
      last_login_time TEXT, last_login_ip TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      total_simulation_assets REAL DEFAULT 100000,
      total_transaction_count INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS stock_limit_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_type TEXT NOT NULL, trade_date TEXT NOT NULL,
      stock_code TEXT NOT NULL, stock_name TEXT NOT NULL,
      industry TEXT, increase_rate REAL, latest_price REAL,
      turnover INTEGER, circulation_market_value REAL, total_market_value REAL,
      turnover_rate REAL, limit_funds INTEGER,
      first_limit_time TEXT, limit_stats TEXT,
      dynamic_pe REAL, limit_turnover INTEGER,
      continuous_limit INTEGER DEFAULT 0,
      last_limit_time TEXT, blast_times INTEGER DEFAULT 0,
      create_time TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_slp_date_type ON stock_limit_pool(trade_date, data_type);
    CREATE INDEX IF NOT EXISTS idx_slp_code ON stock_limit_pool(stock_code);
    CREATE TABLE IF NOT EXISTS stock_zh_index_daily (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL, trade_date TEXT NOT NULL,
      open REAL, close REAL, high REAL, low REAL,
      volume REAL, amount REAL, change REAL,
      turnover_rate REAL, amplitude REAL, price_change REAL
    );
    CREATE INDEX IF NOT EXISTS idx_idx_symbol_date ON stock_zh_index_daily(symbol, trade_date);
    CREATE TABLE IF NOT EXISTS plate_market_quotation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trade_date TEXT NOT NULL, plate TEXT,
      increase_rate REAL, total_volume REAL, total_turnover REAL,
      net_inflow REAL, up_count INTEGER, down_count INTEGER,
      average_price REAL, leading_stock TEXT,
      leading_stock_price REAL, leading_stock_increase REAL,
      create_time TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_pmq_date ON plate_market_quotation(trade_date);
    CREATE TABLE IF NOT EXISTS sim_single_training (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, stock_name TEXT NOT NULL, stock_code TEXT NOT NULL,
      start_time TEXT NOT NULL, end_time TEXT NOT NULL,
      initial_capital REAL NOT NULL, final_capital REAL NOT NULL,
      total_profit REAL NOT NULL, operation_profit_rate REAL NOT NULL,
      excess_profit_rate REAL NOT NULL, stock_range_profit_rate REAL NOT NULL,
      trade_times INTEGER NOT NULL, trade_datas TEXT NOT NULL,
      status INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_sst_user ON sim_single_training(user_id);
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      code TEXT NOT NULL UNIQUE,
      name TEXT,
      group_id INTEGER DEFAULT 0,
      note TEXT,
      add_time TEXT DEFAULT (datetime('now','localtime')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_wl_user ON watchlist(user_id);
    CREATE TABLE IF NOT EXISTS watchlist_group (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      description TEXT,
      create_time TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS price_alert (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      code TEXT NOT NULL,
      target_price REAL, direction TEXT, note TEXT, enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    -- 股票笔记主表：结构化交易字段 + 富文本 + K线块 + 标签
    -- 弃用旧 note_category（通用分类），改为 tags(JSON) 驱动
    CREATE TABLE IF NOT EXISTS note (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      stock_code TEXT,
      stock_name TEXT,
      direction TEXT,
      trade_price REAL,
      quantity REAL,
      fee REAL DEFAULT 0,
      trade_date TEXT,
      cost REAL,
      holding_status TEXT,
      content TEXT,
      kline_blocks TEXT,
      tags TEXT DEFAULT '[]',
      is_public INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_note_user ON note(user_id);
    CREATE INDEX IF NOT EXISTS idx_note_code ON note(stock_code);
    CREATE INDEX IF NOT EXISTS idx_note_direction ON note(direction);
    -- 笔记提醒：价格阈值/指定日期/重复定时
    CREATE TABLE IF NOT EXISTS note_alert (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      user_id INTEGER DEFAULT 1,
      alert_type TEXT NOT NULL,
      target_price REAL,
      direction TEXT,
      trigger_date TEXT,
      trigger_time TEXT,
      repeat_rule TEXT,
      enabled INTEGER DEFAULT 1,
      last_triggered_at TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_nalert_note ON note_alert(note_id);
    CREATE TABLE IF NOT EXISTS template_category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS template (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT,
      category_id INTEGER,
      fields TEXT DEFAULT '[]',
      is_public INTEGER DEFAULT 0,
      is_shared INTEGER DEFAULT 0,
      share_code TEXT,
      use_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_tpl_user ON template(user_id);
    CREATE TABLE IF NOT EXISTS stock_basic (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      market TEXT NOT NULL,
      list_date TEXT,
      delist_date TEXT,
      is_st INTEGER DEFAULT 0,
      is_suspended INTEGER DEFAULT 0,
      total_shares REAL,
      float_shares REAL,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_sb_market ON stock_basic(market);
    CREATE TABLE IF NOT EXISTS stock_financial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL, report_date TEXT NOT NULL,
      revenue REAL, net_profit REAL, net_profit_excl_nonrec REAL,
      total_assets REAL, net_assets REAL, debt_ratio REAL,
      operating_cashflow REAL,
      gross_margin REAL, roe REAL, roa REAL,
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(code, report_date)
    );
    CREATE INDEX IF NOT EXISTS idx_sf_code_date ON stock_financial(code, report_date);
    CREATE TABLE IF NOT EXISTS stock_indicator (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      trade_date TEXT,
      pe_ttm REAL, pb REAL, ps REAL, pcf REAL, dividend_yield REAL,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_si_code ON stock_indicator(code);

    CREATE TABLE IF NOT EXISTS board_constituents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      board_name TEXT NOT NULL,
      board_code TEXT,
      stock_code TEXT NOT NULL,
      stock_name TEXT,
      create_time TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(board_name, stock_code)
    );
    CREATE INDEX IF NOT EXISTS idx_bc_board ON board_constituents(board_name);
    -- 数据流转日志：外部取数/导入的旁路记录，最多保留 2 万条（fetch-log.js 维护）
    CREATE TABLE IF NOT EXISTS data_fetch_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      data_type TEXT NOT NULL,
      action TEXT,
      source_key TEXT,
      source_label TEXT,
      status TEXT NOT NULL,
      row_count INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      params TEXT,
      attempts TEXT,
      error TEXT,
      detail TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_dfl_created ON data_fetch_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_dfl_source ON data_fetch_log(source_label);
    CREATE INDEX IF NOT EXISTS idx_dfl_status ON data_fetch_log(status);
    CREATE INDEX IF NOT EXISTS idx_dfl_type ON data_fetch_log(data_type);
    -- 交易流水：结构化成交事实，唯一事实源；持仓由本表流水推导
    CREATE TABLE IF NOT EXISTS trade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      stock_code TEXT NOT NULL,
      stock_name TEXT,
      direction TEXT NOT NULL CHECK(direction IN ('buy','sell')),
      trade_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      fee REAL DEFAULT 0,
      trade_date TEXT NOT NULL,
      note TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_trade_user_code ON trade(user_id, stock_code);
    CREATE INDEX IF NOT EXISTS idx_trade_user_date ON trade(user_id, trade_date);
    CREATE INDEX IF NOT EXISTS idx_trade_user_demo ON trade(user_id, is_demo);
    -- 持仓快照：由 trade 流水按代码全量回放重算，勿手工编辑
    CREATE TABLE IF NOT EXISTS position (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      stock_code TEXT NOT NULL,
      stock_name TEXT,
      quantity INTEGER NOT NULL,
      avg_cost REAL NOT NULL,
      total_invested REAL DEFAULT 0,
      total_proceeds REAL DEFAULT 0,
      realized_pnl REAL DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id, stock_code)
    );
    -- 风控快照：每日最多一行，记录市值/浮盈/仓位/回撤，供趋势回溯
    CREATE TABLE IF NOT EXISTS risk_snapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      snapshot_date TEXT NOT NULL,
      total_market_value REAL,
      total_pnl REAL,
      total_position_pct REAL,
      max_single_position_pct REAL,
      heavy_count INTEGER,
      drawdown_from_peak REAL,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id, snapshot_date)
    );
  `)

  // ---- stock_basic 列迁移：旧库已建表无新列时补列（SQLite 无 ADD COLUMN IF NOT EXISTS）----
  migrateStockBasicColumns(db)

  persist()

  // 每日快照必须在 schema 迁移与首次 persist 之后——此时磁盘上的主库已是"可用的新结构"，
  // 快照才有恢复价值；放在 openExistingDb 里会把尚未迁移的旧结构存成当天备份。
  try { backupDailyIfNeeded() } catch (e) { console.warn('[db] 每日备份异常:', e.message) }

  const origPrepare = db.prepare.bind(db)
  db.prepare = (sql) => {
    const stmt = origPrepare(sql)
    const origRun = stmt.run.bind(stmt)
    stmt.run = (...p) => { const r = origRun(...p); scheduleSave(); return r }
    return stmt
  }

  return db
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.')
  return db
}

/** 数据目录（附件等文件存放于此） */
function getDataDir() {
  return dataDirPath
}

function closeDb() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  persist()
  snapshotOnClose()
  if (db) { db.close(); db = null }
}

module.exports = { initDb, getDb, getDataDir, closeDb, scheduleSave, backupDailyIfNeeded, listBackups, snapshotOnClose }
