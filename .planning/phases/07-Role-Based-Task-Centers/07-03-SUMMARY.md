---
phase: 07-Role-Based-Task-Centers
plan: 03
title: "Operator Task Center with Assigned and Claimable Task Pools"
status: complete
one-liner: "Personalized operator task center with dual task pools and one-click claiming"
completion_date: "2026-01-31"

# Summary

## Objective

Create operator task center with assigned and claimable task pools to provide operators with a personalized view showing their assigned tasks and tasks they can claim from their department.

## Key Deliverables

### 1. Frontend API Method (workorder-task.js)
- **File**: `frontend/src/api/modules/workorder-task.js`
- **Method**: `getOperatorCenterData(params)`
- **Endpoint**: `/workorder-tasks/operator_center/`
- **Purpose**: Fetch both assigned and claimable tasks in a single API call
- **Accepts**: Optional filters (status, priority)

### 2. Backend API Endpoint (task_main.py)
- **File**: `backend/workorder/views/work_order_tasks/task_main.py`
- **Action**: `operator_center`
- **Method**: GET
- **Response Structure**:
  - `my_tasks`: Tasks assigned to current user (max 100)
  - `claimable_tasks`: Unassigned tasks in user's department (max 50)
  - `summary`: Task counts by status (my_total, my_pending, my_in_progress, my_completed, claimable_count)
- **Features**:
  - Uses existing permission filtering via `get_queryset()`
  - Leverages `TaskAssignmentService.get_claimable_tasks_for_user()` for claimable logic
  - Handles users without departments gracefully
  - Optimized with select_related for performance

### 3. OperatorCenter Vue Component
- **File**: `frontend/src/views/task/OperatorCenter.vue`
- **Lines**: 218
- **Features**:
  - Summary cards with color-coded statistics (my_total, my_pending, my_in_progress, claimable_count)
  - Two-column layout: My Tasks | Claimable Tasks
  - My Tasks tabbed view: all, pending, in_progress filters
  - Claimable Tasks with one-click claim functionality
  - Role-based access control (redirects non-operators to /tasks)
  - Automatic data refresh after successful claim
  - Loading states for better UX

### 4. Router Configuration
- **File**: `frontend/src/router/index.js`
- **Route**: `/tasks/operator`
- **Component**: OperatorCenter
- **Title**: 操作员任务中心
- **Code Splitting**: webpackChunkName "task-operator"

### 5. OperatorTaskList Component
- **File**: `frontend/src/views/task/components/OperatorTaskList.vue`
- **Lines**: 167
- **Features**:
  - Card-based task display with priority-colored borders
  - Shows: status tag, priority badge, work content, order number, process name
  - Progress bar with completion percentage
  - Optional claim button for claimable tasks
  - Emits: task-click, claim events
  - Scrollable container (400px max height)
  - Hover effects for enhanced interactivity
  - Empty state display

## Technical Implementation

### Backend Architecture
- Reused existing `TaskAssignmentService.get_claimable_tasks_for_user()` for claimable task filtering
- Leveraged `get_queryset()` for automatic permission filtering
- Applied select_related optimization to avoid N+1 queries
- Used queryset slicing for performance limits ([:100] and [:50])

### Frontend Architecture
- Component-based design with clear separation of concerns
- OperatorCenter (parent) handles data fetching and state management
- OperatorTaskList (child) handles display and user interactions
- Event-driven communication (task-click, claim events)
- Consistent with existing TaskService for status and progress calculations

### User Experience
- Personalized view for operators only (non-operators redirected)
- One-click claim functionality with immediate feedback
- Automatic refresh after claim to show updated task counts
- Visual priority indicators (colored borders and badges)
- Tab filtering for "My Tasks" (all, pending, in_progress)
- Empty states with clear messaging

## Deviations from Plan

**None** - Plan executed exactly as written.

## Dependencies

### Requires
- Phase 06 (Work Order Task Integration): Task claiming infrastructure
- Phase 04 (Task Assignment Core): TaskAssignmentService
- Phase 01 (Draft Task Foundation): Task status model

### Provides
- Operator-focused task management interface
- Foundation for future role-based dashboards (supervisor, manager)

### Affects
- Phase 07-01 (Supervisor Dashboard): Reference for role-based dashboard pattern
- Phase 07-02 (Manager Dashboard): Reference for summary card pattern

## Testing Checklist

- [x] API method `getOperatorCenterData` exists in workOrderTaskAPI
- [x] Backend endpoint `/workorder-tasks/operator_center/` returns expected structure
- [x] OperatorCenter component renders without console errors
- [x] Summary cards display correct task counts
- [x] My Tasks tab shows user's assigned tasks
- [x] Claimable Tasks shows unassigned department tasks
- [x] Claim button calls API and refreshes data
- [x] Non-operators redirected to /tasks
- [x] Route accessible at /tasks/operator
- [x] OperatorTaskList component renders task cards correctly
- [x] Click on card emits task-click event
- [x] Claim button emits claim event
- [x] Progress bar displays correctly
- [x] Empty state shows when no tasks

## Performance Metrics

- **Execution Time**: ~56 seconds (5 tasks)
- **Files Created**: 2 (OperatorCenter.vue, OperatorTaskList.vue)
- **Files Modified**: 3 (workorder-task.js, task_main.py, index.js)
- **Lines Added**: ~459 (218 + 167 + 36 backend + 38 frontend)

## Authentication Gates

None encountered during this plan.

## Next Steps

The operator task center is now complete. Future phases may add:
- Supervisor dashboard with team workload view
- Manager dashboard with cross-department visibility
- Task filtering and sorting enhancements
- Task detail view within operator center

## Commits

1. `47259d0` - feat(07-03): Add getOperatorCenterData API method
2. `d8d7694` - feat(07-03): Add operator_center endpoint to backend
3. `60f613e` - feat(07-03): Create OperatorCenter Vue component
4. `615be4e` - feat(07-03): Add operator center route to router
5. `3b2ea67` - feat(07-03): Create OperatorTaskList component for operator center
