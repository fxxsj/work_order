# 施工单完整流程逻辑分析与优化建议

**分析时间**：2026-01-08  
**更新时间**：2026-01-09  
**分析范围**：施工单创建后的完整流程（审核、工序创建、任务创建、物料准备、工序交接、任务转移）  
**文档版本**：v1.1

> **重要说明**：本文档基于实际代码实现（`backend/workorder/models.py`、`backend/workorder/views.py`、`backend/workorder/signals.py` 等），全面分析施工单创建后的完整流程逻辑，指出不足和优化建议。
>
> **更新内容（v1.1）**：
> - ✅ 重新审核机制已实现（`request_reapproval` 接口）
> - ✅ 批量任务分派已实现（`batch_assign` 接口）
> - ✅ 工序级别批量任务重新分派已实现（`reassign_tasks` 接口）
> - ✅ 物料状态自动更新开料任务已实现（信号处理器）
> - ✅ 物料用量解析已改进（支持小数）
> - ⚠️ 部分建议已实现但需要进一步优化（如任务转移、工序交接的语义清晰度）

---

## 快速参考：已实现功能与待优化项

### ✅ 已实现的核心功能

| 功能模块 | 实现内容 | 接口/方法 | 状态 |
|---------|---------|-----------|------|
| **审核流程** | 审核通过/拒绝、审核历史、审核通知 | `approve`、`resubmit_for_approval` | ✅ 完整 |
| **重新审核** | 请求重新审核、重置状态、通知原审核人 | `request_reapproval` (v1.1新增) | ✅ 完整 |
| **工序管理** | 添加工序、开始工序、完成工序、工序日志 | `add_process`、`start`、`complete` | ✅ 完整 |
| **任务生成** | 按工序类型自动生成任务 | `generate_tasks` | ✅ 完整 |
| **任务分派** | 自动分派、单任务调整、批量分派、工序级别重新分派 | `assign`、`batch_assign`、`reassign_tasks` | ✅ 完整 |
| **物料管理** | 物料状态管理、状态更新、自动联动开料任务 | `WorkOrderMaterial` + 信号处理器 | ✅ 完整 |
| **通知系统** | 多种通知类型、通知标记已读、关联对象 | `Notification.create_notification` | ✅ 完整 |
| **任务拆分** | 任务拆分为子任务、数量汇总、状态同步 | `split`、`update_from_subtasks` | ✅ 完整 |

### 🟡 需要优化的功能

| 功能模块 | 当前状态 | 优化建议 | 优先级 |
|---------|---------|---------|--------|
| **审核前验证** | 基础验证（客户、产品、工序、版） | 添加物料验证、数量验证、日期验证、工序顺序验证 | 🔴 高 |
| **工序开始条件** | 并行工序、前置工序检查 | 添加物料准备检查、版型确认检查、资源可用性检查 | 🔴 高 |
| **任务转移语义** | 使用 `assign` 接口实现 | 区分"新分派"、"调整分派"、"转移"的语义 | 🟡 中 |
| **任务转移通知** | 通知新操作员 | 增加通知原操作员、通知生产主管 | 🟡 中 |
| **工序交接** | 通过 `reassign_tasks` 实现 | 添加专门的工序交接接口、交接验证、交接通知 | 🟡 中 |
| **物料准备提醒** | 无提醒机制 | 实现物料准备提醒、物料准备计划、进度跟踪 | 🟡 中 |
| **物料状态验证** | 无状态流转验证 | 添加状态流转顺序验证、状态回退验证 | 🟡 中 |

### 🟢 长期优化方向

| 功能模块 | 优化方向 | 说明 |
|---------|---------|------|
| **任务分派智能性** | 操作员技能标签、任务复杂度评估、工作负载均衡 | 提升分派效率和合理性 |
| **物料用量解析** | 支持多种格式、单位转换、复合用量 | 提升数据准确性 |
| **审核通知机制** | 通知其他相关人员、审核超时提醒 | 提升沟通效率 |
| **工序顺序智能** | 根据工序依赖关系自动排序 | 减少用户操作 |

---

---

## 目录

- [一、流程概览](#一流程概览)
- [二、审核流程分析](#二审核流程分析)
- [三、工序创建与管理流程分析](#三工序创建与管理流程分析)
- [四、任务创建与分派流程分析](#四任务创建与分派流程分析)
- [五、物料准备流程分析](#五物料准备流程分析)
- [六、工序交接流程分析](#六工序交接流程分析)
- [七、任务转移流程分析](#七任务转移流程分析)
- [八、流程问题总结与优化建议](#八流程问题总结与优化建议)

---

## 一、流程概览

### 1.1 完整流程图

```
创建施工单（填写基本信息、选择产品、工序、版、物料）
    ↓
提交审核（approval_status='pending'）
    ↓
业务员审核
    ├─ 审核通过 → status='in_progress' → 可以开始生产
    │   ├─ 需要修改？→ 请求重新审核（request_reapproval）→ 重新提交
    │   └─ 直接开始生产
    └─ 审核拒绝 → 可修改后重新提交（resubmit_for_approval）
    ↓
开始工序（WorkOrderProcessViewSet.start）
    ├─ 检查前置条件（can_start）- 并行工序/前置工序完成
    ├─ 生成任务（generate_tasks）
    ├─ 自动分派任务（_auto_assign_task）
    │   ├─ 支持任务分派规则配置
    │   └─ 支持多种操作员选择策略
    └─ 状态变为 in_progress
    ↓
物料准备（WorkOrderMaterial 状态管理）
    ├─ pending（待采购）
    ├─ ordered（已下单）
    ├─ received（已回料）
    ├─ cut（已开料）→ 自动更新开料任务（信号处理器）
    └─ completed（已完成）
    ↓
任务执行（WorkOrderTaskViewSet.update_quantity）
    ├─ 支持单任务分派调整（assign）
    ├─ 支持批量任务分派（batch_assign）
    ├─ 支持工序级别批量重新分派（reassign_tasks）
    ├─ 更新完成数量
    ├─ 自动判断任务完成
    └─ 自动判断工序完成
    ↓
工序完成（check_and_update_status）
    ├─ 检查所有任务完成
    ├─ 验证业务条件（版确认、物料状态）
    └─ 自动判断施工单完成
    ↓
施工单完成（所有工序完成）
```

### 1.2 关键环节（已实现功能）

1. **审核环节**：
   - ✅ 业务员审核，验证数据完整性
   - ✅ 审核通过/拒绝通知
   - ✅ 审核拒绝后可重新提交
   - ✅ 审核通过后可请求重新审核

2. **工序创建**：
   - ✅ 创建时自动添加（产品默认工序）
   - ✅ 手动添加工序
   - ✅ 支持工序顺序调整
   - ✅ 审核后通过重新审核可修改

3. **任务创建与分派**：
   - ✅ 工序开始时自动生成任务
   - ✅ 支持任务分派规则配置
   - ✅ 支持多种操作员选择策略
   - ✅ 支持单任务分派调整
   - ✅ 支持批量任务分派
   - ✅ 支持工序级别批量重新分派

4. **物料准备**：
   - ✅ 物料状态管理
   - ✅ 物料状态自动更新开料任务
   - ✅ 支持状态日期记录

5. **工序交接**：
   - 🟡 通过任务分派调整实现（`reassign_tasks`）
   - 🟡 支持批量交接工序的所有任务
   - ⚠️ 缺少专门的工序交接接口

6. **任务转移**：
   - 🟡 通过任务分派调整实现（`assign`、`batch_assign`）
   - ✅ 支持记录转移原因
   - 🟡 支持通知新操作员
   - ⚠️ 缺少通知原操作员

---

## 二、审核流程分析

### 2.1 当前实现逻辑

#### 2.1.1 审核触发条件

**代码位置**：`backend/workorder/views.py:331-425`

**实现逻辑**：
```python
def approve(self, request, pk=None):
    # 1. 检查用户是否为业务员
    if not request.user.groups.filter(name='业务员').exists():
        return Response({'error': '只有业务员可以审核施工单'})
    
    # 2. 检查业务员是否负责该施工单的客户
    if work_order.customer.salesperson != request.user:
        return Response({'error': '只能审核自己负责的施工单'})
    
    # 3. 检查当前审核状态（只有待审核的施工单才能审核）
    if work_order.approval_status != 'pending':
        return Response({'error': '该施工单已经审核过了'})
    
    # 4. 审核前数据完整性检查
    validation_errors = work_order.validate_before_approval()
    if validation_errors:
        return Response({'error': '施工单数据不完整', 'details': validation_errors})
    
    # 5. 审核通过/拒绝处理
    if approval_status == 'approved':
        work_order.status = 'in_progress'  # 自动变更状态
        # 创建通知
    else:
        # 审核拒绝，要求填写拒绝原因
```

**审核前验证**（`validate_before_approval`）：
- ✅ 检查客户信息
- ✅ 检查产品信息
- ✅ 检查工序信息
- ✅ 检查交货日期
- ✅ 检查工序与版的选择匹配（必选项检查）

#### 2.1.2 审核后行为

**审核通过**：
- ✅ 自动变更施工单状态为 `in_progress`
- ✅ 记录审核历史（`WorkOrderApprovalLog`）
- ✅ 创建通知（通知创建人）
- ✅ 核心字段保护（`APPROVED_ORDER_PROTECTED_FIELDS`）

**审核拒绝**：
- ✅ 强制要求填写拒绝原因
- ✅ 记录审核历史
- ✅ 创建通知
- ✅ 可以重新提交审核（`resubmit_for_approval`）

### 2.2 存在的问题 ⚠️

#### 问题1：审核后无法修改核心字段，但缺少重新审核机制 ✅ **已解决**

**问题描述**：
- 审核通过后，核心字段（客户、产品、工序、版）被保护，无法修改
- 如果发现错误需要修改，需要"重新审核"机制

**影响**：
- 如果审核通过后发现错误，需要请求重新审核
- 重新审核后业务员需要再次审核

**当前实现状态**：✅ **已实现**
- ✅ 已实现 `request_reapproval` 接口（`views.py:459-516`）
- ✅ 支持重置审核状态为 `pending`
- ✅ 支持重置施工单状态为 `pending`
- ✅ 创建通知通知原审核人
- ✅ 记录请求原因（可选但建议填写）

**使用场景**：
- 审核通过后发现需要修改核心字段（产品、工序、版等）
- 审核通过后发现需要添加工序
- 审核通过后发现数据错误需要修正

**流程**：
```
1. 创建人或制表人调用 request_reapproval 接口
2. 系统检查权限（只有创建人或制表人可以请求）
3. 系统检查状态（只有已审核通过的施工单可以请求）
4. 重置审核状态为 pending
5. 重置施工单状态为 pending（如果已开始）
6. 创建通知通知原审核人
7. 修改施工单内容
8. 重新提交审核
```

#### 问题2：审核前验证不够全面 ⚠️

**当前验证**：
- ✅ 客户、产品、工序、交货日期
- ✅ 工序与版的选择匹配

**缺少的验证**：
- ⚠️ **物料验证**：没有检查物料信息是否完整（如需要开料的物料是否填写了用量）
- ⚠️ **数量验证**：没有检查生产数量是否合理（如是否大于0）
- ⚠️ **日期验证**：没有检查交货日期是否在未来（可能允许选择过去的日期）
- ⚠️ **工序顺序验证**：没有检查工序顺序是否合理（如制版应该在印刷之前）

#### 问题3：审核通知机制不够完善 ⚠️

**当前实现**：
- ✅ 审核通过/拒绝时创建通知
- ✅ 通知施工单创建人

**缺少的功能**：
- ⚠️ 没有通知其他相关人员（如生产主管、制表人等）
- ⚠️ 没有审核提醒机制（如待审核施工单数量提醒）
- ⚠️ 没有审核超时提醒（如施工单提交审核后长时间未审核）

### 2.3 优化建议

#### ~~建议1：添加重新审核机制 ✅ **已实现**~~

**实现状态**：✅ **已完成**（`views.py:459-516`）

**实现功能**：
- 支持重置审核状态为 `pending`
- 支持重置施工单状态为 `pending`
- 创建通知通知原审核人
- 记录请求原因

#### 建议2：增强审核前验证 🟡 **中优先级**

**需要添加的验证**：
1. **物料验证**：
   - 如果工序需要物料，检查物料信息是否完整
   - 如果物料需要开料，检查是否填写了用量

2. **数量验证**：
   - 生产数量必须大于0
   - 产品数量总和必须大于0

3. **日期验证**：
   - 交货日期不能早于下单日期
   - 交货日期建议在未来（可以允许今天）

4. **工序顺序验证**：
   - 制版工序应该在印刷工序之前
   - 开料工序应该在需要物料的工序之前

**优先级**：🟡 **中** - 提升数据质量

#### 建议3：完善审核通知机制 🟢 **低优先级**

**需要添加的功能**：
1. 通知生产主管（如果已指定）
2. 通知制表人
3. 审核超时提醒（如提交审核后24小时未审核）

**优先级**：🟢 **低** - 功能增强

---

## 三、工序创建与管理流程分析

### 3.1 当前实现逻辑

#### 3.1.1 工序创建时机

**代码位置**：`backend/workorder/views.py:226-310`

**创建方式**：
1. **创建施工单时自动添加**：
   - 通过 `Product.default_processes` 自动加载产品默认工序
   - 在序列化器的 `create` 方法中处理

2. **手动添加工序**：
   - 接口：`POST /api/workorders/{id}/add_process/`
   - 可以指定 `sequence`（工序顺序）
   - 自动调整 `sequence` 避免冲突

**实现逻辑**：
```python
@action(detail=True, methods=['post'])
def add_process(self, request, pk=None):
    # 1. 检查是否已存在相同 sequence 的工序
    # 2. 如果存在，自动调整 sequence 为下一个可用的值
    # 3. 检查是否已经存在相同的工序（同一个施工单和同一个工序）
    # 4. 创建 WorkOrderProcess
```

#### 3.1.2 工序开始逻辑

**代码位置**：`backend/workorder/views.py:689-732`、`backend/workorder/models.py:839-876`

**开始条件**（`can_start()`）：
```python
def can_start(self):
    # 1. 并行工序可以立即开始
    if self.process.is_parallel or ProcessCodes.is_parallel(self.process.code):
        return True
    
    # 2. 非并行工序需要前一个工序完成
    # 获取所有非并行工序，按 sequence 排序
    # 检查前一个非并行工序是否完成
    previous_process = non_parallel_processes[current_idx - 1]
    return previous_process.status == 'completed'
```

**开始流程**：
1. 检查是否可以开始（`can_start()`）
2. 检查状态（只有 `pending` 状态才能开始）
3. 生成任务（`generate_tasks()`）
4. 更新工序状态为 `in_progress`
5. 记录开始时间（`actual_start_time`）
6. 记录日志（`ProcessLog`）

#### 3.1.3 工序完成逻辑

**代码位置**：`backend/workorder/models.py:878-977`

**完成判断**（`check_and_update_status()`）：
```python
def check_and_update_status(self):
    # 1. 检查是否有任务
    # 2. 检查所有任务是否完成（status='completed'）
    # 3. 检查任务数量是否满足（quantity_completed >= production_quantity）
    # 4. 业务条件检查：
    #    - 制版任务：版型必须已确认
    #    - 开料任务：物料必须已开料
    # 5. 汇总任务完成数量和不良品数量
    # 6. 更新工序状态为 completed
    # 7. 检查施工单是否完成（所有工序完成）
```

### 3.2 存在的问题 ⚠️

#### 问题1：工序创建时机不够灵活 ⚠️

**当前实现**：
- ✅ 创建施工单时可以添加
- ✅ 审核前可以添加
- ⚠️ **审核后无法添加**：审核通过后核心字段被保护，无法添加工序

**影响**：
- 如果审核通过后发现需要增加工序，无法直接添加
- 需要先拒绝审核，添加工序，再重新提交

**场景示例**：
- 审核通过后发现需要增加"覆膜"工序
- 当前无法直接添加，需要拒绝审核 → 添加工序 → 重新提交

#### 问题2：工序顺序管理不够智能 ⚠️

**当前实现**：
- ✅ 支持手动指定 `sequence`
- ✅ 自动调整冲突的 `sequence`
- ⚠️ **没有智能推荐顺序**：根据工序类型自动推荐合理的顺序

**缺少的功能**：
- ⚠️ 没有根据工序依赖关系自动排序
- ⚠️ 没有检查工序顺序是否合理（如制版应该在印刷之前）
- ⚠️ 没有提供工序顺序优化建议

#### 问题3：工序开始条件检查不够全面 ⚠️

**当前检查**：
- ✅ 并行工序判断
- ✅ 前置工序完成检查

**缺少的检查**：
- ⚠️ **物料准备检查**：如果工序需要物料，没有检查物料是否已准备（如已回料或已开料）
- ⚠️ **版型准备检查**：如果工序需要版型，没有检查版型是否已确认
- ⚠️ **资源可用性检查**：没有检查部门是否有能力处理该工序

**示例场景**：
- 印刷工序需要图稿已确认，但开始工序时没有检查
- 开料工序需要物料已回料，但开始工序时没有检查

#### 问题4：工序交接机制不明确 ⚠️

**当前实现**：
- ✅ 工序有 `department` 字段（工序级别的部门）
- ✅ 任务有 `assigned_department` 字段（任务级别的部门）
- ⚠️ **没有明确的工序交接流程**：工序在不同部门之间如何交接不明确

**缺少的功能**：
- ⚠️ 没有工序交接接口（如从A部门交接给B部门）
- ⚠️ 没有交接记录（谁交接给谁，什么时候交接）
- ⚠️ 没有交接验证（如检查前置条件是否满足）

### 3.3 优化建议

#### 建议1：允许审核后添加工序（需重新审核）🟡 **中优先级**

**实现方案**：
```python
@action(detail=True, methods=['post'])
def add_process_after_approval(self, request, pk=None):
    """审核后添加工序（需要重新审核）"""
    work_order = self.get_object()
    
    # 检查状态：只有已审核通过的施工单可以添加
    if work_order.approval_status != 'approved':
        return Response({'error': '只有已审核通过的施工单可以添加工序'})
    
    # 添加工序
    # ... 添加工序逻辑 ...
    
    # 重置审核状态（需要重新审核）
    work_order.approval_status = 'pending'
    work_order.status = 'pending'
    work_order.save()
    
    # 创建通知（通知原审核人）
    Notification.create_notification(
        recipient=work_order.approved_by,
        notification_type='reapproval_required',
        title=f'施工单 {work_order.order_number} 需要重新审核',
        content=f'施工单 {work_order.order_number} 已添加工序，需要重新审核',
        work_order=work_order
    )
```

**优先级**：🟡 **中** - 提升流程灵活性

#### 建议2：增强工序开始条件检查 🟡 **中优先级**

**需要添加的检查**：
1. **物料准备检查**：
   - 如果工序需要物料，检查物料是否已回料或已开料
   - 如果物料未准备，提示用户

2. **版型准备检查**：
   - 如果工序需要版型，检查版型是否已确认
   - 如果版型未确认，提示用户

3. **资源可用性检查**：
   - 检查分派部门是否有能力处理该工序
   - 检查是否有可用操作员

**实现示例**：
```python
def can_start(self):
    """判断工序是否可以开始（增强版）"""
    # 1. 基础检查（并行、前置工序）
    if not self._check_basic_start_conditions():
        return False
    
    # 2. 物料准备检查
    if not self._check_material_ready():
        return False
    
    # 3. 版型准备检查
    if not self._check_plates_confirmed():
        return False
    
    return True
```

**优先级**：🟡 **中** - 提升流程可靠性

#### 建议3：实现工序交接机制 🟡 **中优先级**

**实现方案**：
```python
@action(detail=True, methods=['post'])
def handover(self, request, pk=None):
    """工序交接（从一个部门交接给另一个部门）"""
    work_order_process = self.get_object()
    
    # 1. 检查状态：只有进行中的工序可以交接
    if work_order_process.status != 'in_progress':
        return Response({'error': '只有进行中的工序可以交接'})
    
    # 2. 获取交接信息
    target_department_id = request.data.get('target_department')
    handover_reason = request.data.get('reason', '')
    notes = request.data.get('notes', '')
    
    # 3. 验证目标部门
    target_department = Department.objects.get(id=target_department_id)
    
    # 4. 交接工序和任务
    old_department = work_order_process.department
    work_order_process.department = target_department
    
    # 批量交接任务
    for task in work_order_process.tasks.all():
        task.assigned_department = target_department
        task.assigned_operator = None  # 清空操作员，由新部门重新分派
        task.save()
    
    work_order_process.save()
    
    # 5. 记录交接日志
    ProcessLog.objects.create(
        work_order_process=work_order_process,
        log_type='handover',
        content=f'工序交接：{old_department.name} → {target_department.name}，原因：{handover_reason}',
        operator=request.user
    )
    
    # 6. 创建通知（通知新部门）
    # ...
```

**优先级**：🟡 **中** - 功能增强

---

## 四、任务创建与分派流程分析

### 4.1 当前实现逻辑

#### 4.1.1 任务自动生成

**代码位置**：`backend/workorder/models.py:1108-1300`

**生成时机**：
- 工序状态变为 `in_progress` 时自动调用 `generate_tasks()`
- 如果工序已有任务，不会重复生成

**生成规则**（基于工序编码）：
| 工序编码 | 生成规则 | 生产数量 | 自动计算 |
|---------|---------|---------|---------|
| CTP | 为图稿/刀模/烫金版/压凸版各生成1个任务 | 1 | ✅ |
| CUT | 为需要开料的物料各生成1个任务 | 物料用量 | ✅ |
| PRT | 为每个图稿生成1个任务 | 施工单数量 | ❌ |
| FOIL_G | 为每个烫金版生成1个任务 | 施工单数量 | ❌ |
| EMB | 为每个压凸版生成1个任务 | 施工单数量 | ❌ |
| DIE | 为每个刀模生成1个任务 | 施工单数量 | ❌ |
| PACK | 为每个产品生成1个任务 | 产品数量 | ❌ |
| 其他 | 生成1个通用任务 | 施工单数量 | ❌ |

#### 4.1.2 任务自动分派

**代码位置**：`backend/workorder/models.py:979-1106`

**分派规则**（优先级从高到低）：
1. **工序级别分派**：如果工序已指定部门/操作员，直接使用
2. **任务分派规则**：使用 `TaskAssignmentRule` 配置
3. **部门匹配**：根据 `Department.processes` 关联关系
4. **智能匹配**：
   - 优先匹配专业车间（如 DIE → die_cutting）
   - 排除外协车间
   - 最后选择父部门

**操作员选择策略**：
- `least_tasks`：选择任务数量最少的操作员
- `random`：随机选择
- `round_robin`：轮询选择
- `first_available`：选择第一个可用操作员

#### 4.1.3 任务手动分派

**代码位置**：`backend/workorder/views.py:1635-1716`

**分派接口**：`POST /api/workorder-tasks/{id}/assign/`

**功能**：
- ✅ 支持更新任务的分派部门和操作员
- ✅ 支持清空分派（传递 `null` 值）
- ✅ 记录分派调整日志（包含调整原因和备注）
- ✅ 创建分派通知

**批量分派接口**：`POST /api/workorder-tasks/batch_assign/`
- ✅ 支持批量分派多个任务
- ✅ 支持统一设置部门和操作员

### 4.2 存在的问题 ⚠️

#### 问题1：任务生成时机不够灵活 ⚠️

**当前实现**：
- ✅ 工序开始时自动生成
- ⚠️ **无法提前生成**：如果需要在审核通过后提前准备，无法提前生成任务
- ⚠️ **无法手动生成**：如果自动生成失败或需要调整，无法手动重新生成

**影响**：
- 无法提前查看任务列表和分派情况
- 如果生成失败，需要重新开始工序

#### 问题2：任务分派规则不够智能 ⚠️

**当前实现**：
- ✅ 支持任务分派规则配置
- ✅ 支持多种操作员选择策略
- ⚠️ **没有考虑任务优先级**：紧急任务应该优先分派给经验丰富的操作员
- ⚠️ **没有考虑操作员技能**：没有操作员技能标签，无法根据任务类型匹配技能
- ⚠️ **没有考虑工作负载均衡**：只考虑任务数量，没有考虑任务复杂度

**缺少的功能**：
- ⚠️ 操作员技能标签（如：擅长印刷、擅长模切）
- ⚠️ 任务复杂度评估
- ⚠️ 工作负载均衡算法（考虑任务数量和复杂度）

#### 问题3：任务分派后缺少验证 ⚠️

**当前实现**：
- ✅ 记录分派日志
- ✅ 创建分派通知
- ⚠️ **没有验证操作员是否可用**：没有检查操作员是否在职、是否请假
- ⚠️ **没有验证部门是否有能力**：没有检查部门是否有设备、人员

**缺少的验证**：
- ⚠️ 操作员状态检查（在职、请假、离职）
- ⚠️ 部门能力检查（设备、人员、产能）
- ⚠️ 任务冲突检查（操作员是否有时间）

#### 问题4：任务转移机制不够完善 ⚠️

**当前实现**：
- ✅ 支持任务分派调整（`assign` 接口）
- ✅ 支持批量调整（`batch_assign` 接口）
- ⚠️ **没有任务转移接口**：没有专门的任务转移接口，只能通过分派调整实现
- ⚠️ **没有转移验证**：没有检查转移是否合理（如任务是否已开始、是否会影响进度）

**缺少的功能**：
- ⚠️ 任务转移接口（明确标识为"转移"而非"调整"）
- ⚠️ 转移验证（检查任务状态、进度、影响）
- ⚠️ 转移通知（通知原操作员和新操作员）

### 4.3 优化建议

#### 建议1：支持提前生成任务 🟡 **中优先级**

**实现方案**：
```python
@action(detail=True, methods=['post'])
def generate_tasks_preview(self, request, pk=None):
    """预览任务生成（不实际生成，只返回任务列表）"""
    work_order_process = self.get_object()
    
    # 模拟生成任务，但不保存
    tasks_preview = []
    # ... 生成逻辑 ...
    
    return Response({'tasks': tasks_preview})

@action(detail=True, methods=['post'])
def regenerate_tasks(self, request, pk=None):
    """重新生成任务（如果任务生成失败或需要调整）"""
    work_order_process = self.get_object()
    
    # 检查状态：只有 pending 或 in_progress 的工序可以重新生成
    if work_order_process.status not in ['pending', 'in_progress']:
        return Response({'error': '只有待开始或进行中的工序可以重新生成任务'})
    
    # 删除现有任务（可选，或合并）
    # 重新生成任务
    work_order_process.generate_tasks()
```

**优先级**：🟡 **中** - 功能增强

#### 建议2：增强任务分派智能性 🟢 **低优先级**

**需要添加的功能**：
1. **操作员技能标签**：
   - 为操作员添加技能标签（如：印刷、模切、包装）
   - 根据任务类型匹配操作员技能

2. **任务复杂度评估**：
   - 根据任务类型、数量、难度评估复杂度
   - 在分派时考虑复杂度

3. **工作负载均衡**：
   - 考虑任务数量和复杂度
   - 考虑操作员当前工作负载
   - 智能分配任务

**优先级**：🟢 **低** - 长期优化

#### 建议3：添加任务转移接口 🟡 **中优先级**

**实现方案**：
```python
@action(detail=True, methods=['post'])
def transfer(self, request, pk=None):
    """任务转移（从一个操作员转移给另一个操作员）"""
    task = self.get_object()
    
    # 1. 检查任务状态：只有 pending 或 in_progress 的任务可以转移
    if task.status not in ['pending', 'in_progress']:
        return Response({'error': '只有待开始或进行中的任务可以转移'})
    
    # 2. 获取转移信息
    target_operator_id = request.data.get('target_operator')
    target_department_id = request.data.get('target_department')
    transfer_reason = request.data.get('reason', '')
    
    # 3. 验证目标操作员和部门
    # ...
    
    # 4. 记录转移前状态
    old_operator = task.assigned_operator
    old_department = task.assigned_department
    
    # 5. 执行转移
    task.assigned_operator = target_operator
    task.assigned_department = target_department
    task.save()
    
    # 6. 记录转移日志
    TaskLog.objects.create(
        task=task,
        log_type='status_change',
        content=f'任务转移：{old_operator} → {target_operator}，原因：{transfer_reason}',
        operator=request.user
    )
    
    # 7. 创建通知（通知原操作员和新操作员）
    # ...
```

**优先级**：🟡 **中** - 功能增强

---

## 五、物料准备流程分析

### 5.1 当前实现逻辑

#### 5.1.1 物料状态管理

**代码位置**：`backend/workorder/models.py:1346-1383`

**物料状态**：
- `pending`：待采购
- `ordered`：已下单
- `received`：已回料
- `cut`：已开料
- `completed`：已完成

**状态流转**：
```
pending → ordered → received → cut → completed
```

**状态更新**：
- 前端通过对话框更新物料状态
- 支持设置采购日期、回料日期、开料日期

#### 5.1.2 物料与开料任务联动

**代码位置**：`backend/workorder/signals.py:30-89`

**自动联动逻辑**：
```python
@receiver(post_save, sender=WorkOrderMaterial)
def update_cutting_task_on_material_status_change(sender, instance, created, **kwargs):
    # 1. 检查物料状态是否为'cut'（已开料）
    if instance.purchase_status == 'cut':
        # 2. 查找关联的开料任务
        cutting_tasks = WorkOrderTask.objects.filter(
            task_type='cutting',
            material=instance.material,
            work_order_process__work_order=instance.work_order,
            auto_calculate_quantity=True,
            status__in=['pending', 'in_progress']
        )
        
        # 3. 更新任务完成数量
        for task in cutting_tasks:
            quantity = _parse_material_usage(instance.material_usage)
            task.quantity_completed = quantity
            if quantity >= task.production_quantity:
                task.status = 'completed'
            task.save()
            
            # 4. 检查工序是否完成
            task.work_order_process.check_and_update_status()
```

### 5.2 存在的问题 ⚠️

#### 问题1：物料准备流程不够清晰 ⚠️

**当前实现**：
- ✅ 物料状态管理
- ✅ 状态更新接口
- ⚠️ **没有物料准备提醒**：没有提醒哪些物料需要准备
- ⚠️ **没有物料准备计划**：没有根据工序开始时间提前提醒物料准备

**缺少的功能**：
- ⚠️ 物料准备提醒（如：印刷工序需要物料，提前提醒采购）
- ⚠️ 物料准备计划（根据工序计划开始时间，提前提醒）
- ⚠️ 物料准备进度跟踪（显示物料准备进度）

#### 问题2：物料状态验证不够严格 ⚠️

**当前实现**：
- ✅ 支持状态更新
- ⚠️ **没有状态流转验证**：可以跳过状态（如从 pending 直接到 cut）
- ⚠️ **没有状态回退验证**：可以从 cut 回退到 received，可能不合理

**缺少的验证**：
- ⚠️ 状态流转顺序验证（如：不能从 pending 直接到 cut）
- ⚠️ 状态回退验证（如：已开料的物料不应该回退到已回料）

#### 问题3：物料与工序关联不够明确 ⚠️

**当前实现**：
- ✅ 物料关联到施工单
- ✅ 开料任务关联到物料
- ⚠️ **没有物料与工序的明确关联**：不知道哪些工序需要哪些物料

**缺少的功能**：
- ⚠️ 工序物料需求清单（显示每个工序需要哪些物料）
- ⚠️ 物料准备状态检查（开始工序前检查物料是否已准备）

#### 问题4：物料用量解析不够智能 ✅ **部分解决**

**当前实现**（`models.py:1302-1315`，`signals.py:282-292`）：
```python
def _parse_material_usage(usage_str):
    """解析物料用量字符串，提取数字部分"""
    if not usage_str:
        return 0

    import re
    # 尝试提取数字（支持整数和小数）
    numbers = re.findall(r'\d+\.?\d*', usage_str)
    if numbers:
        try:
            return int(float(numbers[0]))
        except (ValueError, IndexError):
            return 0
    return 0
```

**改进点**：
- ✅ 支持整数和小数
- ✅ 更好的错误处理

**问题**：
- ⚠️ 只提取第一个数字，可能不准确（如："1000张，50平方米" 只提取 1000）
- ⚠️ 没有单位转换（如：平方米转平方米）
- ⚠️ 没有验证用量是否合理

### 5.3 优化建议

#### 建议1：实现物料准备提醒机制 🟡 **中优先级**

**实现方案**：
```python
def check_material_preparation(self):
    """检查物料准备情况，返回需要准备的物料列表"""
    materials_to_prepare = []
    
    # 遍历所有工序
    for process in self.order_processes.all():
        # 检查工序是否需要物料
        if process.process.code == 'PRT':  # 印刷工序需要物料
            for material in self.materials.all():
                if material.purchase_status in ['pending', 'ordered']:
                    materials_to_prepare.append({
                        'material': material,
                        'process': process,
                        'status': material.purchase_status,
                        'urgency': 'high' if process.status == 'in_progress' else 'normal'
                    })
    
    return materials_to_prepare
```

**优先级**：🟡 **中** - 提升流程效率

#### 建议2：增强物料状态验证 🟡 **中优先级**

**实现方案**：
```python
def validate_status_transition(self, old_status, new_status):
    """验证物料状态流转是否合理"""
    valid_transitions = {
        'pending': ['ordered', 'received'],
        'ordered': ['received', 'pending'],  # 允许取消订单
        'received': ['cut', 'ordered'],  # 允许退回
        'cut': ['completed'],  # 已开料后只能完成
        'completed': []  # 已完成不能变更
    }
    
    if new_status not in valid_transitions.get(old_status, []):
        return False, f'不能从 {old_status} 直接变更为 {new_status}'
    
    return True, None
```

**优先级**：🟡 **中** - 提升数据质量

#### 建议3：改进物料用量解析 🟢 **低优先级**

**实现方案**：
- 支持多种格式（如："1000张"、"50平方米"）
- 支持单位转换
- 支持复合用量（如："1000张，50平方米"）

**优先级**：🟢 **低** - 功能增强

---

## 六、工序交接流程分析

### 6.1 当前实现逻辑

#### 6.1.1 工序交接方式

**当前实现**：
- ⚠️ **没有明确的工序交接接口**
- ✅ 通过工序 `department` 字段实现部门分配
- ✅ 通过任务 `assigned_department` 字段实现任务分派
- ✅ 通过批量调整任务分派（`reassign_tasks`）实现批量交接

**实际交接方式**：
1. **工序级别交接**：修改 `WorkOrderProcess.department`
2. **任务级别交接**：批量调整任务的 `assigned_department`
3. **混合方式**：同时调整工序和任务的分派

#### 6.1.2 工序交接记录

**当前实现**：
- ✅ 有 `ProcessLog` 记录工序操作日志
- ⚠️ **没有专门的交接日志类型**：交接操作记录为普通日志
- ⚠️ **交接信息不够详细**：没有记录交接原因、交接时间、交接人等详细信息

### 6.2 存在的问题 ⚠️

#### 问题1：缺少明确的工序交接机制 ⚠️

**问题描述**：
- ⚠️ 没有专门的工序交接接口
- ⚠️ 交接流程不明确（如何交接、谁可以交接、交接条件是什么）
- ⚠️ 交接后责任不明确（原部门和新部门的责任划分）

**影响**：
- 工序交接操作不规范
- 交接记录不完整
- 交接后可能出现责任不清的情况

#### 问题2：工序交接验证不足 ⚠️

**当前实现**：
- ✅ 支持修改工序部门
- ⚠️ **没有验证交接是否合理**：
  - 没有检查工序状态（如已完成工序不应该交接）
  - 没有检查任务状态（如有任务正在进行中，交接是否合理）
  - 没有检查目标部门是否有能力

**缺少的验证**：
- ⚠️ 工序状态验证（只有进行中的工序可以交接）
- ⚠️ 任务状态验证（如有任务已完成，交接是否合理）
- ⚠️ 目标部门能力验证

#### 问题3：工序交接通知不完善 ⚠️

**当前实现**：
- ✅ 有任务分派通知
- ⚠️ **没有工序交接通知**：交接后没有通知相关人员

**缺少的通知**：
- ⚠️ 通知原部门（工序已交接）
- ⚠️ 通知新部门（接收新工序）
- ⚠️ 通知施工单创建人

### 6.3 优化建议

#### 建议1：实现明确的工序交接接口 🟡 **中优先级**

**实现方案**：
```python
@action(detail=True, methods=['post'])
def handover(self, request, pk=None):
    """工序交接（从一个部门交接给另一个部门）"""
    work_order_process = self.get_object()
    
    # 1. 检查状态：只有进行中的工序可以交接
    if work_order_process.status != 'in_progress':
        return Response({'error': '只有进行中的工序可以交接'})
    
    # 2. 获取交接信息
    target_department_id = request.data.get('target_department')
    handover_reason = request.data.get('reason', '')  # 必填
    notes = request.data.get('notes', '')
    
    if not handover_reason:
        return Response({'error': '请填写交接原因'})
    
    # 3. 验证目标部门
    target_department = Department.objects.get(id=target_department_id)
    
    # 4. 验证目标部门是否有能力（可选）
    if not target_department.processes.filter(id=work_order_process.process_id).exists():
        return Response({'error': '目标部门不负责该工序类型'})
    
    # 5. 记录交接前状态
    old_department = work_order_process.department
    old_operator = work_order_process.operator
    
    # 6. 交接工序
    work_order_process.department = target_department
    work_order_process.operator = None  # 清空操作员，由新部门重新分派
    work_order_process.save()
    
    # 7. 批量交接任务（可选：是否同时交接任务）
    transfer_tasks = request.data.get('transfer_tasks', True)
    if transfer_tasks:
        for task in work_order_process.tasks.all():
            if task.status in ['pending', 'in_progress']:
                task.assigned_department = target_department
                task.assigned_operator = None  # 清空操作员
                task.save()
    
    # 8. 记录交接日志
    ProcessLog.objects.create(
        work_order_process=work_order_process,
        log_type='handover',
        content=f'工序交接：{old_department.name if old_department else "未分配"} → {target_department.name}，原因：{handover_reason}',
        operator=request.user
    )
    
    # 9. 创建通知
    # 通知原部门
    if old_department:
        # 通知原部门的生产主管
        # ...
    
    # 通知新部门
    # 通知新部门的生产主管
    # ...
    
    # 通知施工单创建人
    Notification.create_notification(
        recipient=work_order_process.work_order.created_by,
        notification_type='process_handover',
        title=f'工序交接：{work_order_process.process.name}',
        content=f'施工单 {work_order_process.work_order.order_number} 的工序"{work_order_process.process.name}"已从{old_department.name if old_department else "未分配"}交接给{target_department.name}',
        work_order=work_order_process.work_order,
        work_order_process=work_order_process
    )
```

**优先级**：🟡 **中** - 功能增强

#### 建议2：增强工序交接验证 🟡 **中优先级**

**需要添加的验证**：
1. 工序状态验证（只有进行中的工序可以交接）
2. 任务状态验证（如有任务已完成，提示用户）
3. 目标部门能力验证（检查部门是否负责该工序类型）
4. 权限验证（只有生产主管或管理员可以交接）

**优先级**：🟡 **中** - 提升流程可靠性

---

## 七、任务转移流程分析

### 7.1 当前实现逻辑

#### 7.1.1 任务分派调整（单任务）

**代码位置**：`backend/workorder/views.py:1721-1810`

**调整接口**：`POST /api/workorder-tasks/{id}/assign/`

**功能**：
- ✅ 支持更新任务的分派部门和操作员
- ✅ 支持清空分派
- ✅ 记录调整日志（包含调整原因和备注）
- ✅ 创建分派通知（通知新操作员）

**使用场景**：
- 自动分派后需要调整
- 任务需要转移给其他操作员
- 任务需要转移给其他部门

#### 7.1.2 批量任务分派

**代码位置**：`backend/workorder/views.py:2349-2479`

**批量分派接口**：`POST /api/workorder-tasks/batch_assign/`

**功能**：
- ✅ 支持批量分派多个任务
- ✅ 支持统一设置部门和操作员
- ✅ 支持部分成功（返回详细结果）
- ✅ 记录每个任务的调整日志

#### 7.1.3 工序级别批量重新分派

**代码位置**：`backend/workorder/views.py:1029-1154`

**批量重新分派接口**：`POST /api/workorder-processes/{id}/reassign_tasks/`

**功能**：
- ✅ 批量重新分派工序的所有任务到新部门/操作员
- ✅ 支持同时更新工序级别的部门
- ✅ 调整原因必填
- ✅ 记录详细日志

**使用场景**：
- 工序自动分派后，发现部门无法处理，需要整体调整为外协
- 批量调整工序下所有任务的分派
- 例如：裱坑工序从包装车间调整为外协车间

### 7.2 存在的问题 ⚠️

#### 问题1：任务转移与分派调整概念混淆 ✅ **部分解决**

**当前实现**：
- ⚠️ **没有专门的任务转移接口**：使用 `assign` 接口实现转移
- ⚠️ **转移和调整概念不清晰**：转移和调整使用同一个接口，日志记录不够明确

**已实现功能**：
- ✅ 单任务分派调整接口（`assign`）
- ✅ 批量任务分派接口（`batch_assign`）
- ✅ 工序级别批量重新分派接口（`reassign_tasks`）
- ✅ 记录调整日志（包含原因和备注）
- ✅ 支持调整原因必填（`reassign_tasks` 中）

**影响**：
- 无法区分"新分派"和"转移"
- 日志记录不够清晰
- 统计和分析困难

**建议**：
- 添加独立的任务转移接口（`transfer`），明确语义
- 在日志中区分"初次分派"、"调整分派"、"转移"

#### 问题2：任务转移验证不足 ⚠️

**当前实现**：
- ✅ 支持修改分派
- ⚠️ **没有验证转移是否合理**：
  - 没有检查任务状态（如已完成任务不应该转移）
  - 没有检查任务进度（如任务已完成一半，转移是否合理）
  - 没有检查目标操作员是否可用

**缺少的验证**：
- ⚠️ 任务状态验证（只有待开始或进行中的任务可以转移）
- ⚠️ 任务进度验证（如任务已完成一半，转移需要确认）
- ⚠️ 目标操作员可用性验证

#### 问题3：任务转移通知不完善 ⚠️

**当前实现**：
- ✅ 有分派通知（通知新操作员）
- ⚠️ **没有转移通知**：没有通知原操作员任务已转移

**缺少的通知**：
- ⚠️ 通知原操作员（任务已转移给他人）
- ⚠️ 通知新操作员（接收新任务）
- ⚠️ 通知生产主管（任务转移情况）

#### 问题4：任务转移后数据追踪不完整 ⚠️

**当前实现**：
- ✅ 有任务日志记录
- ⚠️ **转移历史不完整**：没有专门的转移历史记录
- ⚠️ **转移原因不强制**：调整原因可选，可能没有记录转移原因

**缺少的功能**：
- ⚠️ 任务转移历史（记录所有转移记录）
- ⚠️ 转移原因必填（强制要求填写转移原因）
- ⚠️ 转移统计分析（统计任务转移频率、原因等）

### 7.3 优化建议

#### 建议1：实现专门的任务转移接口 🟡 **中优先级**

**实现方案**：
```python
@action(detail=True, methods=['post'])
def transfer(self, request, pk=None):
    """任务转移（从一个操作员转移给另一个操作员）"""
    task = self.get_object()
    
    # 1. 检查任务状态：只有 pending 或 in_progress 的任务可以转移
    if task.status not in ['pending', 'in_progress']:
        return Response({'error': '只有待开始或进行中的任务可以转移'})
    
    # 2. 获取转移信息
    target_operator_id = request.data.get('target_operator')
    target_department_id = request.data.get('target_department')
    transfer_reason = request.data.get('reason', '')  # 必填
    
    if not transfer_reason:
        return Response({'error': '请填写转移原因'})
    
    # 3. 验证目标操作员和部门
    # ...
    
    # 4. 记录转移前状态
    old_operator = task.assigned_operator
    old_department = task.assigned_department
    
    # 5. 执行转移
    task.assigned_operator = target_operator
    task.assigned_department = target_department
    task.save()
    
    # 6. 记录转移日志（明确标识为"转移"）
    TaskLog.objects.create(
        task=task,
        log_type='status_change',
        content=f'任务转移：{old_operator} → {target_operator}，原因：{transfer_reason}',
        operator=request.user
    )
    
    # 7. 创建通知
    # 通知原操作员
    if old_operator:
        Notification.create_notification(
            recipient=old_operator,
            notification_type='task_transferred',
            title=f'任务已转移：{task.work_content}',
            content=f'任务"{task.work_content}"已转移给{target_operator}，原因：{transfer_reason}',
            work_order=task.work_order_process.work_order
        )
    
    # 通知新操作员
    Notification.create_notification(
        recipient=target_operator,
        notification_type='task_assigned',
        title=f'新任务分派：{task.work_content}',
        content=f'任务"{task.work_content}"已分派给您，原因：{transfer_reason}',
        work_order=task.work_order_process.work_order
    )
```

**优先级**：🟡 **中** - 功能增强

#### 建议2：增强任务转移验证 🟡 **中优先级**

**需要添加的验证**：
1. 任务状态验证（只有待开始或进行中的任务可以转移）
2. 任务进度验证（如任务已完成一半，提示用户确认）
3. 目标操作员可用性验证（检查操作员是否在职、是否请假）
4. 权限验证（只有生产主管、原操作员或创建人可以转移）

**优先级**：🟡 **中** - 提升流程可靠性

#### 建议3：完善任务转移通知 🟡 **中优先级**

**需要添加的通知**：
1. 通知原操作员（任务已转移）
2. 通知新操作员（接收新任务）
3. 通知生产主管（任务转移情况）

**优先级**：🟡 **中** - 提升沟通效率

---

## 八、流程问题总结与优化建议

### 8.1 核心问题总结

#### 8.1.1 流程衔接问题

1. **审核后无法灵活调整** ✅ **已解决**：
   - ✅ 已实现 `request_reapproval` 接口
   - ✅ 审核通过后可以通过请求重新审核来修改核心字段
   - ✅ 支持修改后重新提交审核

2. **工序开始条件检查不全面** ⚠️ **部分实现**：
   - ⚠️ 工序开始检查已实现（`can_start` 方法）
   - ✅ 支持并行工序判断
   - ✅ 支持前置工序完成检查
   - ⚠️ 缺少物料准备检查
   - ⚠️ 缺少版型确认检查
   - ⚠️ 缺少资源可用性检查

3. **工序交接机制不明确** 🟡 **需优化**：
   - ⚠️ 没有专门的工序交接接口
   - ✅ 支持通过 `reassign_tasks` 批量调整任务分派
   - ⚠️ 交接流程不清晰
   - ⚠️ 交接记录不够详细

4. **任务转移机制** 🟡 **基本实现，需优化**：
   - ⚠️ 没有专门的任务转移接口（使用 `assign` 接口）
   - ✅ 支持单任务分派调整
   - ✅ 支持批量任务分派（`batch_assign`）
   - ✅ 支持工序级别批量重新分派（`reassign_tasks`）
   - ⚠️ 转移和调整语义不清晰
   - ⚠️ 转移通知可以更完善（通知原操作员）

#### 8.1.2 数据验证问题 ⚠️

1. **审核前验证不够全面**：
   - 缺少物料验证
   - 缺少数量验证
   - 缺少日期验证
   - 缺少工序顺序验证

2. **状态流转验证不足**：
   - 物料状态可以跳过流转
   - 物料状态可以回退
   - 没有状态流转验证

3. **业务条件验证不完整**：
   - 工序开始前没有检查物料准备
   - 工序开始前没有检查版型确认
   - 任务分派后没有验证操作员可用性

#### 8.1.3 通知提醒问题 ⚠️

1. **审核通知不完善**：
   - 没有通知其他相关人员
   - 没有审核超时提醒

2. **物料准备提醒缺失**：
   - 没有物料准备提醒
   - 没有物料准备计划

3. **任务转移通知不完整**：
   - 没有通知原操作员
   - 没有通知生产主管

### 8.2 优化建议优先级（更新版）

#### 高优先级 🔴（立即实施）

1. **增强工序开始条件检查**
   - ⚠️ 检查物料是否已准备
   - ⚠️ 检查版型是否已确认
   - ⚠️ 检查资源是否可用

2. **增强审核前验证**
   - ⚠️ 添加物料验证
   - ⚠️ 添加数量验证
   - ⚠️ 添加日期验证

3. **完善任务转移通知**
   - ⚠️ 通知原操作员
   - ✅ 通知新操作员（已在 `assign` 接口实现）
   - ⚠️ 通知生产主管

#### 中优先级 🟡（1-2周内实施）

1. ~~**实现重新审核机制**~~ ✅ **已完成**
   - ✅ 允许审核通过后请求重新审核（`request_reapproval` 接口）
   - ✅ 支持修改后重新审核流程

2. **实现工序交接接口**
   - ⚠️ 专门的工序交接接口
   - ✅ 交接验证和记录（通过 `reassign_tasks` 实现）
   - ⚠️ 交接通知（可以更完善）

3. **实现任务转移接口**
   - ⚠️ 专门的任务转移接口（可选，当前通过 `assign` 实现）
   - ✅ 转移验证和记录（通过 `assign` 和 `batch_assign` 实现）
   - ⚠️ 转移通知（通知原操作员）

4. **实现物料准备提醒**
   - ⚠️ 物料准备提醒机制
   - ⚠️ 物料准备计划
   - ⚠️ 物料准备进度跟踪

5. **增强物料状态验证**
   - ⚠️ 状态流转顺序验证
   - ⚠️ 状态回退验证

#### 低优先级 🟢（1-2月内实施）

1. **增强任务分派智能性**
   - 操作员技能标签
   - 任务复杂度评估
   - 工作负载均衡算法

2. **改进物料用量解析**
   - 支持多种格式
   - 支持单位转换
   - 支持复合用量

3. **完善审核通知机制**
   - 通知其他相关人员
   - 审核超时提醒

### 8.3 实施建议

#### 8.3.1 分阶段实施

**第一阶段（高优先级）**：
1. 增强工序开始条件检查
2. 增强审核前验证
3. 完善任务转移通知（通知原操作员）

**第二阶段（中优先级）**：
1. ~~实现重新审核机制~~ ✅ 已完成
2. 实现工序交接接口（可选，当前通过 `reassign_tasks` 实现）
3. 实现任务转移接口（可选，当前通过 `assign` 实现）
4. 实现物料准备提醒

**第三阶段（低优先级）**：
1. 增强任务分派智能性
2. 改进物料用量解析 ✅ 部分完成（支持小数）
3. 完善审核通知机制

#### 8.3.2 技术实现建议

1. **使用信号处理器**：
   - 物料状态变化时自动检查工序是否可以开始
   - 版型确认时自动检查工序是否可以开始

2. **使用验证器**：
   - 创建专门的验证器类（如 `ProcessStartValidator`）
   - 统一管理验证逻辑

3. **使用通知系统**：
   - 充分利用现有的通知系统
   - 添加新的通知类型

---

## 九、相关文档

- [系统使用流程分析](./SYSTEM_USAGE_ANALYSIS.md) - 完整的系统功能说明
- [施工单业务流程分析](./WORKORDER_BUSINESS_FLOW_ANALYSIS.md) - 业务流程说明
- [任务管理系统当前状态](./TASK_MANAGEMENT_CURRENT_STATUS.md) - 任务管理详细说明
- [工序逻辑全面分析](./PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md) - 工序逻辑说明

---

**文档历史**：
- v1.1（2026-01-09）：更新版本，根据实际代码分析，标记已实现的功能和仍需优化的部分
  - ✅ 重新审核机制已实现（`request_reapproval` 接口）
  - ✅ 批量任务分派已实现（`batch_assign` 接口）
  - ✅ 工序级别批量任务重新分派已实现（`reassign_tasks` 接口）
  - ✅ 物料状态自动更新开料任务已实现（信号处理器）
  - ✅ 物料用量解析已改进（支持小数）
  - 🟡 部分功能需要进一步优化（如任务转移、工序交接的语义清晰度）
  - 🟢 新增优化建议和优先级调整
- v1.0（2026-01-08）：初始版本，全面分析施工单创建后的完整流程逻辑

