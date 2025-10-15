import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { emailAPI } from '@/services/api'

export const useEmailStore = defineStore('email', () => {
  const emails = ref([])
  const currentEmail = ref(null)
  const loading = ref(false)

  // 加载邮箱列表
  const loadEmails = async () => {
    loading.value = true
    try {
      const response = await emailAPI.list()
      emails.value = response.data.data || []
      
      // 如果有当前邮箱，更新它
      if (currentEmail.value) {
        const updated = emails.value.find(e => e.id === currentEmail.value.id)
        if (updated) {
          currentEmail.value = updated
        }
      } else if (emails.value.length > 0) {
        // 默认选中第一个
        currentEmail.value = emails.value[0]
      }
    } catch (error) {
      console.error('Failed to load emails:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建邮箱（可选参数 { prefix }）
  const createEmail = async (params) => {
    try {
      const response = await emailAPI.create(params)
      const newEmail = response.data.data
      
      emails.value.unshift(newEmail)
      currentEmail.value = newEmail
      
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
      
      emails.value = emails.value.filter(e => e.id !== id)
      
      // 如果删除的是当前邮箱
      if (currentEmail.value?.id === id) {
        currentEmail.value = emails.value[0] || null
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
      
      emails.value = emails.value.filter(e => !ids.includes(e.id))
      
      // 如果删除了当前邮箱
      if (currentEmail.value && ids.includes(currentEmail.value.id)) {
        currentEmail.value = emails.value[0] || null
      }
    } catch (error) {
      console.error('Failed to batch delete emails:', error)
      throw error
    }
  }

  // 设置当前邮箱
  const setCurrentEmail = (email) => {
    currentEmail.value = email
  }

  // 更新邮箱的邮件数量
  const updateEmailMessageCount = (emailId, count) => {
    const email = emails.value.find(e => e.id === emailId)
    if (email) {
      email.message_count = count
    }
  }

  return {
    emails,
    currentEmail,
    loading,
    loadEmails,
    createEmail,
    deleteEmail,
    batchDelete,
    setCurrentEmail,
    updateEmailMessageCount
  }
})

