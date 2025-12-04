/**
 * 用户管理工具
 * 负责生成和管理用户唯一标识，实现用户隔离
 * 
 * 多重持久化策略：
 * 1. localStorage（主要）
 * 2. sessionStorage（备用）
 * 3. Cookie（兜底）
 * 4. URL参数（导入导出）
 */

const USER_ID_KEY = 'tempemail_user_id'
const COOKIE_NAME = 'tempemail_uid'
const COOKIE_DAYS = 365 // Cookie有效期1年
const LOGIN_METHOD_KEY = 'tempemail_login_method' // 记录登录方式

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
 * 设置Cookie
 */
function setCookie(name, value, days) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

/**
 * 获取Cookie
 */
function getCookie(name) {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

/**
 * 获取当前登录方式
 */
export function getLoginMethod() {
  return localStorage.getItem(LOGIN_METHOD_KEY) || 'password'
}

/**
 * 为OAuth登录获取或创建专用的用户ID
 * @param {string} provider - OAuth提供商（如 'baidu', 'google'）
 */
export function getOAuthUserId(provider) {
  if (!provider) {
    throw new Error('Provider is required for OAuth user ID')
  }
  
  const oauthKey = `${USER_ID_KEY}_oauth_${provider}`
  
  // 1. 优先从 localStorage 读取
  let userId = localStorage.getItem(oauthKey)
  
  if (userId) {
    return userId
  }
  
  // 2. 都没有，生成新的OAuth专用ID
  userId = `oauth_${provider}_${generateUUID()}`
  
  try {
    localStorage.setItem(oauthKey, userId)
    console.log(`🆔 新OAuth用户ID已创建 (${provider}):`, userId)
  } catch (e) {
    console.warn('⚠️ localStorage不可用:', e)
  }
  
  return userId
}

/**
 * 获取或创建用户 ID（多重持久化）
 * 根据当前登录方式返回对应的用户ID
 */
export function getUserId() {
  const loginMethod = getLoginMethod()
  
  // 根据登录方式使用不同的存储键
  if (loginMethod.startsWith('oauth_')) {
    const provider = loginMethod.replace('oauth_', '')
    return getOAuthUserId(provider)
  }
  
  // 账号登录使用独立的存储键
  if (loginMethod === 'account') {
    return getAccountUserId()
  }
  
  // 密码登录使用专用存储键
  const storageKey = `${USER_ID_KEY}_password`
  
  // 1. 优先从新的存储键读取
  let userId = localStorage.getItem(storageKey)
  
  if (userId) {
    return userId
  }
  
  // 2. 尝试从旧的存储键迁移（兼容旧版本）
  userId = localStorage.getItem(USER_ID_KEY)
  if (userId && !userId.startsWith('oauth_')) {
    console.log('🔄 迁移旧用户ID到新存储格式:', userId)
    localStorage.setItem(storageKey, userId)
    // 不删除旧键，保留作为备份
    return userId
  }
  
  // 3. 尝试从 sessionStorage 读取
  userId = sessionStorage.getItem(USER_ID_KEY)
  if (userId && !userId.startsWith('oauth_')) {
    console.log('📦 从 sessionStorage 恢复 user ID')
    localStorage.setItem(storageKey, userId)
    return userId
  }
  
  // 4. 尝试从 Cookie 读取
  userId = getCookie(COOKIE_NAME)
  if (userId && !userId.startsWith('oauth_')) {
    console.log('🍪 从 Cookie 恢复 user ID')
    localStorage.setItem(storageKey, userId)
    return userId
  }
  
  // 5. 都没有，生成新的
  userId = generateUUID()
  localStorage.setItem(storageKey, userId)
  localStorage.setItem(USER_ID_KEY, userId) // 同时保存到旧键作为备份
  console.log('🆔 新密码登录用户 ID 已创建:', userId)
  
  return userId
}

/**
 * 为账号登录获取专用的用户ID（不自动生成，必须由后端返回）
 */
export function getAccountUserId() {
  const accountKey = `${USER_ID_KEY}_account`
  
  // 1. 优先从专用键读取
  let userId = localStorage.getItem(accountKey)
  
  if (userId) {
    return userId
  }
  
  // 2. 尝试从通用键读取（可能是登录后刚设置的）
  userId = localStorage.getItem(USER_ID_KEY)
  if (userId && userId.startsWith('account_')) {
    // 迁移到专用键
    localStorage.setItem(accountKey, userId)
    return userId
  }
  
  // 3. 尝试从 sessionStorage 读取
  userId = sessionStorage.getItem(USER_ID_KEY)
  if (userId && userId.startsWith('account_')) {
    localStorage.setItem(accountKey, userId)
    return userId
  }
  
  // 4. 账号登录的用户ID应该由后端返回，如果都没有，说明没有正确登录
  // 不应该自动生成随机ID，而是返回一个占位符，提示需要重新登录
  console.warn('⚠️ 账号登录用户ID未找到，需要重新登录')
  
  // 返回一个临时ID，避免系统崩溃，但应该触发重新登录
  return 'account_temporary_please_login'
}

/**
 * 同步用户ID到所有存储
 */
function syncUserId(userId) {
  const loginMethod = getLoginMethod()
  
  // 根据登录方式确定正确的存储键
  let storageKey = USER_ID_KEY
  if (loginMethod === 'password') {
    storageKey = `${USER_ID_KEY}_password`
  } else if (loginMethod === 'account') {
    storageKey = `${USER_ID_KEY}_account`
  } else if (loginMethod.startsWith('oauth_')) {
    const provider = loginMethod.replace('oauth_', '')
    storageKey = `${USER_ID_KEY}_oauth_${provider}`
  }
  
  try {
    // 存储到对应的键
    localStorage.setItem(storageKey, userId)
    // 也存储到旧键作为备份
    localStorage.setItem(USER_ID_KEY, userId)
  } catch (e) {
    console.warn('⚠️ localStorage不可用:', e)
  }
  
  try {
    sessionStorage.setItem(USER_ID_KEY, userId)
  } catch (e) {
    console.warn('⚠️ sessionStorage不可用:', e)
  }
  
  try {
    setCookie(COOKIE_NAME, userId, COOKIE_DAYS)
  } catch (e) {
    console.warn('⚠️ Cookie设置失败:', e)
  }
}

/**
 * 设置用户 ID（用于导入和登录后设置）
 */
export function setUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid user ID')
  }
  
  const loginMethod = getLoginMethod()
  console.log('🆔 设置用户ID:', userId, '登录方式:', loginMethod)
  
  syncUserId(userId)
  
  // 验证是否正确存储
  const storageKey = loginMethod === 'password' ? `${USER_ID_KEY}_password` :
                     loginMethod === 'account' ? `${USER_ID_KEY}_account` :
                     loginMethod.startsWith('oauth_') ? `${USER_ID_KEY}_oauth_${loginMethod.replace('oauth_', '')}` :
                     USER_ID_KEY
  
  const stored = localStorage.getItem(storageKey)
  console.log('✅ 用户ID已存储到:', storageKey, '值:', stored)
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

/**
 * 设置登录方式
 * @param {string} method - 登录方式：'password' 或 'oauth_<provider>'
 */
export function setLoginMethod(method) {
  localStorage.setItem(LOGIN_METHOD_KEY, method)
  console.log('🔐 登录方式已设置:', method)
  
  // 触发 getUserId() 确保用户ID正确
  const userId = getUserId()
  console.log('👤 当前用户ID:', userId)
}

/**
 * 清除登录方式（登出时调用）
 */
export function clearLoginMethod() {
  localStorage.removeItem(LOGIN_METHOD_KEY)
}

/**
 * 清除所有OAuth相关的旧数据（百度等第三方登录数据）
 * @param {Function} apiDeleteCallback - 可选的API删除回调函数，用于清除数据库记录
 */
export async function clearOAuthData(apiDeleteCallback) {
  const keysToRemove = []
  const oauthProviders = new Set()
  
  // 遍历localStorage查找所有OAuth相关的key
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes('oauth_')) {
      keysToRemove.push(key)
      
      // 提取provider名称
      const match = key.match(/oauth_([^_]+)/)
      if (match && match[1]) {
        oauthProviders.add(match[1])
      }
    }
  }
  
  // 删除所有OAuth相关的数据
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    console.log('🗑️ 已清除OAuth数据:', key)
  })
  
  // 同时清理sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.includes('oauth_')) {
      sessionStorage.removeItem(key)
      console.log('🗑️ 已清除OAuth会话数据:', key)
    }
  }
  
  // 清理cookie中的OAuth数据
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.split('=')
    const trimmedName = name.trim()
    if (trimmedName.includes('oauth_')) {
      document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
      console.log('🗑️ 已清除OAuth Cookie:', trimmedName)
    }
  })
  
  // 如果提供了API回调，清除数据库中的OAuth登录记录
  if (apiDeleteCallback && oauthProviders.size > 0) {
    for (const provider of oauthProviders) {
      try {
        await apiDeleteCallback(provider)
        console.log(`🗑️ 已清除数据库中的 ${provider} 登录记录`)
      } catch (error) {
        console.warn(`⚠️ 清除 ${provider} 数据库记录失败:`, error)
      }
    }
  }
  
  console.log(`✅ 已清除 ${keysToRemove.length} 条OAuth客户端数据，${oauthProviders.size} 个provider的数据库记录`)
  return {
    clientDataCount: keysToRemove.length,
    providers: Array.from(oauthProviders)
  }
}

