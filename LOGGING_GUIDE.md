# 监控日志系统使用指南

## 📋 概述

本项目已集成完整的前后端监控日志系统，用于追踪性能指标、错误信息和用户行为。

## 🎯 功能特性

### 前端监控

1. **性能监控**
   - 页面加载时间
   - API 请求耗时
   - 内存使用情况
   - 资源加载数量

2. **错误监控**
   - 全局未捕获错误
   - Promise 未处理拒绝
   - 资源加载失败
   - API 请求错误

3. **业务监控**
   - 数据加载成功/失败
   - 数据源类型（飞书/MySQL）
   - 加载记录数量
   - 用户操作行为

### 后端监控

1. **请求日志**
   - 请求方法、URL、状态码
   - 响应时间
   - 内存变化
   - 客户端 IP

2. **数据源监控**
   - 飞书 API 调用状态
   - MySQL 查询状态
   - 数据源切换记录
   - 错误详情

## 📊 日志级别

| 级别 | 说明 | 使用场景 |
|------|------|---------|
| DEBUG | 调试信息 | 详细的数据字段、中间状态 |
| INFO | 一般信息 | 操作成功、正常流程 |
| WARN | 警告信息 | 降级处理、非关键错误 |
| ERROR | 错误信息 | 严重错误、功能失败 |

## 🔍 日志查看

### 开发环境

在浏览器控制台可以看到格式化的日志输出：

```
[INFO] HomeView - Start loading data
[INFO] HomeView - API /api/courses response { status: 200, duration: '123.45ms' }
[INFO] HomeView - Data loaded successfully from API { count: 20, totalDuration: '156.78ms' }
```

### 生产环境

后端服务器日志示例：

```json
[INFO] {"timestamp":"2026-04-16T10:30:00.000Z","method":"GET","url":"/api/courses","status":200,"duration":"156ms","memoryChange":{"heapUsed":"1.23MB","heapTotal":"0.45MB"},"ip":"::1"}
```

## 📈 监控指标

### 关键性能指标（KPI）

1. **页面加载性能**
   - DOM Ready 时间
   - 页面完全加载时间
   - 首次内容绘制（FCP）

2. **API 性能**
   - 平均响应时间
   - P95/P99 响应时间
   - 错误率

3. **数据源性能**
   - 飞书 API 成功率
   - MySQL 查询耗时
   - 降级切换频率

## 🛠️ 配置选项

### 环境变量配置

创建 `.env.local` 文件：

```bash
# 日志级别控制 (DEBUG, INFO, WARN, ERROR)
VITE_LOG_LEVEL=INFO

# 生产环境日志上报地址（可选）
VITE_LOG_SERVER_URL=https://your-log-server.com/api/logs

# API 目标地址
VITE_API_TARGET=http://localhost:3002
```

## 📝 日志模块说明

### 前端模块

| 模块名 | 说明 |
|--------|------|
| App | 应用启动、初始化 |
| HomeView | 首页数据加载、筛选 |
| DetailView | 详情页数据加载 |
| Feishu | 飞书 API 调用 |
| Global | 全局错误监控 |
| Resource | 资源加载监控 |
| Performance | 性能指标收集 |

### 后端模块

| 端点 | 说明 |
|------|------|
| /api/courses | 课程列表接口监控 |
| /api/courses/:id | 课程详情接口监控 |
| /api/db-status | 数据库状态检查 |
| /feishu-api/* | 飞书 API 代理监控 |

## 🔧 使用示例

### 在组件中使用

```javascript
import { logger } from '@/utils/logger'

// 记录操作开始
logger.info('ModuleName', 'Starting operation', { param1, param2 })

// 记录性能
const startTime = performance.now()
// ... 执行操作
const duration = performance.now() - startTime
logger.info('ModuleName', 'Operation completed', { duration: `${duration.toFixed(2)}ms` })

// 记录错误
try {
  // ... 可能出错的代码
} catch (error) {
  logger.error('ModuleName', 'Operation failed', error, { extraData })
}
```

### 性能监控最佳实践

```javascript
// ✅ 推荐：完整的性能监控
const loadData = async () => {
  const startTime = performance.now()
  logger.info('Module', 'Start loading data')
  
  try {
    const apiStart = performance.now()
    const data = await fetchData()
    const apiDuration = performance.now() - apiStart
    
    logger.info('Module', 'Data loaded', {
      count: data.length,
      apiDuration: `${apiDuration.toFixed(2)}ms`
    })
    
    const totalDuration = performance.now() - startTime
    logger.info('Module', 'Load completed', {
      totalDuration: `${totalDuration.toFixed(2)}ms`
    })
  } catch (error) {
    const totalDuration = performance.now() - startTime
    logger.error('Module', 'Load failed', error, {
      duration: `${totalDuration.toFixed(2)}ms`
    })
    throw error
  }
}

// ❌ 不推荐：缺少监控
const loadData = async () => {
  try {
    const data = await fetchData()
    return data
  } catch (error) {
    console.error(error)
  }
}
```

## 📊 数据分析建议

### 日常检查清单

1. **错误率监控**
   - ERROR 级别日志数量
   - 4xx/5xx 状态码比例
   - 飞书 API 失败率

2. **性能趋势**
   - 平均加载时间变化
   - API 响应时间波动
   - 内存使用趋势

3. **容量规划**
   - 高峰期请求量
   - 数据源负载分布
   - 带宽使用情况

### 告警阈值建议

| 指标 | 警告阈值 | 严重阈值 |
|------|---------|---------|
| API 错误率 | > 5% | > 10% |
| 平均响应时间 | > 2s | > 5s |
| 页面加载时间 | > 3s | > 8s |
| 内存增长率 | > 50MB/h | > 100MB/h |

## 🚀 后续优化方向

1. **集成专业监控系统**
   - Sentry（错误追踪）
   - New Relic（性能监控）
   - ELK Stack（日志分析）

2. **增强监控能力**
   - 用户行为追踪
   - 性能水印
   - 慢查询分析

3. **可视化大屏**
   - 实时请求量
   - 错误分布地图
   - 性能趋势图表

## ⚠️ 注意事项

1. **隐私保护**
   - 不要记录用户敏感信息
   - 脱敏处理个人数据
   - 遵守 GDPR 等法规

2. **性能影响**
   - 生产环境建议关闭 DEBUG 级别
   - 控制日志上报频率
   - 避免在循环中大量记录

3. **存储管理**
   - 设置日志保留期限
   - 定期清理旧日志
   - 合理分配存储空间

## 📞 问题排查

### 常见问题

**Q: 看不到日志输出？**
A: 检查 VITE_LOG_LEVEL 配置，确保级别设置正确

**Q: 日志上报失败？**
A: 检查 VITE_LOG_SERVER_URL 配置和网络连接

**Q: 后端日志太多？**
A: 可以调整日志级别或添加过滤条件

---

**最后更新**: 2026-04-16  
**版本**: 1.0.0
