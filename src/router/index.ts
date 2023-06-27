import { createRouter, createWebHistory } from "vue-router";
import { getCookie } from "../assets/tools";
import { ElMessage } from "element-plus";
import { useWSStore } from "@/store/ws";
import { storeToRefs } from "pinia";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("../components/layout/index.vue"),
      redirect: { name: "home" },
      children: [
        {
          path: "/",
          name: "home",
          component: () => import("../views/Home.vue"),
          meta: {
            title: "首页",
          },
        },

        {
          path: "/memorandum",
          name: "memorandum",
          component: () => import("../views/memorandum/index.vue"),
          meta: {
            auth: true,
            title: "备忘录",
            isShowWSLinkInfo: true,
          },
        },
        {
          path: "/chat",
          name: "chat",
          component: () => import("../views/chat/index.vue"),
          meta: {
            auth: true,
            title: "聊天",
            isShowWSLinkInfo: true,
          },
        },
        {
          path: "/image-compress",
          name: "imageCompress",
          component: () => import("../views/image-compress/index.vue"),
          meta: {
            title: "图片压缩",
          },
        },
      ],
    },

    {
      path: "/login",
      name: "login",
      component: () => import("../views/Login.vue"),
      meta: {
        title: "登录",
      },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: {
        name: "home",
      },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const wsStore = useWSStore();
  const { isShowLinkInfo } = storeToRefs(useWSStore());
  const token = getCookie("token");
  if (to.meta?.auth && !token) {
    ElMessage.warning({
      message: "该功能需要登录，请登录后使用",
    });
    // 设置title
    document.title = `GROOT-TOOLS: 登录`;
    isShowLinkInfo.value = false;
    next({ path: "/login", query: { redirect: to.fullPath } });
  } else {
    // 设置title
    document.title = `GROOT-TOOLS: ${to.meta.title || ""}`;
    isShowLinkInfo.value = !!to.meta.isShowWSLinkInfo;
    next();
  }
  wsStore.onInitLinInfo();
});

export default router;
