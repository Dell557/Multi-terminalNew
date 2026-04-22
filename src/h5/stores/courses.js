import { defineStore } from 'pinia';
import {
  getHomeCourseTemplates,
  getSearchAllCourses,
  buildSearchHotList,
  extractCategoriesFromCourses,
  getBackendRuntimeStatus
} from '../services/courses';

/** @typedef {import('../types/course').CourseListItem} CourseListItem */
/** @typedef {import('../types/course').CourseDetail} CourseDetail */
/** @typedef {import('../types/course').CourseOther} CourseOther */
/** @typedef {import('../types/course').HotItem} HotItem */

const CACHE_TTL_MS = 5 * 60 * 1000;
const LIKED_COURSES_KEY = 'likedCourses';

/**
 * 获取本地存储的收藏状态
 * @returns {Set<string>}
 */
const getStoredLikes = () => {
  try {
    const stored = localStorage.getItem(LIKED_COURSES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

/**
 * 保存收藏状态到本地存储
 * @param {Set<string>} likes
 */
const saveLikes = (likes) => {
  try {
    localStorage.setItem(LIKED_COURSES_KEY, JSON.stringify([...likes]));
  } catch (e) {
    console.warn('Failed to save likes:', e);
  }
};

export const useCoursesStore = defineStore('courses', {
  state: () => ({
    homeTemplates: [],
    searchAllCourses: [],
    searchHotList: [],
    detailCourses: [],
    detailOtherCourses: [],
    detailCategories: [],
    likedCourses: getStoredLikes(),
    loadedAt: 0,
    loadError: '',
    dbConnected: null,
    dataSource: 'unknown',
    statusCheckedAt: 0
  }),
  getters: {
    isStale: (state) => !state.loadedAt || Date.now() - state.loadedAt > CACHE_TTL_MS,
    detailById: (state) => (id) => {
      const key = String(id || '1');
      const list = state.detailCourses || [];
      return list.find(item => String(item.id) === key) || null;
    },
    isLiked: (state) => (id) => state.likedCourses.has(String(id))
  },
  actions: {
    async ensureLoaded(force = false) {
      if (!force && !this.isStale && this.homeTemplates.length > 0) return;

      const fetchWithRetry = async (fn, maxRetries = 10, interval = 2000) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.warn(`[Courses Store] Fetch failed, retrying in ${interval}ms... (${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, interval));
          }
        }
      };

      try {
        this.loadError = '';

        try {
          const status = await getBackendRuntimeStatus();
          this.dbConnected = status?.dbConnected ?? null;
          this.dataSource = status?.source || 'unknown';
          this.statusCheckedAt = Date.now();
        } catch {
          this.dbConnected = null;
          this.dataSource = 'unknown';
        }

        // 轮询加载首页数据
        const homeData = await fetchWithRetry(getHomeCourseTemplates);

        let searchData = homeData;
        try {
          // 轮询加载搜索数据
          searchData = await fetchWithRetry(() => getSearchAllCourses(''), 5);
        } catch (searchError) {
          console.warn('Search preload failed after retries, fallback to home data:', searchError);
        }

        this.homeTemplates = homeData;
        this.searchAllCourses = searchData;
        this.searchHotList = buildSearchHotList(searchData);
        this.detailCategories = extractCategoriesFromCourses([
          ...homeData,
          ...searchData
        ]);
        
        this.detailCourses = []; 
        this.detailOtherCourses = [];

        this.loadedAt = Date.now();
      } catch (error) {
        const dbHint =
          this.dbConnected === false
            ? '数据库连接失败，当前可能为降级数据。'
            : '正在努力连接服务器，请稍后再试...';
        this.loadError = dbHint;
        console.error('Failed to load courses data after retries:', error);
        throw error;
      }
    },

    /** 将收藏状态应用到课程数据 */
    applyLikesToCourses() {
      // 移除副作用函数，不再直接修改 state 中的数据
      // isLiked 应该完全由 getters.isLiked 决定，或者在组件层面处理
    },

    /** 切换收藏状态 */
    toggleLike(courseId) {
      const id = String(courseId);
      if (this.likedCourses.has(id)) {
        this.likedCourses.delete(id);
      } else {
        this.likedCourses.add(id);
      }
      saveLikes(this.likedCourses);
    },

    refresh() {
      this.ensureLoaded(true);
    }
  }
});
