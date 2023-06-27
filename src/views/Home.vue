<script lang="ts" setup>
import RouterLinkView from "@/components/RouterLinkView.vue";
</script>
<template>
  <section class="flex p-6 h-full">
    <article class="flex-1">
      <h3 class="bg-pink-400 w-max px-3 py-1 rounded-lg">无需登录</h3>
      <section class="flex flex-col gap-3 mt-4 text-white">
        <RouterLinkView to="/image-compress">图片压缩</RouterLinkView>
      </section>
    </article>
    <article class="flex-1">
      <h3 class="bg-pink-400 w-max px-3 py-1 rounded-lg">需要登录</h3>
      <section class="flex flex-col gap-3 mt-4 text-white">
        <RouterLinkView to="/memorandum">多端备忘录</RouterLinkView>
        <RouterLinkView to="/chat">聊天</RouterLinkView>
      </section>
    </article>
  </section>
</template>
<style lang="scss" scoped></style>
