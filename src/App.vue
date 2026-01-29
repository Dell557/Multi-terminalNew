<script setup>
</script>

<template>
  <div class="pc-adapter">
    <div class="design-root">

      <router-view />
    </div>
  </div>
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
