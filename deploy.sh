#!/bin/bash

# 临时邮箱系统部署脚本

echo "🚀 开始部署临时邮箱系统..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否安装了必要的工具
check_requirements() {
    echo -e "${YELLOW}检查依赖...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖检查完成${NC}"
}

# 部署前端到 Cloudflare Pages
deploy_frontend() {
    echo -e "${YELLOW}📦 部署前端...${NC}"
    
    cd frontend
    
    # 安装依赖
    echo "安装前端依赖..."
    npm install
    
    # 构建
    echo "构建前端..."
    npm run build
    
    # 部署（需要先配置 wrangler）
    echo "部署到 Cloudflare Pages..."
    npx wrangler pages deploy dist --project-name=tempemail
    
    cd ..
    
    echo -e "${GREEN}✅ 前端部署完成${NC}"
}

# 初始化数据库
init_database() {
    echo -e "${YELLOW}🗄️  初始化数据库...${NC}"
    
    cd workers
    
    # 创建 D1 数据库（如果不存在）
    echo "创建 D1 数据库..."
    npx wrangler d1 create tempemail
    
    echo -e "${YELLOW}⚠️  请将输出的 database_id 填入 wrangler.toml 文件${NC}"
    echo "按回车继续..."
    read
    
    # 初始化数据库结构
    echo "初始化数据库结构..."
    npx wrangler d1 execute tempemail --file=schema.sql
    
    cd ..
    
    echo -e "${GREEN}✅ 数据库初始化完成${NC}"
}

# 部署 Workers
deploy_workers() {
    echo -e "${YELLOW}⚙️  部署 Workers...${NC}"
    
    cd workers
    
    # 安装依赖
    echo "安装 Workers 依赖..."
    npm install
    
    # 部署主 API Worker
    echo "部署 API Worker..."
    npx wrangler deploy
    
    # 配置 Email Worker
    echo -e "${YELLOW}📧 配置 Email Worker...${NC}"
    echo "请在 Cloudflare Dashboard 中配置 Email Routing："
    echo "1. 进入你的域名设置"
    echo "2. 打开 Email > Email Routing"
    echo "3. 添加 Email Worker，选择刚部署的 Worker"
    
    cd ..
    
    echo -e "${GREEN}✅ Workers 部署完成${NC}"
}

# 配置环境变量
configure_env() {
    echo -e "${YELLOW}🔧 配置环境变量...${NC}"
    
    # 前端环境变量
    if [ ! -f frontend/.env ]; then
        echo "创建前端 .env 文件..."
        cat > frontend/.env << EOF
VITE_API_BASE=https://your-worker.your-subdomain.workers.dev/api
VITE_WS_URL=wss://your-worker.your-subdomain.workers.dev/ws
EOF
        echo -e "${YELLOW}⚠️  请编辑 frontend/.env 文件，填入实际的 Worker URL${NC}"
    fi
    
    # Workers 环境变量
    if [ ! -f workers/.dev.vars ]; then
        echo "创建 Workers .dev.vars 文件..."
        cp workers/env.example workers/.dev.vars
        echo -e "${YELLOW}⚠️  请编辑 workers/.dev.vars 文件，填入实际配置${NC}"
    fi
    
    echo -e "${GREEN}✅ 环境变量配置完成${NC}"
}

# 主菜单
main_menu() {
    echo ""
    echo "请选择部署选项："
    echo "1) 完整部署（前端 + 后端 + 数据库）"
    echo "2) 仅部署前端"
    echo "3) 仅部署 Workers"
    echo "4) 仅初始化数据库"
    echo "5) 仅配置环境变量"
    echo "6) 退出"
    echo ""
    read -p "请输入选项 (1-6): " choice
    
    case $choice in
        1)
            check_requirements
            configure_env
            init_database
            deploy_workers
            deploy_frontend
            ;;
        2)
            check_requirements
            deploy_frontend
            ;;
        3)
            check_requirements
            deploy_workers
            ;;
        4)
            check_requirements
            init_database
            ;;
        5)
            configure_env
            ;;
        6)
            echo "退出部署"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项${NC}"
            main_menu
            ;;
    esac
}

# 运行主菜单
main_menu

echo ""
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "下一步："
echo "1. 在 Cloudflare Dashboard 配置 Email Routing"
echo "2. 在系统配置页面填入 Cloudflare API Token、Zone ID 等信息"
echo "3. 设置目标 QQ 邮箱"
echo "4. 开始使用临时邮箱系统"
echo ""

