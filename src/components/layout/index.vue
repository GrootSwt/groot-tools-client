<script lang="ts" setup>
import goHomeIcon from "@/assets/images/go-home.svg";
import { RouterView } from "vue-router";
import { useWSStore } from "@/store/ws";
import { storeToRefs } from "pinia";
import { LinkStatusEnum } from "@/api/model";

const { isShowLinkInfo, linkInfo } = storeToRefs(useWSStore());
</script>
<template>
  <header class="flex items-center justify-between bg-slate-200 h-12">
    <!-- 回到首页 -->
    <article>
      <RouterLink to="/" v-if="$route.path !== '/'">
        <img :src="goHomeIcon" alt="" class="w-10 h-10" />
      </RouterLink>
    </article>
    <!-- websocket连接状态展示 -->
    <article>
      <h4
        v-if="isShowLinkInfo"
        class="px-2 py-1 text-gray-90 rounded-lg"
        :class="{
          'bg-yellow-500': linkInfo.status === LinkStatusEnum.loading,
          'bg-lime-500': linkInfo.status === LinkStatusEnum.success,
          'bg-red-500': linkInfo.status === LinkStatusEnum.failure,
        }"
      >
        {{ linkInfo.message }}
      </h4>
    </article>
    <!-- TODO 登录 -->
    <article></article>
  </header>
  <main class="main">
    <RouterView />
  </main>
</template>
<style lang="scss" scoped>
.main {
  height: calc(100% - 48px);
}
</style>
