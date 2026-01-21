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
          <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
        </el-input>
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="showDialog()"
        >
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
              />
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
              />
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
              <el-option label="启用" :value="true" />
              <el-option label="禁用" :value="false" />
            </el-select>
          </el-col>
          <el-col :span="6" style="text-align: right;">
            <el-button icon="el-icon-refresh-left" @click="handleReset">
              重置
            </el-button>
            <el-button
              type="primary"
              icon="el-icon-refresh"
              style="margin-left: 10px;"
              @click="loadData"
            >
              刷新
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无分派规则数据"
        :image-size="200"
        style="margin-top: 40px;"
      >
        <el-button v-if="canCreate()" type="primary" @click="showDialog()">
          创建第一个分派规则
        </el-button>
      </el-empty>

      <el-table
        v-else
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
        border
      >
        <el-table-column prop="process_name" label="工序" width="150">
          <template slot-scope="scope">
            <div>
              <div style="font-weight: bold;">
                {{ scope.row.process_name }}
              </div>
              <div style="font-size: 12px; color: #909399;">
                {{ scope.row.process_code }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="department_name" label="分派部门" width="150">
          <template slot-scope="scope">
            <div>
              <div style="font-weight: bold;">
                {{ scope.row.department_name }}
              </div>
              <div style="font-size: 12px; color: #909399;">
                {{ scope.row.department_code }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="priority"
          label="优先级"
          width="100"
          sortable
        >
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
              @click="showDialog(scope.row)"
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
            />
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
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number
            v-model="form.priority"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
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
            />
            <el-option
              label="随机选择"
              value="random"
            />
            <el-option
              label="轮询分配"
              value="round_robin"
            />
            <el-option
              label="第一个可用"
              value="first_available"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否启用" prop="is_active">
          <el-switch
            v-model="form.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { taskAssignmentRuleAPI, processAPI, departmentAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'

// 表单初始值常量
const FORM_INITIAL = {
  process: null,
  department: null,
  priority: 0,
  operator_selection_strategy: 'least_tasks',
  is_active: true,
  notes: ''
}

export default {
  name: 'AssignmentRule',
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务
      apiService: taskAssignmentRuleAPI,
      // 权限前缀
      permissionPrefix: 'taskassignmentrule',
      // 数据列表
      processList: [],
      departmentList: [],
      // 筛选条件
      filters: {
        process: null,
        department: null,
        is_active: null
      },
      // 对话框
      dialogVisible: false,
      dialogTitle: '新建分派规则',
      isEdit: false,
      currentRuleId: null,
      submitting: false,
      // 表单
      form: { ...FORM_INITIAL },
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
    /**
     * 获取数据（listPageMixin 要求实现）
     */
    fetchData() {
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

      return this.apiService.getList(params)
    },

    /**
     * 加载工序列表
     */
    async loadProcessList() {
      try {
        const res = await processAPI.getList({ page_size: 1000 })
        this.processList = res.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载工序列表')
      }
    },

    /**
     * 加载部门列表
     */
    async loadDepartmentList() {
      try {
        const res = await departmentAPI.getList({ page_size: 1000 })
        this.departmentList = res.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载部门列表')
      }
    },

    /**
     * 重置筛选条件
     */
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

    /**
     * 显示对话框
     */
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

    /**
     * 重置表单
     */
    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },

    /**
     * 提交表单
     */
    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }

        this.submitting = true
        try {
          if (this.isEdit && this.currentRuleId) {
            await this.apiService.update(this.currentRuleId, this.form)
            ErrorHandler.showSuccess('分派规则更新成功')
          } else {
            await this.apiService.create(this.form)
            ErrorHandler.showSuccess('分派规则创建成功')
          }
          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          ErrorHandler.showMessage(error, this.isEdit ? '更新分派规则' : '创建分派规则')
        } finally {
          this.submitting = false
        }
      })
    },

    /**
     * 删除分派规则
     */
    async handleDelete(row) {
      const confirmed = await ErrorHandler.confirm(
        `确定要删除分派规则"${row.process_name} -> ${row.department_name}"吗？`,
        '删除确认'
      )

      if (!confirmed) return

      try {
        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '删除分派规则')
      }
    },

    /**
     * 获取优先级标签类型
     */
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
