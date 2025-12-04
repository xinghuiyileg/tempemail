import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/css/main.css'

// 浏览器性能优化（自动检测并应用）
import './utils/browserDetect.js'
import './utils/performanceOptimizer.js'
import './utils/performanceMonitor.js' // 实时性能监控

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

