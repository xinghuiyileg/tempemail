/**
 * 邮件内容解码工具
 * 处理 quoted-printable、base64、HTML 实体、RFC 2047 等编码
 */

/**
 * 解码 RFC 2047 编码的邮件头
 * 格式: =?charset?encoding?encoded_text?=
 * 例如: =?UTF-8?B?5L2g5aW9?= 或 =?UTF-8?Q?Hello?=
 */
export function decodeRFC2047(str) {
  if (!str) return str
  
  try {
    const pattern = /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g
    
    return str.replace(pattern, (match, charset, encoding, encodedText) => {
      try {
        let bytes
        
        if (encoding.toUpperCase() === 'B') {
          // Base64 编码
          const binary = atob(encodedText)
          bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }
        } else if (encoding.toUpperCase() === 'Q') {
          // Quoted-Printable 编码（RFC 2047 变体）
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
          return match
        }
        
        // 尝试用指定字符集解码，失败则用 UTF-8
        try {
          const normalizedCharset = charset.toLowerCase().includes('gb') ? 'utf-8' : charset
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
    return str
  }
}

/**
 * 修复乱码文本（UTF-8 被错误解析为 Latin-1）
 */
export function fixGarbledText(text) {
  if (!text) return text
  
  try {
    // 先处理 RFC 2047 编码
    if (/=\?[^?]+\?[BbQq]\?[^?]*\?=/.test(text)) {
      text = decodeRFC2047(text)
    }
    
    // 检测乱码模式
    const garbledPatterns = [
      /[ÃÂ][^\x00-\x7F]/,
      /ä½\s*å¥½/,
      /é®\s*ç®±/,
      /Ã[¤¶¼©¨ ­]/,
      /â€[™"œ]/,
    ]
    
    const hasGarbled = garbledPatterns.some(pattern => pattern.test(text))
    
    if (hasGarbled) {
      // 尝试修复：将 Latin-1 字节重新解释为 UTF-8
      const bytes = new Uint8Array(text.length)
      for (let i = 0; i < text.length; i++) {
        bytes[i] = text.charCodeAt(i) & 0xFF
      }
      const fixed = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      
      if (/[\u4e00-\u9fa5\u00C0-\u024F]/.test(fixed) && !/[ÃÂ]/.test(fixed)) {
        return fixed
      }
    }
  } catch (e) {
    console.error('Fix garbled text error:', e)
  }
  
  return text
}

/**
 * 解码 quoted-printable 编码
 * @param {string} str - 编码的字符串
 * @returns {string} - 解码后的字符串
 */
export function decodeQuotedPrintable(str) {
  if (!str) return ''
  
  try {
    // 替换软换行（=\r\n 或 =\n）
    str = str.replace(/=\r?\n/g, '')
    
    // 解码 =XX 格式的十六进制字符
    str = str.replace(/=([0-9A-F]{2})/gi, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16))
    })
    
    // 尝试修复乱码
    str = fixGarbledText(str)
    
    return str
  } catch (error) {
    console.error('Quoted-printable decode error:', error)
    return str
  }
}

/**
 * 解码 HTML 实体
 * @param {string} str - 包含 HTML 实体的字符串
 * @returns {string} - 解码后的字符串
 */
export function decodeHtmlEntities(str) {
  if (!str) return ''
  
  const textarea = document.createElement('textarea')
  textarea.innerHTML = str
  return textarea.value
}

/**
 * 解析 MIME multipart 邮件
 * @param {string} content - 邮件内容
 * @returns {object} - 解析后的邮件部分 { text, html }
 */
function parseMimeMultipart(content) {
  if (!content) return { text: '', html: '' }
  
  // 检测 MIME 边界
  const boundaryMatch = content.match(/--([_=a-z0-9]+)/i)
  if (!boundaryMatch) return { text: content, html: '' }
  
  const boundary = boundaryMatch[1]
  const parts = content.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'))
  
  let textPart = ''
  let htmlPart = ''
  
  for (const part of parts) {
    if (!part || part.trim() === '--') continue
    
    // 检测内容类型
    const isText = /Content-Type:\s*text\/plain/i.test(part)
    const isHtml = /Content-Type:\s*text\/html/i.test(part)
    const isQuotedPrintable = /Content-Transfer-Encoding:\s*quoted-printable/i.test(part)
    const isBase64 = /Content-Transfer-Encoding:\s*base64/i.test(part)
    
    // 移除 MIME 头部，提取内容
    const contentMatch = part.match(/Content-Transfer-Encoding:[^\n]*\n\s*\n([\s\S]*)/i)
    let partContent = contentMatch ? contentMatch[1] : part
    
    // 如果没有匹配到，尝试从 Content-Type 后提取
    if (!contentMatch) {
      const typeMatch = part.match(/Content-Type:[^\n]*\n\s*\n([\s\S]*)/i)
      partContent = typeMatch ? typeMatch[1] : part
    }
    
    // 解码内容
    if (isQuotedPrintable) {
      partContent = decodeQuotedPrintable(partContent)
    } else if (isBase64) {
      try {
        partContent = atob(partContent.replace(/\s/g, ''))
      } catch (e) {
        console.warn('Base64 decode failed:', e)
      }
    }
    
    // 分配到对应的部分
    if (isText && !textPart) {
      textPart = partContent.trim()
    } else if (isHtml && !htmlPart) {
      htmlPart = partContent.trim()
    }
  }
  
  return { text: textPart, html: htmlPart }
}

/**
 * 移除 MIME 头部信息
 * @param {string} content - 邮件内容
 * @returns {string} - 清理后的内容
 */
function removeMimeHeaders(content) {
  if (!content) return ''
  
  // 移除 MIME 边界分隔符
  content = content.replace(/--[_=a-z0-9]+--?/gi, '')
  
  // 移除 Content-Type 和 Content-Transfer-Encoding 头部
  content = content.replace(/^Content-Type:.*$/gim, '')
  content = content.replace(/^Content-Transfer-Encoding:.*$/gim, '')
  content = content.replace(/^Content-Disposition:.*$/gim, '')
  
  // 移除多余的空行
  content = content.replace(/\n{3,}/g, '\n\n')
  
  return content.trim()
}

/**
 * 检测并解码邮件内容
 * @param {string} content - 邮件内容
 * @param {string} encoding - 编码类型（如 'quoted-printable', 'base64'）
 * @returns {string} - 解码后的内容
 */
export function decodeEmailContent(content, encoding = 'auto') {
  if (!content) return ''
  
  // 先处理 RFC 2047 编码
  if (/=\?[^?]+\?[BbQq]\?[^?]*\?=/.test(content)) {
    content = decodeRFC2047(content)
  }
  
  // 检测是否是 MIME multipart 邮件
  const isMimeMultipart = /--[_=a-z0-9]+/i.test(content) && /Content-Type:/i.test(content)
  
  if (isMimeMultipart) {
    const { text, html } = parseMimeMultipart(content)
    // 优先返回 HTML，否则返回纯文本
    content = html || text || content
  }
  
  // 移除残留的 MIME 头部
  content = removeMimeHeaders(content)
  
  // 自动检测 quoted-printable 编码
  const hasQuotedPrintable = /=[0-9A-F]{2}/i.test(content) || /=\r?\n/.test(content)
  
  let decoded = content
  
  // 如果是 quoted-printable 编码或自动检测到
  if (encoding === 'quoted-printable' || (encoding === 'auto' && hasQuotedPrintable)) {
    decoded = decodeQuotedPrintable(decoded)
  }
  
  // 如果是 base64 编码
  if (encoding === 'base64') {
    try {
      const binary = atob(decoded.replace(/\s/g, ''))
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
    } catch (error) {
      console.error('Base64 decode error:', error)
    }
  }
  
  // 解码 HTML 实体
  decoded = decodeHtmlEntities(decoded)
  
  // 最后尝试修复乱码
  decoded = fixGarbledText(decoded)
  
  return decoded
}

/**
 * 清理和格式化邮件 HTML 内容
 * @param {string} html - HTML 内容
 * @returns {string} - 清理后的 HTML
 */
export function sanitizeEmailHtml(html) {
  if (!html) return ''
  
  // 首先尝试解码
  html = decodeEmailContent(html)
  
  // 再次尝试修复乱码（确保处理）
  html = fixGarbledText(html)
  
  // 移除危险的标签和属性
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'link', 'style']
  const dangerousAttrs = ['onerror', 'onload', 'onclick', 'onmouseover']
  
  let cleaned = html
  
  // 移除危险标签
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<${tag}[^>]*>.*?<\/${tag}>`, 'gis')
    cleaned = cleaned.replace(regex, '')
    cleaned = cleaned.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '')
  })
  
  // 移除危险属性
  dangerousAttrs.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi')
    cleaned = cleaned.replace(regex, '')
  })
  
  // 移除 javascript: 协议
  cleaned = cleaned.replace(/javascript:/gi, '')
  
  return cleaned
}

/**
 * 清理纯文本邮件内容
 * @param {string} text - 纯文本内容
 * @returns {string} - 清理后的文本
 */
export function sanitizeEmailText(text) {
  if (!text) return ''
  
  // 解码内容
  text = decodeEmailContent(text)
  
  // 再次尝试修复乱码（确保处理）
  text = fixGarbledText(text)
  
  // 清理链接格式：移除 [url] 中的 URL，只保留显示文本
  text = text.replace(/\[https?:\/\/[^\]]+\]/g, '')
  
  // 清理 "Unsubscribe" 和 "Having trouble" 等常见邮件尾部文本
  text = text.replace(/Unsubscribe to no longer receive emails.*$/i, '')
  text = text.replace(/Having trouble reading this email.*$/i, '')
  text = text.replace(/\|\s*Having trouble.*$/i, '')
  
  // 移除多余的空白行（保留段落结构）
  text = text.replace(/\n{3,}/g, '\n\n')
  
  // 移除行首尾空白，但保留段落缩进
  text = text.split('\n').map(line => line.trimEnd()).join('\n')
  
  // 移除开头和结尾的空白
  text = text.trim()
  
  // 如果文本过短（可能是清理过度），返回提示
  if (text.length < 10) {
    return '(邮件内容已解析，请查看详细信息)'
  }
  
  return text
}

