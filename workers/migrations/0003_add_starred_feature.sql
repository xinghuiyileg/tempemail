-- ================================================
-- 迁移：添加星标邮箱功能
-- 版本：0003
-- 日期：2025-10-20
-- ================================================
-- 
-- 功能说明：
-- 1. 为 temp_emails 表添加 is_starred 字段
-- 2. 星标邮箱不可删除，需要先取消星标
-- 3. 默认值为 0（未星标）
-- ================================================

-- 添加 is_starred 字段
ALTER TABLE temp_emails ADD COLUMN is_starred INTEGER DEFAULT 0;

-- 创建索引以优化星标查询
CREATE INDEX IF NOT EXISTS idx_temp_emails_starred ON temp_emails(user_id, is_starred);

-- 验证迁移
SELECT 
    COUNT(*) as total_emails,
    SUM(CASE WHEN is_starred = 1 THEN 1 ELSE 0 END) as starred_emails,
    SUM(CASE WHEN is_starred = 0 THEN 1 ELSE 0 END) as normal_emails
FROM temp_emails;

