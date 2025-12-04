<template>
  <div class="skeleton-loader" :class="variant">
    <!-- 邮箱列表骨架屏 -->
    <div v-if="type === 'email-list'" class="skeleton-email-list">
      <div v-for="i in count" :key="i" class="skeleton-email-item">
        <div class="skeleton-checkbox"></div>
        <div class="skeleton-content">
          <div class="skeleton-email-address"></div>
          <div class="skeleton-meta">
            <div class="skeleton-count"></div>
            <div class="skeleton-time"></div>
          </div>
        </div>
        <div class="skeleton-star"></div>
      </div>
    </div>

    <!-- 邮件列表骨架屏 -->
    <div v-else-if="type === 'message-list'" class="skeleton-message-list">
      <div v-for="i in count" :key="i" class="skeleton-message-item">
        <div class="skeleton-checkbox"></div>
        <div class="skeleton-content">
          <div class="skeleton-header">
            <div class="skeleton-sender"></div>
            <div class="skeleton-time"></div>
          </div>
          <div class="skeleton-subject"></div>
          <div class="skeleton-preview"></div>
        </div>
      </div>
    </div>

    <!-- 统计卡片骨架屏 -->
    <div v-else-if="type === 'stats-card'" class="skeleton-stats-card">
      <div class="skeleton-card-icon"></div>
      <div class="skeleton-card-content">
        <div class="skeleton-card-label"></div>
        <div class="skeleton-card-value"></div>
      </div>
    </div>

    <!-- 用户列表骨架屏 -->
    <div v-else-if="type === 'user-list'" class="skeleton-user-list">
      <div v-for="i in count" :key="i" class="skeleton-user-item">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-username"></div>
        <div class="skeleton-role"></div>
        <div class="skeleton-status"></div>
        <div class="skeleton-time"></div>
        <div class="skeleton-actions"></div>
      </div>
    </div>

    <!-- 发送历史骨架屏 -->
    <div v-else-if="type === 'sent-list'" class="skeleton-sent-list">
      <div v-for="i in count" :key="i" class="skeleton-sent-item">
        <div class="skeleton-from"></div>
        <div class="skeleton-to"></div>
        <div class="skeleton-subject"></div>
        <div class="skeleton-time"></div>
      </div>
    </div>

    <!-- 通用骨架屏 -->
    <div v-else class="skeleton-generic">
      <div v-for="i in count" :key="i" class="skeleton-line"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'generic',
    validator: (value) => ['email-list', 'message-list', 'stats-card', 'user-list', 'sent-list', 'generic'].includes(value)
  },
  count: {
    type: Number,
    default: 3
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'compact'].includes(value)
  }
})
</script>

<style scoped>
/* 骨架屏基础样式 */
.skeleton-loader {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 骨架屏元素通用样式 */
.skeleton-loader [class^="skeleton-"] {
  background: linear-gradient(
    90deg,
    var(--skeleton-base, #e0e0e0) 25%,
    var(--skeleton-highlight, #f0f0f0) 50%,
    var(--skeleton-base, #e0e0e0) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 邮箱列表骨架屏 */
.skeleton-email-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-email-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.skeleton-checkbox {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-email-address {
  height: 18px;
  width: 60%;
}

.skeleton-meta {
  display: flex;
  gap: 12px;
}

.skeleton-count {
  height: 14px;
  width: 60px;
}

.skeleton-time {
  height: 14px;
  width: 80px;
}

.skeleton-star {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* 邮件列表骨架屏 */
.skeleton-message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-message-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.skeleton-sender {
  height: 16px;
  width: 150px;
}

.skeleton-subject {
  height: 18px;
  width: 80%;
  margin-bottom: 6px;
}

.skeleton-preview {
  height: 14px;
  width: 90%;
}

/* 统计卡片骨架屏 */
.skeleton-stats-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: 16px;
  border: 1px solid var(--border);
}

.skeleton-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
}

.skeleton-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-card-label {
  height: 14px;
  width: 80px;
}

.skeleton-card-value {
  height: 28px;
  width: 60px;
}

/* 用户列表骨架屏 */
.skeleton-user-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-user-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-username {
  height: 18px;
  width: 120px;
}

.skeleton-role {
  height: 24px;
  width: 60px;
  border-radius: 12px;
}

.skeleton-status {
  height: 24px;
  width: 60px;
  border-radius: 12px;
}

.skeleton-actions {
  height: 32px;
  width: 100px;
  margin-left: auto;
}

/* 发送历史骨架屏 */
.skeleton-sent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-sent-item {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.skeleton-from,
.skeleton-to {
  height: 16px;
  width: 90%;
}

.skeleton-subject {
  height: 16px;
  width: 80%;
}

/* 通用骨架屏 */
.skeleton-generic {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-line {
  height: 20px;
  width: 100%;
}

.skeleton-line:nth-child(2n) {
  width: 80%;
}

/* 紧凑模式 */
.skeleton-loader.compact .skeleton-email-item,
.skeleton-loader.compact .skeleton-message-item,
.skeleton-loader.compact .skeleton-user-item {
  padding: 12px;
}

/* 暗色主题适配 */
:root[data-theme="dark"] .skeleton-loader [class^="skeleton-"] {
  --skeleton-base: #2a2a2a;
  --skeleton-highlight: #3a3a3a;
}
</style>

