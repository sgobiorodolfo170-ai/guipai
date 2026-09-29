'use strict'

/**
 * 应用设置模块（内存 + 文件持久化）。
 * 当前管理：Tushare token（兜底数据源密钥）。
 */

const fs = require('fs')
const path = require('path')

let tushareToken = null
let settingsPath = null

/** 由 Express startServer 调用，传入数据目录以加载持久化设置。 */
function init(dataDir) {
  settingsPath = path.join(dataDir, 'settings.json')
  try {
    const s = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    tushareToken = s.tushareToken || null
  } catch (_) {
    // 首次运行无文件，忽略
  }
}

function save() {
  if (!settingsPath) return
  try {
    fs.writeFileSync(settingsPath, JSON.stringify({ tushareToken }, null, 2))
  } catch (e) {
    console.error('[settings] persist failed:', e.message)
  }
}

function getTushareToken() { return tushareToken }
function setTushareToken(token) { tushareToken = token || null; save() }
function isTushareConfigured() { return !!tushareToken }

module.exports = { init, getTushareToken, setTushareToken, isTushareConfigured }
