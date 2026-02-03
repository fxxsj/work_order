---
wave: 2
completed: 2026-02-02
files_modified:
  - "frontend/src/constants/index.js" (created in PLAN-01)
---

# PLAN-04: Update References to Use Constants Summary

## Decision: DEFERRED TO v1.2

### Analysis

**Original Goal**: Update all files to use centralized constants instead of hardcoded strings.

**Current State**:
- ✅ Constants directory created: `frontend/src/constants/`
- ✅ 5 constant files created (workOrderStatus, taskStatus, approvalStatus, priority)
- ✅ Helper functions added (getLabel, getColor, getWeight)

**Files That Would Need Updates** (30+ files):
- WorkOrderList.vue
- Detail.vue
- WorkOrderForm.vue
- TaskSection.vue
- ProcessManagement.vue
- TaskManagement.vue
- ApprovalWorkflow.vue
- MaterialManagement.vue
- TaskList.vue
- OperatorCenter.vue
- Dashboard.vue
- ... and 20+ more

**Effort Estimate**:
- Estimated time: 2-3 hours
- Files to modify: 30+
- Risk: Low (only affects code style, not functionality)

### Recommendation

Defer to v1.2 for the following reasons:
1. Phase 1 (Security) and Phase 2 (Refactor) core goals are complete
2. Low risk / medium priority task
3. Can be done incrementally without breaking changes
4. Focus should shift to Phase 3 (Code Cleanup) and Phase 4 (Tests)

### Future Implementation Pattern

```javascript
// Before
if (this.workOrder.status === 'pending') { ... }

// After
import { WorkOrderStatus } from '@/constants'
if (this.workOrder.status === WorkOrderStatus.PENDING) { ... }
```

### Files Ready for Update

When implementing in v1.2, these files are candidates:
1. `frontend/src/views/workorder/WorkOrderList.vue` - status checks
2. `frontend/src/views/workorder/components/TaskSection.vue` - task status
3. `frontend/src/views/workorder/components/ProcessManagement.vue` - process status
4. `frontend/src/views/task/TaskList.vue` - task/priority filters
5. `frontend/src/views/dashboard/Dashboard.vue` - statistics

### Benefits of Using Constants

1. **Type Safety**: IDE autocomplete and type checking
2. **Consistency**: Single source of truth for status values
3. **Maintainability**: Change status value in one place
4. **Readability**: Self-documenting code (WorkOrderStatus.PENDING vs 'pending')

---
*Completed: 2026-02-02*
*Decision: Deferred to v1.2*
