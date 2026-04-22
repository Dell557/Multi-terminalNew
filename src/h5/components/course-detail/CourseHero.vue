<template>
  <div>
    <div class="hero">
      <van-image :src="course.pic_url || course.image" fit="cover" class="hero-img" lazy-load />
      <div class="hero-top">
        <div class="badge">
          <img class="badge-icon" src="/H5_icon/liulanliang.png" alt="浏览量" />
          <span>{{ viewCountText }}</span>
        </div>
      </div>
      <div class="hero-bottom">
        <div class="chips-row" ref="chipsRowRef">
          <div class="chips-scroll">
            <span v-for="(c, i) in visibleCategories" ref="chipRefs" :key="`${c}-${i}`" class="chip" :class="{ primary: i < 2 }">{{ c }}</span>
          </div>
          <div ref="chipMoreRef" class="chip chip-more" role="button" tabindex="0" @click="$emit('show-all-tags')">
            查看全部
            <van-icon name="arrow-down" size="12" />
          </div>
        </div>
        <div class="title van-multi-ellipsis--l2">{{ course.title }}</div>
      </div>
    </div>

    <div class="info-section">
      <div class="meta-row">
        <div class="meta-item">
          <img class="meta-icon" src="/H5_icon/cankaodaoshi.png" alt="导师" />
          <div class="meta-col">
            <div class="meta-label">参考老师</div>
            <div class="meta-value">
              {{ course.teacher }}
              <span class="role-badge" v-if="course.mainTutor?.title">{{ course.mainTutor.title }}</span>
            </div>
          </div>
        </div>
        <div class="meta-item">
          <img class="meta-icon" src="/H5_icon/xuexiao.png" alt="学校" />
          <div class="meta-col">
            <div class="meta-label">学校</div>
            <div class="meta-value">{{ course.school }}</div>
          </div>
        </div>
      </div>

      <div class="industry-card">
        <div class="industry-title">
          <img src="/H5_icon/zhuanyelingyu.png" class="industry-title-img" alt="专业领域" />
        </div>
        <div class="industry-desc">
          {{ industryDesc }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineEmits(['show-all-tags'])

const props = defineProps({
  course: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  industryDesc: {
    type: String,
    default: ''
  },
  viewCountText: {
    type: String,
    default: '123次浏览'
  }
});

const chipsRowRef = ref(null);
const chipMoreRef = ref(null);
const chipRefs = ref([]);
const visibleCount = ref(0);

const recomputeVisibleChips = async () => {
  await nextTick();

  const categories = Array.isArray(props.categories) ? props.categories : [];
  const row = chipsRowRef.value;
  const more = chipMoreRef.value;
  const chips = Array.isArray(chipRefs.value) ? chipRefs.value : [];

  if (!row || !more || categories.length === 0) {
    visibleCount.value = categories.length;
    return;
  }

  const rowWidth = row.clientWidth || 0;
  const moreWidth = more.offsetWidth || 0;
  const gap = 8;
  const available = rowWidth - moreWidth - gap;

  if (available <= 0) {
    visibleCount.value = 0;
    return;
  }

  let used = 0;
  let count = 0;
  for (let i = 0; i < Math.min(categories.length, chips.length); i += 1) {
    const w = chips[i]?.offsetWidth || 0;
    const nextUsed = count === 0 ? w : used + gap + w;
    if (nextUsed > available) break;
    used = nextUsed;
    count += 1;
  }

  visibleCount.value = Math.max(0, Math.min(count, categories.length));
};

const visibleCategories = computed(() => {
  const categories = Array.isArray(props.categories) ? props.categories : [];
  const count = Number.isFinite(Number(visibleCount.value)) ? visibleCount.value : categories.length;
  if (count <= 0) return [];
  return categories.slice(0, count);
});

watch(() => props.categories, recomputeVisibleChips, { deep: true });
onMounted(() => {
  visibleCount.value = Array.isArray(props.categories) ? props.categories.length : 0;
  void recomputeVisibleChips();
  window.addEventListener('resize', recomputeVisibleChips);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', recomputeVisibleChips);
});
</script>
