<script setup>
import { RefreshRight, WarningFilled } from '@element-plus/icons-vue'
import loadingImg from '@/images/icon_ewd2dbl138v/jiazaizhong.png'
import errorImg from '@/images/icon_ewd2dbl138v/jiazaishibai.png'
import noContentImg from '@/images/icon_ewd2dbl138v/zanwuneirong.png'
import emptyImg from '@/images/icon_ewd2dbl138v/weisousuodao.png'

const props = defineProps({
  type: {
    type: String,
    default: 'loading',
    validator: (val) => ['loading', 'error', 'empty', 'no-content'].includes(val)
  },
  message: {
    type: String,
    default: ''
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  configHint: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['refresh'])

const stateConfig = {
  'loading': {
    icon: loadingImg,
    title: '正在加载中...',
    message: '正在努力获取课程数据'
  },
  'error': {
    icon: errorImg,
    title: '加载失败~',
    message: '网络连接异常，请稍后重试'
  },
  'empty': {
    icon: emptyImg,
    title: '暂未搜索到相关课题内容',
    message: '尝试更换关键词或筛选条件'
  },
  'no-content': {
    icon: noContentImg,
    title: '空空如也～',
    message: '暂无课程数据'
  }
}
</script>

<template>
  <div>
    <!-- 配置提示 -->
    <div v-if="configHint" class="config-hint">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ configHint }}</span>
    </div>

    <!-- 状态展示 -->
    <div :class="`state-container ${type}-state`">
      <img :src="stateConfig[type]?.icon" :alt="stateConfig[type]?.title" class="state-img" />
      <p class="state-text">{{ stateConfig[type]?.title }}</p>
      
      <div v-if="message || stateConfig[type]?.message" class="state-message">
        <span>{{ message || stateConfig[type]?.message }}</span>
      </div>

      <div v-if="type === 'error'" class="error-hint">
        <el-icon><WarningFilled /></el-icon>
        <span>请检查网络连接或稍后再试</span>
      </div>

      <el-button 
        v-if="showRefresh && (type === 'error' || type === 'empty')"
        type="primary" 
        class="retry-btn"
        @click="emit('refresh')"
      >
        <el-icon><RefreshRight /></el-icon>
        {{ type === 'error' ? '重试' : '清空筛选' }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.config-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #faad14;
}

.config-hint .el-icon {
  font-size: 16px;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.state-img {
  width: 80px;
  height: 80px;
  opacity: 0.6;
  margin-bottom: 16px;
}

.state-text {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px;
}

.state-message {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.error-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 12px;
  color: #f56c6c;
}

.retry-btn {
  background: #ff6b00 !important;
  border-color: #ff6b00 !important;
}

.retry-btn:hover {
  background: #ff8533 !important;
  border-color: #ff8533 !important;
}
</style>
