import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import WorkOrderListView from '../views/WorkOrderListView.vue'
import TaskListView from '../views/TaskListView.vue'
import NotificationView from '../views/NotificationView.vue'
import { useNotificationsStore } from '../stores/notifications'
import OperatorCenterView from '../views/OperatorCenterView.vue'
import WorkOrderDetailView from '../views/WorkOrderDetailView.vue'
import WorkOrderCreateView from '../views/WorkOrderCreateView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/workorders', name: 'workorders', component: WorkOrderListView, meta: { requiresAuth: true } },
    { path: '/workorders/create', name: 'workorder-create', component: WorkOrderCreateView, meta: { requiresAuth: true } },
    { path: '/workorders/:id', name: 'workorder-detail', component: WorkOrderDetailView, meta: { requiresAuth: true } },
    { path: '/tasks', name: 'tasks', component: TaskListView, meta: { requiresAuth: true } },
    { path: '/tasks/operator', name: 'operator-center', component: OperatorCenterView, meta: { requiresAuth: true } },
    { path: '/notifications', name: 'notifications', component: NotificationView, meta: { requiresAuth: true } }
  ]
})

router.beforeEach(async (to) => {
  const user = useUserStore()

  if (to.meta.requiresAuth === false) {
    return true
  }

  if (!user.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Authenticated: ensure WS is connected (best-effort)
  useNotificationsStore().connectIfNeeded()

  return true
})
