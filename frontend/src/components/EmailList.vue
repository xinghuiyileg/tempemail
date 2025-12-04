<template>
  <div class="card email-list-card">
    <div class="card-body">
      <div class="list-header" ref="emailListTopRef">
        <h2>
          <svg class="title-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          临时邮箱列表
        </h2>
        <div class="header-actions icon-row">
        <!-- 搜索框 -->
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            v-model="searchInput"
            placeholder="搜索邮箱..."
            @keyup.enter="handleSearch"
            @input="handleSearchInput"
            class="search-input"
          />
          <button
            v-if="searchInput || emailStore.searchQuery"
            class="search-clear-btn"
            @click="handleClearSearch"
            title="清除搜索"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
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

      <!-- 加载骨架屏 -->
      <SkeletonLoader
        v-if="emailLoading && emails.length === 0"
        type="email-list"
        :count="5"
      />

      <!-- 空状态 -->
      <FadeTransition v-else-if="!emailLoading && emails.length === 0" type="scale-fade">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>暂无临时邮箱</p>
          <p class="text-muted">点击上方按钮创建邮箱</p>
        </div>
      </FadeTransition>

      <!-- 邮箱列表 -->
      <FadeTransition v-else type="fade" :duration="400">
        <div class="email-items">
          <div
            v-for="email in emails"
            :key="email.id"
            class="email-item fade-in-item"
            :class="{ active: email.id === currentEmailId }"
            @click="selectEmail(email)"
          >
          <div class="email-item-header">
            <label @click.stop :class="{ 'checkbox-disabled': email.is_starred }">
              <input 
                type="checkbox" 
                v-model="selectedIds" 
                :value="email.id" 
                :disabled="email.is_starred"
                :title="email.is_starred ? '星标邮箱受保护，无法删除' : '选择删除'"
              />
            </label>
            <!-- 星标按钮放在邮箱地址前面 -->
            <button
              class="btn-star"
              :class="{ starred: email.is_starred }"
              @click.stop="toggleStar(email)"
              :title="email.is_starred ? '取消星标（取消后可删除）' : '添加星标（保护邮箱）'"
              :aria-label="email.is_starred ? '取消星标' : '添加星标'"
            >
              <svg v-if="email.is_starred" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
            <div class="email-address" :class="{ 'protected-email': email.is_starred }">
              {{ email.email }}
            </div>
            <!-- 悬停显示的操作按钮 -->
            <div class="hover-actions">
              <button
                class="btn-action btn-copy"
                @click.stop="copyEmail(email.email)"
                title="复制邮箱地址"
                aria-label="复制邮箱地址"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button
                class="btn-action btn-delete-small"
                :disabled="email.is_starred"
                @click.stop="deleteEmail(email, $event)"
                :title="email.is_starred ? '星标邮箱受保护，无法删除' : '删除邮箱'"
                :aria-label="email.is_starred ? '星标邮箱受保护' : '删除邮箱'"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                  <path d="M10 11v6m4-6v6"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="email-item-meta">
            <span class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {{ email.message_count || 0 }} 封邮件
            </span>
            <span class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {{ formatTime(email.created_at) }}
            </span>
          </div>

          <div class="last-received">
            <span v-if="email.last_received_at">最后收信: {{ formatTime(email.last_received_at) }}</span>
            <span v-else class="placeholder">&nbsp;</span>
          </div>
        </div>
        </div>
      </FadeTransition>

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
import { computed, ref } from 'vue'
import { useEmailStore } from '@/stores/emailStore'
import { useMessageStore } from '@/stores/messageStore'
import { useNotification } from '@/composables/useNotification'
import { formatRelativeTime } from '@/utils/formatTime'
import { useButtonLabel } from '@/composables/useButtonLabel'
import SkeletonLoader from './SkeletonLoader.vue'
import FadeTransition from './FadeTransition.vue'

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
const searchInput = ref('')
let searchDebounceTimer = null

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

// 星标/取消星标
const toggleStar = async (email) => {
  try {
    const newStarred = await emailStore.toggleStar(email.id)
    showNotification(newStarred ? '已添加星标 ⭐' : '已取消星标', 'success')
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message || '操作失败'
    showNotification(errorMsg, 'error')
  }
}

const deleteEmail = async (email, evt) => {
  // 星标邮箱受保护，无法删除
  if (email.is_starred) {
    showNotification('⭐ 星标邮箱受保护，无法删除', 'warning')
    return
  }

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
    const errorMsg = error.response?.data?.error || error.message || '删除失败'
    showNotification(errorMsg, 'error')
  }
}

const deleteAll = async () => {
  // 计算当前页的星标邮箱数量（用于提示）
  const starredCount = emails.value.filter(e => e.is_starred).length
  const totalEmails = emailTotalCount.value
  
  if (totalEmails === 0) {
    showNotification('没有可删除的邮箱', 'warning')
    return
  }

  // 如果所有邮箱都是星标的（根据当前页判断）
  if (starredCount === emails.value.length && emails.value.length > 0) {
    showNotification('当前页所有邮箱都已加星标，无法删除', 'warning')
    return
  }

  let confirmMsg = `确认删除所有非星标邮箱？此操作无法撤销！\n星标邮箱将被保留。`
  
  if (!confirm(confirmMsg)) return

  try {
    await withDelAllFeedback(async () => {
      const deletedCount = await emailStore.clearAll()
      const msg = deletedCount > 0 
        ? `已删除 ${deletedCount} 个非星标邮箱`
        : '没有可删除的邮箱（所有邮箱都已加星标）'
      showNotification(msg, 'success')
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

// 复制单个邮箱地址
const copyEmail = async (emailAddr) => {
  try {
    await navigator.clipboard.writeText(emailAddr)
    showNotification('邮箱地址已复制', 'success')
  } catch (e) {
    showNotification('复制失败', 'error')
  }
}

// 搜索相关方法
const handleSearch = () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  emailStore.searchEmails(searchInput.value.trim())
}

const handleSearchInput = () => {
  // 防抖搜索，500ms 后自动搜索
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    emailStore.searchEmails(searchInput.value.trim())
  }, 500)
}

const handleClearSearch = () => {
  searchInput.value = ''
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  emailStore.clearSearch()
}
</script>

<style scoped>
/* 固定卡片高度，避免分页时高度变化 */
.email-list-card {
  min-height: 600px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(55, 53, 47, 0.09);
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

/* 图标按钮容器 */
.header-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
}

/* 统一图标按钮样式 */
.header-actions .btn-icon {
  min-width: 28px;
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.12s ease;
  border: none;
  background: rgba(55, 53, 47, 0.06);
  color: rgba(55, 53, 47, 0.65);
}

.header-actions .btn-icon:hover {
  background: rgba(55, 53, 47, 0.1);
}

.header-actions .btn-icon.btn-danger {
  background: rgba(235, 87, 87, 0.1);
  color: #eb5757;
}

.header-actions .btn-icon.btn-danger:hover {
  background: rgba(235, 87, 87, 0.15);
}

.header-actions .btn-icon.btn-secondary {
  background: rgba(35, 131, 226, 0.1);
  color: #2383e2;
}

.header-actions .btn-icon.btn-secondary:hover {
  background: rgba(35, 131, 226, 0.15);
}

.header-actions .btn-icon svg {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

/* 搜索框样式 */
.search-box {
  display: flex;
  align-items: center;
  background: rgba(55, 53, 47, 0.06);
  border-radius: 4px;
  padding: 4px 8px;
  gap: 6px;
  min-width: 140px;
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
  width: 80px;
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

.email-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.email-item {
  padding: 12px;
  background: white;
  border: 1px solid rgba(55, 53, 47, 0.09);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.12s ease;
}

.email-item:hover {
  background: rgba(55, 53, 47, 0.03);
}

.email-item.active {
  background: rgba(35, 131, 226, 0.08);
  border-color: rgba(35, 131, 226, 0.24);
}

.email-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.email-item-header label {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}

.email-item-header input[type="checkbox"] {
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

.email-item-header input[type="checkbox"]:checked {
  background: #2383e2;
  border-color: #2383e2;
}

.email-item-header input[type="checkbox"]:checked::after {
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

.email-item-header input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.checkbox-disabled {
  cursor: not-allowed !important;
  opacity: 0.5;
}

.email-address {
  font-weight: 500;
  color: #37352f;
  word-break: break-all;
  flex: 1;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.protected-email {
  color: #2383e2;
}

.protected-badge {
  font-size: 0.9rem;
  animation: shield-pulse 2s ease-in-out infinite;
}

@keyframes shield-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* 悬停显示的操作按钮容器 */
.hover-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.15s ease;
}

.email-item:hover .hover-actions {
  opacity: 1;
  visibility: visible;
}

/* 通用操作按钮样式 */
.btn-action {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
  flex-shrink: 0;
}

.btn-action svg {
  width: 14px;
  height: 14px;
}

/* 复制按钮 */
.btn-copy {
  background: rgba(35, 131, 226, 0.1);
  color: #2383e2;
}

.btn-copy:hover {
  background: rgba(35, 131, 226, 0.2);
  transform: scale(1.05);
}

/* 删除按钮（小） */
.btn-delete-small {
  background: rgba(235, 87, 87, 0.1);
  color: #eb5757;
}

.btn-delete-small:hover:not(:disabled) {
  background: rgba(235, 87, 87, 0.2);
  transform: scale(1.05);
}

.btn-delete-small:disabled {
  background: rgba(55, 53, 47, 0.05);
  color: rgba(55, 53, 47, 0.3);
  cursor: not-allowed;
}

.btn-star {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: rgba(55, 53, 47, 0.35);
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.12s ease;
  flex-shrink: 0;
  font-size: 16px;
}

.btn-star:hover {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.btn-star.starred {
  color: #ffc107;
}

.btn-star.starred:hover {
  background: rgba(255, 193, 7, 0.15);
}

@keyframes starPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
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

.meta-item .meta-icon {
  color: rgba(55, 53, 47, 0.45);
  flex-shrink: 0;
}

.last-received {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--text-sub);
  padding-top: 8px;
  border-top: 1px solid var(--border);
  min-height: 1.5em;
}

.last-received .placeholder {
  visibility: hidden;
}

/* 分页样式（Notion 风格） */
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

@media (max-width: 768px) {
  .list-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .list-header h2 {
    font-size: 1.2rem;
    width: 100%;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
    gap: 6px;
  }

  .header-actions .btn-icon {
    min-width: 32px;
    width: 32px;
    height: 32px;
  }

  .header-actions .btn-icon svg {
    width: 16px;
    height: 16px;
  }

  /* 移动端始终显示操作按钮（无悬停） */
  .hover-actions {
    opacity: 1;
    visibility: visible;
  }

  .btn-action {
    width: 28px;
    height: 28px;
  }

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

/* 淡入动画 */
.fade-in-item {
  animation: fadeInUp 0.4s ease-out backwards;
}

.fade-in-item:nth-child(1) { animation-delay: 0.05s; }
.fade-in-item:nth-child(2) { animation-delay: 0.1s; }
.fade-in-item:nth-child(3) { animation-delay: 0.15s; }
.fade-in-item:nth-child(4) { animation-delay: 0.2s; }
.fade-in-item:nth-child(5) { animation-delay: 0.25s; }

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

