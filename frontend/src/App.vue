<template>
  <div class="app-container" :class="{ 'with-sidebar': showSidebar, 'sidebar-collapsed': sidebarCollapsed }">
    <!-- 加载中状态 -->
    <div v-if="isInitializing" class="initializing-overlay">
      <div class="initializing-content">
        <div class="loading-spinner"></div>
        <p>正在加载...</p>
      </div>
    </div>

    <!-- 主界面（只在初始化完成后显示） -->
    <template v-else>
    <Sidebar
      v-if="showSidebar"
      :current-view="currentView"
      @change-view="handleViewChange"
      @open-settings="showConfig = true"
      @open-user="showUserManager = true"
      @logout="handleLogout"
      @collapse-change="handleSidebarCollapse"
    />

    <div class="main-wrapper">
    <header v-if="currentView === 'email'" class="app-header">
      <!-- 品牌标识区域 -->
      <div class="brand-section">
        <div class="brand-logo">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div class="brand-info">
          <h1 class="brand-name">Mail2</h1>
          <p class="brand-subtitle">临时邮箱系统</p>
        </div>
      </div>

      <!-- 退出按钮（始终显示，只要用户已认证） -->
      <button
        v-if="authStore.isAuthenticated && !showLogin"
        class="header-logout-btn"
        @click="handleLogout"
        title="退出登录"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>退出</span>
      </button>

      <!-- 描述文字 -->
      <p class="header-desc">匿名、一次性、无注册 · 基于 Cloudflare</p>
    </header>

    <StatsPage v-if="currentView === 'stats'" />

    <SendEmail v-if="currentView === 'send'" @change-view="handleViewChange" />

    <UsersManagement v-if="currentView === 'users'" />

    <BackupManagement v-if="currentView === 'backup'" />

    <SystemConfig v-if="currentView === 'config'" @change-view="handleViewChange" />

    <TempMailApiDemo v-if="currentView === 'tempmail'" />

    <DomainsManagement v-if="currentView === 'domains'" />

    <div v-if="currentView === 'email'" class="main-layout">
      <!-- 保持上方模块纵向排列不变 -->
      <EmailGenerator />

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
    </div>

    <!-- 设置弹窗 -->
    <ConfigModal :visible="showConfig" @close="showConfig=false" />

    <!-- 用户管理 -->
    <UserManager v-if="showUserManager" @close="showUserManager=false" />

    <!-- 登录页面 -->
    <LoginPage v-if="showLogin" @close="showLogin=false" @success="onLoginSuccess" />

    <!-- 全局通知 -->
    <Notification />
    </template>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import EmailGenerator from './components/EmailGenerator.vue'
import EmailList from './components/EmailList.vue'
import MessageList from './components/MessageList.vue'
import Notification from './components/Notification.vue'
import ConfigModal from './components/ConfigModal.vue'
import LoginPage from './views/LoginPage.vue'
import UserManager from './components/UserManager.vue'
import StatsPage from './views/StatsPage.vue'
import SendEmail from './views/SendEmail.vue'
import UsersManagement from './views/UsersManagement.vue'
import BackupManagement from './views/BackupManagement.vue'
import TempMailApiDemo from './components/TempMailApiDemo.vue'
import SystemConfig from './views/SystemConfig.vue'
import DomainsManagement from './views/DomainsManagement.vue'
import { useWebSocket } from './composables/useWebSocket'
import { useEmailStore } from './stores/emailStore'
import { useAuthStore } from './stores/authStore'
import { useConfigStore } from './stores/configStore'
import { useAdminStore } from './stores/adminStore'
import { useNotification } from './composables/useNotification'
import { getUserId, getMaskedUserId } from './utils/userManager'

const emailStore = useEmailStore()
const authStore = useAuthStore()
const configStore = useConfigStore()
const adminStore = useAdminStore()
const { connect, disconnect } = useWebSocket()
const { showNotification } = useNotification()

const showConfig = ref(false)
const showLogin = ref(false)
const showUserManager = ref(false)
// 从 localStorage 恢复上次访问的页面，默认为 'email'
const currentView = ref(localStorage.getItem('currentView') || 'email')
const showSidebar = computed(() => !showLogin.value)
const sidebarCollapsed = ref(false)
const isInitializing = ref(true) // 添加初始化状态

const openSettings = () => { showConfig.value = true }

// 显示脱敏的用户ID
const maskedUserId = computed(() => getMaskedUserId())

const showUserIdInfo = () => {
  showUserManager.value = true
}

const handleViewChange = (view) => {
  if (view === 'stats' && !authStore.isUserAdmin) {
    showNotification('监控统计仅限管理员访问', 'warning')
    return
  }
  if (view === 'users' && !authStore.isUserAdmin) {
    showNotification('用户管理仅限管理员访问', 'warning')
    return
  }
  if (view === 'backup' && !authStore.isUserAdmin) {
    showNotification('数据备份仅限管理员访问', 'warning')
    return
  }
  currentView.value = view
  // 保存当前页面到 localStorage
  localStorage.setItem('currentView', view)
}

const handleSidebarCollapse = (collapsed) => {
  sidebarCollapsed.value = collapsed
}

const handleLogout = async () => {
  // 添加确认对话框
  if (!confirm('确认退出登录？\n\n退出后需要重新输入密码才能访问系统。')) {
    return
  }
  
  // 清除访问令牌
  await authStore.logout()
  
  // 同时清除管理员状态
  adminStore.logoutAdmin()
  
  showNotification('已退出登录', 'success')
  
  // 刷新页面或重新检查认证状态
  window.location.reload()
}

const onLoginSuccess = async () => {
  // 登录成功后加载数据
  try {
    // 加载配置（包含域名等信息）
    await configStore.loadConfig()
    console.log('✅ 配置加载成功')
    
    // 加载邮箱列表
    await emailStore.loadEmails()
    console.log('✅ 邮箱数据加载成功')
    
    // 建立 WebSocket 连接
    connect()
  } catch (error) {
    console.error('❌ 登录后数据加载失败:', error)
    showNotification('数据加载失败，请刷新页面', 'error')
  }
}

onMounted(async () => {
  try {
    // 初始化认证
    authStore.initAuth()

    // 检查是否启用了访问控制
    let enabled = false
    let backendAvailable = true

    try {
      enabled = await authStore.checkAuthStatus()
      console.log('✅ 认证状态检查完成，访问控制:', enabled ? '已启用' : '未启用')
    } catch (error) {
      console.error('❌ 检查认证状态失败，后端可能未启动:', error)
      backendAvailable = false
    }

    // 如果后端不可用，显示登录弹窗（让用户知道需要启动后端）
    if (!backendAvailable) {
      console.log('⚠️ 后端不可用，显示登录页面')
      showLogin.value = true
      isInitializing.value = false // 完成初始化
      showNotification('无法连接到服务器，请检查后端是否运行', 'error')
      return
    }

    if (enabled) {
      // 如果启用了访问控制，检查是否已登录
      if (!authStore.isAuthenticated) {
        console.log('⚠️ 未登录，显示登录页面')
        showLogin.value = true
        isInitializing.value = false // 完成初始化
        return
      }

      // 已登录，验证令牌
      let valid = false
      try {
        valid = await authStore.verifyToken()
        console.log('🔐 Token验证结果:', valid ? '有效' : '无效')
      } catch (error) {
        console.error('❌ Token验证失败:', error)
        valid = false
      }

      if (!valid) {
        // 令牌无效，清除token并显示登录弹窗
        console.log('⚠️ Token无效，清除并显示登录页面')
        await authStore.logout()
        showLogin.value = true
        isInitializing.value = false // 完成初始化
        return
      }
    }
    
    // 加载初始数据
    try {
      // 先加载配置
      await configStore.loadConfig()
      console.log('✅ 配置加载成功')

      // 再加载邮箱数据
      await emailStore.loadEmails()
      console.log('✅ 邮箱数据加载成功')
    } catch (error) {
      console.error('❌ 初始数据加载失败:', error)

      // 如果是401错误，说明token无效
      if (error.response?.status === 401) {
        console.log('⚠️ 401错误，清除token并显示登录页面')
        await authStore.logout()
        showLogin.value = true
        isInitializing.value = false // 完成初始化
        showNotification('登录已过期，请重新登录', 'warning')
        return
      }

      // 如果启用了访问控制且数据加载失败，显示登录弹窗
      if (enabled && error.message?.includes('Network Error')) {
        console.log('⚠️ 网络错误且启用访问控制，显示登录页面')
        await authStore.logout()
        showLogin.value = true
        isInitializing.value = false // 完成初始化
        showNotification('无法连接到服务器，请检查后端是否运行', 'error')
        return
      }

      // 其他错误，提示用户但不中断
      showNotification('数据加载失败，请检查后端是否运行', 'error')
    }

    // 完成初始化，显示主界面
    isInitializing.value = false

    // 建立 WebSocket 连接
    try {
      connect()
    } catch (error) {
      console.warn('⚠️ WebSocket连接失败:', error)
    }
  } catch (error) {
    console.error('❌ 应用初始化失败:', error)
    showNotification('系统初始化失败', 'error')
  }
})

onUnmounted(() => {
  disconnect()
})
</script>

