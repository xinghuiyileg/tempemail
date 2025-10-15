<template>
  <div class="app-container">
    <header class="app-header">
      <div style="display:flex;align-items:center;justify-content:center;gap:12px;position:relative;">
        <h1>📧 临时邮箱系统</h1>
        <button class="btn btn-ghost btn-icon" title="设置" style="position:absolute;right:0;" @click="openSettings">⚙️</button>
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
import { useWebSocket } from './composables/useWebSocket'
import { useEmailStore } from './stores/emailStore'

const emailStore = useEmailStore()
const { connect, disconnect } = useWebSocket()

const showConfig = ref(false)
const openSettings = () => { showConfig.value = true }

onMounted(() => {
  // 加载初始数据
  emailStore.loadEmails()
  // 建立 WebSocket 连接
  connect()
})

onUnmounted(() => {
  disconnect()
})
</script>

