<template>
  <aside class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <div class="brand-logo">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>
      <h2 v-show="!isCollapsed" class="brand-title">Mail2</h2>
      <button class="toggle-btn" @click="toggleCollapse" :title="isCollapsed ? '展开' : '收起'">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <polyline :points="isCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"/>
        </svg>
      </button>
    </div>

    <nav class="sidebar-nav">
      <button
        :class="['nav-item', { active: currentView === 'email' }]"
        @click="$emit('change-view', 'email')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span>临时邮箱</span>
      </button>

      <button
        :class="['nav-item', { active: currentView === 'send' }]"
        @click="$emit('change-view', 'send')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
        <span>发送邮件</span>
      </button>

      <button
        :class="['nav-item', { active: currentView === 'tempmail' }]"
        @click="$emit('change-view', 'tempmail')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          <path d="M2 12h20"/>
        </svg>
        <span>TempMailApi</span>
      </button>

      <button
        :class="['nav-item', { active: currentView === 'domains' }]"
        @click="$emit('change-view', 'domains')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>我的域名</span>
      </button>

      <button
        v-if="authStore.isUserAdmin"
        :class="['nav-item', { active: currentView === 'stats' }]"
        @click="$emit('change-view', 'stats')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18"/>
          <path d="M18 17V9"/>
          <path d="M13 17V5"/>
          <path d="M8 17v-3"/>
        </svg>
        <span>监控统计</span>
      </button>

      <button
        v-if="authStore.isUserAdmin"
        :class="['nav-item', { active: currentView === 'users' }]"
        @click="$emit('change-view', 'users')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span>用户管理</span>
      </button>

      <button
        v-if="authStore.isUserAdmin"
        :class="['nav-item', { active: currentView === 'backup' }]"
        @click="$emit('change-view', 'backup')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>数据备份</span>
      </button>

      <button
        v-if="authStore.isUserAdmin"
        :class="['nav-item', { active: currentView === 'config' }]"
        @click="$emit('change-view', 'config')"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>系统配置</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <button v-if="authStore.isUserAdmin" class="footer-item settings-item" @click="$emit('open-settings')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>设置</span>
      </button>

      <button class="footer-item" @click="$emit('open-user')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>{{ maskedUserId }}</span>
      </button>

      <button v-if="showLogout" class="footer-item logout-item" @click="$emit('logout')">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>退出</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { getMaskedUserId } from '@/utils/userManager'
import { useAuthStore } from '@/stores/authStore'

defineProps({
  currentView: {
    type: String,
    default: 'email'
  }
})

const emit = defineEmits(['change-view', 'open-settings', 'open-user', 'logout', 'collapse-change'])

const authStore = useAuthStore()
const maskedUserId = computed(() => getMaskedUserId())
const showLogout = computed(() => authStore.isAuthenticated && authStore.authEnabled)
const isCollapsed = ref(false)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  emit('collapse-change', isCollapsed.value)
}
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: 100vh;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(230, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 70px;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(230, 232, 240, 0.6);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.sidebar.collapsed .sidebar-header {
  padding: 24px 10px;
  justify-content: center;
}

.toggle-btn {
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
}

.sidebar.collapsed .toggle-btn {
  margin-left: 0;
  position: absolute;
  right: -40px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(230, 232, 240, 0.8);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
}

.toggle-btn:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
}

.toggle-btn svg {
  transition: all 0.3s ease;
}

.toggle-btn:hover svg {
  animation: wiggle 0.5s ease;
}

@keyframes wiggle {
  0%, 100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  75% {
    transform: rotate(10deg);
  }
}

.brand-logo {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.brand-logo:hover {
  animation: bounce 0.6s ease;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-8px);
  }
  50% {
    transform: translateY(-4px);
  }
  75% {
    transform: translateY(-6px);
  }
}

.brand-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  border-radius: 10px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
  white-space: nowrap;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 12px;
}

.sidebar.collapsed .nav-item span {
  display: none;
}

.nav-item:hover {
  background: rgba(99, 102, 241, 0.08);
  color: #6366f1;
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%);
  color: #6366f1;
  font-weight: 600;
}

.nav-item svg {
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* 临时邮箱图标 - 上下浮动 */
.nav-item:nth-child(1):hover svg {
  animation: float 0.6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* 发送邮件图标 - 飞行动画 */
.nav-item:nth-child(2):hover svg {
  animation: fly 0.6s ease-in-out;
}

@keyframes fly {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(8px, -8px);
  }
  100% {
    transform: translate(0, 0);
  }
}

/* TempMailApi 图标 - 地球旋转动画 */
.nav-item:nth-child(3):hover svg {
  animation: spin 1s ease-in-out;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 我的域名图标 - 地球旋转动画（反向） */
.nav-item:nth-child(4):hover svg {
  animation: spinReverse 1s ease-in-out;
}

@keyframes spinReverse {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(-360deg);
  }
}

/* 监控统计图标 - 上升动画 */
.nav-item:nth-child(5):hover svg {
  animation: rise 0.5s ease;
}

@keyframes rise {
  0%, 100% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-6px);
  }
  75% {
    transform: translateY(-2px);
  }
}

/* 用户管理图标 - 缩放动画 */
.nav-item:nth-child(6):hover svg {
  animation: scaleUp 0.4s ease;
}

@keyframes scaleUp {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* 数据备份图标 - 下载动画 */
.nav-item:nth-child(7):hover svg {
  animation: download 0.6s ease;
}

@keyframes download {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(4px);
  }
}

/* 系统配置图标 - 旋转动画 */
.nav-item:nth-last-child(1):hover svg {
  animation: rotate 0.6s ease;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(90deg);
  }
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(230, 232, 240, 0.6);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
  white-space: nowrap;
}

.sidebar.collapsed .footer-item {
  justify-content: center;
  padding: 10px;
}

.sidebar.collapsed .footer-item span {
  display: none;
}

.footer-item:hover {
  background: rgba(100, 116, 139, 0.08);
  color: #475569;
}

.footer-item.settings-item svg {
  transition: transform 0.6s ease;
}

.footer-item.settings-item:hover svg {
  transform: rotate(90deg);
}

.footer-item.logout-item {
  color: #ef4444;
}

.footer-item.logout-item:hover {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
}

.footer-item svg {
  flex-shrink: 0;
  transition: all 0.3s ease;
}

/* 用户管理图标 - 缩放动画 */
.footer-item:not(.settings-item):not(.logout-item):hover svg {
  animation: pulse 0.6s ease;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* 退出图标 - 向右滑动 */
.footer-item.logout-item:hover svg {
  animation: slideRight 0.4s ease;
}

@keyframes slideRight {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(6px);
  }
}

.footer-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .sidebar:not(.collapsed) {
    width: 200px;
  }
  
  .sidebar.collapsed {
    width: 60px;
  }
}
</style>

