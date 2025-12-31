<template>
  <div class="material-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索物料名称、编码"
          style="width: 300px;"
          clearable
          @clear="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button 
          v-if="canCreate" 
          type="primary" 
          icon="el-icon-plus" 
          @click="showDialog()">
          新建物料
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="物料编码" width="120"></el-table-column>
        <el-table-column prop="name" label="物料名称" width="200"></el-table-column>
        <el-table-column prop="specification" label="规格" min-width="150"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80" align="center"></el-table-column>
        <el-table-column prop="unit_price" label="单价" width="120" align="right">
          <template slot-scope="scope">
            ¥{{ scope.row.unit_price }}
          </template>
        </el-table-column>
        <el-table-column prop="stock_quantity" label="库存数量" width="120" align="right"></el-table-column>
        <el-table-column prop="notes" label="备注" min-width="150"></el-table-column>
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

    <!-- 物料表单对话框 -->
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
        <el-form-item label="物料编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入物料编码" :disabled="isEdit"></el-input>
        </el-form-item>
        <el-form-item label="物料名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入物料名称"></el-input>
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.specification" placeholder="请输入规格"></el-input>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="如：个、张、本"></el-input>
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number
            v-model="form.unit_price"
            :min="0"
            :precision="2"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input-number
            v-model="form.stock_quantity"
            :min="0"
            :precision="2"
            style="width: 100%;"
          ></el-input-number>
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
import { materialAPI } from '@/api/workorder'

export default {
  name: 'MaterialList',
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
        code: '',
        name: '',
        specification: '',
        unit: '个',
        unit_price: 0,
        stock_quantity: 0,
        notes: ''
      },
      rules: {
        code: [
          { required: true, message: '请输入物料编码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入物料名称', trigger: 'blur' }
        ],
        unit: [
          { required: true, message: '请输入单位', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑物料' : '新建物料'
    },
    canCreate() {
      return this.hasPermission('workorder.add_material')
    },
    canEdit() {
      return this.hasPermission('workorder.change_material')
    },
    canDelete() {
      return this.hasPermission('workorder.delete_material')
    }
  },
  created() {
    this.loadData()
  },
  methods: {
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
        
        const response = await materialAPI.getList(params)
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
    showDialog(row = null) {
      if (row) {
        this.isEdit = true
        this.editId = row.id
        this.form = {
          code: row.code,
          name: row.name,
          specification: row.specification || '',
          unit: row.unit,
          unit_price: parseFloat(row.unit_price),
          stock_quantity: parseFloat(row.stock_quantity),
          notes: row.notes || ''
        }
      } else {
        this.isEdit = false
        this.editId = null
        this.form = {
          code: '',
          name: '',
          specification: '',
          unit: '个',
          unit_price: 0,
          stock_quantity: 0,
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
            await materialAPI.update(this.editId, this.form)
            this.$message.success('保存成功')
          } else {
            await materialAPI.create(this.form)
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
      this.$confirm(`确定要删除物料 ${row.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await materialAPI.delete(row.id)
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
.material-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

