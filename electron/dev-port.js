'use strict'

/**
 * 开发端口的唯一来源：frontend/.env 的 VITE_DEV_PORT。
 *
 * 为什么要收敛到一处：dev-runner（拉起 vite + electron）、vite.config.js（手动 npm run dev）、
 * electron/main.js（standalone 启动时兜底加载地址）三处都要端口。此前 5173/5174 在多处硬编码，
 * 改漏一处就会出现"Electron 加载了本机另一个项目的 dev server"。
 *
 * 优先级：GP_DEV_PORT / VITE_DEV_PORT 环境变量 > frontend/.env 的 VITE_DEV_PORT > 默认值。
 * （dev-runner 还会从起始端口向后扫描空闲端口，故这里是"起始值"而非最终值。）
 */

const fs = require('fs')
const path = require('path')

const DEFAULT_DEV_PORT = 5174
const FRONTEND_ENV = path.join(__dirname, '..', 'frontend', '.env')

/** 解析 frontend/.env 的 VITE_DEV_PORT；文件缺失或未配置返回 0 */
function readEnvFilePort() {
  try {
    const m = fs.readFileSync(FRONTEND_ENV, 'utf8').match(/^\s*VITE_DEV_PORT\s*=\s*(\d+)/m)
    return m ? Number(m[1]) : 0
  } catch (_) {
    return 0
  }
}

/** 开发端口起始值 */
function resolveDevPortBase() {
  return Number(process.env.GP_DEV_PORT || process.env.VITE_DEV_PORT) || readEnvFilePort() || DEFAULT_DEV_PORT
}

/** Electron 开发态要加载的前端地址（dev-runner 会传入实际扫描到的端口） */
function resolveDevServerUrl() {
  return process.env.VITE_DEV_SERVER_URL || `http://localhost:${resolveDevPortBase()}`
}

module.exports = { DEFAULT_DEV_PORT, resolveDevPortBase, resolveDevServerUrl }