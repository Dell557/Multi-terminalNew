<template>
  <div class="other-course-list">
    <div class="other-course-item" v-for="item in otherCourses" :key="item.id">
      <div class="other-course-left">
        <img :src="item.image" alt="" class="other-course-img" />
      </div>
      <div class="other-course-right">
        <div class="other-course-title">{{ item.title }}</div>
        <div class="other-course-tags">
          <span v-for="(tag, index) in item.tags" :key="index" :class="['tag-item', index === 0 ? 'tag-orange' : 'tag-gray']">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  otherCourses: {
    type: Array,
    required: true
  }
});

defineEmits(['show-poster']);
</script>
