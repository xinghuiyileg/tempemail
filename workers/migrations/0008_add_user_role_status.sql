-- ================================================
-- 迁移：添加用户角色和状态字段
-- 版本：0007
-- 日期：2025-11-05
-- ================================================
-- 
-- 功能说明：
-- 1. 为 users 表添加 role 字段（角色：admin/user）
-- 2. 为 users 表添加 status 字段（状态：normal/banned）
-- 3. 默认值：role='user', status='normal'
-- ================================================

-- 添加 role 字段
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

-- 添加 status 字段
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'normal';

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 验证迁移
SELECT 
    COUNT(*) as total_users,
    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_count,
    SUM(CASE WHEN status = 'normal' THEN 1 ELSE 0 END) as normal_count,
    SUM(CASE WHEN status = 'banned' THEN 1 ELSE 0 END) as banned_count
FROM users;

SELECT '✅ users 表已添加 role 和 status 字段' as message;

