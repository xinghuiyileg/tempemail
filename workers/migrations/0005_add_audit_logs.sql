-- ================================================
-- 添加审计日志表
-- 版本: 0005
-- 日期: 2025-12-04
-- ================================================

-- 审计日志表
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
-- 迁移完成
-- ================================================
SELECT '✅ 审计日志表创建完成！' as message;
