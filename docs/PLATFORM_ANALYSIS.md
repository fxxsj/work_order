# 印刷施工单跟踪系统 - 平台分析与优化方向

> 版本: 1.0
> 更新日期: 2026-02-23
> 状态: 进行中

---

## 进度总览（持续更新）

### P0：补齐关键缺口

- [ ] 财务模块界面（成本中心/成本项/生产成本/对账单等）
- [ ] 高级任务管理 UI（批量完成/取消/分派、分派历史；已落地：批量完成/取消/分派）
- [x] 导出功能 UI（施工单/任务列表已接入后端 Excel 导出）

### P1：性能与体验

- [ ] 添加数据库索引（以慢查询/高频列表为准）
- [ ] 优化 N+1 查询（WorkOrderTask/WorkOrder 列表）
- [ ] 实现基础缓存（静态字典/统计类接口）

### P2：平台增强

- [ ] 桌面端：托盘/原生通知/更新验收
- [ ] 移动端：相机/扫码/推送/弱网优化

## 执行摘要

本文档分析印刷施工单跟踪系统的前后端数据对齐情况、多端平台完成度，并提供优化方向建议。

### 关键发现

| 维度 | 完成度（主观） | 主要问题 |
|------|----------------|----------|
| **前后端数据对齐** | 85% | 核心 CRUD/流程已覆盖，但部分后端高级动作缺少前端 UI |
| **Web 平台** | 85% | 高级任务管理、导出/报表 UI 缺失 |
| **桌面平台 (Tauri)** | 50% | 已有安全存储（Keychain/凭据管理器）与发版产物链路；缺少托盘/原生通知/更新验收 |
| **移动平台 (Capacitor)** | 45% | 已有运行时配置与 token 安全存储、Android 发版产物链路；缺少相机/扫码/推送/弱网优化 |
| **整体架构** | 75% | 性能优化、质量门禁与可观测性仍有提升空间 |

---

## 目录

1. [前后端数据对齐分析](#前后端数据对齐分析)
2. [多端平台完成度分析](#多端平台完成度分析)
3. [功能完成度矩阵](#功能完成度矩阵)
4. [优化方向](#优化方向)
5. [实施建议](#实施建议)

---

## 前后端数据对齐分析

### API 覆盖状态

#### 完全对齐的模块

| 后端端点 | 前端 API | 前端视图 | 对齐度 |
|----------|----------|----------|--------|
| `/customers/` | `customers.ts` | `CustomerListView.vue` | 100% |
| `/products/` | `products.ts` | `ProductListView.vue` | 100% |
| `/materials/` | `materials.ts` | `MaterialListView.vue` | 100% |
| `/suppliers/` | `suppliers.ts` | `SupplierListView.vue` | 100% |
| `/sales-orders/` | `salesOrders.ts` | `SalesOrderListView.vue` | 95% |
| `/purchase-orders/` | `purchaseOrders.ts` | `PurchaseOrderListView.vue` | 95% |
| `/invoices/` | `invoices.ts` | `InvoiceListView.vue` | 90% |
| `/payments/` | `payments.ts` | `PaymentListView.vue` | 90% |
| `/departments/` | `departments.ts` | `DepartmentListView.vue` | 100% |
| `/processes/` | `processes.ts` | `ProcessListView.vue` | 95% |

#### 部分对齐的模块

**施工单任务 (`/workorder-tasks/`)**

后端已实现但前端未使用的功能：
- `split/` - 任务拆分
- `assign/` - 任务分配调整
- `cancel/` - 任务取消（原因追踪）
- `batch_update_quantity/` - 批量更新数量
- `batch_complete/` - 批量完成
- `batch_cancel/` - 批量取消
- `batch_assign/` - 批量分配
- `export/` - 任务导出
- `assignment_history/` - 分配历史
- `stats/` - 任务统计
- `collaboration_stats/` - 协作统计

**施工单 (`/workorders/`)**

后端已实现但前端未完全使用的功能：
- `sync_tasks_preview/` - 任务同步预览
- `sync_tasks_execute/` - 执行任务同步
- `check_sync_needed/` - 检查是否需要同步
- `resubmit_for_approval/` - 重新提交审批
- `request_reapproval/` - 请求重新审批

#### 缺失的模块

| 模块 | 后端状态 | 前端状态 | 建议 |
|------|----------|----------|------|
| 成本核算（成本中心/成本项/生产成本/对账单等） | ✅ 完整 | ⚠️ 部分缺失（目前仅发票/收款 UI） | 明确范围后补齐 UI |
| 多级审批 | ✅ 完整（含初始化命令与最小测试） | ❌ 缺失 | 评估业务需求后补齐前端 |
| 监控/分析 | ✅ 部分 | ❌ 缺失 | 中优先级 |
| 报表/导出 | ✅ 完整 | ⚠️ 部分 | 完善导出 UI |

### 数据类型一致性

#### 良好对齐的类型

```typescript
// apps/web/src/api/workOrders.ts（列表项已对齐）
export type WorkOrderListItem = {
  id: number
  order_number: string
  customer_name: string
  product_name: string | null
  quantity: number
  unit: string
  status_display: string
  priority_display: string
  delivery_date: string | null
  progress_percentage: number
}

// 施工单详情目前在前端仍为动态结构（待用 OpenAPI/SDK 收敛类型）
export type WorkOrderDetail = Record<string, any>
```

#### 需要注意的类型差异

| 后端类型 | 前端类型 | 潜在问题 | 建议 |
|----------|----------|----------|------|
| `DecimalField` | `string \| number` | 精度丢失 | 统一使用 `string` |
| `DateField` (nullable) | `string` | null 处理 | 添加 `null` 类型 |
| `JSONField` | `Record<string, any>` | 类型不安全 | 定义具体接口 |

### 分页与过滤对齐

#### 标准分页格式

```typescript
// 统一的分页响应结构
interface PaginatedResult<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
```

#### 后端已实现但前端未使用的过滤

**施工单过滤**:
- `approval_status` - 审批状态过滤
- `manager` - 按经理过滤

**任务过滤**:
- `department` - 按部门过滤
- `operator` - 按操作员过滤
- `task_type` - 按任务类型过滤

**销售单过滤**:
- `payment_status` - 付款状态过滤

---

## 多端平台完成度分析

### Web 平台 (`apps/web/`)

**完成度: 85%**

#### 已实现功能

- ✅ 路由系统（31 个路由，支持 `VITE_ROUTER_MODE=hash|history`）
- ✅ 认证与权限控制
- ✅ WebSocket 通知支持
- ✅ 响应式布局 (Element Plus)
- ✅ 运行时配置系统
- ✅ API 模块（业务模块 26 个 + `base.ts` 工厂）

#### 视图模块清单

```
apps/web/src/views/
├── LoginView.vue                    # 登录页
├── DashboardView.vue                # 首页/看板
├── ClientDownloadView.vue           # 客户端下载页（可选）
├── WorkOrderListView.vue            # 施工单列表
├── WorkOrderDetailView.vue          # 施工单详情
├── WorkOrderCreateView.vue          # 创建施工单
├── TaskListView.vue                 # 任务列表
├── OperatorCenterView.vue           # 操作中心
├── NotificationView.vue             # 通知中心
├── CustomerListView.vue             # 客户列表
├── ProductListView.vue              # 产品列表
├── SupplierListView.vue             # 供应商列表
├── MaterialListView.vue             # 材料列表
├── MaterialSupplierListView.vue     # 材料-供应商关联
├── DepartmentListView.vue           # 部门列表
├── ProcessListView.vue              # 工序列表
├── SalesOrderListView.vue           # 销售单列表
├── PurchaseOrderListView.vue        # 采购单列表
├── PurchaseReceiveCenterView.vue    # 收货/质检/入库中心
├── ProductStockListView.vue         # 成品库存
├── StockInListView.vue              # 入库单
├── StockOutListView.vue             # 出库单
├── DeliveryOrderListView.vue        # 发货/签收
├── QualityInspectionListView.vue    # 质检记录
├── InvoiceListView.vue              # 发票
├── PaymentListView.vue              # 收款
├── ArtworkListView.vue              # 图稿
├── DieListView.vue                  # 刀模
├── FoilingPlateListView.vue         # 烫金版
├── EmbossingPlateListView.vue       # 压凸版
└── ProductGroupListView.vue         # 产品组
```

#### 缺失功能

- ❌ 高级任务管理 UI（拆分、批量操作）
- ❌ 任务分配历史界面
- ❌ 施工单同步预览 UI
- ❌ 导出功能 UI
- ❌ 多级审批界面
- ❌ 性能监控仪表板
- ❌ 财务分析界面

### 桌面平台 (Tauri)

**完成度: 40%**

#### 已实现功能

```rust
// apps/desktop/src-tauri/src/main.rs
use tauri::State;
use keyring::{Entry, Error as KeyringError};

#[tauri::command]
async fn set_auth_token(token: String) -> Result<(), String> {
    // 使用 OS 凭据管理器存储 token
}

#[tauri::command]
async fn get_auth_token() -> Option<String> {
    // 从 OS 凭据管理器获取 token
}

#[tauri::command]
async fn clear_auth_token() -> Result<(), String> {
    // 清除 token
}
```

#### 缺失功能

| 功能 | 优先级 | 实现难度 |
|------|--------|----------|
| 原生文件对话框 | 高 | 低 |
| 系统托盘集成 | 中 | 中 |
| 自动更新 | 高 | 低（已配置） |
| 原生通知 | 中 | 低 |
| 桌面特定 UI 适配 | 低 | 中 |
| 离线模式支持 | 中 | 高 |
| 原生菜单 | 低 | 中 |

### 移动平台 (Capacitor)

**完成度: 30%**

#### 缺失功能

| 功能 | 优先级 | 实现难度 |
|------|--------|----------|
| iOS 配置 | 高 | 低 |
| 相机插件 | 中 | 低 |
| 地理位置插件 | 低 | 低 |
| 推送通知 | 高 | 高 |
| 移动端 UI 适配 | 高 | 中 |
| 触摸手势优化 | 中 | 中 |
| 离线存储 | 中 | 高 |
| 应用图标/启动页 | 低 | 低 |
| 文件选择/上传 | 中 | 中 |

### 平台抽象层

#### Token 存储抽象

```typescript
// apps/web/src/lib/authToken.ts

// 平台检测
function isTauri(): boolean {
  return !!(window as any).__TAURI__?.invoke
}

function isCapacitorNative(): boolean {
  const cap = (window as any).Capacitor
  return cap && (cap.isNativePlatform?.() || cap.isNative)
}

// 统一的 Token API
export async function initAuthToken(): Promise<void>
export function getAuthToken(): string | null
export function setAuthToken(token: string): void
export function clearAuthToken(): void
```

#### 平台差异处理

| 特性 | Web | 桌面 (Tauri) | 移动 (Capacitor) |
|------|-----|--------------|------------------|
| Token 存储 | localStorage | OS Keychain | Preferences |
| 路由模式 | history（默认） | hash（打包默认，可配置） | hash（打包默认，可配置） |
| 协议 | HTTP/HTTPS | 本地 scheme（Tauri） | 本地 WebView scheme（Capacitor） |
| 更新机制 | 刷新页面 | GitHub Release /（可选）Tauri Updater | GitHub Release /（可选）应用商店 |
| 文件访问 | 浏览器 API | Tauri API | Capacitor API |

---

## 功能完成度矩阵

### 核心业务模块

| 模块 | 后端 API | 前端视图 | 前端 API | 完成度 |
|------|----------|----------|----------|--------|
| **客户管理** | ✅ 100% | ✅ 100% | ✅ 100% | 100% |
| **产品管理** | ✅ 100% | ✅ 100% | ✅ 100% | 100% |
| **材料管理** | ✅ 100% | ✅ 100% | ✅ 100% | 100% |
| **供应商管理** | ✅ 100% | ✅ 100% | ✅ 100% | 100% |
| **施工单管理** | ✅ 100% | ⚠️ 90% | ⚠️ 90% | 90% |
| **任务管理** | ✅ 100% | ⚠️ 70% | ⚠️ 70% | 70% |
| **销售单** | ✅ 100% | ⚠️ 95% | ✅ 100% | 95% |
| **采购单** | ✅ 100% | ⚠️ 95% | ✅ 100% | 95% |
| **库存管理** | ✅ 100% | ⚠️ 90% | ✅ 100% | 90% |
| **出入库** | ✅ 100% | ⚠️ 85% | ✅ 100% | 85% |
| **交付单** | ✅ 100% | ⚠️ 90% | ✅ 100% | 90% |
| **质检** | ✅ 100% | ⚠️ 90% | ✅ 100% | 90% |
| **发票** | ✅ 100% | ⚠️ 90% | ✅ 100% | 90% |
| **付款** | ✅ 100% | ⚠️ 80% | ⚠️ 80% | 80% |
| **部门** | ✅ 100% | ✅ 100% | ✅ 100% | 100% |
| **工序** | ✅ 100% | ⚠️ 95% | ✅ 100% | 95% |
| **资产管理** | ✅ 100% | ⚠️ 95% | ✅ 100% | 95% |
| **产品组** | ✅ 100% | ⚠️ 95% | ✅ 100% | 95% |
| **通知** | ✅ 100% | ⚠️ 90% | ✅ 100% | 90% |

### 高级功能模块

| 模块 | 后端 API | 前端视图 | 前端 API | 完成度 |
|------|----------|----------|----------|--------|
| **财务/成本** | ✅ 100% | ❌ 0% | ❌ 0% | 0% |
| **多级审批** | ✅ 100% | ❌ 0% | ❌ 0% | 0% |
| **监控/分析** | ⚠️ 50% | ❌ 0% | ❌ 0% | 0% |
| **报表/导出** | ✅ 100% | ⚠️ 40% | ⚠️ 40% | 40% |

### 统计数据

```
总模块数: 21
完全完成: 6 (29%)
部分完成: 12 (57%)
未开始: 3 (14%)

加权平均完成度: 75%
```

---

## 优化方向

### 性能优化

#### 后端优化

**1. 数据库索引**

```python
# 建议添加的索引
class Meta:
    indexes = [
        # WorkOrder
        models.Index(fields=['status', 'priority', '-created_at']),
        models.Index(fields=['customer', 'status']),
        models.Index(fields=['approval_status']),

        # WorkOrderTask
        models.Index(fields=['status', 'assigned_department']),
        models.Index(fields=['status', 'assigned_operator']),
        models.Index(fields=['task_type', 'status']),

        # SalesOrder
        models.Index(fields=['customer', 'status', 'payment_status']),

        # Notification
        models.Index(fields=['recipient', 'is_read', '-created_at']),
    ]
```

**2. 查询优化**

```python
# 当前缺失优化的 ViewSet
class TaskViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        # 添加 select_related 和 prefetch_related
        return WorkOrderTask.objects.select_related(
            'work_order',
            'assigned_operator',
            'assigned_department'
        ).prefetch_related(
            'materials',
            'notes'
        ).all()
```

**3. 缓存策略**

```python
# backend/workorder/utils/cache.py
from django.core.cache import cache
from django.conf import settings

class CacheConfig:
    STATIC_DATA_TIMEOUT = 3600  # 1小时
    QUERY_TIMEOUT = 300         # 5分钟
    USER_DATA_TIMEOUT = 600     # 10分钟

def cache_static_data(key, queryset_or_fn, timeout=None):
    """缓存静态数据（部门、工序等）"""
    if timeout is None:
        timeout = CacheConfig.STATIC_DATA_TIMEOUT
    data = cache.get(key)
    if data is None:
        data = list(queryset_or_fn)
        cache.set(key, data, timeout)
    return data

# 使用示例
class DepartmentViewSet(viewsets.ModelViewSet):
    def list(self, request, *args, **kwargs):
        data = cache_static_data(
            'departments:list',
            Department.objects.values('id', 'name', 'code')
        )
        return Response({'results': data})
```

#### 前端优化

**1. 代码分割**

```typescript
// apps/web/src/router/index.ts
const routes = [
  {
    path: '/customers',
    component: () => import('@/views/CustomerListView.vue')
  },
  {
    path: '/workorders/:id',
    component: () => import('@/views/WorkOrderDetailView.vue')
  }
]
```

**2. Element Plus 按需导入**

```typescript
// apps/web/src/main.ts
import ElementPlus from 'element-plus'
// 替换为按需导入
import { ElButton, ElTable, ElInput } from 'element-plus'
```

**3. 客户端缓存策略**

```typescript
// apps/web/src/lib/apiCache.ts
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    return entry.data
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
}

export const apiCache = new ApiCache()
```

### 代码质量优化

#### 消除重复代码

**1. 状态转换 Mixin**

```python
# backend/workorder/mixins.py
class StatusTransitionMixin:
    """统一的状态转换逻辑"""

    def transition_status(self, obj, from_status, to_status, user=None):
        """执行状态转换"""
        if obj.status != from_status:
            raise ValidationError(f"当前状态不允许此操作")

        obj.status = to_status
        if user:
            obj.updated_by = user
        obj.save()

        # 记录状态历史
        self.record_status_history(obj, from_status, to_status, user)
        return obj

    def record_status_history(self, obj, from_status, to_status, user):
        """记录状态变更历史"""
        # 实现状态历史记录
        pass
```

**2. 统一响应格式**

```python
# backend/workorder/utils/response.py
from rest_framework.response import Response
from typing import Any, Optional

class ApiResponse:
    """统一 API 响应格式"""

    @staticmethod
    def success(data: Any = None, message: str = "操作成功"):
        return Response({
            'success': True,
            'message': message,
            'data': data
        })

    @staticmethod
    def error(message: str, code: Optional[str] = None):
        response_data = {
            'success': False,
            'message': message
        }
        if code:
            response_data['code'] = code
        return Response(response_data, status=400)

    @staticmethod
    def paginated(data: Any, count: int, next: Optional[str] = None, previous: Optional[str] = None):
        return Response({
            'success': True,
            'data': {
                'count': count,
                'next': next,
                'previous': previous,
                'results': data
            }
        })
```

#### 错误处理统一

**前端全局错误处理（已落地）**

当前实现已收敛到：
- `apps/web/src/lib/formatError.ts`：统一把 Axios/后端错误格式化为可展示文案；
- `apps/web/src/lib/http.ts`：Axios 实例统一拦截网络异常并 toast（带节流，避免刷屏）。

### 架构改进

#### 服务层抽取

```python
# backend/workorder/services/work_order_service.py
class WorkOrderService:
    """施工单业务逻辑服务"""

    @staticmethod
    def create_work_order(data: dict, user) -> WorkOrder:
        """创建施工单"""
        with transaction.atomic():
            work_order = WorkOrder.objects.create(
                **data,
                created_by=user
            )

            # 自动生成任务
            TaskService.generate_tasks_for_work_order(work_order)

            # 发送通知
            NotificationService.notify_work_order_created(work_order)

            return work_order

    @staticmethod
    def sync_tasks(work_order: WorkOrder, preview: bool = False):
        """同步任务"""
        # 任务同步逻辑
        pass
```

#### 状态管理优化

```typescript
// apps/web/src/stores/workOrder.ts
import { defineStore } from 'pinia'
import { workorderApi } from '@/api/workorders'

interface WorkOrderState {
  items: WorkOrder[]
  current: WorkOrder | null
  loading: boolean
  filters: WorkOrderFilters
}

export const useWorkOrderStore = defineStore('workOrder', {
  state: (): WorkOrderState => ({
    items: [],
    current: null,
    loading: false,
    filters: {}
  }),

  actions: {
    async fetchList(params: ListParams) {
      this.loading = true
      try {
        const result = await workorderApi.list(params)
        this.items = result.results
        return result
      } finally {
        this.loading = false
      }
    },

    async fetchDetail(id: number) {
      this.current = await workorderApi.retrieve(id)
      return this.current
    },

    setFilters(filters: WorkOrderFilters) {
      this.filters = { ...this.filters, ...filters }
    }
  }
})
```

---

## 实施建议

### 优先级 P0 (1-2 周)

1. **完成缺失的前端功能**
   - [ ] 财务模块界面
   - [ ] 高级任务管理 UI
   - [x] 导出功能 UI（施工单/任务列表已接入后端 Excel 导出）

2. **性能优化**
   - [ ] 添加数据库索引
   - [ ] 优化 N+1 查询
   - [ ] 实现基础缓存

### 优先级 P1 (3-4 周)

1. **桌面平台增强**
   - [ ] 原生文件对话框
   - [ ] 系统托盘
   - [ ] 自动更新激活

2. **移动平台基础**
   - [ ] iOS 配置
   - [ ] 推送通知
   - [ ] 移动端 UI 适配

3. **代码质量**
   - [ ] 统一错误处理
   - [ ] 消除重复代码
   - [ ] 服务层抽取

### 优先级 P2 (1-2 月)

1. **高级功能**
   - [ ] 多级审批前端
   - [ ] 监控仪表板
   - [ ] 高级报表

2. **架构优化**
   - [ ] 代码分割
   - [ ] 状态管理优化
   - [ ] API 缓存策略

### 优先级 P3 (长期)

1. **平台特性**
   - [ ] 离线模式
   - [ ] 原生通知
   - [ ] 文件上传优化

2. **性能监控**
   - [ ] APM 集成
   - [ ] 性能指标收集
   - [ ] 错误追踪

---

## 附录

### A. 技术债务清单

| 类别 | 项目 | 影响 | 优先级 |
|------|------|------|--------|
| 代码 | 重复的 ViewSet 配置 | 维护成本 | P0 |
| 代码 | 重复的 API 模块 | 维护成本 | P0 |
| 功能 | 未实现的高级任务功能 | 用户体验 | P0 |
| 功能 | 财务模块缺失 | 业务完整性 | P1 |
| 性能 | 缺少数据库索引 | 响应速度 | P1 |
| 性能 | N+1 查询问题 | 服务器负载 | P1 |
| 平台 | 桌面功能不完整 | 桌面体验 | P1 |
| 平台 | 移动功能不完整 | 移动体验 | P2 |

### B. 相关文档

- `docs/ARCHITECTURE_IMPROVEMENT.md` - 架构改进文档
- `CLAUDE.md` - 项目说明
- `.planning/` - 项目规划文档

---

*文档版本: 1.0*
*最后更新: 2026-02-23*
*维护者: 开发团队*
