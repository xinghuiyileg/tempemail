/**
 * 统一配置管理器
 * 
 * 配置读取优先级：
 * 1. D1 数据库 (最高优先级)
 * 2. 环境变量 (wrangler.toml)
 * 3. 默认值 (最低优先级)
 */

// 所有支持的配置键
export const CONFIG_KEYS = {
  // 基础配置
  DOMAIN_NAME: 'domain_name',
  TARGET_QQ_EMAIL: 'target_qq_email',
  QQ_IMAP_PASSWORD: 'qq_imap_password',
  MONITOR_INTERVAL: 'monitor_interval',
  AUTO_DELETE_DAYS: 'auto_delete_days',
  
  // Cloudflare 配置
  CLOUDFLARE_API_TOKEN: 'cloudflare_api_token',
  CLOUDFLARE_ACCOUNT_ID: 'cloudflare_account_id',
  CLOUDFLARE_ZONE_ID: 'cloudflare_zone_id',
  
  // TempMailApi (仅环境变量)
  TEMPMAILAPI_KEY: 'tempmailapi_key',
  
  // 邮件服务商
  RESEND_API_KEY: 'resend_api_key',
  RESEND_VERIFIED_DOMAIN: 'resend_verified_domain',
  BREVO_API_KEY: 'brevo_api_key',
  SMTP2GO_API_KEY: 'smtp2go_api_key',
  
  // 认证 (仅环境变量)
  ACCESS_PASSWORD: 'access_password'
}

// 仅从环境变量读取的配置（不存储在数据库）
const ENV_ONLY_KEYS = [
  CONFIG_KEYS.TEMPMAILAPI_KEY,
  CONFIG_KEYS.ACCESS_PASSWORD
]

// 配置默认值
const DEFAULT_VALUES = {
  [CONFIG_KEYS.DOMAIN_NAME]: 'yourdomain.com',
  [CONFIG_KEYS.MONITOR_INTERVAL]: '5',
  [CONFIG_KEYS.AUTO_DELETE_DAYS]: '7'
}

/**
 * 配置管理器类
 */
export class ConfigManager {
  /**
   * 获取单个配置项
   * @param {string} key - 配置键 (使用 CONFIG_KEYS 中的值)
   * @param {object} env - Workers环境对象
   * @param {any} defaultValue - 默认值
   * @returns {Promise<any>} 配置值
   */
  static async get(key, env, defaultValue = null) {
    try {
      // 仅环境变量的配置，直接从 env 读取
      if (ENV_ONLY_KEYS.includes(key)) {
        const envKey = key.toUpperCase()
        return env[envKey] || defaultValue || DEFAULT_VALUES[key] || null
      }
      
      // 1. 尝试从数据库读取
      if (env.DB) {
        const dbValue = await this.getFromDB(key, env)
        if (dbValue !== null && dbValue !== undefined && dbValue !== '') {
          return dbValue
        }
      }
      
      // 2. 从环境变量读取
      const envKey = key.toUpperCase()
      if (env[envKey]) {
        return env[envKey]
      }
      
      // 3. 返回默认值
      return defaultValue || DEFAULT_VALUES[key] || null
    } catch (error) {
      console.error(`ConfigManager.get error for key ${key}:`, error)
      // 出错时尝试从环境变量读取
      const envKey = key.toUpperCase()
      return env[envKey] || defaultValue || DEFAULT_VALUES[key] || null
    }
  }
  
  /**
   * 从数据库读取单个配置
   * @param {string} key - 配置键
   * @param {object} env - Workers环境对象
   * @returns {Promise<string|null>} 配置值
   */
  static async getFromDB(key, env) {
    try {
      const result = await env.DB.prepare(`
        SELECT config_value FROM config WHERE config_key = ?
      `).bind(key).first()
      
      return result?.config_value || null
    } catch (error) {
      console.error(`Failed to get config ${key} from DB:`, error)
      return null
    }
  }
  
  /**
   * 批量获取所有配置
   * @param {object} env - Workers环境对象
   * @param {boolean} includeEnvVars - 是否包含仅环境变量的配置
   * @returns {Promise<object>} 配置对象
   */
  static async getAll(env, includeEnvVars = true) {
    const config = {}
    
    try {
      // 从数据库读取所有配置
      const dbConfigs = await this.getAllFromDB(env)
      
      // 合并所有配置键
      for (const [constantKey, configKey] of Object.entries(CONFIG_KEYS)) {
        if (!includeEnvVars && ENV_ONLY_KEYS.includes(configKey)) {
          continue // 跳过仅环境变量的配置
        }
        
        // 优先使用数据库配置，其次环境变量，最后默认值
        config[configKey] = 
          dbConfigs[configKey] || 
          env[constantKey] || 
          DEFAULT_VALUES[configKey] || 
          null
      }
      
      return config
    } catch (error) {
      console.error('ConfigManager.getAll error:', error)
      
      // 出错时返回环境变量配置
      const fallbackConfig = {}
      for (const [constantKey, configKey] of Object.entries(CONFIG_KEYS)) {
        fallbackConfig[configKey] = env[constantKey] || DEFAULT_VALUES[configKey] || null
      }
      return fallbackConfig
    }
  }
  
  /**
   * 从数据库读取所有配置
   * @param {object} env - Workers环境对象
   * @returns {Promise<object>} 配置对象
   */
  static async getAllFromDB(env) {
    try {
      const result = await env.DB.prepare(`
        SELECT config_key, config_value FROM config
      `).all()
      
      const config = {}
      for (const row of result.results || []) {
        config[row.config_key] = row.config_value
      }
      
      return config
    } catch (error) {
      console.error('Failed to get all configs from DB:', error)
      return {}
    }
  }
  
  /**
   * 设置配置项
   * @param {string} key - 配置键
   * @param {any} value - 配置值
   * @param {object} env - Workers环境对象
   * @returns {Promise<boolean>} 是否成功
   */
  static async set(key, value, env) {
    // 不允许通过此方法设置仅环境变量的配置
    if (ENV_ONLY_KEYS.includes(key)) {
      console.warn(`Cannot set env-only config ${key} via ConfigManager`)
      return false
    }
    
    try {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO config (config_key, config_value, updated_at)
        VALUES (?, ?, datetime('now'))
      `).bind(key, value || '').run()
      
      console.log(`✅ Config updated: ${key}`)
      return true
    } catch (error) {
      console.error(`Failed to set config ${key}:`, error)
      return false
    }
  }
  
  /**
   * 批量设置配置项
   * @param {object} configs - 配置对象 { key: value, ... }
   * @param {object} env - Workers环境对象
   * @returns {Promise<number>} 成功更新的配置项数量
   */
  static async setMany(configs, env) {
    let successCount = 0
    
    for (const [key, value] of Object.entries(configs)) {
      if (await this.set(key, value, env)) {
        successCount++
      }
    }
    
    return successCount
  }
  
  /**
   * 删除配置项
   * @param {string} key - 配置键
   * @param {object} env - Workers环境对象
   * @returns {Promise<boolean>} 是否成功
   */
  static async delete(key, env) {
    try {
      await env.DB.prepare(`
        DELETE FROM config WHERE config_key = ?
      `).bind(key).run()
      
      console.log(`✅ Config deleted: ${key}`)
      return true
    } catch (error) {
      console.error(`Failed to delete config ${key}:`, error)
      return false
    }
  }
  
  /**
   * 创建增强的 env 对象（包含所有配置）
   * 用于向后兼容，允许通过 env.DOMAIN_NAME 等方式访问配置
   * @param {object} env - 原始 Workers 环境对象
   * @returns {Promise<object>} 增强的 env 对象
   */
  static async createEnhancedEnv(env) {
    const allConfigs = await this.getAll(env)
    
    // 创建增强的 env 对象
    const enhancedEnv = { ...env }
    
    // 添加所有配置到 env 对象（使用大写键名）
    // 数据库配置优先，会覆盖环境变量
    for (const [configKey, value] of Object.entries(allConfigs)) {
      const envKey = configKey.toUpperCase()
      // 如果有值，就添加（数据库配置优先）
      if (value !== null && value !== undefined && value !== '') {
        enhancedEnv[envKey] = value
        console.log(`📋 ConfigManager: ${envKey} = ${typeof value === 'string' && value.length > 30 ? value.substring(0, 20) + '...' : value}`)
      }
    }
    
    console.log(`✅ Enhanced env created with ${Object.keys(allConfigs).length} configs`)
    return enhancedEnv
  }
  
  /**
   * 检查配置是否已设置
   * @param {string} key - 配置键
   * @param {object} env - Workers环境对象
   * @returns {Promise<boolean>} 是否已设置
   */
  static async has(key, env) {
    const value = await this.get(key, env)
    return value !== null && value !== undefined && value !== ''
  }
  
  /**
   * 获取配置的来源
   * @param {string} key - 配置键
   * @param {object} env - Workers环境对象
   * @returns {Promise<string>} 'database' | 'env' | 'default' | 'none'
   */
  static async getSource(key, env) {
    // 检查数据库
    if (env.DB) {
      const dbValue = await this.getFromDB(key, env)
      if (dbValue !== null && dbValue !== '') {
        return 'database'
      }
    }
    
    // 检查环境变量
    const envKey = key.toUpperCase()
    if (env[envKey]) {
      return 'env'
    }
    
    // 检查默认值
    if (DEFAULT_VALUES[key]) {
      return 'default'
    }
    
    return 'none'
  }
}

/**
 * 简化的配置获取函数（兼容旧代码）
 */
export async function getConfig(key, env, defaultValue = null) {
  return ConfigManager.get(key, env, defaultValue)
}

export default ConfigManager









