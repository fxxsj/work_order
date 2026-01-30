# Roadmap: 印刷施工单任务即时分派系统

## Overview

Transform the printing work order system from reactive task generation (on process start) to proactive task generation (on work order creation). The journey begins with core draft task management and approval workflows, builds intelligent dispatch with priority configuration, delivers role-based task management interfaces, enhances with real-time notifications, and concludes with performance hardening and production readiness.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Draft Task Foundation** - Implement draft task generation and approval workflow
- [ ] **Phase 2: Task Data Consistency** - Ensure tasks stay synchronized with process changes
- [ ] **Phase 3: Dispatch Configuration** - Build priority-based department dispatch system
- [ ] **Phase 4: Task Assignment Core** - Implement supervisor assignment and operator claiming
- [ ] **Phase 5: Universal Task Visibility** - Global task listing with filtering and search
- [ ] **Phase 6: Work Order Task Integration** - Embed task management in work order pages
- [ ] **Phase 7: Role-Based Task Centers** - Dedicated supervisor and operator interfaces
- [ ] **Phase 8: Real-time Notifications** - WebSocket-powered task event notifications
- [ ] **Phase 9: Performance Optimization** - Database indexes, caching, and query optimization
- [ ] **Phase 10: Production Hardening** - Final testing, documentation, and deployment preparation

## Phase Details

### Phase 1: Draft Task Foundation

**Goal**: Enable immediate task generation when work orders are created, with draft-to-formal conversion on approval

**Depends on**: Nothing (first phase)

**Requirements**: TASK-01, TASK-02, TASK-05, TASK-06, PERF-01, CONS-03, CONS-04

**Success Criteria** (what must be TRUE):
1. User creates a work order and immediately sees all generated tasks in draft status
2. Draft tasks display visual indicators distinguishing them from formal tasks
3. User approves a work order and all draft tasks automatically convert to formal status
4. User rejects a work order and all draft tasks are automatically deleted
5. Batch task creation completes in under 2 seconds for 100-task work orders

**Plans**: 3 plans

Plans:
- [ ] 01-01: Add draft status field and update task model with draft constraints
- [ ] 01-02: Implement draft task generation service with bulk_create optimization
- [ ] 01-03: Build approval workflow with draft-to-formal conversion and cascade deletion

### Phase 2: Task Data Consistency

**Goal**: Maintain synchronization between work order processes and generated tasks throughout edits

**Depends on**: Phase 1

**Requirements**: TASK-03, TASK-04, CONS-02

**Success Criteria** (what must be TRUE):
1. User modifies work order processes and receives prompt to update existing tasks
2. System adds new tasks for added processes and removes tasks for deleted processes
3. User can bulk edit draft tasks (quantity, priority, notes) in a single operation
4. User can bulk delete unwanted draft tasks before work order approval
5. Process changes never leave orphaned or duplicate tasks

**Plans**: 2 plans

Plans:
- [ ] 02-01: Build differential update algorithm to sync tasks with process changes
- [ ] 02-02: Implement bulk edit and bulk delete operations for draft tasks

### Phase 3: Dispatch Configuration

**Goal**: Provide configurable priority-based department assignment rules

**Depends on**: Phase 1

**Requirements**: DISP-01, DISP-02, DISP-06, CFG-01, CFG-02, CFG-03, CFG-04

**Success Criteria** (what must be TRUE):
1. Administrator accesses configuration page showing all process-department mappings
2. Administrator sets priority order for departments assigned to each process
3. System automatically dispatches tasks to highest-priority department when work order is approved
4. Administrator enables/disables dispatch rules for specific processes
5. Configuration preview shows which department will receive tasks for each process

**Plans**: 3 plans

Plans:
- [ ] 03-01: Build department-process priority configuration model and admin interface
- [ ] 03-02: Implement auto-dispatch service with priority-based selection
- [ ] 03-03: Add workload balancing strategy (least-tasks department selection)

### Phase 4: Task Assignment Core

**Goal**: Enable manual supervisor assignment and operator self-claiming with concurrency control

**Depends on**: Phase 3

**Requirements**: DISP-03, DISP-04, DISP-05, CONS-01

**Success Criteria** (what must be TRUE):
1. Department supervisor assigns task to specific operator from their department
2. Operator claims unassigned task and becomes the assigned operator
3. System prevents two operators from simultaneously claiming the same task
4. Task can only be assigned to one operator at a time
5. Assignment fails gracefully with clear error message if operator already has maximum tasks

**Plans**: 3 plans

Plans:
- [ ] 04-01: Implement supervisor assignment API with permission validation
- [ ] 04-02: Build operator self-claiming API with optimistic locking (select_for_update)
- [ ] 04-03: Add concurrency conflict detection and user-friendly error handling

### Phase 5: Universal Task Visibility

**Goal**: Provide comprehensive task listing with filtering, search, and batch operations

**Depends on**: Phase 4

**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, PAGE-01, PAGE-02, PAGE-03, PAGE-04, PAGE-05, AUTH-01, PERF-03, PERF-05

**Success Criteria** (what must be TRUE):
1. User accesses task management page and sees all tasks they're permitted to view
2. User filters tasks by department, status, assignee, and priority
3. User searches tasks by task number, work order number, or content description
4. User performs bulk operations (assign, delete, status change) on selected tasks
5. Task list renders smoothly with 100+ tasks using virtual scrolling

**Plans**: 4 plans

Plans:
- [ ] 05-01: Build task list API with filtering, search, and permission-based querysets
- [ ] 05-02: Create TaskList.vue component with virtual scrolling and bulk selection
- [ ] 05-03: Implement batch operation APIs (bulk assign, bulk delete, bulk status update)
- [ ] 05-04: Add task export functionality with filtered data

### Phase 6: Work Order Task Integration

**Goal**: Embed task management directly into work order creation and editing pages

**Depends on**: Phase 1

**Requirements**: WO-01, WO-02, WO-03, WO-04, WO-05, AUTH-04

**Success Criteria** (what must be TRUE):
1. User creates work order and sees all generated tasks in dedicated task section
2. User edits draft tasks directly from work order page without leaving
3. Work order page shows real-time task count and assignment status
4. User manually adds extra tasks beyond auto-generated ones
5. Makers and sales staff can edit draft tasks, other roles cannot

**Plans**: 3 plans

Plans:
- [ ] 06-01: Integrate task display section into work order create/edit forms
- [ ] 06-02: Add inline task editing controls for draft tasks
- [ ] 06-03: Implement task statistics display and manual task addition

### Phase 7: Role-Based Task Centers

**Goal**: Deliver specialized interfaces for supervisors and operators

**Depends on**: Phase 5

**Requirements**: SUP-01, SUP-02, SUP-03, SUP-04, SUP-05, OP-01, OP-02, OP-03, OP-04, OP-05, AUTH-02, AUTH-03

**Success Criteria** (what must be TRUE):
1. Department supervisor views dashboard showing all department tasks and operator workloads
2. Supervisor drags and drops tasks to assign them to operators
3. Supervisor sees workload statistics for each operator (task count, completion rate)
4. Operator views personalized task center showing assigned and claimable tasks
5. Operator updates task progress and completion quantities directly

**Plans**: 4 plans

Plans:
- [ ] 07-01: Build supervisor dashboard with department task view and workload statistics
- [ ] 07-02: Implement drag-and-drop task assignment interface
- [ ] 07-03: Create operator task center with assigned and claimable task pools
- [ ] 07-04: Add operator task progress update and completion tracking

### Phase 8: Real-time Notifications

**Goal**: Deliver instant task event notifications via WebSocket

**Depends on**: Phase 7

**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04

**Success Criteria** (what must be TRUE):
1. Operator receives browser notification when task is assigned to them
2. Supervisor receives notification when operator claims or completes task
3. Notifications appear in real-time without page refresh
4. User accesses notification history showing all past task events

**Plans**: 3 plans

Plans:
- [ ] 08-01: Set up Django Channels with Redis for WebSocket support
- [ ] 08-02: Build WebSocket consumers for task event broadcasting
- [ ] 08-03: Create frontend notification component with @vueuse/useWebSocket integration

### Phase 9: Performance Optimization

**Goal**: Optimize database queries, caching, and frontend rendering for production scale

**Depends on**: Phase 5

**Requirements**: PERF-02, PERF-04

**Success Criteria** (what must be TRUE):
1. Task list queries complete in under 500ms with 10,000+ tasks in database
2. Task statistics load in under 200ms using Redis cache
3. Database composite indexes eliminate full table scans on filtered queries
4. Frontend renders 100-task lists without frame drops (60 FPS maintained)
5. Query optimization reduces database load by 70% compared to unoptimized baseline

**Plans**: 3 plans

Plans:
- [ ] 09-01: Add composite database indexes on frequently filtered columns
- [ ] 09-02: Implement Redis caching for task statistics and dashboard data
- [ ] 09-03: Optimize ORM queries with select_related and prefetch_related

### Phase 10: Production Hardening

**Goal**: Ensure system is tested, documented, and ready for production deployment

**Depends on**: Phase 9

**Requirements**: None (quality gate)

**Success Criteria** (what must be TRUE):
1. All critical user workflows have integration tests passing
2. API documentation is complete and accurate for all task endpoints
3. User manual documents all features with screenshots and step-by-step guides
4. Production deployment checklist is completed (backups, monitoring, error logging)
5. System successfully handles load testing with 100 concurrent users

**Plans**: 3 plans

Plans:
- [ ] 10-01: Write integration tests for core task workflows
- [ ] 10-02: Create API documentation and user manual
- [ ] 10-03: Perform load testing and deployment preparation

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Draft Task Foundation | 0/3 | Not started | - |
| 2. Task Data Consistency | 0/2 | Not started | - |
| 3. Dispatch Configuration | 0/3 | Not started | - |
| 4. Task Assignment Core | 0/3 | Not started | - |
| 5. Universal Task Visibility | 0/4 | Not started | - |
| 6. Work Order Task Integration | 0/3 | Not started | - |
| 7. Role-Based Task Centers | 0/4 | Not started | - |
| 8. Real-time Notifications | 0/3 | Not started | - |
| 9. Performance Optimization | 0/3 | Not started | - |
| 10. Production Hardening | 0/3 | Not started | - |
