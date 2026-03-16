<script setup>
import zhCn from '../node_modules/element-plus/dist/locale/zh-cn.js'
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="pc-adapter">
      <div class="design-root">

        <router-view />
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
.pc-adapter {
  width: 100%;
  overflow-x: hidden;
}
.design-root{
  width: 100%;
  max-width: 1980px;
  margin: 0 auto;
  padding: 0 16px;
}
</style>
