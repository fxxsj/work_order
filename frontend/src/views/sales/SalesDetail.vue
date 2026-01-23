<template>
  <div class="sales-order-detail">
    <div v-if="loading">
      <el-skeleton :rows="10" animated />
    </div>
    <div v-else>
      <!-- 订单基本信息 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">订单信息</span>
          <div class="actions">
            <el-tag :type="getStatusType(detailData.status)" size="medium">
              {{ detailData.status_display }}
            </el-tag>
            <el-tag :type="getPaymentStatusType(detailData.payment_status)" size="medium">
              {{ detailData.payment_status_display }}
            </el-tag>
          </div>
        </div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="订单号">
            {{ detailData.order_number }}
          </el-descriptions-item>
          <el-descriptions-item label="客户">
            {{ detailData.customer_name }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detailData.status)">
              {{ detailData.status_display }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单日期">
            {{ formatDate(detailData.order_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="预计交货日期">
            {{ formatDate(detailData.delivery_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="实际交货日期">
            {{ formatDate(detailData.actual_delivery_date) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系人">
            {{ detailData.contact_person || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ detailData.contact_phone || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="送货地址" :span="3">
            {{ detailData.shipping_address || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 金额信息 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">金额信息</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">
                小计
              </div>
              <div class="value">
                ¥{{ formatAmount(detailData.subtotal) }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">
                税额 ({{ detailData.tax_rate }}%)
              </div>
              <div class="value">
                ¥{{ formatAmount(detailData.tax_amount) }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">
                折扣金额
              </div>
              <div class="value discount">
                -¥{{ formatAmount(detailData.discount_amount) }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">
                订单总金额
              </div>
              <div class="value total">
                ¥{{ formatAmount(detailData.total_amount) }}
              </div>
            </div>
          </el-col>
        </el-row>
        <el-divider />
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">
                定金
              </div>
              <div class="value">
                ¥{{ formatAmount(detailData.deposit_amount) }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">
                已付金额
              </div>
              <div class="value">
                ¥{{ formatAmount(detailData.paid_amount) }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">
                付款日期
              </div>
              <div class="value">
                {{ formatDate(detailData.payment_date) || '-' }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">
                待付金额
              </div>
              <div class="value pending">
                ¥{{ formatAmount(parseFloat(detailData.total_amount || 0) - parseFloat(detailData.paid_amount || 0)) }}
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 订单明细 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">订单明细 ({{ detailData.items ? detailData.items.length : 0 }})</span>
        </div>
        <el-table :data="detailData.items" border>
          <el-table-column prop="product_code" label="产品编码" width="120" />
          <el-table-column prop="product_name" label="产品名称" min-width="150" />
          <el-table-column
            prop="quantity"
            label="数量"
            width="100"
            align="right"
          />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column
            prop="unit_price"
            label="单价"
            width="120"
            align="right"
          >
            <template slot-scope="scope">
              ¥{{ formatAmount(scope.row.unit_price) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="tax_rate"
            label="税率(%)"
            width="100"
            align="right"
          />
          <el-table-column
            prop="discount_amount"
            label="折扣金额"
            width="120"
            align="right"
          >
            <template slot-scope="scope">
              ¥{{ formatAmount(scope.row.discount_amount) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="subtotal"
            label="小计"
            width="120"
            align="right"
          >
            <template slot-scope="scope">
              ¥{{ formatAmount(scope.row.subtotal) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="notes"
            label="备注"
            min-width="150"
            show-overflow-tooltip
          />
        </el-table>
      </el-card>

      <!-- 审核信息 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">审核信息</span>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="提交人">
            {{ detailData.submitted_by_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(detailData.submitted_at) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="审核人">
            {{ detailData.approved_by_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="审核时间">
            {{ formatDateTime(detailData.approved_at) || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="审核意见" :span="2">
            {{ detailData.approval_comment || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="拒绝原因" :span="2">
            <el-tag v-if="detailData.rejection_reason" type="danger">
              {{ detailData.rejection_reason }}
            </el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 关联施工单 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">关联施工单 ({{ (detailData.work_order_numbers || []).length }})</span>
        </div>
        <el-table v-if="detailData.work_order_numbers && detailData.work_order_numbers.length > 0" :data="detailData.work_order_numbers.map(n => ({ order_number: n }))" border>
          <el-table-column prop="order_number" label="施工单号" width="150" />
          <el-table-column label="操作" width="150">
            <template slot-scope="scope">
              <el-button size="mini" type="primary" @click="viewWorkOrder(scope.row.order_number)">
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无关联施工单" />
      </el-card>

      <!-- 备注信息 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">备注信息</span>
        </div>
        <div class="notes-content">
          {{ detailData.notes || '暂无备注' }}
        </div>
      </el-card>

      <!-- 系统信息 -->
      <el-card>
        <div slot="header" class="card-header">
          <span class="title">系统信息</span>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="创建人">
            {{ detailData.created_by || detailData.submitted_by_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(detailData.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(detailData.updated_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="handleClose">
          关闭
        </el-button>
        <el-button v-if="canEdit" type="primary" @click="handleEdit">
          编辑
        </el-button>
        <el-button v-if="canSubmit" type="warning" @click="handleSubmit">
          提交审核
        </el-button>
        <el-button v-if="canApprove" type="success" @click="handleApprove">
          审核通过
        </el-button>
        <el-button v-if="canApprove" type="danger" @click="handleReject">
          拒绝
        </el-button>
        <el-button v-if="canStartProduction" type="primary" @click="handleStartProduction">
          开始生产
        </el-button>
        <el-button v-if="canComplete" type="success" @click="handleComplete">
          完成订单
        </el-button>
        <el-button v-if="canCancel" type="danger" @click="handleCancel">
          取消订单
        </el-button>
        <el-button @click="handleRefresh">
          刷新
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { salesOrderAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'SalesOrderDetail',
  props: {
    orderId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      detailData: {}
    }
  },
  computed: {
    canEdit() {
      return this.detailData.status === 'draft'
    },
    canSubmit() {
      return this.detailData.status === 'draft'
    },
    canApprove() {
      return this.detailData.status === 'submitted'
    },
    canStartProduction() {
      return this.detailData.status === 'approved'
    },
    canComplete() {
      return ['approved', 'in_production'].includes(this.detailData.status)
    },
    canCancel() {
      return !['completed', 'cancelled'].includes(this.detailData.status)
    }
  },
  watch: {
    orderId: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.fetchData()
        }
      }
    }
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const response = await salesOrderAPI.getDetail(this.orderId)
        this.detailData = response
      } catch (error) {
        ErrorHandler.showMessage(error, '获取订单详情失败')
      } finally {
        this.loading = false
      }
    },
    handleClose() {
      this.$emit('close')
    },
    handleEdit() {
      this.$emit('edit', this.orderId)
    },
    async handleSubmit() {
      try {
        const confirmed = await ErrorHandler.confirm('确定要提交该销售订单吗？', '提交确认')
        if (!confirmed) return

        await salesOrderAPI.submit(this.orderId)
        ErrorHandler.showSuccess('提交成功')
        this.$emit('refresh')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '提交失败')
        }
      }
    },
    async handleApprove() {
      this.$prompt('请输入审核意见', '审核通过', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '请输入审核意见'
      }).then(async ({ value }) => {
        try {
          await salesOrderAPI.approve(this.orderId, { approval_comment: value })
          ErrorHandler.showSuccess('审核通过')
          this.$emit('refresh')
          this.fetchData()
        } catch (error) {
          ErrorHandler.showMessage(error, '审核失败')
        }
      }).catch(() => {})
    },
    async handleReject() {
      this.$prompt('请输入拒绝原因', '拒绝订单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '请输入拒绝原因'
      }).then(async ({ value }) => {
        try {
          await salesOrderAPI.reject(this.orderId, { reason: value })
          ErrorHandler.showSuccess('已拒绝该订单')
          this.$emit('refresh')
          this.fetchData()
        } catch (error) {
          ErrorHandler.showMessage(error, '操作失败')
        }
      }).catch(() => {})
    },
    async handleStartProduction() {
      try {
        const confirmed = await ErrorHandler.confirm('确定要开始生产吗？', '开始生产')
        if (!confirmed) return

        await salesOrderAPI.startProduction(this.orderId)
        ErrorHandler.showSuccess('已开始生产')
        this.$emit('refresh')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '操作失败')
        }
      }
    },
    async handleComplete() {
      try {
        const confirmed = await ErrorHandler.confirm('确定要完成该订单吗？', '完成订单')
        if (!confirmed) return

        await salesOrderAPI.complete(this.orderId)
        ErrorHandler.showSuccess('订单已完成')
        this.$emit('refresh')
        this.fetchData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '操作失败')
        }
      }
    },
    async handleCancel() {
      this.$prompt('请输入取消原因', '取消订单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '请输入取消原因'
      }).then(async ({ value }) => {
        try {
          await salesOrderAPI.cancel(this.orderId, { reason: value })
          ErrorHandler.showSuccess('订单已取消')
          this.$emit('refresh')
          this.fetchData()
        } catch (error) {
          ErrorHandler.showMessage(error, '取消失败')
        }
      }).catch(() => {})
    },
    handleRefresh() {
      this.fetchData()
    },
    viewWorkOrder(orderNumber) {
      this.$router.push(`/workorders?search=${orderNumber}`)
    },
    getStatusType(status) {
      const typeMap = {
        draft: 'info',
        submitted: 'warning',
        approved: 'primary',
        in_production: 'success',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'info'
    },
    getPaymentStatusType(status) {
      const typeMap = {
        unpaid: 'danger',
        partial: 'warning',
        paid: 'success'
      }
      return typeMap[status] || 'info'
    },
    formatAmount(value) {
      if (!value) return '0.00'
      const num = parseFloat(value)
      return isNaN(num) ? '0.00' : num.toFixed(2)
    },
    formatDate(dateStr) {
      if (!dateStr) return ''
      // 处理日期格式
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toISOString().split('T')[0]
    },
    formatDateTime(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.sales-order-detail {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header .title {
  font-size: 16px;
  font-weight: bold;
}

.card-header .actions {
  display: flex;
  gap: 10px;
}

.amount-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.amount-item .label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.amount-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.amount-item .value.discount {
  color: #f56c6c;
}

.amount-item .value.total {
  color: #409eff;
  font-size: 20px;
}

.amount-item .value.pending {
  color: #e6a23c;
}

.notes-content {
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  min-height: 80px;
  line-height: 1.6;
}

.action-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}

.action-buttons .el-button {
  margin: 0 10px;
}
</style>
