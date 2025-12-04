import { successResponse, errorResponse } from '../utils/cors'
import { getCloudflareClient } from '../services/cloudflare'
import { sendEmailSmart } from '../services/emailProviders'
import ConfigManager, { CONFIG_KEYS } from '../utils/configManager'
import { logAudit, AuditAction, getClientInfo } from '../services/auditLog'

// 生成邮箱地址（支持自定义前缀和随机模式）
function generateEmailWithPrefix(domain, prefix, isCustom = false) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  
  if (isCustom && prefix) {
    // 自定义模式：直接使用用户输入的前缀
    const cleanPrefix = prefix.trim().toLowerCase()
    return `${cleanPrefix}@${domain}`
  }
  
  // 随机模式：生成随机前缀或在前缀后添加随机后缀
  let base = (prefix && typeof prefix === 'string' ? prefix.trim() : '') || 'temp'
  // 清理非法字符，只保留字母数字和下划线
  base = base.toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!base) base = 'temp'

  let username = base + '_'
  for (let i = 0; i < 10; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${username}@${domain}`
}

// 解析域名列表
function parseDomains(input) {
  if (!input) return []
  return String(input)
    .split(/[;,；,]/)
    .map(s => s.trim())
    .filter(Boolean)
}

export default async function emailRoutes(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  // POST /create - 创建临时邮箱（可带 prefix 和 domain）
  if (path === '/create' && method === 'POST') {
    try {
      // 获取用户 ID（用户隔离）
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      // 从配置表优先读取域名，其次回退到环境变量
      let configuredDomains = await getConfiguredDomains(env)

      const targetEmail = env.TARGET_EMAIL || await getTargetEmail(env)
      if (!targetEmail) {
        return errorResponse('Target email not configured', 400)
      }

      let prefix
      let domain
      let isCustom = false
      try {
        const body = await request.json().catch(() => null)
        if (body) {
          if (body.prefix) prefix = body.prefix
          if (body.domain) domain = String(body.domain).trim()
          if (body.custom === true) isCustom = true
        }
      } catch (_) {}

      // 选择域名
      if (domain && configuredDomains.includes(domain)) {
        // use as is
      } else {
        domain = configuredDomains[0]
      }

      // 生成邮箱地址
      const emailAddress = generateEmailWithPrefix(domain, prefix, isCustom)

      // 检查该用户是否已经创建了这个邮箱（避免重复）
      const existingEmail = await env.DB.prepare(`
        SELECT id FROM temp_emails 
        WHERE user_id = ? AND email = ? AND status = 'active'
      `).bind(userId, emailAddress).first()

      if (existingEmail) {
        return errorResponse('您已经创建过这个邮箱，请使用其他前缀', 409)
      }

      // 创建 Cloudflare Email Routing 规则
      let ruleId = null
      try {
        const cfClient = getCloudflareClient(env)
        const rule = await cfClient.createRule(emailAddress, targetEmail)
        ruleId = rule.id
        console.log('✅ Cloudflare规则创建成功:', ruleId)
      } catch (error) {
        console.error('Failed to create Cloudflare rule:', error)
        console.warn('⚠️ 邮箱将创建，但无法接收邮件')
        // 继续执行，将 rule_id 设为 null
      }

      // 保存到数据库（关联用户 ID）
      const result = await env.DB.prepare(`
        INSERT INTO temp_emails (user_id, email, cloudflare_rule_id, target_email, status)
        VALUES (?, ?, ?, ?, 'active')
      `).bind(userId, emailAddress, ruleId, targetEmail).run()

      const emailId = result.meta.last_row_id

      return successResponse({
        id: emailId,
        email: emailAddress,
        created_at: new Date().toISOString(),
        copied: true
      })
    } catch (error) {
      console.error('Create email error:', error)
      
      // 处理数据库唯一约束冲突（重复邮箱）
      const errorMessage = error.message || String(error)
      if (errorMessage.toLowerCase().includes('unique') || 
          errorMessage.toLowerCase().includes('constraint')) {
        return errorResponse('该邮箱已存在，请使用其他前缀', 409)
      }
      
      // 其他错误
      return errorResponse(error.message || '创建邮箱失败，请稍后重试', 500)
    }
  }

  // GET /list - 获取邮箱列表（支持搜索）
  if (path === '/list' && method === 'GET') {
    try {
      // 获取用户 ID（用户隔离）
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '5')
      const offset = (page - 1) * limit
      const search = url.searchParams.get('search') || ''

      let countQuery, listQuery
      let countParams, listParams

      if (search.trim()) {
        // 搜索模式：按邮箱地址搜索
        const searchPattern = `%${search.trim()}%`
        
        countQuery = `
          SELECT COUNT(*) as total FROM temp_emails 
          WHERE user_id = ? AND status = 'active' AND email LIKE ?
        `
        countParams = [userId, searchPattern]
        
        listQuery = `
          SELECT 
            id, 
            email, 
            created_at, 
            last_received_at,
            message_count,
            status,
            is_starred
          FROM temp_emails
          WHERE user_id = ? AND status = 'active' AND email LIKE ?
          ORDER BY is_starred DESC, created_at DESC
          LIMIT ? OFFSET ?
        `
        listParams = [userId, searchPattern, limit, offset]
      } else {
        // 普通模式
        countQuery = `
          SELECT COUNT(*) as total FROM temp_emails 
          WHERE user_id = ? AND status = 'active'
        `
        countParams = [userId]
        
        listQuery = `
          SELECT 
            id, 
            email, 
            created_at, 
            last_received_at,
            message_count,
            status,
            is_starred
          FROM temp_emails
          WHERE user_id = ? AND status = 'active'
          ORDER BY is_starred DESC, created_at DESC
          LIMIT ? OFFSET ?
        `
        listParams = [userId, limit, offset]
      }

      // 获取总数
      const countStmt = env.DB.prepare(countQuery)
      const countResult = await countStmt.bind(...countParams).first()
      const total = countResult?.total || 0

      // 获取邮箱列表
      const listStmt = env.DB.prepare(listQuery)
      const result = await listStmt.bind(...listParams).all()

      return successResponse({
        emails: result.results || [],
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit)
        },
        search: search.trim() || null
      })
    } catch (error) {
      console.error('List emails error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /:id/messages - 获取某个邮箱的邮件列表
  if (path.match(/^\/\d+\/messages$/) && method === 'GET') {
    try {
      // 获取用户 ID（用户隔离）
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      const emailId = parseInt(path.split('/')[1])
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '4')
      const offset = (page - 1) * limit

      console.log('[email.js] GET /:id/messages - userId:', userId, 'emailId:', emailId, 'page:', page)

      // 验证邮箱所有权
      const email = await env.DB.prepare(`
        SELECT id FROM temp_emails WHERE id = ? AND user_id = ?
      `).bind(emailId, userId).first()

      if (!email) {
        return errorResponse('Email not found or access denied', 404)
      }

      // 统计总数
      const countResult = await env.DB.prepare(`
        SELECT COUNT(*) as total FROM messages WHERE temp_email_id = ?
      `).bind(emailId).first()

      const total = countResult?.total || 0

      // 获取邮件列表
      const result = await env.DB.prepare(`
        SELECT 
          id,
          sender,
          subject,
          body_text,
          verification_code,
          received_at,
          is_read,
          created_at
        FROM messages
        WHERE temp_email_id = ?
        ORDER BY received_at DESC
        LIMIT ? OFFSET ?
      `).bind(emailId, limit, offset).all()

      console.log('[email.js] Returning page:', page, 'results:', result.results?.length)

      return successResponse({
        messages: result.results || [],
        pagination: {
          page: page,  // 明确返回请求的页码
          limit: limit,
          total: total,
          total_pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('List messages by email error:', error)
      return errorResponse(error.message)
    }
  }

  // PUT /:id/star - 星标/取消星标邮箱
  if (path.match(/^\/\d+\/star$/) && method === 'PUT') {
    try {
      // 获取用户 ID（用户隔离）
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      const id = parseInt(path.split('/')[1])
      const body = await request.json()
      const isStarred = body.is_starred ? 1 : 0

      // 验证邮箱所有权
      const email = await env.DB.prepare(`
        SELECT id FROM temp_emails WHERE id = ? AND user_id = ?
      `).bind(id, userId).first()

      if (!email) {
        return errorResponse('Email not found or access denied', 404)
      }

      // 更新星标状态
      await env.DB.prepare(`
        UPDATE temp_emails SET is_starred = ? WHERE id = ?
      `).bind(isStarred, id).run()

      console.log(`${isStarred ? '⭐' : '☆'} 邮箱星标已${isStarred ? '设置' : '取消'}:`, id)

      return successResponse({ 
        id, 
        is_starred: isStarred,
        message: isStarred ? '已添加星标' : '已取消星标'
      })
    } catch (error) {
      console.error('Toggle star error:', error)
      return errorResponse(error.message)
    }
  }

  // DELETE /:id - 删除邮箱
  if (path.match(/^\/\d+$/) && method === 'DELETE') {
    const { ip, userAgent } = getClientInfo(request)
    
    try {
      // 获取用户 ID（用户隔离）
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      const id = parseInt(path.slice(1))

      // 获取邮箱信息并验证所有权
      const email = await env.DB.prepare(`
        SELECT * FROM temp_emails WHERE id = ? AND user_id = ?
      `).bind(id, userId).first()

      if (!email) {
        return errorResponse('Email not found or access denied', 404)
      }

      // 检查是否星标，星标邮箱不允许删除
      if (email.is_starred === 1) {
        return errorResponse('星标邮箱不可删除，请先取消星标', 403)
      }

      // 删除 Cloudflare 规则
      if (email.cloudflare_rule_id) {
        try {
          const cfClient = getCloudflareClient(env)
          await cfClient.deleteRule(email.cloudflare_rule_id)
        } catch (error) {
          console.error('Failed to delete Cloudflare rule:', error)
        }
      }

      // 删除数据库记录
      await env.DB.prepare(`
        DELETE FROM temp_emails WHERE id = ?
      `).bind(id).run()

      // 删除相关邮件
      await env.DB.prepare(`
        DELETE FROM messages WHERE temp_email_id = ?
      `).bind(id).run()

      // 记录审计日志
      await logAudit(env, {
        action: AuditAction.EMAIL_DELETE,
        userId,
        targetType: 'email',
        targetId: String(id),
        details: { email: email.email },
        ip,
        userAgent,
        success: true
      })

      return successResponse({ deleted: true })
    } catch (error) {
      console.error('Delete email error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /sent - 获取发送历史（支持分页）
  if (path === '/sent' && method === 'GET') {
    try {
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      // 获取分页参数
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '20')
      const offset = (page - 1) * limit

      // 验证分页参数
      if (page < 1 || limit < 1 || limit > 100) {
        return errorResponse('Invalid pagination parameters', 400)
      }

      // 获取总数
      const countResult = await env.DB.prepare(`
        SELECT COUNT(*) as total
        FROM sent_emails se
        JOIN temp_emails te ON se.temp_email_id = te.id
        WHERE te.user_id = ?
      `).bind(userId).first()

      const total = countResult?.total || 0
      const totalPages = Math.ceil(total / limit)

      // 获取分页数据
      const result = await env.DB.prepare(`
        SELECT
          se.id,
          se.recipient,
          se.subject,
          se.body,
          se.sent_at,
          se.provider,
          te.email as sender_email
        FROM sent_emails se
        JOIN temp_emails te ON se.temp_email_id = te.id
        WHERE te.user_id = ?
        ORDER BY se.sent_at DESC
        LIMIT ? OFFSET ?
      `).bind(userId, limit, offset).all()

      return successResponse({
        emails: result.results || [],
        pagination: {
          page: page,
          limit: limit,
          total: total,
          total_pages: totalPages
        }
      })
    } catch (error) {
      console.error('Get sent emails error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /send - 发送邮件
  if (path === '/send' && method === 'POST') {
    try {
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      const body = await request.json()
      const { from, to, subject, content } = body

      if (!from || !to || !subject || !content) {
        return errorResponse('Missing required fields', 400)
      }

      // 验证发件邮箱属于当前用户
      const email = await env.DB.prepare(`
        SELECT id, email FROM temp_emails WHERE email = ? AND user_id = ? AND status = 'active'
      `).bind(from, userId).first()

      if (!email) {
        return errorResponse('Sender email not found or access denied', 404)
      }

      // 使用智能路由发送邮件（支持多个邮件服务）
      let sendSuccess = false
      let errorMessage = null
      let usedService = 'none'
      let attemptedServices = []

      try {
        // 使用统一配置管理器加载配置
        const envWithConfig = await ConfigManager.createEnhancedEnv(env)
        const result = await sendEmailSmart(from, to, subject, content, envWithConfig)

        if (result.success) {
          sendSuccess = true
          usedService = result.service || 'unknown'
          console.log(`✅ 邮件发送成功 (${usedService}): ${from} -> ${to}`)
        } else {
          errorMessage = result.error || '发送失败'
          // 记录尝试过的服务
          if (result.attempts && result.attempts.length > 0) {
            attemptedServices = result.attempts.map(a => a.service)
            usedService = `failed:${attemptedServices.join(',')}`
          }
          console.error(`❌ 邮件发送失败:`, result)
          console.error(`❌ 尝试的服务: ${attemptedServices.join(', ')}`)
        }
      } catch (sendError) {
        errorMessage = sendError.message
        console.error('❌ 邮件发送异常:', sendError)
      }

      // 保存到发送记录表（包含服务商信息）
      await env.DB.prepare(`
        INSERT INTO sent_emails (temp_email_id, recipient, subject, body, provider, sent_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(email.id, to, subject, content, usedService).run()

      if (sendSuccess) {
        return successResponse({
          success: true,
          message: `邮件发送成功！(${usedService})`,
          service: usedService
        })
      } else {
        return successResponse({
          success: false,
          message: '邮件发送失败',
          error: errorMessage
        })
      }
    } catch (error) {
      console.error('Send email error:', error)
      return errorResponse(error.message)
    }
  }

  // DELETE /sent/:id - 删除发送记录
  if (path.startsWith('/sent/') && method === 'DELETE') {
    try {
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      const sentEmailId = path.split('/sent/')[1]
      if (!sentEmailId) {
        return errorResponse('Missing sent email ID', 400)
      }

      // 验证记录属于当前用户
      const sentEmail = await env.DB.prepare(`
        SELECT se.id 
        FROM sent_emails se
        JOIN temp_emails te ON se.temp_email_id = te.id
        WHERE se.id = ? AND te.user_id = ?
      `).bind(sentEmailId, userId).first()

      if (!sentEmail) {
        return errorResponse('Sent email not found or access denied', 404)
      }

      // 删除记录
      await env.DB.prepare(`
        DELETE FROM sent_emails WHERE id = ?
      `).bind(sentEmailId).run()

      return successResponse({ 
        success: true,
        message: '发送记录已删除'
      })
    } catch (error) {
      console.error('Delete sent email error:', error)
      return errorResponse(error.message)
    }
  }

  // DELETE /clear-all - 删除所有非星标邮箱
  if (path === '/clear-all' && method === 'DELETE') {
    const { ip, userAgent } = getClientInfo(request)
    
    try {
      // 获取用户 ID（用户隔离）
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      // 获取所有非星标邮箱
      const result = await env.DB.prepare(`
        SELECT id, email, cloudflare_rule_id FROM temp_emails 
        WHERE user_id = ? AND status = 'active' AND (is_starred = 0 OR is_starred IS NULL)
      `).bind(userId).all()

      const emails = result.results || []
      let deletedCount = 0
      const deletedEmails = []

      for (const email of emails) {
        try {
          // 删除 Cloudflare 规则
          if (email.cloudflare_rule_id) {
            try {
              const cfClient = getCloudflareClient(env)
              await cfClient.deleteRule(email.cloudflare_rule_id)
            } catch (error) {
              console.error('Failed to delete Cloudflare rule:', error)
            }
          }

          // 删除相关邮件
          await env.DB.prepare(`
            DELETE FROM messages WHERE temp_email_id = ?
          `).bind(email.id).run()

          // 删除邮箱记录
          await env.DB.prepare(`
            DELETE FROM temp_emails WHERE id = ?
          `).bind(email.id).run()

          deletedCount++
          deletedEmails.push(email.email)
        } catch (error) {
          console.error(`Failed to delete email ${email.id}:`, error)
        }
      }

      // 记录审计日志
      await logAudit(env, {
        action: AuditAction.EMAIL_CLEAR_ALL,
        userId,
        targetType: 'email',
        details: { deletedCount, deletedEmails: deletedEmails.slice(0, 10) }, // 只记录前10个
        ip,
        userAgent,
        success: true
      })

      console.log(`🗑️ 已删除 ${deletedCount} 个非星标邮箱`)

      return successResponse({ 
        deleted_count: deletedCount,
        message: `已删除 ${deletedCount} 个非星标邮箱`
      })
    } catch (error) {
      console.error('Clear all emails error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /batch-delete - 批量删除
  if (path === '/batch-delete' && method === 'POST') {
    try {
      // 获取用户 ID（用户隔离）
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      const body = await request.json()
      const ids = body.ids || []

      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse('Invalid ids parameter', 400)
      }

      let deletedCount = 0

      for (const id of ids) {
        try {
          // 获取邮箱信息并验证所有权
          const email = await env.DB.prepare(`
            SELECT * FROM temp_emails WHERE id = ? AND user_id = ?
          `).bind(id, userId).first()

          if (email) {
            // 检查是否星标，星标邮箱跳过删除
            if (email.is_starred === 1) {
              console.log('⭐ 跳过星标邮箱:', email.email)
              continue
            }

            // 删除 Cloudflare 规则
            if (email.cloudflare_rule_id) {
              try {
                const cfClient = getCloudflareClient(env)
                await cfClient.deleteRule(email.cloudflare_rule_id)
              } catch (error) {
                console.error('Failed to delete Cloudflare rule:', error)
              }
            }

            // 删除数据库记录
            await env.DB.prepare(`
              DELETE FROM temp_emails WHERE id = ?
            `).bind(id).run()

            await env.DB.prepare(`
              DELETE FROM messages WHERE temp_email_id = ?
            `).bind(id).run()

            deletedCount++
          }
        } catch (error) {
          console.error(`Failed to delete email ${id}:`, error)
        }
      }

      return successResponse({ deleted_count: deletedCount })
    } catch (error) {
      console.error('Batch delete error:', error)
      return errorResponse(error.message)
    }
  }

  return errorResponse('Not found', 404)
}

// 从配置中获取目标邮箱（使用统一配置管理）
async function getTargetEmail(env) {
  try {
    return await ConfigManager.get(CONFIG_KEYS.TARGET_QQ_EMAIL, env)
  } catch (error) {
    console.error('Failed to get target email:', error)
    return null
  }
}

// 从配置中获取域名列表（包括系统配置域名和用户添加的已验证域名）
async function getConfiguredDomains(env) {
  try {
    // 1. 获取系统配置域名
    const domainString = await ConfigManager.get(CONFIG_KEYS.DOMAIN_NAME, env, 'yourdomain.com')
    let systemDomains = parseDomains(domainString)
    if (systemDomains.length === 0) systemDomains = ['yourdomain.com']
    
    // 2. 获取用户添加的已验证域名
    let userDomains = []
    try {
      const result = await env.DB.prepare(`
        SELECT domain FROM domains WHERE status = 'verified'
      `).all()
      userDomains = (result.results || []).map(d => d.domain)
      console.log('✅ 已加载用户验证域名:', userDomains.length, '个')
    } catch (dbError) {
      console.warn('⚠️ 加载用户域名失败:', dbError)
    }
    
    // 3. 合并并去重（系统域名优先）
    const allDomains = [...new Set([...systemDomains, ...userDomains])]
    console.log('✅ 可用域名总数:', allDomains.length, '个 -', allDomains.join(', '))
    
    return allDomains
  } catch (e) {
    console.error('Failed to get configured domains:', e)
    return ['yourdomain.com']
  }
}

