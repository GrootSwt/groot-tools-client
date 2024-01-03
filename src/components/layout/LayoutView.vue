<script lang="ts" setup>
import { RouterView } from "vue-router";
import useWSStore from "@/store/ws";
import { storeToRefs } from "pinia";
import { LinkStatusEnum } from "@/api/model";
import useLoginStore from "@/store/login";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { clearLoginStatusAndUser } from "@/assets/tools";

const route = useRoute();
const router = useRouter();
const { isShowLinkInfo, linkInfo } = storeToRefs(useWSStore());
const { isLogin } = storeToRefs(useLoginStore());

function onLogin() {
  clearLoginStatusAndUser();
  router.push({ path: "/login" });
}

function onLogout() {
  clearLoginStatusAndUser();
  route.name !== "home" && router.replace({ path: "/" });
}
</script>
<template>
  <section class="h-full bg-slate-50">
    <header
      id="header"
      class="flex items-center justify-between bg-slate-200 h-12 px-3"
    >
      <!-- 回到首页 -->
      <article>
        <RouterLink to="/" v-if="$route.path !== '/'">
          <el-icon size="28"><i-ep-home-filled /></el-icon>
        </RouterLink>
      </article>
      <!-- websocket连接状态展示 -->
      <article>
        <h4
          v-if="isShowLinkInfo"
          class="px-2 py-1 text-gray-90 rounded-lg"
          :class="{
            'text-yellow-500': linkInfo.status === LinkStatusEnum.loading,
            'text-lime-500': linkInfo.status === LinkStatusEnum.success,
            'text-red-500': linkInfo.status === LinkStatusEnum.failure,
          }"
        >
          {{ linkInfo.message }}
        </h4>
      </article>
      <article>
        <el-button v-if="!isLogin" @click="onLogin">登录</el-button>
        <el-button v-else @click="onLogout">注销</el-button>
      </article>
    </header>
    <main id="main" class="main">
      <RouterView />
    </main>
  </section>
</template>
<style lang="scss" scoped>
.main {
  height: calc(100% - 48px);
  overflow-y: auto;
  overflow-y: overlay;
}
</style>
