#!/bin/bash
# 使用宝塔的 MySQL socket 连接并重置密码
MYSQL_SOCKET="/tmp/mysql.sock"

# 尝试使用 socket 连接（不需要密码）
mysql -u root --socket=$MYSQL_SOCKET -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpass123'; FLUSH PRIVILEGES;" 2>&1

if [ $? -eq 0 ]; then
    echo "密码已重置为：newpass123"
else
    echo "重置失败，尝试其他方式..."
    # 如果不行，尝试停止 MySQL 并跳过权限表启动
    echo "请联系管理员手动重置密码"
fi
