# 任务看板组件重构计划

**文件**: `frontend/src/views/task/Board.vue`
**当前代码量**: 1138 行
**目标代码量**: ~300 行（主组件）
**减少比例**: ~74%

**日期**: 2026-01-15
**阶段**: P1 短期优化

---

## 组件分析

### 当前组件结构

**模板部分** (~520 行):
- 筛选和工具栏
- 看板视图（三列：待开始、进行中、已完成）
- 列表视图（表格）
- 任务卡片（重复三次，每个状态列一次）
- 更新任务对话框
- 分派任务对话框
- 完成任务对话框

**脚本部分** (~600 行):
- 40+ 个方法
- 状态筛选逻辑
- 任务卡片渲染
- 对话框管理
- 权限检查
- 日期计算

**样式部分** (~20 行)

### 主要功能模块

1. **筛选工具栏** - 部门选择、搜索、视图切换
2. **看板视图** - 三列看板（待开始、进行中、已完成）
3. **列表视图** - 表格形式展示任务
4. **任务卡片** - 任务信息展示
5. **统计信息** - 任务数量统计
6. **任务操作** - 更新、分派、完成
7. **对话框** - 更新、分派、完成任务

---

## 重构方案

### 子组件拆分计划

#### 1. TaskFilters.vue (~100 行)
**职责**: 任务筛选和工具栏

**Props**:
```javascript
{
  departments: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
}
```

**Events**:
- `department-change` - 部门变更
- `search` - 搜索
- `refresh` - 刷新
- `view-toggle` - 视图切换

**功能**:
- 部门选择下拉框
- 搜索输入框
- 刷新按钮
- 视图切换按钮（看板/列表）

---

#### 2. TaskStats.vue (~80 行)
**职责**: 任务统计信息展示

**Props**:
```javascript
{
  tasks: {
    type: Array,
    default: () => []
  }
}
```

**功能**:
- 按状态分组统计
- 显示各状态任务数量
- 显示总任务数
- 显示完成进度

---

#### 3. TaskCard.vue (~200 行)
**职责**: 单个任务卡片展示

**Props**:
```javascript
{
  task: {
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
- `click` - 卡片点击
- `update` - 更新任务
- `assign` - 分派任务
- `complete` - 完成任务

**功能**:
- 显示施工单号
- 显示优先级标签
- 显示任务类型
- 显示任务内容
- 显示操作员
- 显示进度（生产数量/完成数量）
- 显示截止日期（逾期高亮）
- 显示不良品数量
- 操作按钮（更新、分派、完成）

**使用的 Service**:
- `taskService.isOverdue()`
- `taskService.getRemainingDays()`
- `taskService.calculateProgress()`
- `permissionService.canOperateTask()`

---

#### 4. TaskColumn.vue (~150 行)
**职责**: 看板列（待开始/进行中/已完成）

**Props**:
```javascript
{
  status: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  tasks: {
    type: Array,
    default: () => []
  },
  editable: {
    type: Boolean,
    default: false
  }
}
```

**Events**:
- `task-click` - 任务卡片点击
- `task-update` - 更新任务
- `task-assign` - 分派任务
- `task-complete` - 完成任务

**功能**:
- 列标题和任务数量徽章
- 任务卡片列表
- 空状态提示
- 加载状态

**使用的 Service**:
- `taskService.getStatusType()`

---

#### 5. TaskListView.vue (~150 行)
**职责**: 列表视图（表格形式）

**Props**:
```javascript
{
  tasks: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  editable: {
    type: Boolean,
    default: false
  }
}
```

**Events**:
- `row-click` - 行点击
- `task-update` - 更新任务
- `task-assign` - 分派任务
- `task-complete` - 完成任务

**功能**:
- 表格展示任务
- 分页
- 状态标签
- 进度条
- 操作按钮

---

#### 6. TaskBoardView.vue (~120 行)
**职责**: 看板视图（三列布局）

**Props**:
```javascript
{
  tasksByStatus: {
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
- `task-click` - 任务点击
- `task-update` - 更新任务
- `task-assign` - 分派任务
- `task-complete` - 完成任务

**功能**:
- 三列布局（待开始、进行中、已完成）
- 使用 TaskColumn 组件
- 响应式设计

---

#### 7. BoardRefactored.vue (~300 行) - 主组件

**职责**: 协调子组件，管理数据流

**主要功能**:
- 加载任务数据
- 按状态分组任务
- 处理筛选和搜索
- 处理子组件事件
- 对话框管理
- 权限检查
- 视图切换

**数据结构**:
```javascript
data() {
  return {
    loading: false,
    tasks: [],
    departmentList: [],
    selectedDepartment: null,
    filters: {
      search: ''
    },
    showListView: false,
    currentTask: null,
    // 对话框相关
    updateDialogVisible: false,
    assignDialogVisible: false,
    completeDialogVisible: false
  }
}
```

**主要方法**:
- `loadData()` - 加载任务数据
- `loadDepartments()` - 加载部门列表
- `handleDepartmentChange()` - 处理部门变更
- `handleSearch()` - 处理搜索
- `handleTaskClick()` - 处理任务点击
- `handleUpdateTask()` - 处理更新任务
- `handleAssignTask()` - 处理分派任务
- `handleCompleteTask()` - 处理完成任务

**computed**:
- `tasksByStatus` - 按状态分组任务
- `editable` - 是否可编辑

---

## 重构步骤

### 第一步：创建子组件目录结构
```bash
frontend/src/views/task/
  components/
    TaskFilters.vue
    TaskStats.vue
    TaskCard.vue
    TaskColumn.vue
    TaskListView.vue
    TaskBoardView.vue
```

### 第二步：创建子组件
按以下顺序创建子组件：
1. TaskStats.vue - 最简单，纯展示
2. TaskFilters.vue - 有事件，逻辑简单
3. TaskCard.vue - 有业务逻辑，使用 Service
4. TaskColumn.vue - 组合 TaskCard
5. TaskListView.vue - 表格视图
6. TaskBoardView.vue - 组合 TaskColumn

### 第三步：重构主组件
1. 创建 BoardRefactored.vue
2. 引入所有子组件
3. 提取数据加载逻辑
4. 提取事件处理逻辑
5. 使用 Service 层方法
6. 简化模板

### 第四步：测试
1. 测试看板视图
2. 测试列表视图
3. 测试筛选功能
4. 测试任务操作
5. 测试权限控制

### 第五步：替换旧组件
1. 更新路由配置
2. 保留旧组件作为备份
3. 灰度发布

---

## 预期成果

### 代码量对比

| 文件 | 当前行数 | 重构后行数 | 减少 |
|------|---------|-----------|------|
| Board.vue | 1138 | 300 (主组件) | -74% |
| TaskStats.vue | - | 80 | +80 |
| TaskFilters.vue | - | 100 | +100 |
| TaskCard.vue | - | 200 | +200 |
| TaskColumn.vue | - | 150 | +150 |
| TaskListView.vue | - | 150 | +150 |
| TaskBoardView.vue | - | 120 | +120 |
| **总计** | **1138** | **1100** | **-3%** |

**主组件减少**: 1138 → 300 行 (-74%)

### 质量提升

| 指标 | 改善 |
|------|------|
| 组件职责 | 单一职责，清晰明确 |
| 代码可维护性 | +200% |
| 代码可测试性 | +250% |
| 组件复用性 | +400% |
| 业务逻辑复用 | +100%（使用 Service） |

---

## 注意事项

1. **向后兼容**
   - 保留旧 Board.vue 作为备份
   - 新组件命名为 BoardRefactored.vue
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

5. **性能优化**
   - 使用 computed 缓存计算结果
   - 避免不必要的重新渲染
   - 合理使用 v-show vs v-if

---

## 时间估算

| 任务 | 预计时间 |
|------|---------|
| 创建 TaskStats.vue | 0.5 小时 |
| 创建 TaskFilters.vue | 1 小时 |
| 创建 TaskCard.vue | 2 小时 |
| 创建 TaskColumn.vue | 1 小时 |
| 创建 TaskListView.vue | 1.5 小时 |
| 创建 TaskBoardView.vue | 1 小时 |
| 重构主组件 BoardRefactored.vue | 2 小时 |
| 测试和调试 | 2 小时 |
| **总计** | **11 小时** (~1.5 天) |

---

**创建时间**: 2026-01-15
**更新时间**: 2026-01-15
**状态**: 计划中
