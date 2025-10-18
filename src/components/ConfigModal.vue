<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>⚙️ 系统配置</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <!-- 管理员认证区域 -->
          <div v-if="needAdminLogin" class="admin-login-section">
            <div class="info-box warning">
              <strong>🔒 需要管理员权限</strong>
              <p>修改系统配置需要管理员密码</p>
            </div>
            
            <div class="form-group">
              <label>
                <span class="label-text">管理员密码</span>
              </label>
              <div class="password-input-group">
                <input 
                  v-model="adminPasswordInput"
                  :type="showAdminPassword ? 'text' : 'password'"
                  placeholder="请输入管理员密码"
                  class="form-input"
                  @keyup.enter="handleAdminLogin"
                />
                <button 
                  class="toggle-password-btn"
                  @click="showAdminPassword = !showAdminPassword"
                  type="button"
                >
                  {{ showAdminPassword ? '👁️' : '👁️‍🗨️' }}
                </button>
              </div>
              <button 
                class="btn btn-primary"
                style="margin-top: 10px; width: 100%;"
                @click="handleAdminLogin"
                :disabled="!adminPasswordInput"
              >
                验证管理员身份
              </button>
            </div>
          </div>

          <!-- 管理员徽章 -->
          <div v-else-if="adminStore.isAdmin" class="admin-badge">
            <span>👑 管理员模式</span>
            <button class="btn-link" @click="handleAdminLogout">退出</button>
          </div>

          <!-- 配置表单 -->
          <div v-if="!needAdminLogin" class="config-section">
            <h4>基础配置</h4>
            <div class="form-group">
              <label>
                <span class="label-text">域名（支持多个）</span>
                <span class="label-desc">用于生成临时邮箱地址，多个域名用分号（;）隔开</span>
              </label>
              <input 
                v-model="formData.domain_name" 
                type="text" 
                placeholder="例如：example.com;mail.example.com"
                class="form-input"
                :disabled="!isAdminMode"
              />
              <div class="field-hint">💡 配置多个域名后，生成邮箱时可选择使用哪个域名</div>
            </div>

            <div class="form-group">
              <label>
                <span class="label-text">目标邮箱</span>
                <span class="label-desc">邮件将转发到此邮箱</span>
              </label>
              <input 
                v-model="formData.target_qq_email" 
                type="email" 
                placeholder="your@qq.com"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>
          </div>

          <div class="config-section">
            <h4>Cloudflare 配置</h4>
            <div class="form-group">
              <label>
                <span class="label-text">API Token</span>
                <span class="label-desc">用于创建 Email Routing 规则</span>
              </label>
              <input 
                v-model="formData.cloudflare_api_token" 
                type="password" 
                placeholder="请输入 Cloudflare API Token"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>

            <div class="form-group">
              <label>
                <span class="label-text">Zone ID</span>
                <span class="label-desc">Cloudflare 域名的 Zone ID</span>
              </label>
              <input 
                v-model="formData.cloudflare_zone_id" 
                type="text" 
                placeholder="32 位字符的 Zone ID"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>

            <div class="form-group">
              <label>
                <span class="label-text">Account ID</span>
                <span class="label-desc">Cloudflare 账户 ID</span>
              </label>
              <input 
                v-model="formData.cloudflare_account_id" 
                type="text" 
                placeholder="32 位字符的 Account ID"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>
          </div>

          <div class="config-section">
            <h4>高级设置</h4>
            <div class="form-group">
              <label>
                <span class="label-text">监控间隔（秒）</span>
                <span class="label-desc">检查新邮件的时间间隔</span>
              </label>
              <input 
                v-model.number="formData.monitor_interval" 
                type="number" 
                min="5"
                max="60"
                placeholder="10"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>

            <div class="form-group">
              <label>
                <span class="label-text">自动删除（天）</span>
                <span class="label-desc">自动删除多少天前的邮箱</span>
              </label>
              <input 
                v-model.number="formData.auto_delete_days" 
                type="number" 
                min="1"
                max="30"
                placeholder="7"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>
          </div>

          <div v-if="!needAdminLogin" class="config-tips">
            <p>💡 提示：</p>
            <ul>
              <li v-if="!isAdminMode">⚠️ 仅管理员可修改配置（当前为查看模式）</li>
              <li>配置修改后需要重启 Workers 才能生效</li>
              <li>API Token 等敏感信息已加密存储</li>
              <li>本地开发模式下，部分配置可能不生效</li>
            </ul>
          </div>
        </div>

        <div v-if="!needAdminLogin" class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose">{{ isAdminMode ? '取消' : '关闭' }}</button>
          <button 
            v-if="isAdminMode" 
            class="btn btn-primary" 
            @click="handleSave" 
            :disabled="isSaving"
          >
            <span v-if="isSaving" class="spinning">⏳</span>
            {{ isSaving ? '保存中...' : '保存配置' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { configAPI } from '@/services/api'
import { useNotification } from '@/composables/useNotification'
import { useAdminStore } from '@/stores/adminStore'
import { useConfigStore } from '@/stores/configStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'saved'])

const { showNotification } = useNotification()
const adminStore = useAdminStore()
const configStore = useConfigStore()

const isSaving = ref(false)
const adminPasswordInput = ref('')
const showAdminPassword = ref(false)

const formData = ref({
  domain_name: '',
  target_qq_email: '',
  cloudflare_api_token: '',
  cloudflare_zone_id: '',
  cloudflare_account_id: '',
  monitor_interval: 10,
  auto_delete_days: 7
})

// 计算属性
const isAdminMode = computed(() => adminStore.isAdmin || !configStore.adminEnabled)
const needAdminLogin = computed(() => configStore.adminEnabled && !adminStore.isAdmin)

// 监听弹窗打开，加载配置
watch(() => props.visible, async (newVal) => {
  if (newVal) {
    adminStore.initAdmin()
    await loadConfig()
  }
})

const loadConfig = async () => {
  try {
    const response = await configAPI.get()
    const data = response.data.data
    
    // 填充表单
    formData.value = {
      domain_name: data.config?.domain_name || '',
      target_qq_email: data.config?.target_qq_email || '',
      cloudflare_api_token: data.config?.cloudflare_api_token || '',
      cloudflare_zone_id: data.config?.cloudflare_zone_id || '',
      cloudflare_account_id: data.config?.cloudflare_account_id || '',
      monitor_interval: parseInt(data.config?.monitor_interval) || 10,
      auto_delete_days: parseInt(data.config?.auto_delete_days) || 7
    }
    
    // 更新 configStore 中的管理员状态
    configStore.isAdmin = data.isAdmin || false
    configStore.adminEnabled = data.adminEnabled || false
  } catch (error) {
    console.error('加载配置失败:', error)
    showNotification('加载配置失败', 'error')
  }
}

const handleAdminLogin = async () => {
  if (!adminPasswordInput.value) {
    showNotification('请输入管理员密码', 'warning')
    return
  }

  try {
    await adminStore.loginAdmin(adminPasswordInput.value)
    showNotification('管理员身份验证成功', 'success')
    await loadConfig()
  } catch (error) {
    showNotification('验证失败：' + error.message, 'error')
  }
}

const handleAdminLogout = () => {
  adminStore.logoutAdmin()
  showNotification('已退出管理员模式', 'info')
  emit('close')
}

const handleSave = async () => {
  // 验证管理员权限
  if (!isAdminMode.value) {
    showNotification('需要管理员权限才能修改配置', 'error')
    return
  }

  // 验证必填项
  if (!formData.value.domain_name) {
    showNotification('请填写域名', 'warning')
    return
  }

  if (!formData.value.target_qq_email) {
    showNotification('请填写目标邮箱', 'warning')
    return
  }

  isSaving.value = true
  try {
    await configAPI.update(formData.value)
    showNotification('配置保存成功！请重启 Workers 使配置生效', 'success')
    emit('saved')
    emit('close')
  } catch (error) {
    console.error('保存配置失败:', error)
    
    if (error.response?.status === 403 || error.response?.status === 401) {
      showNotification('管理员密码错误或已过期', 'error')
      adminStore.logoutAdmin()
      await loadConfig()
    } else {
      showNotification('保存配置失败：' + error.message, 'error')
    }
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: var(--card);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-main);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: var(--muted);
  color: var(--text-main);
  border-radius: 8px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--border);
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.config-section {
  margin-bottom: 28px;
}

.config-section:last-of-type {
  margin-bottom: 0;
}

.config-section h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border);
}

.form-group {
  margin-bottom: 18px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
}

.label-text {
  display: block;
  font-weight: 600;
  color: var(--text-main);
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.label-desc {
  display: block;
  font-size: 0.85rem;
  color: var(--text-sub);
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text-main);
  background: var(--card);
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(108, 123, 255, 0.1);
}

.form-input::placeholder {
  color: var(--text-sub);
  opacity: 0.6;
}

.field-hint {
  margin-top: 6px;
  font-size: 0.85rem;
  color: var(--text-sub);
  line-height: 1.4;
}

.config-tips {
  background: var(--muted);
  border-radius: 8px;
  padding: 14px 16px;
  margin-top: 20px;
}

.config-tips p {
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
}

.config-tips ul {
  margin: 0;
  padding-left: 20px;
}

.config-tips li {
  font-size: 0.9rem;
  color: var(--text-sub);
  line-height: 1.6;
  margin-bottom: 4px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

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
    transform: translateY(30px);
    opacity: 0.6;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.admin-login-section {
  padding: 20px;
  background: var(--muted);
  border-radius: 12px;
  margin-bottom: 20px;
}

.admin-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #000;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.admin-badge span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-link {
  background: transparent;
  border: none;
  color: #000;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 600;
}

.btn-link:hover {
  opacity: 0.8;
}

.password-input-group {
  display: flex;
  gap: 8px;
}

.password-input-group input {
  flex: 1;
}

.toggle-password-btn {
  padding: 10px 14px;
  background: var(--muted);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2em;
  transition: all 0.2s ease;
}

.toggle-password-btn:hover {
  background: var(--border);
}

.info-box {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.info-box.warning {
  background: #fff3cd;
  border: 2px solid #ffc107;
  color: #856404;
}

.info-box strong {
  display: block;
  margin-bottom: 6px;
  font-size: 1.05em;
}

.info-box p {
  margin: 0;
  line-height: 1.5;
}

.form-input:disabled {
  background: var(--muted);
  cursor: not-allowed;
  opacity: 0.6;
}

@media (max-width: 640px) {
  .modal-content {
    max-height: 90vh;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .modal-footer .btn {
    width: 100%;
  }
  
  .admin-badge {
    flex-direction: column;
    gap: 10px;
  }
}
</style>

