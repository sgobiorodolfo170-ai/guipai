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
    rawDb = new sqljs.Database(new Uint8Array(fs.readFileSync(dbPath)))
  } else {
    rawDb = new sqljs.Database()
  }

  db = new DatabaseWrapper(rawDb)

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
    CREATE TABLE IF NOT EXISTS data_sync_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_type TEXT NOT NULL, trade_date TEXT NOT NULL,
      status INTEGER DEFAULT 0, success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0, message TEXT, sync_time TEXT,
      UNIQUE(data_type, trade_date)
    );
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
    CREATE TABLE IF NOT EXISTS note_category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS note (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      title TEXT NOT NULL,
      content TEXT,
      category_id INTEGER,
      tags TEXT DEFAULT '[]',
      is_public INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_note_user ON note(user_id);
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
  `)

  // ---- stock_basic 列迁移：旧库已建表无新列时补列（SQLite 无 ADD COLUMN IF NOT EXISTS）----
  migrateStockBasicColumns(db)

  persist()

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
  if (db) { db.close(); db = null }
}

module.exports = { initDb, getDb, getDataDir, closeDb, scheduleSave }
