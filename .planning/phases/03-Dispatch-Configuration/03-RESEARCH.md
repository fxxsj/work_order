# Phase 03: Dispatch Configuration - Research

**Researched:** 2026-01-31
**Domain:** Vue.js + Django REST Framework - Priority-based Task Dispatch System
**Confidence:** HIGH

## Summary

Phase 03 builds a priority-based department dispatch configuration system that automatically assigns tasks to departments when work orders are approved. The system uses the existing `TaskAssignmentRule` model (already implemented in backend) and extends it with a comprehensive configuration UI that supports drag-and-drop priority ordering, real-time preview, and load balancing.

**Key Findings:**
1. **Backend foundation exists**: `TaskAssignmentRule` model with `process`, `department`, `priority`, and `operator_selection_strategy` fields is fully implemented
2. **Auto-dispatch integrated**: `_auto_assign_task()` method in `WorkOrderProcess` model already uses priority-based dispatch logic
3. **Load balancing implemented**: `_select_operator_by_strategy()` supports 'least_tasks' strategy for operator selection
4. **UI foundation exists**: Basic `AssignmentRule.vue` component uses listPageMixin pattern but needs enhancement for drag-and-drop and preview
5. **API fully modularized**: `taskAssignmentRuleAPI` extends BaseAPI with standard CRUD operations

**Primary recommendation:** Enhance existing `AssignmentRule.vue` with dual-column layout, drag-and-drop priority sorting, real-time preview table, and global dispatch toggle. Create backend API endpoint for dispatch preview that simulates task assignment based on current rules.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue.js | 2.7 | Frontend framework | Project standard, already in use |
| Element UI | 2.15 | UI component library | Project standard, provides el-table, el-dialog, el-card |
| Django REST Framework | 3.14 | Backend API framework | Project standard, ViewSets for CRUD |
| Django | 4.2 | Backend framework | Project standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SortableJS | 1.15+ | Drag-and-drop sorting | For department priority reordering in configuration UI |
| lodash | 4.17+ | Utility functions | Already used for debounce in listPageMixin |
| vue-draggable | 2.24+ | Vue wrapper for SortableJS | Simplifies drag-and-drop integration with Vue data |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| vue-draggable | Native HTML5 DnD | vue-draggable provides better Vue integration and touch support |
| SortableJS | react-beautiful-dnd | Wrong framework (React), SortableJS is framework-agnostic |

**Installation:**
```bash
# Frontend - Drag and drop library (likely already installed)
npm install vuedraggable@2.24.3 lodash.debounce

# No backend installation needed - using existing DRF and Django models
```

## Architecture Patterns

### Recommended Project Structure

```
backend/workorder/
├── models/
│   └── system.py          # TaskAssignmentRule model (EXISTS)
├── serializers/
│   └── system.py          # TaskAssignmentRuleSerializer (EXISTS)
├── views/
│   └── system.py          # TaskAssignmentRuleViewSet (EXISTS)
├── services/
│   ├── dispatch_service.py  # NEW: DispatchPreviewService
│   └── task_generation.py   # EXISTS: DraftTaskGenerationService

frontend/src/
├── views/task/
│   └── AssignmentRule.vue   # ENHANCE: Add dual-column layout, drag-drop, preview
├── api/modules/
│   └── task-assignment-rule.js  # EXISTS: BaseAPI subclass
└── components/dispatch/      # NEW: Reusable dispatch components
    ├── ProcessList.vue       # Left column: process selector
    ├── DepartmentPriorityPanel.vue  # Right column: department priorities
    └── DispatchPreviewTable.vue    # Preview table component
```

### Pattern 1: Service Layer for Business Logic

**What:** Separate service classes encapsulate business logic away from views and models.

**When to use:** Complex business operations that involve multiple models or calculations.

**Example:**

```python
# backend/workorder/services/dispatch_service.py
from typing import Dict, List
from django.db.models import Count, Q
from ..models import WorkOrderTask, TaskAssignmentRule, Department

class DispatchPreviewService:
    """Service for generating dispatch previews based on current rules"""

    @staticmethod
    def generate_preview() -> List[Dict]:
        """Generate dispatch preview for all active processes

        Returns:
            List of dicts with process info and target department
        """
        from ..models.base import Process

        processes = Process.objects.filter(is_active=True)
        preview_data = []

        for process in processes:
            # Get highest priority active rule
            rule = TaskAssignmentRule.objects.filter(
                process=process,
                is_active=True
            ).select_related('department').order_by('-priority').first()

            if rule:
                # Calculate current department load
                dept_load = WorkOrderTask.objects.filter(
                    assigned_department=rule.department,
                    status__in=['pending', 'in_progress']
                ).count()

                preview_data.append({
                    'process_id': process.id,
                    'process_name': process.name,
                    'process_code': process.code,
                    'target_department_id': rule.department.id,
                    'target_department_name': rule.department.name,
                    'current_load': dept_load,
                    'priority': rule.priority,
                    'is_active': rule.is_active
                })

        return preview_data

    @staticmethod
    def simulate_dispatch(process_id: int) -> Dict:
        """Simulate dispatch for a specific process

        Args:
            process_id: Process to simulate

        Returns:
            Dict with target department and load info
        """
        from ..models.base import Process

        process = Process.objects.get(id=process_id)
        rules = TaskAssignmentRule.objects.filter(
            process=process,
            is_active=True
        ).select_related('department').order_by('-priority')

        if not rules.exists():
            return {'error': 'No active rules for this process'}

        # Find first available department
        for rule in rules:
            dept_load = WorkOrderTask.objects.filter(
                assigned_department=rule.department,
                status__in=['pending', 'in_progress']
            ).count()

            return {
                'process': process.name,
                'target_department': rule.department.name,
                'priority': rule.priority,
                'current_load': dept_load,
                'selection_strategy': rule.operator_selection_strategy
            }
```

**Why this matters:** Separating preview logic from views makes it testable, reusable, and maintainable.

### Pattern 2: Vue Component Composition with Mixins

**What:** Use existing `listPageMixin` and `crudPermissionMixin` for base functionality, extend with dispatch-specific logic.

**When to use:** List pages that need CRUD operations with standard patterns.

**Example:**

```javascript
// frontend/src/views/task/AssignmentRule.vue (enhanced)
import { taskAssignmentRuleAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'

export default {
  name: 'AssignmentRule',
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      apiService: taskAssignmentRuleAPI,
      permissionPrefix: 'taskassignmentrule',
      selectedProcess: null,
      departmentRules: [],  // Rules for selected process
      previewData: [],
      globalDispatchEnabled: false
    }
  },

  methods: {
    // Override fetchData to load rules grouped by process
    async fetchData() {
      // Custom loading logic for dual-column layout
    },

    // New method: Load department priorities for selected process
    async loadDepartmentPriorities(processId) {
      const response = await this.apiService.getList({
        process: processId,
        ordering: '-priority'
      })
      this.departmentRules = response.results
    },

    // New method: Generate dispatch preview
    async generatePreview() {
      const response = await this.apiService.preview()
      this.previewData = response.data
    }
  }
}
```

### Pattern 3: Dual-Column Layout with Drag-and-Drop

**What:** Split-screen UI with process selector on left, department priority panel on right.

**When to use:** Configuration interfaces requiring master-detail navigation.

**Example:**

```vue
<template>
  <div class="dispatch-configuration">
    <el-card>
      <!-- Global Toggle -->
      <div class="global-toggle">
        <el-switch
          v-model="globalDispatchEnabled"
          active-text="启用自动分派"
          @change="handleGlobalToggle"
        />
      </div>

      <el-row :gutter="20">
        <!-- Left Column: Process List -->
        <el-col :span="8">
          <process-list
            :processes="processes"
            :selected="selectedProcess"
            @select="handleProcessSelect"
          />
        </el-col>

        <!-- Right Column: Department Priority Panel -->
        <el-col :span="16">
          <department-priority-panel
            v-if="selectedProcess"
            :process="selectedProcess"
            :departments="departmentRules"
            @update-priority="handlePriorityUpdate"
          />
        </el-col>
      </el-row>

      <!-- Preview Section -->
      <dispatch-preview-table
        :preview-data="previewData"
        :loading="previewLoading"
      />
    </el-card>
  </div>
</template>
```

### Anti-Patterns to Avoid

- **Putting business logic in views**: Use service classes instead
- **Tight coupling to drag-drop library**: Wrap vue-draggable in custom components for easier replacement
- **Frontend-only validation**: Always validate priority constraints on backend
- **Ignoring existing patterns**: The project uses listPageMixin - follow this pattern

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop sorting | Custom mouse event handlers | vue-draggable (SortableJS) | Touch support, smooth animations, accessibility |
| Debounced search | setTimeout with clearTimeout | lodash.debounce (already in project) | Handles edge cases, memory leaks |
| Table sorting/filtering | Custom array methods | Element UI el-table with filters | Built-in loading states, pagination |
| API error handling | try-catch in every method | ErrorHandler utility (already in project) | Consistent user experience, logging |

**Key insight:** The project already has `ErrorHandler`, `listPageMixin`, and `crudPermissionMixin` - use them instead of rebuilding.

## Common Pitfalls

### Pitfall 1: Not Validating Priority Constraints

**What goes wrong:** Users can create multiple rules with same priority for same process, causing ambiguous dispatch.

**Why it happens:** Frontend allows free-form number input, backend has unique_together on (process, department) but not on priority.

**How to avoid:**
- Add validation in `TaskAssignmentRuleSerializer` to check for duplicate priorities within same process
- Provide clear UI feedback when priority conflicts detected
- Consider using auto-increment priority buttons instead of raw number input

**Warning signs:** "It randomly picks different departments" bug reports

### Pitfall 2: Preview Data Staleness

**What goes wrong:** Preview shows dispatch results based on outdated rule configuration.

**Why it happens:** Preview generated on page load, not updated when rules change.

**How to avoid:**
- Regenerate preview after every rule create/update/delete operation
- Use event bus or provide/inject to communicate between components
- Add "Refresh Preview" button with explicit loading state

**Warning signs:** User asks "Why does preview still show old department after I changed priority?"

### Pitfall 3: Load Calculation Race Conditions

**What goes wrong:** Load counts (pending tasks) are inaccurate during concurrent task creation.

**Why it happens:** Multiple tasks created simultaneously while preview loads.

**How to avoid:**
- Use database-level aggregation with `select_for_update()` for critical sections
- Accept approximate load counts (display "about X tasks")
- Add timestamp to preview data showing when calculation was performed

**Warning signs:** Load count fluctuates between refreshes

### Pitfall 4: Breaking Existing Approval Integration

**What goes wrong:** Changes to dispatch logic break automatic task assignment on work order approval.

**Why it happens:** `_auto_assign_task()` method called during `convert_draft_tasks()` on approval.

**How to avoid:**
- Add integration tests for approval workflow
- Test with `globalDispatchEnabled = false` to ensure tasks not assigned when disabled
- Verify existing unit tests still pass after modifying dispatch logic

**Warning signs:** Tasks remain unassigned after work order approval

## Code Examples

### Backend: Dispatch Preview Endpoint

```python
# backend/workorder/views/system.py
class TaskAssignmentRuleViewSet(viewsets.ModelViewSet):
    queryset = TaskAssignmentRule.objects.select_related('process', 'department').all()
    serializer_class = TaskAssignmentRuleSerializer

    @action(detail=False, methods=['get'])
    def preview(self, request):
        """Generate dispatch preview for all active processes

        Returns preview showing which department will receive tasks for each process
        """
        from ..services.dispatch_service import DispatchPreviewService

        preview_data = DispatchPreviewService.generate_preview()

        return Response({
            'preview': preview_data,
            'generated_at': timezone.now().isoformat()
        })
```

### Frontend: Drag-and-Drop Department List

```vue
<!-- frontend/src/components/dispatch/DepartmentPriorityPanel.vue -->
<template>
  <div class="department-priority-panel">
    <h3>{{ process.name }} - 部门优先级</h3>

    <draggable
      v-model="departmentList"
      @end="handleDragEnd"
      handle=".drag-handle"
    >
      <transition-group type="transition" name="flip-list">
        <div
          v-for="(dept, index) in departmentList"
          :key="dept.id"
          class="department-card"
        >
          <div class="priority-badge">{{ index + 1 }}</div>
          <i class="el-icon-rank drag-handle" />
          <div class="dept-info">
            <div class="dept-name">{{ dept.department_name }}</div>
            <div class="dept-stats">
              当前负载: {{ dept.current_load }} 个任务
            </div>
          </div>
          <div class="dept-actions">
            <el-switch v-model="dept.is_active" @change="toggleActive(dept)" />
          </div>
        </div>
      </transition-group>
    </draggable>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'DepartmentPriorityPanel',
  components: { draggable },
  props: {
    process: Object,
    departments: Array
  },
  data() {
    return {
      departmentList: []
    }
  },
  watch: {
    departments: {
      immediate: true,
      handler(val) {
        this.departmentList = [...val]
      }
    }
  },
  methods: {
    async handleDragEnd(event) {
      // Recalculate priorities based on new order
      const updates = this.departmentList.map((dept, index) => ({
        id: dept.id,
        priority: 100 - index  // Higher priority for lower index
      }))

      await this.bulkUpdatePriorities(updates)
      this.$emit('update-priority', this.departmentList)
    }
  }
}
</script>

<style scoped>
.department-card {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.priority-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.drag-handle {
  cursor: move;
  margin-right: 12px;
  color: #909399;
}

.dept-info {
  flex: 1;
}

.dept-name {
  font-weight: 500;
}

.dept-stats {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
```

### Frontend: Dispatch Preview Table

```vue
<!-- frontend/src/components/dispatch/DispatchPreviewTable.vue -->
<template>
  <div class="dispatch-preview">
    <h4>分派效果预览</h4>
    <el-alert
      v-if="!globalDispatchEnabled"
      type="warning"
      title="自动分派已禁用"
      description="预览显示的是配置效果，但任务不会实际分派"
      :closable="false"
      style="margin-bottom: 16px;"
    />

    <el-table
      v-loading="loading"
      :data="previewData"
      border
    >
      <el-table-column prop="process_name" label="工序" width="150" />
      <el-table-column prop="process_code" label="工序编码" width="100" />
      <el-table-column prop="target_department_name" label="目标部门" width="150">
        <template slot-scope="scope">
          <el-tag type="success">{{ scope.row.target_department_name }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="current_load" label="当前负载" width="120">
        <template slot-scope="scope">
          <el-progress
            :percentage="calculateLoadPercentage(scope.row.current_load)"
            :color="getLoadColor(scope.row.current_load)"
          />
          <span style="font-size: 12px; color: #909399;">
            {{ scope.row.current_load }} 个待处理任务
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100" />
    </el-table>
  </div>
</template>
```

### Backend: Load Balancing Implementation

```python
# backend/workorder/services/dispatch_service.py
class LoadBalancingService:
    """Service for load balancing dispatch decisions"""

    @staticmethod
    def select_department_by_load(process_id: int) -> Department:
        """Select department with least pending tasks for a process

        Args:
            process_id: Process to find department for

        Returns:
            Department with lowest load among configured options
        """
        from ..models.base import Process

        process = Process.objects.get(id=process_id)

        # Get all active rules for this process, grouped by priority
        rules = TaskAssignmentRule.objects.filter(
            process=process,
            is_active=True
        ).select_related('department')

        if not rules.exists():
            return None

        # Group rules by priority
        priority_groups = {}
        for rule in rules:
            if rule.priority not in priority_groups:
                priority_groups[rule.priority] = []
            priority_groups[rule.priority].append(rule)

        # Sort by priority (highest first)
        sorted_priorities = sorted(priority_groups.keys(), reverse=True)

        # Check highest priority group first
        for priority in sorted_priorities:
            group_rules = priority_groups[priority]

            # If only one department at this priority, use it
            if len(group_rules) == 1:
                return group_rules[0].department

            # Multiple departments at same priority: select by load
            departments_with_load = []
            for rule in group_rules:
                load = WorkOrderTask.objects.filter(
                    assigned_department=rule.department,
                    status__in=['pending', 'in_progress']
                ).count()

                departments_with_load.append({
                    'department': rule.department,
                    'load': load
                })

            # Sort by load (ascending), pick lowest
            departments_with_load.sort(key=lambda x: x['load'])
            return departments_with_load[0]['department']

        return None
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual task assignment after approval | Automatic dispatch on approval | Phase 2 (2026-01-30) | Tasks assigned immediately when work order approved |
| Department selection by sort_order | Priority-based rules with load balancing | Phase 3 (current) | Configurable dispatch with intelligent load distribution |
| Single global dispatch flag | Per-rule enable/disable + global toggle | Phase 3 (current) | Fine-grained control over dispatch behavior |

**Deprecated/outdated:**
- **Manual operator assignment**: Still available but superseded by auto-dispatch with strategy selection
- **Department.processes M2M only**: Supplemented by TaskAssignmentRule for priority-based dispatch

## Open Questions

### 1. Global Toggle Implementation Detail

**What we know:** Requirements specify global enable/disable for dispatch rules. Context.md says "default disabled" is at Claude's discretion.

**What's unclear:** Should global toggle be stored in:
- Database (new SystemConfig model)?
- Settings file (requires restart to change)?
- Django cache (fast but volatile)?

**Recommendation:** Use database model `SystemConfig` with key-value store for persistence. Add caching for performance. Allow toggle in configuration UI.

### 2. Load Calculation Scope

**What we know:** Requirements say "only count pending tasks, not in-progress" for load balancing. Context.md says this is Claude's discretion.

**What's unclear:** Should load calculation include:
- Only 'pending' status tasks?
- Both 'pending' and 'in_progress'?
- Weighted calculation (pending=1, in_progress=0.5)?

**Recommendation:** Implement configurable load calculation:
- Default: count only 'pending' tasks (per context decision)
- Provide settings to include 'in_progress' if needed
- Document rationale in code comments

### 3. Preview Update Frequency

**What we know:** Real-time preview required. Context.md says "configuration changes trigger immediate update" is Claude's discretion.

**What's unclear:** Should preview update:
- After every drag-and-drop reorder (could be noisy)?
- After user clicks "Apply" button (explicit save)?
- Use debounced update (300ms after last change)?

**Recommendation:** Use debounced update (300ms) for drag reordering, immediate update for enable/disable toggles. Show loading indicator during preview regeneration.

## Sources

### Primary (HIGH confidence)

- **Existing Codebase Analysis** - Examined `/home/chenjiaxing/文档/work_order/backend/workorder/`:
  - `models/system.py` - TaskAssignmentRule model definition (lines 149-185)
  - `models/core.py` - _auto_assign_task() method (lines 610-690)
  - `views/system.py` - TaskAssignmentRuleViewSet (lines 73-83)
  - `serializers/system.py` - TaskAssignmentRuleSerializer (lines 34-47)
  - `services/task_generation.py` - DraftTaskGenerationService pattern
  - `services/multi_level_approval.py` - Approval workflow integration

- **Existing Frontend Components** - Examined `/home/chenjiaxing/文档/work_order/frontend/src/`:
  - `views/task/AssignmentRule.vue` - Current implementation (542 lines)
  - `api/modules/task-assignment-rule.js` - API module extending BaseAPI
  - `mixins/listPageMixin.js` - Reusable list page logic
  - `mixins/crudPermissionMixin.js` - Permission checking mixin

- **Context Document** - `.planning/phases/03-Dispatch-Configuration/03-CONTEXT.md`:
  - User decisions on dual-column layout, drag-and-drop, priority badges
  - Claude's discretion areas documented

### Secondary (MEDIUM confidence)

- **Vue-Draggable Documentation** - Known library, standard approach for Vue 2.7 drag-and-drop
- **Element UI Documentation** - el-table, el-dialog, el-switch components (project standard)

### Tertiary (LOW confidence)

None - All findings based on existing codebase analysis and documented patterns.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on existing project dependencies and patterns
- Architecture: HIGH - Derived from existing codebase structure (services, models, views)
- Pitfalls: MEDIUM - Based on common Django/Vue issues, some project-specific

**Research date:** 2026-01-31
**Valid until:** 2026-02-28 (30 days - stable technology stack)

---

**Research complete. Ready for planning phase.**
