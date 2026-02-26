# 对话框组件提取优化记录

> 日期: 2026-02-26
> 版本: v3.0.1
> 状态: ✅ 已完成（组件已提取，集成待后续渐进式进行）

## 背景

`WorkOrderDetail.vue` 文件行数过多（2600+ 行），包含大量内联对话框组件，导致：
- 代码难以维护
- 逻辑重复
- ESLint 检查困难

## 优化方案

### 提取的对话框组件

| 组件 | 文件 | 功能 | 行数 |
|------|------|------|------|
| 添加物料 | `AddMaterialDialog.vue` | 添加施工单物料 | ~100 |
| 物料状态 | `MaterialStatusDialog.vue` | 更新物料采购状态 | ~180 |
| 添加工序 | `AddProcessDialog.vue` | 添加施工单工序 | ~90 |
| 完成工序 | `CompleteProcessDialog.vue` | 标记工序完成 | ~180 |
| 调整工序分派 | `ReassignProcessDialog.vue` | 批量调整工序分派 | ~200 |
| 任务分派 | `TaskAssignDialog.vue` | 调整任务分派部门/人员 | ~130 |
| 拆分任务 | `SplitTaskDialog.vue` | 将任务拆分为子任务 | ~240 |
| 完成任务 | `CompleteTaskDialog.vue` | 完成任务（支持设计类任务） | ~220 |
| 更新任务 | `UpdateTaskDialog.vue` | 更新任务完成数量 | ~210 |

**总计**: 约 1550 行代码从主组件中分离

## 组件设计模式

### 1. 统一的 Props 设计

```javascript
props: {
  visible: {        // 对话框显示状态（使用 .sync 修饰符）
    type: Boolean,
    default: false
  },
  // 业务数据
  task: { type: Object, default: null },
  process: { type: Object, default: null },
  // 列表数据（如部门、用户等）
  departmentList: { type: Array, default: () => [] },
  userList: { type: Array, default: () => [] },
  // 加载状态
  loading: { type: Boolean, default: false }
}
```

### 2. 双向绑定模式

使用 `computed` 实现 `v-model` 效果：

```javascript
computed: {
  dialogVisible: {
    get() {
      return this.visible
    },
    set(val) {
      this.$emit('update:visible', val)
    }
  }
}
```

### 3. 事件发射模式

组件内部处理表单验证，通过事件将数据传回父组件：

```javascript
methods: {
  handleSubmit() {
    this.$refs.form.validate((valid) => {
      if (!valid) return
      this.$emit('submit', { taskId: this.task.id, data: { ...this.form } })
    })
  }
}
```

### 4. 表单状态管理

组件内部管理表单状态，父组件只需处理 API 调用：

```javascript
// 组件内部
data() {
  return {
    form: {
      quantity_completed: 0,
      quantity_defective: 0,
      // ...
    }
  }
}

// 父组件
async handleAddMaterial({ material_id, notes }) {
  await workOrderAPI.addMaterial(this.workOrder.id, { material_id, notes })
  this.loadData()
}
```

## 使用示例

### 在父组件中引入

```javascript
import AddMaterialDialog from './components/AddMaterialDialog.vue'

export default {
  components: {
    AddMaterialDialog
  },
  data() {
    return {
      addMaterialDialog: false,
      materialList: [],
      addingMaterial: false
    }
  }
}
```

### 在模板中使用

```html
<AddMaterialDialog
  :visible.sync="addMaterialDialog"
  :material-list="materialList"
  :loading="addingMaterial"
  @submit="handleAddMaterial"
/>
```

### 处理提交事件

```javascript
async handleAddMaterial({ material_id, notes }) {
  this.addingMaterial = true
  try {
    await workOrderAPI.addMaterial(this.workOrder.id, { material_id, notes })
    this.$message.success('添加成功')
    this.addMaterialDialog = false
    this.loadData()
  } catch (error) {
    this.$message.error('添加失败')
  } finally {
    this.addingMaterial = false
  }
}
```

## 后续集成计划

### Phase 1: 简单对话框（已完成）
- [x] AddMaterialDialog
- [x] AddProcessDialog
- [x] MaterialStatusDialog
- [x] CompleteProcessDialog

### Phase 2: 复杂对话框（待定）
- [ ] ReassignProcessDialog
- [ ] TaskAssignDialog
- [ ] SplitTaskDialog
- [ ] CompleteTaskDialog
- [ ] UpdateTaskDialog

### 注意事项

集成时需要：
1. 导入组件并注册
2. 替换模板中的 `<el-dialog>` 为新组件
3. 调整事件处理方法签名
4. 移除不再需要的 data 属性和方法
5. 全面测试功能

## 相关文件

- `frontend/src/views/workorder/components/*.vue`
- `frontend/src/views/workorder/WorkOrderDetail.vue`

## 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-02-26 | v3.0.1 | 提取 9 个对话框组件 |
