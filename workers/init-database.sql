-- ================================================
-- TempEmail 数据库初始化脚本
-- 完整的数据库结构（整合所有迁移）
-- 版本: 1.0
-- 日期: 2025-11-04
-- ================================================

-- ================================================
-- 1. 临时邮箱表
-- ================================================
CREATE TABLE IF NOT EXISTS temp_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL DEFAULT 'default',  -- 用户标识
    email TEXT NOT NULL,                       -- 邮箱地址
    cloudflare_rule_id TEXT,                   -- CF 规则 ID
    target_email TEXT NOT NULL,                -- 目标邮箱
    created_at TEXT DEFAULT (datetime('now')),
    last_received_at TEXT,
    message_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    is_starred INTEGER DEFAULT 0,              -- 星标状态（1=星标，0=未星标）
    UNIQUE(user_id, email)                     -- 联合唯一约束
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_user_id ON temp_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_email ON temp_emails(email);
CREATE INDEX IF NOT EXISTS idx_status ON temp_emails(status);
CREATE INDEX IF NOT EXISTS idx_created ON temp_emails(created_at);
CREATE INDEX IF NOT EXISTS idx_user_email ON temp_emails(user_id, email);
CREATE INDEX IF NOT EXISTS idx_temp_emails_starred ON temp_emails(user_id, is_starred);

-- ================================================
-- 2. 邮件消息表
-- ================================================
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temp_email_id INTEGER NOT NULL,
    message_id TEXT UNIQUE,
    sender TEXT,
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    verification_code TEXT,                    -- 自动提取的验证码
    received_at TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (temp_email_id) REFERENCES temp_emails(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_temp_email ON messages(temp_email_id);
CREATE INDEX IF NOT EXISTS idx_message ON messages(message_id);
CREATE INDEX IF NOT EXISTS idx_received ON messages(received_at);
CREATE INDEX IF NOT EXISTS idx_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_verification_code ON messages(verification_code);

-- ================================================
-- 3. 系统配置表
-- ================================================
CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key TEXT UNIQUE NOT NULL,
    config_value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 插入默认配置
INSERT OR IGNORE INTO config (config_key, config_value) VALUES
    ('cloudflare_api_token', ''),
    ('cloudflare_account_id', ''),
    ('cloudflare_zone_id', ''),
    ('domain_name', ''),
    ('target_qq_email', ''),
    ('qq_imap_password', ''),
    ('monitor_interval', '10'),
    ('auto_delete_days', '7'),
    ('monitor_status', 'stopped');

-- ================================================
-- 4. 登录事件表
-- ================================================
CREATE TABLE IF NOT EXISTS login_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,                    -- 登录方式: 'password', 'account'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_login_events_provider ON login_events(provider);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON login_events(created_at);

-- ================================================
-- 5. 发送邮件表
-- ================================================
CREATE TABLE IF NOT EXISTS sent_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temp_email_id INTEGER NOT NULL,            -- 关联的临时邮箱ID
    recipient TEXT NOT NULL,                   -- 收件人邮箱
    subject TEXT NOT NULL,                     -- 邮件主题
    body TEXT NOT NULL,                        -- 邮件内容
    sent_at TEXT DEFAULT (datetime('now')),    -- 发送时间
    FOREIGN KEY (temp_email_id) REFERENCES temp_emails(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_sent_emails_temp_email_id ON sent_emails(temp_email_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails(sent_at);

-- ================================================
-- 6. 用户账号表
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,             -- 用户名（唯一）
    password TEXT NOT NULL,                    -- 密码（哈希后存储）
    created_at TEXT DEFAULT (datetime('now'))  -- 创建时间
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ================================================
-- 7. 域名管理表
-- ================================================
CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,              -- 域名
    user_id TEXT NOT NULL,                    -- 用户ID
    status TEXT NOT NULL DEFAULT 'pending',   -- 状态: pending, verified, failed
    mx_records TEXT,                          -- MX记录（JSON格式）
    verification_token TEXT,                  -- 验证Token
    last_verified_at TEXT,                    -- 最后验证时间
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_domain ON domains(domain);

-- ================================================
-- 8. 域名验证历史表
-- ================================================
CREATE TABLE IF NOT EXISTS domain_verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain_id INTEGER NOT NULL,               -- 域名ID
    verification_type TEXT NOT NULL,          -- 验证类型: mx, txt, email
    verification_result TEXT,                 -- 验证结果（JSON格式）
    success INTEGER NOT NULL DEFAULT 0,       -- 是否成功: 0=失败, 1=成功
    error_message TEXT,                       -- 错误信息
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_domain_verifications_domain_id ON domain_verifications(domain_id);

-- ================================================
-- 9. 审计日志表
-- ================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,                      -- 操作类型
    user_id TEXT NOT NULL DEFAULT 'anonymous', -- 用户ID
    target_type TEXT,                          -- 目标类型（email, message, domain, config, user）
    target_id TEXT,                            -- 目标ID
    details TEXT,                              -- 详细信息（JSON格式）
    ip_address TEXT,                           -- 客户端IP
    user_agent TEXT,                           -- 用户代理
    success INTEGER NOT NULL DEFAULT 1,        -- 是否成功: 0=失败, 1=成功
    error_message TEXT,                        -- 错误信息
    created_at TEXT DEFAULT (datetime('now'))  -- 创建时间
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- ================================================
-- 初始化完成
-- ================================================
SELECT '✅ 数据库初始化完成！' as message;
SELECT 'Created tables: temp_emails, messages, config, login_events, sent_emails, users, domains, domain_verifications, audit_logs' as info;

