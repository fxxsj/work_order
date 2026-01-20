<template>
  <div class="customer-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索客户名称、联系人、电话"
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
          @click="showCreateDialog()"
        >
          新建客户
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="name" label="客户名称" width="200" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="salesperson_name" label="业务员" width="120">
          <template slot-scope="scope">
            {{ scope.row.salesperson_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.created_at | formatDateTime }}
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

      <el-pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; text-align: right;"
        @current-change="handlePageChange"
      />
    </el-card>

    <!-- 客户表单对话框 -->
    <el-dialog
      :title="formTitle"
      :visible.sync="dialogVisible"
      width="600px"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_person" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="业务员">
          <el-select
            v-model="form.salesperson"
            placeholder="请选择业务员"
            filterable
            clearable
            style="width: 100%;"
          >
            <el-option
              v-for="user in salespersonList"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input
            v-model="form.address"
            type="textarea"
            :rows="2"
            placeholder="请输入地址"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { customerAPI } from '@/api/modules'
import { getSalespersons } from '@/api/auth'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'

export default {
  name: 'CustomerList',
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: customerAPI,
      permissionPrefix: 'customer',

      // 表单相关
      dialogVisible: false,
      form: {
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        salesperson: null,
        notes: ''
      },
      salespersonList: [],
      rules: {
        name: [
          { required: true, message: '请输入客户名称', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    formTitle() {
      return this.dialogType === 'edit' ? '编辑客户' : '新建客户'
    }
  },
  watch: {
    // 监听对话框显示状态，编辑时填充表单
    dialogVisible(val) {
      if (val && this.dialogType === 'edit' && this.currentRow) {
        this.form = {
          name: this.currentRow.name,
          contact_person: this.currentRow.contact_person || '',
          phone: this.currentRow.phone || '',
          email: this.currentRow.email || '',
          address: this.currentRow.address || '',
          salesperson: this.currentRow.salesperson || null,
          notes: this.currentRow.notes || ''
        }
        // 清除验证
        this.$nextTick(() => {
          this.$refs.form?.clearValidate()
        })
      }
    }
  },
  created() {
    this.loadData()
    this.loadSalespersons()
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

    async loadSalespersons() {
      try {
        const salespersons = await getSalespersons()
        this.salespersonList = salespersons || []
      } catch (error) {
        console.error('加载业务员列表失败:', error)
      }
    },

    // 显示创建对话框
    showCreateDialog() {
      this.resetForm()
      this.handleCreate()
    },

    // 重置表单
    resetForm() {
      this.form = {
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        salesperson: null,
        notes: ''
      }
    },

    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return false

        this.formLoading = true
        try {
          if (this.dialogType === 'edit') {
            await this.apiService.update(this.currentRow.id, this.form)
            this.showSuccess('保存成功')
          } else {
            await this.apiService.create(this.form)
            this.showSuccess('创建成功')
          }

          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.showMessage(error, this.dialogType === 'edit' ? '保存失败' : '创建失败')
        } finally {
          this.formLoading = false
        }
      })
    }
  }
}
</script>

<style scoped>
.customer-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

