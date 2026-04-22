<template>
  <div class="detail-page">
    <van-nav-bar
      title="课题详情"
      :border="false"
      class="custom-nav-bar"
      z-index="100"
      safe-area-inset-top
    >
      <template #left>
        <img src="/H5_icon/fanhui.png" class="nav-icon" @click="onBack" />
      </template>
      <template #right>
        <van-icon name="replay" size="22" color="var(--color-neutral-900)" class="nav-right-icon" @click="onRefresh" />
      </template>
    </van-nav-bar>

    <div v-if="detailLoading" class="detail-skeleton">
      <div class="skeleton-hero"></div>
      <div class="skeleton-card">
        <van-skeleton title :row="3" />
      </div>
      <div class="skeleton-tabs">
        <van-skeleton :row="8" />
      </div>
    </div>

    <template v-else>
      <CourseHero
        :course="course"
        :categories="categories"
        :industry-desc="industryDesc"
        :view-count-text="viewCountText"
        @show-all-tags="showSubjectPopup = true"
      />

      <div class="tabs-wrap">
        <van-tabs 
          v-model:active="activeTab" 
          background="transparent" 
          :sticky="false"
          line-width="20px"
          line-height="3px"
          color="var(--color-orange-550)"
          title-active-color="var(--color-neutral-900)"
          title-inactive-color="var(--color-neutral-500)"
        >
          <van-tab title="课题简介" name="intro">
            <CourseIntroTab :course="course" :rating="rating" @show-poster="showPoster = true" />
          </van-tab>
          <van-tab title="导师详情" name="teacher">
            <CourseTeacherDetailTab :course="course" @show-poster="showPoster = true" />
          </van-tab>
          <van-tab v-if="hasOtherCourses" title="其他课题" name="others">
            <CourseOtherTab :other-courses="otherCourses" @show-poster="showPoster = true" />
          </van-tab>
        </van-tabs>
      </div>
    </template>

    <div class="scroll-top-fab" role="button" tabindex="0" @click="scrollToTop">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
        <g filter="url(#filter0_d_936_5186)">
          <circle cx="24" cy="23" r="20" fill="white" />
        </g>
        <defs>
          <filter id="filter0_d_936_5186" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset dy="1" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_936_5186" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_936_5186" result="shape" />
          </filter>
        </defs>
      </svg>
      <van-icon name="arrow-up" class="scroll-top-icon" />
    </div>

    <div class="poster-download-fab" role="button" tabindex="0" @click="showPoster = true">
      <van-button round color="#FF6B00" icon="down" class="poster-download-btn">下载课题海报</van-button>
    </div>
    <CoursePosterPopup v-model="showPoster" :poster-url="course.posterUrl" />
    <van-popup v-model:show="showSubjectPopup" round class="subject-type-popup">
      <div class="subject-type-title">课题类型</div>
      <div class="subject-type-section">
        <div class="subject-type-label">一级学科</div>
        <div class="subject-type-tags">
          <span v-for="(t, i) in primarySubjects" :key="`p-${t}-${i}`" class="subject-type-tag subject-type-tag-primary">{{ t }}</span>
        </div>
      </div>
      <div class="subject-type-section">
        <div class="subject-type-label">二级学科</div>
        <div class="subject-type-tags">
          <span v-for="(t, i) in secondarySubjects" :key="`s-${t}-${i}`" class="subject-type-tag">{{ t }}</span>
        </div>
      </div>
      <div class="subject-type-ok" role="button" tabindex="0" @click="showSubjectPopup = false">我知道了</div>
    </van-popup>

  </div>
  
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCourseDetailById, getDetailOtherCourses, increaseCourseViewCount } from '../services/courses';
import CourseHero from '../components/course-detail/CourseHero.vue';
import CourseIntroTab from '../components/course-detail/CourseIntroTab.vue';
import CourseTeacherDetailTab from '../components/course-detail/CourseTeacherDetailTab.vue';
import CourseOtherTab from '../components/course-detail/CourseOtherTab.vue';
import CoursePosterPopup from '../components/course-detail/CoursePosterPopup.vue';

const route = useRoute();
const router = useRouter();
const activeTab = ref('intro');
const showPoster = ref(false);
const detailLoading = ref(true);
const showSubjectPopup = ref(false);

const course = ref({
  id: '',
  title: '',
  image: '/H5_icon/meiyouneirong.png',
  school: '',
  teacher: '',
  desc: '',
  rating: 0,
  tutorId: '',
  views: 0,
  tags: [],
  primarySubjects: [],
  secondarySubjects: [],
  mainTutor: {},
  subTutor: {},
  projectInfo: {},
  projectProcess: [],
  projectGain: [],
  posterUrl: ''
});
const rating = computed(() => Number(course.value?.rating || 0));
const viewCountText = computed(() => {
  const count = Math.max(0, Number(course.value?.views || 0) || 0);
  return `${count}次浏览`;
});

const otherCourses = ref([]);
const hasOtherCourses = computed(() => Array.isArray(otherCourses.value) && otherCourses.value.length > 0);

const primarySubjects = computed(() => (Array.isArray(course.value?.primarySubjects) ? course.value.primarySubjects : []));
const secondarySubjects = computed(() => (Array.isArray(course.value?.secondarySubjects) ? course.value.secondarySubjects : []));

const categories = computed(() => {
  const primary = primarySubjects.value;
  const secondary = secondarySubjects.value;
  const tags = Array.isArray(course.value?.tags) ? course.value.tags : [];
  const merged = [...primary, ...secondary].filter(Boolean);
  const base = merged.length ? merged : tags;
  const out = [];
  const seen = new Set();
  base.forEach((item) => {
    const text = String(item ?? '').trim();
    if (!text) return;
    if (seen.has(text)) return;
    seen.add(text);
    out.push(text);
  });
  return out.slice(0, 4);
});
const industryDesc = computed(() => {
  const specialty = String(course.value?.mainTutor?.specialty || '').trim();
  if (specialty) return specialty;
  return course.value?.desc || '暂无课题描述';
});

const onBack = () => {
  router.back();
};

const onRefresh = () => {
  detailLoading.value = true;
  otherCourses.value = [];
  retryDelay = 1200;
  clearRetry();
  loadDetail();
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

let retryTimer = null;
let retryDelay = 1200;

const clearRetry = () => {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
};

const scheduleRetry = () => {
  clearRetry();
  retryTimer = setTimeout(() => {
    loadDetail();
  }, retryDelay);
  retryDelay = Math.min(Math.floor(retryDelay * 1.4), 10000);
};

let lastLoggedDetailId = '';

const loadDetail = async () => {
  const id = String(route.params.id || '');
  if (!id) return;

  try {
    const detail = await getCourseDetailById(id);
    const isMock = Boolean(detail?.__isMock);

    if (import.meta.env.DEV && id !== lastLoggedDetailId) {
      lastLoggedDetailId = id;
      console.log('[CourseDetail] loaded', { id, isMock, detail });
    }

    if (!detail || isMock) {
      detailLoading.value = true;
      scheduleRetry();
      return;
    }

    course.value = {
      ...course.value,
      ...detail
    };

    if (import.meta.env.DEV) {
      console.log('[CourseDetail] state', { id: course.value?.id, course: course.value });
    }

    // 按 wu_pc 约定写回浏览量（PUT /api/course/:id），失败时静默降级
    void increaseCourseViewCount(course.value.id, course.value?.views || 0).then((nextViews) => {
      const safeViews = Math.max(0, Number(nextViews || 0) || 0);
      course.value = {
        ...course.value,
        views: safeViews
      };
    });

    detailLoading.value = false;
    retryDelay = 1200;
    clearRetry();

    const tutorId = course.value?.tutorId;
    if (tutorId) {
      otherCourses.value = await getDetailOtherCourses(tutorId, course.value.id);
    } else {
      otherCourses.value = [];
    }
  } catch (error) {
    detailLoading.value = true;
    scheduleRetry();
  }
};

watch(
  () => route.params.id,
  () => {
    detailLoading.value = true;
    otherCourses.value = [];
    retryDelay = 1200;
    clearRetry();
    loadDetail();
  }
);

watch(hasOtherCourses, (visible) => {
  if (!visible && activeTab.value === 'others') {
    activeTab.value = 'intro';
  }
});

onMounted(() => {
  loadDetail();
});

onBeforeUnmount(() => {
  clearRetry();
});
</script>

<style>
.detail-page {
  background: var(--bg-page);
  min-height: 100vh;
  padding-bottom: calc(70px + env(safe-area-inset-bottom));
}

.detail-skeleton {
  padding: 12px;
}

.poster-download-fab {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 120;
  width: min(210px, calc(100vw - 64px));
}

.poster-download-btn {
  width: 100%;
  height: 44px;
  box-shadow: 0 8px 20px rgba(255, 107, 0, 0.25);
  font-weight: 600;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.scroll-top-fab {
  position: fixed;
  right: 12px;
  bottom: calc(22px + env(safe-area-inset-bottom));
  z-index: 121;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.scroll-top-fab svg {
  display: block;
}

.scroll-top-icon {
  position: absolute;
  font-size: 20px;
  color: var(--color-orange-650);
}

.skeleton-hero {
  height: clamp(150px, 45vw, 190px);
  border-radius: 12px;
  background: #f2f3f5;
}

.skeleton-card {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-white);
}

.skeleton-tabs {
  margin-top: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-white);
}

.hero {
  position: relative;
  margin: 0;
  border-radius: 0;
  overflow: hidden;
}

.hero-img {
  width: 100%;
  height: 241px;
  background: #D9D9D9;
  border-radius: 0px;
  display: block;
  margin: -2px;
  width: calc(100% + 4px);
  height: 241px;
}

.hero-top {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.badge {
  background: rgba(0,0,0,0.5);
  color: var(--color-white);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.badge-icon { width: 14px; height: 14px; display: block; }

.tools { display: flex; align-items: center; }
.tool-icon { width: 18px; height: 18px; display: block; }

.hero-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 10px 12px 12px;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title {
  width: 351px;
  max-width: 100%;
  height: 44px;
  font-family: PingFang SC, PingFang SC;
  font-weight: 600;
  font-size: 16px;
  color: var(--color-white);
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 1.4;
  margin-top: 0;
}

.custom-nav-bar {
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

.nav-right-icon {
  padding: 2px;
}

.chips-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chips-scroll {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex: 1;
  min-width: 0;
}
.chips-scroll::-webkit-scrollbar { display: none; }

.chip {
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(245, 246, 248, 0.92);
  color: var(--color-neutral-700);
  border: 1px solid rgba(245, 246, 248, 0.92);
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.chip.primary {
  background: rgba(255, 255, 255, 0.98);
  color: var(--color-orange-600);
  border-color: var(--color-orange-600);
}

.chips-scroll .chip {
  border: none;
}

.chip-more {
  gap: 4px;
  cursor: pointer;
  color: var(--color-neutral-700);
}

.subject-type-popup {
  width: 311px;
  max-width: calc(100vw - 48px);
  padding: 18px 16px 0;
  border-radius: 12px;
}

.subject-type-title {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-neutral-900);
  margin-bottom: 12px;
}

.subject-type-section + .subject-type-section {
  margin-top: 16px;
}

.subject-type-label {
  font-size: 14px;
  color: var(--color-neutral-900);
  margin-bottom: 10px;
}

.subject-type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 8px;
}

.subject-type-tag {
  height: 24px;
  padding: 0 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(245, 246, 248, 1);
  color: var(--color-neutral-700);
  border: 1px solid rgba(245, 246, 248, 1);
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.subject-type-tag-primary {
  background: rgba(255, 255, 255, 1);
  color: var(--color-orange-600);
  border-color: var(--color-orange-600);
}

.subject-type-ok {
  margin-top: 18px;
  padding: 14px 0 16px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-orange-600);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.info-section {
  position: relative;
  background: var(--bg-white);
  border-radius: 12px 12px 0 0;
  margin-top: -1.2vw;
  padding-bottom: 20px;
  z-index: 1;
}

.meta-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 32px;
  padding: 16px 20px 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.meta-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.meta-label {
  font-size: 12px;
  color: var(--color-neutral-500);
  line-height: 1.2;
}

.meta-value {
  font-family: PingFang SC, PingFang SC;
  font-weight: 600;
  font-size: 14px;
  color: var(--color-neutral-900);
  text-align: left;
  font-style: normal;
  text-transform: none;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.4;
}

.role-badge {
  background: linear-gradient(90deg, #FFB034 0%, #FF8900 100%);
  color: #FFFFFF;
  padding: 1px 6px;
  border-radius: 8px 0 8px 0;
  font-size: 10px;
  font-weight: 500;
  display: inline-block;
  vertical-align: middle;
}

.industry-card {
  background: #FFF5F0;
  margin: 0 20px;
  padding: 12px 16px;
  border-radius: 8px;
}

.industry-title {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.industry-title-img {
  width: auto;
  height: 18px;
  object-fit: contain;
}

.industry-desc {
  color: #666666;
  font-size: 13px;
  line-height: 1.5;
  text-align: justify;
}

.tabs-wrap {
  margin-top: -12px;
  position: relative;
  z-index: 2;
}
.tabs-wrap .van-tabs__wrap {
  position: -webkit-sticky;
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--bg-white);
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  padding-top: 8px;
}
.tabs-wrap .van-tabs__nav {
  background: transparent;
}

.section {
  width: 351px;
  background: var(--bg-white);
  border-radius: 8px;
  margin: 12px auto 0;
  padding: 10px;
  box-sizing: border-box;
}

.section-head {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F5F5F5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.section-head .section-header {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-head .difficulty { 
  display: flex;
  align-items: center;
  color: #999999; 
  font-size: 11px; 
}

.desc {
  color: var(--color-neutral-700);
  font-size: 14px;
  line-height: 1.6;
  text-align: justify;
}

.files {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.files::-webkit-scrollbar { display: none; }

.file-card {
  flex: 0 0 calc(50% - 4px);
  height: 64px;
  background: #F7F8FA;
  border-radius: 8px;
  padding: 8px 6px;
  display: flex;
  gap: 6px;
  align-items: center;
  box-sizing: border-box;
}

.file-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 44px;
  gap: 0;
}

.file-icon-img {
  width: 28px;
  height: 28px;
  display: block;
}

.file-icon-placeholder {
  width: 28px;
  height: 28px;
  background: #E5E5E5;
  border-radius: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.file-icon-placeholder::after {
  content: '';
  width: 14px;
  height: 10px;
  background: #999;
  border-radius: 2px;
}

.preview-tag {
  white-space: nowrap;
  background: #FFF1E8;
  color: #FF8900;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 999px;
  transform: scale(0.85);
  margin-top: -2px;
}

.file-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  height: 100%;
  padding: 2px 0;
  min-width: 0;
}

.file-right .name {
  font-size: 13px;
  color: #333333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.2;
}

.file-right .size {
  font-size: 11px;
  color: #999999;
}

.teacher-card {
  background: var(--color-orange-020);
  border: 1px solid var(--color-orange-120);
  border-radius: 12px;
  padding: 12px;
}
.teacher-card .tag {
  display: inline-block;
  background: var(--color-orange-080);
  color: var(--color-orange-600);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  margin-bottom: 8px;
}
.teacher-card .t-title {
  color: var(--color-neutral-900);
  font-weight: 600;
  margin-bottom: 6px;
}
.teacher-card .t-list {
  margin: 0;
  padding-left: 18px;
  color: var(--color-neutral-700);
}
.t-cta { margin-top: 12px; }

.cta-btn {
  background: linear-gradient(90deg, var(--color-orange-700) 0%, var(--color-orange-600) 100%);
  color: var(--color-white);
  border: none;
}

/* Tutor Intro Card */
.tutor-intro-card {
  background: var(--color-blue-020);
  border-radius: 8px;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.tutor-tag-wrapper {
  margin-bottom: 12px;
}
.tutor-tag {
  display: inline-block;
  background: var(--color-blue-400);
  color: var(--color-white);
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px 4px 10px;
  border-radius: 6px 14px 0 6px;
  position: relative;
  line-height: 1.4;
}
.tutor-tag::after {
  content: '';
  position: absolute;
  top: 0;
  right: -8px;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 26px 8px 0 0;
  border-color: var(--color-blue-400) transparent transparent transparent;
  display: none;
}

.tutor-duty {
  font-size: 15px;
  color: var(--color-neutral-900);
  margin-bottom: 12px;
  line-height: 1.5;
  font-weight: 600;
}
.tutor-duty .duty-text {
  color: var(--color-neutral-900);
  font-weight: 400;
}

.tutor-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tutor-intro-card + .tutor-intro-card {
  margin-top: 12px;
}
.tutor-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--color-neutral-800);
  line-height: 1.4;
}
.t-icon {
  margin-top: 2px;
  font-size: 14px;
}
.t-icon.blue { color: var(--color-blue-600); }
.t-icon.orange { color: var(--color-orange-550); }
.t-icon.green { color: var(--color-green-500); }

/* Project Info Section */
.project-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-item {
  display: flex;
  align-items: stretch;
}
.info-icon-box {
  width: 44px;
  background: var(--color-blue-400);
  border-radius: 8px 0 0 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}
.question-mark {
  color: var(--color-white);
  font-size: 24px;
  font-weight: 800;
  font-family: sans-serif;
}
.triangle {
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid var(--color-blue-400);
}
.info-content {
  flex: 1;
  background: var(--color-blue-020);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}
.info-label {
  font-size: 13px;
  color: var(--color-neutral-700);
}
.info-value {
  font-family: PingFang SC, PingFang SC;
  font-weight: 500;
  font-size: 14px;
  color: var(--color-neutral-900);
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 1.4;
}

/* Project Process Section */
.process-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.process-card {
  background: var(--color-blue-020);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.process-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  z-index: 1;
  position: relative;
}
.p-title {
  font-family: PingFang SC, PingFang SC;
  font-weight: 800;
  font-size: 16px;
  color: var(--color-blue-700);
  text-align: left;
  font-style: normal;
  text-transform: none;
}
.p-num {
  position: absolute;
  right: -8px;
  top: 0px;
  font-size: 48px;
  color: var(--color-blue-030);
  font-weight: 800;
  font-style: italic;
  line-height: 1;
  z-index: 0;
  pointer-events: none;
}
.p-desc {
  font-family: PingFang SC, PingFang SC;
  font-weight: 400;
  font-size: 13px;
  color: var(--color-neutral-900);
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 1.5;
  z-index: 1;
  position: relative;
}

/* Harvest Section */
.harvest-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.harvest-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.harvest-row-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.harvest-item {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-light);
  aspect-ratio: 1.25;
}
.harvest-row-2 .harvest-item {
  aspect-ratio: 1.8;
}
.harvest-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.harvest-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-red-800);
  color: var(--color-white);
  font-family: PingFang SC, PingFang SC;
  font-size: 12px;
  text-align: center;
  padding: 4px 0;
  font-weight: 500;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 28px;
}
.sub-label {
  font-size: 10px;
  transform: scale(0.9);
  opacity: 0.9;
  margin-top: 2px;
}

/* Result Section */
.result-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}
.result-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.result-item, .result-full {
  border-radius: 4px;
  overflow: hidden;
  background: var(--bg-light);
  border: 1px dashed var(--color-neutral-500);
  position: relative;
}
.result-img {
  width: 100%;
  height: auto;
  display: block;
}
.result-btn-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0,0,0,0.02);
}
.download-poster-btn {
  height: 36px;
  font-size: 14px;
  font-weight: 500;
  padding: 0 24px;
  box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
  border: none;
}

/* Teacher Detail Card */
.teacher-detail-card {
  position: relative;
}
.teacher-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.t-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px dashed var(--color-neutral-250); /* 虚线框 */
  flex-shrink: 0;
}
.t-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.t-info-main {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.t-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.t-name {
  font-family: PingFang SC, PingFang SC;
  font-weight: 600;
  font-size: 16px;
  color: var(--color-neutral-900);
}
.t-level {
  background: var(--color-orange-090);
  color: var(--color-warning-600);
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}
.t-school {
  font-size: 13px;
  color: var(--color-neutral-700);
}

.teacher-achievements {
  width: 100%;
  background: rgba(109,109,109,0.05);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-sizing: border-box;
}
.teacher-achievements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.teacher-achievements li {
  position: relative;
  padding-left: 12px;
  font-family: PingFang SC, PingFang SC;
  font-weight: 500;
  font-size: 14px;
  color: var(--color-neutral-900);
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 1.6;
  margin-bottom: 4px;
}
.teacher-achievements li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-neutral-900);
}
.teacher-achievements li:last-child {
  margin-bottom: 0;
}

.teacher-content-block {
  margin-bottom: 12px;
}
.block-title {
  font-size: 13px;
  color: var(--color-neutral-500);
  margin-bottom: 4px;
}
.block-text {
  font-family: PingFang SC, PingFang SC;
  font-weight: 400;
  font-size: 14px;
  color: var(--color-neutral-900);
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 1.6;
}

.teacher-note {
  font-size: 12px;
  color: var(--color-danger-strong);
  margin-top: 16px;
  margin-bottom: 16px;
  line-height: 1.4;
}

.teacher-footer-meta {
  border-top: 1px solid var(--color-neutral-200);
  padding-top: 12px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-neutral-500);
}
  /* Other Courses Tab */
  .other-course-list {
    padding: 12px;
    padding-bottom: 80px; /* Space for fixed button */
  }
.other-course-item {
  display: flex;
  background: var(--bg-white);
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .other-course-left {
    width: 100px;
    height: 100px;
    margin-right: 12px;
    flex-shrink: 0;
  }
  .other-course-img {
    width: 100%;
    height: 100%;
    border-radius: 6px;
    object-fit: cover;
  }
  .other-course-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
.other-course-title {
    font-size: 15px;
    font-weight: 500;
  color: var(--color-neutral-900);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 8px;
  }
  .other-course-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tag-item {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
  }
.tag-orange {
  color: var(--color-orange-650);
  background: var(--color-orange-015);
}
.tag-gray {
  color: var(--color-neutral-700);
  background: var(--color-warm-060);
}
  .fixed-download-btn-container {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    z-index: 100;
  }
  .download-poster-btn {
    box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
    font-weight: 600;
    font-size: 16px;
  }
  
  /* Poster Popup */
.poster-popup {
  background: var(--bg-light) !important;
    border-radius: 12px !important;
    overflow: visible !important;
  }
  .poster-popup-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
    padding-top: 24px;
    box-sizing: border-box;
  }
.poster-title {
    font-size: 18px;
    font-weight: 600;
  color: var(--color-neutral-900);
    margin-bottom: 12px;
    text-align: center;
    width: 100%;
    line-height: 1;
    font-family: PingFang SC, sans-serif;
  }
  .poster-image-container {
    width: 200px;
    height: 356px;
    border-radius: 12px;
    margin-bottom: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    overflow: hidden;
    flex-shrink: 0;
  }
  .poster-img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }
.poster-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  color: var(--color-neutral-500);
    margin-bottom: 0;
    line-height: 1;
    font-family: PingFang SC, sans-serif;
  }
  .download-btn-popup {
    width: 240px;
    height: 40px;
    line-height: 40px;
    box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);
    font-weight: 600;
    font-size: 16px;
    border: none;
    position: absolute;
    bottom: -64px; 
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    font-family: PingFang SC, sans-serif;
  }
</style>
