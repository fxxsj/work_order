<template>
  <el-dialog
    title="采购收货"
    :visible.sync="dialogVisible"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading">
      <!-- 采购单信息 -->
      <el-descriptions
        :column="3"
        border
        size="small"
        class="mb-4"
      >
        <el-descriptions-item label="采购单号">
          {{ purchaseOrder.order_number }}
        </el-descriptions-item>
        <el-descriptions-item label="供应商">
          {{ purchaseOrder.supplier_name }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(purchaseOrder.status)">
            {{ purchaseOrder.status_display }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 收货日期和送货单号 -->
      <el-form :model="form" label-width="100px" class="mb-4">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="收货日期" prop="received_date">
              <el-date-picker
                v-model="form.received_date"
                type="date"
                placeholder="选择日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="送货单号">
              <el-input
                v-model="form.delivery_note_number"
                placeholder="输入送货单号"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 收货明细表格 -->
      <el-table
        :data="receiveItems"
        border
        stripe
        size="small"
      >
        <el-table-column prop="material_name" label="物料名称" min-width="150" />
        <el-table-column prop="material_code" label="物料编码" width="120" />
        <el-table-column label="采购数量" width="100" align="right">
          <template slot-scope="scope">
            {{ scope.row.quantity }}
          </template>
        </el-table-column>
        <el-table-column label="已收货" width="100" align="right">
          <template slot-scope="scope">
            {{ scope.row.received_quantity || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="剩余数量" width="100" align="right">
          <template slot-scope="scope">
            <span :class="{ 'text-warning': scope.row.remaining > 0 }">
              {{ scope.row.remaining }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="本次收货" width="150">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.receive_quantity"
              :min="0"
              :max="scope.row.remaining"
              :precision="2"
              :step="1"
              size="small"
              :disabled="scope.row.remaining <= 0"
              style="width: 120px"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="120">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.notes"
              placeholder="备注"
              size="small"
              :disabled="scope.row.remaining <= 0"
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 收货汇总 -->
      <div class="receive-summary mt-4">
        <el-alert
          :title="summaryText"
          :type="hasReceiveItems ? 'success' : 'info'"
          :closable="false"
          show-icon
        />
      </div>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!hasReceiveItems"
        @click="handleSubmit"
      >
        确认收货
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { purchaseOrderAPI } from '@/api/modules/purchase'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'ReceiveDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    purchaseOrder: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      loading: false,
      submitting: false,
      form: {
        received_date: this.formatDate(new Date()),
        delivery_note_number: ''
      },
      receiveItems: []
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
    },

    hasReceiveItems() {
      return this.receiveItems.some(item => item.receive_quantity > 0)
    },

    summaryText() {
      const items = this.receiveItems.filter(item => item.receive_quantity > 0)
      if (items.length === 0) {
        return '请输入本次收货数量'
      }
      const totalQty = items.reduce((sum, item) => sum + (item.receive_quantity || 0), 0)
      return `本次收货 ${items.length} 种物料，共计 ${totalQty} 件`
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initData()
      }
    }
  },

  methods: {
    initData() {
      this.form = {
        received_date: this.formatDate(new Date()),
        delivery_note_number: ''
      }
      this.loadItems()
    },

    async loadItems() {
      if (!this.purchaseOrder.id) return

      this.loading = true
      try {
        // 从采购单详情获取明细
        const res = await purchaseOrderAPI.getDetail(this.purchaseOrder.id)
        const items = res.data?.items || res.items || []

        this.receiveItems = items.map(item => ({
          id: item.id,
          material_id: item.material,
          material_name: item.material_name,
          material_code: item.material_code,
          quantity: parseFloat(item.quantity) || 0,
          received_quantity: parseFloat(item.received_quantity) || 0,
          remaining: Math.max(0, (parseFloat(item.quantity) || 0) - (parseFloat(item.received_quantity) || 0)),
          receive_quantity: 0,
          notes: ''
        }))
      } catch (error) {
        ErrorHandler.showMessage(error, '加载采购单明细')
      } finally {
        this.loading = false
      }
    },

    async handleSubmit() {
      const items = this.receiveItems
        .filter(item => item.receive_quantity > 0)
        .map(item => ({
          item_id: item.id,
          received_quantity: item.receive_quantity,
          delivery_note_number: this.form.delivery_note_number,
          notes: item.notes || ''
        }))

      if (items.length === 0) {
        this.$message.warning('请输入收货数量')
        return
      }

      this.submitting = true
      try {
        await purchaseOrderAPI.receive(this.purchaseOrder.id, {
          items,
          received_date: this.form.received_date
        })
        ErrorHandler.showSuccess('收货成功，请进行质检')
        this.$emit('success')
        this.handleClose()
      } catch (error) {
        ErrorHandler.showMessage(error, '收货')
      } finally {
        this.submitting = false
      }
    },

    handleClose() {
      this.dialogVisible = false
      this.receiveItems = []
    },

    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

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
    }
  }
}
</script>

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.text-warning {
  color: #e6a23c;
  font-weight: bold;
}

.receive-summary {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}
</style>
