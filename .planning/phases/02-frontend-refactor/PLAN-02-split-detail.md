---
wave: 1
phase: 02-frontend-refactor
plan: 02-split-detail
depends_on: []
files_modified:
  - frontend/src/views/workorder/Detail.vue
  - frontend/src/views/workorder/components/WorkOrderBasicInfo.vue
  - frontend/src/views/workorder/components/WorkOrderMaterials.vue
  - frontend/src/views/workorder/components/WorkOrderProcesses.vue
  - frontend/src/views/workorder/components/WorkOrderTasks.vue
  - frontend/src/views/workorder/components/ApprovalWorkflow.vue
autonomous: true
---

# PLAN-02: 拆分 Detail.vue

## Phase Context
Phase 02 of v1.1 milestone focuses on frontend refactoring to improve code maintainability by:
- Creating centralized constants for status and priority values
- Splitting large Vue components into smaller, reusable sub-components
- Replacing hardcoded strings with imported constants

## Overview
将 3508 行的 `Detail.vue` 拆分为多个子组件，每个组件负责一个特定功能区域。简化主组件，提高代码可读性和可维护性。

## Background
`Detail.vue` 当前包含所有功能（基本信息、物料、工序、任务、审批流程等）在一个文件中，导致：
- 代码难以维护
- 难以理解组件结构
- 难以进行单元测试
- 难以复用代码

## Component Structure
```
frontend/src/views/workorder/
├── Detail.vue (主组件，简化为约 500 行)
└── components/
    ├── WorkOrderBasicInfo.vue (~300 行) - 基本信息展示
    ├── WorkOrderMaterials.vue (~500 行) - 物料管理
    ├── WorkOrderProcesses.vue (~800 行) - 工序管理
    ├── WorkOrderTasks.vue (~600 行) - 任务管理
    └── ApprovalWorkflow.vue (~400 行) - 审批流程
```

## Sections to Extract

### WorkOrderBasicInfo.vue
**Extracted from Detail.vue lines ~1-200**
- Header actions (buttons, status dropdown)
- Basic info descriptions (order_number, customer, status, etc.)
- Progress display
- Order/delivery dates

**Props:**
```javascript
props: {
  workOrder: {
    type: Object,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  },
  canApprove: {
    type: Boolean,
    default: false
  }
}
```

**Emits:**
- `edit` - Trigger edit mode
- `status-change` - Status change requested
- `print` - Print requested

### WorkOrderMaterials.vue
**Extracted from Detail.vue lines ~300-800**
- Material list table
- Material status management
- Material add/edit dialogs

**Props:**
```javascript
props: {
  workOrder: {
    type: Object,
    required: true
  }
}
```

### WorkOrderProcesses.vue
**Extracted from Detail.vue lines ~900-1500**
- Process list (Gantt/Timeline views)
- Process status management
- Process task display
- Process actions (start, complete, etc.)

**Props:**
```javascript
props: {
  workOrder: {
    type: Object,
    required: true
  },
  processes: {
    type: Array,
    default: () => []
  }
}
```

### WorkOrderTasks.vue
**Extracted from Detail.vue lines ~1500-2500**
- Task list table
- Task status management
- Task completion handling

**Props:**
```javascript
props: {
  workOrder: {
    type: Object,
    required: true
  },
  tasks: {
    type: Array,
    default: () => []
  }
}
```

**Emits:**
- `task-update` - Task was updated

### ApprovalWorkflow.vue
**Extracted from Detail.vue lines ~2500-3200**
- Approval status display
- Approval actions
- Approval history

**Props:**
```javascript
props: {
  workOrder: {
    type: Object,
    required: true
  },
  canApprove: {
    type: Boolean,
    default: false
  }
}
```

**Emits:**
- `approve` - Approve action
- `reject` - Reject action

## Tasks

<task type="auto">
  <name>Analyze Detail.vue sections</name>
  <files>frontend/src/views/workorder/Detail.vue</files>
  <action>Read and analyze Detail.vue to identify exact line ranges for each section</action>
  <verify>grep -n "el-descriptions\|el-table\|el-tabs\|process\|material\|task\|approval" frontend/src/views/workorder/Detail.vue | head -50</verify>
  <done>Section boundaries identified</done>
</task>

<task type="auto">
  <name>Create WorkOrderBasicInfo.vue</name>
  <files>frontend/src/views/workorder/components/WorkOrderBasicInfo.vue</files>
  <action>Extract header actions and basic info section from Detail.vue to WorkOrderBasicInfo.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/WorkOrderBasicInfo.vue</verify>
  <done>WorkOrderBasicInfo.vue created</done>
</task>

<task type="auto">
  <name>Create WorkOrderMaterials.vue</name>
  <files>frontend/src/views/workorder/components/WorkOrderMaterials.vue</files>
  <action>Extract material management section from Detail.vue to WorkOrderMaterials.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/WorkOrderMaterials.vue</verify>
  <done>WorkOrderMaterials.vue created</done>
</task>

<task type="auto">
  <name>Create WorkOrderProcesses.vue</name>
  <files>frontend/src/views/workorder/components/WorkOrderProcesses.vue</files>
  <action>Extract process management section from Detail.vue to WorkOrderProcesses.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/WorkOrderProcesses.vue</verify>
  <done>WorkOrderProcesses.vue created</done>
</task>

<task type="auto">
  <name>Create WorkOrderTasks.vue</name>
  <files>frontend/src/views/workorder/components/WorkOrderTasks.vue</files>
  <action>Extract task management section from Detail.vue to WorkOrderTasks.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/WorkOrderTasks.vue</verify>
  <done>WorkOrderTasks.vue created</done>
</task>

<task type="auto">
  <name>Create ApprovalWorkflow.vue</name>
  <files>frontend/src/views/workorder/components/ApprovalWorkflow.vue</files>
  <action>Extract approval workflow section from Detail.vue to ApprovalWorkflow.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/ApprovalWorkflow.vue</verify>
  <done>ApprovalWorkflow.vue created</done>
</task>

<task type="auto">
  <name>Refactor main Detail.vue</name>
  <files>frontend/src/views/workorder/Detail.vue</files>
  <action>Update Detail.vue to import and use the new sub-components, removing extracted code</action>
  <verify>wc -l frontend/src/views/workorder/Detail.vue</verify>
  <done>Detail.vue refactored with sub-components</done>
</task>

## Verification
```bash
# Check all files exist
ls -la frontend/src/views/workorder/Detail.vue
ls -la frontend/src/views/workorder/components/WorkOrderBasicInfo.vue
ls -la frontend/src/views/workorder/components/WorkOrderMaterials.vue
ls -la frontend/src/views/workorder/components/WorkOrderProcesses.vue
ls -la frontend/src/views/workorder/components/WorkOrderTasks.vue
ls -la frontend/src/views/workorder/components/ApprovalWorkflow.vue

# Check Detail.vue is reduced
wc -l frontend/src/views/workorder/Detail.vue
# Expected: ~500 lines (reduced from 3508)

# Verify imports
grep -n "import.*WorkOrder" frontend/src/views/workorder/Detail.vue
grep -n "components:" frontend/src/views/workorder/Detail.vue
```

## Expected Artifacts
- `frontend/src/views/workorder/Detail.vue` - Refactored main component (~500 lines)
- `frontend/src/views/workorder/components/WorkOrderBasicInfo.vue` - Basic info component (~300 lines)
- `frontend/src/views/workorder/components/WorkOrderMaterials.vue` - Materials component (~500 lines)
- `frontend/src/views/workorder/components/WorkOrderProcesses.vue` - Processes component (~800 lines)
- `frontend/src/views/workorder/components/WorkOrderTasks.vue` - Tasks component (~600 lines)
- `frontend/src/views/workorder/components/ApprovalWorkflow.vue` - Approval component (~400 lines)
