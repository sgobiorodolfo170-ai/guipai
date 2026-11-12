'use strict'

/**
 * 持仓与交易时间线的领域逻辑（纯函数，无 DB / 无 HTTP 依赖）。
 *
 * 为什么要单独抽出来：
 *   1) 原实现写在 routes/cockpit.js 里，函数体直接 `db.prepare(...).all()`，
 *      导致"盈亏公式是否正确"这件事只能靠连库手测——而这恰恰是历史上出过错的地方
 *      （v1.26.1：卖出成本重复乘卖出比例，示例 000001 已实现盈亏虚增 17589.6 → 应为 516）。
 *      抽出纯函数后，公式可以被 node:test 直接断言，不必起服务、不必造库。
 *   2) 路由层只保留"读库 → 调这里 → 写回库"的编排，符合 AGENTS.md「取数→计算→组装」三层。
 *
 * 口径约定（与前端/接口保持一致，改动前先读这里）：
 *   - 买入：avgCost 按加权平均，含手续费（cost = price*qty + fee）
 *   - 卖出：已实现盈亏 = 卖出净额 − 均价 × 实际卖出股数（不是 × 卖出比例，原 bug 在此）
 *   - 全部卖出后 avgCost 归零，避免负数量/幽灵成本残留
 *   - 卖出数量超过持仓时按实际持仓结转已实现，不产生负持仓（超卖本身由 validateTimeline 拦）
 */

/**
 * 金额规整到分。
 *
 * 为什么必须做：`10.005 * 400 = 4002.0000000000005` 这类浮点误差会让
 * `已实现盈亏` 显示成 1515.9999999999995 而不是 1516。金额是给人看的、也要写回库，
 * 带浮点尾数会一路污染汇总（SUM 之后误差累积），还会让"两个页面的数字对不上"变成常态。
 * 统一在回放出口按 2 位小数收敛，与前端展示口径一致。
 */
function roundMoney(v) {
  if (!Number.isFinite(v)) return 0
  return Math.round((v + Number.EPSILON) * 100) / 100
}

/** 均价保留 4 位：成本单价需要更高精度，否则 10.005 会被截成 10.01 造成后续结转偏差。 */
function roundAvgCost(v) {
  if (!Number.isFinite(v)) return 0
  return Math.round((v + Number.EPSILON) * 10000) / 10000
}

/**
 * 回放交易流水，得出某只股票的持仓状态。
 * @param {Array<{direction:string, trade_price:number, quantity:number, fee:number}>} trades
 *        必须已按 trade_date, id 升序（与 DB 的 ORDER BY 口径一致）
 * @returns {{quantity:number, avgCost:number, totalInvested:number, totalProceeds:number, realizedPnl:number}}
 */
function replayPosition(trades) {
  let qty = 0
  let invested = 0
  let proceeds = 0
  let realized = 0
  let avgCost = 0

  for (const r of trades) {
    const price = Number(r.trade_price) || 0
    const q = Number(r.quantity) || 0
    const fee = Number(r.fee) || 0

    if (r.direction === 'buy') {
      const cost = price * q + fee
      invested += cost
      const newQty = qty + q
      avgCost = newQty > 0 ? ((qty * avgCost) + cost) / newQty : 0
      qty = newQty
    } else {
      // sell：按实际卖出数量结转成本（已实现 = 卖出净额 − 均价 × 卖出股数）
      proceeds += price * q - fee
      if (qty > 0) {
        const soldQty = Math.min(q, qty)
        realized += (price * soldQty - fee) - (avgCost * soldQty)
        qty -= soldQty
        if (qty === 0) avgCost = 0
      }
    }
  }

  return {
    quantity: qty,
    avgCost: roundAvgCost(avgCost),
    totalInvested: roundMoney(invested),
    totalProceeds: roundMoney(proceeds),
    realizedPnl: roundMoney(realized)
  }
}

/**
 * 交易时间线校验：任意时点持仓不得为负。
 *
 * 背景：允许编辑/删除历史交易，但删掉一笔买入后，其后所有卖出都可能变成「凭空卖出」。
 * 这里按 trade_date + id 全时间线回放（不是只看这笔交易本身），能同时兜住
 * "新增/编辑一笔卖出" 和 "删除一笔买入" 两类操作。
 *
 * @param {Array<{id:number, direction:string, quantity:number, tradeDate:string}>} events 现有全部事件
 * @param {{direction:string, quantity:number, tradeDate:string}|null} candidate 待插入/编辑的事件
 * @param {number|null} excludeTradeId 需从时间线排除的事件 id（删除/编辑时排除原记录）
 * @returns {{ok:boolean, error?:string, at?:string}}
 */
function validateTimelineEvents(events, candidate = null, excludeTradeId = null) {
  const list = events
    .filter(e => excludeTradeId == null || Number(e.id) !== Number(excludeTradeId))
    .map(e => ({
      id: Number(e.id),
      direction: e.direction,
      quantity: Number(e.quantity) || 0,
      tradeDate: String(e.tradeDate)
    }))

  if (candidate) {
    const maxId = list.reduce((m, e) => Math.max(m, e.id || 0), 0)
    list.push({
      // 编辑场景复用原 id（保持同日排序位置），新增场景取 maxId+1
      id: excludeTradeId != null ? Number(excludeTradeId) : maxId + 1,
      direction: candidate.direction,
      quantity: Number(candidate.quantity) || 0,
      tradeDate: String(candidate.tradeDate)
    })
  }

  list.sort((a, b) => (a.tradeDate === b.tradeDate ? a.id - b.id : (a.tradeDate < b.tradeDate ? -1 : 1)))

  let qty = 0
  for (const e of list) {
    if (e.direction === 'buy') {
      qty += e.quantity
    } else {
      qty -= e.quantity
      if (qty < 0) {
        return {
          ok: false,
          at: e.tradeDate,
          error: `${e.tradeDate} 卖出 ${e.quantity} 股将导致持仓为负（可用 ${qty + e.quantity} 股）`
        }
      }
    }
  }
  return { ok: true }
}

/**
 * 风控告警分级。阈值由设置页提供，这里只做纯判定。
 * @param {object} m 指标值 {positionPct, maxSinglePct, heavyCount, industryPct, stopLossCount,
 *                          takeProfitCount, singleFloatLoss, drawdown}
 * @param {object} t 阈值 {positionPct, singlePct, heavyCount, industryPct, stopLoss, takeProfit,
 *                          singleLossAmount, drawdown}
 * @returns {Array<{key:string, level:'red'|'yellow'|'blue', value:number, threshold:number}>}
 */
function evaluateRisk(m, t) {
  const out = []
  const push = (key, level, value, threshold) => out.push({ key, level, value, threshold })

  if (m.positionPct > t.positionPct) push('position', 'red', m.positionPct, t.positionPct)
  if (m.maxSinglePct > t.singlePct) push('single', 'red', m.maxSinglePct, t.singlePct)
  if (m.heavyCount > t.heavyCount) push('heavy', 'yellow', m.heavyCount, t.heavyCount)
  if (m.industryPct > t.industryPct) push('industry', 'yellow', m.industryPct, t.industryPct)
  if (m.stopLossCount > 0) push('stopLoss', 'red', m.stopLossCount, t.stopLoss)
  if (m.takeProfitCount > 0) push('takeProfit', 'blue', m.takeProfitCount, t.takeProfit)
  if (m.singleFloatLoss != null && m.singleFloatLoss < -Math.abs(t.singleLossAmount)) {
    push('singleLoss', 'yellow', m.singleFloatLoss, t.singleLossAmount)
  }
  if (m.drawdown != null && m.drawdown > t.drawdown) push('drawdown', 'yellow', m.drawdown, t.drawdown)
  return out
}

module.exports = { replayPosition, validateTimelineEvents, evaluateRisk }
