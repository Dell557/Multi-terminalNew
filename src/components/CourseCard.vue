<script setup>
import { computed } from 'vue'
import { User, School } from '@element-plus/icons-vue'
import { getCoverUrl, truncate } from '@/utils/data-mapping'
import publicImg from '@/images/public.jpg'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  isGridView: {
    type: Boolean,
    default: true
  },
  isFavorited: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'toggle-favorite', 'mentor-click'])

const coverUrl = computed(() => {
  return getCoverUrl(props.item) || publicImg
})

const visibleTags = computed(() => {
  const tags = []
  if (props.item?.primary) tags.push({ text: props.item.primary, type: 'main' })
  if (props.item?.secondary) tags.push({ text: props.item.secondary, type: 'main' })
  return tags
})

function handleClick() {
  emit('click', props.item)
}

function handleFavorite(e) {
  e.stopPropagation()
  emit('toggle-favorite', props.item.id)
}

function handleMentorClick(e) {
  e.stopPropagation()
  emit('mentor-click', props.item.mentorType)
}
</script>

<template>
  <div class="course-card" :class="{ 'list-view': !isGridView }" @click="handleClick">
    <div class="card-cover">
      <el-image 
        :src="coverUrl" 
        fit="cover" 
        referrer-policy="no-referrer"
        lazy
      >
        <template #error>
          <img :src="publicImg" style="width:100%;height:100%;object-fit:cover;" />
        </template>
      </el-image>
      <div class="cover-title">{{ item.title }}</div>
      <div 
        class="mentor-badge" 
        :class="item.mentorType && item.mentorType.includes('教授') ? 'badge-prof' : 'badge-phd'"
        @click="handleMentorClick"
      >
        {{ item.mentorType }}
      </div>
      <button 
        class="favorite-btn" 
        :class="{ active: isFavorited }" 
        @click="handleFavorite"
      >
        <svg class="favorite-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            v-if="isFavorited"
            fill="currentColor"
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
          <path
            v-else
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
            d="M12 20.6l-1.35-1.23C5.35 14.88 2.2 12.01 2.2 8.5 2.2 6.1 4.1 4.2 6.5 4.2c1.72 0 3.37.8 4.5 2.07 1.13-1.27 2.78-2.07 4.5-2.07 2.4 0 4.3 1.9 4.3 4.3 0 3.51-3.15 6.38-8.45 10.88L12 20.6z"
          />
        </svg>
      </button>
    </div>
    <div class="hover-detail">
      <h3 class="hover-title" :title="item.title">{{ item.title }}</h3>
      <div class="hover-tags">
        <span class="hover-tag">{{ item.primary }}</span>
        <span class="hover-tag" v-if="item.secondary">{{ item.secondary }}</span>
      </div>
      <p class="hover-desc">{{ truncate(item.desc, 160) }}</p>
    </div>
    <div class="card-content">
      <h3 class="card-title" :title="item.title">{{ item.title }}</h3>
      <div class="card-tags">
        <span
          v-for="tag in visibleTags"
          :key="`${item.id}-tag-${tag.text}`"
          class="tag-item tag-item--main"
        >{{ tag.text }}</span>
      </div>
      <p class="card-desc">{{ truncate(item.desc, 120) }}</p>
      <div class="card-footer">
        <div class="footer-item">
          <el-icon><School /></el-icon>
          <span class="footer-text" :title="item.university">{{ item.university }}</span>
        </div>
        <div class="footer-item" v-if="item.teacher && item.teacher.trim()">
          <el-icon><User /></el-icon>
          <span class="footer-text" :title="item.teacher">{{ item.teacher }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.course-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid transparent;
  position: relative;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08);
  background: #e9edf2;
  border-color: #dcdfe6;
}

.hover-detail {
  position: absolute;
  left: 0;
  right: 0;
  top: 200px;
  bottom: 0;
  background: #e9edf2;
  padding: 16px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-top: 1px solid #dcdfe6;
  box-shadow: 0 -8px 16px rgba(0, 0, 0, 0.06);
  opacity: 0;
  transform: translateY(12px);
  transition: all 0.25s ease;
  pointer-events: none;
  will-change: opacity, transform;
}

.course-card:hover .hover-detail {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.card-cover {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-cover .el-image {
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
  will-change: transform;
}

.course-card:hover .card-cover .el-image {
  transform: scale(1.05);
}

.cover-title {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mentor-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.badge-prof {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8533 100%);
  color: #fff;
}

.badge-phd {
  background: linear-gradient(135deg, #1677ff 0%, #40a9ff 100%);
  color: #fff;
}

.favorite-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.favorite-btn:hover {
  background: #fff;
  transform: scale(1.1);
}

.favorite-btn.active {
  background: rgba(255, 107, 0, 0.9);
}

.favorite-icon {
  width: 18px;
  height: 18px;
  color: #999;
}

.favorite-btn.active .favorite-icon {
  color: #fff;
}

.card-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.tag-item {
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-item--main {
  background: #fff3ea;
  color: #ff6b00;
}

.card-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1;
}

.card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-item .el-icon {
  font-size: 14px;
  color: #999;
}

.footer-text {
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hover-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hover-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.hover-tag {
  padding: 2px 10px;
  background: #ff6b00;
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
}

.hover-desc {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

/* List View Styles */
.course-card.list-view {
  flex-direction: row;
  align-items: stretch;
  border: 1px solid #f0f0f0;
  height: 200px;
}

.course-card.list-view .card-cover {
  width: 168px;
  height: calc(100% - 32px);
  flex-shrink: 0;
  border-radius: 10px;
  margin: 16px;
}

.course-card.list-view .mentor-badge {
  left: auto;
  right: 12px;
  top: 12px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.course-card.list-view .badge-prof {
  background: #fff0e6;
  color: #ff6b00;
}

.course-card.list-view .badge-phd {
  background: #e6f4ff;
  color: #1677ff;
}

.course-card.list-view .cover-title {
  display: none;
}

.course-card.list-view .hover-detail {
  position: absolute;
  left: 200px;
  right: 0;
  top: 0;
  bottom: 0;
  background: #e9edf2;
  padding: 16px;
  border-left: 1px solid #dcdfe6;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.25s ease;
  pointer-events: none;
}

.course-card.list-view .card-content {
  padding: 16px 20px 16px 0;
}

.course-card.list-view .card-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  -webkit-line-clamp: 2;
  height: 48px;
  margin-bottom: 12px;
  white-space: normal;
}

.course-card.list-view .card-tags {
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
  margin-bottom: 8px;
}

.course-card.list-view .tag-item {
  height: 24px;
  line-height: 20px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 500;
  border: 1px solid transparent;
  white-space: nowrap;
}

.course-card.list-view .tag-item--main {
  background: #fff3ea;
  color: #ff6b00;
  border-color: rgba(255, 107, 0, 0.18);
}
</style>
