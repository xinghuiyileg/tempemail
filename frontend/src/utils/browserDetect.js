/**
 * 浏览器检测工具
 * 用于针对不同浏览器应用不同的优化策略
 */

/**
 * 检测是否为 Edge 浏览器
 * @returns {boolean}
 */
export function isEdge() {
  return /Edg/i.test(navigator.userAgent)
}

/**
 * 检测是否为 Chrome 浏览器（不包括 Edge）
 * @returns {boolean}
 */
export function isChrome() {
  return /Chrome/i.test(navigator.userAgent) && !/Edg/i.test(navigator.userAgent)
}

/**
 * 检测是否为 Firefox 浏览器
 * @returns {boolean}
 */
export function isFirefox() {
  return /Firefox/i.test(navigator.userAgent)
}

/**
 * 检测是否为 Safari 浏览器
 * @returns {boolean}
 */
export function isSafari() {
  return /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)
}

/**
 * 检测是否为移动设备
 * @returns {boolean}
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 获取浏览器信息
 * @returns {Object} 浏览器信息对象
 */
export function getBrowserInfo() {
  return {
    isEdge: isEdge(),
    isChrome: isChrome(),
    isFirefox: isFirefox(),
    isSafari: isSafari(),
    isMobile: isMobile(),
    userAgent: navigator.userAgent
  }
}

/**
 * 应用浏览器特定的性能优化
 */
export function applyBrowserOptimizations() {
  const info = getBrowserInfo()
  
  console.log('🌐 浏览器信息:', info)
  
  // Edge 浏览器优化：降低或禁用 blur 动画
  if (info.isEdge) {
    console.log('🎯 检测到 Edge 浏览器，应用性能优化...')
    applyEdgeOptimizations()
  }
  
  // Firefox 优化
  if (info.isFirefox) {
    console.log('🦊 检测到 Firefox 浏览器，应用性能优化...')
    applyFirefoxOptimizations()
  }
  
  // 移动设备优化
  if (info.isMobile) {
    console.log('📱 检测到移动设备，应用性能优化...')
    applyMobileOptimizations()
  }
}

/**
 * Edge 浏览器专属优化
 * 主要问题：blur 滤镜 + 动画性能差
 */
function applyEdgeOptimizations() {
  const style = document.createElement('style')
  style.id = 'edge-optimizations'
  style.textContent = `
    /* Edge 浏览器：性能优化 - 移除blur和复杂动画，保留基本过渡 */
    
    /* Edge 性能优化：静态背景（禁用动画和blur） */
    body::before {
      filter: none !important;
      background: radial-gradient(circle at 30% 30%, 
        rgba(255, 105, 180, 0.15) 0%, 
        rgba(255, 182, 203, 0.08) 40%, 
        transparent 70%) !important;
      animation: none !important;
      opacity: 0.7 !important;
      will-change: auto !important;
    }
    
    body::after {
      filter: none !important;
      background: radial-gradient(circle at 70% 70%, 
        rgba(138, 92, 246, 0.18) 0%, 
        rgba(167, 139, 250, 0.1) 40%, 
        transparent 70%) !important;
      animation: none !important;
      opacity: 0.7 !important;
      will-change: auto !important;
    }
    
    .app-container::before {
      filter: none !important;
      background: radial-gradient(circle at 50% 50%, 
        rgba(59, 130, 246, 0.12) 0%, 
        rgba(96, 165, 250, 0.08) 40%, 
        transparent 70%) !important;
      animation: none !important;
      opacity: 0.7 !important;
      will-change: auto !important;
    }
    
    /* 登录页面：用渐变替代 blur，禁用动画 */
    .gradient-blob {
      filter: none !important;
      animation: none !important;
      opacity: 0.6 !important;
      will-change: auto !important;
    }
    
    .gradient-blob-1 {
      background: radial-gradient(circle, 
        rgba(168, 85, 247, 0.3) 0%, 
        rgba(147, 51, 234, 0.18) 30%, 
        rgba(126, 34, 206, 0.08) 50%,
        transparent 70%) !important;
    }
    
    .gradient-blob-2 {
      background: radial-gradient(circle, 
        rgba(59, 130, 246, 0.3) 0%, 
        rgba(37, 99, 235, 0.18) 30%, 
        rgba(29, 78, 216, 0.08) 50%,
        transparent 70%) !important;
    }
    
    .gradient-blob-3 {
      background: radial-gradient(circle, 
        rgba(236, 72, 153, 0.25) 0%, 
        rgba(219, 39, 119, 0.15) 30%, 
        rgba(190, 24, 93, 0.08) 50%,
        transparent 70%) !important;
    }
    
    /* Edge性能平衡优化 - 保留基本视觉效果 */
    
    /* 移除毛玻璃效果，但保留半透明背景 */
    .card {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      background: rgba(255, 255, 255, 0.92) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    }
    
    .sidebar {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      background: rgba(255, 255, 255, 0.95) !important;
    }
    
    /* 侧边栏选中状态对比度增强 */
    .nav-item.active {
      background: rgba(99, 102, 241, 0.2) !important;
      color: #4f46e5 !important;
    }
    
    .nav-item:hover {
      background: rgba(99, 102, 241, 0.12) !important;
    }
    
    .modal-overlay,
    .user-manager-overlay {
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      background: rgba(0, 0, 0, 0.5) !important;
    }
    
    /* 保留快速过渡，但缩短时间 */
    * {
      transition-duration: 0.15s !important;
      transition-timing-function: ease !important;
    }
    
    /* 禁用复杂的keyframe动画 */
    @keyframes blob1Move,
    @keyframes blob2Move,
    @keyframes breathe,
    @keyframes starPulse,
    @keyframes pulse {
      0%, 100% { 
        transform: none !important;
        opacity: 1 !important;
      }
    }
    
    /* 禁用背景动画但保留渐变 */
    body::before,
    body::after,
    .app-container::before {
      animation: none !important;
      will-change: auto !important;
    }
    
    /* 禁用复杂的transform，但保留简单的hover效果 */
    .email-item:hover,
    .message-item:hover,
    .history-item:hover {
      transform: none !important;
    }
    
    /* 保留按钮的hover效果，但简化 */
    .btn:hover:not(:disabled),
    .btn-primary:hover:not(:disabled),
    .pagination-btn:hover:not(:disabled) {
      transform: translateY(-1px) !important;
      transition: all 0.15s ease !important;
    }
    
    /* 保留卡片阴影，但减少层数 */
    .modal-content,
    .user-manager-card {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
    }
    
    /* 保留渐变背景（性能影响小） */
    .btn-primary,
    .nav-item.active {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
    }
    
    /* 禁用呼吸动画 */
    .brand-logo,
    .badge-icon {
      animation: none !important;
    }
    
    /* 监控统计页面性能优化 */
    .stats-page .line-chart svg,
    .stats-page .pie-chart svg,
    .stats-page .bar-chart svg {
      will-change: auto !important;
      transform: translateZ(0);
    }
    
    /* 简化图表渲染 */
    .stats-page .line-chart path,
    .stats-page .bar-chart rect,
    .stats-page .pie-chart path {
      shape-rendering: optimizeSpeed !important;
    }
    
    /* 隐藏图表渐变填充，使用纯色 */
    .stats-page .area-fill {
      fill: rgba(99, 102, 241, 0.1) !important;
      fill-opacity: 1 !important;
    }
    
    /* 简化网格线 */
    .stats-page svg line[stroke="#cbd5e1"],
    .stats-page svg line[stroke="#e2e8f0"] {
      stroke-opacity: 0.5 !important;
      stroke-width: 1 !important;
    }
    
    /* 禁用图表元素的过渡效果 */
    .stats-page svg * {
      transition: none !important;
      animation: none !important;
    }
    
    /* 禁用图表文字的抗锯齿 */
    .stats-page svg text {
      text-rendering: optimizeSpeed !important;
      shape-rendering: crispEdges !important;
    }
    
    /* 降低饼图的圆滑度 */
    .stats-page .pie-chart path {
      stroke-width: 1 !important;
    }
    
    /* 简化统计卡片样式 */
    .stat-card {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
    }
    
    /* 禁用图表悬停效果 */
    .stats-page .chart-card:hover {
      transform: none !important;
    }
    
    /* 简化图表容器 */
    .chart-card {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) !important;
    }
    
    /* 减少图表数据点 - 通过隐藏部分装饰元素 */
    .stats-page svg circle[r="4"],
    .stats-page svg circle[r="3"] {
      display: none;
    }
    
    /* 移除图表阴影和滤镜效果 */
    .stats-page svg filter,
    .stats-page svg feGaussianBlur,
    .stats-page svg feDropShadow {
      display: none;
    }
    
    /* 降低饼图标签的渲染成本 */
    .distribution-legend {
      opacity: 0.9;
    }
  `
  document.head.appendChild(style)
  
  // 在 body 添加标识
  document.body.classList.add('browser-edge')
  document.body.setAttribute('data-optimized', 'edge-performance')
  
  console.log('⚡ Edge 性能优化：移除blur动画，保留基本过渡效果')
}

/**
 * Firefox 浏览器专属优化
 */
function applyFirefoxOptimizations() {
  const style = document.createElement('style')
  style.id = 'firefox-optimizations'
  style.textContent = `
    /* Firefox 对 backdrop-filter 支持较差 */
    .card {
      backdrop-filter: none !important;
      background: rgba(255, 255, 255, 0.9) !important;
    }
  `
  document.head.appendChild(style)
  document.body.classList.add('browser-firefox')
}

/**
 * 移动设备专属优化
 */
function applyMobileOptimizations() {
  const style = document.createElement('style')
  style.id = 'mobile-optimizations'
  style.textContent = `
    /* 移动设备：禁用所有背景动画 */
    body::before,
    body::after,
    .app-container::before {
      animation: none !important;
      opacity: 0.3 !important;
    }
    
    /* 简化阴影 */
    .card {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* 禁用悬停效果 */
    .email-item:hover,
    .message-item:hover,
    .btn:hover {
      transform: none !important;
    }
  `
  document.head.appendChild(style)
  document.body.classList.add('device-mobile')
}

/**
 * 移除浏览器优化
 */
export function removeBrowserOptimizations() {
  const styles = [
    'edge-optimizations',
    'firefox-optimizations',
    'mobile-optimizations'
  ]
  
  styles.forEach(id => {
    const element = document.getElementById(id)
    if (element) {
      element.remove()
    }
  })
  
  document.body.classList.remove('browser-edge', 'browser-firefox', 'device-mobile')
  document.body.removeAttribute('data-optimized')
}

// 页面加载时自动应用优化
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBrowserOptimizations)
  } else {
    applyBrowserOptimizations()
  }
}

