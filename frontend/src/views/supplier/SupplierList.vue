<template>
  <div class="supplier-list">
    <el-card>
      <!-- 头部区域：筛选 + 操作 -->
      <div class="header-section">
        <div class="filter-group">
          <el-input
            v-model="searchText"
            placeholder="搜索供应商名称/编码"
            style="width: 250px;"
            clearable
            @keyup.enter.native="handleSearch"
            @clear="handleSearch"
          >
            <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
          </el-input>
          <el-select
            v-model="filters.status"
            placeholder="状态"
            clearable
            style="width: 120px; margin-left: 10px;"
            @change="handleSearch"
          >
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </div>
        <div class="action-group">
          <el-button
            v-if="canCreate()"
            type="primary"
            icon="el-icon-plus"
            @click="showCreateDialog"
          >
            新增供应商
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-if="tableData.length > 0"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="供应商编码" width="150" />
        <el-table-column prop="name" label="供应商名称" width="200" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="material_count" label="供应物料数" width="120" />
        <el-table-column
          prop="notes"
          label="备注"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click="showEditDialog(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
              type="text"
              size="small"
              class="danger-text"
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

      <!-- 空状态显示 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无供应商数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="canCreate()" type="primary" @click="showCreateDialog">
          创建第一个供应商
        </el-button>
      </el-empty>
    </el-card>

    <!-- 供应商表单对话框 -->
    <supplier-form-dialog
      :visible.sync="dialogVisible"
      :dialog-type="dialogType"
      :supplier="currentRow"
      :loading="dialogLoading"
      @confirm="handleFormConfirm"
    />
  </div>
</template>

<script>
import { supplierAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import Pagination from '@/components/common/Pagination.vue'
import SupplierFormDialog from './components/SupplierFormDialog.vue'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'SupplierList',

  components: {
    Pagination,
    SupplierFormDialog
  },

  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: supplierAPI,
      permissionPrefix: 'supplier',

      // 对话框状态
      dialogVisible: false,
      dialogType: 'create',
      dialogLoading: false,
      currentRow: null
    }
  },

  created() {
    this.loadData()
  },

  methods: {
    /**
     * 获取数据（listPageMixin 要求）
     */
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        search: this.searchText || undefined,
        status: this.filters.status || undefined
      }
      return await this.apiService.getList(params)
    },

    /**
     * 显示新增对话框
     */
    showCreateDialog() {
      this.dialogType = 'create'
      this.currentRow = null
      this.dialogVisible = true
    },

    /**
     * 显示编辑对话框
     */
    showEditDialog(row) {
      this.dialogType = 'edit'
      this.currentRow = { ...row }
      this.dialogVisible = true
    },

    /**
     * 处理表单确认
     */
    async handleFormConfirm(formData) {
      this.dialogLoading = true
      try {
        if (this.dialogType === 'create') {
          await this.apiService.create(formData)
          ErrorHandler.showSuccess('创建成功')
        } else {
          await this.apiService.update(formData.id, formData)
          ErrorHandler.showSuccess('更新成功')
        }
        this.dialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, this.dialogType === 'create' ? '创建' : '更新')
      } finally {
        this.dialogLoading = false
      }
    },

    /**
     * 处理删除
     */
    async handleDelete(row) {
      try {
        await ErrorHandler.confirm(`确定要删除供应商"${row.name}"吗？`)
        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '删除')
        }
      }
    }
  }
}
</script>

<style scoped>
.supplier-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
}

.action-group {
  display: flex;
  align-items: center;
}

.danger-text {
  color: #F56C6C;
}
</style>
