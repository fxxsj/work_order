# 前端代码重构计划

> 系统性重构前端代码，实现模块化、规范化、标准化

**创建日期**: 2026-01-19
**目标版本**: v3.0.0
**预计工期**: 2-3周

---

## 📊 代码审计结果

### 现状统计

| 项目 | 数量 | 说明 |
|------|------|------|
| Vue 页面组件 | 76个 | 包含 views 和 components |
| 业务模块 | 18个 | customer, product, workorder, task 等 |
| API 模块 | 18个 | 已模块化到 `src/api/modules/` |
| Mixins | 5个 | listPageMixin, crudMixin 等 |
| 列表页面 | 19个 | List.vue 文件 |
| 使用 Mixin 的页面 | 10个 | **仅 13% 采用率** ⚠️ |

### 🚨 核心问题清单

#### 1. **命名不一致** (P0 - 严重)

**问题描述**：
- ❌ 目录命名混乱：`productGroup` (驼峰) vs `product` (小写)
- ❌ API 文件命名不统一：`product-group.js` (短横线) vs `productGroup/` (驼峰)
- ❌ 组件命名混乱：`List.vue` (通用名) 缺少业务前缀

**示例**：
```
views/
├── productGroup/List.vue      ❌ 驼峰目录 + 通用组件名
├── product/List.vue           ❌ 小写目录 + 通用组件名
├── foilingplate/List.vue      ❌ 全小写目录
├── embossingplate/List.vue    ❌ 全小写目录
└── finance/Invoice.vue        ✅ 小写目录 + 明确组件名
```

**影响**：
- 开发者心智负担高
- IDE 自动导入混乱
- 代码可读性差

---

#### 2. **Mixin 采用率低** (P0 - 严重)

**问题描述**：
- ✅ **已使用 Mixin**: 10个页面 (customer, product, department 等)
- ❌ **未使用 Mixin**: 66个页面 (87%)
- ❌ **代码重复**: 每个页面重复实现分页、搜索、CRUD

**对比分析**：

| 页面 | 使用 Mixin | 代码行数估算 |
|------|-----------|-------------|
| customer/List.vue | ✅ | ~200行 |
| finance/Invoice.vue | ❌ | ~400行 |
| inventory/Stock.vue | ❌ | ~400行 |

**代码重复示例**：
```javascript
// ❌ 66个页面都重复这些代码
data() {
  return {
    loading: false,
    tableData: [],
    currentPage: 1,
    pageSize: 20,
    total: 0,
    searchText: ''
  }
},
methods: {
  handleSearch() { /* ... */ },
  handlePageChange() { /* ... */ },
  handleCreate() { /* ... */ },
  handleEdit() { /* ... */ },
  handleDelete() { /* ... */ }
}
```

**损失**：
- 💰 代码冗余：估计 **5000+ 行重复代码**
- ⏱️ 维护成本：修改逻辑需改 66 个文件
- 🐛 Bug 风险：逻辑不一致导致 bug

---

#### 3. **视图结构不统一** (P1 - 重要)

**问题描述**：
三种不同的页面结构并存：

**模式 A - 使用 Mixin** (10个页面) ✅
```vue
<template>
  <div class="customer-list">
    <el-card>
      <div class="header-section">
        <el-input v-model="searchText" />
        <el-button @click="showCreateDialog()">新建</el-button>
      </div>
      <el-table :data="tableData" />
      <el-pagination />
    </el-card>
  </div>
</template>
```

**模式 B - 传统结构** (新页面，4个) ✅
```vue
<template>
  <div class="invoice-container">
    <div class="header">
      <h2>发票管理</h2>
      <div class="actions">...</div>
    </div>
    <div class="stats-cards">...</div>
    <div class="filter-section">...</div>
    <el-table />
  </div>
</template>
```

**模式 C - 混乱结构** (62个页面) ❌
- 无统一布局
- 样式类名随意
- 结构深度不一

**影响**：
- 用户体验不一致
- CSS 样式冲突
- 维护困难

---

#### 4. **API 调用模式混乱** (P1 - 重要)

**问题描述**：

✅ **已模块化** (部分页面)：
```javascript
import { customerAPI } from '@/api/modules'
customerAPI.getList({ page: 1 })
```

❌ **旧模式** (大部分页面)：
```javascript
import { getCustomers } from '@/api/customer'
getCustomers({ page: 1 })
```

❌ **混合模式** (极少数)：
```javascript
import request from '@/api/index'
request.get('/api/customers/')
```

**统计**：
- API 模块文件：18个 (已创建)
- 使用新模式的页面：~20%
- 使用旧模式的页面：~80%

---

#### 5. **组件颗粒度不合理** (P2 - 次要)

**问题描述**：

❌ **缺少中间层组件**：
```
components/
├── common/
│   ├── Pagination.vue          ✅ 过于底层
│   ├── SearchBar.vue           ✅ 过于底层
│   └── CrudPageLayout.vue      ✅ 已存在但未使用
└── (缺少业务组件)
```

❌ **应该抽取但未抽取**：
- 列表页头部（搜索 + 按钮）→ 66处重复
- 表格操作列（编辑/删除按钮）→ 50处重复
- 对话框表单（新建/编辑）→ 40处重复
- 统计卡片 → 10处重复

**建议新增组件**：
```
components/
└── business/
    ├── ListHeader.vue        // 列表页头部
    ├── TableActions.vue      // 表格操作列
    ├── FormDialog.vue        // 表单对话框
    └── StatCards.vue         // 统计卡片
```

---

#### 6. **文件组织混乱** (P2 - 次要)

**问题描述**：

```
views/
├── productGroup/              ❌ 驼峰命名
│   └── List.vue
├── product/                   ✅ 小写命名
│   └── List.vue
├── foilingplate/              ❌ 单词连写
│   └── List.vue
├── embossingplate/            ❌ 单词连写
│   └── List.vue
└── finance/                   ✅ 小写命名
    ├── Invoice.vue            ✅ 明确命名
    ├── Payment.vue
    ├── Cost.vue
    └── Statement.vue
```

**标准应该是**：
```
views/
├── product-group/             ✅ 短横线分隔
│   └── ProductGroupList.vue   ✅ 明确命名
├── product/
│   └── ProductList.vue
├── foiling-plate/             ✅ 短横线分隔
│   └── FoilingPlateList.vue
└── finance/
    ├── FinanceInvoice.vue
    └── FinancePayment.vue
```

---

## 🎯 重构目标

### 核心目标

1. **统一命名规范** - 100%符合标准
2. **统一架构模式** - 90% 采用 Mixin + 标准模板
3. **减少代码重复** - 减少 70% 重复代码
4. **提升可维护性** - 修改逻辑只需改 1 处

### 量化指标

| 指标 | 当前值 | 目标值 | 提升 |
|------|--------|--------|------|
| Mixin 采用率 | 13% | 90% | +77% |
| 代码重复率 | ~40% | <15% | -25% |
| 命名规范符合率 | ~60% | 100% | +40% |
| 平均页面代码行数 | 350行 | 200行 | -43% |
| 新增功能开发时间 | 4小时 | 1小时 | -75% |

---

## 📋 重构任务分解

### Phase 0: 准备阶段 (1天)

**目标**: 建立重构基础设施

#### Task 0.1: 创建规范文档
- [ ] 编写《前端开发规范》(FRONTEND_STANDARDS.md)
  - 命名规范（文件、组件、变量、API）
  - 目录结构规范
  - 代码风格规范
  - 注释规范

#### Task 0.2: 配置工具链
- [ ] 更新 ESLint 规则（强制命名规范）
- [ ] 配置 Prettier（统一格式化）
- [ ] 添加 Git hooks（提交前检查）
- [ ] 创建重构脚本工具

#### Task 0.3: 创建测试环境
- [ ] 创建 `refactor` 分支
- [ ] 建立回归测试清单
- [ ] 准备测试数据

---

### Phase 1: 命名统一 (2-3天)

**目标**: 统一所有文件和组件命名

#### Task 1.1: 目录重命名 (P0)
```bash
# 重命名所有不规范的目录
productGroup/      → product-group/
foilingplate/      → foiling-plate/
embossingplate/    → embossing-plate/
```

**影响文件**：
- [ ] 重命名 3 个目录
- [ ] 更新所有 import 路径（估计 50+ 处）
- [ ] 更新路由配置

#### Task 1.2: 组件重命名 (P0)
```bash
# 为所有 List.vue 添加业务前缀
customer/List.vue         → customer/CustomerList.vue
product/List.vue          → product/ProductList.vue
department/List.vue       → department/DepartmentList.vue
# ... 共 15 个文件
```

**影响**：
- [ ] 重命名 15 个列表组件
- [ ] 重命名 3 个表单组件
- [ ] 重命名 2 个详情组件
- [ ] 更新所有动态 import（路由）

#### Task 1.3: API 文件命名统一 (P1)
确保所有 API 文件使用短横线命名：
- [ ] `product-group.js` ✅
- [ ] `embossing-plate.js` ✅
- [ ] `foiling-plate.js` ✅

---

### Phase 2: Mixin 迁移 (5-7天)

**目标**: 将 80% 的列表页面迁移到 Mixin 模式

#### Task 2.1: 优化 Mixin 基础设施 (1天)

**增强 listPageMixin.js**：
```javascript
// 新增功能
export default {
  data() {
    return {
      // 现有功能
      loading: false,
      tableData: [],

      // 新增：高级搜索支持
      advancedSearch: false,
      searchForm: {},

      // 新增：批量操作支持
      multipleSelection: [],

      // 新增：导出支持
      exporting: false
    }
  },
  methods: {
    // 新增方法
    handleExport() {},
    handleBatchDelete() {},
    toggleAdvancedSearch() {}
  }
}
```

**创建新 Mixin**：
- [ ] `formDialogMixin.js` - 表单对话框逻辑
- [ ] `statisticsMixin.js` - 统计卡片逻辑
- [ ] `exportMixin.js` - 数据导出逻辑

#### Task 2.2: 迁移简单列表页 (2天)

**第一批**（10个页面，无复杂逻辑）：
- [ ] supplier/List.vue
- [ ] material/List.vue
- [ ] die/List.vue
- [ ] artwork/List.vue
- [ ] foilingplate/List.vue
- [ ] embossingplate/List.vue
- [ ] process/List.vue
- [ ] productGroup/List.vue
- [ ] purchase/List.vue
- [ ] task/List.vue

**迁移模板**：
```vue
<script>
import { xxxAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'

export default {
  name: 'XxxList',
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      apiService: xxxAPI,
      permissionPrefix: 'xxx',
      form: { /* 表单字段 */ },
      rules: { /* 验证规则 */ }
    }
  },

  methods: {
    fetchData() {
      return this.apiService.getList({
        page: this.currentPage,
        page_size: this.pageSize,
        search: this.searchText
      })
    }
  }
}
</script>
```

**每个页面迁移步骤**：
1. 添加 Mixin 导入
2. 删除重复的 data 和 methods
3. 保留业务特有逻辑
4. 测试功能完整性
5. 估计减少代码：150-200 行/页面

#### Task 2.3: 迁移财务模块 (1天)

**第二批**（4个页面，有统计卡片）：
- [ ] finance/Invoice.vue
- [ ] finance/Payment.vue
- [ ] finance/Cost.vue
- [ ] finance/Statement.vue

**新增**：
- 使用 `statisticsMixin.js`
- 保留统计卡片逻辑

#### Task 2.4: 迁移库存模块 (1天)

**第三批**（3个页面，有特殊功能）：
- [ ] inventory/Stock.vue
- [ ] inventory/Delivery.vue
- [ ] inventory/Quality.vue

**注意**：
- 保留业务特殊逻辑（库存预警、物流跟踪）
- 可能需要自定义 Mixin

#### Task 2.5: 迁移复杂页面 (2天)

**第四批**（复杂业务逻辑）：
- [ ] workorder/List.vue
- [ ] sales/List.vue
- [ ] task/Board.vue (特殊：看板视图)

**策略**：
- 部分采用 Mixin（基础功能）
- 保留复杂业务逻辑
- 抽取可复用部分为独立 Mixin

---

### Phase 3: 视图标准化 (3-4天)

**目标**: 统一所有页面的视图结构和样式

#### Task 3.1: 创建标准布局组件 (1天)

**新建组件**：
```
components/layout/
├── ListPageLayout.vue        // 列表页标准布局
├── FormPageLayout.vue        // 表单页标准布局
└── DetailPageLayout.vue      // 详情页标准布局
```

**ListPageLayout.vue 结构**：
```vue
<template>
  <div class="list-page-layout">
    <!-- 页面头部 -->
    <div class="page-header">
      <slot name="header">
        <h2>{{ title }}</h2>
      </slot>
      <div class="header-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- 统计卡片（可选）-->
    <div v-if="$slots.stats" class="stats-section">
      <slot name="stats"></slot>
    </div>

    <!-- 搜索/过滤区 -->
    <div class="filter-section">
      <slot name="filters"></slot>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <slot></slot>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <slot name="pagination"></slot>
    </div>
  </div>
</template>
```

#### Task 3.2: 创建通用业务组件 (1天)

**新建组件**：
```
components/business/
├── ListHeader.vue           // 列表页头部（搜索+按钮）
├── TableActionColumn.vue    // 表格操作列
├── CrudDialog.vue          // CRUD 对话框
├── StatCard.vue            // 统计卡片
└── BatchActions.vue        // 批量操作栏
```

**ListHeader.vue**：
```vue
<template>
  <div class="list-header">
    <el-input
      v-model="searchText"
      :placeholder="placeholder"
      clearable
      @input="$emit('search', searchText)"
    >
      <el-button slot="append" icon="el-icon-search" />
    </el-input>

    <div class="header-actions">
      <slot name="actions">
        <el-button
          v-if="showCreate"
          type="primary"
          icon="el-icon-plus"
          @click="$emit('create')"
        >
          {{ createText }}
        </el-button>
      </slot>
    </div>
  </div>
</template>
```

#### Task 3.3: 应用标准布局 (2天)

**迁移所有列表页面使用标准布局**：
```vue
<template>
  <ListPageLayout title="客户列表">
    <!-- 头部操作 -->
    <template #actions>
      <el-button type="primary" @click="handleCreate">新建客户</el-button>
    </template>

    <!-- 统计卡片（可选）-->
    <template #stats>
      <StatCard :data="stats" />
    </template>

    <!-- 搜索过滤 -->
    <template #filters>
      <ListHeader
        v-model="searchText"
        placeholder="搜索客户"
        @search="handleSearch"
      />
    </template>

    <!-- 数据表格 -->
    <el-table :data="tableData">
      <el-table-column prop="name" label="名称" />
      <!-- 操作列 -->
      <TableActionColumn
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </el-table>

    <!-- 分页 -->
    <template #pagination>
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
      />
    </template>
  </ListPageLayout>
</template>
```

**预计影响**：
- 50+ 个页面需要应用新布局
- 每个页面减少 50-100 行模板代码

---

### Phase 4: API 调用统一 (2天)

**目标**: 所有页面使用模块化 API

#### Task 4.1: 更新旧 API 调用 (1天)

**查找所有旧模式**：
```javascript
// ❌ 旧模式
import { getCustomers, createCustomer } from '@/api/customer'

// ✅ 新模式
import { customerAPI } from '@/api/modules'
```

**批量替换**（估计 60+ 个文件）：
- [ ] 查找所有直接函数导入
- [ ] 替换为 API 类调用
- [ ] 测试所有 API 调用

#### Task 4.2: 废弃旧 API 文件 (1天)

**迁移路径**：
```
src/api/
├── customer.js              → 标记为 @deprecated
├── product.js               → 标记为 @deprecated
├── workorder.js             → 标记为 @deprecated
└── modules/
    ├── customer.js          ← 使用此文件
    ├── product.js           ← 使用此文件
    └── workorder.js         ← 使用此文件
```

**操作**：
- [ ] 在旧文件顶部添加废弃警告
- [ ] 更新所有 import 引用
- [ ] 计划在 v3.1.0 完全删除旧文件

---

### Phase 5: 代码质量提升 (2天)

**目标**: ESLint 0错误，完善注释和类型

#### Task 5.1: ESLint 全量修复 (1天)

**运行检查**：
```bash
cd frontend
npm run lint -- --fix
```

**修复项目**：
- [ ] 命名规范（变量、函数、组件）
- [ ] 未使用的变量
- [ ] 缺失的 key 属性
- [ ] console.log 清理

#### Task 5.2: 添加 JSDoc 注释 (1天)

**为所有公共方法添加注释**：
```javascript
/**
 * 获取客户列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @param {string} params.search - 搜索关键词
 * @returns {Promise<Object>} 客户列表数据
 */
async getList(params) {
  return this.request.get(this.baseURL, { params })
}
```

**重点**：
- [ ] API 模块所有方法
- [ ] Mixin 所有方法
- [ ] 公共组件所有 props 和 events

---

### Phase 6: 测试与验证 (2天)

#### Task 6.1: 功能回归测试 (1天)

**测试清单**：
- [ ] 所有列表页面（分页、搜索、CRUD）
- [ ] 所有表单页面（验证、提交）
- [ ] 所有对话框（打开、关闭、数据）
- [ ] 权限控制（按钮显示、操作拦截）
- [ ] 导出功能
- [ ] 统计数据

#### Task 6.2: 性能测试 (0.5天)

**测试项**：
- [ ] 页面首次加载时间
- [ ] 列表渲染性能
- [ ] 路由切换速度
- [ ] 构建包大小

#### Task 6.3: 代码审查 (0.5天)

**检查项**：
- [ ] 命名规范 100% 符合
- [ ] Mixin 采用率 ≥90%
- [ ] ESLint 0 错误
- [ ] 代码重复率 <15%
- [ ] 所有 TODO 已清理

---

## 📐 重构标准规范

### 1. 命名规范

#### 文件命名
```
✅ 正确示例：
views/product-group/ProductGroupList.vue
views/finance/FinanceInvoice.vue
api/modules/product-group.js
components/business/ListHeader.vue

❌ 错误示例：
views/productGroup/List.vue          // 目录驼峰 + 组件名不明确
views/product/list.vue               // 组件名小写
api/productGroup.js                  // 驼峰命名
components/listHeader.vue            // 组件名小写
```

#### 组件命名
```javascript
// ✅ 正确
export default {
  name: 'ProductGroupList'  // 多词 PascalCase
}

// ❌ 错误
export default {
  name: 'List'              // 单词名称
}
```

#### 变量命名
```javascript
// ✅ 正确
const productList = []
const isLoading = false
const handleSubmit = () => {}

// ❌ 错误
const list = []              // 不明确
const loading = false        // 非布尔变量用 is/has 前缀
const submit = () => {}      // 函数应用 handle/on 前缀
```

### 2. 目录结构规范

```
src/
├── api/
│   ├── base/
│   │   └── BaseAPI.js              // API 基类
│   ├── modules/                    // API 模块（全部短横线）
│   │   ├── customer.js
│   │   ├── product.js
│   │   ├── product-group.js
│   │   ├── embossing-plate.js
│   │   └── index.js                // 统一导出
│   └── index.js                    // axios 实例
├── components/
│   ├── common/                     // 通用组件
│   │   ├── Pagination.vue
│   │   └── SearchBar.vue
│   ├── business/                   // 业务组件（新增）
│   │   ├── ListHeader.vue
│   │   ├── TableActionColumn.vue
│   │   └── StatCard.vue
│   └── layout/                     // 布局组件（新增）
│       ├── ListPageLayout.vue
│       └── FormPageLayout.vue
├── mixins/
│   ├── listPageMixin.js
│   ├── crudPermissionMixin.js
│   ├── formDialogMixin.js          // 新增
│   └── statisticsMixin.js          // 新增
├── views/                          // 全部短横线目录
│   ├── customer/
│   │   └── CustomerList.vue
│   ├── product/
│   │   └── ProductList.vue
│   ├── product-group/              // 短横线分隔
│   │   └── ProductGroupList.vue
│   ├── embossing-plate/
│   │   └── EmbossingPlateList.vue
│   ├── finance/
│   │   ├── FinanceInvoice.vue      // 带模块前缀
│   │   └── FinancePayment.vue
│   └── workorder/
│       ├── WorkOrderList.vue
│       ├── WorkOrderForm.vue
│       ├── WorkOrderDetail.vue
│       └── components/             // 页面私有组件
│           └── ProcessSelector.vue
└── utils/
    ├── errorHandler.js
    └── validators.js
```

### 3. 代码风格规范

#### Vue 组件结构顺序
```vue
<template>
  <!-- 1. 模板 -->
</template>

<script>
// 2. 导入
import { xxxAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'

// 3. 组件定义
export default {
  name: 'XxxList',          // 必须

  // 按此顺序
  components: {},
  mixins: [],
  props: {},
  data() {},
  computed: {},
  watch: {},

  // 生命周期（按调用顺序）
  created() {},
  mounted() {},

  methods: {}
}
</script>

<style scoped>
/* 4. 样式 */
</style>
```

#### 列表页面标准模板
```vue
<template>
  <ListPageLayout :title="pageTitle">
    <!-- 头部操作 -->
    <template #actions>
      <el-button
        v-if="canCreate()"
        type="primary"
        icon="el-icon-plus"
        @click="showCreateDialog()"
      >
        新建
      </el-button>
    </template>

    <!-- 搜索过滤 -->
    <template #filters>
      <ListHeader
        v-model="searchText"
        :placeholder="searchPlaceholder"
        @search="handleSearch"
      />
    </template>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
    >
      <!-- 数据列 -->
      <el-table-column prop="name" label="名称" />

      <!-- 操作列 -->
      <TableActionColumn
        :can-edit="canEdit()"
        :can-delete="canDelete()"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </el-table>

    <!-- 分页 -->
    <template #pagination>
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
      />
    </template>
  </ListPageLayout>
</template>

<script>
import { xxxAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ListPageLayout from '@/components/layout/ListPageLayout.vue'
import ListHeader from '@/components/business/ListHeader.vue'
import TableActionColumn from '@/components/business/TableActionColumn.vue'

export default {
  name: 'XxxList',

  components: {
    ListPageLayout,
    ListHeader,
    TableActionColumn
  },

  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      apiService: xxxAPI,
      permissionPrefix: 'xxx',
      pageTitle: 'XXX管理',
      searchPlaceholder: '搜索XXX',
      form: {},
      rules: {}
    }
  },

  methods: {
    fetchData() {
      return this.apiService.getList({
        page: this.currentPage,
        page_size: this.pageSize,
        search: this.searchText
      })
    }
  }
}
</script>

<style scoped>
/* 页面特定样式 */
</style>
```

---

## 🎯 成功标准

### 定量指标

| 指标 | 基线 | 目标 | 验收标准 |
|------|------|------|----------|
| Mixin 采用率 | 13% | 90% | ≥85% 通过 |
| 代码重复率 | 40% | 15% | ≤20% 通过 |
| 命名规范符合率 | 60% | 100% | 100% 通过 |
| ESLint 错误数 | 200+ | 0 | 0 通过 |
| 平均页面行数 | 350 | 200 | ≤250 通过 |
| 构建包大小 | - | -10% | 任意减少通过 |

### 定性标准

- ✅ 所有页面视觉效果一致
- ✅ 开发者能在 5 分钟内理解任何页面代码
- ✅ 新增列表页面只需 30 分钟
- ✅ 文档完整（README + 注释 100% 覆盖）
- ✅ 无功能回归（所有功能正常工作）

---

## 📅 时间规划

### 甘特图

```
Week 1:
Day 1-2:  [Phase 0: 准备] [Phase 1: 命名统一开始]
Day 3-4:  [Phase 1: 命名统一完成]
Day 5:    [Phase 2: Mixin 迁移 - 基础设施]

Week 2:
Day 1-2:  [Phase 2: Mixin 迁移 - 简单页面]
Day 3:    [Phase 2: Mixin 迁移 - 财务模块]
Day 4:    [Phase 2: Mixin 迁移 - 库存模块]
Day 5:    [Phase 2: Mixin 迁移 - 复杂页面]

Week 3:
Day 1:    [Phase 3: 视图标准化 - 创建组件]
Day 2-3:  [Phase 3: 视图标准化 - 应用布局]
Day 4:    [Phase 4: API 调用统一]
Day 5:    [Phase 5: 代码质量提升]

Week 4:
Day 1-2:  [Phase 6: 测试与验证]
Day 3:    [缓冲时间 & 文档完善]
```

### 里程碑

- **M1 (Day 4)**: 命名统一完成 ✅
- **M2 (Day 10)**: Mixin 迁移完成 ✅
- **M3 (Day 15)**: 视图标准化完成 ✅
- **M4 (Day 17)**: API 调用统一完成 ✅
- **M5 (Day 19)**: 代码质量达标 ✅
- **M6 (Day 21)**: 测试通过，发布 v3.0.0 🚀

---

## ⚠️ 风险与应对

### 高风险

#### 风险 1: 重构期间功能冲突
**描述**: 如果同时有新功能开发，会产生代码冲突

**应对**:
- 冻结新功能开发（重构期间）
- 或创建 `dev-freeze` 分支，重构完成后合并
- 每日同步 `main` 分支避免大冲突

#### 风险 2: 回归 Bug
**描述**: 重构可能引入意外 Bug

**应对**:
- 每完成一个 Phase 立即测试
- 保留旧代码分支（`pre-refactor`）
- 建立快速回滚机制
- 关键页面添加单元测试

### 中风险

#### 风险 3: 时间超期
**描述**: 复杂页面迁移可能超出预估时间

**应对**:
- 预留 3 天缓冲时间
- 复杂页面可延后到 v3.1.0
- 优先完成 80% 页面，剩余逐步迁移

#### 风险 4: 开发者抵触
**描述**: 团队成员可能不适应新模式

**应对**:
- 提前培训新架构和 Mixin
- 编写详细文档和示例
- 结对编程辅导
- 强调长期收益（开发效率提升）

---

## 📚 参考资源

### 内部文档
- [CLAUDE.md](../CLAUDE.md) - 项目规范
- [P0_FRONTEND_COMPLETION_REPORT.md](./P0_FRONTEND_COMPLETION_REPORT.md) - 现有实现
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - 开发指南

### 外部资源
- [Vue.js 风格指南](https://v2.vuejs.org/v2/style-guide/)
- [Element UI 最佳实践](https://element.eleme.io/#/zh-CN/component/quickstart)
- [Airbnb JavaScript 规范](https://github.com/airbnb/javascript)

---

## 📝 附录

### A. 需要重命名的文件清单

#### 目录重命名
```bash
views/productGroup/      → views/product-group/
views/foilingplate/      → views/foiling-plate/
views/embossingplate/    → views/embossing-plate/
```

#### 组件重命名 (19个文件)
```bash
# 列表页面 (15个)
customer/List.vue         → customer/CustomerList.vue
product/List.vue          → product/ProductList.vue
product-group/List.vue    → product-group/ProductGroupList.vue
department/List.vue       → department/DepartmentList.vue
process/List.vue          → process/ProcessList.vue
material/List.vue         → material/MaterialList.vue
supplier/List.vue         → supplier/SupplierList.vue
die/List.vue              → die/DieList.vue
artwork/List.vue          → artwork/ArtworkList.vue
embossing-plate/List.vue  → embossing-plate/EmbossingPlateList.vue
foiling-plate/List.vue    → foiling-plate/FoilingPlateList.vue
purchase/List.vue         → purchase/PurchaseList.vue
sales/List.vue            → sales/SalesList.vue
task/List.vue             → task/TaskList.vue
workorder/List.vue        → workorder/WorkOrderList.vue

# 表单页面 (2个)
sales/Form.vue            → sales/SalesForm.vue
workorder/Form.vue        → workorder/WorkOrderForm.vue

# 详情页面 (2个)
sales/Detail.vue          → sales/SalesDetail.vue
workorder/Detail.vue      → workorder/WorkOrderDetail.vue
```

### B. 需要迁移的页面清单 (按优先级)

#### P0 - 简单列表页 (10个) - 第一批迁移
- [ ] supplier/SupplierList.vue
- [ ] material/MaterialList.vue
- [ ] die/DieList.vue
- [ ] artwork/ArtworkList.vue
- [ ] foiling-plate/FoilingPlateList.vue
- [ ] embossing-plate/EmbossingPlateList.vue
- [ ] process/ProcessList.vue
- [ ] product-group/ProductGroupList.vue
- [ ] purchase/PurchaseList.vue
- [ ] task/TaskList.vue

#### P1 - 有统计卡片的页面 (4个) - 第二批
- [ ] finance/Invoice.vue
- [ ] finance/Payment.vue
- [ ] finance/Cost.vue
- [ ] finance/Statement.vue

#### P1 - 有特殊功能的页面 (3个) - 第三批
- [ ] inventory/Stock.vue
- [ ] inventory/Delivery.vue
- [ ] inventory/Quality.vue

#### P2 - 复杂页面 (3个) - 第四批
- [ ] workorder/WorkOrderList.vue
- [ ] sales/SalesList.vue
- [ ] task/Board.vue

#### 暂不迁移 (特殊页面)
- Dashboard.vue (首页，特殊布局)
- Profile.vue (个人信息，特殊布局)
- Login.vue (登录页，无需 Mixin)

---

## 🎉 预期收益

### 开发效率提升

**新建列表页面**：
- 重构前：4-6 小时（写 350 行代码）
- 重构后：0.5-1 小时（写 100 行代码）
- **提升**: 75-80%

**修改通用逻辑**：
- 重构前：修改 60+ 个文件
- 重构后：修改 1 个 Mixin 文件
- **提升**: 98%

### 代码质量提升

**代码重复**：
- 重构前：~5000 行重复代码
- 重构后：~1500 行重复代码
- **减少**: 70%

**可维护性**：
- 统一架构，降低理解成本
- 统一命名，提升可读性
- 统一规范，减少 Bug

### 长期价值

- ✅ 新人上手时间：从 2 周降到 3 天
- ✅ Bug 修复时间：平均减少 50%
- ✅ Code Review 时间：减少 60%
- ✅ 技术债务：基本清零

---

**文档版本**: v1.0.0
**最后更新**: 2026-01-19
**下一步**: 等待审批，开始 Phase 0

**相关文档**:
- [FRONTEND_STANDARDS.md](./FRONTEND_STANDARDS.md) - 前端开发规范（待创建）
- [REFACTOR_PROGRESS.md](./REFACTOR_PROGRESS.md) - 重构进度跟踪（待创建）
