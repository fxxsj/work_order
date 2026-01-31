<template>
  <div class="assignment-rule-list">
    <el-card>
      <!-- 头部：搜索和全局开关 -->
      <div class="header-section">
        <div class="left-section">
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

        <div class="right-section">
          <span class="global-toggle-label">启用自动分派：</span>
          <el-switch
            v-model="globalDispatchEnabled"
            active-text="是"
            inactive-text="否"
            @change="handleGlobalToggle"
          />
        </div>
      </div>

      <!-- 双列布局 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 左列：工序列表 -->
        <el-col :span="8">
          <process-list
            :processes="processList"
            :selected-process="selectedProcess"
            :loading="processListLoading"
            @select="handleProcessSelect"
          />
        </el-col>

        <!-- 右列：部门优先级面板 -->
        <el-col :span="16">
          <department-priority-panel
            :process="selectedProcess"
            :departments="departmentRules"
            :all-departments="departmentList"
            :loading="departmentRulesLoading"
            :can-edit="canEdit()"
            :can-delete="canDelete()"
            @update-priority="handlePriorityUpdate"
            @toggle-active="handleToggleActive"
            @add-department="handleAddDepartment"
            @edit-department="handleEditDepartment"
            @remove-department="handleRemoveDepartment"
          />
        </el-col>
      </el-row>

      <!-- 分派预览表格 -->
      <div class="preview-section">
        <div class="preview-header">
          <h4>分派效果预览</h4>
          <el-button
            type="text"
            icon="el-icon-refresh"
            :loading="previewLoading"
            @click="generatePreview"
          >
            刷新预览
          </el-button>
        </div>
        <dispatch-preview-table
          :preview-data="previewData"
          :loading="previewLoading"
          :global-dispatch-enabled="globalDispatchEnabled"
        />
      </div>
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

// 导入组件
import ProcessList from '@/components/dispatch/ProcessList.vue'
import DepartmentPriorityPanel from '@/components/dispatch/DepartmentPriorityPanel.vue'
import DispatchPreviewTable from '@/components/dispatch/DispatchPreviewTable.vue'

// 表单初始值常量
const FORM_INITIAL = {
  process: null,
  department: null,
  priority: 50,
  operator_selection_strategy: 'least_tasks',
  is_active: true,
  notes: ''
}

// 全局分派开关的 localStorage key
const DISPATCH_GLOBAL_ENABLED_KEY = 'dispatch_global_enabled'

export default {
  name: 'AssignmentRule',
  components: {
    ProcessList,
    DepartmentPriorityPanel,
    DispatchPreviewTable
  },
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

      // 加载状态
      processListLoading: false,
      departmentRulesLoading: false,
      previewLoading: false,

      // 选中的工序和部门规则
      selectedProcess: null,
      departmentRules: [],

      // 全局分派开关
      globalDispatchEnabled: false,

      // 预览数据
      previewData: [],

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
    this.loadGlobalDispatchState()
    this.loadProcessList()
    this.loadDepartmentList()
    this.generatePreview()
  },
  methods: {
    /**
     * 获取数据（listPageMixin 要求实现）
     * 注意：在这个页面中，我们使用双列布局而不是表格，所以这个方法主要用于其他可能的数据加载
     */
    fetchData() {
      // 不需要实现，因为我们使用自定义的数据加载方式
      return Promise.resolve({ results: [], count: 0 })
    },

    /**
     * 加载全局分派开关状态
     */
    loadGlobalDispatchState() {
      const saved = localStorage.getItem(DISPATCH_GLOBAL_ENABLED_KEY)
      this.globalDispatchEnabled = saved === 'true'
    },

    /**
     * 保存全局分派开关状态
     */
    saveGlobalDispatchState() {
      localStorage.setItem(DISPATCH_GLOBAL_ENABLED_KEY, String(this.globalDispatchEnabled))
    },

    /**
     * 处理全局分派开关切换
     */
    handleGlobalToggle(value) {
      this.saveGlobalDispatchState()
      ErrorHandler.showSuccess(value ? '已启用自动分派' : '已禁用自动分派')
      // 刷新预览
      this.generatePreview()
    },

    /**
     * 加载工序列表
     */
    async loadProcessList() {
      this.processListLoading = true
      try {
        const res = await processAPI.getList({ page_size: 1000, is_active: true })
        this.processList = res.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载工序列表')
      } finally {
        this.processListLoading = false
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
     * 处理工序选择
     */
    async handleProcessSelect(process) {
      this.selectedProcess = process
      if (process) {
        await this.loadDepartmentPriorities(process.id)
      } else {
        this.departmentRules = []
      }
    },

    /**
     * 加载指定工序的部门优先级规则
     */
    async loadDepartmentPriorities(processId) {
      this.departmentRulesLoading = true
      try {
        const res = await this.apiService.getList({
          process: processId,
          ordering: '-priority',
          page_size: 100
        })
        this.departmentRules = res.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载部门优先级')
      } finally {
        this.departmentRulesLoading = false
      }
    },

    /**
     * 生成分派预览
     */
    async generatePreview() {
      this.previewLoading = true
      try {
        const res = await this.apiService.preview()
        this.previewData = res.preview || []
      } catch (error) {
        ErrorHandler.showMessage(error, '生成分派预览')
      } finally {
        this.previewLoading = false
      }
    },

    /**
     * 处理优先级更新（拖拽排序后）
     */
    async handlePriorityUpdate(updates) {
      try {
        // 批量更新优先级
        const updatePromises = updates.map(update =>
          this.apiService.update(update.id, { priority: update.priority })
        )
        await Promise.all(updatePromises)
        ErrorHandler.showSuccess('优先级更新成功')
        // 刷新部门规则和预览
        if (this.selectedProcess) {
          await this.loadDepartmentPriorities(this.selectedProcess.id)
        }
        await this.generatePreview()
      } catch (error) {
        ErrorHandler.showMessage(error, '更新优先级')
        // 如果失败，重新加载数据
        if (this.selectedProcess) {
          await this.loadDepartmentPriorities(this.selectedProcess.id)
        }
      }
    },

    /**
     * 处理切换启用状态
     */
    async handleToggleActive({ id, is_active: isActive }) {
      try {
        await this.apiService.update(id, { is_active: isActive })
        ErrorHandler.showSuccess(isActive ? '已启用' : '已禁用')
        // 刷新部门规则和预览
        if (this.selectedProcess) {
          await this.loadDepartmentPriorities(this.selectedProcess.id)
        }
        await this.generatePreview()
      } catch (error) {
        ErrorHandler.showMessage(error, '切换状态')
      }
    },

    /**
     * 处理添加部门
     */
    async handleAddDepartment(data) {
      try {
        await this.apiService.create(data)
        ErrorHandler.showSuccess('部门添加成功')
        // 刷新部门规则和预览
        if (this.selectedProcess) {
          await this.loadDepartmentPriorities(this.selectedProcess.id)
        }
        await this.generatePreview()
      } catch (error) {
        ErrorHandler.showMessage(error, '添加部门')
      }
    },

    /**
     * 处理编辑部门
     */
    async handleEditDepartment(data) {
      try {
        await this.apiService.update(data.id, data)
        ErrorHandler.showSuccess('部门规则更新成功')
        // 刷新部门规则和预览
        if (this.selectedProcess) {
          await this.loadDepartmentPriorities(this.selectedProcess.id)
        }
        await this.generatePreview()
      } catch (error) {
        ErrorHandler.showMessage(error, '编辑部门规则')
      }
    },

    /**
     * 处理删除部门
     */
    async handleRemoveDepartment(dept) {
      const confirmed = await ErrorHandler.confirm(
        `确定要删除"${dept.department_name}"的分派规则吗？`,
        '删除确认'
      )

      if (!confirmed) return

      try {
        await this.apiService.delete(dept.id)
        ErrorHandler.showSuccess('删除成功')
        // 刷新部门规则和预览
        if (this.selectedProcess) {
          await this.loadDepartmentPriorities(this.selectedProcess.id)
        }
        await this.generatePreview()
      } catch (error) {
        ErrorHandler.showMessage(error, '删除部门规则')
      }
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
          // 刷新数据
          if (this.selectedProcess) {
            await this.loadDepartmentPriorities(this.selectedProcess.id)
          }
          await this.generatePreview()
        } catch (error) {
          ErrorHandler.showMessage(error, this.isEdit ? '更新分派规则' : '创建分派规则')
        } finally {
          this.submitting = false
        }
      })
    },

    /**
     * 搜索（保留以兼容 listPageMixin）
     */
    handleSearch() {
      // 在双列布局中，搜索功能通过过滤工序列表实现
      // 这里可以实现工序的过滤逻辑
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

.left-section {
  display: flex;
  gap: 12px;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.global-toggle-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.preview-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
</style>
