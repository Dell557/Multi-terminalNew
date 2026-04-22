# 🔧 设备检测调试指南

## 问题诊断

如果你访问 http://localhost:5173/ 但还是显示 PC 端，请按以下步骤调试：

### 步骤 1：检查当前路由

在浏览器控制台输入：
```javascript
// 查看当前路由路径
console.log('当前路由:', window.location.pathname)
console.log('完整 URL:', window.location.href)
```

**如果显示 `/pc/home`**：说明你已经直接访问了 PC 路由，需要访问根路径 `/`

### 步骤 2：测试设备检测函数

在浏览器控制台输入：
```javascript
// 导入并测试设备检测
import { getDeviceType, isMobile, getScreenWidth } from './src/utils/device.js'

console.log('屏幕宽度:', getScreenWidth())
console.log('是否移动设备:', isMobile())
console.log('设备类型:', getDeviceType())
```

**预期结果（手机模式）：**
```
屏幕宽度：375
是否移动设备：true
设备类型：mobile
```

**如果显示：**
```
屏幕宽度：> 768
是否移动设备：false
设备类型：pc
```

说明你的浏览器窗口宽度大于 768px，需要：
1. 缩小浏览器窗口
2. 或者在 DevTools 中选择手机设备

### 步骤 3：清除缓存并访问根路径

**方法 1：硬刷新**
1. 访问 http://localhost:5173/
2. 按 **Ctrl+Shift+R** (Windows) 或 **Cmd+Shift+R** (Mac) 强制刷新

**方法 2：清除缓存**
1. 按 F12 打开 DevTools
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

**方法 3：隐私模式**
1. 打开新的隐私/无痕窗口
2. 访问 http://localhost:5173/

### 步骤 4：手动测试路由跳转

在浏览器控制台输入：
```javascript
// 强制跳转到根路径，触发设备检测
window.location.href = 'http://localhost:5173/'
```

或者使用 Vue Router：
```javascript
// 如果在 Vue 组件内
this.$router.push('/')

// 或者
import { useRouter } from 'vue-router'
const router = useRouter()
router.push('/')
```

### 步骤 5：检查 AdaptiveLayout 是否执行

在浏览器控制台输入：
```javascript
// 检查是否加载了 AdaptiveLayout 组件
const adaptiveLayout = document.querySelector('.adaptive-layout')
console.log('AdaptiveLayout 存在:', adaptiveLayout !== null)
```

如果返回 `false`，说明没有加载 AdaptiveLayout 组件

## 🎯 正确的测试流程

### 1. 访问根路径
```
http://localhost:5173/
```

### 2. 打开 DevTools 并切换到手机模式
- 按 F12
- 按 Ctrl+Shift+M
- 选择 iPhone X 或其他手机

### 3. 刷新页面
- 按 Ctrl+R 或点击刷新按钮

### 4. 观察 URL 变化
**应该从 `/` 自动跳转到 `/h5/home`**

### 5. 如果还是跳转到 `/pc/home`

在控制台运行以下代码手动测试：

```javascript
// 测试 1: 检查屏幕宽度
const width = window.innerWidth
console.log('屏幕宽度:', width)
console.log('是否小于 768:', width < 768)

// 测试 2: 检查 User Agent
const ua = navigator.userAgent
console.log('User Agent:', ua)
console.log('是否匹配移动端:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua))

// 测试 3: 手动调用 isMobile
const isMobile = () => {
  const ua = navigator.userAgent
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  if (mobileRegex.test(ua)) return true
  
  const screenWidth = window.innerWidth
  if (screenWidth < 768) return true
  
  return false
}

console.log('isMobile 测试结果:', isMobile())
```

## ⚡ 快速解决方案

### 方案 1：直接访问 H5 端
```
http://localhost:5173/h5/home
```

### 方案 2：在控制台强制跳转
```javascript
// 方法 1
window.location.href = 'http://localhost:5173/h5/home'

// 方法 2（如果使用 Vue）
this.$router.push('/h5/home')
```

### 方案 3：修改默认路由（临时测试）

修改 `src/router/index.js`，将根路径默认跳转到 H5：

```javascript
{
  path: '/',
  redirect: '/h5/home',  // 临时修改
}
```

然后重启开发服务器。

## 🐛 可能的问题

### 问题 1：浏览器缓存了旧版本
**解决：** 硬刷新（Ctrl+Shift+R）

### 问题 2：Vite 热更新没有生效
**解决：** 重启开发服务器
```bash
# 停止服务器（Ctrl+C）
npm run dev
```

### 问题 3：路由守卫或其他逻辑干扰
**解决：** 检查是否有其他路由跳转逻辑

### 问题 4：设备检测代码没有执行
**解决：** 在 AdaptiveLayout.vue 中添加日志：

```javascript
onMounted(() => {
  console.log('=== AdaptiveLayout 挂载 ===')
  const deviceType = getDeviceType()
  console.log('设备类型:', deviceType)
  
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    console.log('跳转到 H5')
    router.replace('/h5/home')
  } else {
    console.log('跳转到 PC')
    router.replace('/pc/home')
  }
})
```

## 📊 调试检查清单

- [ ] 访问的是根路径 `/` 而不是 `/pc/home`
- [ ] DevTools 设备模式已开启
- [ ] 屏幕宽度 < 768px
- [ ] 页面已刷新（不是缓存）
- [ ] 控制台没有 JavaScript 错误
- [ ] AdaptiveLayout 组件已加载
- [ ] 设备检测函数返回正确结果
- [ ] 路由跳转逻辑已执行

## 🎉 成功标志

当你看到 URL 从 `http://localhost:5173/` 自动跳转到 `http://localhost:5173/h5/home`，并且显示 H5 端的界面（Vant UI），就说明设备检测成功了！
