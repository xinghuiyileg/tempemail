// 多邮件服务提供商集成
// 支持 Resend、Brevo (Sendinblue)、SMTP2GO

/**
 * 通过 Resend 发送邮件
 */
export async function sendViaResend(from, to, subject, content, env) {
  if (!env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: from,
        to: to,
        subject: subject,
        text: content
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Resend 发送成功: ${from} -> ${to}, ID: ${result.id}`)
      return { success: true, service: 'Resend', messageId: result.id }
    } else {
      const error = await response.json()
      console.error(`❌ Resend 错误:`, error)
      return { success: false, error: error.message || 'Resend API error' }
    }
  } catch (error) {
    console.error('❌ Resend 发送失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 通过 Brevo (Sendinblue) 发送邮件
 */
export async function sendViaBrevo(from, to, subject, content, env) {
  if (!env.BREVO_API_KEY) {
    return { success: false, error: 'BREVO_API_KEY not configured' }
  }

  try {
    const requestBody = {
      sender: { email: from },
      to: [{ email: to }],
      subject: subject,
      htmlContent: `<pre>${content}</pre>`,  // Brevo 要求 htmlContent 或 textContent
      textContent: content
    }

    console.log(`📧 Brevo 发送请求: ${from} -> ${to}`)
    console.log(`📧 API Key: ${env.BREVO_API_KEY.substring(0, 20)}...`)

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const responseText = await response.text()
    console.log(`📧 Brevo 响应状态: ${response.status}`)
    console.log(`📧 Brevo 响应内容: ${responseText}`)

    if (response.ok) {
      const result = JSON.parse(responseText)
      console.log(`✅ Brevo 发送成功: ${from} -> ${to}, ID: ${result.messageId}`)
      return { success: true, service: 'Brevo', messageId: result.messageId }
    } else {
      let error
      try {
        error = JSON.parse(responseText)
      } catch {
        error = { message: responseText }
      }
      console.error(`❌ Brevo 错误:`, error)
      return { success: false, error: error.message || error.code || 'Brevo API error' }
    }
  } catch (error) {
    console.error('❌ Brevo 发送失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 通过 SMTP2GO 发送邮件
 */
export async function sendViaSMTP2GO(from, to, subject, content, env) {
  if (!env.SMTP2GO_API_KEY) {
    return { success: false, error: 'SMTP2GO_API_KEY not configured' }
  }

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: env.SMTP2GO_API_KEY,
        to: [to],
        sender: from,
        subject: subject,
        text_body: content
      })
    })

    if (response.ok) {
      const result = await response.json()
      if (result.data && result.data.succeeded > 0) {
        console.log(`✅ SMTP2GO 发送成功: ${from} -> ${to}`)
        return { success: true, service: 'SMTP2GO', messageId: result.data.email_id }
      } else {
        console.error(`❌ SMTP2GO 错误:`, result)
        return { success: false, error: result.data?.error || 'SMTP2GO send failed' }
      }
    } else {
      const error = await response.json()
      console.error(`❌ SMTP2GO 错误:`, error)
      return { success: false, error: error.message || 'SMTP2GO API error' }
    }
  } catch (error) {
    console.error('❌ SMTP2GO 发送失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 通过 Resend 代发模式发送邮件
 * 使用已验证的域名发送，但设置 Reply-To 为原始发件人
 */
export async function sendViaResendProxy(originalFrom, to, subject, content, env) {
  if (!env.RESEND_API_KEY || !env.RESEND_VERIFIED_DOMAIN) {
    return { success: false, error: 'RESEND_API_KEY or RESEND_VERIFIED_DOMAIN not configured' }
  }

  const verifiedEmail = `noreply@${env.RESEND_VERIFIED_DOMAIN}`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: verifiedEmail,
        reply_to: originalFrom,
        to: to,
        subject: `[${originalFrom}] ${subject}`,
        text: `此邮件由 ${originalFrom} 通过系统代发\n回复此邮件将发送到: ${originalFrom}\n\n${content}`
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Resend 代发成功: ${originalFrom} -> ${to} (via ${verifiedEmail})`)
      return { success: true, service: 'Resend (Proxy)', messageId: result.id }
    } else {
      const error = await response.json()
      console.error(`❌ Resend 代发错误:`, error)
      return { success: false, error: error.message || 'Resend proxy error' }
    }
  } catch (error) {
    console.error('❌ Resend 代发失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 检查服务商是否被禁用
 */
async function isServiceDisabled(serviceName, env) {
  try {
    // 标准化服务名称（处理 SMTP2GO 的特殊情况）
    const normalizedService = serviceName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const configKey = `email_service_${normalizedService}_disabled`
    const config = await env.DB.prepare(`
      SELECT config_value FROM config WHERE config_key = ?
    `).bind(configKey).first()

    const disabled = config?.config_value === '1'
    if (disabled) {
      console.log(`🚫 ${serviceName} 已被禁用`)
    }
    return disabled
  } catch (error) {
    console.error(`检查服务商状态失败 (${serviceName}):`, error)
    return false // 出错时默认不禁用
  }
}

/**
 * 智能选择邮件服务发送
 * 优先级：
 * 1. 如果发件域名是 Resend 已验证域名，使用 Resend
 * 2. 尝试 SMTP2GO（支持任意域名，1000封/月）
 * 3. 尝试 Brevo（支持任意域名，300封/天）
 * 4. 使用 Resend 代发模式
 */
export async function sendEmailSmart(from, to, subject, content, env) {
  const fromDomain = from.split('@')[1]
  const results = []

  // 策略 1: 如果是 Resend 已验证域名，优先使用 Resend
  if (env.RESEND_VERIFIED_DOMAIN && fromDomain === env.RESEND_VERIFIED_DOMAIN && env.RESEND_API_KEY) {
    const disabled = await isServiceDisabled('Resend', env)
    if (!disabled) {
      console.log(`🎯 使用 Resend 发送（匹配已验证域名: ${fromDomain}）`)
      const result = await sendViaResend(from, to, subject, content, env)
      results.push({ service: 'Resend', result })
      if (result.success) {
        return { ...result, service: 'Resend' }
      }
    } else {
      console.log(`⏭️ Resend 已被禁用，跳过`)
    }
  }

  // 策略 2: 尝试 SMTP2GO（支持多域名，1000封/月）
  if (env.SMTP2GO_API_KEY) {
    const disabled = await isServiceDisabled('SMTP2GO', env)
    if (!disabled) {
      console.log(`🎯 尝试 SMTP2GO 发送`)
      const result = await sendViaSMTP2GO(from, to, subject, content, env)
      results.push({ service: 'SMTP2GO', result })
      if (result.success) {
        return { ...result, service: 'SMTP2GO' }
      }
    } else {
      console.log(`⏭️ SMTP2GO 已被禁用，跳过`)
    }
  }

  // 策略 3: 尝试 Brevo（支持多域名，300封/天）
  if (env.BREVO_API_KEY) {
    const disabled = await isServiceDisabled('Brevo', env)
    if (!disabled) {
      console.log(`🎯 尝试 Brevo 发送`)
      const result = await sendViaBrevo(from, to, subject, content, env)
      results.push({ service: 'Brevo', result })
      if (result.success) {
        return { ...result, service: 'Brevo' }
      }
    } else {
      console.log(`⏭️ Brevo 已被禁用，跳过`)
    }
  }

  // 策略 4: 使用 Resend 代发模式（最后的备用方案）
  if (env.RESEND_API_KEY && env.RESEND_VERIFIED_DOMAIN) {
    const disabled = await isServiceDisabled('Resend', env)
    if (!disabled) {
      console.log(`🎯 使用 Resend 代发模式`)
      const result = await sendViaResendProxy(from, to, subject, content, env)
      results.push({ service: 'Resend (Proxy)', result })
      if (result.success) {
        return { ...result, service: 'Resend' }
      }
    } else {
      console.log(`⏭️ Resend 代发模式已被禁用，跳过`)
    }
  }

  // 所有方式都失败
  console.error('❌ 所有邮件服务都失败了:', results)
  return {
    success: false,
    error: '所有邮件服务都不可用',
    attempts: results
  }
}

