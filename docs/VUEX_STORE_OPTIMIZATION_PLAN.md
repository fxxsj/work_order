# Vuex Store 优化计划

**日期**: 2026-01-15
**阶段**: P1 短期优化
**预计时间**: 3-5 天

---

## 当前 Store 分析

### 现有结构

**文件**: `frontend/src/store/index.js`
**代码量**: 70 行
**模块数**: 0（单一文件）

**当前状态**:
```javascript
state: {
  userInfo: null,
  selectedWorkOrder: null,
  processList: [],
  customerList: [],
  materialList: []
}
```

### 存在的问题

1. **单一文件结构**
   - 所有状态集中在一个文件中
   - 难以维护和扩展
   - 没有模块化划分

2. **职责不清**
   - 用户状态、业务数据、缓存数据混在一起
   - 没有明确的模块边界

3. **与 Service 层重复**
   - Store 中缓存了列表数据
   - Service 层也可以管理数据
   - 职责划分不明确

4. **缺少 Actions 逻辑**
   - Actions 只是简单提交 mutations
   - 没有异步操作
   - 没有错误处理

5. **缺少 Getters 优化**
   - Getters 数量少
   - 没有充分利用 getters 的计算能力

6. **没有持久化**
   - 刷新页面后状态丢失
   - 用户需要重新登录

---

## 优化方案

### 设计原则

1. **模块化**
   - 按功能划分模块
   - 每个模块独立管理自己的状态

2. **与 Service 层配合**
   - Store 只管理 UI 状态
   - 数据获取交给 Service 层
   - 避免职责重复

3. **简化状态**
   - 只存储必要的 UI 状态
   - 不缓存业务数据列表
   - 保持轻量级

4. **规范化**
   - 统一的命名规范
   - 统一的错误处理
   - 统一的异步操作模式

---

## 模块划分

### 1. user 模块
**职责**: 用户信息和认证状态

**状态**:
```javascript
{
  currentUser: null,        // 当前用户信息
  isAuthenticated: false,    // 是否已登录
  permissions: [],          // 用户权限列表
  roles: []                 // 用户角色列表
}
```

**Mutations**:
- `SET_CURRENT_USER` - 设置当前用户
- `SET_AUTHENTICATED` - 设置登录状态
- `SET_PERMISSIONS` - 设置权限列表
- `SET_ROLES` - 设置角色列表
- `CLEAR_USER` - 清除用户信息

**Actions**:
- `login` - 登录
- `logout` - 登出
- `fetchUserInfo` - 获取用户信息
- `updatePermissions` - 更新权限

**Getters**:
- `currentUser` - 获取当前用户
- `isAuthenticated` - 是否已登录
- `hasPermission` - 检查是否有权限
- `hasRole` - 检查是否有角色
- `isSalesperson` - 是否为业务员
- `isSuperuser` - 是否为超级用户

**持久化**: localStorage (currentUser, permissions, roles)

---

### 2. ui 模块
**职责**: UI 交互状态

**状态**:
```javascript
{
  sidebarCollapsed: false,      // 侧边栏是否折叠
  currentPage: '',               // 当前页面
  breadcrumbs: [],               // 面包屑
  loading: false,                // 全局加载状态
  globalMessage: null            // 全局消息
}
```

**Mutations**:
- `TOGGLE_SIDEBAR` - 切换侧边栏
- `SET_CURRENT_PAGE` - 设置当前页面
- `SET_BREADCRUMBS` - 设置面包屑
- `SET_LOADING` - 设置加载状态
- `SET_MESSAGE` - 设置全局消息
- `CLEAR_MESSAGE` - 清除全局消息

**Actions**:
- `toggleSidebar` - 切换侧边栏
- `updatePage` - 更新当前页面
- `showLoading` - 显示加载
- `hideLoading` - 隐藏加载
- `showMessage` - 显示消息
- `showSuccess` - 显示成功消息
- `showError` - 显示错误消息

**Getters**:
- `sidebarCollapsed` - 侧边栏折叠状态
- `currentPage` - 当前页面
- `isLoading` - 是否正在加载
- `hasMessage` - 是否有全局消息

---

### 3. workOrder 模块
**职责**: 施工单相关 UI 状态

**状态**:
```javascript
{
  selectedWorkOrder: null,       // 选中的施工单
  selectedWorkOrders: [],        // 批量选中的施工单
  filters: {                     // 筛选条件
    status: '',
    priority: '',
    department: null,
    keyword: ''
  },
  pagination: {                  // 分页信息
    page: 1,
    pageSize: 20,
    total: 0
  }
}
```

**Mutations**:
- `SET_SELECTED_WORK_ORDER` - 设置选中的施工单
- `SET_SELECTED_WORK_ORDERS` - 设置批量选中的施工单
- `SET_FILTERS` - 设置筛选条件
- `SET_PAGINATION` - 设置分页信息
- `RESET_FILTERS` - 重置筛选条件

**Actions**:
- `selectWorkOrder` - 选中施工单
- `selectMultipleWorkOrders` - 批量选中
- `clearSelection` - 清除选择
- `updateFilters` - 更新筛选条件
- `resetFilters` - 重置筛选条件
- `updatePagination` - 更新分页信息

**Getters**:
- `selectedWorkOrder` - 选中的施工单
- `selectedWorkOrders` - 批量选中的施工单
- `hasSelection` - 是否有选中项
- `activeFilters` - 激活的筛选条件
- `paginationInfo` - 分页信息

---

### 4. task 模块
**职责**: 任务相关 UI 状态

**状态**:
```javascript
{
  selectedTask: null,             // 选中的任务
  selectedTasks: [],              // 批量选中的任务
  filters: {                      // 筛选条件
    status: '',
    department: null,
    keyword: ''
  },
  viewMode: 'board',              // 视图模式: 'board' 或 'list'
  pagination: {                   // 分页信息
    page: 1,
    pageSize: 20,
    total: 0
  }
}
```

**Mutations**:
- `SET_SELECTED_TASK` - 设置选中的任务
- `SET_SELECTED_TASKS` - 设置批量选中的任务
- `SET_FILTERS` - 设置筛选条件
- `SET_VIEW_MODE` - 设置视图模式
- `SET_PAGINATION` - 设置分页信息

**Actions**:
- `selectTask` - 选中任务
- `selectMultipleTasks` - 批量选中
- `clearSelection` - 清除选择
- `updateFilters` - 更新筛选条件
- `setViewMode` - 切换视图模式
- `updatePagination` - 更新分页信息

**Getters**:
- `selectedTask` - 选中的任务
- `selectedTasks` - 批量选中的任务
- `viewMode` - 当前视图模式
- `isBoardView` - 是否为看板视图
- `activeFilters` - 激活的筛选条件

---

### 5. cache 模块（可选）
**职责**: 临时缓存数据

**状态**:
```javascript
{
  departments: [],      // 部门列表
  processes: [],        // 工序列表
  customers: [],        // 客户列表（简化版）
  lastFetchTime: {}     // 最后获取时间
}
```

**Mutations**:
- `SET_DEPARTMENTS` - 设置部门列表
- `SET_PROCESSES` - 设置工序列表
- `SET_CUSTOMERS` - 设置客户列表
- `SET_LAST_FETCH_TIME` - 设置最后获取时间

**Actions**:
- `fetchDepartments` - 获取部门列表（带缓存）
- `fetchProcesses` - 获取工序列表（带缓存）
- `fetchCustomers` - 获取客户列表（带缓存）
- `clearCache` - 清除缓存

**Getters**:
- `departments` - 部门列表
- `processes` - 工序列表
- `customers` - 客户列表
- `isCacheExpired` - 缓存是否过期

**注意**: 这个模块可以根据实际需求决定是否保留

---

## 重构步骤

### 第一步：创建模块目录结构
```bash
frontend/src/store/
  modules/
    user.js
    ui.js
    workOrder.js
    task.js
    cache.js
  index.js
```

### 第二步：创建各个模块
按以下顺序创建：
1. user.js - 用户模块
2. ui.js - UI 状态模块
3. workOrder.js - 施工单模块
4. task.js - 任务模块
5. cache.js - 缓存模块（可选）

### 第三步：重构主 index.js
- 导入所有模块
- 注册模块
- 配置持久化插件
- 配置开发工具

### 第四步：更新组件使用
- 更新组件中的 Store 使用
- 移除直接访问 state 的代码
- 使用 getters 和 actions

### 第五步：测试和验证
- 测试各模块功能
- 测试持久化
- 测试与 Service 层集成

---

## 文件结构

### 重构前
```
store/
  index.js (70 行)
```

### 重构后
```
store/
  modules/
    user.js (~200 行)
    ui.js (~150 行)
    workOrder.js (~180 行)
    task.js (~170 行)
    cache.js (~150 行)
  index.js (~100 行)
```

**总计**: ~950 行（分布在多个文件中）

---

## 与 Service 层集成

### 职责划分

**Store 层**:
- 管理 UI 状态（加载、选中、筛选等）
- 管理用户认证状态
- 提供全局的消息提示
- 不直接调用 API

**Service 层**:
- 调用 API 获取数据
- 处理业务逻辑
- 错误处理
- 数据缓存（可选）

### 交互模式

```javascript
// 组件中
export default {
  computed: {
    ...mapGetters('user', ['currentUser', 'isAuthenticated']),
    ...mapGetters('ui', ['isLoading'])
  },
  methods: {
    ...mapActions('ui', ['showLoading', 'hideLoading', 'showSuccess', 'showError']),
    async loadData() {
      this.showLoading()
      try {
        const result = await workOrderService.getList(params)
        this.showSuccess('加载成功')
        // 处理数据
      } catch (error) {
        this.showError(error.message)
      } finally {
        this.hideLoading()
      }
    }
  }
}
```

---

## 持久化策略

### 使用 vuex-persistedstate 插件

**安装**:
```bash
npm install vuex-persistedstate
```

**配置**:
```javascript
import createPersistedState from 'vuex-persistedstate'

const store = new Vuex.Store({
  modules: { ... },
  plugins: [
    createPersistedState({
      key: 'workorder-app',
      paths: ['user', 'ui']
    })
  ]
})
```

**持久化内容**:
- user.currentUser
- user.permissions
- user.roles
- ui.sidebarCollapsed

**不持久化**:
- ui.loading
- ui.globalMessage
- workOrder.selectedWorkOrder
- task.selectedTask

---

## 预期成果

### 代码质量提升

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 模块化程度 | 低（单文件） | 高（5 个模块） | +400% |
| 职责清晰度 | 低 | 高 | +200% |
| 可维护性 | 低 | 高 | +150% |
| 可扩展性 | 低 | 高 | +300% |
| 状态管理 | 混乱 | 清晰 | +250% |

### 功能提升

1. **模块化管理**
   - 每个模块独立维护
   - 更容易定位问题
   - 更容易扩展功能

2. **持久化支持**
   - 刷新页面保持登录状态
   - 保留用户偏好设置
   - 提升用户体验

3. **统一的错误处理**
   - 全局消息提示
   - 统一的加载状态
   - 友好的错误信息

4. **与 Service 层配合**
   - 避免职责重复
   - 清晰的架构分层
   - 更好的代码组织

---

## 注意事项

1. **向后兼容**
   - 保留旧的 store 结构
   - 逐步迁移到新模块
   - 提供迁移指南

2. **渐进式重构**
   - 先创建新模块
   - 再迁移现有代码
   - 最后删除旧代码

3. **测试覆盖**
   - 为每个模块编写测试
   - 测试模块间的交互
   - 测试持久化功能

4. **文档更新**
   - 更新 Store 使用文档
   - 提供模块说明
   - 添加使用示例

---

**创建时间**: 2026-01-15
**预计完成**: 3-5 天
**状态**: 计划中
