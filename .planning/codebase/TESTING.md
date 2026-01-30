# Testing Patterns

**Analysis Date:** 2026-01-30

## Test Framework

**Frontend:**
- **Framework**: Jest 27.5.1
- **Vue Test Utils**: @vue/test-utils 1.3.6
- **Config**: `/home/chenjiaxing/文档/work_order/frontend/jest.config.js`
- **Transform**: @vue/vue2-jest for .vue files, babel-jest for .js files
- **Module Mapper**: `@/(.*)$` → `<rootDir>/src/$1` (path alias support)

**Backend:**
- **Framework**: Django's built-in test framework (unittest)
- **Extensions**: Django REST Framework APITestCase
- **Config**: Custom test configuration in `/home/chenjiaxing/文档/work_order/backend/workorder/tests/conftest.py`
- **Test Database**: SQLite in-memory (`:memory:`) for speed
- **Password Hasher**: MD5PasswordHasher for faster tests

**Assertion Libraries:**
- **Frontend**: Jest's built-in `expect()` + Vue Test Utils wrappers
- **Backend**: Python's `assertEqual()`, `assertTrue()`, `assertIn()`, etc.

**Run Commands:**
```bash
# Frontend tests
cd frontend
npm run test:unit              # Run all tests
npm run test:unit -- --watch   # Watch mode
npm run test:unit -- --coverage # Coverage report

# Backend tests
cd backend
python manage.py test          # Run all tests
python manage.py test workorder.tests.test_api  # Run specific test module
python manage.py test --parallel # Run tests in parallel (if configured)
```

## Test File Organization

**Frontend Location:**
- **Pattern**: Co-located with source code, mirrored under `tests/unit/`
- **Directory**: `/home/chenjiaxing/文档/work_order/frontend/tests/unit/`
- **Structure**:
  ```
  tests/unit/
  ├── components/          # Component tests
  │   ├── TaskCard.spec.js
  │   ├── TaskFilters.spec.js
  │   ├── WorkOrderBasicInfo.spec.js
  │   └── ApprovalWorkflow.spec.js
  └── services/           # Service layer tests
      ├── WorkOrderService.spec.js
      ├── TaskService.spec.js
      ├── PermissionService.spec.js
      └── ExportService.spec.js
  ```

**Frontend Naming:**
- Pattern: `[ComponentName].spec.js` or `[ServiceName].spec.js`
- Matches source file name with `.spec.js` suffix
- Examples: `TaskCard.spec.js`, `WorkOrderService.spec.js`

**Backend Location:**
- **Pattern**: Separate `tests/` directory per app
- **Directory**: `/home/chenjiaxing/文档/work_order/backend/workorder/tests/`
- **Structure**:
  ```
  workorder/tests/
  ├── conftest.py              # Test configuration and fixtures
  ├── test_api.py              # API endpoint tests
  ├── test_models.py           # Model tests
  ├── test_permissions.py      # Permission tests
  ├── test_processes.py        # Process-specific tests
  ├── test_products.py         # Product tests
  ├── test_department.py       # Department tests
  └── test_approval_validation.py  # Approval workflow tests
  ```

**Backend Naming:**
- Pattern: `test_*.py` prefix
- Test classes: `[ModelName]Test` or `[FeatureName]Test`
- Test methods: `test_[action]_[scenario]`

## Test Structure

**Frontend Suite Organization:**
```javascript
describe('ComponentName', () => {
  let wrapper

  // Factory function for creating test instances
  const factory = (propsData = {}) => shallowMount(ComponentName, {
    localVue,
    propsData: { /* default props */ },
    stubs: { /* Element UI stubs */ }
  })

  // Setup before each test
  beforeEach(() => {
    // Initialize mocks with default values
  })

  // Cleanup after each test
  afterEach(() => {
    if (wrapper) wrapper.destroy()
    jest.clearAllMocks()
  })

  describe('Feature Group 1', () => {
    test('should do something', () => {
      wrapper = factory()
      expect(wrapper.vm.property).toBe(expectedValue)
    })
  })
})
```

**Frontend Patterns:**

**Setup Pattern:**
```javascript
beforeEach(() => {
  // Set default mock return values
  workOrderService.getStatusText.mockReturnValue('进行中')
  taskService.calculateProgress.mockReturnValue(50)
  permissionService.canOperateTask.mockReturnValue(true)
})
```

**Teardown Pattern:**
```javascript
afterEach(() => {
  if (wrapper) {
    wrapper.destroy() // Clean up Vue component
  }
  jest.clearAllMocks() // Reset all mocks
})
```

**Assertion Pattern:**
```javascript
test('should display correct data', () => {
  wrapper = factory()
  expect(wrapper.exists()).toBe(true)
  expect(wrapper.find('.element-class').exists()).toBe(true)
  expect(wrapper.vm.computedProperty).toBe(expectedValue)
})
```

**Backend Suite Organization:**
```python
class WorkOrderAPITest(APITestCaseMixin, TestCase):
    """施工单 API 测试"""

    def setUp(self):
        """设置测试数据"""
        super().setUp()
        self.user = TestDataFactory.create_user()
        self.customer = TestDataFactory.create_customer()
        self.work_order = TestDataFactory.create_workorder()

    def test_list_workorders(self):
        """测试获取施工单列表"""
        response = self.api_get('/api/workorders/', user=self.user)
        self.assertEqual(response.status_code, 200)

    def test_create_workorder(self):
        """测试创建施工单"""
        data = { /* test data */ }
        response = self.api_post('/api/workorders/', data, user=self.user)
        self.assertEqual(response.status_code, 201)
```

**Backend Patterns:**

**Setup Pattern:**
```python
def setUp(self):
    super().setUp()
    self.user = TestDataFactory.create_user()
    self.client.force_login(self.user)
```

**Teardown Pattern:**
- Use Django's built-in database transaction rollback
- No manual cleanup needed for models
- Custom cleanup in `tearDown()` if needed (e.g., file cleanup)

**Assertion Pattern:**
```python
def test_workorder_detail(self):
    response = self.api_get(f'/api/workorders/{work_order.id}/', user=self.user)
    self.assertEqual(response.status_code, 200)
    self.assertEqual(response.data['id'], work_order.id)
    self.assertIn('order_number', response.data)
```

## Mocking

**Framework:**
- **Frontend**: Jest's built-in mocking (`jest.mock()`, `jest.fn()`)
- **Backend**: Python's `unittest.mock` (not heavily used, prefers test data factories)

**Frontend Patterns:**

**Mock Service Layer:**
```javascript
// Mock entire service module
jest.mock('@/services', () => ({
  workOrderService: {
    getStatusText: jest.fn(),
    calculateProgress: jest.fn(),
    canEdit: jest.fn()
  },
  taskService: {
    calculateProgress: jest.fn(),
    isOverdue: jest.fn()
  }
}))

// Import and use in tests
import { workOrderService } from '@/services'

// Set return values
beforeEach(() => {
  workOrderService.getStatusText.mockReturnValue('进行中')
  workOrderService.canEdit.mockReturnValue(true)
})

// Verify calls
expect(workOrderService.calculateProgress).toHaveBeenCalledWith(mockTask)
```

**Mock API Calls:**
```javascript
jest.mock('@/api/workorder', () => ({
  workOrderAPI: {
    list: jest.fn(),
    getDetail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
}))
```

**Mock Element UI Components:**
```javascript
const factory = (propsData = {}) => shallowMount(ComponentName, {
  stubs: {
    'el-tag': true,
    'el-button': true,
    'el-progress': true,
    'el-table': true,
    'el-dialog': true
  }
})
```

**What to Mock:**
- API calls (all external HTTP requests)
- Service layer dependencies
- Third-party libraries (Element UI, etc.)
- Complex child components (use stubs)

**What NOT to Mock:**
- Component's own methods
- Computed properties
- Simple utility functions (test them directly)
- Data transformation logic

**Backend Patterns:**

**Test Data Factory (Preferred over Mocking):**
```python
class TestDataFactory:
    """测试数据工厂 - 快速创建测试数据"""

    @staticmethod
    def create_user(username='testuser', password='testpass123', **kwargs):
        from django.contrib.auth.models import User
        return User.objects.create_user(
            username=username,
            password=password,
            **kwargs
        )

    @staticmethod
    def create_customer(name='测试客户', **kwargs):
        from workorder.models.base import Customer
        return Customer.objects.create(name=name, **kwargs)

    @staticmethod
    def create_workorder(customer=None, creator=None, **kwargs):
        from workorder.models.core import WorkOrder
        if not customer:
            customer = TestDataFactory.create_customer()
        if not creator:
            creator = TestDataFactory.create_user()
        return WorkOrder.objects.create(
            customer=customer,
            created_by=creator,
            **kwargs
        )
```

**API Test Mixin:**
```python
class APITestCaseMixin:
    """API 测试混入类 - 提供 API 测试通用方法"""

    def _get_auth_header(self, user):
        from rest_framework.authtoken.models import Token
        token, _ = Token.objects.get_or_create(user=user)
        return {'HTTP_AUTHORIZATION': f'Token {token.key}'}

    def api_get(self, url, user=None, **kwargs):
        if user:
            kwargs.update(self._get_auth_header(user))
        return self.client.get(url, **kwargs)

    def api_post(self, url, data=None, user=None, **kwargs):
        if user:
            kwargs.update(self._get_auth_header(user))
        return self.client.post(url, data, content_type='application/json', **kwargs)

    def assertAPIError(self, response, status_code, message=None):
        self.assertEqual(response.status_code, status_code)
        if message:
            self.assertIn(message, str(response.data))
```

**What to Mock in Backend:**
- External API calls (if any)
- Time-dependent functions (use `freezegun` or mock `timezone.now()`)
- File I/O operations
- Email sending

**What NOT to Mock in Backend:**
- Database queries (use test database)
- Model methods
- Serializer logic
- Business logic

## Fixtures and Factories

**Frontend Test Data:**
```javascript
const mockTask = {
  id: 1,
  work_content: '测试任务内容',
  task_type: 'printing',
  status: 'in_progress',
  production_quantity: 100,
  quantity_completed: 50,
  quantity_defective: 5,
  deadline: '2026-01-20',
  assigned_operator_name: '张三'
}

const factory = (propsData = {}) => shallowMount(TaskCard, {
  propsData: {
    task: mockTask,
    editable: true,
    ...propsData
  }
})
```

**Frontend Location:**
- Test data defined inline in test files
- No separate fixture directory
- Each test file defines its own mock data

**Backend Test Data:**
```python
# TestDataFactory in conftest.py
user = TestDataFactory.create_user(username='admin', is_staff=True)
customer = TestDataFactory.create_customer(name='测试客户', salesperson=user)
work_order = TestDataFactory.create_workorder(
    customer=customer,
    creator=user,
    priority='high'
)
```

**Backend Location:**
- Centralized in `/home/chenjiaxing/文档/work_order/backend/workorder/tests/conftest.py`
- `TestDataFactory` class provides static factory methods
- Default values for all required fields
- Override with `**kwargs` for specific tests

**Factory Methods Available:**
- `create_user()` - Create test user with permissions
- `create_customer()` - Create test customer
- `create_product()` - Create test product
- `create_process()` - Create test process
- `create_workorder()` - Create test work order
- `create_workorder_process()` - Create test work order process

## Coverage

**Frontend Requirements:** None enforced (configured but no minimum threshold)

**View Coverage:**
```bash
cd frontend
npm run test:unit -- --coverage
```

**Coverage Directory:** `/home/chenjiaxing/文档/work_order/frontend/coverage/`

**Coverage Configuration (jest.config.js):**
```javascript
collectCoverageFrom: [
  'src/**/*.{js,vue}',
  '!src/main.js',
  '!src/router/index.js',
  '!**/node_modules/**'
],
coverageReporters: ['lcov', 'text-summary']
```

**Backend Requirements:** None enforced (coverage package installed but not configured)

**View Coverage:**
```bash
cd backend
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report
```

**Current Test Files:**
- Frontend: 11 test files (components + services)
- Backend: 8 test files (API, models, permissions, processes, products, department, approval validation)

## Test Types

**Frontend Unit Tests:**
- **Scope**: Test individual components and services in isolation
- **Approach**: Shallow mount components, mock all dependencies
- **Tools**: `shallowMount()` from Vue Test Utils, Jest mocks
- **Focus**: Component rendering, computed properties, methods, event emissions
- **Examples:**
  - `/home/chenjiaxing/文档/work_order/frontend/tests/unit/services/WorkOrderService.spec.js` - 403 lines, comprehensive service testing
  - `/home/chenjiaxing/文档/work_order/frontend/tests/unit/components/TaskCard.spec.js` - 279 lines, component testing

**Frontend Integration Tests:** Not used (unit tests only)

**Frontend E2E Tests:** Not implemented

**Backend Unit Tests:**
- **Scope**: Test individual model methods and utility functions
- **Approach**: Test methods directly with test data
- **Focus**: Model validation, business logic, data transformation
- **Examples:**
  - `/home/chenjiaxing/文档/work_order/backend/workorder/tests/test_models.py` - Model testing

**Backend Integration Tests:**
- **Scope**: Test API endpoints with full request/response cycle
- **Approach**: Use APITestCase with test database
- **Focus**: Request handling, serialization, permissions, filters
- **Tools**: APIClient, APITestCase, TestDataFactory
- **Examples:**
  - `/home/chenjiaxing/文档/work_order/backend/workorder/tests/test_api.py` - API endpoint testing
  - `/home/chenjiaxing/文档/work_order/backend/workorder/tests/test_permissions.py` - Permission testing

**Backend E2E Tests:** Not used (integration tests cover full request cycle)

## Common Patterns

**Frontend Async Testing:**
```javascript
test('should handle async operation', async () => {
  wrapper = factory()

  // Mock API response
  workOrderAPI.getDetail.mockResolvedValue(mockData)

  // Call async method
  await wrapper.vm.loadData()

  // Verify
  expect(wrapper.vm.data).toEqual(mockData)
  expect(workOrderAPI.getDetail).toHaveBeenCalledWith(id)
})
```

**Frontend Error Testing:**
```javascript
test('should handle API error', async () => {
  wrapper = factory()

  // Mock API error
  workOrderAPI.getDetail.mockRejectedValue(new Error('Network error'))

  // Call async method
  await wrapper.vm.loadData()

  // Verify error handling
  expect(wrapper.vm.error).toBeTruthy()
  expect(wrapper.vm.loading).toBe(false)
})
```

**Backend Async Testing:**
```python
def test_async_operation(self):
    """测试异步操作"""
    work_order = TestDataFactory.create_workorder()

    # Call async method
    result = work_order.calculate_progress_async()

    # Refresh from database
    work_order.refresh_from_db()

    # Verify result
    self.assertEqual(work_order.progress_percentage, expected_value)
```

**Backend Error Testing:**
```python
def test_validation_error(self):
    """测试验证错误"""
    data = {'invalid': 'data'}

    response = self.api_post('/api/workorders/', data, user=self.user)

    # Should return 400
    self.assertEqual(response.status_code, 400)

    # Should contain error message
    self.assertIn('error', response.data)
```

**Frontend Event Testing:**
```javascript
test('should emit event on button click', async () => {
  wrapper = factory()

  await wrapper.find('.button-class').trigger('click')

  expect(wrapper.emitted('event-name')).toBeTruthy()
  expect(wrapper.emitted('event-name')[0]).toEqual([expectedPayload])
})
```

**Frontend Computed Property Testing:**
```javascript
test('should calculate computed property correctly', () => {
  wrapper = factory({ prop: value })

  expect(wrapper.vm.computedProperty).toBe(expectedValue)

  // Change props
  wrapper.setProps({ prop: newValue })

  // Verify computed property updates
  expect(wrapper.vm.computedProperty).toBe(newExpectedValue)
})
```

**Backend Permission Testing:**
```python
def test_permission_denied(self):
    """测试权限拒绝"""
    user = TestDataFactory.create_user(is_staff=False)
    work_order = TestDataFactory.create_workorder()

    response = self.api_patch(
        f'/api/workorders/{work_order.id}/',
        {'notes': 'test'},
        user=user
    )

    # Should be forbidden
    self.assertEqual(response.status_code, 403)
```

---

*Testing analysis: 2026-01-30*
