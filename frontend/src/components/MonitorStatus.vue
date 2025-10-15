<template>
  <div class="card">
    <div class="card-body">
      <div class="status-header">
        <h2>📊 监控状态</h2>
        <button
          ref="toggleBtnRef"
          class="btn btn-sm btn-secondary"
          @click="toggleMonitor"
          :disabled="isToggling"
        >
          {{ toggleLabel }}
        </button>
      </div>

      <div class="status-grid">
        <div class="status-item">
          <div class="status-icon" :class="statusClass">
            {{ statusIcon }}
          </div>
          <div class="status-info">
            <div class="status-label">监控状态</div>
            <div class="status-value">{{ statusText }}</div>
          </div>
        </div>

        <div class="status-item">
          <div class="status-icon">📧</div>
          <div class="status-info">
            <div class="status-label">临时邮箱</div>
            <div class="status-value">{{ emailCount }} 个</div>
          </div>
        </div>

        <div class="status-item">
          <div class="status-icon">📬</div>
          <div class="status-info">
            <div class="status-label">总邮件数</div>
            <div class="status-value">{{ messageCount }} 封</div>
          </div>
        </div>

        <div class="status-item">
          <div class="status-icon">🔑</div>
          <div class="status-info">
            <div class="status-label">验证码提取</div>
            <div class="status-value">{{ codeCount }} 个</div>
          </div>
        </div>
      </div>

      <div v-if="lastCheckTime" class="last-update">
        最后更新: {{ formatTime(lastCheckTime) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useButtonLabel } from '@/composables/useButtonLabel'
import { useMonitorStore } from '@/stores/monitorStore'
import { useEmailStore } from '@/stores/emailStore'
import { useMessageStore } from '@/stores/messageStore'
import { formatRelativeTime } from '@/utils/formatTime'

const monitorStore = useMonitorStore()
const emailStore = useEmailStore()
const messageStore = useMessageStore()

const isToggling = ref(false)
const toggleBtnRef = ref(null)
const { label: toggleLabel, withFeedback: withToggleFeedback } = useButtonLabel('▶️ 启动', { timeoutMs: 900 })

const monitorStatus = computed(() => monitorStore.status)
const lastCheckTime = computed(() => monitorStore.lastCheckTime)
const emailCount = computed(() => emailStore.emails.length)
const messageCount = computed(() => messageStore.totalCount)
const codeCount = computed(() => messageStore.verificationCodeCount)

const statusClass = computed(() => {
  return {
    'status-running': monitorStatus.value === 'running',
    'status-stopped': monitorStatus.value === 'stopped',
    'status-connecting': monitorStatus.value === 'connecting'
  }
})

const statusIcon = computed(() => {
  const icons = {
    'running': '🟢',
    'stopped': '🔴',
    'connecting': '🟡'
  }
  return icons[monitorStatus.value] || '⚪'
})

const statusText = computed(() => {
  const texts = {
    'running': '监控中',
    'stopped': '已停止',
    'connecting': '连接中'
  }
  return texts[monitorStatus.value] || '未知'
})

const formatTime = (time) => {
  return formatRelativeTime(time)
}

const toggleMonitor = async () => {
  isToggling.value = true
  try {
    const action = monitorStatus.value === 'running' ? 'stop' : 'start'
    await withToggleFeedback(async () => {
      await monitorStore.toggleMonitor(action)
    }, { loadingText: action === 'start' ? '启动中...' : '停止中...', successText: action === 'start' ? '已启动 ✓' : '已停止 ✓', buttonRef: toggleBtnRef })
  } catch (error) {
    console.error('Toggle monitor failed:', error)
  } finally {
    isToggling.value = false
  }
}

onMounted(() => {
  monitorStore.loadStatus()
})
</script>

<style scoped>
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-header h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--muted);
  border-radius: 12px;
  border: 1.5px solid var(--border);
}

.status-icon {
  font-size: 2rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(108, 123, 255, 0.1);
}

.status-icon.status-running {
  animation: pulse 2s ease-in-out infinite;
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 0.85rem;
  color: var(--text-sub);
  margin-bottom: 4px;
}

.status-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-main);
}

.last-update {
  text-align: center;
  color: var(--text-sub);
  font-size: 0.9rem;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

@media (max-width: 640px) {
  .status-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

