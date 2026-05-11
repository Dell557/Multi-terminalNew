<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  isDarkMode: { type: Boolean, default: false },
  qiansemoshiIcon: { type: String, required: true },
  shensemoshiIcon: { type: String, required: true },
  fanhuidingbuIcon: { type: String, required: true },
  downloadIcon: { type: String, default: '' },
  showDownload: { type: Boolean, default: true },
  top: { type: Number, default: 400 }
})

const emit = defineEmits(['scroll-top', 'download'])

const { proxy } = getCurrentInstance()

const handleToggleDark = () => {
  if (proxy?.$message) {
    proxy.$message({
      message: '正在开发中。。。',
      type: 'warning',
      duration: 3000
    })
  } else {
    alert('正在开发中。。。')
  }
}
</script>

<template>
  <div class="fixed-action-panel" :class="{ 'is-dark': isDarkMode }" :style="{ top: `${top}px` }">
    <div 
      class="action-button" 
      @click="handleToggleDark"
    >
      <div class="action-icon">
        <img :src="isDarkMode ? shensemoshiIcon : qiansemoshiIcon" alt="主题切换" />
      </div>
      <div class="action-text">{{ isDarkMode ? '浅色模式' : '深色模式' }}</div>
    </div>
    
    <div 
      class="action-button" 
      @click="emit('scroll-top')"
    >
      <div class="action-icon">
        <img :src="fanhuidingbuIcon" alt="返回顶部" />
      </div>
      <div class="action-text">返回顶部</div>
    </div>
    
    <div 
      v-if="showDownload && downloadIcon"
      class="action-button" 
      @click="emit('download')"
    >
      <div class="action-icon">
        <img :src="downloadIcon" alt="下载海报" />
      </div>
      <div class="action-text">下载海报</div>
    </div>
  </div>
</template>

<style scoped>
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
  transition: all 0.3s ease;
}

.fixed-action-panel.is-dark {
  background: #3b3f49;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.fixed-action-panel.is-dark .action-button {
  color: rgba(229, 231, 235, 0.8);
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #333;
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.action-text {
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
}
</style>
