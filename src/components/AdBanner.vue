<template>
  <div class="ad-banner" :class="`ad-${position}`">
    <div class="ad-content">
      <div class="ad-label">广告位</div>
      <div class="ad-placeholder">
        <div class="ad-icon">📢</div>
        <p>{{ adText }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  position: {
    type: String,
    default: 'side', // 'top', 'side', 'bottom'
  }
})

const adText = computed(() => {
  const texts = {
    top: '300x250 广告位',
    side: '300x600 侧边栏广告',
    bottom: '728x90 横幅广告'
  }
  return texts[props.position] || '广告位预留'
})
</script>

<style scoped>
.ad-banner {
  background: var(--card);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.ad-content {
  position: relative;
}

.ad-label {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 0.7rem;
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 1;
}

.ad-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  background: var(--muted);
  border: 2px dashed var(--border);
  color: var(--text-sub);
  text-align: center;
}

.ad-icon {
  font-size: 2.5rem;
  opacity: 0.3;
}

.ad-top .ad-placeholder {
  min-height: 250px;
}

.ad-side .ad-placeholder {
  min-height: 400px;
}

.ad-bottom .ad-placeholder {
  min-height: 90px;
}

@media (max-width: 1024px) {
  .ad-side .ad-placeholder {
    min-height: 250px;
  }
}

@media (max-width: 768px) {
  .ad-banner {
    display: none;
  }
}
</style>

