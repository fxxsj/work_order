---
phase: 01-draft-task-foundation
plan: 03
subsystem: business-logic
tags: [draft-tasks, approval-workflow, cascade-deletion, data-integrity, django-models]

# Dependency graph
requires:
  - phase: 01-draft-task-foundation
    plan: 01
    provides: draft task status foundation in WorkOrderTask model
  - phase: 01-draft-task-foundation
    plan: 02
    provides: DraftTaskGenerationService with bulk_create optimization
provides:
  - Draft task conversion to formal tasks on work order approval
  - Draft task deletion on work order rejection
  - Cascade deletion validation for work orders and associated tasks
  - Model-level constraints preventing draft task status bypass
affects: [task-assignment, task-execution, work-order-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Atomic transactions for data consistency
    - Bulk operations for performance (bulk_update with batch_size=100)
    - Model validation via clean() methods
    - Cascade deletion with verification logging
    - Error handling with try/except in approval workflow

key-files:
  created: []
  modified:
    - backend/workorder/models/core.py - Added convert_draft_tasks, delete_draft_tasks, and clean() methods
    - backend/workorder/views/work_orders.py - Integrated draft task handling in approve action, added destroy method

key-decisions:
  - Use bulk_update instead of individual saves for task conversion (performance optimization)
  - Validate data integrity before conversion (work_content, work_order_process, process_code)
  - Add clean() method instead of save() override for validation (Django best practice)
  - Log all cascade deletion operations for audit trail
  - Include task counts in approval notifications for user visibility

patterns-established:
  - Draft task lifecycle: create → (convert/delete on approval) → formal execution
  - Approval workflow atomicity: all-or-nothing transaction for task conversion
  - Cascade deletion verification: post-deletion orphan check for data integrity
  - Model-level validation: clean() prevents business rule violations

# Metrics
duration: 1min
completed: 2026-01-30
---

# Phase 1: Draft Task Foundation - Plan 3 Summary

**Draft task approval workflow with atomic conversion/deletion, cascade deletion validation, and model-level constraints preventing workflow bypass**

## Performance

- **Duration:** 1 min (96 seconds)
- **Started:** 2026-01-30T10:32:07Z
- **Completed:** 2026-01-30T10:33:43Z
- **Tasks:** 4 completed
- **Files modified:** 2
- **Commits:** 4

## Accomplishments

- **Draft task conversion on approval**: All draft tasks automatically convert to 'pending' status when work order is approved, with data integrity validation
- **Draft task deletion on rejection**: All draft tasks are cleanly deleted when work order is rejected, keeping database clean
- **Cascade deletion validation**: Work order deletion properly cascades to all associated draft tasks with verification logging
- **Model-level constraints**: WorkOrderTask.clean() prevents bypassing approval workflow by directly editing draft task status or assignments

## Task Commits

Each task was committed atomically:

1. **Task 1: Add convert_draft_tasks and delete_draft_tasks methods to WorkOrder** - `e65b128` (feat)
2. **Task 2: Integrate draft task handling into approve action** - `89b90d4` (feat)
3. **Task 3: Add cascade deletion validation for work orders** - `2ae62f6` (feat)
4. **Task 4: Add draft task constraint to WorkOrderTask model** - `cc747dd` (feat)

**Plan metadata:** Not yet committed

## Files Created/Modified

- `backend/workorder/models/core.py` - Added three methods:
  - `WorkOrder.convert_draft_tasks()` - Validates and converts draft tasks to pending
  - `WorkOrder.delete_draft_tasks()` - Deletes all draft tasks for rejected orders
  - `WorkOrderTask.clean()` - Validates draft task status changes and assignments
- `backend/workorder/views/work_orders.py` - Enhanced approval workflow:
  - Integrated convert_draft_tasks/delete_draft_tasks calls in approve action
  - Added destroy method override with cascade deletion validation
  - Added logging import and comprehensive logging
  - Updated notification content with task conversion/deletion counts

## Decisions Made

1. **Use bulk_update for performance**: Converting tasks with `bulk_update(['status'], batch_size=100)` is significantly faster than individual saves for large task counts
2. **Validate before conversion**: Data integrity checks (work_content, work_order_process, process_code) prevent corrupting formal tasks with incomplete draft data
3. **Clean method over save override**: Using Django's `clean()` method for validation follows best practices and integrates with ModelForm validation
4. **Transaction wrapping**: All draft task operations use `transaction.atomic()` to ensure all-or-nothing consistency
5. **Verification logging**: Post-deletion orphan checks provide audit trail and early warning of data integrity issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase:**
- Draft task lifecycle is complete (creation → conversion/deletion → execution)
- Approval workflow automatically handles draft tasks
- Data integrity constraints prevent workflow bypass
- Cascade deletion ensures no orphaned tasks

**No blockers or concerns.**

The approval workflow is now fully integrated with draft task management. When a work order is approved, draft tasks become formal tasks ready for assignment and execution. When rejected, draft tasks are cleanly removed. The system maintains data integrity through cascade deletion and model-level validation.

---
*Phase: 01-draft-task-foundation*
*Completed: 2026-01-30*
