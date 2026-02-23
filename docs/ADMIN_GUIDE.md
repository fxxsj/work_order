# Django Admin 管理指南

> 版本: 1.0
> 更新日期: 2026-02-23
> 状态: 最新

---

## 进度总览

### Admin 模块化状态

- [x] Admin 配置按业务领域拆分为 13 个独立模块
- [x] 修复所有字段引用错误（65个 → 0个）
- [x] 实现通用工具函数（状态徽章、优先级徽章等）
- [x] 39 个 Admin 类定义（31 个已启用，8 个待启用）
- [x] 通过 Django 系统检查验证

---

## 目录

1. [快速开始](#快速开始)
2. [Admin 模块架构](#admin-模块架构)
3. [基础管理](#基础管理)
4. [业务管理](#业务管理)
5. [高级功能](#高级功能)
6. [常见操作](#常见操作)
7. [故障排查](#故障排查)

---

## 快速开始

### 访问管理后台

```
URL: http://localhost:8000/admin/
用户名: admin
密码: admin123
```

### 首次登录建议

1. **修改默认密码**
   ```python
   # 通过管理后台修改
   用户 → Admin → 更改密码
   ```

2. **创建管理员账号**
   ```bash
   python manage.py createsuperuser
   ```

3. **验证系统状态**
   ```bash
   python manage.py check
   # 输出: System check identified no issues (0 silenced).
   ```

---

## Admin 模块架构

### 模块划分

```
backend/workorder/admin/
│
├── __init__.py         # 模块入口，统一导出
├── mixins.py           # 通用混入类
├── utils.py            # 工具函数
│
├── base.py             # 基础管理 (3 个 Admin)
│   ├── CustomerAdmin
│   ├── DepartmentAdmin
│   └── ProcessAdmin
│
├── products.py         # 产品管理 (3 个 Admin)
│   ├── ProductAdmin
│   ├── ProductGroupAdmin
│   └── ProductGroupItemAdmin
│
├── materials.py        # 物料管理 (5 个 Admin)
│   ├── MaterialAdmin
│   ├── SupplierAdmin
│   ├── MaterialSupplierAdmin
│   ├── PurchaseOrderAdmin
│   └── PurchaseOrderItemAdmin
│
├── assets.py           # 资产管理 (4 个 Admin)
│   ├── ArtworkAdmin
│   ├── DieAdmin
│   ├── FoilingPlateAdmin
│   └── EmbossingPlateAdmin
│
├── core.py             # 核心业务 (5 个 Admin + 3 Inline)
│   ├── WorkOrderAdmin
│   ├── WorkOrderProcessAdmin
│   ├── WorkOrderMaterialAdmin
│   ├── ProcessLogAdmin
│   └── WorkOrderTaskAdmin
│
├── sales.py            # 销售管理 (2 个 Admin)
│   ├── SalesOrderAdmin
│   └── SalesOrderItemAdmin
│
├── finance.py          # 财务管理 (7 个 Admin，4 个已启用)
│   ├── CostCenterAdmin ✅
│   ├── CostItemAdmin ✅
│   ├── ProductionCostAdmin ✅
│   ├── InvoiceAdmin ✅
│   ├── PaymentAdmin (待启用)
│   ├── PaymentPlanAdmin (待启用)
│   └── StatementAdmin (待启用)
│
├── inventory.py        # 库存管理 (6 个 Admin，2 个已启用)
│   ├── ProductStockAdmin (待启用)
│   ├── StockInAdmin (待启用)
│   ├── StockOutAdmin (待启用)
│   ├── DeliveryOrderAdmin ✅
│   ├── DeliveryItemAdmin ✅
│   └── QualityInspectionAdmin (待启用)
│
├── system.py           # 系统管理 (4 个 Admin)
│   ├── UserProfileAdmin
│   ├── NotificationAdmin
│   ├── TaskAssignmentRuleAdmin
│   └── WorkOrderApprovalLogAdmin
│
└── disabled/           # 历史备份
    ├── finance.py
    └── inventory.py
```

### Admin 类统计

| 模块 | Admin 类 | Inline 类 | 启用状态 |
|------|----------|-----------|----------|
| base | 3 | 0 | ✅ 全部启用 |
| products | 3 | 0 | ✅ 全部启用 |
| materials | 5 | 0 | ✅ 全部启用 |
| assets | 4 | 0 | ✅ 全部启用 |
| core | 5 | 3 | ✅ 全部启用 |
| sales | 2 | 0 | ✅ 全部启用 |
| finance | 7 | 0 | ⚠️ 4/7 启用 |
| inventory | 6 | 1 | ⚠️ 2/6 启用 |
| system | 4 | 0 | ✅ 全部启用 |
| **总计** | **39** | **4** | **31/39 启用** |

---

## 基础管理

### 客户管理 (CustomerAdmin)

**位置**: 基础管理 → 客户

**功能**:
- 客户信息维护（名称、联系人、电话、邮箱）
- 业务员分配
- 客户地址和备注管理

**字段说明**:
| 字段 | 说明 | 必填 |
|------|------|------|
| name | 客户名称 | ✅ |
| contact_person | 联系人 | ❌ |
| phone | 联系电话 | ❌ |
| email | 邮箱地址 | ❌ |
| salesperson | 业务员 | ❌ |
| address | 地址 | ❌ |
| notes | 备注 | ❌ |

**搜索字段**: 客户名称、联系人、电话、邮箱、业务员

**列表过滤**: 创建时间、业务员

### 部门管理 (DepartmentAdmin)

**位置**: 基础管理 → 部门

**功能**:
- 部门层级结构维护
- 工序关联配置
- 显示子部门数量

**字段说明**:
| 字段 | 说明 | 必填 |
|------|------|------|
| code | 部门编码 | ✅ |
| name | 部门名称 | ✅ |
| parent | 上级部门 | ❌ |
| sort_order | 排序 | ❌ |
| is_active | 是否启用 | ❌ |
| processes | 关联工序 | ❌ |

**特殊功能**:
- 支持树形结构显示
- 显示子部门数量
- 可编辑排序和启用状态

### 工序管理 (ProcessAdmin)

**位置**: 基础管理 → 工序

**功能**:
- 工序基础信息维护
- 工序与版的关系配置
- 标准工期设置

**字段说明**:
| 字段 | 说明 | 必填 |
|------|------|------|
| code | 工序编码 | ✅ |
| name | 工序名称 | ✅ |
| description | 描述 | ❌ |
| standard_duration | 标准工期(小时) | ❌ |
| sort_order | 排序 | ❌ |
| is_active | 是否启用 | ❌ |
| is_builtin | 是否内置 | 🔒 只读 |

**特殊功能**:
- 内置工序不可删除
- 内置工序的编码不可编辑
- 配置工序需要哪些版（图稿/刀模/烫金版/压凸版）

**工序与版的关系配置**:
- `requires_artwork` / `artwork_required`: 是否需要图稿及是否必选
- `requires_die` / `die_required`: 是否需要刀模及是否必选
- `requires_foiling_plate` / `foiling_plate_required`: 是否需要烫金版及是否必选
- `requires_embossing_plate` / `embossing_plate_required`: 是否需要压凸版及是否必选

---

## 业务管理

### 施工单管理 (WorkOrderAdmin)

**位置**: 核心业务 → 施工单

**核心功能**:
- 施工单创建与编辑
- 状态跟踪（待审核/已审核/生产中/已完成/已取消）
- 优先级管理
- 进度监控
- 内联编辑工序和物料

**列表显示**:
- 施工单号、客户、产品、数量
- 状态徽章、优先级徽章
- 下单日期、交付日期
- 进度百分比

**内联编辑**:
- 工序内联 (WorkOrderProcessInline)
- 产品内联 (WorkOrderProductInline)
- 物料内联 (WorkOrderMaterialInline)

**状态说明**:
| 状态 | 颜色 | 说明 |
|------|------|------|
| pending | 灰色 | 待审核 |
| approved | 蓝色 | 已审核 |
| in_production | 橙色 | 生产中 |
| completed | 绿色 | 已完成 |
| cancelled | 红色 | 已取消 |

**优先级说明**:
| 优先级 | 颜色 | 说明 |
|--------|------|------|
| low | 灰色 | 低 |
| normal | 蓝色 | 普通 |
| high | 橙色 | 高 |
| urgent | 红色 | 紧急 |

### 任务管理 (WorkOrderTaskAdmin)

**位置**: 核心业务 → 施工单任务

**核心功能**:
- 任务分配与管理
- 状态跟踪
- 数量完成情况
- 不良品数量记录

**列表显示**:
- 任务名称、施工单、工序
- 状态徽章、负责人
- 计划/实际时间
- 完成数量、不良数量

**批量操作**:
- 批量完成任务
- 批量取消任务
- 批量分配任务

### 销售单管理 (SalesOrderAdmin)

**位置**: 销售管理 → 销售单

**核心功能**:
- 销售单创建与审核
- 订单状态管理
- 付款跟踪
- 发货记录

**状态流程**:
```
draft → submitted → approved → in_production → completed
                    ↓ rejected
```

### 采购单管理 (PurchaseOrderAdmin)

**位置**: 物料管理 → 采购单

**核心功能**:
- 采购申请与审批
- 供应商管理
- 收货记录
- 质检管理

**状态流程**:
```
draft → submitted → approved → ordered → received
                    ↓ rejected
```

---

## 高级功能

### 工具函数使用

#### 状态徽章

```python
from .utils import create_status_badge_method, WORKORDER_STATUS_COLORS

@admin.register(YourModel)
class YourModelAdmin(admin.ModelAdmin):
    # 创建状态徽章方法
    status_badge = create_status_badge_method(WORKORDER_STATUS_COLORS)

    list_display = ['name', 'status_badge']
```

**预定义状态颜色**:
- `WORKORDER_STATUS_COLORS`: 施工单状态
- `TASK_STATUS_COLORS`: 任务状态
- `INVOICE_STATUS_COLORS`: 发票状态
- `DELIVERY_STATUS_COLORS`: 发货状态
- `PURCHASE_STATUS_COLORS`: 采购状态
- `STOCK_STATUS_COLORS`: 库存状态
- `QUALITY_STATUS_COLORS`: 质检状态

#### 优先级徽章

```python
from .utils import create_priority_badge_method

@admin.register(YourModel)
class YourModelAdmin(admin.ModelAdmin):
    # 创建优先级徽章方法（使用默认颜色）
    priority_badge = create_priority_badge_method()

    list_display = ['name', 'priority_badge']
```

**优先级颜色**:
- low: 灰色 (#909399)
- normal: 蓝色 (#409EFF)
- high: 橙色 (#E6A23C)
- urgent: 红色 (#F56C6C)

### Inline 编辑

#### TabularInline

```python
from django.contrib import admin
from .mixins import FixedInlineModelAdminMixin

class YourInlineAdmin(FixedInlineModelAdminMixin, admin.TabularInline):
    model = RelatedModel
    extra = 1
    fields = ['field1', 'field2', 'field3']

@admin.register(MainModel)
class MainModelAdmin(admin.ModelAdmin):
    inlines = [YourInlineAdmin]
```

### autocomplete_fields

用于优化外键选择体验：

```python
@admin.register(YourModel)
class YourModelAdmin(admin.ModelAdmin):
    autocomplete_fields = ['customer', 'product', 'salesperson']

    # 确保相关 Admin 也设置了 search_fields
    # CustomerAdmin.search_fields = ['name', 'code']
```

### 自定义方法示例

```python
@admin.register(YourModel)
class YourModelAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_children_count', 'is_active']

    def get_children_count(self, obj):
        """显示子记录数量"""
        return obj.children.count()

    get_children_count.short_description = '子记录数'
    get_children_count.admin_order_field = 'children__count'
```

---

## 常见操作

### 用户管理

#### 创建用户

**方法一：管理后台**
```
1. 访问 /admin/
2. 用户 → 增加用户
3. 填写信息并保存
```

**方法二：命令行**
```bash
# 创建超级用户
python manage.py createsuperuser

# 创建普通用户
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.create_user('username', 'email@example.com', 'password')
>>> user.is_staff = True
>>> user.save()
```

#### 重置密码

**方法一：管理后台**
```
用户 → 选择用户 → 更改密码
```

**方法二：命令行**
```bash
python manage.py changepassword username

# 或使用 shell
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(username='username')
>>> user.set_password('new_password')
>>> user.save()
```

### 数据管理

#### 批量导入

```bash
# 导入初始数据
python manage.py load_initial_data

# 加载样品数据
python manage.py load_sample_data
```

#### 数据导出

```bash
# 导出为 JSON
python manage.py dumpdata workorder > workorder.json

# 导出特定模型
python manage.py dumpdata workorder.Customer > customers.json
```

#### 数据备份

```bash
# PostgreSQL
pg_dump -h localhost -U username -d database_name > backup.sql

# SQLite
cp db.sqlite3 backup_$(date +%Y%m%d).sqlite3
```

### 系统维护

#### 清理会话

```bash
# 清理过期的会话
python manage.py clearsessions
```

#### 数据库优化

```bash
# PostgreSQL
VACUUM ANALYZE;

# SQLite
python manage.py dbshell
VACUUM;
```

---

## 故障排查

### 常见问题

#### Admin 类注册错误

**问题**: `django.core.exceptions.ImproperlyConfigured: 'AdminSite' not registered`

**解决**: 确保 Admin 类已正确注册
```python
@admin.register(YourModel)
class YourModelAdmin(admin.ModelAdmin):
    pass
```

#### 字段引用错误

**问题**: `django.core.exceptions.FieldError: Unknown field(s)`

**解决**: 检查 Admin 类中的字段名是否与模型定义一致
```python
# 检查模型字段
python manage.py shell
>>> from workorder.models import YourModel
>>> [f.name for f in YourModel._meta.get_fields()]
```

#### Inline 检查错误

**问题**: Inline 相关的系统检查报错

**解决**: 使用 `FixedInlineModelAdminMixin`
```python
from .mixins import FixedInlineModelAdminMixin

class YourInline(FixedInlineModelAdminMixin, admin.TabularInline):
    pass
```

### 验证与调试

#### 系统检查

```bash
# 完整系统检查
python manage.py check

# 检查特定应用
python manage.py check workorder

# 详细输出
python manage.py check --verbosity 2
```

#### 测试 Admin 配置

```python
# 测试 Admin 类是否正确注册
python manage.py shell
>>> from django.contrib.admin.sites import site
>>> site._registry.keys()
```

#### 查看注册的 Admin 类

```python
from workorder.admin import *

# 查看 __all__ 导出的 Admin 类
print(__all__)
```

---

## 附录

### A. Admin 配置最佳实践

#### 1. 使用 fieldsets 组织字段

```python
fieldsets = (
    ("基本信息", {"fields": ("field1", "field2")}),
    ("详细信息", {"fields": ("field3", "field4")}),
    ("系统信息", {"fields": ("created_at", "updated_at"), "classes": ("collapse",)}),
)
```

#### 2. 使用 autocomplete_fields 优化外键

```python
autocomplete_fields = ["customer", "product", "salesperson"]
```

#### 3. 使用 list_editable 提高效率

```python
list_editable = ["is_active", "sort_order"]
```

#### 4. 合理使用 search_fields

```python
search_fields = ["name", "code", "contact_person"]
```

#### 5. 使用 list_filter 优化筛选

```python
list_filter = ["status", "created_at", "category"]
```

### B. 自定义 Admin 模板

#### 覆盖默认模板

```
templates/
└── admin/
    ├── base_site.html          # 基础模板
    ├── index.html              # 首页
    ├── change_list.html        # 列表页
    └── change_form.html         # 表单页
```

### C. Admin 动作

#### 自定义批量操作

```python
@admin.register(YourModel)
class YourModelAdmin(admin.ModelAdmin):
    actions = ['make_active', 'make_inactive']

    def make_active(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"已激活 {queryset.count()} 条记录")

    make_active.short_description = "批量激活"

    def make_inactive(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, f"已停用 {queryset.count()} 条记录")

    make_inactive.short_description = "批量停用"
```

### D. 相关文档

- [Django Admin 官方文档](https://docs.djangoproject.com/en/stable/ref/contrib/admin/)
- `docs/ADMIN_FIX_SUMMARY.md` - Admin 修复总结
- `backend/workorder/admin/` - Admin 模块源码
- `backend/workorder/models/` - 数据模型定义

---

*文档版本: 1.0*
*最后更新: 2026-02-23*
*维护者: 开发团队*
