# Phase 3: 状态管理重构

**目标**: 使用 Pinia 重构 WorkOrder 状态管理

## 背景

当前 `Detail.vue` 有 50+ data 属性、150+ 方法，状态和逻辑高度耦合。

## 范围

| 任务 | 文件 | 风险 |
|-----|------|-----|
| 创建 WorkOrderStore | `store/modules/workOrder.js` | 高 |
| 提取 API 调用 | `composables/useWorkOrderAPI.js` | 中 |
| 提取业务逻辑 | `composables/useWorkOrderLogic.js` | 高 |
| 迁移 Detail.vue | `views/workorder/WorkOrderDetail.vue` | 高 |

## 详细任务

### 3.1 创建 WorkOrderStore

```javascript
// store/modules/workOrder.js
export default {
  namespaced: true,
  
  state: () => ({
    workOrder: null,
    loading: false,
    error: null,
    dialogs: {
      completeTask: false,
      completeProcess: false,
      materialStatus: false,
    }
  }),
  
  getters: {
    workOrderId: state => state.workOrder?.id,
    status: state => state.workOrder?.status,
    processes: state => state.workOrder?.order_processes || [],
    tasks: state => state.workOrder?.tasks || [],
    canEdit: state => /* 权限判断 */,
    progressPercentage: state => state.workOrder?.progress_percentage
  },
  
  actions: {
    async fetchWorkOrder(id) { /* ... */ },
    async updateStatus(status) { /* ... */ },
    async completeTask(taskId, data) { /* ... */ },
  },
  
  mutations: {
    SET_WORK_ORDER(state, data) { /* ... */ },
    SET_LOADING(state, loading) { /* ... */ },
    TOGGLE_DIALOG(state, { dialog, visible }) { /* ... */ }
  }
}
```

### 3.2 提取 API 调用

```javascript
// composables/useWorkOrderAPI.js
import { workOrderAPI, workOrderTaskAPI, workOrderProcessAPI } from '@/api/modules'

export function useWorkOrderAPI() {
  const fetchWorkOrder = async (id) => {
    const response = await workOrderAPI.getDetail(id)
    return response.data
  }
  
  const updateStatus = async (id, status) => {
    return await workOrderAPI.update(id, { status })
  }
  
  const completeTask = async (taskId, data) => {
    return await workOrderTaskAPI.complete(taskId, data)
  }
  
  return {
    fetchWorkOrder,
    updateStatus,
    completeTask,
  }
}
```

### 3.3 提取业务逻辑

```javascript
// composables/useWorkOrderLogic.js
import { useWorkOrderAPI } from './useWorkOrderAPI'
import { usePermissions } from '@/mixins/permissionMixin'

export function useWorkOrderLogic(store) {
  const { fetchWorkOrder, updateStatus, completeTask } = useWorkOrderAPI()
  const { canEditWorkOrder } = usePermissions()
  
  const initWorkOrder = async (id) => {
    store.setLoading(true)
    try {
      const data = await fetchWorkOrder(id)
      store.setWorkOrder(data)
    } catch (error) {
      store.setError(error.message)
      throw error
    } finally {
      store.setLoading(false)
    }
  }
  
  const handleStatusChange = async (status) => {
    try {
      await updateStatus(store.workOrderId, status)
      await initWorkOrder(store.workOrderId)
    } catch (error) {
      throw error
    }
  }
  
  const canCompleteTask = (task, process) => {
    if (task.status === 'completed') return false
    if (process.status !== 'in_progress') return false
    return canEditWorkOrder()
  }
  
  return {
    initWorkOrder,
    handleStatusChange,
    canCompleteTask,
  }
}
```

### 3.4 迁移 Detail.vue

```vue
<template>
  <div v-loading="loading" class="workorder-detail">
    <WorkOrderHeader 
      :work-order="workOrder"
      @edit="handleEdit"
      @print="handlePrint"
      @status-change="handleStatusChange"
    />
    
    <WorkOrderBasicInfo :work-order="workOrder" />
  </div>
</template>

<script>
import { useWorkOrderStore } from '@/store/modules/workOrder'
import { useWorkOrderLogic } from '@/composables/useWorkOrderLogic'
import WorkOrderHeader from '@/components/WorkOrderHeader.vue'
import WorkOrderBasicInfo from '@/components/WorkOrderBasicInfo.vue'

export default {
  name: 'WorkOrderDetail',
  
  components: {
    WorkOrderHeader,
    WorkOrderBasicInfo
  },
  
  setup() {
    const store = useWorkOrderStore()
    const { initWorkOrder, handleStatusChange } = useWorkOrderLogic(store)
    
    return {
      workOrder: store.workOrder,
      loading: store.loading,
      initWorkOrder,
      handleStatusChange
    }
  },
  
  async created() {
    const id = this.$route.params.id
    await this.initWorkOrder(id)
  }
}
</script>
```

## 文件变更

```
BEFORE                              AFTER
=================================================================
Detail.vue (3508行)         →  WorkOrderDetail.vue (800行)
                              store/modules/workOrder.js (新增)
                              composables/useWorkOrderAPI.js (新增)
                              composables/useWorkOrderLogic.js (新增)
                              components/WorkOrderHeader.vue (新增)
```

## 风险缓解

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 状态丢失 | 高 | 保留旧代码作为备份，逐步迁移 |
| 性能下降 | 低 | 使用 Pinia getter 缓存 |
| 兼容性 | 低 | 保持 API 不变 |

## 验收标准

- [ ] 所有功能保持不变
- [ ] API 调用统一到 composables
- [ ] 状态管理使用 Pinia
- [ ] 单元测试覆盖 Store 和 Composables
- [ ] 无回归问题

## 时间估算

| 任务 | 时间 |
|-----|------|
| 创建 WorkOrderStore | 2-3 小时 |
| 提取 API 调用 | 1-2 小时 |
| 提取业务逻辑 | 2-3 小时 |
| 迁移 Detail.vue | 3-4 小时 |
| 测试和修复 | 2-3 小时 |
| **总计** | **10-15 小时** |

## 依赖

- Pinia 安装 (`npm install pinia @pinia/nuxt`)
- Vue 2.7 → Vue 3 (Pinia 官方支持)

## 后续

完成 Phase 3 后：
1. 可复用 Store 到其他页面 (List, Form)
2. Composables 可在多个组件间共享
3. 便于单元测试和调试
