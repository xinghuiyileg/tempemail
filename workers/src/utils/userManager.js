/**
 * 用户管理工具
 * 提供用户ID获取和管理功能
 */

/**
 * 从请求中获取用户ID
 * @param {Request} request - 请求对象
 * @returns {string} - 用户ID
 */
export function getUserId(request) {
  // 从请求头获取用户ID
  const userId = request.headers.get('X-User-ID')
  
  if (!userId) {
    console.warn('No user ID found in request headers')
    return 'anonymous'
  }
  
  return userId
}

/**
 * 验证用户ID格式
 * @param {string} userId - 用户ID
 * @returns {boolean} - 是否有效
 */
export function isValidUserId(userId) {
  if (!userId || userId === 'anonymous') {
    return false
  }
  
  // 用户ID应该是字母数字组合，长度在6-32之间
  return /^[a-zA-Z0-9_-]{6,32}$/.test(userId)
}

/**
 * 生成随机用户ID
 * @returns {string} - 新的用户ID
 */
export function generateUserId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `user_${timestamp}${random}`
}


