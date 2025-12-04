-- ================================================
-- 迁移：为 sent_emails 表添加 provider 字段
-- 版本：0006
-- 日期：2025-11-05
-- ================================================
-- 
-- 功能说明：
-- 1. 添加 provider 字段用于记录使用的邮件服务商
-- 2. 支持统计各服务商的实际使用量
-- ================================================

-- 添加 provider 字段
ALTER TABLE sent_emails ADD COLUMN provider TEXT DEFAULT 'unknown';

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_sent_emails_provider ON sent_emails(provider);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at_provider ON sent_emails(sent_at, provider);

-- 验证迁移
SELECT 'sent_emails 表已添加 provider 字段' as message;

