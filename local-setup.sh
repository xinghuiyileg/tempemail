#!/bin/bash

# 本地开发环境快速设置脚本

echo "🚀 临时邮箱系统 - 本地环境设置"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查 Node.js
echo -e "${YELLOW}检查 Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 版本: $(node -v)${NC}"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm 版本: $(npm -v)${NC}"
echo ""

# 安装依赖
echo -e "${YELLOW}📦 安装依赖...${NC}"

echo "安装前端依赖..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 前端依赖安装失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 前端依赖安装完成${NC}"

echo "安装 Workers 依赖..."
cd ../workers
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Workers 依赖安装失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Workers 依赖安装完成${NC}"
echo ""

# 配置环境变量
echo -e "${YELLOW}🔧 配置环境变量...${NC}"

# 前端环境变量
if [ ! -f ../frontend/.env ]; then
    echo "创建前端 .env 文件..."
    cat > ../frontend/.env << 'EOF'
VITE_API_BASE=http://localhost:8787/api
VITE_WS_URL=ws://localhost:8787/ws
EOF
    echo -e "${GREEN}✅ 前端环境变量已创建${NC}"
else
    echo -e "${YELLOW}⚠️  前端 .env 文件已存在，跳过${NC}"
fi

# Workers 环境变量
if [ ! -f .dev.vars ]; then
    echo "创建 Workers .dev.vars 文件..."
    cat > .dev.vars << 'EOF'
# Cloudflare 配置（本地测试使用模拟值）
CLOUDFLARE_API_TOKEN=test_token_for_local_dev
CLOUDFLARE_ACCOUNT_ID=test_account_id
CLOUDFLARE_ZONE_ID=test_zone_id

# 域名配置
DOMAIN_NAME=test.local

# 目标邮箱
TARGET_EMAIL=test@qq.com

# 监控配置
MONITOR_INTERVAL=10
AUTO_DELETE_DAYS=7
EOF
    echo -e "${GREEN}✅ Workers 环境变量已创建${NC}"
else
    echo -e "${YELLOW}⚠️  Workers .dev.vars 文件已存在，跳过${NC}"
fi
echo ""

# 初始化数据库
echo -e "${YELLOW}🗄️  初始化本地数据库...${NC}"
echo "创建 D1 数据库（本地模式）..."

# 使用 --local 标志初始化本地数据库
npx wrangler d1 execute tempemail --local --file=schema.sql 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
else
    echo -e "${YELLOW}⚠️  数据库可能已存在或需要手动初始化${NC}"
    echo "请运行: cd workers && npx wrangler d1 execute tempemail --local --file=schema.sql"
fi
echo ""

# 创建测试数据
echo -e "${YELLOW}📝 是否创建测试数据？(y/n)${NC}"
read -r create_test_data

if [ "$create_test_data" = "y" ] || [ "$create_test_data" = "Y" ]; then
    echo "创建测试数据..."
    cat > test-data.sql << 'EOF'
-- 插入测试邮箱
INSERT OR IGNORE INTO temp_emails (id, email, target_email, message_count, status, created_at) VALUES
(1, 'temp_test001@test.local', 'test@qq.com', 3, 'active', datetime('now')),
(2, 'temp_test002@test.local', 'test@qq.com', 1, 'active', datetime('now', '-1 hour'));

-- 插入测试邮件
INSERT OR IGNORE INTO messages (id, temp_email_id, sender, subject, body_text, verification_code, received_at, is_read) VALUES
(1, 1, 'noreply@github.com', '欢迎加入 GitHub', '感谢您注册 GitHub。您的验证码是：123456', '123456', datetime('now'), 0),
(2, 1, 'security@google.com', 'Google 安全验证', '您的 Google 验证码：789012', '789012', datetime('now', '-30 minutes'), 0),
(3, 1, 'noreply@amazon.com', '订单确认', '您的订单已确认，订单号：ABC123', NULL, datetime('now', '-1 hour'), 1),
(4, 2, 'hello@notion.so', 'Notion 工作区邀请', '您被邀请加入工作区，验证码：456789', '456789', datetime('now', '-2 hours'), 0);
EOF
    
    npx wrangler d1 execute tempemail --local --file=test-data.sql 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 测试数据创建完成${NC}"
        rm test-data.sql
    else
        echo -e "${YELLOW}⚠️  测试数据创建可能失败，请查看错误信息${NC}"
    fi
fi
echo ""

cd ..

# 完成
echo ""
echo -e "${GREEN}🎉 本地环境设置完成！${NC}"
echo ""
echo "下一步："
echo "1. 在一个终端运行：cd workers && npm run dev"
echo "2. 在另一个终端运行：cd frontend && npm run dev"
echo "3. 打开浏览器访问：http://localhost:5173"
echo ""
echo "📖 查看完整文档：本地测试指南.md"
echo ""

