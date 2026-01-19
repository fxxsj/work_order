<template>
  <div class="statement-container">
    <div class="header">
      <h2>对账管理</h2>
      <div class="actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">生成对账单</el-button>
        <el-button icon="el-icon-refresh" @click="fetchStatementList">刷新</el-button>
      </div>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="对账类型">
          <el-select v-model="filters.statement_type" placeholder="全部类型" clearable @change="handleSearch">
            <el-option label="客户对账" value="customer"></el-option>
            <el-option label="供应商对账" value="supplier"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="对方单位">
          <el-select v-model="filters.partner" placeholder="全部单位" clearable filterable>
            <el-option v-for="partner in partnerList" :key="partner.id" :label="partner.name" :value="partner.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="对账期间">
          <el-date-picker v-model="filters.period_range" type="monthrange" range-separator="至" start-placeholder="开始月份" end-placeholder="结束月份" clearable @change="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="草稿" value="draft"></el-option>
            <el-option label="已确认" value="confirmed"></el-option>
            <el-option label="已作废" value="cancelled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-section">
      <el-table v-loading="loading" :data="statementList" border style="width: 100%">
        <el-table-column prop="statement_number" label="对账单号" width="150" />
        <el-table-column prop="statement_type_display" label="对账类型" width="100" />
        <el-table-column prop="partner_name" label="对方单位" width="200" />
        <el-table-column prop="period_start" label="期间开始" width="120" />
        <el-table-column prop="period_end" label="期间结束" width="120" />
        <el-table-column prop="opening_balance" label="期初余额" width="120" align="right"><template #default="{ row }">¥{{ row.opening_balance ? row.opening_balance.toLocaleString() : '-' }}</template></el-table-column>
        <el-table-column prop="debit_amount" label="借方发生额" width="120" align="right"><template #default="{ row }">¥{{ row.debit_amount ? row.debit_amount.toLocaleString() : '-' }}</template></el-table-column>
        <el-table-column prop="credit_amount" label="贷方发生额" width="120" align="right"><template #default="{ row }">¥{{ row.credit_amount ? row.credit_amount.toLocaleString() : '-' }}</template></el-table-column>
        <el-table-column prop="closing_balance" label="期末余额" width="120" align="right"><template #default="{ row }"><span style="font-weight: bold;">¥{{ row.closing_balance ? row.closing_balance.toLocaleString() : '-' }}</span></template></el-table-column>
        <el-table-column prop="status_display" label="状态" width="100"><template #default="{ row }"><el-tag :type="getStatusType(row.status)">{{ row.status_display }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="200" fixed="right"><template #default="{ row }"><el-button size="small" @click="handleView(row)">查看</el-button><el-button v-if="row.status === 'draft'" size="small" type="primary" @click="handleConfirm(row)">确认</el-button><el-button size="small" type="success" @click="handleExport(row)">导出</el-button></template></el-table-column>
      </el-table>

      <Pagination :current-page="pagination.page" :page-size="pagination.pageSize" :total="pagination.total" @current-change="handlePageChange" @size-change="handleSizeChange" />
    </div>

    <el-dialog :visible.sync="detailDialogVisible" title="对账单详情" width="1200px" :close-on-click-modal="false">
      <div v-if="currentStatement">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="对账单号">{{ currentStatement.statement_number }}</el-descriptions-item>
          <el-descriptions-item label="对账类型">{{ currentStatement.statement_type_display }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="getStatusType(currentStatement.status)">{{ currentStatement.status_display }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="对方单位">{{ currentStatement.partner_name }}</el-descriptions-item>
          <el-descriptions-item label="对账期间">{{ currentStatement.period_start }} ~ {{ currentStatement.period_end }}</el-descriptions-item>
          <el-descriptions-item label="生成日期">{{ currentStatement.statement_date }}</el-descriptions-item>
        </el-descriptions>

        <div class="balance-summary">
          <h3>余额汇总</h3>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="6"><el-card><div class="balance-item"><div class="balance-label">期初余额</div><div class="balance-value">¥{{ currentStatement.opening_balance ? currentStatement.opening_balance.toLocaleString() : '-' }}</div></div></el-card></el-col>
            <el-col :span="6"><el-card><div class="balance-item"><div class="balance-label debit">借方发生额</div><div class="balance-value">¥{{ currentStatement.debit_amount ? currentStatement.debit_amount.toLocaleString() : '-' }}</div></div></el-card></el-col>
            <el-col :span="6"><el-card><div class="balance-item"><div class="balance-label credit">贷方发生额</div><div class="balance-value">¥{{ currentStatement.credit_amount ? currentStatement.credit_amount.toLocaleString() : '-' }}</div></div></el-card></el-col>
            <el-col :span="6"><el-card><div class="balance-item"><div class="balance-label closing">期末余额</div><div class="balance-value">¥{{ currentStatement.closing_balance ? currentStatement.closing_balance.toLocaleString() : '-' }}</div></div></el-card></el-col>
          </el-row>
        </div>
      </div>
      <template #footer><el-button @click="detailDialogVisible = false">关闭</el-button><el-button type="primary" @click="handlePrint">打印</el-button></template>
    </el-dialog>

    <el-dialog :visible.sync="formDialogVisible" title="生成对账单" width="600px" :close-on-click-modal="false">
      <el-form :model="statementForm" :rules="statementRules" ref="statementFormRef" label-width="100px">
        <el-form-item label="对账类型" prop="statement_type">
          <el-radio-group v-model="statementForm.statement_type">
            <el-radio label="customer">客户对账</el-radio>
            <el-radio label="supplier">供应商对账</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="对方单位" prop="partner">
          <el-select v-model="statementForm.partner" placeholder="请选择对方单位" filterable style="width: 100%;">
            <el-option v-for="partner in filteredPartnerList" :key="partner.id" :label="partner.name" :value="partner.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="对账期间" prop="period">
          <el-date-picker v-model="statementForm.period" type="monthrange" range-separator="至" start-placeholder="开始月份" end-placeholder="结束月份" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="对账日期" prop="statement_date">
          <el-date-picker v-model="statementForm.statement_date" type="date" placeholder="请选择日期" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="statementForm.notes" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="formDialogVisible = false">取消</el-button><el-button type="primary" @click="handleGenerate">生成</el-button></template>
    </el-dialog>

    <el-dialog :visible.sync="confirmDialogVisible" title="确认对账单" width="500px" :close-on-click-modal="false">
      <el-form :model="confirmForm" label-width="100px">
        <el-form-item label="确认备注">
          <el-input v-model="confirmForm.confirm_notes" type="textarea" :rows="3" placeholder="请输入确认备注" />
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="confirmDialogVisible = false">取消</el-button><el-button type="primary" @click="handleSaveConfirm">确认</el-button></template>
    </el-dialog>
  </div>
</template>

<script>
import { getStatements, getStatementDetail, createStatement, confirmStatement } from '@/api/finance'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'StatementList',
  components: { Pagination },
  data() {
    return {
      loading: false,
      statementList: [],
      partnerList: [],
      currentStatement: null,
      detailDialogVisible: false,
      formDialogVisible: false,
      confirmDialogVisible: false,
      filters: { statement_type: '', partner: '', period_range: null, status: '' },
      pagination: { page: 1, pageSize: 20, total: 0 },
      statementForm: { statement_type: 'customer', partner: null, period: null, statement_date: null, notes: '' },
      statementRules: {
        statement_type: [{ required: true, message: '请选择对账类型', trigger: 'change' }],
        partner: [{ required: true, message: '请选择对方单位', trigger: 'change' }],
        period: [{ required: true, message: '请选择对账期间', trigger: 'change' }],
        statement_date: [{ required: true, message: '请选择对账日期', trigger: 'change' }]
      },
      confirmForm: { confirm_notes: '' }
    }
  },
  computed: {
    filteredPartnerList() { return this.partnerList }
  },
  created() {
    this.fetchStatementList()
    this.fetchPartners()
  },
  methods: {
    async fetchStatementList() {
      this.loading = true
      try {
        const params = { page: this.pagination.page, page_size: this.pagination.pageSize }
        if (this.filters.statement_type) params.statement_type = this.filters.statement_type
        if (this.filters.partner) params.partner = this.filters.partner
        if (this.filters.status) params.status = this.filters.status
        if (this.filters.period_range && this.filters.period_range.length === 2) {
          const formatDate = (date) => { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
          params.period_start = formatDate(this.filters.period_range[0])
          params.period_end = formatDate(this.filters.period_range[1])
        }
        const response = await getStatements(params)
        this.statementList = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) { this.$message.error('获取对账单列表失败') } finally { this.loading = false }
    },
    async fetchPartners() {
      try { this.partnerList = [] } catch (error) { console.error('获取对方单位列表失败', error) }
    },
    handleSearch() { this.pagination.page = 1; this.fetchStatementList() },
    handleReset() { this.filters = { statement_type: '', partner: '', period_range: null, status: '' }; this.pagination.page = 1; this.fetchStatementList() },
    handleSizeChange(size) { this.pagination.pageSize = size; this.pagination.page = 1; this.fetchStatementList() },
    handlePageChange(page) { this.pagination.page = page; this.fetchStatementList() },
    async handleView(row) {
      try { const response = await getStatementDetail(row.id); this.currentStatement = response; this.detailDialogVisible = true } catch (error) { this.$message.error('获取对账单详情失败') }
    },
    handleCreate() {
      this.statementForm = { statement_type: 'customer', partner: null, period: null, statement_date: new Date(), notes: '' }
      this.formDialogVisible = true
    },
    async handleGenerate() {
      this.$refs.statementFormRef.validate(async (valid) => {
        if (!valid) return
        try {
          const data = { statement_type: this.statementForm.statement_type, partner: this.statementForm.partner, period_start: this.statementForm.period[0], period_end: this.statementForm.period[1], statement_date: this.statementForm.statement_date, notes: this.statementForm.notes }
          await createStatement(data)
          this.$message.success('生成成功')
          this.formDialogVisible = false
          this.fetchStatementList()
        } catch (error) { this.$message.error('生成失败') }
      })
    },
    handleConfirm(row) {
      this.currentStatement = row
      this.confirmForm.confirm_notes = ''
      this.confirmDialogVisible = true
    },
    async handleSaveConfirm() {
      try {
        await confirmStatement(this.currentStatement.id, this.confirmForm)
        this.$message.success('确认成功')
        this.confirmDialogVisible = false
        this.fetchStatementList()
      } catch (error) { this.$message.error('确认失败') }
    },
    // eslint-disable-next-line no-unused-vars
    handleExport(row) {
      this.$message.info('导出功能开发中')
    },
    handlePrint() { window.print() },
    getStatusType(status) { const typeMap = { draft: 'info', confirmed: 'success', cancelled: 'danger' }; return typeMap[status] || '' }
  }
}
</script>

<style scoped>
.statement-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.filter-section { margin-bottom: 20px; padding: 20px; background: #f5f5f5; border-radius: 4px; }
.filter-form { margin-bottom: 0; }
.table-section { background: #fff; border-radius: 4px; padding: 20px; }
.balance-summary { margin-top: 20px; }
.balance-item { text-align: center; padding: 10px 0; }
.balance-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.balance-value { font-size: 20px; font-weight: bold; color: #303133; }
.balance-value.debit { color: #67c23a; }
.balance-value.credit { color: #f56c6c; }
.balance-value.closing { color: #409eff; }
</style>
