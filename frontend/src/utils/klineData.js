/**
 * KLineCharts 数据转换工具
 * 将后端 K 线数据格式转换为 KLineCharts v10 所需的 KLineData 结构。
 *
 * 后端行格式（routes/stock.js KLINE_ROW_MAP 产出）:
 *   { date:'2024-01-15', open, close, high, low, volume, amount, turnover, pctChg }
 *
 * KLineCharts KLineData 格式:
 *   { timestamp(ms), open, close, high, low, volume?, turnover? }  —— 全为 number
 */

/**
 * 将日期字符串转为毫秒时间戳
 * 支持 "2024-01-15" / "2024/01/15" / Date
 * @param {string|Date} date
 * @returns {number} 毫秒时间戳
 */
export function dateToTimestamp(date) {
  if (typeof date === 'number') return date
  if (date instanceof Date) return date.getTime()
  // 兼容 "2024-01-15" 与 "2024/01/15"
  return new Date(String(date).replace(/-/g, '/')).getTime()
}

/**
 * 单行后端数据 → KLineCharts KLineData
 * @param {Object} row 后端 K 线行
 * @returns {{timestamp:number,open:number,close:number,high:number,low:number,volume?:number,turnover?:number}}
 */
export function toKLineData(row) {
  return {
    timestamp: dateToTimestamp(row.date),
    open: Number(row.open) || 0,
    close: Number(row.close) || 0,
    high: Number(row.high) || 0,
    low: Number(row.low) || 0,
    volume: Number(row.volume) || 0,
    turnover: Number(row.amount ?? row.turnover) || 0
  }
}

/**
 * 批量转换后端 K 线数组 → KLineCharts KLineData[]
 * @param {Object[]} rows 后端行数组
 * @returns {Object[]}
 */
export function toKLineDataList(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map(toKLineData)
}

/**
 * 后端 period 字符串 → KLineCharts Period 对象
 * @param {'daily'|'weekly'|'monthly'} period
 * @returns {{span:number,type:'day'|'week'|'month'}}
 */
export function periodToKLine(period = 'daily') {
  switch (period) {
    case 'weekly':
      return { span: 1, type: 'week' }
    case 'monthly':
      return { span: 1, type: 'month' }
    default:
      return { span: 1, type: 'day' }
  }
}

/**
 * KLineCharts Period 对象 → 后端 period 字符串
 * @param {{span:number,type:string}} klPeriod
 * @returns {'daily'|'weekly'|'monthly'}
 */
export function klPeriodToString(klPeriod) {
  if (!klPeriod) return 'daily'
  if (klPeriod.type === 'week') return 'weekly'
  if (klPeriod.type === 'month') return 'monthly'
  return 'daily'
}

/**
 * 后端 period → 中文显示名
 * @param {string} period
 * @returns {string}
 */
export function periodLabel(period = 'daily') {
  switch (period) {
    case 'weekly': return '周K'
    case 'monthly': return '月K'
    default: return '日K'
  }
}

/**
 * 复权 → 中文显示名
 * @param {string} adjust
 * @returns {string}
 */
export function adjustLabel(adjust = 'qfq') {
  switch (adjust) {
    case 'hfq': return '后复权'
    case '': case 'none': return '不复权'
    default: return '前复权'
  }
}
