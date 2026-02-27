import { createRouter, createWebHistory } from "vue-router";
import { authStore, hydrateAuth } from "./authStore";
import { hasPermission } from "./permissions";
import LoginPage from "./pages/LoginPage.vue";
import DashboardPage from "./pages/DashboardPage.vue";
import ForbiddenPage from "./pages/ForbiddenPage.vue";
import WorkOrderListPage from "./pages/WorkOrderListPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: LoginPage, meta: { requiresAuth: false, title: "登录" } },
    { path: "/forbidden", name: "forbidden", component: ForbiddenPage, meta: { requiresAuth: false, title: "访问受限" } },
    { path: "/", redirect: "/dashboard" },
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardPage,
      meta: { requiresAuth: true, title: "桌面端工作台", requiredPermissions: ["workorder.view_workorder"] }
    },
    {
      path: "/workorders",
      name: "workorders",
      component: WorkOrderListPage,
      meta: { requiresAuth: true, title: "施工单列表", requiredPermissions: ["workorder.view_workorder"] }
    }
  ]
});

router.beforeEach(async (to) => {
  await hydrateAuth();

  if (to.meta.requiresAuth && !authStore.state.token) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  const required = (to.meta.requiredPermissions as string[] | undefined) ?? [];
  if (required.length > 0 && !hasPermission(authStore.state.user, required)) {
    return { name: "forbidden" };
  }

  return true;
});

export default router;
