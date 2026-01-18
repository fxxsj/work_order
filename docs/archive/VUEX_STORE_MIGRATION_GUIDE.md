# Vuex Store 模块化迁移指南

## 概述

Vuex Store 已从单一文件重构为模块化架构。本文档提供完整的迁移指南和使用说明。

## 架构变化

### 重构前 (70 行单文件)
```
store/
  └── index.js (所有状态混在一起)
```

### 重构后 (5 个模块 + 主文件)
```
store/
  ├── index.js (主文件 + 持久化配置)
  └── modules/
      ├── user.js (用户认证 + 权限)
      ├── ui.js (UI 状态)
      ├── workOrder.js (施工单 UI 状态)
      ├── task.js (任务 UI 状态)
      └── cache.js (数据缓存)
```

## 模块说明

### 1. User Module (用户模块)

**命名空间**: `user`

**职责**:
- 用户认证状态管理
- 权限和角色管理
- 与 permissionService 集成

**主要 State**:
```javascript
{
  currentUser: null,
  isAuthenticated: false,
  permissions: [],
  roles: []
}
```

**主要 Getters**:
```javascript
// 获取当前用户
store.getters['user/currentUser']

// 检查权限
store.getters['user/hasPermission']('workorder:view')

// 检查角色
store.getters['user/hasRole']('salesperson')

// 检查是否为管理员
store.getters['user/isAdmin']
```

**主要 Actions**:
```javascript
// 登录
await store.dispatch('user/login', { username, password })

// 登出
await store.dispatch('user/logout')

// 获取用户信息
await store.dispatch('user/fetchUserInfo')

// 刷新权限
await store.dispatch('user/refreshPermissions')
```

### 2. UI Module (UI 状态模块)

**命名空间**: `ui`

**职责**:
- 全局 UI 状态管理
- 消息提示
- 加载状态
- 面包屑导航

**主要 State**:
```javascript
{
  sidebarCollapsed: false,
  currentPage: '',
  breadcrumbs: [],
  loading: false,
  loadingText: '',
  globalMessage: null,
  messageType: 'info'
}
```

**主要 Actions**:
```javascript
// 显示加载
store.dispatch('ui/showLoading', '加载中...')

// 隐藏加载
store.dispatch('ui/hideLoading')

// 显示成功消息
store.dispatch('ui/showSuccess', '操作成功')

// 显示错误消息
store.dispatch('ui/showError', '操作失败')

// 显示信息消息
store.dispatch('ui/showInfo', '提示信息')

// 设置面包屑
store.dispatch('ui/setBreadcrumbs', [
  { title: '首页', path: '/' },
  { title: '施工单', path: '/workorder' }
])

// 切换侧边栏
store.dispatch('ui/toggleSidebar')
```

### 3. WorkOrder Module (施工单模块)

**命名空间**: `workOrder`

**职责**:
- 施工单选择状态
- 筛选条件管理
- 分页状态
- 批量选择

**主要 State**:
```javascript
{
  selectedWorkOrder: null,
  selectedWorkOrders: [],
  filters: {
    status: '',
    priority: '',
    department: null,
    keyword: ''
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
}
```

**主要 Getters**:
```javascript
// 获取选中的施工单
store.getters['workOrder/selectedWorkOrder']

// 是否有激活的筛选条件
store.getters['workOrder/hasActiveFilters']

// 激活的筛选条件数量
store.getters['workOrder/activeFiltersCount']
```

**主要 Actions**:
```javascript
// 选中的施工单
store.dispatch('workOrder/selectWorkOrder', workOrder)

// 批量选择
store.dispatch('workOrder/selectMultipleWorkOrders', [wo1, wo2])

// 更新筛选条件
store.dispatch('workOrder/updateFilters', { status: 'in_progress' })

// 重置筛选条件
store.dispatch('workOrder/resetFilters')

// 清除选择
store.dispatch('workOrder/clearSelection')

// 更新分页
store.dispatch('workOrder/updatePagination', { page: 2 })

// 跳转到指定页
store.dispatch('workOrder/goToPage', 3)
```

### 4. Task Module (任务模块)

**命名空间**: `task`

**职责**:
- 任务选择状态
- 视图模式切换
- 筛选条件管理
- 分页状态

**主要 State**:
```javascript
{
  selectedTask: null,
  selectedTasks: [],
  filters: {
    status: '',
    department: null,
    keyword: '',
    processId: null
  },
  viewMode: 'board', // 'board' 或 'list'
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0
  }
}
```

**主要 Getters**:
```javascript
// 是否为看板视图
store.getters['task/isBoardView']

// 是否为列表视图
store.getters['task/isListView']

// 是否有激活的筛选条件
store.getters['task/hasActiveFilters']
```

**主要 Actions**:
```javascript
// 选中任务
store.dispatch('task/selectTask', task)

// 切换选中状态
store.dispatch('task/toggleSelection', task)

// 更新筛选条件
store.dispatch('task/updateFilters', { status: 'pending' })

// 设置视图模式
store.dispatch('task/setViewMode', 'list')

// 切换视图模式
store.dispatch('task/toggleViewMode')
```

### 5. Cache Module (缓存模块)

**命名空间**: `cache`

**职责**:
- 基础数据缓存
- 临时数据存储
- 缓存过期管理

**主要 State**:
```javascript
{
  customerList: { data: [], timestamp, ttl },
  processList: { data: [], timestamp, ttl },
  materialList: { data: [], timestamp, ttl },
  userList: { data: [], timestamp, ttl },
  tempData: {}
}
```

**主要 Getters**:
```javascript
// 获取客户列表（自动检查过期）
store.getters['cache/customerList']

// 检查缓存是否有效
store.getters['cache/isCacheValid']('customerList')

// 获取临时数据
store.getters['cache/tempData']('key')
```

**主要 Actions**:
```javascript
// 设置缓存
store.dispatch('cache/setCustomerList', customers)

// 清除指定缓存
store.dispatch('cache/clearCache', 'customerList')

// 清除所有缓存
store.dispatch('cache/clearAllCaches')

// 设置临时数据
store.dispatch('cache/setTempData', { key: 'temp', value: data })

// 刷新缓存
await store.dispatch('cache/refreshCache', {
  cacheKey: 'customerList',
  loadFn: () => api.getCustomers()
})
```

## 迁移指南

### 1. 用户信息访问

**重构前**:
```javascript
// 在组件中
computed: {
  currentUser() {
    return this.$store.state.userInfo
  },
  isSalesperson() {
    return this.$store.getters.isSalesperson
  }
}
```

**重构后**:
```javascript
computed: {
  currentUser() {
    return this.$store.getters['user/currentUser']
  },
  isSalesperson() {
    return this.$store.getters['user/hasRole']('salesperson')
  }
}
```

### 2. 权限检查

**重构前**:
```javascript
// 使用 permissionService（推荐，继续使用）
import { permissionService } from '@/services'
if (permissionService.hasPermission('workorder:view')) {
  // ...
}
```

**重构后**:
```javascript
// 选项 1: 使用 permissionService（推荐）
import { permissionService } from '@/services'
if (permissionService.hasPermission('workorder:view')) {
  // ...
}

// 选项 2: 使用 store getter
if (this.$store.getters['user/hasPermission']('workorder:view')) {
  // ...
}
```

### 3. UI 状态管理

**重构前**:
```javascript
// 分散在各个组件中
this.loading = true
this.$message.success('操作成功')
```

**重构后**:
```javascript
// 统一使用 store
this.$store.dispatch('ui/showLoading', '加载中...')
this.$store.dispatch('ui/showSuccess', '操作成功')
```

### 4. 施工单选择

**重构前**:
```javascript
this.$store.dispatch('setSelectedWorkOrder', workOrder)
```

**重构后**:
```javascript
this.$store.dispatch('workOrder/selectWorkOrder', workOrder)
```

### 5. 数据缓存

**重构前**:
```javascript
this.$store.dispatch('setCustomerList', customers)
const customers = this.$store.state.customerList
```

**重构后**:
```javascript
// 设置缓存
this.$store.dispatch('cache/setCustomerList', customers)

// 获取缓存（自动检查过期）
const customers = this.$store.getters['cache/customerList']

// 如果缓存过期，返回 null，需要重新加载
if (!customers) {
  await this.loadCustomers()
}
```

## 最佳实践

### 1. 使用 mapGetters 和 mapActions

```vue
<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapGetters('user', ['currentUser', 'isAdmin']),
    ...mapGetters('workOrder', ['selectedWorkOrder', 'hasActiveFilters']),
    ...mapGetters('task', ['isBoardView', 'isListView'])
  },

  methods: {
    ...mapActions('ui', ['showLoading', 'showSuccess', 'showError']),
    ...mapActions('workOrder', ['selectWorkOrder', 'updateFilters']),
    ...mapActions('task', ['toggleViewMode', 'selectTask'])
  }
}
</script>
```

### 2. 缓存使用模式

```vue
<script>
export default {
  data() {
    return {
      customers: []
    }
  },

  async created() {
    await this.loadCustomers()
  },

  methods: {
    async loadCustomers() {
      // 先尝试从缓存获取
      let customers = this.$store.getters['cache/customerList']

      if (!customers) {
        // 缓存无效，从 API 加载
        const { data } = await this.$api.getCustomers()

        // 更新缓存
        this.$store.dispatch('cache/setCustomerList', data)

        customers = data
      }

      this.customers = customers
    }
  }
}
</script>
```

### 3. 全局错误处理

```vue
<script>
export default {
  methods: {
    async handleSubmit() {
      this.$store.dispatch('ui/showLoading', '提交中...')

      try {
        await this.$api.submitForm()
        this.$store.dispatch('ui/showSuccess', '提交成功')
      } catch (error) {
        this.$store.dispatch('ui/showError', '提交失败：' + error.message)
      } finally {
        this.$store.dispatch('ui/hideLoading')
      }
    }
  }
}
</script>
```

## 持久化配置

默认使用 `sessionStorage` 持久化以下数据：

- **用户模块**: `currentUser`, `isAuthenticated`, `permissions`, `roles`
- **UI 模块**: `sidebarCollapsed`
- **任务模块**: `viewMode`
- **缓存模块**: 所有缓存数据（带过期时间检查）

**注意**: 关闭浏览器后会清除所有持久化数据。

## 兼容性

为了平滑过渡，保留了旧 API 的兼容性层（仅在开发环境显示警告）。

**旧的访问方式仍然可用，但会收到警告**:
```javascript
// 仍然可用，但不推荐
this.$store.state.userInfo
this.$store.getters.isSalesperson
this.$store.dispatch('setUserInfo', data)
```

**推荐的新方式**:
```javascript
this.$store.getters['user/currentUser']
this.$store.getters['user/hasRole']('salesperson')
this.$store.dispatch('user/setUserInfo', data)
```

## 类型定义（TypeScript）

如果使用 TypeScript，可以导入类型：

```typescript
import type { Store } from 'vuex'
import { userState, workOrderState } from '@/store/modules/types'

declare module 'vuex' {
  interface Store {
    state: {
      user: userState
      workOrder: workOrderState
      // ...
    }
  }
}
```

## 测试

### 测试模块

```javascript
import store from '@/store'

describe('User Module', () => {
  it('should set user info', () => {
    store.dispatch('user/setUserInfo', { id: 1, name: 'Test' })
    expect(store.getters['user/currentUser']).toEqual({ id: 1, name: 'Test' })
  })

  it('should check permissions', () => {
    store.dispatch('user/setPermissions', ['workorder:view'])
    expect(store.getters['user/hasPermission']('workorder:view')).toBe(true)
  })
})
```

## 常见问题

### Q: 为什么要模块化？

A:
1. **更好的组织**: 相关状态聚合在一起
2. **避免命名冲突**: 每个模块有独立的命名空间
3. **更好的可维护性**: 模块可以独立开发和测试
4. **更好的性能**: 只订阅需要的状态变化

### Q: 是否需要立即迁移所有代码？

A: 不需要。兼容性层确保旧代码继续工作。建议：
1. 新代码使用新的模块化 API
2. 逐步迁移旧代码（按优先级）
3. 在重构代码时顺便迁移

### Q: 缓存什么时候过期？

A: 默认 TTL 配置：
- 客户列表: 10 分钟
- 工序列表: 30 分钟
- 物料列表: 10 分钟
- 用户列表: 5 分钟

### Q: 如何调试 Store？

A: 使用 Vue Devtools：
1. 打开浏览器 DevTools
2. 切换到 Vue 面板
3. 选择 Vuex 标签
4. 查看所有模块的状态和变化

## 参考文档

- [Vuex 官方文档 - 模块](https://vuex.vuejs.org/zh/guide/modules.html)
- [vuex-persistedstate 文档](https://github.com/robinvdvleuten/vuex-persistedstate)
- [项目 Service 层文档](./SERVICE_LAYER_QUICK_REFERENCE.md)

---

**最后更新**: 2026-01-15
**版本**: v2.0.0
**维护**: 开发团队
