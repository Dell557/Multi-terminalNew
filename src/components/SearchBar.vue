<script setup>
import { ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  suggestions: {
    type: Array,
    default: () => []
  },
  showSuggestions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'select-suggestion', 'clear'])

const inputRef = ref(null)
const localValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
  if (newVal) {
    emit('search', newVal)
  }
})

function handleInput(val) {
  localValue.value = val
  emit('update:modelValue', val)
}

function handleKeydown() {
  emit('search', localValue.value)
}

function handleClear() {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

function selectSuggestion(item) {
  localValue.value = item.title
  emit('update:modelValue', item.title)
  emit('select-suggestion', item)
}
</script>

<template>
  <div class="search-container">
    <el-input 
      ref="inputRef"
      v-model="localValue"
      placeholder="搜索感兴趣的课题方向、导师"
      class="header-search-input"
      @keyup.enter="handleKeydown"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      @input="handleInput"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
      <template #suffix>
        <div class="header-suffix">
          <span
            class="header-clear"
            :class="{ 'is-visible': !!localValue }"
            @click="handleClear"
          >×</span>
          <el-button class="header-search-btn" @click="emit('search', localValue)">搜索</el-button>
        </div>
      </template>
    </el-input>
    
    <Transition name="suggestion-fade">
      <div class="search-suggestions" v-if="showSuggestions && suggestions.length > 0">
        <div 
          class="suggestion-item" 
          v-for="item in suggestions" 
          :key="item.id"
          @click="selectSuggestion(item)"
        >
          <div class="suggestion-title">{{ item.title }}</div>
          <div class="suggestion-meta">
            <span>{{ item.university }}</span>
            <span class="separator">|</span>
            <span>{{ item.teacher }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.search-container {
  flex: 1;
  max-width: 600px;
  margin: 0 40px;
  position: relative;
}

.header-search-input {
  width: 100%;
}

.header-search-input :deep(.el-input__wrapper) {
  border-radius: 999px;
  border: 1px solid #ff6b00;
  background-color: #fff;
  box-shadow: none;
  padding: 0 0 0 20px;
  overflow: hidden;
}

.header-search-input :deep(.el-input__inner) {
  height: 42px;
  line-height: 42px;
  padding: 0;
}

.header-search-input :deep(.el-input__suffix) {
  padding: 0;
  right: 0;
}

.header-search-input :deep(.el-input__suffix-inner) {
  display: flex;
  align-items: center;
  height: 100%;
}

.header-suffix {
  display: flex;
  align-items: center;
  height: 100%;
}

.header-clear {
  width: 20px;
  text-align: center;
  margin-right: 8px;
  font-size: 16px;
  color: #b3b3b3;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.header-clear.is-visible {
  opacity: 1;
  pointer-events: auto;
}

.header-search-btn {
  height: 100%;
  border-radius: 0 !important;
  margin: 0 !important;
  border: none !important;
  background-color: #ff6b00 !important;
  color: white !important;
  padding: 0 24px !important;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.header-search-btn:hover {
  background-color: #ff8533 !important;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 8px;
  z-index: 1000;
  overflow: hidden;
  border: 1px solid #ebeef5;
  max-height: 400px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f2f5;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.suggestion-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
}

.suggestion-meta .separator {
  margin: 0 8px;
  color: #dcdfe6;
}

.suggestion-fade-enter-active,
.suggestion-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.suggestion-fade-enter-from,
.suggestion-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
