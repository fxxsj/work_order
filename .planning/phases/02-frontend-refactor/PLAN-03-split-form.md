---
wave: 1
phase: 02-frontend-refactor
plan: 03-split-form
depends_on: []
files_modified:
  - frontend/src/views/workorder/WorkOrderForm.vue
  - frontend/src/views/workorder/components/FormBasicInfo.vue
  - frontend/src/views/workorder/components/FormProducts.vue
  - frontend/src/views/workorder/components/FormMaterials.vue
  - frontend/src/views/workorder/components/FormProcesses.vue
  - frontend/src/views/workorder/components/FormActions.vue
autonomous: true
---

# PLAN-03: 拆分 WorkOrderForm.vue

## Phase Context
Phase 02 of v1.1 milestone focuses on frontend refactoring to improve code maintainability by:
- Creating centralized constants for status and priority values
- Splitting large Vue components into smaller, reusable sub-components
- Replacing hardcoded strings with imported constants

## Overview
将 1472 行的 `WorkOrderForm.vue` 拆分为多个子表单组件，每个组件负责一个特定表单区域。简化主表单组件，提高代码可读性和可维护性。

## Background
`WorkOrderForm.vue` 当前包含所有表单区域（基本信息、产品、物料、工序、操作按钮等）在一个文件中，导致：
- 表单逻辑复杂难以维护
- 难以复用表单组件
- 难以进行单元测试
- 表单验证逻辑混乱

## Component Structure
```
frontend/src/views/workorder/
├── WorkOrderForm.vue (主表单，简化为约 500 行)
└── components/
    ├── FormBasicInfo.vue (~300 行) - 基本信息表单
    ├── FormProducts.vue (~250 行) - 产品列表表单
    ├── FormMaterials.vue (~200 行) - 物料选择表单
    ├── FormProcesses.vue (~150 行) - 工序配置表单
    └── FormActions.vue (~100 行) - 操作按钮
```

## Sections to Extract

### FormBasicInfo.vue
**Extracted from WorkOrderForm.vue**
- Customer selector
- Priority selector
- Order date picker
- Delivery date picker
- Salesperson selector
- Notes textarea

**Props:**
```javascript
props: {
  form: {
    type: Object,
    required: true
  },
  customerList: {
    type: Array,
    default: () => []
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}

data() {
  return {
    rules: {
      customer: [{ required: true, message: '请选择客户', trigger: 'change' }],
      priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
      order_date: [{ required: true, message: '请选择下单日期', trigger: 'change' }],
      delivery_date: [{ required: true, message: '请选择交货日期', trigger: 'change' }]
    }
  }
}
```

### FormProducts.vue
**Extracted from WorkOrderForm.vue**
- Product selector
- Product list table
- Quantity input per product
- Remove product action

**Props:**
```javascript
props: {
  form: {
    type: Object,
    required: true
  },
  productList: {
    type: Array,
    default: () => []
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}

emits: ['update:products']
```

### FormMaterials.vue
**Extracted from WorkOrderForm.vue**
- Material selector
- Material list with quantity
- Add/remove materials

**Props:**
```javascript
props: {
  form: {
    type: Object,
    required: true
  },
  materialList: {
    type: Array,
    default: () => []
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}

emits: ['update:materials']
```

### FormProcesses.vue
**Extracted from WorkOrderForm.vue**
- Process selector
- Process list display
- Process order management

**Props:**
```javascript
props: {
  form: {
    type: Object,
    required: true
  },
  processList: {
    type: Array,
    default: () => []
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}

emits: ['update:processes']
```

### FormActions.vue
**Extracted from WorkOrderForm.vue**
- Cancel button
- Save draft button
- Submit for approval button
- Submit button

**Props:**
```javascript
props: {
  isEdit: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  },
  submitting: {
    type: Boolean,
    default: false
  }
}

emits: ['cancel', 'save-draft', 'submit-approval', 'submit']
```

## Tasks

<task type="auto">
  <name>Analyze WorkOrderForm.vue sections</name>
  <files>frontend/src/views/workorder/WorkOrderForm.vue</files>
  <action>Read and analyze WorkOrderForm.vue to identify exact form sections</action>
  <verify>grep -n "el-form-item\|el-divider\|<el-row" frontend/src/views/workorder/WorkOrderForm.vue | head -30</verify>
  <done>Form section boundaries identified</done>
</task>

<task type="auto">
  <name>Create FormBasicInfo.vue</name>
  <files>frontend/src/views/workorder/components/FormBasicInfo.vue</files>
  <action>Extract basic info form fields from WorkOrderForm.vue to FormBasicInfo.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/FormBasicInfo.vue</verify>
  <done>FormBasicInfo.vue created</done>
</task>

<task type="auto">
  <name>Create FormProducts.vue</name>
  <files>frontend/src/views/workorder/components/FormProducts.vue</files>
  <action>Extract product selection section from WorkOrderForm.vue to FormProducts.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/FormProducts.vue</verify>
  <done>FormProducts.vue created</done>
</task>

<task type="auto">
  <name>Create FormMaterials.vue</name>
  <files>frontend/src/views/workorder/components/FormMaterials.vue</files>
  <action>Extract material selection section from WorkOrderForm.vue to FormMaterials.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/FormMaterials.vue</verify>
  <done>FormMaterials.vue created</done>
</task>

<task type="auto">
  <name>Create FormProcesses.vue</name>
  <files>frontend/src/views/workorder/components/FormProcesses.vue</files>
  <action>Extract process selection section from WorkOrderForm.vue to FormProcesses.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/FormProcesses.vue</verify>
  <done>FormProcesses.vue created</done>
</task>

<task type="auto">
  <name>Create FormActions.vue</name>
  <files>frontend/src/views/workorder/components/FormActions.vue</files>
  <action>Extract action buttons from WorkOrderForm.vue to FormActions.vue</action>
  <verify>ls -la frontend/src/views/workorder/components/FormActions.vue</verify>
  <done>FormActions.vue created</done>
</task>

<task type="auto">
  <name>Refactor main WorkOrderForm.vue</name>
  <files>frontend/src/views/workorder/WorkOrderForm.vue</files>
  <action>Update WorkOrderForm.vue to import and use the new form sub-components, removing extracted code</action>
  <verify>wc -l frontend/src/views/workorder/WorkOrderForm.vue</verify>
  <done>WorkOrderForm.vue refactored with form sub-components</done>
</task>

## Verification
```bash
# Check all files exist
ls -la frontend/src/views/workorder/WorkOrderForm.vue
ls -la frontend/src/views/workorder/components/FormBasicInfo.vue
ls -la frontend/src/views/workorder/components/FormProducts.vue
ls -la frontend/src/views/workorder/components/FormMaterials.vue
ls -la frontend/src/views/workorder/components/FormProcesses.vue
ls -la frontend/src/views/workorder/components/FormActions.vue

# Check WorkOrderForm.vue is reduced
wc -l frontend/src/views/workorder/WorkOrderForm.vue
# Expected: ~500 lines (reduced from 1472)

# Verify imports
grep -n "import.*Form" frontend/src/views/workorder/WorkOrderForm.vue
```

## Expected Artifacts
- `frontend/src/views/workorder/WorkOrderForm.vue` - Refactored main form (~500 lines)
- `frontend/src/views/workorder/components/FormBasicInfo.vue` - Basic info form (~300 lines)
- `frontend/src/views/workorder/components/FormProducts.vue` - Products form (~250 lines)
- `frontend/src/views/workorder/components/FormMaterials.vue` - Materials form (~200 lines)
- `frontend/src/views/workorder/components/FormProcesses.vue` - Processes form (~150 lines)
- `frontend/src/views/workorder/components/FormActions.vue` - Actions form (~100 lines)
