import { useNotificationStore } from '@/stores/notificationStore'

export function useNotification() {
  const notificationStore = useNotificationStore()

  const showNotification = (message, type = 'info', duration = 3000) => {
    return notificationStore.add(message, type, duration)
  }

  const showSuccess = (message, duration = 3000) => {
    return notificationStore.add(message, 'success', duration)
  }

  const showError = (message, duration = 5000) => {
    return notificationStore.add(message, 'error', duration)
  }

  const showWarning = (message, duration = 4000) => {
    return notificationStore.add(message, 'warning', duration)
  }

  const showInfo = (message, duration = 3000) => {
    return notificationStore.add(message, 'info', duration)
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

