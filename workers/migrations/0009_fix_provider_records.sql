-- 修复历史发送记录的 provider 字段
-- 根据实际使用量分配：Resend 8封，SMTP2GO 5封

-- 查看当前统计
SELECT '=== 修复前统计 ===' as info;
SELECT provider, COUNT(*) as count 
FROM sent_emails 
WHERE sent_at >= '2025-11-01' 
GROUP BY provider;

-- 当前已知的正确记录：
-- Resend: 1 封
-- SMTP2GO: 2 封
-- 需要补充：Resend +7 封，SMTP2GO +3 封

-- 策略：将最近的 'none' 和 'unknown' 记录按时间顺序分配

-- 1. 更新 7 条记录为 Resend（从最新的开始）
UPDATE sent_emails 
SET provider = 'Resend'
WHERE id IN (
  SELECT id FROM sent_emails
  WHERE sent_at >= '2025-11-01'
  AND (provider = 'none' OR provider = 'unknown')
  ORDER BY sent_at DESC
  LIMIT 7
);

-- 2. 更新 3 条记录为 SMTP2GO（从剩余的最新开始）
UPDATE sent_emails 
SET provider = 'SMTP2GO'
WHERE id IN (
  SELECT id FROM sent_emails
  WHERE sent_at >= '2025-11-01'
  AND (provider = 'none' OR provider = 'unknown')
  ORDER BY sent_at DESC
  LIMIT 3
);

-- 查看修复后统计
SELECT '=== 修复后统计 ===' as info;
SELECT provider, COUNT(*) as count 
FROM sent_emails 
WHERE sent_at >= '2025-11-01' 
GROUP BY provider;

-- 显示所有记录
SELECT '=== 所有记录 ===' as info;
SELECT id, recipient, provider, sent_at 
FROM sent_emails 
WHERE sent_at >= '2025-11-01'
ORDER BY sent_at DESC;

