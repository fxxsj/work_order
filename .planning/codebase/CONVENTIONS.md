# Coding Conventions

**Analysis Date:** 2026-01-30

## Naming Patterns

**Files:**
- **Vue Components**: PascalCase (e.g., `WorkOrderBasicInfo.vue`, `TaskCard.vue`, `CustomerList.vue`)
- **JavaScript Modules**: camelCase (e.g., `listPageMixin.js`, `errorHandler.js`, `WorkOrderService.js`)
- **API Modules**: camelCase (e.g., `customer.js`, `workorder.js`, `workorder-process.js`)
- **Python Modules**: snake_case (e.g., `work_orders.py`, `query_optimizer.py`)
- **Test Files**: PascalCase with `.spec.js` suffix (frontend) or `test_*.py` prefix (backend)
  - Frontend: `WorkOrderService.spec.js`, `TaskCard.spec.js`
  - Backend: `test_api.py`, `test_models.py`, `test_permissions.py`

**Functions:**
- **Frontend**: camelCase (e.g., `handleSearch`, `fetchData`, `calculateProgress`, `canEdit`)
- **Backend**: snake_case (e.g., `get_queryset`, `create_workorder`, `calculate_progress`)
- **Event Handlers**: Prefix with `handle` (e.g., `handlePageChange`, `handleEdit`, `handleDelete`)
- **Boolean Getters**: Prefix with `can`, `is`, `has` (e.g., `canEdit`, `isOverdue`, `hasDefective`)

**Variables:**
- **Frontend**: camelCase (e.g., `tableData`, `currentPage`, `searchText`, `dialogVisible`)
- **Backend**: snake_case (e.g., `work_order`, `customer_id`, `is_completed`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `APPROVED_ORDER_PROTECTED_FIELDS`, `TEST_DATABASE`)
- **Boolean Variables**: Prefix with `is`, `can`, `has`, `should` (e.g., `loading`, `editable`, `canUpdate`)

**Types:**
- **Vue Components**: PascalCase (e.g., `WorkOrderBasicInfo`, `TaskCard`, `Pagination`)
- **Django Models**: PascalCase (e.g., `WorkOrder`, `WorkOrderProcess`, `Customer`)
- **Django Serializers**: PascalCase with `Serializer` suffix (e.g., `WorkOrderListSerializer`, `WorkOrderDetailSerializer`)
- **Service Classes**: PascalCase with `Service` suffix (e.g., `WorkOrderService`, `TaskService`, `PermissionService`)
- **API Classes**: PascalCase with `API` suffix (e.g., `CustomerAPI`, `WorkOrderAPI`)
- **Mixin Classes**: PascalCase with `Mixin` suffix (e.g., `listPageMixin`, `crudPermissionMixin`)

## Code Style

**Formatting:**
- **Tool**: Prettier 2.8.8 + ESLint 7.32.0
- **Config**: `.prettierrc.js` and `.eslintrc.js`
- **Key Settings**:
  - Print width: 100 characters
  - Indent: 2 spaces (no tabs)
  - Quotes: Single quotes (`, double quotes for JSX)
  - Semicolons: None (never use)
  - Trailing commas: None
  - End of line: LF
  - Arrow function parentheses: Avoid when possible (`x => x` not `(x) => x`)

**Linting:**
- **Frontend Tool**: ESLint with Vue plugin
- **Config**: Extends `plugin:vue/recommended` and `eslint:recommended`
- **Key Rules**:
  - `vue/multi-word-component-names`: Require multi-word component names (except specific ignores)
  - `vue/component-definition-name-casing`: PascalCase for components
  - `vue/prop-name-casing`: camelCase for props
  - `vue/require-default-prop`: Props must have defaults
  - `vue/require-prop-types`: Props must have types
  - `vue/v-bind-style`: Use shorthand (`:href` not `v-bind:href`)
  - `vue/v-on-style`: Use shorthand (`@click` not `v-on:click`)
  - `no-var`: Use `const`/`let` only
  - `prefer-const`: Use `const` when variable is not reassigned
  - `camelcase`: Enforce camelCase for variables and properties
  - `eqeqeq`: Require `===` and `!==`
  - `semi`: Never use semicolons

**Backend Style:**
- **Standard**: PEP 8 (Python)
- **Tools**: flake8 (configured in requirements.txt)
- **Max Line Length**: Not explicitly configured (follow PEP 8 default of 79)
- **Imports**: Grouped and sorted (stdlib, third-party, local)
- **Docstrings**: Google-style docstrings used in models and services

## Import Organization

**Order:**
1. Third-party imports
2. Vue/Component imports
3. Service layer imports
4. API imports
5. Utility imports
6. Relative imports

**Path Aliases:**
- `@/` → `src/` (configured in jest.config.js and vue.config.js)
- All imports use `@/` prefix for absolute paths from `src/`

**Frontend Import Pattern:**
```javascript
// Third-party
import { shallowMount, createLocalVue } from '@vue/test-utils'

// Services
import { workOrderService, taskService } from '@/services'

// API
import { customerAPI } from '@/api/modules'

// Components
import WorkOrderBasicInfo from '@/views/workorder/components/WorkOrderBasicInfo.vue'

// Utilities
import ErrorHandler from '@/utils/errorHandler'
```

**Backend Import Pattern:**
```python
# Standard library
from datetime import datetime, date

# Django
from django.db import models
from django.contrib.auth.models import User

# Third-party
from rest_framework import viewsets

# Local
from ..models.base import Customer, Process
from ..serializers.core import WorkOrderDetailSerializer
```

## Error Handling

**Frontend Patterns:**

**Unified Error Handler** (`/home/chenjiaxing/文档/work_order/frontend/src/utils/errorHandler.js`):
- Use `ErrorHandler` class for all error handling
- Methods:
  - `ErrorHandler.showMessage(error, context)` - Display error message
  - `ErrorHandler.showSuccess(message)` - Display success message
  - `ErrorHandler.showWarning(message)` - Display warning message
  - `ErrorHandler.showInfo(message)` - Display info message
  - `ErrorHandler.handle(error, context)` - Extract error details
  - `ErrorHandler.handleValidationError(error, formRef)` - Handle form validation errors
  - `ErrorHandler.confirm(message, title, options)` - Show confirmation dialog
  - `ErrorHandler.withConfirm(asyncFn, message, title)` - Wrap async function with confirmation
  - `ErrorHandler.withErrorHandling(asyncFn, options)` - Wrap async function with error handling and loading state

**API Error Handling in Axios Interceptor:**
- Centralized error handling in `/home/chenjiaxing/文档/work_order/frontend/src/api/index.js`
- 401 errors redirect to login
- 403 errors show permission denied
- 404 errors show resource not found
- 500 errors show server error
- Network errors show connection message

**Component Error Handling:**
```javascript
async loadData() {
  this.loading = true
  try {
    const response = await this.fetchData()
    this.tableData = response.results || response.data || []
    this.total = response.count || response.total || 0
  } catch (error) {
    ErrorHandler.showMessage(error, '加载数据失败')
  } finally {
    this.loading = false
  }
}
```

**Backend Patterns:**

**DRF Exception Handling:**
- Use DRF's built-in exception handlers
- Custom exceptions in views for specific business logic
- Validation errors returned as 400 with field-level details

**Logging:**
- Use Python's `logging` module
- Logger configured per module: `logger = logging.getLogger(__name__)`
- Error logging includes traceback: `logger.error(f"Error: {str(e)}", exc_info=True)`

**Model Validation:**
- Use Django's `clean()` method for custom validation
- Raise `ValidationError` with field-specific messages
- Use constraints in model definitions for database-level validation

## Logging

**Framework:** Custom logger wrapper (`/home/chenjiaxing/文档/work_order/frontend/src/utils/logger.js`)

**Frontend Patterns:**
```javascript
import logger from '@/utils/logger'

logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message', error)
logger.debug('Debug message') // Only in development
```

**Production vs Development:**
- Development: Console logging enabled, detailed errors
- Production: Minimal console logging (controlled by NODE_ENV)
- TODO: Send to log service (Sentry) in production (noted in `/home/chenjiaxing/文档/work_order/frontend/src/utils/logger.js`)

**Backend Patterns:**
```python
import logging

logger = logging.getLogger(__name__)

logger.info('Info message')
logger.warning('Warning message')
logger.error('Error message', exc_info=True)
logger.debug('Debug message') # Disabled in production
```

**When to Log:**
- API errors (4xx, 5xx responses)
- Business logic violations
- Data consistency issues
- Performance bottlenecks
- Security events (unauthorized access attempts)

## Comments

**When to Comment:**
- Complex business logic explanations
- Workarounds for known issues
- Algorithm explanations
- Public API documentation (JSDoc/TSDoc)
- TODO markers for future work

**JSDoc/TSDoc:**
- Used for service classes (`WorkOrderService`, `TaskService`, `PermissionService`)
- Used for utility classes (`ErrorHandler`)
- Used for API base class (`BaseAPI`)
- Format: Block comments with `@param`, `@returns`, `@example`

**Frontend Comment Style:**
```javascript
/**
 * 计算施工单进度
 * @param {Object} workOrder - 施工单对象
 * @returns {number} 进度百分比 (0-100)
 */
calculateProgress(workOrder) {
  // Implementation
}
```

**Backend Comment Style:**
```python
def calculate_progress(work_order):
    """
    计算施工单进度

    Args:
        work_order: 施工单实例

    Returns:
        float: 进度百分比 (0-100)
    """
    # Implementation
```

**Inline Comments:**
- Use sparingly
- Explain "why" not "what"
- Language: Chinese for business logic, English for technical code

## Function Design

**Size:**
- Aim for 20-50 lines per function
- Break down complex functions into smaller helpers
- Maximum 100 lines (rare exception)

**Parameters:**
- Prefer 0-3 parameters
- Use object parameter for 4+ parameters
- Destructure objects in function signature

**Frontend Pattern:**
```javascript
// Good: 2 parameters
handleEdit(row) {
  // Implementation
}

// Good: Object parameter for many options
async loadData({ page, pageSize, search, filters }) {
  // Implementation
}
```

**Backend Pattern:**
```python
# Good: 2 parameters
def calculate_progress(work_order):
    pass

# Good: Keyword arguments for clarity
def create_workorder(customer, creator, **kwargs):
    pass
```

**Return Values:**
- Frontend: Always return promises from async functions
- Backend: Always return Django QuerySet or model instances from data access methods
- Use consistent response structure: `{ data, results, count, total }`

## Module Design

**Exports:**
- **API Modules**: Default export named instance (e.g., `export default customerAPI`)
- **Service Modules**: Named exports from index file
- **Utility Modules**: Default export class or function
- **Mixins**: Default export

**Barrel Files:**
- `/home/chenjiaxing/文档/work_order/frontend/src/api/modules/index.js` - Aggregates all API modules
- `/home/chenjiaxing/文档/work_order/frontend/src/services/index.js` - Aggregates all services
- `/home/chenjiaxing/文档/work_order/frontend/src/components/common/index.js` - Aggregates common components

**Frontend Module Pattern:**
```javascript
// api/modules/customer.js
class CustomerAPI extends BaseAPI {
  constructor() {
    super('/customers/', request)
  }
}

export const customerAPI = new CustomerAPI()
export default customerAPI
```

**Backend Module Pattern:**
```python
# models/core.py
class WorkOrder(models.Model):
    pass

class WorkOrderProcess(models.Model):
    pass

# Export at __init__.py
from .core import WorkOrder, WorkOrderProcess
```

---

*Convention analysis: 2026-01-30*
