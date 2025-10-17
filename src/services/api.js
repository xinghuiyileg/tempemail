import axios from 'axios'
import { getUserId } from '@/utils/userManager'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

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
    
    // 添加管理员密码（仅配置更新接口需要）
    if (config.url?.includes('/config') && 
        (config.method === 'post' || config.method === 'put')) {
      const adminPassword = localStorage.getItem('admin_password')
      if (adminPassword) {
        config.headers['X-Admin-Password'] = adminPassword
        console.log('Admin password added to request')
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
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 邮箱相关API
export const emailAPI = {
  // 创建临时邮箱
  create: (params = {}) => apiClient.post('/emails/create', params),
  
  // 获取邮箱列表
  list: (page = 1, limit = 5) => apiClient.get('/emails/list', { params: { page, limit } }),
  
  // 删除邮箱
  delete: (id) => apiClient.delete(`/emails/${id}`),
  
  // 批量删除
  batchDelete: (ids) => apiClient.post('/emails/batch-delete', { ids })
}

// 邮件消息相关API
export const messageAPI = {
  // 获取邮件列表
  list: (emailId, page = 1, limit = 4) => 
    apiClient.get(`/emails/${emailId}/messages`, { params: { page, limit } }),
  
  // 获取邮件详情
  get: (id) => apiClient.get(`/messages/${id}`),
  
  // 标记为已读
  markAsRead: (id) => apiClient.put(`/messages/${id}/read`),

  // 删除单封
  delete: (id) => apiClient.delete(`/messages/${id}`),

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

export default apiClient

