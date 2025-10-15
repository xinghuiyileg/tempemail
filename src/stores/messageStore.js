import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { messageAPI } from '@/services/api'
import { useEmailStore } from './emailStore'

export const useMessageStore = defineStore('message', () => {
  const messages = ref([])
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalCount = ref(0)
  const loading = ref(false)
  const pageSize = 20

  const verificationCodeCount = computed(() => {
    return messages.value.filter(m => m.verification_code).length
  })

  // 加载邮件列表
  const loadMessages = async (emailId, page = 1) => {
    if (!emailId) return

    loading.value = true
    try {
      const response = await messageAPI.list(emailId, page, pageSize)
      const data = response.data.data
      
      messages.value = data.messages || []
      currentPage.value = data.pagination?.page || 1
      totalPages.value = data.pagination?.total_pages || 1
      totalCount.value = data.pagination?.total || 0

      // 更新邮箱的邮件数量
      const emailStore = useEmailStore()
      emailStore.updateEmailMessageCount(emailId, totalCount.value)
    } catch (error) {
      console.error('Failed to load messages:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取邮件详情
  const getMessage = async (id) => {
    try {
      const response = await messageAPI.get(id)
      return response.data.data
    } catch (error) {
      console.error('Failed to get message:', error)
      throw error
    }
  }

  // 标记为已读
  const markAsRead = async (id) => {
    try {
      await messageAPI.markAsRead(id)
      
      const message = messages.value.find(m => m.id === id)
      if (message) {
        message.is_read = true
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // 删除单封邮件
  const deleteMessage = async (id) => {
    try {
      await messageAPI.delete(id)
      const idx = messages.value.findIndex(m => m.id === id)
      if (idx > -1) {
        messages.value.splice(idx, 1)
        totalCount.value = Math.max(0, totalCount.value - 1)
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }

  // 设置页码
  const setPage = async (page) => {
    const emailStore = useEmailStore()
    if (emailStore.currentEmail) {
      await loadMessages(emailStore.currentEmail.id, page)
    }
  }

  // 添加新邮件（通过 WebSocket 接收）
  const addNewMessage = (message) => {
    // 检查是否已存在
    const exists = messages.value.find(m => m.id === message.id)
    if (!exists) {
      messages.value.unshift(message)
      totalCount.value += 1

      // 更新邮箱的邮件数量
      const emailStore = useEmailStore()
      if (emailStore.currentEmail) {
        emailStore.updateEmailMessageCount(emailStore.currentEmail.id, totalCount.value)
      }
    }
  }

  // 清空邮件列表
  const clear = () => {
    messages.value = []
    currentPage.value = 1
    totalPages.value = 1
    totalCount.value = 0
  }

  return {
    messages,
    currentPage,
    totalPages,
    totalCount,
    loading,
    verificationCodeCount,
    loadMessages,
    getMessage,
    markAsRead,
    deleteMessage,
    setPage,
    addNewMessage,
    clear
  }
})

