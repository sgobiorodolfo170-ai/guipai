'use strict'

const express = require('express')
const cors = require('cors')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const { initDb, closeDb } = require('./db')
const fetchLog = require('./fetch-log')
const settings = require('./settings')
const statisticsRoutes = require('./routes/statistics')
const trainingRoutes = require('./routes/training')
const klineRoutes = require('./routes/kline')
const stockRoutes = require('./routes/stock')
const marketRoutes = require('./routes/market')
const watchlistRoutes = require('./routes/watchlist')
const noteRoutes = require('./routes/note')
const templateRoutes = require('./routes/template')
const cockpitRoutes = require('./routes/cockpit')
const marketSyncRoutes = require('./market-sync')
const packageSync = require('./package-sync')

let server = null

// ============================================================
// 本地服务访问控制（P0-1）
//
// 设计背景：本服务只服务本机 Electron 渲染进程，但桌面应用此前 listen 未指定
// host（Node 默认 0.0.0.0），叠加 CORS `origin:true`（反射任意 Origin），
// 导致局域网任意设备、以及用户浏览器里任意网页都能读写持仓/交易/笔记。
//
// 三层防护（成本极低、不改任何业务逻辑）：
//   1. 只监听回环地址 127.0.0.1 —— 局域网直接不可达，从网络层关死；
//   2. CORS 白名单 —— 只放行本机 dev server、file:// 渲染进程、以及无 Origin 的本地脚本；
//   3. 进程级随机 token —— 由主进程经 preload 注入渲染进程，Express 校验 X-App-Token。
//      判定依据是「请求是否来自浏览器」：带 Origin 或带 Sec-Fetch-* 即视为浏览器发起，
//      必须持 token。本地 Node 脚本（冒烟/e2e/curl）不带这些头，保持零改动可用。
//      仅凭 loopback 绑定无法阻止「用户浏览器里的恶意页面」——它们同样能访问 127.0.0.1，
//      token 才是拦住浏览器侧调用的那一层。
// ============================================================
const APP_TOKEN = crypto.randomBytes(32).toString('hex')
const LOOPBACK_HOST = '127.0.0.1'

/** 本机来源白名单：dev server 端口会被 dev-runner 顺延，故按 host 匹配而非固定端口 */
function isLoopbackOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)
}

/** 常量时间比较，避免 token 被逐字节试探（长度不等直接判否，先挡掉 timingSafeEqual 抛错） */
function tokenMatches(given) {
  if (typeof given !== 'string' || given.length !== APP_TOKEN.length) return false
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(APP_TOKEN))
}

function startServer(port = 8080, dataDir) {
  return initDb(dataDir).then(() => {
  settings.init(dataDir)
  fetchLog.init()
  const logDir = path.join(path.dirname(dataDir), 'logs')

  const app = express()

  // CORS：origin 为 false 时 cors 不会写 Access-Control-Allow-Origin，
  // 浏览器随即拦截响应——这就是「白名单」在 cors 包里的表达方式。
  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)          // 非浏览器调用（本地脚本/curl）
      if (origin === 'null') return cb(null, true) // file:// 渲染进程（生产态）
      if (isLoopbackOrigin(origin)) return cb(null, true)
      return cb(null, false)
    },
    credentials: false,
    allowedHeaders: ['Content-Type', 'X-App-Token'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }))

  // 浏览器发起的请求必须持启动时生成的 token（渲染进程由 preload 注入）。
  // /api/health 放行：仅返回运行状态，用于诊断与探活，无业务数据。
  app.use((req, res, next) => {
    if (req.path === '/api/health') return next()
    const origin = req.headers.origin
    const fetchSite = req.headers['sec-fetch-site']
    const fromBrowser = !!origin || (typeof fetchSite === 'string' && fetchSite !== 'none')
    if (!fromBrowser) return next()
    if (tokenMatches(req.headers['x-app-token'])) return next()
    res.status(401).json({ code: 401, msg: '未授权的本地接口调用' })
  })

  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.get('/api/health', (req, res) => res.json({ code: 200, msg: 'ok', data: { status: 'running' } }))

  app.get('/api/logs/crash', (req, res) => {
    try {
      const logFile = path.join(logDir, 'crash.log')
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf-8')
        res.json({ code: 200, msg: '成功', data: content })
      } else {
        res.json({ code: 200, msg: '成功', data: '' })
      }
    } catch (e) { res.json({ code: 500, msg: e.message }) }
  })

  app.delete('/api/logs/crash', (req, res) => {
    try {
      const logFile = path.join(logDir, 'crash.log')
      if (fs.existsSync(logFile)) fs.writeFileSync(logFile, '')
      res.json({ code: 200, msg: '已清空' })
    } catch (e) { res.json({ code: 500, msg: e.message }) }
  })

  // ---- 设置（Tushare 多账号池） ----
  const tushare = require('./tushare')
  // 列表：账号 + 内存运行统计（成功/失败/冷却/无效标记）
  app.get('/api/settings/tushare', (req, res) => {
    res.json({ code: 200, data: { accounts: tushare.getTokenPoolStatus(), configured: settings.isTushareConfigured() } })
  })
  // 添加账号；test=true 时先验证 token 有效性再入库
  app.post('/api/settings/tushare/accounts', async (req, res) => {
    try {
      const { name, token, test } = req.body || {}
      if (test === true || test === 'true') await tushare.testToken(String(token || '').trim())
      const acc = settings.addTushareToken({ name, token })
      res.json({ code: 200, msg: `账号「${acc.name}」已添加`, data: { id: acc.id } })
    } catch (e) { res.json({ code: 400, msg: e.message }) }
  })
  // 更新账号（改名 / 启用停用 / 换 token）
  app.put('/api/settings/tushare/accounts/:id', (req, res) => {
    try {
      const acc = settings.updateTushareToken(req.params.id, req.body || {})
      res.json({ code: 200, msg: `账号「${acc.name}」已更新` })
    } catch (e) { res.json({ code: 400, msg: e.message }) }
  })
  // 删除账号
  app.delete('/api/settings/tushare/accounts/:id', (req, res) => {
    try {
      settings.removeTushareToken(req.params.id)
      res.json({ code: 200, msg: '已删除' })
    } catch (e) { res.json({ code: 400, msg: e.message }) }
  })
  // 测试某账号 token（trade_cal 零门槛接口）
  app.post('/api/settings/tushare/accounts/:id/test', async (req, res) => {
    try {
      const acc = settings.getTushareTokens().find(t => t.id === req.params.id)
      if (!acc) return res.json({ code: 400, msg: '账号不存在' })
      const r = await tushare.testToken(acc.token)
      res.json({ code: 200, msg: `连接正常（返回 ${r.rows} 行交易日历）` })
    } catch (e) { res.json({ code: 500, msg: e.message }) }
  })

  app.use('/api/data-mgmt', require('./routes/data-mgmt'))
  app.use('/api/data-flow', require('./routes/data-flow'))
  app.use('/api/limit-board-statistics', statisticsRoutes)
  app.use('/api/sim-training', trainingRoutes)
  app.use('/api/kline', klineRoutes)
  app.use('/api/stocks', stockRoutes)
  app.use('/api/boards', require('./routes/boards'))
  app.use('/api/market', marketRoutes)
  app.use('/api/watchlist', watchlistRoutes)
  app.use('/api/notes', noteRoutes)
  app.use('/api/templates', templateRoutes)
  app.use('/api/cockpit', cockpitRoutes)
  app.use('/api/market-sync', marketSyncRoutes.router)
  app.use('/api/package-sync', packageSync.router)
  app.use('/api/settings/akshare', require('./routes/akshare'))
app.use('/api/money-flow', require('./routes/money-flow'))

  // ---- 通达信 Key 多账号管理（与 Tushare 同模式）----
  const { execSync } = require('child_process')
  /** 找 tdxaidata 的 TdxAiData.ini 路径 */
  function findTdxIniPath() {
    try {
      return execSync('python -c "import tdxaidata,os;print(os.path.join(os.path.dirname(tdxaidata.__file__),\'lib\',\'TdxAiData.ini\'))"', { timeout: 5000 }).toString().trim()
    } catch { return null }
  }
  /** 把 Key 写入 TdxAiData.ini 的 [Token] 段 */
  function applyTdxKey(key) {
    const iniPath = findTdxIniPath()
    if (!iniPath || !fs.existsSync(iniPath)) throw new Error('未找到 TdxAiData.ini（tdxaidata 未安装？）')
    let content = fs.readFileSync(iniPath, 'utf-8')
    // 替换 [Token] 段的 token= 行
    content = content.replace(/(\[Token\]\s*\r?\n\s*token=)([^\r\n]*)/, `$1${key}`)
    fs.writeFileSync(iniPath, content, 'utf-8')
  }
  /** 掩码 Key：前 8 位 + … + 后 4 位 */
  function maskKey(key) {
    const t = String(key || '')
    return t.length > 12 ? `${t.slice(0, 8)}…${t.slice(-4)}` : t
  }

  app.get('/api/settings/tdx', (req, res) => {
    res.json({
      code: 200, data: {
        config: settings.getTdxConfig(),
        keys: settings.getTdxKeys().map(k => ({ ...k, keyMasked: maskKey(k.key), key: undefined })),
        activeKey: settings.getEnabledTdxKey() ? maskKey(settings.getEnabledTdxKey()) : null
      }
    })
  })

  app.post('/api/settings/tdx/keys', (req, res) => {
    try {
      const { name, key, apply } = req.body || {}
      const acc = settings.addTdxKey({ name, key })
      if (apply !== false) { try { applyTdxKey(acc.key) } catch (e) { /* ini 写入失败不阻断添加 */ } }
      res.json({ code: 200, msg: `Key「${acc.name}」已添加`, data: { id: acc.id } })
    } catch (e) { res.json({ code: 400, msg: e.message }) }
  })

  app.put('/api/settings/tdx/keys/:id', (req, res) => {
    try {
      const acc = settings.updateTdxKey(req.params.id, req.body || {})
      // 如果改的是启用 Key 或 Key 本身，重新写入 ini
      if (acc.enabled && acc.key) { try { applyTdxKey(acc.key) } catch (_) {} }
      res.json({ code: 200, msg: `Key「${acc.name}」已更新` })
    } catch (e) { res.json({ code: 400, msg: e.message }) }
  })

  app.delete('/api/settings/tdx/keys/:id', (req, res) => {
    try {
      settings.removeTdxKey(req.params.id)
      // 如果还有启用的 Key，写入第一个；否则清空
      const next = settings.getEnabledTdxKey()
      if (next) { try { applyTdxKey(next) } catch (_) {} }
      res.json({ code: 200, msg: '已删除' })
    } catch (e) { res.json({ code: 400, msg: e.message }) }
  })

  app.post('/api/settings/tdx/keys/:id/test', async (req, res) => {
    try {
      const keys = settings.getTdxKeys()
      const acc = keys.find(k => k.id === req.params.id)
      if (!acc) return res.json({ code: 400, msg: 'Key 不存在' })
      // 临时写入该 Key 到 ini，测活，再恢复原 Key
      const original = settings.getEnabledTdxKey()
      try { applyTdxKey(acc.key) } catch (e) { return res.json({ code: 500, msg: '写入 ini 失败: ' + e.message }) }
      // 调 /tdxs_health 探活（需 Python 桥运行）
      const http = require('http')
      const probe = () => new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:8889/tdxs_health', { timeout: 15000 }, r => {
          let d = ''; r.on('data', c => d += c); r.on('end', () => { try { resolve(JSON.parse(d)) } catch { reject(new Error('非JSON')) } })
        }).on('error', reject).on('timeout', () => reject(new Error('超时')))
      })
      try {
        const h = await probe()
        // 恢复原 Key
        if (original) { try { applyTdxKey(original) } catch (_) {} }
        if (h && h.code === 200 && h.data && h.data.ok) {
          res.json({ code: 200, msg: `Key「${acc.name}」验证通过（tqs 连接正常）` })
        } else {
          res.json({ code: 500, msg: `Key 验证失败（tqs 返回不可用）` })
        }
      } catch (e) {
        if (original) { try { applyTdxKey(original) } catch (_) {} }
        res.json({ code: 500, msg: '探活失败: ' + e.message })
      }
    } catch (e) { res.json({ code: 500, msg: e.message }) }
  })

  app.post('/api/settings/tdx/keys/:id/apply', (req, res) => {
    try {
      const keys = settings.getTdxKeys()
      const acc = keys.find(k => k.id === req.params.id)
      if (!acc) return res.json({ code: 400, msg: 'Key 不存在' })
      applyTdxKey(acc.key)
      // 禁用其他 Key，启用此 Key
      for (const k of keys) settings.updateTdxKey(k.id, { enabled: k.id === acc.id })
      res.json({ code: 200, msg: `Key「${acc.name}」已应用为活跃 Key（需重启数据服务生效）` })
    } catch (e) { res.json({ code: 500, msg: e.message }) }
  })

  app.use((err, req, res, next) => {
    console.error('[server] error:', err.message)
    res.status(500).json({ code: 500, msg: err.message })
  })

  return new Promise((resolve) => {
    // 只绑回环：日志里的 localhost 与真实绑定地址一致，避免"看起来本机、实际全网卡"。
    server = app.listen(port, LOOPBACK_HOST, () => {
      console.log(`[server] Express running on http://${LOOPBACK_HOST}:${port}`)
      // 预热上游：把腾讯 fqkline / 榜单 / qt 快照的"进程内首请求卡 3~5s"挪到启动后台消化，
      // 并预热全市场快照缓存，避免用户第一次打开页面就等 2~4s。均为 best-effort，不阻塞启动。
      require('./aktools').warmupUpstream().catch(() => {})
      // 全市场 spot 预热：主源腾讯批量（800/请求、6 并发，~1s），首个 /stocks/realtime 免冷启动。
      // 原先由已删除的 routes/aktools.js#primeCache 提供，迁移到此保持行为不变。
      require('./aktools').getStockSpot(undefined, { log: false }).catch(() => {})
      // 通达信数据包：启动补跑最近 5 个交易日 + 每天 18:10 自动同步
      packageSync.startScheduler()
      resolve({ port, app, token: APP_TOKEN })
    })
  })
  })
}

function stopServer() {
  try { packageSync.stopScheduler() } catch (_) {}
  try { fetchLog.flushSync() } catch (_) {}
  if (server) { server.close(); server = null }
  closeDb()
}

module.exports = { startServer, stopServer }
