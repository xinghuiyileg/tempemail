<template>
  <div class="card message-list-card">
    <div class="card-body">
      <div class="list-header" ref="listTopRef">
        <h2>
          <svg class="title-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
          </svg>
          收件箱
        </h2>
        <div class="header-actions">
          <!-- 搜索框 -->
          <div v-if="currentEmail" class="search-box">
            <svg class="search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              v-model="searchInput"
              placeholder="搜索发件人或主题..."
              @keyup.enter="handleSearch"
              @input="handleSearchInput"
              class="search-input"
            />
            <button
              v-if="searchInput || messageStore.searchQuery"
              class="search-clear-btn"
              @click="handleClearSearch"
              title="清除搜索"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <span v-if="totalCount > 0" class="count-badge">
            {{ messageStore.searchQuery ? `找到 ${totalCount} 封` : `${totalCount} 封邮件` }}
          </span>
          <button
            v-if="currentEmail && messages.length > 0"
            ref="batchDelBtnRef"
            class="btn btn-sm btn-danger"
            :disabled="selectedIds.length === 0"
            @click="batchDelete"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
              <path d="M10 11v6m4-6v6"/>
            </svg>
            <span>{{ batchDelLabel }}</span>
          </button>
          <button
            v-if="currentEmail && messages.length > 0"
            ref="clearBtnRef"
            class="btn btn-sm btn-danger clear-all-btn"
            @click="clearMessages"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="m4.93 4.93 14.14 14.14"/>
            </svg>
            <span>{{ clearLabel }}</span>
          </button>
          <button
            v-if="currentEmail"
            class="btn btn-sm btn-secondary refresh-btn-inbox"
            @click="refreshMessages"
            :disabled="isRefreshing"
            :class="{ 'success': refreshSuccess, 'transitioning': isTransitioning }"
            title="刷新邮件列表"
            aria-label="刷新邮件列表"
          >
            <transition name="icon-fade" mode="out-in">
              <svg v-if="!refreshSuccess" key="refresh" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spinning': isRefreshing }">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <svg v-else key="check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="check-icon">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </transition>
            <transition name="text-fade" mode="out-in">
              <span v-if="!isRefreshing && !refreshSuccess" key="refresh-text">{{ refreshLabel }}</span>
              <span v-else-if="isRefreshing" key="loading-text">刷新中...</span>
              <span v-else key="success-text">已刷新</span>
            </transition>
          </button>
        </div>
      </div>

      <!-- 未选择邮箱 -->
      <FadeTransition v-if="!currentEmail" type="scale-fade">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>请先选择或创建临时邮箱</p>
        </div>
      </FadeTransition>

      <!-- 加载骨架屏 -->
      <SkeletonLoader
        v-else-if="messageStore.loading && messages.length === 0"
        type="message-list"
        :count="4"
      />

      <!-- 空状态 -->
      <FadeTransition v-else-if="!messageStore.loading && messages.length === 0" type="scale-fade">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>暂无邮件</p>
          <p class="text-muted">等待接收新邮件...</p>
        </div>
      </FadeTransition>

      <!-- 邮件列表 -->
      <FadeTransition v-else type="fade" :duration="400">
        <div class="message-items">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-item fade-in-item"
            :class="{ unread: !message.is_read, read: message.is_read }"
            @click="openMessage(message)"
          >
          <label class="select-box" @click.stop>
            <input type="checkbox" v-model="selectedIds" :value="message.id" />
          </label>
          <div class="message-header">
            <div class="sender">
              <span v-if="!message.is_read" class="unread-dot"></span>
              {{ message.sender }}
            </div>
            <div class="time">{{ formatTime(message.received_at) }}</div>
          </div>

          <div class="subject">{{ message.subject }}</div>

          <div v-if="message.verification_code" class="verification-code">
            <span class="code-label">验证码:</span>
            <span class="code-value">{{ message.verification_code }}</span>
            <button
              class="btn-copy-code"
              @click.stop="copyCode(message.verification_code)"
              title="复制验证码"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>

          <div v-else class="preview">{{ getPreview(message) }}</div>
          <div class="row-actions" @click.stop>
            <button class="btn btn-sm btn-danger delete-msg-btn" @click="deleteOne(message)" title="删除此邮件">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                <path d="M10 11v6m4-6v6"/>
              </svg>
              <span>删除</span>
            </button>
          </div>
        </div>
        </div>
      </FadeTransition>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="firstPage"
          :disabled="currentPage === 1 || messageStore.loading"
          title="首页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>
          </svg>
        </button>
        
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="prevPage"
          :disabled="currentPage === 1 || messageStore.loading"
          title="上一页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-number-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
            :disabled="page === '...' || messageStore.loading"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="nextPage"
          :disabled="currentPage === totalPages || messageStore.loading"
          title="下一页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
        
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="lastPage"
          :disabled="currentPage === totalPages || messageStore.loading"
          title="末页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>
          </svg>
        </button>
        
        <span class="page-info-detail">
          共 {{ totalCount }} 封邮件，第 {{ currentPage }}/{{ totalPages }} 页
        </span>
      </div>
    </div>
  </div>

  <!-- 邮件详情弹窗 -->
  <MessageModal
    v-if="selectedMessage"
    :message="selectedMessage"
    @close="selectedMessage = null"
  />
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useButtonLabel } from '@/composables/useButtonLabel'
import { useEmailStore } from '@/stores/emailStore'
import { useMessageStore } from '@/stores/messageStore'
import { useNotification } from '@/composables/useNotification'
import { formatRelativeTime } from '@/utils/formatTime'
import { decodeEmailContent } from '@/utils/emailDecoder'
import MessageModal from './MessageModal.vue'
import { messageAPI } from '@/services/api'
import SkeletonLoader from './SkeletonLoader.vue'
import FadeTransition from './FadeTransition.vue'

const emailStore = useEmailStore()
const messageStore = useMessageStore()
const { showNotification } = useNotification()

const listTopRef = ref(null)
const searchInput = ref('')
let searchDebounceTimer = null

const smoothScrollToTop = () => {
  try {
    if (listTopRef.value) {
      // 优先滚动到卡片顶部
      listTopRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // 回退：窗口滚动
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (_) {}
}

const isRefreshing = ref(false)
const refreshSuccess = ref(false)
const isTransitioning = ref(false)
const refreshLabel = '刷新'
const clearBtnRef = ref(null)
const { label: clearLabel, withFeedback: withClearFeedback } = useButtonLabel('清空', { timeoutMs: 900 })
const batchDelBtnRef = ref(null)
const { label: batchDelLabel, withFeedback: withBatchDelFeedback } = useButtonLabel('删除选中', { timeoutMs: 900 })
const selectedMessage = ref(null)
const selectedIds = ref([])

const currentEmail = computed(() => emailStore.currentEmail)
const messages = computed(() => messageStore.messages)
const totalCount = computed(() => messageStore.totalCount)
const currentPage = computed(() => messageStore.currentPage)
const totalPages = computed(() => messageStore.totalPages)

const refreshMessages = async () => {
  if (!currentEmail.value) return

  isRefreshing.value = true
  refreshSuccess.value = false
  isTransitioning.value = false

  try {
    // 保持当前页码，只刷新数据
    await messageStore.loadMessages(currentEmail.value.id, currentPage.value)

    // 刷新完成，立即结束 loading 状态
    isRefreshing.value = false

    // 显示刷新完成状态
    refreshSuccess.value = true
    showNotification('刷新成功', 'success')

    // 2秒后开始过渡
    setTimeout(() => {
      isTransitioning.value = true
    }, 2000)

    // 2.5秒后恢复初始状态
    setTimeout(() => {
      refreshSuccess.value = false
      isTransitioning.value = false
    }, 2500)
  } catch (error) {
    showNotification('刷新失败：' + error.message, 'error')
    isRefreshing.value = false
  }
}

const openMessage = async (message) => {
  try {
    // 获取完整内容（包含 body_html/body_text）
    const full = await messageStore.getMessage(message.id)
    selectedMessage.value = full || message

    // 标记为已读
    if (!message.is_read) {
      await messageStore.markAsRead(message.id)
      message.is_read = true
    }
  } catch (e) {
    // 回退显示列表中的简要内容
    selectedMessage.value = message
  }
}

const copyCode = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    showNotification('验证码已复制', 'success')
  } catch (error) {
    showNotification('复制失败', 'error')
  }
}

// 预览文本缓存
const previewCache = new Map()

const getPreview = (message) => {
  // 使用缓存避免重复计算
  const cacheKey = `${message.id}-${message.body_html?.substring(0, 50) || message.body_text?.substring(0, 50)}`
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)
  }
  
  // 优先使用 body_html，然后 body_text
  let content = message.body_html || message.body_text || ''
  
  // 首先解码 quoted-printable 等编码（只在需要时）
  if (/=[0-9A-F]{2}/i.test(content) || /--[_=a-z0-9]+/i.test(content)) {
    content = decodeEmailContent(content)
  }
  
  // 始终清理 HTML 标签（因为 body_text 也可能包含 HTML）
  let text = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除样式
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除脚本
    .replace(/<br\s*\/?>/gi, ' ') // br 转空格
    .replace(/<\/p>/gi, ' ') // 段落结束加空格
    .replace(/<[^>]+>/g, '') // 移除所有 HTML 标签
    .replace(/&nbsp;/g, ' ') // 替换空格实体
    .replace(/&lt;/g, '<') // 解码 HTML 实体
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()
  
  const preview = text.substring(0, 100) + (text.length > 100 ? '...' : '')
  
  // 缓存结果（限制缓存大小）
  if (previewCache.size > 100) {
    const firstKey = previewCache.keys().next().value
    previewCache.delete(firstKey)
  }
  previewCache.set(cacheKey, preview)
  
  return preview
}

const formatTime = (time) => {
  return formatRelativeTime(time)
}

const clearMessages = async () => {
  if (!currentEmail.value) return
  if (!confirm('确认清空当前邮箱的所有邮件？此操作不可撤销。')) return
  try {
    await withClearFeedback(async () => {
      await messageAPI.clearByEmail(currentEmail.value.id)
      // 本地状态清空
      messageStore.clear()
      showNotification('已清空收件箱', 'success')
    }, { loadingText: '清空中...', successText: '已清空 ✓', buttonRef: clearBtnRef })
  } catch (e) {
    showNotification('清空失败：' + e.message, 'error')
  }
}

const deleteOne = async (message) => {
  if (!confirm('确认删除该邮件？')) return
  try {
    await messageStore.deleteMessage(message.id)
    showNotification('邮件已删除', 'success')
  } catch (e) {
    showNotification('删除失败：' + e.message, 'error')
  }
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) return
  if (!confirm(`确认删除选中的 ${selectedIds.value.length} 封邮件？`)) return
  try {
    await withBatchDelFeedback(async () => {
      // 使用批量删除 API
      await messageStore.batchDeleteMessages([...selectedIds.value])
      selectedIds.value = []
      showNotification('选中邮件已删除', 'success')
    }, { loadingText: '删除中...', successText: '已删除 ✓', buttonRef: batchDelBtnRef })
  } catch (e) {
    showNotification('批量删除失败：' + e.message, 'error')
  }
}

// 搜索相关方法
const handleSearch = () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  messageStore.searchMessages(searchInput.value.trim())
}

const handleSearchInput = () => {
  // 防抖搜索，500ms 后自动搜索
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    messageStore.searchMessages(searchInput.value.trim())
  }, 500)
}

const handleClearSearch = () => {
  searchInput.value = ''
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  messageStore.clearSearch()
}

// 计算可见的页码
const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  if (total <= 7) {
    // 总页数 ≤ 7，显示全部页码
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总页数 > 7，显示省略号
    pages.push(1)
    
    if (current <= 3) {
      // 当前页在前面
      pages.push(2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      // 当前页在后面
      pages.push('...', total - 3, total - 2, total - 1, total)
    } else {
      // 当前页在中间
      pages.push('...', current - 1, current, current + 1, '...', total)
    }
  }
  
  return pages
})

const prevPage = async () => {
  if (currentPage.value > 1) {
    try {
      await messageStore.setPage(currentPage.value - 1)
      smoothScrollToTop()
    } catch (error) {
      showNotification('翻页失败：' + error.message, 'error')
    }
  }
}

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    try {
      await messageStore.setPage(currentPage.value + 1)
      smoothScrollToTop()
    } catch (error) {
      showNotification('翻页失败：' + error.message, 'error')
    }
  }
}

const firstPage = async () => {
  if (currentPage.value !== 1) {
    try {
      await messageStore.setPage(1)
      smoothScrollToTop()
    } catch (error) {
      showNotification('跳转失败：' + error.message, 'error')
    }
  }
}

const lastPage = async () => {
  if (currentPage.value !== totalPages.value) {
    try {
      await messageStore.setPage(totalPages.value)
      smoothScrollToTop()
    } catch (error) {
      showNotification('跳转失败：' + error.message, 'error')
    }
  }
}

const goToPage = async (page) => {
  console.log('goToPage called:', page, 'currentPage:', currentPage.value)
  if (typeof page === 'number' && page !== currentPage.value) {
    console.log('Attempting to jump to page:', page)
    try {
      await messageStore.setPage(page)
      console.log('Page set successfully, new currentPage:', currentPage.value)
      smoothScrollToTop()
    } catch (error) {
      console.error('Page jump failed:', error)
      showNotification('跳转失败：' + error.message, 'error')
    }
  } else {
    console.log('Skipped: page is not a number or same as current')
  }
}

// 每10秒自动刷新一次（有选中邮箱时）
let autoTimer = null
let lastRefreshTime = 0
const AUTO_REFRESH_INTERVAL = 10000 // 10秒

const startAutoRefresh = () => {
  stopAutoRefresh()
  autoTimer = setInterval(async () => {
    // 避免在页面不可见时刷新
    if (document.hidden) return
    
    // 避免刷新过于频繁
    const now = Date.now()
    if (now - lastRefreshTime < AUTO_REFRESH_INTERVAL - 1000) return
    
    if (!isRefreshing.value && currentEmail.value) {
      try {
        lastRefreshTime = now
        // 保持当前页码，只刷新数据（静默刷新，不显示加载状态）
        await messageStore.loadMessages(currentEmail.value.id, currentPage.value)
      } catch (_) {
        // 静默失败，不打扰用户
      }
    }
  }, AUTO_REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 切换当前邮箱时重启定时器并立即拉取
watch(currentEmail, async (val, oldVal) => {
  // 只有在切换不同邮箱时才重置到第一页
  if (val && val.id !== oldVal?.id) {
    try { 
      await messageStore.loadMessages(val.id, 1) 
    } catch (_) {}
  }
  startAutoRefresh()
})
</script>

<style scoped>
/* 固定卡片高度，避免分页时高度变化 */
.message-list-card {
  min-height: 600px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(55, 53, 47, 0.09);
  flex-wrap: wrap;
  gap: 12px;
}

.list-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #37352f;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-header h2 .title-icon {
  color: rgba(55, 53, 47, 0.45);
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

/* 统一按钮样式 */
.header-actions .btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  min-height: 28px;
  border-radius: 3px;
  font-size: 13px;
  transition: all 0.12s ease;
}

.header-actions .btn svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.header-actions .btn-danger {
  background: rgba(235, 87, 87, 0.1);
  color: #eb5757;
  border: none;
}

.header-actions .btn-danger:hover {
  background: rgba(235, 87, 87, 0.15);
}

.header-actions .btn-secondary {
  background: rgba(55, 53, 47, 0.06);
  color: rgba(55, 53, 47, 0.65);
  border: none;
}

.header-actions .btn-secondary:hover {
  background: rgba(55, 53, 47, 0.1);
}

.count-badge {
  background: rgba(55, 53, 47, 0.06);
  color: rgba(55, 53, 47, 0.65);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 搜索框样式 */
.search-box {
  display: flex;
  align-items: center;
  background: rgba(55, 53, 47, 0.06);
  border-radius: 4px;
  padding: 4px 8px;
  gap: 6px;
  min-width: 180px;
  transition: all 0.15s ease;
}

.search-box:focus-within {
  background: white;
  box-shadow: inset 0 0 0 1px rgba(35, 131, 226, 0.5);
}

.search-icon {
  color: rgba(55, 53, 47, 0.45);
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 13px;
  color: #37352f;
  flex: 1;
  min-width: 0;
}

.search-input::placeholder {
  color: rgba(55, 53, 47, 0.45);
}

.search-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background: rgba(55, 53, 47, 0.1);
  border-radius: 50%;
  cursor: pointer;
  color: rgba(55, 53, 47, 0.65);
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.search-clear-btn:hover {
  background: rgba(55, 53, 47, 0.2);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(55, 53, 47, 0.45);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 12px;
}

.message-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.message-item {
  padding: 12px;
  background: white;
  border: 1px solid rgba(55, 53, 47, 0.09);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.12s ease;
  position: relative;
}

/* 已读邮件样式 - 更淡的颜色 */
.message-item.read {
  background: rgba(55, 53, 47, 0.02);
}

.message-item.read .sender {
  color: rgba(55, 53, 47, 0.65);
  font-weight: 400;
}

.message-item.read .subject {
  color: rgba(55, 53, 47, 0.65);
  font-weight: 400;
}

.message-item.read .preview {
  color: rgba(55, 53, 47, 0.45);
}

.select-box {
  display: inline-flex;
  align-items: center;
  float: left;
  margin-right: 10px;
  margin-top: 2px;
  cursor: pointer;
}

.select-box input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  margin: 0;
  border-radius: 3px;
  border: 1.5px solid rgba(55, 53, 47, 0.3);
  appearance: none;
  background: white;
  position: relative;
  transition: all 0.12s ease;
}

.select-box input[type="checkbox"]:checked {
  background: #2383e2;
  border-color: #2383e2;
}

.select-box input[type="checkbox"]:checked::after {
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

.row-actions {
  margin-top: 8px;
  display: flex;
  gap: 4px;
}

.message-item:hover {
  background: rgba(55, 53, 47, 0.03);
}

/* 未读邮件样式 - 更醒目 */
.message-item.unread {
  background: rgba(35, 131, 226, 0.06);
  border-left: 3px solid #2383e2;
  box-shadow: 0 1px 3px rgba(35, 131, 226, 0.1);
}

.message-item.unread .sender {
  font-weight: 600;
  color: #37352f;
}

.message-item.unread .subject {
  font-weight: 600;
  color: #37352f;
}

.message-item.unread:hover {
  background: rgba(35, 131, 226, 0.08);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.sender {
  font-weight: 500;
  color: #37352f;
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  word-break: break-all;
  font-size: 14px;
}

.unread-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #2383e2;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.9);
  }
}

.time {
  color: rgba(55, 53, 47, 0.45);
  font-size: 12px;
  white-space: nowrap;
}

.subject {
  font-weight: 500;
  color: #37352f;
  margin-bottom: 6px;
  font-size: 14px;
}

.verification-code {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, var(--bg-start), var(--bg-end));
  border-radius: 10px;
  margin-top: 8px;
}

.code-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 600;
}

.code-value {
  flex: 1;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
}

.btn-copy-code {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-copy-code:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.preview {
  color: rgba(55, 53, 47, 0.65);
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 删除按钮 Notion 风格 */
.delete-msg-btn {
  background: rgba(235, 87, 87, 0.1);
  color: #eb5757;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.12s ease;
}

.delete-msg-btn:hover {
  background: rgba(235, 87, 87, 0.15);
}

.delete-msg-btn svg {
  width: 14px;
  height: 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
  flex-wrap: wrap;
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

.pagination-btn svg {
  margin: 0 !important;
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

.page-number-btn:disabled {
  cursor: default;
  opacity: 0.5;
  pointer-events: none;
}

.page-info-detail {
  font-size: 0.85rem;
  color: var(--text-sub);
  margin-left: 8px;
  white-space: nowrap;
}

/* 旧的 page-info 样式（保留兼容） */
.page-info {
  color: var(--text-sub);
  font-weight: 600;
}

/* 响应式 - 平板 */
@media (max-width: 1024px) {
  .search-box {
    min-width: 150px;
  }
  
  .header-actions .btn span {
    display: none;
  }
  
  .header-actions .btn {
    padding: 6px 8px;
  }
}

/* 响应式 - 移动端 */
@media (max-width: 768px) {
  .message-list-card {
    min-height: auto;
  }

  .list-header {
    gap: 10px;
    flex-direction: column;
    align-items: flex-start;
  }

  .list-header h2 {
    font-size: 1.1rem;
    width: 100%;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    gap: 6px;
    flex-wrap: wrap;
  }

  .search-box {
    flex: 1;
    min-width: 120px;
    max-width: 100%;
  }

  .header-actions .btn {
    padding: 8px 10px;
    font-size: 0.85rem;
    min-height: 36px;
  }

  .header-actions .btn svg {
    width: 16px;
    height: 16px;
  }

  .header-actions .btn span {
    display: none;
  }

  .count-badge {
    padding: 4px 10px;
    font-size: 0.8rem;
  }

  /* 邮件项移动端优化 */
  .message-item {
    padding: 14px 12px;
  }

  .message-item.unread {
    border-left-width: 4px;
  }

  .select-box {
    margin-right: 8px;
  }

  .select-box input[type="checkbox"] {
    width: 18px;
    height: 18px;
  }

  .message-header {
    flex-direction: column;
    gap: 4px;
    margin-bottom: 6px;
  }

  .sender {
    font-size: 13px;
  }

  .time {
    font-size: 11px;
  }

  .subject {
    font-size: 13px;
    margin-bottom: 4px;
  }

  .preview {
    font-size: 12px;
  }

  .unread-dot {
    width: 6px;
    height: 6px;
  }

  /* 验证码区域移动端优化 */
  .verification-code {
    padding: 8px 12px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .code-label {
    font-size: 0.8rem;
  }

  .code-value {
    font-size: 1.1rem;
    letter-spacing: 1px;
  }

  .btn-copy-code {
    width: 28px;
    height: 28px;
  }

  /* 删除按钮移动端始终显示 */
  .row-actions {
    margin-top: 10px;
  }

  .delete-msg-btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  /* 分页移动端优化 */
  .pagination {
    gap: 4px;
    padding-top: 16px;
    margin-top: 16px;
  }
  
  .page-numbers {
    gap: 2px;
  }
  
  .page-number-btn {
    min-width: 32px;
    height: 32px;
    padding: 0 6px;
    font-size: 0.85rem;
  }
  
  .pagination-btn {
    min-width: 32px !important;
    height: 32px;
  }
  
  .page-info-detail {
    width: 100%;
    text-align: center;
    margin: 8px 0 0 0;
    font-size: 0.75rem;
  }
}

/* 响应式 - 小屏手机 */
@media (max-width: 480px) {
  .list-header h2 {
    font-size: 1rem;
  }

  .header-actions {
    gap: 4px;
  }

  .search-box {
    padding: 3px 6px;
    font-size: 12px;
  }

  .search-input {
    font-size: 12px;
  }

  .message-item {
    padding: 12px 10px;
  }

  .sender {
    font-size: 12px;
  }

  .subject {
    font-size: 12px;
  }

  .preview {
    font-size: 11px;
  }

  .page-numbers {
    display: none;
  }

  .pagination {
    justify-content: space-between;
  }

  .page-info-detail {
    font-size: 0.7rem;
  }
}

/* 收件箱刷新按钮样式 */
.refresh-btn-inbox {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.refresh-btn-inbox.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border-color: #10b981 !important;
  color: white !important;
  animation: successPulse 0.6s ease-out;
}

.refresh-btn-inbox.transitioning {
  animation: fadeOutToBlue 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.refresh-btn-inbox svg.spinning {
  animation: spin 1s linear infinite;
}

.refresh-btn-inbox .check-icon {
  animation: checkIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes checkIn {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes successPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes fadeOutToBlue {
  to {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
    border-color: #6366f1 !important;
  }
}

.icon-fade-enter-active,
.icon-fade-leave-active,
.text-fade-enter-active,
.text-fade-leave-active {
  transition: all 0.2s ease;
}

.icon-fade-enter-from,
.text-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.icon-fade-leave-to,
.text-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 淡入动画 */
.fade-in-item {
  animation: fadeInUp 0.4s ease-out backwards;
}

.fade-in-item:nth-child(1) { animation-delay: 0.05s; }
.fade-in-item:nth-child(2) { animation-delay: 0.1s; }
.fade-in-item:nth-child(3) { animation-delay: 0.15s; }
.fade-in-item:nth-child(4) { animation-delay: 0.2s; }

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

