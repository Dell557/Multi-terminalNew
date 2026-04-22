# 数据库问题快速修复 Prompt 模板

## 📋 标准 Prompt（复制粘贴即可）

```
数据库连接出问题了，请按以下流程快速修复：

1. 检查 SSH 隧道是否运行
2. 检查 .env 配置（DB_HOST、DB_USER、DB_PASS、DB_NAME、USE_MOCK_DATA）
3. 运行 npm run db:health 测试连接
4. 根据错误信息修复
5. 重启后端服务器

当前现象：[描述你看到的问题，例如：页面显示 Mock 数据 / 无法访问 / 500 错误]
```

---

## 🚀 更简单的版本

### 版本 1：最简版
```
数据库连不上了，帮我修复一下
```

### 版本 2：带错误信息
```
数据库出问题了，错误是：[粘贴错误信息]
```

### 版本 3：描述现象
```
页面显示的是 Mock 数据，帮我切换到真实数据库
```

---

## 🔧 一键修复命令

### Windows PowerShell
```powershell
.\fix-db-connection.ps1
```

### 手动快速修复（30 秒）
```powershell
# 1. 启动 SSH 隧道（新窗口）
ssh -i "C:\Users\loveb\.ssh\47.98.100.22_id_ed25519" -o IdentitiesOnly=yes -N -L 3306:127.0.0.1:3306 root@47.98.100.22

# 2. 测试连接
npm run db:health

# 3. 重启后端
npm run server
```

---

## ✅ 标准配置（供参考）

**.env 文件正确配置**：
```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=topic_new
DB_PASS=zkyc@565758
DB_NAME=topic_new
USE_MOCK_DATA=false
```

**数据库信息**：
- 数据库名：`topic_new`
- 用户名：`topic_new`
- 密码：`zkyc@565758`
- 连接方式：SSH 隧道（本地 3306 → 远程 3306）

---

## 📊 常见错误速查

| 现象 | 原因 | 解决方案 |
|------|------|---------|
| 显示 Mock 数据 | USE_MOCK_DATA=true | 改为 false，重启后端 |
| ETIMEDOUT | SSH 隧道未运行 | 启动 SSH 隧道 |
| Access denied | 用户名/密码错误 | 检查 .env 配置 |
| 500 错误 | 数据库连接断开 | 重启后端服务器 |
| 无法访问网站 | 服务器未启动 | 运行 npm run dev 和 npm run server |

---

**保存位置**：
- 完整指南：`DATABASE_TROUBLESHOOTING.md`
- 一键修复：`fix-db-connection.ps1`
- 本模板：`QUICK_FIX_PROMPT.md`

**下次遇到问题**：
1. 运行 `.\fix-db-connection.ps1` 自动检测
2. 或直接说"数据库出问题了"，我会按流程修复
