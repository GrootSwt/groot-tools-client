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
      component: () => import("../views/memorandum/index.vue")
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: {
        name: "home",
      },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const token = getCookie("token")
  if (!token && to.path !== "/login") {
    next({ path: "/login" })
  } else {
    next()
  }
});

export default router;
