<template>
  <div class="process-category-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索分类名称、编码"
          style="width: 300px;"
          clearable
          @clear="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button type="primary" icon="el-icon-plus" @click="showDialog()">
          新建分类
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="分类编码" width="150"></el-table-column>
        <el-table-column prop="name" label="分类名称" width="180"></el-table-column>
        <el-table-column prop="sort_order" label="排序" width="100" align="center"></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.created_at) }}
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

    <!-- 分类表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="500px"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入分类编码（英文，如：prepress）" :disabled="isEdit"></el-input>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            建议使用英文小写，如：prepress、printing、surface等
          </div>
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称（中文）"></el-input>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="form.sort_order"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            数字越小越靠前显示
          </div>
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
import { processCategoryAPI } from '@/api/workorder'

export default {
  name: 'ProcessCategoryList',
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
        sort_order: 0,
        is_active: true
      },
      rules: {
        code: [
          { required: true, message: '请输入分类编码', trigger: 'blur' },
          { pattern: /^[a-z0-9_]+$/, message: '分类编码只能包含小写字母、数字和下划线', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入分类名称', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑分类' : '新建分类'
    }
  },
  created() {
    this.loadData()
  },
  methods: {
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
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          page_size: this.pageSize
        }
        
        // 简单搜索（后端可能需要添加search字段支持）
        const response = await processCategoryAPI.getList(params)
        let results = response.results || []
        
        // 前端过滤搜索
        if (this.searchText) {
          const searchLower = this.searchText.toLowerCase()
          results = results.filter(item => 
            item.name.toLowerCase().includes(searchLower) ||
            item.code.toLowerCase().includes(searchLower)
          )
        }
        
        this.tableData = results
        this.total = response.count || results.length
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
          sort_order: row.sort_order,
          is_active: row.is_active
        }
      } else {
        this.isEdit = false
        this.editId = null
        this.form = {
          code: '',
          name: '',
          sort_order: 0,
          is_active: true
        }
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        try {
          if (this.isEdit) {
            await processCategoryAPI.update(this.editId, this.form)
            this.$message.success('保存成功')
          } else {
            await processCategoryAPI.create(this.form)
            this.$message.success('创建成功')
          }
          
          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          const errorMsg = error.response?.data?.detail || error.response?.data?.error || 
                          (this.isEdit ? '保存失败' : '创建失败')
          this.$message.error(errorMsg)
          console.error(error)
        }
      })
    },
    handleDelete(row) {
      this.$confirm(`确定要删除分类 "${row.name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await processCategoryAPI.delete(row.id)
          this.$message.success('删除成功')
          this.loadData()
        } catch (error) {
          const errorMsg = error.response?.data?.detail || '删除失败，该分类可能已被工序使用'
          this.$message.error(errorMsg)
          console.error(error)
        }
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.process-category-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

