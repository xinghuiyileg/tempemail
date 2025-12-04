import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { setLoginMethod, clearLoginMethod, getLoginMethod, setUserId } from '@/utils/userManager'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787/api'
const USER_ROLE_KEY = 'tempemail_user_role' // 用户角色存储key

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('auth_token') || '')
  const authEnabled = ref(false)
  const isChecking = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  
  // 是否是管理员（通过访问密码登录）
  const isAdmin = computed(() => {
    return isAuthenticated.value && getLoginMethod() === 'password'
  })

  // 检查是否启用了访问控制
  const checkAuthStatus = async () => {
    isChecking.value = true
    try {
      const response = await axios.get(`${API_BASE}/auth/check`)
      authEnabled.value = response.data.data.enabled
      return response.data.data.enabled
    } catch (error) {
      console.error('Check auth status failed:', error)
      // 如果检查失败，抛出异常让调用者处理
      authEnabled.value = false
      throw error
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
        
        // 设置登录方式为密码登录
        setLoginMethod('password')
        
        // 如果后端返回了固定的用户ID，使用它
        if (response.data.data.userId) {
          setUserId(response.data.data.userId)
          console.log('✅ 使用固定的管理员用户ID:', response.data.data.userId)
        }
        
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

  // 账号注册
  const register = async (username, password, captchaId, captchaCode) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        username,
        password,
        captchaId,
        captchaCode
      })

      if (response.data.success) {
        return response.data
      } else {
        throw new Error(response.data.error || '注册失败')
      }
    } catch (error) {
      console.error('Register error:', error)
      if (error.response?.status === 409) {
        throw new Error('用户名已存在')
      }
      throw new Error(error.response?.data?.error || '注册失败')
    }
  }

  // 账号登录
  const accountLogin = async (username, password, captchaId, captchaCode) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/account-login`, {
        username,
        password,
        captchaId,
        captchaCode
      })

      if (response.data.success) {
        token.value = response.data.data.token
        localStorage.setItem('auth_token', token.value)

        // 设置登录方式为账号登录
        setLoginMethod('account')

        // 如果后端返回了用户ID，使用它（确保同一账号在不同设备使用相同ID）
        if (response.data.data.userId) {
          setUserId(response.data.data.userId)
          console.log('✅ 使用账号对应的用户ID:', response.data.data.userId)
        }

        // 保存用户角色信息
        if (response.data.data.role) {
          localStorage.setItem(USER_ROLE_KEY, response.data.data.role)
          console.log('✅ 用户角色:', response.data.data.role)
        }

        // 设置 axios 默认 header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

        return response.data
      } else {
        throw new Error(response.data.error || '登录失败')
      }
    } catch (error) {
      console.error('Account login error:', error)
      if (error.response?.status === 401) {
        throw new Error('用户名或密码错误')
      }
      if (error.response?.status === 403) {
        throw new Error(error.response?.data?.error || '账号已被封禁')
      }
      throw new Error(error.response?.data?.error || '登录失败')
    }
  }

  // OAuth 登录（百度等第三方）
  const loginWithOAuth = async (provider) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/oauth`, {
        provider
      })

      if (response.data.success) {
        token.value = response.data.data.token
        localStorage.setItem('auth_token', token.value)
        
        // 设置登录方式为OAuth登录，并切换到对应的用户ID
        setLoginMethod(`oauth_${provider}`)
        
        // 设置 axios 默认 header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        
        return response.data
      } else {
        throw new Error(response.data.error || 'OAuth 登录失败')
      }
    } catch (error) {
      console.error('OAuth login error:', error)
      throw new Error(error.response?.data?.error || 'OAuth 登录失败')
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
      localStorage.removeItem(USER_ROLE_KEY)  // 清除用户角色
      delete axios.defaults.headers.common['Authorization']

      // 清除登录方式
      clearLoginMethod()
    }
  }

  // 初始化认证（设置 axios header）
  const initAuth = () => {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    }
  }

  // 检查是否是管理员（访问密码登录 或 账号登录且角色为admin）
  const isUserAdmin = computed(() => {
    // 使用正确的函数和key获取登录方式和角色
    const loginMethod = getLoginMethod()
    const userRole = localStorage.getItem(USER_ROLE_KEY)

    console.log('🔍 检查管理员权限:', { loginMethod, userRole, isAuthenticated: isAuthenticated.value })

    // 必须先登录
    if (!isAuthenticated.value) {
      console.log('❌ 未登录')
      return false
    }

    // 访问密码登录的用户是管理员
    if (loginMethod === 'password') {
      console.log('✅ 访问密码登录 -> 管理员')
      return true
    }

    // 账号登录且角色为admin的用户是管理员
    if (loginMethod === 'account' && userRole === 'admin') {
      console.log('✅ 管理员账号登录 -> 管理员')
      return true
    }

    console.log('❌ 普通用户 (loginMethod:', loginMethod, ', userRole:', userRole, ')')
    return false
  })

  return {
    // 状态
    token,
    authEnabled,
    isChecking,
    isAuthenticated,
    isAdmin,
    isUserAdmin,

    // 方法
    checkAuthStatus,
    login,
    register,
    accountLogin,
    loginWithOAuth,
    verifyToken,
    logout,
    initAuth
  }
})

