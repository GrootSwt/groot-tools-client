<script lang="ts" setup></script>
<template>
  <section class="p-6 home-container">
    <RouterLink to="/image-compress" class="router-link">图片压缩</RouterLink>
    <RouterLink to="/memorandum" class="router-link">多端备忘录</RouterLink>
    <RouterLink to="/chat" class="router-link">聊天</RouterLink>
  </section>
</template>
<style lang="scss" scoped>
.home-container {
  .router-link {
    display: block;
    & + .router-link {
      margin-top: 24px;
    }
  }
}
</style>
