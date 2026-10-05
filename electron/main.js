'use strict'

const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const { startServer, stopServer } = require('./server')
const ddb = require('./dolphindb/client')
const { resolveDevServerUrl } = require('./dev-port')

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

  // ===== DolphinDB 通信桥（渲染进程通过 ipcMain 调用 dolphindb npm 包）=====
  // 架构：渲染进程 ──ipc──> 主进程 ──WebSocket──> 独立 DolphinDB 进程
  ipcMain.handle('ddb:status', async () => ({ connected: ddb.isConnected() }))
  ipcMain.handle('ddb:execute', async (_e, script) => {
    try {
      return { ok: true, data: await ddb.execute(script) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })
  ipcMain.handle('ddb:invoke', async (_e, func, args) => {
    try {
      return { ok: true, data: await ddb.invoke(func, args) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })

  const dataDir = path.join(app.getPath('userData'), 'data')
  try {
    await startServer(SERVER_PORT, dataDir)
  } catch (e) {
    // 注意：dialog.showErrorBox 是同步阻塞 API，会冻结整个主进程事件循环
    // （连带内嵌 Express 不再响应任何请求，表现为"接口全部卡住"），因此改用异步弹窗 + 日志。
    console.error('[main] 本地服务启动失败:', e.message)
    dialog.showMessageBox({ type: 'error', title: '龟派', message: '本地服务启动失败', detail: e.message })
  }

  // 连接 DolphinDB（best-effort：不可达不阻断启动）
  // 这里绝不能用 dialog.showErrorBox —— 那是同步阻塞调用，未启动 DolphinDB 时每次启动都会弹框，
  // 用户不点掉就会把主进程（含内嵌 Express）整个冻结，症状就是"所有接口无响应/像是卡住了"。
  // 行情数据已有腾讯/同花顺/Tushare 多源兜底，DolphinDB 不可用时功能正常降级，故仅记录日志。
  ddb.connect().catch((e) => {
    console.warn('[main] DolphinDB 连接失败（行情将走多源兜底，不影响使用）:', e.message)
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
})
