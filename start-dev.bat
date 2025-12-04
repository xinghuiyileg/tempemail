@echo off
chcp 65001 > nul

echo ========================================
echo 🚀 启动完整本地开发环境
echo ========================================
echo.

echo 📝 本地开发环境配置:
echo    - 后端: http://localhost:8787
echo    - 前端: http://localhost:5173
echo    - 数据库: 本地 SQLite (.wrangler/state/v3/d1/)
echo.

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 💡 提示: 
echo    - 后端和前端将在两个独立的窗口中运行
echo    - 关闭任一窗口将停止对应的服务
echo    - 使用 Ctrl+C 可以停止服务
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

echo 🔧 步骤 1/2: 启动后端服务器...
start "TempEmail - 后端服务器" cmd /k "cd /d %~dp0workers && echo 🚀 启动后端开发服务器... && echo. && npm run dev"

echo ⏳ 等待后端启动 (5秒)...
timeout /t 5 /nobreak > nul

echo.
echo 🎨 步骤 2/2: 启动前端服务器...
start "TempEmail - 前端服务器" cmd /k "cd /d %~dp0frontend && echo 🚀 启动前端开发服务器... && echo. && npm run dev"

echo.
echo ✅ 开发环境启动完成！
echo.
echo 📍 访问地址:
echo    前端: http://localhost:5173
echo    后端: http://localhost:8787
echo.
echo 💡 两个服务器窗口已打开，请保持它们运行
echo.

pause

