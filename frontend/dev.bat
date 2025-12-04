@echo off
chcp 65001 > nul

echo ========================================
echo 🚀 启动前端本地开发服务器
echo ========================================
echo.

echo 📝 检查环境配置...
if exist ".env" (
    echo ⚠️  发现 .env 文件（可能是部署脚本创建的）
    echo 💡 本地开发会自动使用 .env.development 配置
    echo.
)

echo ✅ 使用本地开发配置:
echo    - API: http://localhost:8787/api
echo    - WebSocket: ws://localhost:8787/ws
echo.

echo 🔧 确保后端已启动...
echo 💡 如果后端未启动，请在另一个终端运行:
echo    cd workers
echo    npm run dev
echo.

echo 🌐 启动前端开发服务器...
echo 📍 访问地址: http://localhost:5173
echo.

npm run dev

