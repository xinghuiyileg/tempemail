-- ================================================
-- 迁移：添加缺失的数据库索引
-- 版本：0010
-- 日期：2025-11-05
-- ================================================
-- 
-- 功能说明：
-- 1. 添加 temp_emails.last_received_at 索引（优化邮箱列表排序）
-- 2. 添加复合索引优化常用查询
-- 3. 提升整体查询性能
-- ================================================

-- temp_emails 表索引
CREATE INDEX IF NOT EXISTS idx_temp_emails_last_received 
ON temp_emails(last_received_at DESC);

CREATE INDEX IF NOT EXISTS idx_temp_emails_user_status 
ON temp_emails(user_id, status);

-- messages 表索引
CREATE INDEX IF NOT EXISTS idx_messages_temp_email_received 
ON messages(temp_email_id, received_at DESC);

-- sent_emails 表索引
CREATE INDEX IF NOT EXISTS idx_sent_emails_temp_email_sent 
ON sent_emails(temp_email_id, sent_at DESC);

-- users 表索引
CREATE INDEX IF NOT EXISTS idx_users_role_status 
ON users(role, status);

-- 验证索引创建
SELECT '✅ 缺失的索引已添加' as message;

-- 显示所有索引
SELECT name, tbl_name 
FROM sqlite_master 
WHERE type='index' 
ORDER BY tbl_name, name;

