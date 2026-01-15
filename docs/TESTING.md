# 测试指南

**最后更新：** 2026-01-15
**版本：** v1.0

---

## 概述

本文档说明印刷施工单跟踪系统的测试策略、测试结构和运行方法。

---

## 测试结构

```
backend/workorder/tests/
├── __init__.py
├── conftest.py                 # 测试配置和工具
├── test_models.py              # 核心模型测试
├── test_api.py                 # API 端点测试
├── test_permissions.py         # 权限系统测试
└── test_approval_validation.py # 审核验证测试
```

### 测试分类

1. **模型测试 (test_models.py)**
   - 施工单模型功能
   - 工序模型功能
   - 任务模型功能
   - 产品关联测试
   - 自动完成机制
   - 版本控制

2. **API 测试 (test_api.py)**
   - CRUD 操作
   - 过滤和搜索
   - 批量操作
   - 认证和授权
   - 错误处理

3. **权限测试 (test_permissions.py)**
   - 数据权限（业务员只能看到自己的客户）
   - 操作权限（操作员只能操作自己的任务）
   - 审核权限（业务员只能审核自己的客户）
   - API 认证

4. **审核验证测试 (test_approval_validation.py)**
   - 基础信息验证
   - 版与工序匹配验证
   - 数量验证
   - 日期验证
   - 物料验证
   - 工序顺序验证

---

## 运行测试

### 方法 1: 使用测试运行脚本（推荐）

```bash
cd backend

# 运行所有测试
./run_tests.sh

# 运行特定类型的测试
./run_tests.sh models       # 模型测试
./run_tests.sh api          # API 测试
./run_tests.sh permissions  # 权限测试
./run_tests.sh approval     # 审核验证测试

# 生成覆盖率报告
./run_tests.sh coverage

# 运行代码检查
./run_tests.sh lint
```

### 方法 2: 使用 Django 命令

```bash
cd backend

# 运行所有测试
python manage.py test workorder.tests

# 运行特定测试文件
python manage.py test workorder.tests.test_models

# 运行特定测试类
python manage.py test workorder.tests.test_models.WorkOrderModelTest

# 运行特定测试方法
python manage.py test workorder.tests.test_models.WorkOrderModelTest.test_generate_order_number

# 详细输出
python manage.py test workorder.tests --verbosity=2

# 保持数据库
python manage.py test workorder.tests --keepdb

# 并行运行（需要 pytest-django）
pytest workorder/tests -n auto
```

### 方法 3: 使用 Coverage

```bash
cd backend

# 安装 coverage
pip install coverage

# 运行测试并生成覆盖率报告
coverage run --source='.' manage.py test workorder.tests
coverage report
coverage html

# 查看报告
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

---

## 测试工具和辅助类

### TestDataFactory

快速创建测试数据：

```python
from workorder.tests.conftest import TestDataFactory

# 创建用户
user = TestDataFactory.create_user(username='testuser')

# 创建客户
customer = TestDataFactory.create_customer(name='测试客户', salesperson=user)

# 创建产品
product = TestDataFactory.create_product(name='测试产品')

# 创建工序
process = TestDataFactory.create_process(name='测试工序', code='TEST')

# 创建施工单
work_order = TestDataFactory.create_workorder(
    customer=customer,
    creator=user
)
```

### APITestCaseMixin

API 测试混入类，提供便捷方法：

```python
from workorder.tests.conftest import APITestCaseMixin

class MyAPITest(APITestCaseMixin, TestCase):
    def setUp(self):
        super().setUp()
        # 自动设置认证
        # self.client 已配置好

    def test_something(self):
        response = self.api_get('/api/workorders/')
        self.assertEqual(response.status_code, 200)
```

提供的方法：
- `api_get(url, **kwargs)` - GET 请求
- `api_post(url, data, **kwargs)` - POST 请求
- `api_put(url, data, **kwargs)` - PUT 请求
- `api_patch(url, data, **kwargs)` - PATCH 请求
- `api_delete(url, **kwargs)` - DELETE 请求
- `assertAPIError(response, status_code, message)` - 断言 API 错误

---

## 编写测试指南

### 模型测试示例

```python
from django.test import TestCase
from workorder.tests.conftest import TestDataFactory

class WorkOrderTest(TestCase):
    def setUp(self):
        self.user = TestDataFactory.create_user()
        self.customer = TestDataFactory.create_customer(salesperson=self.user)

    def test_create_workorder(self):
        """测试创建施工单"""
        work_order = TestDataFactory.create_workorder(
            customer=self.customer,
            creator=self.user
        )
        self.assertIsNotNone(work_order.order_number)
```

### API 测试示例

```python
from workorder.tests.conftest import APITestCaseMixin, TestDataFactory

class WorkOrderAPITest(APITestCaseMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.customer = TestDataFactory.create_customer()

    def test_list_workorders(self):
        """测试获取列表"""
        response = self.api_get('/api/workorders/')
        self.assertEqual(response.status_code, 200)
```

### 权限测试示例

```python
class PermissionTest(APITestCaseMixin, TestCase):
    def setUp(self):
        super().setUp()
        self.user1 = TestDataFactory.create_user(username='user1')
        self.user2 = TestDataFactory.create_user(username='user2')
        self.customer1 = TestDataFactory.create_customer(salesperson=self.user1)

    def test_user_cannot_see_others_data(self):
        """测试用户不能看到别人的数据"""
        self.client.force_login(self.user1)
        response = self.api_get('/api/workorders/')
        # 断言只能看到自己的数据
```

---

## 测试覆盖率目标

| 模块 | 目标覆盖率 | 当前状态 |
|------|-----------|---------|
| 模型 (models/) | > 90% | 🔄 进行中 |
| 视图 (views/) | > 85% | 🔄 进行中 |
| 序列化器 (serializers/) | > 80% | 🔄 进行中 |
| 权限 (permissions/) | > 95% | 🔄 进行中 |
| 整体 | > 80% | 🔄 进行中 |

---

## CI/CD 集成

项目使用 GitHub Actions 进行持续集成：

### 工作流程

1. **后端测试**
   - 代码检查（flake8）
   - 单元测试
   - 覆盖率报告
   - 上传到 Codecov

2. **前端测试**
   - ESLint 检查
   - 单元测试
   - 生产构建

3. **集成测试**
   - 权限测试
   - API 集成测试

### 触发条件

- Push 到 `main` 或 `develop` 分支
- 创建 Pull Request 到 `main` 或 `develop` 分支

---

## 最佳实践

### 1. 测试命名

```python
# ✅ 好的命名
def test_generate_order_number_automatically():
    pass

def test_user_cannot_delete_approved_order():
    pass

# ❌ 不好的命名
def test_workorder():
    pass  # 太模糊
```

### 2. 测试结构

```python
def test_something():
    # 1. 准备 (Arrange)
    user = TestDataFactory.create_user()

    # 2. 执行 (Act)
    response = self.api_get('/api/users/')

    # 3. 断言 (Assert)
    self.assertEqual(response.status_code, 200)
    self.assertGreater(len(response.data), 0)
```

### 3. 测试隔离

```python
# ✅ 好的做法 - 每个测试独立
def test_create_workorder():
    wo = WorkOrder.objects.create(...)
    self.assertIsNotNone(wo.order_number)

def test_delete_workorder():
    wo = WorkOrder.objects.create(...)
    wo.delete()
    self.assertFalse(WorkOrder.objects.filter(id=wo.id).exists())

# ❌ 不好的做法 - 测试依赖
def test_create_and_delete():
    wo = create_workorder()
    # ... 很多代码
    delete_workorder(wo)  # 如果这步失败，影响后续测试
```

### 4. 使用测试数据工厂

```python
# ✅ 好的做法 - 使用 TestDataFactory
user = TestDataFactory.create_user()
customer = TestDataFactory.create_customer(salesperson=user)

# ❌ 不好的做法 - 重复代码
user = User.objects.create_user(
    username='test',
    password='test',
    email='test@example.com',
    first_name='Test',
    last_name='User'
)
customer = Customer.objects.create(
    name='Test Customer',
    contact_person='Test',
    phone='123456',
    salesperson=user
)
```

---

## 调试测试

### 查看详细输出

```bash
# 详细输出（显示每个测试的详细信息）
python manage.py test workorder.tests --verbosity=2

# 超详细输出（显示 SQL 查询）
python manage.py test workorder.tests --verbosity=3
```

### 调试单个测试

```bash
# 使用 pdb 调试
python manage.py test workorder.tests.test_models.WorkOrderModelTest.test_generate_order_number --debug-mode

# 或在测试中添加断点
def test_something():
    import pdb; pdb.set_trace()
    # 测试代码
```

### 保持测试数据库

```bash
# 使用 keepdb 加快测试速度
python manage.py test workorder.tests --keepdb

# 手动清理
python manage.py flush --noinput
```

---

## 常见问题

### Q: 测试很慢怎么办？

A:
1. 使用 `--keepdb` 避免重复创建数据库
2. 使用 `--parallel` 并行运行测试
3. 使用 SQLite 内存数据库（已配置）
4. 只运行相关的测试

### Q: 测试失败怎么办？

A:
1. 使用 `--verbosity=2` 查看详细输出
2. 运行单个失败的测试
3. 检查测试数据是否正确
4. 查看数据库状态

### Q: 如何测试异步代码？

A: 使用 `djangoAsyncTestCase` 或 pytest-asyncio

### Q: 如何测试 API 认证？

A: 使用 `force_login` 或 API 客户端登录：

```python
# 方法 1: force_login
self.client.force_login(self.user)

# 方法 2: API 登录
response = self.client.post('/api/auth/login/', {
    'username': 'test',
    'password': 'testpass'
})
token = response.data['token']
self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
```

---

## 参考资源

- [Django 测试文档](https://docs.djangoproject.com/en/4.2/topics/testing/)
- [DRF 测试文档](https://www.django-rest-framework.org/api-guide/testing/)
- [pytest-django 文档](https://pytest-django.readthedocs.io/)
- [Coverage.py 文档](https://coverage.readthedocs.io/)

---

## 下一步计划

- [ ] 增加更多边界条件测试
- [ ] 增加性能测试
- [ ] 增加端到端测试（Playwright/Cypress）
- [ ] 达到 80% 代码覆盖率目标
- [ ] 增加压力测试

---

**最后更新：** 2026-01-15
**维护者：** 开发团队
