/**
 * 域名管理路由
 * 处理用户域名的增删改查及验证
 */

import { successResponse, errorResponse } from '../utils/cors'
import { requireAdmin } from '../middleware/admin'
import { getUserId } from '../utils/userManager'
import {
  validateDomainFormat,
  performDomainVerification,
  reverifyDomain,
  generateVerificationToken
} from '../services/domainVerification'

export default async function domainsRoutes(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  // GET /domains - 获取域名列表
  if (path === '/' && method === 'GET') {
    try {
      const userId = getUserId(request)
      
      // 管理员可以查看所有域名，普通用户只能看自己的
      const isAdmin = !requireAdmin(request, env)
      
      let query
      if (isAdmin) {
        query = env.DB.prepare(`
          SELECT 
            id, domain, user_id, status, mx_records,
            last_verified_at, created_at, updated_at
          FROM domains
          ORDER BY created_at DESC
        `)
      } else {
        query = env.DB.prepare(`
          SELECT 
            id, domain, status, mx_records,
            last_verified_at, created_at, updated_at
          FROM domains
          WHERE user_id = ?
          ORDER BY created_at DESC
        `).bind(userId)
      }

      const result = await query.all()
      
      // 解析 MX 记录
      const domains = (result.results || []).map(domain => ({
        ...domain,
        mx_records: domain.mx_records ? JSON.parse(domain.mx_records) : []
      }))

      return successResponse({
        domains,
        count: domains.length
      })
    } catch (error) {
      console.error('Get domains error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /domains - 添加新域名
  if (path === '/' && method === 'POST') {
    try {
      const userId = getUserId(request)
      const body = await request.json()
      const { domain } = body

      if (!domain) {
        return errorResponse('域名不能为空')
      }

      // 验证域名格式
      const formatCheck = validateDomainFormat(domain)
      if (!formatCheck.valid) {
        return errorResponse(formatCheck.error)
      }

      // 检查域名是否已存在
      const existing = await env.DB.prepare(`
        SELECT id FROM domains WHERE domain = ?
      `).bind(domain).first()

      if (existing) {
        return errorResponse('该域名已被添加')
      }

      // 生成验证 Token
      const verificationToken = generateVerificationToken(domain)

      // 插入数据库
      const insertResult = await env.DB.prepare(`
        INSERT INTO domains (
          domain, user_id, status, verification_token, created_at, updated_at
        ) VALUES (?, ?, 'pending', ?, datetime('now'), datetime('now'))
      `).bind(domain, userId, verificationToken).run()

      const domainId = insertResult.meta.last_row_id

      console.log(`User ${userId} added domain: ${domain}`)

      return successResponse({
        id: domainId,
        domain,
        status: 'pending',
        verification_token: verificationToken,
        message: '域名添加成功，请进行验证'
      })
    } catch (error) {
      console.error('Add domain error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /domains/:id/verify - 验证域名
  if (path.match(/^\/\d+\/verify$/) && method === 'POST') {
    try {
      const domainId = parseInt(path.split('/')[1])
      const userId = getUserId(request)

      // 获取域名信息
      const domain = await env.DB.prepare(`
        SELECT * FROM domains WHERE id = ? AND user_id = ?
      `).bind(domainId, userId).first()

      if (!domain) {
        return errorResponse('域名不存在或无权访问')
      }

      // 执行验证
      const verificationResult = await performDomainVerification(domain.domain)

      // 更新数据库
      const status = verificationResult.verified ? 'verified' : 'failed'
      const mxRecords = verificationResult.mx_records || []

      await env.DB.prepare(`
        UPDATE domains
        SET status = ?,
            mx_records = ?,
            last_verified_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        status,
        JSON.stringify(mxRecords),
        domainId
      ).run()

      // 构建验证结果用于日志记录
      const resultsForLog = {
        mx: {
          records: mxRecords,
          verified: verificationResult.verified,
          error: verificationResult.error
        }
      }

      // 记录验证日志
      await env.DB.prepare(`
        INSERT INTO domain_verifications (
          domain_id, verification_type, verification_result, success, error_message, created_at
        ) VALUES (?, 'mx', ?, ?, ?, datetime('now'))
      `).bind(
        domainId,
        JSON.stringify(resultsForLog),
        verificationResult.success ? 1 : 0,
        verificationResult.error || null
      ).run()

      console.log(`Domain ${domain.domain} verification: ${status}`)

      return successResponse({
        verified: verificationResult.verified,
        status,
        mx_records: mxRecords,
        results: resultsForLog,
        message: verificationResult.verified ? '域名验证成功' : (verificationResult.error || '验证失败')
      })
    } catch (error) {
      console.error('Verify domain error:', error)
      return errorResponse(error.message)
    }
  }

  // DELETE /domains/:id - 删除域名
  if (path.match(/^\/\d+$/) && method === 'DELETE') {
    try {
      const domainId = parseInt(path.split('/')[1])
      const userId = getUserId(request)

      // 检查域名是否存在且属于当前用户
      const domain = await env.DB.prepare(`
        SELECT * FROM domains WHERE id = ? AND user_id = ?
      `).bind(domainId, userId).first()

      if (!domain) {
        return errorResponse('域名不存在或无权删除')
      }

      // 删除域名
      await env.DB.prepare(`
        DELETE FROM domains WHERE id = ?
      `).bind(domainId).run()

      console.log(`User ${userId} deleted domain: ${domain.domain}`)

      return successResponse({
        message: '域名删除成功'
      })
    } catch (error) {
      console.error('Delete domain error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /domains/verified - 获取所有已验证的域名列表（用于邮箱生成器）
  // 注意：所有已验证的域名对所有用户可见和可用
  if (path === '/verified' && method === 'GET') {
    try {
      const result = await env.DB.prepare(`
        SELECT domain, mx_records, last_verified_at, user_id
        FROM domains
        WHERE status = 'verified'
        ORDER BY domain ASC
      `).all()

      const domains = (result.results || []).map(d => ({
        domain: d.domain,
        mx_records: d.mx_records ? JSON.parse(d.mx_records) : [],
        last_verified_at: d.last_verified_at,
        user_id: d.user_id // 保留用户ID用于显示域名来源
      }))

      return successResponse({
        domains,
        count: domains.length
      })
    } catch (error) {
      console.error('Get verified domains error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /domains/:id/reverify - 重新验证域名
  if (path.match(/^\/\d+\/reverify$/) && method === 'POST') {
    try {
      const domainId = parseInt(path.split('/')[1])
      const userId = getUserId(request)

      const domain = await env.DB.prepare(`
        SELECT * FROM domains WHERE id = ? AND user_id = ?
      `).bind(domainId, userId).first()

      if (!domain) {
        return errorResponse('域名不存在或无权访问')
      }

      // 重新验证
      const result = await reverifyDomain(domain.domain)

      // 更新数据库
      const status = result.verified ? 'verified' : 'failed'
      await env.DB.prepare(`
        UPDATE domains
        SET status = ?,
            mx_records = ?,
            last_verified_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        status,
        JSON.stringify(result.mx_records),
        domainId
      ).run()

      return successResponse({
        verified: result.verified,
        status,
        mx_records: result.mx_records,
        message: result.verified ? '重新验证成功' : '验证失败'
      })
    } catch (error) {
      console.error('Reverify domain error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /domains/:id/verifications - 获取域名验证历史
  if (path.match(/^\/\d+\/verifications$/) && method === 'GET') {
    try {
      const domainId = parseInt(path.split('/')[1])
      const userId = getUserId(request)

      // 验证权限
      const domain = await env.DB.prepare(`
        SELECT id FROM domains WHERE id = ? AND user_id = ?
      `).bind(domainId, userId).first()

      if (!domain) {
        return errorResponse('域名不存在或无权访问')
      }

      const result = await env.DB.prepare(`
        SELECT 
          verification_type, verification_result, success, 
          error_message, created_at
        FROM domain_verifications
        WHERE domain_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(domainId).all()

      const verifications = (result.results || []).map(v => ({
        ...v,
        verification_result: v.verification_result ? JSON.parse(v.verification_result) : null
      }))

      return successResponse({
        verifications,
        count: verifications.length
      })
    } catch (error) {
      console.error('Get verifications error:', error)
      return errorResponse(error.message)
    }
  }

  return errorResponse('Not found', 404)
}









