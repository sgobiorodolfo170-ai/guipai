'use strict'

const { app, BrowserWindow, Menu, shell, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { startServer, stopServer } = require('./server')

process.on('uncaughtException', (err) => {
  const logDir = path.join(app.getPath('userData'), 'logs')
  try { fs.mkdirSync(logDir, { recursive: true }) } catch (_) {}
  try { fs.appendFileSync(path.join(logDir, 'crash.log'), `[${new Date().toISOString()}] ${err.stack || err}\n`) } catch (_) {}
  dialog.showErrorBox('龟派 运行错误', err.message)
})

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production'
const FRONTEND_DEV_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
const FRONTEND_PROD_FILE = path.join(__dirname, '..', 'frontend', 'dist', 'index.html')
const SERVER_PORT = Number(process.env.BACKEND_PORT) || 8080

let mainWindow = null

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
    mainWindow.loadURL(FRONTEND_DEV_URL)
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

  const dataDir = path.join(app.getPath('userData'), 'data')
  try {
    await startServer(SERVER_PORT, dataDir)
  } catch (e) {
    dialog.showErrorBox('龟派', '本地服务启动失败: ' + e.message)
  }

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
})
