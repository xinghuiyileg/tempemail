/**
 * 数据备份与恢复 API 路由（仅管理员）
 */

import { successResponse, errorResponse } from '../utils/cors.js'

/**
 * 验证管理员权限
 * 支持两种方式：
 * 1. 访问密码登录（token === ACCESS_PASSWORD）
 * 2. 账号登录且角色为 admin（token格式：account_username_timestamp）
 */
async function verifyAdminPermission(request, env) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    return { isAdmin: false, error: errorResponse('需要管理员权限', 403) }
  }

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const configPassword = env.ACCESS_PASSWORD

  // 1. 验证访问密码登录
  if (token === configPassword) {
    return { isAdmin: true, error: null }
  }

  // 2. 验证账号登录且角色为admin
  if (token.startsWith('account_')) {
    const parts = token.split('_')
    if (parts.length === 3 && parts[0] === 'account') {
      const username = parts[1]

      // 查询用户角色
      try {
        const user = await env.DB.prepare(`
          SELECT COALESCE(role, 'user') as role
          FROM users
          WHERE username = ?
        `).bind(username).first()

        if (user && user.role === 'admin') {
          return { isAdmin: true, error: null }
        }
      } catch (error) {
        console.error('Error checking user role:', error)
      }
    }
  }

  return { isAdmin: false, error: errorResponse('需要管理员权限', 403) }
}

export default async function backupRoutes(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/backup', '')
  const method = request.method

  // 验证管理员权限
  const { isAdmin, error } = await verifyAdminPermission(request, env)
  if (!isAdmin) {
    return error
  }

  // POST /create - 创建数据库备份
  if (path === '/create' && method === 'POST') {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupData = {
        version: '1.0',
        timestamp: timestamp,
        created_at: new Date().toISOString(),
        tables: {}
      }

      // 备份 temp_emails 表
      const tempEmails = await env.DB.prepare(`
        SELECT * FROM temp_emails ORDER BY id
      `).all()
      backupData.tables.temp_emails = {
        count: tempEmails.results.length,
        data: tempEmails.results
      }

      // 备份 messages 表
      const messages = await env.DB.prepare(`
        SELECT * FROM messages ORDER BY id
      `).all()
      backupData.tables.messages = {
        count: messages.results.length,
        data: messages.results
      }

      // 备份 sent_emails 表
      const sentEmails = await env.DB.prepare(`
        SELECT * FROM sent_emails ORDER BY id
      `).all()
      backupData.tables.sent_emails = {
        count: sentEmails.results.length,
        data: sentEmails.results
      }

      // 备份 users 表
      const users = await env.DB.prepare(`
        SELECT * FROM users ORDER BY id
      `).all()
      backupData.tables.users = {
        count: users.results.length,
        data: users.results
      }

      // 备份 login_events 表
      const loginEvents = await env.DB.prepare(`
        SELECT * FROM login_events ORDER BY id
      `).all()
      backupData.tables.login_events = {
        count: loginEvents.results.length,
        data: loginEvents.results
      }

      // 备份 config 表
      const config = await env.DB.prepare(`
        SELECT * FROM config ORDER BY id
      `).all()
      backupData.tables.config = {
        count: config.results.length,
        data: config.results
      }

      // 计算总统计
      const totalRecords = Object.values(backupData.tables).reduce((sum, table) => sum + table.count, 0)
      
      console.log(`✅ 备份创建成功: ${timestamp}, 总记录数: ${totalRecords}`)

      // 如果配置了 R2，保存到 R2
      if (env.BACKUP_BUCKET) {
        try {
          const backupKey = `backup-${timestamp}.json`
          await env.BACKUP_BUCKET.put(backupKey, JSON.stringify(backupData, null, 2))
          console.log(`✅ 备份已保存到 R2: ${backupKey}`)
        } catch (r2Error) {
          console.warn('保存到 R2 失败:', r2Error)
        }
      }

      return successResponse({
        message: '备份创建成功',
        backup: {
          timestamp,
          totalRecords,
          tables: Object.entries(backupData.tables).reduce((acc, [name, data]) => {
            acc[name] = data.count
            return acc
          }, {})
        },
        downloadUrl: `/api/backup/download?timestamp=${timestamp}`
      })
    } catch (error) {
      console.error('Create backup error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /download - 下载备份文件
  if (path === '/download' && method === 'GET') {
    try {
      const timestamp = url.searchParams.get('timestamp')
      
      if (!timestamp) {
        return errorResponse('缺少 timestamp 参数', 400)
      }

      // 重新生成备份数据
      const backupData = {
        version: '1.0',
        timestamp: timestamp,
        created_at: new Date().toISOString(),
        tables: {}
      }

      // 导出所有表数据
      const tables = ['temp_emails', 'messages', 'sent_emails', 'users', 'login_events', 'config']
      
      for (const tableName of tables) {
        try {
          const result = await env.DB.prepare(`SELECT * FROM ${tableName} ORDER BY id`).all()
          backupData.tables[tableName] = {
            count: result.results.length,
            data: result.results
          }
        } catch (err) {
          console.warn(`导出表 ${tableName} 失败:`, err)
          backupData.tables[tableName] = { count: 0, data: [] }
        }
      }

      const jsonData = JSON.stringify(backupData, null, 2)
      
      return new Response(jsonData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="tempemail-backup-${timestamp}.json"`,
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch (error) {
      console.error('Download backup error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /list - 获取备份列表
  if (path === '/list' && method === 'GET') {
    try {
      // 如果配置了 R2，从 R2 获取列表
      if (env.BACKUP_BUCKET) {
        const list = await env.BACKUP_BUCKET.list({ prefix: 'backup-' })
        const backups = list.objects.map(obj => ({
          key: obj.key,
          timestamp: obj.key.replace('backup-', '').replace('.json', ''),
          size: obj.size,
          uploaded: obj.uploaded
        }))

        return successResponse({
          backups,
          total: backups.length
        })
      } else {
        return successResponse({
          message: 'R2 存储未配置，仅支持手动备份下载',
          backups: [],
          total: 0
        })
      }
    } catch (error) {
      console.error('List backups error:', error)
      return errorResponse(error.message)
    }
  }

  // POST /restore - 恢复备份（危险操作）
  if (path === '/restore' && method === 'POST') {
    try {
      const { backupData, clearExisting } = await request.json()

      if (!backupData || !backupData.tables) {
        return errorResponse('备份数据格式错误', 400)
      }

      let restoredRecords = 0

      // 如果需要清除现有数据
      if (clearExisting) {
        console.log('⚠️ 清除现有数据...')
        await env.DB.prepare('DELETE FROM messages').run()
        await env.DB.prepare('DELETE FROM sent_emails').run()
        await env.DB.prepare('DELETE FROM login_events').run()
        await env.DB.prepare('DELETE FROM temp_emails').run()
        await env.DB.prepare('DELETE FROM users').run()
        console.log('✅ 现有数据已清除')
      }

      // 恢复 users 表（先恢复，因为其他表可能依赖）
      if (backupData.tables.users && backupData.tables.users.data.length > 0) {
        for (const row of backupData.tables.users.data) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO users (id, username, password, created_at)
            VALUES (?, ?, ?, ?)
          `).bind(row.id, row.username, row.password, row.created_at).run()
          restoredRecords++
        }
        console.log(`✅ 恢复 users 表: ${backupData.tables.users.data.length} 条`)
      }

      // 恢复 temp_emails 表
      if (backupData.tables.temp_emails && backupData.tables.temp_emails.data.length > 0) {
        for (const row of backupData.tables.temp_emails.data) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO temp_emails 
            (id, user_id, email, cloudflare_rule_id, target_email, created_at, last_received_at, message_count, status, is_starred)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            row.id, row.user_id, row.email, row.cloudflare_rule_id, 
            row.target_email, row.created_at, row.last_received_at, 
            row.message_count, row.status, row.is_starred || 0
          ).run()
          restoredRecords++
        }
        console.log(`✅ 恢复 temp_emails 表: ${backupData.tables.temp_emails.data.length} 条`)
      }

      // 恢复 messages 表
      if (backupData.tables.messages && backupData.tables.messages.data.length > 0) {
        for (const row of backupData.tables.messages.data) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO messages 
            (id, temp_email_id, message_id, sender, subject, body_text, body_html, verification_code, received_at, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            row.id, row.temp_email_id, row.message_id, row.sender,
            row.subject, row.body_text, row.body_html, row.verification_code,
            row.received_at, row.is_read, row.created_at
          ).run()
          restoredRecords++
        }
        console.log(`✅ 恢复 messages 表: ${backupData.tables.messages.data.length} 条`)
      }

      // 恢复 sent_emails 表
      if (backupData.tables.sent_emails && backupData.tables.sent_emails.data.length > 0) {
        for (const row of backupData.tables.sent_emails.data) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO sent_emails 
            (id, temp_email_id, recipient, subject, body, sent_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            row.id, row.temp_email_id, row.recipient, 
            row.subject, row.body, row.sent_at
          ).run()
          restoredRecords++
        }
        console.log(`✅ 恢复 sent_emails 表: ${backupData.tables.sent_emails.data.length} 条`)
      }

      // 恢复 login_events 表
      if (backupData.tables.login_events && backupData.tables.login_events.data.length > 0) {
        for (const row of backupData.tables.login_events.data) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO login_events (id, provider, created_at)
            VALUES (?, ?, ?)
          `).bind(row.id, row.provider, row.created_at).run()
          restoredRecords++
        }
        console.log(`✅ 恢复 login_events 表: ${backupData.tables.login_events.data.length} 条`)
      }

      // 恢复 config 表
      if (backupData.tables.config && backupData.tables.config.data.length > 0) {
        for (const row of backupData.tables.config.data) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO config (id, key, value, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `).bind(row.id, row.key, row.value, row.created_at, row.updated_at).run()
          restoredRecords++
        }
        console.log(`✅ 恢复 config 表: ${backupData.tables.config.data.length} 条`)
      }

      console.log(`✅ 备份恢复完成，总共恢复 ${restoredRecords} 条记录`)

      return successResponse({
        message: '备份恢复成功',
        restoredRecords,
        tables: Object.entries(backupData.tables).reduce((acc, [name, data]) => {
          acc[name] = data.count
          return acc
        }, {})
      })
    } catch (error) {
      console.error('Restore backup error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /stats - 获取数据库统计
  if (path === '/stats' && method === 'GET') {
    try {
      const stats = {}

      // 统计各表记录数
      const tables = ['temp_emails', 'messages', 'sent_emails', 'users', 'login_events', 'config']
      
      for (const tableName of tables) {
        try {
          const result = await env.DB.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).first()
          stats[tableName] = result.count
        } catch (err) {
          stats[tableName] = 0
        }
      }

      stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0)

      return successResponse({
        stats,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Get stats error:', error)
      return errorResponse(error.message)
    }
  }

  return errorResponse('Not found', 404)
}

