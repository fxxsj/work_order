<template>
  <div v-loading="loading" class="workorder-detail-refactored">
    <div v-if="workOrder">
      <!-- 顶部操作栏 -->
      <el-card class="header-actions">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-button icon="el-icon-back" @click="$router.back()">
              返回
            </el-button>
            <el-button icon="el-icon-printer" @click="handlePrint">
              打印
            </el-button>
          </el-col>
          <el-col :span="12" style="text-align: right;">
            <el-button
              v-if="canEdit"
              type="primary"
              icon="el-icon-edit"
              @click="handleEdit"
            >
              编辑
            </el-button>
            <el-dropdown v-if="canChangeStatus" @command="handleStatusChange">
              <el-button type="success">
                更改状态<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item
                  v-for="status in availableStatuses"
                  :key="status.value"
                  :command="status.value"
                  :disabled="status.disabled"
                >
                  {{ status.label }}
                  <span v-if="status.disabled" style="color: #909399; font-size: 12px;">{{ status.reason }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </el-col>
        </el-row>
      </el-card>

      <!-- 基本信息 -->
      <work-order-basic-info :work-order="workOrder" />

      <!-- 审核流程 -->
      <approval-workflow
        :work-order="workOrder"
        :can-approve="canApprove"
        :can-resubmit="canResubmit"
        :can-request-reapproval="canRequestReapproval"
        @approve="handleApprove"
        @resubmit="handleResubmit"
        @request-reapproval="handleRequestReapproval"
      />

      <!-- 草稿任务管理 -->
      <draft-task-management
        :work-order="workOrder"
        @refresh="fetchWorkOrderDetail"
      />

      <!-- 图稿和刀模信息 -->
      <artwork-and-die-info :work-order="workOrder" />

      <!-- 工序管理 -->
      <process-management
        :processes="processList"
        :editable="editable"
        :available-processes="availableProcesses"
        :available-artworks="availableArtworks"
        @add-process="handleAddProcess"
        @complete-process="handleCompleteProcess"
        @reassign-process="handleReassignProcess"
        @complete-task="handleCompleteTask"
        @update-task="handleUpdateTask"
        @assign-task="handleAssignTask"
        @split-task="handleSplitTask"
      />

      <!-- 物料管理 -->
      <material-management
        :materials="materialList"
        :editable="editable"
        :available-materials="availableMaterials"
        @add-material="handleAddMaterial"
        @update-status="handleUpdateMaterialStatus"
      />

      <!-- 产品列表 -->
      <work-order-products :products="workOrder.products" />

      <!-- 打印预览对话框 -->
      <el-dialog
        title="打印预览"
        :visible.sync="printDialogVisible"
        width="900px"
        fullscreen
      >
        <work-order-print :work-order="workOrder" />
      </el-dialog>

      <!-- 任务同步确认对话框 -->
      <sync-task-prompt
        :visible="syncPromptDialog"
        :work-order-id="workOrderId"
        :process-ids="pendingProcessIds"
        @synced="handleSyncComplete"
        @close="syncPromptDialog = false"
      />
    </div>
  </div>
</template>

<script>
import { workOrderAPI, materialAPI, artworkAPI, processAPI } from '@/api/modules'
import { workOrderService, permissionService } from '@/services'
import ErrorHandler from '@/utils/errorHandler'
import WorkOrderBasicInfo from './components/WorkOrderBasicInfo.vue'
import WorkOrderProducts from './components/WorkOrderProducts.vue'
import ArtworkAndDieInfo from './components/ArtworkAndDieInfo.vue'
import ApprovalWorkflow from './components/ApprovalWorkflow.vue'
import DraftTaskManagement from './components/DraftTaskManagement.vue'
import MaterialManagement from './components/MaterialManagement.vue'
import ProcessManagement from './components/ProcessManagement.vue'
import WorkOrderPrint from './components/WorkOrderPrint.vue'
import SyncTaskPrompt from './components/SyncTaskPrompt.vue'

export default {
  name: 'WorkOrderDetailRefactored',
  components: {
    WorkOrderBasicInfo,
    WorkOrderProducts,
    ArtworkAndDieInfo,
    ApprovalWorkflow,
    DraftTaskManagement,
    MaterialManagement,
    ProcessManagement,
    WorkOrderPrint,
    SyncTaskPrompt
  },
  data() {
    return {
      loading: false,
      workOrder: null,
      processList: [],
      materialList: [],
      availableProcesses: [],
      availableMaterials: [],
      availableArtworks: [],
      printDialogVisible: false,
      syncPromptDialog: false,
      pendingProcessIds: []
    }
  },
  computed: {
    workOrderId() {
      return this.$route.params.id || this.$route.query.id
    },
    editable() {
      if (!this.workOrder) return false
      return workOrderService.canEdit(this.workOrder)
    },
    canEdit() {
      return this.editable && permissionService.hasPermission('workorder.change')
    },
    canChangeStatus() {
      return this.editable && permissionService.hasPermission('workorder.change')
    },
    canApprove() {
      if (!this.workOrder) return false
      return permissionService.canApproveWorkOrder(this.workOrder)
    },
    canResubmit() {
      if (!this.workOrder) return false
      return workOrderService.canSubmitForApproval(this.workOrder) &&
             this.workOrder.created_by?.id === permissionService.currentUser?.id
    },
    canRequestReapproval() {
      if (!this.workOrder) return false
      return this.workOrder.approval_status === 'approved' &&
             permissionService.hasPermission('workorder.change')
    },
    availableStatuses() {
      if (!this.workOrder) return []
      const currentStatus = this.workOrder.status
      const statuses = [
        { value: 'pending', label: '待开始' },
        { value: 'in_progress', label: '进行中' },
        { value: 'paused', label: '已暂停' },
        { value: 'completed', label: '已完成' },
        { value: 'cancelled', label: '已取消' }
      ]

      return statuses.map(status => {
        let disabled = status.value === currentStatus
        let reason = ''

        // 已完成和已取消不能更改
        if (currentStatus === 'completed' || currentStatus === 'cancelled') {
          disabled = true
          reason = '（已完成或已取消的施工单不能更改状态）'
        }

        // 已审核通过的施工单需要特殊权限
        if (this.workOrder.approval_status === 'approved' &&
            status.value !== currentStatus &&
            !permissionService.hasPermission('workorder.change_approved')) {
          disabled = true
          reason = '（需要特殊权限）'
        }

        return { ...status, disabled, reason }
      })
    }
  },
  async created() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // 加载施工单详情
        const [detailResult] = await Promise.all([
          workOrderAPI.getDetail(this.workOrderId),
          this.loadAvailableData()
        ])

        if (detailResult) {
          this.workOrder = detailResult
          // 提取工序和物料列表
          this.processList = this.workOrder.processes || []
          this.materialList = this.workOrder.materials || []

          // 格式化数据用于显示
          this.workOrder = workOrderService.formatWorkOrderForDisplay(this.workOrder)
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '加载施工单详情')
      } finally {
        this.loading = false
      }
    },
    async loadAvailableData() {
      try {
        // 加载可用工序、物料、图稿
        const [processesRes, materialsRes, artworksRes] = await Promise.all([
          processAPI.getList({ page_size: 1000 }),
          materialAPI.getList({ page_size: 1000 }),
          artworkAPI.getList({ page_size: 1000, work_order: this.workOrderId })
        ])

        this.availableProcesses = processesRes.data?.results || []
        this.availableMaterials = materialsRes.data?.results || []
        this.availableArtworks = artworksRes.data?.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载可用数据')
      }
    },
    handleEdit() {
      this.$router.push({
        name: 'WorkOrderForm',
        params: { id: this.workOrderId },
        query: { mode: 'edit' }
      })
    },
    handlePrint() {
      this.printDialogVisible = true
    },
    async handleStatusChange(status) {
      try {
        const result = await workOrderAPI.updateStatus(this.workOrderId, { status })
        if (result.data) {
          ErrorHandler.showSuccess('状态更新成功')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '状态更新')
      }
    },
    async handleApprove(data) {
      try {
        const result = await workOrderAPI.review(this.workOrderId, data)
        if (result.data) {
          ErrorHandler.showSuccess(data.status === 'approved' ? '审核通过' : '已拒绝')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '审核操作')
      }
    },
    async handleResubmit(data) {
      try {
        const result = await workOrderAPI.resubmit(this.workOrderId, data)
        if (result.data) {
          ErrorHandler.showSuccess('重新提交成功')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '重新提交')
      }
    },
    async handleRequestReapproval(data) {
      try {
        const result = await workOrderAPI.requestReapproval(this.workOrderId, data)
        if (result.data) {
          ErrorHandler.showSuccess('已请求重新审核')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '请求重新审核')
      }
    },
    async handleAddProcess(data) {
      try {
        const result = await workOrderAPI.addProcess(this.workOrderId, data)
        if (result.data) {
          ErrorHandler.showSuccess('添加工序成功')
          await this.loadData()
          // Check if sync is needed after process change
          await this.checkAndPromptSync()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '添加工序')
      }
    },
    async handleCompleteProcess(data) {
      try {
        const result = await workOrderAPI.completeProcess(this.workOrderId, data.processId, data.data)
        if (result.data) {
          ErrorHandler.showSuccess('工序完成成功')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '工序完成')
      }
    },
    async handleReassignProcess(process) {
      this.$prompt('请选择新的负责部门', '重新分派工序', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '部门名称'
      }).then(async ({ value }) => {
        try {
          const result = await workOrderAPI.reassignProcess(this.workOrderId, process.id, {
            department: value
          })
          if (result.data) {
            ErrorHandler.showSuccess('重新分派成功')
            await this.loadData()
          }
        } catch (error) {
          ErrorHandler.showMessage(error, '重新分派')
        }
      }).catch(() => {})
    },
    async handleAddMaterial(data) {
      try {
        const result = await workOrderAPI.addMaterial(this.workOrderId, data)
        if (result.data) {
          ErrorHandler.showSuccess('添加物料成功')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '添加物料')
      }
    },
    async handleUpdateMaterialStatus(data) {
      try {
        const result = await workOrderAPI.updateMaterialStatus(
          this.workOrderId,
          data.materialId,
          data.data
        )
        if (result.data) {
          ErrorHandler.showSuccess('物料状态更新成功')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '物料状态更新')
      }
    },
    async handleCompleteTask(data) {
      try {
        const result = await workOrderAPI.completeTask(this.workOrderId, data.taskId, data.data)
        if (result.data) {
          ErrorHandler.showSuccess('任务完成成功')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '任务完成')
      }
    },
    async handleUpdateTask(data) {
      try {
        const result = await workOrderAPI.updateTask(this.workOrderId, data.taskId, data.data)
        if (result.data) {
          ErrorHandler.showSuccess('任务更新成功')
          await this.loadData()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '任务更新')
      }
    },
    handleAssignTask(task) {
      this.$prompt('请选择操作员', '分派任务', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '操作员名称'
      }).then(async ({ value }) => {
        try {
          const result = await workOrderAPI.assignTask(this.workOrderId, task.id, {
            operator: value
          })
          if (result.data) {
            ErrorHandler.showSuccess('任务分派成功')
            await this.loadData()
          }
        } catch (error) {
          ErrorHandler.showMessage(error, '任务分派')
        }
      }).catch(() => {})
    },
    handleSplitTask(task) {
      this.$prompt('请输入拆分数量', '拆分任务', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入拆分后的每个任务的数量',
        inputValidator: (value) => {
          if (!value || value <= 0) {
            return '请输入有效的数量'
          }
          if (value >= task.production_quantity) {
            return '拆分数量必须小于原任务数量'
          }
          return true
        }
      }).then(async ({ value }) => {
        try {
          const result = await workOrderAPI.splitTask(this.workOrderId, task.id, {
            split_quantity: parseInt(value)
          })
          if (result.data) {
            ErrorHandler.showSuccess('任务拆分成功')
            await this.loadData()
          }
        } catch (error) {
          ErrorHandler.showMessage(error, '任务拆分')
        }
      }).catch(() => {})
    },
    async checkAndPromptSync() {
      try {
        // Get current process IDs from the process list
        const currentProcessIds = this.processList.map(p => p.process_id || p.id)

        if (currentProcessIds.length === 0) {
          return
        }

        const result = await workOrderAPI.checkSyncNeeded(this.workOrderId, currentProcessIds)
        if (result.data && result.data.sync_needed) {
          // Prompt user to sync
          ErrorHandler.confirm(
            '检测到工序变化，需要同步任务。查看变更？',
            '任务同步提示',
            {
              confirmButtonText: '查看变更',
              cancelButtonText: '稍后',
              type: 'info'
            }
          ).then(() => {
            this.handleSyncPrompt(currentProcessIds)
          }).catch(() => {
            // User chose to sync later
          })
        }
      } catch (error) {
        // Silently fail - sync check is not critical
        console.warn('Sync check failed:', error)
      }
    },
    handleSyncPrompt(processIds) {
      this.pendingProcessIds = processIds
      this.syncPromptDialog = true
    },
    async handleSyncComplete() {
      this.syncPromptDialog = false
      this.pendingProcessIds = []
      // Reload data to show updated tasks
      await this.loadData()
    }
  }
}
</script>

<style scoped>
.workorder-detail-refactored {
  padding: 20px;
}

.header-actions {
  margin-bottom: 20px;
}

.el-card {
  margin-bottom: 20px;
}

/* 状态标签样式 - 与 Detail.vue 一致 */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

/* 施工单状态颜色 */
.status-pending {
  background-color: #f4f4f5;
  color: #909399;
  border: 1px solid #dcdfe6;
}

.status-in_progress {
  background-color: #ecf5ff;
  color: #409EFF;
  border: 1px solid #b3d8ff;
}

.status-paused {
  background-color: #fdf6ec;
  color: #E6A23C;
  border: 1px solid #faecd8;
}

.status-completed {
  background-color: #f0f9eb;
  color: #67C23A;
  border: 1px solid #c2e7b0;
}

.status-cancelled {
  background-color: #fef0f0;
  color: #F56C6C;
  border: 1px solid #fbc4c4;
}

/* 审核状态颜色 */
.approval-pending {
  background-color: #fdf6ec;
  color: #E6A23C;
  border: 1px solid #faecd8;
}

.approval-submitted {
  background-color: #ecf5ff;
  color: #409EFF;
  border: 1px solid #b3d8ff;
}

.approval-approved {
  background-color: #f0f9eb;
  color: #67C23A;
  border: 1px solid #c2e7b0;
}

.approval-rejected {
  background-color: #fef0f0;
  color: #F56C6C;
  border: 1px solid #fbc4c4;
}

/* 优先级颜色 */
.priority-low {
  background-color: #f0f9eb;
  color: #67C23A;
  border: 1px solid #c2e7b0;
}

.priority-normal {
  background-color: #ecf5ff;
  color: #409EFF;
  border: 1px solid #b3d8ff;
}

.priority-high {
  background-color: #fdf6ec;
  color: #E6A23C;
  border: 1px solid #faecd8;
}

.priority-urgent {
  background-color: #fef0f0;
  color: #F56C6C;
  border: 1px solid #fbc4c4;
}

/* 卡片标题样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

/* 详情区块标题 */
.detail-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
  padding: 0;
}

/* 进度条容器 */
.progress-section {
  margin-top: 10px;
}

/* 表格操作按钮样式 */
.action-buttons .el-button {
  padding: 8px 12px;
  margin: 2px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #dcdfe6;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* 对话框样式优化 */
.el-dialog__header {
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.el-dialog__body {
  padding: 24px;
}

.el-dialog__footer {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 表格斑马纹 */
.el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa;
}

/* 表格悬停效果 */
.el-table__body tr:hover > td {
  background-color: #f5f7fa !important;
}

/* 必填星号样式 */
.required-mark {
  color: #F56C6C;
  margin-right: 4px;
}

/* 表单标签样式 */
.form-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* 时间选择器样式 */
.el-date-editor.el-input,
.el-date-editor.el-input__inner {
  width: 100%;
}

/* 数字输入框样式 */
.el-input-number {
  width: 100%;
}

/* 下拉框样式 */
.el-select {
  width: 100%;
}

/* 开关样式 */
.el-switch.is-checked {
  color: #67C23A;
}

/* 标签页样式 */
.el-tabs__header {
  margin-bottom: 20px;
}

.el-tabs__item {
  font-size: 14px;
  padding: 0 20px;
}

/* 步骤条样式 */
.el-step__title {
  font-size: 13px;
}

.el-step__description {
  font-size: 12px;
}

/* 进度文字颜色 */
.progress-text {
  font-size: 13px;
  color: #606266;
  margin-left: 8px;
}
</style>
