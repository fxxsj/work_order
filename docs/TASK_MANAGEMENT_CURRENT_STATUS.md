# 任务管理系统当前状态分析

## 一、系统概述

任务管理系统是施工单系统的核心模块，负责为每个工序生成任务、追踪任务进度、记录操作历史，并自动判断工序完成状态。

**最后更新时间**：2025-01-28

**最近更新**：
- ✅ 2025-01-28：优化任务更新数量实现方式，统一使用增量更新（`quantity_increment`）

## 二、核心功能

### 2.1 任务生成

#### 生成时机
- 工序状态变为 `in_progress` 时自动调用 `generate_tasks()`
- 如果工序已有任务，不会重复生成

#### 生成规则（基于工序编码）

系统使用 `ProcessCodes` 常量类统一管理工序编码，根据 `process.code` 精确匹配生成不同类型的任务：

| 工序编码 | 工序名称 | 生成任务类型 | 任务说明 | 生产数量 | 自动计算 |
|---------|---------|------------|---------|---------|---------|
| CTP | 制版 | plate_making | 为图稿、刀模、烫金版、压凸版各生成1个任务 | 1 | 否 |
| CUT | 开料 | cutting | 为需要开料的物料（need_cutting=True）生成任务 | 物料用量 | 否 |
| PRT | 印刷 | printing | 为每个图稿生成1个任务 | 施工单数量 | 否 |
| FOIL_G | 烫金 | foiling | 为每个烫金版生成1个任务 | 施工单数量 | 否 |
| EMB | 压凸 | embossing | 为每个压凸版生成1个任务 | 施工单数量 | 否 |
| DIE | 模切 | die_cutting | 为每个刀模生成1个任务 | 施工单数量 | 否 |
| PACK | 包装 | packaging | 为每个产品生成1个任务 | 产品数量 | 否 |
| 其他 | 其他工序 | general | 生成1个通用任务 | 施工单数量 | 否 |

**关键变化**：
- ✅ **已优化**：不再依赖 `task_generation_rule` 配置字段，直接使用工序编码匹配
- ✅ **已优化**：不再使用工序名称匹配，统一使用 `ProcessCodes` 常量
- ⚠️ **注意**：所有任务的 `auto_calculate_quantity` 目前都设置为 `False`，自动计算功能未实现

### 2.2 任务类型

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

**重要说明**：
- ❌ **不存在** `material` 任务类型（文档中提到的采购任务类型实际不存在）
- ⚠️ **采购工序不生成任务**：采购状态在 `WorkOrderMaterial.purchase_status` 中管理，不通过任务系统

### 2.3 任务更新

#### 更新数量接口（`update_quantity`）

**接口**：`POST /api/workorder-tasks/{id}/update_quantity/`

**实现方式**（已优化）：
- ✅ 前端传递增量值：`quantity_increment`（本次完成数量）
- ✅ 后端接收增量值并累加：`newQuantityCompleted = currentQuantity + quantity_increment`
- ✅ 后端使用累加后的值更新任务：`task.quantity_completed = newQuantityCompleted`

**业务验证**：
1. ✅ 制版任务：检查图稿是否已确认（`artwork.confirmed == True`）
2. ✅ 开料任务：检查物料是否已开料（`purchase_status == 'cut'`）
3. ✅ 数量验证：完成数量不能小于0，不能超过生产数量

**状态自动判断**：
- 如果 `quantity_completed >= production_quantity`：状态自动设为 `completed`
- 否则：状态设为 `in_progress`（如果原状态为 `pending`）

**操作记录**：
- ✅ 记录到 `TaskLog`，包含操作人、数量变化、状态变化

**设计任务处理**：
- 如果任务内容是"设计图稿"或"更新图稿"，必须选择图稿（`artwork_ids`）
- 如果任务内容是"设计刀模"或"更新刀模"，必须选择刀模（`die_ids`）
- 选中的图稿/刀模会追加到施工单（使用 `add()` 而不是 `set()`）

#### 强制完成接口（`complete`）

**接口**：`POST /api/workorder-tasks/{id}/complete/`

**用途**：完成数量小于生产数量时强制标记为已完成

**特点**：
- ✅ 状态强制设为 `completed`，即使数量不足
- ✅ 可填写完成理由（`completion_reason`）
- ✅ 业务验证同 `update_quantity` 接口
- ✅ 制版任务完成数量固定为1

**操作记录**：
- ✅ 记录到 `TaskLog`，包含完成理由

### 2.4 工序完成判断

#### 判断方法（`check_and_update_status`）

**位置**：`WorkOrderProcess.check_and_update_status()`

**判断条件**：
1. ✅ 所有任务状态必须为 `completed`
2. ✅ 所有任务的 `quantity_completed >= production_quantity`
3. ✅ **业务条件检查**：
   - 制版任务（`plate_making`）：图稿必须已确认（`artwork.confirmed == True`）
   - 开料任务（`cutting`）：物料必须已开料（`purchase_status == 'cut'`）

**完成操作**：
- 设置工序状态为 `completed`
- 设置 `actual_end_time` 为当前时间

**关键变化**：
- ✅ **已优化**：使用 `ProcessCodes.requires_material_cut_status(process_code)` 判断开料工序
- ✅ **已优化**：不再使用工序名称匹配

### 2.5 任务操作历史

#### TaskLog 模型

**字段**：
- `log_type`：日志类型（`update_quantity`、`complete`、`status_change`）
- `quantity_before` / `quantity_after`：数量变化
- `quantity_increment`：数量增量（本次操作的数量增量）✅ 已添加
- `status_before` / `status_after`：状态变化
- `completion_reason`：完成理由（强制完成时）
- `operator`：操作人
- `created_at`：操作时间

**序列化**：
- `quantity_increment`：优先使用模型字段，如果没有则通过计算 `quantity_after - quantity_before` 得到（兼容旧数据）

**显示**：
- ✅ 任务列表和施工单详情都支持展开查看操作历史
- ✅ 显示数量变化（包含增量值）、状态变化、操作人、操作时间

## 三、已完成的优化

### 3.1 工序匹配逻辑优化 ✅

- ✅ 创建了 `ProcessCodes` 常量类统一管理工序编码
- ✅ 所有业务逻辑统一使用编码匹配，不再使用名称匹配
- ✅ 前后端逻辑完全一致

### 3.2 任务更新逻辑优化 ✅

- ✅ 增加了业务条件验证（制版任务图稿确认、开料任务物料状态）
- ✅ 根据数量自动判断状态
- ✅ 记录操作历史（TaskLog）
- ✅ 支持多人协作（每次更新记录操作人）
- ✅ **统一使用增量更新**：前端传递 `quantity_increment`，后端累加（已优化）

### 3.3 任务完成逻辑优化 ✅

- ✅ 增加了业务条件验证
- ✅ 支持强制完成并填写完成理由
- ✅ 记录操作历史

## 四、当前存在的问题和不足

### 4.1 高优先级问题

#### 4.1.1 任务更新数量实现方式不一致 ✅ 已修复

**状态**：已优化完成（2025-01-28）

**修复内容**：
- ✅ 后端 `update_quantity` 接口改为接收 `quantity_increment` 并累加
- ✅ 前端 `Detail.vue` 和 `List.vue` 改为传递 `quantity_increment`
- ✅ `TaskLog` 模型添加 `quantity_increment` 字段
- ✅ 操作日志记录时保存 `quantity_increment` 值
- ✅ 数据库迁移：`0065_add_quantity_increment_to_tasklog.py`

#### 4.1.2 自动计算数量功能未实现 ⚠️

**问题描述**：
- `auto_calculate_quantity` 字段存在，但所有任务的该字段都设置为 `False`
- 系统没有实现根据关联对象状态自动计算完成数量的功能
- 例如：物料回料后，采购任务（如果存在）的完成数量应该自动更新

**影响**：
- 增加了用户操作负担
- 容易出现数量录入错误
- 不符合实际业务需求

**建议**：
- 实现物料状态更新时自动更新相关任务的完成数量
- 或在任务查询时自动计算并返回完成数量

#### 4.1.3 制版任务只检查图稿确认，未检查其他版型 ⚠️

**问题描述**：
- CTP工序会为图稿、刀模、烫金版、压凸版各生成 `plate_making` 任务
- 但验证逻辑只检查了图稿的确认状态（`artwork.confirmed`）
- 刀模、烫金版、压凸版的确认状态没有被检查

**可能的情况**：
1. 这些版型不需要确认（当前逻辑合理）
2. 这些版型需要确认但未实现（需要添加检查）

**建议**：
- 确认 Die、FoilingPlate、EmbossingPlate 模型是否有 `confirmed` 字段
- 如果有，添加确认状态检查
- 如果没有，在注释中明确说明这些版型不需要确认

### 4.2 中优先级问题

#### 4.2.1 任务类型与工序的对应关系不够清晰

**问题描述**：
- 任务生成逻辑基于工序编码，但任务类型的选择逻辑不够明确
- 例如：为什么制版、刀模、烫金版、压凸版都使用 `plate_making` 类型？

**建议**：
- 添加任务类型选择说明
- 或者为不同版型创建不同的任务类型（如 `plate_making_artwork`、`plate_making_die`）

#### 4.2.2 工序并行执行逻辑不完善

**问题描述**：
- `is_parallel` 字段已添加，但逻辑中仍使用编码判断作为补充
- 如果工序配置了 `is_parallel=True`，应该优先使用配置，而不需要编码判断

**当前实现**：
```python
if self.process.is_parallel or ProcessCodes.is_parallel(self.process.code):
    # 并行逻辑
```

**建议**：
- 优先使用 `is_parallel` 配置字段
- 只有在未配置时才使用编码判断

#### 4.2.3 任务完成数量与状态的关系处理不一致

**问题描述**：
- `update_quantity`：如果数量 >= 生产数量，自动设为 `completed`
- `complete`：强制设为 `completed`，即使数量不足
- 但如果数量不足，状态被强制设为 `completed`，后续如果数量更新为不足，状态会变回 `in_progress`

**建议**：
- 明确区分"正常完成"和"强制完成"
- 强制完成的任务，即使数量不足也不应自动变回 `in_progress`

### 4.3 低优先级问题

#### 4.3.1 任务取消功能未实现

**问题描述**：
- 任务状态包含 `cancelled`，但系统没有提供取消任务的功能

**建议**：
- 添加任务取消接口
- 取消任务时记录操作日志

#### 4.3.2 任务完成操作的权限控制缺失

**问题描述**：
- 任何有编辑权限的用户都可以完成任务
- 没有按角色或部门限制谁能完成哪些任务

**建议**：
- 增加任务完成操作的权限控制
- 可以按工序类型或部门限制操作权限

#### 4.3.3 工序完成时的数量汇总未实现

**问题描述**：
- 工序的 `quantity_completed` 和 `quantity_defective` 需要手动输入
- 没有自动从任务中汇总

**建议**：
- 在完成工序时，自动从任务中汇总完成数量和不良品数量
- 或提供"从任务汇总"按钮

## 五、代码质量评估

### 5.1 优点 ✅

1. **代码结构清晰**：使用 `ProcessCodes` 常量类统一管理工序编码
2. **业务验证完整**：制版任务和开料任务都有业务条件验证
3. **操作历史完善**：所有操作都记录到 TaskLog
4. **前后端一致**：前后端都使用编码匹配，逻辑一致

### 5.2 待改进 ⚠️

1. **增量更新实现不一致**：前端传递累计值而非增量值
2. **自动计算功能缺失**：`auto_calculate_quantity` 字段未真正实现
3. **文档与代码不一致**：部分文档描述与实际实现不符

## 六、后续优化建议

### 6.1 短期优化（1-2周）

1. ✅ **统一任务更新方式**：已完成
   - ✅ 统一使用增量更新（`quantity_increment`）
   - ✅ 前后端实现一致

2. **完善制版任务验证**：
   - 确认其他版型是否需要确认
   - 如需确认，添加验证逻辑

3. **实现自动计算数量功能**：
   - 物料状态更新时自动更新任务完成数量
   - 或在序列化器中实现自动计算

### 6.2 中期优化（1-2月）

1. **优化工序并行逻辑**：
   - 优先使用配置字段，减少编码判断

2. **添加任务取消功能**：
   - 实现任务取消接口
   - 添加权限控制

3. **完善任务类型管理**：
   - 明确任务类型与工序的对应关系
   - 或创建更细粒度的任务类型

### 6.3 长期优化（3-6月）

1. **权限管理系统**：
   - 按角色、部门限制任务操作权限

2. **质量检查流程**：
   - 添加任务完成前的质量检查环节

3. **审批流程**：
   - 关键任务（如制版）添加审批流程

## 七、相关文档

- [工序关联模块分析报告](./PROCESS_ASSOCIATION_ANALYSIS.md)
- [工序匹配逻辑优化总结](./PROCESS_OPTIMIZATION_SUMMARY.md)

