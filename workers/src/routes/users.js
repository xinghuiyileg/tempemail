/**
 * 用户管理 API 路由（仅管理员）
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

export default async function usersRoutes(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/users', '')
  const method = request.method

  // 验证管理员权限
  const { isAdmin, error } = await verifyAdminPermission(request, env)
  if (!isAdmin) {
    return error
  }

  // GET /list - 获取所有注册用户列表
  if (path === '/list' && method === 'GET') {
    try {
      const page = parseInt(url.searchParams.get('page')) || 1
      const limit = parseInt(url.searchParams.get('limit')) || 20
      const offset = (page - 1) * limit

      // 获取用户总数
      const totalResult = await env.DB.prepare(`
        SELECT COUNT(*) as total FROM users
      `).first()

      // 获取用户列表，关联统计临时邮箱数量
      const users = await env.DB.prepare(`
        SELECT
          u.id,
          u.username,
          u.created_at,
          COALESCE(u.role, 'user') as role,
          COALESCE(u.status, 'normal') as status,
          COUNT(DISTINCT te.id) as email_count,
          COUNT(DISTINCT m.id) as message_count
        FROM users u
        LEFT JOIN temp_emails te ON te.user_id = ('account_' || u.id || '_' || u.username)
        LEFT JOIN messages m ON m.temp_email_id = te.id
        GROUP BY u.id, u.username, u.created_at, u.role, u.status
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all()

      return successResponse({
        users: users.results || [],
        total: totalResult?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((totalResult?.total || 0) / limit)
      })
    } catch (error) {
      console.error('Get users error:', error)
      return errorResponse(error.message)
    }
  }

  // GET /:id - 获取单个用户详情
  if (path.match(/^\/\d+$/) && method === 'GET') {
    try {
      const userId = parseInt(path.substring(1))

      const user = await env.DB.prepare(`
        SELECT id, username, created_at FROM users WHERE id = ?
      `).bind(userId).first()

      if (!user) {
        return errorResponse('用户不存在', 404)
      }

      // 构建用户ID
      const userIdStr = `account_${user.id}_${user.username}`

      // 获取用户的邮箱列表
      const emails = await env.DB.prepare(`
        SELECT id, email, status, created_at
        FROM temp_emails
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(userIdStr).all()

      // 获取统计信息
      const stats = await env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT te.id) as email_count,
          COUNT(DISTINCT m.id) as message_count,
          COUNT(DISTINCT se.id) as sent_count
        FROM temp_emails te
        LEFT JOIN messages m ON m.temp_email_id = te.id
        LEFT JOIN sent_emails se ON se.temp_email_id = te.id
        WHERE te.user_id = ?
      `).bind(userIdStr).first()

      return successResponse({
        user: {
          id: user.id,
          username: user.username,
          userId: userIdStr,
          created_at: user.created_at,
          email_count: stats?.email_count || 0,
          message_count: stats?.message_count || 0,
          sent_count: stats?.sent_count || 0
        },
        emails: emails.results || []
      })
    } catch (error) {
      console.error('Get user detail error:', error)
      return errorResponse(error.message)
    }
  }

  // DELETE /:id - 删除用户（同时删除所有相关数据）
  if (path.match(/^\/\d+$/) && method === 'DELETE') {
    try {
      const userId = parseInt(path.substring(1))

      const user = await env.DB.prepare(`
        SELECT id, username FROM users WHERE id = ?
      `).bind(userId).first()

      if (!user) {
        return errorResponse('用户不存在', 404)
      }

      const userIdStr = `account_${user.id}_${user.username}`

      // 1. 删除用户的所有消息（通过临时邮箱关联）
      await env.DB.prepare(`
        DELETE FROM messages 
        WHERE temp_email_id IN (
          SELECT id FROM temp_emails WHERE user_id = ?
        )
      `).bind(userIdStr).run()

      // 2. 删除用户的发送记录
      await env.DB.prepare(`
        DELETE FROM sent_emails
        WHERE temp_email_id IN (
          SELECT id FROM temp_emails WHERE user_id = ?
        )
      `).bind(userIdStr).run()

      // 3. 删除用户的临时邮箱
      await env.DB.prepare(`
        DELETE FROM temp_emails WHERE user_id = ?
      `).bind(userIdStr).run()

      // 4. 删除用户账号
      await env.DB.prepare(`
        DELETE FROM users WHERE id = ?
      `).bind(userId).run()

      console.log(`✅ 已删除用户: ${user.username} (ID: ${userId})`)

      return successResponse({
        message: '用户及所有相关数据已删除',
        username: user.username
      })
    } catch (error) {
      console.error('Delete user error:', error)
      return errorResponse(error.message)
    }
  }

  // PUT /:id/reset-password - 重置用户密码
  if (path.match(/^\/\d+\/reset-password$/) && method === 'PUT') {
    try {
      const userId = parseInt(path.split('/')[1])
      const { newPassword } = await request.json()

      if (!newPassword) {
        return errorResponse('新密码不能为空', 400)
      }

      const user = await env.DB.prepare(`
        SELECT username FROM users WHERE id = ?
      `).bind(userId).first()

      if (!user) {
        return errorResponse('用户不存在', 404)
      }

      // 更新密码（简单hash）
      const hashedPassword = `hash_${newPassword}_${Date.now()}`
      await env.DB.prepare(`
        UPDATE users SET password = ? WHERE id = ?
      `).bind(hashedPassword, userId).run()

      console.log(`✅ 已重置用户密码: ${user.username}`)

      return successResponse({
        message: '密码已重置',
        username: user.username
      })
    } catch (error) {
      console.error('Reset password error:', error)
      return errorResponse(error.message)
    }
  }

  // PUT /:id/role - 修改用户角色
  if (path.match(/^\/\d+\/role$/) && method === 'PUT') {
    try {
      const userId = parseInt(path.split('/')[1])
      const { role } = await request.json()

      if (!role || !['admin', 'user'].includes(role)) {
        return errorResponse('角色必须是 admin 或 user', 400)
      }

      const user = await env.DB.prepare(`
        SELECT id, username FROM users WHERE id = ?
      `).bind(userId).first()

      if (!user) {
        return errorResponse('用户不存在', 404)
      }

      // 更新角色
      await env.DB.prepare(`
        UPDATE users SET role = ? WHERE id = ?
      `).bind(role, userId).run()

      console.log(`✅ 已修改用户角色: ${user.username} -> ${role}`)

      return successResponse({
        message: '角色已更新',
        username: user.username,
        role: role
      })
    } catch (error) {
      console.error('Update role error:', error)
      return errorResponse(error.message)
    }
  }

  // PUT /:id/status - 修改用户状态
  if (path.match(/^\/\d+\/status$/) && method === 'PUT') {
    try {
      const userId = parseInt(path.split('/')[1])
      const { status } = await request.json()

      if (!status || !['normal', 'banned'].includes(status)) {
        return errorResponse('状态必须是 normal 或 banned', 400)
      }

      const user = await env.DB.prepare(`
        SELECT id, username FROM users WHERE id = ?
      `).bind(userId).first()

      if (!user) {
        return errorResponse('用户不存在', 404)
      }

      // 更新状态
      await env.DB.prepare(`
        UPDATE users SET status = ? WHERE id = ?
      `).bind(status, userId).run()

      console.log(`✅ 已修改用户状态: ${user.username} -> ${status}`)

      return successResponse({
        message: '状态已更新',
        username: user.username,
        status: status
      })
    } catch (error) {
      console.error('Update status error:', error)
      return errorResponse(error.message)
    }
  }

  return errorResponse('Not found', 404)
}

