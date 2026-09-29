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
  }
})
