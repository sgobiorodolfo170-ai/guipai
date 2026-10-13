'use strict'

/**
 * 股票往期数据拉取路由 —— 手动分批次将个股日K写入 DolphinDB daily_k。
 *
 * 设计说明：
 *   - 分批次由前端驱动：每次 POST /batch 只处理一个批次（默认上限 50 只），
 *     返回逐只结果，前端据此推进下一批并渲染进度。
 *     批请求是长请求，服务端用 BATCH_BUDGET_MS 墙钟预算封顶（超时即截断返回，
 *     未处理代码标记 skipped 由前端补批）；同一时刻只允许一个批次在跑，
 *     避免重复批次并发执行变成对行情源的压测。
 *   - 串行 + 可配间隔：逐只串行拉取，请求间插入 intervalMs 延时，
 *     规避东财限流（软封表现为返回空 pool/空 klines）。
 *   - 写入走 klineRepo.insertDailyK（预删除日期区间后插入），天然幂等，可重复拉取补齐缺口。
 *   - 股票名称取自 aktools:stock:spot 缓存（该 key 存的是 aktools 原始行），仅用于回显，不参与拉取逻辑。
 */

const express = require('express')
const aktools = require('../aktools')
const cache = require('../cache')
const ddb = require('../../dolphindb/client')
const klineRepo = require('../../dolphindb/kline-repository')
const { getDb } = require('../db')

const router = express.Router()
const ok = (res, data, msg = '成功') => res.json({ code: 200, msg, data })
const errMsg = (res, msg) => res.json({ code: 500, msg })

const MAX_BATCH = 50          // 单批最大股票数
const MAX_RANGE_DAYS = 7300   // 单次拉取最大跨度（约 20 年），防止误操作拉全量历史

// 单批请求的墙钟预算（ms）。批内逐只串行，单只最坏耗时 = 东财 10s + 腾讯 4s
// （Tushare 兜底仅在已配置 token 且前两源都不可用时才触发）。
// 超预算后立即返回已处理部分，未处理的代码标记 skipped，由前端补成新批次。
// 必须有这个上限：没有它，一次拉取可能跑十几分钟，前端超时重发会让同一批数据
// 被并发重复执行，正是本路由要规避的"失控并发压测行情源"。
const BATCH_BUDGET_MS = 150000

/** 同一时刻只允许一个批次在跑：并发重复批次会加倍打到行情源，直接拒绝而不是排队执行。 */
let batchInFlight = false

/** 'YYYY-MM-DD' | 'YYYYMMDD' -> 'YYYYMMDD'（行情源用紧凑格式） */
function compactDate(v) {
  const s = String(v || '').replace(/\D/g, '')
  return s.length === 8 ? s : ''
}

/** 计算两个日期相差天数（YYYYMMDD） */
function daysBetween(fromCompact, toCompact) {
  const a = new Date(
    Number(fromCompact.slice(0, 4)),
    Number(fromCompact.slice(4, 6)) - 1,
    Number(fromCompact.slice(6, 8))
  )
  const b = new Date(
    Number(toCompact.slice(0, 4)),
    Number(toCompact.slice(4, 6)) - 1,
    Number(toCompact.slice(6, 8))
  )
  return Math.round((b - a) / 86400000)
}

/** 归一化股票代码：去空白、转大写、仅保留数字与字母 */
function normCode(c) {
  return String(c || '').trim().toUpperCase().replace(/[^0-9A-Z]/g, '')
}

/** 取 code -> name 映射。
 *  旧实现读 cache('aktools:stock:spot')，但 C5 删了该 key 的写入者，永远 miss。
 *  改读 sql.js stock_basic：不依赖 DolphinDB / 行情源，更稳定。 */
async function nameMap() {
  const m = {}
  try {
    const rows = getDb().prepare('SELECT code, name FROM stock_basic').all()
    for (const r of rows) m[r.code] = r.name
  } catch (_) { /* stock_basic 表未就绪时返回空 map */ }
  return m
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/** 把本次未处理的剩余代码补进 results（status: 'skipped'），并返回是否发生了截断。 */
function pushSkipped(results, names, restCodes) {
  if (!restCodes.length) return false
  for (const code of restCodes) {
    results.push({
      code, name: names[code] || '', status: 'skipped', rows: 0,
      message: `已达单批时间预算(${BATCH_BUDGET_MS / 1000}s)，本批未处理`
    })
  }
  return true
}

// ---- 存储状态 ----

/**
 * GET /api/data-pull/status
 * 返回 DolphinDB 连接状态与 daily_k 表覆盖概况。
 */
router.get('/status', async (req, res) => {
  try {
    const connected = ddb.isConnected()
    const out = { connected, database: 'dfs://tradeinsight', table: 'daily_k', totalSymbols: 0, totalRows: 0, latestDate: null }
    if (connected) {
      try {
        const r = await ddb.execute(
          `select count(*) as totalRows, max(trade_date) as latestDate` +
          ` from loadTable("dfs://tradeinsight", "daily_k")`
        )
        if (Array.isArray(r) && r.length) {
          out.totalRows = Number(r[0].totalRows) || 0
          out.latestDate = r[0].latestDate ? String(r[0].latestDate).replace(/\./g, '-') : null
        }
      } catch (e) {
        out.queryError = e.message
      }
      // 去重股票数：DolphinDB 不支持 count(distinct)，用 group by 的分组数替代
      try {
        const g = await ddb.execute(
          `select count(*) as c from loadTable("dfs://tradeinsight", "daily_k") group by symbol`
        )
        out.totalSymbols = Array.isArray(g) ? g.length : 0
      } catch (e) {
        if (!out.queryError) out.queryError = e.message
      }
    } else {
      out.hint = '未连接 DolphinDB，无法写入。请确认本机已启动 DolphinDB 服务（默认 ws://127.0.0.1:8848）'
    }
    ok(res, out)
  } catch (e) { errMsg(res, e.message) }
})

/**
 * POST /api/data-pull/connect  手动触发连接（绕过失败冷却）。
 */
router.post('/connect', async (req, res) => {
  try {
    await ddb.connect({ force: true })
    ok(res, { connected: ddb.isConnected() })
  } catch (e) {
    errMsg(res, '连接 DolphinDB 失败: ' + e.message)
  }
})

/**
 * GET /api/data-pull/coverage?codes=600519,000001&startDate=&endDate=
 * 查询指定股票在库中的已有数据量与最新日期（用于拉取前评估缺口）。
 */
router.get('/coverage', async (req, res) => {
  try {
    const codes = String(req.query.codes || '').split(',').map(normCode).filter(Boolean).slice(0, MAX_BATCH)
    if (!codes.length) return ok(res, [])
    if (!ddb.isConnected()) return ok(res, codes.map(code => ({ code, rows: 0, latest: null, connected: false })))
    const out = []
    for (const code of codes) {
      let rows = 0, latest = null
      try {
        rows = await klineRepo.getDailyKCount(code)
        latest = await klineRepo.getDailyKLatest(code)
      } catch (_) { /* 单只失败不影响其他 */ }
      out.push({ code, rows, latest, connected: true })
    }
    ok(res, out)
  } catch (e) { errMsg(res, e.message) }
})

/**
 * POST /api/data-pull/batch
 * body: { codes: string[], startDate, endDate, intervalMs? }
 * 返回: { truncated, results: [{code,name,status,rows,latest,message}], summary }
 *   status: 'ok' 写入成功 / 'empty' 无数据（可能停牌或代码无效）/ 'error' 失败
 *           / 'skipped' 撞上单批时间预算未处理（truncated=true，前端应补批而非判失败）
 *
 * 时长契约：批内串行 + 每只最坏 ~14s，批请求天然是"长请求"。前端必须用
 * > BATCH_BUDGET_MS 的超时且禁用重试，否则超时会触发重发，把一次拉取变成并发压源。
 */
router.post('/batch', async (req, res) => {
  if (batchInFlight) return errMsg(res, '已有拉取批次在执行中，请等待当前批次完成后再试')
  batchInFlight = true
  try {
    const b = req.body || {}
    const rawCodes = Array.isArray(b.codes) ? b.codes : []
    const codes = [...new Set(rawCodes.map(normCode).filter(Boolean))].slice(0, MAX_BATCH)
    const startDate = compactDate(b.startDate)
    const endDate = compactDate(b.endDate)

    if (!codes.length) return errMsg(res, 'codes 不能为空')
    if (!startDate || !endDate) return errMsg(res, 'startDate / endDate 格式应为 YYYY-MM-DD 或 YYYYMMDD')
    if (startDate > endDate) return errMsg(res, 'startDate 不能晚于 endDate')
    const span = daysBetween(startDate, endDate)
    if (span > MAX_RANGE_DAYS) return errMsg(res, `日期跨度 ${span} 天超出上限 ${MAX_RANGE_DAYS} 天`)

    const connected = ddb.isConnected()
    const names = await nameMap()
    const deadline = Date.now() + BATCH_BUDGET_MS

    if (!connected) {
      // 未连库时允许只做网络拉取（不入库），便于用户先探测哪些代码有数据
      const warn = 'DolphinDB 未连接，本次仅拉取不写入'
      const results = []
      for (let i = 0; i < codes.length; i++) {
        if (Date.now() > deadline) {
          pushSkipped(results, names, codes.slice(i))
          break
        }
        const code = codes[i]
        try {
          const rows = await aktools.getStockHistory({
            symbol: code, period: 'daily', start_date: startDate, end_date: endDate, adjust: 'qfq'
          })
          const n = rows && rows.length ? rows.length : 0
          results.push({
            code, name: names[code] || '',
            status: n > 0 ? 'ok' : 'empty',
            rows: 0, fetched: n,
            message: n > 0 ? `${warn}（拉到 ${n} 行）` : '无数据（代码无效或区间内停牌）'
          })
        } catch (e) {
          results.push({ code, name: names[code] || '', status: 'error', rows: 0, fetched: 0, message: e.message })
        }
      }
      const okCount = results.filter(r => r.status === 'ok').length
      const emptyCount = results.filter(r => r.status === 'empty').length
      const errCount = results.filter(r => r.status === 'error').length
      return ok(res, {
        connected: false,
        warning: warn,
        truncated: results.some(r => r.status === 'skipped'),
        range: { startDate, endDate },
        results,
        summary: {
          total: codes.length, ok: okCount, empty: emptyCount, error: errCount, rows: 0
        }
      })
    }

    const intervalMs = Math.min(Math.max(Number(b.intervalMs) || 0, 0), 3000)
    const results = []
    let truncated = false

    for (let i = 0; i < codes.length; i++) {
      if (Date.now() > deadline) {
        truncated = pushSkipped(results, names, codes.slice(i))
        break
      }
      const code = codes[i]
      try {
        const raw = await aktools.getStockHistory({
          symbol: code, period: 'daily', start_date: startDate, end_date: endDate, adjust: 'qfq'
        })
        if (!raw || !raw.length) {
          results.push({ code, name: names[code] || '', status: 'empty', rows: 0, message: '无数据（代码无效或区间内停牌）' })
        } else {
          const written = await klineRepo.insertDailyK(raw)
          const latest = await klineRepo.getDailyKLatest(code)
          // insertDailyK 在未连库时静默返回 0（避免无谓连接尝试），要区分"写失败"和"连接掉了"
          const lostDdb = written === 0 && !ddb.isConnected()
          results.push({
            code, name: names[code] || '',
            status: written > 0 ? 'ok' : 'error',
            rows: written,
            fetched: raw.length,
            latest,
            message: written > 0 ? `写入 ${written} 行`
              : lostDdb ? 'DolphinDB 连接已断开，本次未写入（请「连接/重连」后重试）'
                : '写入失败（返回 0 行）'
          })
        }
      } catch (e) {
        results.push({ code, name: names[code] || '', status: 'error', rows: 0, message: e.message })
      }
      // 批次内逐只限速，最后一只后不再等待
      if (intervalMs > 0 && i < codes.length - 1) await sleep(intervalMs)
    }

    const okCount = results.filter(r => r.status === 'ok').length
    const emptyCount = results.filter(r => r.status === 'empty').length
    const errCount = results.filter(r => r.status === 'error').length
    const totalRows = results.reduce((s, r) => s + (r.rows || 0), 0)

    ok(res, {
      connected: true,
      truncated,
      range: { startDate, endDate },
      results,
      summary: { total: codes.length, ok: okCount, empty: emptyCount, error: errCount, rows: totalRows }
    })
  } catch (e) {
    errMsg(res, e.message)
  } finally {
    batchInFlight = false
  }
})

module.exports = router