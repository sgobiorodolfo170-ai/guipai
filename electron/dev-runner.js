'use strict'

// 开发运行器：同时拉起 vite dev server 与 electron，方便热加载调试。
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const net = require('net')

const ROOT = path.join(__dirname, '..')
const FRONTEND = path.join(ROOT, 'frontend')
const VITE_PORT = 5173

function portInUse(port) {
  return new Promise((resolve) => {
    const sock = net
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        sock.close(() => resolve(false))
      })
    sock.listen(port, '127.0.0.1')
  })
}

async function waitForVite(timeoutMs = 60000) {
  const start = Date.now()
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://localhost:${VITE_PORT}/`, (res) => {
        res.resume()
        if (res.statusCode < 500) return resolve(true)
        if (Date.now() - start < timeoutMs) setTimeout(check, 800)
        else resolve(false)
      })
      req.on('error', () => {
        if (Date.now() - start < timeoutMs) setTimeout(check, 800)
        else resolve(false)
      })
      req.setTimeout(3000, () => req.destroy(new Error('timeout')))
    }
    check()
  })
}

;(async () => {
  const inUse = await portInUse(VITE_PORT)
  let vite = null
  if (!inUse) {
    console.log('[dev] 启动 vite dev server ...')
    vite = spawn(
      process.platform === 'win32' ? 'npm.cmd' : 'npm',
      ['run', 'dev'],
      { cwd: FRONTEND, stdio: 'inherit', shell: false }
    )
    vite.on('exit', (code) => {
      console.log(`[dev] vite exited code=${code}`)
      process.exit(code || 0)
    })
  }

  console.log('[dev] 等待 vite 就绪 ...')
  const ok = await waitForVite()
  if (!ok) {
    console.error('[dev] vite 未就绪，退出')
    process.exit(1)
  }

  console.log('[dev] 启动 electron ...')
  const electron = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['electron', path.join(ROOT, 'electron', 'main.js')],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development', VITE_DEV_SERVER_URL: `http://localhost:${VITE_PORT}` },
      shell: false
    }
  )
  electron.on('exit', (code) => {
    if (vite) vite.kill()
    process.exit(code || 0)
  })
})()
