<script setup>
import { ref, watch, onMounted } from 'vue'
import 'element-plus/dist/locale/zh-cn.js'
const zhCnLocal = undefined
import { AssistantTrigger, AssistantWindow } from '@/components/SmartAssistant'

const showAssistant = ref(false)
const isDark = ref(false)

function toggleAssistant() {
  showAssistant.value = !showAssistant.value
}

function toggleDark() {
  isDark.value = !isDark.value
}

watch(isDark, (val) => {
  if (val) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}, { immediate: true })

onMounted(() => {
  const saved = localStorage.getItem('darkMode')
  if (saved !== null) {
    isDark.value = saved === 'true'
  }
})

watch(isDark, (val) => {
  localStorage.setItem('darkMode', String(val))
})
</script>

<template>
  <el-config-provider :locale="zhCnLocal">
    <div class="pc-adapter">
      <div class="design-root">
        <router-view />
      </div>
    </div>
    
    <AssistantTrigger @click="toggleAssistant" />
    <AssistantWindow :visible="showAssistant" @close="showAssistant = false" />
    
    <button 
      class="dark-mode-toggle"
      @click="toggleDark"
      :class="{ 'dark': isDark }"
    >
      {{ isDark ? '🌞 浅色模式' : '🌙 深色模式' }}
    </button>
  </el-config-provider>
</template>

<style scoped>
.pc-adapter {
  width: 100%;
  overflow-x: hidden;
}
.design-root{
  width: 100%;
  max-width: 1980px;
  margin: 0 auto;
  padding: 0 16px;
}
.dark-mode-toggle {
  position: fixed;
  right: 20px;
  bottom: 120px;
  z-index: 999;
  padding: 10px 16px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}
.dark-mode-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
.dark-mode-toggle.dark {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid #4a4a6a;
}
</style>
