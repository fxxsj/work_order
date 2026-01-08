<template>
  <div class="assignment-rule-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索工序、部门"
          style="width: 300px;"
          clearable
          @clear="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button 
          type="primary" 
          icon="el-icon-plus" 
          @click="showDialog()">
          新建分派规则
        </el-button>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-section" style="margin-top: 20px;">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select
              v-model="filters.process"
              placeholder="工序筛选"
              clearable
              filterable
              style="width: 100%;"
              @change="handleSearch"
            >
              <el-option
                v-for="process in processList"
                :key="process.id"
                :label="process.name"
                :value="process.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="filters.department"
              placeholder="部门筛选"
              clearable
              filterable
              style="width: 100%;"
              @change="handleSearch"
            >
              <el-option
                v-for="dept in departmentList"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="filters.is_active"
              placeholder="状态筛选"
              clearable
              style="width: 100%;"
              @change="handleSearch"
            >
              <el-option label="启用" :value="true"></el-option>
              <el-option label="禁用" :value="false"></el-option>
            </el-select>
          </el-col>
          <el-col :span="6" style="text-align: right;">
            <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
            <el-button type="primary" icon="el-icon-refresh" @click="loadData" style="margin-left: 10px;">刷新</el-button>
          </el-col>
        </el-row>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
        border
      >
        <el-table-column prop="process_name" label="工序" width="150">
          <template slot-scope="scope">
            <div>
              <div style="font-weight: bold;">{{ scope.row.process_name }}</div>
              <div style="font-size: 12px; color: #909399;">{{ scope.row.process_code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="department_name" label="分派部门" width="150">
          <template slot-scope="scope">
            <div>
              <div style="font-weight: bold;">{{ scope.row.department_name }}</div>
              <div style="font-size: 12px; color: #909399;">{{ scope.row.department_code }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100" sortable>
          <template slot-scope="scope">
            <el-tag :type="getPriorityTagType(scope.row.priority)">
              {{ scope.row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_selection_strategy_display" label="操作员选择策略" width="200">
          <template slot-scope="scope">
            {{ scope.row.operator_selection_strategy_display }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button 
              type="text" 
              size="small" 
              @click="showDialog(scope.row)">
              编辑
            </el-button>
            <el-button 
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

    <!-- 分派规则表单对话框 -->
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
        label-width="140px"
      >
        <el-form-item label="工序" prop="process">
          <el-select
            v-model="form.process"
            placeholder="请选择工序"
            filterable
            style="width: 100%;"
            :disabled="isEdit"
          >
            <el-option
              v-for="process in processList"
              :key="process.id"
              :label="`${process.code} - ${process.name}`"
              :value="process.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分派部门" prop="department">
          <el-select
            v-model="form.department"
            placeholder="请选择部门"
            filterable
            style="width: 100%;"
            :disabled="isEdit"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number
            v-model="form.priority"
            :min="0"
            :max="100"
            style="width: 100%;"
          ></el-input-number>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            优先级越高越优先匹配（0-100）
          </div>
        </el-form-item>
        <el-form-item label="操作员选择策略" prop="operator_selection_strategy">
          <el-select
            v-model="form.operator_selection_strategy"
            placeholder="请选择策略"
            style="width: 100%;"
          >
            <el-option
              label="任务数量最少（工作量均衡）"
              value="least_tasks"
            ></el-option>
            <el-option
              label="随机选择"
              value="random"
            ></el-option>
            <el-option
              label="轮询分配"
              value="round_robin"
            ></el-option>
            <el-option
              label="第一个可用"
              value="first_available"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="是否启用" prop="is_active">
          <el-switch
            v-model="form.is_active"
            active-text="启用"
            inactive-text="禁用"
          ></el-switch>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { taskAssignmentRuleAPI, processAPI, departmentAPI } from '@/api/workorder'

export default {
  name: 'AssignmentRule',
  data() {
    return {
      loading: false,
      submitting: false,
      tableData: [],
      processList: [],
      departmentList: [],
      searchText: '',
      filters: {
        process: null,
        department: null,
        is_active: null
      },
      currentPage: 1,
      pageSize: 20,
      total: 0,
      dialogVisible: false,
      dialogTitle: '新建分派规则',
      isEdit: false,
      currentRuleId: null,
      form: {
        process: null,
        department: null,
        priority: 0,
        operator_selection_strategy: 'least_tasks',
        is_active: true,
        notes: ''
      },
      rules: {
        process: [
          { required: true, message: '请选择工序', trigger: 'change' }
        ],
        department: [
          { required: true, message: '请选择部门', trigger: 'change' }
        ],
        priority: [
          { required: true, message: '请输入优先级', trigger: 'blur' },
          { type: 'number', min: 0, max: 100, message: '优先级范围0-100', trigger: 'blur' }
        ]
      }
    }
  },
  mounted() {
    this.loadProcessList()
    this.loadDepartmentList()
    this.loadData()
  },
  methods: {
    async loadProcessList() {
      try {
        const res = await processAPI.getList({ page_size: 1000 })
        this.processList = res.results || []
      } catch (error) {
        console.error('加载工序列表失败:', error)
        this.$message.error('加载工序列表失败')
      }
    },
    async loadDepartmentList() {
      try {
        const res = await departmentAPI.getList({ page_size: 1000 })
        this.departmentList = res.results || []
      } catch (error) {
        console.error('加载部门列表失败:', error)
        this.$message.error('加载部门列表失败')
      }
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
        if (this.filters.process) {
          params.process = this.filters.process
        }
        if (this.filters.department) {
          params.department = this.filters.department
        }
        if (this.filters.is_active !== null) {
          params.is_active = this.filters.is_active
        }

        const res = await taskAssignmentRuleAPI.getList(params)
        this.tableData = res.results || []
        this.total = res.count || 0
      } catch (error) {
        console.error('加载分派规则失败:', error)
        this.$message.error('加载分派规则失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },
    handleReset() {
      this.searchText = ''
      this.filters = {
        process: null,
        department: null,
        is_active: null
      }
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
        this.dialogTitle = '编辑分派规则'
        this.currentRuleId = row.id
        this.form = {
          process: row.process,
          department: row.department,
          priority: row.priority,
          operator_selection_strategy: row.operator_selection_strategy,
          is_active: row.is_active,
          notes: row.notes || ''
        }
      } else {
        this.isEdit = false
        this.currentRuleId = null
        this.dialogTitle = '新建分派规则'
        this.resetForm()
      }
      this.dialogVisible = true
    },
    resetForm() {
      this.form = {
        process: null,
        department: null,
        priority: 0,
        operator_selection_strategy: 'least_tasks',
        is_active: true,
        notes: ''
      }
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },
    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        this.submitting = true
        try {
          if (this.isEdit && this.currentRuleId) {
            await taskAssignmentRuleAPI.update(this.currentRuleId, this.form)
            this.$message.success('分派规则更新成功')
          } else {
            await taskAssignmentRuleAPI.create(this.form)
            this.$message.success('分派规则创建成功')
          }
          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
          this.$message.error(errorMessage)
          console.error('保存分派规则失败:', error)
        } finally {
          this.submitting = false
        }
      })
    },
    async handleDelete(row) {
      this.$confirm(`确定要删除分派规则"${row.process_name} -> ${row.department_name}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await taskAssignmentRuleAPI.delete(row.id)
          this.$message.success('删除成功')
          this.loadData()
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '删除失败'
          this.$message.error(errorMessage)
          console.error('删除分派规则失败:', error)
        }
      }).catch(() => {})
    },
    getPriorityTagType(priority) {
      if (priority >= 80) return 'danger'
      if (priority >= 50) return 'warning'
      if (priority >= 20) return 'success'
      return 'info'
    }
  }
}
</script>

<style scoped>
.assignment-rule-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-section {
  margin-bottom: 20px;
}
</style>

