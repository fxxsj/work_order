/**
 * 日期格式化工具函数
 * 提供统一的日期格式化方法，避免在多个组件中重复实现
 */

/**
 * 格式化日期为 YYYY-MM-DD 格式
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string} 格式化后的日期字符串，如 "2026-01-23"
 */
export function formatDate(date) {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss 格式
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string} 格式化后的日期时间字符串，如 "2026-01-23 14:30:00"
 */
export function formatDateTime(date) {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm 格式（无秒）
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string} 格式化后的日期时间字符串，如 "2026-01-23 14:30"
 */
export function formatDateTimeShort(date) {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 获取相对时间描述
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string} 相对时间描述，如 "3天后"、"已逾期2天"
 */
export function getRelativeTime(date) {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return `已逾期${Math.abs(diffDays)}天`
  } else if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '明天'
  } else if (diffDays <= 7) {
    return `${diffDays}天后`
  } else {
    return formatDate(date)
  }
}

/**
 * 判断日期是否已过期
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {boolean} 是否已过期
 */
export function isOverdue(date) {
  if (!date) return false

  const d = new Date(date)
  if (isNaN(d.getTime())) return false

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)

  return d < now
}

/**
 * 判断日期是否即将到期（3天内）
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @param {number} days - 天数阈值，默认3天
 * @returns {boolean} 是否即将到期
 */
export function isApproaching(date, days = 3) {
  if (!date) return false

  const d = new Date(date)
  if (isNaN(d.getTime())) return false

  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return diffDays >= 0 && diffDays <= days
}

export default {
  formatDate,
  formatDateTime,
  formatDateTimeShort,
  getRelativeTime,
  isOverdue,
  isApproaching
}
