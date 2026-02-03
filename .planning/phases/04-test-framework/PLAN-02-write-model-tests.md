---
wave: 2
phase: 04-test-framework
task: 04-02
depends_on:
  - "04-01"
files_modified:
  - "backend/workorder/tests/models/test_core.py"
  - "backend/workorder/tests/models/test_base.py"
autonomous: true
---

# PLAN-02: 编写模型单元测试

## 目标
为核心业务模型编写单元测试，验证模型验证逻辑、状态转换、关联关系和业务规则。

## 背景
核心模型 (WorkOrder, WorkOrderTask, WorkOrderProcess) 包含重要的业务逻辑，需要通过单元测试确保：
- 施工单号自动生成
- 任务状态转换
- 工序依赖关系
- 验证规则

## 范围
- `tests/models/test_core.py` - 测试核心模型 (WorkOrder, WorkOrderTask, WorkOrderProcess)
- `tests/models/test_base.py` - 测试基础模型 (Department, Process, Customer, Product)

## 前置条件
- PLAN-01 完成（测试目录结构和 fixtures 已创建）
- 数据库迁移已执行

## must_haves
```yaml
must_haves:
  truths:
    - "Core model tests exist and cover key business logic"
    - "Tests validate order number generation, status transitions, and relationships"
    - "All tests pass with pytest"
  artifacts:
    - path: "backend/workorder/tests/models/test_core.py"
      provides: "Unit tests for WorkOrder, WorkOrderTask, WorkOrderProcess models"
    - path: "backend/workorder/tests/models/test_base.py"
      provides: "Unit tests for Department, Process, Customer, Product models"
```

## 任务列表

<task type="auto">
  <name>编写 test_core.py - WorkOrder 模型测试</name>
  <files>backend/workorder/tests/models/test_core.py</files>
  <action>Create test_core.py with tests for:
    - WorkOrder.order_number generation (format, uniqueness)
    - WorkOrder.status default values (pending, approval_status)
    - WorkOrder.validate_before_approval()
    - WorkOrder.convert_draft_tasks()
    - WorkOrder.delete_draft_tasks()
    - WorkOrder.get_progress_percentage()
    Test using pytest-django with db fixture and model factories.</action>
  <verify>pytest backend/workorder/tests/models/test_core.py::WorkOrderModelTest -v --collect-only 2>&1 | head -20</verify>
  <done>test_core.py created with WorkOrder model tests</done>
</task>

<task type="auto">
  <name>编写 test_core.py - WorkOrderTask 模型测试</name>
  <files>backend/workorder/tests/models/test_core.py</files>
  <action>Add tests for WorkOrderTask model:
    - Task status transitions (draft -> pending -> in_progress -> completed)
    - Task assignment (_auto_assign_task)
    - Task relationships (work_order_process, assigned_department)
    - Task quantity calculations
    Tests should use @pytest.mark.django_db and fixtures from conftest.py.</action>
  <verify>pytest backend/workorder/tests/models/test_core.py::WorkOrderTaskModelTest -v --collect-only 2>&1 | head -15</verify>
  <done>test_core.py WorkOrderTask tests added</done>
</task>

<task type="auto">
  <name>编写 test_core.py - WorkOrderProcess 模型测试</name>
  <files>backend/workorder/tests/models/test_core.py</files>
  <action>Add tests for WorkOrderProcess model:
    - Process status transitions
    - can_start() logic (sequential vs parallel processes)
    - check_and_update_status() auto-completion
    - generate_tasks() task creation
    - generate_draft_tasks() draft task creation
    Tests should cover both sequential and parallel process scenarios.</action>
  <verify>pytest backend/workorder/tests/models/test_core.py::WorkOrderProcessModelTest -v --collect-only 2>&1 | head -15</verify>
  <done>test_core.py WorkOrderProcess tests added</done>
</task>

<task type="auto">
  <name>编写 test_base.py - Department 模型测试</name>
  <files>backend/workorder/tests/models/test_base.py</files>
  <action>Create test_base.py with tests for Department model:
    - Department hierarchy (parent/child relationships)
    - Department.processes ManyToMany relationship
    - Department.is_active filtering
    - Department __str__ representation
    Tests should use existing DepartmentFactory from tests/factories/.</action>
  <verify>pytest backend/workorder/tests/models/test_base.py::DepartmentModelTest -v --collect-only 2>&1 | head -10</verify>
  <done>test_base.py created with Department model tests</done>
</task>

<task type="auto">
  <name>编写 test_base.py - Process 模型测试</name>
  <files>backend/workorder/tests/models/test_base.py</files>
  <action>Add tests for Process model:
    - Process validation (code uniqueness, name required)
    - Process.is_builtin flag behavior
    - Process.is_parallel flag behavior
    - Process.departments ManyToMany relationship
    - Process __str__ representation</action>
  <verify>pytest backend/workorder/tests/models/test_base.py::ProcessModelTest -v --collect-only 2>&1 | head -10</verify>
  <done>test_base.py Process tests added</done>
</task>

<task type="auto">
  <name>运行所有模型单元测试</name>
  <files>backend/workorder/tests/models/</files>
  <action>Run pytest on all model tests to verify they pass:
    pytest backend/workorder/tests/models/ -v --tb=short</action>
  <verify>pytest backend/workorder/tests/models/ -v --tb=short 2>&1 | tail -20</verify>
  <done>All model unit tests pass</done>
</task>

## 验证标准
1. `test_core.py` 包含 WorkOrder, WorkOrderTask, WorkOrderProcess 的测试
2. `test_base.py` 包含 Department, Process, Customer, Product 的测试
3. 每个模型至少包含 3-5 个测试用例
4. 测试覆盖关键业务逻辑（状态转换、验证规则、关联关系）
5. 所有测试通过，无 skip 或 xfail（除非预期）

## 测试用例优先级
| 优先级 | 测试内容 |
|--------|----------|
| P0 | 施工单号生成和唯一性 |
| P0 | 施工单默认状态 |
| P0 | 任务状态转换 |
| P0 | 工序开始条件 (can_start) |
| P1 | 进度百分比计算 |
| P1 | 草稿任务转换 |
| P2 | 部门层级关系 |

## 后续步骤
- PLAN-04 运行测试验证覆盖率（依赖本计划）

## 备注
- 使用 `@pytest.mark.django_db` 标记需要数据库的测试
- 使用 fixtures 从 conftest.py 创建测试数据
- 使用 `assert` 断言，消息清晰
- 测试命名遵循 `test_<method_name>_<scenario>` 模式
