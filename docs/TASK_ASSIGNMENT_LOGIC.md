# 任务自动分派逻辑说明

**最后更新时间：** 2026-01-07

## 一、分派规则概述

任务自动分派机制在工序开始时（`generate_tasks()`）自动调用，为每个生成的任务分派部门和操作员。

## 二、分派优先级规则

### 2.1 部门分派优先级（从高到低）

1. **工序级别分派（最高优先级）**
   - 如果 `WorkOrderProcess.department` 已指定，直接使用该部门
   - 这是手动指定的分派，具有最高优先级

2. **专业车间匹配（高优先级）**
   - 如果工序编码与部门编码匹配，优先选择该专业车间
   - 匹配规则：
     - `DIE` (模切) → `die_cutting` (模切车间)
     - `PRT` (印刷) → `printing` (印刷车间)
     - `CUT` (开料) → `cutting` (裁切车间)
     - `PACK` (包装) → `packaging` (包装车间)
     - `CTP` (制版) → `design` (设计部)

3. **非外协专业车间（中优先级）**
   - 排除外协车间（`outsourcing`）
   - 选择其他专业车间（子部门）
   - 按 `sort_order` 排序选择第一个

4. **外协车间（低优先级）**
   - 如果没有专业车间可选，选择外协车间
   - 外协车间作为备选方案

5. **父部门（兜底）**
   - 如果以上都没有，选择父部门（如生产部）

### 2.2 操作员分派规则

- 如果 `WorkOrderProcess.operator` 已指定，直接使用该操作员
- 否则，任务的操作员为空，需要后续手动分派

## 三、实际案例

### 案例1：模切工序（DIE）

**工序关联的部门：**
- 外协车间（`outsourcing`, sort_order=8）
- 模切车间（`die_cutting`, sort_order=9）

**分派结果：**
- ✅ 优先选择 **模切车间**（专业匹配：`DIE` → `die_cutting`）
- ⚠️ 不会选择外协车间（除非模切车间不可用）

### 案例2：印刷工序（PRT）

**工序关联的部门：**
- 生产部（`production`, 父部门）
- 印刷车间（`printing`, sort_order=7）
- 外协车间（`outsourcing`, sort_order=8）

**分派结果：**
- ✅ 优先选择 **印刷车间**（专业匹配：`PRT` → `printing`）

### 案例3：开料工序（CUT）

**工序关联的部门：**
- 生产部（`production`, 父部门）
- 裁切车间（`cutting`, sort_order=6）
- 外协车间（`outsourcing`, sort_order=8）
- 包装车间（`packaging`, sort_order=10）

**分派结果：**
- ✅ 优先选择 **裁切车间**（专业匹配：`CUT` → `cutting`）

## 四、特殊情况处理

### 4.1 工序已手动指定部门

如果用户在添加工序时手动指定了部门（通过 `WorkOrderProcess.department`），系统会直接使用该部门，不再执行自动匹配逻辑。

**使用场景：**
- 特殊情况需要指定特定部门
- 外协需求明确时手动指定外协车间
- 临时调整分派

### 4.2 多个专业车间可选

如果某个工序有多个专业车间可选（除外协外），系统按 `sort_order` 选择第一个。

**示例：**
- 某个工序同时关联了多个专业车间
- 系统选择 `sort_order` 最小的专业车间

### 4.3 只有外协车间可选

如果某个工序只关联了外协车间，系统会分派给外协车间。

**示例：**
- 特殊工序只有外协车间能够处理
- 系统自动分派给外协车间

## 五、配置和扩展

### 5.1 添加新的工序-部门映射

如果需要添加新的工序与专业车间的映射关系，修改 `_auto_assign_task()` 方法中的 `process_dept_mapping` 字典：

```python
process_dept_mapping = {
    'die': 'die_cutting',      # 模切 -> 模切车间
    'prt': 'printing',         # 印刷 -> 印刷车间
    'cut': 'cutting',          # 开料 -> 裁切车间
    'pack': 'packaging',       # 包装 -> 包装车间
    'ctp': 'design',           # 制版 -> 设计部
    # 添加新的映射关系
    'new_process': 'new_dept',  # 新工序 -> 新部门
}
```

### 5.2 修改分派规则

如果需要修改分派优先级或逻辑，编辑 `backend/workorder/models.py` 中的 `_auto_assign_task()` 方法。

## 六、任务分派调整

### 6.1 单个任务调整

**接口：** `POST /api/workorder-tasks/{id}/assign/`

**使用场景：**
- 自动分派后需要调整单个任务
- 任务分派错误需要纠正

**请求参数：**
```json
{
  "assigned_department": 3,        // 部门ID，null表示清空
  "assigned_operator": 5,          // 操作员ID，null表示清空
  "reason": "包装车间无法处理，需外协",  // 调整原因（可选）
  "notes": "特殊规格需要专业设备"        // 备注（可选）
}
```

**特点：**
- ✅ 支持调整部门和操作员
- ✅ 记录调整日志（自动记录变更内容）
- ✅ 可填写调整原因和备注

### 6.2 批量任务调整（工序级别）

**接口：** `POST /api/workorder-processes/{id}/reassign_tasks/`

**使用场景：**
- **典型场景**：裱坑工序自动分派到包装车间，但包装车间发现自己处理不了，需要整体调整为外协车间
- 工序下所有任务需要统一调整
- 同时更新工序级别的部门分派（供后续任务使用）

**请求参数：**
```json
{
  "assigned_department": 4,              // 新分派部门ID（必填，调整部门时）
  "assigned_operator": null,             // 新分派操作员ID（可选，null表示清空）
  "reason": "包装车间无法处理裱坑工序，需要外协",  // 调整原因（必填）
  "notes": "设备故障，暂时无法处理",            // 备注（可选）
  "update_process_department": true      // 是否同时更新工序级别的部门（默认false）
}
```

**特点：**
- ✅ 批量调整工序下所有任务
- ✅ 必须填写调整原因（便于追溯）
- ✅ 可选择是否同时更新工序级别分派（影响后续生成的任务）
- ✅ 每个任务都会记录调整日志

**示例场景：裱坑工序从包装调整为外协**

```json
POST /api/workorder-processes/123/reassign_tasks/
{
  "assigned_department": 4,  // 外协车间ID
  "reason": "包装车间设备故障，无法处理裱坑工序",
  "update_process_department": true  // 同时更新工序，后续任务也分派到外协
}
```

**响应示例：**
```json
{
  "id": 123,
  "process": {...},
  "message": "成功调整 2 个任务的分派",
  "updated_tasks_count": 2,
  "total_tasks_count": 2
}
```

### 6.3 调整日志

所有分派调整都会记录到 `TaskLog`，包括：
- 调整前的部门和操作员
- 调整后的部门和操作员
- 调整原因和备注
- 调整人和调整时间

**查看日志：**
- 任务详情接口会返回 `logs` 字段，包含所有操作日志
- 日志类型为 `status_change`，内容包含调整详情

## 七、常见问题

### Q1: 为什么模切工序会优先选择模切车间而不是外协车间？

**A:** 根据分派规则，系统会优先匹配专业车间。模切工序（`DIE`）与模切车间（`die_cutting`）的编码匹配，所以优先选择模切车间。外协车间只在没有专业车间可选时才会被选择。

### Q2: 如果我想让某个工序分派给外协车间怎么办？

**A:** 有两种方式：
1. **手动指定**：在添加工序时，手动指定部门为外协车间（通过 `WorkOrderProcess.department`）
2. **修改映射**：如果该工序只有外协车间关联，系统会自动分派给外协车间

### Q3: 工序已经自动分派了，还能修改吗？

**A:** 可以。任务生成后，可以通过以下方式修改分派：
1. 使用任务分派接口：`POST /api/workorder-tasks/{id}/assign/`
2. 修改工序的部门：如果工序的所有任务都需要调整，可以修改 `WorkOrderProcess.department`，然后重新生成任务

### Q4: 裱坑工序分派到包装车间后，包装车间发现自己处理不了，怎么办？

**A:** 可以使用批量调整接口，将工序的所有任务重新分派到外协车间：

```json
POST /api/workorder-processes/{工序ID}/reassign_tasks/
{
  "assigned_department": 外协车间ID,
  "reason": "包装车间无法处理裱坑工序，需要外协",
  "update_process_department": true  // 建议设为true，后续任务也分派到外协
}
```

这样该工序的所有任务都会重新分派到外协车间，并且会记录调整原因，便于追溯。

### Q5: 调整分派后，后续生成的任务会使用新分派吗？

**A:** 取决于是否设置了 `update_process_department`：
- 如果设置为 `true`：会更新工序级别的部门，后续生成的任务也会使用新分派
- 如果设置为 `false`（默认）：只调整现有任务，后续任务仍使用原来的自动分派逻辑

**建议：**
- 如果是临时调整（如设备故障）：`update_process_department: false`
- 如果是长期调整（如能力不足）：`update_process_department: true`

### Q6: 如何查看某个工序会分派到哪个部门？

**A:** 可以在数据库中查看：
```python
from workorder.models import Process, Department

process = Process.objects.get(code='DIE')
departments = Department.objects.filter(processes=process, is_active=True)
print([dept.name for dept in departments])
```

系统会按上述规则选择最合适的部门。

## 七、技术实现

### 7.1 核心方法

- **位置**：`backend/workorder/models.py` - `WorkOrderProcess._auto_assign_task()`
- **调用时机**：`generate_tasks()` 方法中，每个任务创建后立即调用
- **参数**：`task` - `WorkOrderTask` 实例

### 7.2 关键逻辑

```python
# 1. 检查工序级别分派
if self.department:
    task.assigned_department = self.department

# 2. 查找匹配的专业车间
matched_dept_code = process_dept_mapping.get(process_code)
if matched_dept_code:
    matched_dept = departments.filter(code=matched_dept_code).first()

# 3. 选择非外协专业车间
professional_depts = departments.filter(
    parent__isnull=False
).exclude(code='outsourcing').order_by('sort_order')

# 4. 兜底：选择外协或父部门
```

## 八、未来优化方向

1. **智能负载均衡**：根据部门当前任务负载智能分派
2. **规则配置化**：将分派规则配置化，支持动态调整
3. **历史学习**：根据历史分派数据优化分派策略
4. **操作员自动分派**：根据部门、任务类型等自动分派操作员

