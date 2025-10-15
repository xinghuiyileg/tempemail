# 📧 临时邮箱系统

基于 Cloudflare 全栈技术的临时邮箱管理系统，支持自动转发、实时监控和验证码提取。

## ✨ 功能特性

### 📧 临时邮箱管理
- ✅ **自动生成**：一键生成格式为 `temp_xxx@yourdomain.com` 的临时邮箱
- ✅ **Cloudflare集成**：自动创建 Email Routing 转发规则
- ✅ **批量管理**：支持创建多个临时邮箱，统一管理
- ✅ **一键复制**：自动复制邮箱地址到剪贴板

### 🔄 智能邮件监控
- ✅ **实时接收**：通过 Cloudflare Email Workers 实时接收邮件
- ✅ **验证码提取**：自动识别并高亮显示验证码（支持20+种格式）
- ✅ **WebSocket推送**：新邮件实时推送到前端
- ✅ **状态显示**：实时显示邮箱和邮件统计信息

### 🎨 现代化界面
- ✅ **Vue 3 + Vite**：快速、响应式的现代前端
- ✅ **Pinia状态管理**：优雅的数据流管理
- ✅ **明暗主题**：自动适配系统主题
- ✅ **响应式设计**：完美支持桌面和移动设备

### 🚀 完全免费部署
- ✅ **Cloudflare Pages**：前端托管（免费）
- ✅ **Cloudflare Workers**：后端API（免费）
- ✅ **Cloudflare D1**：数据库（免费）
- ✅ **Cloudflare Email Routing**：邮件转发（免费）

---

## 📋 技术栈

### 前端
- **框架**：Vue 3 + Vite
- **状态管理**：Pinia
- **HTTP客户端**：Axios
- **工具库**：Day.js

### 后端
- **运行环境**：Cloudflare Workers
- **数据库**：Cloudflare D1 (SQLite)
- **邮件处理**：Cloudflare Email Workers
- **API集成**：Cloudflare Email Routing API

---

## 🚀 快速开始

### 1. 前置要求

- Node.js 18+ 
- npm 或 yarn
- Cloudflare 账号
- 一个托管在 Cloudflare 的域名

### 2. 克隆项目

```bash
git clone https://github.com/yourusername/tempemail.git
cd tempemail
```

### 3. 安装依赖

#### 前端
```bash
cd frontend
npm install
```

#### Workers
```bash
cd ../workers
npm install
```

### 4. 配置环境变量

#### 前端配置
复制 `frontend/env.example` 为 `frontend/.env`：
```env
VITE_API_BASE=/api
VITE_WS_URL=ws://localhost:8787/ws
```

#### Workers 配置
复制 `workers/env.example` 为 `workers/.dev.vars`：
```env
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ZONE_ID=your_zone_id
DOMAIN_NAME=yourdomain.com
TARGET_EMAIL=your@qq.com
```

### 5. 初始化数据库

```bash
cd workers

# 创建 D1 数据库
npx wrangler d1 create tempemail

# 将输出的 database_id 填入 wrangler.toml

# 初始化数据库结构
npx wrangler d1 execute tempemail --file=schema.sql
```

### 6. 本地开发

#### 启动 Workers（后端）
```bash
cd workers
npm run dev
# 默认运行在 http://localhost:8787
```

#### 启动前端
```bash
cd frontend
npm run dev
# 默认运行在 http://localhost:5173
```

访问 http://localhost:5173 查看应用

---

## 📦 生产部署

### 方式一：使用部署脚本（推荐）

```bash
chmod +x deploy.sh
./deploy.sh
```

按照提示选择部署选项。

### 方式二：手动部署

#### 1. 部署 Workers

```bash
cd workers

# 部署主 API Worker
npx wrangler deploy

# 记下 Worker URL，例如：
# https://tempemail-api.your-subdomain.workers.dev
```

#### 2. 配置 Email Workers

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的域名
3. 进入 **Email** > **Email Routing**
4. 启用 Email Routing
5. 在 **Email Workers** 选项卡中，添加 Email Worker
6. 选择刚才部署的 Worker

#### 3. 部署前端

```bash
cd frontend

# 构建
npm run build

# 部署到 Cloudflare Pages
npx wrangler pages deploy dist --project-name=tempemail
```

#### 4. 配置生产环境变量

在 Cloudflare Dashboard 中：

**Workers & Pages > 你的Worker > Settings > Variables**

添加环境变量：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ZONE_ID`
- `DOMAIN_NAME`
- `TARGET_EMAIL`

#### 5. 更新前端API地址

修改 `frontend/.env`：
```env
VITE_API_BASE=https://your-worker.your-subdomain.workers.dev/api
VITE_WS_URL=wss://your-worker.your-subdomain.workers.dev/ws
```

重新构建并部署前端。

---

## 🔧 配置说明

### Cloudflare API Token

创建 API Token：
1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 **Create Token**
3. 选择 **Custom Token**
4. 权限设置：
   - **Zone** - **Email Routing Rules** - **Edit**
   - **Zone** - **Zone** - **Read**
5. 创建并复制 Token

### QQ 邮箱 IMAP 授权码

1. 登录 QQ 邮箱
2. 设置 > 账户
3. 开启 IMAP/SMTP 服务
4. 生成授权码

### Zone ID 和 Account ID

在 Cloudflare Dashboard 的域名概览页面右侧可以找到。

---

## 📖 使用指南

### 1. 创建临时邮箱

- 点击 **生成邮箱** 按钮
- 系统自动生成临时邮箱地址
- 邮箱地址自动复制到剪贴板
- Cloudflare 自动创建转发规则

### 2. 接收邮件

- 任何发送到临时邮箱的邮件会自动转发到你的 QQ 邮箱
- 系统实时监控并在网页上显示邮件
- 验证码自动提取并高亮显示

### 3. 查看邮件详情

- 点击邮件项查看完整内容
- 未读邮件有蓝色标记
- 点击即可标记为已读

### 4. 复制验证码

- 验证码自动提取并显示在邮件预览中
- 点击复制按钮一键复制验证码

### 5. 删除邮箱

- 单个删除：点击邮箱项右侧的删除按钮
- 批量删除：点击 **全部删除** 按钮
- 删除邮箱会同时删除 Cloudflare 转发规则和所有邮件

---

## 🏗️ 项目结构

```
tempemail/
├── frontend/                    # 前端项目（Vue 3）
│   ├── src/
│   │   ├── components/         # Vue 组件
│   │   ├── stores/            # Pinia 状态管理
│   │   ├── services/          # API 服务
│   │   ├── composables/       # 组合式函数
│   │   └── utils/             # 工具函数
│   ├── package.json
│   └── vite.config.js
│
├── workers/                     # Cloudflare Workers
│   ├── src/
│   │   ├── routes/            # API 路由
│   │   ├── services/          # 业务逻辑
│   │   ├── utils/             # 工具函数
│   │   ├── index.js           # 主入口
│   │   └── email-worker.js    # Email Worker
│   ├── schema.sql             # 数据库结构
│   ├── package.json
│   └── wrangler.toml          # Workers 配置
│
├── docs/                        # 文档
│   ├── 需求分析.md
│   └── 项目结构.md
│
├── deploy.sh                    # 部署脚本
└── README.md                    # 项目说明
```

---

## 🔒 安全考虑

- ✅ 敏感配置使用环境变量存储
- ✅ API Token 和密码不会暴露在前端
- ✅ 支持设置临时邮箱自动过期时间
- ✅ 邮件内容仅存储必要字段
- ✅ 支持手动清理过期数据

---

## 🐛 常见问题

### 1. 无法创建临时邮箱

**问题**：点击生成邮箱后报错

**解决方案**：
- 检查 Cloudflare API Token 是否正确
- 确认 Zone ID 是否正确
- 检查域名是否已启用 Email Routing

### 2. 收不到邮件

**问题**：临时邮箱创建成功，但收不到邮件

**解决方案**：
- 检查 Email Worker 是否已部署
- 在 Cloudflare Dashboard 确认 Email Routing 规则已创建
- 检查目标 QQ 邮箱是否正确
- 查看 Workers 日志排查错误

### 3. 验证码无法提取

**问题**：邮件中有验证码但系统未识别

**解决方案**：
- 查看邮件内容格式
- 可能需要添加新的正则表达式规则
- 在 `workers/src/utils/codeExtractor.js` 中添加新的匹配规则

### 4. WebSocket 连接失败

**问题**：实时推送不工作

**解决方案**：
- 检查 Workers 是否支持 WebSocket
- 确认前端 WebSocket URL 配置正确
- 暂时可以使用刷新按钮手动刷新

---

## 🛠️ 开发指南

### 添加新的验证码匹配规则

编辑 `workers/src/utils/codeExtractor.js`：

```javascript
const patterns = [
  // 添加你的正则表达式
  /your custom pattern here/,
  // ...
]
```

### 自定义邮箱地址格式

编辑 `workers/src/routes/email.js` 中的 `generateRandomEmail` 函数：

```javascript
function generateRandomEmail(domain) {
  // 自定义生成逻辑
  return `custom_prefix_${randomString}@${domain}`
}
```

### 修改邮件存储策略

编辑 `workers/src/email-worker.js` 中的邮件处理逻辑。

---

## 📊 性能优化

- ✅ 前端使用 Vite 构建，代码分割
- ✅ Workers 运行在全球边缘节点
- ✅ D1 数据库索引优化
- ✅ WebSocket 减少轮询开销

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源协议

本项目采用 MIT 协议开源。

---

## 🙏 致谢

- [Cloudflare](https://www.cloudflare.com/) - 提供免费的全栈服务
- [Vue.js](https://vuejs.org/) - 优秀的前端框架
- [Vite](https://vitejs.dev/) - 快速的构建工具

---

## 📞 联系方式

- 项目主页：[GitHub](https://github.com/yourusername/tempemail)
- Issue 反馈：[Issues](https://github.com/yourusername/tempemail/issues)

---

## 🎉 开始使用

```bash
# 克隆项目
git clone https://github.com/yourusername/tempemail.git

# 进入目录
cd tempemail

# 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

享受你的临时邮箱系统吧！ 🚀

