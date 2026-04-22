#!/bin/bash
# 重置 Linkous 用户的密码
mysql -u root -e "ALTER USER 'Linkous'@'localhost' IDENTIFIED BY 'newpass123'; FLUSH PRIVILEGES;" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Linkous 用户密码已重置为：newpass123"
else
    echo "❌ 重置失败"
fi
