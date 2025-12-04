/**
 * 域名验证服务
 * 提供域名格式验证和MX记录验证功能
 */

/**
 * 验证域名格式
 * @param {string} domain - 域名
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateDomainFormat(domain) {
  if (!domain || typeof domain !== 'string') {
    return { valid: false, error: '域名不能为空' }
  }

  // 移除前后空格
  domain = domain.trim()

  // 检查域名格式
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  
  if (!domainRegex.test(domain)) {
    return { valid: false, error: '域名格式不正确' }
  }

  // 检查域名长度
  if (domain.length > 253) {
    return { valid: false, error: '域名长度超过限制' }
  }

  // 检查是否包含非法字符
  if (/[^\x00-\x7F]/.test(domain)) {
    return { valid: false, error: '域名包含非法字符' }
  }

  return { valid: true }
}

/**
 * 查询域名的MX记录
 * @param {string} domain - 域名
 * @returns {Promise<Array>} - MX记录列表
 */
async function queryMXRecords(domain) {
  try {
    // 使用 Cloudflare DNS over HTTPS
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`, {
      headers: {
        'Accept': 'application/dns-json'
      }
    })

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.Answer || data.Answer.length === 0) {
      return []
    }

    // 解析MX记录
    const mxRecords = data.Answer
      .filter(record => record.type === 15) // MX记录类型为15
      .map(record => {
        // MX记录格式: "priority hostname"
        const parts = record.data.split(' ')
        return {
          priority: parseInt(parts[0]),
          hostname: parts[1].replace(/\.$/, '') // 移除末尾的点
        }
      })
      .sort((a, b) => a.priority - b.priority)

    return mxRecords
  } catch (error) {
    console.error('Query MX records error:', error)
    throw new Error(`MX记录查询失败: ${error.message}`)
  }
}

/**
 * 验证MX记录是否指向Cloudflare
 * @param {Array} mxRecords - MX记录列表
 * @returns {boolean} - 是否验证通过
 */
function validateMXRecords(mxRecords) {
  if (!mxRecords || mxRecords.length === 0) {
    return false
  }

  // 检查是否有MX记录指向Cloudflare邮件路由
  const cloudflarePatterns = [
    /route\.mx\.cloudflare\.net$/i,
    /cloudflare\.net$/i
  ]

  return mxRecords.some(record => 
    cloudflarePatterns.some(pattern => pattern.test(record.hostname))
  )
}

/**
 * 执行域名验证
 * @param {string} domain - 域名
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} - 验证结果
 */
export async function performDomainVerification(domain, env) {
  try {
    console.log(`🔍 开始验证域名: ${domain}`)

    // 1. 验证域名格式
    const formatCheck = validateDomainFormat(domain)
    if (!formatCheck.valid) {
      return {
        success: false,
        verified: false,
        error: formatCheck.error
      }
    }

    // 2. 查询MX记录
    console.log(`📧 查询MX记录...`)
    const mxRecords = await queryMXRecords(domain)
    
    if (mxRecords.length === 0) {
      return {
        success: true,
        verified: false,
        mx_records: [],
        error: '未找到MX记录，请确保域名已配置邮件路由'
      }
    }

    console.log(`✅ 找到 ${mxRecords.length} 条MX记录:`, mxRecords)

    // 3. 验证MX记录
    const isValid = validateMXRecords(mxRecords)
    
    return {
      success: true,
      verified: isValid,
      mx_records: mxRecords,
      error: isValid ? null : 'MX记录未指向Cloudflare邮件路由，邮件可能无法正常接收'
    }
  } catch (error) {
    console.error('Domain verification error:', error)
    return {
      success: false,
      verified: false,
      error: error.message
    }
  }
}

/**
 * 重新验证域名
 * @param {number} domainId - 域名ID
 * @param {Object} env - 环境变量
 * @returns {Promise<Object>} - 验证结果
 */
export async function reverifyDomain(domainId, env) {
  try {
    // 获取域名信息
    const domain = await env.DB.prepare(`
      SELECT domain FROM domains WHERE id = ?
    `).bind(domainId).first()

    if (!domain) {
      return {
        success: false,
        error: '域名不存在'
      }
    }

    // 执行验证
    const result = await performDomainVerification(domain.domain, env)

    if (result.verified) {
      // 更新数据库
      await env.DB.prepare(`
        UPDATE domains
        SET status = 'verified',
            mx_records = ?,
            last_verified_at = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(JSON.stringify(result.mx_records), domainId).run()

      // 记录验证历史
      await env.DB.prepare(`
        INSERT INTO domain_verifications (domain_id, status, mx_records, verified_at)
        VALUES (?, 'verified', ?, datetime('now'))
      `).bind(domainId, JSON.stringify(result.mx_records)).run()
    } else {
      // 更新为验证失败
      await env.DB.prepare(`
        UPDATE domains
        SET status = 'failed',
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(domainId).run()

      // 记录验证历史
      await env.DB.prepare(`
        INSERT INTO domain_verifications (domain_id, status, error_message, verified_at)
        VALUES (?, 'failed', ?, datetime('now'))
      `).bind(domainId, result.error || '验证失败').run()
    }

    return {
      success: true,
      verified: result.verified,
      mx_records: result.mx_records || [],
      error: result.error
    }
  } catch (error) {
    console.error('Reverify domain error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 生成验证令牌
 * @returns {string} - 验证令牌
 */
export function generateVerificationToken() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `verify_${timestamp}_${random}`
}


