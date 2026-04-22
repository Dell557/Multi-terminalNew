# 数据库连接问题快速排查指南

## 🚨 快速诊断流程（5 分钟内解决）

### 第一步：检查 SSH 隧道是否运行

```powershell
# 检查 SSH 隧道进程
Get-Process ssh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*3306*" }
```

**如果 SSH 隧道未运行**，立即启动：
```powershell
ssh -i "C:\Users\loveb\.ssh\47.98.100.22_id_ed25519" -o IdentitiesOnly=yes -N -L 3306:127.0.0.1:3306 root@47.98.100.22
```

---

### 第二步：检查数据库配置

查看 `.env` 文件：
```bash
DB_HOST=127.0.0.1          # ✅ 必须是 127.0.0.1（通过 SSH 隧道）
DB_PORT=3306
DB_USER=topic_new          # ✅ 确认用户名正确
DB_PASS=zkyc@565758        # ✅ 确认密码正确
DB_NAME=topic_new          # ✅ 确认数据库名正确
USE_MOCK_DATA=false        # ✅ 必须为 false
```

**常见错误**：
- ❌ `DB_HOST=47.98.100.22` → 应改为 `127.0.0.1`
- ❌ `DB_USER=root` → 应改为 `topic_new`
- ❌ `DB_NAME=topic_mall` → 应改为 `topic_new`

---

### 第三步：测试数据库连接

运行健康检查：
```bash
npm run db:health
```

**预期结果**：
```json
{
  "ok": true,
  "host": "127.0.0.1",
  "port": 3306,
  "database": "topic_new",
  "table": "courses",
  "rowCount": 252
}
```

**常见错误及解决方案**：

| 错误代码 | 原因 | 解决方案 |
|---------|------|---------|
| `ETIMEDOUT` | SSH 隧道未运行 | 启动 SSH 隧道（见第一步） |
| `ER_ACCESS_DENIED_ERROR` | 用户名/密码错误 | 检查 `.env` 中的 `DB_USER` 和 `DB_PASS` |
| `ER_NO_SUCH_DATABASE` | 数据库名错误 | 检查 `.env` 中的 `DB_NAME` |

---

### 第四步：重启后端服务器

```bash
# 停止现有后端服务（Ctrl+C 或关闭终端）
# 重新启动
npm run server
```

**检查日志**：
```
✅ 正确日志：
info: 数据库连接池已配置 {"database":"topic_new","host":"127.0.0.1",...}
info: 服务器已启动 {"port":8181,...}
server started on http://localhost:8181

❌ 错误日志：
ERROR: Access denied for user...
ERROR: connect ETIMEDOUT...
```

---

### 第五步：验证 API 数据

测试 API 是否正常返回数据：
```powershell
Invoke-WebRequest -Uri "http://localhost:8181/api/courses?limit=3" -UseBasicParsing | Select-Object -ExpandProperty Content
```

**预期结果**：返回 JSON 数据，包含 `source: "mysql"` 和课程列表。

---

## 📋 完整修复命令清单

### 一键修复脚本（保存为 `fix-db-connection.ps1`）

```powershell
# 1. 检查并启动 SSH 隧道
Write-Host "检查 SSH 隧道..." -ForegroundColor Cyan
$sshProcess = Get-Process ssh -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*3306*" }

if (-not $sshProcess) {
    Write-Host "启动 SSH 隧道..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh -i 'C:\Users\loveb\.ssh\47.98.100.22_id_ed25519' -o IdentitiesOnly=yes -N -L 3306:127.0.0.1:3306 root@47.98.100.22"
    Start-Sleep -Seconds 3
} else {
    Write-Host "SSH 隧道已运行" -ForegroundColor Green
}

# 2. 检查 .env 配置
Write-Host "`n检查数据库配置..." -ForegroundColor Cyan
$envContent = Get-Content .env
$requiredSettings = @(
    "DB_HOST=127.0.0.1",
    "DB_USER=topic_new",
    "DB_PASS=zkyc@565758",
    "DB_NAME=topic_new",
    "USE_MOCK_DATA=false"
)

$allCorrect = $true
foreach ($setting in $requiredSettings) {
    if ($envContent -notcontains $setting) {
        Write-Host "❌ 缺少或错误：$setting" -ForegroundColor Red
        $allCorrect = $false
    }
}

if ($allCorrect) {
    Write-Host "✅ 数据库配置正确" -ForegroundColor Green
}

# 3. 测试连接
Write-Host "`n测试数据库连接..." -ForegroundColor Cyan
npm run db:health

# 4. 提示重启后端
Write-Host "`n如需重启后端，运行：npm run server" -ForegroundColor Yellow
```

---

## 🔧 常见问题速查表

### 问题 1：页面显示 "无法访问此网站"
**原因**：前端或后端服务器未运行
**解决**：
```bash
# 启动前端
npm run dev

# 启动后端
npm run server
```

---

### 问题 2：控制台显示 `source: 'mock'`
**原因**：`USE_MOCK_DATA=true` 或数据库连接失败
**解决**：
1. 检查 `.env` 中 `USE_MOCK_DATA=false`
2. 运行 `npm run db:health` 检查连接
3. 重启后端：`npm run server`

---

### 问题 3：API 返回 500 错误
**原因**：数据库连接断开
**解决**：
1. 重启 SSH 隧道（关闭旧的，重新运行 SSH 命令）
2. 重启后端服务器

---

### 问题 4：宝塔面板数据库密码变更
**解决**：
1. 登录宝塔面板：`http://47.98.100.22:8888`
2. 数据库 → 找到 `topic_new` → 查看密码
3. 更新 `.env` 中的 `DB_PASS`
4. 重启后端：`npm run server`

---

## 📞 联系支持

如果以上步骤都无法解决，请提供以下信息：

1. **错误截图**（浏览器控制台 + 后端日志）
2. **运行 `npm run db:health` 的输出**
3. **`.env` 文件的数据库配置部分**（隐藏敏感信息）
4. **SSH 隧道是否运行的截图**

---

## ✅ 日常检查清单

每天开始工作前，快速检查：

- [ ] SSH 隧道是否运行
- [ ] 前端服务器是否运行（端口 5173）
- [ ] 后端服务器是否运行（端口 8181）
- [ ] 访问 http://localhost:5173 是否正常加载数据

---

**最后更新**：2026-04-15
**数据库配置**：`topic_new` / `topic_new` / `zkyc@565758`
