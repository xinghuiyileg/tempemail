/**
 * 实时性能监控器
 * 检测 FPS 并自动应用更激进的优化
 */

let frameCount = 0
let lastTime = performance.now()
let fps = 60
let monitoringActive = false

/**
 * 计算当前 FPS
 */
function measureFPS() {
  frameCount++
  const currentTime = performance.now()
  const elapsed = currentTime - lastTime

  if (elapsed >= 1000) {
    fps = Math.round((frameCount * 1000) / elapsed)
    frameCount = 0
    lastTime = currentTime

    // 不自动启用极限模式，让用户手动选择
    // 只在开发环境显示警告
    if (fps < 30 && import.meta.env.DEV) {
      console.warn(`⚠️ FPS 较低 (${fps})，可手动启用极限模式: window.__performanceMonitor.enableUltraMode()`)
    }

    // 在标题栏显示 FPS（调试用）
    if (import.meta.env.DEV) {
      document.title = `[${fps} FPS] Mail2`
    }
  }

  if (monitoringActive) {
    requestAnimationFrame(measureFPS)
  }
}

/**
 * 启动性能监控
 */
export function startPerformanceMonitoring() {
  if (monitoringActive) return

  monitoringActive = true
  lastTime = performance.now()
  requestAnimationFrame(measureFPS)
  
  console.log('📊 性能监控已启动')
}

/**
 * 停止性能监控
 */
export function stopPerformanceMonitoring() {
  monitoringActive = false
  console.log('📊 性能监控已停止')
}

/**
 * 获取当前 FPS
 */
export function getCurrentFPS() {
  return fps
}

/**
 * 应用极限性能模式（完全禁用所有动画和特效）
 */
export function applyUltraPerformanceMode() {
  if (document.body.classList.contains('ultra-performance-mode')) {
    return // 已经应用
  }

  const style = document.createElement('style')
  style.id = 'ultra-performance-mode'
  style.textContent = `
    /* ===== 极限性能模式 ===== */
    
    /* 完全移除所有背景元素 */
    body::before,
    body::after,
    .app-container::before,
    .gradient-blob {
      display: none !important;
    }
    
    /* 纯色背景 */
    body {
      background: #f5f7fa !important;
    }
    
    /* 完全禁用所有动画 */
    *,
    *::before,
    *::after {
      animation: none !important;
      transition: none !important;
      transform: none !important;
      will-change: auto !important;
    }
    
    /* 移除所有阴影 */
    * {
      box-shadow: none !important;
      text-shadow: none !important;
    }
    
    /* 简化卡片 */
    .card {
      background: #ffffff !important;
      border: 1px solid #e5e7eb !important;
      backdrop-filter: none !important;
    }
    
    /* 移除毛玻璃效果 */
    .login-card,
    .card-header,
    .app-header {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    
    /* 移除所有 filter 效果 */
    * {
      filter: none !important;
      -webkit-filter: none !important;
    }
    
    /* 禁用渐变，使用纯色 */
    .brand-logo {
      background: #6366f1 !important;
    }
    
    /* 简化按钮 */
    .btn,
    .btn-icon,
    .oauth-btn {
      box-shadow: none !important;
      border: 1px solid #d1d5db !important;
    }
    
    /* 移除悬停效果 */
    *:hover {
      transform: none !important;
      box-shadow: none !important;
    }
  `
  document.head.appendChild(style)
  document.body.classList.add('ultra-performance-mode')
  
  console.log('🚀 极限性能模式已启用')
  
  // 显示通知（如果有通知系统）
  showPerformanceNotification()
}

/**
 * 禁用极限性能模式
 */
export function disableUltraPerformanceMode() {
  const style = document.getElementById('ultra-performance-mode')
  if (style) {
    style.remove()
  }
  document.body.classList.remove('ultra-performance-mode')
  console.log('🚀 极限性能模式已禁用')
}

/**
 * 显示性能模式通知
 */
function showPerformanceNotification() {
  // 创建通知元素
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fbbf24;
    color: #78350f;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 320px;
  `
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>⚡</span>
      <div>
        <div style="font-weight: 600; margin-bottom: 4px;">已启用极限性能模式</div>
        <div style="font-size: 12px; opacity: 0.9;">检测到性能问题，已禁用所有动画和特效</div>
      </div>
    </div>
  `
  document.body.appendChild(notification)

  // 5秒后自动消失
  setTimeout(() => {
    notification.style.opacity = '0'
    notification.style.transition = 'opacity 0.3s'
    setTimeout(() => notification.remove(), 300)
  }, 5000)
}

/**
 * 创建性能监控面板（仅开发环境）
 */
export function createPerformancePanel() {
  if (import.meta.env.PROD) return

  const panel = document.createElement('div')
  panel.id = 'performance-panel'
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    min-width: 150px;
  `
  
  setInterval(() => {
    const mode = document.body.classList.contains('ultra-performance-mode') ? '极限' :
                 document.body.classList.contains('browser-edge') ? 'Edge优化' : '标准'
    
    let color = fps >= 55 ? '#10b981' : fps >= 40 ? '#f59e0b' : '#ef4444'
    
    panel.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">性能监控</div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span>FPS:</span>
        <span style="color: ${color}; font-weight: bold;">${fps}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>模式:</span>
        <span style="color: #60a5fa;">${mode}</span>
      </div>
    `
  }, 100)
  
  document.body.appendChild(panel)
}

// 自动启动监控（仅在 Edge 浏览器）
if (typeof window !== 'undefined') {
  const isEdge = /Edg/i.test(navigator.userAgent)
  
  if (isEdge) {
    window.addEventListener('load', () => {
      // 延迟启动，避免影响初始加载
      setTimeout(() => {
        startPerformanceMonitoring()
        
        // 开发环境显示监控面板
        if (import.meta.env.DEV) {
          createPerformancePanel()
        }
      }, 2000)
    })
  }
}

// 导出给控制台调试使用
if (typeof window !== 'undefined') {
  window.__performanceMonitor = {
    start: startPerformanceMonitoring,
    stop: stopPerformanceMonitoring,
    getFPS: getCurrentFPS,
    enableUltraMode: applyUltraPerformanceMode,
    disableUltraMode: disableUltraPerformanceMode,
    createPanel: createPerformancePanel
  }
}

