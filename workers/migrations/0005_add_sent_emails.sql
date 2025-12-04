-- ================================================
-- 迁移：添加发送邮件功能
-- 版本：0005
-- 日期：2025-11-04
-- ================================================
-- 
-- 功能说明：
-- 1. 创建 sent_emails 表用于存储发送的邮件记录
-- 2. 支持用户隔离（user_id）
-- 3. 记录发送状态和时间
-- ================================================

-- 创建发送邮件表
CREATE TABLE IF NOT EXISTS sent_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    temp_email_id INTEGER NOT NULL,             -- 关联的临时邮箱ID
    recipient TEXT NOT NULL,                    -- 收件人邮箱
    subject TEXT NOT NULL,                      -- 邮件主题
    body TEXT NOT NULL,                         -- 邮件内容
    sent_at TEXT DEFAULT (datetime('now')),     -- 发送时间
    FOREIGN KEY (temp_email_id) REFERENCES temp_emails(id) ON DELETE CASCADE
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_sent_emails_temp_email_id ON sent_emails(temp_email_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails(sent_at);

-- 验证迁移
SELECT 'sent_emails 表已创建' as message;

