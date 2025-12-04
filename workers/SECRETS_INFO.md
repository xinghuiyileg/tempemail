# Cloudflare Workers Secrets 说明

## 📋 当前已设置的 Secrets

通过 `npx wrangler secret list` 查询到以下 secrets 已在 Cloudflare Workers 中设置：

1. **ADMIN_PASSWORD** - 管理员密码
2. **BREVO_API_KEY** - Brevo 邮件服务 API Key
3. **CLOUDFLARE_ACCOUNT_ID** - Cloudflare 账户 ID
4. **CLOUDFLARE_API_TOKEN** - Cloudflare API Token
5. **CLOUDFLARE_ZONE_ID** - Cloudflare Zone ID
6. **RESEND_API_KEY** - Resend 邮件服务 API Key ⚠️

## ⚠️ 重要说明

### Resend API Key 的双重配置

**问题**: RESEND_API_KEY 同时存在于两个地方：
1. **Cloudflare Workers Secrets** (通过 `wrangler secret put` 设置)
2. **数据库配置** (通过前端系统配置界面设置)

**优先级**: 
```javascript
// workers/src/routes/email.js
RESEND_API_KEY: configMap.RESEND_API_KEY || env.RESEND_API_KEY
```
- 数据库配置优先
- 如果数据库中没有配置，则使用 Cloudflare Secrets 中的值

**这导致的问题**:
- 即使在系统配置界面中没有填写 Resend API Key
- Resend 仍然可以发送邮件（使用 Cloudflare Secrets 中的值）
- 用户可能会困惑为什么没配置却能用

## 🔧 解决方案

### 方案 1: 删除 Cloudflare Secrets 中的 RESEND_API_KEY

如果您希望完全通过前端界面管理邮件服务配置：

```bash
cd workers
npx wrangler secret delete RESEND_API_KEY
```

### 方案 2: 保留 Secrets 作为默认值

保持现状，Cloudflare Secrets 作为默认配置，数据库配置可以覆盖。

**优点**:
- 即使数据库配置丢失，仍有备用配置
- 适合生产环境的容错设计

**缺点**:
- 配置来源不透明，可能造成困惑

## 📝 建议

**推荐使用方案 2**，但需要在前端界面中显示配置来源：

```
Resend API Key: ********** (来自 Cloudflare Secrets)
或
Resend API Key: ********** (来自数据库配置)
```

## 🔍 如何查看当前配置

### 查看 Cloudflare Secrets
```bash
cd workers
npx wrangler secret list
```

### 查看数据库配置
```bash
cd workers
npx wrangler d1 execute tempemail --remote --command="SELECT config_key, config_value FROM config WHERE config_key LIKE '%api_key%'"
```

## 🚀 如何设置 Secrets

### 设置新的 Secret
```bash
cd workers
echo "your_api_key_here" | npx wrangler secret put SECRET_NAME
```

### 删除 Secret
```bash
cd workers
npx wrangler secret delete SECRET_NAME
```

## 📊 配置优先级总结

| 配置项 | 数据库 | Cloudflare Secrets | 最终使用 |
|--------|--------|-------------------|---------|
| RESEND_API_KEY | ✅ 已配置 | ✅ 已配置 | 数据库 |
| RESEND_API_KEY | ❌ 未配置 | ✅ 已配置 | Secrets |
| BREVO_API_KEY | ✅ 已配置 | ✅ 已配置 | 数据库 |
| SMTP2GO_API_KEY | ✅ 已配置 | ❌ 未配置 | 数据库 |

---

**最后更新**: 2025-11-05

