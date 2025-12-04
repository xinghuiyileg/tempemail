import { successResponse, errorResponse } from '../utils/cors'
import { requireAdmin, hasAdminAccess, isAdminEnabled } from '../middleware/admin'
import { ConfigValidator, ConfigTester } from '../utils/configValidator'
import ConfigManager, { CONFIG_KEYS } from '../utils/configManager'

export default async function configRoutes(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  // GET / - 获取配置
  if (path === '/' && method === 'GET') {
    try {
      // 使用 ConfigManager 获取所有配置（包括数据库和环境变量）
      const configMap = await ConfigManager.getAll(env, false) // 不包括仅环境变量的配置
      const isAdmin = hasAdminAccess(request, env) // 检查是否为管理员
      
      // 对配置进行脱敏处理
      const processedConfig = {}
      for (const [key, value] of Object.entries(configMap)) {
        let processedValue = value
        
        // 非管理员访问时，敏感信息脱敏
        if (!isAdmin && value) {
          if (key.includes('password') || key.includes('token') || key.includes('api_key')) {
            processedValue = '***'
          } else if (key.includes('account_id') || key.includes('zone_id')) {
            processedValue = value.substring(0, 8) + '***'
          } else if (key === 'target_qq_email') {
            // 部分隐藏邮箱
            const parts = value.split('@')
            if (parts.length === 2) {
              const username = parts[0]
              const masked = username.length > 3 ? username.substring(0, 3) + '***' : '***'
              processedValue = masked + '@' + parts[1]
            }
          }
        }
        
        processedConfig[key] = processedValue
      }
      
      // 获取配置来源信息（仅管理员可见）
      const configSources = {}
      if (isAdmin) {
        for (const key of Object.keys(configMap)) {
          configSources[key] = await ConfigManager.getSource(key, env)
        }
      }

      return successResponse({
        config: processedConfig,
        sources: configSources, // 配置来源：database, env, default, none
        isAdmin,
        adminEnabled: isAdminEnabled(env)
      })
    } catch (error) {
      console.error('Get config error:', error)
      return errorResponse(error.message)
    }
  }

  // PUT / - 更新配置（仅管理员）
  if (path === '/' && method === 'PUT') {
    // 验证管理员权限
    const adminError = requireAdmin(request, env)
    if (adminError) {
      return adminError
    }

    try {
      const body = await request.json()

      // 允许更新的配置项
      const allowedKeys = [
        'cloudflare_api_token',
        'cloudflare_account_id',
        'cloudflare_zone_id',
        'domain_name',
        'target_qq_email',
        'qq_imap_password',
        'monitor_interval',
        'auto_delete_days',
        // 邮件服务商 API Keys
        'resend_api_key',
        'resend_verified_domain',
        'brevo_api_key',
        'smtp2go_api_key'
      ]

      let updatedCount = 0
      for (const [key, value] of Object.entries(body)) {
        if (allowedKeys.includes(key)) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO config (config_key, config_value, updated_at)
            VALUES (?, ?, datetime('now'))
          `).bind(key, value).run()
          updatedCount++
        }
      }

      console.log(`Admin updated ${updatedCount} config items`)
      return successResponse({ 
        updated: true,
        count: updatedCount
      })
    } catch (error) {
      console.error('Update config error:', error)
      return errorResponse(error.message)
    }
  }

  // POST / - 更新配置（兼容 POST 方法）
  if (path === '/' && method === 'POST') {
    // 验证管理员权限
    const adminError = requireAdmin(request, env)
    if (adminError) {
      return adminError
    }

    try {
      const body = await request.json()

      // 允许更新的配置项
      const allowedKeys = [
        'cloudflare_api_token',
        'cloudflare_account_id',
        'cloudflare_zone_id',
        'domain_name',
        'target_qq_email',
        'qq_imap_password',
        'monitor_interval',
        'auto_delete_days',
        // 邮件服务商 API Keys
        'resend_api_key',
        'resend_verified_domain',
        'brevo_api_key',
        'smtp2go_api_key'
      ]

      let updatedCount = 0
      for (const [key, value] of Object.entries(body)) {
        if (allowedKeys.includes(key)) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO config (config_key, config_value, updated_at)
            VALUES (?, ?, datetime('now'))
          `).bind(key, value).run()
          updatedCount++
        }
      }

      console.log(`Admin updated ${updatedCount} config items`)
      return successResponse({ 
        updated: true,
        count: updatedCount
      })
    } catch (error) {
      console.error('Update config error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /validate - 验证配置
  if (path === '/validate' && method === 'POST') {
    try {
      // 获取数据库配置
      const configs = await env.DB.prepare(`
        SELECT config_key, config_value FROM config
      `).all()

      const dbConfig = {}
      for (const config of configs.results || []) {
        dbConfig[config.config_key] = config.config_value
      }

      // 执行验证
      const validation = await ConfigValidator.validateAll(env, dbConfig)

      return successResponse({
        validation,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Validate config error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /test - 测试配置连接
  if (path === '/test' && method === 'POST') {
    // 验证管理员权限
    const adminError = requireAdmin(request, env)
    if (adminError) {
      return adminError
    }

    try {
      const body = await request.json()
      const { service, ...params } = body

      let result

      switch (service) {
        case 'cloudflare':
          result = await ConfigTester.testCloudflareApi(
            params.token || env.CLOUDFLARE_API_TOKEN,
            params.accountId || env.CLOUDFLARE_ACCOUNT_ID,
            params.zoneId || env.CLOUDFLARE_ZONE_ID
          )
          break

        case 'tempmailapi':
          result = await ConfigTester.testTempMailApi(
            params.apiKey || env.TEMPMAILAPI_KEY
          )
          break

        case 'database':
          result = await ConfigTester.testDatabase(env.DB)
          break

        default:
          return errorResponse('Unknown service type')
      }

      return successResponse({
        service,
        result,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Test config error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /export - 导出配置
  if (path === '/export' && method === 'GET') {
    // 验证管理员权限
    const adminError = requireAdmin(request, env)
    if (adminError) {
      return adminError
    }

    try {
      // 获取数据库配置
      const configs = await env.DB.prepare(`
        SELECT config_key, config_value, updated_at FROM config
      `).all()

      const configMap = {}
      for (const config of configs.results || []) {
        configMap[config.config_key] = config.config_value
      }

      // 构建导出数据
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        config: {
          // 基础配置
          domain_name: configMap.domain_name || env.DOMAIN_NAME || '',
          target_qq_email: configMap.target_qq_email || '',
          monitor_interval: configMap.monitor_interval || '10',
          auto_delete_days: configMap.auto_delete_days || '7',
          
          // Cloudflare 配置
          cloudflare_api_token: configMap.cloudflare_api_token || '',
          cloudflare_account_id: configMap.cloudflare_account_id || '',
          cloudflare_zone_id: configMap.cloudflare_zone_id || '',
          
          // 邮件服务商配置
          resend_api_key: configMap.resend_api_key || '',
          resend_verified_domain: configMap.resend_verified_domain || '',
          brevo_api_key: configMap.brevo_api_key || '',
          smtp2go_api_key: configMap.smtp2go_api_key || ''
        },
        // 环境变量配置（只读）
        environment: {
          domain_name: env.DOMAIN_NAME || '',
          has_admin_password: !!env.ADMIN_PASSWORD,
          has_tempmailapi_key: !!env.TEMPMAILAPI_KEY
        }
      }

      return new Response(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="tempemail-config-${Date.now()}.json"`,
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      console.error('Export config error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /import - 导入配置
  if (path === '/import' && method === 'POST') {
    // 验证管理员权限
    const adminError = requireAdmin(request, env)
    if (adminError) {
      return adminError
    }

    try {
      const body = await request.json()

      if (!body.config) {
        return errorResponse('Invalid config format')
      }

      // 允许导入的配置项
      const allowedKeys = [
        'cloudflare_api_token',
        'cloudflare_account_id',
        'cloudflare_zone_id',
        'domain_name',
        'target_qq_email',
        'qq_imap_password',
        'monitor_interval',
        'auto_delete_days',
        'resend_api_key',
        'resend_verified_domain',
        'brevo_api_key',
        'smtp2go_api_key'
      ]

      let importedCount = 0
      const skipped = []

      for (const [key, value] of Object.entries(body.config)) {
        if (allowedKeys.includes(key) && value) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO config (config_key, config_value, updated_at)
            VALUES (?, ?, datetime('now'))
          `).bind(key, value).run()
          importedCount++
        } else {
          skipped.push(key)
        }
      }

      console.log(`Admin imported ${importedCount} config items`)
      return successResponse({
        imported: true,
        count: importedCount,
        skipped,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Import config error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /system - 获取系统信息
  if (path === '/system' && method === 'GET') {
    try {
      const isAdmin = hasAdminAccess(request, env)

      // 获取数据库统计
      const stats = {}
      
      if (env.DB) {
        try {
          const emailCount = await env.DB.prepare('SELECT COUNT(*) as count FROM temp_emails').first()
          const messageCount = await env.DB.prepare('SELECT COUNT(*) as count FROM messages').first()
          const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
          
          stats.emails = emailCount?.count || 0
          stats.messages = messageCount?.count || 0
          stats.users = userCount?.count || 0
        } catch (e) {
          console.warn('Failed to get stats:', e.message)
        }
      }

      return successResponse({
        system: {
          version: '1.0.0',
          deployment: 'Cloudflare Workers',
          database: env.DB ? 'D1 Connected' : 'Not Connected',
          features: {
            admin: isAdminEnabled(env),
            tempmailApi: !!env.TEMPMAILAPI_KEY,
            emailRouting: true
          }
        },
        stats: isAdmin ? stats : {},
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Get system info error:', error)
      return errorResponse(error.message)
    }
  }

  return errorResponse('Not found', 404)
}

