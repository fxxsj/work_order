---
wave: 1
phase: 04-test-framework
task: 04-01
depends_on: []
files_modified:
  - "backend/workorder/tests/models/__init__.py"
  - "backend/workorder/tests/views/__init__.py"
  - "backend/workorder/tests/conftest.py"
autonomous: true
---

# PLAN-01: 创建后端测试目录结构

## 目标
建立规范的测试目录结构，组织模型测试和视图集测试到独立子目录，配置 pytest fixtures。

## 背景
当前测试文件混在 `tests/` 根目录，需要创建 `models/` 和 `views/` 子目录来组织单元测试，便于管理和扩展。

## 范围
- 创建 `tests/models/` 目录结构
- 创建 `tests/views/` 目录结构
- 增强 `conftest.py` fixtures

## 前置条件
- pytest-django 已安装并配置
- 测试数据库可访问

## must_haves
```yaml
must_haves:
  truths:
    - "Test directory structure created with models/ and views/ subdirectories"
    - "Pytest fixtures configured for database access and API client"
    - "Test files organized by module (models, views)"
  artifacts:
    - path: "backend/workorder/tests/models/__init__.py"
      provides: "Package marker for models test module"
    - path: "backend/workorder/tests/views/__init__.py"
      provides: "Package marker for views test module"
    - path: "backend/workorder/tests/conftest.py"
      provides: "Enhanced pytest fixtures for testing"
```

## 任务列表

<task type="auto">
  <name>创建 tests/models/__init__.py</name>
  <files>backend/workorder/tests/models/__init__.py</files>
  <action>Create backend/workorder/tests/models/__init__.py with package marker and module exports</action>
  <verify>cat backend/workorder/tests/models/__init__.py</verify>
  <done>tests/models/__init__.py created with package marker</done>
</task>

<task type="auto">
  <name>创建 tests/views/__init__.py</name>
  <files>backend/workorder/tests/views/__init__.py</files>
  <action>Create backend/workorder/tests/views/__init__.py with package marker and module exports</action>
  <verify>cat backend/workorder/tests/views/__init__.py</verify>
  <done>tests/views/__init__.py created with package marker</done>
</task>

<task type="auto">
  <name>增强 conftest.py fixtures</name>
  <files>backend/workorder/tests/conftest.py</files>
  <action>Add pytest fixtures for db fixture, api_client_with_user factory, and model factories. Include fixtures: db, api_client, api_client_with_user, test_user, test_customer, test_process, test_workorder</action>
  <verify>grep -E "@pytest.fixture" backend/workorder/tests/conftest.py | head -10</verify>
  <done>conftest.py fixtures enhanced with db and model factories</done>
</task>

<task type="auto">
  <name>验证目录结构</name>
  <files>backend/workorder/tests/</files>
  <action>Verify the complete test directory structure exists: tests/models/, tests/views/, and conftest.py with fixtures</action>
  <verify>ls -la backend/workorder/tests/ && ls -la backend/workorder/tests/models/ && ls -la backend/workorder/tests/views/</verify>
  <done>Test directory structure verified</done>
</task>

## 验证标准
1. `tests/models/` 和 `tests/views/` 目录存在
2. `__init__.py` 文件包含适当的包标记
3. conftest.py 包含 pytest fixtures (db, api_client, api_client_with_user)
4. 可以运行 `pytest --collect-only` 收集测试而不报错

## 后续步骤
- PLAN-02 编写模型单元测试（依赖本计划）
- PLAN-03 编写视图集单元测试（依赖本计划）

## 备注
- 遵循现有的 conftest.py 风格和 fixtures 命名约定
- fixtures 使用 `db` fixture 确保测试隔离
- API client fixtures 支持 DRF 的 APIClient
