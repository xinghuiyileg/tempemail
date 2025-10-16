<template>
  <div class="app-container">
    <header class="app-header">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;position:relative;">
        <h1>📧 临时邮箱系统</h1>
        <div style="position:absolute;right:0;display:flex;gap:8px;">
          <button 
            v-if="authStore.isAuthenticated && authStore.authEnabled"
            class="btn btn-ghost btn-sm logout-btn" 
            title="退出登录" 
            @click="handleLogout"
            aria-label="退出登录"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
          <button 
            class="btn btn-ghost btn-icon settings-btn" 
            title="系统设置" 
            @click="openSettings"
            aria-label="打开系统设置"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m-6-6h6m6 0h-6"/>
              <path d="m19.07 4.93-4.24 4.24m0 5.66 4.24 4.24M4.93 4.93l4.24 4.24m0 5.66-4.24 4.24"/>
            </svg>
          </button>
        </div>
      </div>
      <p>匿名、一次性、无注册 · 基于 Cloudflare</p>
    </header>

    <div class="main-layout">
      <!-- 保持上方模块纵向排列不变 -->
      <EmailGenerator />
      <MonitorStatus />

      <!-- 仅将临时邮箱列表与收件箱并排显示 -->
      <div class="two-col">
        <div class="left-pane">
          <EmailList />
        </div>
        <div class="right-pane">
          <MessageList />
        </div>
      </div>

      
    </div>

    <!-- 设置弹窗 -->
    <ConfigModal :visible="showConfig" @close="showConfig=false" />

    <!-- 登录弹窗 -->
    <LoginModal :visible="showLogin" @close="showLogin=false" @success="onLoginSuccess" />

    <!-- 全局通知 -->
    <Notification />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import EmailGenerator from './components/EmailGenerator.vue'
import MonitorStatus from './components/MonitorStatus.vue'
import EmailList from './components/EmailList.vue'
import MessageList from './components/MessageList.vue'
import Notification from './components/Notification.vue'
import ConfigModal from './components/ConfigModal.vue'
import LoginModal from './components/LoginModal.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useEmailStore } from './stores/emailStore'
import { useAuthStore } from './stores/authStore'
import { useNotification } from './composables/useNotification'

const emailStore = useEmailStore()
const authStore = useAuthStore()
const { connect, disconnect } = useWebSocket()
const { showNotification } = useNotification()

const showConfig = ref(false)
const showLogin = ref(false)

const openSettings = () => { showConfig.value = true }

const handleLogout = async () => {
  await authStore.logout()
  showNotification('已退出登录', 'success')
  // 刷新页面或重新检查认证状态
  window.location.reload()
}

const onLoginSuccess = async () => {
  // 登录成功后加载数据
  await emailStore.loadEmails()
  connect()
}

onMounted(async () => {
  // 初始化认证
  authStore.initAuth()
  
  // 检查是否启用了访问控制
  const enabled = await authStore.checkAuthStatus()
  
  if (enabled) {
    // 如果启用了访问控制，检查是否已登录
    if (!authStore.isAuthenticated) {
      // 未登录，显示登录弹窗
      showLogin.value = true
      return
    }
    
    // 已登录，验证令牌
    const valid = await authStore.verifyToken()
    if (!valid) {
      // 令牌无效，显示登录弹窗
      showLogin.value = true
      return
    }
  }
  
  // 加载初始数据
  emailStore.loadEmails()
  // 建立 WebSocket 连接
  connect()
})

onUnmounted(() => {
  disconnect()
})
</script>

