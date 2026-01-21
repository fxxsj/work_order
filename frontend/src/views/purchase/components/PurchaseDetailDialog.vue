<template>
  <el-dialog
    title="采购单详情"
    :visible.sync="dialogVisible"
    width="900px"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="采购单号">
        {{ detailData.order_number }}
      </el-descriptions-item>
      <el-descriptions-item label="供应商">
        {{ detailData.supplier_name }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="getStatusType(detailData.status)">
          {{ detailData.status_display }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="总金额">
        <span class="amount">¥{{ Number(detailData.total_amount || 0).toFixed(2) }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="提交人">
        {{ detailData.submitted_by_name || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="提交时间">
        {{ detailData.submitted_at || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="审核人">
        {{ detailData.approved_by_name || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="审核时间">
        {{ detailData.approved_at || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="下单日期">
        {{ detailData.ordered_date || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="预计到货日期">
        {{ detailData.expected_date || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="备注" :span="2">
        {{ detailData.notes || '-' }}
      </el-descriptions-item>
    </el-descriptions>

    <el-divider>采购明细</el-divider>

    <el-table :data="detailData.items || []" border>
      <el-table-column prop="material_name" label="物料" width="200" />
      <el-table-column prop="material_code" label="物料编码" width="120" />
      <el-table-column
        prop="quantity"
        label="采购数量"
        width="120"
        align="right"
      />
      <el-table-column
        prop="received_quantity"
        label="已收货数量"
        width="120"
        align="right"
      />
      <el-table-column
        prop="unit_price"
        label="单价"
        width="120"
        align="right"
      >
        <template slot-scope="scope">
          ¥{{ Number(scope.row.unit_price || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column
        label="小计"
        width="120"
        align="right"
      >
        <template slot-scope="scope">
          ¥{{ (Number(scope.row.quantity || 0) * Number(scope.row.unit_price || 0)).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="status_display" label="收货状态" width="120">
        <template slot-scope="scope">
          <el-tag :type="getItemStatusType(scope.row.status)">
            {{ scope.row.status_display || '待收货' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="notes"
        label="备注"
        min-width="150"
        show-overflow-tooltip
      />
    </el-table>

    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">关闭</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { purchaseOrderAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'PurchaseDetailDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    purchaseId: {
      type: [Number, String],
      default: null
    }
  },

  data() {
    return {
      loading: false,
      detailData: {}
    }
  },

  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },

  watch: {
    visible(val) {
      if (val && this.purchaseId) {
        this.fetchDetail()
      }
    }
  },

  methods: {
    /**
     * 获取采购单详情
     */
    async fetchDetail() {
      if (!this.purchaseId) return

      this.loading = true
      try {
        const response = await purchaseOrderAPI.getDetail(this.purchaseId)
        this.detailData = response
      } catch (error) {
        ErrorHandler.showMessage(error, '获取采购单详情')
      } finally {
        this.loading = false
      }
    },

    /**
     * 设置详情数据（用于直接传入数据的场景）
     */
    setDetailData(data) {
      this.detailData = { ...data, items: data.items || [] }
    },

    /**
     * 获取状态类型
     */
    getStatusType(status) {
      const map = {
        draft: 'info',
        submitted: 'warning',
        approved: 'success',
        ordered: 'primary',
        received: 'success',
        cancelled: 'danger'
      }
      return map[status] || 'info'
    },

    /**
     * 获取明细状态类型
     */
    getItemStatusType(status) {
      const map = {
        pending: 'info',
        partial: 'warning',
        received: 'success'
      }
      return map[status] || 'info'
    }
  }
}
</script>

<style scoped>
.amount {
  font-weight: bold;
  color: #409EFF;
}
</style>
