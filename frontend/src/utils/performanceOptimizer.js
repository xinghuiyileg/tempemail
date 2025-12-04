/**
 * 性能优化工具
 * 检测设备性能并自动调整设置
 */

/**
 * 检测设备性能级别
 * @returns {'high'|'medium'|'low'} 性能级别
 */
export function detectPerformanceLevel() {
  // 检查硬件并发数（CPU核心数）
  const cores = navigator.hardwareConcurrency || 2
  
  // 检查内存（如果可用）
  const memory = navigator.deviceMemory || 4
  
  // 检查是否是移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // 综合判断
  if (cores >= 8 && memory >= 8 && !isMobile) {
    return 'high'
  } else if (cores >= 4 && memory >= 4) {
    return 'medium'
  } else {
    return 'low'
  }
}

/**
 * 获取性能配置
 * @returns {Object} 性能配置对象
 */
export function getPerformanceConfig() {
  const level = detectPerformanceLevel()
  const savedLevel = localStorage.getItem('performance-level') || level
  
  const configs = {
    high: {
      enableAnimations: true,
      enableBackgroundBlobs: true,
      autoRefreshInterval: 30000, // 30秒
      cacheSize: 200,
      renderBatchSize: 50
    },
    medium: {
      enableAnimations: true,
      enableBackgroundBlobs: true,
      autoRefreshInterval: 60000, // 60秒
      cacheSize: 100,
      renderBatchSize: 30
    },
    low: {
      enableAnimations: false,
      enableBackgroundBlobs: false,
      autoRefreshInterval: 120000, // 2分钟
      cacheSize: 50,
      renderBatchSize: 20
    }
  }
  
  return {
    level: savedLevel,
    ...configs[savedLevel]
  }
}

/**
 * 设置性能级别
 * @param {'high'|'medium'|'low'|'auto'} level 性能级别
 */
export function setPerformanceLevel(level) {
  if (level === 'auto') {
    level = detectPerformanceLevel()
  }
  localStorage.setItem('performance-level', level)
  
  // 触发性能配置更新事件
  window.dispatchEvent(new CustomEvent('performance-config-changed', {
    detail: getPerformanceConfig()
  }))
}

/**
 * 禁用背景动画（低性能模式）
 */
export function disableBackgroundAnimations() {
  const style = document.createElement('style')
  style.id = 'performance-optimize-style'
  style.textContent = `
    /* 禁用背景动画 */
    body::before,
    body::after,
    .app-container::before {
      animation: none !important;
    }
    
    /* 简化卡片阴影 */
    .card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    }
    
    /* 禁用悬停动画 */
    .email-item:hover,
    .message-item:hover {
      transform: none !important;
    }
    
    /* 禁用加载动画 */
    .loading-spinner {
      border-top-color: var(--brand) !important;
      animation: none !important;
    }
  `
  document.head.appendChild(style)
}

/**
 * 启用背景动画
 */
export function enableBackgroundAnimations() {
  const style = document.getElementById('performance-optimize-style')
  if (style) {
    style.remove()
  }
}

/**
 * 应用性能优化
 */
export function applyPerformanceOptimizations() {
  const config = getPerformanceConfig()
  
  console.log('🚀 性能配置:', config)
  
  // 根据配置应用优化
  if (!config.enableBackgroundBlobs) {
    disableBackgroundAnimations()
  } else {
    enableBackgroundAnimations()
  }
  
  // 设置到全局配置
  window.__PERFORMANCE_CONFIG__ = config
  
  return config
}

/**
 * 监控性能指标
 */
export function monitorPerformance() {
  if (!window.performance || !window.performance.getEntriesByType) {
    return null
  }
  
  const perfData = {
    // 页面加载时间
    loadTime: 0,
    // DOM 解析时间
    domParseTime: 0,
    // 资源加载时间
    resourceLoadTime: 0,
    // 首次内容绘制
    fcp: 0,
    // 最大内容绘制
    lcp: 0
  }
  
  // 获取导航计时
  const navTiming = performance.getEntriesByType('navigation')[0]
  if (navTiming) {
    perfData.loadTime = navTiming.loadEventEnd - navTiming.fetchStart
    perfData.domParseTime = navTiming.domComplete - navTiming.domLoading
    perfData.resourceLoadTime = navTiming.loadEventEnd - navTiming.responseEnd
  }
  
  // 获取绘制计时
  const paintEntries = performance.getEntriesByType('paint')
  const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
  if (fcpEntry) {
    perfData.fcp = fcpEntry.startTime
  }
  
  // LCP需要Performance Observer
  if ('PerformanceObserver' in window) {
    try {
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        perfData.lcp = lastEntry.renderTime || lastEntry.loadTime
      })
      po.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // 忽略错误
    }
  }
  
  return perfData
}

/**
 * 节流函数
 * @param {Function} func 要节流的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, wait) {
  let timeout = null
  let previous = 0
  
  return function(...args) {
    const now = Date.now()
    const remaining = wait - (now - previous)
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * 防抖函数
 * @param {Function} func 要防抖的函数
 * @param {number} wait 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout = null
  
  return function(...args) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

// 自动应用性能优化
if (typeof window !== 'undefined') {
  // 页面加载完成后应用优化
  if (document.readyState === 'complete') {
    applyPerformanceOptimizations()
  } else {
    window.addEventListener('load', applyPerformanceOptimizations)
  }
}


