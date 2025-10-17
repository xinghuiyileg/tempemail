import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 管理员状态管理
 */
export const useAdminStore = defineStore('admin', () => {
  const adminPassword = ref(null)
  const isAdmin = ref(false)

  // 从 localStorage 恢复管理员状态
  const initAdmin = () => {
    const saved = localStorage.getItem('admin_password')
    if (saved) {
      adminPassword.value = saved
      isAdmin.value = true
      console.log('👑 Admin session restored')
    }
  }

  // 管理员登录
  const loginAdmin = (password) => {
    if (!password) {
      throw new Error('请输入管理员密码')
    }
    
    adminPassword.value = password
    isAdmin.value = true
    localStorage.setItem('admin_password', password)
    console.log('👑 Admin logged in')
  }

  // 管理员登出
  const logoutAdmin = () => {
    adminPassword.value = null
    isAdmin.value = false
    localStorage.removeItem('admin_password')
    console.log('👑 Admin logged out')
  }

  // 获取管理员密码（用于 API 请求）
  const getAdminPassword = () => {
    return adminPassword.value
  }

  return {
    adminPassword,
    isAdmin,
    initAdmin,
    loginAdmin,
    logoutAdmin,
    getAdminPassword
  }
})

