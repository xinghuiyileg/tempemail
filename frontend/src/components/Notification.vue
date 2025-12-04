<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification"
          :class="`notification-${notification.type}`"
        >
          <div class="notification-icon">
            <svg v-if="notification.type === 'success'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <svg v-else-if="notification.type === 'error'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <svg v-else-if="notification.type === 'warning'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="notification-content">
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <button class="notification-close" @click="remove(notification.id)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)

const remove = (id) => {
  notificationStore.remove(id)
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 500px;
  width: calc(100% - 40px);
}

.notification {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  animation: slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.notification-success {
  border-left: 3px solid #10b981;
}

.notification-success .notification-icon {
  color: #10b981;
}

.notification-error {
  border-left: 3px solid #ef4444;
}

.notification-error .notification-icon {
  color: #ef4444;
}

.notification-warning {
  border-left: 3px solid #f59e0b;
}

.notification-warning .notification-icon {
  color: #f59e0b;
}

.notification-info {
  border-left: 3px solid #6366f1;
}

.notification-info .notification-icon {
  color: #6366f1;
}

.notification-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.notification-content {
  flex: 1;
}

.notification-message {
  color: #1e293b;
  font-weight: 600;
  font-size: 14px;
  line-height: 1.5;
}

.notification-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  background: rgba(100, 116, 139, 0.1);
  color: #1e293b;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.notification-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 640px) {
  .notification-container {
    top: 16px;
    width: calc(100% - 32px);
  }

  .notification {
    padding: 14px 16px;
  }
}
</style>

