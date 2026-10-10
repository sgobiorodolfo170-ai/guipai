'use strict'

const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { initDb, closeDb } = require('./db')
const settings = require('./settings')
const aktoolsRoutes = require('./routes/aktools')
const statisticsRoutes = require('./routes/statistics')
const syncRoutes = require('./routes/sync')
const trainingRoutes = require('./routes/training')
const klineRoutes = require('./routes/kline')
const stockRoutes = require('./routes/stock')
const marketRoutes = require('./routes/market')
const watchlistRoutes = require('./routes/watchlist')
const noteRoutes = require('./routes/note')
const templateRoutes = require('./routes/template')
const dataPullRoutes = require('./routes/data-pull')

let server = null

function startServer(port = 8080, dataDir) {
  return initDb(dataDir).then(() => {
  settings.init(dataDir)
  const logDir = path.join(path.dirname(dataDir), 'logs')

  const app = express()
  app.use(cors({ origin: true, credentials: false }))
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

  app.use('/api/aktools', aktoolsRoutes)
  app.use('/api/data-mgmt', require('./routes/data-mgmt'))
  app.use('/api/limit-board-statistics', statisticsRoutes)
  app.use('/api/sync-status', syncRoutes)
  app.use('/api/sim-training', trainingRoutes)
  app.use('/api/kline', klineRoutes)
  app.use('/api/stocks', stockRoutes)
  app.use('/api/boards', require('./routes/boards'))
  app.use('/api/market', marketRoutes)
  app.use('/api/watchlist', watchlistRoutes)
  app.use('/api/notes', noteRoutes)
  app.use('/api/templates', templateRoutes)
  app.use('/api/data-pull', dataPullRoutes)
  app.use('/api/settings/akshare', require('./routes/akshare'))

  app.use((err, req, res, next) => {
    console.error('[server] error:', err.message)
    res.status(500).json({ code: 500, msg: err.message })
  })

  return new Promise((resolve) => {
    server = app.listen(port, () => {
      console.log(`[server] Express running on http://localhost:${port}`)
      // 预热上游：把腾讯 fqkline / 榜单、同花顺行业页的"进程内首请求卡 3~5s"挪到启动后台消化，
      // 并预热全市场快照缓存，避免用户第一次打开页面就等 2~4s。均为 best-effort，不阻塞启动。
      require('./aktools').warmupUpstream().catch(() => {})
      if (typeof aktoolsRoutes.primeCache === 'function') aktoolsRoutes.primeCache().catch(() => {})
      resolve({ port, app })
    })
  })
  })
}

function stopServer() {
  if (server) { server.close(); server = null }
  closeDb()
}

module.exports = { startServer, stopServer }
