# SMTP2GO 快速参考卡片

## 🚀 快速开始（3 步）

### 1️⃣ 检查权限
```powershell
cd workers
.\check-smtp2go-permissions.ps1
```

### 2️⃣ 配置权限（如果需要）
访问: https://app-us.smtp2go.com/settings/api_keys
- 编辑 API Key: `api-240D2AD6A8E9481BA245AC2CA03FCFE4`
- 启用 ✅ **Statistics** 权限
- 保存

### 3️⃣ 验证配置
```bash
node test-all-smtp2go-stats.js
```

---

## 📊 API 端点速查

| 端点 | 用途 | 推荐 |
|------|------|------|
| `/stats/email_cycle` | 使用周期（限额、已用、剩余） | ⭐⭐⭐ |
| `/stats/email_bounces` | 退信统计 | ⭐⭐ |
| `/stats/email_summary` | 综合统计（全部信息） | ⭐⭐ |
| `/stats/email_spam` | 垃圾邮件统计 | ⭐ |
| `/stats/email_unsubscribes` | 取消订阅统计 | ⭐ |

---

## 🔑 API 调用示例

### cURL
```bash
curl --request POST \
  --url https://api.smtp2go.com/v3/stats/email_cycle \
  --header 'Content-Type: application/json' \
  --header 'X-Smtp2go-Api-Key: api-240D2AD6A8E9481BA245AC2CA03FCFE4' \
  --data '{}'
```

### JavaScript
```javascript
const response = await fetch('https://api.smtp2go.com/v3/stats/email_cycle', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Smtp2go-Api-Key': 'api-240D2AD6A8E9481BA245AC2CA03FCFE4'
  },
  body: JSON.stringify({})
});

const data = await response.json();
console.log(data);
```

### 成功响应
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

### 权限不足响应
```json
{
  "request_id": "e3223e1b-a933-48b1-8d14-aeedbae3e349",
  "data": {
    "error": "This API key does not have the appropriate permission...",
    "error_code": "E_ApiResponseCodes.ENDPOINT_PERMISSION_DENIED"
  }
}
```

---

## 🛠️ 测试工具

| 工具 | 命令 | 用途 |
|------|------|------|
| 权限检查 | `.\check-smtp2go-permissions.ps1` | 检查并配置权限 |
| 单端点测试 | `node test-smtp2go-quota.js` | 测试 email_cycle |
| 全面测试 | `node test-all-smtp2go-stats.js` | 测试所有端点 |

---

## 📝 代码使用

### 获取使用情况
```javascript
import { getSMTP2GOQuota } from './services/emailQuota.js'

// 自动尝试 API，失败时回退到数据库
const quota = await getSMTP2GOQuota(env.SMTP2GO_API_KEY, env.DB)

console.log(`总限额: ${quota.total}`)
console.log(`已使用: ${quota.used}`)
console.log(`剩余: ${quota.remaining}`)
console.log(`剩余率: ${quota.percentage}%`)
console.log(`周期: ${quota.cycleStart} 至 ${quota.cycleEnd}`)
console.log(`数据来源: ${quota.note}`)
```

### 返回数据格式
```javascript
{
  success: true,
  service: 'SMTP2GO',
  total: 1000,           // 月度总限额
  used: 150,             // 已使用
  remaining: 850,        // 剩余
  unit: '封/月',
  percentage: 85,        // 剩余百分比
  cycleStart: '2024-11-01',
  cycleEnd: '2024-11-30',
  note: '通过 SMTP2GO API 实时获取'  // 或 '基于数据库统计'
}
```

---

## 🔗 重要链接

| 资源 | URL |
|------|-----|
| Dashboard | https://app-us.smtp2go.com/dashboard/main/ |
| API Keys 管理 | https://app-us.smtp2go.com/settings/api_keys |
| API 文档 | https://developers.smtp2go.com/ |
| Email Cycle API | https://developers.smtp2go.com/reference/email-cycle |
| 统计指南 | https://developers.smtp2go.com/docs/report-on-email-delivery |

---

## ⚙️ 当前配置

```
Dashboard: https://app-us.smtp2go.com/dashboard/main/
Session ID: 4585d11f-7f95-4512-941d-b1867ffd27b3
API Key: api-240D2AD6A8E9481BA245AC2CA03FCFE4
```

**状态**: ⚠️ 需要启用 Statistics 权限

---

## ❓ 常见问题

### Q: 为什么 API 调用失败？
**A**: 你的 API Key 没有 Statistics 权限。访问 [API Keys 管理页面](https://app-us.smtp2go.com/settings/api_keys) 启用权限。

### Q: 数据库统计准确吗？
**A**: 数据库统计只包含通过本系统发送的邮件。如果你通过其他方式使用 SMTP2GO，这些邮件不会被计入。

### Q: 如何更新 API Key？
**A**: 
1. 在 SMTP2GO 控制台生成新的 API Key
2. 更新环境变量: `SMTP2GO_API_KEY=新的key`
3. 重启应用

### Q: 免费版有限制吗？
**A**: 免费版通常限制 1000 封/月。具体限额请查看你的 Dashboard。

### Q: 退信率多少算正常？
**A**: 
- ✅ 0-8%: 良好
- ⚠️ 8-12%: 偏高
- ❌ 12%+: 过高（需要检查邮件列表）

---

## 📚 文档索引

| 文档 | 内容 |
|------|------|
| `SMTP2GO_SETUP.md` | 完整配置指南（英文） |
| `如何更新SMTP2GO使用情况.md` | 中文快速指南 |
| `SMTP2GO-API-流程图.md` | 架构和流程图 |
| `SMTP2GO-快速参考.md` | 本文档 |
| `../SMTP2GO使用情况更新说明.md` | 实现总结 |

---

## 🎯 下一步

1. ✅ 运行权限检查脚本
2. ✅ 访问 SMTP2GO 控制台配置权限
3. ✅ 运行测试脚本验证
4. ✅ 在应用中使用 `getSMTP2GOQuota()`

---

## 💡 提示

- 🔄 系统会自动回退到数据库统计，即使 API 失败也能正常工作
- 📊 推荐使用 `/stats/email_cycle` 端点，数据最全面
- 🧪 配置完成后务必运行测试脚本验证
- 📝 保存好 API Key，不要泄露到公开仓库

---

**最后更新**: 2025-11-06
**版本**: 1.0

