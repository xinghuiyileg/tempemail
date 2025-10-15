import { defineStore } from 'pinia'
import { ref } from 'vue'
import { monitorAPI } from '@/services/api'

export const useMonitorStore = defineStore('monitor', () => {
  const status = ref('stopped') // running, stopped, connecting
  const lastCheckTime = ref(null)
  const loading = ref(false)

  // 加载监控状态
  const loadStatus = async () => {
    loading.value = true
    try {
      const response = await monitorAPI.status()
      const data = response.data.data
      
      status.value = data.status || 'stopped'
      lastCheckTime.value = data.last_check_at
    } catch (error) {
      console.error('Failed to load monitor status:', error)
      status.value = 'stopped'
    } finally {
      loading.value = false
    }
  }

  // 切换监控状态
  const toggleMonitor = async (action) => {
    try {
      const response = await monitorAPI.toggle(action)
      const data = response.data
      
      status.value = data.status || action === 'start' ? 'running' : 'stopped'
      
      if (action === 'start') {
        // 开始定期检查状态
        startStatusPolling()
      } else {
        stopStatusPolling()
      }
    } catch (error) {
      console.error('Failed to toggle monitor:', error)
      throw error
    }
  }

  let pollingInterval = null

  // 开始轮询状态
  const startStatusPolling = () => {
    stopStatusPolling()
    pollingInterval = setInterval(() => {
      loadStatus()
    }, 30000) // 每30秒检查一次
  }

  // 停止轮询
  const stopStatusPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  // 更新最后检查时间
  const updateLastCheckTime = (time) => {
    lastCheckTime.value = time
  }

  return {
    status,
    lastCheckTime,
    loading,
    loadStatus,
    toggleMonitor,
    startStatusPolling,
    stopStatusPolling,
    updateLastCheckTime
  }
})

