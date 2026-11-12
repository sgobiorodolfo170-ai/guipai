'use strict'

/**
 * 轻量日志分级（P2-5）。
 *
 * 背景：后端有 118 处 console.log，混着三类完全不同的东西——
 *   1) 真正需要长期保留的：服务启动、数据源熔断、任务失败；
 *   2) 排障时才看的：每次取数命中哪个源、缓存是否命中；
 *   3) 临调试残留：中间变量、逐步进度。
 * 全量替换 118 个调用点的风险远大于收益（改错一处就可能掩盖真实错误），
 * 因此这里只做一件事：**按级别过滤，生产态默认只放 info 及以上**。
 *
 * 用法（新代码）：const log = require('./logger')('模块名'); log.debug(...) / log.warn(...)
 * 存量代码保持 console.log 不动——它们在开发态照常输出，不会因为引入本模块而丢失信息。
 *
 * 级别：debug < info < warn < error。由环境变量 LOG_LEVEL 覆盖，默认：
 *   开发态 debug（全开），打包态 info（屏蔽 debug 噪音）。
 * 生产态禁用方式：LOG_LEVEL=warn 只留告警与错误。
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 }

function resolveLevel() {
  const env = String(process.env.LOG_LEVEL || '').toLowerCase()
  if (env && LEVELS[env]) return env
  // NODE_ENV=production 由主进程 / `npm start` 设置；打包后默认也是它
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

let currentLevel = resolveLevel()

function shouldLog(level) {
  return LEVELS[level] >= LEVELS[currentLevel]
}

/** 统一前缀：`[模块名]`，便于在长日志里 grep 出某个子系统的全部输出。 */
function format(scope, args) {
  return [`[${scope}]`, ...args]
}

function createLogger(scope = 'app') {
  return {
    debug: (...a) => { if (shouldLog('debug')) console.log(...format(scope, a)) },
    info: (...a) => { if (shouldLog('info')) console.log(...format(scope, a)) },
    warn: (...a) => { if (shouldLog('warn')) console.warn(...format(scope, a)) },
    error: (...a) => { if (shouldLog('error')) console.error(...format(scope, a)) }
  }
}

/** 运行期改级别（设置页/排障时用），返回生效值。 */
function setLevel(level) {
  const l = String(level || '').toLowerCase()
  if (LEVELS[l]) currentLevel = l
  return currentLevel
}

function getLevel() { return currentLevel }

module.exports = createLogger
module.exports.createLogger = createLogger
module.exports.setLevel = setLevel
module.exports.getLevel = getLevel
