<template>
  <div class="home-container">
    <!-- 顶部搜索栏 -->
    <div class="header-search">
      <van-search
        v-model="searchValue"
        placeholder="搜索课程名称、关键词..."
        shape="round"
        class="search-bar"
        readonly
        @click-input="goToSearch"
      />
      <img :src="viewMode === 'list' ? listIcon : gridIcon" class="header-icon-img" alt="视图切换" @click="toggleViewMode" />
      <img :src="themeIcon" class="header-icon-img" alt="主题切换" @click="toggleTheme" />
    </div>

    <!-- 标题栏 -->
    <div class="title-bar">
      <div class="title-left">
        <span class="main-title">课题列表</span>
        <span class="sub-title">共{{ totalCount }}个课题</span>
      </div>
      <div class="title-right" @click="goToFilter">
        <img :src="shaixuanIcon" class="filter-icon" alt="筛选" />
      </div>
    </div>
    <div v-if="loadError" class="load-error">{{ loadError }}</div>

    <!-- 课题列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh" head-height="40">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        @load="onLoad"
        :class="['course-list', viewMode, { empty: courseList.length === 0 && finished }]"
      >
        <CourseCard
            v-for="item in courseList"
            :key="item.id"
            :course="item"
            :layout="viewMode"
            like-icon-type="vant"
            footer-icon-type="vant"
            :footer-school-icon="schoolIcon"
            :footer-teacher-icon="teacherIcon"
            @select="goToDetail"
            @toggle-like="toggleLike"
          />
        <template #finished>
          <EmptyState v-if="courseList.length === 0" image="default" description="空空如也～" padding-top="0px" />
          <div v-else class="no-more">没有更多了</div>
        </template>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCoursesStore } from '../stores/courses';
import { ROUTE_NAMES, ROUTE_PATHS } from '../router/routes';
import CourseCard from '../components/CourseCard.vue';
import EmptyState from '../components/EmptyState.vue';

const VIEW_MODE_KEY = 'viewMode';
const FILTER_KEY = 'filterState';

const shaixuanIcon = '/H5_icon/shaixuan.png';
const listIcon = '/H5_icon/liebiaozhanshi.png';
const gridIcon = '/H5_icon/kapianzhanshi.png';
const schoolIcon = '/H5_icon/xuexiao.png';
const teacherIcon = '/H5_icon/cankaodaoshi.png';

const searchValue = ref('');
const viewMode = ref(localStorage.getItem(VIEW_MODE_KEY) || 'list');
const router = useRouter();
const route = useRoute();
const coursesStore = useCoursesStore();

// 主题图标（仅用于显示，不再切换主题）
const themeIcon = '/H5_icon/shensemoshi.png';

onMounted(async () => {
  try {
    // 强制重新加载，确保获取最新 Mock 数据
    await coursesStore.ensureLoaded(true);
  } catch {
    // 错误信息通过 store.loadError 展示
  }
});

const goToFilter = () => {
  router.push(ROUTE_PATHS.FILTER);
};

const goToSearch = () => {
  router.push(ROUTE_PATHS.SEARCH);
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'grid' : 'list';
  localStorage.setItem(VIEW_MODE_KEY, viewMode.value);
};
const loadFilterState = () => {
  try {
    const stored = localStorage.getItem(FILTER_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const filterState = ref(loadFilterState());
const baseData = computed(() => coursesStore.homeTemplates);
const filteredData = computed(() => {
  const state = filterState.value || {};
  const mentor = String(state?.selectedMentorType || '').trim();
  const level1 = String(state?.selectedLevel1 || '').trim();
  const level2Selections = Array.isArray(state?.selectedLevel2)
    ? state.selectedLevel2.map((v) => String(v)).filter(Boolean)
    : [];
  const difficulty = String(state?.selectedDifficulty || '').trim();

  if (!mentor && !level1 && level2Selections.length === 0 && !difficulty) return baseData.value;

  return (Array.isArray(baseData.value) ? baseData.value : []).filter((course) => {
    if (mentor && String(course?.roleName || '').trim() !== mentor) return false;

    const tags = Array.isArray(course?.tags) ? course.tags : [];
    const primary = tags[0] != null ? String(tags[0]).trim() : '';
    const secondary = tags.slice(1).map((t) => String(t).trim()).filter(Boolean);

    if (level1 && primary !== level1) return false;
    if (level2Selections.length && !level2Selections.some((t) => secondary.includes(t))) return false;
    if (difficulty && String(Math.floor(course?.rating || 0)) !== difficulty) return false;

    return true;
  });
});

const totalCount = computed(() => filteredData.value.length);
const loadError = computed(() => coursesStore.loadError);

const goToDetail = (item) => {
  router.push({ name: ROUTE_NAMES.DETAIL, params: { id: item.id } });
};

// 列表状态
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);
const courseList = ref([]);

const sourceData = computed(() => filteredData.value);

const onLoad = async () => {
  if (sourceData.value.length === 0) {
    try {
      await coursesStore.ensureLoaded();
    } catch {
      loading.value = false;
      finished.value = true;
      return;
    }
  }

  if (refreshing.value) {
    courseList.value = [];
    refreshing.value = false;
  }

  if (!sourceData.value.length) {
    loading.value = false;
    finished.value = true;
    return;
  }

  const startIndex = courseList.value.length;
  const pageSize = 10;
  const newItems = sourceData.value.slice(startIndex, startIndex + pageSize);

  if (newItems.length > 0) {
    newItems.forEach(item => {
      const fallbackId = item?.id ? String(item.id) : `home_${courseList.value.length + 1}`;
      courseList.value.push({
        ...item,
        id: fallbackId,
        isLiked: coursesStore.isLiked(fallbackId),
        statusDot: false
      });
    });
    loading.value = false;
  } else {
    loading.value = false;
    finished.value = true;
  }
};

const resetAndLoad = async () => {
  finished.value = false;
  courseList.value = [];
  loading.value = true;
  await onLoad();
};

watch(
  () => route.fullPath,
  async () => {
    filterState.value = loadFilterState();
    await resetAndLoad();
  }
);

const onRefresh = async () => {
  try {
    await coursesStore.ensureLoaded(true);
  } catch {
    refreshing.value = false;
    loading.value = false;
    finished.value = true;
    return;
  }
  finished.value = false;
  courseList.value = [];
  loading.value = true;
  await onLoad();
};

const toggleLike = (item) => {
  coursesStore.toggleLike(item.id);
  // 更新当前列表中的状态
  const index = courseList.value.findIndex(c => c.id === item.id);
  if (index !== -1) {
    courseList.value[index].isLiked = !courseList.value[index].isLiked;
  }
};

const toggleTheme = () => {
  // 显示正在开发中提示
  if (typeof window !== 'undefined') {
    // 使用 Vant 的 Toast 提示
    import('vant').then(({ showToast }) => {
      showToast({
        message: '正在开发中',
        duration: 1500,
        mask: true
      });
    }).catch(() => {
      // 如果 Toast 不可用，使用原生 alert
      alert('正在开发中');
    });
  }
};
</script>

<style>
.home-container {
  background-color: var(--bg-page);
  min-height: 100vh;
}

/* 搜索栏样式 */
.header-search {
  display: flex;
  align-items: center;
  padding: 10px var(--space-lg);
  background-color: var(--header-bg);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--header-border);
  gap: 8px;
}

.search-bar {
  flex: 1;
  padding: 0 10px;
}

.header-icon-img {
  width: 24px;
  height: 24px;
  margin-left: 8px;
  object-fit: contain;
  flex-shrink: 0;
}

/* 标题栏样式 */
.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3.2vw var(--space-lg);
}

.main-title {
  font-family: PingFang SC, PingFang SC;
  font-weight: 500;
  font-size: 16px;
  color: var(--color-neutral-900);
  text-align: left;
  font-style: normal;
  text-transform: none;
  margin-right: var(--space-sm);
}

.sub-title {
  font-size: 12px;
  color: var(--text-sub);
}

.title-right {
  display: flex;
  align-items: center;
}

.load-error {
  margin: 0 var(--space-lg) 8px;
  color: var(--color-danger-strong);
  font-size: 12px;
}

.filter-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

/* 列表样式 */
.course-list {
  padding: 0.666667vw var(--space-lg);
}

.course-list.empty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 140px);
}

.course-list.empty.grid {
  display: flex;
  grid-template-columns: none;
  gap: 0;
  justify-content: center;
}

.course-list.empty .empty-state {
  width: 100%;
  display: flex;
  justify-content: center;
}

.course-list.empty .van-empty {
  margin: 0 auto;
}

.no-more {
  padding: 16px 0;
  text-align: center;
  font-size: 12px;
  color: var(--text-sub);
}

.course-list.grid {
  display: grid;
  grid-template-columns: repeat(2, 170px);
  gap: 12px;
  justify-content: center;
}

.home-container .search-bar .van-search__content {
  width: 100% !important;
  height: 32px !important;
  background-color: #FFFFFF !important;
  border-radius: 21px !important;
  border: 1px solid #FF6601 !important;
  padding: 0 12px !important;
  display: flex;
  align-items: center;
}

.home-container .search-bar .van-field__control {
  color: var(--text-main);
  font-family: PingFang SC, sans-serif;
  font-size: 14px;
  line-height: 20px;
}

.home-container .search-bar .van-field__control::placeholder {
  color: #999999;
  font-family: PingFang SC, sans-serif;
  font-size: 14px;
}

.home-container .search-bar .van-icon-search {
  color: #999999;
  font-size: 18px;
  margin-right: 4px;
}
</style>
