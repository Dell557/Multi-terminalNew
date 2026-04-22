# PC + H5 整合完成文档

## 📊 整合结果

已成功将 PC 端和 H5 端代码整合到一个项目中，实现**一个域名、自动适配**。

## 🎯 实现效果

用户访问 `https://yourdomain.com` 时：
- **PC 用户** → 自动跳转到 `/pc/home`（PC 端界面）
- **手机/平板用户** → 自动跳转到 `/h5/home`（H5 端界面）

## 📁 项目结构

```
src/
├── layouts/
│   └── AdaptiveLayout.vue      # 统一入口，设备检测
├── h5/                          # H5 端代码（从 wh_H5 复制过来）
│   ├── router/
│   │   ├── index.js
│   │   └── routes.js
│   ├── views/
│   │   ├── Home.vue
│   │   ├── CourseDetail.vue
│   │   ├── FilterPage.vue
│   │   ├── SearchPage.vue
│   │   └── FeishuDocs.vue
│   ├── components/
│   ├── stores/
│   ├── services/
│   ├── utils/
│   └── main.js
├── views/                       # PC 端代码
│   ├── HomeView.vue
│   ├── DetailView.vue
│   └── AboutView.vue
├── router/
│   └── index.js                # 统一路由配置
├── utils/
│   ├── device.js               # 设备检测工具
│   └── ...
└── App.vue                      # 根组件（支持 PC/H5 切换）
```

## 🌐 路由配置

### PC 端路由（/pc/*）
- `/pc/home` - PC 首页
- `/pc/about` - PC 关于页
- `/pc/detail/:id` - PC 课程详情

### H5 端路由（/h5/*）
- `/h5/home` - H5 首页
- `/h5/detail/:id` - H5 课程详情
- `/h5/filter` - H5 筛选页
- `/h5/search` - H5 搜索页
- `/h5/feishu` - H5 飞书文档

### 设备检测
- `/` - 根路径，自动检测设备类型并跳转

## 🔧 核心功能

### 1. 设备检测工具 (`src/utils/device.js`)

```javascript
import { isMobile, isPC, getDeviceType } from '@/utils/device'

// 判断是否为移动设备
const isMobileDevice = isMobile()

// 判断是否为 PC 端
const isPc = isPC()

// 获取设备类型：'mobile' | 'tablet' | 'pc'
const type = getDeviceType()
```

### 2. 自动路由 (`src/layouts/AdaptiveLayout.vue`)

```javascript
onMounted(() => {
  const deviceType = getDeviceType()
  
  // 根据设备类型重定向
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    router.replace('/h5/home')
  } else {
    router.replace('/pc/home')
  }
})

// 监听窗口大小变化，支持响应式切换
window.addEventListener('resize', handleResize)
```

### 3. 统一 App 组件 (`src/App.vue`)

```vue
<template>
  <div class="app-container">
    <!-- PC 端路由 -->
    <el-config-provider :locale="zhCnLocal" v-if="!isH5Route">
      <div class="pc-adapter">
        <router-view />
      </div>
    </el-config-provider>
    
    <!-- H5 端路由 -->
    <div v-else class="h5-container">
      <router-view />
    </div>
  </div>
</template>
```

## 🚀 使用方式

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 访问地址
http://localhost:5173/

# 测试 PC 端
http://localhost:5173/pc/home

# 测试 H5 端
http://localhost:5173/h5/home
```

### 生产环境

构建后部署到服务器：

```bash
npm run build
```

部署到服务器后，用户访问 `https://yourdomain.com` 会自动根据设备类型展示对应的界面。

## 📱 测试方法

### 1. 浏览器开发者工具测试

1. 打开 Chrome DevTools (F12)
2. 点击设备切换按钮 (Ctrl+Shift+M)
3. 选择不同设备（iPhone、iPad、Desktop）
4. 刷新页面，观察路由跳转

### 2. 实际设备测试

- 使用手机访问：应该自动显示 H5 界面
- 使用 PC 访问：应该自动显示 PC 界面
- 使用平板访问：应该自动显示 H5 界面

### 3. 手动访问测试

```
# PC 端
http://localhost:5173/pc/home
http://localhost:5173/pc/detail/1

# H5 端
http://localhost:5173/h5/home
http://localhost:5173/h5/detail/1
```

## ⚙️ 技术细节

### 设备检测逻辑

```javascript
// 基于 User Agent 检测
export const isMobile = () => {
  const ua = navigator.userAgent
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  return mobileRegex.test(ua)
}

// 基于屏幕宽度检测（备用方案）
export const isMobileByWidth = (breakpoint = 768) => {
  return window.innerWidth < breakpoint
}
```

### 路由过渡动画

H5 端支持多种过渡动画：
- `slide-fade` - 滑动淡入（默认）
- `slide-right` - 右滑进入（详情页）
- `slide-up` - 底部滑入（筛选、搜索页）
- `fade` - 淡入淡出（飞书文档）
- `zoom-fade` - 缩放淡入

## 🎨 样式隔离

- **PC 端**: 使用 Element Plus，最大宽度 1980px
- **H5 端**: 使用 Vant UI，全屏显示，响应式布局

## 📦 依赖管理

### PC 端依赖
- vue
- vue-router
- pinia
- element-plus
- fuse.js

### H5 端依赖（已整合到主项目）
- vue ✅
- vue-router ✅
- pinia ✅
- vant ✅ (已安装)
- axios ✅ (已安装)

### 安装命令
```bash
# 安装 H5 端所需依赖
npm install vant axios
```

## 🔍 常见问题

### Q: 如何强制访问 PC 端？
A: 直接访问 `/pc/home`

### Q: 如何强制访问 H5 端？
A: 直接访问 `/h5/home`

### Q: 平板设备显示哪个版本？
A: 默认显示 H5 版本（因为平板更接近手机体验）

### Q: 窗口大小变化时会自动切换吗？
A: 是的，监听 resize 事件，自动切换到对应的版本

## 📝 后续优化建议

1. **添加手动切换按钮**: 允许用户手动切换 PC/H5 版本
2. **SEO 优化**: 为 PC 和 H5 设置不同的 meta 标签
3. **性能优化**: 按需加载 PC 或 H5 的组件和资源
4. **PWA 支持**: 为 H5 端添加离线缓存功能

## ✅ 检查清单

- [x] 设备检测工具创建
- [x] PC 端路由添加 /pc 前缀
- [x] H5 端代码复制到 src/h5
- [x] H5 端路由修改为 /h5 前缀
- [x] 统一入口组件 AdaptiveLayout.vue
- [x] App.vue 支持 PC/H5 切换
- [x] 静态资源复制
- [x] 路由整合完成
- [ ] 测试 PC 端功能
- [ ] 测试 H5 端功能
- [ ] 测试设备自动检测
- [ ] 测试窗口 resize 切换

## 🎯 总结

整合完成！现在你只需要维护一个项目，部署一个域名，就可以同时支持 PC 端和移动端用户。

**核心优势：**
- ✅ 一套代码，两个界面
- ✅ 自动设备检测
- ✅ 用户体验最优
- ✅ 维护成本低
- ✅ 部署简单
