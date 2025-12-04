import axios from 'axios'
import { getUserId } from '@/utils/userManager'

// 本地开发时默认使用 localhost:8787
// 生产环境通过 .env.production 配置
const API_BASE = import.meta.env.VITE_API_BASE || 
  (import.meta.env.MODE === 'production' 
    ? 'https://tempemail-back.pslucieljw.workers.dev/api' 
    : 'http://localhost:8787/api')

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 重试配置
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1秒

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 添加用户 ID（用于用户隔离）
    const userId = getUserId()
    config.headers['X-User-ID'] = userId
    
    // 添加认证 token（如果有）
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加管理员密码（所有 /config 接口都需要）
    if (config.url?.includes('/config')) {
      const adminPassword = localStorage.getItem('admin_password')
      if (adminPassword) {
        config.headers['X-Admin-Password'] = adminPassword
        console.log('Admin password added to request:', config.url)
      }
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const config = error.config
    
    // 如果是网络错误且还没重试过，启用重试
    if (!config._retryCount && 
        (error.code === 'ECONNREFUSED' || 
         error.code === 'ERR_NETWORK' ||
         !error.response)) {
      
      config._retryCount = config._retryCount || 0
      
      if (config._retryCount < MAX_RETRIES) {
        config._retryCount++
        console.log(`🔄 API请求失败，${RETRY_DELAY}ms后重试 (${config._retryCount}/${MAX_RETRIES})...`)
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config._retryCount))
        return apiClient(config)
      }
    }
    
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 邮箱相关API
export const emailAPI = {
  // 创建临时邮箱
  create: (params = {}) => apiClient.post('/emails/create', params),
  
  // 获取邮箱列表（支持搜索）
  list: (page = 1, limit = 5, search = '') => apiClient.get('/emails/list', { params: { page, limit, search } }),
  
  // 删除邮箱
  delete: (id) => apiClient.delete(`/emails/${id}`),
  
  // 批量删除
  batchDelete: (ids) => apiClient.post('/emails/batch-delete', { ids }),
  
  // 删除所有非星标邮箱
  clearAll: () => apiClient.delete('/emails/clear-all'),
  
  // 星标/取消星标
  toggleStar: (id, isStarred) => apiClient.put(`/emails/${id}/star`, { is_starred: isStarred })
}

// 邮件消息相关API
export const messageAPI = {
  // 获取邮件列表（支持搜索）
  list: (emailId, page = 1, limit = 4, search = '') => 
    apiClient.get(`/emails/${emailId}/messages`, { params: { page, limit, search: search || undefined } }),
  
  // 获取邮件详情
  get: (id) => apiClient.get(`/messages/${id}`),
  
  // 标记为已读
  markAsRead: (id) => apiClient.put(`/messages/${id}/read`),

  // 删除单封
  delete: (id) => apiClient.delete(`/messages/${id}`),

  // 批量删除邮件
  batchDelete: (ids) => apiClient.post('/messages/batch-delete', { ids }),

  // 清空某邮箱所有邮件
  clearByEmail: (emailId) => apiClient.delete(`/emails/${emailId}/messages`)
}

// 监控相关API
export const monitorAPI = {
  // 获取监控状态
  status: () => apiClient.get('/monitor/status'),
  
  // 启动/停止监控
  toggle: (action) => apiClient.post('/monitor/toggle', { action })
}

// 配置相关API
export const configAPI = {
  // 获取配置
  get: () => apiClient.get('/config'),
  
  // 更新配置
  update: (data) => apiClient.put('/config', data)
}

// 管理员相关API
export const adminAPI = {
  // 验证管理员密码
  verify: (password) => apiClient.post('/auth/admin/verify', { password })
}

export default apiClient

