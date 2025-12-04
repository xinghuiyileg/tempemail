<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>
            <svg class="header-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            系统配置
          </h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <!-- 管理员认证区域 -->
          <div v-if="needAdminLogin" class="admin-login-section">
            <div class="info-box warning">
              <strong>
                <svg class="lock-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                需要管理员权限
              </strong>
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
                  :title="showAdminPassword ? '隐藏密码' : '显示密码'"
                >
                  <svg v-if="showAdminPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
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
            <span class="badge-content">
              <svg class="badge-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              管理员模式
            </span>
            <button class="btn-link" @click="handleAdminLogout">退出</button>
          </div>

          <!-- 配置表单 -->
          <div v-if="!needAdminLogin" class="config-section">
            <h4>基础配置</h4>
            <div class="form-group">
              <label>
                <span class="label-text">域名（支持多个）</span>
                <span class="label-desc">输入域名后按回车添加</span>
              </label>
              
              <!-- 已添加的域名标签 -->
              <div v-if="domainList.length > 0" class="domain-tags">
                <div v-for="(domain, index) in domainList" :key="index" class="domain-tag">
                  <span class="domain-text">{{ domain }}</span>
                  <button 
                    v-if="isAdminMode"
                    type="button" 
                    class="domain-remove" 
                    @click="removeDomain(index)"
                    :disabled="!isAdminMode"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- 添加域名输入框 -->
              <div class="domain-input-wrapper">
                <input 
                  v-model="newDomain" 
                  type="text" 
                  placeholder="输入域名后按回车添加，例如：example.com"
                  class="form-input"
                  :disabled="!isAdminMode"
                  @keyup.enter="addDomain"
                />
                <button 
                  v-if="newDomain && isAdminMode"
                  type="button"
                  class="add-domain-btn"
                  @click="addDomain"
                  :disabled="!isAdminMode"
                >
                  添加
                </button>
              </div>
              
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

          <div v-if="!needAdminLogin" class="config-section">
            <h4>📧 邮件服务配置</h4>
            <div class="email-service-info">
              <p>配置免费邮件发送服务，支持多服务智能路由</p>
            </div>

            <div class="form-group">
              <label>
                <span class="label-text">Resend API Key</span>
                <span class="label-desc">免费 3,000 封/月（可选）</span>
              </label>
              <input
                v-model="formData.resend_api_key"
                type="password"
                placeholder="re_xxxxxxxxxx"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>

            <div class="form-group">
              <label>
                <span class="label-text">Resend 已验证域名</span>
                <span class="label-desc">Resend 中已验证的域名（可选）</span>
              </label>
              <input
                v-model="formData.resend_verified_domain"
                type="text"
                placeholder="example.com"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>

            <div class="form-group">
              <label>
                <span class="label-text">Brevo API Key</span>
                <span class="label-desc">免费 300 封/天 (9,000 封/月)</span>
              </label>
              <input
                v-model="formData.brevo_api_key"
                type="password"
                placeholder="xkeysib-xxxxxxxxxx"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>

            <div class="form-group">
              <label>
                <span class="label-text">SMTP2GO API Key</span>
                <span class="label-desc">免费 1,000 封/月</span>
              </label>
              <input
                v-model="formData.smtp2go_api_key"
                type="password"
                placeholder="api-xxxxxxxxxx"
                class="form-input"
                :disabled="!isAdminMode"
              />
            </div>

            <div class="field-hint">
              💡 配置多个服务可实现智能路由和故障转移<br>
              📊 总免费额度：10,000+ 封/月<br>
              🔗 <a href="https://resend.com" target="_blank">Resend</a> |
              <a href="https://brevo.com" target="_blank">Brevo</a> |
              <a href="https://smtp2go.com" target="_blank">SMTP2GO</a>
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
              <li>✨ 配置保存后会自动生效，无需手动刷新页面</li>
              <li>🌐 域名修改后，邮箱生成器会自动更新可选域名列表</li>
              <li>🔐 API Token 等敏感信息已加密存储</li>
              <li>⚙️ 部分配置（如监控间隔）需要重启 Workers 才生效</li>
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
const newDomain = ref('')
const domainList = ref([])

const formData = ref({
  domain_name: '',
  target_qq_email: '',
  cloudflare_api_token: '',
  cloudflare_zone_id: '',
  cloudflare_account_id: '',
  monitor_interval: 10,
  auto_delete_days: 7,
  // 邮件服务商 API Keys
  resend_api_key: '',
  resend_verified_domain: '',
  brevo_api_key: '',
  smtp2go_api_key: ''
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
      auto_delete_days: parseInt(data.config?.auto_delete_days) || 7,
      // 邮件服务商 API Keys
      resend_api_key: data.config?.resend_api_key || '',
      resend_verified_domain: data.config?.resend_verified_domain || '',
      brevo_api_key: data.config?.brevo_api_key || '',
      smtp2go_api_key: data.config?.smtp2go_api_key || ''
    }
    
    // 解析域名列表
    domainList.value = formData.value.domain_name
      ? formData.value.domain_name.split(';').filter(d => d.trim())
      : []
    
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

const addDomain = () => {
  const domain = newDomain.value.trim()
  
  if (!domain) {
    return
  }
  
  // 验证域名格式
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!domainRegex.test(domain)) {
    showNotification('域名格式不正确', 'warning')
    return
  }
  
  // 检查是否已存在
  if (domainList.value.includes(domain)) {
    showNotification('该域名已存在', 'warning')
    return
  }
  
  domainList.value.push(domain)
  newDomain.value = ''
  showNotification('域名已添加', 'success')
}

const removeDomain = (index) => {
  const domain = domainList.value[index]
  
  if (!confirm(`确认删除域名 "${domain}" 吗？`)) {
    return
  }
  
  domainList.value.splice(index, 1)
  showNotification(`已删除域名: ${domain}`, 'info')
}

const handleSave = async () => {
  // 验证管理员权限
  if (!isAdminMode.value) {
    showNotification('需要管理员权限才能修改配置', 'error')
    return
  }

  // 验证必填项
  if (domainList.value.length === 0) {
    showNotification('请至少添加一个域名', 'warning')
    return
  }

  if (!formData.value.target_qq_email) {
    showNotification('请填写目标邮箱', 'warning')
    return
  }

  isSaving.value = true
  try {
    // 将域名列表转换为分号分隔的字符串
    const saveData = {
      ...formData.value,
      domain_name: domainList.value.join(';')
    }
    
    await configAPI.update(saveData)
    
    // 保存成功后立即刷新配置（无感刷新）
    await configStore.loadConfig()
    
    showNotification('✅ 配置保存成功并已生效！', 'success')
    emit('saved')
    
    // 延迟关闭，让用户看到成功提示
    setTimeout(() => {
      emit('close')
    }, 500)
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
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header h3 .header-icon {
  color: #6366f1;
  flex-shrink: 0;
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

/* 域名标签样式 */
.domain-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--muted);
  border-radius: 8px;
  min-height: 48px;
}

.domain-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: linear-gradient(135deg, #6c7bff 0%, #8b5cf6 100%);
  color: white;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  animation: tagSlideIn 0.3s ease;
}

.domain-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 123, 255, 0.4);
}

.domain-text {
  user-select: all;
}

.domain-remove {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
}

.domain-remove:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.domain-remove:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.domain-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.domain-input-wrapper .form-input {
  flex: 1;
}

.add-domain-btn {
  padding: 10px 18px;
  background: linear-gradient(135deg, #6c7bff 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.add-domain-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(108, 123, 255, 0.4);
}

.add-domain-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes tagSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
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

.admin-badge .badge-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-badge .badge-icon {
  fill: #000;
  animation: starPulse 2s ease-in-out infinite;
}

@keyframes starPulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
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
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
}

.toggle-password-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

.toggle-password-btn svg {
  transition: all 0.2s ease;
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
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 1.05em;
}

.info-box strong .lock-icon {
  flex-shrink: 0;
  color: #f59e0b;
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

/* 邮件服务配置样式 */
.email-service-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9em;
}

.email-service-info p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-hint a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
}

.field-hint a:hover {
  text-decoration: underline;
}
</style>

