<template>
  <div class="process-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索工序名称、编码"
          style="width: 300px;"
          clearable
          @clear="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button type="primary" icon="el-icon-plus" @click="showDialog()">
          新建工序
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="工序编码" width="120"></el-table-column>
        <el-table-column prop="name" label="工序名称" width="180"></el-table-column>
        <el-table-column label="工序类别" width="120">
          <template slot-scope="scope">
            <el-tag :type="getCategoryType(scope.row.category)">
              {{ scope.row.category_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        <el-table-column prop="standard_duration" label="标准工时(小时)" width="140" align="right"></el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center"></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="showDialog(scope.row)">
              编辑
            </el-button>
            <el-button type="text" size="small" style="color: #F56C6C;" @click="handleDelete(scope.row)">
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

    <!-- 工序表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="工序编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入工序编码" :disabled="isEdit"></el-input>
        </el-form-item>
        <el-form-item label="工序名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入工序名称"></el-input>
        </el-form-item>
        <el-form-item label="工序类别" prop="category">
          <el-select v-model="form.category" style="width: 100%;">
            <el-option label="印前" value="prepress"></el-option>
            <el-option label="印刷" value="printing"></el-option>
            <el-option label="表面处理" value="surface"></el-option>
            <el-option label="后道加工" value="postpress"></el-option>
            <el-option label="复合/裱合" value="laminating"></el-option>
            <el-option label="成型/包装" value="forming"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="工序描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入工序描述"></el-input>
        </el-form-item>
        <el-form-item label="标准工时(小时)">
          <el-input-number
            v-model="form.standard_duration"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="form.sort_order"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.is_active"></el-switch>
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
import { processAPI } from '@/api/workorder'

export default {
  name: 'ProcessList',
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
        category: 'other',
        description: '',
        standard_duration: 0,
        sort_order: 0,
        is_active: true
      },
      rules: {
        code: [
          { required: true, message: '请输入工序编码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入工序名称', trigger: 'blur' }
        ],
        category: [
          { required: true, message: '请选择工序类别', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑工序' : '新建工序'
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    getCategoryType(category) {
      const typeMap = {
        prepress: '',
        printing: 'success',
        surface: 'warning',
        postpress: 'danger',
        laminating: 'info',
        forming: 'primary',
        other: ''
      }
      return typeMap[category] || ''
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
        
        const response = await processAPI.getList(params)
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
          category: row.category,
          description: row.description || '',
          standard_duration: row.standard_duration,
          sort_order: row.sort_order,
          is_active: row.is_active
        }
      } else {
        this.isEdit = false
        this.editId = null
        this.form = {
          code: '',
          name: '',
          category: 'other',
          description: '',
          standard_duration: 0,
          sort_order: 0,
          is_active: true
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
            await processAPI.update(this.editId, this.form)
            this.$message.success('保存成功')
          } else {
            await processAPI.create(this.form)
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
      this.$confirm(`确定要删除工序 ${row.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await processAPI.delete(row.id)
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
.process-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

