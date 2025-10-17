<template>
  <div class="card">
    <div class="card-header">
    <div class="actions">
      <div class="email-builder">
        <div class="input-box prefix-input">
          <input v-model="prefix" placeholder="前缀（例如 temp、reg）" />
        </div>
        <span class="at-symbol">@</span>
        <select v-model="selectedDomain" class="domain-select">
          <option v-for="domain in availableDomains" :key="domain" :value="domain">
            {{ domain }}
          </option>
        </select>
      </div>
      <button
        ref="genBtnRef"
        class="btn btn-primary generate-btn"
        @click="onGenerate"
        :disabled="isGenerating"
        :aria-label="isGenerating ? '正在生成...' : '生成新邮箱'"
      >
        <svg v-if="!isGenerating" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition: all 0.3s ease;">
          <path d="M12 5v14m-7-7h14"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <span v-else class="loading-spinner"></span>
        <span>{{ genLabel }}</span>
      </button>
      <button
        v-if="currentEmail"
        class="btn btn-ghost delete-email-btn"
        @click="deleteCurrentEmail"
        title="删除当前邮箱"
        aria-label="删除当前邮箱"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
          <path d="M10 11v6m4-6v6"/>
        </svg>
        <span>删除当前邮箱</span>
      </button>
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useButtonLabel } from '@/composables/useButtonLabel'
import { useEmailStore } from '@/stores/emailStore'
import { useConfigStore } from '@/stores/configStore'
import { useNotification } from '@/composables/useNotification'

const emailStore = useEmailStore()
const configStore = useConfigStore()
const { showNotification } = useNotification()

const isGenerating = ref(false)
const genBtnRef = ref(null)
const { label: genLabel, withFeedback } = useButtonLabel('生成邮箱', { timeoutMs: 900 })
const prefix = ref('')
const selectedDomain = ref('')

const currentEmail = computed(() => emailStore.currentEmail?.email)

// 可用域名列表
const availableDomains = computed(() => {
  const domains = configStore.domainList
  return domains.length > 0 ? domains : ['yourdomain.com']
})

// 初始化选择第一个域名
onMounted(async () => {
  await configStore.loadConfig()
  selectedDomain.value = availableDomains.value[0]
})

const onGenerate = async () => {
  isGenerating.value = true
  try {
    await withFeedback(async () => {
      const params = { domain: selectedDomain.value }
      const cleanPrefix = prefix.value.trim()
      if (cleanPrefix) {
        params.prefix = cleanPrefix
      } else {
        const randomP = generateRandomPrefix()
        prefix.value = randomP
        params.prefix = randomP
      }
      await emailStore.createEmail(params)
      showNotification('邮箱生成成功！', 'success')
    }, { loadingText: '生成中...', successText: '已生成 ✓', buttonRef: genBtnRef })
  } catch (error) {
    showNotification('生成邮箱失败：' + error.message, 'error')
  } finally {
    isGenerating.value = false
  }
}

function generateRandomPrefix() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const length = 6
  let out = ''
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

const copyEmail = async () => {
  if (!currentEmail.value) return
  
  try {
    await navigator.clipboard.writeText(currentEmail.value)
    showNotification('已复制邮箱地址到剪贴板', 'success')
  } catch (error) {
    showNotification('复制失败', 'error')
  }
}

const deleteCurrentEmail = async () => {
  if (!confirm('确认删除当前邮箱？邮件将被清空。')) return
  
  try {
    await emailStore.deleteEmail(emailStore.currentEmail.id)
    showNotification('邮箱已删除', 'success')
  } catch (error) {
    showNotification('删除失败：' + error.message, 'error')
  }
}
</script>

<style scoped>
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.email-builder {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 300px;
}

.prefix-input {
  flex: 1;
  min-width: 120px;
}

.prefix-input input {
  width: 100%;
}

.at-symbol {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-main);
}

.domain-select {
  flex: 1.2;
  min-width: 150px;
  padding: 10px 12px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  color: var(--text-main);
  background: var(--card);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
}

.domain-select:focus {
  outline: none;
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(108, 123, 255, 0.1);
}

.domain-select:hover {
  border-color: var(--brand);
}

@media (max-width: 768px) {
  .actions {
    width: 100%;
  }
  
  .email-builder {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .actions .btn {
    flex: 1;
  }
}
</style>

