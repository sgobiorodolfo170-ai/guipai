'use strict'

// 开发运行器：同时拉起 vite dev server 与 electron，方便热加载调试。
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const net = require('net')
const { resolveDevPortBase } = require('./dev-port')

const ROOT = path.join(__dirname, '..')
const FRONTEND = path.join(ROOT, 'frontend')
// 起始端口：取自 frontend/.env 的 VITE_DEV_PORT（可用 GP_DEV_PORT 覆盖），见 dev-port.js。
// 选 5174 而非 5173 是因为 5173 常被其它项目（如 esp32）占用，
// 端口冲突会让本项目的 Electron 误加载别人的页面（旧逻辑是直接复用占用端口）。
const PORT_BASE = resolveDevPortBase()
// 端口扫描上限：起始端口被占用时最多向后试探 20 个
const PORT_SCAN_LIMIT = 20

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

async function waitForVite(port, timeoutMs = 60000) {
  const start = Date.now()
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, (res) => {
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

// 从起始端口向后扫描，找出第一个空闲端口，避免与本机其它项目撞端口。
async function findFreePort(base) {
  for (let p = base; p < base + PORT_SCAN_LIMIT; p++) {
    if (!(await portInUse(p))) return p
  }
  return null
}

;(async () => {
  const VITE_PORT = await findFreePort(PORT_BASE)
  if (VITE_PORT === null) {
    console.error(`[dev] ${PORT_BASE}~${PORT_BASE + PORT_SCAN_LIMIT - 1} 端口均被占用，退出（改 frontend/.env 的 VITE_DEV_PORT，或用 GP_DEV_PORT 指定起始端口）`)
    process.exit(1)
  }

  console.log(`[dev] 启动 vite dev server (port=${VITE_PORT}) ...`)
  const vite = spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'dev', '--', '--port', String(VITE_PORT), '--strictPort'],
    { cwd: FRONTEND, stdio: 'inherit', shell: true }
  )
  vite.on('exit', (code) => {
    console.log(`[dev] vite exited code=${code}`)
    process.exit(code || 0)
  })

  console.log('[dev] 等待 vite 就绪 ...')
  const ok = await waitForVite(VITE_PORT)
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
      shell: true
    }
  )
  electron.on('exit', (code) => {
    if (vite) vite.kill()
    process.exit(code || 0)
  })
})()
