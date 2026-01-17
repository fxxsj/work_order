<template>
  <div class="sales-order-list">
    <el-card>
      <!-- 搜索和筛选 -->
      <el-form :inline="true" :model="searchForm" class="search-form" @keyup.enter.native="handleSearch">
        <el-form-item label="订单号/客户">
          <el-input v-model="searchForm.search" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已审核" value="approved" />
            <el-option label="生产中" value="in_production" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款状态">
          <el-select v-model="searchForm.payment_status" placeholder="请选择" clearable>
            <el-option label="未付款" value="unpaid" />
            <el-option label="部分付款" value="partial" />
            <el-option label="已付款" value="paid" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新建销售订单</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_number" label="订单号" width="150">
          <template slot-scope="scope">
            {{ scope.row.order_number || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="客户" width="150">
          <template slot-scope="scope">
            {{ scope.row.customer_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_status" label="付款状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getPaymentStatusType(scope.row.payment_status)">
              {{ scope.row.payment_status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="120" align="right">
          <template slot-scope="scope">
            ¥{{ scope.row.total_amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="order_date" label="订单日期" width="110" />
        <el-table-column prop="delivery_date" label="交货日期" width="110" />
        <el-table-column prop="submitted_by_name" label="提交人" width="100" />
        <el-table-column prop="approved_by_name" label="审核人" width="100" />
        <el-table-column label="操作" width="300" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="text" @click="handleView(scope.row)">查看</el-button>
            <el-button v-if="canEdit(scope.row)" size="mini" type="text" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button v-if="canSubmit(scope.row)" size="mini" type="text" @click="handleSubmit(scope.row)">提交</el-button>
            <el-button v-if="canApprove(scope.row)" size="mini" type="text" @click="handleApprove(scope.row)">审核</el-button>
            <el-button v-if="canStartProduction(scope.row)" size="mini" type="text" @click="handleStartProduction(scope.row)">开始生产</el-button>
            <el-button v-if="canComplete(scope.row)" size="mini" type="text" @click="handleComplete(scope.row)">完成</el-button>
            <el-button v-if="canCancel(scope.row)" size="mini" type="text" @click="handleCancel(scope.row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="80%" top="5vh" @close="handleDialogClose">
      <sales-order-form v-if="dialogVisible" :form-data="form" :dialog-mode="dialogMode" @submit="handleSubmitForm" @cancel="dialogVisible = false" />
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog title="销售订单详情" :visible.sync="detailVisible" width="80%" top="5vh">
      <sales-order-detail v-if="detailVisible" :order-id="currentOrderId" @close="detailVisible = false" />
    </el-dialog>

    <!-- 提交确认对话框 -->
    <el-dialog title="提交确认" :visible.sync="submitVisible" width="500px">
      <p>确定要提交销售订单 "{{ submitOrder ? submitOrder.order_number : '' }}" 吗？</p>
      <el-alert v-if="submitErrors.length > 0" title="验证错误" type="error" :closable="false">
        <ul>
          <li v-for="(error, index) in submitErrors" :key="index">{{ error }}</li>
        </ul>
      </el-alert>
      <span slot="footer" class="dialog-footer">
        <el-button @click="submitVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSubmit" :disabled="submitErrors.length > 0">确定提交</el-button>
      </span>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog title="审核订单" :visible.sync="approveVisible" width="500px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="审核意见">
          <el-input v-model="approveForm.approval_comment" type="textarea" :rows="3" placeholder="请输入审核意见" />
        </el-form-item>
      </el-form>
      <el-alert v-if="approveErrors.length > 0" title="验证错误" type="error" :closable="false">
        <ul>
          <li v-for="(error, index) in approveErrors" :key="index">{{ error }}</li>
        </ul>
      </el-alert>
      <span slot="footer" class="dialog-footer">
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">拒绝</el-button>
        <el-button type="primary" @click="confirmApprove" :disabled="approveErrors.length > 0">通过</el-button>
      </span>
    </el-dialog>

    <!-- 取消对话框 -->
    <el-dialog title="取消订单" :visible.sync="cancelVisible" width="500px">
      <el-form :model="cancelForm" label-width="80px">
        <el-form-item label="取消原因">
          <el-input v-model="cancelForm.reason" type="textarea" :rows="3" placeholder="请输入取消原因" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCancel">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  getSalesOrderList,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  submitSalesOrder,
  approveSalesOrder,
  rejectSalesOrder,
  startProduction,
  completeSalesOrder,
  cancelSalesOrder
} from '@/api/sales'
import SalesOrderForm from './Form.vue'
import SalesOrderDetail from './Detail.vue'

export default {
  name: 'SalesOrderList',
  components: {
    SalesOrderForm,
    SalesOrderDetail
  },
  data() {
    return {
      loading: false,
      searchForm: {
        search: '',
        status: '',
        payment_status: ''
      },
      tableData: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      dialogVisible: false,
      dialogMode: 'add', // 'add' or 'edit'
      form: null,
      detailVisible: false,
      currentOrderId: null,
      submitVisible: false,
      submitOrder: null,
      submitErrors: [],
      approveVisible: false,
      approveOrder: null,
      approveForm: {
        approval_comment: ''
      },
      approveErrors: [],
      cancelVisible: false,
      cancelOrder: null,
      cancelForm: {
        reason: ''
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogMode === 'add' ? '新建销售订单' : '编辑销售订单'
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize,
          search: this.searchForm.search || undefined,
          status: this.searchForm.status || undefined,
          payment_status: this.searchForm.payment_status || undefined
        }
        const response = await getSalesOrderList(params)
        this.tableData = response.results
        this.pagination.total = response.count
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
      this.searchForm = {
        search: '',
        status: '',
        payment_status: ''
      }
      this.pagination.page = 1
      this.fetchData()
    },
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.page = 1
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchData()
    },
    handleAdd() {
      this.dialogMode = 'add'
      this.form = {}
      this.dialogVisible = true
    },
    handleEdit(row) {
      this.dialogMode = 'edit'
      this.form = { ...row }
      this.dialogVisible = true
    },
    handleView(row) {
      this.currentOrderId = row.id
      this.detailVisible = true
    },
    handleDelete(row) {
      if (!row) return
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
      if (!row) return
      this.submitOrder = row
      this.submitErrors = []
      this.submitVisible = true
    },
    async confirmSubmit() {
      try {
        await submitSalesOrder(this.submitOrder.id)
        this.$message.success('提交成功')
        this.submitVisible = false
        this.fetchData()
      } catch (error) {
        if (error.response && error.response.data) {
          this.submitErrors = error.response.data.errors || []
          this.$message.error('提交失败')
        } else {
          this.$message.error('提交失败')
        }
      }
    },
    handleApprove(row) {
      if (!row) return
      this.approveOrder = row
      this.approveForm.approval_comment = ''
      this.approveErrors = []
      this.approveVisible = true
    },
    async confirmApprove() {
      try {
        await approveSalesOrder(this.approveOrder.id, this.approveForm)
        this.$message.success('审核通过')
        this.approveVisible = false
        this.fetchData()
      } catch (error) {
        if (error.response && error.response.data) {
          this.approveErrors = error.response.data.errors || []
          this.$message.error('审核失败')
        } else {
          this.$message.error('审核失败')
        }
      }
    },
    async confirmReject() {
      this.$prompt('请输入拒绝原因', '拒绝订单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /.+/,
        inputErrorMessage: '拒绝原因不能为空'
      }).then(async ({ value }) => {
        try {
          await rejectSalesOrder(this.approveOrder.id, { reason: value })
          this.$message.success('已拒绝')
          this.approveVisible = false
          this.fetchData()
        } catch (error) {
          this.$message.error('操作失败')
        }
      }).catch(() => {})
    },
    async handleStartProduction(row) {
      if (!row) return
      try {
        await startProduction(row.id)
        this.$message.success('已开始生产')
        this.fetchData()
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    async handleComplete(row) {
      if (!row) return
      try {
        await completeSalesOrder(row.id)
        this.$message.success('订单已完成')
        this.fetchData()
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    handleCancel(row) {
      if (!row) return
      this.cancelOrder = row
      this.cancelForm.reason = ''
      this.cancelVisible = true
    },
    async confirmCancel() {
      try {
        await cancelSalesOrder(this.cancelOrder.id, { reason: this.cancelForm.reason })
        this.$message.success('已取消')
        this.cancelVisible = false
        this.fetchData()
      } catch (error) {
        this.$message.error('操作失败')
      }
    },
    async handleSubmitForm(formData) {
      try {
        console.log('[DEBUG] Submitting sales order:', formData)
        
        // 检查用户认证状态
        if (!this.$store.getters['user/isAuthenticated']) {
          this.$message.warning('请先登录后再创建销售订单')
          this.$router.push('/login')
          return
        }
        
        console.log('[DEBUG] User authenticated, proceeding with order creation')
        
        if (this.dialogMode === 'add') {
          await createSalesOrder(formData)
          this.$message.success('创建成功')
        } else {
          await updateSalesOrder(formData.id, formData)
          this.$message.success('更新成功')
        }
        this.dialogVisible = false
        this.fetchData()
      } catch (error) {
        console.error('[ERROR] Save sales order failed:', error)
        console.error('[ERROR] Response data:', error.response?.data)
        
        // 显示详细错误信息
        let errorMsg = '保存失败'
        if (error.response?.data) {
          if (error.response.data.error) {
            errorMsg = error.response.data.error
          } else if (error.response.data.non_field_errors) {
            errorMsg = Object.entries(error.response.data.non_field_errors)
              .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
              .join('; ')
          }
        }
        
        // 如果是认证错误，跳转到登录页
        if (error.response?.status === 401) {
          this.$message.warning('登录已过期，请重新登录')
          this.$store.dispatch('user/clearUser')
          this.$router.push('/login')
          return
        }
        
        this.$message.error(errorMsg)
      }
    }
        this.dialogVisible = false
        this.fetchData()
      } catch (error) {
        console.error('[ERROR] Save sales order failed:', error)
        console.error('[ERROR] Response data:', error.response?.data)

        // 显示详细错误信息
        let errorMsg = '保存失败'
        if (error.response?.data) {
          if (error.response.data.error) {
            errorMsg = error.response.data.error
          } else if (error.response.data.non_field_errors) {
            errorMsg = Object.entries(error.response.data.non_field_errors)
              .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
              .join('; ')
          } else if (typeof error.response.data === 'string') {
            errorMsg = error.response.data
          }
        }
        this.$message.error(errorMsg)
      }
    },
    handleDialogClose() {
      this.form = null
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
    getPaymentStatusType(status) {
      const typeMap = {
        unpaid: 'danger',
        partial: 'warning',
        paid: 'success'
      }
      return typeMap[status] || 'info'
    },
    canEdit(row) {
      return row.status === 'draft'
    },
    canSubmit(row) {
      return row.status === 'draft'
    },
    canApprove(row) {
      return row.status === 'submitted'
    },
    canStartProduction(row) {
      return row.status === 'approved'
    },
    canComplete(row) {
      return row.status === 'approved' || row.status === 'in_production'
    },
    canCancel(row) {
      return !['completed', 'cancelled'].includes(row.status)
    }
  }
}
</script>
</script>

<style scoped>
.sales-order-list {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
