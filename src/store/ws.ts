import { LinkStatusEnum } from "@/api/model";
import { defineStore } from "pinia";
import { ref } from "vue";

const useWSStore = defineStore("ws", () => {
  const isShowLinkInfo = ref(false);
  // websocket连接信息
  const initLinkInfo = {
    status: LinkStatusEnum.loading,
    message: "服务器连接中...",
  };
  const linkInfo = ref<{
    // 是否展示
    status: LinkStatusEnum;
    message: string;
  }>({
    ...initLinkInfo,
  });

  function onInitLinInfo() {
    linkInfo.value = {
      ...initLinkInfo,
    };
  }

  function onChangeLinkInfo(status: LinkStatusEnum, message: string) {
    linkInfo.value.status = status;
    linkInfo.value.message = message;
  }

  return {
    isShowLinkInfo,
    linkInfo,
    onInitLinInfo,
    onChangeLinkInfo,
  };
});

export default useWSStore;
