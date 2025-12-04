<template>
  <div v-if="visible" class="modal-overlay" @click.self="close">
    <div class="modal-content account-modal">
      <div class="modal-header">
        <h2>
          <svg v-if="isRegister" class="header-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <svg v-else class="header-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          {{ isRegister ? '注册账号' : '账号登录' }}
        </h2>
        <button class="btn-close" @click="close">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="account-password">密码</label>
            <div class="password-wrapper">
              <input
                id="account-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                required
              />
              <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="isRegister" class="form-group">
            <label for="confirm-password">确认密码</label>
            <input
              id="confirm-password"
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请再次输入密码"
              required
            />
          </div>

          <div class="form-group">
            <label for="captcha">验证码</label>
            <div class="captcha-wrapper">
              <input
                id="captcha"
                v-model="form.captchaCode"
                type="text"
                placeholder="请输入验证码"
                maxlength="4"
                required
                class="captcha-input"
              />
              <div class="captcha-image" @click="refreshCaptcha">
                <div v-if="loadingCaptcha" class="captcha-loading">
                  加载中...
                </div>
                <div v-else-if="captchaSvg" v-html="captchaSvg" class="captcha-svg"></div>
                <div v-else class="captcha-placeholder">
                  点击刷新
                </div>
              </div>
              <button
                type="button"
                class="btn-refresh-captcha"
                @click="refreshCaptcha"
                :disabled="loadingCaptcha"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            :disabled="loading"
          >
            <span v-if="!loading">{{ isRegister ? '注册' : '登录' }}</span>
            <span v-else>处理中...</span>
          </button>
        </form>

        <div class="modal-footer">
          <button 
            type="button" 
            class="btn-link" 
            @click="toggleMode"
          >
            {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/services/api'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'success'])

const authStore = useAuthStore()
const isRegister = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const loadingCaptcha = ref(false)
const captchaSvg = ref('')
const captchaId = ref('')

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  captchaCode: ''
})

// 监听弹窗显示，自动加载验证码
watch(() => props.visible, (newVal) => {
  if (newVal) {
    refreshCaptcha()
  }
})

// 刷新验证码
const refreshCaptcha = async () => {
  loadingCaptcha.value = true
  try {
    const response = await apiClient.get('/auth/captcha')
    if (response.data.success) {
      captchaSvg.value = response.data.data.captchaSvg
      captchaId.value = response.data.data.captchaId
      form.captchaCode = ''
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    errorMessage.value = '获取验证码失败，请重试'
  } finally {
    loadingCaptcha.value = false
  }
}

const close = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  form.username = ''
  form.password = ''
  form.confirmPassword = ''
  form.captchaCode = ''
  errorMessage.value = ''
  showPassword.value = false
  captchaSvg.value = ''
  captchaId.value = ''
}

const toggleMode = () => {
  isRegister.value = !isRegister.value
  errorMessage.value = ''
  form.confirmPassword = ''
  form.captchaCode = ''
  refreshCaptcha()
}

const handleSubmit = async () => {
  errorMessage.value = ''

  // 去除验证码前后空格
  const captchaCode = (form.captchaCode || '').trim()

  if (!captchaCode) {
    errorMessage.value = '请输入验证码'
    return
  }

  if (isRegister.value && form.password !== form.confirmPassword) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  loading.value = true

  try {
    if (isRegister.value) {
      // 注册
      await authStore.register(form.username, form.password, captchaId.value, captchaCode)
      errorMessage.value = ''

      // 注册成功后，切换到登录模式并刷新验证码
      isRegister.value = false
      form.confirmPassword = ''
      form.captchaCode = ''
      await refreshCaptcha()

      // 提示用户注册成功，需要登录
      errorMessage.value = '注册成功！请输入验证码登录'
      return
    } else {
      // 登录
      await authStore.accountLogin(form.username, form.password, captchaId.value, captchaCode)
    }

    emit('success')
    close()
  } catch (error) {
    errorMessage.value = error.message || (isRegister.value ? '注册失败' : '登录失败')
    // 验证失败后刷新验证码
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: #6366f1;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.btn-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 48px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(99, 102, 241, 0.08);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 6px 8px;
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toggle-password:hover {
  background: rgba(99, 102, 241, 0.15);
  transform: translateY(-50%) scale(1.05);
}

.toggle-password svg {
  transition: transform 0.2s;
}

.toggle-password:hover svg {
  transform: rotate(10deg);
}

.error-message {
  margin-bottom: 16px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

.btn {
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-block {
  width: 100%;
}

.modal-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  margin-top: 20px;
}

.btn-link {
  background: none;
  border: none;
  color: #6366f1;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 8px;
  text-decoration: none;
  transition: color 0.2s;
}

.btn-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}

/* 验证码样式 */
.captcha-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.captcha-input {
  flex: 1;
  min-width: 0;
}

.captcha-image {
  width: 120px;
  height: 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  transition: all 0.2s;
  overflow: hidden;
}

.captcha-image:hover {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.captcha-svg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-svg :deep(svg) {
  width: 100%;
  height: 100%;
}

.captcha-loading,
.captcha-placeholder {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

.btn-refresh-captcha {
  background: rgba(99, 102, 241, 0.08);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 10px;
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-refresh-captcha:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.15);
  transform: rotate(180deg);
}

.btn-refresh-captcha:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-refresh-captcha svg {
  transition: transform 0.3s;
}
</style>

