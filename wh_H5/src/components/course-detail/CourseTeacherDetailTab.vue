<template>
  <div class="section">
    <div class="section-head">
      <!-- Removed SectionHeader to match design -->
    </div>

    <div class="teacher-detail-card">
      <div class="teacher-header">
        <div class="t-avatar">
          <img :src="avatarSrc" alt="导师头像" />
        </div>
        <div class="t-info-main">
          <div class="t-name-row">
            <div class="t-name">{{ mainName }}</div>
            <div class="t-level" v-if="mainTutor.title">{{ mainTutor.title }}</div>
          </div>
          <div class="t-school">{{ course.school || '国内双一流院校' }}</div>
        </div>
      </div>

      <div class="teacher-achievements">
        <ul>
          <li v-for="(item, i) in achievements" :key="i">{{ item }}</li>
        </ul>
      </div>

      <div class="teacher-content-block">
        <div class="block-title">专业领域：</div>
        <div class="block-text">{{ specialtyText }}</div>
      </div>

      <div class="teacher-content-block">
        <div class="block-title">适合学生：</div>
        <div class="block-text">{{ suitableText }}</div>
      </div>

      <div class="teacher-content-block">
        <div class="block-title">适合专业：</div>
        <div class="block-text">{{ suitableMajorText }}</div>
      </div>

      <div class="teacher-note">* {{ matchNote }}</div>

      <div class="teacher-footer-meta">
        <span>更新时间：{{ updateDate }}</span>
        <span>课题编号：{{ topicCode }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SectionHeader from '../SectionHeader.vue';

const props = defineProps({
  course: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['show-poster']);

const mainTutor = computed(() => props.course?.mainTutor || {});
const avatarSrc = computed(() => '/H5_icon/person.png');
const mainName = computed(() => mainTutor.value?.name || props.course?.teacher || '导师姓名');

const achievements = computed(() => {
  const pts = mainTutor.value?.highlights || mainTutor.value?.points;
  if (Array.isArray(pts) && pts.length > 0 && pts[0] !== '资深导师') return pts;
  return [
    '发表学术论文 76 篇，其中 SCI/SSCI 收录 35 篇，多篇发表于 Q1 区顶级期刊',
    '曾担任国家重点研发计划项目骨干',
    '主持多项国家社会科学基金项目'
  ];
});

const specialtyText = computed(() => {
  return mainTutor.value?.specialty ||
    '面向AI、元宇宙、自动驾驶、数字孪生、人机协同等应用场景，从事数据压缩与分析、特别是面向人眼与机器的视觉媒体、高清视频、图像/三维视觉媒体、三维视频/三维点云等的高效压缩编码、智能分析处理、可靠传输控制、机器人视觉等研究';
});

const suitableText = computed(() => {
  return props.course?.projectInfo?.suitable || mainTutor.value?.suitable ||
    '有意向申请海外院校的高中生、大学生';
});

const suitableMajorText = computed(() => {
  return props.course?.projectInfo?.suitability || mainTutor.value?.suitableMajor ||
    '环境科学与工程、安全科学与工程、生态学、数据科学与大数据技术、人工智能、公关管理';
});

const matchNote = computed(() => {
  return props.course?.matchNote || '（具体导师以项目启动后导师的匹配结果为准）';
});

const updateDate = computed(() => {
  return props.course?.updateDate || props.course?.publishDate || '—';
});

const topicCode = computed(() => {
  return props.course?.topicCode || props.course?.id || '—';
});

</script>

<style scoped>
.section-head {
  border-bottom: none !important;
  margin-bottom: 0;
}
.teacher-detail-card {
  border-radius: 12px;
  padding: 12px 10px 10px;
}

.teacher-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.t-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px dashed #b9c8de;
  flex-shrink: 0;
  background: #dbe8fb;
}

.t-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.t-info-main {
  min-width: 0;
  flex: 1;
}

.t-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.t-name {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: #333;
}

.t-level {
  font-size: 12px;
  color: #b16d00;
  background: #ffe0a8;
  border-radius: 6px;
  padding: 2px 8px;
  line-height: 1.4;
}

.t-school {
  font-size: 16px;
  color: #626262;
  line-height: 1.35;
}

.teacher-achievements {
  background: #ededed;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.teacher-achievements ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.teacher-achievements li {
  position: relative;
  padding-left: 14px;
  font-size: 12px;
  line-height: 1.55;
  color: #4a4a4a;
  margin-bottom: 2px;
  word-break: break-word;
}

.teacher-achievements li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.67em;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #444;
}

.teacher-achievements li:last-child {
  margin-bottom: 0;
}

.teacher-content-block {
  margin-bottom: 8px;
}

.block-title {
  font-size: 14px;
  color: #a0a0a0;
  line-height: 1.35;
  margin-bottom: 2px;
}

.block-text {
  font-size: 16px;
  color: #575757;
  line-height: 1.58;
  word-break: break-word;
}

.teacher-note {
  font-size: 14px;
  color: #f05353;
  line-height: 1.4;
  margin: 8px 0 10px;
}

.teacher-footer-meta {
  border-top: 1px solid #e2e2e2;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #a9a9a9;
  font-size: 13px;
  line-height: 1.4;
}

.t-cta {
  margin-top: 16px;
}

.cta-btn {
  background: linear-gradient(90deg, var(--color-orange-700) 0%, var(--color-orange-600) 100%);
  color: var(--color-white);
}

@media (max-width: 375px) {
  .teacher-detail-card {
    padding: 10px 9px 9px;
  }

  .teacher-header {
    gap: 10px;
    margin-bottom: 10px;
  }

  .t-avatar {
    width: 54px;
    height: 54px;
  }

  .t-name {
    font-size: 16px;
  }

  .t-level {
    font-size: 11px;
    padding: 1px 7px;
  }

  .t-school {
    font-size: 13px;
  }

  .teacher-achievements {
    padding: 9px 10px;
    margin-bottom: 9px;
  }

  .teacher-achievements li {
    font-size: 13px;
    padding-left: 12px;
  }

  .block-title {
    font-size: 13px;
  }

  .block-text {
    font-size: 14px;
    line-height: 1.6;
  }

  .teacher-note {
    font-size: 12px;
  }

  .teacher-footer-meta {
    font-size: 12px;
  }
}
</style>
