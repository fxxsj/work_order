# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** 创建即分派，审核即开工 - 施工单一经创建即可预览所有任务，审核通过后任务立即可用
**Current focus:** Phase 5: Universal Task Visibility - Wave 2 in progress

## Current Position

Phase: 5 of 10 (Universal Task Visibility)
Plan: 06 of 06 in current phase (Wave 2 complete)
Status: All plans in Phase 5 complete
Last activity: 2026-01-31T06:00:00Z — Completed Plan 05-06: Virtual Scroll Implementation

Progress: [████████████░░] 100% (14 of 16 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 17
- Average duration: 2.5 min
- Total execution time: 0.71 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-draft-task-foundation | 3 of 3 | 5 min | 1.7 min |
| 02-Task-Data-Consistency | 3 of 3 | 5 min | 1.7 min |
| 03-Dispatch-Configuration | 3 of 3 | 14 min | 4.7 min |
| 04-Task-Assignment-Core | 3 of 3 | 5 min | 1.7 min |
| 05-Universal-Task-Visibility | 6 of 6 | 14 min | 2.3 min |

**Recent Trend:**
- Last 5 plans: 05-06 (2min), 05-05 (2min), 05-03 (2min), 05-02 (2min), 05-01 (3min)
- Phase 5 complete - All tasks implemented and verified

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**From 05-06 (Virtual Scroll Implementation):**
- Added conditional rendering: standard el-table for <=100 items, VirtualTable for >100 items
- VirtualTable updated to support both `data` and `items` props for API compatibility
- VirtualTable modified to pass through el-table-column children directly
- Implementation pattern: duplicate column definitions for both table modes

**From 05-05 (Priority Filter Integration):**
- Added priority filter to Task List API targeting work_order__priority
- Frontend dropdown options: low, normal, high, urgent

**From 05-04 (skipped):**
- Batch operations UI was already integrated in 05-02

**From 05-03 (Batch operations API layer):**
- Batch delete only applies to draft tasks (status='draft' check)
- Permission model for batch delete: superuser or work order creator only
- Batch operations return partial success/failure with detailed error arrays
- BatchAssignDialog loads operators asynchronously on department change
- Frontend API methods follow consistent pattern: batchAssign, batchComplete, batchCancel, batchDelete

**From 05-02 (Universal Task List UI with batch operations):**
- Batch operation buttons in toolbar with selection state tracking
- Batch action dialog uses Command pattern for extensibility
- Batch actions filtered by permission: create → batch_delete, change → batch_assign/batch_cancel/batch_complete
- Partial success display with ElMessageBox for failed tasks
- Plan 02 provides UI layer that calls Plan 03 API methods

**From 05-01 (Enhanced Task List API):**
- Added related field serialization for work_order.work_order_number
- Added department_name and operator_name computed fields for search/filter
- Added is_draft computed field to distinguish draft vs formal tasks
- Support multi-field search (work_content, work_order_number, production_requirements)
- Support department_name and operator_name filtering via related field queries

**From 03-03 (Load balancing strategy):**
- LoadBalancingService calculates department load (pending + in_progress tasks)
- select_departments_by_load() selects least-loaded department among equal-priority options
- Hybrid dispatch mode: priority first, load balancing as tiebreaker
- Preview returns all_departments array with load information for all configured departments
- Color-coded load display: green (0-5), yellow (6-15), red (16+)
- "推荐选择" badge for least-loaded department in equal-priority group

**From 03-02 (Auto-dispatch service integration):**
- Global dispatch defaults to FALSE (disabled) for safe rollout
- Use Django cache for global toggle (cache key 'dispatch_global_enabled', no timeout)
- AutoDispatchService returns None when disabled (caller uses fallback logic)
- Auto-dispatch happens during draft-to-formal conversion (approval workflow)
- Frontend uses localStorage as fallback if API call fails
- Service layer pattern: AutoDispatchService encapsulates all dispatch logic
- Priority-based selection: order_by('-priority') iteration with department availability validation

**From 03-01 (Dispatch preview and configuration UI):**
- Dual-column layout for rule configuration (process list + department priority panel)
- DispatchPreviewService generates read-only preview of dispatch configuration
- Preview-confirm pattern: show effects before applying configuration changes
- Component separation: ProcessList, DepartmentPriorityPanel, DispatchPreviewTable
- localStorage for global dispatch toggle persistence (front-end only initially)

**From 02-03 (Frontend sync integration):**
- Automatic sync check after process changes rather than manual trigger
- Two-step prompting: initial confirm dialog + detailed SyncTaskPrompt preview
- Silent sync check failures to avoid blocking process operations
- Process ID extraction from processList using `p.process_id || p.id`
- Event-driven sync workflow: process change → check → prompt → sync → refresh

**From 02-02 (Bulk edit and delete operations for draft tasks):**
- DraftTaskBulkSerializer for batch validation (max 1000 tasks, draft status check)
- Django bulk_update with batch_size=100 for performance
- Null field handling in bulk edit (null = don't update field)
- Confirmation dialogs for destructive bulk operations
- Separate DraftTaskManagement component (shows only before approval)
- Element UI table selection with @selection-change handler

**From 02-01 (Differential sync algorithm with preview-confirm pattern):**
- Two-step sync process (preview + confirm) prevents accidental data loss
- Set operations for O(1) difference calculation performance
- select_for_update() locking prevents race conditions during sync
- Only draft tasks affected by sync operations (formal tasks untouched)
- Reused DraftTaskGenerationService.build_task_objects for consistency
- Preview-confirm pattern: read-only preview before atomic execution
- Service layer separation: TaskSyncService encapsulates sync logic

**From 01-03 (Approval workflow with draft-to-formal conversion):**
- Use bulk_update for task conversion performance (batch_size=100)
- Validate data integrity before conversion (work_content, work_order_process, process_code)
- Clean method over save override for validation (Django best practice)
- Transaction wrapping for atomic draft task operations
- Verification logging for cascade deletion (post-deletion orphan checks)
- Include task counts in approval notifications for user visibility

**From 01-02 (Draft task generation with bulk_create):**
- Draft tasks use status='draft' instead of 'pending' for clear state distinction
- Draft tasks are not assigned to departments/operators to avoid premature allocation
- Service layer pattern: DraftTaskGenerationService encapsulates task generation logic
- bulk_create with batch_size=100 achieves <2 second performance for 100 tasks
- Permission validation prevents editing draft tasks after work order approval

**From 01-01 (Draft task status foundation):**
- Draft status placed first in CHOICES to indicate it's the initial state
- Default status remains 'pending' - draft is only explicitly set during generation
- operational() method uses exclude() for clean query composition
- is_draft is a computed field to avoid schema changes

**From 04-01 (Supervisor assignment API):**
- Operator capacity limit: Default maximum of 10 active tasks per operator
- Permission hierarchy: Superuser > Work order creator > Department supervisor with change_workorder permission
- Task eligibility: Only pending and in_progress tasks can be assigned; draft, completed, cancelled tasks are rejected
- Row locking: Use select_for_update() to prevent race conditions during assignment
- Notification content: Include previous operator info for reassignments, support optional notes field

**From 04-02 (Operator self-claiming):**
- Concurrency control: select_for_update() prevents race conditions in multi-user scenarios
- Idempotent claim operation: Return already_claimed=True when operator claims task they already own
- Reused TaskAssignmentService.validate_operator_task_capacity for consistent capacity checks
- Department membership validation via PermissionCache.is_user_in_department
- Notification on claim: Created task_assigned notification to inform operator of successful claim

**From 04-02 (Operator self-claiming API):**
- Concurrency control: select_for_update() row-level locking serializes concurrent claims
- Self-service claiming: operators can claim unassigned tasks within their department
- Idempotent claim operation: returns already_claimed=True when claiming own task
- Validation chain: department membership → task capacity → task status → existing operator check
- Notification created on successful claim with work order reference
- Claimable tasks endpoint filters by user department, unassigned status, and pending status

**From 04-03 (Concurrency conflict detection):**
- TaskConflictError exception extends ConflictError with current_owner and task_id attributes
- 409 HTTP status code for concurrency conflicts (distinct from 403 permission, 400 business logic)
- Error response enrichment includes current_owner, task_id, and retry suggestion fields
- Frontend conflict detection via status code (409) or error code (task_conflict)
- MessageBox dialog shows conflict with current owner and offers page refresh as retry
- get_retry_suggestion centralizes error-to-retry mapping (can_retry, suggestion, action_text)

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

None yet.

## Session Continuity

Last session: 2026-01-31 06:00 UTC
Stopped at: Completed Phase 5 - All plans implemented
Next plan: Phase 6 (Pending - to be determined)
Resume file: None
