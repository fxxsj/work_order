# 采购管理模块说明

**创建时间**：2026-01-10
**文档版本**：v1.0
**模块状态**：✅ 已完成

---

## 一、模块概述

采购管理模块是为解决物料不足问题而添加的核心功能模块，完善了施工单管理系统的物料供应链管理。该模块提供了完整的采购流程管理，包括供应商管理、采购单管理、库存预警等功能。

### 1.1 设计目标

1. **完善物料不足处理流程**：解决文档中提到的"物料不足时的逻辑未完善"问题
2. **提供库存预警机制**：自动检测库存不足的物料并提示采购
3. **标准化采购流程**：从申请到收货的完整采购流程管理
4. **供应商管理**：维护供应商信息及物料供应关系

### 1.2 核心功能

- ✅ 供应商管理（增删改查）
- ✅ 物料供应商关联（一个物料可从多个供应商采购）
- ✅ 采购单管理（创建、提交、审核、下单、收货、取消）
- ✅ 采购单明细管理（支持多个物料的采购）
- ✅ 库存预警（自动检测库存不足的物料）
- ✅ 库存自动更新（收货时自动增加物料库存）
- ✅ 采购流程通知（提交、批准、拒绝、收货等状态变化通知）
- ✅ 与施工单关联（采购单可关联到具体施工单）

---

## 二、数据模型设计

### 2.1 供应商模型（Supplier）

```python
class Supplier(models.Model):
    name = models.CharField('供应商名称', max_length=200)
    code = models.CharField('供应商编码', max_length=50, unique=True)
    contact_person = models.CharField('联系人', max_length=100, blank=True)
    phone = models.CharField('联系电话', max_length=50, blank=True)
    email = models.EmailField('邮箱', blank=True)
    address = models.TextField('地址', blank=True)
    status = models.CharField('状态', max_length=20, choices=[('active', '启用'), ('inactive', '停用')], default='active')
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
```

**字段说明**：
- `code`：唯一编码，用于标识供应商
- `status`：启用/停用状态，停用的供应商在创建采购单时不可选

### 2.2 物料供应商关联（MaterialSupplier）

```python
class MaterialSupplier(models.Model):
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='物料')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, verbose_name='供应商')
    supplier_code = models.CharField('供应商物料编码', max_length=100, blank=True)
    supplier_price = models.DecimalField('供应商价格', max_digits=10, decimal_places=2)
    is_preferred = models.BooleanField('首选供应商', default=False)
    min_order_quantity = models.DecimalField('最小起订量', max_digits=10, decimal_places=2, default=1)
    lead_time_days = models.IntegerField('采购周期（天）', default=7)
    notes = models.TextField('备注', blank=True)
```

**功能说明**：
- 实现物料与供应商的多对多关系
- 记录每个供应商提供的物料价格
- 标记首选供应商（默认采购选择）
- 记录最小起订量和采购周期

### 2.3 采购单模型（PurchaseOrder）

```python
class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('submitted', '已提交'),
        ('approved', '已批准'),
        ('ordered', '已下单'),
        ('received', '已收货'),
        ('cancelled', '已取消'),
    ]

    order_number = models.CharField('采购单号', max_length=50, unique=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, verbose_name='供应商')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    total_amount = models.DecimalField('总金额', max_digits=12, decimal_places=2, default=0)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='submitted_purchase_orders', verbose_name='提交人')
    submitted_at = models.DateTimeField('提交时间', null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     related_name='approved_purchase_orders', verbose_name='审核人')
    approved_at = models.DateTimeField('审核时间', null=True, blank=True)
    ordered_date = models.DateField('下单日期', null=True, blank=True)
    expected_date = models.DateField('预计到货日期', null=True, blank=True)
    actual_received_date = models.DateField('实际到货日期', null=True, blank=True)
    work_order = models.ForeignKey('WorkOrder', on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='purchase_orders', verbose_name='关联施工单')
    notes = models.TextField('备注', blank=True)
    rejection_reason = models.TextField('拒绝原因', blank=True)
```

**采购单状态流程**：
1. **草稿**：创建采购单后的初始状态
2. **已提交**：提交审核后
3. **已批准**：审核通过后，或被拒绝后重新提交并通过
4. **已下单**：确认向供应商下单后
5. **已收货**：所有明细都收货完成后
6. **已取消**：采购单被取消

### 2.4 采购单明细模型（PurchaseOrderItem）

```python
class PurchaseOrderItem(models.Model):
    STATUS_CHOICES = [
        ('pending', '待收货'),
        ('partial', '部分收货'),
        ('received', '已收货'),
    ]

    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE,
                                      related_name='items', verbose_name='采购单')
    material = models.ForeignKey(Material, on_delete=models.PROTECT, verbose_name='物料')
    quantity = models.DecimalField('采购数量', max_digits=10, decimal_places=2)
    received_quantity = models.DecimalField('已收货数量', max_digits=10, decimal_places=2, default=0)
    unit_price = models.DecimalField('单价', max_digits=10, decimal_places=2)
    supplier_code = models.CharField('供应商物料编码', max_length=100, blank=True)
    status = models.CharField('收货状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    work_order_material = models.ForeignKey('WorkOrderMaterial', on_delete=models.SET_NULL,
                                           null=True, blank=True, verbose_name='关联施工单物料')
```

**属性**：
- `subtotal`：小计金额（quantity * unit_price）
- `remaining_quantity`：剩余需要收货的数量（quantity - received_quantity）

### 2.5 物料模型扩展

在原有的 `Material` 模型中新增了以下字段：

```python
# 库存预警设置
min_stock_quantity = models.DecimalField('最小库存', max_digits=10, decimal_places=2, default=0)
# 采购相关
default_supplier = models.ForeignKey('Supplier', on_delete=models.SET_NULL, null=True, blank=True)
lead_time_days = models.IntegerField('采购周期（天）', default=7)
updated_at = models.DateTimeField('更新时间', auto_now=True)
```

**新增方法**：
- `is_low_stock()`：检查库存是否不足
- `get_needed_quantity(required_quantity)`：获取需要采购的数量

---

## 三、后端视图和 API

### 3.1 供应商管理（SupplierViewSet）

**API 端点**：`/api/suppliers/`

**支持的操作**：
- `GET /api/suppliers/`：获取供应商列表
- `POST /api/suppliers/`：创建供应商
- `GET /api/suppliers/{id}/`：获取供应商详情
- `PUT /api/suppliers/{id}/`：更新供应商
- `DELETE /api/suppliers/{id}/`：删除供应商

**筛选参数**：
- `search`：搜索供应商名称或编码
- `status`：按状态筛选（active/inactive）

### 3.2 物料供应商关联（MaterialSupplierViewSet）

**API 端点**：`/api/material-suppliers/`

**支持的操作**：
- `GET /api/material-suppliers/`：获取物料供应商关联列表
- `POST /api/material-suppliers/`：创建物料供应商关联
- `PUT /api/material-suppliers/{id}/`：更新关联
- `DELETE /api/material-suppliers/{id}/`：删除关联

**筛选参数**：
- `material`：按物料筛选
- `supplier`：按供应商筛选
- `is_preferred`：按首选筛选

### 3.3 采购单管理（PurchaseOrderViewSet）

**API 端点**：`/api/purchase-orders/`

**基础操作**：
- `GET /api/purchase-orders/`：获取采购单列表
- `POST /api/purchase-orders/`：创建采购单
- `GET /api/purchase-orders/{id}/`：获取采购单详情
- `PUT /api/purchase-orders/{id}/`：更新采购单
- `DELETE /api/purchase-orders/{id}/`：删除采购单

**自定义操作**：

#### 提交采购单
```
POST /api/purchase-orders/{id}/submit/
```
- 将采购单状态从"草稿"改为"已提交"
- 自动设置提交人和提交时间
- 创建通知给有审核权限的用户

#### 审核通过
```
POST /api/purchase-orders/{id}/approve/
```
- 将采购单状态从"已提交"改为"已批准"
- 自动设置审核人和审核时间
- 创建通知给采购单创建人

#### 拒绝采购单
```
POST /api/purchase-orders/{id}/reject/
```
- 需要提供拒绝原因（`rejection_reason`）
- 将采购单状态改为"草稿"
- 创建通知给采购单创建人

#### 确认下单
```
POST /api/purchase-orders/{id}/place_order/
```
- 将采购单状态从"已批准"改为"已下单"
- 可选参数：
  - `ordered_date`：下单日期
  - `expected_date`：预计到货日期

#### 收货
```
POST /api/purchase-orders/{id}/receive/
```
- 批量收货采购单的多个明细
- 参数格式：
```json
{
  "items": [
    {"id": 1, "received_quantity": 100},
    {"id": 2, "received_quantity": 50}
  ]
}
```
- 自动更新物料库存
- 自动更新收货状态

#### 取消采购单
```
POST /api/purchase-orders/{id}/cancel/
```
- 将采购单状态改为"已取消"
- 只能取消草稿、已提交或已批准状态的采购单

#### 获取库存不足物料
```
GET /api/purchase-orders/low_stock_materials/
```
- 返回所有库存不足的物料列表
- 包含当前库存、最小库存、需要采购数量、默认供应商等信息

### 3.4 采购单明细管理（PurchaseOrderItemViewSet）

**API 端点**：`/api/purchase-order-items/`

**基础操作**：
- `GET /api/purchase-order-items/`：获取采购单明细列表
- `POST /api/purchase-order-items/`：创建采购单明细
- `PUT /api/purchase-order-items/{id}/`：更新明细
- `DELETE /api/purchase-order-items/{id}/`：删除明细

**自定义操作**：

#### 单独收货明细
```
POST /api/purchase-order-items/{id}/receive/
```
- 单独收货某个明细
- 参数：`{"received_quantity": 100}`
- 自动更新物料库存

---

## 四、前端页面

### 4.1 供应商列表页

**路由**：`/suppliers`
**组件位置**：`frontend/src/views/supplier/List.vue`

**功能特性**：
- 供应商列表展示（编码、名称、联系人、电话、邮箱、状态等）
- 搜索功能（按供应商名称或编码）
- 状态筛选（启用/停用）
- 新增供应商（弹窗表单）
- 编辑供应商（弹窗表单）
- 删除供应商（二次确认）
- 分页功能

**表单字段**：
- 供应商编码（必填，唯一）
- 供应商名称（必填）
- 联系人
- 联系电话（格式验证）
- 邮箱（格式验证）
- 地址
- 状态（启用/停用）
- 备注

### 4.2 采购单列表页

**路由**：`/purchase-orders`
**组件位置**：`frontend/src/views/purchase/List.vue`

**功能特性**：
- 采购单列表展示（采购单号、供应商、状态、明细数量、总金额、收货进度、提交人、创建时间等）
- 状态标签显示（不同颜色区分不同状态）
- 收货进度条（显示百分比）
- 搜索功能（按采购单号、供应商名称）
- 状态筛选（草稿、已提交、已批准、已下单、已收货、已取消）
- 新增采购单
- 查看采购单详情（弹窗）
- 编辑采购单（仅草稿状态）
- 提交采购单（仅草稿状态）
- 批准采购单（仅已提交状态）
- 拒绝采购单（仅已提交状态，需填写拒绝原因）
- 确认下单（仅已批准状态）
- 收货（仅已下单状态）
- 取消采购单（草稿、已提交、已批准状态）
- 库存预警（查看库存不足的物料）
- 分页功能

**创建/编辑采购单表单**：
- 供应商（必填，下拉选择）
- 关联施工单（显示施工单号，可选）
- 备注
- 采购明细列表
  - 物料（下拉选择，支持搜索）
  - 采购数量（数字输入）
  - 单价（数字输入，选择物料后自动填充物料单价）
  - 小计（自动计算）
  - 删除明细按钮
- 添加明细按钮
- 总金额（自动计算）

**查看采购单详情**：
- 基本信息（采购单号、供应商、状态、总金额等）
- 提交/审核信息（提交人、提交时间、审核人、审核时间）
- 采购时间（下单日期、预计到货日期、实际到货日期）
- 采购明细列表
  - 物料信息（名称、编码）
  - 采购数量、已收货数量
  - 单价、小计
  - 收货状态
  - 备注

**库存预警对话框**：
- 显示所有库存不足的物料列表
- 包含当前库存、最小库存、需要采购数量、默认供应商
- 支持从库存预警创建采购单（简化处理，跳转到新增页面）

---

## 五、业务流程

### 5.1 采购单创建流程

```
1. 创建采购单
   ├─ 选择供应商
   ├─ 添加采购明细（物料、数量、单价）
   ├─ 保存为草稿
   └─ 可选择关联到具体施工单

2. 提交审核
   ├─ 从草稿状态提交
   ├─ 自动设置提交人和提交时间
   └─ 创建通知给有审核权限的用户

3. 审核采购单
   ├─ 审核通过
   │  ├─ 状态变为"已批准"
   │  ├─ 自动设置审核人和审核时间
   │  └─ 创建通知给采购单创建人
   └─ 审核拒绝
      ├─ 必须填写拒绝原因
      ├─ 状态变为"草稿"
      └─ 创建通知给采购单创建人

4. 确认下单
   ├─ 从"已批准"状态下单
   ├─ 设置下单日期
   ├─ 设置预计到货日期
   └─ 状态变为"已下单"

5. 收货
   ├─ 批量或单独收货明细
   ├─ 输入实际收货数量
   ├─ 自动更新物料库存
   ├─ 更新明细收货状态
   └─ 所有明细收货完成后状态变为"已收货"

6. 取消采购单（可选）
   ├─ 只能取消草稿、已提交或已批准状态的采购单
   └─ 状态变为"已取消"
```

### 5.2 库存预警流程

```
1. 系统检测
   ├─ 自动扫描所有物料
   └─ 识别库存不足的物料（stock_quantity < min_stock_quantity）

2. 查看预警
   ├─ 用户点击"库存预警"按钮
   └─ 查看所有库存不足的物料列表

3. 创建采购单
   ├─ 从库存预警创建采购单
   ├─ 选择供应商（优先使用默认供应商）
   ├─ 自动填充物料信息
   ├─ 设置采购数量（至少补充到最小库存）
   └─ 提交审核
```

### 5.3 与施工单的集成

```
施工单创建时：
├─ 添加施工单物料（WorkOrderMaterial）
├─ 检查物料库存是否充足
├─ 如库存不足，提示用户
└─ 可选择创建采购单

采购单创建时：
├─ 可关联到具体施工单
└─ 便于追踪采购目的

采购单收货后：
├─ 自动更新物料库存
└─ 施工单物料状态可更新为"已回料"
```

---

## 六、通知机制

采购管理模块扩展了通知系统，新增了以下通知类型：

1. **purchase_order_submitted**：采购单待审核
   - 触发：采购单提交审核时
   - 接收人：有审核权限的用户
   - 优先级：normal

2. **purchase_order_approved**：采购单已批准
   - 触发：采购单审核通过时
   - 接收人：采购单创建人
   - 优先级：normal

3. **purchase_order_rejected**：采购单已拒绝
   - 触发：采购单被拒绝时
   - 接收人：采购单创建人
   - 优先级：high

4. **purchase_order_received**：采购单已收货
   - 触发：采购单全部收货完成时
   - 接收人：采购单创建人、施工单创建人（如关联施工单）
   - 优先级：normal

5. **low_stock_warning**：库存不足预警
   - 触发：手动查看库存预警时
   - 接收人：用户自己
   - 优先级：high

---

## 七、权限控制

### 7.1 供应商管理

- **查看**：所有登录用户
- **创建/编辑/删除**：需要 `add_supplier`、`change_supplier`、`delete_supplier` 权限

### 7.2 采购单管理

- **查看**：所有登录用户
- **创建**：需要 `add_purchaseorder` 权限
- **编辑**：需要 `change_purchaseorder` 权限（仅草稿状态）
- **删除**：需要 `delete_purchaseorder` 权限
- **提交**：采购单创建人或有 `change_purchaseorder` 权限的用户
- **审核**：需要 `change_purchaseorder` 权限
- **下单/收货/取消**：需要 `change_purchaseorder` 权限

### 7.3 采购单明细管理

- **查看**：所有登录用户
- **创建/编辑/删除**：需要 `add_purchaseorderitem`、`change_purchaseorderitem`、`delete_purchaseorderitem` 权限

---

## 八、数据迁移

### 8.1 迁移文件

**文件路径**：`backend/workorder/migrations/0015_add_purchase_management.py`

**迁移内容**：
1. 扩展 `Material` 模型
   - 添加 `min_stock_quantity` 字段
   - 添加 `default_supplier` 外键
   - 添加 `lead_time_days` 字段
   - 添加 `updated_at` 字段

2. 创建 `Supplier` 模型

3. 创建 `MaterialSupplier` 模型

4. 创建 `PurchaseOrder` 模型

5. 创建 `PurchaseOrderItem` 模型

6. 更新 `Notification` 模型
   - 新增采购相关通知类型
   - 添加 `purchase_order` 外键

### 8.2 执行迁移

```bash
cd backend
python manage.py migrate
```

---

## 九、使用说明

### 9.1 初始化数据

1. 创建供应商
   - 进入"供应商管理"页面
   - 点击"新增供应商"
   - 填写供应商信息
   - 保存

2. 配置物料供应商
   - 进入"物料管理"页面
   - 编辑物料
   - 设置"默认供应商"
   - 或进入"物料供应商关联"页面创建多个供应商关联

3. 设置物料最小库存
   - 编辑物料
   - 设置"最小库存"数量
   - 系统将自动检测库存不足

### 9.2 创建采购单

1. 进入"采购单管理"页面
2. 点击"新增采购单"
3. 选择供应商
4. 添加采购明细
   - 选择物料
   - 输入采购数量
   - 确认单价
   - 继续添加其他物料
5. 填写备注（可选）
6. 点击"确定"保存

### 9.3 提交和审核

1. 从采购单列表找到要提交的采购单
2. 点击"提交"按钮
3. 有审核权限的用户会收到通知
4. 审核用户进入采购单详情
5. 点击"批准"或"拒绝"
   - 如拒绝，需填写拒绝原因
6. 采购单创建人会收到审核结果通知

### 9.4 收货

1. 采购单批准后，点击"下单"按钮
2. 设置下单日期和预计到货日期
3. 物料到达后，点击"收货"按钮
4. 输入每个明细的实际收货数量
5. 系统自动更新物料库存
6. 所有明细收货完成后，采购单状态变为"已收货"

---

## 十、后续优化建议

### 10.1 短期优化

1. **采购单导出**
   - 支持导出采购单列表为 Excel
   - 支持导出单个采购单详情为 PDF

2. **采购单模板**
   - 支持保存常用采购单配置为模板
   - 快速创建相似的采购单

3. **批量采购**
   - 支持将多个施工单的物料合并为一个采购单
   - 支持批量创建采购单

### 10.2 中期优化

1. **供应商评价系统**
   - 评价供应商的服务质量
   - 记录供应商的交货准时率
   - 物料质量评价

2. **采购分析**
   - 采购成本分析
   - 供应商采购量统计
   - 物料采购频率分析

3. **自动补货建议**
   - 基于历史消耗数据计算安全库存
   - 自动生成补货建议
   - 预测未来需求

### 10.3 长期优化

1. **供应商门户**
   - 供应商在线查看采购单
   - 供应商在线确认订单
   - 供应商上传发货信息

2. **智能采购**
   - 基于机器学习预测物料需求
   - 智能推荐供应商
   - 优化采购时机和批量

3. **集成ERP系统**
   - 与财务系统集成
   - 与仓储系统集成
   - 自动对账

---

## 十一、问题解决

### 11.1 解决的核心问题

根据 `SYSTEM_USAGE_ANALYSIS.md` 文档分析，本模块主要解决了以下问题：

1. **物料不足时的逻辑未完善** ✅
   - 完整的采购流程管理
   - 库存预警机制
   - 自动更新物料库存

2. **缺少采购管理模块** ✅
   - 供应商管理
   - 采购单管理
   - 采购明细管理

3. **物料供应链管理缺失** ✅
   - 物料与供应商关联
   - 采购周期管理
   - 采购价格管理

### 11.2 与现有系统的集成

1. **物料管理**
   - 扩展物料模型，添加采购相关字段
   - 保持向后兼容

2. **施工单管理**
   - 采购单可关联到施工单
   - 便于追踪采购目的

3. **通知系统**
   - 扩展通知类型
   - 支持采购相关通知

4. **权限系统**
   - 使用 Django 模型权限
   - 与现有权限体系一致

---

## 十二、技术实现亮点

1. **采购单号自动生成**
   - 格式：PO + yyyymmdd + 4位序号
   - 使用事务保证并发安全

2. **库存自动更新**
   - 收货时自动增加物料库存
   - 保证数据一致性

3. **状态机管理**
   - 清晰的采购单状态流转
   - 每个状态有对应的操作权限

4. **通知集成**
   - 采购流程各环节自动通知
   - 支持优先级设置

5. **前端用户体验**
   - 清晰的表格展示
   - 友好的表单交互
   - 实时进度显示

---

## 十三、总结

采购管理模块的成功添加，完善了施工单管理系统的物料供应链管理，解决了文档中提到的"物料不足时的逻辑未完善"问题。该模块提供了完整的采购流程管理，从申请到收货的全流程跟踪，并提供了库存预警机制，确保物料库存充足。

该模块与现有系统无缝集成，保持了良好的兼容性和一致性，为后续的功能扩展奠定了基础。
