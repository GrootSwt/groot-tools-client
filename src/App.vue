<script setup lang="ts">
import useLoginStore from "./store/login";
import { storeToRefs } from "pinia";
import { getLoginStatus } from "./assets/tools";
import useUserStore from "@/store/user";
import useCommonStore from "./store/common";

const { isLogin } = storeToRefs(useLoginStore());
isLogin.value = getLoginStatus();

const commonStore = useCommonStore();
commonStore.onWindowWidthListener();

if (isLogin.value) {
  const userStore = useUserStore();
  userStore.requestUserInfo();
}
</script>

<template>
  <router-view />
</template>
