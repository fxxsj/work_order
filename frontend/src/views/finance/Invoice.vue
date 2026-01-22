<template>
  <div class="invoice-container">
    <!-- 统计卡片（与 TaskStats 样式一致） -->
    <invoice-stats :stats="stats" :loading="statsLoading" />

    <!-- 主内容卡片 -->
    <el-card>
      <!-- 头部搜索栏（与 Board.vue 一致） -->
      <div class="header-section">
        <div class="filter-group">
          <el-select
            v-model="filters.customer"
            placeholder="选择客户"
            clearable
            filterable
            style="width: 160px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
          <el-select
            v-model="filters.status"
            placeholder="发票状态"
            clearable
            style="width: 120px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option label="待开具" value="draft" />
            <el-option label="已开具" value="issued" />
            <el-option label="已发送" value="sent" />
            <el-option label="已收到" value="received" />
            <el-option label="已作废" value="cancelled" />
          </el-select>
          <el-input
            v-model="filters.invoice_number"
            placeholder="搜索发票号码"
            style="width: 200px;"
            clearable
            @input="handleSearchDebounced"
            @clear="handleSearch"
          >
            <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
          </el-input>
        </div>
        <div class="action-group">
          <el-button
            :loading="loading"
            icon="el-icon-refresh"
            @click="loadData"
          >
            刷新
          </el-button>
          <el-button
            v-if="canCreate()"
            type="primary"
            icon="el-icon-plus"
            @click="handleCreate"
          >
            新建发票
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-if="tableData.length > 0"
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%; margin-top: 20px;"
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
        <el-table-column prop="due_date" label="到期日期" width="120">
          <template slot-scope="scope">
            {{ scope.row.due_date || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="canEdit() && scope.row.status === 'draft'"
              type="text"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canEdit() && scope.row.status === 'draft'"
              type="text"
              size="small"
              style="color: #E6A23C;"
              @click="handleSubmit(scope.row)"
            >
              提交
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无发票数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="hasFilters" type="primary" @click="handleReset">
          重置筛选
        </el-button>
        <el-button v-else-if="canCreate()" type="primary" @click="handleCreate">
          创建第一个发票
        </el-button>
      </el-empty>
    </el-card>

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

      <template slot="footer">
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑发票对话框 -->
    <el-dialog
      :visible.sync="formDialogVisible"
      :title="isEdit ? '编辑发票' : '新建发票'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="客户" prop="customer">
          <el-select
            v-model="form.customer"
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
          <el-select v-model="form.invoice_type" placeholder="请选择发票类型" style="width: 100%;">
            <el-option label="增值税专用发票" value="vat_special" />
            <el-option label="增值税普通发票" value="vat_common" />
            <el-option label="电子发票" value="electronic" />
          </el-select>
        </el-form-item>
        <el-form-item label="开票日期" prop="invoice_date">
          <el-date-picker
            v-model="form.invoice_date"
            type="date"
            placeholder="请选择日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="金额(不含税)" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="税率" prop="tax_rate">
          <el-input-number
            v-model="form.tax_rate"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="关联单号">
          <el-input v-model="form.related_order_number" placeholder="请输入关联单号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      
      <template slot="footer">
        <el-button @click="formDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { invoiceAPI, customerAPI } from '@/api/modules'
import InvoiceStats from './components/InvoiceStats.vue'
import Pagination from '@/components/common/Pagination.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'

// 表单初始值常量
const FORM_INITIAL = {
  id: null,
  customer: null,
  invoice_type: 'vat_special',
  invoice_date: '',
  amount: null,
  tax_rate: 13,
  related_order_number: '',
  notes: ''
}

export default {
  name: 'InvoiceList',
  components: {
    InvoiceStats,
    Pagination
  },
  mixins: [listPageMixin, crudPermissionMixin],
  
  data() {
    return {
      // API 服务和权限配置
      apiService: invoiceAPI,
      permissionPrefix: 'invoice',

      // 页面状态
      statsLoading: false,
      submitting: false,

      // 数据
      customerList: [],
      currentInvoice: null,
      stats: {},

      // 对话框
      detailDialogVisible: false,
      formDialogVisible: false,
      isEdit: false,

      // 表单数据
      form: { ...FORM_INITIAL },
      
      // 表单验证规则
      rules: {
        customer: [{ required: true, message: '请选择客户', trigger: 'change' }],
        invoice_type: [{ required: true, message: '请选择发票类型', trigger: 'change' }],
        invoice_date: [{ required: true, message: '请选择开票日期', trigger: 'change' }],
        amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
      },

      // 筛选条件
      filters: {
        status: '',
        customer: '',
        invoice_number: ''
      },

      // 搜索防抖定时器
      searchTimer: null
    }
  },

  computed: {
    hasFilters() {
      return this.filters.status || this.filters.customer || this.filters.invoice_number
    }
  },
  created() {
    this.loadData()
    this.fetchStats()
    this.fetchCustomers()
  },
  
  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ...(this.filters.status && { status: this.filters.status }),
        ...(this.filters.customer && { customer: this.filters.customer }),
        ...(this.filters.invoice_number && { invoice_number: this.filters.invoice_number })
      }
      return await this.apiService.getList(params)
    },

    async fetchStats() {
      this.statsLoading = true
      try {
        // 基于本地数据计算统计
        const response = await this.apiService.getList({ page_size: 1000 })
        const list = response.results || []
        this.stats = {
          total_count: list.length,
          draft_count: list.filter(i => i.status === 'draft').length,
          pending_amount: list
            .filter(i => i.status === 'issued' || i.status === 'sent')
            .reduce((sum, i) => sum + (i.total_amount || 0), 0),
          received_amount: list
            .filter(i => i.status === 'received')
            .reduce((sum, i) => sum + (i.total_amount || 0), 0)
        }
      } catch (error) {
        this.stats = {}
      } finally {
        this.statsLoading = false
      }
    },

    async fetchCustomers() {
      try {
        const response = await customerAPI.getList({ page_size: 1000 })
        this.customerList = response.results || []
      } catch (error) {
        // 静默处理
      }
    },

    // 搜索防抖处理
    handleSearchDebounced() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.handleSearch()
      }, 300)
    },

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filters = { status: '', customer: '', invoice_number: '' }
      this.currentPage = 1
      this.loadData()
    },

    async handleView(row) {
      try {
        const response = await invoiceAPI.getDetail(row.id)
        this.currentInvoice = response
        this.detailDialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '获取发票详情失败')
      }
    },

    handleCreate() {
      if (!this.canCreate()) return
      this.isEdit = false
      this.form = { ...FORM_INITIAL }
      this.formDialogVisible = true
    },

    handleEdit(row) {
      if (!this.canEdit()) return
      this.isEdit = true
      this.form = {
        id: row.id,
        customer: row.customer,
        invoice_type: row.invoice_type,
        invoice_date: row.invoice_date,
        amount: row.amount,
        tax_rate: row.tax_rate,
        related_order_number: row.related_order_number || '',
        notes: row.notes || ''
      }
      this.formDialogVisible = true
    },

    async handleSubmit() {
      try {
        await ErrorHandler.confirm('确认提交该发票？')
        await invoiceAPI.submit(this.form.id)
        ErrorHandler.showSuccess('提交成功')
        this.loadData()
        this.fetchStats()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '提交失败')
        }
      }
    },

    async handleSave() {
      this.submitting = true
      try {
        this.$refs.formRef.validate(async (valid) => {
          if (!valid) return

          const data = { ...this.form }
          if (data.id) {
            delete data.id
            await invoiceAPI.update(this.form.id, data)
            ErrorHandler.showSuccess('发票更新成功')
          } else {
            await invoiceAPI.create(data)
            ErrorHandler.showSuccess('发票创建成功')
          }

          this.formDialogVisible = false
          this.loadData()
          this.fetchStats()
        })
      } catch (error) {
        ErrorHandler.showMessage(error, this.isEdit ? '更新发票失败' : '创建发票失败')
      } finally {
        this.submitting = false
      }
    },

    resetForm() {
      this.form = { ...FORM_INITIAL }
    },

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

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
