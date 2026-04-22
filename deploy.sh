#!/bin/bash

# ============================================
# 快速部署脚本 - PC + H5 项目
# 使用方式：bash deploy.sh yourdomain.com
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 参数检查
if [ -z "$1" ]; then
    echo -e "${RED}错误：请提供域名参数${NC}"
    echo "使用方式：bash $0 yourdomain.com"
    exit 1
fi

DOMAIN=$1
DEPLOY_DIR="/var/www/$DOMAIN"
PC_DIR="$DEPLOY_DIR/pc"
H5_DIR="$DEPLOY_DIR/h5"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}开始部署：$DOMAIN${NC}"
echo -e "${GREEN}========================================${NC}"

# 步骤 1：检查是否以 root 运行
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}错误：请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 步骤 2：创建部署目录
echo -e "${YELLOW}[1/7] 创建部署目录...${NC}"
mkdir -p $PC_DIR
mkdir -p $H5_DIR

# 步骤 3：构建 PC 端
echo -e "${YELLOW}[2/7] 构建 PC 端项目...${NC}"
cd /path/to/wu_pc || exit 1
npm install
npm run build
cp -r dist/* $PC_DIR/

# 步骤 4：构建 H5 端
echo -e "${YELLOW}[3/7] 构建 H5 端项目...${NC}"
cd /path/to/wh_H5 || exit 1
npm install
npm run build
cp -r dist/* $H5_DIR/

# 步骤 5：设置文件权限
echo -e "${YELLOW}[4/7] 设置文件权限...${NC}"
chown -R www-data:www-data $DEPLOY_DIR
chmod -R 755 $DEPLOY_DIR

# 步骤 6：配置 Nginx
echo -e "${YELLOW}[5/7] 配置 Nginx...${NC}"
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;
    root $DEPLOY_DIR;
    index index.html;

    # 日志配置
    access_log /var/log/nginx/$DOMAIN.access.log;
    error_log /var/log/nginx/$DOMAIN.error.log;

    # 设备检测
    map \$http_user_agent \$device_type {
        default                     "pc";
        ~*"(Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)" "mobile";
        ~*"(Tablet|PlayBook|webOS)" "tablet";
    }

    # 根路径
    location = / {
        if (\$device_type = "mobile") {
            return 301 /h5/;
        }
        if (\$device_type = "tablet") {
            return 301 /h5/;
        }
        try_files /pc/index.html =404;
    }

    # PC 端
    location /pc {
        alias $PC_DIR;
        try_files \$uri \$uri/ /pc/index.html;
        
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # H5 端
    location /h5 {
        alias $H5_DIR;
        try_files \$uri \$uri/ /h5/index.html;
        
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 步骤 7：测试并重启 Nginx
echo -e "${YELLOW}[6/7] 测试 Nginx 配置...${NC}"
nginx -t

echo -e "${YELLOW}[7/7] 重启 Nginx...${NC}"
systemctl restart nginx

# 完成
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "访问地址："
echo -e "  PC 端：http://$DOMAIN/pc/"
echo -e "  H5 端：http://$DOMAIN/h5/"
echo -e "  自动检测：http://$DOMAIN/"
echo ""
echo -e "日志文件："
echo -e "  访问日志：/var/log/nginx/$DOMAIN.access.log"
echo -e "  错误日志：/var/log/nginx/$DOMAIN.error.log"
echo ""

# 验证
echo -e "${YELLOW}验证部署...${NC}"
sleep 2

# 检查 Nginx 状态
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx 运行正常${NC}"
else
    echo -e "${RED}✗ Nginx 未运行${NC}"
    exit 1
fi

# 检查文件
if [ -f "$PC_DIR/index.html" ]; then
    echo -e "${GREEN}✓ PC 端文件已部署${NC}"
else
    echo -e "${RED}✗ PC 端文件缺失${NC}"
fi

if [ -f "$H5_DIR/index.html" ]; then
    echo -e "${GREEN}✓ H5 端文件已部署${NC}"
else
    echo -e "${RED}✗ H5 端文件缺失${NC}"
fi

echo ""
echo -e "${GREEN}部署成功！可以访问测试了${NC}"
