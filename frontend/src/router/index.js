import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/views/Layout.vue'
import store from '@/store'
import { getCurrentUser } from '@/api/auth'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台', requiresAuth: true }
      },
      {
        path: 'workorders',
        name: 'WorkOrderList',
        component: () => import('@/views/workorder/List.vue'),
        meta: { title: '施工单列表', requiresAuth: true }
      },
      {
        path: 'workorders/create',
        name: 'WorkOrderCreate',
        component: () => import('@/views/workorder/Form.vue'),
        meta: { title: '新建施工单', requiresAuth: true }
      },
      {
        path: 'workorders/:id',
        name: 'WorkOrderDetail',
        component: () => import('@/views/workorder/Detail.vue'),
        meta: { title: '施工单详情', requiresAuth: true }
      },
      {
        path: 'workorders/:id/edit',
        name: 'WorkOrderEdit',
        component: () => import('@/views/workorder/Form.vue'),
        meta: { title: '编辑施工单', requiresAuth: true }
      },
      {
        path: 'customers',
        name: 'CustomerList',
        component: () => import('@/views/customer/List.vue'),
        meta: { title: '客户管理', requiresAuth: true }
      },
      {
        path: 'departments',
        name: 'DepartmentList',
        component: () => import('@/views/department/List.vue'),
        meta: { title: '部门管理', requiresAuth: true }
      },
      {
        path: 'processes',
        name: 'ProcessList',
        component: () => import('@/views/process/List.vue'),
        meta: { title: '工序管理', requiresAuth: true }
      },
      {
        path: 'products',
        name: 'ProductList',
        component: () => import('@/views/product/List.vue'),
        meta: { title: '产品管理', requiresAuth: true }
      },
      {
        path: 'materials',
        name: 'MaterialList',
        component: () => import('@/views/material/List.vue'),
        meta: { title: '物料管理', requiresAuth: true }
      },
      {
        path: 'artworks',
        name: 'ArtworkList',
        component: () => import('@/views/artwork/List.vue'),
        meta: { title: '图稿管理', requiresAuth: true }
      },
      {
        path: 'dies',
        name: 'DieList',
        component: () => import('@/views/die/List.vue'),
        meta: { title: '刀模管理', requiresAuth: true }
      },
      {
        path: 'foiling-plates',
        name: 'FoilingPlateList',
        component: () => import('@/views/foilingplate/List.vue'),
        meta: { title: '烫金版管理', requiresAuth: true }
      },
      {
        path: 'embossing-plates',
        name: 'EmbossingPlateList',
        component: () => import('@/views/embossingplate/List.vue'),
        meta: { title: '压凸版管理', requiresAuth: true }
      },
      {
        path: 'product-groups',
        name: 'ProductGroupList',
        component: () => import('@/views/productGroup/List.vue'),
        meta: { title: '产品组管理', requiresAuth: true }
      },
      {
        path: 'tasks',
        name: 'TaskList',
        component: () => import('@/views/task/List.vue'),
        meta: { title: '任务管理', requiresAuth: true }
      },
      {
        path: 'tasks/board',
        name: 'TaskBoard',
        component: () => import('@/views/task/Board.vue'),
        meta: { title: '部门任务看板', requiresAuth: true }
      },
      {
        path: 'tasks/stats',
        name: 'TaskStats',
        component: () => import('@/views/task/Stats.vue'),
        meta: { title: '协作统计', requiresAuth: true }
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
  
  // 如果页面需要认证
  if (requiresAuth) {
    // 检查是否已有用户信息
    if (!store.state.userInfo) {
      try {
        // 尝试获取当前用户信息
        const userInfo = await getCurrentUser()
        store.dispatch('setUserInfo', userInfo)
        next()
      } catch (error) {
        // 未登录，跳转到登录页
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
      }
    } else {
      next()
    }
  } else {
    // 不需要认证的页面，如果已登录且访问登录页，跳转到首页
    if (to.path === '/login' && store.state.userInfo) {
      next('/')
    } else {
      next()
    }
  }
})

export default router

