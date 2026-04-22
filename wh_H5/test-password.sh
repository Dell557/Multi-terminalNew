#!/bin/bash
# 测试密码是否正确
mysql -u root -p'zkyc@565758' -e "SELECT 'Password is correct!' AS result;" 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 密码正确！"
else
    echo "❌ 密码错误"
fi
