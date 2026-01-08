# Fixtures 文件使用指南

> **最后更新**: 2026-01-07  
> **状态**: 当前 fixtures 目录仅保留测试/示例数据

## 概述

Fixtures 文件是 Django 提供的一种数据加载方式，用于在数据库中加载预设数据。本项目中的 fixtures 文件主要用于加载测试/示例数据。

**重要说明**：系统必需的预设数据（如工序、部门）已统一使用迁移文件加载，数据源为 `workorder/data.py`。Fixtures 仅用于测试/示例数据。

---

## 一、当前可用的 Fixtures 文件

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

**包含的产品**:
- 宣传册 (PR001)
- 名片 (PR002)
- 海报 (PR003)
- 画册 (PR004)
- 包装盒 (PR005)
- 展示牌 (PR006)

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

**包含的用户**:
- 业务员 (business_user) → 业务部
- 财务员 (finance_user) → 财务部
- 设计员 (design_user) → 设计部
- 采购员 (purchase_user) → 采购部
- 运输员 (logistics_user) → 运输部
- 生产主管 (production_user) → 生产部
- 裁切操作员 (cutting_user) → 裁切车间
- 印刷操作员 (printing_user) → 印刷车间
- 外协操作员 (outsourcing_user) → 外协车间
- 模切操作员 (die_cutting_user) → 模切车间
- 包装操作员 (packaging_user) → 包装车间

---

## 二、已删除的 Fixtures 文件

以下文件已被删除，因为数据已统一迁移到 `workorder/data.py` 共享数据源：

1. ❌ **`initial_data.json`** - 旧的工序数据（P001-P008），已被新的21个预设工序替代
2. ❌ **`preset_processes.json`** - 工序数据已合并到 `workorder/data.py` 的 `PRESET_PROCESSES`
3. ❌ **`current_processes.json`** - 不完整的工序数据，已被替代
4. ❌ **`process_categories.json`** - ProcessCategory 模型已删除，改为使用 Department
5. ❌ **`processes_with_category.json`** - category 字段已删除，改为部门关联

---

## 三、使用方法

### 方法一：使用 loaddata 命令加载产品数据

```bash
# 进入后端目录
cd backend

# 激活虚拟环境
source venv/bin/activate  # macOS/Linux
# 或
venv\Scripts\activate  # Windows

# 加载产品数据
python manage.py loaddata workorder/fixtures/initial_products.json
```

### 方法二：使用管理命令加载用户数据

```bash
# 加载用户数据（会自动创建 UserProfile 并关联部门）
python manage.py load_initial_users

# 如果用户已存在，使用 --force 参数覆盖
python manage.py load_initial_users --force
```

### 方法三：在测试中使用

在测试文件中可以直接使用 fixtures：

```python
from django.test import TestCase

class ProductTestCase(TestCase):
    fixtures = ['workorder/fixtures/initial_products.json']
    
    def test_product_count(self):
        from workorder.models import Product
        self.assertEqual(Product.objects.count(), 6)
```

---

## 四、数据加载方式架构

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

## 五、共享数据源：`workorder/data.py`

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

## 六、注意事项

### 1. 字段匹配

Fixtures 文件中的字段必须与模型定义完全匹配。如果模型字段发生变化，需要同步更新 fixtures 文件。

**当前 Product 模型字段**：
- `name` - 产品名称
- `code` - 产品编码（唯一）
- `specification` - 规格
- `unit` - 单位
- `unit_price` - 单价
- `description` - 产品描述
- `is_active` - 是否启用
- `created_at` - 创建时间
- `updated_at` - 更新时间
- `default_processes` - 默认工序（多对多关系，在 fixtures 中不直接设置）

### 2. 主键（pk）处理

- 如果 fixtures 中指定了 `pk`，Django 会尝试使用该主键创建对象
- 如果主键已存在，会报错（除非使用 `--ignorenonexistent` 参数）
- 建议：对于测试数据，可以不指定 `pk`，让 Django 自动分配

### 3. 外键和多对多关系

- **外键**：使用目标对象的主键ID
- **多对多关系**：在 fixtures 中不能直接设置，需要在加载后通过代码设置

例如，如果要为产品设置默认工序：

```python
# 加载 fixtures 后
from workorder.models import Product, Process

product = Product.objects.get(code='PR001')
# 设置默认工序
product.default_processes.add(Process.objects.get(code='PRT'))
```

### 4. 时间字段

- `created_at` 和 `updated_at` 如果使用 `auto_now_add` 和 `auto_now`，在 fixtures 中可以省略
- 如果指定了时间，格式应为 ISO 8601：`"2024-01-01T00:00:00Z"`

---

## 七、最佳实践

### 1. 何时使用 Fixtures

✅ **适合使用 fixtures**：
- 测试数据
- 示例/演示数据
- 开发环境初始化

❌ **不适合使用 fixtures**：
- 系统必需的预设数据（应使用迁移文件 + `data.py`）
- 生产环境数据

### 2. 与迁移文件的区别

| 特性 | Fixtures | 迁移文件 |
|------|----------|----------|
| 用途 | 测试/示例数据 | 系统必需数据 |
| 自动执行 | 否（需手动加载） | 是（迁移时自动执行） |
| 版本控制 | 是 | 是 |
| 数据一致性 | 依赖手动维护 | 自动保证 |
| 推荐场景 | 测试数据 | 预设数据（工序、部门等） |

### 3. 数据源选择

| 数据类型 | 推荐方式 | 数据源 | 加载时机 |
|---------|---------|--------|---------|
| 系统预设数据（工序、部门等） | 迁移文件 | `workorder/data.py` | 迁移时自动 |
| 测试/示例数据（产品等） | Fixtures | `fixtures/*.json` | 手动加载 |
| 用户数据 | 迁移文件 | 迁移代码中定义 | 迁移时自动 |

### 4. 添加新预设数据

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

## 八、使用示例

### 加载产品数据

```bash
# 1. 确保数据库已迁移
python manage.py migrate

# 2. 加载产品数据
python manage.py loaddata workorder/fixtures/initial_products.json

# 3. 验证数据
python manage.py shell
>>> from workorder.models import Product
>>> Product.objects.count()
6
>>> Product.objects.all()
<QuerySet [<Product: PR001 - 宣传册>, <Product: PR002 - 名片>, ...]>
```

### 加载用户数据

```bash
# 1. 确保数据库已迁移（包括部门数据）
python manage.py migrate

# 2. 加载用户数据
python manage.py load_initial_users

# 3. 验证数据
python manage.py shell
>>> from django.contrib.auth.models import User
>>> from workorder.models import UserProfile
>>> User.objects.filter(username__endswith='_user').count()
11
>>> user = User.objects.get(username='business_user')
>>> user.profile.departments.first().name
'业务部'
>>> # 测试登录（密码：123456）
>>> user.check_password('123456')
True
```

---

## 九、常见问题

### Q: 加载 fixtures 时提示字段不存在？

**A**: 检查 fixtures 文件中的字段是否与模型定义匹配。已移除的字段需要从 fixtures 中删除。

### Q: 如何更新 fixtures 文件？

**A**: 
1. 修改 JSON 文件
2. 重新加载：`python manage.py loaddata workorder/fixtures/initial_products.json`
3. 如果数据已存在，需要先删除或使用 `--ignorenonexistent` 参数

### Q: 如何导出当前数据为 fixtures？

**A**: 
```bash
python manage.py dumpdata workorder.Product --indent 2 > workorder/fixtures/initial_products.json
```

### Q: 产品数据应该用 fixtures 还是迁移文件？

**A**: 
- **测试/示例数据**：使用 fixtures（当前方式）
- **系统必需数据**：使用迁移文件（如工序、部门）

当前的产品数据是示例数据，使用 fixtures 是合适的。

---

## 十、数据加载流程图

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

## 十一、维护说明

当修改预设数据时：
1. 更新 `workorder/data.py` 中的相应数据
2. 迁移文件会自动使用更新后的数据
3. 管理命令也会使用更新后的数据
4. 无需修改多个文件，确保数据一致性

---

## 相关文档

- [数据初始化分析](./DATA_INITIALIZATION_ANALYSIS.md) - 系统数据初始化详细说明
- [数据源统一说明](./DATA_SOURCE_CONSOLIDATION.md) - 数据合并的详细过程

