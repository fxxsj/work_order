<template>
  <el-dialog
    title="质检确认"
    :visible.sync="dialogVisible"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading">
      <!-- 收货记录列表 -->
      <el-table
        :data="records"
        border
        stripe
        size="small"
      >
        <el-table-column prop="material_name" label="物料名称" min-width="150" />
        <el-table-column prop="material_code" label="物料编码" width="120" />
        <el-table-column label="收货数量" width="100" align="right">
          <template slot-scope="scope">
            {{ scope.row.received_quantity }}
          </template>
        </el-table-column>
        <el-table-column label="收货日期" width="110">
          <template slot-scope="scope">
            {{ scope.row.received_date }}
          </template>
        </el-table-column>
        <el-table-column label="质检状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getInspectionStatusType(scope.row.inspection_status)" size="small">
              {{ scope.row.inspection_status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.inspection_status === 'pending'"
              type="text"
              size="small"
              @click="showInspectionForm(scope.row)"
            >
              质检
            </el-button>
            <el-button
              v-if="canStockIn(scope.row)"
              type="text"
              size="small"
              @click="handleStockIn(scope.row)"
            >
              入库
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 质检表单对话框 -->
      <el-dialog
        title="填写质检结果"
        :visible.sync="inspectionFormVisible"
        width="500px"
        append-to-body
        :close-on-click-modal="false"
      >
        <el-form
          ref="inspectionForm"
          :model="inspectionForm"
          :rules="inspectionRules"
          label-width="100px"
        >
          <el-form-item label="收货数量">
            <span class="form-value">{{ currentRecord.received_quantity }}</span>
          </el-form-item>
          <el-form-item label="合格数量" prop="qualified_quantity">
            <el-input-number
              v-model="inspectionForm.qualified_quantity"
              :min="0"
              :max="parseFloat(currentRecord.received_quantity) || 0"
              :precision="2"
              style="width: 200px"
              @change="handleQualifiedChange"
            />
          </el-form-item>
          <el-form-item label="不合格数量" prop="unqualified_quantity">
            <el-input-number
              v-model="inspectionForm.unqualified_quantity"
              :min="0"
              :max="parseFloat(currentRecord.received_quantity) || 0"
              :precision="2"
              style="width: 200px"
              @change="handleUnqualifiedChange"
            />
          </el-form-item>
          <el-form-item
            v-if="inspectionForm.unqualified_quantity > 0"
            label="不合格原因"
            prop="unqualified_reason"
          >
            <el-input
              v-model="inspectionForm.unqualified_reason"
              type="textarea"
              :rows="3"
              placeholder="请填写不合格原因"
            />
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button @click="inspectionFormVisible = false">
            取消
          </el-button>
          <el-button type="primary" :loading="submitting" @click="submitInspection">
            确认
          </el-button>
        </div>
      </el-dialog>
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">
        关闭
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { purchaseOrderAPI, purchaseReceiveRecordAPI } from '@/api/modules/purchase'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'InspectionDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    purchaseOrderId: {
      type: [Number, String],
      default: null
    }
  },

  data() {
    return {
      loading: false,
      submitting: false,
      records: [],
      inspectionFormVisible: false,
      currentRecord: {},
      inspectionForm: {
        qualified_quantity: 0,
        unqualified_quantity: 0,
        unqualified_reason: ''
      },
      inspectionRules: {
        qualified_quantity: [
          { required: true, message: '请输入合格数量', trigger: 'blur' }
        ],
        unqualified_reason: [
          { required: true, message: '请填写不合格原因', trigger: 'blur' }
        ]
      }
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
      if (val && this.purchaseOrderId) {
        this.loadRecords()
      }
    }
  },

  methods: {
    async loadRecords() {
      this.loading = true
      try {
        const res = await purchaseOrderAPI.getReceiveRecords(this.purchaseOrderId)
        this.records = res.data || res || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载收货记录')
      } finally {
        this.loading = false
      }
    },

    showInspectionForm(record) {
      this.currentRecord = record
      const qty = parseFloat(record.received_quantity) || 0
      this.inspectionForm = {
        qualified_quantity: qty,
        unqualified_quantity: 0,
        unqualified_reason: ''
      }
      this.inspectionFormVisible = true
    },

    handleQualifiedChange(val) {
      const total = parseFloat(this.currentRecord.received_quantity) || 0
      this.inspectionForm.unqualified_quantity = Math.max(0, total - val)
    },

    handleUnqualifiedChange(val) {
      const total = parseFloat(this.currentRecord.received_quantity) || 0
      this.inspectionForm.qualified_quantity = Math.max(0, total - val)
    },

    async submitInspection() {
      try {
        await this.$refs.inspectionForm.validate()
      } catch {
        return
      }

      // 验证数量总和
      const total = parseFloat(this.currentRecord.received_quantity) || 0
      const sum = this.inspectionForm.qualified_quantity + this.inspectionForm.unqualified_quantity
      if (Math.abs(sum - total) > 0.01) {
        this.$message.error(`合格数量 + 不合格数量 必须等于收货数量 (${total})`)
        return
      }

      this.submitting = true
      try {
        await purchaseReceiveRecordAPI.confirmInspection(this.currentRecord.id, this.inspectionForm)
        ErrorHandler.showSuccess('质检确认成功')
        this.inspectionFormVisible = false
        await this.loadRecords()
        this.$emit('updated')
      } catch (error) {
        ErrorHandler.showMessage(error, '质检确认')
      } finally {
        this.submitting = false
      }
    },

    canStockIn(record) {
      return (
        ['qualified', 'partial_qualified'].includes(record.inspection_status) &&
        !record.is_stocked &&
        parseFloat(record.qualified_quantity) > 0
      )
    },

    async handleStockIn(record) {
      try {
        await ErrorHandler.confirm(`确定要将 ${record.qualified_quantity} 件物料入库吗？`)
        await purchaseReceiveRecordAPI.stockIn(record.id)
        ErrorHandler.showSuccess('入库成功')
        await this.loadRecords()
        this.$emit('updated')
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '入库')
        }
      }
    },

    handleClose() {
      this.dialogVisible = false
      this.records = []
    },

    getInspectionStatusType(status) {
      const map = {
        pending: 'warning',
        qualified: 'success',
        unqualified: 'danger',
        partial_qualified: 'warning'
      }
      return map[status] || 'info'
    }
  }
}
</script>

<style scoped>
.form-value {
  font-weight: bold;
  color: #409eff;
}
</style>
