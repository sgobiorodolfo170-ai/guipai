'use strict'

/**
 * 应用设置模块（内存 + 文件持久化，settings.json）
 *
 * Tushare 多账号：
 *   - 存储结构 tushareTokens: [{ id, name, token, enabled, createdAt }]
 *   - 兼容旧版单 token 字段 tushareToken：读取时自动迁移为一条「默认账号」记录
 *   - token 的"选号/冷却/统计"策略在 tushare.js，本模块只管存取
 */

const fs = require('fs')
const path = require('path')

let settingsPath = null
let tushareTokens = [] // [{ id, name, token, enabled, createdAt }]
let akshareConfig = { enabled: false, pythonPath: '', port: 8889 } // AKShare Python 桥接配置
let tdxConfig = { installPath: '', protoPort: 7709, quantPort: 17709 } // 通达信：installPath(空则自动探测)、protoPort(公网LHR)、quantPort(tqcenter HTTP API)

/** 由 Express startServer 调用：指定数据目录并加载持久化设置。 */
function init(dataDir) {
  settingsPath = path.join(dataDir, 'settings.json')
  try {
    const s = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    if (Array.isArray(s.tushareTokens)) {
      tushareTokens = s.tushareTokens.filter(t => t && t.token)
    }
    // AKShare 配置（合并默认值，避免旧 settings.json 无此字段时缺键）
    if (s.akshareConfig && typeof s.akshareConfig === 'object') {
      akshareConfig = {
        enabled: s.akshareConfig.enabled === true,
        pythonPath: String(s.akshareConfig.pythonPath || '').trim(),
        port: Number(s.akshareConfig.port) || 8889
      }
    }
    // 通达信配置
    if (s.tdxConfig && typeof s.tdxConfig === 'object') {
      tdxConfig = {
        installPath: String(s.tdxConfig.installPath || '').trim(),
        protoPort: Number(s.tdxConfig.protoPort) || 7709,
        quantPort: Number(s.tdxConfig.quantPort) || 17709
      }
    }
    // 旧版单 token 字段迁移：tushareToken 字符串 → 并入数组
    if (typeof s.tushareToken === 'string' && s.tushareToken) {
      if (!tushareTokens.some(t => t.token === s.tushareToken)) {
        tushareTokens.push({ id: genId(), name: '默认账号', token: s.tushareToken, enabled: true, createdAt: Date.now() })
      }
      save() // 迁移后立即落盘（写回时不再写旧字段）
    }
  } catch (_) {
    // 首次运行无文件
  }
}

function save() {
  if (!settingsPath) return
  try {
    fs.writeFileSync(settingsPath, JSON.stringify({ tushareTokens, akshareConfig, tdxConfig }, null, 2))
  } catch (e) {
    console.error('[settings] persist failed:', e.message)
  }
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ---- Tushare 多账号 CRUD ----

function getTushareTokens() { return tushareTokens.slice() }

function getEnabledTokens() { return tushareTokens.filter(t => t.enabled && t.token) }

function addTushareToken({ name, token }) {
  token = String(token || '').trim()
  if (!token) throw new Error('token 不能为空')
  if (tushareTokens.some(t => t.token === token)) throw new Error('该 token 已存在')
  const acc = { id: genId(), name: String(name || '').trim() || `账号${tushareTokens.length + 1}`, token, enabled: true, createdAt: Date.now() }
  tushareTokens.push(acc)
  save()
  return acc
}

function updateTushareToken(id, patch) {
  const acc = tushareTokens.find(t => t.id === id)
  if (!acc) throw new Error('账号不存在')
  if (patch.name !== undefined) acc.name = String(patch.name).trim() || acc.name
  if (patch.enabled !== undefined) acc.enabled = !!patch.enabled
  if (patch.token !== undefined) {
    const nt = String(patch.token || '').trim()
    if (!nt) throw new Error('token 不能为空')
    if (tushareTokens.some(t => t.id !== id && t.token === nt)) throw new Error('该 token 已被其他账号使用')
    acc.token = nt
  }
  save()
  return acc
}

function removeTushareToken(id) {
  const i = tushareTokens.findIndex(t => t.id === id)
  if (i === -1) throw new Error('账号不存在')
  tushareTokens.splice(i, 1)
  save()
}

/** 兼容旧调用：返回第一个启用账号的 token（无则 null）。
 *  新代码应改用 tushare.js 内部的账号池自动选号，不要直接用这个。 */
function getTushareToken() {
  const list = getEnabledTokens()
  return list.length ? list[0].token : null
}
function isTushareConfigured() { return getEnabledTokens().length > 0 }

// ---- AKShare Python 桥接配置 ----

function getAkshareConfig() { return { ...akshareConfig } }

function updateAkshareConfig(patch) {
  if (!patch || typeof patch !== 'object') return akshareConfig
  if (patch.enabled !== undefined) akshareConfig.enabled = patch.enabled === true
  if (patch.pythonPath !== undefined) akshareConfig.pythonPath = String(patch.pythonPath || '').trim()
  if (patch.port !== undefined) akshareConfig.port = Math.min(Math.max(Number(patch.port) || 8889, 1024), 65535)
  save()
  return { ...akshareConfig }
}

function isAkshareEnabled() { return akshareConfig.enabled === true }

// ---- 通达信配置 ----

function getTdxConfig() { return { ...tdxConfig } }

function updateTdxConfig(patch) {
  if (!patch || typeof patch !== 'object') return tdxConfig
  if (patch.installPath !== undefined) tdxConfig.installPath = String(patch.installPath || '').trim()
  if (patch.protoPort !== undefined) tdxConfig.protoPort = Math.min(Math.max(Number(patch.protoPort) || 7709, 1), 65535)
  if (patch.quantPort !== undefined) tdxConfig.quantPort = Math.min(Math.max(Number(patch.quantPort) || 17709, 1), 65535)
  save()
  return { ...tdxConfig }
}

module.exports = {
  init,
  getTushareTokens,
  getEnabledTokens,
  addTushareToken,
  updateTushareToken,
  removeTushareToken,
  getTushareToken,
  isTushareConfigured,
  getAkshareConfig,
  updateAkshareConfig,
  isAkshareEnabled,
  getTdxConfig,
  updateTdxConfig
}
