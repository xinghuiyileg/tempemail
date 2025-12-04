<template>
  <div class="send-email-page">
    <div class="send-email-header">
      <h2>发送邮件</h2>
      <p class="subtitle">使用已创建的临时邮箱发送邮件</p>
    </div>

    <div class="send-email-container">
      <div class="send-email-card">
        <form @submit.prevent="handleSend" class="email-form">
          <!-- 发件人选择 -->
          <div class="form-group">
            <label for="from-email">发件人（选择已创建的邮箱）</label>
            <div class="email-select-wrapper">
              <div class="email-select-display" @click="toggleDropdown" :class="{ 'open': dropdownOpen }">
                <div class="select-value">
                  <svg class="email-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span class="select-text">{{ formData.from || '请选择发件邮箱...' }}</span>
                </div>
                <svg class="dropdown-arrow" :class="{ 'rotate': dropdownOpen }" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              <div class="email-dropdown" v-show="dropdownOpen">
                <!-- 搜索框 -->
                <div class="email-search" @click.stop>
                  <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    v-model="emailSearchQuery"
                    placeholder="搜索邮箱..."
                    class="search-input"
                    @click.stop
                  />
                  <button v-if="emailSearchQuery" class="clear-search" @click.stop="emailSearchQuery = ''">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                <!-- 邮箱列表 -->
                <div class="email-options-list">
                  <div
                    v-for="email in filteredEmails"
                    :key="email.id"
                    class="email-option"
                    :class="{ 'selected': formData.from === email.email }"
                    @click="selectEmail(email.email)"
                  >
                    <svg class="email-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span class="email-text">{{ email.email }}</span>
                    <svg v-if="formData.from === email.email" class="check-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div v-if="filteredEmails.length === 0 && emailSearchQuery" class="email-option empty">
                    <span>未找到匹配的邮箱</span>
                  </div>
                  <div v-if="emails.length === 0" class="email-option empty">
                    <span>暂无可用邮箱</span>
                  </div>
                </div>
              </div>
            </div>
            <p class="form-hint" v-if="emails.length === 0">
              暂无可用邮箱，请先<a href="#" @click.prevent="$emit('change-view', 'email')">创建临时邮箱</a>
            </p>
          </div>

          <!-- 收件人 -->
          <div class="form-group">
            <label for="to-email">收件人</label>
            <input 
              type="email" 
              id="to-email" 
              v-model="formData.to" 
              class="form-input"
              placeholder="recipient@example.com"
              required
            />
          </div>

          <!-- 主题 -->
          <div class="form-group">
            <label for="subject">主题</label>
            <input 
              type="text" 
              id="subject" 
              v-model="formData.subject" 
              class="form-input"
              placeholder="邮件主题"
              required
            />
          </div>

          <!-- 邮件内容 -->
          <div class="form-group">
            <label for="content">邮件内容</label>
            <textarea 
              id="content" 
              v-model="formData.content" 
              class="form-textarea"
              placeholder="输入邮件内容..."
              rows="12"
              required
            ></textarea>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn-primary"
              :disabled="loading || emails.length === 0"
            >
              <svg v-if="!loading" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <div v-else class="spinner"></div>
              <span>{{ loading ? '发送中...' : '发送邮件' }}</span>
            </button>
            <button 
              type="button" 
              class="btn-secondary"
              @click="handleClear"
              :disabled="loading"
            >
              清空表单
            </button>
          </div>
        </form>
      </div>

      <!-- 发送历史 -->
      <div class="send-history-card">
        <div class="history-header-row">
          <div class="history-header-left">
            <h3>发送历史</h3>
            <span v-if="totalCount > 0" class="history-count">{{ totalCount }} 条记录</span>
          </div>
          <div v-if="sentEmails.length > 0" class="history-header-actions">
            <label class="select-all-checkbox">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
              <span>全选</span>
            </label>
            <button
              v-if="selectedItems.length > 0"
              class="batch-delete-btn"
              @click="batchDelete"
              :disabled="selectedItems.length === 0"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                <path d="M10 11v6m4-6v6"/>
              </svg>
              删除选中 ({{ selectedItems.length }})
            </button>
            <button
              class="clear-all-btn"
              @click="clearAllHistory"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                <path d="M10 11v6m4-6v6"/>
              </svg>
              清空历史
            </button>
          </div>
        </div>
        
        <!-- 加载骨架屏 -->
        <SkeletonLoader
          v-if="loading && sentEmails.length === 0"
          type="sent-list"
          :count="7"
        />

        <!-- 空状态 -->
        <FadeTransition v-else-if="!loading && sentEmails.length === 0" type="scale-fade">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            <p>暂无发送记录</p>
          </div>
        </FadeTransition>

        <!-- 发送历史列表 -->
        <FadeTransition v-else type="fade" :duration="400">
          <div class="history-list">
            <div
              v-for="(item, index) in paginatedEmails"
              :key="index"
              class="history-item fade-in-item"
              :class="{ 'selected': isItemSelected(item.id) }"
            >
            <div class="history-checkbox" @click.stop>
              <input
                type="checkbox"
                :checked="isItemSelected(item.id)"
                @change="toggleItemSelection(item.id)"
              />
            </div>
            <div class="history-content" @click="showEmailDetail(item)">
              <div class="history-header">
                <div class="history-subject">{{ item.subject }}</div>
                <div class="history-time">{{ formatTime(item.sentAt) }}</div>
              </div>
              <div class="history-meta">
                <span class="meta-item" :title="item.from">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span class="meta-text">{{ item.from }}</span>
                </span>
                <span class="meta-arrow">→</span>
                <span class="meta-item" :title="item.to">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span class="meta-text">{{ item.to }}</span>
                </span>
              </div>
            </div>
            <div class="history-actions">
              <button
                class="resend-history-btn"
                @click.stop="resendEmail(item)"
                title="重新发送"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
              <button
                class="delete-history-btn"
                @click.stop="deleteHistory(item.id, index)"
                title="删除此记录"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                  <path d="M10 11v6m4-6v6"/>
                </svg>
              </button>
            </div>
          </div>
          </div>
        </FadeTransition>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button 
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              class="page-number-btn"
              :class="{ active: page === currentPage, ellipsis: page === '...' }"
              :disabled="page === '...'"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            class="pagination-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 邮件详情模态框 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>邮件详情</h3>
          <button class="close-btn" @click="closeModal">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="detail-group">
            <label>发件人</label>
            <div class="detail-value">{{ selectedEmail?.from }}</div>
          </div>
          
          <div class="detail-group">
            <label>收件人</label>
            <div class="detail-value">{{ selectedEmail?.to }}</div>
          </div>
          
          <div class="detail-group">
            <label>主题</label>
            <div class="detail-value">{{ selectedEmail?.subject }}</div>
          </div>
          
          <div class="detail-group">
            <label>发送时间</label>
            <div class="detail-value">{{ formatFullTime(selectedEmail?.sentAt) }}</div>
          </div>
          
          <div class="detail-group">
            <label>邮件内容</label>
            <div class="detail-content">{{ selectedEmail?.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useEmailStore } from '@/stores/emailStore'
import { useAuthStore } from '@/stores/authStore'
import { useNotification } from '@/composables/useNotification'
import { getUserId } from '@/utils/userManager'
import axios from 'axios'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import FadeTransition from '@/components/FadeTransition.vue'

defineEmits(['change-view'])

const emailStore = useEmailStore()
const authStore = useAuthStore()
const { showNotification } = useNotification()

const formData = ref({
  from: '',
  to: '',
  subject: '',
  content: ''
})

const loading = ref(false)
const emails = ref([])
const sentEmails = ref([])
const showModal = ref(false)
const selectedEmail = ref(null)
const dropdownOpen = ref(false)
const emailSearchQuery = ref('')

// 批量操作相关
const selectedItems = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = 8
const totalPages = ref(1) // 从服务器获取总页数
const totalCount = ref(0) // 总记录数

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787/api'

// 过滤邮箱列表（搜索功能）
const filteredEmails = computed(() => {
  if (!emailSearchQuery.value) {
    return emails.value
  }
  const query = emailSearchQuery.value.toLowerCase()
  return emails.value.filter(email =>
    email.email.toLowerCase().includes(query)
  )
})

// 批量操作相关计算属性
const isAllSelected = computed(() => {
  return paginatedEmails.value.length > 0 &&
         paginatedEmails.value.every(item => selectedItems.value.includes(item.id))
})

// 批量操作方法
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消全选当前页
    selectedItems.value = selectedItems.value.filter(
      id => !paginatedEmails.value.find(item => item.id === id)
    )
  } else {
    // 全选当前页
    const currentPageIds = paginatedEmails.value.map(item => item.id)
    selectedItems.value = [...new Set([...selectedItems.value, ...currentPageIds])]
  }
}

const isItemSelected = (id) => {
  return selectedItems.value.includes(id)
}

const toggleItemSelection = (id) => {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
}

const batchDelete = async () => {
  if (selectedItems.value.length === 0) return

  if (!confirm(`确定要删除选中的 ${selectedItems.value.length} 条记录吗？`)) {
    return
  }

  try {
    loading.value = true
    const deleteCount = selectedItems.value.length

    // 批量删除
    for (const id of selectedItems.value) {
      await axios.delete(`${API_BASE}/emails/sent/${id}`, {
        headers: {
          'X-User-ID': getUserId()
        }
      })
    }

    // 计算删除后的新总数和新总页数
    const newTotalCount = totalCount.value - deleteCount
    const newTotalPages = Math.ceil(newTotalCount / pageSize) || 1
    
    // 如果当前页超过了新总页数，回到最后一页
    if (currentPage.value > newTotalPages) {
      currentPage.value = newTotalPages
    }

    showNotification(`成功删除 ${deleteCount} 条记录`, 'success')
    selectedItems.value = []
    await loadSentEmails()
  } catch (error) {
    console.error('批量删除失败:', error)
    showNotification('批量删除失败', 'error')
  } finally {
    loading.value = false
  }
}

const clearAllHistory = async () => {
  if (!confirm('确定要清空所有发送历史吗？此操作不可恢复！')) {
    return
  }

  try {
    loading.value = true

    // 需要删除所有页的记录，先获取所有记录的 ID
    let allIds = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      const response = await axios.get(`${API_BASE}/emails/sent`, {
        params: { page, limit: 100 },
        headers: { 'X-User-ID': getUserId() }
      })
      const data = response.data.data
      const emails = data.emails || []
      allIds.push(...emails.map(e => e.id))
      
      if (page >= (data.pagination?.total_pages || 1)) {
        hasMore = false
      } else {
        page++
      }
    }

    // 删除所有记录
    for (const id of allIds) {
      await axios.delete(`${API_BASE}/emails/sent/${id}`, {
        headers: { 'X-User-ID': getUserId() }
      })
    }

    showNotification('已清空所有发送历史', 'success')
    selectedItems.value = []
    currentPage.value = 1
    await loadSentEmails()
  } catch (error) {
    console.error('清空历史失败:', error)
    showNotification('清空历史失败', 'error')
  } finally {
    loading.value = false
  }
}

// 加载所有邮箱列表（用于发送邮件选择）
const loadEmails = async () => {
  try {
    const allEmails = []
    let currentPage = 1
    let hasMore = true

    // 循环加载所有页的邮箱
    while (hasMore) {
      const response = await axios.get(`${API_BASE}/emails/list`, {
        params: { page: currentPage, limit: 100 }, // 每页100个
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'X-User-ID': localStorage.getItem('tempemail_user_id')
        }
      })

      const data = response.data.data
      const pageEmails = data.emails || []

      allEmails.push(...pageEmails)

      // 检查是否还有更多页
      const pagination = data.pagination
      if (pagination && currentPage < pagination.total_pages) {
        currentPage++
      } else {
        hasMore = false
      }
    }

    emails.value = allEmails
    console.log(`✅ 已加载 ${allEmails.length} 个邮箱用于发送`)
  } catch (error) {
    console.error('Failed to load emails:', error)
    showNotification('加载邮箱列表失败', 'error')
  }
}

// 切换下拉框
const toggleDropdown = () => {
  if (emails.value.length > 0) {
    dropdownOpen.value = !dropdownOpen.value
    if (dropdownOpen.value) {
      emailSearchQuery.value = ''
    }
  }
}

// 选择邮箱
const selectEmail = (email) => {
  formData.value.from = email
  dropdownOpen.value = false
  emailSearchQuery.value = ''
}

// 计算当前页的邮件（服务器已分页，直接返回）
const paginatedEmails = computed(() => {
  return sentEmails.value
})

// 计算可见页码
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current <= 3) {
      pages.push(2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      pages.push('...', total - 3, total - 2, total - 1, total)
    } else {
      pages.push('...', current - 1, current, current + 1, '...', total)
    }
  }
  return pages
})

// 切换页码
const changePage = (page) => {
  if (page === '...' || page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadSentEmails() // 加载新页面的数据
}

// 加载发送历史（支持分页）
const loadSentEmails = async () => {
  try {
    const response = await axios.get(`${API_BASE}/emails/sent`, {
      params: {
        page: currentPage.value,
        limit: pageSize
      },
      headers: {
        'X-User-ID': getUserId()
      }
    })

    const responseData = response.data.data
    const emails = responseData.emails || []
    const pagination = responseData.pagination || {}

    sentEmails.value = emails.map(item => ({
      id: item.id,
      from: item.sender_email,
      to: item.recipient,
      subject: item.subject,
      content: item.body,
      sentAt: item.sent_at,
      provider: item.provider
    }))

    // 更新分页信息
    if (pagination.total_pages) {
      totalPages.value = pagination.total_pages
    }
    if (pagination.total !== undefined) {
      totalCount.value = pagination.total
    }
  } catch (error) {
    console.error('Failed to load sent emails:', error)
  }
}

// 重新发送邮件
const resendEmail = (item) => {
  // 填充表单数据
  formData.value.from = item.from
  formData.value.to = item.to
  formData.value.subject = item.subject
  formData.value.content = item.content

  // 滚动到表单顶部
  window.scrollTo({ top: 0, behavior: 'smooth' })

  showNotification('已填充邮件信息，请检查后发送', 'info')
}

// 删除历史记录
const deleteHistory = async (id, index) => {
  if (!confirm('确认删除这条发送记录吗？')) {
    return
  }

  try {
    await axios.delete(`${API_BASE}/emails/sent/${id}`, {
      headers: {
        'X-User-ID': getUserId()
      }
    })

    // 计算删除后的新总数和新总页数
    const newTotalCount = totalCount.value - 1
    const newTotalPages = Math.ceil(newTotalCount / pageSize) || 1
    
    // 如果当前页超过了新总页数，回到最后一页
    if (currentPage.value > newTotalPages) {
      currentPage.value = newTotalPages
    }

    // 重新加载当前页数据，让后面的数据补充上来
    await loadSentEmails()

    showNotification('发送记录已删除', 'success')
  } catch (error) {
    console.error('Failed to delete sent email:', error)
    showNotification('删除失败', 'error')
  }
}

// 显示邮件详情
const showEmailDetail = (email) => {
  selectedEmail.value = email
  showModal.value = true
}

// 关闭模态框
const closeModal = () => {
  showModal.value = false
  setTimeout(() => {
    selectedEmail.value = null
  }, 300)
}

// 发送邮件
const handleSend = async () => {
  if (!formData.value.from || !formData.value.to || !formData.value.subject || !formData.value.content) {
    showNotification('请填写完整信息', 'warning')
    return
  }

  loading.value = true
  try {
    const response = await axios.post(
      `${API_BASE}/emails/send`, 
      {
        from: formData.value.from,
        to: formData.value.to,
        subject: formData.value.subject,
        content: formData.value.content
      },
      {
        headers: {
          'X-User-ID': getUserId()
        }
      }
    )

    if (response.data.success) {
      showNotification('邮件发送成功！', 'success')
      
      // 重新加载发送历史
      await loadSentEmails()
      
      // 清空表单
      handleClear()
    } else {
      throw new Error(response.data.error || '发送失败')
    }
  } catch (error) {
    console.error('Send email error:', error)
    showNotification(error.response?.data?.error || '邮件发送失败', 'error')
  } finally {
    loading.value = false
  }
}

// 清空表单
const handleClear = () => {
  formData.value = {
    from: '',
    to: '',
    subject: '',
    content: ''
  }
}

// 格式化时间（相对时间）
const formatTime = (isoString) => {
  if (!isoString) return ''

  // 数据库返回的是 UTC 时间字符串，需要正确解析
  // SQLite datetime('now') 返回格式: '2025-11-05 12:34:56'
  // 需要添加 'Z' 后缀表示 UTC 时间，或者使用 Date.parse
  const utcDate = new Date(isoString + (isoString.includes('Z') ? '' : 'Z'))
  const now = new Date()
  const diff = (now - utcDate) / 1000 // 秒

  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`

  return utcDate.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化时间（完整时间）
const formatFullTime = (isoString) => {
  if (!isoString) return ''

  // 同样处理 UTC 时间
  const utcDate = new Date(isoString + (isoString.includes('Z') ? '' : 'Z'))
  return utcDate.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  // 检查是否已登录，避免退出登录时触发 401 错误
  if (!authStore.isAuthenticated) {
    return
  }
  
  loadEmails()
  loadSentEmails()
})
</script>

<style scoped>
.send-email-page {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.send-email-header {
  margin-bottom: 32px;
}

.send-email-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.send-email-container {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
}

.send-email-card,
.send-history-card {
  background: white;
  border: 1px solid rgba(55, 53, 47, 0.09);
  border-radius: 3px;
  box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px;
  padding: 24px;
}

.send-email-card {
  max-height: 800px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.send-history-card {
  min-height: 600px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.send-history-card h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #37352f;
}

.email-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 14px;
  color: #1e293b;
  background: white;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* 自定义邮箱选择器 */
.email-select-wrapper {
  position: relative;
}

.email-select-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.email-select-display:hover {
  border-color: #6366f1;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.email-select-display.open {
  border-color: #6366f1;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2);
}

.select-value {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.email-icon {
  color: #6366f1;
  flex-shrink: 0;
}

.select-text {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-arrow {
  color: #64748b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.dropdown-arrow.rotate {
  transform: rotate(180deg);
  color: #6366f1;
}

.email-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #6366f1;
  border-top: none;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.2);
  max-height: 320px;
  overflow: hidden;
  z-index: 10;
  animation: dropdownSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
}

/* 邮箱搜索框 */
.email-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.search-icon {
  color: #64748b;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #1e293b;
  outline: none;
}

.search-input::placeholder {
  color: #94a3b8;
}

.clear-search {
  width: 20px;
  height: 20px;
  border: none;
  background: #e2e8f0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s;
  flex-shrink: 0;
}

.clear-search:hover {
  background: #cbd5e1;
  color: #1e293b;
}

/* 邮箱选项列表容器 */
.email-options-list {
  overflow-y: auto;
  max-height: 240px;
}

.email-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.email-option:last-child {
  border-bottom: none;
}

.email-option:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
}

.email-option.selected {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
  font-weight: 600;
}

.email-option .email-icon {
  color: #6366f1;
  flex-shrink: 0;
}

.email-option .email-text {
  flex: 1;
  font-size: 14px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.email-option.selected .email-text {
  color: #6366f1;
}

.email-option .check-icon {
  color: #10b981;
  flex-shrink: 0;
  animation: checkBounce 0.3s ease-out;
}

.email-option.empty {
  color: #94a3b8;
  font-style: italic;
  cursor: default;
  justify-content: center;
}

.email-option.empty:hover {
  background: transparent;
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes checkBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.form-textarea {
  resize: none;
  font-family: inherit;
  line-height: 1.6;
  height: 280px;
  overflow-y: auto;
}

.form-hint {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.form-hint a {
  color: #6366f1;
  text-decoration: none;
}

.form-hint a:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-primary,
.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  flex: 1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(55, 53, 47, 0.45);
}

.empty-state svg {
  opacity: 0.3;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: rgba(55, 53, 47, 0.45);
}

.history-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.history-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-header-row h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #37352f;
}

.history-count {
  font-size: 12px;
  color: rgba(55, 53, 47, 0.65);
  background: rgba(55, 53, 47, 0.06);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.history-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.select-all-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(55, 53, 47, 0.65);
  cursor: pointer;
  user-select: none;
  padding: 4px 8px;
  border-radius: 3px;
  transition: background 0.15s ease;
}

.select-all-checkbox:hover {
  background: rgba(55, 53, 47, 0.06);
}

.select-all-checkbox input[type="checkbox"] {
  width: 15px;
  height: 15px;
  cursor: pointer;
  border-radius: 3px;
  border: 1.5px solid rgba(55, 53, 47, 0.3);
}

.batch-delete-btn,
.clear-all-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: 3px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.batch-delete-btn {
  background: rgba(235, 87, 87, 0.1);
  color: #eb5757;
}

.batch-delete-btn:hover:not(:disabled) {
  background: rgba(235, 87, 87, 0.15);
}

.batch-delete-btn:active:not(:disabled) {
  background: rgba(235, 87, 87, 0.2);
}

.batch-delete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.clear-all-btn {
  background: rgba(55, 53, 47, 0.06);
  color: rgba(55, 53, 47, 0.65);
}

.clear-all-btn:hover {
  background: rgba(55, 53, 47, 0.1);
}

.clear-all-btn:active {
  background: rgba(55, 53, 47, 0.14);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
  flex: 1;
  overflow-y: auto;
  min-height: 400px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border: 1px solid rgba(55, 53, 47, 0.09);
  border-radius: 3px;
  transition: all 0.12s ease;
  overflow: hidden;
}

.history-item.selected {
  background: rgba(35, 131, 226, 0.08);
  border-color: rgba(35, 131, 226, 0.24);
}

.history-checkbox {
  display: flex;
  align-items: center;
  padding: 0 10px;
  flex-shrink: 0;
}

.history-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  border-radius: 3px;
  border: 1.5px solid rgba(55, 53, 47, 0.3);
  appearance: none;
  background: white;
  position: relative;
  transition: all 0.12s ease;
}

.history-checkbox input[type="checkbox"]:checked {
  background: #2383e2;
  border-color: #2383e2;
}

.history-checkbox input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.history-content {
  flex: 1;
  padding: 12px 8px;
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
}

.history-item:hover {
  background: rgba(55, 53, 47, 0.03);
}

/* 历史记录操作按钮 */
.history-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  padding-right: 6px;
  flex-shrink: 0;
  min-width: 70px;
  opacity: 0;
  transition: opacity 0.12s ease;
}

.history-item:hover .history-actions {
  opacity: 1;
}

.resend-history-btn,
.delete-history-btn {
  padding: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.12s ease;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resend-history-btn {
  color: rgba(55, 53, 47, 0.45);
}

.resend-history-btn:hover {
  background: rgba(55, 53, 47, 0.08);
  color: rgba(55, 53, 47, 0.8);
}

.delete-history-btn {
  color: rgba(55, 53, 47, 0.45);
}

.delete-history-btn:hover {
  background: rgba(235, 87, 87, 0.1);
  color: #eb5757;
}

.resend-history-btn:active,
.delete-history-btn:active {
  transform: scale(0.96);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  gap: 12px;
  min-width: 0;
}

.history-subject {
  font-size: 14px;
  font-weight: 500;
  color: #37352f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.history-time {
  font-size: 12px;
  color: rgba(55, 53, 47, 0.45);
  white-space: nowrap;
  flex-shrink: 0;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(55, 53, 47, 0.65);
  overflow: hidden;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: 200px;
  min-width: 0;
}

.meta-item svg {
  flex-shrink: 0;
  opacity: 0.5;
}

.meta-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
}

.meta-arrow {
  color: rgba(55, 53, 47, 0.3);
  flex-shrink: 0;
  font-size: 11px;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 700px;
  width: 90%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 2px solid #f1f5f9;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #64748b;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  transform: rotate(90deg);
}

.modal-body {
  padding: 28px;
  overflow-y: auto;
  flex: 1;
}

.detail-group {
  margin-bottom: 24px;
}

.detail-group:last-child {
  margin-bottom: 0;
}

.detail-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 12px;
  font-size: 15px;
  color: #1e293b;
  font-weight: 500;
  word-break: break-all;
}

.detail-content {
  padding: 18px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 12px;
  font-size: 14px;
  color: #475569;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 150px;
  max-height: 300px;
  overflow-y: auto;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
}

.pagination-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(55, 53, 47, 0.65);
  cursor: pointer;
  transition: all 0.12s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(55, 53, 47, 0.08);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
  align-items: center;
}

.page-number-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: rgba(55, 53, 47, 0.65);
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.12s ease;
}

.page-number-btn:hover:not(:disabled):not(.active) {
  background: rgba(55, 53, 47, 0.08);
}

.page-number-btn.active {
  background: rgba(35, 131, 226, 0.1);
  color: #2383e2;
  font-weight: 500;
}

.page-number-btn.ellipsis {
  cursor: default;
  pointer-events: none;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 1200px) {
  .send-email-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .send-email-page {
    padding: 20px;
  }
  
  .send-email-card,
  .send-history-card {
    padding: 20px;
  }
  
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .modal-body {
    padding: 20px;
  }
}

/* 淡入动画 */
.fade-in-item {
  animation: fadeInUp 0.4s ease-out backwards;
}

.fade-in-item:nth-child(1) { animation-delay: 0.05s; }
.fade-in-item:nth-child(2) { animation-delay: 0.1s; }
.fade-in-item:nth-child(3) { animation-delay: 0.15s; }
.fade-in-item:nth-child(4) { animation-delay: 0.2s; }
.fade-in-item:nth-child(5) { animation-delay: 0.25s; }
.fade-in-item:nth-child(6) { animation-delay: 0.3s; }
.fade-in-item:nth-child(7) { animation-delay: 0.35s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

