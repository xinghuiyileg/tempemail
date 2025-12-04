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
  const searchQuery = ref('')
  const pageSize = 4

  const verificationCodeCount = computed(() => {
    return messages.value.filter(m => m.verification_code).length
  })

  // 加载邮件列表（支持搜索）
  const loadMessages = async (emailId, page = 1, search = '') => {
    if (!emailId) return

    loading.value = true
    try {
      const response = await messageAPI.list(emailId, page, pageSize, search)
      const data = response.data.data
      
      messages.value = data.messages || []
      currentPage.value = data.pagination?.page || 1
      totalPages.value = data.pagination?.total_pages || 1
      totalCount.value = data.pagination?.total || 0
      searchQuery.value = search || ''

      // 更新邮箱的邮件数量（仅在非搜索模式下）
      if (!search) {
        const emailStore = useEmailStore()
        emailStore.updateEmailMessageCount(emailId, totalCount.value)
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 搜索邮件
  const searchMessages = async (query) => {
    const emailStore = useEmailStore()
    if (!emailStore.currentEmail) return
    
    searchQuery.value = query
    await loadMessages(emailStore.currentEmail.id, 1, query)
  }

  // 清除搜索
  const clearSearch = async () => {
    const emailStore = useEmailStore()
    if (!emailStore.currentEmail) return
    
    searchQuery.value = ''
    await loadMessages(emailStore.currentEmail.id, 1, '')
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
      
      const emailStore = useEmailStore()
      if (!emailStore.currentEmail) {
        // 没有当前邮箱，只更新本地状态
        const idx = messages.value.findIndex(m => m.id === id)
        if (idx > -1) {
          messages.value.splice(idx, 1)
          totalCount.value = Math.max(0, totalCount.value - 1)
        }
        return
      }
      
      // 重新加载当前页数据，让后面的数据补充上来
      const newTotalCount = totalCount.value - 1
      const newTotalPages = Math.ceil(newTotalCount / pageSize) || 1
      const targetPage = currentPage.value > newTotalPages ? newTotalPages : currentPage.value
      
      await loadMessages(emailStore.currentEmail.id, targetPage, searchQuery.value)
    } catch (error) {
      console.error('Failed to delete message:', error)
      throw error
    }
  }

  // 批量删除邮件
  const batchDeleteMessages = async (ids) => {
    try {
      await messageAPI.batchDelete(ids)
      
      const emailStore = useEmailStore()
      if (!emailStore.currentEmail) {
        // 没有当前邮箱，只更新本地状态
        messages.value = messages.value.filter(m => !ids.includes(m.id))
        totalCount.value = Math.max(0, totalCount.value - ids.length)
        return ids.length
      }
      
      // 重新加载当前页数据
      const newTotalCount = totalCount.value - ids.length
      const newTotalPages = Math.ceil(newTotalCount / pageSize) || 1
      const targetPage = currentPage.value > newTotalPages ? newTotalPages : currentPage.value
      
      await loadMessages(emailStore.currentEmail.id, targetPage, searchQuery.value)
      return ids.length
    } catch (error) {
      console.error('Failed to batch delete messages:', error)
      throw error
    }
  }

  // 设置页码
  const setPage = async (page) => {
    const emailStore = useEmailStore()
    if (emailStore.currentEmail) {
      try {
        await loadMessages(emailStore.currentEmail.id, page, searchQuery.value)
      } catch (error) {
        console.error('Failed to set page:', error)
        throw error
      }
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
    searchQuery,
    verificationCodeCount,
    loadMessages,
    searchMessages,
    clearSearch,
    getMessage,
    markAsRead,
    deleteMessage,
    batchDeleteMessages,
    setPage,
    addNewMessage,
    clear
  }
})

