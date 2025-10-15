import { ref } from 'vue'

export function useButtonLabel(defaultText, options = {}) {
  const label = ref(defaultText)
  const timeoutMs = options.timeoutMs ?? 900

  const setTemp = (text, resetTo = defaultText, extra = () => {}) => {
    label.value = text
    const t = setTimeout(() => {
      label.value = resetTo
      extra()
      clearTimeout(t)
    }, timeoutMs)
  }

  const withFeedback = async (action, cfg = {}) => {
    const loadingText = cfg.loadingText ?? '处理中...'
    const successText = cfg.successText ?? '完成 ✓'
    const errorText = cfg.errorText ?? '失败'
    const onSuccess = cfg.onSuccess
    const onError = cfg.onError
    const el = cfg.buttonRef?.value

    try {
      label.value = loadingText
      if (el) el.disabled = true
      await action()
      if (el) {
        el.classList.add('success-anim')
      }
      setTemp(successText, defaultText, () => {
        if (el) {
          el.classList.remove('success-anim')
          el.disabled = false
        }
        if (onSuccess) onSuccess()
      })
    } catch (e) {
      setTemp(errorText, defaultText, () => {
        if (el) el.disabled = false
        if (onError) onError(e)
      })
      throw e
    }
  }

  return { label, withFeedback }
}


