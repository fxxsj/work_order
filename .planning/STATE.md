# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-31)

**Core value:** 创建即分派，审核即开工 - 施工单一经创建即可预览所有任务，审核通过后任务立即可用
**Current focus:** Phase 8: Real-time Notifications

## Current Position

Phase: 8 of 10 (Real-time Notifications)
Plan: 02A of 07 in current phase
Status: In progress
Last activity: 2026-02-01T01:09:57Z — Completed Plan 08-02A: Notification Model and WebSocket Consumer

Progress: [██████████████░░] 93% (24 of 28 plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 24
- Average duration: 2.3 min
- Total execution time: 0.82 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-draft-task-foundation | 3 of 3 | 5 min | 1.7 min |
| 02-Task-Data-Consistency | 3 of 3 | 5 min | 1.7 min |
| 03-Dispatch-Configuration | 3 of 3 | 14 min | 4.7 min |
| 04-Task-Assignment-Core | 3 of 3 | 5 min | 1.7 min |
| 05-Universal-Task-Visibility | 6 of 6 | 14 min | 2.3 min |
| 06-Work-Order-Task-Integration | 3 of 3 | 7 min | 2.3 min |
| 07-Role-Based-Task-Centers | 4 of 4 | 4 min | 1.0 min |
| 08-Real-time-Notifications | 3 of 7 | 3 min | 1.0 min |

**Recent Trend:**
- Last 3 plans: 08-02A (2min), 08-01B (0.5min), 08-01A (0.5min)
- Phase 8 in progress - Notification model with is_sent/data fields, WebSocket consumer with authentication and heartbeat

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**From 07-02 (Drag-and-Drop Task Assignment Interface):**
- TaskDragDropList.vue component provides intuitive drag-drop assignment interface using vuedraggable@2.24.3
- Unassigned tasks column on left, operator columns on right with task counts
- Visual feedback during drag: dashed blue border on valid drop zones
- Task cards display work content, order number, process, quantity, status, priority-colored borders
- Events emitted: task-assigned, task-reassigned, task-unassigned
- Confirmation dialogs in SupervisorDashboard before calling workOrderTaskAPI.assign()
- Data expansion pattern: flatten nested API responses (work_order__order_number, process_name)
- Load department tasks (page_size: 1000) and operators for drag-drop view
- Auto-refresh after successful assignment/reassignment/unassignment
- Reusable component pattern: TaskDragDropList can be used in other views

**From 07-01 (Supervisor Dashboard with Department Workload Statistics):**
- SupervisorDashboard.vue provides department-level task visibility for supervisors
- Backend endpoint /workorder-tasks/department_workload/ returns department summary and operator breakdown
- Summary statistics: total_tasks, pending_tasks, in_progress_tasks, completed_tasks, completion_rate
- Operator workload cards show individual task counts by status and completion rate
- Click-through navigation: operator cards navigate to task list with operator filter
- Permission check: requires workorder.change_workorder at API level (security)
- Auto-detects user's department if not specified in request
- Visual hierarchy: summary cards → operator cards → drill-down to task list
- Uses select_related for query optimization (avoid N+1 problems)

**From 07-04 (Operator Task Progress Update):**
- OperatorTaskUpdateDialog.vue combines progress update and completion in single component
- Dual-mode operation: increment mode for partial updates, complete mode for final completion
- Increment mode: quantity_increment input with max validation, defective quantity tracking, real-time progress projection
- Complete mode: completion reason textarea (optional), defective quantity input, auto-completes entire task
- Color-coded progress bar: green (≥100%), blue (50-99%), orange (0-49%)
- Permission-based UI: update/complete buttons only show on user's own tasks (isMyTask check)
- Version-based concurrency control: prevents overwriting concurrent updates (409 conflict response)
- Backend API already supports operator updates: update_quantity and complete actions with proper permissions
- Operator can only update their own assigned tasks; supervisors use task list for broader access

**From 07-03 (Operator Task Center with Assigned and Claimable Task Pools):**
- OperatorCenter.vue provides personalized view with two task pools (my_tasks, claimable_tasks)
- Backend endpoint /workorder-tasks/operator_center/ returns combined data in one call
- Summary statistics: my_total, my_pending, my_in_progress, my_completed, claimable_count
- My Tasks tabbed view filters by status: all, pending, in_progress
- One-click claim functionality with automatic data refresh
- Role-based access control: non-operators redirected to /tasks
- OperatorTaskList.vue card-based component with priority-colored borders
- Uses existing TaskAssignmentService.get_claimable_tasks_for_user() for consistency
- Performance limits: 100 my_tasks, 50 claimable_tasks

**From 06-01 (Task Display Section Integration):**
- TaskSection.vue component created with stats header and task table
- Props: workOrderId, tasks, editable, loading
- Integrated into WorkOrderForm after materials section
- Task fetching using workOrderTaskAPI in edit mode

**From 06-02 (Inline Task Editing):**
- Role-based permission: only makers/sales staff can edit draft tasks
- Superuser bypass for full access
- Only draft tasks (status='draft') are editable via inline edit
- Bulk edit null values mean "don't update field" for partial updates
- Permission check requires: makers/sales group + workorder.change_workorder permission

**From 06-03 (Task Statistics and Manual Addition):**
- Progress percentage = (completed tasks / total tasks) × 100 using existing status field
- Assignment status unified in single column with department/operator format
- Manual tasks created with draft status for consistency with auto-generated tasks
- Color-coded tags: green for assigned, gray for "未分派"

**From 07-01 (Supervisor Dashboard):**
- Department workload API aggregates tasks by operator with completion rate calculation
- Query optimization using select_related for assigned_department, assigned_operator
- Circular progress component using SVG with stroke-dasharray animation
- Permission check: requires workorder.change_workorder for supervisor access
- Auto-detects user's department if department_id not provided

**From 07-02 (Drag-Drop Assignment):**
- vuedraggable@2.24.3 used for drag-and-drop functionality
- Task cards have priority-colored left borders (red=urgent, orange=high, yellow=normal, gray=low)
- Confirmation dialogs for all assignment operations (assign, reassign, unassign)
- Event-driven architecture: child emits events, parent handles API calls
- Visual feedback: dashed blue border on drag-over columns

**From 07-03 (Operator Center):**
- operator_center API returns combined data: my_tasks + claimable_tasks + summary
- Limits: max 100 assigned tasks, max 50 claimable tasks to prevent overfetching
- Role-based access control: non-operators redirected to /tasks
- Two-pool layout: My Tasks (tabbed) | Claimable Tasks (list)
- One-click claim with immediate data refresh

**From 07-04 (Operator Progress Updates):**
- OperatorTaskUpdateDialog combines increment and complete modes in one component
- Increment mode: quantity input with max validation (remaining quantity)
- Complete mode: completion reason textarea + defective quantity input
- Progress bar color coding: green ≥100%, blue 50-99%, orange 0-49%
- Version-based concurrency control with 409 conflict handling
- Permission-aware UI: update/complete buttons only on user's own tasks

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

**From 08-01A (Channels Infrastructure Setup):**
- Channels dependencies installed: channels>=4.0.0, daphne>=4.0.0, redis>=5.0.0
- Django settings configured with 'channels' in INSTALLED_APPS
- ASGI_APPLICATION points to 'config.asgi.application'
- Environment-based CHANNEL_LAYERS: Redis backend when REDIS_URL is set, InMemoryChannelLayer for development
- Channel layer communications encrypted with SECRET_KEY when using Redis backend

**From 08-01B (ASGI Application Entry Point):**
- Created backend/config/asgi.py with ProtocolTypeRouter for HTTP/WebSocket routing
- WebSocket connections authenticated via AuthMiddlewareStack (scope["user"] available in consumers)
- AllowedHostsOriginValidator validates WebSocket origin against ALLOWED_HOSTS setting
- URLRouter routes ws/notifications/ pattern to NotificationConsumer from services.realtime_notification
- HTTP requests continue to work via Django's ASGI handler (backward compatible)
- WSGI application remains functional for development server compatibility

**From 08-02A (Notification Model and WebSocket Consumer):**
- Notification model updated with is_sent BooleanField for WebSocket delivery tracking
- Notification model updated with data JSONField for structured notification payload
- Added index on created_at for efficient 30-day retention queries
- NotificationConsumer authentication check with explicit rejection (WebSocket close code 4001)
- Connection_established confirmation message sent after successful WebSocket connection
- Heartbeat_message handler implemented for connection keep-alive
- User-specific channel naming pattern: user_{user_id}_notifications for multi-user support
- Proper logging for connection/disconnection events for production monitoring

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

None yet.

## Session Continuity

Last session: 2026-02-01 01:09 UTC
Stopped at: Completed Plan 08-02A - Notification Model and WebSocket Consumer
Next plan: 08-02B (Database Migration for Notification Fields)
Resume file: None
