# Plan 05-05: Priority Filter Integration

## Objective

Add a `priority` filter to the Task List API and integrate it into the frontend UI, allowing users to filter tasks based on the priority of their parent work order.

## Changes Made

### Backend (task_filters.py)

**File**: `backend/workorder/views/work_order_tasks/task_filters.py`

- Added `priority` CharFilter to `WorkOrderTaskFilterSet` class:
  ```python
  priority = CharFilter(field_name='work_order_process__work_order__priority')
  ```
- Added `'priority'` to the `Meta.fields` list

### Frontend (TaskList.vue)

**File**: `frontend/src/views/task/TaskList.vue`

1. **Added priority filter dropdown** (before the work_order_process filter):
   - Placeholder: "优先级"
   - Bound to `filters.priority`
   - Options: 低 (low), 普通 (normal), 高 (high), 紧急 (urgent)

2. **Updated filters data object**:
   ```javascript
   filters: {
     task_type: '',
     work_order_process: '',
     assigned_department: '',
     priority: ''
   }
   ```

3. **Added priorityOptions computed property**:
   ```javascript
   priorityOptions() {
     return [
       { value: 'low', label: '低' },
       { value: 'normal', label: '普通' },
       { value: 'high', label: '高' },
       { value: 'urgent', label: '紧急' }
     ]
   }
   ```

4. **Updated hasFilters computed property** to include `this.filters.priority`

5. **Updated fetchData method** to pass `priority` parameter to API

## Verification

1. Navigate to the Task List page
2. Verify that a new "优先级" (Priority) filter dropdown is present
3. Select "紧急" (Urgent) from the dropdown
4. The task list should update to show only tasks belonging to work orders with "Urgent" priority
5. Clear the filter and verify the list returns to its original state

## Success Criteria

- ✅ Task List API accepts and filters by `priority` query parameter
- ✅ Frontend Task List page includes working dropdown filter for priority

## Files Modified

- `backend/workorder/views/work_order_tasks/task_filters.py`
- `frontend/src/views/task/TaskList.vue`

## Related Plans

- **05-01**: Enhanced Task List API (foundation for this plan)
- **05-02**: Universal Task List UI with batch operations
- **05-03**: Batch Operations API Layer
- **05-04**: Batch Operations UI Integration (skipped - functionality in 05-02)

## Notes

- The filter uses Django-Filter's CharFilter to query the related WorkOrder model's `priority` field through the chain: `WorkOrderTask` → `work_order_process` → `work_order` → `priority`
- Frontend options match the standard priority values: low, normal, high, urgent
