import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// 配置dayjs
dayjs.locale('zh-cn')
dayjs.extend(relativeTime)
dayjs.extend(customParseFormat)

/**
 * 格式化日期
 * @param {string|Date} date 日期
 * @param {string} format 格式
 * @returns {string}
 */
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * 格式化日期时间
 * @param {string|Date} date 日期
 * @returns {string}
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化时间
 * @param {string|Date} date 日期
 * @returns {string}
 */
export const formatTime = (date) => {
  return formatDate(date, 'HH:mm:ss')
}

/**
 * 相对时间
 * @param {string|Date} date 日期
 * @returns {string}
 */
export const fromNow = (date) => {
  if (!date) return ''
  return dayjs(date).fromNow()
}

/**
 * 获取交易日期范围
 * @param {number} days 天数
 * @returns {Array}
 */
export const getTradingDateRange = (days = 30) => {
  const end = dayjs()
  const start = end.subtract(days, 'day')
  
  return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
}

/**
 * 判断是否为交易时间
 * @param {string|Date} date 日期
 * @returns {boolean}
 */
export const isTradingTime = (date = new Date()) => {
  const now = dayjs(date)
  const hour = now.hour()
  const minute = now.minute()
  const day = now.day()
  
  // 周末不交易
  if (day === 0 || day === 6) return false
  
  // 上午交易时间 9:30-11:30
  const morningStart = 9 * 60 + 30
  const morningEnd = 11 * 60 + 30
  
  // 下午交易时间 13:00-15:00
  const afternoonStart = 13 * 60
  const afternoonEnd = 15 * 60
  
  const currentTime = hour * 60 + minute
  
  return (currentTime >= morningStart && currentTime <= morningEnd) ||
         (currentTime >= afternoonStart && currentTime <= afternoonEnd)
}

/**
 * 获取下一个交易日
 * @param {string|Date} date 日期
 * @returns {string}
 */
export const getNextTradingDay = (date = new Date()) => {
  let next = dayjs(date).add(1, 'day')
  
  // 跳过周末
  while (next.day() === 0 || next.day() === 6) {
    next = next.add(1, 'day')
  }
  
  return next.format('YYYY-MM-DD')
}

/**
 * 获取上一个交易日
 * @param {string|Date} date 日期
 * @returns {string}
 */
export const getPrevTradingDay = (date = new Date()) => {
  let prev = dayjs(date).subtract(1, 'day')
  
  // 跳过周末
  while (prev.day() === 0 || prev.day() === 6) {
    prev = prev.subtract(1, 'day')
  }
  
  return prev.format('YYYY-MM-DD')
}