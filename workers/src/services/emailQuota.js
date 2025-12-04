// 邮件服务商额度查询服务
// 获取 Brevo、SMTP2GO、Resend 的剩余额度信息

/**
 * 获取 Brevo 账户信息和额度
 * API 文档: https://developers.brevo.com/reference/getaccount
 * 统计 API: https://developers.brevo.com/reference/getsmtpreport-1
 */
export async function getBrevoQuota(apiKey, env) {
  if (!apiKey) {
    return {
      success: false,
      service: 'Brevo',
      error: 'API Key not configured'
    }
  }

  try {
    console.log(`📊 获取 Brevo 额度，API Key: ${apiKey.substring(0, 20)}...`)
    
    // 获取账户信息（获取每日限制）
    const accountResponse = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json'
      }
    })

    console.log(`📊 Brevo API 响应状态: ${accountResponse.status}`)

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text()
      console.error('❌ Brevo account error:', errorText)
      let error
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { message: errorText }
      }
      return {
        success: false,
        service: 'Brevo',
        error: error.message || error.code || `HTTP ${accountResponse.status}: ${errorText}`
      }
    }

    const accountData = await accountResponse.json()
    console.log(`📊 Brevo 账户数据:`, JSON.stringify(accountData.plan || []))

    // Brevo 返回的数据结构
    // plan: [{ type: "free", credits: 297, creditsType: "sendLimit" }]
    // 注意：credits 是当前剩余额度，不是总限制！
    // 免费版总限制固定为 300 封/天
    const emailPlan = accountData.plan?.find(p => p.creditsType === 'sendLimit')
    const remainingFromAPI = emailPlan?.credits || 0 // 当前剩余额度
    const dailyLimit = 300 // 免费版固定 300 封/天

    // 计算已使用量
    const usedToday = Math.max(0, dailyLimit - remainingFromAPI)

    console.log(`✅ Brevo 额度: ${usedToday}/${dailyLimit} (剩余: ${remainingFromAPI})`)

    return {
      success: true,
      service: 'Brevo',
      total: dailyLimit,
      used: usedToday,
      remaining: remainingFromAPI,
      unit: '封/天',
      percentage: dailyLimit > 0 ? Math.round((remainingFromAPI / dailyLimit) * 100) : 0
    }
  } catch (error) {
    console.error('❌ Brevo quota fetch failed:', error)
    console.error('❌ Error stack:', error.stack)
    return {
      success: false,
      service: 'Brevo',
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * 获取 SMTP2GO 使用情况
 * 通过 SMTP2GO API 的 /stats/email_cycle 端点获取真实的使用情况
 * 包括本月已发送数量、剩余数量、月度限额等
 */
export async function getSMTP2GOQuota(apiKey, db) {
  if (!apiKey) {
    return {
      success: false,
      service: 'SMTP2GO',
      error: 'API Key not configured'
    }
  }

  try {
    // 调用 SMTP2GO API 获取账户使用情况
    const response = await fetch('https://api.smtp2go.com/v3/stats/email_cycle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': apiKey
      },
      body: JSON.stringify({})
    })

    if (!response.ok) {
      // 如果 API 调用失败，回退到数据库统计
      console.warn(`⚠️ SMTP2GO API 调用失败 (${response.status}), 使用数据库统计`)
      return await getSMTP2GOQuotaFromDB(apiKey, db)
    }

    const result = await response.json()

    if (result.data) {
      const data = result.data
      // SMTP2GO API 返回的数据结构:
      // {
      //   "cycle_start": "2024-11-01",
      //   "cycle_end": "2024-11-30",
      //   "sent": 150,
      //   "remaining": 850,
      //   "allowance": 1000
      // }

      const total = data.allowance || 1000
      const used = data.sent || 0
      const remaining = data.remaining || (total - used)

      return {
        success: true,
        service: 'SMTP2GO',
        total,
        used,
        remaining,
        unit: '封/月',
        percentage: total > 0 ? Math.round((remaining / total) * 100) : 0,
        cycleStart: data.cycle_start,
        cycleEnd: data.cycle_end,
        note: '通过 SMTP2GO API 实时获取'
      }
    } else {
      // 如果返回数据格式不符合预期，回退到数据库统计
      console.warn('⚠️ SMTP2GO API 返回数据格式异常, 使用数据库统计')
      return await getSMTP2GOQuotaFromDB(apiKey, db)
    }
  } catch (error) {
    console.error('❌ SMTP2GO API 调用异常:', error)
    // 出错时回退到数据库统计
    return await getSMTP2GOQuotaFromDB(apiKey, db)
  }
}

/**
 * 从数据库统计 SMTP2GO 使用情况（备用方案）
 */
async function getSMTP2GOQuotaFromDB(apiKey, db) {
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0]

    // 查询本月通过 SMTP2GO 发送的邮件数量
    const result = await db.prepare(`
      SELECT COUNT(*) as count
      FROM sent_emails
      WHERE sent_at >= ?
      AND provider = 'SMTP2GO'
    `).bind(firstDayStr).first()

    // SMTP2GO 免费版: 1000 封/月
    const used = result?.count || 0
    const total = 1000
    const remaining = Math.max(0, total - used)

    return {
      success: true,
      service: 'SMTP2GO',
      total,
      used,
      remaining,
      unit: '封/月',
      percentage: total > 0 ? Math.round((remaining / total) * 100) : 0,
      note: '基于数据库统计（API 调用失败时的备用方案）'
    }
  } catch (error) {
    console.error('❌ SMTP2GO quota estimation failed:', error)
    return {
      success: false,
      service: 'SMTP2GO',
      error: error.message
    }
  }
}

/**
 * 获取 Resend 使用情况
 * 注意: Resend API 目前没有提供查询额度的端点
 * 我们只能通过数据库记录的发送数量来估算
 * Resend 有月度限制（3000封/月）和每日限制（100封/天）
 */
export async function getResendQuota(apiKey, db) {
  if (!apiKey) {
    return {
      success: false,
      service: 'Resend',
      error: 'API Key not configured'
    }
  }

  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0]
    const today = now.toISOString().split('T')[0]

    // 查询本月通过 Resend 发送的邮件数量
    const monthResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM sent_emails
      WHERE sent_at >= ?
      AND provider = 'Resend'
    `).bind(firstDayStr).first()

    // 查询今日通过 Resend 发送的邮件数量
    const dayResult = await db.prepare(`
      SELECT COUNT(*) as count
      FROM sent_emails
      WHERE DATE(sent_at) = ?
      AND provider = 'Resend'
    `).bind(today).first()

    const monthUsed = monthResult?.count || 0
    const monthTotal = 3000 // Resend 免费版: 3000 封/月
    const monthRemaining = Math.max(0, monthTotal - monthUsed)

    const dayUsed = dayResult?.count || 0
    const dayTotal = 100 // Resend 免费版: 100 封/天
    const dayRemaining = Math.max(0, dayTotal - dayUsed)

    return {
      success: true,
      service: 'Resend',
      // 月度限制
      total: monthTotal,
      used: monthUsed,
      remaining: monthRemaining,
      unit: '封/月',
      percentage: monthTotal > 0 ? Math.round((monthRemaining / monthTotal) * 100) : 0,
      // 每日限制
      dailyLimit: {
        total: dayTotal,
        used: dayUsed,
        remaining: dayRemaining,
        percentage: dayTotal > 0 ? Math.round((dayRemaining / dayTotal) * 100) : 0
      },
      note: '基于数据库统计（Resend API 不提供额度查询）'
    }
  } catch (error) {
    console.error('❌ Resend quota estimation failed:', error)
    return {
      success: false,
      service: 'Resend',
      error: error.message
    }
  }
}

/**
 * 获取所有邮件服务商的额度信息
 */
export async function getAllEmailQuotas(env) {
  console.log('📊 开始获取邮件服务商额度信息')
  console.log('📊 环境变量检查:')
  console.log(`  - BREVO_API_KEY: ${env.BREVO_API_KEY ? '✓ 已配置 (' + env.BREVO_API_KEY.substring(0, 20) + '...)' : '✗ 未配置'}`)
  console.log(`  - SMTP2GO_API_KEY: ${env.SMTP2GO_API_KEY ? '✓ 已配置' : '✗ 未配置'}`)
  console.log(`  - RESEND_API_KEY: ${env.RESEND_API_KEY ? '✓ 已配置' : '✗ 未配置'}`)
  console.log(`  - DB: ${env.DB ? '✓ 已绑定' : '✗ 未绑定'}`)
  
  const quotas = []

  // 获取 Brevo 额度（需要数据库统计今日使用量）
  if (env.BREVO_API_KEY) {
    console.log('📊 正在获取 Brevo 额度...')
    const brevoQuota = await getBrevoQuota(env.BREVO_API_KEY, env)
    quotas.push(brevoQuota)
    console.log('📊 Brevo 额度结果:', brevoQuota.success ? '✓ 成功' : '✗ 失败 - ' + brevoQuota.error)
  } else {
    console.log('⚠️ 跳过 Brevo: API Key 未配置')
    quotas.push({
      success: false,
      service: 'Brevo',
      error: 'API Key not configured'
    })
  }

  // 获取 SMTP2GO 额度（需要数据库）
  if (env.SMTP2GO_API_KEY && env.DB) {
    console.log('📊 正在获取 SMTP2GO 额度...')
    const smtp2goQuota = await getSMTP2GOQuota(env.SMTP2GO_API_KEY, env.DB)
    quotas.push(smtp2goQuota)
    console.log('📊 SMTP2GO 额度结果:', smtp2goQuota.success ? '✓ 成功' : '✗ 失败')
  } else {
    console.log('⚠️ 跳过 SMTP2GO: API Key 或数据库未配置')
  }

  // 获取 Resend 额度（需要数据库）
  if (env.RESEND_API_KEY && env.DB) {
    console.log('📊 正在获取 Resend 额度...')
    const resendQuota = await getResendQuota(env.RESEND_API_KEY, env.DB)
    quotas.push(resendQuota)
    console.log('📊 Resend 额度结果:', resendQuota.success ? '✓ 成功' : '✗ 失败')
  } else {
    console.log('⚠️ 跳过 Resend: API Key 或数据库未配置')
  }

  // 注意：Brevo 是每日限制，其他是每月限制，不能直接相加
  // 这里只做简单展示，实际使用时需要注意单位差异
  const totalQuota = quotas.reduce((sum, q) => sum + (q.total || 0), 0)
  const totalUsed = quotas.reduce((sum, q) => sum + (q.used || 0), 0)
  const totalRemaining = quotas.reduce((sum, q) => sum + (q.remaining || 0), 0)

  return {
    services: quotas,
    summary: {
      total: totalQuota,
      used: totalUsed,
      remaining: totalRemaining,
      percentage: totalQuota > 0 ? Math.round((totalRemaining / totalQuota) * 100) : 0,
      note: '注意：Brevo 是每日限制，其他是每月限制'
    },
    lastUpdate: new Date().toISOString()
  }
}

