# 工序逻辑全面分析文档

**最后更新时间：** 2025-01-15  
**文档版本：** 2.0

本文档全面分析当前系统中工序（Process）模块的设计、实现和使用方式，整合了所有相关功能的最新状态。

---

## 一、核心设计理念

### 1.1 工序优先原则

- **核心理念**：先确定要做什么工序，再确定需要什么版
- **符合实际流程**：业务员接到订单时，首先确定需要哪些工序（印刷、模切、烫金等），然后确定需要哪些版
- **消除信息冗余**：不再需要单独的类型选择字段（`artwork_type`、`die_type` 等）

### 1.2 配置化设计

- **工序配置**：在 `Process` 模型中配置工序与版的关系
- **灵活扩展**：新增工序或版类型时，只需在配置中设置，无需修改代码
- **必选/可选控制**：通过 `*_required` 字段控制版是否必选

### 1.3 编码匹配原则

- **统一使用编码**：所有业务逻辑统一使用 `process.code` 字段进行匹配
- **避免名称匹配**：不再使用 `process.name` 进行业务逻辑判断
- **常量类管理**：通过 `ProcessCodes` 常量类统一管理所有工序编码

---

## 二、数据模型结构

### 2.1 Process 模型（工序定义）

**文件位置：** `backend/workorder/models.py`

#### 基础字段

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `name` | CharField | 工序名称 | - |
| `code` | CharField | 工序编码（唯一） | - |
| `description` | TextField | 工序描述 | '' |
| `standard_duration` | IntegerField | 标准工时(小时) | 0 |
| `sort_order` | IntegerField | 排序 | 0 |
| `is_active` | BooleanField | 是否启用 | True |
| `is_builtin` | BooleanField | 是否内置 | False |
| `created_at` | DateTimeField | 创建时间 | auto_now_add |

#### 任务生成配置

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `task_generation_rule` | CharField | 任务生成规则 | 'general' |

**可选值：**
- `artwork` - 按图稿生成任务（每个图稿一个任务，数量为1）
- `die` - 按刀模生成任务（每个刀模一个任务，数量为1）
- `product` - 按产品生成任务（每个产品一个任务）
- `material` - 按物料生成任务（每个物料一个任务）
- `general` - 生成通用任务（一个工序一个任务）

**注意：** 当前系统已优化为直接使用工序编码匹配，不再依赖此配置字段。

#### 版需求配置

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `requires_artwork` | BooleanField | 需要图稿 | False |
| `requires_die` | BooleanField | 需要刀模 | False |
| `requires_foiling_plate` | BooleanField | 需要烫金版 | False |
| `requires_embossing_plate` | BooleanField | 需要压凸版 | False |

#### 版必选配置

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `artwork_required` | BooleanField | 图稿必选 | True |
| `die_required` | BooleanField | 刀模必选 | True |
| `foiling_plate_required` | BooleanField | 烫金版必选 | True |
| `embossing_plate_required` | BooleanField | 压凸版必选 | True |

**配置说明：**
- `requires_*`：该工序是否需要该版
- `*_required`：该版是否必选
  - `True`：必选，选择该工序时必须选择对应的版
  - `False`：可选，未选择时将生成设计任务

#### 并行执行配置

| 字段名 | 类型 | 说明 | 默认值 |
|--------|------|------|--------|
| `is_parallel` | BooleanField | 可并行执行 | False |

**说明：** 可并行执行的工序（如制版、模切）可以与其他工序同时进行，不需要等待前序工序完成。

### 2.2 WorkOrderProcess 模型（施工单工序）

**文件位置：** `backend/workorder/models.py`

#### 核心字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `work_order` | ForeignKey | 所属施工单 |
| `process` | ForeignKey | 关联的工序 |
| `department` | ForeignKey | 生产部门 |
| `sequence` | IntegerField | 工序顺序 |
| `status` | CharField | 状态（pending/in_progress/completed/skipped） |
| `operator` | ForeignKey | 操作员 |
| `quantity_completed` | IntegerField | 完成数量 |
| `quantity_defective` | IntegerField | 不良品数量 |

#### 核心方法

**`can_start()`** - 判断工序是否可以开始
- 可并行工序（`is_parallel=True` 或编码为 CTP/DIE）可以直接开始
- 其他工序需要前一个非并行工序完成

**`check_and_update_status()`** - 自动判断工序是否完成
- 检查所有任务是否完成
- 检查任务完成数量是否满足要求
- 检查业务条件（制版任务需图稿确认，开料任务需物料状态满足）

**`generate_tasks()`** - 为工序生成任务
- 根据工序编码（`process.code`）精确匹配生成不同类型的任务
- 使用 `ProcessCodes` 常量类进行匹配

### 2.3 WorkOrderTask 模型（任务）

**文件位置：** `backend/workorder/models.py`

#### 核心字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `work_order_process` | ForeignKey | 所属工序 |
| `task_type` | CharField | 任务类型 |
| `work_content` | CharField | 工作内容 |
| `production_quantity` | IntegerField | 生产数量 |
| `quantity_completed` | IntegerField | 完成数量 |
| `status` | CharField | 状态（pending/in_progress/completed） |
| `auto_calculate_quantity` | BooleanField | 自动计算数量 |

#### 关联对象字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `artwork` | ForeignKey | 关联图稿 |
| `die` | ForeignKey | 关联刀模 |
| `foiling_plate` | ForeignKey | 关联烫金版 |
| `embossing_plate` | ForeignKey | 关联压凸版 |
| `product` | ForeignKey | 关联产品 |
| `material` | ForeignKey | 关联物料 |

---

## 三、工序编码常量类

### 3.1 ProcessCodes 类

**文件位置：** `backend/workorder/process_codes.py`

**作用：** 统一管理所有工序编码常量，避免硬编码分散在代码中。

#### 预设工序编码

| 编码 | 名称 | 说明 |
|------|------|------|
| CTP | 制版 | 可并行执行 |
| CUT | 开料 | 需要物料开料状态 |
| PRT | 印刷 | - |
| VAN | 过油 | - |
| LAM_G | 覆光膜 | - |
| LAM_M | 覆哑膜 | - |
| UV | UV | - |
| FOIL_G | 烫金 | - |
| FOIL_S | 烫银 | - |
| EMB | 压凸 | - |
| TEX | 压纹 | - |
| SCORE | 压线 | - |
| DIE | 模切 | 可并行执行 |
| TRIM | 切成品 | - |
| LAM_B | 对裱 | - |
| MOUNT | 裱坑 | - |
| GLUE | 粘胶 | - |
| BOX | 粘盒 | - |
| WINDOW | 粘窗口 | - |
| STAPLE | 打钉 | - |
| PACK | 包装 | - |

#### 辅助方法

```python
ProcessCodes.is_parallel(code)  # 判断是否为可并行工序
ProcessCodes.is_cutting_process(code)  # 判断是否为开料工序
ProcessCodes.is_plate_making_process(code)  # 判断是否为制版工序
ProcessCodes.requires_material_cut_status(code)  # 判断是否需要物料开料状态
```

---

## 四、任务生成规则

### 4.1 生成时机

- 工序状态变为 `in_progress` 时自动调用 `generate_tasks()`
- 如果工序已有任务，不会重复生成

### 4.2 生成规则（基于工序编码）

系统使用 `ProcessCodes` 常量类统一管理工序编码，根据 `process.code` 精确匹配生成不同类型的任务：

| 工序编码 | 工序名称 | 生成任务类型 | 任务说明 | 生产数量 |
|---------|---------|------------|---------|---------|
| CTP | 制版 | plate_making | 为图稿、刀模、烫金版、压凸版各生成1个任务 | 1 |
| CUT | 开料 | cutting | 为需要开料的物料（need_cutting=True）生成任务 | 物料用量 |
| PRT | 印刷 | printing | 为每个图稿生成1个任务 | 施工单数量 |
| FOIL_G | 烫金 | foiling | 为每个烫金版生成1个任务 | 施工单数量 |
| EMB | 压凸 | embossing | 为每个压凸版生成1个任务 | 施工单数量 |
| DIE | 模切 | die_cutting | 为每个刀模生成1个任务 | 施工单数量 |
| PACK | 包装 | packaging | 为每个产品生成1个任务 | 产品数量 |
| 其他 | 其他工序 | general | 生成1个通用任务 | 施工单数量 |

**关键变化：**
- ✅ **已优化**：不再依赖 `task_generation_rule` 配置字段，直接使用工序编码匹配
- ✅ **已优化**：不再使用工序名称匹配，统一使用 `ProcessCodes` 常量

### 4.3 任务类型

| 任务类型 | 说明 | 关联对象 | 使用场景 |
|---------|------|---------|---------|
| plate_making | 制版任务 | artwork/die/foiling_plate/embossing_plate | CTP工序 |
| cutting | 开料任务 | material | CUT工序 |
| printing | 印刷任务 | artwork | PRT工序 |
| foiling | 烫金任务 | foiling_plate | FOIL_G工序 |
| embossing | 压凸任务 | embossing_plate | EMB工序 |
| die_cutting | 模切任务 | die | DIE工序 |
| packaging | 包装任务 | product | PACK工序 |
| general | 通用任务 | 无 | 其他工序 |

**重要说明：**
- ❌ **不存在** `material` 任务类型（采购任务类型实际不存在）
- ⚠️ **采购工序不生成任务**：采购状态在 `WorkOrderMaterial.purchase_status` 中管理，不通过任务系统

---

## 五、工序内置功能

### 5.1 内置工序特性

**字段：** `is_builtin` (BooleanField)

**功能：**
1. **不可删除**：内置工序无法通过 Admin 或 API 删除
2. **code 字段不可编辑**：内置工序的编码字段在 Admin 中为只读
3. **非内置工序**：不受上述限制，可以正常编辑和删除

### 5.2 预设工序

系统预设了 **21个内置工序**，通过 `reset_processes` 命令加载：

| ID | 编码 | 名称 | 排序 | 可并行执行 |
|---|---|---|---|---|---|
| 1 | CTP | 制版 | 1 | 是 |
| 2 | CUT | 开料 | 2 | 否 |
| 3 | PRT | 印刷 | 3 | 否 |
| 4 | VAN | 过油 | 4 | 否 |
| 5 | LAM_G | 覆光膜 | 5 | 否 |
| 6 | LAM_M | 覆哑膜 | 6 | 否 |
| 7 | UV | UV | 7 | 否 |
| 8 | FOIL_G | 烫金 | 8 | 否 |
| 9 | FOIL_S | 烫银 | 9 | 否 |
| 10 | EMB | 压凸 | 10 | 否 |
| 11 | TEX | 压纹 | 11 | 否 |
| 12 | SCORE | 压线 | 12 | 否 |
| 13 | DIE | 模切 | 13 | 是 |
| 14 | TRIM | 切成品 | 14 | 否 |
| 15 | LAM_B | 对裱 | 15 | 否 |
| 16 | MOUNT | 裱坑 | 16 | 否 |
| 17 | GLUE | 粘胶 | 17 | 否 |
| 18 | BOX | 粘盒 | 18 | 否 |
| 19 | WINDOW | 粘窗口 | 19 | 否 |
| 20 | STAPLE | 打钉 | 20 | 否 |
| 21 | PACK | 包装 | 21 | 否 |

### 5.3 重置工序数据

**管理命令：** `python manage.py reset_processes`

**功能：**
1. 检查是否有施工单在使用工序（如存在且未使用 `--force`，则终止）
2. 清除产品的默认工序关联
3. 删除所有现有工序（如使用 `--force`，同时删除施工单工序记录）
4. 从 `preset_processes.json` 加载21个预设内置工序

**使用方法：**
```bash
# 检查是否有关联数据（不会执行删除）
python manage.py reset_processes

# 强制执行（会删除所有关联数据）
python manage.py reset_processes --force
```

---

## 六、工序关联关系

### 6.1 直接关联的模块

#### Department（部门）
- **关联方式**：`ManyToManyField('Process')`
- **关系**：多对多
- **用途**：定义部门负责的工序
- **匹配方式**：通过外键关联，无需匹配逻辑

#### Product（产品）
- **关联方式**：`ManyToManyField('Process')` (default_processes)
- **关系**：多对多
- **用途**：定义产品的默认工序，创建施工单时自动添加
- **匹配方式**：通过外键关联，无需匹配逻辑

#### WorkOrderProcess（施工单工序）
- **关联方式**：`ForeignKey(Process)`
- **关系**：多对一
- **用途**：施工单中的具体工序实例
- **匹配方式**：通过外键关联，无需匹配逻辑

### 6.2 间接关联的模块

#### WorkOrderTask（任务）
- **关联方式**：通过 `WorkOrderProcess` 间接关联
- **关系**：`ForeignKey(WorkOrderProcess)`
- **用途**：为工序生成的具体任务
- **匹配方式**：通过 `process.code` 和 `ProcessCodes` 常量类匹配

#### ProcessLog（工序日志）
- **关联方式**：通过 `WorkOrderProcess` 间接关联
- **关系**：`ForeignKey(WorkOrderProcess)`
- **用途**：记录工序的操作历史
- **匹配方式**：通过外键关联，无需匹配逻辑

---

## 七、工作流程

### 7.1 创建/编辑施工单流程

```
1. 用户填写基本信息
   ├─ 客户、日期、数量等
   └─ 产品列表

2. 用户选择工序（关键步骤）
   ├─ 勾选需要的工序（印刷、模切、烫金等）
   └─ 系统根据工序配置自动显示对应的版选择项

3. 用户选择版（根据工序要求）
   ├─ 如果工序要求版必选：必须选择版
   ├─ 如果工序要求版可选：可以选择版或留空（留空时生成设计任务）
   └─ 支持多选（如纸卡双面印刷需要面版和底版）

4. 系统验证
   ├─ 检查必选版是否已选择
   └─ 检查版与工序的匹配关系

5. 保存施工单
   └─ 创建 WorkOrderProcess 记录
```

### 7.2 工序执行流程

```
1. 开始工序
   ├─ 检查是否可以开始（can_start()）
   ├─ 更新状态为 in_progress
   ├─ 记录开始时间
   └─ 自动生成任务（generate_tasks()）

2. 执行任务
   ├─ 更新任务完成数量
   ├─ 检查任务完成条件
   └─ 自动更新任务状态

3. 完成工序
   ├─ 检查所有任务是否完成（check_and_update_status()）
   ├─ 检查业务条件（图稿确认、物料状态等）
   ├─ 更新状态为 completed
   └─ 记录结束时间
```

### 7.3 任务更新流程

```
1. 更新任务数量（update_quantity）
   ├─ 接收增量值（quantity_increment）
   ├─ 累加完成数量
   ├─ 业务验证（图稿确认、物料状态等）
   ├─ 自动判断任务状态
   └─ 记录操作日志

2. 强制完成任务（complete）
   ├─ 状态强制设为 completed
   ├─ 可填写完成理由
   └─ 记录操作日志
```

---

## 八、优化历史

### 8.1 编码匹配优化

**优化时间：** 2025-01-28

**优化内容：**
- ✅ 消除硬编码：所有硬编码的工序编码字符串替换为常量
- ✅ 消除名称匹配：所有基于名称的匹配逻辑替换为编码匹配
- ✅ 前后端统一：前后端都使用编码匹配，逻辑一致
- ✅ 可配置性提升：通过 `is_parallel` 字段可以灵活配置并行工序

**优化文件：**
- `backend/workorder/process_codes.py` - 创建工序编码常量类
- `backend/workorder/models.py` - 统一使用编码匹配
- `backend/workorder/views.py` - 统一使用编码匹配
- `frontend/src/views/workorder/Detail.vue` - 统一使用编码匹配
- `frontend/src/views/workorder/Form.vue` - 统一使用编码匹配

### 8.2 并行执行优化

**优化时间：** 2025-01-28

**优化内容：**
- ✅ 添加 `is_parallel` 字段到 `Process` 模型
- ✅ 为 CTP 和 DIE 工序设置 `is_parallel=True`
- ✅ 优化 `can_start()` 方法，使用配置字段判断

---

## 九、注意事项

### 9.1 数据保护

- **内置工序**：`is_builtin=True` 的工序不可删除，`code` 字段为只读
- **预设工序**：通过 `reset_processes` 命令加载的21个工序都是内置工序
- **自定义工序**：可以正常编辑和删除

### 9.2 业务规则

- **采购不属于施工单工序**：采购状态在 `WorkOrderMaterial.purchase_status` 中管理
- **设计任务**：如果工序要求版可选但未选择，会生成设计任务
- **并行执行**：制版（CTP）和模切（DIE）可以并行执行

### 9.3 任务生成

- **不再依赖配置字段**：直接使用工序编码匹配
- **不再使用名称匹配**：统一使用 `ProcessCodes` 常量
- **自动生成时机**：工序状态变为 `in_progress` 时自动生成

---

## 十、相关文档

- [系统数据初始化分析](./DATA_INITIALIZATION_ANALYSIS.md) - 工序数据初始化说明
- [当前施工单逻辑分析](./CURRENT_WORKORDER_LOGIC_ANALYSIS.md) - 施工单整体逻辑
- [任务管理系统当前状态](./TASK_MANAGEMENT_CURRENT_STATUS.md) - 任务管理详细说明

---

## 十一、总结

当前工序系统采用**配置化设计**和**编码匹配原则**，具有以下特点：

1. **统一编码管理**：通过 `ProcessCodes` 常量类统一管理所有工序编码
2. **配置化设计**：通过模型字段配置工序与版的关系、并行执行等特性
3. **内置工序保护**：预设的21个工序受到保护，不可删除，编码不可编辑
4. **灵活扩展**：可以添加自定义工序，不受限制
5. **前后端统一**：前后端都使用编码匹配，逻辑一致

系统已经过多次优化，消除了硬编码和名称匹配的问题，提高了代码的可维护性和可扩展性。

