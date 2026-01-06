# 施工单审核流程分析与优化建议

**最后更新时间**：2025-01-28  
**文档版本**：v2.0

## 一、当前审核流程概述

### 1.1 审核流程设计

当前系统采用**单级审核**模式：
- **审核角色**：业务员（Salesperson）
- **审核对象**：施工单（WorkOrder）
- **审核状态**：待审核（pending）→ 已通过（approved）/ 已拒绝（rejected）
- **审核权限**：业务员只能审核自己负责的客户对应的施工单

### 1.2 数据模型

#### 1.2.1 WorkOrder 模型审核字段

```python
# 审核状态
approval_status = models.CharField('审核状态', max_length=20, 
                                 choices=[('pending', '待审核'), 
                                         ('approved', '已通过'), 
                                         ('rejected', '已拒绝')], 
                                 default='pending')

# 审核人（最后一次审核）
approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, 
                               null=True, blank=True,
                               related_name='approved_orders', 
                               verbose_name='审核人',
                               help_text='业务员审核人')

# 审核时间（最后一次审核）
approved_at = models.DateTimeField('审核时间', null=True, blank=True)

# 审核意见（最后一次审核）
approval_comment = models.TextField('审核意见', blank=True, 
                                   help_text='业务员审核意见')
```

**特点**：
- 只记录最后一次审核信息
- 审核状态、审核人、审核时间、审核意见都是单值字段

#### 1.2.2 WorkOrderApprovalLog 模型（审核历史记录）

```python
class WorkOrderApprovalLog(models.Model):
    """施工单审核历史记录"""
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE,
                                   related_name='approval_logs', verbose_name='施工单')
    approval_status = models.CharField('审核状态', max_length=20, 
                                     choices=WorkOrder.APPROVAL_STATUS_CHOICES)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, 
                                   null=True, blank=True,
                                   related_name='approval_logs', verbose_name='审核人')
    approved_at = models.DateTimeField('审核时间', auto_now_add=True)
    approval_comment = models.TextField('审核意见', blank=True)
    rejection_reason = models.TextField('拒绝原因', blank=True, 
                                       help_text='审核拒绝时的拒绝原因')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
```

**特点**：
- 记录每次审核操作的完整历史
- 包含审核状态、审核人、审核时间、审核意见、拒绝原因
- 支持审核历史追溯

### 1.3 审核流程状态转换

```
创建施工单
    ↓
[待审核] (pending)
    ↓
    ├─→ [已通过] (approved) ─→ 自动变更施工单状态为 in_progress
    │
    └─→ [已拒绝] (rejected) ─→ 保持施工单状态为 pending
                                    ↓
                                修改施工单（自动重置为 pending）
                                    ↓
                                [待审核] (pending) ─→ 重新审核
```

### 1.4 审核权限控制

**审核权限**：
- ✅ 只有业务员（`groups.filter(name='业务员')`）可以审核施工单
- ✅ 业务员只能审核自己负责的客户对应的施工单（`customer.salesperson == request.user`）
- ✅ 只有 `approval_status='pending'` 的施工单才能审核

**重新提交权限**：
- ✅ 制表人（`manager`）可以重新提交审核
- ✅ 创建人（`created_by`）可以重新提交审核
- ✅ 有编辑权限的用户（`has_perm('workorder.change_workorder')`）可以重新提交审核

## 二、当前实现分析

### 2.1 后端实现

#### 2.1.1 审核接口（`approve`）

**位置**：`backend/workorder/views.py` - `WorkOrderViewSet.approve()`

**流程**：
1. **权限验证**：
   - 检查用户是否为业务员
   - 检查业务员是否负责该施工单的客户
   - 检查审核状态是否为 `pending`

2. **数据验证**：
   - 验证审核状态（`approved` 或 `rejected`）
   - 审核拒绝时，强制要求填写拒绝原因
   - 调用 `validate_before_approval()` 进行数据完整性检查

3. **审核处理**：
   - 创建审核历史记录（`WorkOrderApprovalLog`）
   - 更新施工单审核信息（状态、审核人、审核时间、审核意见）
   - 审核通过后，如果施工单状态为 `pending`，自动变更为 `in_progress`

**关键代码**：
```python
# 审核前数据完整性检查
validation_errors = work_order.validate_before_approval()
if validation_errors:
    return Response({'error': '施工单数据不完整，无法审核', 'details': validation_errors})

# 记录审核历史
WorkOrderApprovalLog.objects.create(
    work_order=work_order,
    approval_status=approval_status,
    approved_by=request.user,
    approval_comment=approval_comment,
    rejection_reason=rejection_reason
)

# 审核通过后，自动变更施工单状态
if approval_status == 'approved' and work_order.status == 'pending':
    work_order.status = 'in_progress'
```

#### 2.1.2 重新提交审核接口（`resubmit_for_approval`）

**位置**：`backend/workorder/views.py` - `WorkOrderViewSet.resubmit_for_approval()`

**流程**：
1. **状态检查**：只有 `rejected` 状态的施工单才能重新提交
2. **权限检查**：检查用户是否有权限（制表人、创建人或有编辑权限）
3. **重置状态**：将审核状态重置为 `pending`，清空审核意见

#### 2.1.3 数据完整性验证（`validate_before_approval`）

**位置**：`backend/workorder/models.py` - `WorkOrder.validate_before_approval()`

**验证内容**：
1. ✅ 客户信息检查
2. ✅ 产品信息检查
3. ✅ 工序信息检查
4. ✅ 交货日期检查
5. ✅ 工序与版的选择匹配检查（图稿、刀模、烫金版、压凸版）

**返回**：错误信息列表，如果为空则表示验证通过

#### 2.1.4 自动重置审核状态

**位置**：`backend/workorder/serializers.py` - `WorkOrderCreateUpdateSerializer.update()`

**逻辑**：
- 如果审核状态是 `rejected`，修改施工单后自动重置为 `pending`
- 清空之前的审核意见

### 2.2 前端实现

#### 2.2.1 审核操作界面

**位置**：`frontend/src/views/workorder/Detail.vue`

**功能**：
1. **审核表单**（仅当 `approval_status='pending'` 且 `canApprove=true` 时显示）：
   - 审核意见输入框（可选）
   - 拒绝原因输入框（动态显示，拒绝时必填）
   - "通过审核"和"拒绝审核"按钮

2. **重新提交审核**（仅当 `approval_status='rejected'` 且 `canResubmit=true` 时显示）：
   - 显示拒绝原因和审核意见
   - "重新提交审核"按钮
   - 提示信息

3. **审核历史记录**（时间线形式）：
   - 显示所有审核历史记录
   - 包含审核状态、审核人、审核时间、审核意见、拒绝原因

#### 2.2.2 权限判断

**`canApprove`**：
- 用户是业务员
- 业务员负责该施工单的客户

**`canResubmit`**：
- 用户是制表人、创建人或有编辑权限的用户

## 三、发现的问题和不足

### 3.1 高优先级问题 ⚠️

#### 3.1.1 已审核订单缺少编辑权限控制 ⚠️

**问题描述**：
- 当前系统没有对审核通过后的编辑进行限制
- 审核通过后，用户可以随意修改施工单内容（包括核心字段）
- 可能导致审核结果失效、数据不一致、审计追踪不完整

**影响**：
- 审核结果可能被篡改
- 审核时看到的内容和实际内容可能不一致
- 无法追踪审核后的修改操作
- 可能导致生产计划混乱

**实际业务场景分析**：
在实际业务系统中，已审核订单的编辑权限通常有以下几种处理方式：
1. **完全禁止编辑**（最严格）- 适用于财务、合同等系统
2. **部分字段可编辑**（推荐）- 核心字段禁止，非核心字段允许
3. **允许编辑但需重新审核**（灵活）- 修改后自动重置审核状态
4. **权限分级编辑**（最灵活）- 管理员可以编辑，普通用户不能

**推荐方案**：
- 采用"部分字段可编辑 + 重新审核机制"
- 核心字段（产品、工序、版选择、数量等）审核通过后禁止编辑
- 非核心字段（备注、交货日期等）审核通过后允许编辑
- 如果必须修改核心字段，需要管理员权限或重新审核流程

**详细分析**：请参考 `APPROVED_ORDER_EDIT_ANALYSIS.md`

#### 3.1.2 审核状态与施工单状态联动不完整

**问题描述**：
- ✅ 审核通过后，如果施工单状态为 `pending`，自动变更为 `in_progress`（已实现）
- ⚠️ 审核拒绝后，施工单状态保持为 `pending`，但没有明确的业务规则
- ⚠️ 如果施工单状态已经是 `in_progress` 或其他状态，审核通过后不会变更状态

**影响**：
- 审核通过后，如果施工单状态不是 `pending`，不会自动变更，可能导致状态不一致
- 审核拒绝后，施工单状态没有明确的处理规则

**建议**：
- 审核通过后，无论当前状态如何，都应该有明确的处理逻辑
- 审核拒绝后，可以考虑将施工单状态设置为特定状态（如 `pending` 或新增 `rejected` 状态）

#### 3.1.3 审核前数据完整性检查不够全面

**问题描述**：
- ✅ 已检查：客户、产品、工序、交货日期、工序与版的选择匹配（已实现）
- ⚠️ 未检查：物料信息是否完整
- ⚠️ 未检查：图稿是否已确认（如果工序需要图稿）
- ⚠️ 未检查：印刷形式是否合理（如果选择了图稿，印刷形式不能是 `none`）

**影响**：
- 可能审核不完整的施工单
- 可能审核包含未确认图稿的施工单

**建议**：
- 增加物料信息完整性检查
- 增加图稿确认状态检查
- 增加印刷形式合理性检查

#### 3.1.4 审核历史记录缺少操作类型

**问题描述**：
- 当前 `WorkOrderApprovalLog` 只记录审核操作
- 没有记录"重新提交审核"操作
- 无法区分"首次审核"和"重新审核"

**影响**：
- 无法完整追踪审核流程
- 无法分析审核效率（如重新审核次数）

**建议**：
- 添加 `action_type` 字段，区分"审核"和"重新提交"
- 或者在重新提交时也创建一条审核历史记录（状态为 `pending`）

#### 3.1.5 审核通知机制缺失

**问题描述**：
- 施工单创建后，业务员不知道有待审核的施工单
- 审核完成后，制表人不知道审核结果
- 没有审核提醒功能

**影响**：
- 审核效率低
- 可能延误审核时间

**建议**：
- 施工单创建后，通知负责的业务员
- 审核完成后，通知制表人审核结果
- 在 Dashboard 显示待审核施工单数量（已实现）
- 支持邮件或系统消息通知

### 3.2 中优先级问题

#### 3.2.1 审核权限控制不够细粒度

**问题描述**：
- 当前只检查用户是否为业务员
- 没有区分不同级别的业务员权限
- 没有审核金额限制（如超过一定金额需要上级审核）

**建议**：
- 支持多级审核（如普通业务员 → 业务主管 → 经理）
- 根据施工单金额或重要性决定审核级别
- 支持审核流程配置（可配置的审核流程）

#### 3.2.2 审核意见缺少格式验证

**问题描述**：
- 审核意见和拒绝原因没有字符长度限制
- 没有格式验证（如是否包含敏感词）
- 审核意见是可选的，但可能应该要求填写

**建议**：
- 增加字符长度限制（如最多 1000 字）
- 增加格式验证
- 考虑审核通过时是否要求填写审核意见（可配置）

#### 3.2.3 审核操作缺少详细日志

**问题描述**：
- 审核操作没有记录 IP 地址、用户代理等信息
- 无法追踪审核操作的详细信息
- 无法审计审核行为

**建议**：
- 记录审核操作的详细日志（IP 地址、用户代理、操作时间等）
- 支持审核日志查询和导出
- 与审核历史记录结合，形成完整的审核追踪链

#### 3.2.4 审核统计功能不完善

**问题描述**：
- 缺少审核统计功能（如审核通过率、平均审核时间等）
- 无法分析审核效率和质量
- 没有审核报表功能

**建议**：
- 增加审核统计功能
- 统计审核通过率、拒绝率、平均审核时间等
- 支持审核效率分析报表

### 3.3 低优先级问题

#### 3.3.1 审核界面用户体验问题

**问题描述**：
- 审核操作区域只在详情页显示
- 审核状态显示不够醒目
- 审核意见显示不够清晰

**建议**：
- 在施工单列表页显示审核状态
- 优化审核操作界面，增加审核说明和提示
- 审核意见支持富文本编辑（如支持换行、列表等）

#### 3.3.2 审核流程缺少配置化

**问题描述**：
- 审核流程是硬编码的
- 无法根据不同业务场景配置不同的审核流程
- 无法动态调整审核规则

**建议**：
- 支持审核流程配置（可配置的审核流程）
- 支持审核规则配置（如审核条件、审核级别等）
- 支持审核流程模板

## 四、优化建议

### 4.1 短期优化（1-2周）

#### 4.1.1 添加已审核订单编辑权限控制 ⚠️ 待实施

**当前状态**：
- ⚠️ 审核通过后，没有对编辑进行限制
- ⚠️ 用户可以随意修改核心字段

**实施方案**：
1. 定义核心字段列表（产品、工序、版选择、数量等）
2. 在序列化器中添加字段编辑限制
3. 在前端添加字段禁用逻辑
4. 添加权限检查（`change_approved_workorder`）

**核心字段列表**：
```python
APPROVED_ORDER_PROTECTED_FIELDS = [
    'customer', 'products_data', 'processes',
    'artworks', 'dies', 'foiling_plates', 'embossing_plates',
    'printing_type', 'printing_cmyk_colors', 'printing_other_colors',
    'production_quantity', 'total_amount'
]
```

**非核心字段**（允许编辑）：
- 备注（`notes`）
- 交货日期（`delivery_date`、`actual_delivery_date`）
- 优先级（`priority`）
- 设计文件（`design_file`）

**详细方案**：请参考 `APPROVED_ORDER_EDIT_ANALYSIS.md`

#### 4.1.2 完善审核前数据完整性检查 ✅ 部分完成

**当前状态**：
- ✅ 已检查：客户、产品、工序、交货日期、工序与版的选择匹配

**待完善**：
- ⚠️ 增加物料信息完整性检查
- ⚠️ 增加图稿确认状态检查（如果工序需要图稿，图稿必须已确认）
- ⚠️ 增加印刷形式合理性检查（如果选择了图稿，印刷形式不能是 `none`）

**实施方案**：
```python
def validate_before_approval(self):
    errors = []
    # ... 现有检查 ...
    
    # 检查图稿确认状态
    if self.artworks.exists():
        unconfirmed_artworks = self.artworks.filter(confirmed=False)
        if unconfirmed_artworks.exists():
            artwork_codes = [a.get_full_code() for a in unconfirmed_artworks]
            errors.append(f'以下图稿未确认：{", ".join(artwork_codes)}')
    
    # 检查印刷形式
    if self.artworks.exists() and self.printing_type == 'none':
        errors.append('选择了图稿，印刷形式不能是"不需要印刷"')
    
    return errors
```

#### 4.1.3 完善审核状态与施工单状态联动

**当前状态**：
- ✅ 审核通过后，如果施工单状态为 `pending`，自动变更为 `in_progress`

**待完善**：
- ⚠️ 审核通过后，如果施工单状态不是 `pending`，应该有明确的处理逻辑
- ⚠️ 审核拒绝后，施工单状态应该有明确的处理规则

**实施方案**：
```python
# 审核通过后，自动变更施工单状态
if approval_status == 'approved':
    if work_order.status == 'pending':
        work_order.status = 'in_progress'
    # 如果已经是其他状态，保持当前状态（或根据业务规则处理）

# 审核拒绝后，保持施工单状态为 pending（当前实现）
if approval_status == 'rejected':
    # 保持当前状态，或设置为特定状态
    pass
```

#### 4.1.4 增加审核历史记录操作类型

**实施方案**：
1. 在 `WorkOrderApprovalLog` 模型中添加 `action_type` 字段
2. 区分"审核"和"重新提交"操作
3. 在重新提交时也创建一条审核历史记录

**数据模型**：
```python
class WorkOrderApprovalLog(models.Model):
    ACTION_TYPE_CHOICES = [
        ('approve', '审核'),
        ('resubmit', '重新提交'),
    ]
    action_type = models.CharField('操作类型', max_length=20, 
                                  choices=ACTION_TYPE_CHOICES, 
                                  default='approve')
    # ... 其他字段 ...
```

### 4.2 中期优化（1-2月）

#### 4.2.1 支持多级审核

**实施方案**：
1. 创建审核流程配置表
2. 根据施工单金额或重要性决定审核级别
3. 支持审核流程配置（可配置的审核流程）

**数据模型**：
```python
class ApprovalWorkflow(models.Model):
    """审核流程配置"""
    name = models.CharField('流程名称', max_length=100)
    min_amount = models.DecimalField('最小金额', max_digits=12, decimal_places=2, null=True, blank=True)
    max_amount = models.DecimalField('最大金额', max_digits=12, decimal_places=2, null=True, blank=True)
    levels = models.JSONField('审核级别', help_text='审核级别列表，如：[{"level": 1, "role": "业务员"}, {"level": 2, "role": "业务主管"}]')
    is_active = models.BooleanField('是否启用', default=True)
```

#### 4.2.2 增加审核通知机制

**实施方案**：
1. 施工单创建后，通知负责的业务员
2. 审核完成后，通知制表人审核结果
3. 支持邮件或系统消息通知

**实现方式**：
- 使用 Django 信号（Signals）监听施工单创建和审核完成事件
- 发送系统消息或邮件通知
- 在 Dashboard 显示待审核施工单数量（已实现）

#### 4.2.3 完善审核日志记录

**实施方案**：
1. 记录审核操作的详细日志（IP 地址、用户代理、操作时间等）
2. 支持审核日志查询和导出
3. 与审核历史记录结合，形成完整的审核追踪链

### 4.3 长期优化（3-6月）

#### 4.3.1 支持审核流程配置

**实施方案**：
1. 创建审核流程配置表
2. 支持自定义审核流程（如：普通业务员 → 业务主管 → 经理）
3. 根据施工单属性（金额、客户等级等）自动选择审核流程

#### 4.3.2 增加审核统计功能

**实施方案**：
1. 统计审核通过率、拒绝率、平均审核时间等
2. 支持审核效率分析报表
3. 支持审核质量分析

## 五、当前实现优点

### 5.1 已实现的优秀功能 ✅

1. **已审核订单编辑权限控制** ✅（2025-01-28）
   - ✅ 定义了核心字段列表（`APPROVED_ORDER_PROTECTED_FIELDS`）
   - ✅ 在序列化器中添加了审核通过后的字段编辑限制
   - ✅ 添加了 `change_approved_workorder` 自定义权限
   - ✅ 在前端 Form.vue 中添加了字段禁用逻辑
   - ✅ 在前端 Detail.vue 中添加了编辑权限提示
   - ✅ 核心字段（产品、工序、版选择等）审核通过后禁止编辑
   - ✅ 非核心字段（备注、交货日期等）审核通过后允许编辑
   - ✅ 有特殊权限的用户可以编辑核心字段，但需要重新审核

2. **审核历史记录完整** ✅
   - 创建了 `WorkOrderApprovalLog` 模型，记录每次审核操作
   - 包含审核状态、审核人、审核时间、审核意见、拒绝原因
   - 支持审核历史追溯

2. **审核状态变更限制** ✅
   - 只有 `pending` 状态的施工单才能审核
   - 防止重复审核
   - 审核状态更加规范

3. **数据完整性检查** ✅
   - 审核前检查客户、产品、工序、交货日期
   - 检查工序与版的选择是否匹配
   - 确保审核的施工单数据完整

4. **审核后状态联动** ✅
   - 审核通过后，自动变更施工单状态为 `in_progress`
   - 审核拒绝后，保持施工单状态为 `pending`

5. **拒绝原因必填验证** ✅
   - 审核拒绝时，强制要求填写拒绝原因
   - 便于后续改进

6. **重新提交审核功能** ✅
   - 支持审核拒绝后修改并重新提交审核
   - 自动重置和手动重置两种方式
   - 权限控制完善

## 六、优化实施优先级

### 6.1 高优先级（立即实施）

1. ⚠️ **添加已审核订单编辑权限控制** - 核心字段禁止编辑，非核心字段允许编辑
2. ⚠️ **完善审核前数据完整性检查** - 增加物料、图稿确认、印刷形式检查
3. ⚠️ **完善审核状态与施工单状态联动** - 明确各种状态下的处理规则
4. ⚠️ **增加审核历史记录操作类型** - 区分"审核"和"重新提交"操作

### 6.2 中优先级（1-2月内实施）

1. ⚠️ **支持多级审核** - 根据施工单金额或重要性设置不同审核级别
2. ⚠️ **增加审核通知机制** - 施工单创建后通知业务员，审核完成后通知制表人
3. ⚠️ **完善审核日志记录** - 记录审核操作的详细信息（IP地址、操作时间等）
4. ⚠️ **增加审核统计功能** - 统计审核通过率、拒绝率、平均审核时间等

### 6.3 低优先级（3-6月内实施）

1. ⚠️ **支持审核流程配置** - 可配置的审核流程（如：普通业务员 → 业务主管 → 经理）
2. ⚠️ **优化审核界面用户体验** - 在列表页显示审核状态，优化审核操作界面

## 七、总结

### 7.1 当前审核流程的优点

- ✅ 审核历史记录完整，可以追溯审核过程
- ✅ 审核状态变更有严格限制，防止重复审核
- ✅ 审核前进行数据完整性检查，确保审核质量
- ✅ 审核后自动变更施工单状态，提高效率
- ✅ 拒绝审核时必须填写拒绝原因，便于改进
- ✅ 支持审核拒绝后重新提交审核，流程完善

### 7.2 当前审核流程的不足

- ⚠️ **已审核订单缺少编辑权限控制** - 审核通过后可以随意修改核心字段，可能导致审核结果失效
- ⚠️ **审核前数据完整性检查不够全面** - 缺少物料、图稿确认、印刷形式检查
- ⚠️ **审核状态与施工单状态联动不完整** - 某些状态下的处理规则不明确
- ⚠️ **审核历史记录缺少操作类型** - 无法区分"审核"和"重新提交"
- ⚠️ **审核通知机制缺失** - 审核效率低
- ⚠️ **审核权限控制不够细粒度** - 不支持多级审核
- ⚠️ **审核操作缺少详细日志** - 审计能力不足
- ⚠️ **审核统计功能不完善** - 无法分析审核效率和质量

### 7.3 优化建议总结

**短期优化（1-2周）**：
1. 添加已审核订单编辑权限控制（核心字段禁止编辑）
2. 完善审核前数据完整性检查（物料、图稿确认、印刷形式）
3. 完善审核状态与施工单状态联动
4. 增加审核历史记录操作类型

**中期优化（1-2月）**：
1. 支持多级审核
2. 增加审核通知机制
3. 完善审核日志记录
4. 增加审核统计功能

**长期优化（3-6月）**：
1. 支持审核流程配置
2. 优化审核界面用户体验
