# 📋 监控日志快速参考

## 🎯 快速开始

### 1. 在组件中使用日志

```javascript
import { logger } from '@/utils/logger'

// 记录信息
logger.info('模块名', '操作描述', { 额外数据 })

// 记录错误
logger.error('模块名', '错误描述', error, { 额外数据 })

// 性能监控
const start = performance.now()
// ... 执行操作
const duration = performance.now() - start
logger.info('模块名', '完成', { duration: `${duration.toFixed(2)}ms` })
```

### 2. 日志级别

| 方法 | 颜色 | 用途 |
|------|------|------|
| `logger.debug()` | 灰色 | 调试信息 |
| `logger.info()` | 蓝色 | 一般信息 |
| `logger.warn()` | 黄色 | 警告 |
| `logger.error()` | 红色 | 错误 |

---

## 📊 监控指标

### 关键指标

| 指标 | 监控位置 | 说明 |
|------|---------|------|
| 页面加载时间 | main.js | DOM Ready、FCP |
| API 响应时间 | HomeView/DetailView | 请求耗时 |
| 数据源类型 | server/index.js | 飞书/MySQL |
| 错误率 | 全局监控 | JS 错误、网络错误 |
| 内存使用 | 全局监控 | 堆内存变化 |

### 性能基准

| 指标 | 优秀 | 良好 | 需优化 |
|------|------|------|--------|
| 页面加载 | < 1s | < 3s | > 3s |
| API 响应 | < 200ms | < 500ms | > 1s |
| 错误率 | < 1% | < 5% | > 5% |

---

## 🔍 日志示例

### 首页加载

```
[INFO] HomeView - Start loading data
[INFO] HomeView - API /api/courses response { status: 200, duration: '123.45ms' }
[INFO] HomeView - Data loaded successfully from API { count: 20, totalDuration: '156.78ms' }
```

### 详情页加载

```
[INFO] DetailView - Start loading detail data { id: 'rec123' }
[INFO] DetailView - API response { status: 200, duration: '89.12ms' }
[INFO] DetailView - Data loaded from API { hasFields: true }
```

### 飞书 API 调用

```
[INFO] Feishu - Requesting access token
[INFO] Feishu - Access token obtained { duration: '234.56ms', expiresIn: 7200 }
[INFO] Feishu - searchRecords called { appToken: 'app123...', tableId: 'tbl456' }
[INFO] Feishu - searchRecords completed { totalItems: 20, totalPages: 1, duration: '567.89ms' }
```

### 后端请求日志

```json
{
  "timestamp": "2026-04-16T10:30:00.000Z",
  "method": "GET",
  "url": "/api/courses",
  "status": 200,
  "duration": "156ms",
  "memoryChange": { "heapUsed": "1.23MB" },
  "ip": "::1"
}
```

---

## 🛠️ 配置选项

### 环境变量

```bash
# .env.local

# 日志级别 (DEBUG, INFO, WARN, ERROR)
VITE_LOG_LEVEL=INFO

# 日志上报地址（生产环境）
VITE_LOG_SERVER_URL=https://your-log-server.com/api/logs

# API 目标地址
VITE_API_TARGET=http://localhost:3002
```

---

## ⚠️ 错误排查

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| 看不到日志 | 日志级别设置过高 | 设置 VITE_LOG_LEVEL=DEBUG |
| API 请求失败 | 后端未启动 | 启动后端服务器 `npm run server` |
| 飞书数据失败 | 凭证未配置 | 配置 .env.local 中的飞书凭证 |

### 调试技巧

```javascript
// 1. 查看详细日志
import { logger } from '@/utils/logger'
logger.debug('模块', '详细信息', { data: '...' })

// 2. 检查性能
const start = performance.now()
// ... 操作
console.log('耗时:', performance.now() - start, 'ms')

// 3. 查看网络请求
// DevTools -> Network -> 筛选 API 请求
```

---

## 📈 监控面板

### 前端（浏览器控制台）

```
筛选日志：
- 输入 "[INFO]" 查看一般信息
- 输入 "[ERROR]" 查看错误
- 输入 "HomeView" 查看首页日志
- 输入 "Feishu" 查看飞书 API 日志
```

### 后端（服务器终端）

```
筛选日志：
- grep "\[ERROR\]" 查看错误
- grep "/api/courses" 查看课程接口
- grep "feishu" 查看飞书调用
- grep "mysql" 查看 MySQL 查询
```

---

## 🎯 最佳实践

### ✅ 推荐

```javascript
// 完整的性能监控
const loadData = async () => {
  const startTime = performance.now()
  logger.info('Module', 'Start loading')
  
  try {
    const apiStart = performance.now()
    const data = await fetchData()
    const apiDuration = performance.now() - apiStart
    
    logger.info('Module', 'Success', {
      count: data.length,
      apiDuration: `${apiDuration.toFixed(2)}ms`
    })
    
    logger.info('Module', 'Completed', {
      totalDuration: `${(performance.now() - startTime).toFixed(2)}ms`
    })
  } catch (error) {
    logger.error('Module', 'Failed', error, {
      duration: `${(performance.now() - startTime).toFixed(2)}ms`
    })
    throw error
  }
}
```

### ❌ 避免

```javascript
// 缺少监控
const loadData = async () => {
  try {
    return await fetchData()
  } catch (error) {
    console.error(error) // 只打印错误，无性能数据
  }
}

// 过度日志
for (let i = 0; i < 1000; i++) {
  logger.info('Loop', `Item ${i}`) // 大量日志影响性能
}
```

---

## 📞 帮助

### 文档

- [完整使用指南](./LOGGING_GUIDE.md)
- [实施总结](./MONITORING_SUMMARY.md)

### 代码位置

| 文件 | 说明 |
|------|------|
| `src/utils/logger.js` | 日志工具类 |
| `src/main.js` | 全局监控初始化 |
| `server/index.js` | 后端日志中间件 |

---

**版本**: 1.0.0  
**更新**: 2026-04-16  
**状态**: ✅ 已部署，运行正常
