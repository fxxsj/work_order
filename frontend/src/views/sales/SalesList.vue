<!-- 销售订单管理 -->
<template>
  <div class="sales-order-container">
    <!-- 搜索和操作区域 -->
    <div class="search-section">
      <el-form :model="filters" inline @submit.native.prevent="handleSearch">
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="订单号/客户名称" clearable @keyup.enter.native="handleSearch" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="订单状态" clearable style="width: 150px;">
            <el-option label="全部" value=""></el-option>
            <el-option label="草稿" value="draft"></el-option>
            <el-option label="已提交" value="submitted"></el-option>
            <el-option label="已审核" value="approved"></el-option>
            <el-option label="生产中" value="in_production"></el-option>
            <el-option label="已完成" value="completed"></el-option>
            <el-option label="已取消" value="cancelled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="付款状态">
          <el-select v-model="filters.payment_status" placeholder="付款状态" clearable style="width: 150px;">
            <el-option label="全部" value=""></el-option>
            <el-option label="未付款" value="unpaid"></el-option>
            <el-option label="部分付款" value="partial"></el-option>
            <el-option label="已付款" value="paid"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search">搜索</el-button>
          <el-button @click="handleReset" icon="el-icon-refresh-right">重置</el-button>
          <el-button type="success" @click="handleAdd" icon="el-icon-plus">新建销售订单</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      border
      stripe
      style="width: 100%"
      @sort-change="handleSortChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="order_number" label="订单号" width="150" fixed="left">
        <template slot-scope="scope">
          <el-link type="primary" @click="handleView(scope.row)">
            {{ scope.row.order_number }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="customer_name" label="客户名称" width="150" show-overflow-tooltip />
      <el-table-column prop="order_date" label="订单日期" width="120" />
      <el-table-column prop="delivery_date" label="交货日期" width="120">
        <template slot-scope="scope">
          <span :class="{ 'text-danger': isOverdue(scope.row) }">
            {{ scope.row.delivery_date }}
            <el-tooltip v-if="isOverdue(scope.row)" content="已逾期" placement="top">
              <i class="el-icon-warning" style="color: #f56c6c;"></i>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="total_amount" label="订单金额" width="120" align="right">
        <template slot-scope="scope">
          <span class="amount-text">¥{{ formatAmount(scope.row.total_amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="订单状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)" effect="plain">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payment_status" label="付款状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="getPaymentStatusType(scope.row.payment_status)" effect="plain">
            {{ getPaymentStatusText(scope.row.payment_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="items_count" label="明细数" width="80" align="center">
        <template slot-scope="scope">
          <el-tag size="mini" type="info">{{ scope.row.items_count || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template slot-scope="scope">
          <div class="action-buttons">
            <el-tooltip v-if="canEdit(scope.row)" content="编辑订单" placement="top">
              <el-button size="mini" type="primary" @click="handleEdit(scope.row)" icon="el-icon-edit" />
            </el-tooltip>
            <el-tooltip v-if="scope.row.status === 'draft'" content="提交审核" placement="top">
              <el-button size="mini" type="success" @click="handleSubmit(scope.row)" icon="el-icon-upload2" />
            </el-tooltip>
            <template v-if="scope.row.status === 'submitted'">
              <el-tooltip content="审核通过" placement="top">
                <el-button size="mini" type="success" @click="handleApprove(scope.row)" icon="el-icon-check" />
              </el-tooltip>
              <el-tooltip content="审核拒绝" placement="top">
                <el-button size="mini" type="warning" @click="handleReject(scope.row)" icon="el-icon-close" />
              </el-tooltip>
            </template>
            <el-dropdown @command="(cmd) => handleCommand(cmd, scope.row)" trigger="click">
              <el-button size="mini" type="text" icon="el-icon-more" />
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="detail">
                  <i class="el-icon-view"></i> 查看详情
                </el-dropdown-item>
                <el-dropdown-item command="cancel" v-if="canCancel(scope.row)" divided>
                  <i class="el-icon-remove-outline"></i> 取消订单
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <i class="el-icon-delete"></i> 删除订单
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
      <template slot="empty">
        <el-empty description="暂无销售订单数据">
          <el-button type="primary" @click="handleAdd">创建销售订单</el-button>
        </el-empty>
      </template>
    </el-table>

    <!-- 分页 -->
    <Pagination
      :current-page="pagination.page"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    />

    <!-- 新建/编辑订单对话框 -->
    <el-dialog
      :title="dialogMode === 'add' ? '新建销售订单' : '编辑销售订单'"
      :visible.sync="dialogVisible"
      width="80%"
      :close-on-click-modal="false"
      @closed="handleDialogClose"
    >
      <div v-if="submitErrors.length" style="color: red; margin-bottom: 10px;">
        <div v-for="error in submitErrors" :key="error">{{ error }}</div>
      </div>
      <sales-order-form
        v-if="dialogVisible"
        :form-data="submitForm"
        :dialog-mode="dialogMode"
        @submit="handleFormSubmit"
        @cancel="dialogVisible = false"
      />
    </el-dialog>

    <!-- 审核/拒绝对话框 -->
    <el-dialog title="审核销售订单" :visible.sync="approveVisible" width="50%">
      <div v-if="approveErrors.length" style="color: red; margin-bottom: 10px;">
        <div v-for="error in approveErrors" :key="error">{{ error }}</div>
      </div>
      <el-form :model="approveForm">
        <el-form-item label="审核意见">
          <el-input v-model="approveForm.approval_comment" type="textarea" rows="4" placeholder="请输入审核意见"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApprove">通过</el-button>
        <el-button type="danger" @click="confirmReject">拒绝</el-button>
      </span>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog
      title="销售订单详情"
      :visible.sync="detailVisible"
      width="90%"
      :close-on-click-modal="false"
      @closed="handleDetailClose"
    >
      <sales-order-detail
        v-if="detailVisible && currentOrderId"
        :order-id="currentOrderId"
        @refresh="fetchData"
        @edit="handleEditFromDetail"
        @close="detailVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script>
import { getSalesOrderList, createSalesOrder, updateSalesOrder, deleteSalesOrder, getSalesOrderDetail, approveSalesOrder, cancelSalesOrder, submitSalesOrder } from '@/api/sales'
import SalesOrderForm from './Form.vue'
import SalesOrderDetail from './Detail.vue'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'SalesOrderList',
  components: {
    SalesOrderForm,
    SalesOrderDetail,
    Pagination
  },
  data() {
    return {
      loading: false,
      tableData: [],
      filters: {
        search: '',
        status: '',
        payment_status: ''
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      dialogVisible: false,
      dialogMode: 'add',
      submitForm: null,
      submitErrors: [],
      approveForm: {
        approval_comment: '',
        approveErrors: []
      },
      approveErrors: [],
      approveVisible: false,
      approveOrder: null,
      detailVisible: false,
      currentOrderId: null
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize,
          search: this.filters.search || undefined,
          status: this.filters.status || undefined,
          payment_status: this.filters.payment_status || undefined
        }
        const response = await getSalesOrderList(params)
        this.tableData = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        this.$message.error('获取销售订单列表失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.fetchData()
    },
    handleReset() {
      this.filters = { search: '', status: '', payment_status: '' }
      this.pagination.page = 1
      this.fetchData()
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.page = 1
      this.fetchData()
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.fetchData()
    },
    handleSortChange(column) {
      if (!column.prop) return
    },
    handleView(row) {
      this.currentOrderId = row.id
      this.detailVisible = true
    },
    handleAdd() {
      this.dialogMode = 'add'
      this.submitForm = {}
      this.submitErrors = []
      this.dialogVisible = true
    },
    async handleEdit(row) {
      try {
        const response = await getSalesOrderDetail(row.id)
        this.dialogMode = 'edit'
        this.submitForm = response
        this.submitErrors = []
        this.dialogVisible = true
      } catch (error) {
        this.$message.error('获取订单详情失败')
      }
    },
    handleDelete(row) {
      this.$confirm(`确定要删除销售订单"${row.order_number}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteSalesOrder(row.id)
          this.$message.success('删除成功')
          this.fetchData()
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => {})
    },
    handleSubmit(row) {
      this.$confirm(`确定要提交销售订单"${row.order_number}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await submitSalesOrder(row.id)
          this.$message.success('提交成功')
          this.fetchData()
        } catch (error) {
          const errors = error.response?.data?.errors || []
          this.$message.error(errors[0] || '提交失败')
        }
      }).catch(() => {})
    },
    async handleFormSubmit(formData) {
      try {
        if (this.dialogMode === 'add') {
          await createSalesOrder(formData)
          this.$message.success('创建成功')
        } else {
          await updateSalesOrder(this.submitForm.id, formData)
          this.$message.success('更新成功')
        }
        this.dialogVisible = false
        this.fetchData()
      } catch (error) {
        const responseData = error.response?.data || {}
        this.submitErrors = responseData.errors ||
          responseData.detail ? [responseData.detail] :
          Object.keys(responseData).length > 0 ?
            Object.entries(responseData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`) :
            ['保存失败，请检查输入']
        if (this.submitErrors.length > 0) {
          this.$message.error(this.submitErrors[0])
        }
      }
    },
    handleApprove(row) {
      this.approveOrder = row
      this.approveForm.approval_comment = ''
      this.approveErrors = []
      this.approveVisible = true
    },
    async confirmApprove() {
      try {
        await approveSalesOrder(this.approveOrder.id, { approval_comment: this.approveForm.approval_comment })
        this.$message.success('审核通过')
        this.approveVisible = false
        this.fetchData()
      } catch (error) {
        this.approveErrors = error.response?.data?.errors || []
        this.$message.error('审核失败')
      }
    },
    handleReject(row) {
      this.approveOrder = row
      this.approveForm.approval_comment = ''
      this.approveErrors = []
      this.approveVisible = true
    },
    async confirmReject() {
      try {
        await cancelSalesOrder(this.approveOrder.id, { reason: this.approveForm.approval_comment })
        this.$message.success('已拒绝')
        this.approveVisible = false
        this.fetchData()
      } catch (error) {
        this.approveErrors = error.response?.data?.errors || []
        this.$message.error('拒绝失败')
      }
    },
    handleCancel(row) {
      this.$confirm(`确定要取消销售订单"${row.order_number}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await cancelSalesOrder(row.id, { reason: '用户取消' })
          this.$message.success('已取消')
          this.fetchData()
        } catch (error) {
          this.$message.error('取消失败')
        }
      }).catch(() => {})
    },
    handleCommand(command, row) {
      const commands = {
        detail: () => this.handleView(row),
        cancel: () => this.handleCancel(row),
        delete: () => this.handleDelete(row)
      }
      commands[command]?.()
    },
    handleDialogClose() {
      this.submitForm = null
      this.submitErrors = []
    },
    handleDetailClose() {
      this.currentOrderId = null
    },
    async handleEditFromDetail(orderId) {
      try {
        const response = await getSalesOrderDetail(orderId)
        this.dialogMode = 'edit'
        this.submitForm = response
        this.submitErrors = []
        this.detailVisible = false
        this.dialogVisible = true
      } catch (error) {
        this.$message.error('获取订单详情失败')
      }
    },
    getStatusType(status) {
      const typeMap = {
        draft: 'info',
        submitted: 'warning',
        approved: 'primary',
        in_production: 'success',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'info'
    },
    getStatusText(status) {
      const statusMap = {
        draft: '草稿',
        submitted: '已提交',
        approved: '已审核',
        in_production: '生产中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || '未知'
    },
    getPaymentStatusType(status) {
      const typeMap = {
        unpaid: 'danger',
        partial: 'warning',
        paid: 'success'
      }
      return typeMap[status] || 'info'
    },
    getPaymentStatusText(status) {
      const statusMap = {
        unpaid: '未付款',
        partial: '部分付款',
        paid: '已付款'
      }
      return statusMap[status] || '未知'
    },
    canEdit(row) {
      return row.status === 'draft'
    },
    canCancel(row) {
      return ['draft', 'submitted'].includes(row.status)
    },
    isOverdue(row) {
      if (!row.delivery_date) return false
      const deliveryDate = new Date(row.delivery_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return deliveryDate < today && !['completed', 'cancelled'].includes(row.status)
    },
    formatAmount(amount) {
      if (!amount) return '0.00'
      return parseFloat(amount).toFixed(2)
    }
  }
}
</script>

<style scoped>
.sales-order-container {
  padding: 20px;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
}

.action-buttons .el-button {
  margin-left: 0;
  padding: 5px 8px;
}

.amount-text {
  font-weight: 600;
  color: #303133;
}

.text-danger {
  color: #f56c6c;
}
</style>
