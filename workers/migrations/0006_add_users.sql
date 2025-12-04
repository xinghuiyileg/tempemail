-- ================================================
-- 迁移：添加用户账号系统
-- 版本：0006
-- 日期：2025-11-04
-- ================================================
-- 
-- 功能说明：
-- 1. 创建 users 表用于存储用户账号信息
-- 2. 支持用户名密码登录
-- 3. 记录创建时间
-- ================================================

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,              -- 用户名（唯一）
    password TEXT NOT NULL,                     -- 密码（哈希后存储）
    created_at TEXT DEFAULT (datetime('now'))   -- 创建时间
);

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 验证迁移
SELECT 'users 表已创建' as message;

