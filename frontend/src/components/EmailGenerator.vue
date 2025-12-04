<template>
  <div class="card">
    <div class="card-header">
      <!-- 模式选择 -->
      <div class="mode-selector">
        <button 
          class="mode-btn" 
          :class="{ active: mode === 'custom' }"
          @click="switchMode('custom')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          自定义前缀
        </button>
        <button 
          class="mode-btn" 
          :class="{ active: mode === 'random' }"
          @click="switchMode('random')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/>
            <path d="M18 2l4 4-4 4M2 6h1.9c1.5 0 2.9.9 3.6 2.2M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/>
            <path d="M18 14l4 4-4 4"/>
          </svg>
          随机生成
        </button>
      </div>

      <!-- 邮箱构建器 -->
      <div class="actions">
        <div class="email-builder">
          <div class="input-box prefix-input">
            <input 
              v-model="prefix" 
              :placeholder="mode === 'custom' ? '输入自定义前缀（如：g9wov5）' : '随机生成的前缀'"
              :readonly="mode === 'random'"
              :class="{ 'readonly-input': mode === 'random' }"
              @input="validatePrefix"
            />
            <span v-if="prefixError" class="error-hint">{{ prefixError }}</span>
          </div>
          <span class="at-symbol">@</span>
          <div class="custom-select" ref="selectRef" @click="toggleDropdown" v-click-outside="closeDropdown">
            <div class="select-trigger">
              <span class="selected-value">{{ selectedDomain }}</span>
              <svg class="select-arrow" :class="{ open: isDropdownOpen }" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
            <Teleport to="body">
              <div 
                v-if="isDropdownOpen" 
                class="select-dropdown"
                :style="dropdownStyle"
              >
                <div 
                  v-for="domain in availableDomains" 
                  :key="domain"
                  class="select-option"
                  :class="{ selected: domain === selectedDomain }"
                  @click="selectDomain(domain)"
                >
                  <span>{{ domain }}</span>
                  <svg v-if="domain === selectedDomain" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
              </div>
            </Teleport>
          </div>
        </div>
        <button
          ref="genBtnRef"
          class="btn btn-primary generate-btn"
          @click="onGenerate"
          :disabled="isGenerating || (mode === 'custom' && !isPrefixValid)"
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
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
const mode = ref('random') // 'custom' | 'random'
const prefixError = ref('')
const isDropdownOpen = ref(false)
const selectRef = ref(null)
const dropdownStyle = ref({})

const currentEmail = computed(() => emailStore.currentEmail?.email)

// 验证前缀是否有效
const isPrefixValid = computed(() => {
  if (mode.value === 'random') return true
  const cleanPrefix = prefix.value.trim()
  if (!cleanPrefix) return false
  // 只允许字母、数字、下划线和连字符
  return /^[a-zA-Z0-9_-]{3,20}$/.test(cleanPrefix)
})

// 可用域名列表
const availableDomains = computed(() => {
  const domains = configStore.domainList
  return domains.length > 0 ? domains : ['yourdomain.com']
})

// 监听域名列表变化，自动更新选中域名
watch(() => configStore.domainList, (newDomains) => {
  if (newDomains.length > 0) {
    // 如果当前选中的域名不在新列表中，自动选择第一个
    if (!newDomains.includes(selectedDomain.value)) {
      selectedDomain.value = newDomains[0]
      console.log('✅ 域名列表已更新，当前域名:', selectedDomain.value)
    }
  }
}, { deep: true })

// 初始化选择第一个域名和随机前缀
onMounted(async () => {
  try {
    await configStore.loadConfig()
    console.log('✅ 配置加载成功')
  } catch (error) {
    console.warn('⚠️ 配置加载失败，使用默认配置', error)
    // 使用默认域名，不中断流程
  }
  
  selectedDomain.value = availableDomains.value[0]
  
  // 随机模式下默认生成一个随机前缀
  if (mode.value === 'random') {
    prefix.value = generateRandomPrefix()
  }
  
  // 监听窗口滚动和resize，重新计算下拉框位置
  window.addEventListener('scroll', updateDropdownPosition)
  window.addEventListener('resize', updateDropdownPosition)
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateDropdownPosition)
  window.removeEventListener('resize', updateDropdownPosition)
})

// 更新下拉框位置
const updateDropdownPosition = () => {
  if (isDropdownOpen.value && selectRef.value) {
    const rect = selectRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 1000
    }
  }
}

// 切换模式
const switchMode = (newMode) => {
  mode.value = newMode
  prefixError.value = ''
  
  if (newMode === 'random') {
    // 切换到随机模式，立即生成随机前缀
    prefix.value = generateRandomPrefix()
  } else {
    // 切换到自定义模式，清空前缀
    prefix.value = ''
  }
}

// 验证前缀输入
const validatePrefix = () => {
  if (mode.value === 'random') return
  
  const cleanPrefix = prefix.value.trim()
  if (!cleanPrefix) {
    prefixError.value = '请输入前缀'
    return
  }
  
  if (cleanPrefix.length < 3) {
    prefixError.value = '前缀至少3个字符'
    return
  }
  
  if (cleanPrefix.length > 20) {
    prefixError.value = '前缀最多20个字符'
    return
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(cleanPrefix)) {
    prefixError.value = '只能包含字母、数字、下划线和连字符'
    return
  }
  
  prefixError.value = ''
}

const onGenerate = async () => {
  // 自定义模式下验证前缀
  if (mode.value === 'custom') {
    validatePrefix()
    if (!isPrefixValid.value) {
      showNotification(prefixError.value || '请输入有效的前缀', 'warning')
      return
    }
  }
  
  isGenerating.value = true
  try {
    await withFeedback(async () => {
      const params = { domain: selectedDomain.value }
      
      if (mode.value === 'custom') {
        // 自定义模式：使用用户输入的前缀，不添加后缀
        params.prefix = prefix.value.trim()
        params.custom = true  // 标记为自定义模式
      } else {
        // 随机模式：生成新的随机前缀
        const randomP = generateRandomPrefix()
        prefix.value = randomP
        params.prefix = randomP
        params.custom = false
      }
      
      await emailStore.createEmail(params)
      showNotification('邮箱生成成功！', 'success')
    }, { loadingText: '生成中...', successText: '已生成 ✓', buttonRef: genBtnRef })
  } catch (error) {
    // 优先使用后端返回的错误消息
    const errorMsg = error.response?.data?.error || error.message || '生成失败'
    showNotification(errorMsg, 'error')
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

// 下拉框相关函数
const toggleDropdown = () => {
  if (!isDropdownOpen.value && selectRef.value) {
    // 计算下拉框位置
    const rect = selectRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      zIndex: 1000
    }
  }
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

const selectDomain = (domain) => {
  selectedDomain.value = domain
  closeDropdown()
}

// 点击外部关闭下拉框指令
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!el.contains(event.target)) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}
</script>

<style scoped>
/* 模式选择器 */
.mode-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 4px;
  background: var(--muted);
  border-radius: 12px;
  width: fit-content;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-sub);
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mode-btn:hover {
  background: rgba(108, 123, 255, 0.1);
  color: var(--text-main);
}

.mode-btn.active {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(108, 123, 255, 0.3);
}

.mode-btn svg {
  flex-shrink: 0;
}

/* 邮箱构建器 */
.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.email-builder {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 300px;
}

.prefix-input {
  flex: 1;
  min-width: 120px;
  position: relative;
}

.prefix-input input {
  width: 100%;
}

.prefix-input input.readonly-input {
  background: var(--muted);
  cursor: not-allowed;
  color: var(--text-sub);
}

.error-hint {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 0.75rem;
  color: #dc3545;
  margin-top: 4px;
  white-space: nowrap;
}

.at-symbol {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text-main);
  margin-top: 10px;
}

/* 自定义下拉框 */
.custom-select {
  flex: 1.2;
  min-width: 150px;
  position: relative;
  user-select: none;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 2px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  color: var(--text-main);
  background: var(--card);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  gap: 8px;
}

.select-trigger:hover {
  border-color: var(--brand);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 123, 255, 0.15);
}

.selected-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-arrow {
  flex-shrink: 0;
  transition: transform 0.3s ease;
  color: var(--brand);
}

.select-arrow.open {
  transform: rotate(180deg);
}

.select-dropdown {
  /* 位置通过内联样式动态设置 */
  background: var(--card);
  border: 2px solid var(--brand);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  overflow-y: auto;
  animation: dropdownSlide 0.2s ease;
  max-height: 300px;
}

/* 下拉框滚动条样式 */
.select-dropdown::-webkit-scrollbar {
  width: 6px;
}

.select-dropdown::-webkit-scrollbar-track {
  background: var(--muted);
  border-radius: 0 10px 10px 0;
}

.select-dropdown::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.select-dropdown::-webkit-scrollbar-thumb:hover {
  background: var(--brand);
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  color: var(--text-main);
  position: relative;
}

.select-option:not(.selected):hover {
  background: rgba(108, 123, 255, 0.1);
  color: var(--brand);
}

.select-option.selected {
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%);
  color: #fff;
}

.select-option.selected:hover {
  background: linear-gradient(135deg, #7a8fff 0%, #8a5fc2 100%);
  color: #fff;
}

.select-option span {
  flex: 1;
}

.select-option svg {
  flex-shrink: 0;
  opacity: 0.9;
}

/* 响应式 */
@media (max-width: 768px) {
  .mode-selector {
    width: 100%;
  }
  
  .mode-btn {
    flex: 1;
    justify-content: center;
  }
  
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

