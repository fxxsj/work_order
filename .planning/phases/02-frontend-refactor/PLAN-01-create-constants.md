---
wave: 1
phase: 02-frontend-refactor
plan: 01-create-constants
depends_on: []
files_modified:
  - frontend/src/constants/
  - frontend/src/constants/index.js
  - frontend/src/constants/workOrderStatus.js
  - frontend/src/constants/taskStatus.js
  - frontend/src/constants/priority.js
  - frontend/src/constants/approvalStatus.js
autonomous: true
---

# PLAN-01: 创建常量目录

## Phase Context
Phase 02 of v1.1 milestone focuses on frontend refactoring to improve code maintainability by:
- Creating centralized constants for status and priority values
- Splitting large Vue components into smaller, reusable sub-components
- Replacing hardcoded strings with imported constants

## Overview
创建 `frontend/src/constants/` 目录，统一管理所有状态和优先级常量。减少硬编码，提高代码可维护性。

## Background
当前代码库中存在大量硬编码的状态值（如 'pending', 'completed', 'in_progress' 等）和优先级值（如 'low', 'normal', 'high', 'urgent'），这些值在多个文件中重复出现，容易造成不一致和维护困难。

## Files to Create
```
frontend/src/constants/
├── index.js              # 统一导出所有常量
├── workOrderStatus.js    # 施工单状态常量
├── taskStatus.js         # 任务状态常量
├── approvalStatus.js     # 审批状态常量
└── priority.js           # 优先级常量
```

## Constants Definition

### workOrderStatus.js
```javascript
export const WorkOrderStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const WorkOrderStatusChoices = [
  { value: 'pending', label: '待开始', color: '#909399' },
  { value: 'in_progress', label: '进行中', color: '#409EFF' },
  { value: 'paused', label: '已暂停', color: '#E6A23C' },
  { value: 'completed', label: '已完成', color: '#67C23A' },
  { value: 'cancelled', label: '已取消', color: '#F56C6C' }
]
```

### taskStatus.js
```javascript
export const TaskStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled'
}

export const TaskStatusChoices = [
  { value: 'draft', label: '草稿', color: '#909399' },
  { value: 'pending', label: '待开始', color: '#409EFF' },
  { value: 'in_progress', label: '进行中', color: '#E6A23C' },
  { value: 'completed', label: '已完成', color: '#67C23A' },
  { value: 'skipped', label: '已跳过', color: '#C0C4CC' },
  { value: 'cancelled', label: '已取消', color: '#F56C6C' }
]
```

### approvalStatus.js
```javascript
export const ApprovalStatus = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

export const ApprovalStatusChoices = [
  { value: 'pending', label: '待审核', color: '#E6A23C' },
  { value: 'submitted', label: '已提交', color: '#409EFF' },
  { value: 'approved', label: '已审核', color: '#67C23A' },
  { value: 'rejected', label: '已拒绝', color: '#F56C6C' }
]
```

### priority.js
```javascript
export const Priority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
}

export const PriorityChoices = [
  { value: 'low', label: '低', color: '#67C23A' },
  { value: 'normal', label: '普通', color: '#409EFF' },
  { value: 'high', label: '高', color: '#E6A23C' },
  { value: 'urgent', label: '紧急', color: '#F56C6C' }
]
```

### index.js
```javascript
export * from './workOrderStatus'
export * from './taskStatus'
export * from './approvalStatus'
export * from './priority'
```

## Tasks

<task type="auto">
  <name>Create constants directory structure</name>
  <files>frontend/src/constants/</files>
  <action>Create frontend/src/constants/ directory structure</action>
  <verify>ls -la frontend/src/constants/</verify>
  <done>constants directory exists</done>
</task>

<task type="auto">
  <name>Create workOrderStatus.js</name>
  <files>frontend/src/constants/workOrderStatus.js</files>
  <action>Create frontend/src/constants/workOrderStatus.js with WorkOrderStatus and WorkOrderStatusChoices constants</action>
  <verify>cat frontend/src/constants/workOrderStatus.js</verify>
  <done>workOrderStatus.js exists with status constants</done>
</task>

<task type="auto">
  <name>Create taskStatus.js</name>
  <files>frontend/src/constants/taskStatus.js</files>
  <action>Create frontend/src/constants/taskStatus.js with TaskStatus and TaskStatusChoices constants</action>
  <verify>cat frontend/src/constants/taskStatus.js</verify>
  <done>taskStatus.js exists with status constants</done>
</task>

<task type="auto">
  <name>Create approvalStatus.js</name>
  <files>frontend/src/constants/approvalStatus.js</files>
  <action>Create frontend/src/constants/approvalStatus.js with ApprovalStatus and ApprovalStatusChoices constants</action>
  <verify>cat frontend/src/constants/approvalStatus.js</verify>
  <done>approvalStatus.js exists with status constants</done>
</task>

<task type="auto">
  <name>Create priority.js</name>
  <files>frontend/src/constants/priority.js</files>
  <action>Create frontend/src/constants/priority.js with Priority and PriorityChoices constants</action>
  <verify>cat frontend/src/constants/priority.js</verify>
  <done>priority.js exists with priority constants</done>
</task>

<task type="auto">
  <name>Create index.js for unified exports</name>
  <files>frontend/src/constants/index.js</files>
  <action>Create frontend/src/constants/index.js that exports all constants</action>
  <verify>cat frontend/src/constants/index.js</verify>
  <done>index.js exports all constants</done>
</task>

## Verification
Run these commands to verify:
```bash
# Check directory exists
ls -la frontend/src/constants/

# Check all files exist
cat frontend/src/constants/index.js
cat frontend/src/constants/workOrderStatus.js
cat frontend/src/constants/taskStatus.js
cat frontend/src/constants/approvalStatus.js
cat frontend/src/constants/priority.js
```

## Expected Artifacts
- `frontend/src/constants/index.js` - Central constant exports
- `frontend/src/constants/workOrderStatus.js` - Work order status constants
- `frontend/src/constants/taskStatus.js` - Task status constants
- `frontend/src/constants/approvalStatus.js` - Approval status constants
- `frontend/src/constants/priority.js` - Priority constants
