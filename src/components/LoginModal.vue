<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content login-modal">
      <div class="modal-header">
        <h2>🔐 访问控制</h2>
        <button class="btn-close" @click="$emit('close')" aria-label="关闭">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <p class="login-hint">此系统已启用访问控制，请输入访问密码以继续使用。</p>
        
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="password">访问密码</label>
            <div class="password-input">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入访问密码"
                required
                autofocus
                :disabled="isLoading"
              />
              <button
                type="button"
                class="btn-toggle-password"
                @click="showPassword = !showPassword"
                :title="showPassword ? '隐藏密码' : '显示密码'"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
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
            :disabled="isLoading || !password"
          >
            <span v-if="!isLoading">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
              </svg>
              <span>登录</span>
            </span>
            <span v-else class="loading-spinner"></span>
          </button>
        </form>

        <div class="login-footer">
          <p class="text-muted">💡 提示：访问密码由系统管理员配置</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useNotification } from '@/composables/useNotification'

defineProps({
  visible: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'success'])

const authStore = useAuthStore()
const { showNotification } = useNotification()

const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!password.value) {
    errorMessage.value = '请输入密码'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authStore.login(password.value)
    showNotification('登录成功！', 'success')
    emit('success')
    emit('close')
  } catch (error) {
    console.error('Login failed:', error)
    errorMessage.value = error.message || '密码错误，请重试'
    password.value = ''
  } finally {
    isLoading.value = false
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: var(--card);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.login-modal {
  text-align: center;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: var(--text-sub);
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--muted);
  color: var(--text-main);
}

.modal-body {
  padding: 24px;
}

.login-hint {
  color: var(--text-sub);
  margin-bottom: 24px;
  line-height: 1.6;
  text-align: left;
}

.form-group {
  margin-bottom: 20px;
  text-align: left;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--text-main);
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.password-input {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input input {
  flex: 1;
  padding: 12px 48px 12px 16px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--muted);
  color: var(--text-main);
  transition: all 0.2s ease;
  width: 100%;
}

.password-input input:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(108, 123, 255, 0.1);
}

.password-input input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--text-sub);
  transition: color 0.2s ease;
}

.btn-toggle-password:hover {
  color: var(--text-main);
}

.error-message {
  background: rgba(240, 62, 62, 0.1);
  border: 1px solid var(--danger);
  color: var(--danger);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  text-align: left;
}

.btn-block {
  width: 100%;
}

.btn svg {
  margin-right: 8px;
}

.login-footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}

.login-footer p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-sub);
}

.text-muted {
  color: var(--text-sub);
}

/* 响应式 */
@media (max-width: 640px) {
  .modal-content {
    max-width: 100%;
    margin: 0 16px;
  }

  .modal-header h2 {
    font-size: 1.3rem;
  }
}
</style>

