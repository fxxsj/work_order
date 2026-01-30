# Project Research Summary

**Project:** 工单任务即时分派系统（印刷施工单管理系统）
**Domain:** Real-time Task Generation and Dispatch System for Work Order Management
**Researched:** 2026-01-30
**Confidence:** HIGH

## Executive Summary

This project is an **event-driven task management system** for printing industry work orders, requiring real-time task generation, intelligent dispatch, and multi-department collaboration. Experts build such systems using **service layer architecture** with **event-driven patterns** (Django Signals), **asynchronous task processing** (Celery + Redis), and **real-time communication** (Django Channels + WebSocket). The key shift is moving task generation from "when processes start" to "when work orders are created" with a draft → formal workflow.

The research recommends a **hybrid Push/Pull dispatch model** where tasks are auto-assigned to departments (Push) but operators can self-claim from department pools (Pull). This balances automation with flexibility. Critical risks include **N+1 query performance issues** when batch-creating tasks, **data consistency** during draft state edits, and **concurrent race conditions** during task claiming. These are mitigated by using `bulk_create()` with transactions, implementing differential update algorithms, and applying database row locks with `select_for_update()`.

The architecture leverages the **existing Django 4.2 + Vue 2.7 stack** with targeted additions: Django Channels 4.0 for WebSocket, Celery for background tasks, and `@vueuse/core` for frontend WebSocket integration. A service layer pattern separates business logic from ViewSets, enabling testability and reusability. Performance is addressed through composite database indexes, query optimization with `select_related`/`prefetch_related`, and frontend virtual scrolling for large task lists.

## Key Findings

### Recommended Stack

The system extends the existing Vue 2.7 + Django 4.2 foundation with real-time and async capabilities. The core philosophy is **leveraging existing infrastructure** while adding production-grade real-time features.

**Core technologies:**
- **Django 4.2 LTS** (existing) — Backend framework — LTS until April 2026, mature ORM and admin interface
- **Django Channels 4.0+** (existing) — WebSocket support — Native Django real-time, transforms to ASGI app
- **channels-redis 4.3.0** — Redis channel layer — Only official production backend for Channels 4.x
- **Celery 5.4+** — Async task queue — Industry standard for Django, excellent Redis broker support
- **@vueuse/core 10.x** — Vue WebSocket composable — Actively maintained, `useWebSocket` works with Vue 2.7
- **PostgreSQL 14+** — Production database — Superior concurrent access, JSONB for task metadata, advanced indexing

**Real-time communication stack:**
- Redis 7.2+ as message broker and channel layer
- Daphne as ASGI server for WebSocket connections
- WebSocket consumers for task dispatch notifications
- Message batching (100ms windows) for high-frequency updates (>10/sec)

**Database optimization:**
- Composite indexes on `(assigned_department, status)` for 40x faster filtered queries
- `bulk_create()` and `bulk_update()` for 25x faster batch operations
- `select_related()`/`prefetch_related()` to eliminate N+1 queries

### Expected Features

This is a **task dispatch enhancement** to an existing work order system, not a standalone product. Features focus on **task lifecycle management** from draft to completion.

**Must have (table stakes):**
- **Task draft state management** — Users expect to preview and edit tasks before formal publication
- **Department-level auto-dispatch** — Tasks must route to correct departments based on process mappings
- **Operator self-claiming** — Pull model allows operators to claim from department task pools
- **Manual supervisor assignment** — Push model enables supervisors to override auto-assignment
- **Basic permission control** — Role + department-based visibility (makers see all, operators see own tasks)
- **Task priority display** — Urgent tasks must be visually highlighted
- **Workload statistics** — Supervisors need to see department/operator task counts

**Should have (competitive):**
- **Hybrid Push/Pull dispatch** — Combines auto-assignment to departments with operator self-claiming for flexibility
- **Smart workload balancing** — Least-tasks strategy automatically selects operators with minimum workload
- **Real-time task notifications** — WebSocket push notifications when tasks are dispatched/claimed
- **Batch task operations** — Bulk publish, bulk assign, bulk delete draft tasks
- **Task search/filtering** — Multi-criteria filtering by status, department, operator, priority
- **Draft → formal workflow** — Tasks generated as drafts on work order creation, convert to formal on approval

**Defer (v2+):**
- **Skill-based dispatch** — Requires skill profiling system and matching algorithms (HIGH complexity)
- **Predictive scheduling** — Machine learning for completion time prediction (needs historical data)
- **Task pool visualization** — Kanban/Gantt views (nice-to-have, not essential)
- **Mobile task claiming** — PWA or native app (desktop-first is acceptable for v1)

### Architecture Approach

The recommended architecture follows **service layer pattern** with **event-driven orchestration**. Business logic is encapsulated in service classes (TaskGenerationService, TaskDispatchService) rather than scattered across ViewSets and Models. Django Signals decouple cross-cutting concerns like notifications and task generation triggers.

**Major components:**

1. **TaskGenerationService** — Generates draft tasks when work orders are created, converts drafts to formal on approval
   - Handles batch creation with `bulk_create()` for performance
   - Manages draft state transitions with transaction protection
   - Coordinates with TaskDispatchService for auto-assignment

2. **TaskDispatchService** — Implements pluggable dispatch strategies (least_tasks, random, skill_based)
   - Strategy pattern enables algorithm swapping without code changes
   - Uses `select_for_update()` for concurrent-safe claiming
   - Integrates with notification service for dispatch alerts

3. **WebSocket consumers (Django Channels)** — Real-time push notifications for task events
   - Redis channel layer for multi-server deployments
   - Message batching for high-frequency updates
   - Permission-based channel subscription (users only receive their department's notifications)

4. **Vue.js task management components** — TaskList, TaskDetail, TaskAssignment, TaskClaim
   - Uses `listPageMixin` and `crudPermissionMixin` for consistency
   - Integrates `@vueuse/useWebSocket` for reactive WebSocket handling
   - Vuex store (`task.js` module) centralizes task state

5. **Data consistency layer** — Differential update algorithm for draft task synchronization
   - Compares old/new process lists to identify added/removed processes
   - Only creates/deletes tasks for changed processes (not full regeneration)
   - Cascade deletion with soft-delete for audit trail

### Critical Pitfalls

The research identified **7 critical pitfalls** with high confidence based on codebase analysis and domain research.

1. **N+1 query problem in batch task creation** — Creating 100+ tasks in a loop with `save()` causes 5+ second response times. Use `bulk_create()` with batch size 500 for 25x performance improvement. Address in Phase 1.

2. **Data consistency during draft state edits** — Editing work orders after task generation creates orphaned or outdated tasks (deleted processes still have tasks, quantity changes not reflected). Implement differential update algorithm that syncs tasks to processes atomically. Address in Phase 2.

3. **Concurrent race conditions in task claiming** — Two operators can simultaneously claim the same task when check-then-act has time gap. Use `select_for_update()` row locks and atomic updates (`filter(id=X, assigned_operator__isnull=True).update(assigned_operator=user)`). Address in Phase 3.

4. **Frontend rendering performance with large task lists** — 100+ tasks with nested data cause DOM node explosion (>500 nodes), scroll lag (<30 FPS), and memory bloat. Use pagination (20-50 per page) or `vue-virtual-scroller` for 6-7x performance improvement. Address in Phase 4.

5. **Cascade impact of process modifications** — Adding/removing processes after work order approval leaves tasks orphaned or missing. Check task states before allowing process deletion, implement task preservation strategy for in-progress tasks. Address in Phase 5.

6. **Cross-department permission leaks** — Users may see other departments' tasks (including sensitive cost/price data) due to overly simple permission checks. Implement row-level security in querysets, role-based access control, and audit logging. Address in Phase 6.

7. **Backward compatibility with historical data** — Existing work orders lack draft-state tasks, causing reporting inconsistencies and "DoesNotExist" errors. Create data migration script to backfill tasks for old work orders, use feature flag to support old/new modes. Address in Phase 0.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 0: Data Migration Preparation (1-2 days)
**Rationale:** Addressing Pitfall #7 first ensures new code doesn't break existing work orders. Must happen before any logic changes.
**Delivers:** Migration script tested on production subset, feature flag infrastructure for dual-mode support
**Addresses:** Historical data compatibility, backward compatibility
**Avoids:** Pitfall #7 (data migration failures breaking old work orders)

### Phase 1: Task Draft System (2-3 days)
**Rationale:** Core feature — enables draft → formal workflow. Foundation for all subsequent features.
**Delivers:** `is_draft` field added to WorkOrderTask model, draft task generation on work order creation, draft → formal conversion on approval
**Addresses:** Task draft state management, department-level auto-dispatch
**Uses:** Django Signals (workorder_post_create, workorder_approved), TaskGenerationService
**Avoids:** Pitfall #1 (N+1 queries) by using `bulk_create()` with transactions

### Phase 2: Data Consistency Mechanisms (2-3 days)
**Rationale:** Draft editing breaks existing "generate once" assumption. Must ensure tasks sync with processes.
**Delivers:** Differential update algorithm, cascade deletion logic, atomic transaction wrappers
**Addresses:** Draft state editing, process-task synchronization
**Implements:** TaskGenerationService.sync_tasks_to_processes()
**Avoids:** Pitfall #2 (data consistency errors) and Pitfall #5 (cascade impact)

### Phase 3: Task Assignment & Claiming (3-4 days)
**Rationale:** Core dispatch functionality. Implements hybrid Push/Pull model.
**Delivers:** Manual supervisor assignment API, operator self-claim API, TaskDispatchService with pluggable strategies
**Addresses:** Manual supervisor assignment, operator self-claiming, smart workload balancing
**Uses:** Strategy pattern for dispatch algorithms, `select_for_update()` for concurrency control
**Avoids:** Pitfall #3 (concurrent race conditions) and Pitfall #6 (permission leaks)

### Phase 4: Frontend Task Management UI (3-4 days)
**Rationale:** User-facing features. Dependent on Phase 3 APIs.
**Delivers:** TaskList.vue, TaskDetail.vue, TaskAssignment.vue, TaskClaim.vue components, Vuex task module
**Addresses:** Task search/filtering, workload statistics display, priority display
**Uses:** `@vueuse/useWebSocket`, `vue-virtual-scroller`, listPageMixin
**Avoids:** Pitfall #4 (frontend rendering performance)

### Phase 5: Real-time Notifications (2-3 days)
**Rationale:** Enhances dispatch UX. Optional for MVP but high-value differentiator.
**Delivers:** WebSocket consumers for task events, notification service integration, frontend reactive updates
**Addresses:** Real-time task notifications, task status change alerts
**Uses:** Django Channels, channels-redis, Celery for async notification sending
**Implements:** Architecture Pattern 2 (Event-Driven Architecture)

### Phase 6: Batch Operations & Advanced Features (2-3 days)
**Rationale:** Power user features. Accelerate workflow for supervisors.
**Delivers:** Batch publish, batch assign department, batch delete APIs, task state history tracking
**Addresses:** Batch task operations, task state history
**Uses:** DRF bulk actions, transaction.atomic() for batch operations

### Phase 7: Performance Optimization (2-3 days)
**Rationale:** Hardening phase based on production metrics.
**Delivers:** Composite database indexes, query optimization, Redis caching for statistics
**Addresses:** System scalability, large dataset performance
**Uses:** Django ORM optimization patterns, Redis caching

### Phase 8: Testing & Documentation (2-3 days)
**Rationale:** Quality assurance before production deployment.
**Delivers:** Integration tests, performance tests, API documentation, user manual
**Addresses:** Production readiness, maintainability

### Phase Ordering Rationale

- **Phase 0 first** — Data migration is foundational; skipping it risks breaking old work orders
- **Phase 1 before Phase 2** — Draft system must exist before we can handle draft editing
- **Phase 2 before Phase 3** — Data consistency must be ensured before introducing dispatch complexity
- **Phase 3 before Phase 4** — Backend APIs needed for frontend UI
- **Phase 4 before Phase 5** — UI components needed to display real-time notifications
- **Phase 5-6 flexible order** — Notifications and batch ops are independent
- **Phase 7 last** — Optimization requires real usage data from earlier phases

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Task Assignment):** Skill-based dispatch strategy requires domain knowledge about operator skill profiling — research "how to model printing industry operator skills"
- **Phase 5 (Real-time Notifications):** WebSocket message batching strategy depends on actual task creation frequency — research "production task creation rate metrics"
- **Phase 7 (Performance Optimization):** Index effectiveness depends on query patterns — research "analyze production query logs before optimizing"

Phases with standard patterns (skip research-phase):
- **Phase 1 (Task Draft System):** Well-understood Django model + Signal pattern, high confidence
- **Phase 2 (Data Consistency):** Standard differential update algorithm, documented in ARCHITECTURE.md
- **Phase 4 (Frontend UI):** Vue 2.7 + Element UI patterns are established in codebase, use existing mixins
- **Phase 6 (Batch Operations):** DRF bulk actions are standard, use `get_bulk_destroy()` etc.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against official docs (Django 4.2, Channels 4.0, VueUse 10.x), codebase analysis confirms dependencies installed |
| Features | MEDIUM | Table stakes verified against multiple industry sources (field service, manufacturing dispatch), but printing-specific workflows need domain validation |
| Architecture | HIGH | Service layer + event-driven patterns are Django best practices, strategy pattern for dispatch is well-documented, codebase already uses Signals |
| Pitfalls | HIGH | All 7 pitfalls identified through direct code inspection (lines referenced), performance benchmarks backed by official Django docs, concurrent control verified against database best practices |

**Overall confidence:** HIGH

### Gaps to Address

- **Printing domain constraints:** Research assumes standard task dispatch, but printing may have special constraints (equipment occupancy, material prep time, drying times). Validate with domain experts during Phase 1 planning.
- **Operator skill modeling:** Skill-based dispatch strategy requires defining skill taxonomy (by process, equipment, or product?). Defer to Phase 3, research "printing operator skill frameworks" during that phase.
- **Task creation frequency:** WebSocket message batching strategy assumes high-frequency updates (>10/sec), but actual rate unknown. Monitor in Phase 5, add metrics to validate assumption.
- **Historical data volume:** Data migration complexity depends on number of existing work orders. Assess in Phase 0, may need to adjust migration strategy if >10,000 work orders exist.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** — Direct inspection of `/home/chenjiaxing/文档/work_order/backend/workorder/models/core.py` (lines 737-929 for task generation, 1232-1270 for optimistic locking), `/home/chenjiaxing/文档/work_order/backend/workorder/views/work_orders.py` (lines 84-125 for permissions)
- **Official documentation** — Django 4.2 ORM (bulk operations, select_for_update), Django Channels 4.0, DRF ViewSets, Vue 2.7 Composition API, Element UI components
- **Project documentation** — `/home/chenjiaxing/文档/work_order/CLAUDE.md` (existing stack, patterns, architecture)

### Secondary (MEDIUM confidence)
- **Field service management trends** — Multiple 2025-2026 industry articles on task dispatch, Push vs Pull patterns, workload balancing
- **Django performance optimization** — Community articles on N+1 query prevention, composite indexing, bulk operations
- **Vue.js rendering optimization** — Virtual scrolling vs pagination benchmarks (2024-2025)
- **Concurrent control patterns** — Database locking strategies, race condition prevention in task systems

### Tertiary (LOW confidence)
- **Printing industry workflows** — Generic manufacturing task scheduling, not specific to printing. Validate with domain experts.
- **Skill-based dispatch algorithms** — Machine learning approaches mentioned but not detailed. Research further in Phase 3.
- **WebSocket performance benchmarks** — Message batching recommendations based on general high-frequency patterns, not task-dispatch-specific. Monitor actual metrics in Phase 5.

---
*Research completed: 2026-01-30*
*Ready for roadmap: yes*
