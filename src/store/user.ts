import { requestWrapper } from "@/api/request/index";
import service from "@/api/services";
import { IUser } from "@/api/services/user";
import { defineStore } from "pinia";

const useUserStore = defineStore(
  "user",
  () => {
    const user = ref<IUser | null>(null);
    function requestUserInfo() {
      requestWrapper(async () => {
        const { data: response } = await service.user.requestUserInfo();
        user.value = response.data;
      });
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
