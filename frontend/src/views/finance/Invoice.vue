<template>
  <div class="invoice-container">
    <!-- 页面头部 -->
    <div class="header">
      <h2>发票管理</h2>
      <div class="actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
          新建发票
        </el-button>
        <el-button icon="el-icon-refresh" @click="fetchInvoiceList">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <stats-cards :items="statsItems" />

    <!-- 搜索和过滤 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="发票状态">
          <el-select
            v-model="filters.status"
            placeholder="全部"
            clearable
            @change="handleSearch"
          >
            <el-option label="待开具" value="draft" />
            <el-option label="已开具" value="issued" />
            <el-option label="已发送" value="sent" />
            <el-option label="已收到" value="received" />
            <el-option label="已作废" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户">
          <el-select
            v-model="filters.customer"
            placeholder="全部客户"
            clearable
            filterable
          >
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="invoiceList"
        border
        style="width: 100%"
      >
        <el-table-column prop="invoice_number" label="发票号码" width="150" />
        <el-table-column prop="invoice_type_display" label="发票类型" width="120" />
        <el-table-column prop="customer_name" label="客户名称" width="150" />
        <el-table-column
          prop="amount"
          label="金额(不含税)"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.amount ? scope.row.amount.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="tax_amount"
          label="税额"
          width="100"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.tax_amount ? scope.row.tax_amount.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="total_amount"
          label="价税合计"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.total_amount ? scope.row.total_amount.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="invoice_date" label="开票日期" width="120" />
        <el-table-column prop="status_display" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'draft'"
              size="small"
              type="primary"
              @click="handleSubmit(scope.row)"
            >
              提交
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 发票详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      title="发票详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="currentInvoice" :column="2" border>
        <el-descriptions-item label="发票号码">
          {{ currentInvoice.invoice_number }}
        </el-descriptions-item>
        <el-descriptions-item label="发票类型">
          {{ currentInvoice.invoice_type_display }}
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">
          {{ currentInvoice.customer_name }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ currentInvoice.status_display }}
        </el-descriptions-item>
        <el-descriptions-item label="金额(不含税)">
          ¥{{ currentInvoice.amount ? currentInvoice.amount.toLocaleString() : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="税率">
          {{ currentInvoice.tax_rate }}%
        </el-descriptions-item>
        <el-descriptions-item label="税额">
          ¥{{ currentInvoice.tax_amount ? currentInvoice.tax_amount.toLocaleString() : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="价税合计">
          ¥{{ currentInvoice.total_amount ? currentInvoice.total_amount.toLocaleString() : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="开票日期">
          {{ currentInvoice.invoice_date || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="到期日期">
          {{ currentInvoice.due_date || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联单号" :span="2">
          {{ currentInvoice.related_order_number || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentInvoice.notes || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑发票对话框 -->
    <el-dialog
      :visible.sync="formDialogVisible"
      :title="formMode === 'create' ? '新建发票' : '编辑发票'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="invoiceFormRef"
        :model="invoiceForm"
        :rules="invoiceRules"
        label-width="120px"
      >
        <el-form-item label="客户" prop="customer">
          <el-select
            v-model="invoiceForm.customer"
            placeholder="请选择客户"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="发票类型" prop="invoice_type">
          <el-select v-model="invoiceForm.invoice_type" placeholder="请选择发票类型" style="width: 100%;">
            <el-option label="增值税专用发票" value="vat_special" />
            <el-option label="增值税普通发票" value="vat_common" />
            <el-option label="电子发票" value="electronic" />
          </el-select>
        </el-form-item>
        <el-form-item label="开票日期" prop="invoice_date">
          <el-date-picker
            v-model="invoiceForm.invoice_date"
            type="date"
            placeholder="请选择日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="金额(不含税)" prop="amount">
          <el-input-number
            v-model="invoiceForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="税率" prop="tax_rate">
          <el-input-number
            v-model="invoiceForm.tax_rate"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="关联单号">
          <el-input v-model="invoiceForm.related_order_number" placeholder="请输入关联单号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="invoiceForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { invoiceAPI } from '@/api/modules'
import StatsCards from '@/components/common/StatsCards.vue'

export default {
  name: 'InvoiceList',
  components: { StatsCards },
  data() {
    return {
      loading: false,
      invoiceList: [],
      customerList: [],
      currentInvoice: null,
      detailDialogVisible: false,
      formDialogVisible: false,
      formMode: 'create',
      stats: {},
      filters: {
        status: '',
        customer: ''
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      invoiceForm: {
        customer: null,
        invoice_type: 'vat_special',
        invoice_date: null,
        amount: null,
        tax_rate: 13,
        related_order_number: '',
        notes: ''
      },
      invoiceRules: {
        customer: [{ required: true, message: '请选择客户', trigger: 'change' }],
        invoice_type: [{ required: true, message: '请选择发票类型', trigger: 'change' }],
        invoice_date: [{ required: true, message: '请选择开票日期', trigger: 'change' }],
        amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
      }
    }
  },
  computed: {
    statsItems() {
      return [
        {
          label: '总金额',
          value: this.stats.total_amount || 0,
          format: 'currency',
          prefix: '¥',
          type: 'primary'
        },
        {
          label: '待收款',
          value: this.stats.pending_amount || 0,
          format: 'currency',
          prefix: '¥',
          type: 'warning'
        },
        {
          label: '已收款',
          value: this.stats.received_amount || 0,
          format: 'currency',
          prefix: '¥',
          type: 'success'
        },
        {
          label: '发票数',
          value: this.stats.total_count || 0,
          type: 'info'
        }
      ]
    }
  },
  created() {
    this.fetchInvoiceList()
    this.fetchInvoiceSummary()
  },
  methods: {
    // 获取发票列表
    async fetchInvoiceList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize
        }

        if (this.filters.status) {
          params.status = this.filters.status
        }
        if (this.filters.customer) {
          params.customer = this.filters.customer
        }

        const response = await invoiceAPI.getList(params)
        this.invoiceList = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        this.$message.error('获取发票列表失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    // 获取发票汇总
    async fetchInvoiceSummary() {
      try {
        // TODO: 从API获取统计数据
        this.stats = {}
      } catch (error) {
        console.error('获取发票汇总失败', error)
      }
    },

    // 搜索
    handleSearch() {
      this.pagination.page = 1
      this.fetchInvoiceList()
    },

    // 重置
    handleReset() {
      this.filters = {
        status: '',
        customer: ''
      }
      this.pagination.page = 1
      this.fetchInvoiceList()
    },

    // 查看详情
    async handleView(row) {
      try {
        const response = await invoiceAPI.getDetail(row.id)
        this.currentInvoice = response
        this.detailDialogVisible = true
      } catch (error) {
        this.$message.error('获取发票详情失败')
        console.error(error)
      }
    },

    // 新建
    handleCreate() {
      this.formMode = 'create'
      this.invoiceForm = {
        customer: null,
        invoice_type: 'vat_special',
        invoice_date: null,
        amount: null,
        tax_rate: 13,
        related_order_number: '',
        notes: ''
      }
      this.formDialogVisible = true
    },

    // 保存
    async handleSave() {
      this.$refs.invoiceFormRef.validate(async (valid) => {
        if (!valid) return

        try {
          await invoiceAPI.create(this.invoiceForm)
          this.$message.success('创建成功')
          this.formDialogVisible = false
          this.fetchInvoiceList()
        } catch (error) {
          this.$message.error('创建失败')
          console.error(error)
        }
      })
    },

    // 提交
    handleSubmit(row) {
      this.$confirm('确认提交该发票？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await invoiceAPI.submit(row.id)
          this.$message.success('提交成功')
          this.fetchInvoiceList()
        } catch (error) {
          this.$message.error('提交失败')
          console.error(error)
        }
      })
    },

    // 分页
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.page = 1
      this.fetchInvoiceList()
    },

    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchInvoiceList()
    },

    // 状态标签类型
    getStatusType(status) {
      const typeMap = {
        draft: 'info',
        issued: 'warning',
        sent: 'primary',
        received: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || ''
    }
  }
}
</script>

<style scoped>
.invoice-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 4px;
}

.stat-card.warning {
  border-color: #e6a23c;
}

.stat-card.success {
  border-color: #67c23a;
}

.stat-card.info {
  border-color: #409eff;
}

.stat-item {
  text-align: center;
  padding: 10px 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-form {
  margin-bottom: 0;
}

.table-section {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
