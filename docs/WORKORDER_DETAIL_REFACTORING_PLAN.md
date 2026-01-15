# 施工单详情组件重构计划

**文件**: `frontend/src/views/workorder/Detail.vue`
**当前代码量**: 3246 行
**目标代码量**: ~500 行（主组件）
**减少比例**: ~85%

**日期**: 2026-01-15
**阶段**: P1 短期优化

---

## 组件分析

### 当前组件结构

**模板部分** (~1600 行):
- 顶部操作栏
- 基本信息展示 (el-descriptions)
- 业务员审核操作
- 重新提交审核操作（审核拒绝后）
- 请求重新审核操作（审核通过后）
- 审核历史记录
- 图稿和刀模信息
- 物料信息表格
- 工序信息展示
- 任务列表
- 产品列表（场景2）
- 打印区域（隐藏）
- 多个对话框（添加工序、完成工序、更新任务、添加物料、物料状态更新等）

**脚本部分** (~1550 行):
- 60+ 个方法
- 大量业务逻辑
- 状态管理
- API 调用
- 表单验证

**样式部分** (~80 行)

### 主要功能模块

1. **基本信息展示** - 显示施工单的基本信息
2. **审核流程** - 业务员审核、重新提交、请求重新审核
3. **审核历史** - 显示审核历史记录
4. **图稿刀模** - 显示和管理图稿、刀模信息
5. **物料管理** - 物料列表、添加物料、更新物料状态
6. **工序管理** - 工序列表、添加工序、完成工序、工序分派
7. **任务管理** - 任务列表、完成任务、更新任务、分派任务、拆分任务
8. **产品列表** - 显示施工单包含的多个产品
9. **打印功能** - 打印施工单详情

---

## 重构方案

### 子组件拆分计划

#### 1. WorkOrderBasicInfo.vue (~150 行)
**职责**: 显示施工单基本信息

**Props**:
```javascript
{
  workOrder: {
    type: Object,
    required: true
  }
}
```

**功能**:
- 使用 el-descriptions 显示基本信息
- 显示施工单号、客户、业务员、制表人
- 显示产品名称、生产数量、总金额
- 显示状态（施工单状态、审核状态、优先级）
- 显示进度条
- 显示日期信息（下单日期、交货日期、实际交货日期）
- 显示审核信息（审核人、审核时间、审核意见）
- 显示产品规格

**使用的 Service**:
- `workOrderService.getStatusText()`
- `workOrderService.getApprovalStatusText()`
- `workOrderService.getPriorityText()`
- `workOrderService.getPriorityType()`
- `workOrderService.calculateProgress()`

---

#### 2. ApprovalWorkflow.vue (~200 行)
**职责**: 处理审核流程相关操作

**Props**:
```javascript
{
  workOrder: {
    type: Object,
    required: true
  }
}
```

**Events**:
- `approve` - 审核通过/拒绝
- `resubmit` - 重新提交审核
- `request-reapproval` - 请求重新审核

**功能**:
- 业务员审核表单（审核意见、拒绝原因）
- 重新提交审核表单
- 请求重新审核表单
- 审核历史记录展示
- 根据审核状态显示相应的操作按钮

**使用的 Service**:
- `permissionService.canApproveWorkOrder()`
- `workOrderService.canSubmitForApproval()`

---

#### 3. ArtworkAndDieInfo.vue (~120 行)
**职责**: 显示图稿和刀模信息

**Props**:
```javascript
{
  workOrder: {
    type: Object,
    required: true
  }
}
```

**功能**:
- 显示图稿列表（图稿编号、确认状态、确认时间）
- 显示刀模列表（刀模编号、确认状态、确认时间）
- 显示烫金版、压纹版信息

---

#### 4. MaterialManagement.vue (~250 行)
**职责**: 物料信息管理

**Props**:
```javascript
{
  workOrder: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
}
```

**Events**:
- `add-material` - 添加物料
- `update-status` - 更新物料状态

**功能**:
- 物料列表表格
- 添加物料对话框
- 物料状态更新对话框
- 采购状态、采购日期、回料日期、开料日期管理

**使用的 Service**:
- `workOrderService.canEdit()` - 判断是否可编辑

---

#### 5. ProcessManagement.vue (~350 行)
**职责**: 工序信息管理

**Props**:
```javascript
{
  workOrder: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
}
```

**Events**:
- `add-process` - 添加工序
- `complete-process` - 完成工序
- `reassign-process` - 重新分派工序
- `department-change` - 工序部门变更

**功能**:
- 工序列表展示
- 添加工序对话框
- 完成工序对话框
- 工序重新分派对话框
- 工序状态显示
- 工序颜色标识
- 工序任务列表

**使用的 Service**:
- `taskService.getProcessColor()`
- `taskService.calculateProgress()`
- `workOrderService.canEdit()`

---

#### 6. TaskManagement.vue (~300 行)
**职责**: 任务管理

**Props**:
```javascript
{
  process: {
    type: Object,
    required: true
  },
  editable: {
    type: Boolean,
    default: false
  }
}
```

**Events**:
- `complete-task` - 完成任务
- `update-task` - 更新任务
- `assign-task` - 分派任务
- `split-task` - 拆分任务

**功能**:
- 任务列表展示
- 完成任务对话框
- 更新任务对话框
- 分派任务对话框
- 拆分任务对话框
- 任务状态显示
- 任务逾期提示

**使用的 Service**:
- `taskService.canComplete()`
- `taskService.getCannotCompleteReason()`
- `taskService.isOverdue()`
- `taskService.getStatusText()`
- `taskService.getStatusType()`
- `permissionService.canOperateTask()`

---

#### 7. WorkOrderProducts.vue (~100 行)
**职责**: 显示施工单包含的产品列表

**Props**:
```javascript
{
  products: {
    type: Array,
    required: true
  }
}
```

**功能**:
- 产品列表表格
- 产品名称、规格、拼版、数量、单价、小计
- 计算总金额

---

#### 8. WorkOrderPrint.vue (~200 行)
**职责**: 打印功能

**Props**:
```javascript
{
  workOrder: {
    type: Object,
    required: true
  }
}
```

**功能**:
- 生成打印 HTML
- 打印预览
- 打印（调用 window.print()）

**使用的 Service**:
- `exportService.preparePrintData()`
- `exportService.generatePrintHTML()`
- `exportService.print()`

---

#### 9. DetailRefactored.vue (~500 行) - 主组件

**职责**: 协调子组件，管理数据流

**主要功能**:
- 加载施工单数据
- 加载关联数据（工序、物料、任务、部门等）
- 处理子组件事件
- 状态管理
- 权限检查
- 顶部操作栏（返回、打印、编辑、更改状态）

**数据结构**:
```javascript
data() {
  return {
    loading: false,
    workOrder: null,
    processList: [],
    materialList: [],
    departmentList: [],
    editable: false
  }
}
```

**主要方法**:
- `loadWorkOrder()` - 加载施工单详情
- `handleEdit()` - 跳转到编辑页面
- `handlePrint()` - 调用打印组件
- `handleStatusChange()` - 更改施工单状态
- `handleApprove()` - 处理审核
- `handleResubmit()` - 处理重新提交
- `handleRequestReapproval()` - 处理请求重新审核
- `handleAddProcess()` - 处理添加工序
- `handleCompleteProcess()` - 处理完成工序
- `handleAddMaterial()` - 处理添加物料
- `handleUpdateMaterialStatus()` - 处理更新物料状态

---

## 重构步骤

### 第一步：创建子组件目录结构
```bash
frontend/src/views/workorder/
  components/
    WorkOrderBasicInfo.vue
    ApprovalWorkflow.vue
    ArtworkAndDieInfo.vue
    MaterialManagement.vue
    ProcessManagement.vue
    TaskManagement.vue
    WorkOrderProducts.vue
    WorkOrderPrint.vue
```

### 第二步：创建子组件
按以下顺序创建子组件：
1. WorkOrderBasicInfo.vue - 最简单，无状态
2. WorkOrderProducts.vue - 简单展示组件
3. ArtworkAndDieInfo.vue - 简单展示组件
4. ApprovalWorkflow.vue - 有表单和状态
5. MaterialManagement.vue - 复杂表单和列表
6. TaskManagement.vue - 复杂对话框和业务逻辑
7. ProcessManagement.vue - 最复杂，包含任务管理
8. WorkOrderPrint.vue - 独立功能

### 第三步：重构主组件
1. 创建 DetailRefactored.vue
2. 引入所有子组件
3. 提取数据加载逻辑
4. 提取事件处理逻辑
5. 使用 Service 层方法
6. 简化模板

### 第四步：测试
1. 测试所有子组件功能
2. 测试主组件集成
3. 测试权限控制
4. 测试数据流

### 第五步：替换旧组件
1. 更新路由配置
2. 保留旧组件作为备份
3. 灰度发布

---

## 预期成果

### 代码量对比

| 文件 | 当前行数 | 重构后行数 | 减少 |
|------|---------|-----------|------|
| Detail.vue | 3246 | 500 (主组件) | -85% |
| WorkOrderBasicInfo.vue | - | 150 | +150 |
| ApprovalWorkflow.vue | - | 200 | +200 |
| ArtworkAndDieInfo.vue | - | 120 | +120 |
| MaterialManagement.vue | - | 250 | +250 |
| ProcessManagement.vue | - | 350 | +350 |
| TaskManagement.vue | - | 300 | +300 |
| WorkOrderProducts.vue | - | 100 | +100 |
| WorkOrderPrint.vue | - | 200 | +200 |
| **总计** | **3246** | **2170** | **-33%** |

**主组件减少**: 3246 → 500 行 (-85%)

### 质量提升

| 指标 | 改善 |
|------|------|
| 组件职责 | 单一职责，清晰明确 |
| 代码可维护性 | +150% |
| 代码可测试性 | +200% |
| 组件复用性 | +300% |
| 业务逻辑复用 | +100%（使用 Service） |

---

## 注意事项

1. **向后兼容**
   - 保留旧 Detail.vue 作为备份
   - 新组件命名为 DetailRefactored.vue
   - 逐步迁移

2. **数据流**
   - 使用 props down, events up 模式
   - 父组件管理所有状态
   - 子组件只负责展示和用户交互

3. **Service 层使用**
   - 所有业务逻辑使用 Service 层方法
   - 不在组件中直接处理业务逻辑
   - 保持组件轻量

4. **权限控制**
   - 使用 PermissionService 检查权限
   - 根据权限显示/隐藏操作按钮
   - 统一权限控制逻辑

5. **错误处理**
   - 使用 Service 层的错误处理
   - 统一的错误提示
   - 友好的错误消息

---

## 时间估算

| 任务 | 预计时间 |
|------|---------|
| 创建 WorkOrderBasicInfo.vue | 1 小时 |
| 创建 WorkOrderProducts.vue | 0.5 小时 |
| 创建 ArtworkAndDieInfo.vue | 0.5 小时 |
| 创建 ApprovalWorkflow.vue | 2 小时 |
| 创建 MaterialManagement.vue | 3 小时 |
| 创建 TaskManagement.vue | 3 小时 |
| 创建 ProcessManagement.vue | 4 小时 |
| 创建 WorkOrderPrint.vue | 1 小时 |
| 重构主组件 DetailRefactored.vue | 3 小时 |
| 测试和调试 | 4 小时 |
| **总计** | **22 小时** (~3 天) |

---

**创建时间**: 2026-01-15
**更新时间**: 2026-01-15
**状态**: 计划中
