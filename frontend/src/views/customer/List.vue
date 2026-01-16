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
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button 
          v-if="canCreate" 
          type="primary" 
          icon="el-icon-plus" 
          @click="showDialog()">
          新建客户
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="name" label="客户名称" width="200"></el-table-column>
        <el-table-column prop="contact_person" label="联系人" width="120"></el-table-column>
        <el-table-column prop="phone" label="联系电话" width="150"></el-table-column>
        <el-table-column prop="email" label="邮箱" width="200"></el-table-column>
        <el-table-column prop="salesperson_name" label="业务员" width="120">
          <template slot-scope="scope">
            {{ scope.row.salesperson_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200"></el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.created_at | formatDateTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button 
              v-if="canEdit" 
              type="text" 
              size="small" 
              @click="showDialog(scope.row)">
              编辑
            </el-button>
            <el-button 
              v-if="canDelete" 
              type="text" 
              size="small" 
              style="color: #F56C6C;" 
              @click="handleDelete(scope.row)">
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
      >
      </el-pagination>
    </el-card>

    <!-- 客户表单对话框 -->
    <el-dialog
      :title="dialogTitle"
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
          <el-input v-model="form.name" placeholder="请输入客户名称"></el-input>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_person" placeholder="请输入联系人"></el-input>
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
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
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入地址"></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="请输入备注"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { customerAPI } from '@/api/workorder'
import { getSalespersons } from '@/api/auth'

export default {
  name: 'CustomerList',
  data() {
    return {
      loading: false,
      tableData: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      searchText: '',
      dialogVisible: false,
      isEdit: false,
      editId: null,
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
    dialogTitle() {
      return this.isEdit ? '编辑客户' : '新建客户'
    },
    // 检查是否有创建权限
    canCreate() {
      return this.hasPermission('workorder.add_customer')
    },
    // 检查是否有编辑权限
    canEdit() {
      return this.hasPermission('workorder.change_customer')
    },
    // 检查是否有删除权限
    canDelete() {
      return this.hasPermission('workorder.delete_customer')
    }
  },
  created() {
    this.loadData()
    this.loadSalespersons()
    // 创建防抖搜索函数
    this.handleSearchDebounced = this.debounce(this.handleSearch, 300)
  },
  methods: {
    // 防抖工具函数
    debounce(func, wait) {
      let timeout
      return function(...args) {
        clearTimeout(timeout)
        timeout = setTimeout(() => func.apply(this, args), wait)
      }
    },
    // 检查用户是否有指定权限
    hasPermission(permission) {
      const userInfo = this.$store.getters.currentUser
      if (!userInfo) return false
      
      // 超级用户拥有所有权限
      if (userInfo.is_superuser) return true
      
      // 检查权限列表
      const permissions = userInfo.permissions || []
      if (permissions.includes('*')) return true
      
      return permissions.includes(permission)
    },
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          page_size: this.pageSize
        }
        
        if (this.searchText) {
          params.search = this.searchText
        }
        
        const response = await customerAPI.getList(params)
        this.tableData = response.results || []
        this.total = response.count || 0
      } catch (error) {
        this.$message.error('加载数据失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },
    handlePageChange(page) {
      this.currentPage = page
      this.loadData()
    },
    async loadSalespersons() {
      try {
        const salespersons = await getSalespersons()
        this.salespersonList = salespersons || []
      } catch (error) {
        console.error('加载业务员列表失败:', error)
      }
    },
    showDialog(row = null) {
      if (row) {
        this.isEdit = true
        this.editId = row.id
        this.form = {
          name: row.name,
          contact_person: row.contact_person || '',
          phone: row.phone || '',
          email: row.email || '',
          address: row.address || '',
          salesperson: row.salesperson || null,
          notes: row.notes || ''
        }
      } else {
        this.isEdit = false
        this.editId = null
        this.form = {
          name: '',
          contact_person: '',
          phone: '',
          email: '',
          address: '',
          salesperson: null,
          notes: ''
        }
      }
      this.dialogVisible = true
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        try {
          if (this.isEdit) {
            await customerAPI.update(this.editId, this.form)
            this.$message.success('保存成功')
          } else {
            await customerAPI.create(this.form)
            this.$message.success('创建成功')
          }
          
          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.$message.error(this.isEdit ? '保存失败' : '创建失败')
          console.error(error)
        }
      })
    },
    handleDelete(row) {
      this.$confirm(`确定要删除客户 ${row.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await customerAPI.delete(row.id)
          this.$message.success('删除成功')
          this.loadData()
        } catch (error) {
          this.$message.error('删除失败')
          console.error(error)
        }
      }).catch(() => {})
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

