import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  let nextId = 1

  const add = (message, type = 'info', duration = 3000) => {
    const notification = {
      id: nextId++,
      message,
      type, // success, error, warning, info
      duration
    }

    notifications.value.push(notification)

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        remove(notification.id)
      }, duration)
    }

    return notification.id
  }

  const remove = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clear = () => {
    notifications.value = []
  }

  return {
    notifications,
    add,
    remove,
    clear
  }
})

