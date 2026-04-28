<script setup>
import { computed } from 'vue'
import { ChatDotRound } from '@element-plus/icons-vue'

const props = defineProps({
  isDarkMode: { type: Boolean, default: false },
  bottom: { type: Number, default: 120 }
})

const emit = defineEmits(['click'])

const panelStyle = computed(() => ({ bottom: `${props.bottom}px` }))
</script>

<template>
  <div 
    class="assistant-trigger" 
    :class="{ 'is-dark': isDarkMode }" 
    :style="panelStyle"
    @click="emit('click')"
  >
    <div class="trigger-icon">
      <el-icon><ChatDotRound /></el-icon>
    </div>
    <div class="trigger-text">智能助手</div>
  </div>
</template>

<style scoped>
.assistant-trigger {
  position: fixed;
  right: 24px;
  bottom: 120px;
  background: #fff;
  border-radius: 41px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
}

.assistant-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.assistant-trigger.is-dark {
  background: #3b3f49;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.assistant-trigger.is-dark .trigger-text {
  color: rgba(229, 231, 235, 0.8);
}

.trigger-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.trigger-icon :deep(.el-icon) {
  width: 100%;
  height: 100%;
  font-size: 24px;
  color: #ff6b00;
}

.assistant-trigger.is-dark .trigger-icon :deep(.el-icon) {
  color: #ff8533;
}

.trigger-text {
  font-size: 12px;
  line-height: 1;
  color: #333;
  white-space: nowrap;
}
</style>
