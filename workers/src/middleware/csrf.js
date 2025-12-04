/**
 * CSRF 保护中间件
 * 使用 Double Submit Cookie 模式
 */

// CSRF Token 有效期（1小时）
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000

/**
 * 生成 CSRF Token
 * @returns {string} CSRF Token
 */
export function generateCsrfToken() {
  const timestamp = Date.now()
  const random = crypto.randomUUID()
  const token = `${timestamp}.${random}`
  return token
}

/**
 * 验证 CSRF Token
 * @param {string} token - 请求中的 CSRF Token
 * @param {string} cookieToken - Cookie 中的 CSRF Token
 * @returns {boolean} 是否有效
 */
export function validateCsrfToken(token, cookieToken) {
  if (!token || !cookieToken) {
    return false
  }

  // Token 必须匹配
  if (token !== cookieToken) {
    return false
  }

  // 检查 Token 是否过期
  const parts = token.split('.')
  if (parts.length !== 2) {
    return false
  }

  const timestamp = parseInt(parts[0])
  if (isNaN(timestamp)) {
    return false
  }

  const now = Date.now()
  if (now - timestamp > CSRF_TOKEN_EXPIRY) {
    return false
  }

  return true
}

/**
 * 从请求中提取 CSRF Token
 * @param {Request} request
 * @returns {string|null}
 */
export function getCsrfTokenFromRequest(request) {
  // 优先从 Header 获取
  const headerToken = request.headers.get('X-CSRF-Token')
  if (headerToken) {
    return headerToken
  }

  // 其次从 URL 参数获取
  const url = new URL(request.url)
  const paramToken = url.searchParams.get('_csrf')
  if (paramToken) {
    return paramToken
  }

  return null
}

/**
 * 从 Cookie 中提取 CSRF Token
 * @param {Request} request
 * @returns {string|null}
 */
export function getCsrfTokenFromCookie(request) {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';').map(c => c.trim())
  for (const cookie of cookies) {
    if (cookie.startsWith('csrf_token=')) {
      return cookie.substring('csrf_token='.length)
    }
  }

  return null
}

/**
 * CSRF 保护中间件
 * 对于修改数据的请求（POST, PUT, DELETE, PATCH）进行 CSRF 验证
 * @param {Request} request
 * @returns {Response|null} 如果验证失败返回错误响应，否则返回 null
 */
export function csrfProtection(request) {
  const method = request.method.toUpperCase()
  
  // 只对修改数据的请求进行 CSRF 验证
  const protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH']
  if (!protectedMethods.includes(method)) {
    return null
  }

  // 排除不需要 CSRF 保护的路径
  const url = new URL(request.url)
  const path = url.pathname
  
  // 登录、注册等认证相关接口不需要 CSRF（因为还没有 token）
  const excludedPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/account-login',
    '/api/auth/check',
    '/api/auth/verify',
    '/api/auth/captcha'
  ]
  
  if (excludedPaths.some(p => path.endsWith(p))) {
    return null
  }

  // 获取并验证 CSRF Token
  const requestToken = getCsrfTokenFromRequest(request)
  const cookieToken = getCsrfTokenFromCookie(request)

  // 如果没有 Cookie Token，说明是新会话，跳过验证
  // （前端会在获取 CSRF Token 后设置 Cookie）
  if (!cookieToken) {
    return null
  }

  if (!validateCsrfToken(requestToken, cookieToken)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'CSRF token 验证失败，请刷新页面重试'
    }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  return null
}

/**
 * 创建带 CSRF Token Cookie 的响应
 * @param {Response} response
 * @param {string} token
 * @returns {Response}
 */
export function setCsrfCookie(response, token) {
  const newResponse = new Response(response.body, response)
  newResponse.headers.append(
    'Set-Cookie',
    `csrf_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`
  )
  return newResponse
}
