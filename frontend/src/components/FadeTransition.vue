<template>
  <transition
    :name="transitionName"
    :mode="mode"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
  >
    <slot></slot>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // 过渡类型：fade, slide-fade, scale-fade, list
  type: {
    type: String,
    default: 'fade',
    validator: (value) => ['fade', 'slide-fade', 'scale-fade', 'list'].includes(value)
  },
  // 过渡模式
  mode: {
    type: String,
    default: 'out-in',
    validator: (value) => ['in-out', 'out-in', ''].includes(value)
  },
  // 持续时间（毫秒）
  duration: {
    type: Number,
    default: 300
  },
  // 延迟（毫秒）
  delay: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['before-enter', 'enter', 'after-enter', 'before-leave', 'leave', 'after-leave'])

const transitionName = computed(() => {
  return props.type
})

const onBeforeEnter = (el) => {
  if (props.delay > 0) {
    el.style.transitionDelay = `${props.delay}ms`
  }
  emit('before-enter', el)
}

const onEnter = (el, done) => {
  emit('enter', el, done)
  setTimeout(done, props.duration)
}

const onAfterEnter = (el) => {
  if (props.delay > 0) {
    el.style.transitionDelay = ''
  }
  emit('after-enter', el)
}

const onBeforeLeave = (el) => {
  emit('before-leave', el)
}

const onLeave = (el, done) => {
  emit('leave', el, done)
  setTimeout(done, props.duration)
}

const onAfterLeave = (el) => {
  emit('after-leave', el)
}
</script>

<style scoped>
/* Fade 过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Fade 过渡 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Scale Fade 过渡 */
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.3s ease;
}

.scale-fade-enter-from {
  transform: scale(0.95);
  opacity: 0;
}

.scale-fade-leave-to {
  transform: scale(1.05);
  opacity: 0;
}

/* List 过渡（用于列表项） */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>

