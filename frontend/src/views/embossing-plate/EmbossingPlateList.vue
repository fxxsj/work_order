<template>
  <div class="embossing-plate-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索压凸版编码、名称、尺寸、材质"
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
          新建压凸版
        </el-button>
      </div>

      <!-- 表格：仅在有数据时显示 -->
      <el-table
        v-if="tableData.length > 0"
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="压凸版编码" width="150" />
        <el-table-column prop="name" label="压凸版名称" width="200" />
        <el-table-column prop="size" label="尺寸" width="150" />
        <el-table-column prop="material" label="材质" width="120" />
        <el-table-column prop="thickness" label="厚度" width="100" />
        <!-- 确认状态列 -->
        <el-table-column label="确认状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.confirmed ? 'success' : 'info'">
              {{ scope.row.confirmed ? '已确认' : '待确认' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="包含产品" min-width="200">
          <template slot-scope="scope">
            <el-tag
              v-for="product in scope.row.products"
              :key="product.id"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ product.product_name }} ({{ product.quantity }}个)
            </el-tag>
            <span v-if="!scope.row.products || scope.row.products.length === 0" style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="notes"
          label="备注"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="!scope.row.confirmed && canEdit()"
              type="text"
              size="small"
              @click="handleConfirmPlate(scope.row)"
            >
              确认
            </el-button>
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

      <!-- 空状态（完善版） -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        :description="hasFilters ? '未找到匹配的压凸版' : '暂无压凸版数据'"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <!-- 有筛选条件时显示重置按钮 -->
        <el-button v-if="hasFilters" type="primary" @click="handleReset">
          重置筛选
        </el-button>
        <!-- 无筛选条件时显示创建按钮 -->
        <el-button v-else-if="canCreate()" type="primary" @click="showCreateDialog">
          创建第一个压凸版
        </el-button>
      </el-empty>
    </el-card>

    <!-- 表单对话框组件 -->
    <embossing-plate-form-dialog
      :visible.sync="dialogVisible"
      :dialog-type="dialogType"
      :embossing-plate="currentEmbossingPlate"
      :loading="formLoading"
      :product-list="productList"
      @confirm="handleFormConfirm"
    />
  </div>
</template>

<script>
import { embossingPlateAPI, productAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'
import Pagination from '@/components/common/Pagination.vue'
import EmbossingPlateFormDialog from './components/EmbossingPlateFormDialog.vue'

export default {
  name: 'EmbossingPlateList',
  components: { Pagination, EmbossingPlateFormDialog },
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: embossingPlateAPI,
      permissionPrefix: 'embossing-plate',

      // 对话框相关
      dialogVisible: false,
      dialogType: 'create',
      formLoading: false,
      currentEmbossingPlate: null,

      // 产品列表
      productList: []
    }
  },

  computed: {
    // 是否有筛选条件
    hasFilters() {
      return !!this.searchText
    }
  },

  created() {
    this.loadData()
    this.loadProductList()
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

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    async loadProductList() {
      try {
        const response = await productAPI.getList({ is_active: true, page_size: 100 })
        this.productList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载产品列表失败')
      }
    },

    showCreateDialog() {
      this.dialogType = 'create'
      this.currentEmbossingPlate = null
      this.dialogVisible = true
    },

    async handleEdit(row) {
      try {
        const detail = await embossingPlateAPI.getDetail(row.id)
        this.currentEmbossingPlate = detail
        this.dialogType = 'edit'
        this.dialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '加载压凸版详情失败')
      }
    },

    async handleDelete(row) {
      try {
        await ErrorHandler.confirm(`确定要删除压凸版"${row.name}"吗？此操作不可撤销。`)
        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '删除失败')
        }
      }
    },

    async handleConfirmPlate(row) {
      try {
        await ErrorHandler.confirm(`确定要确认压凸版"${row.name}"吗？确认后关键字段将不可修改。`)
        await embossingPlateAPI.confirm(row.id)
        ErrorHandler.showSuccess('确认成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '确认失败')
        }
      }
    },

    async handleFormConfirm({ form, productItems }) {
      this.formLoading = true
      try {
        const data = { ...form }

        // 新建时如果没有编码则删除该字段，让后端自动生成
        if (this.dialogType === 'create' && !data.code) {
          delete data.code
        }

        // 处理产品数据
        data.products_data = productItems
          .filter(item => item.product)
          .map(item => ({
            product: item.product,
            quantity: item.quantity || 1
          }))

        if (this.dialogType === 'edit') {
          await this.apiService.update(this.currentEmbossingPlate.id, data)
          ErrorHandler.showSuccess('保存成功')
        } else {
          await this.apiService.create(data)
          ErrorHandler.showSuccess('创建成功')
        }

        this.dialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, this.dialogType === 'edit' ? '保存失败' : '创建失败')
      } finally {
        this.formLoading = false
      }
    },

    // 重置筛选条件
    handleReset() {
      this.searchText = ''
      this.currentPage = 1
      this.loadData()
    }
  }
}
</script>

<style scoped>
.embossing-plate-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
