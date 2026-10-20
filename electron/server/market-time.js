'use strict'

/**
 * A 股交易时段判断（近似，无节假日历）。
 *
 * 用途：路由层按「盘中/盘后」切换取数策略与缓存 TTL。
 *  - 盘中（含 09:15 集合竞价）：网络优先，短 TTL（spot 5s / 分钟 15s）；
 *  - 盘后/周末：DB 优先，长 TTL（spot 60s / 分钟 300s），避免无意义联网。
 *
 * 精度说明：无节假日历，节假日按工作日处理 —— 误差仅表现为节假日当天多打一次
 * 网络请求（网络优先立即失败自动回落 DB），不影响数据正确性。
 */

/** 工作日（周一~周五；不含节假日历） */
function isTradingDay(now = new Date()) {
  const d = now.getDay()
  return d >= 1 && d <= 5
}

/** 交易时段：09:15-11:30 / 13:00-15:00（09:15 起集合竞价，快照已有成交） */
function isTradingTime(now = new Date()) {
  if (!isTradingDay(now)) return false
  const m = now.getHours() * 60 + now.getMinutes()
  return (m >= 9 * 60 + 15 && m <= 11 * 60 + 30) || (m >= 13 * 60 && m <= 15 * 60)
}

/** 快照类缓存 TTL（秒）：盘中 5s（腾讯批量 ~1s，留出请求间隔），盘后 60s */
function spotTtl() {
  return isTradingTime() ? 5 : 60
}

/** 分钟K缓存 TTL（秒）：盘中 15s，盘后 300s */
function minuteTtl() {
  return isTradingTime() ? 15 : 300
}

module.exports = { isTradingDay, isTradingTime, spotTtl, minuteTtl }
