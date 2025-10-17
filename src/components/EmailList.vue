<template>
  <div class="card">
    <div class="card-body">
      <div class="list-header" ref="emailListTopRef">
        <h2>📧 临时邮箱列表</h2>
        <div class="header-actions icon-row">
        <button
          v-if="emails.length > 0"
          class="btn btn-sm btn-danger btn-icon"
          :disabled="selectedIds.length===0"
          @click="batchDelete"
          title="删除选中"
          aria-label="删除选中"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
            <path d="M10 11v6m4-6v6"/>
          </svg>
        </button>
        <button
          ref="copyBtnRef"
          class="btn btn-sm btn-secondary btn-icon copy-icon-btn"
          :disabled="!currentEmailId"
          @click="copyCurrent"
          :title="copyLabel"
          :aria-label="copyLabel"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
        <button
          v-if="emails.length > 0"
          ref="delAllBtnRef"
          class="btn btn-sm btn-danger btn-icon sweep-icon-btn"
          @click="deleteAll"
          :title="delAllLabel"
          :aria-label="delAllLabel"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
            <path d="M14 11l-3 3m0 0l-3-3m3 3v-6"/>
          </svg>
        </button>
        </div>
      </div>

      <div v-if="emails.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无临时邮箱</p>
        <p class="text-muted">点击上方按钮创建邮箱</p>
      </div>

      <div v-else class="email-items has-loading-overlay">
        <div v-if="emailLoading" class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
        <div
          v-for="email in emails"
          :key="email.id"
          class="email-item"
          :class="{ active: email.id === currentEmailId }"
          @click="selectEmail(email)"
        >
          <div class="email-item-header">
            <label style="margin-right:8px" @click.stop>
              <input type="checkbox" v-model="selectedIds" :value="email.id" />
            </label>
            <div class="email-address">{{ email.email }}</div>
            <button
              class="btn-delete"
              @click.stop="deleteEmail(email, $event)"
              title="删除"
              aria-label="删除邮箱"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path fill="currentColor" d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1zm1 2v0h4V4h-4v1zm-3 2v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7H7zm3 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z"/>
              </svg>
            </button>
          </div>

          <div class="email-item-meta">
            <span class="meta-item">
              📬 {{ email.message_count || 0 }} 封邮件
            </span>
            <span class="meta-item">
              🕐 {{ formatTime(email.created_at) }}
            </span>
          </div>

          <div v-if="email.last_received_at" class="last-received">
            最后收信: {{ formatTime(email.last_received_at) }}
          </div>
        </div>
      </div>

      <!-- 分页（与收件箱统一样式与交互） -->
      <div v-if="emailTotalPages > 1" class="pagination">
        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="firstEmailPage"
          :disabled="emailCurrentPage === 1 || emailLoading"
          title="首页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m11 17-5-5 5-5M18 17l-5-5 5-5"/>
          </svg>
        </button>

        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="prevEmailPage"
          :disabled="emailCurrentPage === 1 || emailLoading"
          title="上一页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <div class="page-numbers">
          <button
            v-for="page in emailVisiblePages"
            :key="page"
            class="page-number-btn"
            :class="{ active: page === emailCurrentPage }"
            @click="goEmailPage(page)"
            :disabled="page === '...' || emailLoading"
          >
            {{ page }}
          </button>
        </div>

        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="nextEmailPage"
          :disabled="emailCurrentPage === emailTotalPages || emailLoading"
          title="下一页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>

        <button
          class="btn btn-sm btn-secondary pagination-btn"
          @click="lastEmailPage"
          :disabled="emailCurrentPage === emailTotalPages || emailLoading"
          title="末页"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m13 17 5-5-5-5M6 17l5-5-5-5"/>
          </svg>
        </button>

        <span class="page-info-detail">
          共 {{ emailTotalCount }} 个邮箱，第 {{ emailCurrentPage }} / {{ emailTotalPages }} 页
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEmailStore } from '@/stores/emailStore'
import { useMessageStore } from '@/stores/messageStore'
import { useNotification } from '@/composables/useNotification'
import { formatRelativeTime } from '@/utils/formatTime'
import { ref } from 'vue'
import { useButtonLabel } from '@/composables/useButtonLabel'

const emailStore = useEmailStore()
const messageStore = useMessageStore()
const { showNotification } = useNotification()

const emails = computed(() => emailStore.emails)
const currentEmailId = computed(() => emailStore.currentEmail?.id)
const currentEmailAddr = computed(() => emailStore.currentEmail?.email)
const emailCurrentPage = computed(() => emailStore.currentPage)
const emailTotalPages = computed(() => emailStore.totalPages)
const emailTotalCount = computed(() => emailStore.totalCount)
const emailLoading = computed(() => emailStore.loading)

const emailListTopRef = ref(null)
const smoothScrollToTop = () => {
  try {
    if (emailListTopRef.value) {
      emailListTopRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } catch (_) {}
}

// 计算可见页码（与收件箱一致）
const emailVisiblePages = computed(() => {
  const pages = []
  const total = emailTotalPages.value
  const current = emailCurrentPage.value
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

// 动态按钮文案
const copyBtnRef = ref(null)
const delAllBtnRef = ref(null)
const { label: copyLabel, withFeedback: withCopyFeedback } = useButtonLabel('复制邮箱', { timeoutMs: 900 })
const { label: delAllLabel, withFeedback: withDelAllFeedback } = useButtonLabel('全部删除', { timeoutMs: 900 })
const selectedIds = ref([])

const selectEmail = (email) => {
  emailStore.setCurrentEmail(email)
  messageStore.loadMessages(email.id)
}

const goEmailPage = async (page) => {
  if (typeof page !== 'number') return
  if (page < 1 || page > emailTotalPages.value) return
  if (page === emailCurrentPage.value) return
  try {
    await emailStore.loadEmails(page)
    smoothScrollToTop()
  } catch (_) {}
}

const prevEmailPage = async () => {
  if (emailCurrentPage.value > 1) {
    try {
      await emailStore.loadEmails(emailCurrentPage.value - 1)
      smoothScrollToTop()
    } catch (_) {}
  }
}

const nextEmailPage = async () => {
  if (emailCurrentPage.value < emailTotalPages.value) {
    try {
      await emailStore.loadEmails(emailCurrentPage.value + 1)
      smoothScrollToTop()
    } catch (_) {}
  }
}

const firstEmailPage = async () => {
  if (emailCurrentPage.value !== 1) {
    try {
      await emailStore.loadEmails(1)
      smoothScrollToTop()
    } catch (_) {}
  }
}

const lastEmailPage = async () => {
  if (emailCurrentPage.value !== emailTotalPages.value) {
    try {
      await emailStore.loadEmails(emailTotalPages.value)
      smoothScrollToTop()
    } catch (_) {}
  }
}

const deleteEmail = async (email, evt) => {
  if (!confirm(`确认删除邮箱 ${email.email}？`)) return

  try {
    await emailStore.deleteEmail(email.id)
    showNotification('邮箱已删除', 'success')
    // 垃圾桶按钮轻微晃动反馈
    const el = evt?.currentTarget
    if (el) {
      el.classList.add('trash-anim')
      setTimeout(() => el.classList.remove('trash-anim'), 500)
    }
  } catch (error) {
    showNotification('删除失败：' + error.message, 'error')
  }
}

const deleteAll = async () => {
  if (!confirm('确认删除所有临时邮箱？此操作无法撤销！')) return

  try {
    await withDelAllFeedback(async () => {
      const ids = emails.value.map(e => e.id)
      await emailStore.batchDelete(ids)
      showNotification('已删除所有邮箱', 'success')
    }, { loadingText: '删除中...', successText: '已删除 ✓', buttonRef: delAllBtnRef })
  } catch (error) {
    showNotification('批量删除失败：' + error.message, 'error')
  }
}

const batchDelete = async () => {
  if (selectedIds.value.length === 0) return
  if (!confirm(`确认删除选中的 ${selectedIds.value.length} 个邮箱？此操作不可撤销！`)) return
  try {
    // 逐个删除（与消息批量一致，后续可加批量 API）
    for (const id of [...selectedIds.value]) {
      await emailStore.deleteEmail(id)
    }
    selectedIds.value = []
    showNotification('已删除选中邮箱', 'success')
  } catch (e) {
    showNotification('删除失败：' + e.message, 'error')
  }
}

const formatTime = (time) => {
  return formatRelativeTime(time)
}

const copyCurrent = async () => {
  if (!currentEmailAddr.value) return
  try {
    await withCopyFeedback(async () => {
      await navigator.clipboard.writeText(currentEmailAddr.value)
      showNotification('邮箱地址已复制到剪贴板', 'success')
    }, { loadingText: '复制中...', successText: '已复制 ✓', buttonRef: copyBtnRef })
  } catch (e) {
    showNotification('复制失败', 'error')
  }
}
</script>

<style scoped>
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1.5px solid var(--border);
}

.list-header h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
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

.email-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.email-item {
  padding: 16px;
  background: var(--muted);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.email-item:hover {
  border-color: var(--brand);
  transform: translateX(4px);
}

.email-item.active {
  border-color: var(--brand);
  background: rgba(108, 123, 255, 0.08);
}

.email-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.email-address {
  font-weight: 700;
  color: var(--text-main);
  word-break: break-all;
  flex: 1;
}

.btn-delete {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--danger);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 8px;
}

.btn-delete:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(240, 62, 62, 0.3);
}

.email-item-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.9rem;
  color: var(--text-sub);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.last-received {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--text-sub);
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

/* 分页样式（与收件箱统一） */
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

