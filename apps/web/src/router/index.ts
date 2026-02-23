import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

import { useNotificationsStore } from '../stores/notifications'
const LoginView = () => import('../views/LoginView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const WorkOrderListView = () => import('../views/WorkOrderListView.vue')
const TaskListView = () => import('../views/TaskListView.vue')
const NotificationView = () => import('../views/NotificationView.vue')
const OperatorCenterView = () => import('../views/OperatorCenterView.vue')
const WorkOrderDetailView = () => import('../views/WorkOrderDetailView.vue')
const WorkOrderCreateView = () => import('../views/WorkOrderCreateView.vue')
const CustomerListView = () => import('../views/CustomerListView.vue')
const ProductListView = () => import('../views/ProductListView.vue')
const DepartmentListView = () => import('../views/DepartmentListView.vue')
const ProcessListView = () => import('../views/ProcessListView.vue')
const MaterialListView = () => import('../views/MaterialListView.vue')
const SupplierListView = () => import('../views/SupplierListView.vue')
const MaterialSupplierListView = () => import('../views/MaterialSupplierListView.vue')
const PurchaseOrderListView = () => import('../views/PurchaseOrderListView.vue')
const PurchaseReceiveCenterView = () => import('../views/PurchaseReceiveCenterView.vue')
const ProductStockListView = () => import('../views/ProductStockListView.vue')
const SalesOrderListView = () => import('../views/SalesOrderListView.vue')
const InvoiceListView = () => import('../views/InvoiceListView.vue')
const PaymentListView = () => import('../views/PaymentListView.vue')
const ArtworkListView = () => import('../views/ArtworkListView.vue')
const DieListView = () => import('../views/DieListView.vue')
const FoilingPlateListView = () => import('../views/FoilingPlateListView.vue')
const EmbossingPlateListView = () => import('../views/EmbossingPlateListView.vue')
const ProductGroupListView = () => import('../views/ProductGroupListView.vue')
const DeliveryOrderListView = () => import('../views/DeliveryOrderListView.vue')
const QualityInspectionListView = () => import('../views/QualityInspectionListView.vue')
const StockInListView = () => import('../views/StockInListView.vue')
const StockOutListView = () => import('../views/StockOutListView.vue')
const ClientDownloadView = () => import('../views/ClientDownloadView.vue')
const TaskAssignmentHistoryView = () => import('../views/TaskAssignmentHistoryView.vue')
const CostCenterListView = () => import('../views/CostCenterListView.vue')
const CostItemListView = () => import('../views/CostItemListView.vue')
const ProductionCostListView = () => import('../views/ProductionCostListView.vue')
const StatementListView = () => import('../views/StatementListView.vue')
const ScanView = () => import('../views/ScanView.vue')
const MonitoringView = () => import('../views/MonitoringView.vue')
const ApprovalWorkflowListView = () => import('../views/ApprovalWorkflowListView.vue')
const ApprovalStepListView = () => import('../views/ApprovalStepListView.vue')

export const router = createRouter({
  history: (import.meta.env.VITE_ROUTER_MODE === 'hash' ? createWebHashHistory() : createWebHistory()),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } },
    { path: '/download', name: 'client-download', component: ClientDownloadView, meta: { requiresAuth: false } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/scan', name: 'scan', component: ScanView, meta: { requiresAuth: true } },
    { path: '/monitoring', name: 'monitoring', component: MonitoringView, meta: { requiresAuth: true } },
    { path: '/approval-workflows', name: 'approval-workflows', component: ApprovalWorkflowListView, meta: { requiresAuth: true } },
    { path: '/approval-steps', name: 'approval-steps', component: ApprovalStepListView, meta: { requiresAuth: true } },
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
    { path: '/tasks/assignment-history', name: 'task-assignment-history', component: TaskAssignmentHistoryView, meta: { requiresAuth: true } },
    { path: '/cost-centers', name: 'cost-centers', component: CostCenterListView, meta: { requiresAuth: true } },
    { path: '/cost-items', name: 'cost-items', component: CostItemListView, meta: { requiresAuth: true } },
    { path: '/production-costs', name: 'production-costs', component: ProductionCostListView, meta: { requiresAuth: true } },
    { path: '/statements', name: 'statements', component: StatementListView, meta: { requiresAuth: true } },
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
