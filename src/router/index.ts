import { createRouter, createWebHistory } from "vue-router";
import { getCookie } from "../assets/tools";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("../views/Home.vue"),
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/Login.vue"),
    },
    {
      path: "/memorandum",
      name: "memorandum",
      component: () => import("../views/memorandum/index.vue"),
      meta: {
        auth: true,
      },
    },
    {
      path: "/chat",
      name: "chat",
      component: () => import("../views/chat/index.vue"),
      meta: {
        auth: true,
      },
    },
    {
      path: "/image-compress",
      name: "imageCompress",
      component: () => import("../views/image-compress/index.vue"),
      meta: {},
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
  const token = getCookie("token");
  if (to.meta?.auth && !token) {
    next({ path: "/login", query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
