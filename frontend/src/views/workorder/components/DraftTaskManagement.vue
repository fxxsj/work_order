<template>
  <div v-if="showDraftTasks" class="draft-task-management">
    <el-card>
      <div slot="header" class="card-header">
        <span>草稿任务管理</span>
        <el-tag type="info" size="small" style="margin-left: 10px;">
          {{ draftTasks.length }} 个草稿任务
        </el-tag>
      </div>

      <el-alert
        title="提示"
        type="info"
        description="草稿任务是系统自动生成的任务预览，您可以在审核前批量编辑或删除这些任务。审核通过后，草稿任务将转换为正式任务。"
        :closable="false"
        style="margin-bottom: 15px;"
      />

      <!-- 草稿任务表格 -->
      <el-table
        ref="draftTaskTable"
        :data="draftTasks"
        border
        style="width: 100%;"
        size="small"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
        />
        <el-table-column
          prop="id"
          label="任务ID"
          width="80"
          align="center"
        />
        <el-table-column
          prop="work_content"
          label="任务内容"
          min-width="200"
        />
        <el-table-column
          prop="task_type_display"
          label="任务类型"
          width="120"
        />
        <el-table-column
          prop="production_quantity"
          label="生产数量"
          width="100"
          align="right"
        />
        <el-table-column
          label="优先级"
          width="100"
          align="center"
        >
          <template slot-scope="scope">
            <el-tag
              :type="getPriorityType(scope.row.priority)"
              size="small"
            >
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="production_requirements"
          label="备注"
          min-width="150"
          show-overflow-tooltip
        />
      </el-table>

      <!-- 批量操作按钮 -->
      <div class="bulk-actions" style="margin-top: 15px;">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-edit"
          :disabled="selectedDraftTasks.length === 0"
          @click="showBulkEditDialog"
        >
          批量编辑 ({{ selectedDraftTasks.length }})
        </el-button>
        <el-button
          type="danger"
          size="small"
          icon="el-icon-delete"
          :disabled="selectedDraftTasks.length === 0"
          @click="handleBulkDelete"
        >
          批量删除
        </el-button>
        <el-button
          size="small"
          icon="el-icon-refresh-left"
          @click="clearSelection"
        >
          清空选择
        </el-button>
      </div>
    </el-card>

    <!-- 批量编辑对话框 -->
    <el-dialog
      title="批量编辑草稿任务"
      :visible.sync="bulkEditDialogVisible"
      width="600px"
      :before-close="handleCloseBulkEditDialog"
    >
      <el-alert
        title="提示"
        type="info"
        description="留空表示不修改该字段，只填写需要修改的字段。"
        :closable="false"
        style="margin-bottom: 15px;"
      />

      <el-form
        ref="bulkEditFormRef"
        :model="bulkEditForm"
        label-width="120px"
      >
        <el-form-item label="选中任务数量">
          <span>{{ selectedDraftTasks.length }} 个任务</span>
        </el-form-item>
        <el-form-item label="生产数量">
          <el-input-number
            v-model="bulkEditForm.production_quantity"
            :min="0"
            :step="1"
            placeholder="留空则不修改"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select
            v-model="bulkEditForm.priority"
            placeholder="留空则不修改"
            clearable
            style="width: 100%;"
          >
            <el-option label="低" value="low" />
            <el-option label="普通" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="bulkEditForm.production_requirements"
            type="textarea"
            :rows="3"
            placeholder="留空则不修改"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="bulkEditDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="bulkUpdating"
          @click="confirmBulkEdit"
        >
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { workOrderTaskAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'DraftTaskManagement',
  props: {
    workOrder: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      draftTasks: [],
      selectedDraftTasks: [],
      bulkEditDialogVisible: false,
      bulkUpdating: false,
      bulkEditForm: {
        task_ids: [],
        production_quantity: null,
        priority: null,
        production_requirements: null
      }
    }
  },
  computed: {
    showDraftTasks() {
      // 只在施工单未审核时显示草稿任务
      return this.workOrder &&
             this.workOrder.approval_status !== 'approved' &&
             this.draftTasks.length > 0
    }
  },
  watch: {
    workOrder: {
      handler(newVal) {
        if (newVal) {
          this.loadDraftTasks()
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    async loadDraftTasks() {
      if (!this.workOrder || !this.workOrder.id) return

      try {
        // 从所有工序中筛选草稿任务
        const allTasks = []
        if (this.workOrder.processes && Array.isArray(this.workOrder.processes)) {
          this.workOrder.processes.forEach(process => {
            if (process.tasks && Array.isArray(process.tasks)) {
              process.tasks.forEach(task => {
                if (task.status === 'draft') {
                  allTasks.push(task)
                }
              })
            }
          })
        }
        this.draftTasks = allTasks
      } catch (error) {
        console.error('加载草稿任务失败:', error)
      }
    },

    handleSelectionChange(selection) {
      this.selectedDraftTasks = selection
    },

    clearSelection() {
      this.$refs.draftTaskTable.clearSelection()
      this.selectedDraftTasks = []
    },

    showBulkEditDialog() {
      if (this.selectedDraftTasks.length === 0) {
        this.$message.warning('请先选择要编辑的任务')
        return
      }

      // 验证所有选中任务都是草稿状态
      const hasNonDraft = this.selectedDraftTasks.some(t => t.status !== 'draft')
      if (hasNonDraft) {
        this.$message.error('只能编辑草稿状态的任务')
        return
      }

      this.bulkEditForm = {
        task_ids: this.selectedDraftTasks.map(t => t.id),
        production_quantity: null,
        priority: null,
        production_requirements: null
      }
      this.bulkEditDialogVisible = true
    },

    async confirmBulkEdit() {
      try {
        this.bulkUpdating = true

        // 过滤掉 null 值，只传递需要更新的字段
        const updateData = {
          task_ids: this.bulkEditForm.task_ids
        }
        if (this.bulkEditForm.production_quantity !== null) {
          updateData.production_quantity = this.bulkEditForm.production_quantity
        }
        if (this.bulkEditForm.priority !== null) {
          updateData.priority = this.bulkEditForm.priority
        }
        if (this.bulkEditForm.production_requirements !== null) {
          updateData.production_requirements = this.bulkEditForm.production_requirements
        }

        const response = await workOrderTaskAPI.bulkUpdate(updateData)
        ErrorHandler.showSuccess(response.data.message || '批量更新成功')
        this.bulkEditDialogVisible = false
        this.clearSelection()

        // 重新加载草稿任务
        await this.loadDraftTasks()

        // 通知父组件刷新
        this.$emit('refresh')
      } catch (error) {
        ErrorHandler.showMessage(error, '批量更新失败')
      } finally {
        this.bulkUpdating = false
      }
    },

    handleCloseBulkEditDialog(done) {
      if (this.bulkUpdating) {
        return
      }
      done()
    },

    async handleBulkDelete() {
      if (this.selectedDraftTasks.length === 0) {
        this.$message.warning('请先选择要删除的任务')
        return
      }

      // 验证所有选中任务都是草稿状态
      const hasNonDraft = this.selectedDraftTasks.some(t => t.status !== 'draft')
      if (hasNonDraft) {
        this.$message.error('只能删除草稿状态的任务')
        return
      }

      try {
        await ErrorHandler.confirm(
          `确定要删除选中的 ${this.selectedDraftTasks.length} 个草稿任务吗？`,
          '确认删除'
        )

        const taskIds = this.selectedDraftTasks.map(t => t.id)
        const response = await workOrderTaskAPI.bulkDelete(taskIds)
        ErrorHandler.showSuccess(response.data.message || '批量删除成功')
        this.clearSelection()

        // 重新加载草稿任务
        await this.loadDraftTasks()

        // 通知父组件刷新
        this.$emit('refresh')
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '批量删除失败')
        }
      }
    },

    getPriorityType(priority) {
      const typeMap = {
        low: '',
        normal: 'info',
        high: 'warning',
        urgent: 'danger'
      }
      return typeMap[priority] || 'info'
    },

    getPriorityText(priority) {
      const textMap = {
        low: '低',
        normal: '普通',
        high: '高',
        urgent: '紧急'
      }
      return textMap[priority] || '普通'
    }
  }
}
</script>

<style scoped>
.draft-task-management {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}
</style>
