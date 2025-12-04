-- ================================================
-- 迁移：添加Token管理表
-- 版本：0011
-- 日期：2025-11-05
-- ================================================
-- 
-- 功能说明：
-- 1. 创建 tokens 表用于管理用户token
-- 2. 支持token过期时间
-- 3. 支持token刷新
-- 4. 支持token黑名单（退出登录）
-- ================================================

-- 创建tokens表
CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,                      -- 用户ID
    token TEXT UNIQUE NOT NULL,                 -- Token值
    refresh_token TEXT UNIQUE,                  -- 刷新Token
    expires_at TEXT NOT NULL,                   -- 过期时间
    refresh_expires_at TEXT,                    -- 刷新Token过期时间
    is_revoked INTEGER DEFAULT 0,               -- 是否已撤销（黑名单）
    created_at TEXT DEFAULT (datetime('now')),  -- 创建时间
    last_used_at TEXT DEFAULT (datetime('now')) -- 最后使用时间
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
CREATE INDEX IF NOT EXISTS idx_tokens_refresh_token ON tokens(refresh_token);
CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_is_revoked ON tokens(is_revoked);

-- 验证迁移
SELECT '✅ tokens 表已创建' as message;

