/**
 * Token管理服务
 * 提供Token生成、验证、刷新、撤销等功能
 */

import crypto from 'node:crypto'

/**
 * 生成随机Token
 */
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * 计算过期时间
 * @param {number} hours - 小时数
 */
function getExpiresAt(hours) {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

/**
 * 创建Token对
 * @param {string} userId - 用户ID
 * @param {object} env - 环境变量
 * @returns {Promise<{token: string, refreshToken: string, expiresIn: number}>}
 */
export async function createTokenPair(userId, env) {
  const token = generateRandomToken()
  const refreshToken = generateRandomToken()
  const expiresAt = getExpiresAt(24) // Token 24小时过期
  const refreshExpiresAt = getExpiresAt(24 * 7) // 刷新Token 7天过期

  // 保存到数据库
  await env.DB.prepare(`
    INSERT INTO tokens (user_id, token, refresh_token, expires_at, refresh_expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(userId, token, refreshToken, expiresAt, refreshExpiresAt).run()

  return {
    token,
    refreshToken,
    expiresIn: 86400 // 24小时（秒）
  }
}

/**
 * 验证Token
 * @param {string} token - Token值
 * @param {object} env - 环境变量
 * @returns {Promise<{valid: boolean, userId?: string, error?: string}>}
 */
export async function verifyToken(token, env) {
  try {
    const tokenRecord = await env.DB.prepare(`
      SELECT user_id, expires_at, is_revoked
      FROM tokens
      WHERE token = ?
    `).bind(token).first()

    if (!tokenRecord) {
      return { valid: false, error: 'Token不存在' }
    }

    if (tokenRecord.is_revoked === 1) {
      return { valid: false, error: 'Token已被撤销' }
    }

    const now = new Date().toISOString()
    if (tokenRecord.expires_at < now) {
      return { valid: false, error: 'Token已过期' }
    }

    // 更新最后使用时间
    await env.DB.prepare(`
      UPDATE tokens
      SET last_used_at = datetime('now')
      WHERE token = ?
    `).bind(token).run()

    return {
      valid: true,
      userId: tokenRecord.user_id
    }
  } catch (error) {
    console.error('Token验证错误:', error)
    return { valid: false, error: '验证失败' }
  }
}

/**
 * 刷新Token
 * @param {string} refreshToken - 刷新Token
 * @param {object} env - 环境变量
 * @returns {Promise<{success: boolean, token?: string, refreshToken?: string, expiresIn?: number, error?: string}>}
 */
export async function refreshAccessToken(refreshToken, env) {
  try {
    const tokenRecord = await env.DB.prepare(`
      SELECT user_id, refresh_expires_at, is_revoked
      FROM tokens
      WHERE refresh_token = ?
    `).bind(refreshToken).first()

    if (!tokenRecord) {
      return { success: false, error: '刷新Token不存在' }
    }

    if (tokenRecord.is_revoked === 1) {
      return { success: false, error: '刷新Token已被撤销' }
    }

    const now = new Date().toISOString()
    if (tokenRecord.refresh_expires_at < now) {
      return { success: false, error: '刷新Token已过期' }
    }

    // 撤销旧Token
    await env.DB.prepare(`
      UPDATE tokens
      SET is_revoked = 1
      WHERE refresh_token = ?
    `).bind(refreshToken).run()

    // 创建新Token对
    const newTokenPair = await createTokenPair(tokenRecord.user_id, env)

    return {
      success: true,
      ...newTokenPair
    }
  } catch (error) {
    console.error('Token刷新错误:', error)
    return { success: false, error: '刷新失败' }
  }
}

/**
 * 撤销Token（退出登录）
 * @param {string} token - Token值
 * @param {object} env - 环境变量
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function revokeToken(token, env) {
  try {
    const result = await env.DB.prepare(`
      UPDATE tokens
      SET is_revoked = 1
      WHERE token = ?
    `).bind(token).run()

    if (result.meta.changes === 0) {
      return { success: false, error: 'Token不存在' }
    }

    return { success: true }
  } catch (error) {
    console.error('Token撤销错误:', error)
    return { success: false, error: '撤销失败' }
  }
}

/**
 * 清理过期Token（定时任务）
 * @param {object} env - 环境变量
 * @returns {Promise<{deleted: number}>}
 */
export async function cleanupExpiredTokens(env) {
  try {
    const now = new Date().toISOString()
    
    const result = await env.DB.prepare(`
      DELETE FROM tokens
      WHERE (expires_at < ? AND refresh_expires_at < ?) OR is_revoked = 1
    `).bind(now, now).run()

    console.log(`✅ 清理了 ${result.meta.changes} 个过期/撤销的Token`)
    
    return { deleted: result.meta.changes }
  } catch (error) {
    console.error('Token清理错误:', error)
    return { deleted: 0 }
  }
}

/**
 * 获取用户的所有活跃Token
 * @param {string} userId - 用户ID
 * @param {object} env - 环境变量
 * @returns {Promise<Array>}
 */
export async function getUserActiveTokens(userId, env) {
  try {
    const now = new Date().toISOString()
    
    const result = await env.DB.prepare(`
      SELECT token, created_at, last_used_at, expires_at
      FROM tokens
      WHERE user_id = ? AND is_revoked = 0 AND expires_at > ?
      ORDER BY created_at DESC
    `).bind(userId, now).all()

    return result.results || []
  } catch (error) {
    console.error('获取用户Token错误:', error)
    return []
  }
}

/**
 * 撤销用户的所有Token（强制退出所有设备）
 * @param {string} userId - 用户ID
 * @param {object} env - 环境变量
 * @returns {Promise<{success: boolean, revoked: number}>}
 */
export async function revokeAllUserTokens(userId, env) {
  try {
    const result = await env.DB.prepare(`
      UPDATE tokens
      SET is_revoked = 1
      WHERE user_id = ? AND is_revoked = 0
    `).bind(userId).run()

    console.log(`✅ 撤销了用户 ${userId} 的 ${result.meta.changes} 个Token`)
    
    return {
      success: true,
      revoked: result.meta.changes
    }
  } catch (error) {
    console.error('撤销用户Token错误:', error)
    return {
      success: false,
      revoked: 0
    }
  }
}

