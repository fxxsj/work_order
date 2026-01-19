# P0功能API与前端实施指南

> 后端序列化器已完成，待实施API视图集和前端

**文档版本**: v1.0.0
**更新日期**: 2026-01-18

---

## ✅ 已完成工作

### 1. 数据模型 (13个)
- ✅ 财务模型: 7个
- ✅ 库存模型: 6个
- ✅ 数据库迁移文件已创建

### 2. 序列化器 (30个)
- ✅ 财务序列化器: 14个
  - CostCenterSerializer, CostItemSerializer
  - ProductionCostSerializer, ProductionCostUpdateSerializer
  - InvoiceSerializer, InvoiceCreateSerializer, InvoiceUpdateSerializer
  - PaymentSerializer, PaymentCreateSerializer, PaymentUpdateSerializer
  - PaymentPlanSerializer
  - StatementSerializer, StatementCreateSerializer

- ✅ 库存序列化器: 16个
  - ProductStockSerializer, ProductStockUpdateSerializer
  - StockInSerializer, StockInCreateSerializer
  - StockOutSerializer
  - DeliveryItemSerializer
  - DeliveryOrderSerializer, DeliveryOrderListSerializer, DeliveryOrderCreateSerializer, DeliveryOrderUpdateSerializer
  - QualityInspectionSerializer, QualityInspectionCreateSerializer, QualityInspectionUpdateSerializer

### 3. 文档
- ✅ [WORKFLOW_GAPS_ANALYSIS.md](WORKFLOW_GAPS_ANALYSIS.md) - 流程缺失分析
- ✅ [P0_IMPLEMENTATION_SUMMARY.md](P0_IMPLEMENTATION_SUMMARY.md) - 实施总结
- ✅ [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - 迁移指南

---

## 🚧 待实施工作

### 第一步：后端API视图集

#### 创建财务视图集

**文件**: `backend/workorder/views/finance.py`

需要实现的ViewSet：

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from workorder.models import *
from workorder.serializers.finance import *

class CostCenterViewSet(viewsets.ModelViewSet):
    """成本中心视图集"""
    queryset = CostCenter.objects.all()
    serializer_class = CostCenterSerializer

class ProductionCostViewSet(viewsets.ModelViewSet):
    """生产成本视图集"""
    queryset = ProductionCost.objects.all()
    serializer_class = ProductionCostSerializer

    @action(detail=True, methods=['post'])
    def calculate_material(self, request, pk=None):
        """自动计算材料成本"""
        # 实现逻辑
        pass

    @action(detail=True, methods=['post'])
    def calculate_total(self, request, pk=None):
        """计算总成本"""
        # 实现逻辑
        pass

class InvoiceViewSet(viewsets.ModelViewSet):
    """发票视图集"""
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return InvoiceUpdateSerializer
        return InvoiceSerializer

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """提交发票"""
        pass

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """审核发票"""
        pass

class PaymentViewSet(viewsets.ModelViewSet):
    """收款记录视图集"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PaymentUpdateSerializer
        return PaymentSerializer

class StatementViewSet(viewsets.ModelViewSet):
    """对账单视图集"""
    queryset = Statement.objects.all()
    serializer_class = StatementSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return StatementCreateSerializer
        return StatementSerializer

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """确认对账单"""
        pass
```

#### 创建库存视图集

**文件**: `backend/workorder/views/inventory.py`

需要实现的ViewSet：

```python
class ProductStockViewSet(viewsets.ModelViewSet):
    """成品库存视图集"""
    queryset = ProductStock.objects.all()
    serializer_class = ProductStockSerializer

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """库存预警"""
        pass

    @action(detail=False, methods=['get'])
    def expired(self, request):
        """已过期库存"""
        pass

class DeliveryOrderViewSet(viewsets.ModelViewSet):
    """发货单视图集"""
    queryset = DeliveryOrder.objects.all()
    serializer_class = DeliveryOrderSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return DeliveryOrderListSerializer
        elif self.action == 'create':
            return DeliveryOrderCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DeliveryOrderUpdateSerializer
        return DeliveryOrderSerializer

    @action(detail=True, methods=['post'])
    def ship(self, request, pk=None):
        """发货"""
        pass

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """签收"""
        pass

class QualityInspectionViewSet(viewsets.ModelViewSet):
    """质量检验视图集"""
    queryset = QualityInspection.objects.all()
    serializer_class = QualityInspectionSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return QualityInspectionCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return QualityInspectionUpdateSerializer
        return QualityInspectionSerializer
```

#### 更新视图模块导出

**文件**: `backend/workorder/views/__init__.py`

添加：
```python
from .finance import (
    CostCenterViewSet,
    CostItemViewSet,
    ProductionCostViewSet,
    InvoiceViewSet,
    PaymentViewSet,
    PaymentPlanViewSet,
    StatementViewSet,
)

from .inventory import (
    ProductStockViewSet,
    StockInViewSet,
    StockOutViewSet,
    DeliveryOrderViewSet,
    DeliveryItemViewSet,
    QualityInspectionViewSet,
)
```

### 第二步：配置URL路由

**文件**: `backend/workorder/urls.py`

添加路由：

```python
from rest_framework.routers import DefaultRouter
from workorder.views import *

router = DefaultRouter()
# ... 现有路由 ...

# 财务路由
router.register(r'cost-centers', CostCenterViewSet, basename='cost-center')
router.register(r'cost-items', CostItemViewSet, basename='cost-item')
router.register(r'production-costs', ProductionCostViewSet, basename='production-cost')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'payment-plans', PaymentPlanViewSet, basename='payment-plan')
router.register(r'statements', StatementViewSet, basename='statement')

# 库存路由
router.register(r'product-stocks', ProductStockViewSet, basename='product-stock')
router.register(r'stock-ins', StockInViewSet, basename='stock-in')
router.register(r'stock-outs', StockOutViewSet, basename='stock-out')
router.register(r'delivery-orders', DeliveryOrderViewSet, basename='delivery-order')
router.register(r'delivery-items', DeliveryItemViewSet, basename='delivery-item')
router.register(r'quality-inspections', QualityInspectionViewSet, basename='quality-inspection')

urlpatterns = router.urls
```

### 第三步：前端API接口

#### 创建财务API

**文件**: `frontend/src/api/finance.js`

```javascript
import service from './index'

// ========== 成本核算 ==========
export function getProductionCosts(params) {
  return service({ url: '/production-costs/', method: 'get', params })
}

export function updateProductionCost(id, data) {
  return service({ url: `/production-costs/${id}/`, method: 'put', data })
}

export function calculateMaterialCost(id) {
  return service({ url: `/production-costs/${id}/calculate_material/`, method: 'post' })
}

// ========== 发票管理 ==========
export function getInvoices(params) {
  return service({ url: '/invoices/', method: 'get', params })
}

export function createInvoice(data) {
  return service({ url: '/invoices/', method: 'post', data })
}

export function updateInvoice(id, data) {
  return service({ url: `/invoices/${id}/`, method: 'put', data })
}

export function submitInvoice(id) {
  return service({ url: `/invoices/${id}/submit/`, method: 'post' })
}

export function approveInvoice(id, data) {
  return service({ url: `/invoices/${id}/approve/`, method: 'post', data })
}

// ========== 收款管理 ==========
export function getPayments(params) {
  return service({ url: '/payments/', method: 'get', params })
}

export function createPayment(data) {
  return service({ url: '/payments/', method: 'post', data })
}

// ========== 对账管理 ==========
export function getStatements(params) {
  return service({ url: '/statements/', method: 'get', params })
}

export function createStatement(data) {
  return service({ url: '/statements/', method: 'post', data })
}

export function confirmStatement(id, data) {
  return service({ url: `/statements/${id}/confirm/`, method: 'post', data })
}
```

#### 创建库存API

**文件**: `frontend/src/api/inventory.js`

```javascript
import service from './index'

// ========== 成品库存 ==========
export function getProductStocks(params) {
  return service({ url: '/product-stocks/', method: 'get', params })
}

export function getLowStock(params) {
  return service({ url: '/product-stocks/low_stock/', method: 'get', params })
}

export function getExpiredStock(params) {
  return service({ url: '/product-stocks/expired/', method: 'get', params })
}

// ========== 发货管理 ==========
export function getDeliveryOrders(params) {
  return service({ url: '/delivery-orders/', method: 'get', params })
}

export function createDeliveryOrder(data) {
  return service({ url: '/delivery-orders/', method: 'post', data })
}

export function shipDeliveryOrder(id, data) {
  return service({ url: `/delivery-orders/${id}/ship/`, method: 'post', data })
}

export function receiveDeliveryOrder(id, data) {
  return service({ url: `/delivery-orders/${id}/receive/`, method: 'post', data })
}

// ========== 质量检验 ==========
export function getQualityInspections(params) {
  return service({ url: '/quality-inspections/', method: 'get', params })
}

export function createQualityInspection(data) {
  return service({ url: '/quality-inspections/', method: 'post', data })
}
```

### 第四步：前端页面组件

由于页面组件较多，建议按优先级实施：

#### P0核心页面 (必需)

1. **发票管理** (`frontend/src/views/finance/Invoice.vue`)
   - 发票列表
   - 创建发票
   - 发票详情
   - 发票审核

2. **发货管理** (`frontend/src/views/inventory/Delivery.vue`)
   - 发货单列表
   - 创建发货单
   - 发货详情
   - 物流跟踪

3. **成品库存** (`frontend/src/views/inventory/Stock.vue`)
   - 库存查询
   - 库存预警
   - 批次管理

#### P1重要页面

4. **收款管理** (`frontend/src/views/finance/Payment.vue`)
5. **成本核算** (`frontend/src/views/finance/Cost.vue`)
6. **对账管理** (`frontend/src/views/finance/Statement.vue`)
7. **质量检验** (`frontend/src/views/inventory/Quality.vue`)

### 第五步：前端路由配置

**文件**: `frontend/src/router/index.js`

添加路由：

```javascript
// 财务管理
{
  path: 'finance',
  children: [
    { path: 'invoices', name: 'InvoiceList', component: () => import('@/views/finance/Invoice.vue') },
    { path: 'invoices/create', name: 'InvoiceCreate', component: () => import('@/views/finance/InvoiceForm.vue') },
    { path: 'payments', name: 'PaymentList', component: () => import('@/views/finance/Payment.vue') },
    { path: 'costs', name: 'CostList', component: () => import('@/views/finance/Cost.vue') },
    { path: 'statements', name: 'StatementList', component: () => import('@/views/finance/Statement.vue') },
  ]
},

// 库存管理
{
  path: 'inventory',
  children: [
    { path: 'stocks', name: 'StockList', component: () => import('@/views/inventory/Stock.vue') },
    { path: 'delivery', name: 'DeliveryList', component: () => import('@/views/inventory/Delivery.vue') },
    { path: 'delivery/create', name: 'DeliveryCreate', component: () => import('@/views/inventory/DeliveryForm.vue') },
    { path: 'quality', name: 'QualityList', component: () => import('@/views/inventory/Quality.vue') },
  ]
},
```

---

## 📋 实施检查清单

### 后端部分
- [ ] 创建 `backend/workorder/views/finance.py`
- [ ] 创建 `backend/workorder/views/inventory.py`
- [ ] 更新 `backend/workorder/views/__init__.py`
- [ ] 更新 `backend/workorder/urls.py`
- [ ] 测试API接口

### 前端部分
- [ ] 创建 `frontend/src/api/finance.js`
- [ ] 创建 `frontend/src/api/inventory.js`
- [ ] 创建发票管理页面
- [ ] 创建发货管理页面
- [ ] 创建成品库存页面
- [ ] 创建收款管理页面
- [ ] 创建成本核算页面
- [ ] 创建对账管理页面
- [ ] 创建质量检验页面
- [ ] 更新 `frontend/src/router/index.js`

### 数据库
- [ ] 激活虚拟环境
- [ ] 执行 `python manage.py migrate`
- [ ] 验证模型导入
- [ ] 创建初始数据

---

## 🔍 API端点列表

### 财务模块

| 功能 | 端点 | 方法 |
|-----|------|------|
| 成本中心列表 | `/api/cost-centers/` | GET |
| 生产成本列表 | `/api/production-costs/` | GET |
| 计算材料成本 | `/api/production-costs/{id}/calculate_material/` | POST |
| 发票列表 | `/api/invoices/` | GET |
| 创建发票 | `/api/invoices/` | POST |
| 提交发票 | `/api/invoices/{id}/submit/` | POST |
| 审核发票 | `/api/invoices/{id}/approve/` | POST |
| 收款列表 | `/api/payments/` | GET |
| 创建收款 | `/api/payments/` | POST |
| 对账单列表 | `/api/statements/` | GET |
| 创建对账单 | `/api/statements/` | POST |
| 确认对账单 | `/api/statements/{id}/confirm/` | POST |

### 库存模块

| 功能 | 端点 | 方法 |
|-----|------|------|
| 成品库存列表 | `/api/product-stocks/` | GET |
| 库存预警 | `/api/product-stocks/low_stock/` | GET |
| 过期库存 | `/api/product-stocks/expired/` | GET |
| 发货单列表 | `/api/delivery-orders/` | GET |
| 创建发货单 | `/api/delivery-orders/` | POST |
| 发货 | `/api/delivery-orders/{id}/ship/` | POST |
| 签收 | `/api/delivery-orders/{id}/receive/` | POST |
| 质检列表 | `/api/quality-inspections/` | GET |
| 创建质检 | `/api/quality-inspections/` | POST |

---

## 🎯 下一步行动

1. **立即执行**: 在虚拟环境中运行 `python manage.py migrate`
2. **优先实施**:
   - InvoiceViewSet (发票管理)
   - DeliveryOrderViewSet (发货管理)
   - ProductStockViewSet (成品库存)
3. **前端优先**:
   - 发票管理页面
   - 发货管理页面
   - 成品库存页面

---

**说明**: 由于篇幅限制，详细的视图集和页面组件代码未完全展示。建议参考现有的类似实现（如SalesOrderViewSet, WorkOrderViewSet）进行开发。

**预计工作量**:
- 后端视图集: 2-3天
- 前端页面: 3-5天
- 测试调试: 1-2天

**总计**: 约1-2周完成全部P0功能
