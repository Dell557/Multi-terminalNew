<template>
  <div class="section-header">
    <div class="section-header-left">
      <img
        v-if="iconSrc"
        :src="iconSrc"
        :alt="iconAlt"
        class="section-icon"
      />
      <van-icon
        v-else-if="iconName"
        :name="iconName"
        :color="iconColor"
        :size="iconSize"
        class="section-icon"
      />
      <span class="section-title">{{ title }}</span>
    </div>
    <slot name="right" />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  iconSrc: {
    type: String,
    default: ''
  },
  iconAlt: {
    type: String,
    default: ''
  },
  iconName: {
    type: String,
    default: ''
  },
  iconColor: {
    type: String,
    default: 'var(--color-neutral-900)'
  },
  iconSize: {
    type: [Number, String],
    default: 18
  }
});
</script>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header-left {
  display: flex;
  align-items: center;
}

.section-icon {
  font-size: 18px;
  margin-right: 6px;
  width: 18px;
  height: 18px;
  object-fit: contain;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-neutral-900);
}
</style>
