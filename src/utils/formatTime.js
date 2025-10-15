import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化相对时间
 * @param {string|Date} time 
 * @returns {string}
 */
export function formatRelativeTime(time) {
  if (!time) return '-'
  return dayjs(time).fromNow()
}

/**
 * 格式化完整时间
 * @param {string|Date} time 
 * @returns {string}
 */
export function formatFullTime(time) {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化日期
 * @param {string|Date} time 
 * @returns {string}
 */
export function formatDate(time) {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param {string|Date} time 
 * @returns {string}
 */
export function formatTime(time) {
  if (!time) return '-'
  return dayjs(time).format('HH:mm:ss')
}

