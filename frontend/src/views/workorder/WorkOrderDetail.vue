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
    </div>
  </div>
</template>

<script>
import { workOrderAPI, materialAPI, artworkAPI } from '@/api/workorder'
import { processAPI } from '@/api/modules'
import { workOrderService, permissionService } from '@/services'
import WorkOrderBasicInfo from './components/WorkOrderBasicInfo.vue'
import WorkOrderProducts from './components/WorkOrderProducts.vue'
import ArtworkAndDieInfo from './components/ArtworkAndDieInfo.vue'
import ApprovalWorkflow from './components/ApprovalWorkflow.vue'
import MaterialManagement from './components/MaterialManagement.vue'
import ProcessManagement from './components/ProcessManagement.vue'
import WorkOrderPrint from './components/WorkOrderPrint.vue'

export default {
  name: 'WorkOrderDetailRefactored',
  components: {
    WorkOrderBasicInfo,
    WorkOrderProducts,
    ArtworkAndDieInfo,
    ApprovalWorkflow,
    MaterialManagement,
    ProcessManagement,
    WorkOrderPrint
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
      printDialogVisible: false
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
        this.$message.error('加载施工单详情失败：' + (error.message || '未知错误'))
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
        console.error('加载可用数据失败:', error)
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
          this.$message.success('状态更新成功')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('状态更新失败：' + (error.message || '未知错误'))
      }
    },
    async handleApprove(data) {
      try {
        const result = await workOrderAPI.review(this.workOrderId, data)
        if (result.data) {
          this.$message.success(data.status === 'approved' ? '审核通过' : '已拒绝')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('审核操作失败：' + (error.message || '未知错误'))
      }
    },
    async handleResubmit(data) {
      try {
        const result = await workOrderAPI.resubmit(this.workOrderId, data)
        if (result.data) {
          this.$message.success('重新提交成功')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('重新提交失败：' + (error.message || '未知错误'))
      }
    },
    async handleRequestReapproval(data) {
      try {
        const result = await workOrderAPI.requestReapproval(this.workOrderId, data)
        if (result.data) {
          this.$message.success('已请求重新审核')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('请求重新审核失败：' + (error.message || '未知错误'))
      }
    },
    async handleAddProcess(data) {
      try {
        const result = await workOrderAPI.addProcess(this.workOrderId, data)
        if (result.data) {
          this.$message.success('添加工序成功')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('添加工序失败：' + (error.message || '未知错误'))
      }
    },
    async handleCompleteProcess(data) {
      try {
        const result = await workOrderAPI.completeProcess(this.workOrderId, data.processId, data.data)
        if (result.data) {
          this.$message.success('工序完成成功')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('工序完成失败：' + (error.message || '未知错误'))
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
            this.$message.success('重新分派成功')
            await this.loadData()
          }
        } catch (error) {
          this.$message.error('重新分派失败：' + (error.message || '未知错误'))
        }
      }).catch(() => {})
    },
    async handleAddMaterial(data) {
      try {
        const result = await workOrderAPI.addMaterial(this.workOrderId, data)
        if (result.data) {
          this.$message.success('添加物料成功')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('添加物料失败：' + (error.message || '未知错误'))
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
          this.$message.success('物料状态更新成功')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('物料状态更新失败：' + (error.message || '未知错误'))
      }
    },
    async handleCompleteTask(data) {
      try {
        const result = await workOrderAPI.completeTask(this.workOrderId, data.taskId, data.data)
        if (result.data) {
          this.$message.success('任务完成成功')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('任务完成失败：' + (error.message || '未知错误'))
      }
    },
    async handleUpdateTask(data) {
      try {
        const result = await workOrderAPI.updateTask(this.workOrderId, data.taskId, data.data)
        if (result.data) {
          this.$message.success('任务更新成功')
          await this.loadData()
        }
      } catch (error) {
        this.$message.error('任务更新失败：' + (error.message || '未知错误'))
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
            this.$message.success('任务分派成功')
            await this.loadData()
          }
        } catch (error) {
          this.$message.error('任务分派失败：' + (error.message || '未知错误'))
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
            this.$message.success('任务拆分成功')
            await this.loadData()
          }
        } catch (error) {
          this.$message.error('任务拆分失败：' + (error.message || '未知错误'))
        }
      }).catch(() => {})
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
</style>
