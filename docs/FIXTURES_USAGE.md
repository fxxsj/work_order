# Fixtures 文件使用指南

## 概述

Fixtures 文件是 Django 提供的一种数据加载方式，用于在数据库中加载预设数据。本项目中的 fixtures 文件主要用于加载测试/示例数据。

## 当前可用的 Fixtures 文件

### 1. `initial_products.json` - 预设产品数据

包含6个示例产品：
- 宣传册 (PR001)
- 名片 (PR002)
- 海报 (PR003)
- 画册 (PR004)
- 包装盒 (PR005)
- 展示牌 (PR006)

---

### 2. `initial_users.json` - 预设用户数据

包含11个示例用户：
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

**注意**：所有用户默认密码为 `123456`

## 使用方法

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

## 注意事项

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

## 最佳实践

### 1. 何时使用 Fixtures

✅ **适合使用 fixtures**：
- 测试数据
- 示例数据
- 开发环境初始化

❌ **不适合使用 fixtures**：
- 系统必需的预设数据（应使用迁移文件）
- 生产环境数据

### 2. 与迁移文件的区别

| 特性 | Fixtures | 迁移文件 |
|------|----------|----------|
| 用途 | 测试/示例数据 | 系统必需数据 |
| 自动执行 | 否（需手动加载） | 是（迁移时自动执行） |
| 版本控制 | 是 | 是 |
| 数据一致性 | 依赖手动维护 | 自动保证 |
| 推荐场景 | 测试数据 | 预设数据（工序、部门等） |

### 3. 数据源统一

对于系统必需的预设数据（如工序、部门），已统一使用迁移文件加载，确保数据一致性。

对于测试/示例数据（如产品、用户），可以使用 fixtures 文件。

## 示例：加载测试数据

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

## 常见问题

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

## 相关文件

- `backend/workorder/fixtures/initial_products.json` - 产品 fixtures
- `backend/workorder/fixtures/initial_users.json` - 用户 fixtures（已通过迁移文件加载）
- `backend/workorder/migrations/0002_load_preset_processes.py` - 工序数据（迁移文件）
- `backend/workorder/migrations/0003_load_departments.py` - 部门数据（迁移文件）

