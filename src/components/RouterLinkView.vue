<template>
  <RouterLink :to="to" class="block w-max px-3 py-2 rounded-lg bg-slate-600">
    <slot></slot>
  </RouterLink>
</template>
<script lang="ts" setup>
import { RouteLocationRaw } from "vue-router";

defineProps<{
  to: RouteLocationRaw;
}>();
</script>
<style lang="" scoped></style>
