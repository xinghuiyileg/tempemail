@echo off
chcp 65001 >nul
echo 🚀 启动临时邮箱系统（开发模式）
echo ================================
echo.

:: 检查依赖是否已安装
if not exist "frontend\node_modules" (
    echo ❌ 前端依赖未安装
    echo 请先运行: local-setup.bat
    pause
    exit /b 1
)

if not exist "workers\node_modules" (
    echo ❌ Workers 依赖未安装
    echo 请先运行: local-setup.bat
    pause
    exit /b 1
)

:: 检查环境变量
if not exist "frontend\.env" (
    echo ❌ 前端环境变量未配置
    echo 请先运行: local-setup.bat
    pause
    exit /b 1
)

if not exist "workers\.dev.vars" (
    echo ❌ Workers 环境变量未配置
    echo 请先运行: local-setup.bat
    pause
    exit /b 1
)

echo ✅ 依赖检查完成
echo.
echo 正在启动服务...
echo.
echo 📝 注意：
echo   - Workers 将运行在 http://localhost:8787
echo   - 前端将运行在 http://localhost:5173
echo   - 按 Ctrl+C 可以停止服务
echo.
echo ================================
echo.

:: 启动 Workers（在新窗口）
start "临时邮箱 - Workers API" cmd /k "cd workers && npm run dev"

:: 等待 3 秒让 Workers 启动
timeout /t 3 /nobreak >nul

:: 启动前端（在新窗口）
start "临时邮箱 - 前端" cmd /k "cd frontend && npm run dev"

:: 等待 5 秒让前端启动
timeout /t 5 /nobreak >nul

:: 打开浏览器
echo.
echo 🌐 正在打开浏览器...
start http://localhost:5173

echo.
echo ✅ 服务已启动！
echo.
echo 📊 查看日志：
echo   - Workers 日志在 "临时邮箱 - Workers API" 窗口
echo   - 前端日志在 "临时邮箱 - 前端" 窗口
echo.
echo 🛑 停止服务：
echo   - 关闭两个命令行窗口
echo   - 或在窗口中按 Ctrl+C
echo.
pause

