<template>
  <div>
    <!-- 业务员审核操作 -->
    <el-card v-if="canApprove && workOrder.approval_status === 'pending'" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>业务员审核</span>
      </div>
      <el-form
        ref="approvalForm"
        :model="approvalForm"
        label-width="100px"
        :rules="approvalRules"
      >
        <el-form-item label="审核意见" prop="comment">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见（可选）"
          />
        </el-form-item>
        <el-form-item v-if="showRejectionReason" label="拒绝原因" prop="rejection_reason">
          <el-input
            v-model="approvalForm.rejection_reason"
            type="textarea"
            :rows="3"
            placeholder="请填写拒绝原因（必填）"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="success" :loading="approving" @click="handleApproveAction('approved')">
            <i class="el-icon-check"></i> 通过审核
          </el-button>
          <el-button
            type="danger"
            :loading="approving"
            style="margin-left: 10px;"
            @click="handleApproveAction('rejected')"
          >
            <i class="el-icon-close"></i> 拒绝审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 重新提交审核操作 -->
    <el-card v-if="canResubmit && workOrder.approval_status === 'rejected'" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>重新提交审核</span>
      </div>
      <el-alert
        type="warning"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <div slot="title">
          <p>该施工单已被拒绝审核。请修改施工单内容后，点击"重新提交审核"按钮。</p>
          <p v-if="workOrder.approval_comment" style="margin-top: 5px;">
            <strong>审核意见：</strong>{{ workOrder.approval_comment }}
          </p>
          <p v-if="workOrder.approval_logs && workOrder.approval_logs.length > 0">
            <strong>拒绝原因：</strong>
            <span v-for="(log, index) in workOrder.approval_logs" :key="index">
              <span v-if="log.approval_status === 'rejected' && log.rejection_reason">
                {{ log.rejection_reason }}
              </span>
            </span>
          </p>
        </div>
      </el-alert>
      <el-form-item>
        <el-button type="primary" :loading="resubmitting" @click="$emit('resubmit')">
          <i class="el-icon-refresh"></i> 重新提交审核
        </el-button>
        <span style="margin-left: 10px; color: #909399; font-size: 12px;">
          提示：修改施工单内容后，审核状态会自动重置为"待审核"
        </span>
      </el-form-item>
    </el-card>

    <!-- 请求重新审核操作 -->
    <el-card v-if="canRequestReapproval && workOrder.approval_status === 'approved'" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>请求重新审核</span>
      </div>
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <div slot="title">
          <p>该施工单已审核通过。如果发现需要修改核心字段（产品、工序、版等），可以请求重新审核。</p>
          <p style="margin-top: 5px; color: #E6A23C;">
            <strong>注意：</strong>请求重新审核后，施工单状态将重置为"待审核"，需要重新审核后才能开始生产。
          </p>
        </div>
      </el-alert>
      <el-form ref="reapprovalForm" :model="reapprovalForm" label-width="120px">
        <el-form-item label="请求原因" prop="reason">
          <el-input
            v-model="reapprovalForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写请求重新审核的原因（可选，但建议填写）"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="warning" :loading="requestingReapproval" @click="handleRequestReapproval">
            <i class="el-icon-refresh-left"></i> 请求重新审核
          </el-button>
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">
            提示：请求重新审核后，原审核人会收到通知
          </span>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 审核历史记录 -->
    <el-card v-if="workOrder.approval_logs && workOrder.approval_logs.length > 0" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>审核历史</span>
      </div>
      <el-timeline>
        <el-timeline-item
          v-for="(log, index) in workOrder.approval_logs"
          :key="index"
          :timestamp="formatDateTime(log.approved_at)"
          placement="top"
        >
          <el-card>
            <h4>
              <span :class="'status-badge approval-' + log.approval_status">
                {{ log.approval_status_display }}
              </span>
              <span style="margin-left: 10px; color: #909399;">审核人：{{ log.approved_by_name || '-' }}</span>
            </h4>
            <p v-if="log.approval_comment" style="margin-top: 10px;">
              <strong>审核意见：</strong>{{ log.approval_comment }}
            </p>
            <p v-if="log.rejection_reason" style="margin-top: 10px; color: #F56C6C;">
              <strong>拒绝原因：</strong>{{ log.rejection_reason }}
            </p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'WorkOrderApproval',
  props: {
    workOrder: {
      type: Object,
      required: true
    },
    canApprove: {
      type: Boolean,
      default: false
    },
    canResubmit: {
      type: Boolean,
      default: false
    },
    canRequestReapproval: {
      type: Boolean,
      default: false
    },
    approving: {
      type: Boolean,
      default: false
    },
    resubmitting: {
      type: Boolean,
      default: false
    },
    requestingReapproval: {
      type: Boolean,
      default: false
    },
    // 表单数据从父组件传入
    approvalForm: {
      type: Object,
      default: () => ({
        comment: '',
        rejection_reason: ''
      })
    },
    reapprovalForm: {
      type: Object,
      default: () => ({
        reason: ''
      })
    },
    approvalRules: {
      type: Object,
      default: () => ({})
    },
    showRejectionReason: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    formatDateTime(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    },
    handleApproveAction(action) {
      this.$emit('approve', action)
    },
    handleRequestReapproval() {
      this.$emit('request-reapproval', this.reapprovalForm.reason)
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
