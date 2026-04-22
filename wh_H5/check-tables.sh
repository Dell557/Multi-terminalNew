#!/bin/bash
# 查看 topic_new 数据库中的 courses 表结构
mysql -u topic_new -p'zkyc@565758' topic_new -e "DESCRIBE courses;" 2>&1
