import { successResponse, errorResponse } from '../utils/cors'
import { getAllEmailQuotas } from '../services/emailQuota'
import ConfigManager from '../utils/configManager'

export default async function monitorRoutes(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  // GET /status - 获取监控状态
  if (path === '/status' && method === 'GET') {
    try {
      // 获取用户 ID（用户隔离）
      const userId = request.headers.get('X-User-ID')
      if (!userId) {
        return errorResponse('Missing user ID', 400)
      }

      // 获取监控状态配置
      const statusConfig = await env.DB.prepare(`
        SELECT config_value FROM config WHERE config_key = 'monitor_status'
      `).first()

      const lastCheckConfig = await env.DB.prepare(`
        SELECT config_value FROM config WHERE config_key = 'last_check_time'
      `).first()

      // 统计数据（仅统计当前用户的数据）
      const emailCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM temp_emails 
        WHERE user_id = ? AND status = 'active'
      `).bind(userId).first()

      const messageCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM messages m
        INNER JOIN temp_emails e ON m.temp_email_id = e.id
        WHERE e.user_id = ?
      `).bind(userId).first()

      const codeCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM messages m
        INNER JOIN temp_emails e ON m.temp_email_id = e.id
        WHERE e.user_id = ? AND m.verification_code IS NOT NULL
      `).bind(userId).first()

      return successResponse({
        status: statusConfig?.config_value || 'stopped',
        last_check_at: lastCheckConfig?.config_value || null,
        total_emails: emailCount?.count || 0,
        total_messages: messageCount?.count || 0,
        verification_codes_extracted: codeCount?.count || 0
      })
    } catch (error) {
      console.error('Get monitor status error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /toggle - 启动/停止监控
  if (path === '/toggle' && method === 'POST') {
    try {
      const body = await request.json()
      const action = body.action // 'start' or 'stop'

      if (!['start', 'stop'].includes(action)) {
        return errorResponse('Invalid action. Must be "start" or "stop"', 400)
      }

      const newStatus = action === 'start' ? 'running' : 'stopped'

      // 更新配置
      await env.DB.prepare(`
        INSERT OR REPLACE INTO config (config_key, config_value, updated_at)
        VALUES ('monitor_status', ?, datetime('now'))
      `).bind(newStatus).run()

      if (action === 'start') {
        // 更新最后检查时间
        await env.DB.prepare(`
          INSERT OR REPLACE INTO config (config_key, config_value, updated_at)
          VALUES ('last_check_time', ?, datetime('now'))
        `).bind(new Date().toISOString()).run()
      }

      return successResponse({
        status: newStatus
      })
    } catch (error) {
      console.error('Toggle monitor error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /stats - 获取系统统计数据
  if (path === '/stats' && method === 'GET') {
    try {
      // 获取总邮件数
      const totalMessages = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM messages
      `).first()

      // 获取未读邮件数
      const unreadMessages = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM messages WHERE is_read = 0
      `).first()

      // 获取今日邮件数
      const todayMessages = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE date(created_at) = date('now')
      `).first()

      // 获取活跃邮箱数
      const activeEmails = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM temp_emails WHERE status = 'active'
      `).first()

      // 获取总用户数（通过 user_id 去重）
      const totalUsers = await env.DB.prepare(`
        SELECT COUNT(DISTINCT user_id) as count FROM temp_emails
      `).first()

      // 获取今日新用户数
      const todayUsers = await env.DB.prepare(`
        SELECT COUNT(DISTINCT user_id) as count FROM temp_emails 
        WHERE date(created_at) = date('now')
      `).first()

      // 获取登录方式统计
      const loginMethods = await env.DB.prepare(`
        SELECT provider, COUNT(*) as count 
        FROM login_events 
        GROUP BY provider
      `).all()

      const loginMethodsObj = {}
      if (loginMethods.results) {
        loginMethods.results.forEach(row => {
          loginMethodsObj[row.provider] = row.count
        })
      }

      // 获取邮件来源分布（按发件人域名统计）
      const emailSources = await env.DB.prepare(`
        SELECT 
          CASE 
            WHEN sender LIKE '%@gmail.com' THEN 'gmail.com'
            WHEN sender LIKE '%@qq.com' THEN 'qq.com'
            WHEN sender LIKE '%@163.com' THEN '163.com'
            WHEN sender LIKE '%@outlook.com' THEN 'outlook.com'
            WHEN sender LIKE '%@yahoo.com' THEN 'yahoo.com'
            ELSE SUBSTR(sender, INSTR(sender, '@') + 1)
          END as domain,
          COUNT(*) as count
        FROM messages
        WHERE sender IS NOT NULL
        GROUP BY domain
        ORDER BY count DESC
        LIMIT 10
      `).all()

      const emailSourcesObj = {}
      if (emailSources.results) {
        emailSources.results.forEach(row => {
          emailSourcesObj[row.domain] = row.count
        })
      }

      // 获取用户增长趋势（最近7天）
      const userGrowth = await env.DB.prepare(`
        SELECT 
          date(created_at) as date,
          COUNT(DISTINCT user_id) as count
        FROM temp_emails
        WHERE date(created_at) >= date('now', '-6 days')
        GROUP BY date(created_at)
        ORDER BY date(created_at)
      `).all()

      const userGrowthArray = []
      if (userGrowth.results) {
        userGrowth.results.forEach(row => {
          userGrowthArray.push({
            date: row.date,
            count: row.count
          })
        })
      }

      // 获取邮件增长趋势（最近7天，接收）
      const emailReceived = await env.DB.prepare(`
        SELECT 
          date(received_at) as date,
          COUNT(*) as count
        FROM messages
        WHERE date(received_at) >= date('now', '-6 days')
        GROUP BY date(received_at)
        ORDER BY date(received_at)
      `).all()

      const emailReceivedMap = {}
      if (emailReceived.results) {
        emailReceived.results.forEach(row => {
          emailReceivedMap[row.date] = row.count
        })
      }

      // 获取邮件增长趋势（最近7天，发送）
      const emailSent = await env.DB.prepare(`
        SELECT 
          date(sent_at) as date,
          COUNT(*) as count
        FROM sent_emails
        WHERE date(sent_at) >= date('now', '-6 days')
        GROUP BY date(sent_at)
        ORDER BY date(sent_at)
      `).all()

      const emailSentMap = {}
      if (emailSent.results) {
        emailSent.results.forEach(row => {
          emailSentMap[row.date] = row.count
        })
      }

      // 合并接收和发送数据
      const emailGrowthArray = []
      const dates = new Set([...Object.keys(emailReceivedMap), ...Object.keys(emailSentMap)])
      dates.forEach(date => {
        emailGrowthArray.push({
          date: date,
          received: emailReceivedMap[date] || 0,
          sent: emailSentMap[date] || 0
        })
      })
      emailGrowthArray.sort((a, b) => a.date.localeCompare(b.date))

      // API调用趋势（模拟数据，可以后续从日志中统计）
      const apiCallsArray = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        // 模拟数据：根据邮件数量估算API调用
        const callCount = (emailReceivedMap[dateStr] || 0) * 3 + Math.floor(Math.random() * 50)
        apiCallsArray.push({
          date: dateStr,
          count: callCount
        })
      }

      return successResponse({
        totalMessages: totalMessages?.count || 0,
        unreadMessages: unreadMessages?.count || 0,
        todayMessages: todayMessages?.count || 0,
        activeEmails: activeEmails?.count || 0,
        totalUsers: totalUsers?.count || 0,
        todayUsers: todayUsers?.count || 0,
        loginMethods: loginMethodsObj,
        emailSources: emailSourcesObj,
        userGrowth: userGrowthArray,
        emailGrowth: emailGrowthArray,
        apiCalls: apiCallsArray,
        lastUpdate: new Date().toISOString()
      })
    } catch (error) {
      console.error('Get stats error:', error)
      return errorResponse(error.message)
    }
  }

  // DELETE /login-events/:provider - 清除特定provider的登录事件记录
  if (path.match(/^\/login-events\/(.+)$/) && method === 'DELETE') {
    try {
      const provider = path.split('/')[2]
      
      if (!provider) {
        return errorResponse('Provider参数缺失', 400)
      }

      // 删除指定provider的登录事件
      const result = await env.DB.prepare(`
        DELETE FROM login_events WHERE provider = ?
      `).bind(provider).run()

      console.log(`🗑️ 已清除 ${provider} 登录事件记录`)

      return successResponse({
        message: '登录事件记录已清除',
        provider: provider,
        deleted: result.meta?.changes || 0
      })
    } catch (error) {
      console.error('Delete login events error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /quota/toggle - 切换邮件服务商启用/禁用状态
  if (path === '/quota/toggle' && method === 'POST') {
    try {
      const body = await request.json()
      const { service, disabled } = body

      if (!service) {
        return errorResponse('Missing service name', 400)
      }

      // 标准化服务名称（处理 SMTP2GO 的特殊情况）
      const normalizedService = service.toLowerCase().replace(/[^a-z0-9]/g, '')
      const configKey = `email_service_${normalizedService}_disabled`

      console.log(`🔧 Toggle service: ${service} -> ${normalizedService}, disabled: ${disabled}`)

      // 保存到数据库
      await env.DB.prepare(`
        INSERT OR REPLACE INTO config (config_key, config_value, updated_at)
        VALUES (?, ?, datetime('now'))
      `).bind(configKey, disabled ? '1' : '0').run()

      return successResponse({
        service,
        disabled,
        message: disabled ? `${service} 已禁用` : `${service} 已启用`
      })
    } catch (error) {
      console.error('Toggle service error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /quota/disabled - 获取被禁用的服务商列表
  if (path === '/quota/disabled' && method === 'GET') {
    try {
      const configs = await env.DB.prepare(`
        SELECT config_key, config_value FROM config
        WHERE config_key LIKE 'email_service_%_disabled'
        AND config_value = '1'
      `).all()

      const serviceNameMap = {
        'brevo': 'Brevo',
        'smtp2go': 'SMTP2GO',
        'resend': 'Resend'
      }

      const disabledServices = configs.results.map(row => {
        // 从 'email_service_brevo_disabled' 提取 'brevo'
        const match = row.config_key.match(/email_service_(.+)_disabled/)
        if (match) {
          const serviceName = match[1]
          return serviceNameMap[serviceName] || serviceName.charAt(0).toUpperCase() + serviceName.slice(1)
        }
        return null
      }).filter(Boolean)

      return successResponse(disabledServices)
    } catch (error) {
      console.error('Get disabled services error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /quota - 获取邮件服务商额度信息
  if (path === '/quota' && method === 'GET') {
    try {
      // 从数据库加载邮件服务配置
      // 使用统一配置管理器加载配置
      const envWithConfig = await ConfigManager.createEnhancedEnv(env)

      // 获取所有服务商的额度信息
      const quotaData = await getAllEmailQuotas(envWithConfig)

      return successResponse(quotaData)
    } catch (error) {
      console.error('Get email quota error:', error)
      return errorResponse(error.message)
    }
  }

  return errorResponse('Not found', 404)
}

