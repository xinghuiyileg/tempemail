import { ref, onUnmounted } from 'vue'
import { useMessageStore } from '@/stores/messageStore'
import { useMonitorStore } from '@/stores/monitorStore'
import { useNotificationStore } from '@/stores/notificationStore'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8787/ws'

export function useWebSocket() {
  const ws = ref(null)
  const connected = ref(false)
  const reconnectTimer = ref(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const messageStore = useMessageStore()
  const monitorStore = useMonitorStore()
  const notificationStore = useNotificationStore()

  const connect = () => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      ws.value = new WebSocket(WS_URL)

      ws.value.onopen = () => {
        console.log('WebSocket connected')
        connected.value = true
        reconnectAttempts.value = 0
        notificationStore.add('实时连接已建立', 'success')
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.value.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.value.onclose = () => {
        console.log('WebSocket disconnected')
        connected.value = false
        
        // 尝试重连
        if (reconnectAttempts.value < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
          reconnectTimer.value = setTimeout(() => {
            reconnectAttempts.value++
            console.log(`Reconnecting... Attempt ${reconnectAttempts.value}`)
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimer.value) {
      clearTimeout(reconnectTimer.value)
      reconnectTimer.value = null
    }

    if (ws.value) {
      ws.value.close()
      ws.value = null
    }

    connected.value = false
  }

  const send = (data) => {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  const handleMessage = (data) => {
    console.log('WebSocket message:', data)

    switch (data.type) {
      case 'new_email':
        // 新邮件到达
        handleNewEmail(data.data)
        break

      case 'monitor_status':
        // 监控状态更新
        handleMonitorStatus(data.data)
        break

      case 'ping':
        // 心跳响应
        send({ type: 'pong' })
        break

      default:
        console.log('Unknown message type:', data.type)
    }
  }

  const handleNewEmail = (emailData) => {
    // 添加到消息列表
    messageStore.addNewMessage(emailData)

    // 显示通知
    const message = emailData.verification_code
      ? `收到新邮件！验证码: ${emailData.verification_code}`
      : `收到新邮件：${emailData.subject}`

    notificationStore.add(message, 'success', 5000)

    // 播放提示音（可选）
    playNotificationSound()
  }

  const handleMonitorStatus = (statusData) => {
    monitorStore.updateLastCheckTime(statusData.last_check_at)
  }

  const playNotificationSound = () => {
    try {
      // 创建简单的提示音
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gainNode.gain.value = 0.1
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      // 忽略音频播放错误
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connect,
    disconnect,
    send
  }
}

