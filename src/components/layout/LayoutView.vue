<script lang="ts" setup>
import { RouterView } from "vue-router";
import useWSStore from "@/store/ws";
import { storeToRefs } from "pinia";
import { LinkStatusEnum } from "@/api/model";
import useLoginStore from "@/store/login";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { clearLoginStatusAndUser } from "@/assets/tools";
import ButtonView from "../ButtonView.vue";

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
  <section class="h-full bg-slate-50 flex flex-col">
    <header
      id="header"
      class="flex-none flex items-center justify-between bg-slate-200 h-12 px-3"
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
        <ButtonView v-if="!isLogin" class="border-black" @click="onLogin">
          登录
        </ButtonView>
        <ButtonView
          v-else
          class="border-red-400 text-red-700"
          @click="onLogout"
        >
          注销
        </ButtonView>
      </article>
    </header>
    <main id="main" class="flex-1 overflow-auto">
      <RouterView />
    </main>
  </section>
</template>
