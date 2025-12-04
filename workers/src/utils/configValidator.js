/**
 * 配置验证器
 * 用于验证系统配置的完整性和正确性
 */

export class ConfigValidator {
  /**
   * 验证所有配置
   * @param {Object} env - 环境变量
   * @param {Object} dbConfig - 数据库配置
   * @returns {Promise<Object>} - 验证结果
   */
  static async validateAll(env, dbConfig) {
    const results = {
      cloudflare: await this.validateCloudflare(env, dbConfig),
      email: await this.validateEmail(env, dbConfig),
      domain: await this.validateDomain(env, dbConfig),
      summary: {
        total: 0,
        passed: 0,
        warnings: 0,
        errors: 0
      }
    }

    // 计算汇总
    Object.values(results).forEach(category => {
      if (category.checks) {
        category.checks.forEach(check => {
          results.summary.total++
          if (check.status === 'pass') results.summary.passed++
          if (check.status === 'warning') results.summary.warnings++
          if (check.status === 'error') results.summary.errors++
        })
      }
    })

    return results
  }

  /**
   * 验证 Cloudflare 配置
   */
  static async validateCloudflare(env, dbConfig) {
    const checks = []

    // API Token
    const apiToken = dbConfig.cloudflare_api_token || env.CLOUDFLARE_API_TOKEN
    checks.push({
      name: 'Cloudflare API Token',
      status: apiToken ? 'pass' : 'warning',
      message: apiToken ? '已配置' : '未配置，某些功能可能不可用'
    })

    // Account ID
    const accountId = dbConfig.cloudflare_account_id || env.CLOUDFLARE_ACCOUNT_ID
    checks.push({
      name: 'Cloudflare Account ID',
      status: accountId ? 'pass' : 'warning',
      message: accountId ? '已配置' : '未配置'
    })

    // Zone ID
    const zoneId = dbConfig.cloudflare_zone_id || env.CLOUDFLARE_ZONE_ID
    checks.push({
      name: 'Cloudflare Zone ID',
      status: zoneId ? 'pass' : 'warning',
      message: zoneId ? '已配置' : '未配置'
    })

    return { checks }
  }

  /**
   * 验证邮件配置
   */
  static async validateEmail(env, dbConfig) {
    const checks = []

    // 目标邮箱
    const targetEmail = dbConfig.target_qq_email || env.TARGET_QQ_EMAIL
    checks.push({
      name: '目标QQ邮箱',
      status: targetEmail ? 'pass' : 'warning',
      message: targetEmail ? '已配置' : '未配置转发邮箱'
    })

    // QQ IMAP密码
    const imapPassword = dbConfig.qq_imap_password || env.QQ_IMAP_PASSWORD
    checks.push({
      name: 'QQ IMAP密码',
      status: imapPassword ? 'pass' : 'warning',
      message: imapPassword ? '已配置' : '未配置'
    })

    // Resend API Key
    const resendKey = dbConfig.resend_api_key || env.RESEND_API_KEY
    checks.push({
      name: 'Resend API Key',
      status: resendKey ? 'pass' : 'info',
      message: resendKey ? '已配置（3000封/月）' : '未配置，可选'
    })

    // Brevo API Key
    const brevoKey = dbConfig.brevo_api_key || env.BREVO_API_KEY
    checks.push({
      name: 'Brevo API Key',
      status: brevoKey ? 'pass' : 'info',
      message: brevoKey ? '已配置（300封/天）' : '未配置，可选'
    })

    // SMTP2GO API Key
    const smtp2goKey = dbConfig.smtp2go_api_key || env.SMTP2GO_API_KEY
    checks.push({
      name: 'SMTP2GO API Key',
      status: smtp2goKey ? 'pass' : 'info',
      message: smtp2goKey ? '已配置（1000封/月）' : '未配置，可选'
    })

    return { checks }
  }

  /**
   * 验证域名配置
   */
  static async validateDomain(env, dbConfig) {
    const checks = []

    // 域名配置
    const domainName = dbConfig.domain_name || env.DOMAIN_NAME
    checks.push({
      name: '系统默认域名',
      status: domainName ? 'pass' : 'error',
      message: domainName ? `已配置: ${domainName}` : '未配置域名'
    })

    return { checks }
  }
}

/**
 * 配置测试器
 * 用于测试配置的连接性
 */
export class ConfigTester {
  /**
   * 测试 Cloudflare API 连接
   * @param {string} token - API Token
   * @param {string} accountId - Account ID
   * @param {string} zoneId - Zone ID
   * @returns {Promise<Object>} - 测试结果
   */
  static async testCloudflareApi(token, accountId, zoneId) {
    if (!token) {
      return {
        success: false,
        error: 'API Token 未配置'
      }
    }

    try {
      // 测试 Token 是否有效
      const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.errors?.[0]?.message || 'API Token 验证失败'
        }
      }

      // 如果提供了 Zone ID，测试 Zone 访问权限
      if (zoneId) {
        const zoneResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const zoneData = await zoneResponse.json()

        if (!zoneResponse.ok || !zoneData.success) {
          return {
            success: false,
            error: 'Zone ID 无效或无访问权限'
          }
        }

        return {
          success: true,
          message: `连接成功！Zone: ${zoneData.result.name}`,
          data: {
            tokenStatus: data.result.status,
            zoneName: zoneData.result.name,
            zoneStatus: zoneData.result.status
          }
        }
      }

      return {
        success: true,
        message: 'API Token 验证成功',
        data: {
          tokenStatus: data.result.status
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `连接失败: ${error.message}`
      }
    }
  }

  /**
   * 测试 Resend API 连接
   * @param {string} apiKey - Resend API Key
   * @returns {Promise<Object>} - 测试结果
   */
  static async testResendApi(apiKey) {
    if (!apiKey) {
      return {
        success: false,
        error: 'Resend API Key 未配置'
      }
    }

    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return {
          success: false,
          error: `API Key 无效 (${response.status})`
        }
      }

      const data = await response.json()

      return {
        success: true,
        message: `连接成功！已验证域名: ${data.data?.length || 0} 个`,
        data: {
          domains: data.data?.length || 0
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `连接失败: ${error.message}`
      }
    }
  }

  /**
   * 测试 Brevo API 连接
   * @param {string} apiKey - Brevo API Key
   * @returns {Promise<Object>} - 测试结果
   */
  static async testBrevoApi(apiKey) {
    if (!apiKey) {
      return {
        success: false,
        error: 'Brevo API Key 未配置'
      }
    }

    try {
      const response = await fetch('https://api.brevo.com/v3/account', {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        return {
          success: false,
          error: `API Key 无效 (${response.status})`
        }
      }

      const data = await response.json()

      return {
        success: true,
        message: `连接成功！账户: ${data.email}`,
        data: {
          email: data.email,
          plan: data.plan?.[0]?.type || 'unknown'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `连接失败: ${error.message}`
      }
    }
  }
}


