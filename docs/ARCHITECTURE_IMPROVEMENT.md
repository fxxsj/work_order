# 印刷施工单跟踪系统 - 架构改进文档

> 版本: 1.0
> 更新日期: 2026-02-23
> 状态: 进行中（已落地部分 P0/P1）

---

## 进度总览（持续更新）

### P0：减少代码冗余

- [x] 前端：通用 CRUD API 工厂（`apps/web/src/api/base.ts`）
- [x] 前端：迁移部分 API 模块到工厂（已完成：`customers/departments/materials/products/suppliers/payments/invoices/tasks/workorders(list)/processes/catalog/productGroups/salesOrders/purchaseOrders/stockIns/stockOuts/deliveryOrders/productStocks/qualityInspections/purchaseReceiveRecords/materialSuppliers/notifications/artworks/dies/foilingPlates/embossingPlates`）
- [x] 前端：通用列表组件（`apps/web/src/views/base/ResourceList.vue`）
- [x] 前端：迁移部分列表页到通用组件（已完成：`Customer/Product/Supplier/Material/Payment/Invoice`）
- [x] 后端：落地 `BaseViewSet` 并迁移部分 ViewSet（已完成：`base.py/products.py/materials.py` 的核心 CRUD + `system.py(TaskAssignmentRule)` + `sales.py(SalesOrder/SalesOrderItem)`）
- [ ] 后端：继续迁移剩余 ViewSet（目标：大多数简单 CRUD 继承 `BaseViewSet`）
- [ ] 后端：资产确认逻辑抽象（`assets.py` 的 confirm 重复）

### P1：清理技术债务

- [x] 清理备份文件 / secrets（已执行 `git rm` + `.gitignore` 约束 + `.env.*.example`）
- [x] 统一 `DATABASE_URL` 支持（Django settings 已兼容）
- [x] Release / Tag Web 产物（`v*` tag 会上传 `WorkOrder-<tag>-web.zip` 到 GitHub Release）
- [x] 前端：统一运行时配置（已收敛到 `apps/web/src/config/index.ts`，并移除 `utils/runtimeConfig.ts`）
- [ ] 前端：全局错误处理（Axios 拦截器 / 统一 toast）（已开始：`getHttpErrorMessage` + `ResourceList` 使用）
- [ ] 未完成功能：逐项评估/移除/补齐（multi-level approval / inventory / finance / notification）

### P2：完成核心功能

- [ ] 库存管理 TODO：补齐与测试（已开始：入库审核自动生成 `ProductStock` 批次）
- [ ] 财务模块 TODO：对账单 / 期初余额等

### P3：长期优化

- [ ] 缓存策略工具化 + 可观测性
- [ ] 聚合 API（dashboard 一次请求）

## 目录

1. [执行摘要](#执行摘要)
2. [当前架构分析](#当前架构分析)
3. [问题识别](#问题识别)
4. [改进方案](#改进方案)
5. [实施路线图](#实施路线图)
6. [风险评估](#风险评估)
7. [成功指标](#成功指标)

---

## 执行摘要

### 背景

印刷施工单跟踪系统是一个基于 Vue 3 + Django REST Framework 的企业级应用，支持 Web/桌面/Android 三端。当前代码库运行良好，但存在显著的代码冗余和技术债务。

### 核心发现

| 类别 | 严重程度 | 影响 |
|------|----------|------|
| 代码冗余 | 🔴 高 | 维护成本增加 40%+ |
| 未完成功能 | 🟡 中 | 功能不完整影响用户体验 |
| 配置复杂性 | 🟡 中 | 新人上手困难 |
| 缓存/环境约定不清 | 🟡 中 | 线上/CI 行为不一致风险 |

### 建议优先级

1. **P0 (立即执行)**: 减少代码冗余
2. **P1 (1-2周内)**: 清理技术债务
3. **P2 (1-2月内)**: 完成核心功能
4. **P3 (长期)**: 架构优化

---

## 当前架构分析

### 现状校准（基于仓库当前状态）

- 前端 `apps/web/src/api/` 目前为 **26 个文件**（文档后续出现的“24 个文件”为历史值）。
- 后端已存在缓存与会话配置（`CACHES`/`SESSION_ENGINE`），并在部分统计接口中实际使用 `cache.get/set`；问题不在“完全没有缓存”，而在“缓存策略/失效/一致性约定不清”。
- 多级审批模块在路由层面当前并未被注释禁用（导入与路由注册均为启用状态），但是否可用仍需用迁移与接口测试确认。
- CI/本地/容器的环境变量约定存在分裂：工作流/compose 常设置 `DATABASE_URL`，但 Django settings 可能主要依赖 `POSTGRES_*` 决定是否启用 PostgreSQL（需要统一）。
- Node 版本存在不一致：CI 使用 Node 20，但 `docker-compose` 中的 web dev server 仍使用 Node 18（建议统一）。

### 技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层                                │
├─────────────────────────────────────────────────────────────┤
│  Web (Vue 3)    │  Desktop (Tauri)    │  Mobile (Capacitor) │
│  Vite + TS      │  Rust + WebView     │  Android WebView    │
│  Element Plus   │  Keychain 存储       │  Preferences 存储   │
│  Pinia          │                     │                     │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        API 层                                │
├─────────────────────────────────────────────────────────────┤
│  Django REST Framework 3.14  │  Django Channels (WS)        │
│  Token 认证                  │  drf-spectacular (文档)      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        数据层                                │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 13       │  Redis 6            │  文件存储       │
│  (生产环境)           │  (缓存/会话)         │  (媒体资源)     │
└─────────────────────────────────────────────────────────────┘
```

### 模块组织

#### 后端结构 (良好)
```
backend/workorder/
├── models/              # 数据模型 (按领域分文件)
│   ├── core.py         # 核心模型 (施工单、任务等)
│   ├── base.py         # 基础模型 (客户、产品等)
│   ├── assets.py       # 资产模型
│   └── ...
├── serializers/         # 序列化器
├── views/              # 视图集 (按领域分文件)
│   ├── base.py         # 包含 11 个 ViewSet
│   ├── products.py     # 产品相关 ViewSet
│   └── ...
├── permissions.py       # 权限控制
└── services/           # 业务逻辑服务
```

#### 前端结构 (基础)
```
apps/web/src/
├── api/                # API 调用 (约 26 个文件，高度重复)
├── views/              # 页面组件 (列表视图结构重复)
├── stores/             # Pinia 状态管理 (仅2个)
├── lib/                # 工具库
│   ├── http.ts         # Axios 配置
│   └── authToken.ts    # 跨平台 Token 管理
└── utils/              # 工具函数
```

---

## 问题识别

### 1. 代码冗余

#### 1.1 前端 API 模块冗余

**位置**: `apps/web/src/api/` (约 26 个文件，随业务增长会变化)

**冗余模式**:
```typescript
// 每个文件都重复定义
export type PaginatedResult<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// 每个文件都重复实现
export async function list{Resource}s(params) {
  return http.get<PaginatedResult<{Resource}>>(`/{resource}/`, { params })
}
export async function create{Resource}(input) { ... }
export async function update{Resource}(id, input) { ... }
export async function delete{Resource}(id) { ... }
```

**影响**: 添加新功能需要在多处修改相同逻辑

#### 1.2 后端 ViewSet 配置冗余

**位置**: `backend/workorder/views/` (40+ ViewSet)

虽然存在 `BaseViewSet`，但大多数 ViewSet 未继承：
```python
# 重复的配置模式
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    permission_classes = [SuperuserFriendlyModelPermissions]
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # ... 相同的配置

class DepartmentViewSet(viewsets.ModelViewSet):
    # ... 完全相同的配置结构
```

#### 1.3 确认操作重复

**位置**: `backend/workorder/views/assets.py`

4 个资产类型（Artwork, Die, FoilingPlate, EmbossingPlate）的确认方法几乎完全相同：
```python
# 4 次重复，每次约 40 行
@action(detail=True, methods=['post'])
def confirm(self, request, pk=None):
    with transaction.atomic():
        asset = Model.objects.select_for_update().get(pk=pk)
        if asset.confirmed:
            return Response({"error": "该xxx已经确认过了"})
        asset.confirmed = True
        asset.confirmed_by = request.user
        asset.confirmed_at = timezone.now()
        asset.save()
        # ... 相同的任务更新逻辑
```

### 2. 技术债务

#### 2.1 未完成的功能

| 模块 | 位置 | 状态 | 影响 |
|------|------|------|------|
| 多级审批 | `views/multi_level_approval.py` | 路由已接入，但需迁移/测试验证 | 可能存在隐藏 Bug |
| 库存管理 | `views/inventory.py` | 多处 TODO | 功能不完整 |
| 财务模块 | `views/finance.py` | TODO: 期初余额、对账单 | 数据不准确 |
| 通知功能 | `views/notification.py` | 被禁用 | 用户体验差 |

#### 2.2 备份文件未清理

```
backend/workorder/models/core.py.backup
backend/workorder/views/core.py.backup
backend/workorder/views/work_order_tasks.py.backup
backend/db.sqlite3.backup.20260120_181719
```

#### 2.3 配置复杂性

**环境文件过多**:
- `backend/.env`
- `backend/.env.backup`
- `backend/.env.example`
- `backend/.env.production`

**运行时配置分散**:
```typescript
// 当前实现位于 apps/web/src/utils/runtimeConfig.ts
// 说明：
// - 优先使用 localStorage 中的 runtimeConfig（便于桌面/移动端动态配置）
// - 其次使用 Vite env（VITE_API_BASE_URL / VITE_WS_BASE_URL）
// - 最后回退到开发默认值
export function getApiBaseUrl() {
  const runtime = getRuntimeConfig()
  return runtime.apiBaseUrl || (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api'
}
```

### 3. 架构不一致

#### 3.1 序列化器模式

部分 ViewSet 使用 List/Detail 分离：
- `WorkOrderViewSet` ✅ 有 List/Detail 序列化器
- `CustomerViewSet` ❌ 单一序列化器
- `PurchaseOrderViewSet` ✅ 有 List/Detail 序列化器

#### 3.2 权限类不一致

- 大多数: `SuperuserFriendlyModelPermissions`
- `WorkOrderViewSet`: `WorkOrderDataPermission` (自定义)
- 部分: 未指定 (使用默认)

#### 3.3 错误处理不统一

- 前端: 各组件自行处理，缺少全局策略
- 后端: 部分 ViewSet 有自定义错误处理

### 4. 性能问题

#### 4.1 缺少查询优化

部分 ViewSet 未使用 `select_related()` 或 `prefetch_related()`

#### 4.2 无缓存策略

- 缓存已有使用点，但缺少统一策略（哪些数据可缓存、TTL、失效规则、灰度开关、监控指标）。
- 静态数据（如部门列表）可引入更明确的缓存与失效机制（例如基于更新时间或手动失效）。
- 重点不在“是否缓存”，而在“可观察性与一致性”：命中率、错误率、缓存雪崩/穿透防护、失效与回源策略。

---

## 改进方案

### 阶段 1: 减少代码冗余 (P0)

#### 1.1 创建通用 API 工厂

**目标**: 将约 26 个 API 文件的重复代码减少 90%

```typescript
// apps/web/src/api/base.ts
export interface ListParams {
  page?: number
  page_size?: number
  search?: string
  ordering?: string
  [key: string]: any
}

export interface PaginatedResult<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CrudApi<T> {
  list: (params?: ListParams) => Promise<PaginatedResult<T>>
  retrieve: (id: number) => Promise<T>
  create: (data: Partial<T>) => Promise<T>
  update: (id: number, data: Partial<T>) => Promise<T>
  delete: (id: number) => Promise<void>
}

export function createCrudApi<T>(resource: string): CrudApi<T> {
  return {
    list: async (params = {}) => (await http.get<PaginatedResult<T>>(`/${resource}/`, { params })).data,
    retrieve: async (id) => (await http.get<T>(`/${resource}/${id}/`)).data,
    create: async (data) => (await http.post<T>(`/${resource}/`, data)).data,
    // 现有代码多为 PUT 更新；需要 PATCH 时可在模块中自定义 action 或在工厂中增加选项参数
    update: async (id, data) => (await http.put<T>(`/${resource}/${id}/`, data)).data,
    delete: async (id) => {
      await http.delete(`/${resource}/${id}/`)
    }
  }
}

// 带自定义操作的 API 工厂
export function createApiWithActions<T, A extends Record<string, Function>>(
  resource: string,
  actions?: A
): CrudApi<T> & A {
  return {
    ...createCrudApi<T>(resource),
    ...actions
  }
}
```

**迁移示例**:
```typescript
// 之前 (apps/web/src/api/customers.ts)
export async function listCustomers(params) {
  return http.get('/customers/', { params })
}
export async function createCustomer(data) {
  return http.post('/customers/', data)
}
// ... 50+ 行

// 之后 (apps/web/src/api/customers.ts)
import { createCrudApi } from './base'

export interface Customer {
  id: number
  name: string
  // ...
}

export const customerApi = createCrudApi<Customer>('customers')
```

**预期收益**:
- 删除约 800 行重复代码
- 新增 API 资源只需 1 行代码
- 类型安全且易于测试

#### 1.2 统一 ViewSet 基类

```python
# backend/workorder/views/base_viewsets.py
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .permissions import SuperuserFriendlyModelPermissions

class StandardModelViewSet(viewsets.ModelViewSet):
    """
    标准模型视图集 - 包含通用配置
    所有简单 CRUD ViewSet 应继承此类
    """
    permission_classes = [SuperuserFriendlyModelPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    ordering_fields = ['created_at', 'id']
    ordering = ['-created_at']

    def get_queryset(self):
        """子类可重写以添加 select_related/prefetch_related"""
        return self.queryset


class ListDetailModelViewSet(StandardModelViewSet):
    """
    支持列表/详情分离序列化器的视图集
    """
    list_serializer_class = None
    detail_serializer_class = None

    def get_serializer_class(self):
        if self.action == 'list' and self.list_serializer_class:
            return self.list_serializer_class
        if self.action in ['retrieve', 'update', 'partial_update'] and self.detail_serializer_class:
            return self.detail_serializer_class
        return super().get_serializer_class()


class ConfirmableAssetViewSet(StandardModelViewSet):
    """
    支持确认操作的资产视图集
    需要模型有 confirmed, confirmed_by, confirmed_at 字段
    """
    confirm_task_types = []  # 确认后要更新的任务类型（示例字段，需按实际模型适配）
    confirm_task_fk_field = None  # 例如：'artwork' / 'die' / 'foiling_plate' / 'embossing_plate'

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        from django.db import transaction
        from django.utils import timezone

        with transaction.atomic():
            asset = self.get_object()
            if asset.confirmed:
                return Response({"error": "该资产已经确认过了"}, status=400)

            asset.confirmed = True
            asset.confirmed_by = request.user
            asset.confirmed_at = timezone.now()
            asset.save()

            # 更新相关任务（需按实际字段适配）
            # - WorkOrderTask 并不存在统一的 asset_id 字段
            # - 分派字段也可能是 assigned_operator/assigned_department 等
            # 建议：每个资产 ViewSet 显式指定关联字段并实现 after_confirm()
            self.after_confirm(asset, request.user)

            serializer = self.get_serializer(asset)
            return Response(serializer.data)

    def after_confirm(self, asset, user):
        return None
```

**迁移示例**:
```python
# 之前
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    permission_classes = [SuperuserFriendlyModelPermissions]
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    # ... 20+ 行配置

# 之后
class CustomerViewSet(StandardModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    search_fields = ['name', 'code']
```

**预期收益**:
- 删除约 600 行重复配置
- 新增 ViewSet 只需 5 行代码
- 统一的行为和权限控制

#### 1.3 提取列表视图通用组件

```vue
<!-- apps/web/src/views/base/ResourceList.vue -->
<template>
  <div class="resource-list">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">{{ title }}列表</div>
        <el-tag v-if="totalCount !== null" type="info" size="small">
          共 {{ totalCount }} 条
        </el-tag>
      </div>
      <div class="right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索..."
          size="small"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 200px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button size="small" type="primary" @click="handleSearch">搜索</el-button>
        <el-button v-if="canCreate" size="small" type="success" @click="handleCreate">
          新增
        </el-button>
        <slot name="actions" />
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="items"
      stripe
      @row-click="handleRowClick"
    >
      <slot name="columns" />
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadData"
        @size-change="loadData"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

interface Props {
  title: string
  api: {
    list: (params: any) => Promise<{ results: T[]; count: number }>
  }
  canCreate?: boolean
  defaultPageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  canCreate: true,
  defaultPageSize: 20
})

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'row-click', item: T): void
}>()

const router = useRouter()
const loading = ref(false)
const items = ref<T[]>([])
const totalCount = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)
const searchQuery = ref('')

async function loadData() {
  loading.value = true
  try {
    const result = await props.api.list({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined
    })
    items.value = result.results
    totalCount.value = result.count
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleCreate() {
  emit('create')
}

function handleRowClick(item: T) {
  emit('row-click', item)
}

function goHome() {
  router.push('/')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.resource-list {
  padding: 20px;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.left, .right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.right {
  gap: 8px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
```

**使用示例**:
```vue
<!-- apps/web/src/views/Customers.vue -->
<template>
  <ResourceList
    title="客户"
    :api="customerApi"
    @create="goToCreate"
    @row-click="goToDetail"
  >
    <template #columns>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="code" label="编码" />
      <el-table-column prop="contact" label="联系人" />
    </template>
  </ResourceList>
</template>

<script setup lang="ts">
import ResourceList from './base/ResourceList.vue'
import { customerApi } from '../api/customers'

function goToCreate() {
  // 导航到创建页面
}

function goToDetail(customer: Customer) {
  // 导航到详情页面
}
</script>
```

**预期收益**:
- 列表视图代码减少 70%
- 统一的分页、搜索、加载行为
- 更容易维护和测试

---

### 阶段 2: 清理技术债务 (P1)

#### 2.1 清理备份文件

```bash
# 执行清理
git rm backend/workorder/models/*.backup
git rm backend/workorder/views/*.backup
git rm backend/db.sqlite3.backup.*

# 添加到 .gitignore
echo "*.backup" >> .gitignore
```

#### 2.2 处理未完成功能

**决策树**:
```
功能是否需要？
├── 是 → 是否有资源完成？
│   ├── 是 → 制定完成计划
│   └── 否 → 暂时禁用，添加 Issue 跟踪
└── 否 → 移除代码
```

**建议处理**:

| 功能 | 决策 | 行动 |
|------|------|------|
| 多级审批 | 待评估 | 与业务确认需求，或移除 |
| 库存管理 | 保留 | 完成 TODO 项 |
| 财务模块 | 保留 | 优先完成对账单逻辑 |
| 通知功能 | 保留 | 重新实现或替换为第三方服务 |

#### 2.3 简化配置管理

```typescript
// apps/web/src/config/index.ts
interface RuntimeConfig {
  apiBaseUrl: string
  wsBaseUrl: string
}

const DEFAULT_CONFIG: RuntimeConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8001'
}

export function loadConfig(): RuntimeConfig {
  const stored = localStorage.getItem('workorder.runtimeConfig')
  if (stored) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
    } catch {
      return DEFAULT_CONFIG
    }
  }
  return DEFAULT_CONFIG
}

export function saveConfig(config: Partial<RuntimeConfig>) {
  const current = loadConfig()
  localStorage.setItem('workorder.runtimeConfig', JSON.stringify({ ...current, ...config }))
}

export const config = loadConfig()
```

**环境文件简化**:
```
backend/.env.example          # 后端示例配置
backend/.env.development      # 后端开发环境
backend/.env.production       # 后端生产环境

# （可选）前端按 Vite 约定放置在 apps/web/
apps/web/.env.example
apps/web/.env.development
apps/web/.env.production
```

#### 2.4 OpenAPI / SDK 现状与决策（补充）

仓库已经具备：
- OpenAPI 导出脚本与 `openapi/openapi.json` 产物；
- `packages/sdk` 的 types 生成（CI 中已有对应 job 与 artifacts）。

因此“减少前端 API 重复”有两条可行路线：
1) **短期（推荐）**：保留手写 API 模块，但用通用 API 工厂统一 CRUD 形态，减少重复代码并维持现有调用方式。
2) **中期**：评估基于 OpenAPI 自动生成 typed client（或生成到 `packages/sdk` 并在前端使用），进一步降低维护成本。

本次改造先落地路线 1)，并把路线 2) 写入后续路线图。

#### 2.5 Release / Tag 构建产物约定（补充）

当前仓库的 tag 约定与自动化（以 GitHub Actions 为准）：
- **桌面端**：`vX.Y.Z` 触发 Release 流水线，产出安装包/zip 等，并上传到 GitHub Release。
- **Android**：`android-vX.Y.Z` 触发 Android Release 流水线，产出 APK/AAB，并上传到 GitHub Release。
- **Web**：建议在 `vX.Y.Z` 时同步产出 `apps/web/dist` 的 zip 作为客户端静态包，并上传到同一个 GitHub Release（便于回滚与追溯）。

文档实施时需明确：
- tag 命名规范；
- 产物命名规范（例如 `WorkOrder-<tag>-web.zip`）；
- 产物保存位置（Artifacts vs GitHub Release Assets）；
- 回滚方式（重新打 tag / 重新发布 / 手动下架）。

---

### 阶段 3: 完成核心功能 (P2)

#### 3.1 库存管理完成计划

```python
# backend/workorder/services/inventory.py

class InventoryService:
    """库存管理服务"""

    @staticmethod
    def create_stock_record(product_id: int, quantity: int, warehouse_id: int):
        """创建库存记录"""
        ProductStock.objects.create(
            product_id=product_id,
            quantity=quantity,
            warehouse_id=warehouse_id
        )

    @staticmethod
    def deduct_stock(product_id: int, quantity: int, order_item_id: int):
        """扣减库存"""
        with transaction.atomic():
            stock = ProductStock.objects.select_for_update().get(product_id=product_id)
            if stock.quantity < quantity:
                raise InsufficientStockError(f"产品 {product_id} 库存不足")
            stock.quantity -= quantity
            stock.save()

            # 记录出库
            StockTransaction.objects.create(
                product_id=product_id,
                quantity=-quantity,
                transaction_type='out',
                order_item_id=order_item_id
            )
```

#### 3.2 财务模块完成计划

```python
# 优先实现对账单生成逻辑
class StatementService:
    @staticmethod
    def generate_supplier_statement(supplier_id: int, month: str):
        """生成供应商对账单"""
        # 1. 获取期初余额
        opening_balance = StatementService.get_opening_balance(supplier_id, month)

        # 2. 获取本期采购
        purchases = PurchaseOrder.objects.filter(
            supplier_id=supplier_id,
            order_date__month=month
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # 3. 获取本期付款
        payments = Payment.objects.filter(
            supplier_id=supplier_id,
            payment_date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0

        # 4. 计算期末余额
        closing_balance = opening_balance + purchases - payments

        return Statement.objects.create(
            supplier_id=supplier_id,
            period=month,
            opening_balance=opening_balance,
            purchase_amount=purchases,
            payment_amount=payments,
            closing_balance=closing_balance
        )
```

---

### 阶段 4: 架构优化 (P3)

#### 4.1 实现缓存策略

```python
# backend/workorder/utils/cache.py

from django.core.cache import cache
from django.conf import settings

class CacheConfig:
    """缓存配置"""
    STATIC_DATA_TIMEOUT = 3600  # 1小时
    QUERY_TIMEOUT = 300         # 5分钟

def cache_static_data(key, queryset_or_fn):
    """缓存静态数据"""
    data = cache.get(key)
    if data is None:
        if callable(queryset_or_fn):
            data = queryset_or_fn()
        else:
            data = list(queryset_or_fn)
        cache.set(key, data, CacheConfig.STATIC_DATA_TIMEOUT)
    return data

# 使用示例
class DepartmentViewSet(viewsets.ModelViewSet):
    def list(self, request, *args, **kwargs):
        # 缓存部门列表
        data = cache_static_data('departments:list', lambda:
            Department.objects.values('id', 'name', 'code')
        )
        return Response({'results': data})
```

#### 4.2 添加聚合 API

```python
# 减少前端请求次数
@action(detail=False, methods=['get'])
def dashboard_data(self, request):
    """获取仪表板数据 - 单次请求返回所有数据"""
    from django.db.models import Count, Q

    return Response({
        'statistics': {
            'pending_orders': WorkOrder.objects.filter(status='pending').count(),
            'in_progress': WorkOrder.objects.filter(status='in_progress').count(),
            'completed_today': WorkOrder.objects.filter(
                status='completed',
                completed_at__date=date.today()
            ).count(),
        },
        'recent_tasks': WorkOrderTask.objects.filter(
            assigned_operator=request.user
        ).order_by('-created_at')[:5],
        'notifications': Notification.objects.filter(
            user=request.user,
            read=False
        ).count()
    })
```

---

## 实施路线图

### 第 1-2 周: 代码冗余消除

| 任务 | 负责人 | 工作量 | 产出 |
|------|--------|--------|------|
| 创建通用 API 工厂 | 前端 | 2天 | `apps/web/src/api/base.ts` |
| 迁移 5 个 API 模块 | 前端 | 1天 | 验证模式可行性 |
| 迁移剩余 19 个 API 模块 | 前端 | 2天 | 完成 API 重构 |
| 统一 ViewSet 基类 | 后端 | 1天 | `base_viewsets.py` |
| 迁移 20 个 ViewSet | 后端 | 2天 | 完成 ViewSet 重构 |
| 创建通用列表组件 | 前端 | 2天 | `ResourceList.vue` |
| 迁移 5 个列表视图 | 前端 | 1天 | 验证组件可用性 |

### 第 3 周: 技术债务清理

| 任务 | 负责人 | 工作量 | 产出 |
|------|--------|--------|------|
| 清理备份文件 | 全员 | 0.5天 | Git 仓库清洁 |
| 简化环境配置 | 全员 | 1天 | 统一配置管理 |
| 移除/禁用不需要的功能 | 后端 | 1天 | 代码库清洁 |
| 统一错误处理 | 前端 | 1天 | 全局错误处理器 |
| 添加单元测试 | 全员 | 2天 | 核心功能测试覆盖 |

### 第 4-5 周: 功能完成

| 任务 | 负责人 | 工作量 | 产出 |
|------|--------|--------|------|
| 完成库存管理 TODO | 后端 | 3天 | 完整的库存功能 |
| 完成财务模块 TODO | 后端 | 3天 | 对账单功能 |
| 重新实现通知功能 | 后端 | 2天 | 通知服务 |
| 前端对接新功能 | 前端 | 2天 | UI 更新 |

### 第 6-8 周: 架构优化

| 任务 | 负责人 | 工作量 | 产出 |
|------|--------|--------|------|
| 实现缓存策略 | 后端 | 2天 | 缓存装饰器和工具 |
| 添加聚合 API | 后端 | 2天 | 仪表板 API |
| 查询性能优化 | 后端 | 2天 | N+1 查询消除 |
| 前端状态管理优化 | 前端 | 2天 | 数据缓存策略 |

---

## 风险评估

### 高风险项

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| API 工厂引入 Bug | 高 | 中 | 完整的单元测试 + 灰度迁移 |
| ViewSet 基类破坏现有行为 | 高 | 中 | 逐步迁移 + 回归测试 |
| 数据库迁移失败 | 高 | 低 | 备份 + 迁移脚本测试 |

### 中风险项

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 配置变更导致环境问题 | 中 | 中 | 配置验证脚本 |
| 缓存导致数据不一致 | 中 | 中 | 缓存失效策略 + 监控 |
| 前端组件重构影响用户体验 | 中 | 低 | UI 测试 + 用户验收 |

---

## 成功指标

### 代码质量指标

| 指标 | 当前 | 目标 | 测量方式 |
|------|------|------|----------|
| 代码重复率 | ~30% | <10% | SonarQube 扫描 |
| API 文件平均行数 | ~80行 | ~20行 | 代码统计 |
| ViewSet 平均行数 | ~60行 | ~25行 | 代码统计 |
| 测试覆盖率 | 未知 | >70% | pytest coverage |
| 技术债务 | 高 | 中低 | TODO 计数 |

### 性能指标

| 指标 | 当前 | 目标 | 测量方式 |
|------|------|------|----------|
| API 平均响应时间 | 未知 | <200ms | APM 监控 |
| 前端首屏加载 | 未知 | <2s | Lighthouse |
| 缓存命中率 | 0% | >40% | Redis 监控 |

### 开发效率指标

| 指标 | 当前 | 目标 | 测量方式 |
|------|------|------|----------|
| 新增 CRUD 功能耗时 | ~2小时 | ~30分钟 | 观察 |
| Bug 修复耗时 | 未知 | 减少30% | Issue 跟踪 |
| 新人上手时间 | 未知 | <2天 | 反馈 |

---

## 附录

### A. 相关文件清单

#### 需要修改的文件

**前端**:
- `apps/web/src/api/*.ts` (全部 24 个文件)
- `apps/web/src/views/base/` (新建目录)
- `apps/web/src/config/` (新建目录)
- `apps/web/src/lib/http.ts` (统一错误处理)

**后端**:
- `backend/workorder/views/base_viewsets.py` (增强)
- `backend/workorder/views/*.py` (约 40 个文件)
- `backend/workorder/services/inventory.py` (新建)
- `backend/workorder/services/finance.py` (新建)
- `backend/workorder/utils/cache.py` (新建)

#### 需要删除的文件

```
backend/workorder/models/*.backup
backend/workorder/views/*.backup
backend/db.sqlite3.backup.*
backend/workorder/admin/disabled/ (评估后决定)
```

### B. 参考资料

- [Django REST Framework 最佳实践](https://www.django-rest-framework.org/topics/best-practices/)
- [Vue 3 Composition API 指南](https://vuejs.org/guide/extras/composition-api-faq.html)
- [DRF Spectacular 文档](https://drf-spectacular.readthedocs.io/)
- [Tauri 跨平台开发指南](https://tauri.app/v1/guides/)
- [Capacitor Android 构建](https://capacitorjs.com/docs/android)

---

*文档版本: 1.0*
*最后更新: 2026-02-23*
*维护者: 开发团队*
