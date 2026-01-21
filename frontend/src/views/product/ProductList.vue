<template>
  <div class="product-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索产品名称、编码"
          style="width: 300px;"
          clearable
          @input="handleSearchDebounced"
          @clear="handleSearch"
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

      <el-table
        v-if="tableData.length > 0"
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="产品编码" width="120" />
        <el-table-column prop="name" label="产品名称" width="200" />
        <el-table-column prop="specification" label="规格" min-width="150" />
        <el-table-column
          prop="unit"
          label="单位"
          width="80"
          align="center"
        />
        <el-table-column
          prop="unit_price"
          label="单价"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.unit_price }}
          </template>
        </el-table-column>
        <el-table-column
          prop="stock_quantity"
          label="库存数量"
          width="100"
          align="right"
        />
        <el-table-column
          prop="min_stock_quantity"
          label="最小库存"
          width="100"
          align="right"
        />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          label="描述"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
              type="text"
              size="small"
              style="color: #F56C6C;"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />

      <!-- 空状态显示 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无产品数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="canCreate()" type="primary" @click="showCreateDialog">
          创建第一个产品
        </el-button>
      </el-empty>
    </el-card>

    <!-- 产品表单对话框 -->
    <product-form-dialog
      :visible.sync="dialogVisible"
      :dialog-type="dialogType"
      :product="currentProduct"
      :loading="formLoading"
      :materials="materialList"
      :processes="allProcesses"
      @confirm="handleFormConfirm"
    />
  </div>
</template>

<script>
import { productAPI, processAPI, materialAPI, productMaterialAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'
import Pagination from '@/components/common/Pagination.vue'
import ProductFormDialog from './components/ProductFormDialog.vue'

export default {
  name: 'ProductList',
  components: {
    Pagination,
    ProductFormDialog
  },
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: productAPI,
      permissionPrefix: 'product',

      // 对话框状态
      dialogVisible: false,
      dialogType: 'create',
      formLoading: false,
      currentProduct: null,

      // 选项数据
      allProcesses: [],
      materialList: []
    }
  },
  created() {
    this.loadData()
    this.loadAllProcesses()
    this.loadMaterialList()
  },
  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
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

    async loadAllProcesses() {
      try {
        let allProcesses = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          const response = await processAPI.getList({
            is_active: true,
            page_size: 100,
            page: page
          })

          if (response.results && response.results.length > 0) {
            allProcesses = allProcesses.concat(response.results)
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }

        this.allProcesses = allProcesses
      } catch (error) {
        ErrorHandler.showMessage(error, '加载工序列表')
      }
    },

    async loadMaterialList() {
      try {
        const response = await materialAPI.getList({ page_size: 100 })
        this.materialList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载物料列表')
      }
    },

    showCreateDialog() {
      this.dialogType = 'create'
      this.currentProduct = null
      this.dialogVisible = true
    },

    async handleEdit(row) {
      try {
        // 加载产品详情
        const detail = await this.apiService.getDetail(row.id)
        this.currentProduct = detail
        this.dialogType = 'edit'
        this.dialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '加载产品详情')
      }
    },

    async handleDelete(row) {
      try {
        const confirmed = await ErrorHandler.confirm(
          `确定要删除产品"${row.name}"吗？此操作不可撤销。`
        )

        if (!confirmed) return

        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '删除失败')
        }
      }
    },

    async handleFormConfirm({ form, materialItems }) {
      this.formLoading = true
      try {
        let productId

        if (this.dialogType === 'edit') {
          await this.apiService.update(this.currentProduct.id, form)
          productId = this.currentProduct.id
          ErrorHandler.showSuccess('保存成功')
        } else {
          const result = await this.apiService.create(form)
          productId = result.id
          ErrorHandler.showSuccess('创建成功')
        }

        // 保存产品物料
        await this.saveProductMaterials(productId, materialItems)

        this.dialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, this.dialogType === 'edit' ? '保存失败' : '创建失败')
      } finally {
        this.formLoading = false
      }
    },

    async saveProductMaterials(productId, materialItems) {
      // 如果是编辑模式，先删除所有现有物料
      if (this.dialogType === 'edit') {
        try {
          const existingMaterials = await productMaterialAPI.getList({ product: productId })
          for (const material of existingMaterials.results || []) {
            await productMaterialAPI.delete(material.id)
          }
        } catch (error) {
          console.warn('删除现有物料失败:', error)
        }
      }

      // 添加新物料
      for (let i = 0; i < materialItems.length; i++) {
        const item = materialItems[i]
        if (item.material) {
          try {
            await productMaterialAPI.create({
              product: productId,
              material: item.material,
              material_size: item.material_size || '',
              material_usage: item.material_usage || '',
              need_cutting: item.need_cutting || false,
              notes: item.notes || '',
              sort_order: i
            })
          } catch (error) {
            console.warn('保存物料失败:', error)
          }
        }
      }
    }
  }
}
</script>

<style scoped>
.product-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
