---
phase: 6
plan: "06-02"
subsystem: workorder
tags: [task-management, inline-editing, permissions, bulk-operations, vue]
tech-stack:
  added: []
  patterns: [role-based-permission, bulk-operations, inline-editing]
---

# Phase 6 Plan 2: Inline Task Editing Summary

## Overview

Added inline editing controls for draft tasks with role-based permission in TaskSection.vue component. Implemented single task editing and bulk edit functionality.

## Key Deliverables

1. **Edit Mode Controls**
   - `canEditTask` computed property for permission-based UI rendering
   - Inline edit buttons on draft tasks for authorized users
   - Edit dialog for modifying quantity, priority, notes, and production requirements
   - Direct connection to `workOrderTaskAPI.update()` method

2. **Permission System**
   - `canEditDraftTasks()` method checks user roles (makers/sales staff)
   - Role validation includes superuser bypass and group-based access
   - Permission check: `workorder.change_workorder` required
   - Only draft tasks (status='draft' or is_draft=true) are editable

3. **Bulk Edit Functionality**
   - Selection checkboxes in task table (only draft tasks selectable)
   - Bulk edit dialog for quantity, priority, production requirements
   - Connection to `workOrderTaskAPI.bulkUpdate()` API
   - Success message showing number of tasks edited

## Files Modified

### frontend/src/views/workorder/components/TaskSection.vue
- Added permissionMixin import
- Added edit-related data properties (editForm, bulkEditForm, selection state)
- Added computed properties: `draftTasks`, `canEditTask`
- Added methods: `canEditDraftTasks()`, `canEditSingleTask()`, `isDraftTaskSelectable()`
- Added selection handlers: `handleSelectionChange()`, `handleSelectAllDraft()`
- Added edit handlers: `handleEditTask()`, `handleSaveEdit()`
- Added bulk edit handlers: `handleBulkEdit()`, `handleSaveBulkEdit()`
- Added template dialogs: edit dialog, bulk edit dialog
- Added toolbar buttons: bulk edit, select all checkbox
- Added priority column to table display

## Technical Implementation

### Permission Logic
```javascript
canEditDraftTasks() {
  // Superuser always allowed
  if (userInfo.is_superuser) return true
  
  // Check for editable groups: makers, sales staff, 业务员
  const hasEditableGroup = editableGroups.some(group => 
    userGroups.some(userGroup => 
      userGroup.toLowerCase().includes(group.toLowerCase())
    )
  )
  
  // Requires workorder.change_workorder permission
  return hasEditableGroup && this.hasPermission('workorder.change_workorder')
}
```

### Edit Flow
1. User clicks edit button on draft task
2. Edit dialog opens with current task data
3. User modifies quantity, priority, requirements, notes
4. On save: `workOrderTaskAPI.update(id, data)` called
5. Success message shown, task-updated event emitted

### Bulk Edit Flow
1. User selects multiple draft tasks via checkboxes
2. Clicks "批量编辑" button
3. Bulk edit dialog opens with optional fields
4. User sets values (null means no change)
5. On save: `workOrderTaskAPI.bulkUpdate({task_ids, ...})` called
6. Success message with count of edited tasks

## Decisions Made

### 1. Permission Model
- **Decision**: Role-based permission with group membership check
- **Rationale**: Aligns with existing user group system (makers, sales staff)
- **Alternative Considered**: Permission string check only
  - Rejected: Doesn't handle department-based access patterns

### 2. Editable Task Constraint
- **Decision**: Only draft tasks (status='draft') are editable
- **Rationale**: Prevents modification of in-progress/completed tasks
- **Implementation**: `canEditSingleTask()` checks status before showing edit button

### 3. Bulk Edit Field Handling
- **Decision**: Null values in bulk form mean "don't update field"
- **Rationale**: Allows partial updates without overwriting all fields
- **Implementation**: API handles null as skip-field signal

## Verification Criteria Met

✅ Edit buttons appear on draft tasks for makers/sales staff  
✅ Edit dialog allows modifying quantity, priority, notes  
✅ Changes save successfully via API  
✅ Other user roles cannot see edit buttons  
✅ Bulk edit works for multiple selected tasks  
✅ Non-draft tasks are not editable  

## Dependencies

- **WorkOrderTaskAPI.update()**: Inherited from BaseAPI
- **WorkOrderTaskAPI.bulkUpdate()**: Custom bulk update endpoint
- **permissionMixin**: Provides `hasPermission()` method
- **ErrorHandler**: Provides success/error message handling

## Metrics

- **Lines Added**: 322
- **Files Modified**: 1
- **Components Added**: 2 dialogs (edit, bulk-edit)
- **Permission Methods**: 2 (canEditDraftTasks, canEditSingleTask)

## Next Steps

Plan 06-03: Task Creation Validation will build upon this by:
- Adding validation for task creation
- Ensuring task data integrity
- Implementing workflow rules for task addition
