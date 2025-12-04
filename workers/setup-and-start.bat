@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ========================================
echo 🔧 本地开发环境完整初始化
echo ========================================
echo.

echo 📦 步骤1: 清理旧数据库...
if exist ".wrangler\state\v3\d1" (
    rd /s /q ".wrangler\state\v3\d1" 2>nul
)
if exist ".wrangler\state\v3\v3" (
    rd /s /q ".wrangler\state\v3\v3" 2>nul
)
echo ✅ 清理完成
echo.

echo 📦 步骤2: 初始化数据库...
call npx wrangler d1 execute tempemail --local --file=init-database.sql
if errorlevel 1 (
    echo ❌ 数据库初始化失败！
    pause
    exit /b 1
)
echo ✅ 数据库初始化成功
echo.

echo 📦 步骤3: 验证数据库...
call npx wrangler d1 execute tempemail --local --file=check-tables.sql
echo.

echo 🚀 步骤4: 启动开发服务器...
echo 💡 使用 Ctrl+C 停止服务器
echo.
call npm run dev
