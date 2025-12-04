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
            <div v-if="message.body_html" class="html-body" v-html="decodedHtmlBody"></div>
            <div v-else class="text-body" style="white-space: pre-wrap;">{{ decodedTextBody }}</div>
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
import { sanitizeEmailHtml, sanitizeEmailText } from '@/utils/emailDecoder'
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

// 解码 HTML 邮件内容
const decodedHtmlBody = computed(() => {
  if (!props.message.body_html) return ''
  return sanitizeEmailHtml(props.message.body_html)
})

// 解码纯文本邮件内容
const decodedTextBody = computed(() => {
  if (!props.message.body_text) return ''
  return sanitizeEmailText(props.message.body_text)
})

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
  overflow-x: hidden;
  padding: 24px;
  /* 平滑滚动 */
  scroll-behavior: smooth;
  /* 优化滚动性能 */
  -webkit-overflow-scrolling: touch;
  /* 确保可以滚动 */
  min-height: 0;
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

.html-body {
  /* HTML 邮件容器样式 */
  width: 100%;
  overflow-x: auto;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  box-sizing: border-box;
  /* 确保内容可见且可滚动 */
  max-height: none;
  min-height: auto;
}

/* HTML 邮件内部元素样式 */
.html-body :deep(*) {
  max-width: 100% !important;
  box-sizing: border-box;
}

.html-body :deep(table) {
  border-collapse: collapse;
  margin: 0 auto;
  background: #fff;
}

.html-body :deep(td) {
  padding: inherit;
}

.html-body :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
}

.html-body :deep(a) {
  color: #6c7bff;
  text-decoration: underline;
  word-break: break-all;
}

.html-body :deep(a:hover) {
  opacity: 0.8;
}

/* 保留邮件原始样式但限制宽度 */
.html-body :deep(table[width]) {
  width: 100% !important;
  max-width: 600px !important;
}

/* 自定义滚动条样式 */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: var(--muted);
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: var(--brand);
}

@media (prefers-color-scheme: dark) {
  .html-body {
    background: #1a1a1a;
  }
  
  .html-body :deep(table) {
    background: #2d2d2d;
  }
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

