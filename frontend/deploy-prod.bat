@echo off
chcp 65001 > nul

echo 创建生产环境配置...
echo VITE_API_BASE=https://tempemail-back.pslucieljw.workers.dev/api > .env
echo VITE_WS_URL=wss://tempemail-back.pslucieljw.workers.dev/ws >> .env

echo 构建前端...
call npm run build

echo 部署到 Cloudflare Pages...
call wrangler pages deploy dist --project-name=tempemail --commit-dirty=true

echo.
echo 部署完成！


