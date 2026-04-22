<template>
  <div class="filter-page">
    <van-nav-bar
      title="筛选课题"
      :border="false"
      class="nav-bar"
    >
      <template #left>
        <img src="/H5_icon/fanhui.png" class="nav-icon" @click="onClickLeft" />
      </template>
    </van-nav-bar>

    <div class="content-scroll">
      <!-- 已选 -->
      <div class="filter-section selected-section" v-if="hasSelected">
        <div class="selected-label">已选</div>
        <div class="selected-tags">
          <div v-for="tag in selectedTags" :key="tag.value" :class="['selected-tag', tag.type]" @click="removeTag(tag)">
            <span>{{ formatTagText(tag.label) }}</span>
            <van-icon name="cross" class="close-icon" />
          </div>
        </div>
      </div>

      <!-- 导师类型 -->
      <div class="filter-section">
        <div class="section-header">
          <span class="section-title">导师类型</span>
        </div>
        <div class="tags-container">
          <div
            v-for="item in mentorTypes"
            :key="item"
            class="filter-tag"
            :class="{ active: selectedMentorType === item }"
            @click="selectedMentorType = item"
          >
            {{ item }}
          </div>
        </div>
      </div>

      <!-- 一级学科 -->
      <div class="filter-section">
        <div class="section-header">
          <div class="title-wrap" @click="toggleLevel1Type">
            <span class="section-title">一级学科（{{ level1TypeLabel }}）</span>
            <span class="sort-toggle" :class="{ hot: level1Type === 'hot' }">
              <span class="tri up"></span>
              <span class="tri down"></span>
            </span>
          </div>
          <span class="tip-text">*点击可切换学科类型</span>
        </div>
        <div class="tags-container">
          <div
            v-for="item in level1Disciplines"
            :key="item"
            class="filter-tag"
            :class="{ active: selectedLevel1 === item }"
            @click="selectedLevel1 = item"
          >
            {{ item }}
          </div>
        </div>
      </div>

      <!-- 二级学科 -->
      <div class="filter-section">
        <div class="section-header">
          <span class="section-title">二级学科</span>
        </div>
        <div class="tags-container">
          <div
            v-for="item in level2Disciplines"
            :key="item"
            class="filter-tag"
            :class="{ active: selectedLevel2.includes(item) }"
            @click="toggleLevel2(item)"
          >
            {{ item }}
          </div>
        </div>
      </div>

      <!-- 难度 -->
      <div class="filter-section">
        <div class="section-header">
          <span class="section-title">难度</span>
        </div>
        <div class="tags-container">
          <div
            v-for="level in difficultyLevels"
            :key="level.value"
            class="filter-tag"
            :class="{ active: selectedDifficulty === level.value }"
            @click="selectedDifficulty = level.value"
          >
            {{ level.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="footer-actions">
      <van-button block class="reset-btn" @click="resetFilters">重置</van-button>
      <van-button block class="confirm-btn" @click="applyFilters">查看筛选结果</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { debounce } from '../utils';
import { useCoursesStore } from '../stores/courses';

const FILTER_KEY = 'filterState';

const router = useRouter();
const coursesStore = useCoursesStore();

const DEFAULT_MENTOR_TYPES = [];
const DEFAULT_LEVEL1_STANDARD = [];
const DEFAULT_LEVEL2 = [];
const DEFAULT_DIFFICULTY_LEVELS = [
  { value: '1', label: '简单' },
  { value: '2', label: '中等' },
  { value: '3', label: '困难' },
  { value: '4', label: '挑战' }
];

// 从 localStorage 读取筛选状态
const loadFilterState = () => {
  try {
    const stored = localStorage.getItem(FILTER_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      return state;
    }
  } catch (e) {
    console.warn('Failed to load filter state:', e);
  }
  return null;
};

// 保存筛选状态到 localStorage
const saveFilterState = () => {
  try {
    const state = {
      selectedMentorType: selectedMentorType.value,
      selectedLevel1: selectedLevel1.value,
      level1Type: level1Type.value,
      selectedLevel2: selectedLevel2.value,
      selectedDifficulty: selectedDifficulty.value
    };
    localStorage.setItem(FILTER_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save filter state:', e);
  }
};

const debouncedSaveFilterState = debounce(saveFilterState, 300);
let skipNextAutoSave = false;

// 清除筛选状态
const clearFilterState = () => {
  try {
    localStorage.removeItem(FILTER_KEY);
  } catch (e) {
    console.warn('Failed to clear filter state:', e);
  }
};

const mentorTypes = ref([...DEFAULT_MENTOR_TYPES]);
const level1DisciplinesStandard = ref([...DEFAULT_LEVEL1_STANDARD]);
const level1DisciplinesHot = ref(DEFAULT_LEVEL1_STANDARD.slice(0, 8));
const level2DisciplinesAll = ref([...DEFAULT_LEVEL2]);
const level2ByLevel1 = ref(new Map());
const difficultyLevels = ref([...DEFAULT_DIFFICULTY_LEVELS]);

const buildDynamicFilterOptions = (courses) => {
  const mentorSet = new Set();
  const level1Set = new Set();
  const level2Set = new Set();
  const nextLevel2ByLevel1 = new Map();

  (Array.isArray(courses) ? courses : []).forEach((course) => {
    if (course?.roleName) {
      mentorSet.add(String(course.roleName));
    }

    const tags = Array.isArray(course?.tags) ? course.tags : [];
    const level1 = String(tags?.[0] || '').trim();
    const level2List = tags.slice(1).map((t) => String(t || '').trim()).filter(Boolean);
    if (level1 && level2List.length) {
      if (!nextLevel2ByLevel1.has(level1)) nextLevel2ByLevel1.set(level1, new Set());
      const set = nextLevel2ByLevel1.get(level1);
      level2List.forEach((t) => set.add(t));
    }
    tags.forEach((tag, index) => {
      if (!tag) return;
      if (index === 0) {
        level1Set.add(String(tag));
      } else {
        level2Set.add(String(tag));
      }
    });
  });

  mentorTypes.value = mentorSet.size ? Array.from(mentorSet) : [...DEFAULT_MENTOR_TYPES];
  const level1List = level1Set.size ? Array.from(level1Set) : [...DEFAULT_LEVEL1_STANDARD];
  level1DisciplinesStandard.value = level1List;
  level1DisciplinesHot.value = level1List.slice(0, 8);
  level2DisciplinesAll.value = level2Set.size ? Array.from(level2Set) : [...DEFAULT_LEVEL2];
  level2ByLevel1.value = nextLevel2ByLevel1;
};

// 页面加载时恢复筛选状态
onMounted(async () => {
  try {
    await coursesStore.ensureLoaded();
    const sourceCourses = [
      ...(Array.isArray(coursesStore.homeTemplates) ? coursesStore.homeTemplates : []),
      ...(Array.isArray(coursesStore.searchAllCourses) ? coursesStore.searchAllCourses : [])
    ];
    buildDynamicFilterOptions(sourceCourses);
  } catch (error) {
    console.warn('Failed to load dynamic filter options:', error);
  }

  const savedState = loadFilterState();
  if (savedState) {
    selectedMentorType.value = savedState.selectedMentorType || '';
    selectedLevel1.value = savedState.selectedLevel1 || '';
    level1Type.value = savedState.level1Type || 'standard';
    selectedLevel2.value = savedState.selectedLevel2 || [];
    selectedDifficulty.value = savedState.selectedDifficulty || '4';
  }

  if (selectedMentorType.value && !mentorTypes.value.includes(selectedMentorType.value)) {
    selectedMentorType.value = '';
  }
  if (selectedLevel1.value && !level1Disciplines.value.includes(selectedLevel1.value)) {
    selectedLevel1.value = '';
  }
  selectedLevel2.value = selectedLevel2.value.filter(item => level2Disciplines.value.includes(item));
});

const onClickLeft = () => {
  router.back();
};

// 选中状态
const selectedMentorType = ref('');
const selectedLevel1 = ref('');
const level1Type = ref('standard');
const selectedDifficulty = ref('4');

const level1Disciplines = computed(() => {
  return level1Type.value === 'standard' ? level1DisciplinesStandard.value : level1DisciplinesHot.value;
});

const level1TypeLabel = computed(() => {
  return level1Type.value === 'standard' ? '标准' : '热门';
});
const selectedLevel2 = ref([]);
const level2Disciplines = computed(() => {
  const level1 = String(selectedLevel1.value || '').trim();
  if (!level1) return level2DisciplinesAll.value;
  const set = level2ByLevel1.value.get(level1);
  return set ? Array.from(set) : [];
});

// 计算已选标签
const selectedTags = computed(() => {
  const tags = [];
  if (selectedMentorType.value) {
    tags.push({ label: selectedMentorType.value, type: 'mentor', value: selectedMentorType.value });
  }
  if (selectedLevel1.value) {
    tags.push({ label: selectedLevel1.value, type: 'level1', value: selectedLevel1.value });
  }
  selectedLevel2.value.forEach(item => {
    tags.push({ label: item, type: 'level2', value: item });
  });
  if (selectedDifficulty.value) {
    const difficultyLabel = difficultyLevels.value.find(level => level.value === selectedDifficulty.value)?.label || '';
    tags.push({ label: difficultyLabel, type: 'difficulty', value: selectedDifficulty.value });
  }
  return tags;
});

const hasSelected = computed(() => selectedTags.value.length > 0);

// 移除标签
const removeTag = (tag) => {
  if (tag.type === 'mentor') {
    selectedMentorType.value = '';
  } else if (tag.type === 'level1') {
    selectedLevel1.value = '';
  } else if (tag.type === 'level2') {
    selectedLevel2.value = selectedLevel2.value.filter(i => i !== tag.value);
  } else if (tag.type === 'difficulty') {
    selectedDifficulty.value = '';
  }
};

// 格式化标签文本（最多3个字，超出显示...）
const formatTagText = (text) => {
  if (!text) return '';
  const raw = String(text || '').trim();
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return raw;
  return raw.length > 3 ? raw.slice(0, 3) + '...' : raw;
};

const toggleLevel2 = (item) => {
  if (selectedLevel2.value.includes(item)) {
    selectedLevel2.value = selectedLevel2.value.filter(i => i !== item);
  } else {
    selectedLevel2.value.push(item);
  }
};

watch(
  selectedLevel1,
  (next, prev) => {
    if (next === prev) return;
    selectedLevel2.value = selectedLevel2.value.filter((item) => level2Disciplines.value.includes(item));
  }
);

const toggleLevel1Type = () => {
  level1Type.value = level1Type.value === 'standard' ? 'hot' : 'standard';
  if (!level1Disciplines.value.includes(selectedLevel1.value)) {
    selectedLevel1.value = '';
  }
};

const resetFilters = () => {
  skipNextAutoSave = true;
  selectedMentorType.value = '';
  selectedLevel1.value = '';
  level1Type.value = 'standard';
  selectedLevel2.value = [];
  selectedDifficulty.value = '4';
  // 清除本地存储的筛选状态
  clearFilterState();
};

const applyFilters = () => {
  // 保存筛选状态
  saveFilterState();
  // 这里可以处理筛选逻辑，或者回传数据
  router.back();
};

// 监听筛选状态变化，自动保存到 localStorage
watch(
  [selectedMentorType, selectedLevel1, level1Type, selectedLevel2, selectedDifficulty],
  () => {
    if (skipNextAutoSave) {
      skipNextAutoSave = false;
      return;
    }
    debouncedSaveFilterState();
  },
  { deep: true }
);
</script>

<style scoped>
.filter-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-white);
}

.nav-bar {
  flex-shrink: 0;
  --van-nav-bar-title-font-weight: 600;
  --van-nav-bar-icon-color: var(--color-neutral-900);
  --van-nav-bar-title-text-color: var(--color-neutral-900);
  --van-nav-bar-background: var(--bg-page);
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: block;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 80px 16px; /* 底部留出按钮空间 */
}

.filter-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title-wrap {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-neutral-900);
}

.sort-toggle {
  width: 22px;
  height: 18px;
  margin-left: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.tri {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
}

.tri.up {
  border-bottom: 8px solid #BFBFBF;
}

.tri.down {
  border-top: 8px solid var(--color-orange-600);
}

.sort-toggle.hot .tri.up {
  border-bottom-color: var(--color-orange-600);
}

.sort-toggle.hot .tri.down {
  border-top-color: #BFBFBF;
}

.tip-text {
  font-size: 10px;
  color: var(--color-danger-strong); /* 红色提示文字 */
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tag {
  padding: 6px 16px;
  border-radius: 20px;
  font-family: PingFang SC, PingFang SC;
  font-weight: 400;
  font-size: 14px;
  color: var(--color-neutral-700);
  text-align: left;
  font-style: normal;
  text-transform: none;
  background-color: var(--bg-white);
  border: 1px solid var(--color-neutral-200);
  cursor: pointer;
  transition: all 0.2s;
}

/* 选中状态 */
.filter-tag.active {
  color: var(--color-orange-500);
  background-color: var(--color-orange-050);
  border-color: var(--color-orange-500);
}

/* 已选区域样式 */
.selected-section {
  display: flex;
  align-items: flex-start;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--bg-light);
}

.selected-label {
  font-size: 14px;
  color: var(--color-neutral-500);
  margin-right: 12px;
  padding-top: 6px; /* 对齐标签 */
  flex-shrink: 0;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.selected-tag {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
}

.selected-tag.mentor {
  background-color: var(--color-orange-030);
  color: var(--color-orange-500);
}

.selected-tag.level1 {
  background-color: var(--color-orange-040);
  color: var(--color-orange-500);
}

.selected-tag.level2 {
  background-color: var(--color-blue-050);
  color: var(--color-neutral-700);
}

.close-icon {
  margin-left: 4px;
  font-size: 10px;
  color: currentColor;
}

/* 底部按钮区 */
.footer-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 10px 16px 30px 16px; /* 适配 iPhone 底部安全区 */
  background-color: var(--bg-white);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  gap: 12px;
  z-index: 10;
}

.reset-btn {
  flex: 1;
  border-radius: 22px;
  border: 1px solid var(--color-neutral-300);
  color: var(--color-neutral-700);
  font-weight: 500;
}

.confirm-btn {
  flex: 1;
  border-radius: 22px;
  background: linear-gradient(90deg, var(--color-orange-400) 0%, var(--color-orange-500) 100%);
  border: none;
  color: var(--color-white);
  font-weight: 500;
}
</style>
