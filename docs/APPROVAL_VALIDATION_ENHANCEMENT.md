# 审核前验证功能增强

**实现时间**：2026-01-09  
**实现位置**：`backend/workorder/models.py` (validate_before_approval 方法）  
**文档版本**：v1.0

---

## 概述

根据 `WORKORDER_FLOW_ANALYSIS.md` 文档分析，对施工单审核前验证功能进行了全面增强，从原有的基础验证扩展为包含物料、数量、日期、工序顺序等6个方面的全面验证。

---

## 增强内容

### 1. 基础信息验证（原有）

#### 客户信息验证
```python
if not self.customer:
    errors.append('缺少客户信息')
```

#### 产品信息验证
```python
if not self.products.exists():
    errors.append('缺少产品信息')
```

#### 工序信息验证
```python
if not self.order_processes.exists():
    errors.append('缺少工序信息')
```

#### 交货日期验证
```python
if not self.delivery_date:
    errors.append('缺少交货日期')
```

---

### 2. 版与工序匹配验证（原有）

#### 图稿验证
```python
processes_requiring_artwork = processes.filter(requires_artwork=True, artwork_required=True)
if processes_requiring_artwork.exists() and not self.artworks.exists():
    process_names = ', '.join([p.name for p in processes_requiring_artwork])
    errors.append(f'选择了需要图稿的工序（{process_names}），请至少选择一个图稿')
```

#### 刀模验证
```python
processes_requiring_die = processes.filter(requires_die=True, die_required=True)
if processes_requiring_die.exists() and not self.dies.exists():
    process_names = ', '.join([p.name for p in processes_requiring_die])
    errors.append(f'选择了需要刀模的工序（{process_names}），请至少选择一个刀模')
```

#### 烫金版验证
```python
processes_requiring_foiling_plate = processes.filter(requires_foiling_plate=True, foiling_plate_required=True)
if processes_requiring_foiling_plate.exists() and not self.foiling_plates.exists():
    process_names = ', '.join([p.name for p in processes_requiring_foiling_plate])
    errors.append(f'选择了需要烫金版的工序（{process_names}），请至少选择一个烫金版')
```

#### 压凸版验证
```python
processes_requiring_embossing_plate = processes.filter(requires_embossing_plate=True, embossing_plate_required=True)
if processes_requiring_embossing_plate.exists() and not self.embossing_plates.exists():
    process_names = ', '.join([p.name for p in processes_requiring_embossing_plate])
    errors.append(f'选择了需要压凸版的工序（{process_names}），请至少选择一个压凸版')
```

---

### 3. 数量验证（新增）✨

#### 生产数量验证
```python
if self.production_quantity is None:
    errors.append('缺少生产数量')
elif self.production_quantity <= 0:
    errors.append(f'生产数量必须大于0，当前值为{self.production_quantity}')
```

#### 产品数量总和验证
```python
if self.products.exists():
    total_product_quantity = sum([p.quantity or 0 for p in self.products.all()])
    if total_product_quantity <= 0:
        errors.append(f'产品数量总和必须大于0，当前总和为{total_product_quantity}')
```

**功能说明**：
- 检查生产数量是否填写
- 检查生产数量是否大于0
- 检查产品数量总和是否大于0
- 防止无效的施工单提交审核

---

### 4. 日期验证（新增）✨

#### 交货日期与下单日期比较
```python
if self.delivery_date and self.order_date:
    if self.delivery_date < self.order_date:
        errors.append(f'交货日期不能早于下单日期。交货日期：{self.delivery_date}，下单日期：{self.order_date}')
```

#### 交货日期不能早于今天
```python
from django.utils import timezone
today = timezone.now().date()
if self.delivery_date and self.delivery_date < today:
    errors.append(f'交货日期不能早于今天。交货日期：{self.delivery_date}，今天：{today}')
```

**功能说明**：
- 防止交货日期早于下单日期
- 防止交货日期早于今天（允许今天）
- 确保日期逻辑合理

---

### 5. 物料验证（新增）✨

#### 开料物料用量验证
```python
if self.materials.exists():
    for material_item in self.materials.all():
        if material_item.need_cutting and not material_item.material_usage:
            errors.append(f'物料"{material_item.material.name}"需要开料，请填写物料用量')
```

**功能说明**：
- 检查标记为"需要开料"的物料是否填写了用量
- 确保开料任务能够正确计算生产数量
- 防止物料信息不完整

---

### 6. 工序顺序验证（新增）✨

#### 制版与印刷工序顺序验证
```python
# 获取制版和印刷工序的顺序
processes_ordered = self.order_processes.filter(
    process__code__in=['CTP', 'PRT']
).select_related('process').order_by('sequence')

ctp_sequence = None
prt_sequence = None
for wp in processes_ordered:
    if wp.process.code == 'CTP':
        ctp_sequence = wp.sequence
    elif wp.process.code == 'PRT':
        prt_sequence = wp.sequence

if ctp_sequence is not None and prt_sequence is not None:
    if ctp_sequence > prt_sequence:
        errors.append('制版工序（CTP）应该在印刷工序（PRT）之前，请调整工序顺序')
```

#### 开料与印刷工序顺序验证
```python
cut_sequence = None
for wp in processes_ordered:
    if wp.process.code == 'CUT':
        cut_sequence = wp.sequence

if cut_sequence is not None and prt_sequence is not None:
    if cut_sequence > prt_sequence:
        errors.append('开料工序（CUT）应该在印刷工序（PRT）之前，请调整工序顺序')
```

**功能说明**：
- 验证制版工序是否在印刷工序之前
- 验证开料工序是否在印刷工序之前
- 确保工序顺序符合生产逻辑
- 提示用户调整不合理的工序顺序

---

## 验证规则总结

### 验证优先级

验证按以下顺序执行，任何一项失败都会阻止审核通过：

1. **基础信息验证**（必须项）
   - 客户信息 ✅
   - 产品信息 ✅
   - 工序信息 ✅
   - 交货日期 ✅

2. **版与工序匹配验证**（必须项）
   - 图稿 ✅
   - 刀模 ✅
   - 烫金版 ✅
   - 压凸版 ✅

3. **数量验证**（新增）
   - 生产数量 ✨
   - 产品数量总和 ✨

4. **日期验证**（新增）
   - 交货日期 vs 下单日期 ✨
   - 交货日期 vs 今天 ✨

5. **物料验证**（新增）
   - 开料物料用量 ✨

6. **工序顺序验证**（新增）
   - 制版 vs 印刷 ✨
   - 开料 vs 印刷 ✨

### 验证规则说明

| 验证类型 | 验证规则 | 错误提示 | 优先级 |
|---------|---------|---------|--------|
| **客户信息** | 客户不能为空 | 缺少客户信息 | 高 |
| **产品信息** | 至少有一个产品 | 缺少产品信息 | 高 |
| **工序信息** | 至少有一个工序 | 缺少工序信息 | 高 |
| **交货日期** | 交货日期不能为空 | 缺少交货日期 | 高 |
| **图稿匹配** | 需要图稿的工序必须有图稿 | 选择了需要图稿的工序...，请至少选择一个图稿 | 高 |
| **刀模匹配** | 需要刀模的工序必须有刀模 | 选择了需要刀模的工序...，请至少选择一个刀模 | 高 |
| **烫金版匹配** | 需要烫金版的工序必须有烫金版 | 选择了需要烫金版的工序...，请至少选择一个烫金版 | 高 |
| **压凸版匹配** | 需要压凸版的工序必须有压凸版 | 选择了需要压凸版的工序...，请至少选择一个压凸版 | 高 |
| **生产数量** | 必须填写且大于0 | 缺少生产数量 / 生产数量必须大于0 | 中 |
| **产品数量** | 数量总和必须大于0 | 产品数量总和必须大于0 | 中 |
| **日期逻辑** | 交货日期不能早于下单日期 | 交货日期不能早于下单日期 | 中 |
| **日期合理性** | 交货日期不能早于今天 | 交货日期不能早于今天 | 中 |
| **物料用量** | 需要开料的物料必须填写用量 | 物料"xxx"需要开料，请填写物料用量 | 中 |
| **制版顺序** | 制版应该在印刷之前 | 制版工序（CTP）应该在印刷工序（PRT）之前 | 低 |
| **开料顺序** | 开料应该在印刷之前 | 开料工序（CUT）应该在印刷工序（PRT）之前 | 低 |

---

## 使用示例

### 示例1：验证通过的场景

```python
work_order = WorkOrder.objects.get(order_number='202601001')
errors = work_order.validate_before_approval()
print(errors)  # 输出：[]
```

**结果**：所有验证通过，可以提交审核。

### 示例2：生产数量缺失

```python
work_order = WorkOrder.objects.get(order_number='202601002')
work_order.production_quantity = None
errors = work_order.validate_before_approval()
print(errors)  
# 输出：['缺少生产数量']
```

**结果**：提示填写生产数量，无法提交审核。

### 示例3：工序顺序不合理

```python
work_order = WorkOrder.objects.get(order_number='202601003')
# 假设印刷工序的 sequence=10，制版工序的 sequence=20
errors = work_order.validate_before_approval()
print(errors)
# 输出：['制版工序（CTP）应该在印刷工序（PRT）之前，请调整工序顺序']
```

**结果**：提示调整工序顺序，无法提交审核。

### 示例4：物料用量缺失

```python
work_order = WorkOrder.objects.get(order_number='202601004')
# 假设有一个物料标记为需要开料，但未填写用量
material_item = work_order.materials.first()
material_item.need_cutting = True
material_item.material_usage = ''  # 未填写用量
errors = work_order.validate_before_approval()
print(errors)
# 输出：['物料"纸张"需要开料，请填写物料用量']
```

**结果**：提示填写物料用量，无法提交审核。

---

## 错误提示优化

### 1. 具体化提示

所有错误提示都包含具体信息：
- 包含具体的施工单字段名
- 包含当前的错误值（如日期、数量）
- 包含正确的期望值
- 提供明确的修正建议

### 2. 分类提示

错误提示按验证类型分类：
- 基础信息类：缺少客户信息、缺少产品信息等
- 匹配类：选择了需要xxx的工序，请至少选择一个xxx
- 数量类：生产数量必须大于0、产品数量总和必须大于0
- 日期类：交货日期不能早于xxx
- 物料类：物料"xxx"需要开料，请填写物料用量
- 顺序类：xxx工序应该在xxx工序之前，请调整工序顺序

### 3. 用户友好

- 使用中文提示
- 通俗易懂的错误描述
- 明确的修正指导
- 避免技术术语

---

## 集成方式

### 1. 审核接口调用

在 `views.py` 的 `approve` 接口中调用：

```python
@action(detail=True, methods=['post'])
def approve(self, request, pk=None):
    work_order = self.get_object()
    
    # 审核前数据完整性检查
    validation_errors = work_order.validate_before_approval()
    if validation_errors:
        return Response(
            {'error': '施工单数据不完整，无法审核', 'details': validation_errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # ... 继续审核逻辑
```

### 2. 前端显示

前端接收到验证错误后，可以：

```javascript
if (response.data.error === '施工单数据不完整，无法审核') {
    // 显示错误详情
    response.data.details.forEach(error => {
        showError(error)
    })
    
    // 高亮对应字段
    highlightFields(response.data.details)
}
```

---

## 测试建议

### 1. 单元测试

为每个验证规则编写单元测试：

```python
class TestWorkOrderValidation(TestCase):
    def test_production_quantity_required(self):
        """测试生产数量必填"""
        work_order = WorkOrder.objects.create(
            customer=self.customer,
            production_quantity=None  # 未填写生产数量
        )
        errors = work_order.validate_before_approval()
        self.assertIn('缺少生产数量', errors)
    
    def test_production_quantity_must_be_positive(self):
        """测试生产数量必须大于0"""
        work_order = WorkOrder.objects.create(
            customer=self.customer,
            production_quantity=-10  # 生产数量小于0
        )
        errors = work_order.validate_before_approval()
        self.assertIn('生产数量必须大于0', errors)
    
    def test_delivery_date_after_order_date(self):
        """测试交货日期不能早于下单日期"""
        work_order = WorkOrder.objects.create(
            customer=self.customer,
            order_date='2026-01-10',
            delivery_date='2026-01-05'  # 交货日期早于下单日期
        )
        errors = work_order.validate_before_approval()
        self.assertIn('交货日期不能早于下单日期', errors)
    
    # ... 更多测试用例
```

### 2. 集成测试

测试完整的审核流程：

```python
class TestWorkOrderApproval(TestCase):
    def test_approval_with_valid_data(self):
        """测试数据完整时可以通过审核"""
        work_order = self.create_valid_work_order()
        errors = work_order.validate_before_approval()
        self.assertEqual(len(errors), 0)
    
    def test_approval_with_invalid_date(self):
        """测试日期不正确时无法通过审核"""
        work_order = self.create_work_order_with_invalid_date()
        errors = work_order.validate_before_approval()
        self.assertGreater(len(errors), 0)
```

---

## 性能影响

### 1. 查询优化

所有验证都使用了高效的查询：
- 使用 `exists()` 而不是 `count()`
- 使用 `select_related()` 减少查询次数
- 避免了N+1查询问题

### 2. 缓存建议

可以考虑缓存以下数据：
- 工序的 `requires_xxx` 字段
- 用户的权限信息

---

## 未来优化方向

### 1. 可配置验证规则

将验证规则配置化，允许用户自定义：

```python
class WorkOrderValidationRule(models.Model):
    rule_name = models.CharField('规则名称')
    rule_type = models.CharField('规则类型')
    rule_expression = models.TextField('规则表达式')
    is_active = models.BooleanField('是否启用', default=True)
```

### 2. 实时验证

在前端添加实时验证提示：

```javascript
watch: {
    'work_order.production_quantity'(newVal) {
        if (newVal <= 0) {
            showWarning('生产数量必须大于0')
        }
    }
}
```

### 3. 验证模板

支持不同产品类型的验证模板：

```python
VALIDATION_TEMPLATES = {
    'standard': ['basic', 'plates', 'quantity', 'date'],
    'custom': ['basic', 'plates', 'custom_fields'],
}
```

---

## 相关文档

- [施工单流程分析](./WORKORDER_FLOW_ANALYSIS.md) - 完整的流程分析
- [施工单逻辑分析](./WORKORDER_LOGIC_ANALYSIS.md) - 核心逻辑说明
- [工序逻辑分析](./PROCESS_LOGIC_COMPREHENSIVE_ANALYSIS.md) - 工序相关逻辑

---

**实现人**：AI Assistant  
**审核状态**：待测试

