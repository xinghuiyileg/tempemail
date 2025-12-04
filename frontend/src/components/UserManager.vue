<template>
  <div class="user-manager-overlay" @click="$emit('close')">
    <div class="user-manager-card" @click.stop>
      <!-- 头部 -->
      <div class="card-header">
        <h3>
          <svg class="header-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          用户管理
        </h3>
        <button class="btn-close" @click="$emit('close')" aria-label="关闭">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 当前用户信息 -->
      <div class="current-user-section">
        <div class="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>当前用户</span>
        </div>
        <div class="user-id-display">
          <span class="user-id-label">用户ID：</span>
          <code class="user-id-value">{{ getMaskedUserId() }}</code>
          <button class="btn-copy" @click="copyUserId" title="复制完整ID">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
        </div>
        <p class="user-tip">💡 每个用户ID对应独立的邮箱数据</p>
      </div>

      <!-- 操作按钮 -->
      <div class="actions-section">
        <button class="action-btn btn-new" @click="createNewUser">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          <span>创建新用户</span>
        </button>

        <button class="action-btn btn-switch" @click="showSwitchInput = !showSwitchInput">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="17 1 21 5 17 9"></polyline>
            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
            <polyline points="7 23 3 19 7 15"></polyline>
            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
          </svg>
          <span>切换到其他用户</span>
        </button>

        <button class="action-btn btn-export" @click="exportUser">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>导出用户数据</span>
        </button>

        <button class="action-btn btn-import" @click="showImportInput = !showImportInput">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>导入用户数据</span>
        </button>
      </div>

      <!-- 切换用户输入框 -->
      <div v-if="showSwitchInput" class="input-section">
        <label class="input-label">输入用户ID：</label>
        <input
          v-model="targetUserId"
          type="text"
          class="input-field"
          placeholder="例如：a1b2c3d4-e5f6-4xxx-yxxx-xxxxxxxxxxxx"
          @keyup.enter="switchUser"
        />
        <div class="input-actions">
          <button class="btn btn-secondary" @click="showSwitchInput = false">取消</button>
          <button class="btn btn-primary" @click="switchUser">确认切换</button>
        </div>
      </div>

      <!-- 导入用户输入框 -->
      <div v-if="showImportInput" class="input-section">
        <label class="input-label">粘贴导出的数据：</label>
        <textarea
          v-model="importData"
          class="textarea-field"
          rows="4"
          placeholder='{"userId":"xxx","exportTime":"xxx","version":"1.0"}'
          @keyup.ctrl.enter="importUser"
        ></textarea>
        <div class="input-actions">
          <button class="btn btn-secondary" @click="showImportInput = false">取消</button>
          <button class="btn btn-primary" @click="importUser">确认导入</button>
        </div>
      </div>

      <!-- 说明 -->
      <div class="info-section">
        <h4>📖 使用说明</h4>
        <ul>
          <li><strong>创建新用户</strong>：生成新的用户ID，开始全新的数据</li>
          <li><strong>切换用户</strong>：输入已有的用户ID，查看对应的邮箱数据</li>
          <li><strong>导出数据</strong>：保存用户ID，用于在其他设备上访问</li>
          <li><strong>导入数据</strong>：粘贴之前导出的数据，恢复访问</li>
        </ul>
        <p class="warning-text">⚠️ 切换用户后，当前页面数据将重新加载</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { getUserId, getMaskedUserId, setUserId, exportUserData, importUserData, clearUserId } from '@/utils/userManager'
import { useNotification } from '@/composables/useNotification'

const emit = defineEmits(['close', 'userChanged'])
const { showNotification } = useNotification()

const showSwitchInput = ref(false)
const showImportInput = ref(false)
const targetUserId = ref('')
const importData = ref('')

// 复制用户ID
const copyUserId = async () => {
  try {
    const userId = getUserId()
    await navigator.clipboard.writeText(userId)
    showNotification('用户ID已复制到剪贴板', 'success')
  } catch (error) {
    showNotification('复制失败：' + error.message, 'error')
  }
}

// 创建新用户
const createNewUser = () => {
  if (!confirm('确认创建新用户？\n\n当前用户数据不会丢失，但需要记住当前用户ID才能切换回来。\n\n建议先导出当前用户数据！')) {
    return
  }

  try {
    // 清除当前用户ID
    clearUserId()
    
    // 生成新的UUID作为新用户ID
    const newUserId = crypto.randomUUID()
    
    // 设置新的用户ID
    setUserId(newUserId)
    
    showNotification(`新用户创建成功！用户ID: ${newUserId.substring(0, 8)}...`, 'success')
    
    // 触发用户切换事件
    emit('userChanged')
    
    // 延迟刷新，让用户看到提示
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (error) {
    showNotification('创建失败：' + error.message, 'error')
  }
}

// 切换用户
const switchUser = () => {
  const userId = targetUserId.value.trim()
  
  if (!userId) {
    showNotification('请输入用户ID', 'warning')
    return
  }

  // 简单验证UUID格式
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(userId)) {
    showNotification('用户ID格式不正确', 'error')
    return
  }

  try {
    setUserId(userId)
    showNotification('用户切换成功！页面即将刷新...', 'success')
    
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (error) {
    showNotification('切换失败：' + error.message, 'error')
  }
}

// 导出用户数据
const exportUser = async () => {
  try {
    const data = exportUserData()
    const jsonStr = JSON.stringify(data, null, 2)
    
    // 复制到剪贴板
    await navigator.clipboard.writeText(jsonStr)
    
    // 同时下载为文件
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tempemail-user-${data.userId.substring(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    showNotification('用户数据已导出并复制到剪贴板', 'success')
  } catch (error) {
    showNotification('导出失败：' + error.message, 'error')
  }
}

// 导入用户数据
const importUser = () => {
  const dataStr = importData.value.trim()
  
  if (!dataStr) {
    showNotification('请粘贴导出的数据', 'warning')
    return
  }

  try {
    const data = JSON.parse(dataStr)
    importUserData(data)
    
    showNotification('用户数据导入成功！页面即将刷新...', 'success')
    
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (error) {
    if (error instanceof SyntaxError) {
      showNotification('数据格式错误，请确认是否为有效的JSON', 'error')
    } else {
      showNotification('导入失败：' + error.message, 'error')
    }
  }
}
</script>

<style scoped>
.user-manager-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.3s ease;
}

.user-manager-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.2),
    0 10px 30px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  overflow-x: hidden;
  animation: slideUp 0.3s ease;
  /* 滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.5) transparent;
}

/* Webkit 浏览器滚动条样式 */
.user-manager-card::-webkit-scrollbar {
  width: 6px;
}

.user-manager-card::-webkit-scrollbar-track {
  background: transparent;
  margin: 20px 0; /* 上下留白，避免滚动条超出圆角 */
}

.user-manager-card::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.3);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.user-manager-card::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(230, 232, 240, 0.6);
  border-radius: 20px 20px 0 0;
}

.card-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header h3 .header-icon {
  color: #6366f1;
  flex-shrink: 0;
}

.btn-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: #64748b;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(100, 116, 139, 0.1);
  color: #475569;
}

/* 当前用户信息 */
.current-user-section {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-bottom: 1px solid rgba(230, 232, 240, 0.6);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 12px;
}

.user-id-display {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(230, 232, 240, 0.8);
  margin-bottom: 12px;
}

.user-id-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.user-id-value {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
  padding: 6px 10px;
  border-radius: 6px;
  word-break: break-all;
}

.btn-copy {
  background: rgba(99, 102, 241, 0.1);
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #6366f1;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn-copy:hover {
  background: rgba(99, 102, 241, 0.2);
  transform: scale(1.05);
}

.user-tip {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
}

/* 操作按钮 */
.actions-section {
  padding: 24px 28px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid rgba(230, 232, 240, 0.8);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-btn.btn-new {
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.action-btn.btn-new:hover {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.3);
}

.action-btn.btn-switch {
  color: #6366f1;
  border-color: rgba(99, 102, 241, 0.2);
}

.action-btn.btn-switch:hover {
  background: rgba(99, 102, 241, 0.05);
  border-color: rgba(99, 102, 241, 0.3);
}

.action-btn.btn-export {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}

.action-btn.btn-export:hover {
  background: rgba(245, 158, 11, 0.05);
  border-color: rgba(245, 158, 11, 0.3);
}

.action-btn.btn-import {
  color: #8b5cf6;
  border-color: rgba(139, 92, 246, 0.2);
}

.action-btn.btn-import:hover {
  background: rgba(139, 92, 246, 0.05);
  border-color: rgba(139, 92, 246, 0.3);
}

/* 输入框区域 */
.input-section {
  padding: 20px 28px;
  background: rgba(248, 250, 252, 0.6);
  border-top: 1px solid rgba(230, 232, 240, 0.6);
  border-bottom: 1px solid rgba(230, 232, 240, 0.6);
  animation: slideDown 0.3s ease;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 10px;
}

.input-field,
.textarea-field {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  transition: all 0.2s;
  box-sizing: border-box;
}

.input-field:focus,
.textarea-field:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.textarea-field {
  resize: vertical;
  min-height: 100px;
}

.input-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.btn-secondary:hover {
  background: rgba(100, 116, 139, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* 说明区域 */
.info-section {
  padding: 24px 28px;
  background: rgba(248, 250, 252, 0.4);
  border-radius: 0 0 20px 20px;
}

.info-section h4 {
  margin: 0 0 14px 0;
  font-size: 15px;
  font-weight: 600;
  color: #334155;
}

.info-section ul {
  margin: 0 0 14px 0;
  padding-left: 20px;
  list-style: none;
}

.info-section li {
  font-size: 13px;
  color: #64748b;
  line-height: 1.8;
  position: relative;
  padding-left: 8px;
}

.info-section li::before {
  content: '•';
  position: absolute;
  left: -8px;
  color: #6366f1;
}

.info-section strong {
  color: #475569;
  font-weight: 600;
}

.warning-text {
  margin: 0;
  padding: 10px 14px;
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
  font-size: 13px;
  color: #92400e;
  line-height: 1.6;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .actions-section {
    grid-template-columns: 1fr;
  }
  
  .card-header,
  .current-user-section,
  .actions-section,
  .input-section,
  .info-section {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>

