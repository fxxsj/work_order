<template>
  <div class="payment-container">
    <!-- 页面头部 -->
    <div class="header">
      <h2>收款管理</h2>
      <div class="actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
          新增收款
        </el-button>
        <el-button icon="el-icon-refresh" @click="fetchPaymentList">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <stats-cards :items="statsItems" />

    <!-- 搜索和过滤 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
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
        <el-form-item label="付款方式">
          <el-select
            v-model="filters.payment_method"
            placeholder="全部方式"
            clearable
            @change="handleSearch"
          >
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="支票" value="check" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款日期">
          <el-date-picker
            v-model="filters.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
            @change="handleSearch"
          />
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
        :data="paymentList"
        border
        style="width: 100%"
      >
        <el-table-column prop="payment_number" label="收款单号" width="150" />
        <el-table-column prop="customer_name" label="客户名称" width="150" />
        <el-table-column prop="payment_date" label="收款日期" width="120" />
        <el-table-column prop="payment_method_display" label="付款方式" width="100" />
        <el-table-column
          prop="amount"
          label="收款金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ row.amount ? row.amount.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="applied_amount"
          label="已核销金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ row.applied_amount ? row.applied_amount.toLocaleString() : '0' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="remaining_amount"
          label="未核销金额"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span :class="getRemainingClass(row)">¥{{ row.remaining_amount ? row.remaining_amount.toLocaleString() : row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="bank_account"
          label="银行账户"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="notes" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 收款详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      title="收款详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="currentPayment" :column="2" border>
        <el-descriptions-item label="收款单号">
          {{ currentPayment.payment_number }}
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">
          {{ currentPayment.customer_name }}
        </el-descriptions-item>
        <el-descriptions-item label="收款日期">
          {{ currentPayment.payment_date }}
        </el-descriptions-item>
        <el-descriptions-item label="付款方式">
          {{ currentPayment.payment_method_display }}
        </el-descriptions-item>
        <el-descriptions-item label="收款金额">
          ¥{{ currentPayment.amount ? currentPayment.amount.toLocaleString() : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="已核销金额">
          ¥{{ currentPayment.applied_amount ? currentPayment.applied_amount.toLocaleString() : '0' }}
        </el-descriptions-item>
        <el-descriptions-item label="未核销金额">
          ¥{{ currentPayment.remaining_amount ? currentPayment.remaining_amount.toLocaleString() : currentPayment.amount.toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="银行账户">
          {{ currentPayment.bank_account || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="交易流水号" :span="2">
          {{ currentPayment.transaction_number || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ currentPayment.notes || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ currentPayment.created_at }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">
          {{ currentPayment.created_by_name || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 关联发票 -->
      <div v-if="currentPayment && currentPayment.invoices && currentPayment.invoices.length > 0" class="related-section">
        <h3>关联发票</h3>
        <el-table :data="currentPayment.invoices" border style="width: 100%; margin-top: 10px;">
          <el-table-column prop="invoice_number" label="发票号码" width="150" />
          <el-table-column prop="invoice_date" label="发票日期" width="120" />
          <el-table-column prop="total_amount" label="发票金额" width="120">
            <template slot-scope="scope">
              ¥{{ scope.row.total_amount ? scope.row.total_amount.toLocaleString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="applied_amount" label="核销金额" width="120">
            <template slot-scope="scope">
              ¥{{ scope.row.applied_amount ? scope.row.applied_amount.toLocaleString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status_display" label="状态" width="100" />
        </el-table>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 收款表单对话框 -->
    <el-dialog
      :visible.sync="formDialogVisible"
      :title="formMode === 'create' ? '新增收款' : '编辑收款'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="100px"
      >
        <el-form-item label="客户" prop="customer">
          <el-select
            v-model="paymentForm.customer"
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
        <el-form-item label="收款日期" prop="payment_date">
          <el-date-picker
            v-model="paymentForm.payment_date"
            type="date"
            placeholder="请选择日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="付款方式" prop="payment_method">
          <el-select v-model="paymentForm.payment_method" placeholder="请选择付款方式" style="width: 100%;">
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="支票" value="check" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款金额" prop="amount">
          <el-input-number
            v-model="paymentForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="银行账户" prop="bank_account">
          <el-input v-model="paymentForm.bank_account" placeholder="请输入银行账户" />
        </el-form-item>
        <el-form-item label="交易流水号" prop="transaction_number">
          <el-input v-model="paymentForm.transaction_number" placeholder="请输入交易流水号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="paymentForm.notes"
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
import { paymentAPI } from '@/api/modules'
import StatsCards from '@/components/common/StatsCards.vue'
import Pagination from '@/components/common/Pagination.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import statisticsMixin from '@/mixins/statisticsMixin'

export default {
  name: 'PaymentList',
  components: { Pagination, StatsCards },
  mixins: [listPageMixin, crudPermissionMixin, statisticsMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: paymentAPI,
      permissionPrefix: 'payment',

      loading: false,
      paymentList: [],
      customerList: [],
      currentPayment: null,
      detailDialogVisible: false,
      formDialogVisible: false,
      formMode: 'create',
      stats: {},
      filters: {
        customer: '',
        payment_method: '',
        date_range: null
      },
      paymentForm: {
        customer: null,
        payment_date: null,
        payment_method: '',
        amount: null,
        bank_account: '',
        transaction_number: '',
        notes: ''
      },
      paymentRules: {
        customer: [{ required: true, message: '请选择客户', trigger: 'change' }],
        payment_date: [{ required: true, message: '请选择收款日期', trigger: 'change' }],
        payment_method: [{ required: true, message: '请选择付款方式', trigger: 'change' }],
        amount: [{ required: true, message: '请输入收款金额', trigger: 'blur' }]
      }
    }
  },
  computed: {
    statsItems() {
      return [
        { label: '总收款金额', value: this.stats.total_amount || 0, format: 'currency', prefix: '¥', type: 'primary' },
        { label: '已核销金额', value: this.stats.applied_amount || 0, format: 'currency', prefix: '¥', type: 'success' },
        { label: '未核销金额', value: this.stats.unapplied_amount || 0, format: 'currency', prefix: '¥', type: 'warning' },
        { label: '收款笔数', value: this.stats.total_count || 0, type: 'info' }
      ]
    }
  },
  created() {
    this.fetchPaymentList()
    this.fetchPaymentSummary()
    this.fetchCustomers()
  },
  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize
      }
      if (this.filters.customer) params.customer = this.filters.customer
      if (this.filters.payment_method) params.payment_method = this.filters.payment_method
      if (this.filters.date_range?.length === 2) {
        params.payment_date_start = this.filters.date_range[0]
        params.payment_date_end = this.filters.date_range[1]
      }
      return await this.apiService.getList(params)
    },

    async fetchPaymentList() {
      this.loading = true
      try {
        const response = await this.fetchData()
        this.paymentList = response.results || []
        this.total = response.count || 0
      } catch (error) {
        this.$message.error(`获取收款列表失败: ${error.response?.data?.detail || error.message}`)
      } finally {
        this.loading = false
      }
    },
    async fetchPaymentSummary() { try { this.stats = await paymentAPI.getSummary() || {} } catch (error) { console.error('获取收款汇总失败', error) } },
    async fetchCustomers() { try { this.customerList = [] } catch (error) { console.error('获取客户列表失败', error) } },
    handleSearch() { this.currentPage = 1; this.fetchPaymentList() },
    handleReset() {
      this.filters = { customer: '', payment_method: '', date_range: null }
      this.currentPage = 1
      this.fetchPaymentList()
    },
    async handleView(row) {
      try { this.currentPayment = await paymentAPI.getDetail(row.id); this.detailDialogVisible = true }
      catch (error) { this.$message.error('获取收款详情失败') }
    },
    handleCreate() { this.formMode = 'create'; this.paymentForm = { customer: null, payment_date: null, payment_method: '', amount: null, bank_account: '', transaction_number: '', notes: '' }; this.formDialogVisible = true },
    handleEdit(row) { this.formMode = 'edit'; this.paymentForm = { id: row.id, customer: row.customer, payment_date: row.payment_date, payment_method: row.payment_method, amount: row.amount, bank_account: row.bank_account || '', transaction_number: row.transaction_number || '', notes: row.notes || '' }; this.formDialogVisible = true },
    async handleSave() {
      this.$refs.paymentFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          const data = { ...this.paymentForm }
          if (this.formMode === 'create') await paymentAPI.create(data)
          else await paymentAPI.update(data.id, data)
          this.$message.success(this.formMode === 'create' ? '创建成功' : '更新成功')
          this.formDialogVisible = false
          this.fetchPaymentList()
          this.fetchPaymentSummary()
        } catch (error) { this.$message.error(this.formMode === 'create' ? '创建失败' : '更新失败') }
      })
    },
    handleDelete(row) {
      this.$confirm('确认删除该收款记录？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await this.apiService.delete(row.id)
          this.$message.success('删除成功')
          this.fetchPaymentList()
          this.fetchPaymentSummary()
        } catch {
          this.$message.error('删除失败')
        }
      }).catch(() => {})
    },
    handleSizeChange(size) { this.pageSize = size; this.currentPage = 1; this.fetchPaymentList() },
    handlePageChange(page) { this.currentPage = page; this.fetchPaymentList() },
    getRemainingClass(row) { return row.remaining_amount > 0 ? 'has-remaining' : '' }
  }
}
</script>

<style scoped>
.payment-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.stats-cards { margin-bottom: 20px; }
.stat-card { border-radius: 4px; }
.stat-card.success { border-color: #67c23a; }
.stat-card.warning { border-color: #e6a23c; }
.stat-card.info { border-color: #409eff; }
.stat-item { text-align: center; padding: 10px 0; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: bold; color: #303133; }
.filter-section { margin-bottom: 20px; padding: 20px; background: #f5f5f5; border-radius: 4px; }
.filter-form { margin-bottom: 0; }
.table-section { background: #fff; border-radius: 4px; padding: 20px; }
.related-section { margin-top: 20px; }
.has-remaining { color: #e6a23c; font-weight: bold; }
</style>
