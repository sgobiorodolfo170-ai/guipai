'use strict'

/**
 * 构建验收脚本（P2-6）。
 *
 * 解决的问题：`vite build` 默认输出到 frontend/dist，而构建前 Vite 会清空该目录。
 * 本机安全策略会拦截"批量删除 54 个文件"这个动作，导致唯一的质量门禁
 * 因环境原因报失败——代码其实是好的，但门禁不可信就等于没有门禁。
 *
 * 方案：输出到独立目录 `.build-check/<时间戳>`，
 *   1) 不碰 frontend/dist（打包产物保持原样）；
 *   2) 每次都是全新目录，不存在"清空旧文件"这一步，也就不会触发删除拦截；
 *   3) 时间戳目录天然保留历史，需要对比两次构建差异时可直接 diff。
 *
 * 用法：npm run verify:build
 * 退出码即构建结果：0 成功 / 非 0 失败（可直接用于 CI 门禁）。
 */

const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const FRONTEND = path.join(__dirname, '..', 'frontend')
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-')
const outDir = path.join(__dirname, '..', '.build-check', stamp)

// 保留值：只留最近 5 次，避免长期堆积（只删自己创建的目录，且失败不报错）
const KEEP = 5

function pruneOld() {
  const root = path.join(__dirname, '..', '.build-check')
  if (!fs.existsSync(root)) return
  const dirs = fs.readdirSync(root).filter(d => /^\d{8}-\d{6}$/.test(d)).sort()
  for (const d of dirs.slice(0, Math.max(0, dirs.length - KEEP))) {
    try {
      fs.rmSync(path.join(root, d), { recursive: true, force: true })
    } catch (_) { /* 清理失败不影响验收结论 */ }
  }
}

console.log(`[verify:build] 输出到 .build-check/${stamp}`)

const r = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vite', 'build', '--outDir', outDir, '--emptyOutDir'],
  { cwd: FRONTEND, stdio: 'inherit', shell: process.platform === 'win32' }
)

if (r.status === 0) {
  pruneOld()
  // 断言产物确实存在，避免"构建说成功但没产出"
  const indexHtml = path.join(outDir, 'index.html')
  if (!fs.existsSync(indexHtml)) {
    console.error('[verify:build] 构建返回成功但缺少 index.html，视为失败')
    process.exit(1)
  }
  const assets = path.join(outDir, 'assets')
  const count = fs.existsSync(assets) ? fs.readdirSync(assets).length : 0
  console.log(`[verify:build] OK — index.html + ${count} 个 assets`)
}

process.exit(r.status == null ? 1 : r.status)