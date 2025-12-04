/**
 * 简单的 SVG 验证码生成器
 * 适用于 Cloudflare Workers 环境（不依赖 Node.js 内置模块）
 */

/**
 * 生成随机验证码文本
 * @param {number} length - 验证码长度
 * @param {string} charset - 字符集
 * @returns {string} - 验证码文本
 */
function generateCaptchaText(length = 4, charset = '0123456789') {
  let text = ''
  for (let i = 0; i < length; i++) {
    text += charset[Math.floor(Math.random() * charset.length)]
  }
  return text
}

/**
 * 生成随机颜色
 * @returns {string} - RGB 颜色字符串
 */
function randomColor() {
  const r = Math.floor(Math.random() * 200)
  const g = Math.floor(Math.random() * 200)
  const b = Math.floor(Math.random() * 200)
  return `rgb(${r},${g},${b})`
}

/**
 * 生成随机浅色背景
 * @returns {string} - RGB 颜色字符串
 */
function randomLightColor() {
  const r = Math.floor(Math.random() * 55) + 200
  const g = Math.floor(Math.random() * 55) + 200
  const b = Math.floor(Math.random() * 55) + 200
  return `rgb(${r},${g},${b})`
}

/**
 * 生成 SVG 验证码
 * @param {Object} options - 配置选项
 * @returns {Object} - { text: 验证码文本, data: SVG 字符串 }
 */
export function createCaptcha(options = {}) {
  const {
    size = 4,
    width = 120,
    height = 40,
    fontSize = 28,
    noise = 2,
    color = true,
    background = null,
    charPreset = '0123456789'
  } = options

  // 生成验证码文本
  const text = generateCaptchaText(size, charPreset)
  
  // 背景颜色
  const bgColor = background || randomLightColor()
  
  // 开始构建 SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
  
  // 添加背景
  svg += `<rect width="${width}" height="${height}" fill="${bgColor}"/>`
  
  // 添加干扰线
  for (let i = 0; i < noise; i++) {
    const x1 = Math.random() * width
    const y1 = Math.random() * height
    const x2 = Math.random() * width
    const y2 = Math.random() * height
    const strokeColor = randomColor()
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="1"/>`
  }
  
  // 添加文字
  const charWidth = width / size
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const x = charWidth * i + charWidth / 2
    const y = height / 2 + fontSize / 3
    
    // 随机旋转角度（-15 到 15 度）
    const rotate = (Math.random() - 0.5) * 30
    
    // 随机颜色
    const fillColor = color ? randomColor() : '#000'
    
    // 添加文字
    svg += `<text x="${x}" y="${y}" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" fill="${fillColor}" text-anchor="middle" transform="rotate(${rotate} ${x} ${y})">${char}</text>`
  }
  
  // 添加更多干扰点
  for (let i = 0; i < 20; i++) {
    const cx = Math.random() * width
    const cy = Math.random() * height
    const r = Math.random() * 2
    const fillColor = randomColor()
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}"/>`
  }
  
  svg += '</svg>'
  
  return {
    text,
    data: svg
  }
}

/**
 * 验证码存储管理器（使用 D1 数据库）
 */
export class CaptchaStore {
  constructor(db) {
    this.db = db
    this.expirationTime = 5 * 60 * 1000 // 5分钟
  }

  /**
   * 生成唯一ID
   * @returns {string}
   */
  generateId() {
    return `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 存储验证码
   * @param {string} text - 验证码文本
   * @returns {string} - 验证码ID
   */
  async set(text) {
    const id = this.generateId()
    const timestamp = Date.now()

    if (this.db) {
      try {
        // 存储到数据库
        await this.db.prepare(`
          INSERT INTO captchas (id, text, timestamp)
          VALUES (?, ?, ?)
        `).bind(id, text.toLowerCase(), timestamp).run()
      } catch (error) {
        console.error('存储验证码到数据库失败:', error)
      }
    }

    return id
  }

  /**
   * 获取验证码
   * @param {string} id - 验证码ID
   * @returns {Object|null} - 验证码数据或 null
   */
  async get(id) {
    if (!this.db) {
      return null
    }

    try {
      const result = await this.db.prepare(`
        SELECT text, timestamp FROM captchas WHERE id = ?
      `).bind(id).first()

      return result || null
    } catch (error) {
      console.error('获取验证码失败:', error)
      return null
    }
  }

  /**
   * 删除验证码
   * @param {string} id - 验证码ID
   */
  async delete(id) {
    if (!this.db) {
      return
    }

    try {
      await this.db.prepare(`
        DELETE FROM captchas WHERE id = ?
      `).bind(id).run()
    } catch (error) {
      console.error('删除验证码失败:', error)
    }
  }

  /**
   * 验证验证码
   * @param {string} id - 验证码ID
   * @param {string} code - 用户输入的验证码
   * @returns {boolean} - 是否验证成功
   */
  async verify(id, code) {
    const stored = await this.get(id)
    if (!stored) {
      console.log(`❌ 验证码不存在: ${id}`)
      return false
    }

    // 检查是否过期
    if (Date.now() - stored.timestamp > this.expirationTime) {
      console.log(`❌ 验证码已过期: ${id}`)
      await this.delete(id)
      return false
    }

    // 验证码比对（不区分大小写，去除前后空格）
    const inputCode = (code || '').trim().toLowerCase()
    const isValid = stored.text === inputCode

    console.log(`🔍 验证码验证: ${id}, 存储=${stored.text}, 输入=${inputCode}, 原始输入="${code}", 结果=${isValid}`)

    // 验证成功后删除（一次性使用）
    if (isValid) {
      await this.delete(id)
    }

    return isValid
  }

  /**
   * 清理过期验证码
   */
  async cleanExpired() {
    if (!this.db) {
      return
    }

    try {
      const expiredTime = Date.now() - this.expirationTime
      await this.db.prepare(`
        DELETE FROM captchas WHERE timestamp < ?
      `).bind(expiredTime).run()
    } catch (error) {
      console.error('清理过期验证码失败:', error)
    }
  }
}

