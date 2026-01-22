<template>
  <div class="payment-container">
    <!-- 统计卡片（与 TaskStats 样式一致） -->
    <payment-stats :stats="stats" :loading="statsLoading" />

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
            v-model="filters.payment_method"
            placeholder="付款方式"
            clearable
            style="width: 120px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="支票" value="check" />
            <el-option label="其他" value="other" />
          </el-select>
          <el-date-picker
            v-model="filters.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
            style="width: 260px;"
            @change="handleSearch"
          />
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
            新增收款
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
          <template slot-scope="scope">
            ¥{{ scope.row.amount ? scope.row.amount.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="applied_amount"
          label="已核销金额"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.applied_amount ? scope.row.applied_amount.toLocaleString() : '0' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="remaining_amount"
          label="未核销金额"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            <span :class="getRemainingClass(scope.row)">
              ¥{{ scope.row.remaining_amount ? scope.row.remaining_amount.toLocaleString() : scope.row.amount.toLocaleString() }}
            </span>
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
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
              type="text"
              size="small"
              style="color: #F56C6C;"
              @click="handleDelete(scope.row)"
            >
              删除
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
        description="暂无收款数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="hasFilters" type="primary" @click="handleReset">
          重置筛选
        </el-button>
        <el-button v-else-if="canCreate()" type="primary" @click="handleCreate">
          创建第一笔收款
        </el-button>
      </el-empty>
    </el-card>

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
        <h4>关联发票</h4>
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

      <template slot="footer">
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 收款表单对话框 -->
    <el-dialog
      :visible.sync="formDialogVisible"
      :title="isEdit ? '编辑收款' : '新增收款'"
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
        <el-form-item label="收款日期" prop="payment_date">
          <el-date-picker
            v-model="form.payment_date"
            type="date"
            placeholder="请选择日期"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="付款方式" prop="payment_method">
          <el-select v-model="form.payment_method" placeholder="请选择付款方式" style="width: 100%;">
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="支票" value="check" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="银行账户">
          <el-input v-model="form.bank_account" placeholder="请输入银行账户" />
        </el-form-item>
        <el-form-item label="交易流水号">
          <el-input v-model="form.transaction_number" placeholder="请输入交易流水号" />
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
import { paymentAPI, customerAPI } from '@/api/modules'
import PaymentStats from './components/PaymentStats.vue'
import Pagination from '@/components/common/Pagination.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'

// 表单初始值常量
const FORM_INITIAL = {
  id: null,
  customer: null,
  payment_date: '',
  payment_method: '',
  amount: null,
  bank_account: '',
  transaction_number: '',
  notes: ''
}

export default {
  name: 'PaymentList',
  components: {
    PaymentStats,
    Pagination
  },
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: paymentAPI,
      permissionPrefix: 'payment',

      // 页面状态
      statsLoading: false,
      submitting: false,

      // 数据
      customerList: [],
      currentPayment: null,
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
        payment_date: [{ required: true, message: '请选择收款日期', trigger: 'change' }],
        payment_method: [{ required: true, message: '请选择付款方式', trigger: 'change' }],
        amount: [{ required: true, message: '请输入收款金额', trigger: 'blur' }]
      },

      // 筛选条件
      filters: {
        customer: '',
        payment_method: '',
        date_range: null
      },

      // 搜索防抖定时器
      searchTimer: null
    }
  },

  computed: {
    hasFilters() {
      return this.filters.customer || this.filters.payment_method || this.filters.date_range
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
        ...(this.filters.customer && { customer: this.filters.customer }),
        ...(this.filters.payment_method && { payment_method: this.filters.payment_method })
      }
      if (this.filters.date_range && this.filters.date_range.length === 2) {
        params.payment_date_start = this.filters.date_range[0]
        params.payment_date_end = this.filters.date_range[1]
      }
      return await this.apiService.getList(params)
    },

    async fetchStats() {
      this.statsLoading = true
      try {
        const response = await paymentAPI.getSummary()
        this.stats = response || {}
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

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filters = { customer: '', payment_method: '', date_range: null }
      this.currentPage = 1
      this.loadData()
    },

    async handleView(row) {
      try {
        const response = await paymentAPI.getDetail(row.id)
        this.currentPayment = response
        this.detailDialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '获取收款详情失败')
      }
    },

    handleCreate() {
      this.isEdit = false
      this.form = { ...FORM_INITIAL }
      this.formDialogVisible = true
    },

    handleEdit(row) {
      this.isEdit = true
      this.form = {
        id: row.id,
        customer: row.customer,
        payment_date: row.payment_date,
        payment_method: row.payment_method,
        amount: row.amount,
        bank_account: row.bank_account || '',
        transaction_number: row.transaction_number || '',
        notes: row.notes || ''
      }
      this.formDialogVisible = true
    },

    async handleSave() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return

        this.submitting = true
        try {
          const data = { ...this.form }
          delete data.id

          if (this.isEdit) {
            await paymentAPI.update(this.form.id, data)
            ErrorHandler.showSuccess('收款更新成功')
          } else {
            await paymentAPI.create(data)
            ErrorHandler.showSuccess('收款创建成功')
          }

          this.formDialogVisible = false
          this.loadData()
          this.fetchStats()
        } catch (error) {
          ErrorHandler.showMessage(error, this.isEdit ? '更新收款失败' : '创建收款失败')
        } finally {
          this.submitting = false
        }
      })
    },

    async handleDelete(row) {
      try {
        await ErrorHandler.confirm('确认删除该收款记录？')
        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        this.loadData()
        this.fetchStats()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '删除失败')
        }
      }
    },

    getRemainingClass(row) {
      return row.remaining_amount > 0 ? 'has-remaining' : ''
    }
  }
}
</script>

<style scoped>
.payment-container {
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

.related-section {
  margin-top: 20px;
}

.related-section h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.has-remaining {
  color: #e6a23c;
  font-weight: bold;
}
</style>
