# 数据库连接一键修复脚本
# 使用方法：在 PowerShell 中运行 .\fix-db-connection.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  数据库连接快速修复工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查并启动 SSH 隧道
Write-Host "[1/5] 检查 SSH 隧道..." -ForegroundColor Yellow
$sshProcess = Get-Process ssh -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*3306*" -or $_.CommandLine -like "*root@47.98.100.22*" 
}

if (-not $sshProcess) {
    Write-Host "  → 启动 SSH 隧道..." -ForegroundColor Green
    Write-Host "  提示：新窗口打开后，如需停止按 Ctrl+C" -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh -i 'C:\Users\loveb\.ssh\47.98.100.22_id_ed25519' -o IdentitiesOnly=yes -N -L 3306:127.0.0.1:3306 root@47.98.100.22"
    Start-Sleep -Seconds 3
    Write-Host "  ✅ SSH 隧道已启动" -ForegroundColor Green
} else {
    Write-Host "  ✅ SSH 隧道已运行" -ForegroundColor Green
}

Write-Host ""

# 2. 检查 .env 配置
Write-Host "[2/5] 检查数据库配置..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $requiredSettings = @{
        "DB_HOST=127.0.0.1" = $false
        "DB_USER=topic_new" = $false
        "DB_PASS=zkyc@565758" = $false
        "DB_NAME=topic_new" = $false
        "USE_MOCK_DATA=false" = $false
    }
    
    foreach ($line in $envContent) {
        foreach ($key in $requiredSettings.Keys) {
            if ($line -eq $key) {
                $requiredSettings[$key] = $true
            }
        }
    }
    
    $allCorrect = $true
    foreach ($setting in $requiredSettings.GetEnumerator()) {
        if (-not $setting.Value) {
            Write-Host "  ❌ 缺少或错误：$($setting.Key)" -ForegroundColor Red
            $allCorrect = $false
        }
    }
    
    if ($allCorrect) {
        Write-Host "  ✅ 数据库配置正确" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "  提示：请手动修正 .env 文件，或运行以下命令：" -ForegroundColor Yellow
        Write-Host "  参考配置：" -ForegroundColor Gray
        Write-Host "    DB_HOST=127.0.0.1" -ForegroundColor Gray
        Write-Host "    DB_USER=topic_new" -ForegroundColor Gray
        Write-Host "    DB_PASS=zkyc@565758" -ForegroundColor Gray
        Write-Host "    DB_NAME=topic_new" -ForegroundColor Gray
        Write-Host "    USE_MOCK_DATA=false" -ForegroundColor Gray
    }
} else {
    Write-Host "  ❌ .env 文件不存在" -ForegroundColor Red
}

Write-Host ""

# 3. 测试数据库连接
Write-Host "[3/5] 测试数据库连接..." -ForegroundColor Yellow
$npmPath = Get-Command npm -ErrorAction SilentlyContinue
if ($npmPath) {
    $result = npm run db:health 2>&1
    if ($result -match '"ok":\s*true') {
        Write-Host "  ✅ 数据库连接成功" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 数据库连接失败" -ForegroundColor Red
        Write-Host "  错误信息：" -ForegroundColor Red
        $result | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        Write-Host ""
        Write-Host "  建议：" -ForegroundColor Yellow
        Write-Host "  1. 检查 SSH 隧道是否正常" -ForegroundColor Gray
        Write-Host "  2. 检查 .env 配置是否正确" -ForegroundColor Gray
        Write-Host "  3. 重启后端服务器：npm run server" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠️  未找到 npm，跳过测试" -ForegroundColor Yellow
}

Write-Host ""

# 4. 检查后端服务器
Write-Host "[4/5] 检查后端服务器..." -ForegroundColor Yellow
$backendPort = 8181
$backendProcess = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
if ($backendProcess) {
    Write-Host "  ✅ 后端服务器运行中（端口 $backendPort）" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  后端服务器未运行" -ForegroundColor Yellow
    Write-Host "  提示：运行 'npm run server' 启动后端" -ForegroundColor Gray
}

Write-Host ""

# 5. 检查前端服务器
Write-Host "[5/5] 检查前端服务器..." -ForegroundColor Yellow
$frontendPort = 5173
$frontendProcess = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
if ($frontendProcess) {
    Write-Host "  ✅ 前端服务器运行中（端口 $frontendPort）" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  前端服务器未运行" -ForegroundColor Yellow
    Write-Host "  提示：运行 'npm run dev' 启动前端" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  检查完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allCorrect -and ($result -match '"ok":\s*true')) {
    Write-Host "✅ 所有检查通过！系统运行正常" -ForegroundColor Green
    Write-Host ""
    Write-Host "访问地址：http://localhost:5173" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  发现问题，请按上述提示修复" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "快速修复命令：" -ForegroundColor Cyan
    Write-Host "  1. 启动前端：npm run dev" -ForegroundColor Gray
    Write-Host "  2. 启动后端：npm run server" -ForegroundColor Gray
    Write-Host "  3. 查看配置：code .env" -ForegroundColor Gray
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
