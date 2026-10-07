'use strict'

const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const net = require('net')
const { startServer, stopServer } = require('./server')
const ddb = require('./dolphindb/client')
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

const template = [
  { label: '文件', submenu: [
    { label: '重新加载', accelerator: 'CmdOrCtrl+R', click: () => mainWindow && mainWindow.reload() },
    { type: 'separator' },
    { label: '退出', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
  ]},
  { label: '视图', submenu: [
    { label: '放大', role: 'zoomIn' }, { label: '缩小', role: 'zoomOut' },
    { label: '重置缩放', role: 'resetZoom' }, { type: 'separator' },
    { label: '全屏', role: 'togglefullscreen' }, { label: '开发者工具', role: 'toggleDevTools' }
  ]},
  { label: '帮助', submenu: [
    { label: '关于 龟派', click: () => dialog.showMessageBox(mainWindow, {
      type: 'info', title: '关于', message: '龟派 桌面版',
      detail: `版本 ${app.getVersion()}\nElectron ${process.versions.electron}\nNode.js ${process.versions.node}`
    })}
  ]}
]

app.whenReady().then(async () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))

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
})
