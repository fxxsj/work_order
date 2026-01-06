# 任务管理系统分析文档

## 一、任务模型字段（WorkOrderTask）

### 1.1 核心字段

| 字段名 | 类型 | 说明 | 可选值/约束 |
|--------|------|------|------------|
| `work_order_process` | ForeignKey | 关联的工序 | 必填，关联到 WorkOrderProcess |
| `task_type` | CharField | 任务类型 | `artwork`(图稿), `die`(刀模), `product`(产品), `material`(物料), `general`(通用) |
| `work_content` | TextField | 施工内容 | 必填，描述具体任务内容 |
| `production_quantity` | IntegerField | 生产数量 | 默认0，该任务需要生产的数量 |
| `quantity_completed` | IntegerField | 完成数量 | 默认0，可自动计算或手动输入 |
| `auto_calculate_quantity` | BooleanField | 自动计算数量 | 默认True，是否自动计算完成数量 |
| `status` | CharField | 状态 | `pending`(待开始), `in_progress`(进行中), `completed`(已完成), `cancelled`(已取消) |
| `production_requirements` | TextField | 生产要求 | 可选，生产过程中的特殊要求/备注 |

### 1.2 关联对象字段（互斥，只有一个有值）

| 字段名 | 类型 | 说明 | 使用场景 |
|--------|------|------|----------|
| `artwork` | ForeignKey | 关联图稿 | 图稿任务（制版、印刷） |
| `die` | ForeignKey | 关联刀模 | 刀模任务（模切） |
| `product` | ForeignKey | 关联产品 | 产品任务（包装） |
| `material` | ForeignKey | 关联物料 | 物料任务（采购、开料） |

### 1.3 时间戳字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `created_at` | DateTimeField | 创建时间（自动） |
| `updated_at` | DateTimeField | 更新时间（自动） |

## 二、任务生成逻辑

### 2.1 生成时机
- **在工序开始时自动生成**：当调用 `WorkOrderProcess.start()` 方法时，会调用 `generate_tasks()` 生成任务
- **只生成一次**：如果工序已有任务，不会重复生成

### 2.2 生成规则（根据 Process.task_generation_rule）

#### 规则1：`artwork`（图稿任务）

**用于工序**：制版、印刷

**生成逻辑**：

1. **制版工序**（根据 `work_order.artwork_type`）：
   - `new_design`（新设计图稿）：
     - 生成1个任务
     - 内容：`"为{order_number}设计图稿"`
     - `artwork=None`（设计完成后才关联）
     - `production_quantity=1`
     - `auto_calculate_quantity=False`
   
   - `need_update`（需更新图稿）：
     - 生成1个任务
     - 内容：`"为{order_number}更新图稿"`
     - `artwork=None`
     - `production_quantity=1`
     - `auto_calculate_quantity=False`
   
   - `old_artwork`（旧图稿）：
     - 为每个选中的图稿生成1个任务
     - 内容：`"制版：{artwork_code} - {artwork_name}"`
     - `artwork=artwork`（立即关联）
     - `production_quantity=1`
     - `auto_calculate_quantity=False`

2. **印刷工序**：
   - 为每个施工单关联的图稿生成1个任务
   - 内容：`"印刷：{artwork_code} - {artwork_name}"`
   - `artwork=artwork`
   - `production_quantity=1`
   - `auto_calculate_quantity=False`

#### 规则2：`die`（刀模任务）

**用于工序**：模切

**生成逻辑**（根据 `work_order.die_type`）：

- `new_design`（新设计刀模）：
  - 生成1个任务
  - 内容：`"为{order_number}设计刀模"`
  - `die=None`
  - `production_quantity=1`
  - `auto_calculate_quantity=False`

- `need_update`（需更新刀模）：
  - 生成1个任务
  - 内容：`"为{order_number}更新刀模"`
  - `die=None`
  - `production_quantity=1`
  - `auto_calculate_quantity=False`

- `old_die`（旧刀模）：
  - 为每个选中的刀模生成1个任务
  - 内容：`"模切：{die_code} - {die_name}"`
  - `die=die`
  - `production_quantity=1`
  - `auto_calculate_quantity=False`

#### 规则3：`product`（产品任务）

**用于工序**：包装

**生成逻辑**：
- 为施工单中的每个产品生成1个任务
- 内容：`"包装：{product_name}"`
- `product=product`
- `production_quantity=product_item.quantity`（产品数量）
- `auto_calculate_quantity=True`

#### 规则4：`material`（物料任务）

**用于工序**：采购、开料

**生成逻辑**：

1. **采购工序**：
   - 为施工单中的所有物料生成任务
   - 内容：`"采购：{material_name}"`
   - `material=material`
   - `production_quantity=解析自material_usage`
   - `auto_calculate_quantity=True`

2. **开料工序**：
   - 只为 `need_cutting=True` 的物料生成任务
   - 内容：`"开料：{material_name}"`
   - `material=material`
   - `production_quantity=解析自material_usage`
   - `auto_calculate_quantity=True`

#### 规则5：`general`（通用任务）

**用于工序**：裱坑、打钉等

**生成逻辑**：
- 生成1个通用任务
- 内容：`"{process_name}：通用任务"`
- 无关联对象
- `production_quantity=work_order.production_quantity`
- `auto_calculate_quantity=True`

**特殊处理**：
- 如果工序名称包含"制版"或"设计"，即使规则是 `general`，也会按照 `artwork_type` 生成图稿任务

## 三、任务完成逻辑

### 3.1 任务完成方式

#### 方式1：直接更新任务状态
- 通过 `PATCH /api/workorder-tasks/{id}/` 更新 `status='completed'`
- 更新后自动触发 `work_order_process.check_and_update_status()`

#### 方式2：使用完成接口（支持设计任务）
- 通过 `POST /api/workorder-tasks/{id}/complete/` 完成任务
- **特殊功能**：
  - 如果任务内容是"设计图稿"或"更新图稿"：
    - 必须选择至少一个图稿（`artwork_ids`）
    - 选中的图稿会自动关联到施工单（`work_order.artworks.add()`）
    - 第一个图稿会关联到任务（`task.artwork`）
    - 可以添加备注（保存到 `production_requirements`）
  
  - 如果任务内容是"设计刀模"或"更新刀模"：
    - 必须选择至少一个刀模（`die_ids`）
    - 选中的刀模会自动关联到施工单（`work_order.dies.add()`）
    - 第一个刀模会关联到任务（`task.die`）
    - 可以添加备注（保存到 `production_requirements`）

### 3.2 工序完成判断（check_and_update_status）

根据任务类型和工序名称，判断工序是否完成：

#### 图稿任务（`rule='artwork'`）：
- **制版工序**：
  - 所有任务的图稿必须已确认（`artwork.confirmed=True`）
  - 所有任务必须完成（`status='completed'`）
  
- **其他工序**（如印刷）：
  - 所有任务必须完成

#### 物料任务（`rule='material'`）：
- **采购工序**：
  - 检查 `WorkOrderMaterial.purchase_status='received'`（已回料）
  
- **开料工序**：
  - 检查 `WorkOrderMaterial.purchase_status='cut'`（已开料）
  
- **其他物料工序**：
  - 所有任务必须完成

#### 刀模任务（`rule='die'`）：
- 所有任务必须完成

#### 产品任务（`rule='product'`）：
- 所有任务必须完成

#### 通用任务（`rule='general'`）：
- 所有任务必须完成

**完成条件满足后**：
- 设置 `work_order_process.status='completed'`
- 设置 `work_order_process.actual_end_time=当前时间`

## 四、任务数量管理

### 4.1 生产数量（production_quantity）

- **固定数量**（`auto_calculate_quantity=False`）：
  - 图稿任务：固定为1
  - 刀模任务：固定为1
  - 设计/更新任务：固定为1

- **动态数量**（`auto_calculate_quantity=True`）：
  - 产品任务：等于产品数量（`product_item.quantity`）
  - 物料任务：解析自 `material_usage` 字段
  - 通用任务：等于施工单生产数量（`work_order.production_quantity`）

### 4.2 完成数量（quantity_completed）

- **自动计算**（`auto_calculate_quantity=True`）：
  - 根据关联对象的状态自动计算（如物料回料数量）
  
- **手动输入**（`auto_calculate_quantity=False`）：
  - 用户手动更新完成数量
  - 可通过"更新数量"按钮更新

## 五、前端功能

### 5.1 任务列表页面（`/tasks`）

**显示字段**：
- ID
- 施工单号（可点击跳转）
- 工序名称
- 任务内容
- 任务类型
- 关联对象（图稿/刀模/产品/物料）
- 生产数量
- 完成数量
- 状态

**功能**：
- 筛选：按工序、状态、任务类型
- 搜索：按任务内容、生产要求
- 排序：按创建时间、更新时间
- 操作：
  - 完成任务（如果可完成）
  - 更新数量（如果允许手动更新）
  - 查看施工单详情

### 5.2 施工单详情页面任务显示

**显示方式**：
- 按工序分组显示（使用 `el-collapse`）
- 每个工序下显示该工序的所有任务
- 显示任务详情：内容、类型、关联对象、数量、状态

**操作**：
- 开始工序（生成任务）
- 完成任务（支持设计任务时选择图稿/刀模）
- 更新任务数量

## 六、数据流程

### 6.1 任务创建流程

```
创建施工单
  ↓
选择工序（根据产品默认工序）
  ↓
开始工序（start）
  ↓
生成任务（generate_tasks）
  ↓
根据规则创建任务记录
```

### 6.2 任务完成流程

```
更新任务状态/调用完成接口
  ↓
如果是设计任务，选择图稿/刀模
  ↓
图稿/刀模关联到施工单
  ↓
任务状态设为 completed
  ↓
检查工序是否完成（check_and_update_status）
  ↓
如果所有任务完成，工序状态设为 completed
```

### 6.3 工序依赖流程

```
检查工序是否可以开始（can_start）
  ↓
如果是并行工序（制版、采购、模切），可以立即开始
  ↓
如果是顺序工序，检查前一个非并行工序是否完成
  ↓
可以开始时，生成任务并开始
```

## 七、关键业务规则

### 7.1 并行工序
- **制版**：可以与其他并行工序同时进行
- **采购**：可以与其他并行工序同时进行
- **模切**（如果使用旧刀模）：可以与其他并行工序同时进行
- **其他工序**：必须按顺序执行

### 7.2 任务类型与工序的对应关系

| 工序名称 | 任务生成规则 | 任务类型 | 数量规则 |
|---------|------------|---------|---------|
| 制版 | artwork/general | artwork | 固定1 |
| 采购 | material | material | 解析material_usage |
| 开料 | material | material | 解析material_usage（仅need_cutting=True） |
| 印刷 | artwork | artwork | 固定1 |
| 裱坑 | general | general | 施工单数量 |
| 模切 | die | die | 固定1 |
| 打钉 | general | general | 施工单数量 |
| 包装 | product | product | 产品数量 |

### 7.3 设计任务的特殊处理

- **新设计图稿/刀模**：
  - 任务创建时 `artwork/die=None`
  - 完成任务时必须选择图稿/刀模
  - 选中的图稿/刀模自动关联到施工单
  - 第一个图稿/刀模关联到任务

- **更新图稿/刀模**：
  - 任务创建时 `artwork/die=None`
  - 完成任务时可以选择新的图稿/刀模
  - 选中的图稿/刀模自动关联到施工单

## 八、API 接口

### 8.1 任务列表
- `GET /api/workorder-tasks/`：获取任务列表（支持筛选、搜索、排序）

### 8.2 任务详情
- `GET /api/workorder-tasks/{id}/`：获取任务详情

### 8.3 更新任务
- `PATCH /api/workorder-tasks/{id}/`：更新任务（状态、完成数量等）

### 8.4 完成任务
- `POST /api/workorder-tasks/{id}/complete/`：完成任务（支持设计任务时选择图稿/刀模）

## 九、总结

任务管理系统是一个基于规则的任务生成和完成追踪系统：

1. **自动生成**：根据工序规则和施工单内容自动生成任务
2. **类型多样**：支持图稿、刀模、产品、物料、通用五种任务类型
3. **智能完成**：根据任务类型和关联对象状态判断工序是否完成
4. **灵活数量**：支持自动计算和手动输入两种数量管理方式
5. **设计支持**：特殊处理设计任务，支持完成任务时选择图稿/刀模
6. **流程控制**：支持并行和顺序两种工序执行方式


