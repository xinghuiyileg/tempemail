<template>
  <div class="domains-page">
    <!-- 页面头部 -->
    <div class="domains-header">
      <div>
        <h2>我的域名</h2>
        <p class="subtitle">管理您添加的域名，验证MX记录后<strong>所有用户</strong>都可以使用</p>
      </div>
      <button class="btn-primary" @click="showAddDialog = true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        添加域名
      </button>
    </div>

    <!-- 使用说明 -->
    <div class="info-card">
      <div class="info-icon">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </div>
      <div class="info-content">
        <h4>域名共享说明</h4>
        <ul>
          <li>✅ 添加域名后，验证MX记录即可使用</li>
          <li>🌐 <strong>验证通过的域名所有用户都可以使用</strong>（共享域名池）</li>
          <li>🔒 您只能管理（删除/重新验证）自己添加的域名</li>
          <li>⚠️ 如需私有域名，请在系统配置中单独设置</li>
        </ul>
      </div>
    </div>

    <!-- 域名列表 -->
    <div class="domains-list">
      <div v-if="loading.list" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="domains.length === 0" class="empty-state">
        <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <h3>暂无域名</h3>
        <p>开始添加您的第一个域名吧</p>
        <button class="btn-primary" @click="showAddDialog = true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          添加域名
        </button>
      </div>

      <div v-else class="domains-grid">
        <div
          v-for="domain in domains"
          :key="domain.id"
          class="domain-card"
          :class="`status-${domain.status}`"
        >
          <div class="domain-header">
            <div class="domain-title">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <h3>{{ domain.domain }}</h3>
            </div>
            <span class="status-badge" :class="`badge-${domain.status}`">
              {{ getStatusText(domain.status) }}
            </span>
          </div>

          <div class="domain-info">
            <div class="info-row">
              <span class="label">创建时间</span>
              <span class="value">{{ formatDate(domain.created_at) }}</span>
            </div>
            <div v-if="domain.last_verified_at" class="info-row">
              <span class="label">上次验证</span>
              <span class="value">{{ formatDate(domain.last_verified_at) }}</span>
            </div>
            <div v-if="domain.mx_records && domain.mx_records.length > 0" class="info-row">
              <span class="label">MX记录</span>
              <span class="value">{{ domain.mx_records.length }} 条</span>
            </div>
          </div>

          <div v-if="domain.mx_records && domain.mx_records.length > 0" class="mx-records">
            <div class="mx-record" v-for="(record, index) in domain.mx_records" :key="index">
              <span class="priority">{{ record.priority }}</span>
              <span class="exchange">{{ record.exchange }}</span>
            </div>
          </div>

          <div class="domain-actions">
            <button
              class="btn-action"
              @click="verifyDomain(domain)"
              :disabled="loading.verify === domain.id"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              {{ loading.verify === domain.id ? '验证中...' : (domain.status === 'verified' ? '重新验证' : '验证域名') }}
            </button>
            <button
              class="btn-action btn-danger"
              @click="confirmDelete(domain)"
              :disabled="loading.delete === domain.id"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加域名对话框 -->
    <div v-if="showAddDialog" class="modal" @click="showAddDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加域名</h3>
          <button class="close-btn" @click="showAddDialog = false">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>域名</label>
            <input
              v-model="newDomain"
              type="text"
              placeholder="例如：example.com"
              @keyup.enter="addDomain"
            />
            <small>请输入您拥有的域名，不包含 www 或其他前缀</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddDialog = false">取消</button>
          <button
            class="btn-primary"
            @click="addDomain"
            :disabled="loading.add || !newDomain"
          >
            {{ loading.add ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal" @click="showDeleteDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="close-btn" @click="showDeleteDialog = false">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p>确定要删除域名 <strong>{{ domainToDelete?.domain }}</strong> 吗？</p>
          <p class="warning">删除后无法恢复，使用该域名的邮箱将无法继续使用。</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showDeleteDialog = false">取消</button>
          <button
            class="btn-danger"
            @click="deleteDomain"
            :disabled="loading.delete"
          >
            {{ loading.delete ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '../services/api'
import { useAuthStore } from '../stores/authStore'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(utc)
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const authStore = useAuthStore()
const domains = ref([])
const newDomain = ref('')
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const domainToDelete = ref(null)

const loading = ref({
  list: false,
  add: false,
  verify: null,
  delete: null
})

// 获取域名列表
async function loadDomains() {
  // 检查是否已登录，避免退出登录时触发 401 错误
  if (!authStore.isAuthenticated) {
    return
  }
  
  loading.value.list = true
  try {
    const response = await apiClient.get('/domains')
    
    if (response.data.success) {
      domains.value = response.data.data.domains
    }
  } catch (error) {
    console.error('Load domains error:', error)
    showNotification('加载域名列表失败: ' + error.message, 'error')
  } finally {
    loading.value.list = false
  }
}

// 添加域名
async function addDomain() {
  if (!newDomain.value.trim()) {
    showNotification('请输入域名', 'warning')
    return
  }

  loading.value.add = true
  try {
    const response = await apiClient.post('/domains', {
      domain: newDomain.value.trim().toLowerCase()
    })

    if (response.data.success) {
      showNotification('域名添加成功！请进行验证', 'success')
      newDomain.value = ''
      showAddDialog.value = false
      await loadDomains()
    }
  } catch (error) {
    console.error('Add domain error:', error)
    showNotification('添加域名失败: ' + (error.response?.data?.error || error.message), 'error')
  } finally {
    loading.value.add = false
  }
}

// 验证域名
async function verifyDomain(domain) {
  loading.value.verify = domain.id
  try {
    const response = await apiClient.post(`/domains/${domain.id}/verify`)

    if (response.data.success) {
      if (response.data.data.verified) {
        showNotification('域名验证成功！', 'success')
      } else {
        showNotification('域名验证失败: ' + (response.data.data.results?.mx?.error || '未知错误'), 'error')
      }
      await loadDomains()
    }
  } catch (error) {
    console.error('Verify domain error:', error)
    showNotification('验证失败: ' + error.message, 'error')
  } finally {
    loading.value.verify = null
  }
}

// 确认删除
function confirmDelete(domain) {
  domainToDelete.value = domain
  showDeleteDialog.value = true
}

// 删除域名
async function deleteDomain() {
  if (!domainToDelete.value) return

  loading.value.delete = domainToDelete.value.id
  try {
    const response = await apiClient.delete(`/domains/${domainToDelete.value.id}`)

    if (response.data.success) {
      showNotification('域名删除成功', 'success')
      showDeleteDialog.value = false
      domainToDelete.value = null
      await loadDomains()
    }
  } catch (error) {
    console.error('Delete domain error:', error)
    showNotification('删除失败: ' + error.message, 'error')
  } finally {
    loading.value.delete = null
  }
}

// 获取状态文本
function getStatusText(status) {
  const statusMap = {
    'pending': '待验证',
    'verified': '已验证',
    'failed': '验证失败'
  }
  return statusMap[status] || status
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '-'
  // 数据库返回的是UTC时间，需要转换为本地时间
  // SQLite datetime('now') 返回格式如: "2025-11-09 10:30:00"
  return dayjs.utc(dateStr).local().fromNow()
}

// 通知
function showNotification(message, type = 'info') {
  console.log(`[${type}] ${message}`)
  alert(message)
}

// 初始化
onMounted(() => {
  loadDomains()
})
</script>

<style scoped>
.domains-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.domains-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.domains-header h2 {
  margin: 0;
  font-size: 1.75rem;
  color: #111827;
}

.subtitle {
  margin: 0.25rem 0 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* 信息卡片 */
.info-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.info-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-content h4 {
  margin: 0 0 0.5rem 0;
  color: #1e40af;
}

.info-content ul {
  margin: 0;
  padding-left: 1.5rem;
  color: #1e3a8a;
}

.info-content li {
  margin-bottom: 0.25rem;
}

/* 加载和空状态 */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
}

.empty-state .btn-primary {
  margin-top: 0;
}

.empty-state .btn-primary svg {
  flex-shrink: 0;
  margin: 0;
}

/* 域名网格 */
.domains-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.domain-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.2s;
}

.domain-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.domain-card.status-verified {
  border-color: #10b981;
}

.domain-card.status-pending {
  border-color: #f59e0b;
}

.domain-card.status-failed {
  border-color: #ef4444;
}

.domain-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.domain-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.domain-title h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
  word-break: break-all;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-verified {
  background: #d1fae5;
  color: #047857;
}

.badge-pending {
  background: #fef3c7;
  color: #d97706;
}

.badge-failed {
  background: #fee2e2;
  color: #dc2626;
}

.domain-info {
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.875rem;
}

.info-row .label {
  color: #6b7280;
}

.info-row .value {
  color: #111827;
  font-weight: 500;
}

.mx-records {
  background: #f9fafb;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.mx-record {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.mx-record .priority {
  color: #6b7280;
  font-weight: 600;
  min-width: 30px;
}

.mx-record .exchange {
  color: #374151;
  word-break: break-all;
}

.domain-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-action.btn-danger {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.btn-action.btn-danger:hover:not(:disabled) {
  background: #fecaca;
}

/* 按钮样式 */
.btn-primary,
.btn-secondary,
.btn-danger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* 模态框 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.warning {
  color: #dc2626;
  background: #fef2f2;
  padding: 0.75rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
}
</style>









