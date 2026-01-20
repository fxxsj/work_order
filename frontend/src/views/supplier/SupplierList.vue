<template>
  <div class="supplier-list">
    <el-card>
      <!-- 搜索和筛选 -->
      <el-form
        :inline="true"
        :model="filters"
        class="search-form"
        @keyup.enter.native="handleSearch"
      >
        <el-form-item label="供应商名称/编码">
          <el-input v-model="searchText" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable>
            <el-option label="启用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            搜索
          </el-button>
          <el-button @click="resetFilters">
            重置
          </el-button>
          <el-button v-if="canCreate()" type="success" @click="showCreateDialog">
            新增供应商
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
      >
        <el-table-column prop="code" label="供应商编码" width="150" />
        <el-table-column prop="name" label="供应商名称" width="200" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
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
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="canEdit()"
              size="mini"
              type="primary"
              @click="showEditDialog(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
              size="mini"
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="供应商编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入供应商编码" :disabled="isEditMode" />
        </el-form-item>
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact_person">
          <el-input v-model="form.contact_person" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input
            v-model="form.address"
            type="textarea"
            :rows="3"
            placeholder="请输入地址"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">
              启用
            </el-radio>
            <el-radio label="inactive">
              停用
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { supplierAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import formDialogMixin from '@/mixins/formDialogMixin'
import Pagination from '@/components/common/Pagination.vue'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'SupplierList',

  components: {
    Pagination
  },

  mixins: [listPageMixin, crudPermissionMixin, formDialogMixin],

  data() {
    return {
      // API 服务
      apiService: supplierAPI,
      permissionPrefix: 'supplier',

      // 表单数据
      form: {
        code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
        notes: ''
      },

      // 验证规则
      rules: {
        code: [{ required: true, message: '请输入供应商编码', trigger: 'blur' }],
        name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
        phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的联系电话', trigger: 'blur' }],
        email: [{ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }]
      }
    }
  },

  created() {
    this.loadData()
  },

  methods: {
    /**
     * 获取数据
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
     * 处理表单提交
     */
    async handleFormSubmit(formData) {
      if (this.dialogType === 'create') {
        await this.apiService.create(formData)
        ErrorHandler.showSuccess('创建成功')
      } else {
        await this.apiService.update(formData.id, formData)
        ErrorHandler.showSuccess('更新成功')
      }
      await this.loadData()
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
    },

    /**
     * 自定义重置表单
     */
    customResetForm() {
      this.form = {
        code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        status: 'active',
        notes: ''
      }
    }
  }
}
</script>

<style scoped>
.supplier-list {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}
</style>
