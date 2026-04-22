<template>
  <van-empty
    class="empty-state"
    :image="image"
    :description="description"
    :style="{ paddingTop }"
  />
</template>

<script setup>
defineProps({
  image: {
    type: String,
    default: 'search'
  },
  description: {
    type: String,
    default: ''
  },
  paddingTop: {
    type: String,
    default: '60px'
  }
});
</script>

<style scoped>
.empty-state {
  box-sizing: border-box;
}
</style>
