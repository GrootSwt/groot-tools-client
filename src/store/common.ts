import { ElLoading } from "element-plus";
import { LoadingInstance } from "element-plus/es/components/loading/src/loading";
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
  const loadingInstance = ref<LoadingInstance>();
  const loadingTimer = ref<number>();

  function enableGlobalLoading() {
    loadingTimer.value && clearTimeout(loadingTimer.value);
    globalLoading.value = true;
    loadingInstance.value = ElLoading.service({
      fullscreen: true,
      background: "rgba(0, 0, 0, 0.3)",
    });
    // loading过程中阻止键盘中的Tab和Enter键点击事件
    window.addEventListener("keydown", preventClick);
  }
  function disableGlobalLoading() {
    loadingTimer.value = setTimeout(() => {
      globalLoading.value = false;
      loadingInstance.value?.close();
      window.removeEventListener("keydown", preventClick);
    }, 100);
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
