<template>
  <div class="history-section" v-if="historyList.length > 0">
    <div class="section-header">
      <span class="title-text">最近搜索</span>
      <van-icon name="delete-o" class="delete-icon" @click="clearHistory" />
    </div>
    <div class="history-list">
      <div 
        v-for="(item, index) in historyList" 
        :key="index" 
        class="history-tag"
        @click="onHistorySelect(item)"
      >
        {{ formatHistoryTag(item) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { showConfirmDialog } from 'vant';
import 'vant/es/dialog/style';

const emit = defineEmits(['select']);

const historyList = ref([]);

// Load history from local storage on mount if available
const loadHistory = () => {
  const saved = localStorage.getItem('searchHistory');
  if (saved) {
    historyList.value = JSON.parse(saved);
  }
};

onMounted(() => {
  loadHistory();
});

const clearHistory = () => {
  showConfirmDialog({
    title: '提示',
    message: '是否删除全部搜索记录',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    confirmButtonColor: 'var(--color-danger-strong)',
  })
    .then(() => {
      historyList.value = [];
      localStorage.removeItem('searchHistory');
    })
    .catch(() => {
      // on cancel
    });
};

const saveHistory = (val) => {
  if (!val) return;
  // Remove duplicate if exists
  const index = historyList.value.indexOf(val);
  if (index !== -1) {
    historyList.value.splice(index, 1);
  }
  // Add to top
  historyList.value.unshift(val);
  // Limit to 10
  if (historyList.value.length > 10) {
    historyList.value.pop();
  }
  localStorage.setItem('searchHistory', JSON.stringify(historyList.value));
};

const onHistorySelect = (item) => {
  emit('select', item);
};

const formatHistoryTag = (text) => {
  if (!text) return '';
  return text.length > 10 ? text.slice(0, 10) + '...' : text;
};

// Expose saveHistory method to parent
defineExpose({
  saveHistory
});
</script>

<style scoped>
.history-section {
  padding: 10px 20px 0 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-neutral-900);
}

.delete-icon {
  font-size: 18px;
  color: var(--color-neutral-500);
  padding: 4px;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-tag {
  padding: 6px 14px;
  background-color: var(--bg-page);
  border-radius: 20px;
  font-size: 13px;
  color: var(--color-neutral-700);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
