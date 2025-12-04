<template>
  <div class="backup-management">
    <div class="page-header">
      <h2>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        数据备份与恢复
      </h2>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon db-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ dbStats.total || 0 }}</div>
          <div class="stat-label">数据库总记录数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon backup-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ backups.length }}</div>
          <div class="stat-label">备份文件数量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon time-icon">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ lastBackupTime }}</div>
          <div class="stat-label">最后备份时间</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮区 -->
    <div class="action-section">
      <button 
        :class="['btn-primary', `state-${createButtonState}`]" 
        @click="createBackup" 
        :disabled="createButtonState === 'loading'">
        <svg v-if="createButtonState === 'idle' || createButtonState === 'loading'" 
             :class="{'spinning': createButtonState === 'loading'}"
             viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <svg v-else class="check-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span class="button-text">{{ 
          createButtonState === 'idle' ? '创建备份' : 
          createButtonState === 'loading' ? '创建中...' : 
          '创建成功' 
        }}</span>
      </button>

      <RefreshButton label="刷新统计" :on-refresh="refreshStats" />

      <label :class="['btn-upload', `state-${uploadButtonState}`]">
        <svg v-if="uploadButtonState === 'idle'" 
             viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <svg v-else class="check-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span class="button-text">{{ 
          uploadButtonState === 'idle' ? '上传备份文件' : '文件已选择' 
        }}</span>
        <input type="file" accept=".json" @change="handleFileUpload" hidden>
      </label>
    </div>

    <!-- 数据库统计详情 -->
    <div class="db-stats-section">
      <h3>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        数据库详细统计
      </h3>
      <div class="db-stats-grid">
        <div class="stat-item" v-for="(value, key) in dbStats" :key="key" v-if="key !== 'total'">
          <span class="stat-name">{{ getTableName(key) }}</span>
          <span class="stat-count">{{ value }}</span>
        </div>
      </div>
    </div>

    <!-- 备份列表 -->
    <div class="backups-section" v-if="backups.length > 0">
      <h3>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        备份文件列表
      </h3>
      <div class="backups-list">
        <div class="backup-item" v-for="backup in backups" :key="backup.key">
          <div class="backup-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="backup-info">
            <div class="backup-name">{{ backup.key }}</div>
            <div class="backup-meta">
              大小: {{ formatSize(backup.size) }} | 
              创建时间: {{ formatTime(backup.uploaded) }}
            </div>
          </div>
          <div class="backup-actions">
            <button class="btn-action btn-download" @click="downloadBackup(backup)" title="下载">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 恢复备份对话框 -->
    <div v-if="showRestoreDialog" class="modal-overlay" @click="showRestoreDialog = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>⚠️ 危险操作：恢复备份</h3>
          <button class="btn-close" @click="showRestoreDialog = false">×</button>
        </div>
        <div class="modal-body">
          <div class="warning-box">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p><strong>警告：此操作不可撤销！</strong></p>
            <p>恢复备份将会：</p>
            <ul>
              <li v-if="clearExisting">❌ 删除当前所有数据</li>
              <li v-else>📝 覆盖重复的数据</li>
              <li>📦 导入备份文件中的所有数据</li>
              <li>⏱️ 可能需要几分钟时间</li>
            </ul>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="clearExisting">
              <span>清除现有数据（危险）</span>
            </label>
          </div>

          <div class="form-group">
            <label>备份信息：</label>
            <div class="backup-preview" v-if="restoreData">
              <p>时间戳: {{ restoreData.timestamp }}</p>
              <p>版本: {{ restoreData.version }}</p>
              <p>总记录数: {{ getTotalRecords(restoreData) }}</p>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-cancel" @click="showRestoreDialog = false">取消</button>
            <button class="btn-danger" @click="confirmRestore" :disabled="restoring">
              {{ restoring ? '恢复中...' : '确认恢复' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import apiClient from '@/services/api'
import { useNotification } from '@/composables/useNotification'
import RefreshButton from '@/components/RefreshButton.vue'

const { showNotification } = useNotification()
const API_BASE = apiClient.defaults.baseURL

const loading = ref(false)
const dbStats = ref({})
const backups = ref([])
const showRestoreDialog = ref(false)
const restoreData = ref(null)
const clearExisting = ref(false)
const restoring = ref(false)

// 按钮状态
const createButtonState = ref('idle') // idle, loading, success
const uploadButtonState = ref('idle')

const lastBackupTime = computed(() => {
  if (backups.value.length === 0) return '从未备份'
  const latest = backups.value[0]
  return formatTime(latest.uploaded)
})

const getTableName = (key) => {
  const names = {
    'temp_emails': '临时邮箱',
    'messages': '收件箱',
    'sent_emails': '发送记录',
    'users': '注册用户',
    'login_events': '登录事件',
    'config': '系统配置'
  }
  return names[key] || key
}

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

const formatTime = (dateString) => {
  if (!dateString) return '未知'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const getTotalRecords = (backupData) => {
  if (!backupData || !backupData.tables) return 0
  return Object.values(backupData.tables).reduce((sum, table) => sum + (table.count || 0), 0)
}

const refreshStats = async () => {
  loading.value = true
  try {
    const response = await apiClient.get('/backup/stats')

    if (response.data.success) {
      dbStats.value = response.data.data.stats
    }
  } catch (error) {
    console.error('Refresh stats error:', error)
    showNotification('获取统计失败', 'error')
    throw error
  } finally {
    loading.value = false
  }
}

const loadBackups = async () => {
  try {
    const response = await apiClient.get('/backup/list')

    if (response.data.success) {
      backups.value = response.data.data.backups
    }
  } catch (error) {
    console.error('Load backups error:', error)
  }
}

const createBackup = async () => {
  if (!confirm('确认创建数据库备份？\n\n这会备份当前所有数据到服务器。')) {
    return
  }

  createButtonState.value = 'loading'
  loading.value = true
  try {
    const response = await apiClient.post('/backup/create', {})

    if (response.data.success) {
      createButtonState.value = 'success'
      showNotification('备份创建成功，正在下载...', 'success')
      
      // 自动下载备份文件（使用Blob下载，避免401）
      const downloadUrl = response.data.data.downloadUrl
      if (downloadUrl) {
        try {
          // 移除 /api 前缀（因为 apiClient 的 baseURL 已包含 /api）
          const relativePath = downloadUrl.replace(/^\/api/, '')
          
          console.log('🔍 [Debug] Original downloadUrl:', downloadUrl)
          console.log('🔍 [Debug] Relative path:', relativePath)
          console.log('🔍 [Debug] API Base:', apiClient.defaults.baseURL)
          
          // 使用apiClient下载文件（会自动携带Authorization头）
          const fileResponse = await apiClient.get(relativePath, {
            responseType: 'blob'
          })
          
          // 创建Blob URL并触发下载
          const blob = new Blob([fileResponse.data], { type: 'application/json' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `backup-${response.data.data.timestamp}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
          
          showNotification('备份文件下载成功', 'success')
        } catch (downloadError) {
          console.error('Download backup error:', downloadError)
          showNotification('备份创建成功，但下载失败', 'warning')
        }
      }
      
      await loadBackups()
      await refreshStats()
      
      // 2秒后恢复idle状态
      setTimeout(() => {
        createButtonState.value = 'idle'
      }, 2000)
    }
  } catch (error) {
    console.error('Create backup error:', error)
    showNotification('创建备份失败', 'error')
    createButtonState.value = 'idle'
  } finally {
    loading.value = false
  }
}

const downloadBackup = async (backup) => {
  try {
    showNotification('正在下载备份文件...', 'info')
    
    // 使用apiClient下载文件（会自动携带Authorization头）
    // apiClient 的 baseURL 已包含 /api，所以直接用相对路径
    const response = await apiClient.get(`/backup/download?timestamp=${backup.timestamp}`, {
      responseType: 'blob'
    })
    
    // 创建Blob URL并触发下载
    const blob = new Blob([response.data], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-${backup.timestamp}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    showNotification('备份文件下载成功', 'success')
  } catch (error) {
    console.error('Download backup error:', error)
    showNotification('下载失败', 'error')
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  uploadButtonState.value = 'success'
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      restoreData.value = data
      showRestoreDialog.value = true
      
      // 2秒后恢复idle状态
      setTimeout(() => {
        uploadButtonState.value = 'idle'
      }, 2000)
    } catch (error) {
      console.error('Parse backup file error:', error)
      showNotification('备份文件格式错误', 'error')
      uploadButtonState.value = 'idle'
    }
  }
  reader.readAsText(file)

  // 重置文件输入
  event.target.value = ''
}

const confirmRestore = async () => {
  if (!restoreData.value) return

  if (!confirm(`确认恢复备份？\n\n${clearExisting.value ? '⚠️ 这将删除所有现有数据！' : '这将覆盖重复的数据。'}\n\n此操作不可撤销！`)) {
    return
  }

  restoring.value = true
  try {
    const response = await apiClient.post('/backup/restore', {
      backupData: restoreData.value,
      clearExisting: clearExisting.value
    })

    if (response.data.success) {
      showNotification('备份恢复成功，请刷新页面', 'success')
      showRestoreDialog.value = false
      await refreshStats()
      
      // 3秒后自动刷新页面
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    }
  } catch (error) {
    console.error('Restore backup error:', error)
    showNotification('恢复备份失败', 'error')
  } finally {
    restoring.value = false
  }
}

onMounted(() => {
  refreshStats()
  loadBackups()
})
</script>

<style scoped>
.backup-management {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.page-header h2 svg {
  color: #6366f1;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.db-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.backup-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.time-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

/* 操作按钮区 */
.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-primary svg {
  transition: transform 0.3s;
}

.btn-primary:hover:not(:disabled) svg {
  transform: rotate(-10deg) scale(1.1);
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.btn-secondary:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #6366f1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.btn-secondary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-secondary svg {
  transition: transform 0.3s;
}

.btn-secondary:hover:not(:disabled) svg {
  transform: rotate(180deg);
}

.btn-upload {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-upload::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.btn-upload:hover::before {
  left: 100%;
}

.btn-upload:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-upload:active {
  transform: translateY(0) scale(0.98);
}

.btn-upload svg {
  transition: transform 0.3s;
}

.btn-upload:hover svg {
  transform: translateY(-3px);
}

.btn-primary:disabled, .btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary:disabled::before, .btn-upload::before {
  display: none;
}

/* 按钮状态过渡效果 */
.button-text {
  transition: all 0.3s ease;
  display: inline-block;
}

.state-success .button-text {
  color: #10b981;
}

.btn-primary.state-success .button-text,
.btn-upload.state-success .button-text {
  color: white;
}

.spinning {
  animation: spin 1s linear infinite;
}

.check-icon {
  animation: checkIn 0.5s ease;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes checkIn {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* 成功状态按钮样式 */
.btn-primary.state-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-secondary.state-success {
  border-color: #10b981;
  color: #10b981;
}

.btn-upload.state-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* 数据库统计详情 */
.db-stats-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  margin-bottom: 32px;
}

.db-stats-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.db-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-name {
  font-size: 14px;
  color: #6b7280;
}

.stat-count {
  font-size: 18px;
  font-weight: 700;
  color: #6366f1;
}

/* 备份列表 */
.backups-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.backups-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.backups-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backup-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  transition: all 0.2s;
}

.backup-item:hover {
  background: #f3f4f6;
}

.backup-icon {
  color: #6366f1;
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
  font-family: monospace;
}

.backup-meta {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.backup-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download {
  background: #dbeafe;
  color: #1e40af;
}

.btn-download:hover {
  background: #bfdbfe;
}

/* 恢复对话框 */
.modal-overlay {
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
  animation: fadeIn 0.2s;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #dc2626;
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
}

.warning-box {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: center;
}

.warning-box svg {
  color: #dc2626;
  margin-bottom: 12px;
}

.warning-box p {
  margin: 8px 0;
  color: #92400e;
}

.warning-box ul {
  text-align: left;
  margin: 12px 0;
  padding-left: 24px;
}

.warning-box li {
  margin: 4px 0;
  color: #92400e;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.backup-preview {
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #6b7280;
}

.backup-preview p {
  margin: 4px 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-cancel, .btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
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

