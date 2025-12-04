const encoder = new TextEncoder()

export function generateSalt(length = 16) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function digest(input) {
  const data = encoder.encode(input)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 生成带盐哈希
 * @param {string} password
 * @param {string} [salt]
 * @returns {Promise<string>} salt$hash
 */
export async function hashPassword(password, salt = generateSalt()) {
  const hash = await digest(`${password}:${salt}`)
  return `${salt}$${hash}`
}

/**
 * 验证明文密码是否匹配
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, stored) {
  if (!stored) return false

  if (stored.includes('$')) {
    const [salt] = stored.split('$')
    const hashedInput = await hashPassword(password, salt)
    return hashedInput === stored
  }

  // fallback legacy format `hash_password_timestamp`
  if (stored.startsWith('hash_')) {
    return stored.startsWith(`hash_${password}_`)
  }

  return false
}
