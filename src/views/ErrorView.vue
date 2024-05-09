<script lang="ts" setup>
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import ButtonView from "@/components/ButtonView.vue";

const route = useRoute();
const router = useRouter();
const status = route.query.status;
function toHomeView() {
  router.replace({ path: "/" });
}
</script>
<template>
  <section class="mt-16 text-center">
    <h2 v-if="status === '404'">未找到相关资源</h2>
    <h2 v-else>出现未知错误，请联系管理人员</h2>
    <ButtonView @click="toHomeView" class="mt-6"> 首页 </ButtonView>
  </section>
</template>
