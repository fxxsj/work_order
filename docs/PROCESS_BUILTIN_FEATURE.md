# 工序内置功能说明

## 功能概述

为工序模型添加了 `is_builtin`（是否内置）字段，用于标识系统预设的工序。内置工序具有以下保护机制：

1. **不可删除**：内置工序无法通过 Admin 或 API 删除
2. **code 字段不可编辑**：内置工序的编码字段在 Admin 中为只读
3. **非内置工序**：不受上述限制，可以正常编辑和删除

## 实现细节

### 1. 模型字段

**文件：** `backend/workorder/models.py`

```python
is_builtin = models.BooleanField('是否内置', default=False, 
                                help_text='内置工序不可删除，code字段不可编辑')
```

### 2. 数据库迁移

创建了以下迁移文件：

- **0052_add_is_builtin_to_process.py**：添加 `is_builtin` 字段
- **0053_mark_preset_processes_as_builtin.py**：将预设的21个工序标记为内置

### 3. Django Admin 保护

**文件：** `backend/workorder/admin.py`

- **动态只读字段**：根据 `is_builtin` 字段动态设置 `code` 字段为只读
- **删除权限控制**：`has_delete_permission` 方法阻止删除内置工序
- **列表显示**：在列表中添加 `is_builtin` 列，并支持筛选

```python
def get_readonly_fields(self, request, obj=None):
    """根据is_builtin字段动态设置code字段为只读"""
    readonly = list(self.readonly_fields)
    if obj and obj.is_builtin:
        readonly.append('code')
    return readonly

def has_delete_permission(self, request, obj=None):
    """内置工序不可删除"""
    if obj and obj.is_builtin:
        return False
    return super().has_delete_permission(request, obj)
```

### 4. API 保护

**文件：** `backend/workorder/views.py`

在 `ProcessViewSet` 中覆盖 `destroy` 方法：

```python
def destroy(self, request, *args, **kwargs):
    """删除工序，内置工序不可删除"""
    instance = self.get_object()
    if instance.is_builtin:
        return Response(
            {'error': '内置工序不可删除'},
            status=status.HTTP_400_BAD_REQUEST
        )
    return super().destroy(request, *args, **kwargs)
```

### 5. 序列化器验证

**文件：** `backend/workorder/serializers.py`

在 `ProcessSerializer` 中添加验证：

```python
def validate(self, data):
    """验证内置工序的code字段不可修改"""
    if self.instance and self.instance.is_builtin:
        if 'code' in data and data['code'] != self.instance.code:
            raise serializers.ValidationError({
                'code': '内置工序的编码不可修改'
            })
    return data
```

## 预设内置工序（21个）

所有预设的21个工序都已标记为 `is_builtin=True`：

| ID | 编码 | 名称 | 是否内置 |
|---|---|---|---|
| 1 | CTP | 制版 | ✅ |
| 2 | CUT | 开料 | ✅ |
| 3 | PRT | 印刷 | ✅ |
| 4 | VAN | 过油 | ✅ |
| 5 | LAM_G | 覆光膜 | ✅ |
| 6 | LAM_M | 覆哑膜 | ✅ |
| 7 | UV | UV | ✅ |
| 8 | FOIL_G | 烫金 | ✅ |
| 9 | FOIL_S | 烫银 | ✅ |
| 10 | EMB | 压凸 | ✅ |
| 11 | TEX | 压纹 | ✅ |
| 12 | SCORE | 压线 | ✅ |
| 13 | DIE | 模切 | ✅ |
| 14 | TRIM | 切成品 | ✅ |
| 15 | LAM_B | 对裱 | ✅ |
| 16 | MOUNT | 裱坑 | ✅ |
| 17 | GLUE | 粘胶 | ✅ |
| 18 | BOX | 粘盒 | ✅ |
| 19 | WINDOW | 粘窗口 | ✅ |
| 20 | STAPLE | 打钉 | ✅ |
| 21 | PACK | 包装 | ✅ |

## 使用说明

### 在 Django Admin 中

1. **查看内置工序**：
   - 在工序列表中可以查看 `is_builtin` 列
   - 可以通过筛选器筛选内置/非内置工序

2. **编辑内置工序**：
   - ✅ 可以编辑：名称、描述、标准工时、排序、启用状态等
   - ❌ 不可编辑：code 字段（显示为只读）
   - ❌ 不可删除：删除按钮不可用

3. **编辑非内置工序**：
   - ✅ 可以编辑所有字段，包括 code
   - ✅ 可以删除

### 通过 API

1. **获取工序列表**：
   ```bash
   GET /api/processes/?is_builtin=true  # 获取内置工序
   GET /api/processes/?is_builtin=false # 获取非内置工序
   ```

2. **更新内置工序**：
   ```bash
   PATCH /api/processes/1/
   {
     "name": "新名称",  # ✅ 可以修改
     "code": "NEW_CODE"  # ❌ 会返回错误：内置工序的编码不可修改
   }
   ```

3. **删除内置工序**：
   ```bash
   DELETE /api/processes/1/
   # ❌ 返回 400 错误：内置工序不可删除
   ```

## 数据迁移

### 新数据库初始化

运行 `python manage.py migrate` 时，会自动：
1. 创建 `is_builtin` 字段
2. 加载21个预设工序（标记为内置）

### 现有数据库

如果数据库中已有工序数据：
1. 运行迁移 `0052` 添加 `is_builtin` 字段（默认值为 `False`）
2. 运行迁移 `0053` 将预设工序标记为内置

## 重置工序数据

使用重置命令时，预设工序会自动标记为内置：

```bash
python manage.py reset_processes --force
```

## 注意事项

1. **is_builtin 字段只读**：在 Admin 中，`is_builtin` 字段为只读，只能通过迁移或代码设置
2. **数据完整性**：删除内置工序会破坏数据完整性，因此被严格禁止
3. **code 唯一性**：内置工序的 code 是固定的，修改会导致系统混乱
4. **向后兼容**：非内置工序的行为不受影响，可以正常编辑和删除

## 测试验证

### 验证内置工序保护

```python
from workorder.models import Process

# 获取内置工序
builtin_process = Process.objects.get(code='CTP')
print(f'是否内置: {builtin_process.is_builtin}')  # True

# 尝试修改code（会失败）
# builtin_process.code = 'NEW_CODE'  # 在序列化器中会被阻止

# 尝试删除（会失败）
# builtin_process.delete()  # 在Admin和API中会被阻止
```

### 验证非内置工序

```python
# 创建新工序（非内置）
new_process = Process.objects.create(
    code='CUSTOM',
    name='自定义工序',
    is_builtin=False
)

# 可以修改code
new_process.code = 'CUSTOM2'
new_process.save()  # ✅ 成功

# 可以删除
new_process.delete()  # ✅ 成功
```

## 文件清单

- ✅ `backend/workorder/models.py` - 添加 `is_builtin` 字段
- ✅ `backend/workorder/migrations/0052_add_is_builtin_to_process.py` - 添加字段迁移
- ✅ `backend/workorder/migrations/0053_mark_preset_processes_as_builtin.py` - 标记预设工序
- ✅ `backend/workorder/migrations/0051_load_preset_processes.py` - 更新为包含 `is_builtin`
- ✅ `backend/workorder/admin.py` - Admin 保护逻辑
- ✅ `backend/workorder/views.py` - API 删除保护
- ✅ `backend/workorder/serializers.py` - 序列化器验证
- ✅ `backend/workorder/fixtures/preset_processes.json` - 更新 fixtures 文件

## 完成状态

✅ 模型字段已添加  
✅ 迁移文件已创建并应用  
✅ 预设工序已标记为内置  
✅ Admin 保护已实现  
✅ API 保护已实现  
✅ 序列化器验证已实现  
✅ Fixtures 文件已更新  

