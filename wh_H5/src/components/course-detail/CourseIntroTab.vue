<template>
  <div>
    <!-- 课题描述 -->
    <div class="section">
      <div class="section-head">
        <SectionHeader
          title="课题描述"
          icon-src="/H5_icon/ketimiaoshu.png"
          icon-alt="课题描述"
        >
          <template #right>
            <div class="rating">
              <span class="difficulty">难度：</span>
              <van-rate
                :model-value="rating"
                :size="12"
                color="var(--color-warning)"
                void-icon="star"
                void-color="var(--color-neutral-200)"
                readonly
              />
            </div>
          </template>
        </SectionHeader>
      </div>
      <div class="desc">{{ course.desc || '暂无课题描述' }}</div>

      <!-- 文件下载占位 -->
      <div class="files">
        <div class="file-card" v-for="i in 2" :key="i" @click="handleFileDownload">
          <div class="file-left">
            <div class="file-icon-placeholder"></div>
            <span class="preview-tag">预览下载</span>
          </div>
          <div class="file-right">
            <div class="name">项目教学大纲</div>
            <div class="size">13.37MB</div>
          </div>
          <van-icon name="arrow" color="#C8C9CC" size="14" />
        </div>
      </div>
    </div>

    <!-- 导师介绍 -->
    <div class="section">
      <div class="section-head">
        <SectionHeader
          title="导师介绍"
          icon-src="/H5_icon/daoshijieshao.png"
          icon-alt="导师介绍"
        />
      </div>
      
      <!-- 主导师介绍 -->
      <div class="tutor-card main-tutor">
        <div class="card-header blue-header">
          <span class="header-text">主导师介绍</span>
        </div>
        <div class="card-content">
          <div class="duty-text">
            项目职责：{{ mainTutor.intro || '指导学生通过学术课题学习科研流程和研究方法' }}
          </div>
          <div class="points-list">
            <div 
              v-for="(point, index) in (mainTutor.points || defaultMainPoints)" 
              :key="index" 
              class="point-item"
            >
              <van-icon name="checked" color="#5C82F5" size="14" class="check-icon" />
              <span class="point-text">{{ point }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 副导师介绍 -->
      <div class="tutor-card sub-tutor">
        <div class="card-header blue-header">
          <span class="header-text">副导师介绍</span>
        </div>
        <div class="card-content">
          <div class="duty-text">
            项目职责：{{ subTutor.intro || '指导学生完成科研成果报告和相关学术写作' }}
          </div>
          <div class="points-list">
            <div 
              v-for="(point, index) in (subTutor.points || defaultSubPoints)" 
              :key="index" 
              class="point-item"
            >
              <van-icon name="checked" color="#5C82F5" size="14" class="check-icon" />
              <span class="point-text">{{ point }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目信息 -->
    <div class="section">
      <div class="project-info-container">
        <div class="section-head">
          <SectionHeader
            title="项目信息"
            icon-src="/H5_icon/xiangmuxinxi.png"
            icon-alt="项目信息"
          />
        </div>
        <div class="project-info-cards">
          <div class="info-card">
            <div class="info-icon-box blue-box">
              <span class="question-mark">?</span>
            </div>
            <div class="info-content">
              <div class="info-label">项目形式</div>
              <div class="info-value">{{ projectInfo.format || '远程1V1，全年滚动招生' }}</div>
            </div>
          </div>
          <div class="info-card">
            <div class="info-icon-box blue-box">
              <span class="question-mark">?</span>
            </div>
            <div class="info-content">
              <div class="info-label">项目方案</div>
              <div class="info-value single-line">{{ projectInfo.plan || '远程科研+国际会议论文辅导（3-6个月）' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目流程 -->
    <div class="section">
      <div class="section-head">
        <SectionHeader
          title="项目流程"
          icon-src="/H5_icon/xiangmuliucheng.png"
          icon-alt="项目流程"
        />
      </div>
      
      <div class="process-grid">
        <div 
          v-for="(step, index) in processList" 
          :key="index" 
          class="process-grid-item"
        >
          <div class="process-header">
            <span class="process-title">{{ step.title }}</span>
            <div class="process-num-bg">
              <span class="process-num">{{ index + 1 }}</span>
            </div>
          </div>
          <div class="process-desc">{{ step.desc }}</div>
        </div>
      </div>
    </div>

    <!-- 项目收获 -->
    <div class="section">
      <div class="section-head">
        <SectionHeader
          title="项目收获"
          icon-src="/H5_icon/xiangmushouhuo.png"
          icon-alt="项目收获"
        />
      </div>
      
      <div class="gain-grid">
        <div class="gain-row gain-row-3">
          <div class="gain-card gain-card-top" v-for="(item, idx) in gainTopItems" :key="`top-${idx}`">
            <img :src="item.img" class="gain-card-img" />
          </div>
        </div>
        <div class="gain-row gain-row-2">
          <div class="gain-card gain-card-bottom" v-for="(item, idx) in gainBottomItems" :key="`bottom-${idx}`">
            <img :src="item.img" class="gain-card-img" />
          </div>
        </div>
      </div>
    </div>

    <!-- 项目成果 -->
    <div class="section">
      <div class="section-head">
        <SectionHeader
          title="项目成果"
          icon-src="/H5_icon/xiangmuchengguo.png"
          icon-alt="项目成果"
        />
      </div>
      
      <div class="result-container">
        <div class="result-row-2">
          <div class="result-item">
             <img src="/Result/Mask group.png" class="result-img" />
          </div>
          <div class="result-item">
             <img src="/Result/Mask group (1).png" class="result-img" />
          </div>
        </div>
        <div class="result-row-1">
          <div class="result-item large">
             <img src="/Result/Mask group (2).png" class="result-img" />
          </div>
        </div>
      </div>
    </div>

    
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { showToast } from 'vant';
import SectionHeader from '../SectionHeader.vue';

const props = defineProps({
  course: {
    type: Object,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['show-poster']);

const handleFileDownload = () => {
  showToast('文件下载功能开发中');
};

const mainTutor = computed(() => props.course?.mainTutor || {});
const subTutor = computed(() => props.course?.subTutor || {});
const projectInfo = computed(() => props.course?.projectInfo || {});

const defaultMainPoints = [
  '清北、中科院等985、211高校教授、副教授',
  '国家、省部级重点课题组成员',
  '多项专利发明、多种学术著作、期刊论文发表',
  '专属助教，1v1专项科研报告&论文辅导'
];

const defaultSubPoints = [
  '清北等985、211、双一流院校博士',
  '学术能力扎实，SCI等核心期刊经验丰富',
  '科研能力突出，多项国家课题&专利发明',
  '授课经验丰富，了解并能解决学生的常见问题'
];

const defaultProcess = [
  { step: 1, title: '基础知识升级', desc: '学生通过学术先导课，学习科研和论文的基础知识及学术软件的使用' },
  { step: 2, title: '学术科研报告', desc: '双一流院校的教授指导学生，体验科研的完整闭环，学习科研过程和方法' },
  { step: 3, title: '学术写作辅导', desc: '双一流院校博士指导学生论文架构、写作方法，学生独立完成论文写作' },
  { step: 4, title: '学术论文投稿', desc: '学生完成论文定稿后，由学术服务团队进行论文投稿，直至录用' }
];

const processList = computed(() => {
  const list = props.course?.projectProcess;
  return (list && list.length > 0) ? list : defaultProcess;
});

const gainTopItems = [
  { img: '/picture/image 21 (1).png', text: '科研经历' },
  { img: '/picture/image 20.png', text: '学术科研报告' },
  { img: '/picture/image 21.png', text: '教授评价表' }
];

const gainBottomItems = [
  { img: '/picture/image 18.png', text: '教授推荐信' },
  { img: '/picture/Mask group.png', text: '国际会议论文' }
];
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}

.section-head {
  margin-bottom: 12px;
}

.desc {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  text-align: justify;
}

/* 导师介绍卡片样式 */
.tutor-card {
  background: #FFFFFF;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 12px;
  border: 1px solid #F5F6F8;
}

.card-header {
  padding: 8px 12px;
  background: linear-gradient(90deg, #6B8EF5 0%, #8BA6F8 100%);
  border-radius: 8px 0 16px 0;
  display: inline-block;
  margin-bottom: 8px;
}

.header-text {
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 500;
}

.card-content {
  padding: 0 12px 16px;
}

.duty-text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12px;
  font-weight: 500;
}

.points-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.point-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.check-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.point-text {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* 项目信息样式 */
.project-info-container {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.project-info-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card {
  width: 100%;
  min-height: 78px;
  background: rgba(228, 233, 245, 0.34);
  border-radius: 12px;
  padding: 0 12px 0 0;
  display: flex;
  align-items: center;
  gap: 14px;
  overflow: hidden;
}

.info-icon-box {
  width: 64px;
  min-height: 78px;
  border-radius: 12px 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  align-self: stretch;
}

.blue-box {
  background: #6E95F7;
}

.info-icon-box::after {
  content: '';
  position: absolute;
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 8px 0 8px 8px;
  border-color: transparent transparent transparent #6E95F7;
}

.question-mark {
  color: #FFFFFF;
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  font-family: Arial, sans-serif;
}

.info-content {
  flex: 1;
  min-width: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.info-label {
  font-size: 16px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
  line-height: 1.3;
}

.info-value {
  font-size: 3.3vw;
  color: #333;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}

.info-value.single-line {
  font-size: 3.3vw;
}

.single-line {
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
}

@media (max-width: 375px) {
  .info-card {
    min-height: 68px;
    gap: 12px;
  }

  .info-icon-box {
    width: 56px;
    min-height: 68px;
  }

  .question-mark {
    font-size: 34px;
  }

  .info-label {
    font-size: 14px;
  }

  .info-value {
    font-size: 14px;
    line-height: 1.4;
  }
}

/* 项目流程网格样式 */
.process-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.process-grid-item {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 12px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.process-title {
  font-size: 14px;
  font-weight: 600;
  color: #4A7AF7; /* 蓝色标题 */
  line-height: 1.4;
}

.process-num-bg {
  /* 使用透明的数字背景效果，或者按照截图样式 */
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 32px;
  font-weight: bold;
  color: rgba(74, 122, 247, 0.1); /* 浅蓝色大数字 */
  line-height: 1;
  pointer-events: none;
}

.process-num {
  font-family: Arial, sans-serif;
  font-style: italic;
}

.process-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  text-align: justify;
}

/* 项目收获样式 */
.gain-grid {
  margin-top: 8px;
}

.gain-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.gain-row-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.gain-card {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: #FFFFFF;
  border: 1px solid #F2F3F5;
}

.gain-card-top {
  width: 100%;
  aspect-ratio: 53 / 41;
}

.gain-card-bottom {
  /* aspect-ratio: 2.05; */
}


.gain-card-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

/* 顶部三列：图片铺满卡片高度 */
.gain-row-3 .gain-card-top .gain-card-img {
  object-fit: cover;
}

/* 项目成果样式 */
.result-row-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.result-row-1 {
  margin-top: 8px;
}

.result-item {
  border: 1px dashed #ccc;
  padding: 4px;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.result-item.large {
  position: relative;
}

.result-img {
  width: 100%;
  height: auto;
  display: block;
}

/* 学科标签样式 */
 

/* 评分样式 */
.rating {
  display: flex;
  align-items: center;
}

.difficulty {
  font-size: 11px;
  color: #999999;
  margin-right: 4px;
}
</style>
