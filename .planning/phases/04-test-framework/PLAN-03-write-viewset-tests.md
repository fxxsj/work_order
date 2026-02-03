---
wave: 2
phase: 04-test-framework
task: 04-03
depends_on:
  - "04-01"
files_modified:
  - "backend/workorder/tests/views/test_work_orders.py"
  - "backend/workorder/tests/views/test_work_order_tasks.py"
autonomous: true
---

# PLAN-03: 编写视图集单元测试

## 目标
为施工单和任务相关视图集编写单元测试，验证 API 端点行为、权限控制和业务逻辑。

## 背景
视图集测试确保：
- API 端点正确响应 CRUD 操作
- 权限检查正常工作
- 自定义 action (submit_approval, approve, reject) 正常执行
- 序列化器和数据验证正确

## 范围
- `tests/views/test_work_orders.py` - 测试 WorkOrderViewSet
- `tests/views/test_work_order_tasks.py` - 测试 WorkOrderTaskViewSet

## 前置条件
- PLAN-01 完成（测试目录结构和 fixtures 已创建）
- 视图集代码已实现

## must_haves
```yaml
must_haves:
  truths:
    - "Viewset tests exist and cover CRUD operations"
    - "Tests validate permission checking and authentication"
    - "Tests cover custom actions (submit_approval, approve, reject, start, complete)"
    - "All viewset tests pass with pytest"
  artifacts:
    - path: "backend/workorder/tests/views/test_work_orders.py"
      provides: "Unit tests for WorkOrderViewSet (list, create, retrieve, update, custom actions)"
    - path: "backend/workorder/tests/views/test_work_order_tasks.py"
      provides: "Unit tests for WorkOrderTaskViewSet (list, status updates, task assignment)"
```

## 任务列表

<task type="auto">
  <name>创建 test_work_orders.py - 基础 CRUD 测试</name>
  <files>backend/workorder/tests/views/test_work_orders.py</files>
  <action>Create test_work_orders.py with tests for WorkOrderViewSet:
    - test_list_workorders - List endpoint returns paginated results
    - test_create_workorder - Create endpoint with valid data
    - test_retrieve_workorder - Retrieve endpoint returns detail serializer
    - test_update_workorder - Update endpoint with valid data
    - test_delete_workorder - Delete endpoint removes workorder
    Use APIClient from DRF and fixtures from conftest.py.</action>
  <verify>pytest backend/workorder/tests/views/test_work_orders.py::WorkOrderViewSetCRUDTest -v --collect-only 2>&1 | head -15</verify>
  <done>test_work_orders.py CRUD tests created</done>
</task>

<task type="auto">
  <name>创建 test_work_orders.py - 权限测试</name>
  <files>backend/workorder/tests/views/test_work_orders.py</files>
  <action>Add permission tests for WorkOrderViewSet:
    - test_list_requires_authentication - Unauthenticated request returns 401
    - test_create_requires_permission - User without add permission gets 403
    - test_update_ownership_check - User can only update own workorders
    - test_delete_requires_permission - Only owner or admin can delete
    Use api_client_with_user fixture for authenticated requests.</action>
  <verify>pytest backend/workorder/tests/views/test_work_orders.py::WorkOrderViewSetPermissionTest -v --collect-only 2>&1 | head -15</verify>
  <done>test_work_orders.py permission tests added</done>
</task>

<task type="auto">
  <name>创建 test_work_orders.py - 自定义 Action 测试</name>
  <files>backend/workorder/tests/views/test_work_orders.py</files>
  <action>Add custom action tests for WorkOrderViewSet:
    - test_submit_approval - POST to submit_approval changes approval_status
    - test_approve - POST to approve changes status to approved
    - test_reject - POST to reject changes status to rejected
    - test_approve_rejected_order_fails - Cannot approve already rejected order
    Tests should verify status transitions and notification creation.</action>
  <verify>pytest backend/workorder/tests/views/test_work_orders.py::WorkOrderViewSetActionTest -v --collect-only 2>&1 | head -15</verify>
  <done>test_work_orders.py custom action tests added</done>
</task>

<task type="auto">
  <name>创建 test_work_order_tasks.py - 任务 API 测试</name>
  <files>backend/workorder/tests/views/test_work_order_tasks.py</files>
  <action>Create test_work_order_tasks.py with tests for WorkOrderTaskViewSet:
    - test_list_tasks_by_workorder - Filter tasks by work_order
    - test_list_tasks_by_department - Filter tasks by assigned_department
    - test_start_task - POST to start action changes status to in_progress
    - test_complete_task - POST to complete action changes status to completed
    - test_task_assignment - Task assignment updates assigned_department/operator
    Use fixtures to create work orders, processes, and tasks.</action>
  <verify>pytest backend/workorder/tests/views/test_work_order_tasks.py::WorkOrderTaskViewSetTest -v --collect-only 2>&1 | head -15</verify>
  <done>test_work_order_tasks.py created with task API tests</done>
</task>

<task type="auto">
  <name>运行所有视图集单元测试</name>
  <files>backend/workorder/tests/views/</files>
  <action>Run pytest on all viewset tests to verify they pass:
    pytest backend/workorder/tests/views/ -v --tb=short</action>
  <verify>pytest backend/workorder/tests/views/ -v --tb=short 2>&1 | tail -25</verify>
  <done>All viewset unit tests pass</done>
</task>

## 验证标准
1. `test_work_orders.py` 包含 CRUD、权限和自定义 action 测试
2. `test_work_order_tasks.py` 包含任务列表、状态更新和分派测试
3. 每个视图集至少包含 8-10 个测试用例
4. 测试覆盖认证、权限和业务逻辑
5. 所有测试通过，无 skip 或 xfail（除非预期）

## 测试用例优先级
| 优先级 | 测试内容 |
|--------|----------|
| P0 | 施工单列表和创建 |
| P0 | 施工单详情和更新 |
| P0 | 任务开始和完成 |
| P0 | 认证检查 |
| P1 | 提交审核流程 |
| P1 | 权限过滤 |
| P2 | 列表筛选和排序 |

## 后续步骤
- PLAN-04 运行测试验证覆盖率（依赖本计划）

## 备注
- 使用 `APIClient` 进行 API 请求
- 使用 `force_authenticate` 模拟登录用户
- 响应状态码使用 `assertEqual(response.status_code, 200/201/204/403/404)`
- 测试数据使用 fixtures 创建，确保测试隔离
- 避免测试外部依赖（如通知服务）
