<script setup>
import { computed } from 'vue'
import { ArrowDown, Close, RefreshRight } from '@element-plus/icons-vue'
import { useSubjectFilters } from '@/composables/useFilters'

const props = defineProps({
  subjectData: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['filter-change'])

const {
  selectedPrimary,
  selectedSecondary,
  selectedMentorType,
  mentorTypes,
  currentSecondaryList,
  SECONDARY_LIMIT,
  expandedSecondary,
  onPrimaryAllClick,
  onPrimaryClick,
  onSecondaryAllClick,
  onSecondaryClick,
  toggleSecondaryExpand,
  onMentorTypeClick,
  activeFilters,
  removeFilter
} = useSubjectFilters(props.subjectData)

const showSecondaryMore = computed(() => {
  return currentSecondaryList.value.length > SECONDARY_LIMIT
})

function handleFilterChange() {
  emit('filter-change', {
    primary: selectedPrimary.value,
    secondary: selectedSecondary.value,
    mentorType: selectedMentorType.value
  })
}

function resetAllFilters() {
  onPrimaryAllClick()
  onSecondaryAllClick()
  onMentorTypeClick('全部')
  emit('filter-change', { primary: '', secondary: '', mentorType: '全部' })
}
</script>

<template>
  <div class="filter-section">
    <div class="filter-content">
      <div class="filter-row">
        <span class="label">一级学科</span>
        <div class="options">
          <button 
            class="filter-btn primary-all all-btn" 
            :class="{ active: !selectedPrimary }" 
            @click="onPrimaryAllClick(); handleFilterChange()"
          >全部</button>
          <button 
            v-for="sub in subjectData" 
            :key="sub.name" 
            class="filter-btn" 
            :class="{ active: selectedPrimary === sub.name }" 
            @click="onPrimaryClick(sub.name); handleFilterChange()"
          >{{ sub.name }}</button>
        </div>
      </div>

      <div class="filter-row secondary-row">
        <span class="label">二级学科</span>
        <div class="options secondary-options" :class="{ expanded: expandedSecondary }">
          <button 
            class="filter-btn secondary-all all-btn" 
            :class="{ active: !selectedSecondary }" 
            @click="onSecondaryAllClick(); handleFilterChange()"
          >全部</button>
          <button 
            v-for="item in currentSecondaryList" 
            :key="item" 
            class="filter-btn" 
            :class="{ active: selectedSecondary === item }" 
            @click="onSecondaryClick(item); handleFilterChange()"
          >{{ item }}</button>
        </div>
        <div 
          class="expand-more" 
          :class="{ active: expandedSecondary }" 
          v-if="showSecondaryMore" 
          @click="toggleSecondaryExpand"
        >
          <el-icon><ArrowDown /></el-icon>
        </div>
      </div>

      <div class="filter-row">
        <span class="label">导师类型</span>
        <div class="options">
          <button 
            v-for="type in mentorTypes" 
            :key="type" 
            class="filter-btn" 
            :class="{ active: selectedMentorType === type, 'all-btn': type === '全部' }" 
            @click="onMentorTypeClick(type); handleFilterChange()"
          >{{ type }}</button>
        </div>
      </div>

      <div class="selected-filters-row" v-if="activeFilters.length > 0">
        <span class="label selected-label">已选</span>
        <div class="selected-tags">
          <div class="filter-tag" v-for="(filter, index) in activeFilters" :key="index">
            <span>{{ filter.label }}</span>
            <el-icon class="close-icon" @click="removeFilter(filter); handleFilterChange()"><Close /></el-icon>
          </div>
        </div>
        <button class="reset-btn" @click="resetAllFilters">
          <el-icon><RefreshRight /></el-icon>
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-section {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.filter-content {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.label {
  width: 80px;
  font-size: 14px;
  color: #666;
  line-height: 32px;
  flex-shrink: 0;
}

.options {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-btn {
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  border-color: #ff6b00;
  color: #ff6b00;
}

.filter-btn.active {
  background: #ff6b00;
  color: #fff;
  border-color: #ff6b00;
  font-weight: 500;
}

.secondary-options {
  max-height: 40px;
  overflow: hidden;
  transition: max-height 0.4s ease-in-out;
}

.secondary-options.expanded {
  max-height: 2000px;
}

.filter-btn.all-btn.active {
  background: #ff6b00;
  color: #fff;
  border-color: #ff6b00;
}

.expand-more {
  margin-left: auto;
  cursor: pointer;
  color: #ff6b00;
  width: 28px;
  height: 28px;
  border: 1px solid #ff6b00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.expand-more .el-icon {
  transition: transform 0.2s ease;
}

.expand-more.active .el-icon {
  transform: rotate(180deg);
}

.selected-filters-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
}

.selected-label {
  color: #999;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 107, 0, 0.1);
  color: #ff6b00;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
}

.filter-tag:hover {
  background: rgba(255, 107, 0, 0.2);
}

.close-icon {
  font-size: 14px;
  line-height: 1;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px solid #d9d9d9;
  background: #fff;
  color: #666;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: auto;
  transition: all 0.2s;
}

.reset-btn:hover {
  border-color: #ff6b00;
  color: #ff6b00;
}
</style>
