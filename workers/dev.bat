@echo off
chcp 65001 > nul
echo ========================================
echo 🚀 启动本地开发环境
echo ========================================
echo.

echo 📦 检查本地数据库...
if not exist ".wrangler\state\v3\d1" (
    echo ⚠️  首次运行，初始化本地数据库...
    call npm run db:init
    echo ✅ 数据库初始化完成！
    echo.
) else (
    echo ✅ 本地数据库已存在
    echo.
)

echo 🔧 启动开发服务器（使用本地数据库）...
echo 📝 本地数据位置: .wrangler\state\v3\d1\
echo 🌐 访问地址: http://localhost:8787
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ℹ️  提示：本地开发使用独立的本地数据库
echo    远程生产数据不会受到影响
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

npm run dev

