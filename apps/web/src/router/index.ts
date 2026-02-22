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
import CustomerListView from '../views/CustomerListView.vue'
import ProductListView from '../views/ProductListView.vue'
import DepartmentListView from '../views/DepartmentListView.vue'
import ProcessListView from '../views/ProcessListView.vue'
import MaterialListView from '../views/MaterialListView.vue'
import SupplierListView from '../views/SupplierListView.vue'
import MaterialSupplierListView from '../views/MaterialSupplierListView.vue'
import PurchaseOrderListView from '../views/PurchaseOrderListView.vue'
import PurchaseReceiveCenterView from '../views/PurchaseReceiveCenterView.vue'
import ProductStockListView from '../views/ProductStockListView.vue'
import SalesOrderListView from '../views/SalesOrderListView.vue'
import InvoiceListView from '../views/InvoiceListView.vue'
import PaymentListView from '../views/PaymentListView.vue'
import ArtworkListView from '../views/ArtworkListView.vue'
import DieListView from '../views/DieListView.vue'
import FoilingPlateListView from '../views/FoilingPlateListView.vue'
import EmbossingPlateListView from '../views/EmbossingPlateListView.vue'
import ProductGroupListView from '../views/ProductGroupListView.vue'
import DeliveryOrderListView from '../views/DeliveryOrderListView.vue'
import QualityInspectionListView from '../views/QualityInspectionListView.vue'
import StockInListView from '../views/StockInListView.vue'
import StockOutListView from '../views/StockOutListView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/workorders', name: 'workorders', component: WorkOrderListView, meta: { requiresAuth: true } },
    { path: '/workorders/create', name: 'workorder-create', component: WorkOrderCreateView, meta: { requiresAuth: true } },
    { path: '/workorders/:id', name: 'workorder-detail', component: WorkOrderDetailView, meta: { requiresAuth: true } },
    { path: '/customers', name: 'customers', component: CustomerListView, meta: { requiresAuth: true } },
    { path: '/products', name: 'products', component: ProductListView, meta: { requiresAuth: true } },
    { path: '/departments', name: 'departments', component: DepartmentListView, meta: { requiresAuth: true } },
    { path: '/processes', name: 'processes', component: ProcessListView, meta: { requiresAuth: true } },
    { path: '/materials', name: 'materials', component: MaterialListView, meta: { requiresAuth: true } },
    { path: '/suppliers', name: 'suppliers', component: SupplierListView, meta: { requiresAuth: true } },
    { path: '/material-suppliers', name: 'material-suppliers', component: MaterialSupplierListView, meta: { requiresAuth: true } },
    { path: '/purchase-orders', name: 'purchase-orders', component: PurchaseOrderListView, meta: { requiresAuth: true } },
    { path: '/purchase-receive', name: 'purchase-receive', component: PurchaseReceiveCenterView, meta: { requiresAuth: true } },
    { path: '/product-stocks', name: 'product-stocks', component: ProductStockListView, meta: { requiresAuth: true } },
    { path: '/sales-orders', name: 'sales-orders', component: SalesOrderListView, meta: { requiresAuth: true } },
    { path: '/invoices', name: 'invoices', component: InvoiceListView, meta: { requiresAuth: true } },
    { path: '/payments', name: 'payments', component: PaymentListView, meta: { requiresAuth: true } },
    { path: '/artworks', name: 'artworks', component: ArtworkListView, meta: { requiresAuth: true } },
    { path: '/dies', name: 'dies', component: DieListView, meta: { requiresAuth: true } },
    { path: '/foiling-plates', name: 'foiling-plates', component: FoilingPlateListView, meta: { requiresAuth: true } },
    { path: '/embossing-plates', name: 'embossing-plates', component: EmbossingPlateListView, meta: { requiresAuth: true } },
    { path: '/product-groups', name: 'product-groups', component: ProductGroupListView, meta: { requiresAuth: true } },
    { path: '/delivery-orders', name: 'delivery-orders', component: DeliveryOrderListView, meta: { requiresAuth: true } },
    { path: '/quality-inspections', name: 'quality-inspections', component: QualityInspectionListView, meta: { requiresAuth: true } },
    { path: '/stock-ins', name: 'stock-ins', component: StockInListView, meta: { requiresAuth: true } },
    { path: '/stock-outs', name: 'stock-outs', component: StockOutListView, meta: { requiresAuth: true } },
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
