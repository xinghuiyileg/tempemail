/**
 * 用户管理工具
 * 负责生成和管理用户唯一标识，实现用户隔离
 */

const USER_ID_KEY = 'tempemail_user_id'

/**
 * 生成 UUID v4
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 获取或创建用户 ID
 * 如果本地没有，自动生成一个新的
 */
export function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY)
  
  if (!userId) {
    userId = generateUUID()
    localStorage.setItem(USER_ID_KEY, userId)
    console.log('🆔 New user ID created:', userId)
  }
  
  return userId
}

/**
 * 设置用户 ID（用于导入）
 */
export function setUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID')
  }
  localStorage.setItem(USER_ID_KEY, userId)
  console.log('🆔 User ID updated:', userId)
}

/**
 * 清除用户 ID（用于重置）
 */
export function clearUserId() {
  localStorage.removeItem(USER_ID_KEY)
  console.log('🗑️ User ID cleared')
}

/**
 * 导出用户数据（用于跨设备访问）
 */
export function exportUserData() {
  return {
    userId: getUserId(),
    exportTime: new Date().toISOString(),
    version: '1.0'
  }
}

/**
 * 导入用户数据
 */
export function importUserData(data) {
  if (!data || !data.userId) {
    throw new Error('Invalid user data: missing userId')
  }
  
  if (data.version !== '1.0') {
    throw new Error('Unsupported data version')
  }
  
  setUserId(data.userId)
  return true
}

/**
 * 获取脱敏的用户 ID（用于显示）
 */
export function getMaskedUserId() {
  const id = getUserId()
  if (id.length <= 8) return id
  return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`
}

