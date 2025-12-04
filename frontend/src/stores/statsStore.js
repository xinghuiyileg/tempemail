import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787/api'

export const useStatsStore = defineStore('stats', () => {
  const stats = ref({
    totalMessages: 0,
    unreadMessages: 0,
    todayMessages: 0,
    activeEmails: 0,
    totalUsers: 0,
    todayUsers: 0,
    userTrend: [],
    messageTrend: [],
    apiCalls: []
  })

  const emailQuota = ref({
    services: [],
    summary: {
      total: 0,
      used: 0,
      remaining: 0,
      percentage: 0
    },
    lastUpdate: null
  })

  const loading = ref(false)
  const quotaLoading = ref(false)

  const loadStats = async () => {
    loading.value = true
    const startTime = Date.now()
    try {
      const response = await axios.get(`${API_BASE}/monitor/stats`)
      const data = response.data.data
      
      stats.value = {
        totalMessages: data.totalMessages || 0,
        unreadMessages: data.unreadMessages || 0,
        todayMessages: data.todayMessages || 0,
        activeEmails: data.activeEmails || 0,
        totalUsers: data.totalUsers || 0,
        todayUsers: data.todayUsers || 0,
        loginMethods: data.loginMethods || {},
        emailSources: data.emailSources || {},
        userGrowth: data.userGrowth || [],
        emailGrowth: data.emailGrowth || [],
        apiCalls: data.apiCalls || [],
        lastUpdate: data.lastUpdate || new Date().toISOString()
      }
      
      // 确保至少显示800ms的加载动画
      const elapsed = Date.now() - startTime
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed))
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const loadEmailQuota = async () => {
    quotaLoading.value = true
    try {
      const response = await axios.get(`${API_BASE}/monitor/quota`)
      const data = response.data.data

      emailQuota.value = {
        services: data.services || [],
        summary: data.summary || {
          total: 0,
          used: 0,
          remaining: 0,
          percentage: 0
        },
        lastUpdate: data.lastUpdate || new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to load email quota:', error)
      // 不抛出错误，允许页面继续显示其他统计信息
    } finally {
      quotaLoading.value = false
    }
  }

  return {
    stats,
    emailQuota,
    loading,
    quotaLoading,
    loadStats,
    loadEmailQuota
  }
})

