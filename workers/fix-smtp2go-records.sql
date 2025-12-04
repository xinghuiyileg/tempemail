-- 更正远程数据库中的 SMTP2GO 记录
-- 将已发送的 9 封邮件的 provider 字段更新为 'SMTP2GO'

-- 步骤 1: 查看当前数据
SELECT '=== 当前数据统计 ===' as info;

SELECT 
  provider,
  COUNT(*) as count
FROM sent_emails
GROUP BY provider;

-- 步骤 2: 查看 provider 为 NULL 或空的记录
SELECT '=== Provider 为 NULL 的记录 ===' as info;

SELECT 
  id,
  recipient,
  subject,
  provider,
  sent_at
FROM sent_emails
WHERE provider IS NULL OR provider = ''
ORDER BY sent_at DESC
LIMIT 10;

-- 步骤 3: 更新记录
-- 如果这 9 封邮件的 provider 是 NULL，将它们更新为 'SMTP2GO'
UPDATE sent_emails
SET provider = 'SMTP2GO'
WHERE provider IS NULL OR provider = '';

-- 步骤 4: 验证更新结果
SELECT '=== 更新后的数据统计 ===' as info;

SELECT 
  provider,
  COUNT(*) as count
FROM sent_emails
GROUP BY provider;

-- 步骤 5: 查看更新后的记录
SELECT '=== 更新后的 SMTP2GO 记录 ===' as info;

SELECT 
  id,
  recipient,
  subject,
  provider,
  sent_at
FROM sent_emails
WHERE provider = 'SMTP2GO'
ORDER BY sent_at DESC;

-- 步骤 6: 统计本月 SMTP2GO 使用情况
SELECT '=== 本月 SMTP2GO 使用情况 ===' as info;

SELECT 
  COUNT(*) as smtp2go_count,
  MIN(sent_at) as first_email,
  MAX(sent_at) as last_email
FROM sent_emails
WHERE provider = 'SMTP2GO'
  AND sent_at >= date('now', 'start of month');

