<template>
  <el-descriptions title="基本信息" :column="3" border>
    <el-descriptions-item label="施工单号">
      {{ workOrder.order_number }}
    </el-descriptions-item>
    <el-descriptions-item label="客户">
      {{ workOrder.customer_name }}
    </el-descriptions-item>
    <el-descriptions-item label="业务员">
      {{ salespersonName }}
    </el-descriptions-item>
    <el-descriptions-item label="制表人">
      {{ workOrder.manager_name || '-' }}
    </el-descriptions-item>
    <el-descriptions-item v-if="workOrder.product_name" label="产品名称">
      {{ workOrder.product_name }}
    </el-descriptions-item>
    <el-descriptions-item v-if="displayQuantity" label="生产数量">
      {{ displayQuantity }} 车
    </el-descriptions-item>
    <el-descriptions-item label="总金额">
      ¥{{ workOrder.total_amount }}
    </el-descriptions-item>
    <el-descriptions-item label="状态">
      <el-tag :type="statusType" size="small">
        {{ statusText }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="审核状态">
      <el-tag :type="approvalStatusType" size="small">
        {{ approvalStatusText }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="优先级">
      <el-tag :type="priorityType" size="small">
        {{ priorityText }}
      </el-tag>
    </el-descriptions-item>
    <el-descriptions-item label="进度">
      <el-progress
        :percentage="progress"
        :color="progressColor"
      />
    </el-descriptions-item>
    <el-descriptions-item label="下单日期">
      {{ formatDate(workOrder.order_date) }}
    </el-descriptions-item>
    <el-descriptions-item label="交货日期">
      {{ formatDate(workOrder.delivery_date) }}
    </el-descriptions-item>
    <el-descriptions-item label="实际交货日期">
      {{ formatDate(workOrder.actual_delivery_date) }}
    </el-descriptions-item>
    <el-descriptions-item v-if="workOrder.approved_by_name" label="审核人">
      {{ workOrder.approved_by_name }}
    </el-descriptions-item>
    <el-descriptions-item v-if="workOrder.approved_at" label="审核时间">
      {{ formatDateTime(workOrder.approved_at) }}
    </el-descriptions-item>
    <el-descriptions-item v-if="workOrder.approval_comment" label="审核意见" :span="3">
      {{ workOrder.approval_comment }}
    </el-descriptions-item>
    <el-descriptions-item v-if="workOrder.specification" label="产品规格" :span="3">
      {{ workOrder.specification }}
    </el-descriptions-item>
  </el-descriptions>
</template>

<script>
import { workOrderService } from '@/services'

export default {
  name: 'WorkOrderBasicInfo',
  props: {
    workOrder: {
      type: Object,
      required: true
    }
  },
  computed: {
    salespersonName() {
      return this.workOrder.customer_detail?.salesperson_name || '-'
    },
    displayQuantity() {
      const production = this.workOrder.production_quantity || 0
      const defective = this.workOrder.defective_quantity || 0
      if (production === 0 && defective === 0) return null
      return production + defective
    },
    statusText() {
      return workOrderService.getStatusText(this.workOrder.status)
    },
    statusType() {
      const statusMap = {
        pending: 'info',
        in_progress: '',
        paused: 'warning',
        completed: 'success',
        cancelled: 'danger'
      }
      return statusMap[this.workOrder.status] || ''
    },
    approvalStatusText() {
      return workOrderService.getApprovalStatusText(this.workOrder.approval_status)
    },
    approvalStatusType() {
      const statusMap = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger'
      }
      return statusMap[this.workOrder.approval_status] || 'info'
    },
    priorityText() {
      return workOrderService.getPriorityText(this.workOrder.priority)
    },
    priorityType() {
      return workOrderService.getPriorityType(this.workOrder.priority)
    },
    progress() {
      const calculatedProgress = workOrderService.calculateProgress(this.workOrder)
      return Math.max(0, Math.min(100, calculatedProgress))
    },
    progressColor() {
      return this.progress === 100 ? '#67C23A' : '#409EFF'
    }
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}/${month}/${day}`
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
    }
  }
}
</script>

<style scoped>
.el-descriptions {
  margin-top: 20px;
}
</style>
