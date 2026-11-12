'use strict'

/**
 * DolphinDB 查询参数净化。
 *
 * 背景：DolphinDB 脚本是字符串拼接执行的（无参数绑定），所有用户可控的
 * symbol/date 都必须先过这里，否则 URL 里的 query 就能注入任意脚本片段。
 *
 * 规则（宁可返回 null 让上层判 miss，也不要放行可疑值）：
 *   - 股票/指数代码：仅 6 位数字，或 6 位数字 + .SH/.SZ/.BJ 后缀
 *   - 日期：仅 YYYY-MM-DD 或 YYYY.MM.DD（或紧凑 YYYYMMDD）
 *   - 其余数值：仅允许数字/小数点/负号
 */

/** 合法 A 股/指数代码：6 位数字，可带 .SH/.SZ/.BJ/.CSI 后缀。返回净化后的值或 null。 */
function safeSymbol(v) {
  if (v == null) return null
  const s = String(v).trim()
  return /^\d{6}(\.(SH|SZ|BJ|CSI|SS))?$/i.test(s) ? s.toUpperCase() : null
}

/** 合法日期：YYYY-MM-DD / YYYY.MM.DD / YYYYMMDD，统一转成 DolphinDB 需要的 YYYY.MM.DD。
 *
 *  除了格式，还校验月/日范围——原实现只匹配数字形状，`20261301`（13 月）、
 *  `20260230`（2 月 30 日）会原样透传进 DDB 脚本。这类值不会造成注入（正则已限制字符集），
 *  但会让查询静默返回空、排查时误判成"数据缺失"。越界一律返回 null，与调用方的空值处理一致。 */
function safeDate(v) {
  if (v == null) return null
  const s = String(v).trim()
  let m = /^(\d{4})[-.](\d{2})[-.](\d{2})$/.exec(s)
  if (!m) m = /^(\d{4})(\d{2})(\d{2})$/.exec(s)
  if (!m) return null
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3])
  if (mo < 1 || mo > 12 || d < 1) return null
  // 当月天数（用 UTC 避免本地时区把月末挪到前一天）
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  if (d > daysInMonth) return null
  return `${m[1]}.${m[2]}.${m[3]}`
}

/** 有限数值，非数字返回 fallback。 */
function safeNum(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

module.exports = { safeSymbol, safeDate, safeNum }