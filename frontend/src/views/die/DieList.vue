<template>
  <div class="die-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索刀模编码、名称、尺寸、材质"
          style="width: 300px;"
          clearable
          @input="handleSearchDebounced"
          @clear="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
        </el-input>
        <div class="header-actions">
          <el-button
            :loading="loading"
            icon="el-icon-refresh"
            @click="handleRefresh"
          >
            刷新
          </el-button>
          <el-button
            v-if="canCreate()"
            type="primary"
            icon="el-icon-plus"
            @click="handleCreate"
          >
            新建刀模
          </el-button>
        </div>
      </div>

      <!-- 空状态显示 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无刀模数据"
        style="margin-top: 40px;"
      >
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="handleCreate"
        >
          创建第一个刀模
        </el-button>
      </el-empty>

      <el-table
        v-else
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="刀模编码" width="150" />
        <el-table-column prop="name" label="刀模名称" width="200" />
        <el-table-column label="刀模类型" width="120">
          <template slot-scope="scope">
            <el-tag
              :type="getDieTypeTagType(scope.row.die_type)"
              size="small"
            >
              {{ scope.row.die_type_display || getDieTypeLabel(scope.row.die_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="尺寸" width="150" />
        <el-table-column prop="material" label="材质" width="100" />
        <el-table-column prop="thickness" label="厚度" width="100" />
        <el-table-column label="确认状态" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.confirmed" type="success" size="small">
              已确认
            </el-tag>
            <el-tag v-else type="info" size="small">
              待确认
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="包含产品" min-width="250">
          <template slot-scope="scope">
            <el-tag
              v-for="product in scope.row.products"
              :key="product.id"
              :type="product.relation_type === 'imposition' ? 'warning' : ''"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ product.product_name }} ({{ product.quantity }}拼)
              <span v-if="product.relation_type === 'imposition'" style="font-size: 10px;">拼</span>
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
    </el-card>

    <!-- 刀模表单对话框 -->
    <DieFormDialog
      :visible.sync="dialogVisible"
      :dialog-type="dialogType"
      :initial-data="currentRow"
      :loading="formLoading"
      :product-list="productList"
      @submit="handleFormSubmit"
      @close="handleDialogClose"
    />
  </div>
</template>

<script>
import { dieAPI, productAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import formDialogMixin from '@/mixins/formDialogMixin'
import Pagination from '@/components/common/Pagination.vue'
import DieFormDialog from './components/DieFormDialog.vue'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'DieList',
  components: { Pagination, DieFormDialog },
  mixins: [listPageMixin, crudPermissionMixin, formDialogMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: dieAPI,
      permissionPrefix: 'die',

      // 表单相关
      productList: [],
      currentRow: null,
      formLoading: false
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
        ErrorHandler.showMessage(error, '加载产品列表')
      }
    },

    // 刷新数据
    handleRefresh() {
      this.loadData()
    },

    // 创建刀模
    handleCreate() {
      this.currentRow = null
      this.dialogType = 'create'
      this.dialogVisible = true
    },

    // 编辑刀模
    async handleEdit(row) {
      try {
        const detail = await dieAPI.getDetail(row.id)
        this.currentRow = detail
        this.dialogType = 'edit'
        this.dialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '加载刀模详情')
      }
    },

    // 表单提交处理
    async handleFormSubmit(data) {
      this.formLoading = true
      try {
        if (this.dialogType === 'edit' && this.currentRow) {
          await this.apiService.update(this.currentRow.id, data)
          ErrorHandler.showSuccess('保存成功')
        } else {
          await this.apiService.create(data)
          ErrorHandler.showSuccess('创建成功')
        }

        this.dialogVisible = false
        this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, this.dialogType === 'edit' ? '保存刀模' : '创建刀模')
      } finally {
        this.formLoading = false
      }
    },

    // 对话框关闭处理
    handleDialogClose() {
      this.currentRow = null
    },

    // 删除刀模
    async handleDelete(row) {
      const confirmed = await ErrorHandler.confirm(
        `确定要删除刀模"${row.name}"吗？此操作不可恢复。`,
        '删除确认'
      )

      if (!confirmed) return

      try {
        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '删除刀模')
      }
    },

    // 获取刀模类型标签类型
    getDieTypeTagType(dieType) {
      const typeMap = {
        combined: 'warning',
        dedicated: 'primary',
        universal: 'success'
      }
      return typeMap[dieType] || 'info'
    },

    // 获取刀模类型显示文本
    getDieTypeLabel(dieType) {
      const labelMap = {
        combined: '拼版刀模',
        dedicated: '专用刀模',
        universal: '通用刀模'
      }
      return labelMap[dieType] || dieType
    }
  }
}
</script>

<style scoped>
.die-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}
</style>
