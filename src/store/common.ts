import { defineStore } from "pinia";
import { ref } from "vue";

export const useCommonStore = defineStore("common", () => {
  // abort request
  const abortRequest = ref(false);
  function enableAbortRequest() {
    abortRequest.value = true;
  }
  function disableAbortRequest() {
    abortRequest.value = false;
  }
  // global loading
  const globalLoading = ref(false);
  const loadingTimer = ref<number>();

  function enableGlobalLoading() {
    loadingTimer.value && clearTimeout(loadingTimer.value);
    globalLoading.value = true;
    document.body.classList.add("global-loading");
    // loading过程中阻止键盘中的Tab和Enter键点击事件
    window.addEventListener("keydown", preventClick);
  }
  function disableGlobalLoading() {
    loadingTimer.value = setTimeout(() => {
      globalLoading.value = false;
      document.body.classList.remove("global-loading");
      window.removeEventListener("keydown", preventClick);
    }, 10000);
  }
  function disableAll() {
    disableAbortRequest();
    disableGlobalLoading();
  }
  return {
    abortRequest,
    enableAbortRequest,
    disableAbortRequest,
    globalLoading,
    enableGlobalLoading,
    disableGlobalLoading,
    disableAll,
  };
});

function preventClick(e: KeyboardEvent) {
  const preventKeyList = ["Enter", "Tab"];
  if (preventKeyList.includes(e.code)) {
    e.preventDefault();
  }
}
