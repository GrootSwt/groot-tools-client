import { ElMessage } from "element-plus";
import { getCookie, removeCookie } from ".";
import router from "@/router";

export function toLoginPage(message = "登陆状态异常，请重新登陆") {
  removeCookie("userId");
  removeCookie("token");
  ElMessage.error({
    message,
  });
  if (router.currentRoute.value.fullPath === "/") {
    router.replace({ path: "/login" });
  } else {
    router.replace({
      path: "/login",
      query: {
        redirect: router.currentRoute.value.fullPath,
      },
    });
  }
}

// 滚动到当前元素的底部
export function scrollToBottom(el: HTMLElement) {
  el.scrollTop = el.scrollHeight - el.clientHeight;
}

// 是否登录
export function isLogin() {
  return !!getCookie("userId") && !!getCookie("token");
}
