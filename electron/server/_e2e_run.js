'use strict'
// 临时：独立启动 Express 服务（用于 E2E），不依赖 Electron 主进程
const { startServer } = require('./index')
const dir = process.env.E2E_DATA_DIR || 'C:/Users/Administrator/AppData/Local/Temp/guipai-e2e-data'
startServer(8080, dir)
  .then(() => console.log('E2E_SERVER_UP on 8080'))
  .catch((e) => { console.error('E2E_SERVER_FAIL', e); process.exit(1) })
