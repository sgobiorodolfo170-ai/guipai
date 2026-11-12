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
  // 本地服务访问令牌：主进程启动 Express 时随机生成，渲染进程所有 /api 请求需带 X-App-Token。
  // 用 sendSync 而非 invoke——axios 拦截器在模块初始化即需取值，异步会让首批请求漏带 token。
  // 这是一次极短的本地 IPC，无 IO，不构成性能负担。
  apiToken: (() => {
    try { return ipcRenderer.sendSync('app:token') } catch (_) { return '' }
  })(),
  // DolphinDB 访问桥（主进程通过 dolphindb npm 包 WebSocket 转发）
  ddb: {
    status: () => ipcRenderer.invoke('ddb:status'),
    execute: (script) => ipcRenderer.invoke('ddb:execute', script),
    invoke: (func, args) => ipcRenderer.invoke('ddb:invoke', func, args)
  },
  // 渲染进程错误上报通道：main.js 的全局 errorHandler / window 监听经此写入 renderer-error.log
  logError: (payload) => ipcRenderer.send('log:error', payload)
})
