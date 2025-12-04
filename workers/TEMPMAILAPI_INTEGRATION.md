# TempMailApi.com 集成指南

## 📖 概述

TempMailApi.com 是一个第三方临时邮箱服务提供商，提供完整的临时邮箱API功能。本文档说明如何将其集成到你的项目中。

## 🔑 获取API密钥

1. 访问 https://tempmailapi.com
2. 注册账号
3. 在控制面板中获取你的API密钥
4. 文档中的示例密钥：`CZXXyF8jg5JRH7UbQWVYiKMQjQznCB6`（仅供测试）

## 🚀 快速开始

### 1. 配置环境变量

在 `workers/wrangler.toml` 或 `.env` 中添加：

```toml
[vars]
TEMPMAILAPI_KEY = "你的API密钥"
```

### 2. 基本使用

```javascript
import { TempMailApiProvider } from './src/services/tempMailApiProvider.js';

// 初始化
const provider = new TempMailApiProvider('YOUR_API_KEY');

// 创建邮箱
const mailbox = await provider.createRandomMailbox();
console.log('新邮箱:', mailbox.email);

// 获取邮件
const messages = await provider.getMessages(mailbox.email);
console.log('收到邮件:', messages.length);
```

## 📋 API功能详解

### 1. 获取可用域名

```javascript
// 获取所有域名
const allDomains = await provider.getDomains('all');

// 只获取免费域名
const freeDomains = await provider.getDomains('free');

// 只获取付费域名
const premiumDomains = await provider.getDomains('premium');

// 返回格式
[
  { domain: "tempmailapi.online", type: "Free" },
  { domain: "vipmail.example", type: "Premium" }
]
```

### 2. 创建随机邮箱

```javascript
const mailbox = await provider.createRandomMailbox();

// 返回数据
{
  id: 123,
  email: "ab3cd@tempmailapi.online",
  domain: "tempmailapi.online",
  ip: "1.2.3.4",
  fingerprint: "f3e2c1...",
  expire_at: "2025-10-21T13:44:50Z",
  created_at: "2025-10-21T13:14:50Z",
  email_token: "ENCRYPTED_TOKEN"
}
```

### 3. 重命名邮箱

```javascript
const newMailbox = await provider.renameMailbox(
  'old@tempmailapi.online',  // 当前邮箱
  'newname',                  // 新用户名
  'tempmailapi.online'        // 域名
);

console.log('新邮箱:', newMailbox.email);
```

### 4. 获取邮件列表

```javascript
// 获取所有邮件
const messages = await provider.getMessages('test@tempmailapi.online');

// 只获取最近7天的邮件
const recentMessages = await provider.getMessages('test@tempmailapi.online', 7);

// 返回格式
[
  {
    id: "eNcoDedHash...",
    from: "invideo AI",
    subject: "Your login code",
    created_at: "2025-10-21T13:36:31Z",
    hash_id: "eNcoDedHash...",
    has_attachments: false
  }
]
```

### 5. 获取邮件详情

```javascript
const message = await provider.getMessage('eNcoDedHash...');

// 返回格式
{
  id: "eNcoDedHash...",
  from: "invideo AI",
  subject: "651693 — Your login code",
  created_at: "2025-10-21T13:36:31Z",
  body: "<p>Here's your login code...</p>",
  hash_id: "eNcoDedHash...",
  attachments: [
    {
      filename: "invoice.pdf",
      size: 12345,
      link: "https://tempmailapi.com/api/d/eNcoDedHash.../invoice.pdf"
    }
  ]
}
```

### 6. 轮询新邮件

```javascript
// 开始轮询（每5秒检查一次）
const stopPolling = provider.pollMessages(
  'test@tempmailapi.online',
  (newMessages) => {
    console.log('收到新邮件:', newMessages);
    newMessages.forEach(msg => {
      console.log(`- ${msg.from}: ${msg.subject}`);
    });
  },
  5000  // 轮询间隔（毫秒）
);

// 停止轮询
stopPolling();
```

### 7. 删除邮件

```javascript
const result = await provider.deleteMessage('eNcoDedHash...');
console.log(result.message); // "Message deleted"
```

### 8. 删除邮箱

```javascript
const result = await provider.deleteMailbox('test@tempmailapi.online');
console.log(result.message); // "Email has been successfully deleted."
```

### 9. 获取附件下载链接

```javascript
const url = provider.getAttachmentUrl('eNcoDedHash...', 'invoice.pdf');
// 返回: https://tempmailapi.com/api/d/eNcoDedHash.../invoice.pdf
```

## 🌐 HTTP API路由

项目已包含完整的HTTP路由封装（`workers/src/routes/tempmail.js`）：

### 获取域名列表
```
GET /tempmail/domains?type=all
```

### 创建邮箱
```
POST /tempmail/create
```

### 重命名邮箱
```
POST /tempmail/rename
Body: {
  "currentEmail": "old@domain.com",
  "newUsername": "newname",
  "domain": "domain.com"
}
```

### 删除邮箱
```
POST /tempmail/delete
Body: { "email": "test@domain.com" }
```

### 获取邮件列表
```
GET /tempmail/messages?email=test@domain.com&since_days=7
```

### 获取邮件详情
```
GET /tempmail/message/{messageId}
```

### 删除邮件
```
DELETE /tempmail/message/{messageId}
```

## 🧪 测试

运行测试脚本：

```bash
cd workers
node test-tempmailapi.js
```

测试将验证所有API功能并输出详细结果。

## ⚠️ 注意事项

### 1. URL编码
邮箱地址在URL中必须进行编码：
```javascript
const email = 'user+tag@domain.com';
const encoded = encodeURIComponent(email); // user%2Btag%40domain.com
```

### 2. API限流
- 避免频繁调用API
- 建议轮询间隔不少于5秒
- 实现错误重试机制

### 3. 邮件内容
- `body` 字段可能是HTML或纯文本
- 需要在前端正确渲染HTML内容
- 注意XSS安全防护

### 4. 附件链接
- 附件链接是公开的
- 如需安全控制，应实现签名URL

### 5. 邮箱过期
- 邮箱有过期时间（`expire_at`）
- 过期后邮箱和邮件会被自动删除

## 🔄 与现有系统集成

### 方案1: 作为备用邮件提供商

在 `workers/src/services/emailProviders.js` 中添加：

```javascript
import { TempMailApiProvider } from './tempMailApiProvider.js';

// 在邮件提供商列表中添加
const providers = {
  smtp2go: new SMTP2GOProvider(),
  brevo: new BrevoProvider(),
  tempmailapi: new TempMailApiProvider(env.TEMPMAILAPI_KEY)
};
```

### 方案2: 独立服务

保持TempMailApi作为独立服务，通过专门的路由访问：

```javascript
// 在 router.js 中添加
import { TempMailRoutes } from './routes/tempmail.js';

if (pathname.startsWith('/tempmail/')) {
  const tempMailRoutes = new TempMailRoutes(env);
  return tempMailRoutes.handleRequest(request, pathname);
}
```

## 💡 最佳实践

### 1. 缓存邮件列表
```javascript
const cache = new Map();
const CACHE_TTL = 30000; // 30秒

async function getCachedMessages(email) {
  const cached = cache.get(email);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  
  const messages = await provider.getMessages(email);
  cache.set(email, { data: messages, time: Date.now() });
  return messages;
}
```

### 2. 错误处理
```javascript
async function safeApiCall(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

### 3. 实时通知
```javascript
// 结合WebSocket推送新邮件
const stopPolling = provider.pollMessages(email, async (newMessages) => {
  // 通过WebSocket通知前端
  await notifyClients({
    type: 'new_messages',
    email: email,
    messages: newMessages
  });
});
```

## 📊 对比自建vs第三方

| 特性 | 自建系统 | TempMailApi |
|------|---------|-------------|
| 域名控制 | ✅ 完全控制 | ❌ 使用他们的域名 |
| 成本 | 💰 需要服务器+域名 | 💰 API调用费用 |
| 维护 | 🔧 需要自己维护 | ✅ 无需维护 |
| 扩展性 | 📈 需要自己扩展 | ✅ 自动扩展 |
| 隐私 | 🔒 完全私有 | ⚠️ 第三方托管 |
| 功能 | 🛠️ 自定义开发 | ✅ 开箱即用 |

## 🔗 相关链接

- API文档: https://tempmailapi.com/page/api-documentation
- 官方网站: https://tempmailapi.com
- 注册账号: https://tempmailapi.com/register

## 📝 许可证

本集成代码遵循项目主许可证。TempMailApi.com服务受其自身服务条款约束。

