<template>
  <div class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>📧 邮件详情</h3>
        <button class="close-btn" @click="close">×</button>
      </div>

      <div class="modal-body">
        <div class="message-detail">
          <div class="detail-subject">{{ message.subject }}</div>

          <div class="detail-meta">
            <div class="meta-row">
              <span class="meta-label">发件人:</span>
              <span>{{ message.sender }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">收件人:</span>
              <span>{{ currentEmail?.email || '-' }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">时间:</span>
              <span>{{ formatFullTime(message.received_at) }}</span>
            </div>
          </div>

          <div v-if="message.verification_code" class="detail-code">
            <div class="code-header">🔑 验证码</div>
            <div class="code-display">
              {{ message.verification_code }}
              <button class="btn-copy" @click="copyCode">
                📋 复制
              </button>
            </div>
          </div>

          <div class="detail-body">
            <div v-if="message.body_html" v-html="sanitizeHtml(message.body_html)"></div>
            <div v-else class="text-body">{{ message.body_text }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useEmailStore } from '@/stores/emailStore'
import { useNotification } from '@/composables/useNotification'
import dayjs from 'dayjs'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const emailStore = useEmailStore()
const { showNotification } = useNotification()

const currentEmail = computed(() => emailStore.currentEmail)

const close = () => {
  emit('close')
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.message.verification_code)
    showNotification('验证码已复制', 'success')
  } catch (error) {
    showNotification('复制失败', 'error')
  }
}

const formatFullTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const sanitizeHtml = (html) => {
  // 基础的HTML清理，生产环境建议使用 DOMPurify
  return html
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
  animation: fadeIn 0.25s ease;
}

.modal-content {
  background: var(--card);
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  background: linear-gradient(135deg, var(--bg-start), var(--bg-end));
  color: #fff;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.4rem;
  font-weight: 800;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.detail-subject {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 16px;
}

.detail-meta {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.meta-row {
  display: flex;
  gap: 12px;
  color: var(--text-sub);
}

.meta-label {
  font-weight: 700;
  min-width: 80px;
  color: var(--text-main);
}

.detail-code {
  background: linear-gradient(135deg, var(--bg-start), var(--bg-end));
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.code-header {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #fff;
  font-size: 1.8rem;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  letter-spacing: 3px;
}

.btn-copy {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-copy:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.detail-body {
  line-height: 1.75;
  color: var(--text-main);
}

.text-body {
  white-space: pre-wrap;
  word-wrap: break-word;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0.6;
  }
  to {
    transform: none;
    opacity: 1;
  }
}
</style>

