/**
 * 安全相关 API 路由
 * 包括 CSRF Token 管理和审计日志查询
 */

import { successResponse, errorResponse } from '../utils/cors.js'
import { generateCsrfToken, setCsrfCookie } from '../middleware/csrf.js'
import { queryAuditLogs, cleanupAuditLogs } from '../services/auditLog.js'
import { requireAdmin } from '../middleware/admin.js'

export default async function securityRoutes(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/security', '')
  const method = request.method

  // GET /csrf-token - 获取 CSRF Token
  if (path === '/csrf-token' && method === 'GET') {
    try {
      const token = generateCsrfToken()
      
      const response = successResponse({
        csrfToken: token
      })
      
      // 设置 CSRF Cookie
      return setCsrfCookie(response, token)
    } catch (error) {
      console.error('Generate CSRF token error:', error)
      return errorResponse('生成 CSRF Token 失败', 500)
    }
  }

  // GET /audit-logs - 获取审计日志（仅管理员）
  if (path === '/audit-logs' && method === 'GET') {
    // 验证管理员权限
    const adminError = requireAdmin(request, env)
    if (adminError) {
      return adminError
    }

    try {
      const action = url.searchParams.get('action')
      const userId = url.searchParams.get('userId')
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')

      const result = await queryAuditLogs(env, {
        action,
        userId,
        startDate,
        endDate,
        page,
        limit
      })

      return successResponse({
        logs: result.logs,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      })
    } catch (error) {
      console.error('Query audit logs error:', error)
      return errorResponse('查询审计日志失败', 500)
    }
  }

  // POST /audit-logs/cleanup - 清理过期审计日志（仅管理员）
  if (path === '/audit-logs/cleanup' && method === 'POST') {
    // 验证管理员权限
    const adminError = requireAdmin(request, env)
    if (adminError) {
      return adminError
    }

    try {
      const body = await request.json().catch(() => ({}))
      const retentionDays = body.retentionDays || 90

      const deletedCount = await cleanupAuditLogs(env, retentionDays)

      return successResponse({
        deletedCount,
        message: `已清理 ${deletedCount} 条过期日志`
      })
    } catch (error) {
      console.error('Cleanup audit logs error:', error)
      return errorResponse('清理审计日志失败', 500)
    }
  }

  // GET /audit-logs/stats - 获取审计日志统计（仅管理员）
  if (path === '/audit-logs/stats' && method === 'GET') {
    // 验证管理员权限
    const adminError = requireAdmin(request, env)
    if (adminError) {
      return adminError
    }

    try {
      // 获取各类操作的统计
      const statsResult = await env.DB.prepare(`
        SELECT 
          action,
          COUNT(*) as count,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_count
        FROM audit_logs
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY action
        ORDER BY count DESC
      `).all()

      // 获取最近登录失败的记录
      const failedLoginsResult = await env.DB.prepare(`
        SELECT user_id, ip_address, created_at, error_message
        FROM audit_logs
        WHERE action = 'login_failed'
        AND created_at >= datetime('now', '-24 hours')
        ORDER BY created_at DESC
        LIMIT 20
      `).all()

      // 获取总记录数
      const totalResult = await env.DB.prepare(`
        SELECT COUNT(*) as total FROM audit_logs
      `).first()

      return successResponse({
        stats: statsResult.results || [],
        recentFailedLogins: failedLoginsResult.results || [],
        totalLogs: totalResult?.total || 0
      })
    } catch (error) {
      console.error('Get audit stats error:', error)
      return errorResponse('获取审计统计失败', 500)
    }
  }

  return errorResponse('Not found', 404)
}
