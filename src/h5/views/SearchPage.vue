<template>
  <div class="search-page">
    <!-- 顶部搜索栏 -->
    <div class="search-header">
      <van-icon name="arrow-left" class="back-icon" @click="goBack" />
      <van-search
        v-model="keyword"
        show-action
        placeholder="搜索课程名称、关键词..."
        shape="round"
        class="search-input-wrap"
        autofocus
        @search="onSearch"
      >
        <template #action>
          <div class="search-action-btn" @click="onSearch">搜索</div>
        </template>
      </van-search>
    </div>

    <!-- 默认展示内容（无搜索词时） -->
    <div v-show="!keywordTrim">
      <!-- 最近搜索 -->
      <SearchHistory ref="searchHistoryRef" @select="onHistorySelect" />

      <!-- 热门推荐 --> 
      <div class="hot-section">
        <SectionHeader
          title="热门课题推荐"
          icon-name="fire"
          icon-color="var(--color-danger-strong)"
        />
        
        <div class="hot-list">
          <div 
            v-for="(item, index) in hotList" 
            :key="index" 
            class="hot-item"
            @click="onSelect(item)"
          >
            <span :class="['rank-num', { top3: index < 3 }]">{{ index + 1 }}</span>
            <div class="item-content">
              <span class="item-text van-ellipsis">{{ item.title }}</span>
              <span v-if="item.tag === 'hot'" class="tag hot">热</span>
              <span v-if="item.tag === 'recommend'" class="tag recommend">荐</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模糊搜索下拉提示列表 -->
    <div v-show="keywordTrim && !hasSearched" class="search-suggestions">
      <div 
        v-for="item in localSearchResults" 
        :key="item.id" 
        class="suggestion-item"
        @click="onSuggestionSelect(item)"
      >
        <van-icon name="search" class="suggestion-icon" />
        <div class="suggestion-text van-ellipsis" v-html="highlightKeyword(item.title)"></div>
      </div>
      <EmptyState 
        v-if="localSearchResults.length === 0"
        image="search"
        description="暂无相关匹配课题"
      />
    </div>

    <!-- 搜索结果列表 -->
    <div v-show="keywordTrim && hasSearched" class="search-result-container">
      <div class="result-toolbar">
        <div class="result-summary">
          <span class="summary-title">搜索结果</span>
          <span class="summary-sub">共{{ searchResults.length }}个课题</span>
        </div>
        <div class="result-toolbar-right">
          <div class="quick-filter-scroll">
            <div
              v-for="filter in quickFilters"
              :key="filter.key"
              class="quick-filter-pill"
            >
              {{ filter.label }}
            </div>
          </div>
          <img src="/H5_icon/shaixuan.png" class="filter-icon" alt="筛选" @click="goToFilter" />
        </div>
      </div>
      <div v-if="feishuSearchLoading" class="result-tip">飞书文档加载中...</div>
      <div v-else-if="feishuSearchError" class="result-tip error">{{ feishuSearchError }}</div>
      
      <div v-if="searchResults.length > 0" class="course-list grid">
        <CourseCard
          v-for="item in searchResults"
          :key="item.id"
          :course="item"
          layout="grid"
          like-icon-type="vant"
          footer-icon-type="vant"
          @select="goToDetail"
          @toggle-like="toggleLike"
        />
      </div>
      
      <EmptyState 
        v-else
        image="search"
        description="暂未搜索到相关课题内容"
      />
    </div>

    <!-- 网络异常遮罩层 -->
    <div v-if="isNetworkError" class="search-network-error-overlay">
      <div class="network-error-content">
        <van-image
          width="160"
          height="160"
          src="/H5_icon/wangluoyichang.png"
          class="network-error-img"
          lazy-load
        />
        <div class="network-error-text">网络异常...</div>
      </div>
    </div>

    <!-- 加载中遮罩层 -->
    <div v-if="loading" class="search-loading-overlay">
      <div class="loading-content">
        <van-image
          width="80"
          height="80"
          :src="'/Result/loading.png'"
          class="loading-img"
          lazy-load
        />
        <div class="loading-text">正在加载中...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SearchHistory from '../components/SearchHistory.vue';
import CourseCard from '../components/CourseCard.vue';
import SectionHeader from '../components/SectionHeader.vue';
import EmptyState from '../components/EmptyState.vue';
import { ROUTE_NAMES } from '../router/routes';
import { useCoursesStore } from '../stores/courses';
import { searchFeishuDocs } from '../services/feishu';
import { debounce } from '../utils';

const coursesStore = useCoursesStore();
const FEISHU_RESULT_LIMIT = 10;

const router = useRouter();
const route = useRoute();
const keyword = ref('');
const keywordTrim = computed(() => String(keyword.value || '').trim());
const searchHistoryRef = ref(null);
const loading = ref(false);
const isNetworkError = ref(false);
const hasSearched = ref(false);

const syncQueryFromState = () => {
  const q = String(keyword.value || '').trim();
  if (!q) {
    if (route.query?.q || route.query?.searched) {
      router.replace({ query: {} });
    }
    return;
  }
  const nextQuery = { ...route.query, q, searched: hasSearched.value ? '1' : '0' };
  router.replace({ query: nextQuery });
};

const goToDetail = (item) => {
  if (item?.sourceType === 'feishu' && item?.docId) {
    router.push({ name: ROUTE_NAMES.FEISHU_DOC, params: { docId: item.docId } });
    return;
  }
  router.push({ name: ROUTE_NAMES.DETAIL, params: { id: item.id } });
};

const goToFilter = () => {
  router.push({ name: ROUTE_NAMES.FILTER });
};

const allCourses = ref([]);

const buildSearchText = (item) => {
  const tagsText = Array.isArray(item.tags) ? item.tags.join(' ') : '';
  return [item.title, item.desc, item.school, item.teacher, tagsText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

const normalizeFeishuDocs = (payload) => {
  const list =
    payload?.docs ||
    payload?.documents ||
    payload?.items ||
    payload?.results ||
    (Array.isArray(payload) ? payload : []);
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => ({
      doc_id: item?.doc_id || item?.docId || item?.id || item?.token || '',
      title: item?.title || item?.name || item?.doc_title || '',
      summary: item?.summary || '',
      owner_name: item?.owner_name || item?.ownerName || ''
    }))
    .filter((item) => item.doc_id);
};

const mapFeishuDocToCourse = (doc) => ({
  id: `feishu_${doc.doc_id}`,
  docId: doc.doc_id,
  sourceType: 'feishu',
  image: '/H5_icon/kapianzhanshi.png',
  roleName: '飞书',
  roleType: 'doc',
  title: doc.title || '未命名文档',
  tags: ['飞书文档'],
  tagsMore: 0,
  desc: doc.summary || '来自飞书知识库',
  school: doc.owner_name || '飞书知识库',
  teacher: '在线文档',
  rating: 0,
  isLiked: false,
  statusDot: false
});

const searchIndex = ref([]);

const searchCache = new Map();

const computeSearchResults = (rawKeyword) => {
  const keywordText = String(rawKeyword || '').trim().toLowerCase();
  if (!keywordText) return [];
  if (searchCache.has(keywordText)) return searchCache.get(keywordText);

  const results = searchIndex.value
    .filter(entry => entry.text.includes(keywordText))
    .map(entry => entry.item);

  if (searchCache.size > 50) {
    searchCache.clear();
  }
  searchCache.set(keywordText, results);
  return results;
};

const localSearchResults = ref([]);
const feishuSearchResults = ref([]);
const feishuSearchLoading = ref(false);
const feishuSearchError = ref('');
let feishuRequestSerial = 0;

const allowFeishuSearch = computed(() => {
  return String(coursesStore.dataSource || '').toLowerCase() !== 'mysql';
});

const searchResults = computed(() => {
  const merged = allowFeishuSearch.value
    ? [...localSearchResults.value, ...feishuSearchResults.value]
    : [...localSearchResults.value];
  const seen = new Set();
  return merged.filter((item) => {
    const key = String(item?.id || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});

const quickFilters = computed(() => {
  const roleCount = new Map();
  const tagCount = new Map();
  const schoolCount = new Map();

  searchResults.value.forEach((item) => {
    const role = String(item?.roleName || '').trim();
    if (role) roleCount.set(role, (roleCount.get(role) || 0) + 1);

    const school = String(item?.school || '').trim();
    if (school) schoolCount.set(school, (schoolCount.get(school) || 0) + 1);

    const tags = Array.isArray(item?.tags) ? item.tags : [];
    tags.forEach((t) => {
      const tag = String(t || '').trim();
      if (!tag) return;
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    });
  });

  const toSorted = (m) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

  const roles = toSorted(roleCount).slice(0, 1).map((x) => ({ ...x, type: 'role' }));
  const tags = toSorted(tagCount).slice(0, 2).map((x) => ({ ...x, type: 'tag' }));
  const schools = toSorted(schoolCount).slice(0, 1).map((x) => ({ ...x, type: 'school' }));

  return [...roles, ...tags, ...schools].map((x) => ({
    ...x,
    key: `${x.type}:${x.label}`
  }));
});

const hotList = ref([]);

const goBack = () => {
  router.back();
};

let loadDataPromise = null;
const ensureSearchDataReady = async () => {
  if (searchIndex.value.length > 0) return;
  if (loadDataPromise) return loadDataPromise;
  loadDataPromise = loadData().finally(() => {
    loadDataPromise = null;
  });
  return loadDataPromise;
};

const loadData = async () => {
  loading.value = true;
  try {
    await coursesStore.ensureLoaded();
    allCourses.value = Array.isArray(coursesStore.searchAllCourses)
      ? coursesStore.searchAllCourses.map((item) => ({
          ...item,
          isLiked: coursesStore.isLiked(item?.id)
        }))
      : [];
    hotList.value = Array.isArray(coursesStore.searchHotList) ? coursesStore.searchHotList : [];
    searchIndex.value = allCourses.value.map(item => ({
      item,
      text: buildSearchText(item)
    }));
    searchCache.clear();
    isNetworkError.value = false;
  } catch {
    allCourses.value = [];
    hotList.value = [];
    searchIndex.value = [];
    isNetworkError.value = true;
  } finally {
    loading.value = false;
  }
};

const fetchFeishuResults = async (rawKeyword) => {
  if (!allowFeishuSearch.value) {
    feishuRequestSerial += 1;
    feishuSearchResults.value = [];
    feishuSearchError.value = '';
    feishuSearchLoading.value = false;
    return;
  }

  const query = String(rawKeyword || '').trim();
  const requestId = ++feishuRequestSerial;

  if (!query) {
    feishuSearchResults.value = [];
    feishuSearchError.value = '';
    feishuSearchLoading.value = false;
    return;
  }

  feishuSearchLoading.value = true;
  feishuSearchError.value = '';
  try {
    const payload = await searchFeishuDocs(query, 0, FEISHU_RESULT_LIMIT);
    if (requestId !== feishuRequestSerial) return;
    const docs = normalizeFeishuDocs(payload);
    feishuSearchResults.value = docs.map(mapFeishuDocToCourse);
    isNetworkError.value = false;
  } catch (e) {
    if (requestId !== feishuRequestSerial) return;
    feishuSearchResults.value = [];
    feishuSearchError.value = e?.message || '飞书搜索失败';
    if (!localSearchResults.value.length) {
      isNetworkError.value = true;
    }
  } finally {
    if (requestId === feishuRequestSerial) {
      feishuSearchLoading.value = false;
    }
  }
};

// 搜索处理函数
const handleSearch = () => {
  const text = keyword.value.trim();
  if (!text) return;
  searchHistoryRef.value?.saveHistory(text);
  isNetworkError.value = false;
};

// 防抖搜索（300ms 延迟）
const debouncedSearch = debounce(handleSearch, 300);
const updateSearchResults = () => {
  localSearchResults.value = computeSearchResults(keyword.value);
};
const debouncedUpdateResults = debounce(updateSearchResults, 200);
const debouncedFetchFeishuResults = debounce(() => {
  if (!allowFeishuSearch.value) return;
  fetchFeishuResults(keyword.value);
}, 250);

// 监听关键词变化自动搜索
watch(keyword, (newVal) => {
  hasSearched.value = false;
  if (newVal.trim()) {
    debouncedUpdateResults();
    debouncedFetchFeishuResults();
  } else {
    localSearchResults.value = [];
    feishuRequestSerial += 1;
    feishuSearchResults.value = [];
    feishuSearchError.value = '';
    feishuSearchLoading.value = false;
    loading.value = false;
    isNetworkError.value = false;
  }
  syncQueryFromState();
});

// 手动点击搜索按钮
const onSearch = async () => {
  await ensureSearchDataReady();
  hasSearched.value = true;
  updateSearchResults();
  fetchFeishuResults(keyword.value);
  handleSearch();
  syncQueryFromState();
};

const onSuggestionSelect = (item) => {
  keyword.value = item.title;
  onSearch();
};

const highlightKeyword = (text) => {
  if (!keyword.value) return text;
  const regex = new RegExp(`(${keyword.value})`, 'gi');
  return text.replace(regex, '<span style="color: var(--color-orange-500);">$1</span>');
};

const toggleLike = (item) => {
  if (item?.sourceType === 'feishu') return;
  const id = String(item?.id || '').trim();
  if (!id) return;
  coursesStore.toggleLike(id);
  const next = coursesStore.isLiked(id);
  try {
    item.isLiked = next;
  } catch {}
  const idx = localSearchResults.value.findIndex((x) => String(x?.id || '').trim() === id);
  if (idx !== -1) {
    localSearchResults.value[idx].isLiked = next;
  }
};

const onHistorySelect = (item) => {
  const title = String(item || '').trim();
  if (!title) return;
  const normalized = title.toLowerCase();
  const exact = allCourses.value.find((c) => String(c?.title || '').trim() === title);
  const fuzzy = allCourses.value.find((c) => String(c?.title || '').toLowerCase().includes(normalized));
  const hit = exact || fuzzy;
  if (hit) {
    goToDetail(hit);
    return;
  }
  keyword.value = title;
  onSearch();
};

const onSelect = (item) => {
  const title = String(item?.title || '').trim();
  if (!title) return;
  const normalized = title.toLowerCase();
  const exact = allCourses.value.find((c) => String(c?.title || '').trim() === title);
  const fuzzy = allCourses.value.find((c) => String(c?.title || '').toLowerCase().includes(normalized));
  const hit = exact || fuzzy;
  if (hit) {
    goToDetail(hit);
    return;
  }
  keyword.value = title;
  onSearch();
};

onMounted(async () => {
  await ensureSearchDataReady();
  const q = String(route.query?.q || '').trim();
  const searched = String(route.query?.searched || '') === '1';
  if (q) {
    keyword.value = q;
    if (searched) {
      await onSearch();
    }
  }
});
</script>

<style scoped>
.search-page {
  min-height: 100vh;
  background-color: var(--bg-white);
}

.search-header {
  display: flex;
  align-items: center;
  padding: 0 10px;
  background-color: var(--bg-white);
}

.search-result-container {
  padding: 10px 12px 16px;
  background-color: var(--bg-page);
  min-height: calc(100vh - 54px);
}

.result-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: var(--bg-white);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.result-summary {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-shrink: 0;
}

.summary-title {
  font-size: 14px;
  color: var(--text-main);
  font-weight: 600;
}

.summary-sub {
  font-size: 12px;
  color: var(--text-sub);
}

.result-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.quick-filter-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  min-width: 0;
}

.quick-filter-scroll::-webkit-scrollbar {
  display: none;
}

.quick-filter-pill {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 14px;
  font-size: 12px;
  color: #B66801;
  background: #FFF0E6;
  border: 1px solid #FFF0E6;
  max-width: 84px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
}

.quick-filter-pill:first-child {
  color: #B66801;
  background: #FFECCA;
  border-color: #FFECCA;
}

.filter-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
  cursor: pointer;
}

.result-tip {
  font-size: 12px;
  color: var(--text-sub);
  margin: -2px 0 10px 4px;
}

.result-tip.error {
  color: var(--color-danger-strong);
}

.course-list.grid {
  display: grid;
  grid-template-columns: repeat(2, 170px);
  gap: 12px;
  justify-content: center;
}

.back-icon {
  font-size: 24px;
  color: var(--color-neutral-500);
  padding: 10px 5px;
}

.search-input-wrap {
  flex: 1;
  padding-left: 5px;
}

.search-action-btn {
  color: var(--color-white);
  background: linear-gradient(90deg, var(--color-orange-400) 0%, var(--color-orange-500) 100%);
  padding: 4px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 24px;
}

.hot-section {
  padding: 20px;
}


.hot-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hot-item {
  display: flex;
  align-items: flex-start; /* Align top if multiline, or center if single line. Design shows numbering aligned with text */
  cursor: pointer;
}

.rank-num {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-neutral-500);
  width: 24px;
  margin-right: 8px;
  text-align: left;
  line-height: 1.4; /* Match text line-height roughly */
}

.rank-num.top3 {
  color: var(--color-orange-600);
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.item-text {
  font-size: 14px;
  color: var(--color-neutral-900);
  /* white-space: nowrap; */ /* van-ellipsis handles this if we want single line, but design might allow multiline or ellipsis */
  /* If van-ellipsis is used on span, it needs display block or inline-block with width */
}

.tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  margin-left: 6px;
  flex-shrink: 0;
  color: var(--color-white);
}

.tag.hot {
  background-color: var(--color-danger-strong);
}

.tag.recommend {
  background-color: var(--color-orange-500);
}

.search-loading-overlay,
.search-network-error-overlay {
  position: fixed;
  top: 54px; /* header height */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-page);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content,
.network-error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translateY(-50px);
}

.loading-text,
.network-error-text {
  margin-top: 16px;
  font-size: 14px;
  color: var(--text-sub);
}

.search-input-wrap :deep(.van-search__content) {
  width: 100% !important;
  height: 32px !important;
  background-color: #FFFFFF !important;
  border-radius: 21px !important;
  border: 1px solid #FF6601 !important;
  padding: 0 12px !important;
  display: flex;
  align-items: center;
}

.search-input-wrap :deep(.van-cell) {
  padding: 0 !important;
  height: 100%;
  display: flex;
  align-items: center;
}

.search-input-wrap :deep(.van-field__control) {
  color: var(--text-main);
  font-family: PingFang SC, sans-serif;
  font-size: 14px;
  line-height: 20px;
}

.search-input-wrap :deep(.van-field__control::placeholder) {
  color: #999999;
  font-family: PingFang SC, sans-serif;
  font-size: 14px;
}

.search-input-wrap :deep(.van-icon-search) {
  color: #999999;
  font-size: 18px;
  margin-right: 4px;
}

.search-suggestions {
  background-color: var(--bg-white);
  min-height: calc(100vh - 54px);
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #F5F5F5;
  cursor: pointer;
}

.suggestion-item:active {
  background-color: #F9F9F9;
}

.suggestion-icon {
  font-size: 16px;
  color: #CCCCCC;
  margin-right: 12px;
}

.suggestion-text {
  flex: 1;
  font-size: 14px;
  color: #333333;
  line-height: 1.4;
}

/* Override default v-html styles inside suggestion-text */
.suggestion-text :deep(span) {
  color: var(--color-orange-500) !important;
}
</style>
