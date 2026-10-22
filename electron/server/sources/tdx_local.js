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
 * 另支持 indexDaily（指数日K）：指数文件与个股同目录（sh000001.day 等），
 * 但代码→市场映射不同（见 tdxIndexMarket），且无文件时返回 [] 而非抛错。
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

/** 指数代码 → 通达信市场子目录：399* 深证系列→sz；其余（000xxx 上证/中证系列）→sh。
 *  与个股映射必须分开：000001 作个股是深市平安银行(sz000001)，作指数是上证指数(sh000001)，
 *  同一个代码指向完全不同的标的，混用会静默读错数据。 */
function tdxIndexMarket(code) {
  return /^399/.test(String(code || '')) ? { dir: 'sz', prefix: 'sz' } : { dir: 'sh', prefix: 'sh' }
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
 * 解析 .day 文件字节 → 中文键行数组（与 daily_k 同构）。
 * 调用方负责取文件；本函数只做格式解析与区间过滤（start/end 兼容 YYYY-MM-DD/YYYYMMDD）。
 */
function parseDayFile(buf, symbol, start_date, end_date) {
  if (buf.length % 32 !== 0) throw new Error(`${symbol}.day 文件长度异常（非 32 字节整数倍）`)
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
  return parseDayFile(fs.readFileSync(file), symbol, start_date, end_date)
}

/**
 * 指数日K（读本地 .day 文件，指数版映射）。
 *
 * 设计决策：tqs（tdx_server）不可用时，指数深历史靠本机 vipdoc 文件兜底——
 * 上证/中证 sh000001.day 起自 1998-01-05，深证 399xxx 在 sz 目录，离线零网络。
 * 与个股 getKLine 的差异：无目录/无文件返回 []（"未命中"语义，不抛错触发源冷却），
 * 由调度器决定是否尝试下一源；只支持日K（周/月K 由上层日K聚合），period≠daily 直接空。
 * @returns 中文键对象数组（与 daily_k 同构）
 */
function getIndexDaily({ symbol, period = 'daily', start_date, end_date }) {
  if (period && period !== 'daily') return []
  const dir = resolveTdxDir()
  if (!dir) return []
  const m = tdxIndexMarket(symbol)
  const file = path.join(dir, 'vipdoc', m.dir, 'lday', `${m.prefix}${symbol}.day`)
  if (!fs.existsSync(file)) return []
  return parseDayFile(fs.readFileSync(file), symbol, start_date, end_date)
}

/**
 * 通达信本地股票元数据（读 T0002/hq_cache/base.dbf）�? * base.dbf �?通达信缓存的证券基本信息表（约 8000 �?，含上市日/总股本/流通股本/行业代码�? * 用途：废弃交易所官网/AKShare 后，�?stock_basic 同步 list_date/delist_date/总流通股本�? * 字段口径（DBF �?N 字段为字符串）：�? *   GPDM  证券代码（6 �?�? *   SSDATE 上市日期 YYYYMMDD
 *   ZGB   总股本（万股）
 *   LTAG  流通股本（万股�? *   HY    行业代码（TDX 内部，暂不映射）�? * 仅取 A 股：沪 60/68、深 00/30、北 43/83/87/88/92。指数/基金/债券排除�? */
function readBaseDbf(limit) {
  const dir = resolveTdxDir()
  if (!dir) return []
  const file = path.join(dir, 'T0002', 'hq_cache', 'base.dbf')
  if (!fs.existsSync(file)) return []
  const buf = fs.readFileSync(file)
  if (buf.length < 33) return []
  const headerLen = buf.readUInt16LE(8)
  const recordLen = buf.readUInt16LE(10)
  if (headerLen < 33 || recordLen < 8) return []
  const fields = []
  let pos = 32
  while (pos < headerLen - 1) {
    if (buf[pos] === 0x0D) break
    fields.push({ name: buf.toString('latin1', pos, pos + 11).replace(/\0/g, '').trim(), len: buf[pos + 16] })
    pos += 32
  }
  const off = {}
  const lenOf = {}
  let o = 1
  for (const f of fields) { off[f.name] = o; lenOf[f.name] = f.len; o += f.len }
  const out = []
  const maxN = limit > 0 ? limit : 100000
  const aShare = /^(60|68|00|30|43|83|87|88|92)/
  let p = headerLen
  while (p + recordLen <= buf.length && out.length < maxN) {
    if (buf[p] === 0x20) {
      const read = (name) => {
        const oo = off[name]
        if (oo == null) return ''
        return buf.toString('latin1', p + oo, p + oo + lenOf[name]).trim()
      }
      const code = read('GPDM')
      if (aShare.test(code) && /^\d{6}$/.test(code)) {
        const sd = read('SSDATE')
        const zgb = Number(read('ZGB'))
        const ltag = Number(read('LTAG'))
        out.push({
          code,
          list_date: /^\d{8}$/.test(sd) ? `${sd.slice(0, 4)}-${sd.slice(4, 6)}-${sd.slice(6, 8)}` : null,
          total_shares: Number.isFinite(zgb) && zgb > 0 ? zgb * 10000 : null,   // 万股 → �?          float_shares: Number.isFinite(ltag) && ltag > 0 ? ltag * 10000 : null
        })
      }
    }
    p += recordLen
  }
  return out
}

/**
 * 读 TDX 缓存 cfg 文件（GBK 编码）。返回逐行字符串数组；TextDecoder('gbk') 不可用则退回 UTF-8。
 */
function readCfgLines(file) {
  const dir = resolveTdxDir()
  if (!dir) return []
  const p = path.join(dir, 'T0002', 'hq_cache', file)
  if (!fs.existsSync(p)) return []
  const buf = fs.readFileSync(p)
  try {
    const dec = new TextDecoder('gbk')
    return dec.decode(buf).split(/\r?\n/).filter(Boolean)
  } catch (_) {
    return buf.toString('utf8').split(/\r?\n/).filter(Boolean)
  }
}

/**
 * 通达信子行业板块清单（读 tdxzs.cfg，类型 2|1|1）。
 * 行格式：名称|代码(880xxx)|2|1|1|T代码。共约 110 个子行业，替代东财行业板块口径。
 */
function getIndustrySectors() {
  const out = []
  for (const l of readCfgLines('tdxzs.cfg')) {
    const p = l.split('|')
    if (p.length >= 6 && p[2] === '2' && p[3] === '1' && p[4] === '1') {
      const code = String(p[1] || '').trim()
      const name = String(p[0] || '').trim()
      if (/^\d{6}$/.test(code) && name) out.push({ code, name })
    }
  }
  return out
}

/**
 * 个股→子行业名称映射（tdxhy.cfg 代码→T代码 + tdxzs.cfg T代码→名称）。
 * 供涨跌停池 / 资金流按行业聚合使用，离线可用。
 */
function getStockIndustryMap() {
  const nameByT = {}
  for (const l of readCfgLines('tdxzs.cfg')) {
    const p = l.split('|')
    if (p.length >= 6 && p[5]) nameByT[String(p[5]).trim()] = String(p[0] || '').trim()
  }
  const map = {}
  for (const l of readCfgLines('tdxhy.cfg')) {
    const p = l.split('|')
    if (p.length >= 3 && /^\d{6}$/.test(String(p[1] || '').trim()) && p[2]) {
      const name = nameByT[String(p[2]).trim()]
      if (name) map[String(p[1]).trim()] = name
    }
  }
  return map
}

module.exports = {
  name: 'tdx_local',
  capabilities: ['kline', 'indexDaily'],
  fetchers: { kline: getKLine, indexDaily: getIndexDaily },
  available: () => !!resolveTdxDir(),
  resolveTdxDir,
  readBaseDbf,
  getIndustrySectors,
  getStockIndustryMap,
  // 健康探针：供路由层检查可读性
  health: () => {
    const dir = resolveTdxDir()
    if (!dir) return { ok: false, error: '未找到通达信安装目录' }
    return { ok: true, installPath: dir }
  }
}
