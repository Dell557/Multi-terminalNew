# 📋 快速部署指南 - 3 步完成

## 🎯 最小风险方案

**核心优势：**
- ✅ **零代码修改**：不改动任何项目代码
- ✅ **UI 完全不变**：保持原有 PC 和 H5 界面
- ✅ **服务器端判断**：使用 Nginx 检测 User Agent
- ✅ **稳定可靠**：Nginx 是成熟的 Web 服务器

---

## 🚀 快速部署（3 步）

### 步骤 1：构建项目

```bash
# 构建 PC 端
cd d:\wh_zk\wu_pc
npm run build

# 构建 H5 端
cd d:\wh_zk\wu_pc\wh_H5
npm run build
```

### 步骤 2：上传到服务器

```bash
# 在服务器上执行
sudo mkdir -p /var/www/yourdomain.com/pc
sudo mkdir -p /var/www/yourdomain.com/h5

# 上传 PC 端构建文件到 /var/www/yourdomain.com/pc/
# 上传 H5 端构建文件到 /var/www/yourdomain.com/h5/
```

### 步骤 3：配置 Nginx

创建文件 `/etc/nginx/sites-available/yourdomain.com`：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # 设备检测
    map $http_user_agent $device_type {
        default                     "pc";
        ~*"(Mobile|Android|iPhone|iPad)" "mobile";
    }
    
    # 根路径自动跳转
    location = / {
        if ($device_type = "mobile") {
            return 301 /h5/;
        }
        try_files /pc/index.html =404;
    }
    
    # PC 端
    location /pc {
        alias /var/www/yourdomain.com/pc;
        try_files $uri $uri/ /pc/index.html;
    }
    
    # H5 端
    location /h5 {
        alias /var/www/yourdomain.com/h5;
        try_files $uri $uri/ /h5/index.html;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✅ 完成！

访问测试：
- PC 用户访问：`https://yourdomain.com` → 自动显示 PC 端
- 手机用户访问：`https://yourdomain.com` → 自动显示 H5 端

---

## 📦 详细文档

- [`NGINX_DEPLOYMENT.md`](./NGINX_DEPLOYMENT.md) - 完整部署文档
- [`deploy.sh`](./deploy.sh) - 自动化部署脚本
- [`ROLLBACK_SUMMARY.md`](./ROLLBACK_SUMMARY.md) - 回滚说明

---

## 🔍 验证方法

```bash
# 1. 检查 Nginx 状态
sudo systemctl status nginx

# 2. 测试 PC 端访问
curl -I https://yourdomain.com/pc/

# 3. 测试 H5 端访问（模拟手机）
curl -I -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" https://yourdomain.com/

# 4. 查看日志
sudo tail -f /var/log/nginx/yourdomain.com.access.log
```

---

## 🎯 总结

**这个方案：**
- ✅ 不修改任何代码
- ✅ UI 完全不变
- ✅ 使用 Nginx 稳定可靠
- ✅ 易于维护和扩展

**项目已经可以部署使用了！** 🚀
