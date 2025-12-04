// Cloudflare Email Worker
// 这个 Worker 会在邮件到达时自动触发

import { extractCodeFromEmail } from './utils/codeExtractor'
import ConfigManager, { CONFIG_KEYS } from './utils/configManager'

export default {
  async email(message, env, ctx) {
    try {
      // 获取邮件信息
      const from = message.from
      const to = message.to
      const rawSubject = message.headers.get('subject') || ''
      // 解码 RFC 2047 编码的主题
      const subject = decodeRFC2047(rawSubject)
      
      // 查找对应的临时邮箱
      const tempEmail = await env.DB.prepare(`
        SELECT id FROM temp_emails WHERE email = ? AND status = 'active'
      `).bind(to).first()

      if (!tempEmail) {
        console.log(`No active temp email found for: ${to}`)
        // 继续转发邮件（使用统一配置管理）
        const targetEmail = await ConfigManager.get(CONFIG_KEYS.TARGET_QQ_EMAIL, env)
        if (targetEmail && targetEmail.trim().length > 0) {
          await message.forward(targetEmail)
        }
        return
      }

      // 读取邮件内容
      let bodyText = ''
      let bodyHtml = ''

      try {
        const reader = message.raw.getReader()
        const chunks = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }

        const rawBytes = new Uint8Array(chunks.reduce((acc, cur) => acc + cur.length, 0))
        {
          let offset = 0
          for (const chunk of chunks) {
            rawBytes.set(chunk, offset)
            offset += chunk.length
          }
        }

        console.log(`📧 Processing email from ${from}, size: ${rawBytes.length} bytes`)

        // 优先按 MIME 解析（支持 multipart, base64, quoted-printable, charset）
        const parsed = parseMimeMessage(rawBytes)
        bodyText = parsed.text || ''
        bodyHtml = parsed.html || ''

        console.log(`📝 MIME解析结果: text=${bodyText.length}字符, html=${bodyHtml.length}字符`)

        // 兜底：退回到简单正则
        if (!bodyText && !bodyHtml) {
          console.warn('⚠️ MIME解析未获取到内容，尝试使用正则提取...')
          const rawEmail = new TextDecoder().decode(rawBytes)
          bodyText = extractTextFromRaw(rawEmail)
          bodyHtml = extractHtmlFromRaw(rawEmail)
          console.log(`📝 正则提取结果: text=${bodyText.length}字符, html=${bodyHtml.length}字符`)
          
          // 如果还是空的，保存原始内容的前500字符用于调试
          if (!bodyText && !bodyHtml && rawEmail.length > 0) {
            console.warn('❌ 邮件内容提取失败，保存原始内容前500字符')
            bodyText = `[邮件解析失败，原始内容预览]\n\n${rawEmail.substring(0, 500)}`
          }
        }
      } catch (error) {
        console.error('❌ Failed to read email body:', error)
        console.error('Error details:', error.stack)
      }

      // 修复可能的乱码
      bodyText = fixGarbledText(bodyText)
      bodyHtml = fixGarbledText(bodyHtml)
      const fixedSubject = fixGarbledText(subject)

      // 后备检测：如果bodyHtml为空但bodyText包含HTML标签，将bodyText作为HTML
      if (!bodyHtml && bodyText && (bodyText.includes('<div') || bodyText.includes('<table') || bodyText.includes('<html'))) {
        console.log('Detected HTML in bodyText, using it as bodyHtml')
        bodyHtml = bodyText
      }

      // 提取验证码（使用修复后的内容）
      const verificationCode = extractCodeFromEmail(fixedSubject, bodyText || bodyHtml)

      // 保存到数据库（使用修复后的内容）
      const messageId = message.headers.get('message-id') || generateMessageId()
      
      await env.DB.prepare(`
        INSERT INTO messages (
          temp_email_id,
          message_id,
          sender,
          subject,
          body_text,
          body_html,
          verification_code,
          received_at,
          is_read
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).bind(
        tempEmail.id,
        messageId,
        from,
        fixedSubject,
        bodyText,
        bodyHtml,
        verificationCode,
        new Date().toISOString()
      ).run()

      // 更新邮箱的最后收信时间和邮件数量
      await env.DB.prepare(`
        UPDATE temp_emails 
        SET last_received_at = datetime('now'),
            message_count = message_count + 1
        WHERE id = ?
      `).bind(tempEmail.id).run()

      // 通过 WebSocket 推送通知（如果实现了）
      try {
        await notifyNewEmail(env, {
          temp_email: to,
          sender: from,
          subject,
          verification_code: verificationCode,
          received_at: new Date().toISOString()
        })
      } catch (error) {
        console.error('Failed to send WebSocket notification:', error)
      }

      // 转发邮件到目标邮箱（使用统一配置管理）
      const targetEmail = await ConfigManager.get(CONFIG_KEYS.TARGET_QQ_EMAIL, env)
      if (targetEmail && targetEmail.trim().length > 0) {
        console.log(`✅ 转发邮件到: ${targetEmail}`)
        await message.forward(targetEmail)
      } else {
        console.warn('⚠️ 未配置目标邮箱，跳过转发')
      }

    } catch (error) {
      console.error('❌ Email worker error:', error)
      // 即使出错也要转发邮件（使用统一配置管理）
      try {
        const targetEmail = await ConfigManager.get(CONFIG_KEYS.TARGET_QQ_EMAIL, env)
        if (targetEmail && targetEmail.trim().length > 0) {
          console.log(`✅ 转发邮件到: ${targetEmail} (错误恢复模式)`)
          await message.forward(targetEmail)
        } else {
          console.warn('⚠️ 未配置目标邮箱，跳过转发 (错误恢复模式)')
        }
      } catch (forwardError) {
        console.error('❌ 转发邮件失败:', forwardError)
      }
    }
  }
}

// 轻量 MIME 解析器：尝试解析常见的 multipart/alternative、quoted-printable、base64 与 charset
function parseMimeMessage(rawBytes) {
  try {
    // 使用 latin1 解码邮件头部（避免中文乱码）
    const raw = new TextDecoder('latin1').decode(rawBytes)
    const contentTypeMatch = raw.match(/Content-Type:\s*([^;\r\n]+)(;[\s\S]*?)?\r?\n/i)
    const contentType = contentTypeMatch ? contentTypeMatch[1].toLowerCase() : ''
    const boundaryMatch = raw.match(/boundary=\"?([^\";\r\n]+)\"?/i)
    const boundary = boundaryMatch ? boundaryMatch[1] : null

    console.log(`🔍 MIME解析 - ContentType: ${contentType}, Boundary: ${boundary ? '有' : '无'}`)

    // 简单 body 提取（跳过 headers）
    const separator = /\r?\n\r?\n/
    const headerEndIndex = raw.search(separator)
    const bodyRaw = headerEndIndex >= 0 ? raw.slice(headerEndIndex + raw.match(separator)[0].length) : raw

    // multipart 处理
    if (boundary && /multipart\//.test(contentType)) {
      console.log(`📦 处理multipart邮件, boundary="${boundary}"`)
      const parts = bodyRaw.split(new RegExp(`--${boundary}(?:--)?\r?\n`))
      let text = ''
      let html = ''
      console.log(`📦 找到 ${parts.length} 个邮件部分`)
      for (const part of parts) {
        if (!part || part.trim() === '--') continue
        const partHeaderEnd = part.search(separator)
        if (partHeaderEnd < 0) continue
        const partHeaders = part.slice(0, partHeaderEnd)
        const partBody = part.slice(partHeaderEnd + part.match(separator)[0].length)
        const partTypeMatch = partHeaders.match(/Content-Type:\s*([^;\r\n]+)/i)
        const partType = partTypeMatch ? partTypeMatch[1].toLowerCase() : ''
        const encoding = (partHeaders.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1] || '').toLowerCase()
        const charset = (partHeaders.match(/charset=\"?([^\";\r\n]+)\"?/i)?.[1] || 'utf-8').toLowerCase()

        console.log(`  📄 Part: type=${partType}, encoding=${encoding}, charset=${charset}, size=${partBody.length}`)

        const decoded = decodeBody(partBody.trim(), encoding, charset)
        if (/text\/plain/.test(partType) && !text) text = decoded
        if (/text\/html/.test(partType) && !html) html = decoded
      }
      console.log(`✅ Multipart解析完成: text=${text.length}, html=${html.length}`)
      return { text, html }
    }

    // 单体 text/html 或 text/plain
    const encoding = (raw.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1] || '').toLowerCase()
    const charset = (raw.match(/charset=\"?([^\";\r\n]+)\"?/i)?.[1] || 'utf-8').toLowerCase()
    console.log(`📄 单体邮件 - type=${contentType}, encoding=${encoding}, charset=${charset}`)
    const decoded = decodeBody(bodyRaw.trim(), encoding, charset)
    if (/text\/html/.test(contentType)) return { text: '', html: decoded }
    if (/text\/plain/.test(contentType)) return { text: decoded, html: '' }

    // 未知类型，原样返回为 text
    console.warn(`⚠️ 未知邮件类型: ${contentType}`)
    return { text: decoded, html: '' }
  } catch (e) {
    console.error('❌ MIME解析失败:', e.message)
    console.error('Error stack:', e.stack)
    return { text: '', html: '' }
  }
}

function decodeBody(body, encoding, charset) {
  try {
    let bytes
    
    if (encoding === 'base64') {
      // Base64 解码
      const clean = body.replace(/\s+/g, '')
      const bin = atob(clean)
      bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i)
      }
    } else if (encoding === 'quoted-printable') {
      // Quoted-Printable 解码
      // 先处理软换行
      let qp = body.replace(/=\r?\n/g, '')
      // 解码 =XX 格式
      const decoded = qp.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
        return String.fromCharCode(parseInt(hex, 16))
      })
      // 转换为字节数组（使用 latin1 避免再次编码）
      bytes = new Uint8Array(decoded.length)
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i) & 0xFF
      }
    } else {
      // 8bit 或 7bit 编码，直接使用原始字节
      bytes = new Uint8Array(body.length)
      for (let i = 0; i < body.length; i++) {
        bytes[i] = body.charCodeAt(i) & 0xFF
      }
    }

    // 根据字符集解码
    const targetCharset = normalizeCharset(charset)
    
    // Cloudflare Workers 环境不支持 GBK，回退到 UTF-8
    try {
      const dec = new TextDecoder(targetCharset, { fatal: false })
      return dec.decode(bytes)
    } catch (e) {
      // 如果字符集不支持，尝试 UTF-8
      const dec = new TextDecoder('utf-8', { fatal: false })
      return dec.decode(bytes)
    }
  } catch (error) {
    console.error('Decode body error:', error)
    return body
  }
}

function normalizeCharset(cs) {
  const c = cs.toLowerCase().trim()
  // 注意：Cloudflare Workers 可能不支持 GBK
  // 如果是 GBK，尝试 UTF-8（大多数现代邮件都是 UTF-8）
  if (c.includes('gb2312') || c.includes('gbk') || c.includes('gb18030')) {
    console.warn('GBK/GB2312/GB18030 charset detected, trying UTF-8 instead')
    return 'utf-8'
  }
  if (c.includes('utf-8') || c.includes('utf8')) return 'utf-8'
  if (c.includes('iso-8859-1') || c.includes('latin1') || c.includes('latin-1')) return 'iso-8859-1'
  if (c.includes('windows-1252') || c.includes('cp1252')) return 'windows-1252'
  if (c.includes('iso-8859-15')) return 'iso-8859-15'
  return 'utf-8'
}

/**
 * 解码 RFC 2047 编码的邮件头（如 Subject）
 * 格式: =?charset?encoding?encoded_text?=
 * 例如: =?UTF-8?B?5L2g5aW9?= 或 =?UTF-8?Q?Hello?=
 */
function decodeRFC2047(str) {
  if (!str) return str
  
  try {
    // 匹配 RFC 2047 编码模式
    const pattern = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g
    
    return str.replace(pattern, (match, charset, encoding, encodedText) => {
      try {
        const normalizedCharset = normalizeCharset(charset)
        let bytes
        
        if (encoding.toUpperCase() === 'B') {
          // Base64 编码
          const binary = atob(encodedText)
          bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }
        } else if (encoding.toUpperCase() === 'Q') {
          // Quoted-Printable 编码（RFC 2047 变体，下划线表示空格）
          const decoded = encodedText
            .replace(/_/g, ' ')
            .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
              return String.fromCharCode(parseInt(hex, 16))
            })
          bytes = new Uint8Array(decoded.length)
          for (let i = 0; i < decoded.length; i++) {
            bytes[i] = decoded.charCodeAt(i) & 0xFF
          }
        } else {
          return match // 未知编码，返回原文
        }
        
        // 使用正确的字符集解码
        try {
          return new TextDecoder(normalizedCharset, { fatal: false }).decode(bytes)
        } catch (e) {
          return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
        }
      } catch (e) {
        console.error('RFC 2047 decode error:', e)
        return match
      }
    })
  } catch (e) {
    console.error('decodeRFC2047 error:', e)
    return str
  }
}

/**
 * 修复乱码文本（尝试重新解码）
 */
function fixGarbledText(text) {
  if (!text) return text
  
  try {
    // 先处理 RFC 2047 编码（可能出现在正文中）
    if (/=\?[^?]+\?[BbQq]\?[^?]*\?=/.test(text)) {
      text = decodeRFC2047(text)
    }
    
    // 检测是否为 UTF-8 被错误解析为 Latin-1 的乱码
    // 常见模式：Ã¤ Ã¶ Ã¼ Ã© Ã¨ Ã  等（UTF-8 多字节字符被拆开）
    // 或者中文乱码：ä½ å¥½ï¼ˆ 等
    const garbledPatterns = [
      /[ÃÂ][^\x00-\x7F]/,           // UTF-8 双字节被拆开
      /Ã[¤¶¼©¨ ]/,                   // 德语等字符乱码
      /ä½\s*å¥½/,                    // 中文"你好"乱码
      /é®\s*ç®±/,                    // 中文"邮箱"乱码
      /[\xC0-\xDF][\x80-\xBF]/,     // UTF-8 双字节序列
      /[\xE0-\xEF][\x80-\xBF]{2}/,  // UTF-8 三字节序列
    ]
    
    const hasGarbled = garbledPatterns.some(pattern => pattern.test(text))
    
    if (hasGarbled) {
      // 尝试重新编码为 latin1 字节，然后用 UTF-8 解码
      const bytes = new Uint8Array(text.length)
      for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i) & 0xFF
      }
      const fixed = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      
      // 检查修复后是否有中文字符或其他非 ASCII 字符
      if (/[\u4e00-\u9fa5\u00C0-\u024F]/.test(fixed)) {
        console.log('✅ Fixed garbled text successfully')
        return fixed
      }
    }
    
    // 检测双重编码问题（UTF-8 编码后又被 UTF-8 编码）
    // 例如：ä¸­æ–‡ 应该是 中文
    if (/Ã[¤¶¼©¨ ­]/.test(text) || /â€[™"œ]/.test(text)) {
      try {
        // 先转为字节
        const encoder = new TextEncoder()
        const bytes = encoder.encode(text)
        // 尝试用 ISO-8859-1 解释这些字节
        let latin1Str = ''
        for (let i = 0; i < bytes.length; i++) {
          latin1Str += String.fromCharCode(bytes[i])
        }
        // 再用 UTF-8 解码
        const bytes2 = new Uint8Array(latin1Str.length)
        for (let i = 0; i < latin1Str.length; i++) {
          bytes2[i] = latin1Str.charCodeAt(i) & 0xFF
        }
        const fixed = new TextDecoder('utf-8', { fatal: false }).decode(bytes2)
        
        if (/[\u4e00-\u9fa5]/.test(fixed) && !/Ã/.test(fixed)) {
          console.log('✅ Fixed double-encoded UTF-8 text')
          return fixed
        }
      } catch (e) {
        // 忽略错误
      }
    }
  } catch (e) {
    console.error('Fix garbled text error:', e)
  }
  
  return text
}

// 辅助函数：从原始邮件中提取文本
function extractTextFromRaw(raw) {
  try {
    // 尝试多种模式匹配
    let textMatch = raw.match(/Content-Type:\s*text\/plain[\s\S]*?\n\n([\s\S]*?)(?=\n--|\nContent-Type:|$)/i)
    
    if (!textMatch) {
      // 尝试更宽松的匹配
      textMatch = raw.match(/Content-Type:\s*text\/plain[^\n]*\n+([^]*?)(?=\n--|\nContent-Type:|$)/i)
    }
    
    if (!textMatch) {
      // 最后尝试：查找所有 text/plain 之后到边界之前的内容
      const plainIndex = raw.toLowerCase().indexOf('content-type: text/plain')
      if (plainIndex !== -1) {
        const afterPlain = raw.substring(plainIndex)
        const bodyStart = afterPlain.search(/\n\n|\r\n\r\n/)
        if (bodyStart !== -1) {
          const bodyText = afterPlain.substring(bodyStart + 2)
          const boundaryIndex = bodyText.search(/\n--|--/)
          return boundaryIndex !== -1 ? bodyText.substring(0, boundaryIndex).trim() : bodyText.trim()
        }
      }
    }
    
    return textMatch ? textMatch[1].trim() : ''
  } catch (e) {
    console.error('extractTextFromRaw error:', e)
    return ''
  }
}

// 辅助函数：从原始邮件中提取HTML
function extractHtmlFromRaw(raw) {
  try {
    // 尝试多种模式匹配
    let htmlMatch = raw.match(/Content-Type:\s*text\/html[\s\S]*?\n\n([\s\S]*?)(?=\n--|\nContent-Type:|$)/i)
    
    if (!htmlMatch) {
      // 尝试更宽松的匹配
      htmlMatch = raw.match(/Content-Type:\s*text\/html[^\n]*\n+([^]*?)(?=\n--|\nContent-Type:|$)/i)
    }
    
    if (!htmlMatch) {
      // 最后尝试：查找所有 text/html 之后到边界之前的内容
      const htmlIndex = raw.toLowerCase().indexOf('content-type: text/html')
      if (htmlIndex !== -1) {
        const afterHtml = raw.substring(htmlIndex)
        const bodyStart = afterHtml.search(/\n\n|\r\n\r\n/)
        if (bodyStart !== -1) {
          const bodyText = afterHtml.substring(bodyStart + 2)
          const boundaryIndex = bodyText.search(/\n--|--/)
          return boundaryIndex !== -1 ? bodyText.substring(0, boundaryIndex).trim() : bodyText.trim()
        }
      }
    }
    
    return htmlMatch ? htmlMatch[1].trim() : ''
  } catch (e) {
    console.error('extractHtmlFromRaw error:', e)
    return ''
  }
}

// 生成消息ID
function generateMessageId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}@tempemail`
}

// 发送 WebSocket 通知
async function notifyNewEmail(env, data) {
  // 如果使用 Durable Objects，可以在这里广播
  // 简化版本：存储到 KV，让前端轮询
  if (env.NOTIFICATIONS) {
    const key = `notification:${Date.now()}`
    await env.NOTIFICATIONS.put(key, JSON.stringify({
      type: 'new_email',
      data
    }), {
      expirationTtl: 3600 // 1小时后过期
    })
  }
}

