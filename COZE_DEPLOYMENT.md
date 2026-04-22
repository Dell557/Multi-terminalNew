# 🤖 将项目部署到扣子（Coze）平台

## 📋 方案说明

扣子（Coze）是字节跳动推出的 AI 应用开发平台，支持多种部署方式。

---

## 🚀 部署方案选择

### 方案 1：作为静态网站部署（推荐）⭐

**适用场景：**
- ✅ 纯前端展示类应用
- ✅ 不需要复杂后端逻辑
- ✅ 快速上线

**步骤：**

#### 1. 构建项目

```bash
# 构建 PC 端
cd d:\wh_zk\wu_pc
npm run build

# 构建 H5 端
cd d:\wh_zk\wu_pc\wh_H5
npm run build
```

#### 2. 在扣子平台创建应用

1. 打开扣子平台：https://www.coze.cn/
2. 点击"创建项目"
3. 选择"Web 应用"或"静态网站"
4. 上传构建文件：
   - PC 端：上传 `dist/` 目录到 `/pc` 文件夹
   - H5 端：上传 `dist/` 目录到 `/h5` 文件夹

#### 3. 配置设备检测

在扣子平台的"路由配置"或"中间件"中添加：

```javascript
// 设备检测中间件
export default function deviceDetection(request) {
  const ua = request.headers.get('user-agent') || ''
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
  
  const url = new URL(request.url)
  
  // 如果是根路径，根据设备跳转
  if (url.pathname === '/') {
    if (isMobile) {
      return Response.redirect(url.origin + '/h5/', 301)
    } else {
      return Response.redirect(url.origin + '/pc/', 301)
    }
  }
  
  return fetch(request)
}
```

#### 4. 配置域名

1. 在扣子平台绑定你的域名
2. 配置 DNS 解析
3. 启用 HTTPS（自动）

---

### 方案 2：使用扣子 API + 本地部署

**适用场景：**
- ✅ 需要使用扣子的 AI 能力
- ✅ 后端逻辑复杂
- ✅ 需要完整控制

**步骤：**

#### 1. 在扣子平台创建 Bot

1. 访问扣子平台：https://www.coze.cn/
2. 点击"创建 Bot"
3. 配置 Bot 的人设和技能
4. 发布 Bot，获取 API Key

#### 2. 集成扣子 API 到项目

修改后端 `server/index.js`：

```javascript
const axios = require('axios')

// 扣子 API 配置
const COZE_BOT_ID = '你的 Bot ID'
const COZE_API_KEY = '你的 API Key'
const COZE_API_URL = 'https://api.coze.cn/v1/chat'

// 添加扣子 API 路由
app.post('/api/coze/chat', async (req, res) => {
  try {
    const { message } = req.body
    
    const response = await axios.post(COZE_API_URL, {
      bot_id: COZE_BOT_ID,
      user: 'user123',
      query: message,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${COZE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    res.json({
      success: true,
      data: response.data
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})
```

#### 3. 添加 AI 功能到前端

创建新组件 `src/components/AIAssistant.vue`：

```vue
<script setup>
import { ref } from 'vue'

const messages = ref([])
const input = ref('')
const loading = ref(false)

const sendMessage = async () => {
  if (!input.value.trim()) return
  
  loading.value = true
  messages.value.push({
    role: 'user',
    content: input.value
  })
  
  try {
    const resp = await fetch('/api/coze/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input.value
      })
    })
    
    const data = await resp.json()
    
    messages.value.push({
      role: 'assistant',
      content: data.data.content
    })
  } catch (error) {
    console.error('AI 助手错误:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，出现了一些问题，请稍后再试。'
    })
  } finally {
    loading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div class="ai-assistant">
    <div class="messages">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role]"
      >
        {{ msg.content }}
      </div>
      <div v-if="loading" class="message assistant">
        思考中...
      </div>
    </div>
    <div class="input-area">
      <input
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="问我任何问题..."
        type="text"
      />
      <button @click="sendMessage" :disabled="loading">
        发送
      </button>
    </div>
  </div>
</template>

<style scoped>
.ai-assistant {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: #007bff;
  color: white;
  margin-left: auto;
}

.message.assistant {
  background: #f0f0f0;
  color: #333;
}

.input-area {
  display: flex;
  padding: 12px;
  border-top: 1px solid #eee;
}

.input-area input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  outline: none;
}

.input-area button {
  margin-left: 8px;
  padding: 8px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
```

#### 4. 部署到服务器

可以选择：
- 阿里云/腾讯云
- Vercel
- Netlify
- 自己的服务器

---

### 方案 3：完全托管在扣子（最简单）

**适用场景：**
- ✅ 快速原型
- ✅ 演示项目
- ✅ 不需要自定义域名

**步骤：**

1. **在扣子创建应用**
   - 访问：https://www.coze.cn/
   - 点击"创建应用"
   - 选择"Web 应用"

2. **上传代码**
   - 上传整个项目文件夹
   - 或提供 GitHub 仓库地址

3. **配置构建命令**
   ```bash
   npm install
   npm run build
   ```

4. **配置输出目录**
   ```
   dist/
   ```

5. **发布应用**
   - 扣子会自动分配一个域名
   - 格式：`https://your-app.coze.app`

---

## 🔧 具体操作（推荐方案 3）

### 步骤 1：准备项目

根据你的截图，在扣子平台：

1. 点击右上角 **"+ 新建项目"**
2. 选择 **"Web 应用"** 或 **"商城网站"** 模板
3. 填写项目信息：
   - 项目名称：`课程展示平台`
   - 项目类型：`教育/学术`
   - 可见性：`公开`

### 步骤 2：上传代码

**方式 A：直接上传**
1. 点击"上传代码"
2. 选择整个项目文件夹
3. 等待上传完成

**方式 B：Git 仓库**
1. 将代码推送到 GitHub/Gitee
2. 在扣子平台选择"从 Git 导入"
3. 授权并选择仓库

### 步骤 3：配置构建

在扣子平台的"构建设置"中：

```yaml
# 构建配置
build:
  node_version: 20
  install_command: npm install
  build_command: npm run build
  output_directory: dist
```

### 步骤 4：环境变量

添加环境变量（如果需要）：

```
VITE_API_TARGET=http://localhost:3002
VITE_API_PORT=3002
```

### 步骤 5：部署发布

1. 点击"部署"
2. 等待构建完成
3. 获取访问地址
4. 可以分享到微信、朋友圈等

---

## 📊 扣子平台功能

### 1. 项目管理
- ✅ 版本管理
- ✅ 协作编辑
- ✅ 部署历史
- ✅ 访问统计

### 2. AI 能力集成
- ✅ 智能客服
- ✅ 内容生成
- ✅ 数据分析
- ✅ 用户画像

### 3. 数据分析
- ✅ 访问量统计
- ✅ 用户行为分析
- ✅ 转化漏斗
- ✅ 实时监控

---

## 🎯 推荐方案总结

**最快上线：方案 3**
- 直接在扣子创建应用
- 上传代码
- 自动部署
- 获得访问链接

**最佳实践：方案 1 + 方案 2**
- 前端部署到扣子
- 后端使用扣子 API
- 既有 AI 能力，又有完整控制

---

## 📝 下一步

**立即执行：**

1. 在扣子平台点击"新建项目"
2. 选择"Web 应用"
3. 上传你的项目代码
4. 配置构建命令
5. 点击部署

**需要帮助：**
- 扣子官方文档：https://www.coze.cn/docs
- 扣子社区：https://www.coze.cn/community

---

需要我帮你：
1. 准备上传的文件结构？
2. 创建扣子专用的配置文件？
3. 集成扣子的 AI 功能？

请告诉我你的需求！🚀
