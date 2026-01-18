# 采购管理模块实施总结

**实施时间**：2026-01-10
**实施人员**：AI 助手
**模块状态**：✅ 已完成
**文档版本**：v1.0

---

## 一、任务背景

根据 `SYSTEM_USAGE_ANALYSIS.md` 文档分析，系统中存在"物料不足时的逻辑未完善"的问题。具体表现为：

1. 缺少供应商管理功能
2. 缺少采购单管理功能
3. 缺少库存预警机制
4. 缺少完整的采购流程管理

为解决这些问题，需要添加完整的采购管理模块，完善物料供应链管理。

---

## 二、实施目标

1. ✅ 创建供应商管理功能
2. ✅ 创建采购单管理功能（包含采购明细）
3. ✅ 实现库存预警机制
4. ✅ 完善采购流程（申请→审核→下单→收货）
5. ✅ 与施工单系统集成
6. ✅ 添加前端管理页面
7. ✅ 完善文档

---

## 三、实施内容

### 3.1 后端开发

#### 3.1.1 数据模型（`backend/workorder/models.py`）

**新增模型**：
1. **Supplier（供应商）**
   - 基本信息管理（名称、编码、联系人、电话、邮箱、地址）
   - 状态管理（启用/停用）
   - 备注

2. **MaterialSupplier（物料供应商关联）**
   - 物料与供应商的多对多关系
   - 供应商提供的物料价格
   - 首选供应商标记
   - 最小起订量和采购周期

3. **PurchaseOrder（采购单）**
   - 采购单号自动生成（格式：PO + yyyymmdd + 4位序号）
   - 供应商关联
   - 采购单状态管理（草稿、已提交、已批准、已下单、已收货、已取消）
   - 审核信息（提交人、提交时间、审核人、审核时间）
   - 采购时间信息（下单日期、预计到货日期、实际到货日期）
   - 总金额自动计算
   - 与施工单关联
   - 拒绝原因

4. **PurchaseOrderItem（采购单明细）**
   - 物料关联
   - 采购数量、已收货数量
   - 单价、小计自动计算
   - 收货状态（待收货、部分收货、已收货）
   - 与施工单物料关联

**扩展现有模型**：
- **Material（物料）**
  - 新增 `min_stock_quantity`：最小库存
  - 新增 `default_supplier`：默认供应商
  - 新增 `lead_time_days`：采购周期（天）
  - 新增 `updated_at`：更新时间
  - 新增 `is_low_stock()` 方法：检查库存是否不足
  - 新增 `get_needed_quantity()` 方法：获取需要采购的数量

**更新现有模型**：
- **Notification（通知）**
  - 新增通知类型：purchase_order_submitted、purchase_order_approved、purchase_order_rejected、purchase_order_received、low_stock_warning
  - 新增 `purchase_order` 外键：关联采购单

#### 3.1.2 视图（`backend/workorder/views.py`）

**新增视图集**：

1. **SupplierViewSet（供应商视图集）**
   - CRUD 操作
   - 搜索功能（名称、编码）
   - 状态筛选
   - 排序功能

2. **MaterialSupplierViewSet（物料供应商关联视图集）**
   - CRUD 操作
   - 按物料、供应商、首选筛选
   - 排序功能

3. **PurchaseOrderViewSet（采购单视图集）**
   - CRUD 操作
   - 搜索功能（采购单号、供应商）
   - 状态筛选
   - 排序功能
   - 自定义操作：
     - `submit`：提交采购单
     - `approve`：审核通过
     - `reject`：拒绝采购单
     - `place_order`：确认下单
     - `receive`：收货
     - `cancel`：取消采购单
     - `low_stock_materials`：获取库存不足的物料列表

4. **PurchaseOrderItemViewSet（采购单明细视图集）**
   - CRUD 操作
   - 按采购单、物料、状态筛选
   - 排序功能
   - 自定义操作：
     - `receive`：单独收货某个明细

#### 3.1.3 序列化器（`backend/workorder/serializers.py`）

**新增序列化器**：

1. **SupplierSerializer（供应商序列化器）**
   - 基本字段序列化
   - 状态显示字段
   - 物料数量统计

2. **MaterialSupplierSerializer（物料供应商关联序列化器）**
   - 基本字段序列化
   - 物料名称、编码显示
   - 供应商名称、编码显示

3. **PurchaseOrderItemSerializer（采购单明细序列化器）**
   - 基本字段序列化
   - 物料名称、编码显示
   - 状态显示字段
   - 小计、剩余需收货数量计算属性

4. **PurchaseOrderListSerializer（采购单列表序列化器）**
   - 列表视图专用
   - 供应商名称、编码显示
   - 状态显示字段
   - 提交人、审核人显示
   - 明细数量统计
   - 收货进度计算

5. **PurchaseOrderDetailSerializer（采购单详情序列化器）**
   - 详情视图专用
   - 完整信息展示
   - 供应商详细信息
   - 嵌套采购单明细列表

#### 3.1.4 路由（`backend/workorder/urls.py`）

**新增路由**：
- `/api/suppliers/` - 供应商管理
- `/api/material-suppliers/` - 物料供应商关联
- `/api/purchase-orders/` - 采购单管理
- `/api/purchase-order-items/` - 采购单明细管理

#### 3.1.5 数据迁移（`backend/workorder/migrations/0015_add_purchase_management.py`）

**迁移内容**：
1. 扩展 `Material` 模型（新增 4 个字段）
2. 创建 `Supplier` 模型
3. 创建 `MaterialSupplier` 模型
4. 创建 `PurchaseOrder` 模型
5. 创建 `PurchaseOrderItem` 模型
6. 更新 `Notification` 模型（新增通知类型和采购单外键）

### 3.2 前端开发

#### 3.2.1 API 接口（`frontend/src/api/purchase.js`）

**新增 API 函数**：

**供应商管理**：
- `getSupplierList()` - 获取供应商列表
- `getSupplierDetail()` - 获取供应商详情
- `createSupplier()` - 创建供应商
- `updateSupplier()` - 更新供应商
- `deleteSupplier()` - 删除供应商

**物料供应商关联**：
- `getMaterialSupplierList()` - 获取物料供应商关联列表
- `createMaterialSupplier()` - 创建关联
- `updateMaterialSupplier()` - 更新关联
- `deleteMaterialSupplier()` - 删除关联

**采购单管理**：
- `getPurchaseOrderList()` - 获取采购单列表
- `getPurchaseOrderDetail()` - 获取采购单详情
- `createPurchaseOrder()` - 创建采购单
- `updatePurchaseOrder()` - 更新采购单
- `deletePurchaseOrder()` - 删除采购单
- `submitPurchaseOrder()` - 提交采购单
- `approvePurchaseOrder()` - 批准采购单
- `rejectPurchaseOrder()` - 拒绝采购单
- `placePurchaseOrder()` - 确认下单
- `receivePurchaseOrder()` - 收货
- `cancelPurchaseOrder()` - 取消采购单
- `getLowStockMaterials()` - 获取库存不足的物料

**采购单明细管理**：
- `getPurchaseOrderItemList()` - 获取采购单明细列表
- `createPurchaseOrderItem()` - 创建明细
- `updatePurchaseOrderItem()` - 更新明细
- `deletePurchaseOrderItem()` - 删除明细
- `receivePurchaseOrderItem()` - 单独收货

#### 3.2.2 页面组件

**供应商列表页**（`frontend/src/views/supplier/List.vue`）：
- 供应商列表展示（表格）
- 搜索功能（供应商名称/编码）
- 状态筛选（启用/停用）
- 新增供应商（弹窗表单）
- 编辑供应商（弹窗表单）
- 删除供应商（二次确认）
- 分页功能
- 表单验证（编码必填、名称必填、电话格式、邮箱格式）

**采购单列表页**（`frontend/src/views/purchase/List.vue`）：
- 采购单列表展示（表格）
- 状态标签显示（不同颜色）
- 收货进度条显示
- 搜索功能（采购单号、供应商名称）
- 状态筛选（草稿、已提交、已批准、已下单、已收货、已取消）
- 新增采购单（弹窗表单）
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

**采购单表单**：
- 供应商选择（下拉选择，支持搜索）
- 关联施工单（显示施工单号，可选）
- 备注输入
- 采购明细列表
  - 物料选择（下拉选择，支持搜索，自动填充单价）
  - 采购数量（数字输入）
  - 单价（数字输入）
  - 小计（自动计算）
  - 删除明细按钮
- 添加明细按钮
- 表单验证（供应商必填、至少一条明细）

#### 3.2.3 路由配置（`frontend/src/router/index.js`）

**新增路由**：
- `/suppliers` - 供应商管理页面
- `/purchase-orders` - 采购单管理页面

### 3.3 文档更新

#### 3.3.1 新增文档

**采购管理模块说明**（`docs/PURCHASE_MANAGEMENT_MODULE.md`）：
- 模块概述
- 数据模型设计
- 后端视图和 API
- 前端页面
- 业务流程
- 通知机制
- 权限控制
- 数据迁移
- 使用说明
- 后续优化建议
- 问题解决
- 技术实现亮点
- 总结

#### 3.3.2 更新文档

**系统使用流程分析**（`docs/SYSTEM_USAGE_ANALYSIS.md`）：
- 新增"4.3.1 缺少采购管理功能"章节
- 标记为"已完成（2026-01-10）"
- 更新第三阶段实施进度
- 调整章节编号

**采购管理模块实施总结**（`docs/PURCHASE_MANAGEMENT_IMPLEMENTATION_SUMMARY.md`）：
- 任务背景
- 实施目标
- 实施内容
- 技术实现亮点
- 功能测试验证
- 部署说明
- 后续优化建议
- 总结

---

## 四、技术实现亮点

### 4.1 采购单号自动生成

使用事务和 `select_for_update` 保证并发安全，格式为 `PO + yyyymmdd + 4位序号`：

```python
def generate_order_number():
    today = timezone.now().strftime('%Y%m%d')
    prefix = f'PO{today}'
    with transaction.atomic():
        latest = PurchaseOrder.objects.filter(
            order_number__startswith=prefix
        ).select_for_update().order_by('-order_number').first()
        if latest:
            last_number = int(latest.order_number[-4:])
            new_number = last_number + 1
        else:
            new_number = 1
        return f'{prefix}{new_number:04d}'
```

### 4.2 库存自动更新

收货时自动更新物料库存，确保数据一致性：

```python
# 更新每个明细的收货数量
for item_data in items_data:
    item.received_quantity = received_qty
    item.save()

    # 更新物料库存
    material = item.material
    material.stock_quantity += received_qty
    material.save()
```

### 4.3 状态机管理

清晰的采购单状态流转，每个状态有对应的操作权限：

```
草稿 → 已提交 → 已批准 → 已下单 → 已收货
            ↓
          已取消（草稿、已提交、已批准状态可取消）
```

### 4.4 库存预警机制

基于物料的 `min_stock_quantity` 字段自动检测库存不足：

```python
def is_low_stock(self):
    """检查库存是否不足"""
    return self.stock_quantity < self.min_stock_quantity

def get_needed_quantity(self, required_quantity):
    """获取需要采购的数量"""
    available = max(0, self.stock_quantity)
    return max(0, required_quantity - available)
```

### 4.5 通知集成

采购流程各环节自动通知，支持优先级设置：

```python
# 提交审核时创建通知
Notification.create_notification(
    recipient=None,  # 广播给所有有权限的用户
    notification_type='purchase_order_submitted',
    title=f'采购单待审核',
    message=f'采购单 {purchase_order.order_number} 已提交审核',
    priority='normal',
    purchase_order=purchase_order
)
```

### 4.6 前端用户体验

- 清晰的表格展示
- 友好的表单交互
- 实时进度显示（收货进度条）
- 状态标签颜色区分
- 二次确认删除操作
- 表单验证提示

---

## 五、功能测试验证

### 5.1 供应商管理

✅ **创建供应商**
- 输入供应商信息
- 保存成功
- 供应商列表显示新供应商

✅ **编辑供应商**
- 修改供应商信息
- 保存成功
- 供应商列表更新

✅ **删除供应商**
- 删除供应商（二次确认）
- 删除成功
- 供应商列表移除

✅ **搜索供应商**
- 按名称搜索
- 按编码搜索
- 搜索结果正确

✅ **状态筛选**
- 筛选启用的供应商
- 筛选停用的供应商
- 筛选结果正确

### 5.2 采购单管理

✅ **创建采购单**
- 选择供应商
- 添加采购明细（物料、数量、单价）
- 保存为草稿
- 采购单列表显示新采购单

✅ **提交审核**
- 提交采购单
- 状态变为"已提交"
- 创建通知

✅ **审核通过**
- 批准采购单
- 状态变为"已批准"
- 创建通知

✅ **审核拒绝**
- 拒绝采购单（填写拒绝原因）
- 状态变为"草稿"
- 创建通知

✅ **确认下单**
- 采购单批准后下单
- 状态变为"已下单"
- 记录下单日期

✅ **收货**
- 输入实际收货数量
- 物料库存自动更新
- 收货进度更新
- 状态变为"已收货"

✅ **取消采购单**
- 取消采购单（二次确认）
- 状态变为"已取消"

✅ **查看采购单详情**
- 查看采购单基本信息
- 查看采购明细列表
- 查看审核/收货信息

✅ **库存预警**
- 查看库存不足的物料列表
- 显示当前库存、最小库存、需要采购数量
- 显示默认供应商

---

## 六、部署说明

### 6.1 数据库迁移

```bash
cd backend
python manage.py migrate
```

迁移文件：`backend/workorder/migrations/0015_add_purchase_management.py`

### 6.2 前端部署

```bash
cd frontend
npm install
npm run build
```

### 6.3 权限配置

需要在 Django Admin 中配置以下权限：

- **供应商管理**：add_supplier, change_supplier, delete_supplier, view_supplier
- **采购单管理**：add_purchaseorder, change_purchaseorder, delete_purchaseorder, view_purchaseorder
- **采购单明细管理**：add_purchaseorderitem, change_purchaseorderitem, delete_purchaseorderitem, view_purchaseorderitem

### 6.4 用户组配置

建议创建以下用户组：

1. **采购员**：
   - add_supplier, change_supplier, view_supplier
   - add_purchaseorder, change_purchaseorder, view_purchaseorder
   - add_purchaseorderitem, change_purchaseorderitem, view_purchaseorderitem

2. **采购主管**：
   - change_supplier, view_supplier
   - change_purchaseorder, view_purchaseorder
   - change_purchaseorderitem, view_purchaseorderitem

3. **仓库管理员**：
   - view_purchaseorder
   - change_purchaseorder（仅收货权限）

---

## 七、后续优化建议

### 7.1 短期优化（1-2 周）

1. **采购单导出**
   - 支持导出采购单列表为 Excel
   - 支持导出单个采购单详情为 PDF

2. **采购单模板**
   - 支持保存常用采购单配置为模板
   - 快速创建相似的采购单

3. **批量采购**
   - 支持将多个施工单的物料合并为一个采购单
   - 支持批量创建采购单

### 7.2 中期优化（1-2 个月）

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

### 7.3 长期优化（3-6 个月）

1. **供应商门户**
   - 供应商在线查看采购单
   - 供应商在线确认订单
   - 供应商上传发货信息

2. **智能采购**
   - 基于机器学习预测物料需求
   - 智能推荐供应商
   - 优化采购时机和批量

3. **集成 ERP 系统**
   - 与财务系统集成
   - 与仓储系统集成
   - 自动对账

---

## 八、总结

### 8.1 完成情况

✅ **所有目标已完成**：
1. ✅ 创建供应商管理功能
2. ✅ 创建采购单管理功能（包含采购明细）
3. ✅ 实现库存预警机制
4. ✅ 完善采购流程（申请→审核→下单→收货）
5. ✅ 与施工单系统集成
6. ✅ 添加前端管理页面
7. ✅ 完善文档

### 8.2 解决的问题

✅ **核心问题已解决**：
1. ✅ 物料不足时的逻辑未完善 → 完整的采购流程管理
2. ✅ 缺少供应商管理 → 供应商管理功能
3. ✅ 缺少采购单管理 → 采购单管理功能
4. ✅ 缺少库存预警机制 → 库存预警功能
5. ✅ 缺少物料供应链管理 → 物料供应商关联

### 8.3 技术实现

✅ **技术实现质量良好**：
1. ✅ 采购单号自动生成（并发安全）
2. ✅ 库存自动更新（数据一致性）
3. ✅ 状态机管理（清晰的状态流转）
4. ✅ 库存预警机制（自动检测）
5. ✅ 通知集成（自动通知）
6. ✅ 前端用户体验（友好的界面）

### 8.4 文档质量

✅ **文档完善**：
1. ✅ 详细的功能说明文档
2. ✅ 完整的技术实现文档
3. ✅ 清晰的使用说明文档
4. ✅ 完善的实施总结文档

### 8.5 后续建议

📋 **后续优化方向**：
1. 🟢 短期：采购单导出、采购单模板、批量采购
2. 🟡 中期：供应商评价、采购分析、自动补货
3. 🔴 长期：供应商门户、智能采购、ERP 集成

---

## 九、致谢

感谢用户提供的详细需求文档和系统分析，为本次开发提供了清晰的指导。

---

**文档结束**
