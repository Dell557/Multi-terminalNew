<template>
  <div :class="['course-card', layout]" @click="onSelect">
    <div class="card-content">
      <div class="card-left">
        <van-image
          fit="cover"
          :src="course.poster_url || course.image"
          :default-image="defaultImage"
          class="course-img"
          radius="8px"
          lazy-load
          @error="handleImageError"
        />
        <div class="role-tag" :class="course.roleType">{{ course.roleName }}</div>

        <div class="like-btn" @click.stop="onToggleLike">
          <img
            v-if="likeIconType === 'img'"
            :src="course.isLiked ? likeIconActive : likeIconInactive"
            class="like-icon"
            alt="like"
          />
          <van-icon
            v-else
            :name="course.isLiked ? 'like' : 'like-o'"
            :color="course.isLiked ? '#FF4D4F' : '#FFFFFF'"
          />
        </div>

        <div class="rating-overlay">
          <van-rate
            :model-value="Math.floor(course.rating || 0)"
            :size="12"
            color="var(--color-warning)"
            void-icon="star"
            void-color="var(--color-neutral-200)"
            readonly
          />
        </div>
      </div>

      <div class="card-right">
        <div class="course-title">{{ course.title }}</div>

        <div class="tags-row">
          <span
            v-for="(tag, index) in course.tags"
            :key="index"
            :class="['course-tag', index < 2 ? 'primary' : 'secondary']"
          >{{ tag }}</span>
          <span v-if="course.tagsMore" class="course-tag secondary">+{{ course.tagsMore }}</span>
        </div>

        <div class="course-desc">{{ course.desc }}</div>
      </div>
    </div>

    <div class="card-divider-line"></div>

    <div class="card-footer">
      <div class="footer-info">
        <div class="footer-item">
          <img
            v-if="footerIconType === 'img'"
            :src="footerSchoolIcon"
            class="footer-icon"
            alt="school"
          />
          <van-icon v-else name="hotel-o" />
          <span>{{ course.school }}</span>
        </div>
        <span class="divider">|</span>
        <div class="footer-item">
          <img
            v-if="footerIconType === 'img'"
            :src="footerTeacherIcon"
            class="footer-icon"
            alt="teacher"
          />
          <van-icon v-else name="manager-o" />
          <span>{{ course.teacher }}</span>
        </div>
      </div>
      <div class="rating">
        <span>难度：</span>
        <van-rate
          :model-value="Math.floor(course.rating || 0)"
          :size="13"
          color="var(--color-warning)"
          void-icon="star"
          void-color="var(--color-neutral-200)"
          readonly
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const DEFAULT_IMAGE = '/H5_icon/meiyouneirong.png';

const props = defineProps({
  course: {
    type: Object,
    required: true
  },
  layout: {
    type: String,
    default: 'list'
  },
  likeIconType: {
    type: String,
    default: 'img'
  },
  likeIconActive: {
    type: String,
    default: '/H5_icon/yishoucang.png'
  },
  likeIconInactive: {
    type: String,
    default: '/H5_icon/weishoucang.png'
  },
  likeIconColor: {
    type: String,
    default: '#FF4D4F'
  },
  footerIconType: {
    type: String,
    default: 'vant'
  },
  footerSchoolIcon: {
    type: String,
    default: '/H5_icon/xuexiao.png'
  },
  footerTeacherIcon: {
    type: String,
    default: '/H5_icon/cankaodaoshi.png'
  }
});

const emit = defineEmits(['select', 'toggle-like']);

const defaultImage = DEFAULT_IMAGE;

const handleImageError = (event) => {
  console.warn('[CourseCard] Image load failed:', props.course.image, event);
  // van-image 会自动使用 default-image 作为备用
};

const onSelect = () => {
  emit('select', props.course);
};

const onToggleLike = () => {
  emit('toggle-like', props.course);
};
</script>

<style scoped>
.course-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-white, #ffffff);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.course-card.grid {
  width: 170px;
  height: 280px;
  background: var(--bg-white, #ffffff);
  border-radius: 8px;
  margin-bottom: 0;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: none;
  display: flex;
  flex-direction: column;
}

.course-card:active {
  transform: scale(0.99);
}

.card-content {
  display: flex;
}

.course-card.grid .card-content {
  flex-direction: column;
  margin-bottom: var(--space-sm, 8px);
  flex: 1;
  display: flex;
  overflow: hidden;
}

.card-left {
  position: relative;
  width: 29.333333vw;
  height: 27.866667vw;
  margin-right: 3.2vw;
  flex-shrink: 0;
  overflow: hidden;
}

.course-card.grid .card-left {
  width: 100%;
  height: auto;
  margin-right: 0;
  margin-top: 0;
  margin-bottom: 8px;
}

.course-img {
  width: 100%;
  height: 0;
  padding-bottom: 124%;
  display: block;
  overflow: hidden;
  position: relative;
}

.course-img :deep(.van-image__img) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  margin: -1px;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
}

.course-card.grid .course-img {
  width: 170px;
  height: 130px;
  padding-bottom: 0;
  border-radius: 8px 8px 0 0;
  position: relative;
}

.course-card.grid .course-img :deep(.van-image__img) {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
  margin: -1px;
  width: calc(100% + 2px);
  height: calc(100% + 2px);
}

.role-tag {
  position: absolute;
  top: 0;
  left: 0;
  padding: 2px 6px;
  font-size: 11px;
  color: #ffffff;
  background: linear-gradient(90deg, #FFB034 0%, #FF8900 100%);
  border-radius: 8px 0 8px 0;
  font-weight: 500;
  z-index: 2;
}

.role-tag.doc {
  background: linear-gradient(90deg, #6C92FF 0%, #3B6BFF 100%);
}

.like-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.course-card.grid .like-btn {
  top: 8px;
  right: 8px;
  bottom: auto;
  background: rgba(0,0,0,0.35);
}

.card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
}

.course-card.grid .card-right {
  display: flex;
  flex-direction: column;
  height: auto;
  justify-content: flex-start;
  padding: 0 8px;
  margin-top: 0;
  margin-bottom: 8px;
  box-sizing: border-box;
  border-bottom: none;
  gap: 6px;
}

.course-title {
  font-size: 15px;
  font-weight: bold;
  color: #333333;
  line-height: 1.4;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-card.grid .course-title {
  width: 100%;
  height: auto;
  font-family: PingFang SC, PingFang SC;
  font-weight: 500;
  font-size: 13px;
  color: var(--color-neutral-900, #333);
  text-align: left;
  font-style: normal;
  text-transform: none;
  line-height: 18px;
  margin-bottom: -1.4vw;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tags-row {
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  gap: 6px;
  margin-bottom: 6px;
}

.course-card.grid .tags-row {
  margin-bottom: 0;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-card.grid .course-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  vertical-align: middle;
}

.course-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  line-height: 1.2;
}

.course-tag.primary {
  background-color: #FFF5F0;
  color: #FF8900;
  border: none;
}

.course-tag.secondary {
  background-color: #F5F6F8;
  color: #999999;
  border: none;
}

.course-desc {
  font-size: 12px;
  color: #999999;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0;
}

.course-card.grid .course-desc {
  font-size: 11px;
  color: var(--color-neutral-500, #999);
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-divider-line {
  height: 1px;
  background-color: #F5F5F5;
  margin-top: 12px;
  margin-bottom: 12px;
}

.course-card.grid .card-divider-line {
  display: block;
  width: calc(100% - 16px);
  height: 1px;
  background-color: var(--color-neutral-200);
  margin: 0 auto;
  flex-shrink: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #999999;
}

.course-card.grid .card-footer {
  font-size: 10px;
  padding: 8px 8px 8px 8px;
  color: var(--color-neutral-500, #999);
}

.footer-info {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #999999;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.footer-item {
  display: flex;
  align-items: center;
  max-width: 45%;
  overflow: hidden;
}

.footer-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 4px;
}

.course-card.grid .footer-info {
  font-size: 10px;
  color: var(--color-neutral-500, #999);
}

.footer-info .van-icon {
  font-size: 12px;
  color: #999999;
}

.footer-icon {
  width: 12px;
  height: 12px;
  object-fit: contain;
  display: block;
}

.like-icon {
  width: 12px;
  height: 12px;
  display: block;
}

.divider {
  margin: 0 6px;
  color: #EEEEEE;
}

.rating {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #999999;
}

.course-card.grid .rating {
  display: none;
}

.rating-overlay {
  display: none;
}

.course-card.grid .rating-overlay {
  display: flex;
  position: absolute;
  left: 8px;
  bottom: 8px;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 8px;
  border-radius: 12px;
  align-items: center;
}

.course-card.compact {
  padding: 10px;
  margin-bottom: 10px;
}

.course-card.compact .card-content {
  margin-bottom: 6px;
}

.course-card.compact .card-left {
  width: 80px;
  height: 80px;
  margin-right: 10px;
}

.course-card.compact .course-title {
  font-size: 14px;
  margin-bottom: 4px;
}

.course-card.compact .course-desc {
  font-size: 11px;
  -webkit-line-clamp: 1;
}

.course-card.compact .tags-row {
  display: none;
}

.course-card.compact .card-footer {
  font-size: 10px;
}
</style>
