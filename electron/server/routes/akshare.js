'use strict'

/**
 * AKShare Python 桥接 —— 设置/控制路由。
 *
 * 端点：
 *   GET    /                配置 + Python/akshare 探测状态 + 服务运行状态
 *   PUT    /                更新配置（enabled/pythonPath/port）
 *   POST   /start           手动启动服务（设置 enabled 后由 main.js 自动起，此端点供设置页手动触发）
 *   POST   /stop            手动停止服务
 *   POST   /test            探活（调 akshare 源 health）
 *   POST   /install         pip install akshare flask（流式输出，供设置页"安装"按钮）
 *
 * 服务进程由 main.js 管理（spawn aktools-server.exe / python server.py），
 * 本路由只读写 settings + 探测 + 通过 akshareSource 控制可用性标记。
 */

const express = require('express')
const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const settings = require('../settings')
const akshareSource = require('../sources/akshare')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

/** 探测本机 Python + akshare 安装情况 */
function probePython() {
  const cfg = settings.getAkshareConfig()
  const candidates = []
  if (cfg.pythonPath) candidates.push(cfg.pythonPath)
  candidates.push('python', 'python3')
  for (const c of candidates) {
    try {
      const v = spawnSync(c, ['--version'], { windowsHide: true, timeout: 4000 })
      if (v.status === 0) {
        const ver = (v.stdout.toString() + v.stderr.toString()).trim()
        // 探测 akshare 是否已装
        let akVer = null, akErr = null
        const a = spawnSync(c, ['-c', 'import akshare;print(akshare.__version__)'], { windowsHide: true, timeout: 8000 })
        if (a.status === 0) {
          akVer = (a.stdout.toString()).trim()
        } else {
          akErr = (a.stderr.toString()).trim().split('\n').pop()
        }
        return { pythonExe: c, pythonVersion: ver, akshareVersion: akVer, akshareError: akErr }
      }
    } catch (_) { /* 继续下一个候选 */ }
  }
  return { pythonExe: null, pythonVersion: null, akshareVersion: null, akshareError: '未找到 python' }
}

// GET / —— 配置 + 探测 + 服务状态
router.get('/', (req, res) => {
  try {
    ok(res, {
      config: settings.getAkshareConfig(),
      python: probePython(),
      running: akshareSource.available()
    })
  } catch (e) { errMsg(res, e.message) }
})

// PUT / —— 更新配置
router.put('/', (req, res) => {
  try {
    const cfg = settings.updateAkshareConfig(req.body || {})
    ok(res, cfg, '已保存')
  } catch (e) { errMsg(res, e.message) }
})

// POST /test —— 探活服务
router.post('/test', async (req, res) => {
  try {
    const h = await akshareSource.health()
    ok(res, h, h && h.ok ? `服务正常（akshare ${h.akshare || '?'})` : '服务未就绪')
  } catch (e) { errMsg(res, '探活失败: ' + e.message) }
})

// POST /start —— 手动标记启用并提示需重启（实际 spawn 在 main.js）
router.post('/start', (req, res) => {
  try {
    settings.updateAkshareConfig({ enabled: true })
    ok(res, null, '已标记启用。服务将在应用启动时自动拉起；如需立即生效请重启应用')
  } catch (e) { errMsg(res, e.message) }
})

// POST /stop —— 标记停用
router.post('/stop', (req, res) => {
  try {
    settings.updateAkshareConfig({ enabled: false })
    akshareSource.setAvailable(false)
    ok(res, null, '已标记停用。下次启动不再拉起服务')
  } catch (e) { errMsg(res, e.message) }
})

// POST /install —— pip install akshare flask（流式输出）
router.post('/install', (req, res) => {
  const cfg = settings.getAkshareConfig()
  const py = cfg.pythonPath || 'python'
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.write('开始安装 akshare flask（可能需 1-3 分钟）...\n')
  const child = spawn(py, ['-m', 'pip', 'install', '--upgrade', 'akshare', 'flask'], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  })
  const pipData = (d) => { try { res.write(d) } catch (_) {} }
  child.stdout.on('data', pipData)
  child.stderr.on('data', pipData)
  child.on('close', (code) => {
    res.write(`\n${code === 0 ? '安装完成' : '安装失败(code=' + code + ')'}`)
    res.end()
  })
  child.on('error', (e) => {
    res.write('\n启动 pip 失败: ' + e.message)
    res.end()
  })
})

module.exports = router
