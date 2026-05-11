<script setup>
import { ref, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { Close, ChatDotRound, Promotion } from '@element-plus/icons-vue'
import { generateReply, analyzeInput } from '@/utils/smartAnalyzer'

const props = defineProps({
  isDarkMode: { type: Boolean, default: false },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'close'])

const { proxy } = getCurrentInstance()
const router = useRouter()

// 对话消息列表
const messages = ref([
  {
    id: 1,
    type: 'assistant',
    content: '你好！我是课程小助手 \n\n我可以帮你：\n• 推荐适合的课程\n• 解答课程相关问题\n• 提供专业选择建议\n\n请问有什么可以帮你的吗？',
    timestamp: new Date()
  }
])

// 输入框内容
const inputValue = ref('')

// 是否正在输入
const isTyping = ref(false)

// 对话窗口引用
const chatContainerRef = ref(null)

// 自动滚动到底部
const scrollToBottom = () => {
  setTimeout(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
    }
  }, 100)
}

// 发送消息
const handleSend = () => {
  const content = inputValue.value.trim()
  if (!content) {
    proxy.$message.warning('请输入内容')
    return
  }

  // 添加用户消息
  messages.value.push({
    id: Date.now(),
    type: 'user',
    content: content,
    timestamp: new Date()
  })

  // 清空输入框
  inputValue.value = ''
  scrollToBottom()

  // 使用智能分析模块生成回复
  handleAssistantReply(content)
}

// 处理助手回复（使用智能分析）
const handleAssistantReply = (userMessage) => {
  isTyping.value = true
  
  setTimeout(() => {
    const reply = generateReply(userMessage)
    
    messages.value.push({
      id: Date.now() + 1,
      type: 'assistant',
      content: reply,
      timestamp: new Date()
    })
    
    isTyping.value = false
    scrollToBottom()
  }, 800)
}

// 处理键盘回车
const handleEnter = (event) => {
  if (!event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

// 解析消息内容，将课程名称转换为可点击的链接
const parseMessageContent = (content) => {
  // 匹配数字 + . + 课程名称的模式，例如：1. 人工智能驱动的医疗影像诊断系统
  const coursePattern = /(\d+)\.\s*([^\n]+)/g
  
  const parts = []
  let lastIndex = 0
  let match
  
  while ((match = coursePattern.exec(content)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }
    
    // 添加课程链接
    parts.push({
      type: 'course',
      number: match[1],
      title: match[2].trim(),
      fullMatch: match[0]
    })
    
    lastIndex = match.index + match[0].length
  }
  
  // 添加剩余的文本
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }
  
  return parts
}

// 跳转到课程详情页
const navigateToCourse = (courseTitle) => {
  // 关闭助手窗口
  emit('close')
  
  // 显示提示信息
  proxy.$message.success(`正在查找课程：${courseTitle}`)
  
  // 先跳转到首页搜索该课程
  router.push({
    path: '/',
    query: {
      search: encodeURIComponent(courseTitle)
    }
  })
  
  // 延迟后尝试找到并点击第一个匹配的课程
  setTimeout(() => {
    // 查找第一个匹配的课程卡片并点击
    const courseCards = document.querySelectorAll('.course-card')
    if (courseCards.length > 0) {
      // 找到第一个课程卡片
      const firstCard = courseCards[0]
      // 模拟点击
      firstCard.click()
    }
  }, 800)
}
</script>

<template>
  <Transition name="assistant-slide">
    <div v-if="visible" class="assistant-window" :class="{ 'is-dark': isDarkMode }">
      <!-- 头部 -->
      <div class="assistant-header">
        <div class="header-left">
          <el-icon class="header-icon"><ChatDotRound /></el-icon>
          <span class="header-title">课程小助手</span>
        </div>
        <el-icon class="close-icon" @click="emit('close')"><Close /></el-icon>
      </div>

      <!-- 消息列表 -->
      <div class="assistant-body" ref="chatContainerRef">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="msg.type"
        >
          <div class="message-avatar">
            <el-icon v-if="msg.type === 'assistant'" class="avatar-icon">
              <ChatDotRound />
            </el-icon>
            <div v-else class="user-avatar">👤</div>
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <!-- 解析消息内容 -->
              <template v-if="msg.type === 'assistant'">
                <template v-for="(part, index) in parseMessageContent(msg.content)" :key="index">
                  <!-- 普通文本 -->
                  <span v-if="part.type === 'text'">{{ part.content }}</span>
                  <!-- 课程链接 -->
                  <div 
                    v-else-if="part.type === 'course'" 
                    class="course-link"
                    @click="navigateToCourse(part.title)"
                  >
                    <span class="course-number">{{ part.number }}.</span>
                    <span class="course-title">{{ part.title }}</span>
                  </div>
                </template>
              </template>
              <!-- 用户消息保持原样 -->
              <template v-else>{{ msg.content }}</template>
            </div>
            <div class="message-time">
              {{ msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}
            </div>
          </div>
        </div>
        
        <!-- 输入中状态 -->
        <div v-if="isTyping" class="message-item assistant">
          <div class="message-avatar">
            <el-icon class="avatar-icon"><ChatDotRound /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-bubble typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="assistant-footer">
        <el-input
          v-model="inputValue"
          type="textarea"
          :rows="2"
          placeholder="输入你的问题...（Shift+Enter 换行）"
          :class="{ 'is-dark': isDarkMode }"
          @keydown.enter="handleEnter"
        />
        <el-button type="primary" class="send-button" @click="handleSend">
          <el-icon><Promotion /></el-icon>
          发送
        </el-button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 主窗口 */
.assistant-window {
  position: fixed;
  right: 24px;
  bottom: 120px;
  width: 400px;
  height: 560px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 1001;
  overflow: hidden;
}

.assistant-window.is-dark {
  background: #1e1e2e;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

/* 头部 */
.assistant-header {
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
}

.assistant-window.is-dark .assistant-header {
  background: linear-gradient(135deg, #5b6abf 0%, #6a4b9a 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 22px;
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
}

.close-icon {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px;
  border-radius: 6px;
}

.close-icon:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.15);
}

/* 消息列表 */
.assistant-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  background: linear-gradient(180deg, #f8f9fc 0%, #f0f2f8 100%);
}

.assistant-window.is-dark .assistant-body {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.assistant-body::-webkit-scrollbar {
  width: 6px;
}

.assistant-body::-webkit-scrollbar-track {
  background: transparent;
}

.assistant-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.assistant-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: messageSlideIn 0.3s ease;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin-top: 4px;
}

.avatar-icon {
  width: 38px;
  height: 38px;
  font-size: 22px;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-avatar {
  width: 38px;
  height: 38px;
  font-size: 18px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 280px;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 14px 18px;
  background: #fff;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  font-size: 14px;
  line-height: 1.7;
  color: #2d3436;
  word-wrap: break-word;
  white-space: pre-wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-item.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 16px;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.assistant-window.is-dark .message-bubble {
  background: #2d2d44;
  color: #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.assistant-window.is-dark .message-item.user .message-bubble {
  background: linear-gradient(135deg, #5b6abf 0%, #6a4b9a 100%);
  box-shadow: 0 4px 12px rgba(91, 106, 191, 0.4);
}

.message-time {
  font-size: 11px;
  color: #a0a0a0;
  padding: 0 4px;
}

/* 课程链接样式 */
.course-link {
  display: block;
  margin: 4px 0;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 8px;
  border-left: 3px solid #667eea;
  cursor: pointer;
  transition: all 0.25s ease;
  line-height: 1.4;
}

.course-link:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.course-link:active {
  transform: translateX(2px) scale(0.98);
}

.course-number {
  color: #667eea;
  font-weight: 700;
  margin-right: 6px;
  font-size: 13px;
}

.course-title {
  color: #5a67d8;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.course-link:hover .course-title {
  color: #4c51bf;
}

.assistant-window.is-dark .course-link {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border-left-color: #8b9cf7;
}

.assistant-window.is-dark .course-link:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.assistant-window.is-dark .course-number {
  color: #8b9cf7;
}

.assistant-window.is-dark .course-title {
  color: #a5b4fc;
}

.assistant-window.is-dark .course-link:hover .course-title {
  color: #c7d2fe;
}

/* 输入中动画 */
.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 14px 18px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* 底部输入框 */
.assistant-footer {
  padding: 14px 16px;
  background: #fff;
  border-top: 1px solid #e8e8f0;
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.assistant-window.is-dark .assistant-footer {
  background: #1e1e2e;
  border-top-color: rgba(255, 255, 255, 0.08);
}

.assistant-footer :deep(.el-textarea__inner) {
  resize: none;
  border-radius: 12px;
  border: 1px solid #e0e0e8;
  padding: 10px 14px;
  font-size: 14px;
  transition: all 0.2s;
}

.assistant-footer :deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.assistant-footer :deep(.el-textarea.is-dark .el-textarea__inner) {
  background: #2d2d44;
  border-color: rgba(255, 255, 255, 0.15);
  color: #e0e0e0;
}

.send-button {
  height: auto;
  padding: 10px 20px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 500;
  transition: all 0.2s;
}

.send-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:active {
  transform: translateY(0);
}

/* 动画 */
.assistant-slide-enter-active,
.assistant-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.assistant-slide-enter-from,
.assistant-slide-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.92);
}
</style>
