<template>
  <div>
    <!-- 业务员审核操作 -->
    <el-card v-if="canApprove && isPendingApproval" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>业务员审核</span>
      </div>
      <el-form :model="approvalForm" label-width="100px" :rules="approvalRules" ref="approvalFormRef">
        <el-form-item label="审核意见" prop="comment">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见（可选）"
          ></el-input>
        </el-form-item>
        <el-form-item label="拒绝原因" prop="rejection_reason" v-if="showRejectionReason">
          <el-input
            v-model="approvalForm.rejection_reason"
            type="textarea"
            :rows="3"
            placeholder="请填写拒绝原因（必填）"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="handleApprove('approved')" :loading="approving">
            <i class="el-icon-check"></i> 通过审核
          </el-button>
          <el-button type="danger" @click="handleApprove('rejected')" :loading="approving" style="margin-left: 10px;">
            <i class="el-icon-close"></i> 拒绝审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 重新提交审核操作（审核拒绝后） -->
    <el-card v-if="canResubmit && isRejected" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>重新提交审核</span>
      </div>
      <el-form :model="resubmitForm" label-width="100px" ref="resubmitFormRef">
        <el-form-item label="修改说明">
          <el-input
            v-model="resubmitForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请说明修改了什么内容（可选）"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleResubmit" :loading="resubmitting">
            <i class="el-icon-upload2"></i> 重新提交审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 请求重新审核操作（审核通过后） -->
    <el-card v-if="canRequestReapproval && isApproved" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>请求重新审核</span>
      </div>
      <el-alert
        title="注意"
        type="warning"
        description="请求重新审核后，施工单需要重新经过审核流程才能开始生产。"
        :closable="false"
        style="margin-bottom: 15px;"
      ></el-alert>
      <el-form :model="reapprovalForm" label-width="100px" :rules="reapprovalRules" ref="reapprovalFormRef">
        <el-form-item label="请求原因" prop="reason">
          <el-input
            v-model="reapprovalForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请说明为什么需要重新审核"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="warning" @click="handleRequestReapproval" :loading="requestingReapproval">
            <i class="el-icon-refresh"></i> 请求重新审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 审核历史记录 -->
    <el-card v-if="hasApprovalLogs" style="margin-top: 20px;">
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
            <h4>{{ getApprovalStatusText(log.approval_status) }}</h4>
            <p><strong>审核人：</strong>{{ log.approver_name }}</p>
            <p v-if="log.comment"><strong>审核意见：</strong>{{ log.comment }}</p>
            <p v-if="log.rejection_reason"><strong>拒绝原因：</strong>{{ log.rejection_reason }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ApprovalWorkflow',
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
    }
  },
  data() {
    return {
      approvalForm: {
        comment: '',
        rejection_reason: ''
      },
      resubmitForm: {
        reason: ''
      },
      reapprovalForm: {
        reason: ''
      },
      approvalRules: {
        rejection_reason: [
          { required: true, message: '请填写拒绝原因', trigger: 'blur' }
        ]
      },
      reapprovalRules: {
        reason: [
          { required: true, message: '请说明请求原因', trigger: 'blur' }
        ]
      },
      showRejectionReason: false,
      approving: false,
      resubmitting: false,
      requestingReapproval: false
    }
  },
  computed: {
    approvalStatus() {
      return this.workOrder.approval_status
    },
    isPendingApproval() {
      return this.approvalStatus === 'pending'
    },
    isApproved() {
      return this.approvalStatus === 'approved'
    },
    isRejected() {
      return this.approvalStatus === 'rejected'
    },
    hasApprovalLogs() {
      return !!(this.workOrder.approval_logs && Array.isArray(this.workOrder.approval_logs) && this.workOrder.approval_logs.length > 0)
    }
  },
  methods: {
    handleApprove(status) {
      if (status === 'rejected') {
        if (this.showRejectionReason) {
          // 已经显示拒绝原因输入框，提交拒绝
          this.$emit('approve', {
            status,
            comment: this.approvalForm.comment,
            rejection_reason: this.approvalForm.rejection_reason
          })
        } else {
          // 第一次点击拒绝，显示拒绝原因输入框
          this.showRejectionReason = true
        }
      } else {
        this.$emit('approve', {
          status,
          comment: this.approvalForm.comment
        })
      }
    },
    handleResubmit() {
      this.$emit('resubmit', {
        reason: this.resubmitForm.reason
      })
    },
    handleRequestReapproval() {
      this.$refs.reapprovalFormRef.validate((valid) => {
        if (valid) {
          this.$emit('request-reapproval', {
            reason: this.reapprovalForm.reason
          })
        }
      })
    },
    getApprovalStatusText(status) {
      const statusMap = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已拒绝'
      }
      return statusMap[status] || status
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
  },
  watch: {
    'workOrder.approval_status'(newVal) {
      if (newVal === 'pending') {
        this.showRejectionReason = false
      }
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
