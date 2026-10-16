'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('tradeinsight', {
  isElectron: true,
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  // DolphinDB 访问桥（主进程通过 dolphindb npm 包 WebSocket 转发）
  ddb: {
    status: () => ipcRenderer.invoke('ddb:status'),
    execute: (script) => ipcRenderer.invoke('ddb:execute', script),
    invoke: (func, args) => ipcRenderer.invoke('ddb:invoke', func, args)
  },
  // 渲染进程错误上报通道：main.js 的全局 errorHandler / window 监听经此写入 renderer-error.log
  logError: (payload) => ipcRenderer.send('log:error', payload)
})
