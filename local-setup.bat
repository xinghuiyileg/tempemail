@echo off
chcp 65001 >nul
echo 🚀 临时邮箱系统 - 本地环境设置
echo ================================
echo.

:: 检查 Node.js
echo 检查 Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js 18+
    pause
    exit /b 1
)
node -v
echo ✅ Node.js 已安装
echo.

:: 检查 npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm 未安装
    pause
    exit /b 1
)
npm -v
echo ✅ npm 已安装
echo.

:: 安装依赖
echo 📦 安装依赖...
echo.

echo 安装前端依赖...
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)
echo ✅ 前端依赖安装完成
echo.

echo 安装 Workers 依赖...
cd ..\workers
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Workers 依赖安装失败
    pause
    exit /b 1
)
echo ✅ Workers 依赖安装完成
echo.

:: 配置环境变量
echo 🔧 配置环境变量...
echo.

:: 前端环境变量
if not exist "..\frontend\.env" (
    echo 创建前端 .env 文件...
    (
        echo VITE_API_BASE=http://localhost:8787/api
        echo VITE_WS_URL=ws://localhost:8787/ws
    ) > ..\frontend\.env
    echo ✅ 前端环境变量已创建
) else (
    echo ⚠️  前端 .env 文件已存在，跳过
)
echo.

:: Workers 环境变量
if not exist ".dev.vars" (
    echo 创建 Workers .dev.vars 文件...
    (
        echo # Cloudflare 配置（本地测试使用模拟值）
        echo CLOUDFLARE_API_TOKEN=test_token_for_local_dev
        echo CLOUDFLARE_ACCOUNT_ID=test_account_id
        echo CLOUDFLARE_ZONE_ID=test_zone_id
        echo.
        echo # 域名配置
        echo DOMAIN_NAME=test.local
        echo.
        echo # 目标邮箱
        echo TARGET_EMAIL=test@qq.com
        echo.
        echo # 监控配置
        echo MONITOR_INTERVAL=10
        echo AUTO_DELETE_DAYS=7
    ) > .dev.vars
    echo ✅ Workers 环境变量已创建
) else (
    echo ⚠️  Workers .dev.vars 文件已存在，跳过
)
echo.

:: 初始化数据库
echo 🗄️  初始化本地数据库...
echo 创建 D1 数据库（本地模式）...
call npx wrangler d1 execute tempemail --local --file=schema.sql >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ 数据库初始化完成
) else (
    echo ⚠️  数据库可能已存在或需要手动初始化
    echo 请运行: cd workers ^&^& npx wrangler d1 execute tempemail --local --file=schema.sql
)
echo.

:: 创建测试数据
set /p create_test_data="📝 是否创建测试数据？(y/n): "
if /i "%create_test_data%"=="y" (
    echo 创建测试数据...
    (
        echo -- 插入测试邮箱
        echo INSERT OR IGNORE INTO temp_emails (id, email, target_email, message_count, status, created_at^) VALUES
        echo (1, 'temp_test001@test.local', 'test@qq.com', 3, 'active', datetime('now'^)^),
        echo (2, 'temp_test002@test.local', 'test@qq.com', 1, 'active', datetime('now', '-1 hour'^)^);
        echo.
        echo -- 插入测试邮件
        echo INSERT OR IGNORE INTO messages (id, temp_email_id, sender, subject, body_text, verification_code, received_at, is_read^) VALUES
        echo (1, 1, 'noreply@github.com', '欢迎加入 GitHub', '感谢您注册 GitHub。您的验证码是：123456', '123456', datetime('now'^), 0^),
        echo (2, 1, 'security@google.com', 'Google 安全验证', '您的 Google 验证码：789012', '789012', datetime('now', '-30 minutes'^), 0^),
        echo (3, 1, 'noreply@amazon.com', '订单确认', '您的订单已确认，订单号：ABC123', NULL, datetime('now', '-1 hour'^), 1^),
        echo (4, 2, 'hello@notion.so', 'Notion 工作区邀请', '您被邀请加入工作区，验证码：456789', '456789', datetime('now', '-2 hours'^), 0^);
    ) > test-data.sql
    
    call npx wrangler d1 execute tempemail --local --file=test-data.sql >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        echo ✅ 测试数据创建完成
        del test-data.sql
    ) else (
        echo ⚠️  测试数据创建可能失败
    )
)
echo.

cd ..

:: 完成
echo.
echo 🎉 本地环境设置完成！
echo.
echo 下一步：
echo 1. 在一个终端运行：cd workers ^&^& npm run dev
echo 2. 在另一个终端运行：cd frontend ^&^& npm run dev
echo 3. 打开浏览器访问：http://localhost:5173
echo.
echo 📖 查看完整文档：本地测试指南.md
echo.
pause

