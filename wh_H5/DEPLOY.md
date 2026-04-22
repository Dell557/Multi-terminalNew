# 宝塔面板部署步骤

## 📋 部署前准备

### 1. 本地构建项目
```bash
npm run build
```
构建完成后，会在 `dist` 目录生成生产文件。

---

## 🚀 部署步骤

### 第一步：上传文件到服务器

#### 1.1 前端文件上传
- 将 `dist` 文件夹内的**所有内容**上传到宝塔面板的站点目录
- 默认路径：`/www/wwwroot/你的域名/dist/`
- 或者直接在宝塔面板文件管理中上传 `dist` 文件夹

#### 1.2 后端文件上传
- 将以下文件/文件夹上传到服务器（建议放在站点目录外）：
  - `server/` 文件夹
  - `package.json`
  - `.env` 文件
  - `ecosystem.config.js`

---

### 第二步：配置后端服务

#### 2.1 安装 Node.js
- 在宝塔面板安装 Node.js（推荐版本 16.x 或更高）
- 安装命令：在宝塔终端执行 `nvm install 16`

#### 2.2 安装 PM2
```bash
npm install -g pm2
```

#### 2.3 安装后端依赖
```bash
cd /www/wwwroot/你的项目目录
npm install
```

#### 2.4 启动后端服务
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 2.5 验证后端服务
```bash
pm2 status
# 应该看到 wh-h5-backend 状态为 online
```

---

### 第三步：配置 Nginx

#### 3.1 在宝塔面板中配置网站
1. 进入宝塔面板 → 网站
2. 添加站点或选择现有站点
3. 点击"设置" → "配置文件"

#### 3.2 复制 Nginx 配置
将 `nginx.conf` 文件中的配置复制到站点配置中，并修改：
- `root` 路径：改为实际的 dist 目录路径
- `proxy_pass`：如果后端端口不同，修改为实际端口

示例配置：
```nginx
location / {
    root /www/wwwroot/你的域名/dist;
    try_files $uri $uri/ /index.html;
    index index.html;
}

location /api {
    proxy_pass http://127.0.0.1:8088;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

#### 3.3 重载 Nginx 配置
- 保存配置文件后，宝塔会自动重载 Nginx
- 或者手动执行：`nginx -s reload`

---

### 第四步：配置防火墙

#### 4.1 在宝塔面板放行端口
1. 进入宝塔面板 → 安全
2. 放行端口：80（HTTP）、443（HTTPS）、8088（后端 API）

#### 4.2 如果使用云服务器
- 还需要在云服务商的安全组中放行上述端口

---

### 第五步：配置数据库连接

#### 5.1 SSH 隧道配置
如果数据库在远程服务器，需要建立 SSH 隧道：

```bash
# 在服务器终端执行
ssh -L 3306:远程数据库 IP:3306 用户名@远程服务器 IP -N -f
```

#### 5.2 或使用宝塔数据库管理
- 在宝塔面板 → 数据库 中添加远程数据库
- 主机填写远程数据库 IP
- 填写用户名和密码

---

### 第六步：测试验证

#### 6.1 访问前端页面
- 浏览器访问：`http://你的域名`
- 检查页面是否正常加载

#### 6.2 测试 API 连接
- 打开浏览器开发者工具 → Network
- 访问课程列表，检查 `/api/courses` 请求是否成功
- 状态码应该为 200

#### 6.3 检查后端日志
```bash
pm2 logs wh-h5-backend
```

---

## 🔧 常见问题排查

### 问题 1：前端页面空白
- 检查 Nginx 配置中的 `root` 路径是否正确
- 检查浏览器控制台是否有错误
- 确认 `dist` 目录文件已上传完整

### 问题 2：API 请求失败（404/502）
- 检查后端服务是否运行：`pm2 status`
- 检查 Nginx 的 `proxy_pass` 配置
- 查看后端日志：`pm2 logs`

### 问题 3：数据库连接失败
- 确认 SSH 隧道已建立
- 检查 `.env` 文件中的数据库配置
- 测试数据库连接：`mysql -h localhost -u topic_new -p`

### 问题 4：跨域错误
- 确认 Nginx 反向代理配置正确
- 检查后端 CORS 配置（已在 `server/index.js` 中配置）

---

## 📝 维护命令

### 重启后端服务
```bash
pm2 restart wh-h5-backend
```

### 查看后端日志
```bash
pm2 logs wh-h5-backend --lines 100
```

### 停止后端服务
```bash
pm2 stop wh-h5-backend
```

### 更新前端
1. 本地执行 `npm run build`
2. 重新上传 `dist` 目录到服务器
3. 清除浏览器缓存

### 更新后端
1. 上传更新的文件到服务器
2. 执行 `pm2 restart wh-h5-backend`

---

## 🎯 优化建议

### 1. 启用 HTTPS
- 在宝塔面板 → SSL 中申请免费 Let's Encrypt 证书
- 启用强制 HTTPS

### 2. 开启 CDN
- 将静态资源（图片、CSS、JS）放到 CDN
- 修改 `.env.production` 中的资源路径

### 3. 数据库备份
- 在宝塔面板设置定时备份任务
- 备份到云存储或本地

### 4. 监控告警
- 使用宝塔监控功能
- 设置 PM2 监控：`pm2 install pm2-logrotate`

---

## 📞 技术支持

如有问题，请检查：
1. 宝塔面板日志
2. PM2 进程状态
3. Nginx 访问日志
4. 数据库连接状态
