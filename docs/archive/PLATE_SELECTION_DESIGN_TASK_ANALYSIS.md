# 版选择与设计任务生成逻辑分析

**生成时间**：2025-01-28  
**分析目的**：分析当前系统中版选择提示信息与实际逻辑的差异，指出问题并提供优化建议

## 一、当前提示信息

在新建/编辑施工单页面中，图稿、刀模、烫金版、压凸版的提示信息如下：

### 1.1 图稿选择
```
可选/必选：如果已有图稿，请选择；如果未选择，将生成设计图稿任务。可多选（如纸卡双面印刷的面版和底版）
```

### 1.2 刀模选择
```
可选/必选：如果已有刀模，请选择；如果未选择，将生成设计刀模任务。可多选
```

### 1.3 烫金版选择
```
可选/必选：如果已有烫金版，请选择；如果未选择，将生成设计任务。可多选
```

### 1.4 压凸版选择
```
可选/必选：如果已有压凸版，请选择；如果未选择，将生成设计任务。可多选
```

## 二、当前实际逻辑

### 2.1 任务生成逻辑（`WorkOrderProcess.generate_tasks()`）

当前任务生成逻辑在 `backend/workorder/models.py` 的 `generate_tasks()` 方法中实现：

#### 2.1.1 制版工序（CTP）
```python
if process_code == ProcessCodes.CTP:
    # 图稿任务
    for artwork in work_order.artworks.all():  # 只为已选择的图稿生成任务
        WorkOrderTask.objects.create(...)
    
    # 刀模任务
    for die in work_order.dies.all():  # 只为已选择的刀模生成任务
        WorkOrderTask.objects.create(...)
    
    # 烫金版任务
    for foiling_plate in work_order.foiling_plates.all():  # 只为已选择的烫金版生成任务
        WorkOrderTask.objects.create(...)
    
    # 压凸版任务
    for embossing_plate in work_order.embossing_plates.all():  # 只为已选择的压凸版生成任务
        WorkOrderTask.objects.create(...)
```

#### 2.1.2 印刷工序（PRT）
```python
elif process_code == ProcessCodes.PRT:
    # 只为已选择的图稿生成任务
    for artwork in work_order.artworks.all():
        WorkOrderTask.objects.create(...)
```

#### 2.1.3 其他工序
- **烫金工序（FOIL_G）**：只为已选择的烫金版生成任务
- **压凸工序（EMB）**：只为已选择的压凸版生成任务
- **模切工序（DIE）**：只为已选择的刀模生成任务

### 2.2 工序配置字段

`Process` 模型中定义了版是否必选的字段：

```python
artwork_required = models.BooleanField('图稿必选', default=True,
                                      help_text='如果为True，选择该工序时必须选择图稿；如果为False，图稿可选（未选择时生成设计任务）')
die_required = models.BooleanField('刀模必选', default=True,
                                  help_text='如果为True，选择该工序时必须选择刀模；如果为False，刀模可选（未选择时生成设计任务）')
foiling_plate_required = models.BooleanField('烫金版必选', default=True,
                                           help_text='如果为True，选择该工序时必须选择烫金版；如果为False，烫金版可选（未选择时生成设计任务）')
embossing_plate_required = models.BooleanField('压凸版必选', default=True,
                                              help_text='如果为True，选择该工序时必须选择压凸版；如果为False，压凸版可选（未选择时生成设计任务）')
```

**注意**：这些字段的 `help_text` 明确说明"未选择时生成设计任务"，但实际代码中**并未实现**这个逻辑。

## 三、问题分析

### 3.1 核心问题

**提示信息与实际逻辑不一致**：
- ✅ **提示信息**：明确说明"如果未选择，将生成设计任务"
- ❌ **实际逻辑**：只为已选择的版生成任务，**未选择的版不会生成任何任务**

### 3.2 具体问题

#### 3.2.1 制版工序（CTP）

**场景1**：选择"印刷"工序，但未选择图稿
- **提示信息**：说会生成设计图稿任务
- **实际行为**：制版工序开始时，因为 `work_order.artworks.all()` 为空，**不会生成任何图稿任务**
- **结果**：制版工序可能无法正常进行

**场景2**：选择"模切"工序，但未选择刀模
- **提示信息**：说会生成设计刀模任务
- **实际行为**：制版工序开始时，因为 `work_order.dies.all()` 为空，**不会生成任何刀模任务**
- **结果**：制版工序可能无法正常进行

#### 3.2.2 印刷工序（PRT）

**场景**：选择"印刷"工序，但未选择图稿
- **提示信息**：说会生成设计图稿任务
- **实际行为**：印刷工序开始时，因为 `work_order.artworks.all()` 为空，**不会生成任何印刷任务**
- **结果**：印刷工序可能无法正常进行

#### 3.2.3 模型字段说明与实际不符

- **模型字段 `artwork_required` 等**：`help_text` 说明"未选择时生成设计任务"
- **实际代码**：没有检查 `artwork_required` 字段，也没有生成设计任务的逻辑
- **结果**：字段说明与实际实现不一致，可能误导开发者

### 3.3 影响范围

1. **用户体验**：
   - 用户根据提示信息，认为未选择版时会自动生成设计任务
   - 但实际上没有生成任务，导致工序无法正常进行
   - 用户可能不知道问题出在哪里

2. **业务流程**：
   - 如果版不是必选的，理论上应该生成设计任务
   - 但当前系统无法自动生成设计任务
   - 需要手动创建任务，增加了操作复杂度

3. **数据一致性**：
   - 工序可能因为没有版而无法正常完成
   - 任务可能因为缺少版关联而无法正常进行

## 四、当前逻辑设计意图推测

### 4.1 设计意图

根据提示信息和模型字段说明，系统的设计意图应该是：

1. **如果版已选择**：
   - 直接使用已选择的版
   - 生成对应的制版/印刷/模切等任务

2. **如果版未选择，但工序需要版（且版不是必选的）**：
   - 生成设计任务（如"设计图稿"、"设计刀模"等）
   - 设计任务完成后，创建对应的版记录
   - 然后使用该版继续后续流程

### 4.2 未实现的逻辑

以下逻辑在当前系统中**未实现**：

1. ❌ 检查工序是否需要版（`requires_artwork`、`requires_die` 等）
2. ❌ 检查版是否必选（`artwork_required`、`die_required` 等）
3. ❌ 如果版未选择且不是必选的，生成设计任务
4. ❌ 设计任务的类型和内容定义
5. ❌ 设计任务完成后如何关联到版记录

## 五、现有设计任务相关代码

### 5.1 任务更新时的设计任务检查

在 `backend/workorder/views.py` 中，任务更新时检查是否为设计任务：

```python
# 处理设计图稿/设计刀模任务
is_design_task = '设计图稿' in task.work_content or '更新图稿' in task.work_content
is_die_design_task = '设计刀模' in task.work_content or '更新刀模' in task.work_content

if is_design_task:
    if not artwork_ids or len(artwork_ids) == 0:
        return Response({'error': '请至少选择一个图稿'}, ...)
```

**说明**：代码中检查任务内容是否包含"设计图稿"或"设计刀模"，说明系统**预期存在**设计任务，但**没有自动生成**这些任务的逻辑。

### 5.2 任务内容格式

从代码可以看出，设计任务的内容格式应该是：
- 图稿设计任务：包含"设计图稿"或"更新图稿"
- 刀模设计任务：包含"设计刀模"或"更新刀模"

## 六、优化建议

### 6.1 方案一：实现设计任务自动生成逻辑（推荐）

**目标**：按照提示信息和模型字段说明，实现设计任务自动生成。

#### 6.1.1 修改 `generate_tasks()` 方法

在 `WorkOrderProcess.generate_tasks()` 中，为制版工序（CTP）添加设计任务生成逻辑：

```python
if process_code == ProcessCodes.CTP:
    # 1. 图稿任务
    if work_order.artworks.exists():
        # 已选择图稿，生成制版任务
        for artwork in work_order.artworks.all():
            WorkOrderTask.objects.create(
                work_order_process=self,
                task_type='plate_making',
                artwork=artwork,
                work_content=f'{order_number}制版审核',
                ...
            )
    elif self.process.requires_artwork and not self.process.artwork_required:
        # 未选择图稿，但工序需要图稿且图稿不是必选的，生成设计任务
        WorkOrderTask.objects.create(
            work_order_process=self,
            task_type='artwork',  # 或新增 'design_artwork' 类型
            work_content=f'{order_number}设计图稿',
            production_quantity=1,
            ...
        )
    
    # 2. 刀模任务（类似逻辑）
    if work_order.dies.exists():
        ...
    elif self.process.requires_die and not self.process.die_required:
        WorkOrderTask.objects.create(
            ...
            work_content=f'{order_number}设计刀模',
            ...
        )
    
    # 3. 烫金版任务（类似逻辑）
    # 4. 压凸版任务（类似逻辑）
```

#### 6.1.2 修改其他工序的任务生成

对于印刷、模切、烫金、压凸等工序，也应该检查版是否已选择，如果未选择且不是必选的，可以考虑：
- 等待设计任务完成后再生成任务
- 或者在这些工序开始时也生成设计任务

#### 6.1.3 设计任务完成后关联版

需要实现逻辑：设计任务完成后，创建对应的版记录，并关联到施工单。

### 6.2 方案二：修改提示信息，与实际逻辑保持一致

**目标**：如果暂时不实现设计任务自动生成，修改提示信息，避免误导用户。

#### 6.2.1 修改前端提示

```javascript
// 修改前
如果已有图稿，请选择；如果未选择，将生成设计图稿任务。

// 修改后（如果版是必选的）
请选择图稿（必选）。

// 修改后（如果版是可选的）
如果已有图稿，请选择；如果未选择，需要手动创建设计任务。
```

#### 6.2.2 修改模型字段说明

```python
artwork_required = models.BooleanField(
    '图稿必选', 
    default=True,
    help_text='如果为True，选择该工序时必须选择图稿；如果为False，图稿可选（但需要手动创建设计任务）'  # 修改说明
)
```

### 6.3 方案三：混合方案

1. **短期**：修改提示信息和模型字段说明，与实际逻辑保持一致
2. **长期**：实现设计任务自动生成逻辑

## 七、推荐实施方案

### 7.1 已实施（方案二）✅

1. ✅ 修改前端提示信息，明确说明需要手动创建设计任务（设计不属于施工单工序）
2. ✅ 修改模型字段的 `help_text`，与实际逻辑保持一致
3. ✅ 更新后端 views.py 中的设计任务处理逻辑注释，说明设计不属于施工单工序
4. ✅ 更新相关文档

### 7.2 业务说明

**设计和采购都不属于施工单工序**：
- **设计任务**：通过其他系统管理，不属于施工单工序
- **采购任务**：通过其他系统管理，不属于施工单工序
- **施工单系统**：只管理施工单相关的工序和任务（制版、印刷、模切、开料、包装等）

**版选择逻辑**：
- 如果版是必选的（`artwork_required=True` 等），用户必须选择版
- 如果版是可选的（`artwork_required=False` 等），用户可以选择已有版，或手动创建设计任务
- 系统不会自动生成设计任务，因为设计不属于施工单工序

## 八、总结

### 8.1 当前状态

- ❌ **提示信息**：说明会生成设计任务
- ❌ **实际逻辑**：只为已选择的版生成任务
- ❌ **模型字段说明**：说明未选择时会生成设计任务
- ❌ **实际实现**：没有生成设计任务的逻辑

### 8.2 核心问题

**提示信息与实际逻辑不一致**，导致：
- 用户期望与实际行为不符
- 可能影响业务流程
- 需要手动创建设计任务，增加操作复杂度

### 8.3 已实施的优化

**已实施方案二**（修改提示信息），确保提示信息与实际逻辑一致。  
**业务说明**：设计和采购都不属于施工单工序，设计任务通过其他系统管理，系统不会自动生成设计任务。

### 8.4 优化结果

- ✅ **前端提示信息**：已更新，明确说明需要手动创建设计任务（设计不属于施工单工序）
- ✅ **模型字段说明**：已更新，与实际逻辑保持一致
- ✅ **后端注释**：已更新，说明设计不属于施工单工序
- ✅ **文档**：已更新，反映最新的业务逻辑
