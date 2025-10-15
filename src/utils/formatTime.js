import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.locale('zh-cn')

/**
 * 格式化相对时间
 * @param {string|Date} time 
 * @returns {string}
 */
export function formatRelativeTime(time) {
  if (!time) return '-'
  // 统一按 UTC 解析，再转换到本地时区，避免后端 UTC 文本被当作本地时间导致偏差
  return dayjs.utc(time).local().fromNow()
}

/**
 * 格式化完整时间
 * @param {string|Date} time 
 * @returns {string}
 */
export function formatFullTime(time) {
  if (!time) return '-'
  return dayjs.utc(time).local().format('YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化日期
 * @param {string|Date} time 
 * @returns {string}
 */
export function formatDate(time) {
  if (!time) return '-'
  return dayjs.utc(time).local().format('YYYY-MM-DD')
}

/**
 * 格式化时间
 * @param {string|Date} time 
 * @returns {string}
 */
export function formatTime(time) {
  if (!time) return '-'
  return dayjs.utc(time).local().format('HH:mm:ss')
}

