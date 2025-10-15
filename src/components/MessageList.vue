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
            🗑️ {{ batchDelLabel }}
          </button>
          <button
            v-if="currentEmail && messages.length > 0"
            ref="clearBtnRef"
            class="btn btn-sm btn-danger"
            @click="clearMessages"
          >
            🗑️ {{ clearLabel }}
          </button>
          <button
            v-if="currentEmail"
            ref="refreshBtnRef"
            class="btn btn-sm btn-secondary"
            @click="refreshMessages"
            :disabled="isRefreshing"
          >
            <span :class="{ spinning: isRefreshing }">🔄</span>
            {{ refreshLabel }}
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
              📋
            </button>
          </div>

          <div v-else class="preview">{{ getPreview(message) }}</div>
          <div class="row-actions" @click.stop>
            <button class="btn btn-sm btn-secondary" @click="deleteOne(message)">删除</button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="btn btn-sm btn-secondary"
          @click="prevPage"
          :disabled="currentPage === 1"
        >
          ← 上一页
        </button>
        <span class="page-info">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <button
          class="btn btn-sm btn-secondary"
          @click="nextPage"
          :disabled="currentPage === totalPages"
        >
          下一页 →
        </button>
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
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}

.page-info {
  color: var(--text-sub);
  font-weight: 600;
}
</style>

