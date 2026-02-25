import { createRouter, createWebHistory, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'

import { useNotificationsStore } from '../stores/notifications'
import type { NavGroup } from '../components/SideNav.vue'
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
const AuthedLayout = () => import('../layouts/AuthedLayout.vue')

type AppRouteMeta = {
  requiresAuth?: boolean
  title?: string
  group?: string
  order?: number
  nav?: boolean
  keepAlive?: boolean
  hideTabBar?: boolean
}

const authedChildren: RouteRecordRaw[] = [
  { path: '', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true, title: '工作台', group: '工作台', order: 1, nav: true, keepAlive: true } satisfies AppRouteMeta },
  { path: 'workorders', name: 'workorders', component: WorkOrderListView, meta: { requiresAuth: true, title: '施工单', group: '生产', order: 1, nav: true, keepAlive: true } satisfies AppRouteMeta },
  { path: 'workorders/create', name: 'workorder-create', component: WorkOrderCreateView, meta: { requiresAuth: true, title: '新建施工单', group: '生产', order: 2, nav: false } satisfies AppRouteMeta },
  { path: 'workorders/:id', name: 'workorder-detail', component: WorkOrderDetailView, meta: { requiresAuth: true, title: '施工单详情', group: '生产', order: 3, nav: false } satisfies AppRouteMeta },
  { path: 'tasks', name: 'tasks', component: TaskListView, meta: { requiresAuth: true, title: '任务', group: '生产', order: 2, nav: true, keepAlive: true } satisfies AppRouteMeta },
  { path: 'scan', name: 'scan', component: ScanView, meta: { requiresAuth: true, title: '扫码', group: '生产', order: 3, nav: true, hideTabBar: true } satisfies AppRouteMeta },
  { path: 'notifications', name: 'notifications', component: NotificationView, meta: { requiresAuth: true, title: '通知', group: '生产', order: 4, nav: true, keepAlive: true } satisfies AppRouteMeta },
  { path: 'customers', name: 'customers', component: CustomerListView, meta: { requiresAuth: true, title: '客户', group: '基础数据', order: 1, nav: true, keepAlive: true } satisfies AppRouteMeta },
  { path: 'products', name: 'products', component: ProductListView, meta: { requiresAuth: true, title: '产品', group: '基础数据', order: 2, nav: true, keepAlive: true } satisfies AppRouteMeta },
  { path: 'materials', name: 'materials', component: MaterialListView, meta: { requiresAuth: true, title: '物料', group: '基础数据', order: 3, nav: true, keepAlive: true } satisfies AppRouteMeta },

  // Other routes (keep accessible via dashboard until nav is expanded)
  { path: 'monitoring', name: 'monitoring', component: MonitoringView, meta: { requiresAuth: true, title: '监控', group: '生产', order: 99, nav: false } satisfies AppRouteMeta },
  { path: 'approval-workflows', name: 'approval-workflows', component: ApprovalWorkflowListView, meta: { requiresAuth: true, title: '审批工作流', group: '审批', order: 1, nav: false } satisfies AppRouteMeta },
  { path: 'approval-steps', name: 'approval-steps', component: ApprovalStepListView, meta: { requiresAuth: true, title: '审批待办', group: '审批', order: 2, nav: false } satisfies AppRouteMeta },
  { path: 'departments', name: 'departments', component: DepartmentListView, meta: { requiresAuth: true, title: '部门', group: '基础数据', order: 4, nav: false } satisfies AppRouteMeta },
  { path: 'processes', name: 'processes', component: ProcessListView, meta: { requiresAuth: true, title: '工序', group: '基础数据', order: 5, nav: false } satisfies AppRouteMeta },
  { path: 'suppliers', name: 'suppliers', component: SupplierListView, meta: { requiresAuth: true, title: '供应商', group: '基础数据', order: 6, nav: false } satisfies AppRouteMeta },
  { path: 'material-suppliers', name: 'material-suppliers', component: MaterialSupplierListView, meta: { requiresAuth: true, title: '物料-供应商', group: '基础数据', order: 7, nav: false } satisfies AppRouteMeta },
  { path: 'purchase-orders', name: 'purchase-orders', component: PurchaseOrderListView, meta: { requiresAuth: true, title: '采购单', group: '采购', order: 1, nav: false } satisfies AppRouteMeta },
  { path: 'purchase-receive', name: 'purchase-receive', component: PurchaseReceiveCenterView, meta: { requiresAuth: true, title: '收货质检/入库', group: '采购', order: 2, nav: false } satisfies AppRouteMeta },
  { path: 'product-stocks', name: 'product-stocks', component: ProductStockListView, meta: { requiresAuth: true, title: '成品库存', group: '库存', order: 1, nav: false } satisfies AppRouteMeta },
  { path: 'sales-orders', name: 'sales-orders', component: SalesOrderListView, meta: { requiresAuth: true, title: '销售订单', group: '销售', order: 1, nav: false } satisfies AppRouteMeta },
  { path: 'invoices', name: 'invoices', component: InvoiceListView, meta: { requiresAuth: true, title: '发票', group: '财务', order: 1, nav: false } satisfies AppRouteMeta },
  { path: 'payments', name: 'payments', component: PaymentListView, meta: { requiresAuth: true, title: '收款', group: '财务', order: 2, nav: false } satisfies AppRouteMeta },
  { path: 'cost-centers', name: 'cost-centers', component: CostCenterListView, meta: { requiresAuth: true, title: '成本中心', group: '财务', order: 3, nav: false } satisfies AppRouteMeta },
  { path: 'cost-items', name: 'cost-items', component: CostItemListView, meta: { requiresAuth: true, title: '成本项目', group: '财务', order: 4, nav: false } satisfies AppRouteMeta },
  { path: 'production-costs', name: 'production-costs', component: ProductionCostListView, meta: { requiresAuth: true, title: '生产成本', group: '财务', order: 5, nav: false } satisfies AppRouteMeta },
  { path: 'statements', name: 'statements', component: StatementListView, meta: { requiresAuth: true, title: '对账单', group: '财务', order: 6, nav: false } satisfies AppRouteMeta },
  { path: 'artworks', name: 'artworks', component: ArtworkListView, meta: { requiresAuth: true, title: '图稿', group: '资产', order: 1, nav: false } satisfies AppRouteMeta },
  { path: 'dies', name: 'dies', component: DieListView, meta: { requiresAuth: true, title: '刀模', group: '资产', order: 2, nav: false } satisfies AppRouteMeta },
  { path: 'foiling-plates', name: 'foiling-plates', component: FoilingPlateListView, meta: { requiresAuth: true, title: '烫金版', group: '资产', order: 3, nav: false } satisfies AppRouteMeta },
  { path: 'embossing-plates', name: 'embossing-plates', component: EmbossingPlateListView, meta: { requiresAuth: true, title: '压凸版', group: '资产', order: 4, nav: false } satisfies AppRouteMeta },
  { path: 'product-groups', name: 'product-groups', component: ProductGroupListView, meta: { requiresAuth: true, title: '产品组', group: '基础数据', order: 8, nav: false } satisfies AppRouteMeta },
  { path: 'delivery-orders', name: 'delivery-orders', component: DeliveryOrderListView, meta: { requiresAuth: true, title: '发货单', group: '销售', order: 2, nav: false } satisfies AppRouteMeta },
  { path: 'quality-inspections', name: 'quality-inspections', component: QualityInspectionListView, meta: { requiresAuth: true, title: '质量检验', group: '质量', order: 1, nav: false } satisfies AppRouteMeta },
  { path: 'stock-ins', name: 'stock-ins', component: StockInListView, meta: { requiresAuth: true, title: '入库单', group: '库存', order: 2, nav: false } satisfies AppRouteMeta },
  { path: 'stock-outs', name: 'stock-outs', component: StockOutListView, meta: { requiresAuth: true, title: '出库单', group: '库存', order: 3, nav: false } satisfies AppRouteMeta },
  { path: 'tasks/operator', name: 'operator-center', component: OperatorCenterView, meta: { requiresAuth: true, title: '操作员中心', group: '生产', order: 10, nav: false } satisfies AppRouteMeta },
  { path: 'tasks/assignment-history', name: 'task-assignment-history', component: TaskAssignmentHistoryView, meta: { requiresAuth: true, title: '任务分派历史', group: '生产', order: 11, nav: false } satisfies AppRouteMeta }
]

function buildNavGroups(children: RouteRecordRaw[]): NavGroup[] {
  const groups = new Map<string, NavGroup>()
  const groupOrderMap: Record<string, number> = {
    工作台: 0,
    生产: 10,
    基础数据: 20,
    采购: 30,
    销售: 40,
    库存: 50,
    财务: 60,
    审批: 70,
    质量: 80,
    资产: 90
  }

  for (const r of children) {
    const meta = (r.meta || {}) as AppRouteMeta
    if (!meta.nav) continue
    if (!meta.title) continue
    const path = `/${String(r.path || '')}`.replace(/\/+$/, '').replace(/\/{2,}/g, '/')
    const groupKey = meta.group || '其他'
    const groupOrder = groupOrderMap[groupKey] ?? 100
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { key: groupKey, title: groupKey, order: groupOrder, items: [] })
    }
    groups.get(groupKey)!.items.push({
      path: path === '' ? '/' : path,
      title: meta.title,
      order: meta.order ?? 999
    })
  }

  const list = Array.from(groups.values())
  for (const g of list) {
    g.items.sort((a, b) => a.order - b.order)
  }
  list.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
  return list
}

export const authedNavGroups = buildNavGroups(authedChildren)

export const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginView, meta: { requiresAuth: false } satisfies AppRouteMeta },
  { path: '/download', name: 'client-download', component: ClientDownloadView, meta: { requiresAuth: false } satisfies AppRouteMeta },
  { path: '/', component: AuthedLayout, children: authedChildren, meta: { requiresAuth: true, nav: false } satisfies AppRouteMeta }
]

export const router = createRouter({
  history: import.meta.env.VITE_ROUTER_MODE === 'hash' ? createWebHashHistory() : createWebHistory(),
  routes
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
