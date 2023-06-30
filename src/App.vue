<script setup lang="ts">
import useLoginStore from "./store/login";
import { storeToRefs } from "pinia";
import { getLoginStatus } from "./assets/tools";
import useUserStore from "@/store/user";

const { isLogin } = storeToRefs(useLoginStore());
isLogin.value = getLoginStatus();

if (isLogin.value) {
  const userStore = useUserStore();
  userStore.requestUserInfo();
}
</script>

<template>
  <router-view />
</template>

<style scoped></style>
