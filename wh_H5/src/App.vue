<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="route.meta.transition || 'slide-fade'" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </transition>
  </router-view>
</template>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-page);
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Segoe UI, Arial, Roboto, 'PingFang SC', 'miui', 'Hiragino Sans GB', 'Microsoft Yahei', sans-serif;
}

/* ===== 路由过渡动画 ===== */

/* 1. 滑动 + 淡入淡出（默认） */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 2. 淡入淡出（用于筛选页等模态页面） */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 3. 缩放淡入（用于详情页） */
.zoom-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* 4. 底部滑入（用于筛选、搜索页） */
.slide-up-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* 5. 右滑进入（用于详情页，模拟原生 APP） */
.slide-right-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* 性能优化：使用 will-change */
.slide-fade-enter-active,
.slide-fade-leave-active,
.fade-enter-active,
.fade-leave-active,
.zoom-fade-enter-active,
.zoom-fade-leave-active,
.slide-up-enter-active,
.slide-up-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  will-change: transform, opacity;
}

/* 动画结束后移除 will-change，避免内存泄漏 */
.slide-fade-enter-to,
.slide-fade-leave-from,
.fade-enter-to,
.fade-leave-from,
.zoom-fade-enter-to,
.zoom-fade-leave-from,
.slide-up-enter-to,
.slide-up-leave-from,
.slide-right-enter-to,
.slide-right-leave-from {
  will-change: auto;
}
</style>
