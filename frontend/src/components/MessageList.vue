<template>
  <div class="card">
    <div class="card-body">
      <div class="list-header">
        <h2>📬 收件箱</h2>
        <div class="header-actions">
          <span v-if="totalCount > 0" class="count-badge">
            {{ totalCount }} 封邮件
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
            ref="refreshBtnRef"
            class="btn btn-sm btn-secondary refresh-btn"
            @click="refreshMessages"
            :disabled="isRefreshing"
            title="刷新邮件列表"
            aria-label="刷新邮件列表"
          >
            <svg 
              viewBox="0 0 24 24" 
              width="16" 
              height="16" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round"
              :class="{ spinning: isRefreshing }"
              style="transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
            <span>{{ refreshLabel }}</span>
          </button>
        </div>
      </div>

      <div v-if="!currentEmail" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>请先选择或创建临时邮箱</p>
      </div>

      <div v-else-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无邮件</p>
        <p class="text-muted">等待接收新邮件...</p>
      </div>

      <div v-else class="message-items">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-item"
          :class="{ unread: !message.is_read }"
          @click="openMessage(message)"
        >
          <label class="select-box" @click.stop>
            <input type="checkbox" v-model="selectedIds" :value="message.id" />
          </label>
          <div class="message-header">
            <div class="sender">
              <span v-if="!message.is_read" class="unread-dot">🔵</span>
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

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="firstPage"
          :disabled="currentPage === 1"
          title="首页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>
          </svg>
        </button>
        
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="prevPage"
          :disabled="currentPage === 1"
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
            :disabled="page === '...'"
          >
            {{ page }}
          </button>
        </div>
        
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="nextPage"
          :disabled="currentPage === totalPages"
          title="下一页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
        
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="lastPage"
          :disabled="currentPage === totalPages"
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
import MessageModal from './MessageModal.vue'
import { messageAPI } from '@/services/api'

const emailStore = useEmailStore()
const messageStore = useMessageStore()
const { showNotification } = useNotification()

const isRefreshing = ref(false)
const refreshBtnRef = ref(null)
const { label: refreshLabel, withFeedback: withRefreshFeedback } = useButtonLabel('刷新', { timeoutMs: 800 })
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
  try {
    await withRefreshFeedback(async () => {
      await messageStore.loadMessages(currentEmail.value.id)
      showNotification('刷新成功', 'success')
    }, { loadingText: '刷新中...', successText: '已刷新 ✓', buttonRef: refreshBtnRef })
  } catch (error) {
    showNotification('刷新失败：' + error.message, 'error')
  } finally {
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

const getPreview = (message) => {
  const text = message.body_text || message.body_html || ''
  return text.substring(0, 100) + (text.length > 100 ? '...' : '')
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
      // 逐个删除（数据量不大，便于简单可靠；后续可换批量 API）
      for (const id of [...selectedIds.value]) {
        await messageStore.deleteMessage(id)
      }
      selectedIds.value = []
      showNotification('选中邮件已删除', 'success')
    }, { loadingText: '删除中...', successText: '已删除 ✓', buttonRef: batchDelBtnRef })
  } catch (e) {
    showNotification('批量删除失败：' + e.message, 'error')
  }
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

const prevPage = () => {
  if (currentPage.value > 1) {
    messageStore.setPage(currentPage.value - 1)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    messageStore.setPage(currentPage.value + 1)
  }
}

const firstPage = () => {
  if (currentPage.value !== 1) {
    messageStore.setPage(1)
  }
}

const lastPage = () => {
  if (currentPage.value !== totalPages.value) {
    messageStore.setPage(totalPages.value)
  }
}

const goToPage = (page) => {
  if (typeof page === 'number' && page !== currentPage.value) {
    messageStore.setPage(page)
  }
}

// 每30秒自动刷新一次（有选中邮箱时）
let autoTimer = null
const startAutoRefresh = () => {
  stopAutoRefresh()
  autoTimer = setInterval(async () => {
    if (!isRefreshing.value && currentEmail.value) {
      try {
        await messageStore.loadMessages(currentEmail.value.id)
      } catch (_) {}
    }
  }, 30000)
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
watch(currentEmail, async (val) => {
  if (val) {
    try { await messageStore.loadMessages(val.id) } catch (_) {}
  }
  startAutoRefresh()
})
</script>

<style scoped>
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid var(--border);
  flex-wrap: wrap;
  gap: 12px;
}

.list-header h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-badge {
  background: var(--brand);
  color: #fff;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-sub);
}

.empty-icon {
  font-size: 3rem;
  opacity: 0.3;
  margin-bottom: 12px;
}

.message-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  padding: 16px;
  background: var(--muted);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.select-box {
  float: left;
  margin-right: 8px;
}

.row-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.message-item:hover {
  border-color: var(--brand);
  transform: translateX(4px);
}

.message-item.unread {
  background: rgba(108, 123, 255, 0.08);
  border-left: 4px solid var(--brand);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
}

.sender {
  font-weight: 700;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  word-break: break-all;
}

.unread-dot {
  font-size: 0.6rem;
  line-height: 1;
}

.time {
  color: var(--text-sub);
  font-size: 0.9rem;
  white-space: nowrap;
}

.subject {
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
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
  color: var(--text-sub);
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1.5px solid var(--border);
  flex-wrap: wrap;
}

.page-numbers {
  display: flex;
  gap: 6px;
  align-items: center;
}

.page-number-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  border: 1.5px solid var(--border);
  background: var(--muted);
  color: var(--text-main);
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-number-btn:hover:not(:disabled) {
  border-color: var(--brand);
  background: rgba(108, 123, 255, 0.1);
  transform: translateY(-1px);
}

.page-number-btn.active {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%);
  color: #fff;
  border-color: var(--brand);
  box-shadow: 0 2px 8px rgba(108, 123, 255, 0.3);
}

.page-number-btn:disabled {
  cursor: default;
  opacity: 0.5;
  border: none;
  background: transparent;
}

.pagination-btn {
  min-width: 36px !important;
  height: 36px;
  padding: 0 10px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn svg {
  margin: 0 !important;
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

/* 响应式 - 移动端 */
@media (max-width: 768px) {
  .pagination {
    gap: 6px;
  }
  
  .page-numbers {
    gap: 4px;
  }
  
  .page-number-btn {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    font-size: 0.85rem;
  }
  
  .pagination-btn {
    min-width: 32px !important;
    height: 32px;
  }
  
  .page-info-detail {
    width: 100%;
    text-align: center;
    margin: 4px 0 0 0;
    font-size: 0.8rem;
  }
}
</style>

