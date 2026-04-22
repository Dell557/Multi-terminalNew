# 🚀 快速测试指南

## ✅ 问题已解决

### 已安装的依赖
- ✅ **vant** - H5 端 UI 组件库
- ✅ **axios** - HTTP 请求库

### 当前状态
- ✅ 前端服务运行正常
- ✅ 后端服务运行正常
- ✅ 浏览器无错误

## 📱 测试步骤

### 1. 访问根路径（自动检测）

打开浏览器访问：http://localhost:5173/

**预期结果：**
- PC 用户 → 自动跳转到 `/pc/home`
- 手机用户 → 自动跳转到 `/h5/home`

### 2. 手动测试 PC 端

访问：http://localhost:5173/pc/home

**预期结果：**
- 显示 PC 端首页（Element Plus UI）
- 可以看到课程列表、筛选功能

### 3. 手动测试 H5 端

访问：http://localhost:5173/h5/home

**预期结果：**
- 显示 H5 端首页（Vant UI）
- 移动端优化布局

### 4. 测试设备检测

**Chrome DevTools 测试：**
1. 按 F12 打开开发者工具
2. 按 Ctrl+Shift+M 切换设备模式
3. 选择不同设备：
   - iPhone 12 Pro
   - iPad Pro
   - Responsive - Desktop

4. 刷新页面，观察路由变化

### 5. 测试路由跳转

**PC 端功能测试：**
```
http://localhost:5173/pc/home      # PC 首页
http://localhost:5173/pc/detail/1  # PC 详情页（需要替换为真实 ID）
http://localhost:5173/pc/about     # PC 关于页
```

**H5 端功能测试：**
```
http://localhost:5173/h5/home      # H5 首页
http://localhost:5173/h5/detail/1  # H5 详情页（需要替换为真实 ID）
http://localhost:5173/h5/filter    # H5 筛选页
http://localhost:5173/h5/search    # H5 搜索页
```

## 🔍 调试技巧

### 查看当前路由
在浏览器控制台中输入：
```javascript
// 查看当前路由路径
console.log(this.$route.path)

// 查看是否为 H5 路由
console.log(this.$route.path.startsWith('/h5'))
```

### 查看设备类型
在浏览器控制台中输入：
```javascript
import { getDeviceType } from '@/utils/device'
console.log('当前设备类型:', getDeviceType())
```

### 强制切换设备
在浏览器控制台中输入：
```javascript
// 强制跳转到 PC 端
this.$router.push('/pc/home')

// 强制跳转到 H5 端
this.$router.push('/h5/home')
```

## ⚠️ 常见问题

### Q1: 页面显示空白
**原因：** 路由配置错误或组件导入失败

**解决方法：**
1. 检查浏览器控制台是否有错误
2. 检查终端是否有编译错误
3. 刷新页面（Ctrl+R）

### Q2: 设备检测不准确
**原因：** User Agent 识别问题

**解决方法：**
1. 使用 Chrome DevTools 的设备模式测试
2. 直接访问 `/pc/home` 或 `/h5/home`

### Q3: H5 端样式错乱
**原因：** Vant 组件未正确加载

**解决方法：**
1. 确认已安装 vant：`npm list vant`
2. 检查 H5 组件中是否正确导入 Vant
3. 清除浏览器缓存

### Q4: 窗口大小变化没有自动切换
**原因：** resize 事件监听未生效

**解决方法：**
1. 检查 AdaptiveLayout.vue 中的事件监听
2. 手动刷新页面
3. 检查浏览器控制台是否有错误

## 📊 性能检查

### 加载速度
使用 Chrome Lighthouse 测试：
1. 打开 Chrome DevTools
2. 切换到 Lighthouse 标签
3. 点击 "Analyze page load"
4. 查看性能评分

### 网络请求
使用 Network 面板：
1. 打开 Chrome DevTools
2. 切换到 Network 标签
3. 刷新页面
4. 检查 API 请求是否正常

## 🎯 验收标准

### PC 端
- [ ] 首页正常显示
- [ ] 课程列表加载正常
- [ ] 筛选功能可用
- [ ] 搜索功能可用
- [ ] 详情页正常跳转
- [ ] Element Plus 样式正常

### H5 端
- [ ] 首页正常显示
- [ ] 课程列表加载正常
- [ ] 筛选功能可用
- [ ] 搜索功能可用
- [ ] 详情页正常跳转
- [ ] Vant UI 样式正常

### 设备检测
- [ ] PC 访问自动跳转到 PC 端
- [ ] 手机访问自动跳转到 H5 端
- [ ] 平板访问自动跳转到 H5 端
- [ ] 窗口大小变化时自动切换

## 📝 测试报告模板

```
## 测试报告

### 测试时间：2026-04-20

### 测试设备
- [ ] Desktop (1920x1080)
- [ ] iPhone 12 Pro (390x844)
- [ ] iPad Pro (1024x1366)

### PC 端测试
- [ ] 首页加载 ✅ / ❌
- [ ] 课程列表 ✅ / ❌
- [ ] 筛选功能 ✅ / ❌
- [ ] 搜索功能 ✅ / ❌
- [ ] 详情页 ✅ / ❌

### H5 端测试
- [ ] 首页加载 ✅ / ❌
- [ ] 课程列表 ✅ / ❌
- [ ] 筛选功能 ✅ / ❌
- [ ] 搜索功能 ✅ / ❌
- [ ] 详情页 ✅ / ❌

### 设备检测
- [ ] 自动跳转 ✅ / ❌
- [ ] 响应式切换 ✅ / ❌

### 发现的问题
1. ...
2. ...

### 建议
1. ...
2. ...
```

## 🎉 测试完成

如果所有测试都通过，说明 PC+H5 整合成功！可以部署到生产环境了。
