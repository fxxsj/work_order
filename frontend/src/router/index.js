import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/views/Layout.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'workorders',
        name: 'WorkOrderList',
        component: () => import('@/views/workorder/List.vue'),
        meta: { title: '施工单列表' }
      },
      {
        path: 'workorders/create',
        name: 'WorkOrderCreate',
        component: () => import('@/views/workorder/Form.vue'),
        meta: { title: '新建施工单' }
      },
      {
        path: 'workorders/:id',
        name: 'WorkOrderDetail',
        component: () => import('@/views/workorder/Detail.vue'),
        meta: { title: '施工单详情' }
      },
      {
        path: 'workorders/:id/edit',
        name: 'WorkOrderEdit',
        component: () => import('@/views/workorder/Form.vue'),
        meta: { title: '编辑施工单' }
      },
      {
        path: 'customers',
        name: 'CustomerList',
        component: () => import('@/views/customer/List.vue'),
        meta: { title: '客户管理' }
      },
      {
        path: 'processes',
        name: 'ProcessList',
        component: () => import('@/views/process/List.vue'),
        meta: { title: '工序管理' }
      },
      {
        path: 'materials',
        name: 'MaterialList',
        component: () => import('@/views/material/List.vue'),
        meta: { title: '物料管理' }
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router

