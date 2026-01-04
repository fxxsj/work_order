# Process（工序）模型字段说明

## 模型定义位置

`backend/workorder/models.py` - `Process` 类

## 字段清单

### 基础字段

| 字段名 | 类型 | 说明 | 必填 | 默认值 | 约束 |
|--------|------|------|------|--------|------|
| `name` | CharField | 工序名称 | ✅ | - | max_length=100 |
| `code` | CharField | 工序编码 | ✅ | - | max_length=50, unique=True |
| `description` | TextField | 工序描述 | ❌ | '' | blank=True |
| `standard_duration` | IntegerField | 标准工时(小时) | ❌ | 0 | - |
| `sort_order` | IntegerField | 排序 | ❌ | 0 | - |
| `is_active` | BooleanField | 是否启用 | ❌ | True | - |
| `task_generation_rule` | CharField | 任务生成规则 | ❌ | 'general' | max_length=20, choices=TASK_GENERATION_RULE_CHOICES |
| `created_at` | DateTimeField | 创建时间 | ✅ | auto_now_add | 自动设置 |

### 任务生成规则选项（task_generation_rule）

`task_generation_rule` 字段的可选值：

| 值 | 说明 | 用途 |
|---|---|---|
| `artwork` | 按图稿生成任务（每个图稿一个任务，数量为1） | 用于制版、印刷等工序 |
| `die` | 按刀模生成任务（每个刀模一个任务，数量为1） | 用于模切工序 |
| `product` | 按产品生成任务（每个产品一个任务） | 用于包装等工序 |
| `material` | 按物料生成任务（每个物料一个任务） | 用于采购、开料等工序 |
| `general` | 生成通用任务（一个工序一个任务） | 默认值，用于一般工序 |

### 字段详细说明

#### 1. name（工序名称）
- **类型**：CharField
- **长度限制**：100字符
- **必填**：是
- **说明**：工序的显示名称，如"印刷"、"模切"、"包装"等

#### 2. code（工序编码）
- **类型**：CharField
- **长度限制**：50字符
- **必填**：是
- **唯一性**：是（unique=True）
- **说明**：工序的唯一编码，用于标识工序，如"P001"、"PT003"等

#### 3. description（工序描述）
- **类型**：TextField
- **必填**：否
- **说明**：工序的详细描述信息，可以为空

#### 4. standard_duration（标准工时）
- **类型**：IntegerField
- **默认值**：0
- **必填**：否
- **说明**：该工序的标准工时（单位：小时），用于时间估算

#### 5. sort_order（排序）
- **类型**：IntegerField
- **默认值**：0
- **必填**：否
- **说明**：用于排序显示，数值越小越靠前

#### 6. is_active（是否启用）
- **类型**：BooleanField
- **默认值**：True
- **必填**：否
- **说明**：标识该工序是否启用，已禁用的工序不会在列表中选择

#### 7. task_generation_rule（任务生成规则）
- **类型**：CharField
- **长度限制**：20字符
- **默认值**：'general'
- **必填**：否
- **说明**：定义该工序在创建施工单时如何生成任务
- **选项**：见上表

#### 8. created_at（创建时间）
- **类型**：DateTimeField
- **必填**：自动设置
- **说明**：记录工序的创建时间，自动设置为当前时间

## Meta 配置

```python
class Meta:
    verbose_name = '工序'
    verbose_name_plural = '工序管理'
    ordering = ['sort_order', 'code']
```

- **排序规则**：默认按 `sort_order` 升序，然后按 `code` 升序排列
- **显示名称**：单数"工序"，复数"工序管理"

## 关联关系

### 反向关联（通过其他模型）

1. **WorkOrderProcess（施工单工序）**
   - 通过 `WorkOrderProcess.process` ForeignKey 关联
   - 一个工序可以被多个施工单使用

2. **Product.default_processes（产品默认工序）**
   - 通过 `Product.default_processes` ManyToManyField 关联
   - 一个工序可以关联到多个产品

### 字段验证规则

1. **code 唯一性**：数据库层面强制唯一约束
2. **name 和 code**：在 Django Admin 和表单中通常设为必填
3. **sort_order**：通常为非负整数

## 使用示例

### 创建工序

```python
from workorder.models import Process

# 创建普通工序
process = Process.objects.create(
    name='印刷',
    code='PT001',
    description='四色印刷',
    standard_duration=4,
    sort_order=10,
    is_active=True,
    task_generation_rule='general'
)

# 创建按图稿生成任务的工序（制版）
plate_process = Process.objects.create(
    name='出版制版',
    code='PR002',
    description='制作印刷版',
    standard_duration=1,
    sort_order=2,
    is_active=True,
    task_generation_rule='artwork'  # 按图稿生成任务
)
```

### 查询工序

```python
# 查询所有启用的工序，按排序和编码排序
active_processes = Process.objects.filter(is_active=True)

# 查询按图稿生成任务的工序
artwork_processes = Process.objects.filter(task_generation_rule='artwork')

# 查询特定编码的工序
process = Process.objects.get(code='PT001')
```

## 注意事项

1. **code 唯一性**：每个工序的编码必须唯一，创建前需要检查
2. **task_generation_rule**：选择不同的规则会影响任务生成的逻辑，需要根据实际业务需求选择
3. **is_active**：禁用工序不会从数据库中删除，只是不在列表中选择，历史数据仍然保留
4. **sort_order**：建议为不同类型的工序设置不同的排序范围，便于管理和显示

## 相关模型

- **WorkOrderProcess**：施工单工序关联表
- **WorkOrderTask**：施工单任务表（通过 WorkOrderProcess 间接关联）
- **Product**：产品模型（通过 default_processes 关联）

