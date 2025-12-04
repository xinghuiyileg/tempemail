import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { configAPI } from '@/services/api'
import apiClient from '@/services/api'

export const useConfigStore = defineStore('config', () => {
  const config = ref({
    domain_name: '',
    target_qq_email: '',
    monitor_interval: 10,
    auto_delete_days: 7,
    // 邮件服务商配置
    resend_api_key: '',
    resend_verified_domain: '',
    brevo_api_key: '',
    smtp2go_api_key: ''
  })
  
  const loading = ref(false)
  const isAdmin = ref(false)
  const adminEnabled = ref(false)
  const userDomains = ref([]) // 用户添加的已验证域名

  // 解析多域名配置（支持分号、中文分号、逗号）
  const systemDomains = computed(() => {
    if (!config.value.domain_name) return []
    
    return config.value.domain_name
      .split(/[;,；,]/)
      .map(d => d.trim())
      .filter(d => d.length > 0)
  })

  // 合并系统域名和用户域名
  const domainList = computed(() => {
    // 先用户域名，后系统域名，去重
    const allDomains = [
      ...userDomains.value.map(d => d.domain),
      ...systemDomains.value
    ]
    return [...new Set(allDomains)]
  })

  // 获取默认域名（第一个）
  const defaultDomain = computed(() => {
    return domainList.value[0] || 'yourdomain.com'
  })

  // 加载用户域名
  const loadUserDomains = async () => {
    try {
      const response = await apiClient.get('/domains/verified')
      if (response.data.success) {
        userDomains.value = response.data.data.domains || []
        console.log('✅ 用户域名加载成功:', userDomains.value.length, '个')
      }
    } catch (error) {
      console.error('⚠️ 加载用户域名失败:', error)
      // 失败不影响主流程
      userDomains.value = []
    }
  }

  // 加载配置
  const loadConfig = async () => {
    loading.value = true
    try {
      const response = await configAPI.get()
      const data = response.data.data
      
      // 更新配置
      config.value = {
        ...config.value,
        ...data.config
      }
      
      // 更新管理员状态
      isAdmin.value = data.isAdmin || false
      adminEnabled.value = data.adminEnabled || false
      
      console.log('Config loaded, isAdmin:', isAdmin.value)

      // 同时加载用户域名
      await loadUserDomains()
    } catch (error) {
      console.error('Failed to load config:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新配置
  const updateConfig = async (newConfig) => {
    try {
      await configAPI.update(newConfig)
      config.value = { ...config.value, ...newConfig }
    } catch (error) {
      console.error('Failed to update config:', error)
      throw error
    }
  }

  return {
    config,
    loading,
    isAdmin,
    adminEnabled,
    userDomains,
    systemDomains,
    domainList,
    defaultDomain,
    loadConfig,
    loadUserDomains,
    updateConfig
  }
})

