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
          <div class="notification-icon">{{ getIcon(notification.type) }}</div>
          <div class="notification-content">
            <div class="notification-message">{{ notification.message }}</div>
          </div>
          <button class="notification-close" @click="remove(notification.id)">
            ×
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

const getIcon = (type) => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  return icons[type] || 'ℹ️'
}

const remove = (id) => {
  notificationStore.remove(id)
}
</script>

<style scoped>
.notification-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 320px;
  animation: slideInRight 0.3s ease;
}

.notification-success {
  border-left: 4px solid var(--success);
}

.notification-error {
  border-left: 4px solid var(--danger);
}

.notification-warning {
  border-left: 4px solid var(--warning);
}

.notification-info {
  border-left: 4px solid var(--brand);
}

.notification-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-message {
  color: var(--text-main);
  font-weight: 600;
  line-height: 1.4;
}

.notification-close {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-sub);
  font-size: 20px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.notification-close:hover {
  background: var(--muted);
  color: var(--text-main);
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 640px) {
  .notification-container {
    left: 20px;
    right: 20px;
    max-width: none;
  }

  .notification {
    min-width: 0;
  }
}
</style>

