const encoder = new TextEncoder()
const decoder = new TextDecoder()

function base64UrlEncode(bytes) {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(normalized + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function importKey(secret) {
  const keyData = encoder.encode(secret)
  return crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'HMAC',
      hash: 'SHA-256'
    },
    false,
    ['sign', 'verify']
  )
}

/**
 * 创建带签名的短期令牌
 * @param {Object} payload - 要编码的载荷
 * @param {string} secret - 签名密钥
 * @param {number} expiresIn - 有效期（秒）
 * @returns {Promise<string>} - 已签名的令牌
 */
export async function createSignedToken(payload, secret, expiresIn = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    iat: now,
    exp: now + expiresIn,
    ...payload
  }

  const headerBytes = encoder.encode(JSON.stringify(header))
  const payloadBytes = encoder.encode(JSON.stringify(fullPayload))
  const headerPart = base64UrlEncode(headerBytes)
  const payloadPart = base64UrlEncode(payloadBytes)
  const signingInput = `${headerPart}.${payloadPart}`

  const key = await importKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput))
  const signaturePart = base64UrlEncode(new Uint8Array(signature))

  return `${signingInput}.${signaturePart}`
}

/**
 * 验证令牌有效性并返回载荷
 * @param {string} token - 待验证的令牌
 * @param {string} secret - 签名密钥
 * @returns {Promise<Object|null>} - 返回载荷或 null（无效/过期）
 */
export async function verifySignedToken(token, secret) {
  if (!token || typeof token !== 'string') {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return null
  }

  const [headerPart, payloadPart, signaturePart] = parts
  const signingInput = `${headerPart}.${payloadPart}`

  try {
    const key = await importKey(secret)
    const signatureBytes = base64UrlDecode(signaturePart)
    const ok = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(signingInput))
    if (!ok) {
      return null
    }

    const payloadJson = JSON.parse(decoder.decode(base64UrlDecode(payloadPart)))
    const now = Math.floor(Date.now() / 1000)
    if (payloadJson.exp && payloadJson.exp < now) {
      return null
    }
    return payloadJson
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}
