---
wave: 2
phase: 02-frontend-refactor
plan: 04-update-references
depends_on: PLAN-01-create-constants
files_modified:
  - frontend/src/views/workorder/Detail.vue
  - frontend/src/views/workorder/WorkOrderForm.vue
  - frontend/src/views/workorder/WorkOrderList.vue
  - frontend/src/views/workorder/WorkOrderDetail.vue
  - frontend/src/views/workorder/components/TaskSection.vue
  - frontend/src/views/workorder/components/ProcessManagement.vue
  - frontend/src/views/workorder/components/TaskManagement.vue
  - frontend/src/views/workorder/components/ApprovalWorkflow.vue
  - frontend/src/views/workorder/components/MaterialManagement.vue
  - frontend/src/views/task/TaskList.vue
  - frontend/src/views/task/OperatorCenter.vue
  - frontend/src/views/task/components/TaskFilters.vue
  - frontend/src/views/task/components/TaskActions.vue
  - frontend/src/views/task/components/TaskCard.vue
  - frontend/src/views/task/components/TaskListView.vue
  - frontend/src/views/task/components/OperatorTaskList.vue
  - frontend/src/views/dashboard/Dashboard.vue
  - frontend/src/views/dashboard/DashboardMobile.vue
  - frontend/src/views/dashboard/components/WorkOrderStatistics.vue
  - frontend/src/views/dashboard/components/TaskStatistics.vue
autonomous: true
---

# PLAN-04: 更新引用处使用常量

## Phase Context
Phase 02 of v1.1 milestone focuses on frontend refactoring to improve code maintainability by:
- Creating centralized constants for status and priority values
- Splitting large Vue components into smaller, reusable sub-components
- Replacing hardcoded strings with imported constants

## Overview
将所有使用硬编码状态值和优先级值的文件更新为使用新建的常量。确保代码一致性，便于后续维护。

## Files to Update

Based on grep search results, these files need updates:

### Priority Files (from grep results):
- `frontend/src/views/workorder/WorkOrderForm.vue` - priority selector
- `frontend/src/views/workorder/WorkOrderDetail.vue` - status options
- `frontend/src/views/workorder/components/TaskSection.vue` - default priority
- `frontend/src/views/task/TaskList.vue` - priority filter
- `frontend/src/views/task/components/TaskFilters.vue` - priority filter
- `frontend/src/views/task/components/TaskDragDropList.vue` - priority
- `frontend/src/views/Dashboard.vue` - priority statistics
- `frontend/src/views/DashboardMobile.vue` - priority display

### Status Files (from grep results):
- `frontend/src/views/workorder/Detail.vue` - status checks and displays
- `frontend/src/views/workorder/WorkOrderForm.vue` - approval_status defaults
- `frontend/src/views/workorder/WorkOrderList.vue` - status validation
- `frontend/src/views/workorder/WorkOrderDetail.vue` - status options
- `frontend/src/views/workorder/components/TaskSection.vue` - task status
- `frontend/src/views/workorder/components/ProcessManagement.vue` - process status
- `frontend/src/views/workorder/components/TaskManagement.vue` - task status
- `frontend/src/views/workorder/components/ApprovalWorkflow.vue` - approval status
- `frontend/src/views/workorder/components/MaterialManagement.vue` - material status
- `frontend/src/views/workorder/components/DraftTaskManagement.vue` - task status
- `frontend/src/views/task/TaskList.vue` - task status
- `frontend/src/views/task/OperatorCenter.vue` - task status
- `frontend/src/views/task/components/TaskActions.vue` - task status
- `frontend/src/views/task/components/TaskCard.vue` - task status
- `frontend/src/views/task/components/TaskListView.vue` - task status
- `frontend/src/views/task/components/OperatorTaskList.vue` - task status
- `frontend/src/views/task/components/TaskStats.vue` - task statistics
- `frontend/src/views/Dashboard.vue` - status statistics
- `frontend/src/views/DashboardMobile.vue` - status navigation
- `frontend/src/views/dashboard/components/WorkOrderStatistics.vue` - work order status
- `frontend/src/views/dashboard/components/TaskStatistics.vue` - task status
- `frontend/src/components/TaskKanban.vue` - task status
- `frontend/src/components/VirtualTaskList.vue` - task status
- `frontend/src/components/ProcessFlowChart.vue` - process status
- `frontend/src/components/GanttChart.vue` - process status
- `frontend/src/components/TimelineView.vue` - status display
- `frontend/src/views/sales/SalesList.vue` - sales status
- `frontend/src/views/sales/SalesDetail.vue` - sales status
- `frontend/src/views/purchase/PurchaseList.vue` - purchase status
- `frontend/src/views/inventory/Delivery.vue` - delivery status
- `frontend/src/views/inventory/Quality.vue` - quality status
- `frontend/src/views/inventory/components/DeliveryTable.vue` - delivery status
- `frontend/src/views/finance/Statement.vue` - statement status
- `frontend/src/views/finance/Invoice.vue` - invoice status

## Import Pattern

```javascript
// Import individual constants
import { WorkOrderStatus, WorkOrderStatusChoices } from '@/constants/workOrderStatus'
import { TaskStatus, TaskStatusChoices } from '@/constants/taskStatus'
import { ApprovalStatus, ApprovalStatusChoices } from '@/constants/approvalStatus'
import { Priority, PriorityChoices } from '@/constants/priority'

// Or import all constants
import * as Constants from '@/constants'
```

## Usage Examples

### Before:
```javascript
data() {
  return {
    statusOptions: [
      { value: 'pending', label: '待开始' },
      { value: 'in_progress', label: '进行中' },
      { value: 'completed', label: '已完成' }
    ]
  }
}

if (this.workOrder.status === 'pending') {
  // do something
}
```

### After:
```javascript
import { WorkOrderStatus, WorkOrderStatusChoices } from '@/constants/workOrderStatus'

data() {
  return {
    statusOptions: WorkOrderStatusChoices
  }
}

if (this.workOrder.status === WorkOrderStatus.PENDING) {
  // do something
}
```

## Tasks

<task type="auto">
  <name>Update Detail.vue with constants</name>
  <files>frontend/src/views/workorder/Detail.vue</files>
  <action>Import and use constants in Detail.vue for status and priority values</action>
  <verify>grep -n "import.*constants\|WorkOrderStatus\|TaskStatus\|Priority" frontend/src/views/workorder/Detail.vue</verify>
  <done>Detail.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update WorkOrderForm.vue with constants</name>
  <files>frontend/src/views/workorder/WorkOrderForm.vue</files>
  <action>Import and use constants in WorkOrderForm.vue for status and priority values</action>
  <verify>grep -n "import.*constants\|Priority\|WorkOrderStatus\|ApprovalStatus" frontend/src/views/workorder/WorkOrderForm.vue</verify>
  <done>WorkOrderForm.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update WorkOrderList.vue with constants</name>
  <files>frontend/src/views/workorder/WorkOrderList.vue</files>
  <action>Import and use constants in WorkOrderList.vue for status values</action>
  <verify>grep -n "import.*constants\|WorkOrderStatus" frontend/src/views/workorder/WorkOrderList.vue</verify>
  <done>WorkOrderList.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update TaskList.vue with constants</name>
  <files>frontend/src/views/task/TaskList.vue</files>
  <action>Import and use constants in TaskList.vue for status and priority values</action>
  <verify>grep -n "import.*constants\|TaskStatus\|Priority" frontend/src/views/task/TaskList.vue</verify>
  <done>TaskList.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update TaskFilters.vue with constants</name>
  <files>frontend/src/views/task/components/TaskFilters.vue</files>
  <action>Import and use constants in TaskFilters.vue for status and priority values</action>
  <verify>grep -n "import.*constants\|TaskStatus\|Priority" frontend/src/views/task/components/TaskFilters.vue</verify>
  <done>TaskFilters.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update TaskSection.vue with constants</name>
  <files>frontend/src/views/workorder/components/TaskSection.vue</files>
  <action>Import and use constants in TaskSection.vue for status and priority values</action>
  <verify>grep -n "import.*constants\|TaskStatus\|Priority" frontend/src/views/workorder/components/TaskSection.vue</verify>
  <done>TaskSection.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update ProcessManagement.vue with constants</name>
  <files>frontend/src/views/workorder/components/ProcessManagement.vue</files>
  <action>Import and use constants in ProcessManagement.vue for status values</action>
  <verify>grep -n "import.*constants\|WorkOrderStatus\|TaskStatus" frontend/src/views/workorder/components/ProcessManagement.vue</verify>
  <done>ProcessManagement.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update ApprovalWorkflow.vue with constants</name>
  <files>frontend/src/views/workorder/components/ApprovalWorkflow.vue</files>
  <action>Import and use constants in ApprovalWorkflow.vue for approval status values</action>
  <verify>grep -n "import.*constants\|ApprovalStatus" frontend/src/views/workorder/components/ApprovalWorkflow.vue</verify>
  <done>ApprovalWorkflow.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update Dashboard.vue with constants</name>
  <files>frontend/src/views/Dashboard.vue</files>
  <action>Import and use constants in Dashboard.vue for status and priority values</action>
  <verify>grep -n "import.*constants\|WorkOrderStatus\|Priority" frontend/src/views/Dashboard.vue</verify>
  <done>Dashboard.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update DashboardMobile.vue with constants</name>
  <files>frontend/src/views/DashboardMobile.vue</files>
  <action>Import and use constants in DashboardMobile.vue for status and priority values</action>
  <verify>grep -n "import.*constants\|WorkOrderStatus\|Priority" frontend/src/views/DashboardMobile.vue</verify>
  <done>DashboardMobile.vue uses imported constants</done>
</task>

<task type="auto">
  <name>Update remaining task components</name>
  <files>frontend/src/views/task/components/</files>
  <action>Import and use constants in remaining task components (TaskActions.vue, TaskCard.vue, TaskListView.vue, OperatorTaskList.vue, TaskStats.vue, TaskDragDropList.vue)</action>
  <verify>grep -n "import.*constants\|TaskStatus\|Priority" frontend/src/views/task/components/*.vue</verify>
  <done>All task components use imported constants</done>
</task>

<task type="auto">
  <name>Update sales views with constants</parameter>
  <files>frontend/src/views/sales/</files>
  <action>Import and use constants in sales views for status values</action>
  <verify>grep -n "import.*constants\|SalesStatus" frontend/src/views/sales/*.vue</verify>
  <done>Sales views use imported constants</done>
</task>

<task type="auto">
  <name>Update purchase views with constants</name>
  <files>frontend/src/views/purchase/</files>
  <action>Import and use constants in purchase views for status values</action>
  <verify>grep -n "import.*constants\|PurchaseStatus" frontend/src/views/purchase/*.vue</verify>
  <done>Purchase views use imported constants</done>
</task>

<task type="auto">
  <name>Update inventory views with constants</name>
  <files>frontend/src/views/inventory/</files>
  <action>Import and use constants in inventory views for status values</action>
  <verify>grep -n "import.*constants\|DeliveryStatus\|QualityStatus" frontend/src/views/inventory/*.vue</verify>
  <done>Inventory views use imported constants</done>
</task>

<task type="auto">
  <name>Update finance views with constants</parameter>
  <files>frontend/src/views/finance/</files>
  <action>Import and use constants in finance views for status values</action>
  <verify>grep -n "import.*constants\|InvoiceStatus\|StatementStatus" frontend/src/views/finance/*.vue</verify>
  <done>Finance views use imported constants</done>
</task>

<task type="auto">
  <name>Update shared components with constants</name>
  <files>frontend/src/components/</files>
  <action>Import and use constants in shared components (TaskKanban.vue, VirtualTaskList.vue, ProcessFlowChart.vue, GanttChart.vue, TimelineView.vue)</action>
  <verify>grep -n "import.*constants\|WorkOrderStatus\|TaskStatus" frontend/src/components/*.vue</verify>
  <done>Shared components use imported constants</done>
</task>

## Verification
```bash
# Verify no hardcoded status/priority values remain (excluding constants files themselves)
echo "=== Checking for hardcoded status values ==="
grep -r "'pending'\|'in_progress'\|'completed'\|'cancelled'\|'draft'" frontend/src/views/ --include="*.vue" | grep -v "import\|constants\|label:|title:" | head -20

echo "=== Checking for hardcoded priority values ==="
grep -r "'low'\|'normal'\|'high'\|'urgent'" frontend/src/views/ --include="*.vue" | grep -v "import\|constants\|label:|title:" | head -10

# Verify imports exist
echo "=== Verifying imports in key files ==="
grep -l "import.*constants" frontend/src/views/workorder/*.vue
grep -l "import.*constants" frontend/src/views/task/*.vue
grep -l "import.*constants" frontend/src/views/Dashboard*.vue
```

## Expected Artifacts
All Vue files in `frontend/src/` should import and use constants instead of hardcoded strings.
