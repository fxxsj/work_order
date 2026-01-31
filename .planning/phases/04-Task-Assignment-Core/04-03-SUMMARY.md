---
phase: 04-Task-Assignment-Core
plan: 03
subsystem: task-assignment
tags: [conflict-detection, error-handling, django-rest-framework, vue, element-ui]

# Dependency graph
requires:
  - phase: 04-Task-Assignment-Core
    plan: 04-02
    provides: claim_task service with select_for_update locking
provides:
  - TaskConflictError exception with current_owner and task_id attributes
  - 409 Conflict status code for concurrent task assignment/claiming
  - Frontend conflict detection with MessageBox dialog and refresh option
  - Retry suggestion system based on error type
affects:
  - Frontend task list and detail pages
  - Future assignment workflows requiring conflict handling

# Tech tracking
tech-stack:
  added:
    - TaskConflictError exception (extends ConflictError)
    - get_retry_suggestion utility method
    - ErrorHandler.isConflictError method
    - ErrorHandler.handleTaskError method
    - ErrorHandler.showConflictMessage with MessageBox
  patterns:
    - 409 HTTP status for concurrency conflicts
    - Error-specific retry suggestions (can_retry, suggestion, action_text)
    - Frontend conflict dialog with page refresh option
    - Error response enrichment (current_owner, task_id, retry)

key-files:
  created: []
  modified:
    - backend/workorder/exceptions.py
    - backend/workorder/services/task_assignment.py
    - backend/workorder/views/work_order_tasks/task_main.py
    - frontend/src/utils/errorHandler.js
    - frontend/src/api/modules/workorder-task.js

key-decisions:
  - "TaskConflictError extends ConflictError for consistency with DRF exception hierarchy"
  - "409 status code signals concurrency conflicts (distinct from 403 permission, 400 business logic)"
  - "Error response includes current_owner, task_id, and retry suggestion for client handling"
  - "Frontend MessageBox dialog offers page refresh as retry mechanism"
  - "get_retry_suggestion centralizes error-to-retry mapping logic"

patterns-established:
  - "Conflict error pattern: 409 status + error attributes (current_owner, task_id) + retry info"
  - "Frontend error detection: status code OR error code for flexibility"
  - "Callback-based error handling: onConflict, onPermission, onOther hooks"
  - "Idempotent operation: self-claim returns already_claimed=True (prevents false conflicts)"

# Metrics
duration: 2min
completed: 2026-01-31
---

# Phase 04: Task Assignment Core - Plan 03 Summary

**TaskConflictError exception with 409 status code, frontend conflict dialog with refresh option, and retry suggestion system for concurrent task assignment/claiming**

## Performance

- **Duration:** 2 min (113 seconds)
- **Started:** 2026-01-31T04:05:26Z
- **Completed:** 2026-01-31T04:07:19Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- **TaskConflictError exception** - Custom exception class extending ConflictError with current_owner and task_id attributes for tracking task ownership during conflicts
- **409 status code handling** - Viewset returns HTTP 409 Conflict for TaskConflictError with enriched error response including current_owner, task_id, and retry suggestions
- **Frontend conflict detection** - ErrorHandler detects 409 status or task_conflict code, displays MessageBox dialog with current owner and refresh button
- **Retry suggestion system** - get_retry_suggestion method provides can_retry, suggestion, and action_text based on error type (conflict/permission/business logic)
- **Enhanced error handling** - claim_taskWithErrorHandling and assignToOperatorWithErrorHandling methods in API module with automatic success messages and conflict handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Add TaskConflictError exception and enhance conflict detection** - `10d0f82` (feat)
2. **Task 2: Update viewset to return 409 status for conflict errors** - `766fd94` (feat)
3. **Task 3: Add conflict error handling to frontend errorHandler** - `4d5ede4` (feat)

**Plan metadata:** (to be added in final commit)

## Files Created/Modified

### Modified

- `backend/workorder/exceptions.py` - Added TaskConflictError class with current_owner, task_id attributes, custom __str__ method
- `backend/workorder/services/task_assignment.py` - Import TaskConflictError, update claim_task to use it, add get_retry_suggestion static method
- `backend/workorder/views/work_order_tasks/task_main.py` - Import TaskConflictError, update assign and claim exception handlers to return 409 with retry info
- `frontend/src/utils/errorHandler.js` - Add isConflictError, isPermissionError, handleTaskError, showConflictMessage methods; update handle to check detail field
- `frontend/src/api/modules/workorder-task.js` - Import ErrorHandler, add claimTaskWithErrorHandling and assignToOperatorWithErrorHandling methods

## Decisions Made

### TaskConflictError Design
- Extends ConflictError to maintain consistency with DRF exception hierarchy
- Uses 409 status code (HTTP Conflict) - distinct from 403 (Forbidden) and 400 (Bad Request)
- Includes current_owner and task_id attributes for frontend display and debugging
- Custom __str__ method provides readable conflict message

### Error Response Enrichment
- Viewset adds current_owner, task_id, and retry fields to conflict error responses
- retry field contains: can_retry (boolean), suggestion (text), action_text (button label), current_owner (username)
- Enables frontend to provide context-aware retry options

### Frontend Conflict Detection
- Dual detection: checks both status code (409) and error code (task_conflict) for flexibility
- MessageBox dialog shows conflict message with current owner and offers refresh button
- Page refresh as retry mechanism ensures user sees latest task state

### Retry Suggestion System
- get_retry_suggestion centralizes error-to-retry mapping
- Returns can_retry flag, suggestion text, and action button text
- Different suggestions: conflict (refresh page), permission (contact admin), business logic (read-only)

## Deviations from Plan

None - plan executed exactly as written.

All tasks completed according to specifications:
1. TaskConflictError added with current_owner and task_id attributes
2. claim_task uses TaskConflictError for concurrent claims
3. Viewset returns 409 status with enriched error response
4. Frontend ErrorHandler detects 409/task_conflict and shows dialog
5. API module methods include error handling wrappers

## Issues Encountered

None.

All implementation proceeded smoothly without errors or unexpected issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

### Ready
- Complete conflict detection system for task assignment/claiming
- Frontend error handling with user-friendly conflict dialogs
- Retry mechanism (page refresh) for conflict recovery
- Extensible error response format for future error types

### Blockers/Concerns
- None identified

### Testing Recommendations
- Test concurrent claim attempts (two users claiming same task simultaneously)
- Verify 409 status returned for conflicts, 403 for permissions, 400 for business logic
- Confirm MessageBox dialog displays current owner correctly
- Validate page refresh resolves conflict state

---
*Phase: 04-Task-Assignment-Core*
*Completed: 2026-01-31*
