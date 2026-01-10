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
          <el-descriptions-item label="订单号">{{ detailData.order_number }}</el-descriptions-item>
          <el-descriptions-item label="客户">{{ detailData.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(detailData.status)">{{ detailData.status_display }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单日期">{{ detailData.order_date }}</el-descriptions-item>
          <el-descriptions-item label="预计交货日期">{{ detailData.delivery_date }}</el-descriptions-item>
          <el-descriptions-item label="实际交货日期">{{ detailData.actual_delivery_date || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detailData.contact_person || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detailData.contact_phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="送货地址" :span="3">{{ detailData.shipping_address || '-' }}</el-descriptions-item>
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
              <div class="label">小计</div>
              <div class="value">¥{{ (detailData.subtotal || 0).toFixed(2) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">税额 ({{ detailData.tax_rate }}%)</div>
              <div class="value">¥{{ (detailData.tax_amount || 0).toFixed(2) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">折扣金额</div>
              <div class="value discount">-¥{{ (detailData.discount_amount || 0).toFixed(2) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">订单总金额</div>
              <div class="value total">¥{{ (detailData.total_amount || 0).toFixed(2) }}</div>
            </div>
          </el-col>
        </el-row>
        <el-divider></el-divider>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">定金</div>
              <div class="value">¥{{ (detailData.deposit_amount || 0).toFixed(2) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">已付金额</div>
              <div class="value">¥{{ (detailData.paid_amount || 0).toFixed(2) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">付款日期</div>
              <div class="value">{{ detailData.payment_date || '-' }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="amount-item">
              <div class="label">待付金额</div>
              <div class="value pending">¥{{ ((detailData.total_amount || 0) - (detailData.paid_amount || 0)).toFixed(2) }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 订单明细 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">订单明细 ({{ detailData.items_count || 0 }})</span>
        </div>
        <el-table :data="detailData.items" border>
          <el-table-column prop="product_code" label="产品编码" width="120" />
          <el-table-column prop="product_name" label="产品名称" min-width="150" />
          <el-table-column prop="quantity" label="数量" width="100" align="right" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="unit_price" label="单价" width="120" align="right">
            <template slot-scope="scope">¥{{ (scope.row.unit_price || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="tax_rate" label="税率(%)" width="100" align="right" />
          <el-table-column prop="discount_amount" label="折扣金额" width="120" align="right">
            <template slot-scope="scope">¥{{ (scope.row.discount_amount || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120" align="right">
            <template slot-scope="scope">¥{{ (scope.row.subtotal || 0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
        </el-table>
      </el-card>

      <!-- 审核信息 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">审核信息</span>
        </div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="提交人">{{ detailData.submitted_by_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ detailData.submitted_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ detailData.approved_by_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ detailData.approved_at || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核意见" :span="2">{{ detailData.approval_comment || '-' }}</el-descriptions-item>
          <el-descriptions-item label="拒绝原因" :span="2">
            <el-tag v-if="detailData.rejection_reason" type="danger">{{ detailData.rejection_reason }}</el-tag>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 关联施工单 -->
      <el-card class="mb-20">
        <div slot="header" class="card-header">
          <span class="title">关联施工单 ({{ (detailData.work_order_numbers || []).length }})</span>
        </div>
        <el-table v-if="detailData.work_order_numbers && detailData.work_order_numbers.length > 0" :data="detailData.work_order_numbers" border>
          <el-table-column prop="order_number" label="施工单号" width="150" />
          <el-table-column label="操作" width="150">
            <template slot-scope="scope">
              <el-button size="mini" type="primary" @click="viewWorkOrder(scope.row)">查看</el-button>
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
          <el-descriptions-item label="创建人">{{ detailData.created_by_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailData.created_at }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detailData.updated_at }}</el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="$emit('close')">关闭</el-button>
        <el-button v-if="canEdit" type="primary" @click="handleEdit">编辑</el-button>
        <el-button v-if="canSubmit" type="warning" @click="handleSubmit">提交</el-button>
        <el-button v-if="canApprove" type="success" @click="handleApprove">审核通过</el-button>
        <el-button v-if="canApprove" type="danger" @click="handleReject">拒绝</el-button>
        <el-button v-if="canStartProduction" type="primary" @click="handleStartProduction">开始生产</el-button>
        <el-button v-if="canComplete" type="success" @click="handleComplete">完成订单</el-button>
        <el-button v-if="canCancel" type="danger" @click="handleCancel">取消订单</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { getSalesOrderDetail } from '@/api/sales'

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
        const response = await getSalesOrderDetail(this.orderId)
        this.detailData = response
      } catch (error) {
        this.$message.error('获取订单详情失败')
      } finally {
        this.loading = false
      }
    },
    handleEdit() {
      this.$router.push(`/sales-orders/${this.orderId}/edit`)
    },
    handleSubmit() {
      this.$router.push(`/sales-orders`)
    },
    handleApprove() {
      this.$router.push(`/sales-orders`)
    },
    handleReject() {
      this.$router.push(`/sales-orders`)
    },
    handleStartProduction() {
      this.$router.push(`/sales-orders`)
    },
    handleComplete() {
      this.$router.push(`/sales-orders`)
    },
    handleCancel() {
      this.$router.push(`/sales-orders`)
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
