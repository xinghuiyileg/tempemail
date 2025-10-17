# 📱 临时邮箱系统 - 前端开发文档

## 📋 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心功能](#核心功能)
- [组件说明](#组件说明)
- [状态管理](#状态管理)
- [开发指南](#开发指南)
- [构建部署](#构建部署)

## 🛠️ 技术栈

### 核心框架
- **Vue 3.4+** - 渐进式 JavaScript 框架
- **Vite 5.0+** - 下一代前端构建工具
- **Pinia 2.1+** - Vue 3 官方状态管理库

### 主要依赖
- **Axios 1.6+** - HTTP 客户端，用于 API 请求
- **Day.js 1.11+** - 轻量级日期时间处理库

### 开发工具
- **@vitejs/plugin-vue** - Vue 3 单文件组件支持
- **Wrangler** - Cloudflare Pages 部署工具

## 📁 项目结构

```
frontend/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── EmailGenerator.vue      # 邮箱生成器
│   │   ├── EmailList.vue          # 邮箱列表
│   │   ├── MessageList.vue        # 邮件列表
│   │   ├── MessageModal.vue       # 邮件详情弹窗
│   │   ├── MonitorStatus.vue      # 监控状态面板
│   │   ├── ConfigModal.vue        # 系统配置弹窗
│   │   ├── LoginModal.vue         # 登录弹窗
│   │   ├── Notification.vue       # 通知组件
│   │   ├── IconButton.vue         # 图标按钮
│   │   └── AdBanner.vue           # 广告位组件
│   │
│   ├── stores/              # Pinia 状态管理
│   │   ├── emailStore.js          # 邮箱状态
│   │   ├── messageStore.js        # 邮件状态
│   │   ├── monitorStore.js        # 监控状态
│   │   ├── configStore.js         # 配置状态
│   │   ├── authStore.js           # 认证状态
│   │   └── notificationStore.js   # 通知状态
│   │
│   ├── services/            # API 服务
│   │   └── api.js                 # API 封装
│   │
│   ├── composables/         # 组合式函数
│   │   ├── useWebSocket.js        # WebSocket 连接
│   │   ├── useNotification.js     # 通知功能
│   │   └── useButtonLabel.js      # 按钮标签
│   │
│   ├── utils/               # 工具函数
│   │   └── formatTime.js          # 时间格式化
│   │
│   ├── assets/              # 静态资源
│   │   └── css/
│   │       └── main.css           # 全局样式
│   │
│   ├── App.vue              # 根组件
│   └── main.js              # 应用入口
│
├── public/                  # 公共资源
├── index.html              # HTML 模板
├── vite.config.js          # Vite 配置
├── package.json            # 项目配置
└── env.example             # 环境变量示例
```

## ✨ 核心功能

### 1. 临时邮箱管理
- 一键生成临时邮箱地址
- 邮箱列表展示（显示创建时间、邮件数量）
- 单个/批量删除邮箱
- 邮箱地址一键复制

### 2. 邮件管理
- 邮件列表展示（分页、未读标记）
- 邮件详情查看
- 验证码自动提取和高亮
- 验证码一键复制
- 未读/已读状态管理

### 3. 实时通知
- WebSocket 实时连接
- 新邮件推送通知
- Toast 提示消息
- 验证码高亮显示

### 4. 监控状态
- 显示邮箱总数
- 显示邮件总数
- 显示验证码数量
- 最后更新时间

### 5. 访问控制
- 登录认证
- 密码保护
- Token 管理
- 自动登出

### 6. 主题支持
- 明暗主题自动切换
- 适配系统主题
- 流畅的过渡动画

## 🎨 组件说明

### EmailGenerator.vue
**邮箱生成器组件**

功能：
- 生成临时邮箱按钮
- 自动调用 API 创建邮箱
- 自动复制邮箱地址到剪贴板
- 显示加载状态

关键代码：
```javascript
const generateEmail = async () => {
  loading.value = true
  try {
    await emailStore.generateEmail()
    showNotification('邮箱创建成功！', 'success')
  } catch (error) {
    showNotification('创建失败：' + error.message, 'error')
  } finally {
    loading.value = false
  }
}
```

### EmailList.vue
**邮箱列表组件**

功能：
- 显示所有临时邮箱
- 点击邮箱加载对应邮件
- 删除单个邮箱
- 批量删除所有邮箱
- 显示邮箱统计信息

特性：
- 当前选中邮箱高亮
- 显示邮件数量徽章
- 显示创建时间和最后收信时间

### MessageList.vue
**邮件列表组件**

功能：
- 分页显示邮件列表（每页 20 封）
- 显示发件人、主题、时间
- 未读邮件蓝点标记
- 验证码提取和显示
- 邮件详情查看
- 分页控件（首页、上一页、页码、下一页、末页）

分页特性：
- 智能页码显示（超过 7 页时省略）
- 页码跳转
- 总数统计显示

### MessageModal.vue
**邮件详情弹窗**

功能：
- 显示完整邮件内容
- 验证码高亮显示
- 一键复制验证码
- 标记为已读
- HTML 邮件渲染

### MonitorStatus.vue
**监控状态面板**

功能：
- 显示系统统计信息
- 邮箱数量、邮件数量、验证码数量
- 最后更新时间
- 启动/停止监控按钮（预留功能）

### ConfigModal.vue
**系统配置弹窗**

功能：
- 显示 Cloudflare 配置
- API Token 配置
- 域名配置
- 目标邮箱配置
- 保存配置到数据库

### LoginModal.vue
**登录弹窗**

功能：
- 密码输入
- 密码显示/隐藏切换
- 登录提交
- 错误提示
- 回车键提交

### Notification.vue
**通知组件**

功能：
- 全局 Toast 通知
- 成功/错误/警告/信息 四种类型
- 自动消失（3 秒）
- 多条通知队列
- 过渡动画

## 🗄️ 状态管理

### emailStore.js
**邮箱状态管理**

状态：
```javascript
{
  emails: [],           // 邮箱列表
  currentEmail: null,   // 当前选中邮箱
  loading: false        // 加载状态
}
```

方法：
- `loadEmails()` - 加载邮箱列表
- `generateEmail()` - 生成新邮箱
- `deleteEmail(id)` - 删除邮箱
- `deleteAllEmails()` - 删除所有邮箱
- `setCurrentEmail(email)` - 设置当前邮箱

### messageStore.js
**邮件状态管理**

状态：
```javascript
{
  messages: [],         // 邮件列表
  currentPage: 1,       // 当前页码
  totalPages: 1,        // 总页数
  totalCount: 0,        // 邮件总数
  pageSize: 20,         // 每页数量
  selectedMessage: null // 当前查看邮件
}
```

方法：
- `loadMessages(emailId, page)` - 加载邮件列表
- `setPage(page)` - 设置页码
- `markAsRead(messageId)` - 标记为已读
- `setSelectedMessage(message)` - 设置当前邮件

### monitorStore.js
**监控状态管理**

状态：
```javascript
{
  status: {
    emailCount: 0,      // 邮箱数量
    messageCount: 0,    // 邮件数量
    codeCount: 0,       // 验证码数量
    lastUpdate: null    // 最后更新时间
  },
  isRunning: false      // 监控运行状态
}
```

方法：
- `loadStatus()` - 加载监控状态
- `toggleMonitor()` - 启动/停止监控

### authStore.js
**认证状态管理**

状态：
```javascript
{
  token: null,          // 认证令牌
  isAuthenticated: false, // 登录状态
  authEnabled: false    // 是否启用访问控制
}
```

方法：
- `initAuth()` - 初始化认证（从 localStorage 读取）
- `checkAuthStatus()` - 检查是否启用访问控制
- `login(password)` - 登录
- `logout()` - 登出
- `verifyToken()` - 验证令牌

### notificationStore.js
**通知状态管理**

状态：
```javascript
{
  notifications: []     // 通知列表
}
```

方法：
- `addNotification(message, type)` - 添加通知
- `removeNotification(id)` - 移除通知

## 🔌 API 服务

### api.js
**API 封装**

基础配置：
```javascript
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// Axios 实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

认证拦截器：
```javascript
// 请求拦截器：添加 Token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理 401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 清除 token，跳转登录
      localStorage.removeItem('auth_token')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)
```

API 方法：
```javascript
// 邮箱 API
export const emailAPI = {
  list: () => api.get('/emails'),
  create: () => api.post('/emails'),
  delete: (id) => api.delete(`/emails/${id}`)
}

// 邮件 API
export const messageAPI = {
  list: (emailId, page, limit) => 
    api.get(`/emails/${emailId}/messages`, { params: { page, limit } }),
  get: (id) => api.get(`/messages/${id}`),
  markRead: (id) => api.patch(`/messages/${id}/read`)
}

// 监控 API
export const monitorAPI = {
  status: () => api.get('/monitor/status')
}

// 认证 API
export const authAPI = {
  check: () => api.get('/auth/check'),
  login: (password) => api.post('/auth/login', { password }),
  verify: (token) => api.post('/auth/verify', { token }),
  logout: () => api.post('/auth/logout')
}
```

## 🔗 WebSocket

### useWebSocket.js
**WebSocket 组合式函数**

功能：
- 建立 WebSocket 连接
- 自动重连机制
- 处理新邮件推送
- Ping/Pong 心跳

关键代码：
```javascript
export function useWebSocket() {
  let ws = null
  let reconnectTimer = null
  const messageStore = useMessageStore()
  const emailStore = useEmailStore()
  const notificationStore = useNotificationStore()

  const connect = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8787/ws'
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'new_email') {
        // 新邮件通知
        notificationStore.addNotification(
          `新邮件：${data.data.subject}`,
          'info'
        )
        
        // 刷新邮件列表
        if (emailStore.currentEmail) {
          messageStore.loadMessages(emailStore.currentEmail.id)
        }
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting...')
      reconnectTimer = setTimeout(connect, 5000)
    }
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }
    if (ws) {
      ws.close()
    }
  }

  return { connect, disconnect }
}
```

## 🎨 样式系统

### 主题支持
使用 CSS 变量实现明暗主题：

```css
:root {
  --bg: #ffffff;
  --bg-secondary: #f5f7fa;
  --text: #2c3e50;
  --text-secondary: #6c757d;
  --border: #e2e8f0;
  --brand: #6c7bff;
  --success: #10b981;
  --error: #ef4444;
  --warning: #f59e0b;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text: #e5e7eb;
    --text-secondary: #9ca3af;
    --border: #404040;
  }
}
```

### 响应式设计
```css
/* 桌面端 */
@media (min-width: 769px) {
  .two-col {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 20px;
  }
}

/* 移动端 */
@media (max-width: 768px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
```

## 🚀 开发指南

### 环境配置

1. **安装依赖**
   ```bash
   cd frontend
   npm install
   ```

2. **配置环境变量**
   
   创建 `.env` 文件：
   ```env
   VITE_API_BASE=/api
   VITE_WS_URL=ws://localhost:8787/ws
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   
   访问 http://localhost:5173

### 开发流程

1. **创建新组件**
   ```bash
   # 在 src/components/ 目录创建
   touch src/components/NewComponent.vue
   ```

2. **创建新状态**
   ```bash
   # 在 src/stores/ 目录创建
   touch src/stores/newStore.js
   ```

3. **添加 API 方法**
   ```javascript
   // 在 src/services/api.js 中添加
   export const newAPI = {
     list: () => api.get('/new'),
     create: (data) => api.post('/new', data)
   }
   ```

### 代码规范

- 使用 Vue 3 Composition API
- 组件使用 PascalCase 命名
- 使用 `<script setup>` 语法
- 合理使用组合式函数抽象逻辑
- 保持组件单一职责

### 调试技巧

1. **Vue DevTools**
   - 安装 Vue DevTools 浏览器扩展
   - 查看组件树和状态

2. **Network 面板**
   - 查看 API 请求和响应
   - 检查 WebSocket 连接

3. **Console 日志**
   ```javascript
   console.log('Debug:', data)
   ```

## 📦 构建部署

### 本地构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建输出在 `dist/` 目录。

### 部署到 Cloudflare Pages

#### 方法 1：使用 Wrangler

```bash
# 构建
npm run build

# 部署到 Cloudflare Pages
npm run deploy
# 或
npx wrangler pages deploy dist --project-name=tempemail
```

#### 方法 2：Git 集成

1. 将代码推送到 Git 仓库
2. 在 Cloudflare Dashboard 创建 Pages 项目
3. 连接 Git 仓库
4. 配置构建设置：
   - **构建命令**: `npm run build`
   - **构建输出目录**: `dist`
   - **根目录**: `frontend`
5. 触发部署

### 环境变量配置

在 Cloudflare Pages 设置环境变量：

```
VITE_API_BASE=https://your-worker.workers.dev/api
VITE_WS_URL=wss://your-worker.workers.dev/ws
```

## 🔍 性能优化

### 1. 代码分割
Vite 自动进行代码分割，按路由懒加载组件。

### 2. 图片优化
- 使用 WebP 格式
- 懒加载图片
- 使用 CDN

### 3. API 请求优化
- 使用分页减少数据量
- 合理使用缓存
- 防抖和节流

### 4. 状态管理优化
- 避免不必要的响应式数据
- 使用 computed 缓存计算结果
- 及时清理不需要的数据

## 🐛 常见问题

### 1. API 请求失败

**问题**: 无法连接到后端 API

**解决**:
- 检查 `.env` 文件配置
- 确认 Workers 正在运行
- 检查浏览器控制台错误信息
- 验证 CORS 配置

### 2. WebSocket 连接失败

**问题**: 无法建立 WebSocket 连接

**解决**:
- 检查 WebSocket URL 配置
- 确认 Workers 支持 WebSocket
- 查看 Network 面板 WS 连接状态

### 3. 样式显示异常

**问题**: 样式不正确或丢失

**解决**:
- 清除浏览器缓存
- 检查 CSS 变量定义
- 验证主题切换逻辑

## 📚 参考资源

- [Vue 3 官方文档](https://vuejs.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Pinia 官方文档](https://pinia.vuejs.org/)
- [Axios 文档](https://axios-http.com/)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)

---

**版本**: 1.0.0  
**最后更新**: 2025-10-17  
**维护者**: TempEmail Team

