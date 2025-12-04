-- 创建验证码表
CREATE TABLE IF NOT EXISTS captchas (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

-- 创建索引以加速过期验证码清理
CREATE INDEX IF NOT EXISTS idx_captchas_timestamp ON captchas(timestamp);

