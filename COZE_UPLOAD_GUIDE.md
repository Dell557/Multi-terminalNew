# 📦 扣子（Coze）平台上传指南

## ✅ 构建完成

已完成构建，文件位置：
- **PC 端**：`d:\wh_zk\wu_pc\dist\`
- **H5 端**：`d:\wh_zk\wu_pc\wh_H5\dist\`

---

## 🚀 上传到扣子的 3 种方式

### 方式 1：直接拖拽上传（最简单）⭐

#### 步骤：

1. **在扣子平台创建项目**
   - 访问：https://www.coze.cn/
   - 点击左侧"项目"
   - 点击顶部"网页应用"
   - 点击"新建项目"

2. **上传 PC 端代码**
   - 将 `d:\wh_zk\wu_pc\dist` 文件夹重命名为 `pc`
   - 拖拽整个 `pc` 文件夹到扣子的代码上传区域

3. **上传 H5 端代码**
   - 将 `d:\wh_zk\wu_pc\wh_H5\dist` 文件夹重命名为 `h5`
   - 拖拽整个 `h5` 文件夹到扣子的代码上传区域

4. **配置构建设置**
   ```yaml
   Node 版本：20
   安装命令：npm install
   构建命令：npm run build
   输出目录：dist
   ```

5. **添加环境变量**（如需要）
   ```
   VITE_API_TARGET=http://localhost:3002
   VITE_API_PORT=3002
   ```

6. **点击部署**，等待完成

---

### 方式 2：使用 Git 仓库（推荐用于持续更新）

#### 步骤：

1. **初始化 Git 仓库**
   ```bash
   cd d:\wh_zk\wu_pc
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **推送到 GitHub/Gitee**
   ```bash
   # GitHub
   git remote add origin https://github.com/yourname/wu_pc.git
   git push -u origin main

   # 或 Gitee
   git remote add origin https://gitee.com/yourname/wu_pc.git
   git push -u origin main
   ```

3. **在扣子平台导入**
   - 点击"从 Git 导入"
   - 选择 GitHub 或 Gitee
   - 授权扣子访问你的仓库
   - 选择 `wu_pc` 仓库

4. **配置自动部署**
   - 设置分支：`main`
   - 设置构建命令：`npm run build`
   - 设置输出目录：`dist`

---

### 方式 3：上传整个项目（包含源代码）

#### 打包项目：

1. **创建上传包**
   ```bash
   # 在 PowerShell 中执行
   cd d:\wh_zk\wu_pc
   Compress-Archive -Path * -DestinationPath wu_pc_for_coze.zip -Force
   ```

2. **在扣子平台上传**
   - 点击"上传代码"
   - 选择 `wu_pc_for_coze.zip`
   - 等待上传完成

3. **配置构建**
   - Node 版本：20
   - 安装命令：`npm install`
   - 构建命令：`npm run build`
   - 输出目录：`dist`

---

## 🔧 设备检测配置

上传完成后，在扣子平台配置设备检测：

### 在扣子平台的"路由配置"或"中间件"中添加：

```javascript
// 设备检测中间件
export default function deviceDetection(request) {
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  
  const url = new URL(request.url)
  
  // 根路径自动跳转
  if (url.pathname === '/') {
    if (isMobile) {
      return Response.redirect(url.origin + '/h5/', 301)
    } else {
      return Response.redirect(url.origin + '/pc/', 301)
    }
  }
  
  return fetch(request)
}
```

---

## 📊 项目结构说明

上传后的项目结构应该是：

```
/
├── pc/              # PC 端构建文件
│   ├── index.html
│   ├── assets/
│   └── ...
├── h5/              # H5 端构建文件
│   ├── index.html
│   ├── assets/
│   └── ...
└── .coze/          # 扣子配置文件（可选）
    └── config.yaml
```

---

## 🎯 快速操作清单

### 立即执行：

- [ ] 1. 访问 https://www.coze.cn/
- [ ] 2. 登录/注册账号
- [ ] 3. 点击"新建项目"
- [ ] 4. 选择"网页应用"
- [ ] 5. 填写项目信息：
  - 名称：课程展示平台
  - 类型：教育/学术
  - 可见性：公开
- [ ] 6. 上传 `dist` 文件夹（PC 和 H5）
- [ ] 7. 配置构建设置
- [ ] 8. 点击部署
- [ ] 9. 获取访问地址

---

## 🔍 验证部署

部署完成后，测试访问：

1. **PC 访问测试**
   - 访问：`https://your-app.coze.app/pc/`
   - 应该显示 PC 端界面

2. **H5 访问测试**
   - 访问：`https://your-app.coze.app/h5/`
   - 应该显示 H5 端界面

3. **设备检测测试**
   - 使用手机访问：`https://your-app.coze.app/`
   - 应该自动跳转到 H5 端

---

## 📝 常见问题

### Q1: 上传后无法访问？
**解决：** 检查构建配置是否正确，确保输出目录设置为 `dist`

### Q2: 如何绑定自定义域名？
**解决：** 在扣子平台的"域名管理"中绑定域名，并配置 DNS 解析

### Q3: 如何启用 HTTPS？
**解决：** 扣子平台自动提供 HTTPS，无需额外配置

### Q4: 如何更新代码？
**解决：** 
- 方式 1：重新上传构建文件
- 方式 2：推送 Git 仓库，自动触发部署

---

## 🎉 完成！

部署成功后，您将获得：
- ✅ 一个可访问的 HTTPS 网址
- ✅ 自动设备检测
- ✅ PC 和 H5 端自动适配
- ✅ 访问统计和监控

**下一步：** 将网址分享给用户！🚀
