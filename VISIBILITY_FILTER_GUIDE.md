# 课程可见性过滤功能

## 功能说明

`is_hidden` 字段用于控制课程的搜索可见性：

- **`is_hidden = 0`**：正常显示，可以被搜索到
- **`is_hidden = 1`**：仅链接访问，不能通过搜索找到

## 使用方式

### 1. 数据库设置

在 MySQL 数据库中，`courses` 表的 `is_hidden` 字段：
- 设置为 `0`：课程可以被搜索和浏览
- 设置为 `1`：课程只能通过直接链接访问

### 2. 前端使用

```javascript
import { filterVisibleCourses, isVisibleCourse } from '@/utils/visibility-filter'

// 过滤课程列表
const visibleCourses = filterVisibleCourses(allCourses)

// 检查单个课程
if (isVisibleCourse(course)) {
  // 课程可见
}
```

### 3. 统计功能

```javascript
import { countCourses } from '@/utils/visibility-filter'

const stats = countCourses(allCourses)
// stats: { total: 100, visible: 80, hidden: 20 }
```

## 移除方式

如果后期需要移除这个功能：

### 方案 1：完全移除
1. 删除文件：`src/utils/visibility-filter.js`
2. 在 `HomeView.vue` 中移除导入和使用
3. 在 `server/index.js` 中移除 `is_hidden` 字段处理

### 方案 2：禁用过滤（推荐）
保持代码不变，所有课程的 `is_hidden` 设置为 `0` 即可

## 文件清单

- ✅ `src/utils/visibility-filter.js` - 核心过滤逻辑（新增）
- ✅ `src/views/HomeView.vue` - 搜索时应用过滤（已修改）
- ✅ `server/index.js` - 后端传递 `is_hidden` 字段（已修改）

## 注意事项

1. **详情页不受影响**：即使 `is_hidden = 1`，通过直接链接仍可访问课程详情
2. **搜索建议也会过滤**：下拉搜索建议中不会显示隐藏课程
3. **数据库默认值**：建议将 `is_hidden` 字段默认值设为 `0`

## 测试方法

1. 在数据库中将某课程的 `is_hidden` 设为 `1`
2. 刷新首页，该课程不应出现在搜索结果中
3. 通过 URL 直接访问该课程详情页，应该可以正常访问
