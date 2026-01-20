<template>
  <div class="work-order-print">
    <!-- 打印按钮（不显示在打印中） -->
    <div style="text-align: right; margin-bottom: 20px;" class="no-print">
      <el-button type="primary" icon="el-icon-printer" @click="handlePrint">
        打印
      </el-button>
      <el-button icon="el-icon-download" @click="handleExportPDF">
        导出PDF
      </el-button>
    </div>

    <!-- 打印内容 -->
    <div id="print-area" class="print-area">
      <!-- 标题 -->
      <div class="print-header">
        <h1>{{ companyName }}</h1>
        <h2>施工单详情</h2>
        <div class="print-info">
          <span>打印时间：{{ printTime }}</span>
          <span>施工单号：{{ workOrder.order_number }}</span>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="print-section">
        <h3>基本信息</h3>
        <table class="print-table">
          <tr>
            <th>客户名称</th>
            <td>{{ workOrder.customer_name }}</td>
            <th>业务员</th>
            <td>{{ salespersonName }}</td>
          </tr>
          <tr>
            <th>产品名称</th>
            <td>{{ workOrder.product_name || '-' }}</td>
            <th>生产数量</th>
            <td>{{ displayQuantity }} 车</td>
          </tr>
          <tr>
            <th>总金额</th>
            <td>¥{{ workOrder.total_amount }}</td>
            <th>状态</th>
            <td>{{ statusText }}</td>
          </tr>
          <tr>
            <th>下单日期</th>
            <td>{{ formatDate(workOrder.order_date) }}</td>
            <th>交货日期</th>
            <td>{{ formatDate(workOrder.delivery_date) }}</td>
          </tr>
          <tr v-if="workOrder.specification">
            <th>产品规格</th>
            <td colspan="3">
              {{ workOrder.specification }}
            </td>
          </tr>
        </table>
      </div>

      <!-- 产品列表 -->
      <div v-if="hasProducts" class="print-section">
        <h3>产品列表</h3>
        <table class="print-table">
          <thead>
            <tr>
              <th>产品名称</th>
              <th>规格</th>
              <th>拼版</th>
              <th>数量</th>
              <th>单价</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(product, index) in workOrder.products" :key="index">
              <td>{{ product.product_name || product.name }}</td>
              <td>{{ product.specification || '-' }}</td>
              <td>{{ product.imposition_quantity || '-' }}</td>
              <td>{{ product.quantity || 0 }}</td>
              <td>¥{{ product.unit_price || 0 }}</td>
              <td>¥{{ calculateSubtotal(product) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: bold;">
                总计：
              </td>
              <td style="text-align: right; font-weight: bold;">
                ¥{{ totalAmount }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- 工序信息 -->
      <div v-if="hasProcesses" class="print-section">
        <h3>工序信息</h3>
        <table class="print-table">
          <thead>
            <tr>
              <th>顺序</th>
              <th>工序名称</th>
              <th>负责部门</th>
              <th>操作员</th>
              <th>生产数量</th>
              <th>完成数量</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="process in sortedProcesses" :key="process.id">
              <td>{{ process.sequence }}</td>
              <td>{{ process.process_name }}</td>
              <td>{{ process.department_name || '-' }}</td>
              <td>{{ process.operator_name || '-' }}</td>
              <td>{{ process.production_quantity || 0 }}</td>
              <td>{{ process.quantity_completed || 0 }}</td>
              <td>{{ process.status_display }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 物料信息 -->
      <div v-if="hasMaterials" class="print-section">
        <h3>物料信息</h3>
        <table class="print-table">
          <thead>
            <tr>
              <th>物料名称</th>
              <th>尺寸</th>
              <th>用量</th>
              <th>采购状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(material, index) in workOrder.materials" :key="index">
              <td>{{ material.material_name }}</td>
              <td>{{ material.material_size || '-' }}</td>
              <td>{{ material.material_usage || '-' }}</td>
              <td>{{ getPurchaseStatusDisplay(material.purchase_status) }}</td>
              <td>{{ material.notes || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 图稿信息 -->
      <div v-if="hasArtworks" class="print-section">
        <h3>图稿信息</h3>
        <table class="print-table">
          <thead>
            <tr>
              <th>图稿编号</th>
              <th>版本</th>
              <th>确认状态</th>
              <th>确认时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="artwork in workOrder.artworks" :key="artwork.id">
              <td>{{ artwork.artwork_number }}</td>
              <td>{{ artwork.version }}</td>
              <td>{{ artwork.confirmed ? '已确认' : '待确认' }}</td>
              <td>{{ formatDateTime(artwork.confirmed_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 备注 -->
      <div v-if="workOrder.notes" class="print-section">
        <h3>备注</h3>
        <div class="print-notes">
          {{ workOrder.notes }}
        </div>
      </div>

      <!-- 审核信息 -->
      <div v-if="workOrder.approval_status === 'approved'" class="print-section">
        <h3>审核信息</h3>
        <table class="print-table">
          <tr>
            <th>审核人</th>
            <td>{{ workOrder.approved_by_name }}</td>
            <th>审核时间</th>
            <td>{{ formatDateTime(workOrder.approved_at) }}</td>
          </tr>
          <tr v-if="workOrder.approval_comment">
            <th>审核意见</th>
            <td colspan="3">
              {{ workOrder.approval_comment }}
            </td>
          </tr>
        </table>
      </div>

      <!-- 页脚 -->
      <div class="print-footer">
        <p>打印时间：{{ printTime }}</p>
        <p>{{ companyName }} - 施工单管理系统</p>
      </div>
    </div>
  </div>
</template>

<script>
import { workOrderService, exportService } from '@/services'

export default {
  name: 'WorkOrderPrint',
  props: {
    workOrder: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      companyName: '肇庆市高要区新西彩包装有限公司',
      printTime: new Date().toLocaleString('zh-CN')
    }
  },
  computed: {
    salespersonName() {
      return this.workOrder.customer_detail?.salesperson_name || '-'
    },
    displayQuantity() {
      const production = this.workOrder.production_quantity || 0
      const defective = this.workOrder.defective_quantity || 0
      if (production === 0 && defective === 0) return '-'
      return production + defective
    },
    statusText() {
      return workOrderService.getStatusText(this.workOrder.status)
    },
    hasProducts() {
      return this.workOrder.products && this.workOrder.products.length > 0
    },
    hasProcesses() {
      return this.workOrder.processes && this.workOrder.processes.length > 0
    },
    hasMaterials() {
      return this.workOrder.materials && this.workOrder.materials.length > 0
    },
    hasArtworks() {
      return this.workOrder.artworks && this.workOrder.artworks.length > 0
    },
    sortedProcesses() {
      if (!this.workOrder.processes) return []
      return [...this.workOrder.processes].sort((a, b) => a.sequence - b.sequence)
    },
    totalAmount() {
      if (!this.hasProducts) return this.workOrder.total_amount || 0
      return this.workOrder.products.reduce((sum, product) => sum + this.calculateSubtotal(product), 0).toFixed(2)
    }
  },
  mounted() {
    this.printTime = new Date().toLocaleString('zh-CN')
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN')
    },
    formatDateTime(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN')
    },
    calculateSubtotal(product) {
      const quantity = product.quantity || 0
      const unitPrice = product.unit_price || 0
      return (quantity * unitPrice).toFixed(2)
    },
    getPurchaseStatusDisplay(status) {
      const displayMap = {
        not_purchased: '未采购',
        purchasing: '采购中',
        purchased: '已采购'
      }
      return displayMap[status] || status
    },
    handlePrint() {
      const printData = exportService.preparePrintData(
        this.workOrder,
        {
          title: `${this.companyName} - 施工单详情`,
          columns: []
        }
      )
      exportService.print(printData)
    },
    handleExportPDF() {
      this.$message.info('导出PDF功能开发中...')
    }
  }
}
</script>

<style scoped>
.work-order-print {
  padding: 20px;
}

.print-area {
  background: white;
  padding: 40px;
}

.print-header {
  text-align: center;
  margin-bottom: 30px;
  border-bottom: 2px solid #333;
  padding-bottom: 20px;
}

.print-header h1 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #333;
}

.print-header h2 {
  font-size: 18px;
  margin-bottom: 15px;
  color: #666;
}

.print-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
}

.print-section {
  margin-bottom: 30px;
}

.print-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #333;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.print-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.print-table th,
.print-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.print-table th {
  background-color: #f5f7fa;
  font-weight: bold;
  color: #333;
  width: 15%;
}

.print-table td {
  color: #666;
}

.print-table thead th {
  background-color: #f5f7fa;
  font-weight: bold;
  color: #333;
  text-align: center;
}

.print-table tbody td {
  text-align: center;
}

.print-table tfoot td {
  font-weight: bold;
  color: #333;
}

.print-notes {
  padding: 10px;
  background-color: #f5f7fa;
  border: 1px solid #ddd;
  min-height: 60px;
  color: #666;
  white-space: pre-wrap;
}

.print-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.print-footer p {
  margin: 5px 0;
}

/* 打印样式 */
@media print {
  .no-print {
    display: none !important;
  }

  .print-area {
    padding: 20px;
  }

  .print-table th,
  .print-table td {
    border-color: #000 !important;
  }

  .print-section h3 {
    border-left-color: #000 !important;
  }
}
</style>
