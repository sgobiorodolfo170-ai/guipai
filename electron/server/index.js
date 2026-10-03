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

  // ---- 设置（Tushare token 等） ----
  app.get('/api/settings/tushare', (req, res) => {
    res.json({ code: 200, data: { configured: settings.isTushareConfigured() } })
  })
  app.post('/api/settings/tushare', (req, res) => {
    const token = req.body && req.body.token
    settings.setTushareToken(token)
    res.json({ code: 200, msg: settings.isTushareConfigured() ? 'Tushare token 已保存' : 'token 已清除' })
  })

  app.use('/api/aktools', aktoolsRoutes)
  app.use('/api/limit-board-statistics', statisticsRoutes)
  app.use('/api/sync-status', syncRoutes)
  app.use('/api/sim-training', trainingRoutes)
  app.use('/api/kline', klineRoutes)
  app.use('/api/stocks', stockRoutes)
  app.use('/api/market', marketRoutes)
  app.use('/api/watchlist', watchlistRoutes)
  app.use('/api/notes', noteRoutes)
  app.use('/api/templates', templateRoutes)

  app.use((err, req, res, next) => {
    console.error('[server] error:', err.message)
    res.status(500).json({ code: 500, msg: err.message })
  })

  return new Promise((resolve) => {
    server = app.listen(port, () => {
      console.log(`[server] Express running on http://localhost:${port}`)
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
