# 权限管理指南

## 概述

系统使用 Django 的权限系统来控制用户对不同资源的访问。每个用户通过所属的组（Group）获得相应的权限。

**重要**: 前端 API (`/`) 和 Django Admin (`/admin`) 现在使用**统一的权限系统**，确保权限检查的一致性。

## 权限系统架构

### 两个入口，一套权限

1. **Django Admin (`/admin`)**:
   - 需要 `is_staff=True` 才能访问
   - 使用 Django 模型权限（`add_*`, `change_*`, `delete_*`, `view_*`）控制具体操作

2. **前端 API (`/api/...`)**:
   - 需要登录（Session 认证）
   - **现在也使用 Django 模型权限**（`DjangoModelPermissions`）
   - 与 Django Admin 使用相同的权限检查机制

### 权限检查机制

**大部分 ViewSet 使用 `DjangoModelPermissions`**，但有一些特殊情况：

### 主资源权限（使用 DjangoModelPermissions）

- ✅ 前端 API 和 Django Admin 使用相同的权限系统
- ✅ 用户在两个地方的权限行为一致
- ✅ 如果用户在 Admin 中没有权限，在前端 API 中也没有权限
- ✅ 权限通过用户组（Group）统一管理

**权限映射**:
- `GET /api/workorders/` → 需要 `view_workorder` 权限
- `POST /api/workorders/` → 需要 `add_workorder` 权限
- `PUT/PATCH /api/workorders/{id}/` → 需要 `change_workorder` 权限
- `DELETE /api/workorders/{id}/` → 需要 `delete_workorder` 权限

### 子资源权限（使用自定义权限类）

**施工单工序和物料**使用自定义权限类，逻辑如下：

- **工序权限** (`WorkOrderProcessPermission`): 如果用户有 `change_workorder` 权限，就可以编辑其工序
- **物料权限** (`WorkOrderMaterialPermission`): 如果用户有 `change_workorder` 权限，就可以编辑其物料

**原因**：
- 工序和物料是施工单的一部分，逻辑上应该与施工单权限一致
- 不需要为每个角色单独分配工序/物料权限
- 更符合业务逻辑：能编辑施工单，就能编辑其工序和物料

**权限映射**:
- `GET /api/workorder-processes/` → 需要 `view_workorder` 权限
- `POST /api/workorder-processes/` → 需要 `change_workorder` 权限（而不是 `add_workorderprocess`）
- `DELETE /api/workorder-processes/{id}/` → 需要 `change_workorder` 权限（而不是 `delete_workorderprocess`）
- 物料权限同理

**所有资源都遵循相同的规则**:
- `workorder.add_*`, `workorder.view_*`, `workorder.change_*`, `workorder.delete_*`
- `customer.add_*`, `customer.view_*`, `customer.change_*`, `customer.delete_*`
- `product.add_*`, `product.view_*`, `product.change_*`, `product.delete_*`
- 等等...

### 前端权限检查

前端目前主要依赖后端返回的权限错误来提示用户。建议在前端也添加权限检查，提前隐藏无权限的操作按钮。

## 用户角色和权限

### 业务员

**权限范围**:
- ✅ 创建施工单 (`add_workorder`)
- ✅ 查看施工单 (`view_workorder`)
- ✅ 修改施工单 (`change_workorder`)
- ❌ 删除施工单 (`delete_workorder`)
- ✅ 查看客户 (`view_customer`)
- ✅ 查看产品 (`view_product`)
- ✅ 查看物料 (`view_material`)
- ✅ 查看工序 (`view_process`)

## 管理命令

### 初始化用户组和权限

```bash
cd backend
source venv/bin/activate
python manage.py init_groups
```

这个命令会：
1. 创建系统所需的用户组（如：业务员）
2. 为每个组分配相应的权限

### 为用户分配权限

```bash
python manage.py assign_permissions <用户名> <组名>
```

**示例**:
```bash
# 将"陈大文"添加到"业务员"组
python manage.py assign_permissions 陈大文 业务员
```

### 检查用户权限

```bash
python manage.py shell
```

```python
from django.contrib.auth.models import User

# 检查用户权限
user = User.objects.get(username='陈大文')
print(f'组: {[g.name for g in user.groups.all()]}')
print(f'是否有创建施工单权限: {user.has_perm("workorder.add_workorder")}')
print(f'是否有查看施工单权限: {user.has_perm("workorder.view_workorder")}')
print(f'是否有修改施工单权限: {user.has_perm("workorder.change_workorder")}')
print(f'是否有删除施工单权限: {user.has_perm("workorder.delete_workorder")}')
```

## 在 Django Admin 中管理权限

1. 访问 Django Admin: `http://localhost:8000/admin`
2. 进入 **认证和授权** > **组**
3. 选择或创建组（如：业务员）
4. 在 **权限** 部分选择相应的权限
5. 保存

## 添加新角色

要添加新角色，编辑 `backend/workorder/management/commands/init_groups.py`:

```python
role_permissions = {
    '业务员': {
        'workorder': ['add', 'view', 'change'],
        'customer': ['view'],
        ...
    },
    '生产管理员': {  # 新角色
        'workorder': ['add', 'view', 'change', 'delete'],
        'process': ['add', 'view', 'change'],
        ...
    },
}
```

然后运行:
```bash
python manage.py init_groups
```

## 常见问题

### Q: 为什么用户权限数量为0，但还能创建施工单？

**A**: 这是因为之前系统只检查用户是否登录（`IsAuthenticated`），没有检查具体的权限。现在已经修复，所有 ViewSet 都使用 `DjangoModelPermissions` 权限检查。

### Q: 为什么用户在 `/admin` 中没有权限，但在前端 `/` 中还能操作？

**A**: 这是因为之前前端 API 使用 `IsAuthenticated`（只检查登录），而 Django Admin 使用模型权限。现在已经统一：
- 前端 API 现在也使用 `DjangoModelPermissions`
- 两个入口使用相同的权限系统
- 如果用户在 Admin 中没有权限，在前端 API 中也没有权限

### Q: 如何让用户既能访问前端，又能访问 Admin？

**A**: 
1. 设置 `is_staff=True`（允许访问 Admin）
2. 将用户添加到相应的组（获得模型权限）
3. 或者直接为用户分配权限

**示例**:
```python
from django.contrib.auth.models import User
user = User.objects.get(username='用户名')
user.is_staff = True  # 允许访问 Admin
user.save()
# 然后运行: python manage.py assign_permissions 用户名 业务员
```

### Q: 如何为现有用户分配权限？

**A**: 有两种方式：
1. 使用命令: `python manage.py assign_permissions <用户名> <组名>`
2. 在 Django Admin 中手动添加

### Q: 如何检查用户是否有某个权限？

**A**: 
```python
from django.contrib.auth.models import User
user = User.objects.get(username='用户名')
has_perm = user.has_perm('workorder.add_workorder')  # 检查是否有创建施工单权限
```

### Q: 权限不生效怎么办？

**A**: 
1. 确认用户已登录（Session 有效）
2. 确认用户已添加到相应的组
3. 确认组已分配相应的权限
4. 重启后端服务器（如果修改了权限配置）

## 权限列表

### WorkOrder（施工单）权限
- `workorder.add_workorder`: 创建施工单
- `workorder.view_workorder`: 查看施工单
- `workorder.change_workorder`: 修改施工单
- `workorder.delete_workorder`: 删除施工单

### Customer（客户）权限
- `workorder.add_customer`: 创建客户
- `workorder.view_customer`: 查看客户
- `workorder.change_customer`: 修改客户
- `workorder.delete_customer`: 删除客户

### Product（产品）权限
- `workorder.add_product`: 创建产品
- `workorder.view_product`: 查看产品
- `workorder.change_product`: 修改产品
- `workorder.delete_product`: 删除产品

### Material（物料）权限
- `workorder.add_material`: 创建物料
- `workorder.view_material`: 查看物料
- `workorder.change_material`: 修改物料
- `workorder.delete_material`: 删除物料

### Process（工序）权限
- `workorder.add_process`: 创建工序
- `workorder.view_process`: 查看工序
- `workorder.change_process`: 修改工序
- `workorder.delete_process`: 删除工序

