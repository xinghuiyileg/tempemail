<template>
  <button
    class="icon-btn"
    :class="[variant, size, { loading, pulse }]"
    :disabled="disabled || loading"
    @click="handleClick"
    :title="title"
    :aria-label="ariaLabel || title"
  >
    <span class="icon-wrapper" :class="{ rotate: loading || rotating }">
      <slot name="icon">
        <svg v-if="icon" :viewBox="iconData.viewBox || '0 0 24 24'" class="icon-svg">
          <path :d="iconData.path" fill="currentColor" />
        </svg>
      </slot>
    </span>
    <span v-if="$slots.default" class="btn-text">
      <slot></slot>
    </span>
    <span v-if="loading" class="loading-spinner"></span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'secondary', // primary, secondary, danger, success, ghost
    validator: v => ['primary', 'secondary', 'danger', 'success', 'ghost'].includes(v)
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  loading: Boolean,
  disabled: Boolean,
  pulse: Boolean,
  rotating: Boolean,
  title: String,
  ariaLabel: String
})

const emit = defineEmits(['click'])

// SVG 图标库
const icons = {
  copy: {
    viewBox: '0 0 24 24',
    path: 'M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z'
  },
  trash: {
    viewBox: '0 0 24 24',
    path: 'M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1v12a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1zm1 2v1h4V4h-4v1zm-3 2v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7H7zm3 3a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1z'
  },
  refresh: {
    viewBox: '0 0 24 24',
    path: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z'
  },
  clean: {
    viewBox: '0 0 24 24',
    path: 'M19.36 2.72l1.42 1.42-5.72 5.71c1.07 1.54 1.22 3.39.32 4.59L9.06 8.12c1.2-.9 3.05-.75 4.59.32l5.71-5.72M5.93 17.57c-2.01-2.01-3.24-4.41-3.58-6.65l4.88-2.09 7.44 7.44-2.09 4.88c-2.24-.34-4.64-1.57-6.65-3.58z'
  },
  add: {
    viewBox: '0 0 24 24',
    path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'
  },
  check: {
    viewBox: '0 0 24 24',
    path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z'
  },
  close: {
    viewBox: '0 0 24 24',
    path: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z'
  },
  settings: {
    viewBox: '0 0 24 24',
    path: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z'
  },
  email: {
    viewBox: '0 0 24 24',
    path: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'
  },
  download: {
    viewBox: '0 0 24 24',
    path: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'
  }
}

const iconData = computed(() => icons[props.icon] || {})

const handleClick = (e) => {
  if (!props.disabled && !props.loading) {
    // 添加涟漪效果
    const btn = e.currentTarget
    const ripple = document.createElement('span')
    ripple.className = 'ripple-effect'
    
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    
    ripple.style.width = ripple.style.height = size + 'px'
    ripple.style.left = x + 'px'
    ripple.style.top = y + 'px'
    
    btn.appendChild(ripple)
    
    setTimeout(() => ripple.remove(), 600)
    
    emit('click', e)
  }
}
</script>

<style scoped>
.icon-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;
  white-space: nowrap;
}

/* 尺寸变体 */
.icon-btn.sm {
  padding: 6px 12px;
  font-size: 0.85rem;
  border-radius: 8px;
}

.icon-btn.sm .icon-svg {
  width: 16px;
  height: 16px;
}

.icon-btn.lg {
  padding: 14px 20px;
  font-size: 1rem;
  border-radius: 12px;
}

.icon-btn.lg .icon-svg {
  width: 22px;
  height: 22px;
}

/* 只有图标的按钮 */
.icon-btn:not(:has(.btn-text)) {
  padding: 10px;
  aspect-ratio: 1;
}

.icon-btn.sm:not(:has(.btn-text)) {
  padding: 8px;
}

.icon-btn.lg:not(:has(.btn-text)) {
  padding: 12px;
}

/* 图标包装器 */
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-svg {
  width: 18px;
  height: 18px;
  transition: all 0.3s ease;
}

/* 颜色变体 */
.icon-btn.primary {
  background: linear-gradient(135deg, #6c7bff 0%, #8a5df6 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(108, 123, 255, 0.25);
}

.icon-btn.primary:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(108, 123, 255, 0.4);
  transform: translateY(-2px);
}

.icon-btn.primary:active:not(:disabled) {
  transform: translateY(0);
}

.icon-btn.secondary {
  background: #f6f7fb;
  color: #4a5568;
  border: 1px solid #e6e8f0;
}

.icon-btn.secondary:hover:not(:disabled) {
  background: #eef0f5;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.icon-btn.danger {
  background: linear-gradient(135deg, #f03e3e 0%, #dc2626 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(240, 62, 62, 0.25);
}

.icon-btn.danger:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(240, 62, 62, 0.4);
  transform: translateY(-2px);
}

.icon-btn.success {
  background: linear-gradient(135deg, #2f9e44 0%, #10b981 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(47, 158, 68, 0.25);
}

.icon-btn.success:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(47, 158, 68, 0.4);
  transform: translateY(-2px);
}

.icon-btn.ghost {
  background: transparent;
  color: #4a5568;
  border: 1px solid #e6e8f0;
}

.icon-btn.ghost:hover:not(:disabled) {
  background: #f6f7fb;
  border-color: #d1d5db;
}

/* 悬停效果 - 图标放大 */
.icon-btn:hover:not(:disabled) .icon-wrapper {
  transform: scale(1.1);
}

/* 特殊图标悬停效果 */
.icon-btn:hover:not(:disabled):has([data-icon="trash"]) .icon-wrapper {
  transform: scale(1.1) rotate(5deg);
}

.icon-btn:hover:not(:disabled):has([data-icon="refresh"]) .icon-wrapper {
  transform: rotate(90deg);
}

/* 旋转动画 */
.icon-wrapper.rotate {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 脉冲效果 */
.icon-btn.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 禁用状态 */
.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* 加载状态 */
.icon-btn.loading {
  pointer-events: none;
}

.loading-spinner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* 涟漪效果 */
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple-animation {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* 活跃状态微动画 */
.icon-btn:active:not(:disabled) {
  transform: scale(0.96);
}

/* 聚焦状态（键盘导航） */
.icon-btn:focus-visible {
  outline: 2px solid #6c7bff;
  outline-offset: 2px;
}

/* 按钮文本 */
.btn-text {
  font-weight: 600;
  letter-spacing: 0.01em;
}

/* 暗色模式适配 */
@media (prefers-color-scheme: dark) {
  .icon-btn.secondary {
    background: #1a1d24;
    color: #e9edf1;
    border-color: #232a34;
  }
  
  .icon-btn.secondary:hover:not(:disabled) {
    background: #252a34;
    border-color: #3a4354;
  }
  
  .icon-btn.ghost {
    background: transparent;
    color: #e9edf1;
    border-color: #232a34;
  }
  
  .icon-btn.ghost:hover:not(:disabled) {
    background: #1a1d24;
    border-color: #3a4354;
  }
}
</style>

