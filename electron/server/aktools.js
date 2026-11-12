'use strict'

/**
 * 行情数据访问层（统一出口）。
 *
 * 定位：本文件只剩两类内容——
 *   1) 数据源注册：把腾讯 / 通达信三路（tdx_local、tdx_quant、tdx_server）注册进 sources/registry；
 *   2) 对外薄封装：把 registry.dispatch 与涨跌停池、行业板块适配成路由层消费的函数名。
 *
 * 历史清理（2026-11-12，P1-1）：此前本文件内联着东财（push2/push2his/push2ex/datacenter-web）、
 * 新浪、同花顺的完整实现（约 817 行）作为"main 源兜底"。这些实现自 2026-10 数据源收敛后
 * 已无任何调用方——registry.PRIORITY 只含 tencent / tdx_* 四源，SPOT_BY_CODE_SOURCES 同理。
 * 保留它们等于把已弃用的数据源常驻在代码里，违反 AGENTS.md 数据源红线
 *（"代码审查发现新增东财/新浪引用或隐式回退路径即视为违反红线"）——
 * 下一个会话看到 17 处东财 URL 极可能直接复用。故整体删除，需要时从 git 历史取回。
 *
 * 数据源优先级（唯一权威定义在 sources/registry.js 的 PRIORITY 表）：
 *   日K      tdx_server → tdx_quant → tdx_local → tencent
 *   全市场spot tencent → tdx_server → tdx_quant
 *   spot(按码) tdx_quant → tencent → tdx_server
 *   指数日K   tdx_server → tdx_local → tencent
 *   指数spot  tencent → tdx_server
 *   分时      tdx_server → tencent
 *   涨跌停池  tdx_server → tdx_quant（另经 sources/tdx_pool 取数）
 *   行业      tdx_server
 */

const registry = require('./sources/registry')

// ---- 多源注册 ----
// 腾讯独立源（qt.gtimg.cn 批量行情 + fqkline/mkline/分时兜底）。
// 全市场 spot 首选：800 只/请求、6 并发，~1s 取回 5580 只且含完整 OHLC；
// 指数 spot 首选：单请求 88 字段（含高/低/开/昨收）；分钟/日K 仅作 tqs 之后的应急兜底。
registry.registerSource(require('./sources/tencent'))
// 通达信本地数据源（Path A：纯 Node 读 .day 文件，离线兜底）。
// 直接读通达信安装目录 vipdoc\<sh|sz|bj>\lday\*.day，标准 32 字节格式，零网络零 Python。
registry.registerSource(require('./sources/tdx_local'))
// 通达信量化 HTTP 源（Path B：tqcenter 模式，17709）。
// 经运行中已登录 TdxW 取数，实时+全市场+K线/财报/涨跌停/板块。
registry.registerSource(require('./sources/tdx_quant'))
// 通达信 tqs 源（tqserver/tdxaidata，免客户端，Key 鉴权直连后端）。
// 经 Python 桥 /tdxs_* 端点调用 tdxaidata.tqs。无需 TdxW 运行。
registry.registerSource(require('./sources/tdx_server'))

/** 单股/少量代码 spot 的源顺序：本地 tdx_quant 最快（~20ms），其次腾讯批量，tqs 补北交所/新代码。 */
const SPOT_BY_CODE_SOURCES = ['tdx_quant', 'tencent', 'tdx_server']

// 涨跌停池 / 行业板块改用通达信 + 腾讯（不再走东财/AKShare）
const tdxPool = require('./sources/tdx_pool')
const tdxSector = require('./sources/tdx_sector')

/**
 * 启动预热：只打「主源」的连接与边缘缓存。
 *
 * 设计理由：这些上游的"首次请求"要 3~8s（DNS+TLS+边缘节点冷启动），若不预热，
 * 用户打开页面第一个请求就要等这么久。预热把这段成本挪到启动后台，且全部 best-effort——
 * 任一项失败都不影响服务启动（真正的取数会在首个请求时自行重试）。
 *
 * 关键约束：预热必须与生产请求"同 URL 同参数"。腾讯按完整 URL 做边缘缓存，
 * 参数不同的预热对生产请求无效（例如 mkline 的 count=50 预热对 count=2000 完全没用）。
 */
async function warmupUpstream() {
  const SLOW = { retries: 0, timeout: 20000 } // 预热专用：宁可等 20s 也要把连接打通
  const SLOW_GBK = Object.assign({ encoding: 'gbk' }, SLOW)
  const TX_H = { headers: { Referer: 'https://gu.qq.com/' } }
  const RANK_H = { headers: { Referer: 'https://stockapp.finance.qq.com/' } }

  const getJson = require('./sources/tencent').__internals.getJson
  const getText = require('./sources/tencent').__internals.getText

  const tasks = [
    // 1) 腾讯 fqkline（日K 前复权，count 取下限 200 —— count 过小会命中腾讯慢路径）
    () => getJson('https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh600519,day,,,200,qfq', Object.assign({}, TX_H, SLOW)),
    // 2) 腾讯全市场榜单（proxy.finance.qq.com）：打第一页即可建立连接
    () => getJson('https://proxy.finance.qq.com/cgi/cgi-bin/rank/hs/getBoardRankList?_appver=11.17.0&board_code=aStock&sort_type=price&direct=down&offset=0&count=10', Object.assign({}, RANK_H, SLOW)),
    // 3) 腾讯分时 day/query（p1 分时兜底路径，实测首请求 ~7.7s）
    () => getJson('https://web.ifzq.gtimg.cn/appstock/app/day/query?code=sh600519', Object.assign({}, TX_H, SLOW)),
    // 4) 腾讯分钟 mkline（p5/p15/p30/p60 兜底路径）
    //    count 必须与生产请求一致（,,2000）：腾讯按 URL 参数做边缘缓存，
    //    不同 count 是不同缓存键，用 ,,50 预热对 ,,2000 无效（实测冷 7.7s）。
    () => getJson('https://ifzq.gtimg.cn/appstock/app/kline/mkline?param=sh600519,m5,,2000', Object.assign({}, TX_H, SLOW)),
    // 5) 腾讯实时行情 qt.gtimg.cn（指数/个股批量快照共用通道，GBK）：
    //    完整指数代码与个股混打，既建立连接也验证 88 字段解析路径；
    //    全市场批量(7×800)留到首个请求/primeCache 触发，避免启动即占满带宽。
    () => getText('https://qt.gtimg.cn/q=s_sh000001,s_sz399001,sh000001,sh600519,sz000001', Object.assign({ encoding: 'gbk' }, SLOW))
  ]

  // 慢或失败再补打一次：冷启动只影响第一次请求，第二发基本必然命中热路径
  const runWithRetry = async (t) => {
    const s = Date.now()
    try {
      await t()
      if (Date.now() - s > 1500) await t() // 首打就慢 → 说明命中冷启动，补打一次
    } catch (e) {
      try { await t() } catch (e2) { /* 预热失败无副作用 */ }
    }
  }
  await Promise.all(tasks.map(runWithRetry))
}

module.exports = {
  getStockSpot: (codes, opts = {}) => {
    const hasCodes = codes != null && codes !== '' && (!Array.isArray(codes) || codes.length > 0)
    return registry.dispatch('spot', codes, { ...(hasCodes ? { sources: SPOT_BY_CODE_SOURCES } : {}), ...opts })
  },
  getStockHistory: (p) => registry.dispatch('kline', p),
  getStockMinute: (p) => registry.dispatch('minute', p),
  getStockInfo: (s) => registry.dispatch('info', s),
  // 十大股东（原东财 datacenter-web）已下线：返回空，路由端只读本地 DDB
  getStockHolding: () => Promise.resolve([]),
  getStockLimitPool: (d) => tdxPool.fetch(d, 'LIMIT_UP'),
  getStockDropPool: (d) => tdxPool.fetch(d, 'LIMIT_DOWN'),
  getStockIndustry: () => tdxSector.fetchPlate(),
  getZtPoolPrevious: (d) => registry.dispatch('ztPrev', d),
  getStockIndexSpot: (s) => registry.dispatch('indexSpot', s),
  getIndexDailyData: (p) => registry.dispatch('indexDaily', p),
  warmupUpstream,
  // 暴露调度器供数据总览页查询各源健康度
  getSourceHealth: registry.getHealthStatus
}
