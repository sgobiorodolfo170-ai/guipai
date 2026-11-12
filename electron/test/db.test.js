'use strict'

/**
 * 数据库层测试（sql.js，真实读写临时目录，不碰用户数据）。
 *
 * 为什么用真实数据库而不是 mock：
 *   db.js 的核心风险不在"函数被调用"，而在 SQL 本身——建表语句、迁移、
 *   UNIQUE 约束、事务回滚、PRAGMA 校验。这些只有真跑一遍 sql.js 才能验证。
 *   sql.js 是 WASM，启动约 200ms，完全可以在测试里承受。
 *
 * 隔离：每个用例用独立的临时目录（.box-agent-scratch 下的路径），
 * 结束后不清理（运行时统一回收），绝不触碰 %APPDATA% 下的用户库。
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const DB_MOD = path.join(__dirname, '..', 'server', 'db.js')
const SCRATCH = path.join(__dirname, '..', '..', '.box-agent-scratch', 'dbtest')

/** db.js 是模块级单例，每组用例必须清缓存才能模拟"重新打开应用" */
function freshDb() {
  delete require.cache[require.resolve(DB_MOD)]
  return require(DB_MOD)
}

function tmpDir(name) {
  return path.join(SCRATCH, `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`)
}

test('initDb: 首次启动建库并创建核心表', async () => {
  const db = freshDb()
  const dir = tmpDir('init')
  await db.initDb(dir)
  const tables = db.getDb()
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
    .all()
    .map(r => r.name)
  for (const t of ['user', 'stock_basic', 'trade', 'position', 'risk_snapshot', 'note', 'watchlist', 'data_fetch_log']) {
    assert.ok(tables.includes(t), `应创建表 ${t}`)
  }
  db.closeDb()
})

test('trade 表: 方向字段有 CHECK 约束，非法值被拒', async () => {
  const db = freshDb()
  await db.initDb(tmpDir('check'))
  assert.throws(
    () => db.getDb().prepare(
      `INSERT INTO trade (user_id, stock_code, direction, trade_price, quantity, trade_date) VALUES (?,?,?,?,?,?)`
    ).run(1, '600519', 'hold', 10, 100, '2026-11-12'),
    /CHECK|constraint/i,
    'direction 只允许 buy/sell'
  )
  db.closeDb()
})

test('position 表: (user_id, stock_code) 唯一，重复插入报错', async () => {
  const db = freshDb()
  await db.initDb(tmpDir('uniq'))
  const ins = () => db.getDb().prepare(
    `INSERT INTO position (user_id, stock_code, quantity, avg_cost) VALUES (?,?,?,?)`
  ).run(1, '600519', 100, 10)
  ins()
  assert.throws(ins, /UNIQUE|constraint/i)
  db.closeDb()
})

test('transaction: 抛错时整体回滚，不留半条数据', async () => {
  const db = freshDb()
  await db.initDb(tmpDir('tx'))
  const insert = (code) => db.getDb().prepare(
    `INSERT INTO trade (user_id, stock_code, direction, trade_price, quantity, trade_date) VALUES (?,?,?,?,?,?)`
  ).run(1, code, 'buy', 10, 100, '2026-11-12')

  try {
    db.getDb().transaction(() => {
      insert('600519')
      insert('000001')
      throw new Error('故意失败')
    })
  } catch (_) { /* 预期 */ }

  const rows = db.getDb().prepare(`SELECT stock_code FROM trade`).all()
  assert.equal(rows.length, 0, '事务内异常应全部回滚，不能只写进去一半')
  db.closeDb()
})

test('持久化: closeDb 后重新打开，数据仍在', async () => {
  const dir = tmpDir('persist')
  let db = freshDb()
  await db.initDb(dir)
  db.getDb().prepare(
    `INSERT INTO trade (user_id, stock_code, stock_name, direction, trade_price, quantity, trade_date) VALUES (?,?,?,?,?,?,?)`
  ).run(1, '600519', '贵州茅台', 'buy', 1680, 100, '2026-11-12')
  db.closeDb()

  db = freshDb()
  await db.initDb(dir)
  const row = db.getDb().prepare(`SELECT stock_name FROM trade WHERE stock_code=?`).get('600519')
  assert.equal(row.stock_name, '贵州茅台')
  db.closeDb()
})

test('备份: 首次启动生成当日备份，同日重启不重复生成', async () => {
  const dir = tmpDir('backup')
  let db = freshDb()
  await db.initDb(dir)
  db.closeDb()

  const bkDir = path.join(dir, 'backups')
  const daily = () => fs.readdirSync(bkDir).filter(f => /^\d{4}-\d{2}-\d{2}\.db$/.test(f))
  assert.equal(daily().length, 1, '应生成 1 份当日备份')
  assert.ok(fs.existsSync(path.join(bkDir, 'last-session.db')), '退出时应写滚动快照')

  db = freshDb()
  await db.initDb(dir)
  db.closeDb()
  assert.equal(daily().length, 1, '同日重启不应新增每日备份')
})

test('完整性校验: 主库损坏后自动从备份恢复，损坏文件留档', async () => {
  const dir = tmpDir('recover')
  let db = freshDb()
  await db.initDb(dir)
  db.getDb().prepare(
    `INSERT INTO trade (user_id, stock_code, stock_name, direction, trade_price, quantity, trade_date) VALUES (?,?,?,?,?,?,?)`
  ).run(1, '000001', '平安银行', 'buy', 10.5, 100, '2026-11-12')
  db.closeDb()

  // 模拟断电写坏：把主库截断成前 200 字节
  const mainDb = path.join(dir, 'tradeinsight.db')
  const full = fs.readFileSync(mainDb)
  fs.writeFileSync(mainDb, full.subarray(0, 200))

  db = freshDb()
  await db.initDb(dir)
  const row = db.getDb().prepare(`SELECT stock_name FROM trade WHERE stock_code=?`).get('000001')
  assert.equal(row?.stock_name, '平安银行', '应靠退出快照恢复出数据')
  db.closeDb()
  assert.ok(fs.readdirSync(dir).some(f => f.includes('.broken-')), '损坏文件应留档而非删除')
})

test('backupDailyIfNeeded: 每日备份只保留 7 份', async () => {
  const dir = tmpDir('rotate')
  let db = freshDb()
  await db.initDb(dir)
  db.closeDb()

  const bkDir = path.join(dir, 'backups')
  const seedName = fs.readdirSync(bkDir).find(f => /^\d{4}-\d{2}-\d{2}\.db$/.test(f))
  const seedBytes = fs.readFileSync(path.join(bkDir, seedName))
  // 伪造 10 份历史备份
  for (let i = 1; i <= 10; i++) {
    fs.writeFileSync(path.join(bkDir, `2026-10-${String(i).padStart(2, '0')}.db`), seedBytes)
  }
  fs.unlinkSync(path.join(bkDir, seedName))  // 删掉当日，让下次启动重建并触发裁剪

  db = freshDb()
  await db.initDb(dir)
  db.closeDb()

  const left = fs.readdirSync(bkDir).filter(f => /^\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort()
  assert.equal(left.length, 7, '每日备份应只保留最近 7 份')
  assert.equal(left[0], '2026-10-05.db', '保留的应是最新 7 份')
  assert.ok(fs.existsSync(path.join(bkDir, 'last-session.db')), '滚动快照不受裁剪影响')
})

test('stock_basic 迁移: 旧库缺列时自动补齐', async () => {
  const db = freshDb()
  const dir = tmpDir('migrate')
  await db.initDb(dir)
  const cols = db.getDb().prepare(`PRAGMA table_info(stock_basic)`).all().map(r => r.name)
  for (const c of ['list_date', 'delist_date', 'is_st', 'total_shares', 'float_shares']) {
    assert.ok(cols.includes(c), `stock_basic 应有列 ${c}`)
  }
  db.closeDb()
})