'use strict'

/**
 * 通达信本地数据源（Path A：纯 Node 读 .day 文件，离线兜底）。
 *
 * 直接读通达信安装目录下的 vipdoc\<sh|sz|bj>\lday\<前缀><code>.day 二进制文件，
 * 标准通达信 32 字节日K格式（公开可解析，非同花顺私有格式）：
 *   date(Int32LE YYYYMMDD) open/high/low/close(Int32LE ×100) amount(Float32LE 元) vol(Int32LE 手) reserved(Int32LE)
 *
 * 零网络、零 Python 依赖：通达信客户端未运行 + 网络全断时仍可读已缓存的 9527 只历史日K。
 * 数据新鲜度取决于通达信上次刷新（通常含最新交易日）。
 *
 * 仅日K（分钟数据在 vipdoc\<m>\fday\，本机未下载故不覆盖）。
 * 换手率通达信日K文件不含 → null；涨跌额/涨跌幅/振幅由前收推导（与腾讯/新浪兜底口径一致）。
 */

const fs = require('fs')
const path = require('path')
const settings = require('../settings')

/** A股代码 → 通达信市场子目录 + 文件前缀：6→sh，0/3→sz，43/83/87/88/920→bj */
function tdxMarket(code) {
  const c = String(code || '')
  if (/^(43|83|87|88|92)/.test(c)) return { dir: 'bj', prefix: 'bj' }
  return c.startsWith('6') ? { dir: 'sh', prefix: 'sh' } : { dir: 'sz', prefix: 'sz' }
}

/** 定位通达信安装目录：settings 配置优先，否则探测常见路径。 */
function resolveTdxDir() {
  const cfg = settings.getTdxConfig()
  if (cfg.installPath && fs.existsSync(path.join(cfg.installPath, 'vipdoc'))) return cfg.installPath
  // 自动探测常见安装路径
  const cands = [
    'C:\\new_tdx64', 'C:\\new_tdx', 'D:\\new_tdx64', 'D:\\new_tdx',
    'C:\\Program Files\\通达信\\new_tdx64', 'D:\\通达信',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'new_tdx64')
  ].filter(Boolean)
  for (const p of cands) {
    if (fs.existsSync(path.join(p, 'vipdoc'))) return p
  }
  return null
}

/** 'YYYYMMDD'/'YYYY-MM-DD' → 数字串（用于比较） */
function compact(v) { return String(v || '').replace(/\D/g, '') }

/**
 * 个股日K（读本地 .day 文件）。
 * @param {symbol, start_date, end_date} symbol 纯数字代码；start/end 兼容 YYYY-MM-DD/YYYYMMDD
 * @returns 中文键对象数组（与 daily_k 同构）
 */
function getKLine({ symbol, start_date, end_date }) {
  const dir = resolveTdxDir()
  if (!dir) throw new Error('未找到通达信安装目录（vipdoc 不存在），请在设置页配置通达信安装路径')
  const m = tdxMarket(symbol)
  const file = path.join(dir, 'vipdoc', m.dir, 'lday', `${m.prefix}${symbol}.day`)
  if (!fs.existsSync(file)) throw new Error(`通达信本地无 ${symbol} 日K文件（${m.prefix}${symbol}.day 未下载）`)

  const buf = fs.readFileSync(file)
  if (buf.length % 32 !== 0) throw new Error(`${m.prefix}${symbol}.day 文件长度异常（非 32 字节整数倍）`)
  const recCount = buf.length / 32

  const sd = compact(start_date)
  const ed = compact(end_date)
  const out = []
  let prevClose = null
  for (let i = 0; i < recCount; i++) {
    const off = i * 32
    const date = buf.readInt32LE(off)             // YYYYMMDD
    const open = buf.readInt32LE(off + 4) / 100    // 价格 ×100 → 元
    const high = buf.readInt32LE(off + 8) / 100
    const low = buf.readInt32LE(off + 12) / 100
    const close = buf.readInt32LE(off + 16) / 100
    const amount = buf.readFloatLE(off + 20)       // 成交额(元)
    const volume = buf.readInt32LE(off + 24)      // 成交量(手)
    const ds = String(date)
    if (sd && ds < sd) { prevClose = close; continue }
    if (ed && ds > ed) break
    const chg = prevClose == null ? null : Math.round((close - prevClose) * 100) / 100
    out.push({
      '日期': `${ds.slice(0,4)}-${ds.slice(4,6)}-${ds.slice(6,8)}`,
      '股票代码': symbol,
      '开盘': open, '收盘': close, '最高': high, '最低': low,
      '成交量': volume, '成交额': amount,
      '振幅': prevClose == null || prevClose === 0 ? null : Math.round((high - low) / prevClose * 10000) / 100,
      '涨跌幅': chg == null || prevClose === 0 ? null : Math.round(chg / prevClose * 10000) / 100,
      '涨跌额': chg,
      '换手率': null
    })
    prevClose = close
  }
  return out
}

module.exports = {
  name: 'tdx_local',
  capabilities: ['kline'],
  fetchers: { kline: getKLine },
  available: () => !!resolveTdxDir(),
  resolveTdxDir,
  // 健康探针：供路由层检查可读性
  health: () => {
    const dir = resolveTdxDir()
    if (!dir) return { ok: false, error: '未找到通达信安装目录' }
    return { ok: true, installPath: dir }
  }
}
