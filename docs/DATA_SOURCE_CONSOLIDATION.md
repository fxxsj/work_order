# 预设数据源合并说明

## 背景

之前预设工序数据在两个地方重复定义：
1. **迁移文件** `0002_load_preset_processes.py` - 用于数据库初始化
2. **Fixtures文件** `preset_processes.json` - 用于管理命令重置数据

这导致数据重复和维护困难。

## 解决方案

### 创建共享数据源

创建了 `workorder/data.py` 文件，作为预设数据的单一数据源（Single Source of Truth）：

```python
# workorder/data.py
PRESET_PROCESSES = [
    {'code': 'CTP', 'name': '制版', ...},
    {'code': 'CUT', 'name': '开料', ...},
    # ... 21个预设工序
]

PRESET_PROCESS_CODES = [p['code'] for p in PRESET_PROCESSES]
```

### 更新迁移文件

迁移文件现在从共享数据源导入数据：

```python
# migrations/0002_load_preset_processes.py
from workorder.data import PRESET_PROCESSES, PRESET_PROCESS_CODES

def load_preset_processes_forward(apps, schema_editor):
    for process_data in PRESET_PROCESSES:
        Process.objects.create(**process_data)
```

### 更新管理命令

管理命令也使用共享数据源，不再加载 fixtures 文件：

```python
# management/commands/reset_processes.py
from workorder.data import PRESET_PROCESSES

# 直接创建工序，不再使用 loaddata 命令
for process_data in PRESET_PROCESSES:
    Process.objects.create(**process_data)
```

## 优势

1. ✅ **单一数据源** - 数据只在一个地方定义
2. ✅ **数据一致性** - 迁移文件和管理命令使用相同的数据
3. ✅ **易于维护** - 只需在一个地方修改数据
4. ✅ **减少重复** - 消除了数据重复
5. ✅ **类型安全** - Python 代码比 JSON 更容易验证

## 扩展：部门和部门-工序关联

同样将预设部门和部门-工序关联数据合并到共享数据源：

### 添加的数据定义

```python
# workorder/data.py

# 预设部门数据（共11个）
PRESET_MANAGEMENT_DEPARTMENTS = [...]  # 管理部门（5个）
PRESET_PRODUCTION_DEPARTMENT = {...}   # 生产部（1个）
PRESET_WORKSHOP_DEPARTMENTS = [...]    # 生产车间（5个）
PRESET_DEPARTMENT_CODES = [...]        # 所有部门编码

# 部门-工序关联映射
DEPARTMENT_PROCESS_MAPPING = {
    'design': ['CTP'],
    'cutting': ['CUT', 'SCORE', 'TRIM'],
    # ...
}
```

### 更新的迁移文件

1. **`migrations/0003_load_departments.py`** - 使用共享数据源加载部门
2. **`migrations/0004_configure_department_processes.py`** - 使用共享数据源配置关联关系

## 文件状态

### 保留
- ✅ `workorder/data.py` - 共享数据源（包含所有预设数据）
  - `PRESET_PROCESSES` - 21个预设工序
  - `PRESET_MANAGEMENT_DEPARTMENTS` - 5个管理部门
  - `PRESET_PRODUCTION_DEPARTMENT` - 1个生产部
  - `PRESET_WORKSHOP_DEPARTMENTS` - 5个生产车间
  - `DEPARTMENT_PROCESS_MAPPING` - 部门-工序关联映射
- ✅ `migrations/0002_load_preset_processes.py` - 迁移文件（已更新）
- ✅ `migrations/0003_load_departments.py` - 迁移文件（已更新）
- ✅ `migrations/0004_configure_department_processes.py` - 迁移文件（已更新）
- ✅ `management/commands/reset_processes.py` - 管理命令（已更新）

### 已删除（废弃）
- ❌ `fixtures/preset_processes.json` - 已删除，数据已迁移到 `workorder/data.py`
- ❌ `fixtures/initial_data.json` - 已删除（旧的工序数据）
- ❌ `fixtures/current_processes.json` - 已删除（不完整的工序数据）
- ❌ `fixtures/process_categories.json` - 已删除（ProcessCategory已废弃）
- ❌ `fixtures/processes_with_category.json` - 已删除（category字段已删除）

### 保留（可选）
- ⚠️ `fixtures/initial_products.json` - 测试产品数据（可选保留）

## 优势总结

1. ✅ **单一数据源** - 所有预设数据统一管理
2. ✅ **数据一致性** - 迁移文件和管理命令使用相同数据
3. ✅ **易于维护** - 只需在一个地方修改数据
4. ✅ **减少重复** - 消除了所有数据重复
5. ✅ **类型安全** - Python 代码比 JSON 更容易验证
6. ✅ **版本控制友好** - Python 代码更容易查看差异

## 未来扩展

如果需要添加其他预设数据（如用户组权限等），也可以添加到 `workorder/data.py`：

```python
# 预设用户组权限配置
PRESET_GROUP_PERMISSIONS = {
    '业务员': {...},
    # ...
}
```

这样可以保持数据管理的一致性和可维护性。

