# 前端开发规范

> 印刷施工单跟踪系统前端代码规范指南

**版本**: v3.0.0
**生效日期**: 2026-01-19
**适用范围**: 所有前端代码（Vue.js 2.7 + Element UI）

---

## 📋 目录

- [1. 命名规范](#1-命名规范)
- [2. 目录结构规范](#2-目录结构规范)
- [3. 代码风格规范](#3-代码风格规范)
- [4. 组件开发规范](#4-组件开发规范)
- [5. API 调用规范](#5-api-调用规范)
- [6. 状态管理规范](#6-状态管理规范)
- [7. 路由规范](#7-路由规范)
- [8. 样式规范](#8-样式规范)
- [9. 注释规范](#9-注释规范)
- [10. Git 规范](#10-git-规范)

---

## 1. 命名规范

### 1.1 文件命名

#### 目录命名
**规则**: 全小写，多词使用短横线分隔

```bash
✅ 正确示例：
src/views/product-group/
src/views/embossing-plate/
src/views/foiling-plate/
src/api/modules/

❌ 错误示例：
src/views/productGroup/        # 驼峰命名
src/views/ProductGroup/        # 大驼峰命名
src/views/product_group/       # 下划线分隔
```

#### Vue 组件文件命名
**规则**: PascalCase（大驼峰），多词组合，具有明确业务含义

```bash
✅ 正确示例：
CustomerList.vue              # 客户列表
ProductGroupList.vue          # 产品组列表
WorkOrderForm.vue             # 施工单表单
FinanceInvoice.vue            # 财务发票
EmbossingPlateList.vue        # 烫金版列表

❌ 错误示例：
List.vue                      # 过于通用，不明确
list.vue                      # 小写
customer-list.vue             # 短横线命名（仅在 HTML 中使用）
customerList.vue              # 小驼峰
```

#### JavaScript 文件命名
**规则**: 小驼峰（camelCase）或短横线分隔

```bash
✅ 正确示例：
src/utils/errorHandler.js
src/mixins/listPageMixin.js
src/api/modules/customer.js
src/api/modules/product-group.js

❌ 错误示例：
src/utils/ErrorHandler.js     # 大驼峰（仅用于类定义文件）
src/mixins/list_page_mixin.js # 下划线
```

#### 样式文件命名
**规则**: 与组件同名或使用短横线分隔

```bash
✅ 正确示例：
CustomerList.vue
└── <style scoped>             # 组件内样式

src/assets/styles/common.scss
src/assets/styles/variables.scss
src/assets/styles/list-page.scss
```

---

### 1.2 组件命名

#### 组件 name 属性
**规则**: 必须定义，使用 PascalCase，与文件名一致

```javascript
✅ 正确示例：
// 文件: CustomerList.vue
export default {
  name: 'CustomerList',
  // ...
}

// 文件: ProductGroupList.vue
export default {
  name: 'ProductGroupList',
  // ...
}

❌ 错误示例：
export default {
  name: 'List',              // 过于通用
  // ...
}

export default {
  name: 'customerList',      // 小驼峰
  // ...
}

export default {
  // name 未定义           // 缺少 name
}
```

#### 组件注册命名
**规则**: 局部注册使用 PascalCase，模板中使用 kebab-case

```vue
<template>
  <!-- ✅ 正确：模板中使用 kebab-case -->
  <customer-selector v-model="customerId" />
  <product-list-editor :products="products" />
</template>

<script>
import CustomerSelector from './components/CustomerSelector.vue'
import ProductListEditor from './components/ProductListEditor.vue'

export default {
  // ✅ 正确：注册时使用 PascalCase
  components: {
    CustomerSelector,
    ProductListEditor
  }
}
</script>
```

---

### 1.3 变量命名

#### 普通变量
**规则**: 小驼峰（camelCase），名词或名词短语

```javascript
✅ 正确示例：
const customerList = []
const totalAmount = 0
const pageSize = 20
const selectedItems = []

❌ 错误示例：
const list = []                // 不明确
const total = 0                // 不明确（总什么？）
const page_size = 20           // 下划线
const SelectedItems = []       // 大驼峰
```

#### 布尔变量
**规则**: 使用 is/has/can/should 前缀

```javascript
✅ 正确示例：
const isLoading = false
const hasPermission = true
const canEdit = false
const shouldUpdate = true
const isActive = true

❌ 错误示例：
const loading = false          // 缺少 is 前缀
const permission = true        // 缺少 has 前缀
const edit = false             // 缺少 can 前缀
```

#### 常量
**规则**: 全大写，下划线分隔

```javascript
✅ 正确示例：
const API_BASE_URL = '/api'
const MAX_PAGE_SIZE = 100
const DEFAULT_TIMEOUT = 5000
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
}

❌ 错误示例：
const apiBaseUrl = '/api'      // 小驼峰
const maxPageSize = 100        // 小驼峰
```

---

### 1.4 函数命名

#### 普通函数
**规则**: 小驼峰，动词开头

```javascript
✅ 正确示例：
function fetchData() {}
function calculateTotal() {}
function validateForm() {}
function formatDate() {}

❌ 错误示例：
function data() {}             // 名词
function total() {}            // 名词
function FormValidate() {}     // 大驼峰
```

#### 事件处理函数
**规则**: handle/on 前缀 + 事件名

```javascript
✅ 正确示例：
methods: {
  handleSearch() {},
  handleSubmit() {},
  handlePageChange(page) {},
  handleDelete(id) {},
  onCustomerSelect(customer) {}
}

❌ 错误示例：
methods: {
  search() {},               // 缺少前缀
  submit() {},               // 缺少前缀
  pageChange() {},           // 缺少前缀
  clickDelete() {}           // 应该用 handle
}
```

#### API 函数
**规则**: get/create/update/delete 前缀

```javascript
✅ 正确示例：
async getCustomerList(params) {}
async getCustomerDetail(id) {}
async createCustomer(data) {}
async updateCustomer(id, data) {}
async deleteCustomer(id) {}

❌ 错误示例：
async fetchCustomers() {}      // 应该用 getCustomerList
async customerDetail() {}      // 应该用 getCustomerDetail
async saveCustomer() {}        // 不明确（新建还是更新？）
```

---

### 1.5 CSS 类命名

#### 规则: BEM 命名法或短横线分隔

```scss
✅ 正确示例：
// BEM 命名
.customer-list {}
.customer-list__header {}
.customer-list__item {}
.customer-list__item--active {}

// 短横线分隔
.page-header {}
.search-bar {}
.data-table {}
.action-buttons {}

❌ 错误示例：
.customerList {}              // 驼峰
.customer_list {}             // 下划线
.CustomerList {}              // 大驼峰
```

---

## 2. 目录结构规范

### 2.1 标准目录树

```
frontend/
├── public/                          # 静态资源
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── api/                         # API 接口层
│   │   ├── base/
│   │   │   └── BaseAPI.js          # API 基类
│   │   ├── modules/                # API 模块（按业务分）
│   │   │   ├── customer.js
│   │   │   ├── product.js
│   │   │   ├── product-group.js
│   │   │   ├── workorder.js
│   │   │   ├── task.js
│   │   │   ├── finance.js
│   │   │   ├── inventory.js
│   │   │   └── index.js            # 统一导出
│   │   └── index.js                # axios 实例配置
│   ├── assets/                      # 资源文件
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   │       ├── variables.scss      # 变量
│   │       ├── mixins.scss         # 样式 Mixin
│   │       ├── common.scss         # 公共样式
│   │       └── index.scss          # 入口
│   ├── components/                  # 组件
│   │   ├── common/                 # 通用组件
│   │   │   ├── Pagination.vue
│   │   │   ├── SearchBar.vue
│   │   │   ├── DateRangePicker.vue
│   │   │   ├── StatusTag.vue
│   │   │   └── ImageViewer.vue
│   │   ├── business/               # 业务组件
│   │   │   ├── ListHeader.vue
│   │   │   ├── TableActionColumn.vue
│   │   │   ├── CrudDialog.vue
│   │   │   ├── StatCard.vue
│   │   │   └── BatchActions.vue
│   │   └── layout/                 # 布局组件
│   │       ├── ListPageLayout.vue
│   │       ├── FormPageLayout.vue
│   │       └── DetailPageLayout.vue
│   ├── directives/                  # 自定义指令
│   │   ├── permission.js
│   │   └── index.js
│   ├── filters/                     # 过滤器
│   │   ├── date.js
│   │   ├── number.js
│   │   └── index.js
│   ├── mixins/                      # 混入
│   │   ├── listPageMixin.js        # 列表页 Mixin
│   │   ├── crudMixin.js            # CRUD Mixin
│   │   ├── crudPermissionMixin.js  # 权限 Mixin
│   │   ├── formDialogMixin.js      # 表单对话框 Mixin
│   │   ├── statisticsMixin.js      # 统计 Mixin
│   │   └── index.js
│   ├── router/                      # 路由
│   │   ├── index.js                # 主路由
│   │   └── modules/                # 路由模块（可选）
│   ├── store/                       # Vuex 状态管理
│   │   ├── index.js
│   │   ├── modules/
│   │   │   ├── user.js
│   │   │   ├── workorder.js
│   │   │   └── task.js
│   │   └── getters.js
│   ├── utils/                       # 工具函数
│   │   ├── errorHandler.js         # 错误处理
│   │   ├── validators.js           # 表单验证
│   │   ├── format.js               # 格式化
│   │   └── constants.js            # 常量
│   ├── views/                       # 页面视图（按业务模块分）
│   │   ├── customer/
│   │   │   ├── CustomerList.vue
│   │   │   └── components/         # 页面私有组件
│   │   ├── product/
│   │   │   └── ProductList.vue
│   │   ├── product-group/
│   │   │   └── ProductGroupList.vue
│   │   ├── workorder/
│   │   │   ├── WorkOrderList.vue
│   │   │   ├── WorkOrderForm.vue
│   │   │   ├── WorkOrderDetail.vue
│   │   │   └── components/
│   │   │       ├── ProcessSelector.vue
│   │   │       └── CustomerSelector.vue
│   │   ├── task/
│   │   │   ├── TaskList.vue
│   │   │   ├── TaskBoard.vue
│   │   │   └── components/
│   │   ├── finance/
│   │   │   ├── FinanceInvoice.vue
│   │   │   ├── FinancePayment.vue
│   │   │   └── FinanceCost.vue
│   │   ├── inventory/
│   │   │   ├── InventoryStock.vue
│   │   │   └── InventoryDelivery.vue
│   │   ├── Dashboard.vue
│   │   ├── Login.vue
│   │   └── Layout.vue
│   ├── App.vue                      # 根组件
│   └── main.js                      # 入口文件
├── tests/                           # 测试
│   ├── unit/
│   └── e2e/
├── .eslintrc.js                     # ESLint 配置
├── .prettierrc.js                   # Prettier 配置
├── babel.config.js
├── vue.config.js
└── package.json
```

### 2.2 目录命名规则

| 目录 | 命名规则 | 示例 |
|------|----------|------|
| 业务模块目录 | 小写 + 短横线 | `product-group/`, `embossing-plate/` |
| 功能目录 | 小写 | `api/`, `components/`, `utils/` |
| 子分类目录 | 小写 | `common/`, `business/`, `layout/` |

---

## 3. 代码风格规范

### 3.1 缩进与空格

```javascript
// ✅ 正确：2 空格缩进
export default {
  data() {
    return {
      name: 'test'
    }
  }
}

// ❌ 错误：4 空格或 tab
export default {
    data() {
        return {
            name: 'test'
        }
    }
}
```

### 3.2 引号

**规则**: 统一使用单引号

```javascript
✅ 正确：
const message = 'Hello World'
import CustomerList from './CustomerList.vue'

❌ 错误：
const message = "Hello World"
import CustomerList from "./CustomerList.vue"
```

### 3.3 分号

**规则**: 不使用分号（遵循 Vue.js 官方风格）

```javascript
✅ 正确：
const name = 'test'
const age = 20

❌ 错误：
const name = 'test';
const age = 20;
```

### 3.4 空行

**规则**: 适当使用空行分隔逻辑块

```javascript
✅ 正确：
export default {
  data() {
    return {
      loading: false,
      tableData: []
    }
  },

  computed: {
    total() {
      return this.tableData.length
    }
  },

  methods: {
    async fetchData() {
      this.loading = true

      try {
        const res = await api.getList()
        this.tableData = res.data
      } catch (error) {
        console.error(error)
      } finally {
        this.loading = false
      }
    }
  }
}
```

---

## 4. 组件开发规范

### 4.1 Vue 组件结构顺序

**强制顺序**:

```vue
<template>
  <!-- 1. 模板 -->
</template>

<script>
// 2. 脚本
// 导入顺序：
// - Vue 核心
// - 第三方库
// - 本地组件
// - API
// - Mixins
// - Utils

import { xxxAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import ListPageLayout from '@/components/layout/ListPageLayout.vue'

export default {
  name: 'CustomerList',        // 1. name（必须）

  components: {},               // 2. components
  mixins: [],                   // 3. mixins
  props: {},                    // 4. props
  data() {},                    // 5. data
  computed: {},                 // 6. computed
  watch: {},                    // 7. watch

  // 生命周期钩子（按调用顺序）
  beforeCreate() {},            // 8
  created() {},                 // 9
  beforeMount() {},             // 10
  mounted() {},                 // 11
  beforeUpdate() {},            // 12
  updated() {},                 // 13
  beforeDestroy() {},           // 14
  destroyed() {},               // 15

  methods: {}                   // 16. methods（放最后）
}
</script>

<style scoped>
/* 3. 样式（必须 scoped）*/
</style>
```

### 4.2 Props 定义规范

**规则**: 必须定义类型、默认值、验证

```javascript
✅ 正确：
props: {
  // 基础类型
  title: {
    type: String,
    default: ''
  },

  // 数字类型（必须定义默认值）
  pageSize: {
    type: Number,
    default: 20
  },

  // 布尔类型
  loading: {
    type: Boolean,
    default: false
  },

  // 数组/对象（使用工厂函数）
  items: {
    type: Array,
    default: () => []
  },

  options: {
    type: Object,
    default: () => ({})
  },

  // 必填项
  customerId: {
    type: Number,
    required: true
  },

  // 自定义验证
  status: {
    type: String,
    validator: value => ['pending', 'approved', 'rejected'].includes(value)
  }
}

❌ 错误：
props: ['title', 'pageSize']    // 缺少类型定义

props: {
  title: String,                // 缺少默认值
  items: Array                  // 数组应该用工厂函数
}
```

### 4.3 Data 定义规范

```javascript
✅ 正确：
data() {
  return {
    // 分组定义，加注释
    // 状态标志
    loading: false,
    submitting: false,

    // 列表数据
    tableData: [],
    total: 0,
    currentPage: 1,
    pageSize: 20,

    // 表单数据
    form: {
      name: '',
      age: 0
    },

    // 搜索条件
    searchText: '',
    filters: {}
  }
}

❌ 错误：
data() {
  return {
    a: false,              // 命名不明确
    data: [],              // 命名过于通用
    page: 1,               // 应该是 currentPage
    size: 20               // 应该是 pageSize
  }
}
```

### 4.4 Computed 规范

```javascript
✅ 正确：
computed: {
  // 简单计算属性
  total() {
    return this.tableData.length
  },

  // 带 getter/setter
  fullName: {
    get() {
      return `${this.firstName} ${this.lastName}`
    },
    set(value) {
      const [first, last] = value.split(' ')
      this.firstName = first
      this.lastName = last
    }
  },

  // 使用 Vuex
  ...mapState('user', ['userInfo']),
  ...mapGetters('user', ['userName'])
}

❌ 错误：
computed: {
  total() {
    // ❌ 不要在 computed 中修改 data
    this.count++
    return this.tableData.length
  },

  async getData() {
    // ❌ 不要使用异步函数
    return await api.getList()
  }
}
```

### 4.5 Methods 规范

```javascript
✅ 正确：
methods: {
  // 分组定义，加注释
  // === 数据获取 ===
  async fetchData() {
    this.loading = true
    try {
      const res = await this.apiService.getList({
        page: this.currentPage,
        page_size: this.pageSize
      })
      this.tableData = res.data
      this.total = res.count
    } catch (error) {
      this.$message.error('获取数据失败')
    } finally {
      this.loading = false
    }
  },

  // === 事件处理 ===
  handleSearch() {
    this.currentPage = 1
    this.fetchData()
  },

  handlePageChange(page) {
    this.currentPage = page
    this.fetchData()
  },

  // === CRUD 操作 ===
  async handleCreate() {
    // ...
  },

  async handleEdit(row) {
    // ...
  },

  async handleDelete(id) {
    // ...
  }
}
```

---

## 5. API 调用规范

### 5.1 API 模块定义

**文件**: `src/api/modules/customer.js`

```javascript
import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

/**
 * 客户 API
 */
class CustomerAPI extends BaseAPI {
  constructor() {
    super('/customers/', request)
  }

  /**
   * 获取客户统计信息
   * @returns {Promise<Object>}
   */
  async getStatistics() {
    return this.request.get(`${this.baseURL}statistics/`)
  }

  /**
   * 批量导入客户
   * @param {File} file - Excel 文件
   * @returns {Promise<Object>}
   */
  async batchImport(file) {
    const formData = new FormData()
    formData.append('file', file)
    return this.request.post(`${this.baseURL}batch_import/`, formData)
  }
}

export const customerAPI = new CustomerAPI()
```

### 5.2 页面中使用 API

```javascript
✅ 正确：
import { customerAPI } from '@/api/modules'

export default {
  data() {
    return {
      apiService: customerAPI  // 赋值给 apiService
    }
  },

  methods: {
    async fetchData() {
      // 使用 apiService
      const res = await this.apiService.getList({
        page: this.currentPage,
        page_size: this.pageSize
      })
      this.tableData = res.data
    },

    async handleCreate() {
      await this.apiService.create(this.form)
    }
  }
}

❌ 错误：
// 不要直接导入函数
import { getCustomers, createCustomer } from '@/api/customer'

// 不要直接调用 axios
import request from '@/api/index'
request.get('/api/customers/')
```

### 5.3 错误处理

```javascript
✅ 正确：
import ErrorHandler from '@/utils/errorHandler'

methods: {
  async handleSubmit() {
    try {
      await this.apiService.create(this.form)
      ErrorHandler.showSuccess('创建成功')
      this.dialogVisible = false
      this.fetchData()
    } catch (error) {
      ErrorHandler.showMessage(error, '创建客户')
    }
  },

  async handleDelete(id) {
    try {
      await ErrorHandler.confirm('确定要删除吗？')
      await this.apiService.delete(id)
      ErrorHandler.showSuccess('删除成功')
      this.fetchData()
    } catch (error) {
      if (error !== 'cancel') {
        ErrorHandler.showMessage(error, '删除客户')
      }
    }
  }
}
```

---

## 6. 状态管理规范

### 6.1 Vuex Module 结构

```javascript
// store/modules/user.js

const state = {
  userInfo: null,
  token: null
}

const getters = {
  userName: state => state.userInfo?.name || '',
  isLoggedIn: state => !!state.token
}

const mutations = {
  SET_USER_INFO(state, userInfo) {
    state.userInfo = userInfo
  },

  SET_TOKEN(state, token) {
    state.token = token
  }
}

const actions = {
  async login({ commit }, credentials) {
    const res = await authAPI.login(credentials)
    commit('SET_TOKEN', res.token)
    commit('SET_USER_INFO', res.user)
  },

  logout({ commit }) {
    commit('SET_TOKEN', null)
    commit('SET_USER_INFO', null)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
```

### 6.2 组件中使用 Vuex

```javascript
✅ 正确：
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  computed: {
    ...mapState('user', ['userInfo']),
    ...mapGetters('user', ['userName', 'isLoggedIn'])
  },

  methods: {
    ...mapActions('user', ['login', 'logout']),

    async handleLogin() {
      await this.login(this.credentials)
      this.$router.push('/')
    }
  }
}
```

---

## 7. 路由规范

### 7.1 路由定义

```javascript
// router/index.js

export default [
  {
    path: '/customers',
    name: 'CustomerList',
    component: () => import(
      /* webpackChunkName: "customer" */
      '@/views/customer/CustomerList.vue'
    ),
    meta: {
      title: '客户列表',
      requiresAuth: true,
      permission: 'customer.view'
    }
  },

  {
    path: '/products',
    name: 'ProductList',
    component: () => import(
      /* webpackChunkName: "product" */
      '@/views/product/ProductList.vue'
    ),
    meta: {
      title: '产品列表',
      requiresAuth: true
    }
  }
]
```

### 7.2 路由命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| path | 小写 + 短横线 | `/product-groups`, `/work-orders` |
| name | PascalCase | `ProductGroupList`, `WorkOrderForm` |
| meta.title | 中文 | `产品组列表`, `施工单表单` |

---

## 8. 样式规范

### 8.1 Scoped 样式

**规则**: 组件样式必须使用 scoped

```vue
✅ 正确：
<style scoped>
.customer-list {
  padding: 20px;
}

.customer-list__header {
  margin-bottom: 20px;
}
</style>

❌ 错误：
<style>
.list {  /* 全局污染 */
  padding: 20px;
}
</style>
```

### 8.2 BEM 命名

```scss
✅ 正确：
.customer-list {
  // Block
  &__header {
    // Element
    display: flex;
  }

  &__item {
    padding: 10px;

    &--active {
      // Modifier
      background: #f0f0f0;
    }
  }
}

❌ 错误：
.customerList {}        // 驼峰
.customer_list {}       // 下划线
```

### 8.3 样式层级

**规则**: 最多 3 层嵌套

```scss
✅ 正确：
.customer-list {
  .header {
    .title {
      font-size: 18px;
    }
  }
}

❌ 错误：
.customer-list {
  .header {
    .left {
      .title {
        .text {  // 超过 3 层
          font-size: 18px;
        }
      }
    }
  }
}
```

---

## 9. 注释规范

### 9.1 文件头注释

```javascript
/**
 * 客户列表页面
 * @module views/customer/CustomerList
 * @description 客户信息的列表展示、搜索、CRUD 操作
 * @author Your Name
 * @date 2026-01-19
 */
```

### 9.2 函数注释

```javascript
/**
 * 获取客户列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.page_size - 每页数量
 * @param {string} [params.search] - 搜索关键词（可选）
 * @returns {Promise<Object>} 返回客户列表数据
 * @throws {Error} 网络错误或业务错误
 */
async getList(params) {
  return this.request.get(this.baseURL, { params })
}
```

### 9.3 复杂逻辑注释

```javascript
methods: {
  async fetchData() {
    this.loading = true

    try {
      // 1. 构建查询参数
      const params = {
        page: this.currentPage,
        page_size: this.pageSize
      }

      // 2. 如果有搜索条件，添加到参数中
      if (this.searchText) {
        params.search = this.searchText
      }

      // 3. 调用 API 获取数据
      const res = await this.apiService.getList(params)

      // 4. 更新表格数据
      this.tableData = res.data
      this.total = res.count
    } catch (error) {
      this.$message.error('获取数据失败')
    } finally {
      this.loading = false
    }
  }
}
```

### 9.4 TODO 注释

```javascript
// TODO: 添加导出功能
// FIXME: 修复分页重置问题
// HACK: 临时方案，需要后端支持
// NOTE: 注意这里的逻辑依赖于 XXX
```

---

## 10. Git 规范

### 10.1 分支命名

```bash
feat/customer-list          # 新功能
fix/pagination-bug          # Bug 修复
refactor/api-module         # 重构
perf/list-rendering         # 性能优化
docs/update-readme          # 文档更新
test/add-unit-tests         # 测试
chore/update-deps           # 依赖更新
```

### 10.2 Commit 消息

**格式**: `<type>: <subject>`

```bash
✅ 正确：
feat: 添加客户列表搜索功能
fix: 修复分页跳转错误
refactor: 重构 API 模块为类模式
perf: 优化列表渲染性能
docs: 更新开发规范文档
test: 添加客户模块单元测试
chore: 更新依赖到最新版本
style: 统一代码格式

❌ 错误：
update code              # 不明确
修复 bug                 # 缺少类型前缀
feat:add feature         # 缺少空格
```

---

## 📋 检查清单

### 代码提交前检查

- [ ] 所有文件命名符合规范
- [ ] 组件 name 属性已定义
- [ ] Props 有完整的类型和默认值
- [ ] 使用了 scoped 样式
- [ ] ESLint 0 错误
- [ ] 删除了 console.log
- [ ] 添加了必要的注释
- [ ] Commit 消息符合规范

### Code Review 检查

- [ ] 命名是否清晰明确
- [ ] 是否有重复代码
- [ ] 是否正确使用了 Mixin
- [ ] API 调用是否规范
- [ ] 错误处理是否完善
- [ ] 样式是否污染全局
- [ ] 是否有性能问题

---

## 📚 参考资源

- [Vue.js 官方风格指南](https://v2.vuejs.org/v2/style-guide/)
- [Element UI 文档](https://element.eleme.io/#/zh-CN)
- [Airbnb JavaScript 风格指南](https://github.com/airbnb/javascript)
- [BEM 命名规范](http://getbem.com/)

---

**文档版本**: v1.0.0
**最后更新**: 2026-01-19
**维护者**: 开发团队

**相关文档**:
- [FRONTEND_REFACTOR_PLAN.md](./FRONTEND_REFACTOR_PLAN.md) - 重构计划
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) - 开发指南
