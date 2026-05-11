 # ⚠️ AI 助手必读指令

**重要**：在修改本项目任何代码前，必须先完整阅读本规范文档！

## 强制规则
1. 任何修改必须符合本规范，禁止违背"禁止事项"
2. 遇到规范未覆盖的情况，先询问用户，不要自行决定
3. 修改代码后，必须说明是否符合规范要求
4. 禁止使用原生 `alert()`，必须使用 Element Plus `$message`
5. 禁止直接导入 Element Plus 组件（如 `ElMessage`）
6. 禁止使用固定 `top: 96px`，必须使用动态 `v-bind(stickyTop + 'px')`
7. 禁止实现真实的深色模式切换功能（当前显示"正在开发中"）
8. 禁止使用飞书 `searchRecords()` 获取相关课题（飞书配置为空）
9. 禁止将 `.env` 文件提交到 Git
10. 禁止向用户展示原始错误信息

## 文档位置
- 项目根目录：`PROJECT_SPECIFICATION.md`
- 每次对话开始时，AI 应主动读取此文档

---

# 项目规范文档

## 1. 基础样式规范

### 1.1 颜色主题

| 颜色名称 | 颜色值 | 用途 |
| :--- | :--- | :--- |
| 主色调 | `#ff6b00` | 按钮、Logo、强调元素 |
| 主色调渐变 | `linear-gradient(135deg, #ff6b00 0%, #ff8800 100%)` | 重要按钮、卡片高亮 |
| 背景色（浅色） | `#ffffff` | 页面背景 |
| 背景色（深色） | `#3b3f49` | 深色模式背景 |
| 文字颜色 | `#333333` | 主要文字 |
| 文字颜色（浅色） | `rgba(229, 231, 235, 0.8)` | 深色模式文字 |
| 边框颜色 | `rgba(255, 255, 255, 0.12)` | 深色模式边框 |
| 阴影 | `0 4px 12px rgba(0, 0, 0, 0.1)` | 卡片、按钮阴影 |
| 深色阴影 | `0 10px 30px rgba(0, 0, 0, 0.35)` | 深色模式卡片阴影 |

### 1.2 圆角规范

| 元素类型 | 圆角值 |
| :--- | :--- |
| 按钮 | `41px`（胶囊形） |
| 卡片 | `8px` |
| 输入框 | `8px` |
| 小图标 | `6px` |

### 1.3 间距规范

| 间距类型 | 值 |
| :--- | :--- |
| 页面边距 | `24px` |
| 卡片间距 | `24px` |
| 元素间距 | `16px` |
| 内边距 | `16px 8px` |

### 1.4 字体规范

| 字体类型 | 大小 | 行高 |
| :--- | :--- | :--- |
| 标题 | `18px` | `1.5` |
| 正文 | `14px` | `1.6` |
| 小文字 | `12px` | `1` |
| 按钮文字 | `14px` | `1.5` |

---

## 2. 数据格式规范

### 2.1 课程数据结构

```typescript
interface Course {
  id: string | number           // 课程ID
  title: string                 // 课程标题
  subtitle?: string             // 副标题
  description: string           // 课程描述
  coverUrl: string              // 封面图片URL
  primarySubject: string        // 一级学科
  secondarySubject: string      // 二级学科
  mentorType: string            // 导师类型（教授/博士）
  mentorName: string            // 导师姓名
  institution: string           // 所属机构
  tags: string[]                // 标签列表
  createdAt: string             // 创建时间
  updatedAt: string             // 更新时间
  visible: boolean              // 是否可见
}
```

### 2.2 筛选条件结构

```typescript
interface FilterOptions {
  primarySubject: string        // 一级学科筛选
  secondarySubject: string      // 二级学科筛选
  mentorType: string            // 导师类型筛选
  searchText: string            // 搜索关键词
}
```

---

## 3. API 响应格式规范

### 3.1 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 返回的数据
  },
  "timestamp": 1620000000000
}
```

### 3.2 失败响应

```json
{
  "code": 400,
  "message": "请求参数错误",
  "error": "具体错误信息",
  "timestamp": 1620000000000
}
```

### 3.3 分页响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 12
  },
  "timestamp": 1620000000000
}
```

### 3.4 错误码说明

| 错误码 | 含义 |
| :--- | :--- |
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源未找到 |
| 500 | 服务器错误 |

---

## 4. 组件开发规范

### 4.1 组件命名规范

- **组件文件名**: PascalCase（大驼峰），如 `FixedActionPanel.vue`
- **组件内部名称**: 与文件名一致
- **props 命名**: camelCase（小驼峰）
- **事件命名**: kebab-case（短横线），如 `toggle-dark`

### 4.2 FixedActionPanel 组件规范

#### 4.2.1 Props 定义

```typescript
interface Props {
  isDarkMode: boolean           // 是否深色模式
  qiansemoshiIcon: string       // 浅色模式图标路径
  shensemoshiIcon: string       // 深色模式图标路径
  fanhuidingbuIcon: string      // 返回顶部图标路径
  downloadIcon?: string         // 下载海报图标路径（可选）
  showDownload: boolean         // 是否显示下载按钮
  top: number                   // 距离顶部的距离
}
```

#### 4.2.2 Events 定义

| 事件名 | 触发时机 | 参数 |
| :--- | :--- | :--- |
| `scroll-top` | 点击返回顶部按钮 | 无 |
| `download` | 点击下载海报按钮 | 无 |

#### 4.2.3 功能说明

1. **深色模式切换按钮**: 点击显示"正在开发中。。。"提示，不执行实际切换
2. **返回顶部按钮**: 点击平滑滚动到页面顶部
3. **下载海报按钮**: 点击触发下载事件（仅在详情页显示）

#### 4.2.4 样式规范

```css
.fixed-action-panel {
  position: fixed;
  right: 24px;
  background: #fff;
  border-radius: 41px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  z-index: 1000;
}

.fixed-action-panel.is-dark {
  background: #3b3f49;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}
```

---

## 5. 消息提示规范

### 5.1 全局消息提示

使用 Element Plus 的 `$message` 组件，配置如下：

```javascript
proxy.$message({
  message: '提示内容',
  type: 'warning',      // success / warning / info / error
  duration: 3000        // 显示时长（毫秒）
})
```

### 5.2 提示类型说明

| 类型 | 场景 | 图标 |
| :--- | :--- | :--- |
| `success` | 操作成功 | ✅ |
| `warning` | 警告提示 | ⚠️ |
| `info` | 信息提示 | ℹ️ |
| `error` | 错误提示 | ❌ |

---

## 6. 状态管理规范

### 6.1 全局状态

使用 Pinia 进行状态管理，状态定义如下：

```typescript
interface ThemeState {
  isDarkMode: boolean
}

interface AppState {
  userInfo: User | null
  token: string | null
}
```

### 6.2 本地存储

| 存储键 | 类型 | 说明 |
| :--- | :--- | :--- |
| `theme-mode` | string | 主题模式（'dark' / 'light'） |
| `user-token` | string | 用户登录令牌 |
| `favorite-ids` | string | 收藏课程ID列表（JSON字符串） |

---

## 7. 开发注意事项

1. **禁止直接修改第三方库样式**：如需修改，通过覆盖样式或自定义类名实现
2. **数据格式转换**：后端返回数据需经过 `data-mapping` 工具统一转换
3. **错误处理**：所有 API 请求必须有错误处理和降级方案
4. **响应式设计**：组件需适配 PC 和 H5 端
5. **性能优化**：列表渲染使用 `v-show`/`v-if` 合理控制，图片使用懒加载

---

## 8. 版本控制规范

### 8.1 Git 分支策略

| 分支 | 用途 |
| :--- | :--- |
| `main` | 生产分支，稳定代码 |
| `dev` | 开发分支，功能集成 |
| `feature/*` | 功能分支，开发新功能 |
| `bugfix/*` | Bug 修复分支 |

### 8.2 Commit 规范

```
<type>(<scope>): <description>

<type>:
  - feat: 新功能
  - fix: Bug 修复
  - docs: 文档更新
  - style: 样式调整
  - refactor: 代码重构
  - test: 测试用例
  - chore: 构建/工具更新
```

---

## 9. 数据源配置规范

### 9.1 多数据源架构

项目支持两种数据源：
1. **飞书多维表格 API**（优先）
2. **MySQL 数据库**（降级）

#### 数据源优先级
```
前端请求 → 后端 API → 优先尝试飞书 → 失败降级到 MySQL
```

### 9.2 飞书配置（当前未启用）

`.env` 文件中飞书配置为空：
```
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_TABLE_ID=
```

**重要**：飞书配置为空时，所有数据请求都会自动降级到 MySQL。

### 9.3 MySQL 数据库配置

#### 连接信息
```
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=topic_new
MYSQL_PASSWORD=zkyc@565758
MYSQL_DB=topic_new
MYSQL_TABLE=courses
```

#### SSH 隧道连接
远程数据库通过 SSH 隧道连接：
```bash
ssh -i "C:\Users\loveb\.ssh\47.98.100.22_id_ed25519" -o IdentitiesOnly=yes -N -L 3306:127.0.0.1:3306 root@47.98.100.22
```

**禁止事项**：
- ❌ 不要修改数据库用户名和密码
- ❌ 不要将数据库密码提交到 Git
- ❌ 不要尝试直接连接远程数据库（必须通过 SSH 隧道）

### 9.4 后端降级逻辑

`server/index.js` 中的降级逻辑：
```javascript
// 优先尝试飞书
if (isFeishuConfigured()) {
  try {
    data = await feishuApi.getCourses()
  } catch (e) {
    // 飞书失败，降级到 MySQL
    data = await mysqlPool.query('SELECT * FROM courses')
  }
} else {
  // 飞书未配置，直接使用 MySQL
  data = await mysqlPool.query('SELECT * FROM courses')
}
```

---

## 10. 详情页相关课题加载规范

### 10.1 禁止使用飞书 API 获取相关课题

**错误做法**：
```javascript
// ❌ 错误！飞书配置为空，会返回空数组
const res = await searchRecords(appToken, tableId)
```

**正确做法**：
```javascript
// ✅ 正确！使用后端 API 获取所有课程
const res = await fetch('/api/courses?limit=500')
const data = await res.json()
const items = (data && data.items) || []
```

### 10.2 字段映射规范

支持双数据源字段格式：

| 飞书字段 | MySQL 字段 | 说明 |
|----------|-----------|------|
| `mentor_name_cn` | `导师` / `导师姓名` | 导师姓名 |
| `primary_subject` | `pri_sub` / `一级学科` | 一级学科 |
| `secondary_subject` | `sec_sub` / `二级学科` | 二级学科 |
| `description_intro` | `course_desc` / `课题描述` | 课程描述 |
| `cover_image_test` | `banner_url` / `头图地址测试` | 封面图片 |

**代码实现**：
```javascript
const ef = mapKeysToEnglish(r.fields)
const c = { ...r.fields, ...ef }
const name = getText(c.mentor_name_cn || c.mentor || c.teacher || c['导师'] || c['导师姓名'])
```

### 10.3 过滤逻辑

```javascript
const list = items
  .filter(r => {
    if (!r.fields) return false
    const ef = mapKeysToEnglish(r.fields)
    const c = { ...r.fields, ...ef }
    const name = getText(c.mentor_name_cn || c.mentor || c.teacher || c['导师'] || c['导师姓名'])
    const currentId = fetchedData.value.record_id || fetchedData.value.id
    const itemId = r.record_id || r.id
    return name && name === teacherName && itemId !== currentId
  })
```

---

## 11. "查看更多"功能规范

### 11.1 功能说明

- 相关课题默认显示 **3 个**
- 点击"查看更多"展开所有课题
- 再次点击"收起"恢复显示 3 个

### 11.2 状态管理

```javascript
const showAllRelated = ref(false)

function toggleShowAllRelated() {
  showAllRelated.value = !showAllRelated.value
}
```

### 11.3 模板实现

```vue
<div
  v-for="p in (showAllRelated ? relatedProjects : relatedProjects.slice(0, 3))"
  :key="p.id || p.title"
  class="side-project-item"
  @click="goToRelated(p)"
>
  <!-- 课题卡片内容 -->
</div>

<div class="side-card-footer" v-if="relatedCount > 3" @click="toggleShowAllRelated">
  <span class="view-more">{{ showAllRelated ? '收起' : '查看更多' }}</span>
  <el-icon :class="{ 'rotate-180': showAllRelated }"><CaretBottom /></el-icon>
</div>
```

### 11.4 禁止事项

- ❌ 不要修改默认显示数量（保持 3 个）
- ❌ 不要移除展开/收起动画
- ❌ 不要修改按钮点击事件绑定

---

## 12. 深色模式按钮规范

### 12.1 功能说明

深色模式按钮当前处于**开发中**状态：
- 点击显示"正在开发中。。。"提示
- **不执行**实际的主题切换
- 使用 Element Plus `$message` 组件

### 12.2 正确实现

```javascript
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

function handleDarkModeToggle() {
  proxy.$message({
    message: '正在开发中。。。',
    type: 'warning',
    duration: 3000
  })
}
```

### 12.3 禁止事项

- ❌ **不要实现真实的深色模式切换功能**
- ❌ 不要使用原生 `alert()` 弹窗
- ❌ 不要修改提示框样式（保持 Element Plus 默认样式）
- ❌ 不要移除 `getCurrentInstance()` 获取 proxy 的方式

---

## 13. 消息提示规范

### 13.1 全局消息提示

**必须使用** Element Plus 的 `$message` 组件：

```javascript
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

proxy.$message({
  message: '提示内容',
  type: 'warning',      // success / warning / info / error
  duration: 3000        // 显示时长（毫秒）
})
```

### 13.2 禁止事项

- ❌ **不要使用原生 `alert()`**（太丑，用户体验差）
-  不要使用自定义橙色提示框
- ❌ 不要使用红色边框提示框
- ❌ 不要直接导入 `ElMessage`（会导致打包错误）

### 13.3 提示类型说明

| 类型 | 场景 | 图标 |
| :--- | :--- | :--- |
| `success` | 操作成功 | ✅ |
| `warning` | 警告提示（如"正在开发中"） | ⚠️ |
| `info` | 信息提示 | ℹ️ |
| `error` | 错误提示 | ❌ |

---

## 14. 后端日志监控规范

### 14.1 请求日志中间件

`server/index.js` 中的日志中间件：

```javascript
app.use((req, res, next) => {
  const startTime = Date.now()
  const startMemory = process.memoryUsage().heapUsed
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const memoryDiff = process.memoryUsage().heapUsed - startMemory
    
    const logLevel = res.statusCode >= 500 ? 'error' : 
                     res.statusCode >= 400 ? 'warn' : 'info'
    
    console[logLevel](`${req.method} ${req.url} ${res.statusCode} ${duration}ms ${memoryDiff > 0 ? '+' : ''}${(memoryDiff / 1024 / 1024).toFixed(2)}MB`)
  })
  
  next()
})
```

### 14.2 日志级别

| 状态码 | 日志级别 | 说明 |
|--------|---------|------|
| 2xx | info | 成功请求 |
| 4xx | warn | 客户端错误 |
| 5xx | error | 服务器错误 |

### 14.3 禁止事项

- ❌ 不要移除请求日志中间件
- ❌ 不要修改日志格式
- ❌ 不要禁用内存监控

---

## 15. 超时处理规范

### 15.1 MySQL 查询超时

```javascript
const timeout = 10000 // 10 秒

const queryWithTimeout = (sql, params) => {
  return Promise.race([
    pool.query(sql, params),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeout)
    )
  ])
}
```

### 15.2 飞书 API 超时

```javascript
const fetchWithTimeout = (url, options, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ])
}
```

### 15.3 超时后的降级策略

```javascript
try {
  data = await queryWithTimeout('SELECT * FROM courses', [])
} catch (e) {
  if (e.message === 'Query timeout') {
    // 超时降级：返回空数组
    data = []
  } else {
    throw e
  }
}
```

### 15.4 禁止事项

- ❌ 不要移除超时处理逻辑
- ❌ 不要将超时时间设置过长（> 30 秒）
- ❌ 不要在超时后继续等待响应

---

## 16. 数据库连接池配置

### 16.1 连接池参数

```javascript
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,        // 最大连接数
  queueLimit: 0,              // 队列限制（0 表示无限制）
  enableKeepAlive: true,      // 启用保活
  keepAliveInitialDelay: 0    // 保活延迟
})
```

### 16.2 禁止事项

-  不要修改连接池配置参数
- ❌ 不要将 `connectionLimit` 设置过大（> 50）
- ❌ 不要禁用 `waitForConnections`

---

## 17. 错误处理规范

### 17.1 API 请求错误处理

```javascript
try {
  const res = await fetch('/api/courses')
  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`)
  }
  const data = await res.json()
  return data
} catch (e) {
  logger.error('API', 'Request failed', e)
  // 降级处理
  return { items: [] }
}
```

### 17.2 数据加载失败降级

```javascript
// 飞书失败 → MySQL
// MySQL 失败 → 空数组
// 任何失败 → 用户友好提示
```

### 17.3 用户友好错误提示

| 错误类型 | 用户提示 |
|----------|---------|
| 网络错误 | "网络连接失败，请检查网络后重试" |
| 数据未找到 | "未找到该课题信息" |
| 配置错误 | "系统配置异常，请联系管理员" |
| 超时错误 | "请求超时，请稍后重试" |

### 17.4 禁止事项

- ❌ 不要向用户展示原始错误信息
- ❌ 不要在生产环境打印详细错误堆栈
- ❌ 不要移除错误降级逻辑

---

## 18. 组件引用规范

### 18.1 Element Plus 组件引用

**正确方式**：
```javascript
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()
proxy.$message({ message: '提示', type: 'warning' })
```

**错误方式**：
```javascript
// ❌ 错误！会导致打包错误
import { ElMessage } from 'element-plus'
ElMessage.warning('提示')
```

### 18.2 禁止事项

- ❌ 不要直接导入 Element Plus 组件
- ❌ 不要使用 `app.config.globalProperties` 直接访问
- ❌ 不要在组件外部调用 `$message`

---

## 19. 环境变量配置规范

### 19.1 .env 文件结构

```env
# 服务器配置
SERVER_PORT=3002

# MySQL 数据库配置
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=topic_new
MYSQL_PASSWORD=zkyc@565758
MYSQL_DB=topic_new
MYSQL_TABLE=courses

# 飞书配置（当前未启用）
FEISHU_APP_ID=
FEISHU_APP_SECRET=
FEISHU_TABLE_ID=

# MiniMax API（当前未使用）
MINIMAX_API_KEY=
```

### 19.2 敏感信息保护

- ✅ `.env` 文件已添加到 `.gitignore`
- ❌ **不要将 `.env` 文件提交到 Git**
- ❌ 不要在代码中硬编码密码或 API Key

### 19.3 必填项和选填项

| 配置项 | 必填 | 说明 |
|--------|------|------|
| `SERVER_PORT` | ✅ | 后端服务端口 |
| `MYSQL_*` | ✅ | 数据库连接信息 |
| `FEISHU_*` | ❌ | 飞书配置（可选） |
| `MINIMAX_API_KEY` | ❌ | MiniMax API（可选） |

---

## 20. 图片加载规范

### 20.1 默认图片 fallback

```vue
<el-image :src="imageUrl" fit="cover">
  <template #error>
    <img :src="defaultImage" alt="默认图片" />
  </template>
</el-image>
```

### 20.2 图片加载失败处理

```javascript
function handleImageError(e) {
  e.target.src = defaultHero  // 使用默认图片
}
```

### 20.3 禁止事项

- ❌ 不要移除图片 fallback 逻辑
- ❌ 不要使用空 `src` 属性
- ❌ 不要在图片加载失败时显示空白

---

## 21. 路由跳转规范

### 21.1 详情页路由参数

```javascript
// 跳转到详情页
router.push({
  name: 'detail',
  params: { id: courseId }
})

// 获取路由参数
const route = useRoute()
const courseId = route.params.id
```

### 21.2 返回上一页

```javascript
function goBack() {
  router.back()
}
```

### 21.3 相关课题点击跳转

```javascript
function goToRelated(project) {
  router.push({
    name: 'detail',
    params: { id: project.id }
  })
}
```

### 21.4 禁止事项

- ❌ 不要使用 `window.location.href` 跳转
- ❌ 不要硬编码路由路径
- ❌ 不要移除返回按钮功能

---

## 22. 已知问题与修复记录

### 22.1 右侧卡片固定定位重叠问题

#### 问题描述
详情页右侧有两个卡片：
1. "该导师其他课题"卡片（普通卡片）
2. "参考导师详情"卡片（粘性定位卡片）

当页面滚动时，"参考导师详情"卡片会变成 `position: fixed`，如果 `top` 值是固定的（如 `96px`），会与上面的"该导师其他课题"卡片重叠。

#### 根本原因
- 上面卡片的高度会变化（展开/收起"查看更多"时）
- 固定 `top` 值无法适应上面卡片的高度变化

#### 正确解决方案
1. **动态计算 top 值**：使用 `sticky.js` 工具函数，传入上面卡片的 ref
2. **实时监听滚动**：在滚动事件中动态计算上面卡片的底部位置
3. **v-bind 绑定样式**：使用 Vue 的 `v-bind` 将动态计算的 top 值绑定到 CSS

#### 代码实现

**sticky.js 工具函数**：
```javascript
export function useSticky(getEl, getAboveEl, { headerHeight = 80, offset = 16 } = {}) {
  const isSticky = ref(false)
  const stickyOffsetTop = ref(0)
  const stickyTop = ref(headerHeight + offset)

  const handleScroll = () => {
    const el = getEl && getEl()
    if (!el) return
    
    if (stickyOffsetTop.value === 0) stickyOffsetTop.value = el.offsetTop
    
    // 动态计算上面卡片的底部位置
    const aboveEl = getAboveEl && getAboveEl()
    if (aboveEl) {
      const aboveRect = aboveEl.getBoundingClientRect()
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const aboveBottom = aboveRect.bottom + scrollTop
      stickyTop.value = Math.max(headerHeight + offset, aboveBottom - scrollTop + offset)
    }
    
    const targetTop = stickyTop.value
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    isSticky.value = scrollTop + targetTop >= stickyOffsetTop.value
  }

  return { isSticky, stickyTop }
}
```

**DetailView.vue 使用方式**：
```vue
<template>
  <aside class="content-right">
    <el-card ref="firstSideCardRef" class="side-card" shadow="never">
      <!-- 该导师其他课题 -->
    </el-card>

    <el-card ref="stickyCardRef" class="side-card side-card-sticky" :class="{ 'is-fixed': isSticky }" shadow="never">
      <!-- 参考导师详情 -->
    </el-card>
  </aside>
</template>

<script setup>
const stickyCardRef = ref(null)
const firstSideCardRef = ref(null)
const { isSticky, stickyTop } = useSticky(
  () => stickyCardRef.value ? stickyCardRef.value.$el : null,
  () => firstSideCardRef.value ? firstSideCardRef.value.$el : null,
  { headerHeight: 80, offset: 16 }
)
</script>

<style scoped>
.side-card-sticky.is-fixed {
  position: fixed;
  top: v-bind(stickyTop + 'px');
  width: 469px;
  z-index: 9999;
  border-top: none !important;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}
</style>
```

#### 禁止的错误做法
❌ **不要使用固定 top 值**：
```css
.side-card-sticky.is-fixed {
  position: fixed;
  top: 96px;  /* 错误！会导致重叠 */
}
```

 **不要只修改 z-index**：
```css
.side-card-sticky.is-fixed {
  z-index: 9999;  /* 只改 z-index 不能解决重叠问题 */
}
```

#### 修复日期
2026-04-29

---

## 23. AI 修改代码检查清单

修改代码后，请确认以下事项：

- [ ] 是否使用了正确的消息提示方式（`$message` 而非 `alert`）？
- [ ] 是否使用了正确的数据源（后端 API 而非飞书）？
- [ ] 是否保持了深色模式按钮的"开发中"状态？
- [ ] 是否使用了动态 top 值（而非固定 96px）？
- [ ] 是否保留了图片 fallback 逻辑？
- [ ] 是否使用了正确的路由跳转方式？
- [ ] 是否向用户展示了友好的错误提示？
- [ ] 是否使用了 `getCurrentInstance()` 获取 proxy？
- [ ] 是否没有直接导入 Element Plus 组件？
- [ ] 是否没有修改 `.env` 中的数据库配置？

---

## 24. 常见错误案例（反面教材）

### 案例 1：使用固定 top 值导致卡片重叠

**错误代码**：
```css
.side-card-sticky.is-fixed {
  position: fixed;
  top: 96px;  /* ❌ 错误！会导致重叠 */
}
```

**正确代码**：
```css
.side-card-sticky.is-fixed {
  position: fixed;
  top: v-bind(stickyTop + 'px');  /* ✅ 正确 */
}
```

### 案例 2：使用原生 alert()

**错误代码**：
```javascript
alert('正在开发中。。。')  // ❌ 错误
```

**正确代码**：
```javascript
import { getCurrentInstance } from 'vue'
const { proxy } = getCurrentInstance()

proxy.$message({
  message: '正在开发中。。。',
  type: 'warning',
  duration: 3000
})  // ✅ 正确
```

### 案例 3：直接导入 Element Plus 组件

**错误代码**：
```javascript
import { ElMessage } from 'element-plus'  // ❌ 错误！会导致打包错误
ElMessage.warning('提示')
```

**正确代码**：
```javascript
import { getCurrentInstance } from 'vue'
const { proxy } = getCurrentInstance()
proxy.$message({ message: '提示', type: 'warning' })  // ✅ 正确
```

### 案例 4：使用飞书 API 获取相关课题

**错误代码**：
```javascript
const res = await searchRecords(appToken, tableId)  // ❌ 错误！飞书配置为空
```

**正确代码**：
```javascript
const res = await fetch('/api/courses?limit=500')  // ✅ 正确
const data = await res.json()
```

### 案例 5：实现真实的深色模式切换

**错误代码**：
```javascript
function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value  // ❌ 错误！当前不应实现
}
```

**正确代码**：
```javascript
function toggleDarkMode() {
  proxy.$message({
    message: '正在开发中。。。',
    type: 'warning',
    duration: 3000
  })  // ✅ 正确
}
```

---

**文档版本**: v3.0  
**创建日期**: 2026-04-28  
**最后更新**: 2026-04-29  
**适用项目**: wu_pc

---

## 23. 2026-05-07 修改记录

### 23.1 "该导师其他课题"置顶效果问题修复

#### 问题描述
点击详情页中"该导师其他课题"的课程卡片时，页面会突然滚动到顶部，用户体验不佳。

#### 问题原因
1. 路由配置 `scrollBehavior` 设置每次路由跳转都滚动到页面顶部
2. Vue Router 默认复用相同组件实例，粘性定位状态没有被重置

#### 修复方案

**1. 修改路由滚动行为** (`src/router/index.js`)
```javascript
scrollBehavior(to, from, savedPosition) {
  if (savedPosition) {
    return savedPosition
  }
  // 同路由不同参数时保持当前滚动位置
  if (to.name === from.name && to.path !== from.path) {
    return { left: window.scrollX, top: window.scrollY }
  }
  return { left: 0, top: 0 }
}
```

**2. 添加路由参数监听** (`src/views/detail/DetailView.vue`)
```javascript
watch(() => route.params.id, () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  loadData()
})
```

### 23.2 "该导师其他课题"跳转行为修改

#### 修改内容
点击"该导师其他课题"中的课程卡片时，直接跳转到首页，而不是跳转到其他详情页。

#### 修改位置
`src/views/detail/DetailView.vue` 的 `goToRelated` 函数

#### 修改前
```javascript
function goToRelated(p) {
  if (!p || !p.id) return
  router.push({ path: `/detail/${p.id}` })
}
```

#### 修改后
```javascript
function goToRelated(p) {
  if (!p || !p.id) return
  router.push({ path: '/' })
}
```

### 23.3 AI助手组件集成

#### 问题描述
项目中已存在 AI 助手组件（`src/components/SmartAssistant/`），但未被任何页面引用，导致用户无法看到和使用。

#### 修复方案
在 `src/App.vue` 中引入并渲染 AI 助手组件：

```javascript
import { ref } from 'vue'
import { AssistantTrigger, AssistantWindow } from '@/components/SmartAssistant'

const showAssistant = ref(false)

function toggleAssistant() {
  showAssistant.value = !showAssistant.value
}
```

模板中添加：
```vue
<AssistantTrigger @click="toggleAssistant" />
<AssistantWindow :visible="showAssistant" @close="showAssistant = false" />
```

#### 组件说明
- **AssistantTrigger**: 右下角悬浮的"智能助手"按钮
- **AssistantWindow**: 点击后的聊天窗口，支持对话和课程推荐

### 23.4 数据过滤逻辑（历史记录）

#### 问题描述
早期实现仅按导师姓名过滤，可能导致同名导师的课题被错误匹配。

#### 解决方案（已实现）
采用多维度匹配，结合导师姓名、院校和职称进行综合过滤：

```javascript
const nameMatch = name.includes(teacherName) || teacherName.includes(name)
const hasUniversityInfo = teacherUniversity && university
const hasTitleInfo = teacherTitle && title

if (hasUniversityInfo && hasTitleInfo) {
  const universityMatch = university.includes(teacherUniversity) || teacherUniversity.includes(university)
  const titleMatch = title.includes(teacherTitle) || teacherTitle.includes(title)
  return universityMatch && titleMatch
} else if (hasUniversityInfo) {
  return university.includes(teacherUniversity) || teacherUniversity.includes(university)
} else if (hasTitleInfo) {
  return title.includes(teacherTitle) || teacherTitle.includes(title)
}
return true
```

### 23.5 禁止事项

- ❌ 禁止移除路由滚动行为配置
- ❌ 禁止将相关课题跳转改回详情页
- ❌ 禁止移除 AI 助手组件引用
- ❌ 禁止使用固定 top 值进行粘性定位（必须动态计算）
