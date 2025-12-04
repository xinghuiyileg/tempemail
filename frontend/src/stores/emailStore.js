import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emailAPI } from '@/services/api'

const CURRENT_EMAIL_KEY = 'tempemail_current_email_id'

export const useEmailStore = defineStore('email', () => {
  const emails = ref([])
  const currentEmail = ref(null)
  const loading = ref(false)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalCount = ref(0)
  const searchQuery = ref('')
  const pageSize = 5

  // 加载邮箱列表（支持搜索）
  const loadEmails = async (page = 1, search = '') => {
    loading.value = true
    try {
      const response = await emailAPI.list(page, pageSize, search)
      const data = response.data.data
      emails.value = data.emails || []
      currentPage.value = data.pagination?.page || 1
      totalPages.value = data.pagination?.total_pages || 1
      totalCount.value = data.pagination?.total || 0
      searchQuery.value = search || ''
      
      // 尝试恢复上次选中的邮箱（仅在非搜索模式下）
      if (!search) {
        const savedEmailId = localStorage.getItem(CURRENT_EMAIL_KEY)
        
        if (savedEmailId) {
          // 查找保存的邮箱
          const savedEmail = emails.value.find(e => e.id === parseInt(savedEmailId))
          if (savedEmail) {
            currentEmail.value = savedEmail
            console.log('✅ 恢复上次选中的邮箱:', savedEmail.email)
            return
          }
        }
      }
      
      // 如果有当前邮箱，更新它
      if (currentEmail.value) {
        const updated = emails.value.find(e => e.id === currentEmail.value.id)
        if (updated) {
          currentEmail.value = updated
        }
      } else if (emails.value.length > 0) {
        // 默认选中第一个
        currentEmail.value = emails.value[0]
        // 保存选中状态
        localStorage.setItem(CURRENT_EMAIL_KEY, currentEmail.value.id.toString())
      }
    } catch (error) {
      console.error('Failed to load emails:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 搜索邮箱
  const searchEmails = async (query) => {
    searchQuery.value = query
    await loadEmails(1, query)
  }

  // 清除搜索
  const clearSearch = async () => {
    searchQuery.value = ''
    await loadEmails(1, '')
  }

  // 创建邮箱（可选参数 { prefix }）
  const createEmail = async (params) => {
    try {
      const response = await emailAPI.create(params)
      const newEmail = response.data.data
      
      // 重新加载第一页数据，确保分页正确
      // 新邮箱会出现在第一页的第一个位置
      await loadEmails(1)
      
      // 设置新创建的邮箱为当前选中
      currentEmail.value = newEmail
      
      // 保存当前选中的邮箱ID
      localStorage.setItem(CURRENT_EMAIL_KEY, newEmail.id.toString())
      console.log('💾 已保存当前邮箱:', newEmail.email)
      
      // 自动复制到剪贴板
      if (navigator.clipboard && newEmail.email) {
        await navigator.clipboard.writeText(newEmail.email)
      }
      
      return newEmail
    } catch (error) {
      console.error('Failed to create email:', error)
      throw error
    }
  }

  // 删除邮箱
  const deleteEmail = async (id) => {
    try {
      await emailAPI.delete(id)
      
      // 如果删除的是当前邮箱，先清除选中状态
      const wasCurrentEmail = currentEmail.value?.id === id
      
      // 重新加载当前页数据，让后面的数据补充上来
      // 如果当前页删除后没有数据了，回到上一页
      const newTotalCount = totalCount.value - 1
      const newTotalPages = Math.ceil(newTotalCount / pageSize) || 1
      const targetPage = currentPage.value > newTotalPages ? newTotalPages : currentPage.value
      
      await loadEmails(targetPage)
      
      // 如果删除的是当前邮箱，重新选择
      if (wasCurrentEmail) {
        currentEmail.value = emails.value[0] || null
        
        // 更新localStorage
        if (currentEmail.value) {
          localStorage.setItem(CURRENT_EMAIL_KEY, currentEmail.value.id.toString())
        } else {
          localStorage.removeItem(CURRENT_EMAIL_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to delete email:', error)
      throw error
    }
  }

  // 批量删除
  const batchDelete = async (ids) => {
    try {
      await emailAPI.batchDelete(ids)
      
      // 如果删除了当前邮箱，先记录
      const wasCurrentEmailDeleted = currentEmail.value && ids.includes(currentEmail.value.id)
      
      // 重新加载当前页数据，让后面的数据补充上来
      const newTotalCount = totalCount.value - ids.length
      const newTotalPages = Math.ceil(newTotalCount / pageSize) || 1
      const targetPage = currentPage.value > newTotalPages ? newTotalPages : currentPage.value
      
      await loadEmails(targetPage)
      
      // 如果删除了当前邮箱，重新选择
      if (wasCurrentEmailDeleted) {
        currentEmail.value = emails.value[0] || null
        
        // 更新localStorage
        if (currentEmail.value) {
          localStorage.setItem(CURRENT_EMAIL_KEY, currentEmail.value.id.toString())
        } else {
          localStorage.removeItem(CURRENT_EMAIL_KEY)
        }
      }
    } catch (error) {
      console.error('Failed to batch delete emails:', error)
      throw error
    }
  }

  // 设置当前邮箱
  const setCurrentEmail = (email) => {
    currentEmail.value = email
    
    // 保存到localStorage
    if (email) {
      localStorage.setItem(CURRENT_EMAIL_KEY, email.id.toString())
      console.log('💾 已保存当前邮箱:', email.email)
    } else {
      localStorage.removeItem(CURRENT_EMAIL_KEY)
    }
  }

  // 更新邮箱的邮件数量
  const updateEmailMessageCount = (emailId, count) => {
    const email = emails.value.find(e => e.id === emailId)
    if (email) {
      email.message_count = count
    }
  }

  // 删除所有非星标邮箱
  const clearAll = async () => {
    try {
      const response = await emailAPI.clearAll()
      const deletedCount = response.data.data?.deleted_count || 0
      
      // 重新加载第一页数据
      await loadEmails(1)
      
      // 如果当前邮箱被删除了（非星标），重新选择
      if (currentEmail.value && !currentEmail.value.is_starred) {
        currentEmail.value = emails.value[0] || null
        
        // 更新localStorage
        if (currentEmail.value) {
          localStorage.setItem(CURRENT_EMAIL_KEY, currentEmail.value.id.toString())
        } else {
          localStorage.removeItem(CURRENT_EMAIL_KEY)
        }
      }
      
      return deletedCount
    } catch (error) {
      console.error('Failed to clear all emails:', error)
      throw error
    }
  }

  // 切换星标状态
  const toggleStar = async (id) => {
    try {
      const email = emails.value.find(e => e.id === id)
      if (!email) {
        throw new Error('邮箱不存在')
      }

      const newStarred = email.is_starred ? 0 : 1
      await emailAPI.toggleStar(id, newStarred)
      
      // 更新本地状态
      email.is_starred = newStarred
      
      // 重新排序：星标邮箱排在前面
      emails.value.sort((a, b) => {
        if (a.is_starred !== b.is_starred) {
          return b.is_starred - a.is_starred
        }
        return new Date(b.created_at) - new Date(a.created_at)
      })
      
      console.log(`${newStarred ? '⭐' : '☆'} 星标状态已更新:`, email.email)
      
      return newStarred
    } catch (error) {
      console.error('Failed to toggle star:', error)
      throw error
    }
  }

  return {
    emails,
    currentEmail,
    loading,
    currentPage,
    totalPages,
    totalCount,
    searchQuery,
    loadEmails,
    searchEmails,
    clearSearch,
    createEmail,
    deleteEmail,
    batchDelete,
    clearAll,
    setCurrentEmail,
    updateEmailMessageCount,
    toggleStar
  }
})

