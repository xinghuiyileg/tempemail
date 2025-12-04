/**
 * 操作日志服务
 * 记录敏感操作的审计日志
 */

// 敏感操作类型
export const AuditAction = {
  // 认证相关
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  REGISTER: 'register',
  PASSWORD_CHANGE: 'password_change',
  
  // 邮箱操作
  EMAIL_CREATE: 'email_create',
  EMAIL_DELETE: 'email_delete',
  EMAIL_CLEAR_ALL: 'email_clear_all',
  
  // 邮件操作
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_BATCH_DELETE: 'message_batch_delete',
  MESSAGE_CLEAR_ALL: 'message_clear_all',
  
  // 域名操作
  DOMAIN_ADD: 'domain_add',
  DOMAIN_DELETE: 'domain_delete',
  DOMAIN_VERIFY: 'domain_verify',
  
  // 配置操作
  CONFIG_UPDATE: 'config_update',
  CONFIG_EXPORT: 'config_export',
  CONFIG_IMPORT: 'config_import',
  
  // 用户管理
  USER_CREATE: 'user_create',
  USER_DELETE: 'user_delete',
  USER_UPDATE: 'user_update',
  USER_BAN: 'user_ban',
  USER_UNBAN: 'user_unban',
  
  // 数据操作
  BACKUP_CREATE: 'backup_create',
  BACKUP_RESTORE: 'backup_restore'
}

/**
 * 记录审计日志
 * @param {Object} env - 环境变量（包含 DB）
 * @param {Object} options - 日志选项
 * @param {string} options.action - 操作类型
 * @param {string} options.userId - 用户ID
 * @param {string} options.targetType - 目标类型（如 email, message, domain）
 * @param {string} options.targetId - 目标ID
 * @param {Object} options.details - 详细信息
 * @param {string} options.ip - 客户端IP
 * @param {string} options.userAgent - 用户代理
 * @param {boolean} options.success - 操作是否成功
 * @param {string} options.errorMessage - 错误信息（如果失败）
 */
export async function logAudit(env, options) {
  const {
    action,
    userId = 'anonymous',
    targetType = null,
    targetId = null,
    details = null,
    ip = null,
    userAgent = null,
    success = true,
    errorMessage = null
  } = options

  try {
    await env.DB.prepare(`
      INSERT INTO audit_logs (
        action, user_id, target_type, target_id, details,
        ip_address, user_agent, success, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      action,
      userId,
      targetType,
      targetId,
      details ? JSON.stringify(details) : null,
      ip,
      userAgent,
      success ? 1 : 0,
      errorMessage
    ).run()

    console.log(`📝 Audit: ${action} by ${userId} - ${success ? 'SUCCESS' : 'FAILED'}`)
  } catch (error) {
    // 日志记录失败不应影响主业务
    console.error('Failed to write audit log:', error)
  }
}

/**
 * 从请求中提取客户端信息
 * @param {Request} request
 * @returns {Object} { ip, userAgent }
 */
export function getClientInfo(request) {
  const ip = request.headers.get('CF-Connecting-IP') ||
             request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
             request.headers.get('X-Real-IP') ||
             'unknown'
  
  const userAgent = request.headers.get('User-Agent') || 'unknown'
  
  return { ip, userAgent }
}

/**
 * 查询审计日志
 * @param {Object} env
 * @param {Object} options - 查询选项
 * @param {string} options.action - 操作类型筛选
 * @param {string} options.userId - 用户ID筛选
 * @param {string} options.startDate - 开始日期
 * @param {string} options.endDate - 结束日期
 * @param {number} options.page - 页码
 * @param {number} options.limit - 每页数量
 * @returns {Promise<Object>} { logs, total }
 */
export async function queryAuditLogs(env, options = {}) {
  const {
    action = null,
    userId = null,
    startDate = null,
    endDate = null,
    page = 1,
    limit = 50
  } = options

  let whereClause = '1=1'
  const params = []

  if (action) {
    whereClause += ' AND action = ?'
    params.push(action)
  }

  if (userId) {
    whereClause += ' AND user_id = ?'
    params.push(userId)
  }

  if (startDate) {
    whereClause += ' AND created_at >= ?'
    params.push(startDate)
  }

  if (endDate) {
    whereClause += ' AND created_at <= ?'
    params.push(endDate)
  }

  // 获取总数
  const countResult = await env.DB.prepare(`
    SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}
  `).bind(...params).first()

  const total = countResult?.total || 0

  // 获取分页数据
  const offset = (page - 1) * limit
  const logsResult = await env.DB.prepare(`
    SELECT * FROM audit_logs 
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all()

  const logs = (logsResult.results || []).map(log => ({
    ...log,
    details: log.details ? JSON.parse(log.details) : null,
    success: log.success === 1
  }))

  return { logs, total }
}

/**
 * 清理过期的审计日志
 * @param {Object} env
 * @param {number} retentionDays - 保留天数，默认90天
 */
export async function cleanupAuditLogs(env, retentionDays = 90) {
  try {
    const result = await env.DB.prepare(`
      DELETE FROM audit_logs 
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `).bind(retentionDays).run()

    console.log(`🧹 Cleaned up ${result.meta.changes} old audit logs`)
    return result.meta.changes
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error)
    return 0
  }
}
