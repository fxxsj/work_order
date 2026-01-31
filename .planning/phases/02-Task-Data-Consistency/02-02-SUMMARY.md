---
phase: 02-Task-Data-Consistency
plan: 02
subsystem: api
tags: [bulk-operations, draft-tasks, vue, element-ui, django-rest-framework]

# Dependency graph
requires:
  - phase: 01-draft-task-foundation
    provides: DraftTaskSerializer, draft task status model, draft generation service
provides:
  - DraftTaskBulkSerializer for validating batch operations
  - Bulk API endpoints (bulk_update, bulk_delete) for draft tasks
  - Frontend bulk operation UI with table selection
  - DraftTaskManagement component for pre-approval task management
affects: [02-03, task-assignment, work-order-approval]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Bulk operations with Django bulk_update (batch_size=100)
    - Element UI table selection for batch operations
    - Serializer validation for batch data integrity
    - Dedicated component for draft task management (before approval)

key-files:
  created:
    - frontend/src/views/workorder/components/DraftTaskManagement.vue
  modified:
    - backend/workorder/serializers/core.py
    - backend/workorder/views/work_order_tasks.py
    - frontend/src/api/modules/workorder-task.js
    - frontend/src/views/workorder/WorkOrderDetail.vue

key-decisions:
  - Use DraftTaskBulkSerializer for validation instead of inline validation in views
  - Limit bulk operations to 1000 tasks to prevent memory exhaustion
  - Only allow bulk operations on draft status tasks (non-draft protected)
  - Separate DraftTaskManagement component that only shows when work order is not approved
  - Null field handling in bulk edit (null = don't update this field)

patterns-established:
  - Pattern: Bulk serializers validate both data integrity and business rules
  - Pattern: UI components hide/show based on work order state (approval_status)
  - Pattern: Confirmation dialogs for destructive bulk operations
  - Pattern: Element UI table selection with @selection-change handler

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 02: Task Data Consistency - Plan 02 Summary

**Bulk edit and delete operations for draft tasks with Django bulk_update and Element UI table selection**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-01-31T01:09:05Z
- **Completed:** 2026-01-31T01:11:20Z
- **Tasks:** 4
- **Files modified:** 4 (2 backend, 2 frontend)

## Accomplishments

- DraftTaskBulkSerializer validates batch operations (max 1000 tasks, draft status check, priority validation)
- Backend bulk_update endpoint at POST /api/workorder-tasks/bulk_update/ for batch updating draft tasks
- Backend bulk_delete endpoint at POST /api/workorder-tasks/bulk_delete/ for batch deleting draft tasks
- Frontend workOrderTaskAPI.bulkUpdate() and bulkDelete() methods calling backend endpoints
- DraftTaskManagement component with Element UI table selection and bulk action buttons
- Bulk edit dialog with nullable fields (leave blank = don't update)
- Confirmation dialog before bulk deletion prevents accidental data loss
- Component only shows when work order is not approved (approval_status !== 'approved')

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DraftTaskBulkUpdateSerializer** - `24d5987` (feat)
2. **Task 2: Add bulk update and delete API endpoints** - `2528fe4` (feat)
3. **Task 3: Add bulk operation methods to workOrderTask API** - `b45bdbe` (feat)
4. **Task 4: Add bulk operation UI to WorkOrderDetail component** - `8818a1c` (feat)

**Plan metadata:** (not yet committed - will be in final commit)

## Files Created/Modified

### Created

- `frontend/src/views/workorder/components/DraftTaskManagement.vue` - Draft task management component with table selection, bulk edit dialog, and bulk delete confirmation

### Modified

- `backend/workorder/serializers/core.py` - Added DraftTaskBulkSerializer with validation for batch operations (max 1000 tasks, draft status check, priority and quantity validation)
- `backend/workorder/views/work_order_tasks.py` - Added @action methods bulk_update and bulk_delete to WorkOrderTaskViewSet
- `frontend/src/api/modules/workorder-task.js` - Added bulkUpdate() and bulkDelete() methods to WorkOrderTaskAPI class
- `frontend/src/views/workorder/WorkOrderDetail.vue` - Imported and integrated DraftTaskManagement component between ApprovalWorkflow and ArtworkAndDieInfo sections

## Decisions Made

1. **DraftTaskBulkSerializer for validation** - Centralized validation in serializer is more maintainable than inline validation in view methods. Validates max 1000 tasks, draft status requirement, priority values, and non-negative production quantities.

2. **1000 task limit for bulk operations** - Prevents memory exhaustion and DOS attacks while allowing practical batch sizes. Users can split larger operations into multiple batches.

3. **Null field handling in bulk edit** - Following the pattern of "leave blank = don't update", users can selectively update only the fields they need. This is more flexible than requiring all fields.

4. **Separate DraftTaskManagement component** - Creates a dedicated UI for draft task management that only appears before work order approval. This keeps the main process/task views clean and focused.

5. **Confirmation dialogs for deletion** - Prevents accidental bulk data loss by requiring explicit user confirmation before deleting multiple draft tasks.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### What's ready

- Bulk operation infrastructure complete for draft tasks
- UI component integrated into work order detail page
- Frontend-backend API communication established
- Validation and error handling in place

### Any blockers or concerns

- None identified
- Ready for next phase: 02-03 (Task data consistency validation or dependent functionality)

### Integration notes

- DraftTaskManagement component emits @refresh event to reload work order data after bulk operations
- Parent component (WorkOrderDetail) already has fetchWorkOrderDetail method to handle refresh
- Component filters draft tasks from all processes in the work order using status === 'draft'

---
*Phase: 02-Task-Data-Consistency*
*Plan: 02*
*Completed: 2026-01-31*
