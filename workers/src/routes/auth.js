/**
 * 认证相关 API 路由
 */

import { successResponse, errorResponse } from '../utils/cors.js'
import { generateToken, isAuthEnabled } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import { refreshAccessToken, revokeToken } from '../services/tokenManager.js'
import { createCaptcha, CaptchaStore } from '../utils/captcha.js'
import { logAudit, AuditAction, getClientInfo } from '../services/auditLog.js'

export default async function authRoutes(request, env, ctx) {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/auth', '')
  const method = request.method

  // 创建验证码存储实例（传入数据库）
  const captchaStore = new CaptchaStore(env.DB)

  // GET /captcha - 生成验证码
  if (path === '/captcha' && method === 'GET') {
    try {
      // 清理过期验证码
      await captchaStore.cleanExpired()

      // 生成验证码
      const captcha = createCaptcha({
        size: 4, // 验证码长度
        noise: 2, // 干扰线条数
        color: true, // 彩色验证码
        width: 120,
        height: 40,
        fontSize: 28,
        charPreset: '0123456789' // 只使用数字
      })

      // 存储验证码并获取ID
      const captchaId = await captchaStore.set(captcha.text)

      console.log(`✅ 生成验证码: ${captchaId} = ${captcha.text}`)

      return successResponse({
        captchaId: captchaId,
        captchaSvg: captcha.data
      })
    } catch (error) {
      console.error('生成验证码失败:', error)
      return errorResponse('生成验证码失败', 500)
    }
  }

  // GET /check - 检查是否启用了访问控制
  if (path === '/check' && method === 'GET') {
    return successResponse({
      enabled: isAuthEnabled(env),
      message: isAuthEnabled(env) ? '访问控制已启用' : '访问控制未启用'
    })
  }

  // POST /login - 登录获取令牌
  if (path === '/login' && method === 'POST') {
    const { ip, userAgent } = getClientInfo(request)
    
    try {
      const { password } = await request.json()

      if (!password) {
        return errorResponse('密码不能为空', 400)
      }

      // 调试日志
      console.log('🔐 登录请求 - 输入密码:', password)
      console.log('🔐 配置密码:', env.ACCESS_PASSWORD)
      console.log('🔐 密码类型:', typeof password, typeof env.ACCESS_PASSWORD)
      console.log('🔐 密码长度:', password?.length, env.ACCESS_PASSWORD?.length)

      // 验证密码并生成令牌
      const tokenData = generateToken(password, env)

      if (!tokenData) {
        console.log('❌ 密码验证失败')
        
        // 记录登录失败
        await logAudit(env, {
          action: AuditAction.LOGIN_FAILED,
          userId: 'admin',
          details: { method: 'password' },
          ip,
          userAgent,
          success: false,
          errorMessage: '密码错误'
        })
        
        return errorResponse('密码错误', 401)
      }

      console.log('✅ 密码验证成功')

      // 记录密码登录事件到数据库
      try {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO login_events (provider, created_at)
          VALUES (?, datetime('now'))
        `).bind('password').run()
      } catch (dbError) {
        console.warn('Failed to record login event:', dbError)
      }

      // 访问密码登录使用固定的管理员用户ID
      const adminUserId = 'c7e7600a-475a-4220-8aed-282e8ef38784'

      // 记录登录成功
      await logAudit(env, {
        action: AuditAction.LOGIN_SUCCESS,
        userId: adminUserId,
        details: { method: 'password' },
        ip,
        userAgent,
        success: true
      })

      return successResponse({
        token: tokenData.token,
        expiresIn: tokenData.expiresIn,
        userId: adminUserId,  // 返回固定的管理员用户ID
        message: '登录成功'
      })
    } catch (error) {
      console.error('Login error:', error)
      return errorResponse('登录失败', 500)
    }
  }

  // POST /verify - 验证令牌有效性
  if (path === '/verify' && method === 'POST') {
    try {
      const { token } = await request.json()

      if (!token) {
        return errorResponse('令牌不能为空', 400)
      }

      let isValid = false

      // 1. 验证访问密码登录的token
      const configPassword = env.ACCESS_PASSWORD
      if (token === configPassword) {
        isValid = true
      }
      
      // 2. 验证账号登录的token（格式：account_username_timestamp）
      if (!isValid && token.startsWith('account_')) {
        // 账号登录的token格式验证
        const parts = token.split('_')
        if (parts.length === 3 && parts[0] === 'account') {
          // 简单验证：检查token格式正确且时间戳是有效的数字
          const timestamp = parseInt(parts[2])
          if (!isNaN(timestamp) && timestamp > 0) {
            // 可以添加token过期检查，这里暂时认为格式正确就有效
            isValid = true
          }
        }
      }
      
      // 3. 验证OAuth登录的token（格式：oauth_provider_timestamp）
      if (!isValid && token.startsWith('oauth_')) {
        const parts = token.split('_')
        if (parts.length === 3 && parts[0] === 'oauth') {
          const timestamp = parseInt(parts[2])
          if (!isNaN(timestamp) && timestamp > 0) {
            isValid = true
          }
        }
      }

      return successResponse({
        valid: isValid,
        message: isValid ? '令牌有效' : '令牌无效'
      })
    } catch (error) {
      console.error('Verify error:', error)
      return errorResponse('验证失败', 500)
    }
  }

  // POST /oauth - OAuth 登录（模拟）
  if (path === '/oauth' && method === 'POST') {
    try {
      const { provider } = await request.json()

      if (!provider) {
        return errorResponse('登录方式不能为空', 400)
      }

      console.log(`🔐 OAuth 登录请求 - 提供商: ${provider}`)

      // 模拟百度登录成功
      if (provider === 'baidu') {
        // 生成一个模拟令牌
        const token = `oauth_${provider}_${Date.now()}`
        
        // 记录登录事件到数据库
        try {
          await env.DB.prepare(`
            INSERT OR IGNORE INTO login_events (provider, created_at)
            VALUES (?, datetime('now'))
          `).bind(provider).run()
        } catch (dbError) {
          console.warn('Failed to record login event:', dbError)
        }

        console.log(`✅ ${provider} 登录成功`)

        return successResponse({
          token: token,
          expiresIn: 86400, // 24小时
          provider: provider,
          message: `${provider} 登录成功`
        })
      } else {
        return errorResponse('该登录方式暂未开放', 403)
      }
    } catch (error) {
      console.error('OAuth login error:', error)
      return errorResponse('OAuth 登录失败', 500)
    }
  }

  // POST /register - 注册账号
  if (path === '/register' && method === 'POST') {
    try {
      const { username, password, captchaId, captchaCode } = await request.json()

      if (!username || !password) {
        return errorResponse('用户名和密码不能为空', 400)
      }

      // 验证码验证
      if (!captchaId || !captchaCode) {
        return errorResponse('请输入验证码', 400)
      }

      if (!(await captchaStore.verify(captchaId, captchaCode))) {
        return errorResponse('验证码错误或已过期', 400)
      }

      // 用户名格式验证
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return errorResponse('用户名只能包含字母、数字、下划线，长度3-20', 400)
      }

      // 密码强度验证
      if (password.length < 6) {
        return errorResponse('密码长度至少6位', 400)
      }

      // 检查用户名是否已存在
      const existing = await env.DB.prepare(`
        SELECT id FROM users WHERE username = ?
      `).bind(username).first()

      if (existing) {
        return errorResponse('用户名已存在', 409)
      }

      // 使用bcrypt加密密码
      const hashedPassword = await bcrypt.hash(password, 10)

      // 创建用户
      await env.DB.prepare(`
        INSERT INTO users (username, password, created_at)
        VALUES (?, ?, datetime('now'))
      `).bind(username, hashedPassword).run()

      // 记录注册事件为账号登录
      try {
        await env.DB.prepare(`
          INSERT INTO login_events (provider, created_at)
          VALUES ('account', datetime('now'))
        `).run()
      } catch (dbError) {
        console.warn('Failed to record registration event:', dbError)
      }

      console.log(`✅ 用户注册成功: ${username}`)

      return successResponse({
        message: '注册成功'
      })
    } catch (error) {
      console.error('Register error:', error)
      return errorResponse('注册失败', 500)
    }
  }

  // POST /account-login - 账号登录
  if (path === '/account-login' && method === 'POST') {
    const { ip, userAgent } = getClientInfo(request)
    
    try {
      const { username, password, captchaId, captchaCode } = await request.json()

      if (!username || !password) {
        return errorResponse('用户名和密码不能为空', 400)
      }

      // 验证码验证
      if (!captchaId || !captchaCode) {
        return errorResponse('请输入验证码', 400)
      }

      if (!(await captchaStore.verify(captchaId, captchaCode))) {
        return errorResponse('验证码错误或已过期', 400)
      }

      // 查询用户（包含 role 和 status）
      const user = await env.DB.prepare(`
        SELECT
          id,
          username,
          password,
          COALESCE(role, 'user') as role,
          COALESCE(status, 'normal') as status
        FROM users
        WHERE username = ?
      `).bind(username).first()

      if (!user) {
        // 记录登录失败
        await logAudit(env, {
          action: AuditAction.LOGIN_FAILED,
          userId: username,
          details: { method: 'account', reason: 'user_not_found' },
          ip,
          userAgent,
          success: false,
          errorMessage: '用户不存在'
        })
        return errorResponse('用户名或密码错误', 401)
      }

      // 检查用户是否被封禁
      if (user.status === 'banned') {
        console.warn(`⛔ 封禁用户尝试登录: ${username}`)
        
        // 记录封禁用户登录尝试
        await logAudit(env, {
          action: AuditAction.LOGIN_FAILED,
          userId: `account_${user.id}_${username}`,
          details: { method: 'account', reason: 'user_banned' },
          ip,
          userAgent,
          success: false,
          errorMessage: '账号已被封禁'
        })
        
        return errorResponse('该账号已被封禁，无法登录', 403)
      }

      // 验证密码
      let isValidPassword = false

      // 检查是否是旧密码格式（兼容性处理）
      if (user.password.startsWith('hash_')) {
        // 旧密码格式验证
        const expectedHash = `hash_${password}_`
        if (user.password.startsWith(expectedHash.substring(0, expectedHash.length - 14))) {
          isValidPassword = true

          // 自动升级密码到新格式
          try {
            const newHashedPassword = await bcrypt.hash(password, 10)
            await env.DB.prepare(`
              UPDATE users
              SET password = ?
              WHERE id = ?
            `).bind(newHashedPassword, user.id).run()

            console.log(`✅ 用户 ${username} 密码已自动升级到bcrypt`)
          } catch (upgradeError) {
            console.warn('密码升级失败:', upgradeError)
          }
        }
      } else {
        // 新密码格式验证（bcrypt）
        isValidPassword = await bcrypt.compare(password, user.password)
      }

      if (!isValidPassword) {
        // 记录密码错误
        await logAudit(env, {
          action: AuditAction.LOGIN_FAILED,
          userId: `account_${user.id}_${username}`,
          details: { method: 'account', reason: 'wrong_password' },
          ip,
          userAgent,
          success: false,
          errorMessage: '密码错误'
        })
        return errorResponse('用户名或密码错误', 401)
      }

      // 生成令牌
      const token = `account_${username}_${Date.now()}`

      // 为每个账号生成固定的用户ID（基于用户ID，确保同一账号在不同设备登录使用相同ID）
      const userId = `account_${user.id}_${user.username}`

      // 记录账号登录事件
      try {
        await env.DB.prepare(`
          INSERT INTO login_events (provider, created_at)
          VALUES ('account', datetime('now'))
        `).run()
      } catch (dbError) {
        console.warn('Failed to record login event:', dbError)
      }

      // 记录登录成功
      await logAudit(env, {
        action: AuditAction.LOGIN_SUCCESS,
        userId: userId,
        details: { method: 'account', username, role: user.role },
        ip,
        userAgent,
        success: true
      })

      console.log(`✅ 账号登录成功: ${username}, 用户ID: ${userId}, 角色: ${user.role}`)

      return successResponse({
        token: token,
        userId: userId,  // 返回固定的用户ID
        role: user.role, // 返回用户角色
        expiresIn: 86400, // 24小时
        message: '登录成功'
      })
    } catch (error) {
      console.error('Account login error:', error)
      return errorResponse('登录失败', 500)
    }
  }

  // POST /logout - 登出（客户端清除令牌）
  if (path === '/logout' && method === 'POST') {
    return successResponse({
      message: '登出成功'
    })
  }

  // POST /admin/verify - 验证管理员密码
  if (path === '/admin/verify' && method === 'POST') {
    try {
      const { password } = await request.json()

      if (!password) {
        return errorResponse('密码不能为空', 400)
      }

      // 获取环境变量中的管理员密码
      const adminPassword = env.ADMIN_PASSWORD

      if (!adminPassword) {
        return errorResponse('管理员功能未启用', 403)
      }

      // 验证密码
      if (password !== adminPassword) {
        console.warn('Invalid admin password attempt')
        return errorResponse('管理员密码错误', 401)
      }

      console.log('Admin password verified successfully')
      return successResponse({
        valid: true,
        message: '管理员身份验证成功'
      })
    } catch (error) {
      console.error('Admin verify error:', error)
      return errorResponse('验证失败', 500)
    }
  }

  // POST /refresh - 刷新Token
  if (path === '/refresh' && method === 'POST') {
    try {
      const { refreshToken } = await request.json()

      if (!refreshToken) {
        return errorResponse('刷新Token不能为空', 400)
      }

      const result = await refreshAccessToken(refreshToken, env)

      if (!result.success) {
        return errorResponse(result.error || 'Token刷新失败', 401)
      }

      console.log('✅ Token刷新成功')

      return successResponse({
        token: result.token,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        message: 'Token刷新成功'
      })
    } catch (error) {
      console.error('Token refresh error:', error)
      return errorResponse('刷新失败', 500)
    }
  }

  // POST /logout - 退出登录（撤销Token）
  if (path === '/logout' && method === 'POST') {
    try {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return errorResponse('未提供Token', 401)
      }

      const token = authHeader.replace(/^Bearer\s+/i, '')

      // 如果是访问密码登录，不需要撤销
      if (token === env.ACCESS_PASSWORD) {
        return successResponse({
          message: '退出成功'
        })
      }

      // 如果是旧格式的Token（account_xxx_timestamp），不需要撤销
      if (token.startsWith('account_') || token.startsWith('oauth_')) {
        return successResponse({
          message: '退出成功'
        })
      }

      // 撤销新格式的Token
      const result = await revokeToken(token, env)

      if (!result.success) {
        console.warn('Token撤销失败:', result.error)
        // 即使撤销失败也返回成功，因为客户端会清除本地Token
      }

      console.log('✅ 用户退出登录，Token已撤销')

      return successResponse({
        message: '退出成功'
      })
    } catch (error) {
      console.error('Logout error:', error)
      return errorResponse('退出失败', 500)
    }
  }

  return errorResponse('Not Found', 404)
}

