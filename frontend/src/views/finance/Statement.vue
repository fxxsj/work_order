<template>
  <div class="statement-container">
    <!-- 统计卡片（与 TaskStats 样式一致） -->
    <statement-stats :stats="stats" :loading="statsLoading" />

    <!-- 主内容卡片 -->
    <el-card>
      <!-- 头部搜索栏（与 Board.vue 一致） -->
      <div class="header-section">
        <div class="filter-group">
          <el-select
            v-model="filters.statement_type"
            placeholder="对账类型"
            clearable
            style="width: 120px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option label="客户对账" value="customer" />
            <el-option label="供应商对账" value="supplier" />
          </el-select>
          <el-select
            v-model="filters.partner"
            placeholder="选择对方单位"
            clearable
            filterable
            style="width: 160px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option
              v-for="(partner, index) in partnerList"
              :key="`filter-partner-${partner.type}-${partner.id}-${index}`"
              :label="partner.name"
              :value="partner.id"
            />
          </el-select>
          <el-select
            v-model="filters.status"
            placeholder="状态"
            clearable
            style="width: 100px;"
            @change="handleSearch"
          >
            <el-option label="草稿" value="draft" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已作废" value="cancelled" />
          </el-select>
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
            生成对账单
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
        <el-table-column prop="statement_number" label="对账单号" width="150" />
        <el-table-column prop="statement_type_display" label="对账类型" width="100" />
        <el-table-column prop="partner_name" label="对方单位" width="200" />
        <el-table-column prop="period_start" label="期间开始" width="120" />
        <el-table-column prop="period_end" label="期间结束" width="120" />
        <el-table-column
          prop="opening_balance"
          label="期初余额"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.opening_balance ? scope.row.opening_balance.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="debit_amount"
          label="借方发生额"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.debit_amount ? scope.row.debit_amount.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="credit_amount"
          label="贷方发生额"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.credit_amount ? scope.row.credit_amount.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="closing_balance"
          label="期末余额"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            <span style="font-weight: bold;">
              ¥{{ scope.row.closing_balance ? scope.row.closing_balance.toLocaleString() : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status_display" label="状态" width="100">
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
              style="color: #409EFF;"
              @click="handleConfirm(scope.row)"
            >
              确认
            </el-button>
            <el-button
              type="text"
              size="small"
              style="color: #67C23A;"
              @click="handleExport(scope.row)"
            >
              导出
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
        description="暂无对账单数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="hasFilters" type="primary" @click="handleReset">
          重置筛选
        </el-button>
        <el-button v-else-if="canCreate()" type="primary" @click="handleCreate">
          生成第一个对账单
        </el-button>
      </el-empty>
    </el-card>

    <!-- 对账单详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      title="对账单详情"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div v-if="currentStatement">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="对账单号">
            {{ currentStatement.statement_number }}
          </el-descriptions-item>
          <el-descriptions-item label="对账类型">
            {{ currentStatement.statement_type_display }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentStatement.status)">
              {{ currentStatement.status_display }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="对方单位">
            {{ currentStatement.partner_name }}
          </el-descriptions-item>
          <el-descriptions-item label="对账期间">
            {{ currentStatement.period_start }} ~ {{ currentStatement.period_end }}
          </el-descriptions-item>
          <el-descriptions-item label="生成日期">
            {{ currentStatement.statement_date }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="balance-summary">
          <h4>余额汇总</h4>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="6">
              <el-card>
                <div class="balance-item">
                  <div class="balance-label">
                    期初余额
                  </div>
                  <div class="balance-value">
                    ¥{{ currentStatement.opening_balance ? currentStatement.opening_balance.toLocaleString() : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="balance-item">
                  <div class="balance-label debit">
                    借方发生额
                  </div>
                  <div class="balance-value">
                    ¥{{ currentStatement.debit_amount ? currentStatement.debit_amount.toLocaleString() : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="balance-item">
                  <div class="balance-label credit">
                    贷方发生额
                  </div>
                  <div class="balance-value">
                    ¥{{ currentStatement.credit_amount ? currentStatement.credit_amount.toLocaleString() : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="balance-item">
                  <div class="balance-label closing">
                    期末余额
                  </div>
                  <div class="balance-value">
                    ¥{{ currentStatement.closing_balance ? currentStatement.closing_balance.toLocaleString() : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <template slot="footer">
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
        <el-button type="primary" @click="handlePrint">
          打印
        </el-button>
      </template>
    </el-dialog>

    <!-- 生成对账单对话框 -->
    <el-dialog
      :visible.sync="formDialogVisible"
      title="生成对账单"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="对账类型" prop="statement_type">
          <el-radio-group v-model="form.statement_type">
            <el-radio label="customer">
              客户对账
            </el-radio>
            <el-radio label="supplier">
              供应商对账
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="对方单位" prop="partner">
          <el-select
            v-model="form.partner"
            placeholder="请选择对方单位"
            filterable
            style="width: 100%;"
          >
            <el-option
              v-for="partner in filteredPartnerList"
              :key="partner.id"
              :label="partner.name"
              :value="partner.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="对账期间" prop="period">
          <el-date-picker
            v-model="form.period"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="对账日期" prop="statement_date">
          <el-date-picker
            v-model="form.statement_date"
            type="date"
            placeholder="请选择日期"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
          />
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
        <el-button type="primary" :loading="submitting" @click="handleGenerate">
          生成
        </el-button>
      </template>
    </el-dialog>

    <!-- 确认对账单对话框 -->
    <el-dialog
      :visible.sync="confirmDialogVisible"
      title="确认对账单"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="confirmForm" label-width="100px">
        <el-form-item label="确认备注">
          <el-input
            v-model="confirmForm.confirm_notes"
            type="textarea"
            :rows="3"
            placeholder="请输入确认备注"
          />
        </el-form-item>
      </el-form>

      <template slot="footer">
        <el-button @click="confirmDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="confirming" @click="handleSaveConfirm">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { statementAPI, customerAPI, supplierAPI } from '@/api/modules'
import StatementStats from './components/StatementStats.vue'
import Pagination from '@/components/common/Pagination.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'

// 表单初始值常量
const FORM_INITIAL = {
  statement_type: 'customer',
  partner: null,
  period: null,
  statement_date: '',
  notes: ''
}

export default {
  name: 'StatementList',
  components: {
    StatementStats,
    Pagination
  },
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: statementAPI,
      permissionPrefix: 'statement',

      // 页面状态
      statsLoading: false,
      submitting: false,
      confirming: false,

      // 数据
      partnerList: [],
      customerList: [],
      supplierList: [],
      currentStatement: null,
      stats: {},

      // 对话框
      detailDialogVisible: false,
      formDialogVisible: false,
      confirmDialogVisible: false,

      // 表单数据
      form: { ...FORM_INITIAL },

      // 表单验证规则
      rules: {
        statement_type: [{ required: true, message: '请选择对账类型', trigger: 'change' }],
        partner: [{ required: true, message: '请选择对方单位', trigger: 'change' }],
        period: [{ required: true, message: '请选择对账期间', trigger: 'change' }],
        statement_date: [{ required: true, message: '请选择对账日期', trigger: 'change' }]
      },

      // 确认表单
      confirmForm: {
        confirm_notes: ''
      },

      // 筛选条件
      filters: {
        statement_type: '',
        partner: '',
        status: ''
      }
    }
  },

  computed: {
    hasFilters() {
      return this.filters.statement_type || this.filters.partner || this.filters.status
    },
    filteredPartnerList() {
      if (this.form.statement_type === 'customer') {
        return this.customerList
      } else if (this.form.statement_type === 'supplier') {
        return this.supplierList
      }
      return this.partnerList
    }
  },

  created() {
    this.loadData()
    this.fetchStats()
    this.fetchPartners()
  },

  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ...(this.filters.statement_type && { statement_type: this.filters.statement_type }),
        ...(this.filters.partner && { partner: this.filters.partner }),
        ...(this.filters.status && { status: this.filters.status })
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
          draft_count: list.filter(s => s.status === 'draft').length,
          confirmed_count: list.filter(s => s.status === 'confirmed').length,
          total_balance: list.reduce((sum, s) => sum + (s.closing_balance || 0), 0)
        }
      } catch (error) {
        this.stats = {}
      } finally {
        this.statsLoading = false
      }
    },

    async fetchPartners() {
      try {
        const [customerRes, supplierRes] = await Promise.all([
          customerAPI.getList({ page_size: 1000 }),
          supplierAPI.getList({ page_size: 1000 })
        ])
        this.customerList = (customerRes.results || []).map(c => ({ ...c, type: 'customer' }))
        this.supplierList = (supplierRes.results || []).map(s => ({ ...s, type: 'supplier' }))
        this.partnerList = [...this.customerList, ...this.supplierList]
      } catch (error) {
        // 静默处理
      }
    },

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filters = { statement_type: '', partner: '', status: '' }
      this.currentPage = 1
      this.loadData()
    },

    async handleView(row) {
      try {
        const response = await statementAPI.getDetail(row.id)
        this.currentStatement = response
        this.detailDialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '获取对账单详情失败')
      }
    },

    handleCreate() {
      this.form = { ...FORM_INITIAL, statement_date: new Date() }
      this.formDialogVisible = true
    },

    async handleGenerate() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return

        this.submitting = true
        try {
          const data = {
            statement_type: this.form.statement_type,
            partner: this.form.partner,
            period_start: this.form.period[0],
            period_end: this.form.period[1],
            statement_date: this.form.statement_date,
            notes: this.form.notes
          }
          await statementAPI.create(data)
          ErrorHandler.showSuccess('生成成功')
          this.formDialogVisible = false
          this.loadData()
          this.fetchStats()
        } catch (error) {
          ErrorHandler.showMessage(error, '生成失败')
        } finally {
          this.submitting = false
        }
      })
    },

    handleConfirm(row) {
      this.currentStatement = row
      this.confirmForm.confirm_notes = ''
      this.confirmDialogVisible = true
    },

    async handleSaveConfirm() {
      this.confirming = true
      try {
        await statementAPI.confirm(this.currentStatement.id, this.confirmForm)
        ErrorHandler.showSuccess('确认成功')
        this.confirmDialogVisible = false
        this.loadData()
        this.fetchStats()
      } catch (error) {
        ErrorHandler.showMessage(error, '确认失败')
      } finally {
        this.confirming = false
      }
    },

    handleExport(row) {
      ErrorHandler.showInfo('导出功能开发中')
      console.log('Export:', row.id)
    },

    handlePrint() {
      window.print()
    },

    getStatusType(status) {
      const typeMap = {
        draft: 'info',
        confirmed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || ''
    }
  }
}
</script>

<style scoped>
.statement-container {
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

.balance-summary {
  margin-top: 20px;
}

.balance-summary h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.balance-item {
  text-align: center;
  padding: 10px 0;
}

.balance-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.balance-label.debit {
  color: #67c23a;
}

.balance-label.credit {
  color: #f56c6c;
}

.balance-label.closing {
  color: #409eff;
}

.balance-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}
</style>
