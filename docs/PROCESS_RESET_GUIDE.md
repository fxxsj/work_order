# 工序数据重置指南

## 已完成的工作

### 1. 创建预设数据文件

**文件位置：** `backend/workorder/fixtures/preset_processes.json`

包含21个标准工序，ID从1开始，编码如下：

| ID | 编码 | 名称 | 排序 |
|---|---|---|---|
| 1 | CTP | 制版 | 1 |
| 2 | CUT | 开料 | 2 |
| 3 | PRT | 印刷 | 3 |
| 4 | VAN | 过油 | 4 |
| 5 | LAM_G | 覆光膜 | 5 |
| 6 | LAM_M | 覆哑膜 | 6 |
| 7 | UV | UV | 7 |
| 8 | FOIL_G | 烫金 | 8 |
| 9 | FOIL_S | 烫银 | 9 |
| 10 | EMB | 压凸 | 10 |
| 11 | TEX | 压纹 | 11 |
| 12 | SCORE | 压线 | 12 |
| 13 | DIE | 模切 | 13 |
| 14 | TRIM | 切成品 | 14 |
| 15 | LAM_B | 对裱 | 15 |
| 16 | MOUNT | 裱坑 | 16 |
| 17 | GLUE | 粘胶 | 17 |
| 18 | BOX | 粘盒 | 18 |
| 19 | WINDOW | 粘窗口 | 19 |
| 20 | STAPLE | 打钉 | 20 |
| 21 | PACK | 包装 | 21 |

### 2. 设置 code 字段为只读

**修改文件：** `backend/workorder/admin.py`

在 `ProcessAdmin` 类中添加了：
```python
readonly_fields = ['code']  # code字段设为只读，防止编辑预设工序的编码
```

**效果：**
- 在 Django Admin 中，工序的 `code` 字段将显示为只读
- 无法通过 Admin 界面修改预设工序的编码
- 其他字段（name, description, standard_duration, sort_order, is_active 等）仍可编辑

### 3. 创建重置命令

**文件位置：** `backend/workorder/management/commands/reset_processes.py`

**功能：**
- 清空所有现有工序数据
- 清除产品默认工序关联
- 删除施工单工序记录（使用 `--force` 参数时）
- 从预设文件加载21个标准工序

**使用方法：**

```bash
# 检查是否有关联数据（不会执行删除）
python manage.py reset_processes

# 强制执行（会删除所有关联数据）
python manage.py reset_processes --force
```

## 使用说明

### 重置工序数据

如果需要重置工序数据到预设状态：

```bash
cd backend
python manage.py reset_processes --force
```

**注意：** 
- `--force` 参数会删除所有施工单工序记录
- 会清除所有产品的默认工序关联
- 请确保已备份重要数据

### 在 Django Admin 中管理工序

1. 访问 Django Admin：http://localhost:8000/admin
2. 进入"工序管理"
3. 可以看到21个预设工序
4. **code 字段为只读**，无法编辑
5. 可以编辑其他字段：名称、描述、标准工时、排序、启用状态等

### 添加新工序

如果需要添加新工序：

1. 在 Django Admin 中点击"添加工序"
2. 填写工序信息（包括新的 code）
3. 新添加的工序的 code 字段**可以编辑**（因为不在预设列表中）

## 数据保护机制

### code 字段只读

- **预设工序**：code 字段在 Admin 中为只读
- **新工序**：code 字段可以编辑（因为不在预设列表中）

### 数据完整性

- 预设工序的 ID 固定为 1-21
- 预设工序的 code 固定（CTP, CUT, PRT 等）
- 通过重置命令可以恢复到预设状态

## 备份数据

如果需要备份当前工序数据：

```bash
python manage.py dumpdata workorder.Process --indent 2 > workorder/fixtures/backup_processes.json
```

## 注意事项

1. **数据关联**：重置工序会删除所有施工单工序记录，请谨慎操作
2. **产品关联**：重置会清除产品的默认工序关联
3. **备份建议**：在执行重置前，建议先备份数据库
4. **code 只读**：预设工序的 code 字段在 Admin 中为只读，但可以通过数据库直接修改（不推荐）

## 验证

重置完成后，可以通过以下命令验证：

```bash
# 检查工序数量
python manage.py shell -c "from workorder.models import Process; print(Process.objects.count())"

# 查看工序列表
python manage.py shell -c "from workorder.models import Process; [print(f'{p.id}. {p.code} - {p.name}') for p in Process.objects.all().order_by('sort_order', 'code')]"
```

## 文件清单

- ✅ `backend/workorder/fixtures/preset_processes.json` - 预设工序数据
- ✅ `backend/workorder/admin.py` - 已设置 code 字段为只读
- ✅ `backend/workorder/management/commands/reset_processes.py` - 重置命令

## 完成状态

✅ 工序表已清空  
✅ 21个预设工序已加载（ID: 1-21）  
✅ code 字段在 Admin 中为只读  
✅ 重置命令已创建并测试通过  

