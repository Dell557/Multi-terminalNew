<template>
  <van-popup 
    v-model:show="show" 
    round 
    closeable 
    position="center" 
    class="poster-popup"
    :style="{ width: '311px', height: '463px', background: 'var(--bg-light)', borderRadius: '12px', padding: '0', overflow: 'visible' }"
  >
    <div class="poster-popup-content">
      <div class="poster-title">下载课题海报</div>
      <div class="poster-image-container">
        <img :src="posterUrl || '/Result/Mask%20group%20(2).png'" class="poster-img" alt="课题海报" />
      </div>
      <div class="poster-tip">
        <van-icon name="wechat" color="var(--color-green-500)" size="16" />
        <span>微信内可长按图片保存</span>
      </div>
      <van-button 
        round 
        color="linear-gradient(to right, var(--color-red-400), var(--color-red-600))" 
        class="download-btn-popup"
        @click="onDownload"
      >
        <template #icon>
          <van-icon name="down" size="18" />
        </template>
        下载课题海报
      </van-button>
    </div>
  </van-popup>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  posterUrl: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const onDownload = () => {
  if (!props.posterUrl) return;
  
  // 对于 H5 来说，通常是打开新页面或提示用户长按保存
  // 如果是真实下载链接，可以尝试 window.open
  window.open(props.posterUrl, '_blank');
};
</script>
