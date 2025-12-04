<template>
  <button 
    class="refresh-btn" 
    @click="handleClick" 
    :disabled="loading || disabled" 
    :class="{ 'success': refreshSuccess, 'transitioning': isTransitioning }"
  >
    <transition name="icon-fade" mode="out-in">
      <svg v-if="!refreshSuccess" key="refresh" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" :class="{ 'spinning': loading }">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
      <svg v-else key="check" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="check-icon">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </transition>
    <transition name="text-fade" mode="out-in">
      <span v-if="!loading && !refreshSuccess" key="refresh-text">{{ label || '刷新' }}</span>
      <span v-else-if="loading" key="loading-text">{{ loadingText || '刷新中...' }}</span>
      <span v-else key="success-text">{{ successText || '刷新完成' }}</span>
    </transition>
  </button>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: '刷新数据'
  },
  loadingText: {
    type: String,
    default: '刷新中...'
  },
  successText: {
    type: String,
    default: '刷新完成'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  onRefresh: {
    type: Function,
    required: true
  }
})

const loading = ref(false)
const refreshSuccess = ref(false)
const isTransitioning = ref(false)

const handleClick = async () => {
  if (loading.value || props.disabled) return

  loading.value = true
  refreshSuccess.value = false
  isTransitioning.value = false

  try {
    await props.onRefresh()

    // 刷新完成，立即结束 loading 状态
    loading.value = false

    // 显示刷新完成状态
    refreshSuccess.value = true

    // 2秒后开始过渡
    setTimeout(() => {
      isTransitioning.value = true
    }, 2000)

    // 2.5秒后恢复初始状态
    setTimeout(() => {
      refreshSuccess.value = false
      isTransitioning.value = false
    }, 2500)
  } catch (error) {
    console.error('Refresh error:', error)
    loading.value = false
  }
}
</script>

<style scoped>
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  position: relative;
  overflow: hidden;
}

.refresh-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.refresh-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.refresh-btn:active:not(:disabled) {
  transform: translateY(0);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.refresh-btn.success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  animation: successPulse 0.6s ease-out;
}

.refresh-btn.success:hover:not(:disabled) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.refresh-btn.success:hover:not(:disabled) .check-icon {
  transform: none !important;
}

.refresh-btn.transitioning {
  animation: fadeOutToBlue 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.refresh-btn svg.spinning {
  animation: spin 1s linear infinite;
}

.check-icon {
  animation: checkIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes checkIn {
  0% {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes successPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes fadeOutToBlue {
  to {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
}

.icon-fade-enter-active,
.icon-fade-leave-active,
.text-fade-enter-active,
.text-fade-leave-active {
  transition: all 0.2s ease;
}

.icon-fade-enter-from,
.text-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.icon-fade-leave-to,
.text-fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>

