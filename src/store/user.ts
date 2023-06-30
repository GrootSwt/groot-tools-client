import { requestWrapper } from "@/api/request";
import service from "@/api/services";
import { IUser } from "@/api/services/user";
import { defineStore } from "pinia";
import { ref } from "vue";

const useUserStore = defineStore(
  "user",
  () => {
    const user = ref<IUser | null>(null);
    function requestUserInfo() {
      requestWrapper(async () => {
        const res = await service.user.requestUserInfo();
        user.value = res.data;
      }, false);
    }
    function clearUserInfo() {
      user.value = null;
    }
    return {
      user,
      requestUserInfo,
      clearUserInfo,
    };
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          storage: localStorage,
        },
      ],
    },
  }
);

export default useUserStore;
