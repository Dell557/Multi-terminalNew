<script setup>
import { computed } from 'vue'
const props = defineProps({
  isDarkMode: { type: Boolean, default: false },
  qiansemoshiIcon: { type: String, default: '' },
  shensemoshiIcon: { type: String, default: '' },
  fanhuidingbuIcon: { type: String, default: '' },
  downloadIcon: { type: String, default: '' },
  showDownload: { type: Boolean, default: false },
  top: { type: Number, default: 500 }
})
const emit = defineEmits(['toggle-dark', 'scroll-top', 'download'])
const panelStyle = computed(() => ({ top: `${props.top}px` }))
</script>

<template>
  <div class="fixed-action-panel" :class="{ 'is-dark': isDarkMode }" :style="panelStyle">
    <div class="action-button" @click="emit('toggle-dark')">
      <div class="action-icon">
        <img :src="isDarkMode ? qiansemoshiIcon : shensemoshiIcon" :alt="isDarkMode ? '浅色模式' : '深色模式'" />
      </div>
      <div class="action-text">{{ isDarkMode ? '浅色模式' : '深色模式' }}</div>
    </div>
    <div v-if="showDownload" class="action-button" @click="emit('download')">
      <div class="action-icon">
        <img :src="downloadIcon" alt="下载海报" />
      </div>
      <div class="action-text">下载海报</div>
    </div>
    <div class="action-button" @click="emit('scroll-top')">
      <div class="action-icon">
        <img :src="fanhuidingbuIcon" alt="返回顶部" />
      </div>
      <div class="action-text">返回顶部</div>
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
}
</style>
