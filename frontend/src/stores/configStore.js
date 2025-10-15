import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { configAPI } from '@/services/api'

export const useConfigStore = defineStore('config', () => {
  const config = ref({
    domain_name: '',
    target_qq_email: '',
    monitor_interval: 10,
    auto_delete_days: 7
  })
  
  const loading = ref(false)

  // 解析多域名配置（支持分号、中文分号、逗号）
  const domainList = computed(() => {
    if (!config.value.domain_name) return []
    
    return config.value.domain_name
      .split(/[;,；,]/)
      .map(d => d.trim())
      .filter(d => d.length > 0)
  })

  // 获取默认域名（第一个）
  const defaultDomain = computed(() => {
    return domainList.value[0] || 'yourdomain.com'
  })

  // 加载配置
  const loadConfig = async () => {
    loading.value = true
    try {
      const response = await configAPI.get()
      config.value = {
        ...config.value,
        ...response.data.data
      }
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
    domainList,
    defaultDomain,
    loadConfig,
    updateConfig
  }
})

