import { ElMessage } from "element-plus";
import { removeCookie } from ".";
import router from "@/router";

export function toLoginPage() {
  removeCookie("userId");
  removeCookie("token");
  ElMessage.error({
    message: "登陆状态异常，请重新登陆",
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

export function scrollToBottom(el: HTMLElement) {
  el.scrollTop = el.scrollHeight - el.clientHeight;
}
