import { ElMessage } from "element-plus";
import { getCookie, removeCookie } from ".";
import router from "@/router";
import useUserStore from "@/store/user";
import useLoginStore from "@/store/login";
import { storeToRefs } from "pinia";
import { dayjs } from "element-plus";

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
export function getLoginStatus() {
  const { user } = storeToRefs(useUserStore());
  return !!getCookie("token") && !!user.value && !!user.value.id;
}
// 清除登录状态
export function clearLoginStatusAndUser() {
  const userStore = useUserStore();
  const loginStore = useLoginStore();
  userStore.clearUserInfo();
  loginStore.toggleIsLogin(false);
  removeCookie("token");
}

// 格式化时间

const defaultDateFormat = "YYYY-MM-DD";
const defaultTimeFormat = "HH:mm";

export function formatDateTime(
  date: Date,
  format = `${defaultDateFormat} ${defaultTimeFormat}`
) {
  if (
    dayjs().format(defaultDateFormat) === dayjs(date).format(defaultDateFormat)
  ) {
    return `今天 ${dayjs(date).format(defaultTimeFormat)}`;
  }
  if (dayjs().year === dayjs(date).year) {
    return dayjs(date).format(`MM-DD ${defaultTimeFormat}`);
  }
  return dayjs(date).format(format);
}
