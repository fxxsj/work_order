import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/views/Layout.vue'
import store from '@/store'
import { getCurrentUser } from '@/api/auth'

Vue.use(VueRouter)

// P2 优化: 使用 Webpack 魔法注释优化代码分割
// webpackChunkName: 为 chunk 命名，便于识别
// webpackPrefetch: 浏览器空闲时预加载资源
// webpackPreload: 与父 chunk 并行加载（优先级高于 prefetch）

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ '@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      // 核心页面 - 使用 preload
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import(/* webpackChunkName: "dashboard" */ /* webpackPreload: true */ '@/views/Dashboard.vue'),
        meta: { title: '工作台', requiresAuth: true }
      },

      // 施工单管理 - 按功能分组
      {
        path: 'workorders',
        name: 'WorkOrderList',
        component: () => import(/* webpackChunkName: "workorder-list" */ '@/views/workorder/WorkOrderList.vue'),
        meta: { title: '施工单列表', requiresAuth: true }
      },
      {
        path: 'workorders/create',
        name: 'WorkOrderCreate',
        component: () => import(/* webpackChunkName: "workorder-form" */ '@/views/workorder/WorkOrderForm.vue'),
        meta: { title: '新建施工单', requiresAuth: true }
      },
      {
        path: 'workorders/:id',
        name: 'WorkOrderDetail',
        component: () => import(/* webpackChunkName: "workorder-detail" */ /* webpackPrefetch: true */ '@/views/workorder/WorkOrderDetail.vue'),
        meta: { title: '施工单详情', requiresAuth: true }
      },
      {
        path: 'workorders/:id/edit',
        name: 'WorkOrderEdit',
        component: () => import(/* webpackChunkName: "workorder-form" */ '@/views/workorder/WorkOrderForm.vue'),
        props: true,
        meta: { title: '编辑施工单', requiresAuth: true }
      },

      // 基础数据管理 - 合并到单个 chunk
      {
        path: 'customers',
        name: 'CustomerList',
        component: () => import(/* webpackChunkName: "basic-data" */ '@/views/customer/CustomerList.vue'),
        meta: { title: '客户管理', requiresAuth: true }
      },
      {
        path: 'departments',
        name: 'DepartmentList',
        component: () => import(/* webpackChunkName: "basic-data" */ '@/views/department/DepartmentList.vue'),
        meta: { title: '部门管理', requiresAuth: true }
      },
      {
        path: 'processes',
        name: 'ProcessList',
        component: () => import(/* webpackChunkName: "basic-data" */ '@/views/process/ProcessList.vue'),
        meta: { title: '工序管理', requiresAuth: true }
      },
      {
        path: 'products',
        name: 'ProductList',
        component: () => import(/* webpackChunkName: "basic-data" */ '@/views/product/ProductList.vue'),
        meta: { title: '产品管理', requiresAuth: true }
      },
      {
        path: 'materials',
        name: 'MaterialList',
        component: () => import(/* webpackChunkName: "basic-data" */ '@/views/material/MaterialList.vue'),
        meta: { title: '物料管理', requiresAuth: true }
      },
      {
        path: 'product-groups',
        name: 'ProductGroupList',
        component: () => import(/* webpackChunkName: "basic-data" */ '@/views/product-group/ProductGroupList.vue'),
        meta: { title: '产品组管理', requiresAuth: true }
      },

      // 版和模具管理 - 合并到单个 chunk
      {
        path: 'artworks',
        name: 'ArtworkList',
        component: () => import(/* webpackChunkName: "plate-management" */ '@/views/artwork/ArtworkList.vue'),
        meta: { title: '图稿管理', requiresAuth: true }
      },
      {
        path: 'dies',
        name: 'DieList',
        component: () => import(/* webpackChunkName: "plate-management" */ '@/views/die/DieList.vue'),
        meta: { title: '刀模管理', requiresAuth: true }
      },
      {
        path: 'foiling-plates',
        name: 'FoilingPlateList',
        component: () => import(/* webpackChunkName: "plate-management" */ '@/views/foiling-plate/FoilingPlateList.vue'),
        meta: { title: '烫金版管理', requiresAuth: true }
      },
      {
        path: 'embossing-plates',
        name: 'EmbossingPlateList',
        component: () => import(/* webpackChunkName: "plate-management" */ '@/views/embossing-plate/EmbossingPlateList.vue'),
        meta: { title: '压凸版管理', requiresAuth: true }
      },

      // 供应商和采购 - 合并到单个 chunk
      {
        path: 'suppliers',
        name: 'SupplierList',
        component: () => import(/* webpackChunkName: "purchase" */ '@/views/supplier/SupplierList.vue'),
        meta: { title: '供应商管理', requiresAuth: true }
      },
      {
        path: 'purchase-orders',
        name: 'PurchaseOrderList',
        component: () => import(/* webpackChunkName: "purchase" */ '@/views/purchase/PurchaseList.vue'),
        meta: { title: '采购单管理', requiresAuth: true }
      },

      // 销售订单 - 单独 chunk
      {
        path: 'sales-orders',
        name: 'SalesOrderList',
        component: () => import(/* webpackChunkName: "sales-list" */ '@/views/sales/SalesList.vue'),
        meta: { title: '销售订单管理', requiresAuth: true }
      },
      {
        path: 'sales-orders/create',
        name: 'SalesOrderCreate',
        component: () => import(/* webpackChunkName: "sales-form" */ '@/views/sales/SalesForm.vue'),
        meta: { title: '新建销售订单', requiresAuth: true }
      },
      {
        path: 'sales-orders/:id',
        name: 'SalesOrderDetail',
        component: () => import(/* webpackChunkName: "sales-detail" */ /* webpackPrefetch: true */ '@/views/sales/SalesDetail.vue'),
        meta: { title: '销售订单详情', requiresAuth: true }
      },
      {
        path: 'sales-orders/:id/edit',
        name: 'SalesOrderEdit',
        component: () => import(/* webpackChunkName: "sales-form" */ '@/views/sales/SalesForm.vue'),
        meta: { title: '编辑销售订单', requiresAuth: true }
      },

      // 任务管理 - 单独 chunk，使用 prefetch
      {
        path: 'tasks',
        name: 'TaskList',
        component: () => import(/* webpackChunkName: "task-list" */ /* webpackPrefetch: true */ '@/views/task/TaskList.vue'),
        meta: { title: '任务管理', requiresAuth: true }
      },
      {
        path: 'tasks/board',
        name: 'TaskBoard',
        component: () => import(/* webpackChunkName: "task-board" */ '@/views/task/Board.vue'),
        meta: { title: '部门任务看板', requiresAuth: true }
      },
      {
        path: 'tasks/stats',
        name: 'TaskStats',
        component: () => import(/* webpackChunkName: "task-stats" */ '@/views/task/Stats.vue'),
        meta: { title: '协作统计', requiresAuth: true }
      },
      {
        path: 'tasks/assignment-history',
        name: 'AssignmentHistory',
        component: () => import(/* webpackChunkName: "task-config" */ '@/views/task/AssignmentHistory.vue'),
        meta: { title: '分派历史', requiresAuth: true }
      },
      {
        path: 'tasks/assignment-rules',
        name: 'AssignmentRule',
        component: () => import(/* webpackChunkName: "task-config" */ '@/views/task/AssignmentRule.vue'),
        meta: { title: '分派规则配置', requiresAuth: true }
      },

      // 通知中心 - 使用 prefetch
      {
        path: 'notifications',
        name: 'Notification',
        component: () => import(/* webpackChunkName: "notification" */ /* webpackPrefetch: true */ '@/views/Notification.vue'),
        meta: { title: '通知中心', requiresAuth: true }
      },

      // 财务管理 - 合并到单个 chunk
      {
        path: 'finance/invoices',
        name: 'InvoiceList',
        component: () => import(/* webpackChunkName: "finance" */ '@/views/finance/Invoice.vue'),
        meta: { title: '发票管理', requiresAuth: true }
      },
      {
        path: 'finance/payments',
        name: 'PaymentList',
        component: () => import(/* webpackChunkName: "finance" */ '@/views/finance/Payment.vue'),
        meta: { title: '收款管理', requiresAuth: true }
      },
      {
        path: 'finance/costs',
        name: 'CostList',
        component: () => import(/* webpackChunkName: "finance" */ '@/views/finance/Cost.vue'),
        meta: { title: '成本核算', requiresAuth: true }
      },
      {
        path: 'finance/statements',
        name: 'StatementList',
        component: () => import(/* webpackChunkName: "finance" */ '@/views/finance/Statement.vue'),
        meta: { title: '对账管理', requiresAuth: true }
      },

      // 库存管理 - 合并到单个 chunk
      {
        path: 'inventory/stocks',
        name: 'StockList',
        component: () => import(/* webpackChunkName: "inventory" */ '@/views/inventory/Stock.vue'),
        meta: { title: '成品库存', requiresAuth: true }
      },
      {
        path: 'inventory/delivery',
        name: 'DeliveryList',
        component: () => import(/* webpackChunkName: "inventory" */ '@/views/inventory/Delivery.vue'),
        meta: { title: '发货管理', requiresAuth: true }
      },
      {
        path: 'inventory/quality',
        name: 'QualityList',
        component: () => import(/* webpackChunkName: "inventory" */ '@/views/inventory/Quality.vue'),
        meta: { title: '质量检验', requiresAuth: true }
      },

      // 用户设置
      {
        path: 'profile',
        name: 'Profile',
        component: () => import(/* webpackChunkName: "profile" */ '@/views/Profile.vue'),
        meta: { title: '个人信息', requiresAuth: true }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 全局路由守卫
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 印刷施工单跟踪系统` : '印刷施工单跟踪系统'

  // 如果页面需要认证
  if (requiresAuth) {
    // 检查是否已有用户信息（使用新的模块化 API）
    if (!store.getters['user/currentUser']) {
      try {
        // 尝试获取当前用户信息
        const userInfo = await getCurrentUser()
        if (userInfo && userInfo.id) {
          store.dispatch('user/initUser', userInfo)
          next()
        } else {
          // 未登录，跳转到登录页，携带重定向信息
          next({
            path: '/login',
            query: { redirect: to.fullPath }
          })
        }
      } catch (error) {
        // 未登录，跳转到登录页，携带重定向信息
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      }
    } else {
      next()
    }
  } else {
    // 不需要认证的页面，如果已登录且访问登录页，跳转到首页（使用新的模块化 API）
    if (to.path === '/login' && store.getters['user/currentUser']) {
      // 如果有重定向参数，跳转到重定向页面
      const redirect = to.query.redirect || from.fullPath || '/'
      next(redirect)
    } else {
      next()
    }
  }
})

export default router

