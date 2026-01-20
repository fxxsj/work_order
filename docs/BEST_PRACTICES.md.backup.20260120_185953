# 印刷施工单跟踪系统 - 最佳实践文档

> 基于产品管理模块（v3.0）的前后端开发规范

**版本**: v3.0
**最后更新**: 2026-01-20
**参考模块**: Product（产品管理）

---

## 目录

1. [架构概述](#架构概述)
2. [后端开发规范](#后端开发规范)
3. [前端开发规范](#前端开发规范)
4. [API 设计规范](#api-设计规范)
5. [数据库设计规范](#数据库设计规范)
6. [测试规范](#测试规范)
7. [代码审查清单](#代码审查清单)

---

## 架构概述

### v3.0 架构原则

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (Vue.js)                       │
├─────────────────────────────────────────────────────────┤
│  视图层 (Views)    │  组件层 (Components)  │  API层      │
│  - ProductList.vue │  - ProductSelector   │  modules/   │
│                   │  - ProductListEditor │  - product.js│
├─────────────────────────────────────────────────────────┤
│                    Mixins 层                            │
│  - listPageMixin    (列表页逻辑)                         │
│  - crudMixin        (CRUD操作)                          │
│  - crudPermissionMixin (权限控制)                       │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                    后端 (Django)                         │
├─────────────────────────────────────────────────────────┤
│  视图层 (Views)    │  序列化器 (Serializers) │  模型      │
│  - ProductViewSet  │  - ProductSerializer   │  - Product │
│                   │                        │            │
│  权限层           │  验证层                │  业务逻辑   │
│  - SuperuserFrie- │  - validate_*()        │  - methods  │
│    ndlyModelPerm  │  - validate()          │            │
└─────────────────────────────────────────────────────────┘
```

### 核心设计原则

1. **单一职责**：每个类/模块只负责一项功能
2. **DRY（Don't Repeat Yourself）**：使用 Mixins、BaseAPI 等抽象减少重复
3. **约定优于配置**：遵循项目既定的模式和命名规范
4. **渐进式增强**：从简单功能开始，按需增加复杂度

---

## 后端开发规范

### 1. 模型设计（Models）

#### 1.1 基本结构

```python
# backend/workorder/models/products.py

from django.db import models, transaction

class Product(models.Model):
    """产品信息

    产品管理核心模型，包含基本信息、库存管理和关联配置。
    """

    # 基本信息
    name = models.CharField('产品名称', max_length=200)
    code = models.CharField('产品编码', max_length=50, unique=True)

    # 业务字段
    unit_price = models.DecimalField('单价', max_digits=10, decimal_places=2, default=0)
    stock_quantity = models.IntegerField('库存数量', default=0)

    # 元数据
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    # 关联关系
    default_processes = models.ManyToManyField(
        'Process',
        blank=True,
        verbose_name='默认工序',
        help_text='创建施工单时将自动添加这些工序'
    )

    class Meta:
        verbose_name = '产品'
        verbose_name_plural = '产品管理'
        ordering = ['code']

        # 性能优化：为高频查询字段添加索引
        indexes = [
            models.Index(fields=['name'], name='product_name_idx'),
            models.Index(fields=['is_active'], name='product_is_active_idx'),
            models.Index(fields=['stock_quantity'], name='product_stock_idx'),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    @transaction.atomic
    def business_method(self):
        """业务方法必须使用事务保护"""
        # 业务逻辑
        pass
```

#### 1.2 字段定义规范

| 规范 | 说明 | 示例 |
|------|------|------|
| **命名** | 使用清晰的中英文对照 | `name = models.CharField('产品名称', ...)` |
| **verbose_name** | 必须提供，用于 Admin 和 API 显示 | `verbose_name='产品'` |
| **help_text** | 复杂字段必须提供说明 | `help_text='库存低于此数量时触发预警'` |
| **default** | 为字段提供合理的默认值 | `default=True`, `default=0` |
| **blank/null** | CharField 用 `blank=True`，其他用 `null=True` | `blank=True`, `null=True` |
| **索引** | 高频查询字段（搜索、过滤）添加索引 | `indexes=[...]` |

#### 1.3 关联关系规范

```python
# 一对多（ForeignKey）
product = models.ForeignKey(
    Product,
    on_delete=models.PROTECT,  # 防止误删
    related_name='materials',  # 反向查询名称
    verbose_name='产品'
)

# 多对多（ManyToMany）
default_processes = models.ManyToManyField(
    'Process',               # 使用字符串引用避免循环导入
    blank=True,              # 允许为空
    verbose_name='默认工序',
    help_text='创建施工单时将自动添加这些工序'
)
```

#### 1.4 业务方法规范

```python
# ✅ 好的实践：使用事务保护
@transaction.atomic
def add_stock(self, quantity, user=None, reason=''):
    """增加库存数量（带事务保护）

    Args:
        quantity: 增加的数量（必须大于0）
        user: 操作用户
        reason: 变更原因

    Returns:
        bool: 操作是否成功

    Raises:
        ValueError: 当数量无效时
    """
    if quantity <= 0:
        return False

    old_quantity = self.stock_quantity
    self.stock_quantity += quantity
    self.save(update_fields=['stock_quantity'])

    # 创建日志
    ProductStockLog.objects.create(
        product=self,
        quantity=quantity,
        old_quantity=old_quantity,
        new_quantity=self.stock_quantity,
        reason=reason,
        created_by=user
    )

    return True

# ❌ 不好的实践：缺少事务保护
def add_stock(self, quantity):
    self.stock_quantity += quantity
    self.save()  # 如果日志创建失败，库存已更改但无记录
```

---

### 2. 序列化器（Serializers）

#### 2.1 基本结构

```python
# backend/workorder/serializers/products.py

from rest_framework import serializers
import re
from ..models.products import Product

class ProductSerializer(serializers.ModelSerializer):
    """产品序列化器

    提供完整的字段验证和业务规则检查。
    """
    # 只读关联字段
    default_materials = ProductMaterialSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'

    # 字段级验证
    def validate_code(self, value):
        """验证产品编码格式

        确保编码只包含合法字符（字母、数字、连字符）。
        """
        if not value:
            raise serializers.ValidationError("产品编码不能为空")

        if not re.match(r'^[A-Za-z0-9-]+$', value):
            raise serializers.ValidationError("产品编码只能包含字母、数字和连字符")

        if len(value) < 2 or len(value) > 50:
            raise serializers.ValidationError("产品编码长度必须在2-50个字符之间")

        return value

    def validate_unit_price(self, value):
        """验证单价"""
        if value < 0:
            raise serializers.ValidationError("单价不能为负数")
        if value > 99999999.99:
            raise serializers.ValidationError("单价超出允许范围")
        return value

    # 对象级验证
    def validate(self, attrs):
        """对象级业务规则验证

        检查字段之间的业务关系。
        """
        stock_quantity = attrs.get('stock_quantity', 0)
        min_stock_quantity = attrs.get('min_stock_quantity', 0)

        # 编辑模式：最小库存不能大于当前库存
        if self.instance and min_stock_quantity > stock_quantity:
            raise serializers.ValidationError({
                'min_stock_quantity': '最小库存不能大于当前库存数量'
            })

        return attrs
```

#### 2.2 验证规范

| 验证类型 | 使用场景 | 示例 |
|---------|---------|------|
| **字段级** | 单个字段的格式、范围验证 | `validate_code()`, `validate_unit_price()` |
| **对象级** | 多个字段之间的关系验证 | `validate()` 检查库存逻辑 |
| **自定义** | 复杂业务规则验证 | 在 `validate()` 中实现 |

#### 2.3 嵌套序列化器

```python
class ProductMaterialSerializer(serializers.ModelSerializer):
    """产品物料序列化器"""
    # 添加关联对象信息（只读）
    material_name = serializers.SerializerMethodField()
    material_code = serializers.SerializerMethodField()

    class Meta:
        model = ProductMaterial
        fields = '__all__'

    def get_material_name(self, obj):
        return obj.material.name if obj.material else None

    def get_material_code(self, obj):
        return obj.material.code if obj.material else None
```

---

### 3. 视图（Views）

#### 3.1 基本结构

```python
# backend/workorder/views/products.py

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from ..permissions import SuperuserFriendlyModelPermissions
from ..models.products import Product
from ..serializers.products import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    """产品视图集

    提供产品的 CRUD 操作、搜索、过滤和排序功能。
    """
    # 权限控制
    permission_classes = [SuperuserFriendlyModelPermissions]

    # 查询配置
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    # 过滤和搜索
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'specification']
    ordering_fields = ['code', 'created_at']
    ordering = ['code']

    def get_queryset(self):
        """优化查询性能"""
        queryset = super().get_queryset()
        return queryset.prefetch_related(
            'default_materials__material',
            'default_processes'
        )
```

#### 3.2 性能优化

```python
# ✅ 好的实践：使用 prefetch_related 优化多对多查询
def get_queryset(self):
    queryset = super().get_queryset()
    return queryset.prefetch_related(
        'default_materials__material',  # 预加载嵌套关联
        'default_processes'
    )

# ✅ 好的实践：使用 select_related 优化外键查询
def get_queryset(self):
    queryset = super().get_queryset()
    return queryset.select_related(
        'category',
        'manufacturer'
    )

# ❌ 不好的实践：N+1 查询问题
def get_queryset(self):
    return Product.objects.all()  # 每个产品都会触发额外的查询
```

#### 3.3 过滤器配置

```python
# 简单过滤：直接指定字段
filterset_fields = ['is_active', 'category']

# 复杂过滤：自定义 FilterSet
from django_filters import FilterSet

class ProductFilter(FilterSet):
    class Meta:
        model = Product
        fields = {
            'name': ['exact', 'contains'],
            'unit_price': ['exact', 'gte', 'lte'],
            'is_active': ['exact'],
        }
```

---

## 前端开发规范

### 1. API 模块化（v3.0 核心）

#### 1.1 API 模块结构

```
frontend/src/api/
├── index.js              # Axios 实例配置
├── base/
│   └── BaseAPI.js        # API 基类
└── modules/
    ├── product.js        # 产品 API（参考模块）
    ├── customer.js
    ├── process.js
    └── ...
```

#### 1.2 BaseAPI 基类

```javascript
// frontend/src/api/base/BaseAPI.js

import request from '@/api/index'

export class BaseAPI {
  /**
   * API 基类 - 提供标准 CRUD 操作
   *
   * @param {string} baseURL - API 基础路径
   * @param {Object} httpRequest - Axios 请求实例
   */
  constructor(baseURL, httpRequest) {
    this.baseURL = baseURL
    this.request = httpRequest
  }

  /**
   * 获取列表数据
   * @param {Object} params - 查询参数（分页、搜索、过滤）
   * @returns {Promise} API 响应
   */
  getList(params = {}) {
    return this.request({
      url: this.baseURL,
      method: 'get',
      params
    })
  }

  /**
   * 获取详情数据
   * @param {number} id - 资源 ID
   * @returns {Promise} API 响应
   */
  getDetail(id) {
    return this.request({
      url: `${this.baseURL}${id}/`,
      method: 'get'
    })
  }

  /**
   * 创建资源
   * @param {Object} data - 创建数据
   * @returns {Promise} API 响应
   */
  create(data) {
    return this.request({
      url: this.baseURL,
      method: 'post',
      data
    })
  }

  /**
   * 更新资源
   * @param {number} id - 资源 ID
   * @param {Object} data - 更新数据
   * @returns {Promise} API 响应
   */
  update(id, data) {
    return this.request({
      url: `${this.baseURL}${id}/`,
      method: 'put'  // 或 'patch' 部分更新
    })
  }

  /**
   * 删除资源
   * @param {number} id - 资源 ID
   * @returns {Promise} API 响应
   */
  delete(id) {
    return this.request({
      url: `${this.baseURL}${id}/`,
      method: 'delete'
    })
  }
}
```

#### 1.3 创建 API 模块

```javascript
// frontend/src/api/modules/product.js

/**
 * 产品管理 API
 *
 * 提供产品的完整 CRUD 操作。
 * 继承 BaseAPI，无需编写重复代码。
 */

import request from '@/api/index'
import { BaseAPI } from '@/api/base/BaseAPI'

class ProductAPI extends BaseAPI {
  constructor() {
    super('/products/', request)
  }

  // ✅ 如果需要自定义方法，在此添加
  // 示例：批量操作
  batchDelete(ids) {
    return this.request({
      url: `${this.baseURL}batch_delete/`,
      method: 'post',
      data: { ids }
    })
  }
}

// 导出单例
export const productAPI = new ProductAPI()
export default productAPI
```

#### 1.4 使用 API 模块

```javascript
// 在组件或视图中使用
import { productAPI } from '@/api/modules'

export default {
  methods: {
    async loadData() {
      const response = await productAPI.getList({
        page: 1,
        page_size: 20,
        search: '关键词',
        is_active: true
      })
      this.tableData = response.results
      this.total = response.count
    },

    async createItem(data) {
      try {
        const result = await productAPI.create(data)
        this.$message.success('创建成功')
        return result
      } catch (error) {
        this.$message.error('创建失败')
      }
    }
  }
}
```

---

### 2. 列表页面开发

#### 2.1 使用 Mixins 模式

```vue
<!-- frontend/src/views/product/ProductList.vue -->

<template>
  <div class="product-list">
    <el-card>
      <!-- 搜索栏 -->
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索产品名称、编码"
          clearable
          @input="handleSearchDebounced"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
        </el-input>
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="showCreateDialog"
        >
          新建产品
        </el-button>
      </div>

      <!-- 数据表格 -->
      <el-table v-loading="loading" :data="tableData">
        <el-table-column prop="code" label="产品编码" />
        <el-table-column prop="name" label="产品名称" />
        <!-- ... 其他列 ... -->
        <el-table-column label="操作" width="150">
          <template slot-scope="scope">
            <el-button
              v-if="canEdit()"
              type="text"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
              type="text"
              style="color: #F56C6C;"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />

      <!-- 空状态（必需） -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无产品数据"
        :image-size="200"
      >
        <el-button v-if="canCreate()" type="primary" @click="showCreateDialog">
          创建第一个产品
        </el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script>
import { productAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'ProductList',
  components: { Pagination },

  // ✅ 使用 Mixins 简化开发
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务（必需）
      apiService: productAPI,

      // 权限前缀（必需）
      permissionPrefix: 'product',

      // 对话框状态（如果不用 crudMixin）
      dialogVisible: false,
      dialogType: 'create',
      formLoading: false,
      currentRow: null,

      // 表单数据
      form: {
        code: '',
        name: '',
        // ...
      },

      // 验证规则
      rules: {
        code: [
          { required: true, message: '请输入产品编码', trigger: 'blur' }
        ],
        // ...
      }
    }
  },

  methods: {
    // ✅ 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize
      }

      if (this.searchText) {
        params.search = this.searchText
      }

      return this.apiService.getList(params)
    },

    // ✅ 实现 CRUD 操作
    showCreateDialog() {
      this.resetForm()
      this.dialogType = 'create'
      this.currentRow = null
      this.dialogVisible = true
    },

    handleEdit(row) {
      this.dialogType = 'edit'
      this.currentRow = row
      this.loadProductDetail(row)
      this.dialogVisible = true
    },

    async handleDelete(row) {
      try {
        await this.$confirm(
          `确定要删除产品"${row.name}"吗？此操作不可撤销。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await this.apiService.delete(row.id)
        this.$message.success('删除成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          this.showMessage(error, '删除失败')
        }
      }
    },

    // ✅ 统一错误处理
    showMessage(error, defaultMessage = '操作失败') {
      let message = defaultMessage

      if (error.response?.data) {
        message = error.response.data.detail ||
                  error.response.data.message ||
                  error.response.data.error ||
                  message
      } else if (error.message) {
        message = error.message
      }

      this.$message.error(message)
    }
  }
}
</script>
```

#### 2.2 Mixins 说明

| Mixin | 功能 | 使用场景 |
|-------|------|----------|
| **listPageMixin** | 列表页基础逻辑（分页、搜索、加载） | 所有列表页面 |
| **crudMixin** | CRUD 操作（创建、编辑、删除） | 简单 CRUD 页面 |
| **crudPermissionMixin** | 权限检查方法 | 需要权限控制的页面 |

**组合策略**：
- 简单列表：`listPageMixin + crudMixin`
- 复杂表单：`listPageMixin + crudPermissionMixin`（手动实现表单）
- 只读列表：`listPageMixin`

---

### 3. 组件开发规范

#### 3.1 组件命名

```javascript
// ✅ 好的命名：清晰、语义化
ProductList.vue        // 产品列表
ProductSelector.vue    // 产品选择器
ProductListEditor.vue  // 产品列表编辑器

// ❌ 不好的命名：模糊、不清晰
List.vue
Selector.vue
Editor.vue
```

#### 3.2 Props 验证

```javascript
export default {
  name: 'ProductSelector',

  // ✅ 必须定义 Props 类型和默认值
  props: {
    value: {
      type: Number,        // 类型检查
      default: null,       // 默认值
      required: false      // 是否必需
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: '请选择'
    }
  }
}
```

#### 3.3 事件规范

```javascript
// ✅ 好的实践：提供 v-model 支持
export default {
  methods: {
    handleChange(value) {
      // 同时触发 input 和 change 事件
      this.$emit('input', value)
      this.$emit('change', value)
    }
  }
}

// 使用
<ProductSelector v-model="productId" @change="handleProductChange" />
```

---

### 4. 状态管理规范

#### 4.1 必需处理的状态

| 状态 | 说明 | 实现方式 |
|------|------|----------|
| **loading** | 数据加载中 | `v-loading="loading"` |
| **error** | 错误提示 | `this.$message.error()` |
| **empty** | 空状态显示 | `<el-empty>` 组件 |
| **success** | 成功提示 | `this.$message.success()` |

#### 4.2 状态处理示例

```vue
<template>
  <!-- loading 状态 -->
  <el-table v-loading="loading" :data="tableData">

  <!-- empty 状态（必需） -->
  <el-empty
    v-if="!loading && tableData.length === 0"
    description="暂无数据"
  />

  <!-- error 状态 -->
  <el-alert
    v-if="error"
    type="error"
    :title="error"
    show-icon
  />
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      error: null,
      tableData: []
    }
  },

  methods: {
    async loadData() {
      this.loading = true
      this.error = null

      try {
        const response = await this.apiService.getList()
        this.tableData = response.results
      } catch (error) {
        this.error = '加载数据失败'
        this.$message.error(this.error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
```

---

### 5. 错误处理规范

#### 5.1 统一错误处理

```javascript
// ✅ 创建统一的错误处理方法
methods: {
  showMessage(error, defaultMessage = '操作失败') {
    let message = defaultMessage

    // 从错误响应中提取信息
    if (error.response?.data) {
      const data = error.response.data

      // 支持多种错误格式
      message = data.detail ||
                data.message ||
                data.error ||
                (typeof data === 'string' ? data : message)
    } else if (error.message) {
      message = error.message
    }

    this.$message.error(message)
  }
}

// 使用
try {
  await this.apiService.delete(id)
} catch (error) {
  this.showMessage(error, '删除失败')
}
```

#### 5.2 API 错误处理

```javascript
// ✅ 好的实践：提供用户友好的错误提示
async loadProductList() {
  try {
    const response = await productAPI.getList()
    this.productList = response.results
  } catch (error) {
    console.error('加载产品列表失败:', error)
    this.$message.error('加载产品列表失败')  // 用户提示
  }
}

// ❌ 不好的实践：只记录日志，不提示用户
async loadProductList() {
  try {
    const response = await productAPI.getList()
    this.productList = response.results
  } catch (error) {
    console.error(error)  // 用户不知道发生了什么
  }
}
```

---

## API 设计规范

### 1. URL 设计

```
# ✅ 好的实践：RESTful 风格
GET    /api/products/           # 列表
GET    /api/products/{id}/      # 详情
POST   /api/products/           # 创建
PUT    /api/products/{id}/      # 更新
DELETE /api/products/{id}/      # 删除

# ❌ 不好的实践：不符合 RESTful
GET    /api/getProducts/
GET    /api/product/{id}/
POST   /api/createProduct/
```

### 2. 响应格式

```json
{
  "count": 100,
  "next": "http://api.example.com/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "产品A",
      "code": "PROD-001"
    }
  ]
}
```

### 3. 错误响应

```json
{
  "detail": "产品编码不能为空",
  "error_code": "invalid_code"
}
```

---

## 数据库设计规范

### 1. 索引优化

```python
class Meta:
    indexes = [
        # 搜索字段
        models.Index(fields=['name'], name='product_name_idx'),

        # 过滤字段
        models.Index(fields=['is_active'], name='product_is_active_idx'),

        # 组合索引
        models.Index(
            fields=['category', 'is_active'],
            name='product_category_active_idx'
        ),
    ]
```

### 2. 字段选择

| 字段类型 | 使用场景 | 示例 |
|---------|---------|------|
| **CharField** | 短文本（< 255 字符） | 名称、编码 |
| **TextField** | 长文本 | 描述、备注 |
| **IntegerField** | 整数 | 库存、数量 |
| **DecimalField** | 金额 | 单价、总价 |
| **BooleanField** | 是/否 | 是否启用 |
| **DateTimeField** | 时间戳 | 创建时间 |

---

## 测试规范

### 1. 后端测试结构

```python
# backend/workorder/tests/test_products.py

from django.test import TestCase
from rest_framework.test import APITestCase

class ProductModelTest(TestCase):
    """模型测试"""

    def test_str_method(self):
        """测试 __str__ 方法"""
        product = Product.objects.create(
            code='PROD-001',
            name='测试产品'
        )
        self.assertEqual(str(product), 'PROD-001 - 测试产品')

class ProductSerializerTest(TestCase):
    """序列化器测试"""

    def test_validate_code_valid(self):
        """测试有效的产品编码"""
        from workorder.serializers.products import ProductSerializer

        serializer = ProductSerializer(data={
            'code': 'PROD-001',
            'name': '测试产品'
        })

        self.assertTrue(serializer.is_valid())

    def test_validate_code_invalid(self):
        """测试无效的产品编码"""
        serializer = ProductSerializer(data={
            'code': 'PROD_001',  # 包含下划线
            'name': '测试产品'
        })

        self.assertFalse(serializer.is_valid())
        self.assertIn('code', serializer.errors)

class ProductAPITest(APITestCase):
    """API 测试"""

    def setUp(self):
        """测试前准备"""
        self.admin_user = User.objects.create_superuser(
            username='admin',
            password='admin123'
        )

    def test_create_product(self):
        """测试创建产品"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            '/api/products/',
            {
                'code': 'PROD-001',
                'name': '测试产品'
            },
            format='json'
        )

        self.assertEqual(response.status_code, 201)
```

### 2. 测试覆盖目标

| 测试类型 | 覆盖率目标 | 测试内容 |
|---------|-----------|----------|
| **模型测试** | 100% | 方法、属性、字符串表示 |
| **序列化器测试** | 100% | 所有验证规则 |
| **API 测试** | 90%+ | CRUD、权限、过滤 |
| **集成测试** | 80%+ | 端到端业务流程 |

---

## 代码审查清单

### 后端审查清单

- [ ] **模型设计**
  - [ ] 字段有 `verbose_name` 和 `help_text`
  - [ ] 高频查询字段有索引
  - [ ] 关联关系使用 `related_name`
  - [ ] 业务方法使用 `@transaction.atomic`

- [ ] **序列化器**
  - [ ] 包含字段级验证（`validate_*`）
  - [ ] 包含对象级验证（`validate`）
  - [ ] 错误消息清晰（中文）

- [ ] **视图**
  - [ ] 使用 `ModelViewSet`
  - [ ] 配置权限类
  - [ ] 优化查询（`select_related`, `prefetch_related`）
  - [ ] 配置过滤和搜索

- [ ] **测试**
  - [ ] 覆盖所有验证规则
  - [ ] 测试权限控制
  - [ ] 测试边界情况

### 前端审查清单

- [ ] **API 模块**
  - [ ] 继承 `BaseAPI`
  - [ ] 导出单例（`export const api = new API()`）
  - [ ] 文件命名（小写、连字符）

- [ ] **列表页面**
  - [ ] 使用 `listPageMixin`
  - [ ] 实现 `fetchData()` 方法
  - [ ] 包含空状态显示
  - [ ] 处理 loading/error/success 状态

- [ ] **组件**
  - [ ] 命名：PascalCase
  - [ ] Props 有类型验证
  - [ ] 提供 `v-model` 支持（`input` + `change` 事件）

- [ ] **错误处理**
  - [ ] API 调用有 try-catch
  - [ ] 向用户显示错误提示
  - [ ] 不只使用 `console.error`

### 代码质量

- [ ] **ESLint/Pylint** 通过
- [ ] **无 console.log**（使用日志系统）
- [ ] **无硬编码密钥**
- [ ] **注释清晰**（中文，说明复杂逻辑）

---

## 附录：快速参考

### 创建新模块的步骤

#### 后端（5 步）

1. **创建模型**：`models/yourmodel.py`
2. **创建序列化器**：`serializers/yourmodel.py`
3. **创建视图**：`views/yourmodel.py`
4. **配置 URL**：`urls.py`
5. **编写测试**：`tests/test_yourmodel.py`

#### 前端（4 步）

1. **创建 API 模块**：`api/modules/yourmodule.js`
2. **创建列表页面**：`views/yourmodule/List.vue`
3. **配置路由**：`router/index.js`
4. **测试功能**

### 文件命名规范

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| **模型** | PascalCase | `Product`, `CustomerOrder` |
| **序列化器** | 小写下划线 | `product_serializer.py` |
| **视图** | 小写下划线 | `products.py` |
| **API 模块** | 小写连字符 | `product.js`, `product-material.js` |
| **Vue 组件** | PascalCase | `ProductList.vue`, `ProductSelector.vue` |
| **Mixins** | camelCase | `listPageMixin.js`, `crudMixin.js` |

---

**文档维护**：当项目架构演进时，请及时更新此文档。

**反馈渠道**：如有疑问或建议，请在团队会议中提出。
