@echo off
chcp 65001 >nul
echo ========================================
echo   宝塔部署文件打包工具
echo ========================================
echo.

:: 检查 dist 目录是否存在
if not exist "dist" (
    echo [错误] 未找到 dist 目录，请先执行 npm run build
    pause
    exit /b 1
)

:: 创建部署包目录
set DEPLOY_DIR=deploy_package
if exist "%DEPLOY_DIR%" rmdir /s /q "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%"

:: 复制前端文件
echo [1/3] 复制前端文件...
xcopy /E /I /Y dist "%DEPLOY_DIR%\dist" >nul 2>&1

:: 复制后端文件
echo [2/3] 复制后端文件...
mkdir "%DEPLOY_DIR%\server"
xcopy /E /I /Y server "%DEPLOY_DIR%\server" >nul 2>&1
copy package.json "%DEPLOY_DIR%\" >nul 2>&1
copy .env "%DEPLOY_DIR%\" >nul 2>&1
copy ecosystem.config.js "%DEPLOY_DIR%\" >nul 2>&1

:: 复制配置文件
echo [3/3] 复制配置文件...
copy nginx.conf "%DEPLOY_DIR%\" >nul 2>&1
copy DEPLOY.md "%DEPLOY_DIR%\" >nul 2>&1

echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 部署包位置：%CD%\%DEPLOY_DIR%
echo.
echo 下一步操作：
echo 1. 将 %DEPLOY_DIR% 文件夹上传到服务器
echo 2. 参考 DEPLOY.md 文档进行部署
echo.
pause
