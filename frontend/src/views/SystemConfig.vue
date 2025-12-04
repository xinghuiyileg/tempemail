<template>
  <div class="config-page">
    <!-- 页面头部 -->
    <div class="config-header">
      <div>
        <h2>系统配置</h2>
        <p class="subtitle">管理和配置系统参数</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="validateConfig" :disabled="loading.validate">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          验证配置
        </button>
        <button class="btn-secondary" @click="exportConfig" :disabled="loading.export">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出配置
        </button>
        <button class="btn-secondary" @click="triggerImport">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          导入配置
        </button>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleImportFile"
        />
      </div>
    </div>

    <!-- 系统信息卡片 -->
    <div class="system-info-card" v-if="systemInfo">
      <h3>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        系统信息
      </h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">版本</span>
          <span class="value">{{ systemInfo.system.version }}</span>
        </div>
        <div class="info-item">
          <span class="label">部署平台</span>
          <span class="value">{{ systemInfo.system.deployment }}</span>
        </div>
        <div class="info-item">
          <span class="label">数据库</span>
          <span class="value" :class="{ 'status-ok': systemInfo.system.database.includes('Connected') }">
            {{ systemInfo.system.database }}
          </span>
        </div>
        <div class="info-item">
          <span class="label">管理员模式</span>
          <span class="value" :class="{ 'status-ok': systemInfo.system.features.admin }">
            {{ systemInfo.system.features.admin ? '已启用' : '未启用' }}
          </span>
        </div>
        <div class="info-item" v-if="systemInfo.stats">
          <span class="label">邮箱总数</span>
          <span class="value">{{ systemInfo.stats.emails || 0 }}</span>
        </div>
        <div class="info-item" v-if="systemInfo.stats">
          <span class="label">邮件总数</span>
          <span class="value">{{ systemInfo.stats.messages || 0 }}</span>
        </div>
      </div>
    </div>

    <!-- 验证结果卡片 -->
    <div class="validation-card" v-if="validationResult">
      <h3>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
        配置验证结果
        <span class="validation-summary">
          <span class="badge error" v-if="validationResult.validation.errors.length">
            {{ validationResult.validation.errors.length }} 错误
          </span>
          <span class="badge warning" v-if="validationResult.validation.warnings.length">
            {{ validationResult.validation.warnings.length }} 警告
          </span>
          <span class="badge success" v-if="validationResult.validation.valid">
            验证通过
          </span>
        </span>
      </h3>
      
      <div class="validation-messages">
        <div v-for="error in validationResult.validation.errors" :key="error.field" class="validation-item error">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <div>
            <strong>{{ error.field }}</strong>
            <p>{{ error.message }}</p>
          </div>
        </div>
        
        <div v-for="warning in validationResult.validation.warnings" :key="warning.field" class="validation-item warning">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <strong>{{ warning.field }}</strong>
            <p>{{ warning.message }}</p>
          </div>
        </div>
        
        <div v-for="info in validationResult.validation.info" :key="info.field" class="validation-item info">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <div>
            <strong>{{ info.field }}</strong>
            <p>{{ info.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置表单 -->
    <div class="config-sections">
      <!-- 基础配置 -->
      <div class="config-section">
        <div class="section-header">
          <h3>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M2 12h20"/>
            </svg>
            基础配置
          </h3>
          <div class="section-actions">
            <button class="btn-section-action" @click="resetSection('basic')" title="重置此节">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              重置
            </button>
            <button class="btn-section-action btn-primary" @click="saveConfig()" :disabled="loading.save">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              保存
            </button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>
              系统默认域名
              <span v-if="getConfigSource('domain_name')" :class="['config-source-badge', getConfigSource('domain_name').class]">
                {{ getConfigSource('domain_name').icon }} {{ getConfigSource('domain_name').text }}
              </span>
            </label>
            
            <!-- 已选择的域名标签 -->
            <div v-if="selectedDomains.length > 0" class="domain-tags">
              <div
                v-for="domain in selectedDomains"
                :key="domain"
                class="domain-tag"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>{{ domain }}</span>
                <button
                  type="button"
                  class="domain-tag-remove"
                  @click="deleteDomain(domain)"
                  title="删除域名"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- 输入框 -->
            <div class="domain-input-container">
              <input
                ref="domainInput"
                v-model="domainSearchText"
                type="text"
                placeholder="输入系统共享域名并按回车添加（所有用户可用）"
                @input="handleDomainInput"
                @focus="showDomainDropdown = true"
                @blur="handleDomainBlur"
                @keydown.enter.prevent="handleDomainEnter"
                @keydown.down.prevent="navigateDropdown(1)"
                @keydown.up.prevent="navigateDropdown(-1)"
                @keydown.backspace="handleBackspace"
                class="domain-input"
              />
              <div v-if="showDomainDropdown && filteredDomains.length > 0" class="domain-dropdown">
                <div
                  v-for="(domain, index) in filteredDomains"
                  :key="domain"
                  :class="['domain-option', { 
                    'selected': index === selectedDomainIndex,
                    'is-selected': selectedDomains.includes(domain)
                  }]"
                  @mouseenter="selectedDomainIndex = index"
                >
                  <button
                    type="button"
                    class="domain-delete-btn"
                    @mousedown.stop.prevent="deleteDomain(domain)"
                    title="删除域名"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                  </button>
                  <div class="domain-info" @mousedown.prevent="selectDomain(domain)">
                    <svg class="domain-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span class="domain-name">{{ domain }}</span>
                    <svg
                      v-if="selectedDomains.includes(domain)"
                      class="check-icon"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <small>
              ⚠️ <strong>系统默认域名</strong>：此处配置的域名为管理员设置的默认选项，所有用户都可以使用。
              <br>💡 用户也可以在 <a href="#" @click.prevent="emit('change-view', 'domains')" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">我的域名</a> 页面添加并验证自己的域名，验证通过后同样会被添加到共享域名池供所有用户使用。
            </small>
          </div>
          
          <div class="form-group">
            <label>
              目标邮箱
              <span v-if="getConfigSource('target_qq_email')" :class="['config-source-badge', getConfigSource('target_qq_email').class]">
                {{ getConfigSource('target_qq_email').icon }} {{ getConfigSource('target_qq_email').text }}
              </span>
            </label>
            <input
              v-model="config.target_qq_email"
              type="email"
              placeholder="your@email.com"
              @input="configChanged = true"
            />
            <small>转发邮件的目标邮箱</small>
          </div>
          
          <div class="form-group">
            <label>监控间隔（分钟）</label>
            <input
              v-model="config.monitor_interval"
              type="number"
              min="1"
              max="60"
              placeholder="10"
              @input="configChanged = true"
            />
            <small>邮件监控的时间间隔</small>
          </div>
          
          <div class="form-group">
            <label>自动删除天数</label>
            <input
              v-model="config.auto_delete_days"
              type="number"
              min="1"
              max="30"
              placeholder="7"
              @input="configChanged = true"
            />
            <small>自动删除过期邮件的天数</small>
          </div>
        </div>
      </div>

      <!-- Cloudflare API 配置 -->
      <div class="config-section">
        <div class="section-header">
          <h3>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Cloudflare API
          </h3>
          <button
            class="btn-test"
            @click="testConnection('cloudflare')"
            :disabled="loading.test"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            测试连接
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group full-width">
            <label>API Token</label>
            <input
              v-model="config.cloudflare_api_token"
              type="password"
              placeholder="Your Cloudflare API Token"
              @input="configChanged = true"
            />
            <small>Cloudflare API Token，需要 Email Routing 权限</small>
          </div>
          
          <div class="form-group">
            <label>Account ID</label>
            <input
              v-model="config.cloudflare_account_id"
              type="text"
              placeholder="Account ID"
              @input="configChanged = true"
            />
          </div>
          
          <div class="form-group">
            <label>Zone ID</label>
            <input
              v-model="config.cloudflare_zone_id"
              type="text"
              placeholder="Zone ID"
              @input="configChanged = true"
            />
          </div>
        </div>
      </div>

      <!-- TempMailApi 配置 -->
      <div class="config-section">
        <div class="section-header">
          <h3>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            TempMailApi (可选)
          </h3>
          <button
            class="btn-test"
            @click="testConnection('tempmailapi')"
            :disabled="loading.test || !config.tempmailapi_key"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            测试连接
          </button>
        </div>
        <div class="form-grid">
          <div class="form-group full-width">
            <label>
              TempMailApi Key
              <span v-if="getConfigSource('tempmailapi_key')" :class="['config-source-badge', getConfigSource('tempmailapi_key').class]">
                {{ getConfigSource('tempmailapi_key').icon }} {{ getConfigSource('tempmailapi_key').text }}
              </span>
            </label>
            <input
              v-model="config.tempmailapi_key"
              type="text"
              placeholder="输入 TempMailApi Key"
              @input="configChanged = true"
            />
            <small>TempMailApi 密钥，用于生成临时邮箱</small>
          </div>
        </div>
      </div>

      <!-- 邮件服务商配置 -->
      <div class="config-section">
        <div class="section-header">
          <h3>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            邮件服务商 (可选)
          </h3>
        </div>
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Resend API Key</label>
            <input
              v-model="config.resend_api_key"
              type="password"
              placeholder="re_xxxxx"
              @input="configChanged = true"
            />
            <small>Resend 邮件服务 API Key（免费 3,000 封/月，可选）</small>
          </div>
          
          <div class="form-group full-width">
            <label>Resend 验证域名</label>
            <input
              v-model="config.resend_verified_domain"
              type="text"
              placeholder="your-domain.com"
              @input="configChanged = true"
            />
            <small>Resend 中已验证的域名（可选）</small>
          </div>
          
          <div class="form-group full-width">
            <label>Brevo API Key</label>
            <input
              v-model="config.brevo_api_key"
              type="password"
              placeholder="xkeysib-xxxxx"
              @input="configChanged = true"
            />
            <small>Brevo (原 Sendinblue) API Key（免费 300 封/天，9,000 封/月）</small>
          </div>
          
          <div class="form-group full-width">
            <label>SMTP2GO API Key</label>
            <input
              v-model="config.smtp2go_api_key"
              type="password"
              placeholder="api-xxxxx"
              @input="configChanged = true"
            />
            <small>SMTP2GO 邮件服务 API Key（免费 1,000 封/月）</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="config-footer">
      <button
        class="btn-primary"
        @click="saveConfig"
        :disabled="loading.save || !configChanged"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        {{ loading.save ? '保存中...' : '保存配置' }}
      </button>
      <button
        class="btn-secondary"
        @click="loadConfig"
        :disabled="loading.load"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="1 4 1 10 7 10"/>
          <polyline points="23 20 23 14 17 14"/>
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
        </svg>
        重置
      </button>
    </div>

    <!-- 测试结果弹窗 -->
    <div class="modal" v-if="testResult" @click="testResult = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>连接测试结果</h3>
          <button class="close-btn" @click="testResult = null">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="test-result" :class="{ success: testResult.result.success, error: !testResult.result.success }">
            <div class="result-icon">
              <svg v-if="testResult.result.success" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h4>{{ testResult.result.success ? '连接成功' : '连接失败' }}</h4>
            <p>{{ testResult.result.message }}</p>
            <div v-if="testResult.result.data" class="result-data">
              <pre>{{ JSON.stringify(testResult.result.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apiClient from '../services/api'
import { useAuthStore } from '../stores/authStore'

const authStore = useAuthStore()

// 定义 emit
const emit = defineEmits(['change-view'])

const config = ref({
  domain_name: '',
  target_qq_email: '',
  monitor_interval: '10',
  auto_delete_days: '7',
  cloudflare_api_token: '',
  cloudflare_account_id: '',
  cloudflare_zone_id: '',
  tempmailapi_key: '',
  resend_api_key: '',
  resend_verified_domain: '',
  brevo_api_key: '',
  smtp2go_api_key: ''
})

const envConfig = ref({
  domain_name: '',
  has_admin_password: false,
  has_tempmailapi_key: false
})

const systemInfo = ref(null)
const validationResult = ref(null)
const testResult = ref(null)
const configChanged = ref(false)
const configSources = ref({}) // 配置来源信息
const availableDomains = ref([]) // 可用域名列表（所有域名池）
const selectedDomains = ref([]) // 已选择的域名
const domainSearchText = ref('') // 域名搜索文本
const showDomainDropdown = ref(false) // 显示域名下拉框
const selectedDomainIndex = ref(0) // 选中的域名索引
const filteredDomains = ref([]) // 过滤后的域名列表
const domainInput = ref(null) // 域名输入框引用

const loading = ref({
  load: false,
  save: false,
  validate: false,
  test: false,
  export: false
})

const fileInput = ref(null)

// 加载配置
async function loadConfig() {
  loading.value.load = true
  try {
    const response = await apiClient.get('/config')
    
    if (response.data.success) {
      const data = response.data.data
      
      // 加载配置值
      Object.keys(config.value).forEach(key => {
        if (data.config[key] !== undefined) {
          config.value[key] = data.config[key]
        }
      })
      
      // 保存配置来源信息（仅管理员有此信息）
      if (data.sources) {
        configSources.value = data.sources
      }
      
      // 初始化已选择的域名
      selectedDomains.value = config.value.domain_name ? 
        config.value.domain_name.split(';').map(d => d.trim()).filter(d => d) : []
      
      configChanged.value = false
      // 静默加载，不显示提示
      
      // 加载可用域名列表
      await loadAvailableDomains()
    }
  } catch (error) {
    console.error('Load config error:', error)
    // 如果是 401 错误（未授权），不显示错误提示（可能是已退出登录）
    if (error.response && error.response.status === 401) {
      console.log('用户未登录或登录已过期')
      return
    }
    showNotification('配置加载失败: ' + error.message, 'error')
  } finally {
    loading.value.load = false
  }
}

// 加载可用域名列表
async function loadAvailableDomains() {
  try {
    // 获取系统配置的域名
    const currentDomains = config.value.domain_name ? 
      config.value.domain_name.split(';').map(d => d.trim()).filter(d => d) : []
    
    // 获取用户验证的域名
    const domainsResponse = await apiClient.get('/domains/verified')
    const verifiedDomains = domainsResponse.data.success ? 
      domainsResponse.data.data.map(d => d.domain) : []
    
    // 合并并去重
    const allDomains = [...new Set([...currentDomains, ...verifiedDomains])]
    availableDomains.value = allDomains
    filteredDomains.value = allDomains
    
    console.log('加载域名列表:', allDomains)
  } catch (error) {
    console.error('Load domains error:', error)
    // 如果是 401 错误，静默处理
    if (error.response && error.response.status === 401) {
      return
    }
    // 失败时至少显示当前配置的域名
    const fallbackDomains = config.value.domain_name ? 
      config.value.domain_name.split(';').map(d => d.trim()).filter(d => d) : []
    availableDomains.value = fallbackDomains
    filteredDomains.value = fallbackDomains
  }
}

// 更新配置中的域名
function updateDomainConfig() {
  config.value.domain_name = selectedDomains.value.join(';')
  configChanged.value = true
}

// 处理域名输入变化
function handleDomainInput() {
  updateFilteredDomains()
}

// 更新过滤后的域名列表
function updateFilteredDomains() {
  const searchValue = domainSearchText.value.toLowerCase().trim()
  if (!searchValue) {
    filteredDomains.value = availableDomains.value
  } else {
    // 过滤匹配的域名
    filteredDomains.value = availableDomains.value.filter(domain => 
      domain.toLowerCase().includes(searchValue)
    )
  }
  selectedDomainIndex.value = 0
}

// 处理域名输入框失去焦点
function handleDomainBlur() {
  // 延迟隐藏，以便点击事件可以触发
  setTimeout(() => {
    showDomainDropdown.value = false
  }, 250)
}

// 处理回车键
function handleDomainEnter() {
  const inputValue = domainSearchText.value.trim()
  
  // 如果下拉框打开且有选中项，选择该项
  if (showDomainDropdown.value && filteredDomains.value.length > 0) {
    const selectedDomain = filteredDomains.value[selectedDomainIndex.value]
    if (selectedDomain) {
      selectDomain(selectedDomain)
      return
    }
  }
  
  // 否则，添加当前输入的域名
  if (inputValue) {
    addDomain(inputValue)
  }
}

// 处理退格键（当输入框为空时，删除最后一个域名）
function handleBackspace() {
  if (!domainSearchText.value && selectedDomains.value.length > 0) {
    const lastDomain = selectedDomains.value[selectedDomains.value.length - 1]
    deleteDomain(lastDomain)
  }
}

// 键盘导航下拉框
function navigateDropdown(direction) {
  if (!showDomainDropdown.value || filteredDomains.value.length === 0) {
    showDomainDropdown.value = true
    return
  }
  
  const newIndex = selectedDomainIndex.value + direction
  if (newIndex >= 0 && newIndex < filteredDomains.value.length) {
    selectedDomainIndex.value = newIndex
  }
}

// 选择域名（添加到已选列表）
function selectDomain(domain) {
  // 如果已经选择，则不重复添加
  if (!selectedDomains.value.includes(domain)) {
    selectedDomains.value.push(domain)
    updateDomainConfig()
    showNotification(`已添加系统共享域名 "${domain}"`, 'success')
  }
  
  // 清空搜索框
  domainSearchText.value = ''
  showDomainDropdown.value = false
  updateFilteredDomains()
  
  // 重新聚焦输入框
  domainInput.value?.focus()
}

// 验证域名格式
function isValidDomain(domain) {
  // 域名格式验证正则表达式
  // 支持：example.com, sub.example.com, example.co.uk 等
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  return domainRegex.test(domain)
}

// 添加新域名
function addDomain(newDomain) {
  if (!newDomain) return
  
  // 验证域名格式
  if (!isValidDomain(newDomain)) {
    showNotification(`域名格式不正确: "${newDomain}"。请输入有效的域名，如：example.com`, 'error')
    return
  }
  
  // 检查是否已选择
  if (selectedDomains.value.includes(newDomain)) {
    showNotification(`域名 "${newDomain}" 已在列表中`, 'warning')
    domainSearchText.value = ''
    return
  }
  
  // 添加到已选列表
  selectedDomains.value.push(newDomain)
  updateDomainConfig()
  
  // 如果不在可用域名池中，则添加
  if (!availableDomains.value.includes(newDomain)) {
    availableDomains.value.push(newDomain)
    showNotification(`系统共享域名 "${newDomain}" 已添加（所有用户可用）`, 'success')
  } else {
    showNotification(`已选择域名 "${newDomain}"`, 'success')
  }
  
  // 清空搜索框
  domainSearchText.value = ''
  showDomainDropdown.value = false
  updateFilteredDomains()
}

// 永久删除域名（从域名池和已选列表都删除）
async function deleteDomain(domain) {
  // 使用通知组件提示确认
  const confirmed = confirm(`确定要删除域名 "${domain}" 吗？此操作不可恢复。`)
  
  if (!confirmed) {
    return // 用户取消删除
  }
  
  // 从已选列表中移除
  selectedDomains.value = selectedDomains.value.filter(d => d !== domain)
  
  // 从可用域名池中删除
  availableDomains.value = availableDomains.value.filter(d => d !== domain)
  
  // 更新配置和过滤列表
  updateDomainConfig()
  updateFilteredDomains()
  
  // 自动保存配置到数据库（静默模式）
  try {
    await saveConfig(true) // 静默保存，不显示"配置保存成功"通知
    showNotification(`已删除域名 "${domain}"`, 'success')
  } catch (error) {
    console.error('删除域名失败:', error)
    showNotification(`删除域名失败: ${error.message}`, 'error')
  }
}

// 重置配置节
async function resetSection(section) {
  const confirmed = confirm(`确定要重置 "${getSectionName(section)}" 配置吗？此操作将恢复到上次保存的状态。`)
  
  if (!confirmed) {
    return
  }
  
  await loadConfig()
  showNotification('配置已重置', 'info')
}

// 获取配置节名称
function getSectionName(section) {
  const names = {
    basic: '基础配置',
    cloudflare: 'Cloudflare 配置',
    tempmailapi: 'TempMailApi',
    email: '邮件服务商'
  }
  return names[section] || '配置'
}

// 加载系统信息
async function loadSystemInfo() {
  try {
    const response = await apiClient.get('/config/system')
    
    if (response.data.success) {
      systemInfo.value = response.data.data
    }
  } catch (error) {
    console.error('Load system info error:', error)
    // 如果是 401 错误，静默处理
    if (error.response && error.response.status === 401) {
      return
    }
  }
}

// 保存配置
async function saveConfig(silent = false) {
  loading.value.save = true
  try {
    // 过滤掉脱敏的值，避免保存 *** 到数据库
    const configToSave = {}
    const sensitiveFields = [
      'cloudflare_api_token',
      'qq_imap_password',
      'tempmailapi_key',
      'resend_api_key',
      'brevo_api_key',
      'smtp2go_api_key'
    ]
    
    for (const [key, value] of Object.entries(config.value)) {
      // 如果是敏感字段且值为 ***，则跳过（不保存）
      if (sensitiveFields.includes(key) && (value === '***' || value === '')) {
        console.log(`跳过保存敏感字段: ${key} (值未修改或为空)`)
        continue
      }
      configToSave[key] = value
    }
    
    console.log('保存配置:', Object.keys(configToSave))
    const response = await apiClient.put('/config', configToSave)
    
    if (response.data.success) {
      configChanged.value = false
      if (!silent) {
        showNotification(`配置保存成功，更新了 ${response.data.data.count} 项配置`, 'success')
      }
      await loadConfig()
    }
  } catch (error) {
    console.error('Save config error:', error)
    if (!silent) {
      showNotification('配置保存失败: ' + error.message, 'error')
    }
    throw error // 抛出错误，让调用者知道保存失败
  } finally {
    loading.value.save = false
  }
}

// 验证配置
async function validateConfig() {
  loading.value.validate = true
  try {
    const response = await apiClient.post('/config/validate')
    
    if (response.data.success) {
      validationResult.value = response.data.data
      
      const summary = validationResult.value.validation.summary
      if (summary.errors > 0) {
        showNotification(`发现 ${summary.errors} 个错误，${summary.warnings} 个警告`, 'warning')
      } else if (summary.warnings > 0) {
        showNotification(`配置验证通过，有 ${summary.warnings} 个警告`, 'warning')
      } else {
        showNotification('配置验证通过！', 'success')
      }
    }
  } catch (error) {
    console.error('Validate config error:', error)
    showNotification('配置验证失败: ' + error.message, 'error')
  } finally {
    loading.value.validate = false
  }
}

// 测试连接
async function testConnection(service) {
  loading.value.test = true
  try {
    const params = { service }
    
    if (service === 'cloudflare') {
      params.token = config.value.cloudflare_api_token
      params.accountId = config.value.cloudflare_account_id
      params.zoneId = config.value.cloudflare_zone_id
    }
    
    const response = await apiClient.post('/config/test', params)
    
    if (response.data.success) {
      testResult.value = response.data.data
    }
  } catch (error) {
    console.error('Test connection error:', error)
    showNotification('连接测试失败: ' + error.message, 'error')
  } finally {
    loading.value.test = false
  }
}

// 导出配置
async function exportConfig() {
  loading.value.export = true
  try {
    const response = await apiClient.get('/config/export', {
      responseType: 'blob'
    })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `tempemail-config-${Date.now()}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    showNotification('配置导出成功', 'success')
  } catch (error) {
    console.error('Export config error:', error)
    showNotification('配置导出失败: ' + error.message, 'error')
  } finally {
    loading.value.export = false
  }
}

// 触发导入
function triggerImport() {
  fileInput.value?.click()
}

// 处理导入文件
async function handleImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    if (!data.config) {
      throw new Error('配置文件格式不正确')
    }
    
    // 确认导入
    if (!confirm(`确定要导入配置吗？这将覆盖当前配置。\n\n导出时间: ${data.exportedAt || '未知'}`)) {
      return
    }
    
    const response = await apiClient.post('/config/import', data)
    
    if (response.data.success) {
      showNotification(`配置导入成功，导入了 ${response.data.data.count} 项配置`, 'success')
      await loadConfig()
    }
  } catch (error) {
    console.error('Import config error:', error)
    showNotification('配置导入失败: ' + error.message, 'error')
  } finally {
    // 清空文件输入
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// 获取配置来源显示
function getConfigSource(key) {
  const source = configSources.value[key]
  if (!source) return null
  
  const sourceMap = {
    'database': { text: '数据库', class: 'source-database', icon: '💾' },
    'env': { text: '环境变量', class: 'source-env', icon: '⚙️' },
    'default': { text: '默认值', class: 'source-default', icon: '📋' },
    'none': { text: '未配置', class: 'source-none', icon: '❌' }
  }
  
  return sourceMap[source] || null
}

// 通知
function showNotification(message, type = 'info') {
  // 简单的通知实现
  console.log(`[${type}] ${message}`)
  alert(message)
}

// 初始化
onMounted(async () => {
  // 检查是否已登录，避免退出登录时触发 401 错误
  if (!authStore.isAuthenticated) {
    return
  }
  
  await loadConfig()
  await loadSystemInfo()
  await loadAvailableDomains()
})
</script>

<style scoped>
.config-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.config-header h2 {
  margin: 0;
  font-size: 1.75rem;
  color: #111827;
}

.subtitle {
  margin: 0.25rem 0 0 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* 系统信息卡片 */
.system-info-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.system-info-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #111827;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.info-item .value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.info-item .value.status-ok {
  color: #059669;
}

/* 验证结果卡片 */
.validation-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.validation-card h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #111827;
}

.validation-summary {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.error {
  background: #fee2e2;
  color: #dc2626;
}

.badge.warning {
  background: #fef3c7;
  color: #d97706;
}

.badge.success {
  background: #d1fae5;
  color: #059669;
}

.validation-messages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.validation-item {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.375rem;
}

.validation-item.error {
  background: #fef2f2;
  border-left: 4px solid #dc2626;
}

.validation-item.warning {
  background: #fffbeb;
  border-left: 4px solid #d97706;
}

.validation-item.info {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.validation-item svg {
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.validation-item.error svg {
  stroke: #dc2626;
}

.validation-item.warning svg {
  stroke: #d97706;
}

.validation-item.info svg {
  stroke: #3b82f6;
}

.validation-item strong {
  display: block;
  margin-bottom: 0.25rem;
  color: #111827;
}

.validation-item p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* 配置区域 */
.config-sections {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.config-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.btn-test {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-test:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-group input {
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
  color: #6b7280;
  font-size: 0.75rem;
}

.readonly-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.readonly-value {
  padding: 0.625rem 0.875rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  color: #6b7280;
  font-size: 0.875rem;
}

/* 底部按钮 */
.config-footer {
  display: flex;
  gap: 1rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
}

/* 按钮样式 */
.btn-primary,
.btn-secondary {
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

.btn-secondary:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 600px;
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

.test-result {
  text-align: center;
  padding: 2rem;
}

.test-result.success {
  color: #059669;
}

.test-result.error {
  color: #dc2626;
}

.result-icon {
  margin-bottom: 1rem;
}

.test-result h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.test-result p {
  margin: 0 0 1rem 0;
  color: #6b7280;
}

.result-data {
  margin-top: 1.5rem;
  text-align: left;
}

.result-data pre {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-size: 0.75rem;
  color: #374151;
}

/* 配置来源标签 */
.config-source-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

.source-database {
  background: #dbeafe;
  color: #1e40af;
}

.source-env {
  background: #fef3c7;
  color: #92400e;
}

.source-default {
  background: #e5e7eb;
  color: #374151;
}

.source-none {
  background: #fee2e2;
  color: #991b1b;
}

/* 域名标签容器 */
.domain-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  min-height: 2.5rem;
}

.domain-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
  animation: tag-fade-in 0.3s ease-out;
  transition: all 0.2s;
}

@keyframes tag-fade-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.domain-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.domain-tag svg {
  flex-shrink: 0;
}

.domain-tag span {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.domain-tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.domain-tag-remove:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(90deg);
}

.domain-tag-remove svg {
  display: block;
}

/* 域名输入框容器 */
.domain-input-container {
  position: relative;
}

.domain-input {
  width: 100%;
}

/* 域名下拉框 */
.domain-dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  animation: dropdown-fade-in 0.2s ease-out;
}

@keyframes dropdown-fade-in {
  from {
    opacity: 0;
    transform: translateY(-0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.domain-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  transition: all 0.15s;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
}

.domain-option:last-child {
  border-bottom: none;
}

.domain-option:hover,
.domain-option.selected {
  background: #eff6ff;
  color: #2563eb;
}

.domain-option.is-selected {
  background: #f0fdf4;
  color: #16a34a;
}

.domain-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.domain-option .domain-icon {
  flex-shrink: 0;
  stroke: currentColor;
  transition: transform 0.2s;
}

.domain-option:hover .domain-icon,
.domain-option.selected .domain-icon {
  transform: rotate(360deg);
}

.domain-option .domain-name {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
}

.domain-option .check-icon {
  flex-shrink: 0;
  stroke: #16a34a;
  animation: check-in 0.3s ease-out;
}

@keyframes check-in {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 删除按钮 */
.domain-delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  flex-shrink: 0;
  color: #ef4444;
}

.domain-option:hover .domain-delete-btn {
  opacity: 1;
}

.domain-delete-btn:hover {
  background: #fee2e2;
  transform: scale(1.1);
}

.domain-delete-btn:active {
  transform: scale(0.9);
}

.domain-delete-btn svg {
  display: block;
}

/* 滚动条样式 */
.domain-dropdown::-webkit-scrollbar {
  width: 6px;
}

.domain-dropdown::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 0.5rem;
}

.domain-dropdown::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 0.5rem;
}

.domain-dropdown::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* kbd 样式 */
kbd {
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* 配置节操作按钮 */
.section-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-section-action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-section-action:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-section-action.btn-primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-section-action.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-section-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-section-action svg {
  flex-shrink: 0;
}
</style>









