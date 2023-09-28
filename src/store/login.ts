import { defineStore } from "pinia";

const useLoginStore = defineStore("login", () => {
  // 是否登录
  const isLogin = ref(false);
  function toggleIsLogin(loginStatus: boolean) {
    isLogin.value = loginStatus;
  }
  return {
    isLogin,
    toggleIsLogin,
  };
});

export default useLoginStore;
