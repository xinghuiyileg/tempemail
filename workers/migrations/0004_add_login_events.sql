-- 创建登录事件记录表
CREATE TABLE IF NOT EXISTS login_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,  -- 登录方式: 'password', 'baidu', 'qq', 'wechat' 等
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_login_events_provider ON login_events(provider);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON login_events(created_at);



