# 已审核订单编辑权限分析与最佳实践

**最后更新时间**：2025-01-28

## 一、问题背景

在实际业务场景中，已审核的订单是否允许再次编辑是一个重要的业务逻辑问题。不同的处理方式会影响：
- 数据完整性和一致性
- 审核流程的有效性
- 业务操作的灵活性
- 审计追踪的完整性

## 二、当前系统实现分析

### 2.1 当前实现状态

**审核拒绝后的编辑**：
- ✅ **已实现**：审核拒绝后（`approval_status='rejected'`），修改施工单会自动重置为 `pending`
- ✅ **已实现**：提供"重新提交审核"功能，允许手动重置审核状态

**审核通过后的编辑**：
- ⚠️ **未限制**：当前系统没有对审核通过后的编辑进行限制
- ⚠️ **风险**：审核通过后，用户可以随意修改施工单内容，可能导致：
  - 审核结果失效（修改后的内容可能不符合审核要求）
  - 数据不一致（审核时看到的内容和实际内容不一致）
  - 审计追踪不完整（无法知道审核后做了哪些修改）

### 2.2 当前代码分析

**后端实现**（`serializers.py`）：
```python
def update(self, instance, validated_data):
    # ... 更新逻辑 ...
    
    # 如果审核状态是 rejected，修改后自动重置为 pending
    if instance.approval_status == 'rejected':
        instance.approval_status = 'pending'
        instance.approval_comment = ''
    
    # 注意：如果 approval_status == 'approved'，没有特殊处理
    instance.save()
```

**前端实现**（`Detail.vue`）：
```javascript
handleEdit() {
  // 没有检查审核状态，直接跳转到编辑页面
  this.$router.push(`/workorders/${this.workOrder.id}/edit`)
}
```

## 三、实际业务场景分析

### 3.1 常见处理方式

在实际业务系统中，已审核订单的编辑权限通常有以下几种处理方式：

#### 方式一：完全禁止编辑（最严格）

**特点**：
- 审核通过后，完全禁止编辑
- 如果需要修改，必须创建新的订单或走变更流程

**适用场景**：
- 财务系统、合同系统等对数据完整性要求极高的场景
- 需要严格审计追踪的场景

**优点**：
- 数据完整性最高
- 审核结果不会被篡改
- 审计追踪最完整

**缺点**：
- 灵活性最低
- 需要修改时必须创建新订单，增加工作量

#### 方式二：部分字段可编辑（推荐）

**特点**：
- 审核通过后，核心字段（产品、数量、工序等）禁止编辑
- 非核心字段（备注、交货日期等）允许编辑
- 修改核心字段需要重新审核

**适用场景**：
- 大多数业务系统
- 需要在灵活性和数据完整性之间平衡的场景

**优点**：
- 平衡了灵活性和数据完整性
- 允许必要的调整（如备注、日期）
- 核心数据受到保护

**缺点**：
- 需要明确区分核心字段和非核心字段
- 实现相对复杂

#### 方式三：允许编辑但需要重新审核（灵活）

**特点**：
- 审核通过后，允许编辑所有字段
- 修改后自动重置审核状态为 `pending`
- 需要重新审核

**适用场景**：
- 对灵活性要求高的场景
- 审核流程相对简单的场景

**优点**：
- 灵活性最高
- 允许随时调整

**缺点**：
- 可能导致频繁的重新审核
- 审核结果可能被频繁修改

#### 方式四：权限分级编辑（最灵活）

**特点**：
- 普通用户：审核通过后禁止编辑
- 管理员/特殊权限：审核通过后可以编辑
- 编辑后可以选择是否重新审核

**适用场景**：
- 需要管理员处理特殊情况的场景
- 权限体系完善的系统

**优点**：
- 灵活性最高
- 可以处理特殊情况

**缺点**：
- 权限管理复杂
- 需要完善的权限体系

### 3.2 不同审核状态下的编辑策略

| 审核状态 | 是否允许编辑 | 编辑后处理 | 推荐策略 |
|---------|------------|-----------|---------|
| **pending（待审核）** | ✅ 允许 | 保持 `pending` | 完全允许编辑 |
| **rejected（已拒绝）** | ✅ 允许 | 自动重置为 `pending` | 允许编辑，修改后重新审核 |
| **approved（已通过）** | ⚠️ 视情况 | 需要明确规则 | 部分字段可编辑，或需要重新审核 |

## 四、推荐方案

### 4.1 推荐方案：部分字段可编辑 + 重新审核机制

**核心原则**：
1. **核心字段保护**：审核通过后，核心字段（产品、数量、工序、版选择等）禁止编辑
2. **非核心字段允许**：非核心字段（备注、交货日期等）允许编辑
3. **修改核心字段需重新审核**：如果必须修改核心字段，需要重新审核流程

### 4.2 字段分类

#### 4.2.1 核心字段（审核通过后禁止编辑）

**定义**：影响生产计划和成本的关键字段

**包括**：
- 客户（`customer`）
- 产品列表（`products`）
- 产品数量（`quantity`）
- 工序列表（`processes`）
- 图稿（`artworks`）
- 刀模（`dies`）
- 烫金版（`foiling_plates`）
- 压凸版（`embossing_plates`）
- 印刷形式（`printing_type`）
- 印刷颜色（`printing_cmyk_colors`、`printing_other_colors`）
- 生产数量（`production_quantity`）
- 总金额（`total_amount`）

**原因**：
- 这些字段直接影响生产计划和成本
- 审核时已经验证过这些字段的合理性
- 修改这些字段可能导致审核结果失效

#### 4.2.2 非核心字段（审核通过后允许编辑）

**定义**：不影响生产计划和成本的辅助字段

**包括**：
- 备注（`notes`）
- 交货日期（`delivery_date`、`actual_delivery_date`）
- 优先级（`priority`）
- 设计文件（`design_file`）
- 物料信息（`materials`）- 注意：物料可能影响成本，需要谨慎处理

**原因**：
- 这些字段主要用于信息记录和调整
- 修改这些字段不会影响审核结果的有效性
- 允许必要的调整可以提高系统灵活性

### 4.3 实现方案

#### 4.3.1 后端实现

**方案一：在序列化器中限制字段编辑**

```python
class WorkOrderCreateUpdateSerializer(serializers.ModelSerializer):
    """施工单创建/更新序列化器"""
    
    def validate(self, data):
        """验证编辑权限"""
        instance = getattr(self, 'instance', None)
        
        # 如果是更新操作且审核状态为 approved
        if instance and instance.approval_status == 'approved':
            # 定义核心字段列表
            core_fields = [
                'customer', 'products_data', 'processes',
                'artworks', 'dies', 'foiling_plates', 'embossing_plates',
                'printing_type', 'printing_cmyk_colors', 'printing_other_colors',
                'production_quantity', 'total_amount'
            ]
            
            # 检查是否尝试修改核心字段
            modified_core_fields = []
            for field in core_fields:
                if field in data:
                    # 检查值是否发生变化
                    old_value = getattr(instance, field, None)
                    new_value = data[field]
                    
                    # 对于 ManyToMany 字段，需要特殊处理
                    if field in ['artworks', 'dies', 'foiling_plates', 'embossing_plates']:
                        old_ids = set(getattr(instance, field).values_list('id', flat=True))
                        new_ids = set(new_value or [])
                        if old_ids != new_ids:
                            modified_core_fields.append(field)
                    elif old_value != new_value:
                        modified_core_fields.append(field)
            
            if modified_core_fields:
                # 检查用户是否有特殊权限
                if not self.context['request'].user.has_perm('workorder.change_approved_workorder'):
                    raise serializers.ValidationError({
                        'error': '审核通过后，核心字段（产品、工序、版选择等）不能修改。如需修改，请联系管理员或重新提交审核。',
                        'modified_fields': modified_core_fields
                    })
                else:
                    # 有特殊权限的用户可以修改，但需要重新审核
                    instance.approval_status = 'pending'
                    instance.approval_comment = ''
        
        return data
```

**方案二：在视图中限制字段编辑**

```python
class WorkOrderViewSet(viewsets.ModelViewSet):
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # 如果审核状态为 approved，检查编辑权限
        if instance.approval_status == 'approved':
            # 定义核心字段
            core_fields = ['customer', 'products_data', 'processes', ...]
            
            # 检查是否修改了核心字段
            modified_core_fields = [f for f in core_fields if f in request.data]
            
            if modified_core_fields:
                # 检查权限
                if not request.user.has_perm('workorder.change_approved_workorder'):
                    return Response({
                        'error': '审核通过后，核心字段不能修改',
                        'modified_fields': modified_core_fields
                    }, status=status.HTTP_403_FORBIDDEN)
                else:
                    # 有权限的用户可以修改，但需要重新审核
                    instance.approval_status = 'pending'
        
        return super().update(request, *args, **kwargs)
```

#### 4.3.2 前端实现

**方案一：在编辑页面禁用核心字段**

```vue
<template>
  <el-form-item label="产品" prop="products">
    <el-select
      v-model="form.products"
      :disabled="isApproved && !canEditCoreFields"
      placeholder="请选择产品"
    >
      <!-- ... -->
    </el-select>
    <el-alert
      v-if="isApproved && !canEditCoreFields"
      type="warning"
      :closable="false"
      style="margin-top: 10px;"
    >
      <div slot="title">
        该施工单已审核通过，核心字段不能修改。如需修改，请联系管理员。
      </div>
    </el-alert>
  </el-form-item>
</template>

<script>
export default {
  computed: {
    isApproved() {
      return this.workOrder && this.workOrder.approval_status === 'approved'
    },
    canEditCoreFields() {
      // 检查用户是否有编辑已审核订单的权限
      const userInfo = this.$store.getters.currentUser
      // 这里需要根据实际权限系统实现
      return userInfo && userInfo.has_permission('change_approved_workorder')
    }
  }
}
</script>
```

**方案二：在详情页提示并限制编辑**

```vue
<template>
  <el-button 
    type="primary" 
    icon="el-icon-edit" 
    @click="handleEdit"
    :disabled="isApproved && !canEditCoreFields"
  >
    编辑
  </el-button>
  
  <el-alert
    v-if="isApproved"
    type="info"
    :closable="false"
    style="margin-top: 10px;"
  >
    <div slot="title">
      该施工单已审核通过。核心字段（产品、工序、版选择等）不能修改，非核心字段（备注、日期等）可以修改。
    </div>
  </el-alert>
</template>
```

## 五、最佳实践建议

### 5.1 推荐策略

**对于当前系统，推荐采用"部分字段可编辑 + 重新审核机制"**：

1. **审核通过后**：
   - ✅ 允许编辑非核心字段（备注、交货日期、优先级等）
   - ❌ 禁止编辑核心字段（产品、工序、版选择、数量等）
   - ✅ 如果必须修改核心字段，需要管理员权限或重新审核流程

2. **审核拒绝后**：
   - ✅ 允许编辑所有字段
   - ✅ 修改后自动重置为 `pending`（当前已实现）

3. **待审核状态**：
   - ✅ 允许编辑所有字段

### 5.2 实现建议

#### 5.2.1 字段分类定义

**核心字段列表**（建议配置化）：
```python
# 在 settings.py 或 models.py 中定义
APPROVED_ORDER_PROTECTED_FIELDS = [
    'customer',
    'products_data',
    'processes',
    'artworks',
    'dies',
    'foiling_plates',
    'embossing_plates',
    'printing_type',
    'printing_cmyk_colors',
    'printing_other_colors',
    'production_quantity',
    'total_amount',
]
```

#### 5.2.2 权限设计

**新增权限**：
- `workorder.change_approved_workorder` - 允许编辑已审核订单的核心字段
- 默认只有管理员或特殊角色拥有此权限

#### 5.2.3 编辑记录

**建议**：记录审核通过后的编辑操作
- 创建 `WorkOrderEditLog` 模型，记录编辑历史
- 包含：编辑人、编辑时间、编辑字段、编辑前值、编辑后值
- 用于审计追踪

### 5.3 用户体验优化

1. **清晰的提示信息**：
   - 在编辑页面明确显示哪些字段可以编辑，哪些不能编辑
   - 说明为什么不能编辑（已审核通过）
   - 提供解决方案（联系管理员或重新审核）

2. **字段禁用样式**：
   - 禁用的字段使用灰色背景
   - 添加锁定图标
   - 鼠标悬停时显示提示信息

3. **编辑确认**：
   - 如果用户尝试修改核心字段，显示确认对话框
   - 说明修改后需要重新审核
   - 记录编辑操作

## 六、实施建议

### 6.1 短期实施（1-2周）

1. ⚠️ **在序列化器中添加字段编辑限制**
   - 检查审核状态
   - 限制核心字段编辑
   - 提供清晰的错误提示

2. ⚠️ **在前端添加字段禁用逻辑**
   - 根据审核状态禁用核心字段
   - 显示提示信息
   - 优化用户体验

3. ⚠️ **添加权限检查**
   - 创建 `change_approved_workorder` 权限
   - 在视图中检查权限

### 6.2 中期实施（1-2月）

1. ⚠️ **创建编辑历史记录**
   - 创建 `WorkOrderEditLog` 模型
   - 记录审核通过后的编辑操作
   - 支持编辑历史查询

2. ⚠️ **配置化字段分类**
   - 将核心字段列表配置化
   - 支持动态调整字段分类

### 6.3 长期实施（3-6月）

1. ⚠️ **完整的变更管理流程**
   - 支持变更申请
   - 变更审批流程
   - 变更历史追踪

## 七、总结

### 7.1 核心结论

**已审核订单的编辑权限应该根据字段类型进行区分**：

1. **核心字段**：审核通过后禁止编辑（除非有特殊权限）
2. **非核心字段**：审核通过后允许编辑
3. **审核拒绝后**：允许编辑所有字段，修改后重新审核

### 7.2 推荐方案

**采用"部分字段可编辑 + 重新审核机制"**：
- 平衡了灵活性和数据完整性
- 符合大多数业务场景的需求
- 实现相对简单，易于维护

### 7.3 实施优先级

1. **高优先级**：添加核心字段编辑限制
2. **中优先级**：创建编辑历史记录
3. **低优先级**：完整的变更管理流程

