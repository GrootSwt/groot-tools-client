<script lang="ts" setup>
import { randomColor } from "@/assets/tools";
import RouterLinkView from "@/components/RouterLinkView.vue";
</script>
<template>
  <section class="flex flex-col gap-8 py-8 px-4 h-full">
    <article class="border border-green-400 rounded p-3 relative">
      <h3
        class="bg-slate-50 w-max px-0.5 py-0.5 rounded-lg absolute -top-5 text-green-400"
      >
        无需登录
      </h3>
      <section class="flex flex-row flex-wrap gap-3 mt-4 text-white">
        <RouterLinkView
          to="/image-compress"
          :style="{ backgroundColor: randomColor() }"
        >
          图片压缩
        </RouterLinkView>
        <RouterLinkView
          to="/electronic-signature"
          :style="{ backgroundColor: randomColor() }"
        >
          电子签名
        </RouterLinkView>
        <RouterLinkView
          to="/js-to-json"
          :style="{ backgroundColor: randomColor() }"
        >
          JS2JSON
        </RouterLinkView>
      </section>
    </article>
    <article class="border border-red-400 rounded p-3 relative">
      <h3
        class="bg-slate-50 w-max px-0.5 py-0.5 rounded-lg absolute -top-5 text-red-400"
      >
        需要登录
      </h3>
      <section class="flex flex-row flex-wrap gap-3 mt-4 text-white">
        <RouterLinkView
          to="/memorandum"
          :style="{ backgroundColor: randomColor() }"
        >
          多端备忘录
        </RouterLinkView>
        <RouterLinkView to="/chat" :style="{ backgroundColor: randomColor() }">
          聊天
        </RouterLinkView>
      </section>
    </article>
  </section>
</template>
