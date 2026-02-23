# 印刷施工单跟踪系统 - 最佳实践文档

> 基于产品管理模块（v3.1）的前后端开发规范

**版本**: v3.1
**最后更新**: 2026-01-21
**参考模块**: Product（产品管理）、Board（任务看板）

---

## 目录

1. [架构概述](#架构概述)
2. [后端开发规范](#后端开发规范)
3. [前端开发规范](#前端开发规范)
4. [前端 UI 一致性规范](#前端-ui-一致性规范) ✨ v3.1 新增
5. [页面布局模式](#页面布局模式) ✨ v3.1 新增
6. [对话框组件模式](#对话框组件模式) ✨ v3.1 新增
7. [API 设计规范](#api-设计规范)
8. [数据库设计规范](#数据库设计规范)
9. [测试规范](#测试规范)
10. [代码审查清单](#代码审查清单)

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

#### 3.4 Django Count() 命名陷阱（重要）

⚠️ **常见错误**：在使用 `annotate()` 和 `Count()` 时，字段名称必须使用**小写模型名**，而不是 `related_name`。

**错误示例**：
```python
# ❌ 错误：使用 related_name 'material_supplier'
queryset = queryset.annotate(
    _material_count=Count('material_supplier')  # FieldError!
)
```

**正确示例**：
```python
# ✅ 正确：使用小写模型名 'materialsupplier'
# 模型：MaterialSupplier（假设模型名没有下划线）
queryset = queryset.annotate(
    _material_count=Count('materialsupplier')  # 正确
)

# ✅ 如果模型名是 ProductMaterial
queryset = queryset.annotate(
    _count=Count('productmaterial')  # 小写，无下划线
)
```

**规则**：
- 使用 `Count('模型名的小写形式')`
- 不要使用 `related_name`
- 不要使用下划线分隔（除非模型名本身包含下划线）

**适用场景**：
- SupplierViewSet 计算物料数量
- PurchaseOrderViewSet 计算明细数量
- 任何需要使用 `annotate(Count(...))` 的场景

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

#### 2.1 使用 Mixins 模式（三个 Mixin 必需）

⚠️ **重要**：列表页面必须使用以下三个 Mixin 的组合：

| Mixin | 功能 | 提供的属性/方法 |
|-------|------|----------------|
| **listPageMixin** | 列表页基础逻辑 | `loading`, `tableData`, `currentPage`, `pageSize`, `total`, `searchText`, `filters`, `loadData()`, `fetchData()`, `handleSearch()` |
| **crudPermissionMixin** | 权限控制 | `canCreate()`, `canEdit()`, `canDelete()`, `canExport()` |
| **formDialogMixin** | 对话框逻辑 | `dialogVisible`, `dialogTitle`, `dialogType`, `dialogLoading`, `showCreateDialog()`, `showEditDialog()`, `submitForm()`, `isEditMode`, `isCreateMode` |

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
        ErrorHandler.showSuccess('删除成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '删除失败')
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

#### 2.2 对话框标题命名规范

⚠️ **重要**：使用 `formDialogMixin` 提供的 `dialogTitle` 计算属性，**不要**自定义 `formTitle`。

**错误示例**：
```javascript
// ❌ 错误：自定义 formTitle
computed: {
  formTitle() {
    return this.dialogType === 'edit' ? '编辑产品' : '新建产品'
  }
}
```

**正确示例**：
```javascript
// ✅ 正确：使用 formDialogMixin 提供的 dialogTitle
// formDialogMixin 自动根据 dialogType 和 permissionPrefix 生成标题
// <el-dialog :title="dialogTitle" ...>
```

**dialogTitle 生成规则**：
- `dialogType === 'create'` → `新建{模型名}`
- `dialogType === 'edit'` → `编辑{模型名}`
- 基于 `permissionPrefix` 自动生成（如 `product` → `产品`）

#### 2.3 表单重置模式规范

⚠️ **重要**：使用 `formInitialValues` 常量避免表单字段重复定义。

**错误示例**：
```javascript
// ❌ 错误：表单字段在 data() 和 resetForm() 中重复定义
data() {
  return {
    form: {
      code: '',
      name: '',
      // ... 10+ 个字段
    }
  }
},
methods: {
  resetForm() {
    this.form = {
      code: '',  // 重复定义
      name: '',  // 重复定义
      // ... 又要写一遍所有字段
    }
  }
}
```

**正确示例**：
```javascript
// ✅ 正确：使用 formInitialValues 常量
data() {
  return {
    // 表单初始值常量（只定义一次）
    formInitialValues: {
      code: '',
      name: '',
      // ... 所有字段
    },

    // 表单对象（从常量复制）
    form: { ...this.formInitialValues }
  }
},
methods: {
  resetForm() {
    // 使用常量重置（无重复代码）
    this.form = { ...this.formInitialValues }
  }
}
```

#### 2.4 Mixins 组合策略

| Mixin | 功能 | 使用场景 |
|-------|------|----------|
| **listPageMixin** | 列表页基础逻辑（分页、搜索、加载） | 所有列表页面（必需） |
| **crudPermissionMixin** | 权限检查方法 | 需要权限控制的页面（必需） |
| **formDialogMixin** | 对话框逻辑 | 包含表单对话框的页面（必需） |

**标准组合**：
- 列表 + 表单：`listPageMixin + crudPermissionMixin + formDialogMixin`
- 只读列表：`listPageMixin + crudPermissionMixin`

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

  <!-- empty 状态（增强版） -->
  <el-empty
    v-if="!loading && tableData.length === 0"
    description="暂无产品数据"
    :image-size="200"
  >
    <!-- 条件渲染：有创建权限时显示按钮 -->
    <el-button v-if="canCreate()" type="primary" @click="showCreateDialog()">
      创建第一个产品
    </el-button>
  </el-empty>

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
        ErrorHandler.showMessage(error, this.error)
      } finally {
        this.loading = false
      }
    }
  }
}
```

#### 4.3 空状态最佳实践

⚠️ **重要**：空状态组件必须提供友好的用户引导，特别是对于有创建权限的用户。

**基本空状态**（只读列表）：
```vue
<el-empty
  v-if="!loading && tableData.length === 0"
  description="暂无数据"
  :image-size="200"
/>
```

**引导式空状态**（可创建列表）：
```vue
<el-empty
  v-if="!loading && tableData.length === 0"
  description="暂无产品数据"
  :image-size="200"
>
  <!-- 使用 canCreate() 检查权限 -->
  <el-button
    v-if="canCreate()"
    type="primary"
    @click="showCreateDialog()"
  >
    创建第一个产品
  </el-button>
</el-empty>
```

**关键要点**：
- 使用 `!loading && tableData.length === 0` 确保只在真正无数据时显示
- 添加友好的 `description` 说明
- 为有创建权限的用户提供操作按钮
- 使用 `canCreate()` 权限检查方法
- 按钮文案使用"创建第一个{模型名}"格式

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

#### 5.2 使用 ErrorHandler 工具类（强制要求）

⚠️ **重要**：所有错误处理必须使用 `ErrorHandler` 工具类，禁止直接使用 `this.$message` 或 `this.$confirm`。

**导入 ErrorHandler**：
```javascript
import ErrorHandler from '@/utils/errorHandler'
```

**ErrorHandler API**：

| 方法 | 用途 | 返回值 |
|------|------|--------|
| `ErrorHandler.showSuccess(message)` | 显示成功提示 | void |
| `ErrorHandler.showMessage(error, defaultMessage)` | 显示错误消息 | void |
| `ErrorHandler.confirm(message, title)` | 显示确认对话框 | Promise\<void\> |
| `ErrorHandler.notify(message, type)` | 显示通知 | void |

**使用示例**：

```javascript
// ✅ 正确：使用 ErrorHandler
import ErrorHandler from '@/utils/errorHandler'

async handleDelete(row) {
  try {
    await ErrorHandler.confirm(`确定要删除"${row.name}"吗？此操作不可撤销。`)
    await this.apiService.delete(row.id)
    ErrorHandler.showSuccess('删除成功')
    await this.loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ErrorHandler.showMessage(error, '删除失败')
    }
  }
}

async handleSubmit() {
  try {
    await this.apiService.create(this.form)
    ErrorHandler.showSuccess('创建成功')
    this.dialogVisible = false
    await this.loadData()
  } catch (error) {
    ErrorHandler.showMessage(error, '创建失败')
  }
}

// ❌ 错误：直接使用 this.$message / this.$confirm
async handleDelete(row) {
  try {
    await this.$confirm(...)  // 禁止
    this.$message.success(...)  // 禁止
  } catch (error) {
    this.$message.error(...)  // 禁止
  }
}
```

**错误消息提取**：
`ErrorHandler.showMessage()` 会自动从 error 对象中提取消息：
- `error.response.data.detail`
- `error.response.data.message`
- `error.response.data.error`
- `error.message`

#### 5.3 API 错误处理

---

## 前端 UI 一致性规范

> ✨ v3.1 新增 - 确保所有页面保持统一的视觉风格和交互体验

### 1. 页面结构一致性

⚠️ **重要**：所有列表页面必须遵循统一的结构模式。

**标准页面结构**：
```vue
<template>
  <div class="page-container">
    <!-- 1. 统计信息（可选，放在卡片外部） -->
    <stats-component v-if="showStats" :data="tableData" />

    <!-- 2. 主内容卡片 -->
    <el-card>
      <!-- 2.1 头部搜索栏 -->
      <div class="header-section">
        <div class="filter-group"><!-- 筛选器 --></div>
        <div class="action-group"><!-- 操作按钮 --></div>
      </div>

      <!-- 2.2 数据表格 -->
      <el-table v-if="tableData.length > 0" v-loading="loading" :data="tableData">
        <!-- 表格列 -->
      </el-table>

      <!-- 2.3 分页组件 -->
      <Pagination v-if="total > 0" ... />

      <!-- 2.4 空状态 -->
      <el-empty v-if="!loading && tableData.length === 0" ... />
    </el-card>

    <!-- 3. 对话框组件 -->
    <form-dialog :visible.sync="dialogVisible" ... />
  </div>
</template>
```

### 2. 参考模块

| 场景 | 参考组件 | 路径 |
|-----|---------|------|
| **简单列表页** | ProductList.vue | `views/product/ProductList.vue` |
| **带统计的列表** | Board.vue | `views/task/Board.vue` |
| **表单对话框** | ProductFormDialog.vue | `views/product/components/ProductFormDialog.vue` |
| **操作对话框** | BoardUpdateDialog.vue | `views/task/components/BoardUpdateDialog.vue` |

### 3. 按钮样式规范

| 按钮类型 | 样式 | 使用场景 |
|---------|------|---------|
| **主操作** | `type="primary"` | 新建、保存、确认 |
| **次要操作** | `type="default"` | 刷新、取消、重置 |
| **危险操作** | `type="text" style="color: #F56C6C;"` | 删除（在表格操作列） |
| **文本操作** | `type="text"` | 编辑、查看（在表格操作列） |

**示例**：
```vue
<!-- 头部按钮 -->
<el-button icon="el-icon-refresh" @click="loadData">刷新</el-button>
<el-button type="primary" icon="el-icon-plus" @click="showCreateDialog">
  新建
</el-button>

<!-- 表格操作列 -->
<el-button v-if="canEdit()" type="text" size="small" @click="handleEdit(row)">
  编辑
</el-button>
<el-button
  v-if="canDelete()"
  type="text"
  size="small"
  style="color: #F56C6C;"
  @click="handleDelete(row)"
>
  删除
</el-button>
```

### 4. 表格列规范

| 列类型 | 宽度 | 对齐方式 | 示例 |
|-------|------|---------|------|
| **编码/ID** | `width="120"` | 左对齐（默认） | 产品编码、订单号 |
| **名称** | `width="200"` 或 `min-width="150"` | 左对齐 | 产品名称、客户名称 |
| **数量** | `width="100"` | `align="right"` | 库存数量、完成数量 |
| **金额** | `width="120"` | `align="right"` | 单价、总价 |
| **状态** | `width="100"` | `align="center"` | 启用/禁用、任务状态 |
| **单位** | `width="80"` | `align="center"` | 件、张、本 |
| **描述** | `min-width="150"` + `show-overflow-tooltip` | 左对齐 | 备注、说明 |
| **操作** | `width="150"` + `fixed="right"` | 居中或左对齐 | 编辑、删除 |

**示例**：
```vue
<el-table-column prop="code" label="产品编码" width="120" />
<el-table-column prop="name" label="产品名称" width="200" />
<el-table-column prop="unit_price" label="单价" width="120" align="right">
  <template slot-scope="scope">
    ¥{{ scope.row.unit_price }}
  </template>
</el-table-column>
<el-table-column prop="stock_quantity" label="库存数量" width="100" align="right" />
<el-table-column label="状态" width="100" align="center">
  <template slot-scope="scope">
    <el-tag :type="scope.row.is_active ? 'success' : 'info'">
      {{ scope.row.is_active ? '启用' : '禁用' }}
    </el-tag>
  </template>
</el-table-column>
<el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
<el-table-column label="操作" width="150" fixed="right">
  <!-- 操作按钮 -->
</el-table-column>
```

### 5. 状态标签规范

| 状态类型 | Tag 类型 | 颜色 | 示例 |
|---------|---------|------|------|
| **启用/成功** | `success` | 绿色 | 启用、已完成、已通过 |
| **禁用/默认** | `info` | 灰色 | 禁用、待开始 |
| **警告/进行中** | `warning` | 橙色 | 进行中、待审核 |
| **危险/失败** | `danger` | 红色 | 已取消、已拒绝 |
| **主要** | `primary` | 蓝色 | 特殊标记 |

**示例**：
```vue
<!-- 启用/禁用状态 -->
<el-tag :type="row.is_active ? 'success' : 'info'">
  {{ row.is_active ? '启用' : '禁用' }}
</el-tag>

<!-- 任务状态 -->
<el-tag :type="statusTagType(row.status)">
  {{ statusText(row.status) }}
</el-tag>
```

```javascript
// 状态映射方法
statusTagType(status) {
  const map = {
    pending: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}
```

### 6. 表单对话框规范

| 元素 | 规范 | 示例 |
|-----|------|------|
| **对话框宽度** | 简单表单 `500px`，复杂表单 `600-700px` | `width="600px"` |
| **标签宽度** | 统一 `100px` 或 `120px` | `label-width="100px"` |
| **输入框占满** | 使用 `style="width: 100%"` | 下拉框、数字输入框 |
| **必填标记** | 使用表单验证规则自动显示 | `required: true` |
| **按钮位置** | 对话框底部，右对齐 | `slot="footer"` |

### 7. 空状态规范

| 场景 | 描述文案 | 按钮 |
|-----|---------|------|
| **无数据（无筛选）** | `暂无{模块名}数据` | `创建第一个{模块名}` |
| **无数据（有筛选）** | `暂无{模块名}数据` | `重置筛选` |
| **搜索无结果** | `未找到匹配的{模块名}` | `清除搜索` |

### 8. 页面容器样式

所有列表页面使用统一的容器样式：

```css
.page-container {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group,
.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
```

### 9. UI 一致性检查清单

新建或修改页面时，检查以下项目：

- [ ] **页面结构**：是否遵循标准页面结构（统计→卡片→对话框）
- [ ] **头部布局**：是否使用 `header-section` + `filter-group` + `action-group`
- [ ] **按钮样式**：主操作用 `primary`，删除用红色文本按钮
- [ ] **表格列**：宽度、对齐方式是否符合规范
- [ ] **状态标签**：是否使用正确的 Tag 类型
- [ ] **空状态**：是否包含空状态，是否有引导按钮
- [ ] **对话框**：宽度、标签宽度是否统一
- [ ] **分页组件**：是否使用封装的 `Pagination` 组件
- [ ] **容器样式**：是否使用 `padding: 20px`

---

## 页面布局模式

> ✨ v3.1 新增 - 基于 Board.vue 任务看板重构总结

### 1. 统计信息布局

⚠️ **重要**：统计信息（如总数、状态统计）应放在主卡片**外部**，而不是内部。

**正确示例**：
```vue
<template>
  <div class="task-board">
    <!-- ✅ 统计信息放在卡片外部 -->
    <task-stats :tasks="tableData" style="margin-bottom: 20px;" />

    <el-card>
      <!-- 搜索栏、表格、分页等内容 -->
    </el-card>
  </div>
</template>
```

**错误示例**：
```vue
<template>
  <div class="task-board">
    <el-card>
      <!-- ❌ 统计信息放在卡片内部 -->
      <task-stats :tasks="tableData" />
      <!-- 搜索栏、表格等 -->
    </el-card>
  </div>
</template>
```

### 2. 搜索栏布局（简洁风格）

参考 ProductList.vue 的简洁搜索栏设计：

```vue
<div class="header-section">
  <!-- 左侧：筛选和搜索 -->
  <div class="filter-group">
    <el-select v-model="selectedDepartment" placeholder="选择部门" clearable>
      <!-- options -->
    </el-select>
    <el-select v-model="selectedStatus" placeholder="任务状态" clearable>
      <!-- options -->
    </el-select>
    <el-input v-model="searchText" placeholder="搜索..." clearable>
      <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
    </el-input>
  </div>

  <!-- 右侧：操作按钮 -->
  <div class="action-group">
    <el-button icon="el-icon-refresh" @click="loadData">刷新</el-button>
    <el-button v-if="canCreate()" type="primary" @click="showCreateDialog">
      新建
    </el-button>
  </div>
</div>
```

### 3. 条件视图渲染

⚠️ **重要**：当页面有多种视图模式时（如看板视图/列表视图），必须使用条件渲染**避免空状态与空列表重复显示**。

**常见问题**：
如果不正确处理条件渲染，会出现空状态组件和空表格同时显示的问题，导致页面混乱。

**错误示例**：
```vue
<!-- ❌ 错误：没有条件限制，空状态会与空表格重复显示 -->
<el-table :data="tableData">...</el-table>
<el-empty v-if="tableData.length === 0" />
```

**正确示例**：
```vue
<template>
  <!-- ✅ 看板视图：仅当有数据时显示 -->
  <task-board-view
    v-if="!showListView && tableData.length > 0"
    :tasks="tableData"
  />

  <!-- ✅ 列表视图：仅当有数据时显示 -->
  <task-list-view
    v-if="showListView && tableData.length > 0"
    :tasks="tableData"
  />

  <!-- ✅ 空状态：仅当无数据时显示（互斥条件） -->
  <el-empty
    v-if="!loading && tableData.length === 0"
    description="暂无数据"
  >
    <el-button v-if="hasFilters" @click="handleReset">重置筛选</el-button>
  </el-empty>
</template>
```

**关键点**：
- 数据视图组件添加 `tableData.length > 0` 条件，无数据时不渲染
- 空状态添加 `!loading && tableData.length === 0` 条件，确保互斥
- 使用 `v-if` 而非 `v-show`，确保组件完全不渲染
- **避免空状态与空视图重复显示**

### 4. 筛选重置

当有筛选条件时，空状态应提供重置功能：

```vue
<el-empty v-if="!loading && tableData.length === 0" description="暂无数据">
  <!-- 有筛选条件时显示重置按钮 -->
  <el-button v-if="hasFilters" type="primary" @click="handleReset">
    重置筛选
  </el-button>
  <!-- 无筛选条件时显示创建按钮 -->
  <el-button v-else-if="canCreate()" type="primary" @click="showCreateDialog">
    创建第一个
  </el-button>
</el-empty>
```

```javascript
computed: {
  hasFilters() {
    return this.selectedDepartment || this.selectedStatus || this.searchText
  }
},
methods: {
  handleReset() {
    this.selectedDepartment = null
    this.selectedStatus = ''
    this.searchText = ''
    this.currentPage = 1
    this.loadData()
  }
}
```

---

## 对话框组件模式

> ✨ v3.1 新增 - 基于 ProductFormDialog、BoardUpdateDialog 等组件总结

### 1. 对话框组件提取原则

⚠️ **重要**：当主组件包含表单对话框时，必须将对话框提取为独立组件。

**触发条件**：
- 对话框表单超过 5 个字段
- 对话框逻辑复杂（有验证、联动）
- 主组件代码超过 300 行

**命名规范**：
| 场景 | 命名模式 | 示例 |
|------|---------|------|
| 通用表单 | `{模块}FormDialog.vue` | `ProductFormDialog.vue` |
| 特定操作 | `{模块}{操作}Dialog.vue` | `BoardUpdateDialog.vue` |
| 看板专用 | `Board{操作}Dialog.vue` | `BoardAssignDialog.vue` |

### 2. 对话框组件标准结构

使用 `FORM_INITIAL` 常量模式：

```vue
<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <!-- 只读信息展示 -->
      <el-form-item label="任务内容">
        <el-input :value="task?.work_content" disabled />
      </el-form-item>

      <!-- 可编辑字段 -->
      <el-form-item label="完成数量" prop="quantity_completed">
        <el-input-number v-model="form.quantity_completed" :min="0" />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.notes" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <div slot="footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        确定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
// ✅ 表单初始值常量（组件外部定义）
const FORM_INITIAL = {
  quantity_completed: 0,
  notes: ''
}

export default {
  name: 'BoardUpdateDialog',

  props: {
    // 对话框可见性
    visible: {
      type: Boolean,
      default: false
    },
    // 当前操作的数据对象
    task: {
      type: Object,
      default: null
    },
    // 提交加载状态
    loading: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      form: { ...FORM_INITIAL },
      rules: {
        quantity_completed: [
          { required: true, message: '请输入完成数量', trigger: 'blur' }
        ]
      }
    }
  },

  computed: {
    // ✅ 双向绑定 visible
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    dialogTitle() {
      return '更新任务'
    }
  },

  watch: {
    // ✅ 监听 visible 变化初始化表单
    visible(val) {
      if (val && this.task) {
        this.initForm()
      }
    }
  },

  methods: {
    // ✅ 从数据对象初始化表单
    initForm() {
      this.form = {
        quantity_completed: this.task?.quantity_completed || 0,
        notes: this.task?.notes || ''
      }
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },

    // ✅ 重置表单为初始值
    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.$refs.formRef?.resetFields()
    },

    // ✅ 确认提交
    handleConfirm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.$emit('confirm', { ...this.form })
        }
      })
    },

    // ✅ 关闭对话框
    handleClose() {
      this.resetForm()
      this.dialogVisible = false
    }
  }
}
</script>
```

### 3. 父组件使用对话框

```vue
<template>
  <div class="page">
    <!-- 页面内容 -->

    <!-- ✅ 使用 .sync 修饰符绑定 visible -->
    <board-update-dialog
      :visible.sync="updateDialogVisible"
      :task="currentTask"
      :loading="updating"
      @confirm="handleConfirmUpdate"
    />
  </div>
</template>

<script>
import BoardUpdateDialog from './components/BoardUpdateDialog.vue'
import ErrorHandler from '@/utils/errorHandler'

export default {
  components: { BoardUpdateDialog },

  data() {
    return {
      updateDialogVisible: false,
      currentTask: null,
      updating: false
    }
  },

  methods: {
    // 打开对话框
    handleTaskUpdate(task) {
      this.currentTask = task
      this.updateDialogVisible = true
    },

    // 处理确认提交
    async handleConfirmUpdate(formData) {
      this.updating = true
      try {
        await this.apiService.update(this.currentTask.id, formData)
        ErrorHandler.showSuccess('更新成功')
        this.updateDialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '更新失败')
      } finally {
        this.updating = false
      }
    }
  }
}
</script>
```

### 4. 复杂表单对话框（带关联数据）

当对话框需要外部数据（如下拉选项）时：

```vue
<!-- 父组件 -->
<board-assign-dialog
  :visible.sync="assignDialogVisible"
  :task="currentTask"
  :users="userList"
  :loading="assigning"
  @confirm="handleConfirmAssign"
/>

<!-- 对话框组件 -->
<script>
export default {
  props: {
    // ... visible, task, loading
    users: {
      type: Array,
      default: () => []
    }
  }
}
</script>
```

### 5. 对话框组件检查清单

- [ ] 使用 `FORM_INITIAL` 常量定义表单初始值
- [ ] Props: `visible`, `task/data`, `loading`
- [ ] Computed: `dialogVisible` 双向绑定
- [ ] Watch: 监听 `visible` 初始化表单
- [ ] Methods: `initForm()`, `resetForm()`, `handleConfirm()`, `handleClose()`
- [ ] 表单验证规则定义在 `rules`
- [ ] 使用 `$refs.formRef.validate()` 验证
- [ ] 关闭时调用 `resetForm()` 清理状态

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
