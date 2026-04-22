# 🚀 Nginx 部署方案 - 最小风险

## 📋 方案说明

**核心优势：**
- ✅ **零代码修改**：不改动任何项目代码
- ✅ **UI 完全不变**：保持原有 PC 和 H5 界面
- ✅ **服务器端判断**：使用 Nginx 检测 User Agent
- ✅ **稳定可靠**：Nginx 是成熟的 Web 服务器
- ✅ **随时回滚**：修改 Nginx 配置即可

---

## 🔧 Nginx 配置

### 完整配置文件

创建或修改 Nginx 配置文件（通常在 `/etc/nginx/sites-available/yourdomain.com`）：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/yourdomain.com;
    index index.html;

    # 日志配置
    access_log /var/log/nginx/yourdomain.com.access.log;
    error_log /var/log/nginx/yourdomain.com.error.log;

    # ==================== 设备检测 ====================
    # 在根路径根据 User Agent 判断设备类型
    map $http_user_agent $device_type {
        default                     "pc";
        ~*"(Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)" "mobile";
        ~*"(Tablet|PlayBook|webOS)" "tablet";
    }

    # ==================== 根路径 ====================
    # 访问根路径时，根据设备类型跳转到不同目录
    location = / {
        # 如果是移动设备或平板，跳转到 H5
        if ($device_type = "mobile") {
            return 301 /h5/;
        }
        if ($device_type = "tablet") {
            return 301 /h5/;
        }
        # 否则跳转到 PC（默认）
        try_files /pc/index.html =404;
    }

    # ==================== PC 端 ====================
    # PC 端文件在 /pc/ 目录
    location /pc {
        alias /var/www/yourdomain.com/pc;
        try_files $uri $uri/ /pc/index.html;
        
        # 缓存静态资源
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # ==================== H5 端 ====================
    # H5 端文件在 /h5/ 目录
    location /h5 {
        alias /var/www/yourdomain.com/h5;
        try_files $uri $uri/ /h5/index.html;
        
        # 缓存静态资源
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # ==================== 静态资源 ====================
    # 公共静态资源
    location /assets {
        alias /var/www/yourdomain.com/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # ==================== API 代理 ====================
    # 如果需要代理 API 请求
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ==================== Gzip 压缩 ====================
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;
    gzip_disable "MSIE [1-6]\.";
}

# ==================== HTTPS 配置（可选） ====================
# 如果需要启用 HTTPS，添加以下配置
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name yourdomain.com www.yourdomain.com;
#     
#     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
#     ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
#     
#     # SSL 配置
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#     
#     # 其他配置同上...
# }
# 
# # HTTP 自动跳转 HTTPS
# server {
#     listen 80;
#     listen [::]:80;
#     server_name yourdomain.com www.yourdomain.com;
#     return 301 https://$server_name$request_uri;
# }
```

---

## 📦 部署步骤

### 步骤 1：准备项目文件

```bash
# 1. 创建部署目录
sudo mkdir -p /var/www/yourdomain.com

# 2. 构建 PC 端项目
cd /path/to/wu_pc
npm run build

# 3. 复制 PC 端到 /var/www/yourdomain.com/pc
sudo cp -r dist/* /var/www/yourdomain.com/pc/

# 4. 构建 H5 端项目
cd /path/to/wh_H5
npm run build

# 5. 复制 H5 端到 /var/www/yourdomain.com/h5
sudo cp -r dist/* /var/www/yourdomain.com/h5/
```

### 步骤 2：配置 Nginx

```bash
# 1. 创建 Nginx 配置文件
sudo nano /etc/nginx/sites-available/yourdomain.com

# 2. 粘贴上面的配置内容

# 3. 启用站点
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# 4. 删除默认配置（如果有冲突）
sudo rm /etc/nginx/sites-enabled/default

# 5. 测试 Nginx 配置
sudo nginx -t

# 6. 重启 Nginx
sudo systemctl restart nginx
```

### 步骤 3：验证部署

```bash
# 1. 检查 Nginx 状态
sudo systemctl status nginx

# 2. 查看 Nginx 日志
sudo tail -f /var/log/nginx/yourdomain.com.access.log
sudo tail -f /var/log/nginx/yourdomain.com.error.log
```

---

## 🧪 测试方法

### 1. 测试 PC 端访问

在 PC 浏览器访问：
```
https://yourdomain.com
```
**预期：** 自动显示 PC 端界面

### 2. 测试移动端访问

**方法 A：使用手机访问**
```
https://yourdomain.com
```
**预期：** 自动显示 H5 端界面

**方法 B：使用 Chrome DevTools**
1. 打开 Chrome DevTools (F12)
2. 切换到 Network 标签
3. 点击右上角菜单 → More tools → Network conditions
4. 取消勾选 "Use browser default"
5. 选择 "iPhone" 或 "Android"
6. 刷新页面

**预期：** 自动跳转到 `/h5/`

### 3. 测试直接访问

```bash
# 直接访问 PC 端
curl -I https://yourdomain.com/pc/

# 直接访问 H5 端
curl -I https://yourdomain.com/h5/

# 使用移动 User Agent 访问根路径
curl -I -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" https://yourdomain.com/
```

---

## 📊 目录结构

部署后的服务器目录结构：

```
/var/www/yourdomain.com/
├── pc/                    # PC 端构建文件
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── ...
├── h5/                    # H5 端构建文件
│   ├── index.html
│   ├── assets/
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── ...
└── assets/                # 公共静态资源（可选）
```

---

## ⚙️ 高级配置

### 1. 添加缓存控制

在 Nginx 配置中添加：

```nginx
# 对 HTML 文件不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}

# 对 API 请求不缓存
location /api {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    proxy_no_cache 1;
    proxy_cache_bypass 1;
}
```

### 2. 添加安全头

```nginx
# 安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-src 'self' https:;" always;
```

### 3. 添加性能优化

```nginx
# 开启 sendfile
sendfile on;
tcp_nopush on;
tcp_nodelay on;

# 保持连接
keepalive_timeout 65;
types_hash_max_size 2048;

# 限制请求
limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
location / {
    limit_req zone=one burst=20 nodelay;
}
```

---

## 🔍 故障排查

### 问题 1：Nginx 启动失败

```bash
# 检查配置语法
sudo nginx -t

# 查看详细错误
sudo journalctl -xeu nginx
```

### 问题 2：设备检测不生效

```bash
# 检查 User Agent 是否正确匹配
curl -I -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" https://yourdomain.com/

# 应该返回 301 跳转到 /h5/
```

### 问题 3：静态资源 404

检查文件路径：
```bash
# 查看文件是否存在
ls -la /var/www/yourdomain.com/pc/
ls -la /var/www/yourdomain.com/h5/

# 检查 Nginx 配置中的 alias 路径是否正确
```

### 问题 4：页面空白

查看浏览器控制台和 Nginx 日志：
```bash
# 查看访问日志
sudo tail -f /var/log/nginx/yourdomain.com.access.log

# 查看错误日志
sudo tail -f /var/log/nginx/yourdomain.com.error.log
```

---

## 📈 监控和维护

### 1. 查看访问统计

```bash
# 查看今日访问量
sudo awk '$4 ~ /['$(date +%d)'/Nov/'$(date +%Y)'/] {print $1}' /var/log/nginx/yourdomain.com.access.log | sort | uniq -c | wc -l

# 查看 PC 和 H5 的访问比例
sudo grep "GET /pc/" /var/log/nginx/yourdomain.com.access.log | wc -l
sudo grep "GET /h5/" /var/log/nginx/yourdomain.com.access.log | wc -l
```

### 2. 定期清理日志

```bash
# 创建日志轮转配置
sudo nano /etc/logrotate.d/nginx

# 添加以下内容：
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then
            run-parts /etc/logrotate.d/httpd-prerotate
        fi
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
```

---

## ✅ 检查清单

部署前检查：
- [ ] PC 端构建完成
- [ ] H5 端构建完成
- [ ] Nginx 已安装
- [ ] 域名已解析到服务器
- [ ] SSL 证书已准备（如果需要 HTTPS）

部署后检查：
- [ ] Nginx 配置测试通过
- [ ] Nginx 服务正常运行
- [ ] PC 端访问正常
- [ ] H5 端访问正常
- [ ] 设备检测正常
- [ ] 静态资源加载正常
- [ ] API 请求正常
- [ ] 日志记录正常

---

## 🎯 总结

**这个方案的优势：**

1. ✅ **零代码修改**：不改动任何项目代码
2. ✅ **UI 完全不变**：保持原有 PC 和 H5 界面
3. ✅ **服务器端判断**：使用 Nginx 检测 User Agent
4. ✅ **稳定可靠**：Nginx 是成熟的 Web 服务器
5. ✅ **易于维护**：修改 Nginx 配置即可
6. ✅ **性能优秀**：Nginx 处理静态资源效率高
7. ✅ **可扩展**：支持 HTTPS、Gzip、缓存等

**项目已经可以正常部署使用了！** 🚀
