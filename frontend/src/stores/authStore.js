import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787/api'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('auth_token') || '')
  const authEnabled = ref(false)
  const isChecking = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)

  // 检查是否启用了访问控制
  const checkAuthStatus = async () => {
    isChecking.value = true
    try {
      const response = await axios.get(`${API_BASE}/auth/check`)
      authEnabled.value = response.data.data.enabled
      return response.data.data.enabled
    } catch (error) {
      console.error('Check auth status failed:', error)
      // 如果检查失败，假设未启用
      authEnabled.value = false
      return false
    } finally {
      isChecking.value = false
    }
  }

  // 登录
  const login = async (password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        password
      })

      if (response.data.success) {
        token.value = response.data.data.token
        localStorage.setItem('auth_token', token.value)
        
        // 设置 axios 默认 header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        
        return response.data
      } else {
        throw new Error(response.data.error || '登录失败')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error.response?.status === 401) {
        throw new Error('密码错误')
      }
      throw new Error(error.response?.data?.error || '登录失败')
    }
  }

  // 验证令牌
  const verifyToken = async () => {
    if (!token.value) return false

    try {
      const response = await axios.post(`${API_BASE}/auth/verify`, {
        token: token.value
      })
      
      return response.data.data.valid
    } catch (error) {
      console.error('Verify token error:', error)
      return false
    }
  }

  // 登出
  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      token.value = ''
      localStorage.removeItem('auth_token')
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // 初始化认证（设置 axios header）
  const initAuth = () => {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  return {
    // 状态
    token,
    authEnabled,
    isChecking,
    isAuthenticated,
    
    // 方法
    checkAuthStatus,
    login,
    verifyToken,
    logout,
    initAuth
  }
})

