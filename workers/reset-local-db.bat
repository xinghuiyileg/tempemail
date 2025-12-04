@echo off
chcp 65001 > nul
echo ========================================
echo 🗑️  清空并重建本地数据库
echo ========================================
echo.

echo ⚠️  警告：这将删除所有本地测试数据！
echo ℹ️  远程生产数据不受影响
echo.
pause

echo.
echo 🗑️  删除本地数据库文件...
if exist ".wrangler\state" (
    rmdir /s /q ".wrangler\state"
    echo ✅ 本地数据库已删除
) else (
    echo ℹ️  本地数据库不存在
)

echo.
echo 📦 重新初始化本地数据库...
call npm run db:init

echo.
echo ✅ 完成！本地数据库已重置为空
echo.
echo 下一步：运行 npm run dev 或 dev.bat 启动开发服务器
pause

