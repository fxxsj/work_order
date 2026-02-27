import { createRouter, createWebHistory } from "vue-router";
import { authStore, hydrateAuth } from "./authStore";
import { hasPermission } from "./permissions";
import { getRoutePermissions } from "./routePermissions";
import DashboardPage from "./pages/DashboardPage.vue";
import LoginPage from "./pages/LoginPage.vue";
import ForbiddenPage from "./pages/ForbiddenPage.vue";
import PlaceholderPage from "./pages/PlaceholderPage.vue";
import WorkOrderListPage from "./pages/WorkOrderListPage.vue";
import NotificationsPage from "./pages/NotificationsPage.vue";
import ProfilePage from "./pages/ProfilePage.vue";

const createPlaceholder = (path: string, title: string) => ({
  path,
  name: title,
  component: PlaceholderPage,
  meta: { requiresAuth: true, title }
});

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { requiresAuth: false, title: "登录" }
    },
    {
      path: "/forbidden",
      name: "forbidden",
      component: ForbiddenPage,
      meta: { requiresAuth: false, title: "访问受限" }
    },
    {
      path: "/",
      redirect: "/dashboard"
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardPage,
      meta: { requiresAuth: true, title: "工作台", requiredPermissions: ["workorder.view_workorder"] }
    },
    {
      path: "/workorders",
      name: "workorders",
      component: WorkOrderListPage,
      meta: { requiresAuth: true, title: "施工单列表", requiredPermissions: ["workorder.view_workorder"] }
    },
    createPlaceholder("/workorders/create", "新建施工单"),
    createPlaceholder("/tasks", "任务管理"),
    createPlaceholder("/customers", "客户管理"),
    createPlaceholder("/departments", "部门管理"),
    createPlaceholder("/processes", "工序管理"),
    createPlaceholder("/products", "产品管理"),
    createPlaceholder("/materials", "物料管理"),
    createPlaceholder("/product-groups", "产品组管理"),
    createPlaceholder("/artworks", "图稿管理"),
    createPlaceholder("/dies", "刀模管理"),
    createPlaceholder("/foiling-plates", "烫金版管理"),
    createPlaceholder("/embossing-plates", "压凸版管理"),
    createPlaceholder("/suppliers", "供应商管理"),
    createPlaceholder("/purchase-orders", "采购单管理"),
    createPlaceholder("/sales-orders", "销售订单管理"),
    createPlaceholder("/inventory/stocks", "成品库存"),
    createPlaceholder("/inventory/delivery", "发货管理"),
    createPlaceholder("/inventory/quality", "质量检验"),
    createPlaceholder("/finance/invoices", "发票管理"),
    createPlaceholder("/finance/payments", "收款管理"),
    createPlaceholder("/finance/costs", "成本核算"),
    createPlaceholder("/finance/statements", "对账管理"),
    {
      path: "/notifications",
      name: "notifications",
      component: NotificationsPage,
      meta: { requiresAuth: true, title: "通知中心" }
    },
    {
      path: "/profile",
      name: "profile",
      component: ProfilePage,
      meta: { requiresAuth: true, title: "个人信息" }
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
