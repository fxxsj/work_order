# 权限系统最佳实践

## 问题背景

之前系统存在权限不一致的问题：
- **Django Admin (`/admin`)**: 使用 Django 模型权限（`add_*`, `view_*`, `change_*`, `delete_*`）
- **前端 API (`/api/...`)**: 只检查是否登录（`IsAuthenticated`），不检查具体权限

这导致：
- 用户在 Admin 中没有权限，但在前端 API 中仍然可以操作
- 权限管理混乱，难以统一控制

## 解决方案

### 统一权限系统

**现在所有 ViewSet 都使用 `DjangoModelPermissions`**，确保：

1. ✅ **前端 API 和 Django Admin 使用相同的权限系统**
2. ✅ **权限检查一致**：如果用户在 Admin 中没有权限，在前端 API 中也没有权限
3. ✅ **统一管理**：所有权限通过 Django 的 Group 和 Permission 系统管理

### 配置变更

**`backend/config/settings.py`**:
```python
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.DjangoModelPermissions',  # 统一使用Django模型权限
    ],
}
```

**之前**:
```python
'DEFAULT_PERMISSION_CLASSES': [
    'rest_framework.permissions.IsAuthenticated',  # 只检查登录
],
```

## 权限映射

### HTTP 方法与权限的对应关系

| HTTP 方法 | Django 权限 | 说明 |
|----------|------------|------|
| `GET /api/workorders/` | `view_workorder` | 查看施工单列表 |
| `GET /api/workorders/{id}/` | `view_workorder` | 查看施工单详情 |
| `POST /api/workorders/` | `add_workorder` | 创建施工单 |
| `PUT /api/workorders/{id}/` | `change_workorder` | 修改施工单 |
| `PATCH /api/workorders/{id}/` | `change_workorder` | 部分修改施工单 |
| `DELETE /api/workorders/{id}/` | `delete_workorder` | 删除施工单 |

### 所有资源都遵循相同规则

- **WorkOrder**: `workorder.add_*`, `workorder.view_*`, `workorder.change_*`, `workorder.delete_*`
- **Customer**: `workorder.add_customer`, `workorder.view_customer`, `workorder.change_customer`, `workorder.delete_customer`
- **Product**: `workorder.add_product`, `workorder.view_product`, `workorder.change_product`, `workorder.delete_product`
- **Material**: `workorder.add_material`, `workorder.view_material`, `workorder.change_material`, `workorder.delete_material`
- **Process**: `workorder.add_process`, `workorder.view_process`, `workorder.change_process`, `workorder.delete_process`
- 等等...

## 访问控制对比

### Django Admin (`/admin`)

**访问要求**:
- `is_staff=True` 才能访问 Admin 界面
- 需要相应的模型权限才能执行操作

**示例**:
```python
user.is_staff = True  # 允许访问 Admin
user.has_perm('workorder.add_workorder')  # 允许创建施工单
```

### 前端 API (`/api/...`)

**访问要求**:
- 需要登录（Session 认证）
- **现在也使用模型权限**（`DjangoModelPermissions`）

**示例**:
```python
user.is_authenticated  # 需要登录
user.has_perm('workorder.add_workorder')  # 允许创建施工单
```

## 权限管理流程

### 1. 初始化权限

```bash
cd backend
source venv/bin/activate
python manage.py init_groups
```

这会为"业务员"等组分配相应的权限。

### 2. 为用户分配权限

```bash
python manage.py assign_permissions <用户名> <组名>
```

**示例**:
```bash
python manage.py assign_permissions 陈大文 业务员
```

### 3. 检查权限

```python
from django.contrib.auth.models import User

user = User.objects.get(username='陈大文')
print(f'访问 Admin: {user.is_staff}')
print(f'创建施工单: {user.has_perm("workorder.add_workorder")}')
print(f'查看施工单: {user.has_perm("workorder.view_workorder")}')
print(f'修改施工单: {user.has_perm("workorder.change_workorder")}')
print(f'删除施工单: {user.has_perm("workorder.delete_workorder")}')
```

## 常见场景

### 场景 1: 业务员只能创建和查看施工单

**配置**:
```bash
# 1. 初始化权限（已为"业务员"组分配了相应权限）
python manage.py init_groups

# 2. 将用户添加到组
python manage.py assign_permissions 陈大文 业务员
```

**结果**:
- ✅ 可以访问前端 API，创建和查看施工单
- ❌ 不能访问 Django Admin（`is_staff=False`）
- ❌ 不能删除施工单（没有 `delete_workorder` 权限）

### 场景 2: 管理员可以访问 Admin 和前端 API

**配置**:
```python
from django.contrib.auth.models import User

user = User.objects.get(username='管理员')
user.is_staff = True  # 允许访问 Admin
user.save()

# 或者设置为超级用户
user.is_superuser = True
user.is_staff = True
user.save()
```

**结果**:
- ✅ 可以访问 Django Admin
- ✅ 可以访问前端 API
- ✅ 拥有所有权限（如果是超级用户）

### 场景 3: 只允许查看，不允许修改

**配置**:
```python
from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType
from workorder.models import WorkOrder

user = User.objects.get(username='只读用户')
group = Group.objects.get_or_create(name='只读用户')[0]

# 只分配查看权限
content_type = ContentType.objects.get_for_model(WorkOrder)
view_perm = Permission.objects.get(
    content_type=content_type,
    codename='view_workorder'
)
group.permissions.add(view_perm)
user.groups.add(group)
```

**结果**:
- ✅ 可以查看施工单（`GET /api/workorders/`）
- ❌ 不能创建、修改、删除施工单

## 最佳实践

### 1. 统一权限系统

✅ **推荐**: 使用 `DjangoModelPermissions` 作为默认权限类
```python
'DEFAULT_PERMISSION_CLASSES': [
    'rest_framework.permissions.DjangoModelPermissions',
],
```

❌ **不推荐**: 使用 `IsAuthenticated`（只检查登录，不检查具体权限）

### 2. 通过组管理权限

✅ **推荐**: 将用户添加到组，通过组分配权限
```bash
python manage.py assign_permissions 用户名 组名
```

❌ **不推荐**: 直接为用户分配权限（难以管理）

### 3. 权限命名规范

✅ **推荐**: 使用 Django 的标准权限命名
- `add_<model_name>`: 创建
- `view_<model_name>`: 查看
- `change_<model_name>`: 修改
- `delete_<model_name>`: 删除

### 4. 测试权限

✅ **推荐**: 在开发环境中测试权限
```python
# 测试用户是否有权限
user.has_perm('workorder.add_workorder')

# 测试 API 权限
# 使用不同的用户登录，尝试访问 API
```

## 注意事项

1. **`is_staff` vs 模型权限**:
   - `is_staff=True`: 允许访问 Django Admin，但不一定有模型权限
   - 模型权限: 控制具体的操作（创建、查看、修改、删除）

2. **超级用户**:
   - `is_superuser=True`: 拥有所有权限，包括 Admin 访问和所有模型权限

3. **权限缓存**:
   - Django 会缓存用户权限
   - 如果修改了权限，用户需要重新登录才能生效

4. **前端权限检查**:
   - 建议在前端也添加权限检查，提前隐藏无权限的操作按钮
   - 但最终权限检查应该在后端进行

## 总结

通过统一使用 `DjangoModelPermissions`，我们实现了：

1. ✅ **权限一致性**: 前端 API 和 Django Admin 使用相同的权限系统
2. ✅ **易于管理**: 所有权限通过 Django 的 Group 和 Permission 系统统一管理
3. ✅ **安全性**: 权限检查在后端进行，前端只是展示层
4. ✅ **可扩展性**: 可以轻松添加新角色和权限

现在，如果用户在 Admin 中没有权限，在前端 API 中也没有权限，确保了权限管理的一致性和安全性。

