import { createRouter, createWebHistory } from "vue-router";
import { authStore, hydrateAuth } from "./authStore";
import { hasPermission } from "./permissions";
import { getRoutePermissions } from "./routePermissions";
import DashboardPage from "./pages/DashboardPage.vue";
import LoginPage from "./pages/LoginPage.vue";
import ForbiddenPage from "./pages/ForbiddenPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { requiresAuth: false }
    },
    {
      path: "/forbidden",
      name: "forbidden",
      component: ForbiddenPage,
      meta: { requiresAuth: false }
    },
    {
      path: "/",
      name: "dashboard",
      component: DashboardPage,
      meta: { requiresAuth: true, requiredPermissions: ["workorder.view_workorder"] }
    }
  ]
});

router.beforeEach(async (to) => {
  await hydrateAuth();

  if (to.meta.requiresAuth && !authStore.state.token) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  const metaPermissions = (to.meta.requiredPermissions as string[] | undefined) ?? [];
  const inferredPermissions = getRoutePermissions(to.path);
  const required = metaPermissions.length > 0 ? metaPermissions : inferredPermissions;

  if (required.length > 0 && !hasPermission(authStore.state.user, required)) {
    return { name: "forbidden" };
  }

  return true;
});

export default router;
