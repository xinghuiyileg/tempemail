# SMTP2GO 配置指南

## 如何更新 SMTP2GO 使用情况统计

本项目通过 SMTP2GO API 的 `/stats/email_cycle` 端点获取账户的实时使用情况。

### 方法 1: 通过 SMTP2GO API（推荐）

#### 1. 登录 SMTP2GO 控制台

访问: https://app-us.smtp2go.com/dashboard/main/

使用你的登录凭据登录。

#### 2. 创建或更新 API Key

1. 在控制台中，导航到 **Settings** > **API Keys**
2. 点击 **Add API Key** 创建新的 API Key，或编辑现有的 API Key
3. 在权限设置中，确保启用以下权限：
   - ✅ **Send Email** - 发送邮件
   - ✅ **Statistics** - 查看统计信息（重要！）
   - ✅ **Email Cycle** - 查看月度使用周期

#### 3. 保存 API Key

复制生成的 API Key，格式类似：`api-XXXXXXXXXXXXXXXXXXXXXXXX`

#### 4. 更新环境变量

将新的 API Key 更新到你的环境变量中：

```bash
# 在 .dev.vars 文件中（本地开发）
SMTP2GO_API_KEY=api-XXXXXXXXXXXXXXXXXXXXXXXX

# 或在 Cloudflare Workers 中（生产环境）
wrangler secret put SMTP2GO_API_KEY
```

### 方法 2: 通过数据库统计（备用方案）

如果你的 API Key 没有统计权限（免费版可能有限制），系统会自动回退到数据库统计方式：

- 从 `sent_emails` 表中统计本月通过 SMTP2GO 发送的邮件数量
- 基于免费版限额（1000 封/月）计算剩余额度
- 这种方式的准确性取决于数据库记录的完整性

### API 端点说明

SMTP2GO 提供多个统计 API 端点，可以获取不同维度的使用情况数据。

#### 1. `/stats/email_cycle` - 账户使用周期（推荐）

获取账户的月度使用周期信息，包括限额、已用、剩余等。

**请求示例:**

```bash
curl --request POST \
  --url https://api.smtp2go.com/v3/stats/email_cycle \
  --header 'Content-Type: application/json' \
  --header 'X-Smtp2go-Api-Key: api-XXXXXXXXXXXXXXXXXXXXXXXX' \
  --data '{}'
```

**响应示例:**

```json
{
  "request_id": "ee9b9484-63eb-11ed-8da7-f23c9216ce11",
  "data": {
    "cycle_start": "2024-11-01",
    "cycle_end": "2024-11-30",
    "sent": 150,
    "remaining": 850,
    "allowance": 1000
  }
}
```

**字段说明:**

- `cycle_start`: 当前计费周期开始日期
- `cycle_end`: 当前计费周期结束日期
- `sent`: 本周期已发送的邮件数量
- `remaining`: 本周期剩余的邮件数量
- `allowance`: 月度总限额

#### 2. `/stats/email_bounces` - 退信统计

获取最近 30 天的退信统计，包括软退信和硬退信。

**响应示例:**

```json
{
  "request_id": "ee9b9484-63eb-11ed-8da7-f23c9216ce11",
  "data": {
    "emails": 1000,
    "rejects": 0,
    "softbounces": 5,
    "hardbounces": 5,
    "bounce_percent": "1.00"
  }
}
```

**字段说明:**

- `emails`: 发送的邮件总数
- `rejects`: 被拒绝的邮件数量
- `softbounces`: 软退信数量（临时错误）
- `hardbounces`: 硬退信数量（永久错误）
- `bounce_percent`: 退信百分比

**退信率标准:**
- 0-8%: 良好
- 8-12%: 一般（偏高）
- 12%+: 差（过高）

#### 3. `/stats/email_summary` - 综合统计（最全面）

一次性获取所有统计信息，包括使用周期、退信、垃圾邮件、取消订阅等。

**注意:** 此端点可能需要更长的响应时间。

**响应包含:**
- Email cycle 数据（使用周期）
- Email bounces 数据（退信统计）
- Email spam 数据（垃圾邮件统计）
- Email unsubscribes 数据（取消订阅统计）

#### 4. `/stats/email_spam` - 垃圾邮件统计

获取被标记为垃圾邮件的统计信息。

#### 5. `/stats/email_unsubscribes` - 取消订阅统计

获取收件人取消订阅的统计信息。

### 测试 API 连接

运行测试脚本验证 API Key 是否有正确的权限：

```bash
cd workers
node test-smtp2go-quota.js
```

**成功输出示例:**

```
✅ API 调用成功!
📈 使用情况统计:
   周期开始: 2024-11-01
   周期结束: 2024-11-30
   月度限额: 1000 封
   已发送: 150 封
   剩余: 850 封
   剩余百分比: 85%
   使用率: 15%
```

**权限不足输出示例:**

```
❌ API 调用失败:
{"error":"This API key does not have the appropriate permission to call this endpoint"}
```

如果看到权限不足的错误，请按照上述步骤更新 API Key 权限。

### 在代码中的使用

系统会自动调用 `getSMTP2GOQuota()` 函数获取使用情况：

```javascript
import { getSMTP2GOQuota } from './services/emailQuota.js'

// 获取 SMTP2GO 使用情况
const quota = await getSMTP2GOQuota(env.SMTP2GO_API_KEY, env.DB)

console.log(quota)
// {
//   success: true,
//   service: 'SMTP2GO',
//   total: 1000,
//   used: 150,
//   remaining: 850,
//   unit: '封/月',
//   percentage: 85,
//   cycleStart: '2024-11-01',
//   cycleEnd: '2024-11-30',
//   note: '通过 SMTP2GO API 实时获取'
// }
```

### 常见问题

#### Q: 为什么我的 API Key 没有统计权限？

A: SMTP2GO 免费版的 API Key 可能默认不包含统计权限。你需要：
1. 升级到付费计划，或
2. 在 API Key 设置中手动启用统计权限，或
3. 使用数据库统计方式（系统会自动回退）

#### Q: 如何查看我的 SMTP2GO 账户限额？

A: 
1. 登录 SMTP2GO 控制台
2. 在 Dashboard 页面可以看到当前的使用情况
3. 或通过 API 调用 `/stats/email_cycle` 端点

#### Q: 数据库统计和 API 统计有什么区别？

A: 
- **API 统计**: 直接从 SMTP2GO 服务器获取，最准确，包含完整的周期信息
- **数据库统计**: 基于本地数据库记录，可能不包含通过其他方式发送的邮件

### 相关链接

- [SMTP2GO Dashboard](https://app-us.smtp2go.com/dashboard/main/)
- [SMTP2GO API 文档](https://developers.smtp2go.com/)
- [Email Cycle API 参考](https://developers.smtp2go.com/reference/email-cycle)
- [API Keys 管理](https://app-us.smtp2go.com/settings/api_keys)

### 当前配置

```
Session ID: 4585d11f-7f95-4512-941d-b1867ffd27b3
API Key: api-240D2AD6A8E9481BA245AC2CA03FCFE4
```

**注意**: 当前 API Key 需要更新权限才能访问统计端点。在权限更新之前，系统会使用数据库统计方式。

