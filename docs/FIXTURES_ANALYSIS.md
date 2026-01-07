# Fixtures 文件分析报告

> **最后更新**: 2026-01-07
> **状态**: 当前 fixtures 目录仅保留测试/示例数据

## 当前 Fixtures 文件列表

### 1. `initial_products.json` ✅ **保留 - 测试数据**

**内容**: 包含6个示例产品数据
- 产品：宣传册、名片、海报、画册、包装盒、展示牌
- 字段已更新为匹配当前 Product 模型

**状态**: ✅ **保留**
- 用途：测试/示例数据，用于开发和演示
- 加载方式：手动执行 `python manage.py loaddata workorder/fixtures/initial_products.json`
- 非系统必需数据，不通过迁移自动加载
- 字段已修复，移除了不存在的字段（`paper_type`, `paper_weight` 等）

**使用场景**:
- 开发环境快速初始化测试数据
- 演示系统功能
- 本地测试

---

### 2. `initial_users.json` ✅ **保留 - 测试数据**

**内容**: 包含11个预设用户数据
- 用户：业务员、财务员、设计员、采购员、运输员、生产主管，以及5个车间操作员
- 所有用户默认密码：`123456`
- 通过管理命令自动关联部门

**状态**: ✅ **保留**
- 用途：测试/示例数据，用于开发和演示
- 加载方式：使用管理命令 `python manage.py load_initial_users`
- 管理命令会自动创建 UserProfile 并关联对应的部门
- 非系统必需数据，不通过迁移自动加载
- 与 `initial_products.json` 一样，作为测试数据使用

---

## 已删除的 Fixtures 文件

以下文件已被删除，因为数据已统一迁移到 `workorder/data.py` 共享数据源：

1. ❌ **`initial_data.json`** - 旧的工序数据（P001-P008），已被新的21个预设工序替代
2. ❌ **`preset_processes.json`** - 工序数据已合并到 `workorder/data.py` 的 `PRESET_PROCESSES`
3. ❌ **`current_processes.json`** - 不完整的工序数据，已被替代
4. ❌ **`process_categories.json`** - ProcessCategory 模型已删除，改为使用 Department
5. ❌ **`processes_with_category.json`** - category 字段已删除，改为部门关联

---

## 数据加载方式架构

### 系统必需数据（通过迁移文件自动加载）

所有系统必需的预设数据现在通过**迁移文件**加载，数据源统一为 `workorder/data.py`：

| 数据类型 | 迁移文件 | 数据源 | 说明 |
|---------|---------|--------|------|
| 工序数据 | `0002_load_preset_processes.py` | `data.PRESET_PROCESSES` | 21个标准工序 |
| 部门数据 | `0003_load_departments.py` | `data.PRESET_MANAGEMENT_DEPARTMENTS`<br>`data.PRESET_PRODUCTION_DEPARTMENT`<br>`data.PRESET_WORKSHOP_DEPARTMENTS` | 11个部门（5个管理+1个生产+5个车间） |
| 部门-工序关联 | `0004_configure_department_processes.py` | `data.DEPARTMENT_PROCESS_MAPPING` | 部门与工序的多对多关系 |
| 用户组数据 | `0005_load_user_groups.py` | 迁移代码中直接定义 | 业务员组及其权限 |

**优势**:
- ✅ 数据一致性：单一数据源，避免冗余
- ✅ 自动加载：迁移时自动执行
- ✅ 版本控制：迁移文件记录数据变更历史
- ✅ 可回滚：支持迁移回滚操作

---

### 测试/示例数据（使用 Fixtures，手动加载）

| 数据类型 | Fixtures 文件 | 加载方式 | 说明 |
|---------|--------------|---------|------|
| 产品数据 | `initial_products.json` | `python manage.py loaddata workorder/fixtures/initial_products.json` | 6个示例产品 |
| 用户数据 | `initial_users.json` | `python manage.py load_initial_users` | 11个示例用户（带部门关联） |

**使用场景**:
- 开发环境快速初始化测试数据
- 功能演示
- 单元测试

---

## 共享数据源：`workorder/data.py`

所有系统必需的预设数据现在统一存储在 `workorder/data.py` 中：

```python
# 工序数据
PRESET_PROCESSES = [...]  # 21个标准工序
PRESET_PROCESS_CODES = [...]  # 用于回滚验证

# 部门数据
PRESET_MANAGEMENT_DEPARTMENTS = [...]  # 5个管理部门
PRESET_PRODUCTION_DEPARTMENT = {...}  # 1个生产部
PRESET_WORKSHOP_DEPARTMENTS = [...]  # 5个生产车间
PRESET_DEPARTMENT_CODES = [...]  # 所有部门编码

# 部门-工序映射
DEPARTMENT_PROCESS_MAPPING = {...}  # 部门与工序的关联关系
```

**使用此数据源的代码**:
- `workorder/migrations/0002_load_preset_processes.py`
- `workorder/migrations/0003_load_departments.py`
- `workorder/migrations/0004_configure_department_processes.py`
- `workorder/management/commands/reset_processes.py`

---

## 管理命令使用情况

### `reset_processes.py` - 重置工序数据

**之前**: 使用 `preset_processes.json` fixtures 文件
```python
call_command('loaddata', 'workorder/fixtures/preset_processes.json')
```

**现在**: 直接使用 `workorder/data.py` 共享数据源
```python
from workorder.data import PRESET_PROCESSES
for process_data in PRESET_PROCESSES:
    Process.objects.create(**process_data)
```

**优势**:
- 与迁移文件使用相同的数据源，确保一致性
- 不依赖 fixtures 文件，减少文件管理复杂度

---

## 总结

### ✅ 保留的文件
1. **`initial_products.json`** - 产品测试数据（手动加载）

### ✅ 保留的文件
1. **`initial_users.json`** - 用户测试数据（通过管理命令加载）

### ❌ 已删除的文件
1. `initial_data.json` - 旧工序数据
2. `preset_processes.json` - 已合并到 `data.py`
3. `current_processes.json` - 不完整数据
4. `process_categories.json` - 模型已删除
5. `processes_with_category.json` - 字段已删除

---

## 数据加载流程图

```
┌─────────────────────────────────────────────────────┐
│           系统必需数据（自动加载）                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  workorder/data.py (单一数据源)                      │
│         ↓                                           │
│  ┌─────────────────────────────────────┐           │
│  │ 迁移文件自动执行                      │           │
│  │ • 0002: 工序数据                      │           │
│  │ • 0003: 部门数据                      │           │
│  │ • 0004: 部门-工序关联                 │           │
│  │ • 0005: 用户组数据                    │           │
│  │ • 0006: 初始用户数据                  │           │
│  └─────────────────────────────────────┘           │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│           测试/示例数据（手动加载）                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  fixtures/initial_products.json                     │
│         ↓                                           │
│  手动执行: python manage.py loaddata               │
│         ↓                                           │
│  加载测试数据                                       │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 最佳实践建议

### 1. 何时使用 Fixtures
✅ **适合使用 fixtures**：
- 测试数据
- 示例/演示数据
- 开发环境初始化

❌ **不适合使用 fixtures**：
- 系统必需的预设数据（应使用迁移文件 + `data.py`）
- 生产环境数据

### 2. 数据源选择

| 数据类型 | 推荐方式 | 数据源 | 加载时机 |
|---------|---------|--------|---------|
| 系统预设数据（工序、部门等） | 迁移文件 | `workorder/data.py` | 迁移时自动 |
| 测试/示例数据（产品等） | Fixtures | `fixtures/*.json` | 手动加载 |
| 用户数据 | 迁移文件 | 迁移代码中定义 | 迁移时自动 |

### 3. 添加新预设数据

如果将来需要添加新的系统预设数据：

1. **添加到 `workorder/data.py`**：
   ```python
   PRESET_NEW_DATA = [...]
   ```

2. **创建迁移文件**：
   ```python
   from workorder.data import PRESET_NEW_DATA
   
   def load_new_data(apps, schema_editor):
       Model = apps.get_model('workorder', 'Model')
       for item in PRESET_NEW_DATA:
           Model.objects.create(**item)
   ```

3. **更新管理命令**（如需要）：
   ```python
   from workorder.data import PRESET_NEW_DATA
   # 使用共享数据源
   ```

---

## 相关文档

- [Fixtures 使用指南](./FIXTURES_USAGE.md) - 详细的使用说明和示例
- [数据源统一说明](./DATA_SOURCE_CONSOLIDATION.md) - 数据合并的详细过程

---

## 维护说明

当修改预设数据时：
1. 更新 `workorder/data.py` 中的相应数据
2. 迁移文件会自动使用更新后的数据
3. 管理命令也会使用更新后的数据
4. 无需修改多个文件，确保数据一致性
