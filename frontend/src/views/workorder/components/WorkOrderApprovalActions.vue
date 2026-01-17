<template>
  <div>
    <!-- 业务员审核操作 -->
    <el-card v-if="canApprove && workOrder.approval_status === 'pending'" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>业务员审核</span>
      </div>
      <el-form :model="approvalForm" label-width="100px" :rules="approvalRules" ref="approvalForm">
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
          <el-button type="success" @click="$emit('approve', 'approved')" :loading="loading">
            <i class="el-icon-check"></i> 通过审核
          </el-button>
          <el-button type="danger" @click="$emit('approve', 'rejected')" :loading="loading" style="margin-left: 10px;">
            <i class="el-icon-close"></i> 拒绝审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 重新提交审核操作（审核拒绝后） -->
    <el-card v-if="canApprove && workOrder.approval_status === 'rejected'" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>重新提交审核</span>
      </div>
      <el-form :model="resubmitForm" label-width="100px" ref="resubmitForm">
        <el-form-item label="修改说明" prop="comment">
          <el-input
            v-model="resubmitForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入修改说明（必填）"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$emit('resubmit')" :loading="loading">
            <i class="el-icon-refresh"></i> 重新提交审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 请求重新审核操作（审核通过后） -->
    <el-card v-if="canApprove && workOrder.approval_status === 'approved'" style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>请求重新审核</span>
      </div>
      <el-form :model="reapprovalForm" label-width="100px" ref="reapprovalForm">
        <el-form-item label="申请原因" prop="reason">
          <el-input
            v-model="reapprovalForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入申请重新审核的原因（必填）"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="warning" @click="$emit('request-reapproval')" :loading="loading">
            <i class="el-icon-warning"></i> 请求重新审核
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'WorkOrderApprovalActions',
  props: {
    workOrder: {
      type: Object,
      required: true
    },
    canApprove: {
      type: Boolean,
      default: false
    },
    loading: {
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
        comment: ''
      },
      reapprovalForm: {
        reason: ''
      },
      approvalRules: {
        rejection_reason: [
          { required: true, message: '请填写拒绝原因', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    showRejectionReason() {
      return this.approvalForm.action === 'rejected'
    }
  },
  methods: {
    validateApprovalForm() {
      return this.$refs.approvalForm.validate()
    },
    validateResubmitForm() {
      return this.$refs.resubmitForm.validate()
    },
    validateReapprovalForm() {
      return this.$refs.reapprovalForm.validate()
    },
    getApprovalFormData() {
      return {
        comment: this.approvalForm.comment,
        rejection_reason: this.approvalForm.rejection_reason
      }
    },
    getResubmitFormData() {
      return {
        comment: this.resubmitForm.comment
      }
    },
    getReapprovalFormData() {
      return {
        reason: this.reapprovalForm.reason
      }
    },
    resetForms() {
      this.approvalForm = { comment: '', rejection_reason: '' }
      this.resubmitForm = { comment: '' }
      this.reapprovalForm = { reason: '' }
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