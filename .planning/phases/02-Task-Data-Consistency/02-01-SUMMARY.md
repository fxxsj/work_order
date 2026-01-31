---
phase: 02-Task-Data-Consistency
plan: 01
subsystem: task-management
tags: [task-sync, differential-update, three-way-sync, atomic-operations, django-rest-framework]

# Dependency graph
requires:
  - phase: 01-draft-task-foundation
    provides: DraftTaskGenerationService, draft task generation workflow
provides:
  - TaskSyncService with preview_sync and execute_sync methods
  - Sync preview API endpoint (POST /api/workorders/{id}/sync_tasks_preview/)
  - Sync execute API endpoint (POST /api/workorders/{id}/sync_tasks_execute/)
  - Check sync needed API endpoint (GET /api/workorders/{id}/check_sync_needed/)
affects: [frontend-task-management, bulk-task-operations]

# Tech tracking
tech-stack:
  added: []
  patterns: [three-way-synchronization, differential-update-algorithm, atomic-sync-operations, preview-confirm-pattern]

key-files:
  created:
    - backend/workorder/services/task_sync_service.py
  modified:
    - backend/workorder/views/work_orders.py

key-decisions:
  - "Two-step sync process (preview + confirm) prevents accidental data loss"
  - "Set operations for O(1) difference calculation performance"
  - "select_for_update() locking prevents race conditions during sync"
  - "Only draft tasks affected by sync (formal tasks untouched)"
  - "Reused DraftTaskGenerationService.build_task_objects for consistency"

patterns-established:
  - "Three-way synchronization algorithm: calculate set differences, add new, remove deleted"
  - "Preview-confirm pattern: read-only preview changes before atomic execution"
  - "Differential update: only modify changed items, not full regeneration"
  - "Service layer separation: sync logic in TaskSyncService, endpoints in ViewSet"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 02: Task Data Consistency Summary

**Differential task synchronization algorithm with three-way set operations and preview-confirm pattern, preventing orphaned tasks when work order processes change**

## Performance

- **Duration:** 2 min (150 seconds)
- **Started:** 2026-01-31T01:08:33Z
- **Completed:** 2026-01-31T01:10:23Z
- **Tasks:** 4
- **Files modified:** 2

## Accomplishments

- Created TaskSyncService with preview_sync (read-only) and execute_sync (atomic) methods
- Implemented three-way synchronization algorithm using Python set operations for O(1) performance
- Added sync preview API endpoint for change visualization before execution
- Added sync execute API endpoint with confirmed flag requirement to prevent accidental execution
- Added check_sync_needed endpoint for frontend to detect process changes
- All sync operations only affect draft tasks (status='draft'), formal tasks remain untouched
- Used select_for_update() locking to prevent race conditions during concurrent modifications

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TaskSyncService with preview and sync methods** - `ad97510` (feat)
2. **Task 2: Add sync preview API endpoint** - `60269a6` (feat)
3. **Task 3: Add sync execute API endpoint** - `e1c2ac9` (feat)
4. **Task 4: Add check_sync_needed endpoint for process change detection** - `3a85a7f` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

- `backend/workorder/services/task_sync_service.py` - TaskSyncService class with preview_sync and execute_sync methods, implements three-way synchronization algorithm using set operations
- `backend/workorder/views/work_orders.py` - Added sync_tasks_preview, sync_tasks_execute, and check_sync_needed actions to WorkOrderViewSet

## Decisions Made

- **Two-step sync process**: Preview endpoint calculates changes without modifying database, execute endpoint requires confirmed=true flag
- **Set-based differential updates**: Use Python set() operations for O(1) difference calculation instead of list comparisons
- **Concurrency protection**: select_for_update() locks work_order during sync to prevent race conditions
- **Atomic transactions**: @transaction.atomic decorator ensures all-or-nothing execution with automatic rollback on failure
- **Draft task isolation**: Only tasks with status='draft' are affected by sync, formal tasks (pending/in_progress/completed) remain untouched
- **Service layer pattern**: TaskSyncService encapsulates sync logic, ViewSet endpoints delegate to service methods
- **Bulk operations**: Use bulk_create with batch_size=100 for efficient task creation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for Phase 02-02 (Bulk Draft Task Operations):**
- TaskSyncService provides foundation for process-to-task synchronization
- Sync preview and execute endpoints are available for frontend integration
- check_sync_needed endpoint allows frontend to detect when sync is required
- Only draft tasks are affected, ensuring formal tasks remain stable

**Considerations for next phase:**
- Frontend should call check_sync_needed after process updates to detect changes
- Frontend should present sync preview to user before calling sync execute endpoint
- Sync operations use bulk_create with batch_size=100 for performance (tested in Phase 01-02)
- Consider adding sync to process update workflow for automatic task updates

---
*Phase: 02-Task-Data-Consistency*
*Completed: 2026-01-31*
