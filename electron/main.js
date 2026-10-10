'use strict'

const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const net = require('net')
const { startServer, stopServer } = require('./server')
const ddb = require('./dolphindb/client')
const settings = require('./server/settings')
const akshareSource = require('./server/sources/akshare')
const tdxQuantSource = require('./server/sources/tdx_quant')
const tdxServerSource = require('./server/sources/tdx_server')
const { resolveDevServerUrl } = require('./dev-port')

// ============================================================
// DolphinDB 引擎进程管理（随包分发，自动拉起）
// ============================================================

/** 定位 DolphinDB 引擎目录 */
function resolveDolphinDBDir() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'dolphindb-server')
  }
  return path.join(__dirname, '..', 'dolphindb-server')
}

/** 定位 DolphinDB 数据目录（持久化，跨更新保留） */
function resolveDolphinDBDataDir() {
  return path.join(app.getPath('userData'), 'dolphindb-data')
}

/** 检查端口是否已在监听（已有 DolphinDB 实例则跳过启动） */
function isPortListening(port) {
  return new Promise((resolve) => {
    const sock = net.createServer()
    sock.once('error', () => resolve(true))
    sock.once('listening', () => { sock.close(() => resolve(false)) })
    sock.listen(port, '127.0.0.1')
  })
}

/** 等待端口就绪 */
function waitForPort(port, timeoutMs = 20000) {
  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      const sock = new net.Socket()
      sock.setTimeout(1000)
      sock.once('connect', () => { sock.destroy(); resolve(true) })
      sock.once('error', () => {
        sock.destroy()
        if (Date.now() - start < timeoutMs) setTimeout(check, 500)
        else resolve(false)
      })
      sock.once('timeout', () => {
        sock.destroy()
        if (Date.now() - start < timeoutMs) setTimeout(check, 500)
        else resolve(false)
      })
      sock.connect(port, '127.0.0.1')
    }
    check()
  })
}

let dolphindbProcess = null

/** 启动 DolphinDB 引擎（如果未在运行） */
async function startDolphinDB() {
  const DDB_PORT = Number(process.env.DOLPHINDB_PORT) || 8848

  // 端口已在监听 → 外部实例已运行，跳过
  if (await isPortListening(DDB_PORT)) {
    console.log('[dolphindb] 端口 8848 已在监听，跳过引擎启动（使用现有实例）')
    return
  }

  const engineDir = resolveDolphinDBDir()
  const exePath = path.join(engineDir, 'dolphindb.exe')

  if (!fs.existsSync(exePath)) {
    console.warn('[dolphindb] 引擎未找到:', exePath, '（将使用外部 DolphinDB）')
    return
  }

  const dataDir = resolveDolphinDBDataDir()
  try { fs.mkdirSync(dataDir, { recursive: true }) } catch (_) {}

  // cwd 必须设为引擎目录（dolphindb.cfg/dolphindb.lic/dolphindb.dos/DLL 都在此）
  console.log('[dolphindb] 启动引擎:', exePath, '工作目录:', engineDir)
  dolphindbProcess = spawn(exePath, ['-console', '0'], {
    cwd: engineDir,
    stdio: 'ignore',
    windowsHide: true
  })

  dolphindbProcess.on('exit', (code) => {
    console.log('[dolphindb] 引擎进程退出 code=', code)
    dolphindbProcess = null
  })

  const ready = await waitForPort(DDB_PORT, 20000)
  if (ready) {
    console.log('[dolphindb] 引擎已就绪 (port 8848)')
  } else {
    console.warn('[dolphindb] 引擎启动超时，将尝试连接外部实例')
  }
}

/** 停止 DolphinDB 引擎 */
function stopDolphinDB() {
  if (dolphindbProcess) {
    try { dolphindbProcess.kill() } catch (_) {}
    dolphindbProcess = null
    console.log('[dolphindb] 引擎进程已停止')
  }
}

// ============================================================
// AKShare Python 桥接服务进程管理（镜像 DolphinDB 模式）
// ============================================================

/** 定位 AKShare 服务：优先打包 exe，次选开发态已构建 exe，最后开发态直跑 server.py */
function resolveAkshareServer() {
  // 1) 打包态 exe
  if (app.isPackaged) {
    const exe = path.join(process.resourcesPath, 'aktools-server', 'aktools-server.exe')
    if (fs.existsSync(exe)) return { type: 'exe', exe }
  }
  // 2) 开发态已构建 exe（npm run build:akshare-server 产物）
  const devExe = path.join(__dirname, '..', 'python', 'aktools_server', 'dist', 'aktools-server', 'aktools-server.exe')
  if (fs.existsSync(devExe)) return { type: 'exe', exe: devExe }
  // 3) 开发态直跑 server.py（需 dev 机 pip install akshare flask）
  const py = path.join(__dirname, '..', 'python', 'aktools_server', 'server.py')
  if (fs.existsSync(py)) return { type: 'py', script: py }
  return null
}

/** 定位 Python 解释器：settings 配置优先，否则探测 python / python3 */
function resolvePythonExe() {
  const cfg = settings.getAkshareConfig()
  if (cfg.pythonPath && fs.existsSync(cfg.pythonPath)) return cfg.pythonPath
  // 同步探测：spawnSync 快速判断是否存在（不阻塞主流程）
  try {
    const { spawnSync } = require('child_process')
    for (const c of ['python', 'python3']) {
      const r = spawnSync(c, ['--version'], { windowsHide: true, timeout: 3000 })
      if (r.status === 0) return c
    }
  } catch (_) { /* 探测失败走兜底 */ }
  return 'python'
}

let akshareProcess = null

/** 启动 AKShare 服务（设置启用时）。失败静默置 unavailable，不阻断启动。 */
async function startAkshareServer() {
  if (!settings.isAkshareEnabled()) {
    console.log('[akshare] 未启用，跳过')
    return
  }
  const cfg = settings.getAkshareConfig()
  const port = cfg.port || 8889

  if (await isPortListening(port)) {
    console.log(`[akshare] 端口 ${port} 已在监听，复用现有实例`)
    akshareSource.setAvailable(true, port)
    return
  }

  const target = resolveAkshareServer()
  if (!target) {
    console.warn('[akshare] 未找到 server.py 或已构建 exe，跳过（开发态需 pip install akshare flask）')
    return
  }

  try {
    if (target.type === 'exe') {
      console.log('[akshare] 启动 exe:', target.exe)
      akshareProcess = spawn(target.exe, ['--port', String(port)], {
        cwd: path.dirname(target.exe),
        stdio: 'ignore',
        windowsHide: true
      })
    } else {
      const pyExe = resolvePythonExe()
      console.log(`[akshare] 启动 ${pyExe} ${target.script} --port ${port}`)
      akshareProcess = spawn(pyExe, [target.script, '--port', String(port)], {
        cwd: path.dirname(target.script),
        stdio: 'ignore',
        windowsHide: true
      })
    }

    akshareProcess.on('exit', (code) => {
      console.log('[akshare] 服务进程退出 code=', code)
      akshareProcess = null
      akshareSource.setAvailable(false)
    })

    const ready = await waitForPort(port, 15000)
    if (ready) {
      console.log(`[akshare] 服务就绪 (port ${port})`)
      akshareSource.setAvailable(true, port)
    } else {
      console.warn('[akshare] 服务启动超时，标记不可用')
      akshareSource.setAvailable(false)
    }
  } catch (e) {
    console.warn('[akshare] 启动失败:', e.message)
    akshareSource.setAvailable(false)
  }
}

/** 停止 AKShare 服务 */
function stopAkshareServer() {
  if (akshareProcess) {
    try { akshareProcess.kill() } catch (_) {}
    akshareProcess = null
    console.log('[akshare] 服务进程已停止')
  }
  akshareSource.setAvailable(false)
  tdxServerSource.setAvailable(false)
}

// ============================================================
// 通达信量化 HTTP 接口（tqcenter 17709）可用性探测
// 不启动进程（TdxW 由用户运行），只探测 17709 是否在监听 + 能应答 → setAvailable。
// ============================================================

async function probeTdxQuant() {
  const cfg = settings.getTdxConfig()
  const port = cfg.quantPort || 17709
  if (!(await isPortListening(port))) {
    console.log('[tdx_quant] 端口 17709 未监听（TdxW 未运行或未开启TQ），跳过')
    tdxQuantSource.setAvailable(false)
    return
  }
  // 探活：POST get_trading_dates，应答正常即可用
  try {
    const h = await tdxQuantSource.health()
    if (h.ok) {
      console.log('[tdx_quant] 量化接口就绪 (port 17709) — K线/实时/财报/涨跌停经已登录 TdxW')
      tdxQuantSource.setAvailable(true, port)
    } else {
      console.warn('[tdx_quant] 探活失败:', h.error)
      tdxQuantSource.setAvailable(false)
    }
  } catch (e) {
    console.warn('[tdx_quant] 探活异常:', e.message)
    tdxQuantSource.setAvailable(false)
  }
}

/** 探测 tqs（tdxaidata，免客户端）可用性：Python 桥启动后调 /tdxs_health */
async function probeTdxServer() {
  const cfg = settings.getAkshareConfig()
  const port = cfg.port || 8889
  // 等待 Python 桥就绪（/tdxs_* 端点在同进程）
  for (let i = 0; i < 8; i++) {
    if (await isPortListening(port)) break
    await new Promise(r => setTimeout(r, 1000))
  }
  if (!(await isPortListening(port))) {
    console.log('[tdx_server] Python 桥未运行，跳过 tqs 探测')
    tdxServerSource.setAvailable(false)
    return
  }
  try {
    const h = await tdxServerSource.health()
    if (h && h.ok) {
      console.log('[tdx_server] tqs 就绪 (tdxaidata+Key, 免客户端, port', port + ')')
      tdxServerSource.setAvailable(true, port)
    } else {
      console.warn('[tdx_server] tqs 不可用:', h && h.error)
      tdxServerSource.setAvailable(false)
    }
  } catch (e) {
    console.warn('[tdx_server] 探测异常:', e.message)
    tdxServerSource.setAvailable(false)
  }
}

// ============================================================

process.on('uncaughtException', (err) => {
  const logDir = path.join(app.getPath('userData'), 'logs')
  try { fs.mkdirSync(logDir, { recursive: true }) } catch (_) {}
  try { fs.appendFileSync(path.join(logDir, 'crash.log'), `[${new Date().toISOString()}] ${err.stack || err}\n`) } catch (_) {}
  dialog.showErrorBox('龟派 运行错误', err.message)
})

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production'
const FRONTEND_PROD_FILE = path.join(__dirname, '..', 'frontend', 'dist', 'index.html')
const SERVER_PORT = Number(process.env.BACKEND_PORT) || 8080

// 应用图标：多路径回退，确保开发态与打包态都能取到
function resolveIconPath() {
  const candidates = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'build', 'icon.ico'),
        path.join(process.resourcesPath, 'icon.ico'),
        path.join(process.execPath, '..', 'resources', 'build', 'icon.ico')
      ]
    : [
        path.join(__dirname, '..', 'build', 'icon.ico'),
        path.join(process.cwd(), 'build', 'icon.ico')
      ]
  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p } catch (_) {}
  }
  return candidates[0]
}
const ICON_PATH = resolveIconPath()

let mainWindow = null

// Windows 任务栏图标依赖 AppUserModelID 与 electron-builder.yml 的 appId 保持一致
app.setAppUserModelId('com.guipai.app')

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) { app.quit() }
else {
  app.on('second-window', () => {
    if (mainWindow) { mainWindow.isMinimized() && mainWindow.restore(); mainWindow.focus() }
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 680,
    show: false, title: '龟派', backgroundColor: '#0d1117',
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false
    }
  })
  mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) { shell.openExternal(url); return { action: 'deny' } }
    return { action: 'allow' }
  })
  if (isDev) {
    // 开发地址由 dev-port.js 统一解析（dev-runner 传入实际扫描到的端口，
    // standalone 启动时回落到 frontend/.env 的 VITE_DEV_PORT）
    mainWindow.loadURL(resolveDevServerUrl())
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(FRONTEND_PROD_FILE)
  }
}

app.whenReady().then(async () => {
  // 移除原生菜单栏（文件/视图/帮助）：桌面应用无需系统菜单栏。
  // 开发者工具仍可由 F12 / Ctrl+Shift+I 打开（Chromium 默认快捷键，不依赖菜单）。
  Menu.setApplicationMenu(null)

  // ===== DolphinDB 引擎启动（随包分发，自动拉起）=====
  await startDolphinDB()

  // ===== DolphinDB 通信桥 =====
  ipcMain.handle('ddb:status', async () => ({ connected: ddb.isConnected() }))
  ipcMain.handle('ddb:execute', async (_e, script) => {
    try { return { ok: true, data: await ddb.execute(script) } }
    catch (e) { return { ok: false, error: e.message } }
  })
  ipcMain.handle('ddb:invoke', async (_e, func, args) => {
    try { return { ok: true, data: await ddb.invoke(func, args) } }
    catch (e) { return { ok: false, error: e.message } }
  })

  const dataDir = path.join(app.getPath('userData'), 'data')
  try {
    await startServer(SERVER_PORT, dataDir)
  } catch (e) {
    console.error('[main] 本地服务启动失败:', e.message)
    dialog.showMessageBox({ type: 'error', title: '龟派', message: '本地服务启动失败', detail: e.message })
  }

  // 连接 DolphinDB（引擎已由 startDolphinDB 拉起）
  ddb.connect().catch((e) => {
    console.warn('[main] DolphinDB 连接失败:', e.message)
  })

  // ===== AKShare Python 桥接服务（设置启用时才起，失败静默）=====
  startAkshareServer().catch((e) => {
    console.warn('[main] AKShare 服务启动失败:', e.message)
  })

  // ===== 通达信量化 HTTP 接口（17709）探测，TdxW 运行时激活 tdx_quant 源 =====
  probeTdxQuant().catch(() => {})

  // ===== 通达信 tqs（tdxaidata，免客户端）探测，Python 桥起后探 /tdxs_health =====
  probeTdxServer().catch(e => console.error('[tdx_server] PROBE FAIL:', e.message))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopServer()
  ddb.disconnect()
  stopDolphinDB()
  stopAkshareServer()
})
