<!-- 销售订单管理 -->
<template>
  <div class="sales-order-container">
    <!-- 搜索和操作区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="搜索">
          <el-input v-model="searchForm.search" placeholder="订单号/客户名称" clearable @keyup.enter.native="handleSearch" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="订单状态" clearable style="width: 150px;">
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
          <el-select v-model="searchForm.payment_status" placeholder="付款状态" clearable style="width: 150px;">
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
      <el-table-column prop="order_number" label="订单号" width="120" />
      <el-table-column prop="customer_name" label="客户名称" width="120" />
      <el-table-column prop="order_date" label="订单日期" width="120" />
      <el-table-column prop="delivery_date" label="交货日期" width="120" />
      <el-table-column prop="total_amount" label="总金额" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payment_status" label="付款状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="getPaymentStatusType(scope.row.payment_status)">
            {{ getPaymentStatusText(scope.row.payment_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            @click="handleView(scope.row)"
            icon="el-icon-view"
          >
            查看
          </el-button>
          <el-button
            v-if="canEdit(scope.row)"
            size="mini"
            type="primary"
            @click="handleEdit(scope.row)"
            icon="el-icon-edit"
          >
            编辑
          </el-button>
          <el-button
            size="mini"
            type="warning"
            @click="handleSubmit(scope.row)"
            icon="el-icon-s-check"
            v-if="scope.row.status === 'draft'"
          >
            提交
          </el-button>
          <el-button
            size="mini"
            type="success"
            @click="handleApprove(scope.row)"
            icon="el-icon-s-check"
            v-if="scope.row.status === 'submitted'"
          >
            审核
          </el-button>
          <el-dropdown @command="handleCommand(scope.row)">
            <el-button size="mini" type="text" icon="el-icon-more">
              更多
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleDetail(scope.row)">详情</el-dropdown-item>
              <el-dropdown-item @click.native="handleCancel(scope.row)" v-if="scope.row.status === 'submitted'">取消订单</el-dropdown-item>
              <el-dropdown-item @click.native="handleApprove(scope.row)" v-if="scope.row.status === 'submitted'">审核通过</el-dropdown-item>
              <el-dropdown-item @click.native="handleReject(scope.row)" v-if="scope.row.status === 'submitted'">审核拒绝</el-dropdown-item>
              <el-dropdown-item @click.native="handleDelete(scope.row)" divided>删除订单</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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
        :total="pagination.total"
        layout="total, sizes, prev, pager, jumper"
      />
    </div>

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
    <el-dialog
      title="审核销售订单"
      :visible.sync="approveVisible"
      width="50%"
    >
      <div v-if="approveForm.approveErrors.length" style="color: red; margin-bottom: 10px;">
        <div v-for="error in approveForm.approveErrors" :key="error">{{ error }}</div>
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
  </div>
</template>

<script>
import { getSalesOrderList, createSalesOrder, updateSalesOrder, deleteSalesOrder, getSalesOrderDetail, approveSalesOrder, cancelSalesOrder, submitSalesOrder } from '@/api/sales'
import { mapState } from 'vuex'
import SalesOrderForm from './Form.vue'

export default {
  name: 'SalesOrderList',
  components: {
    SalesOrderForm
  },
  data() {
    return {
      loading: false,
      tableData: [],
      searchForm: {
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
      approveVisible: false,
      approveOrder: null,
      cancelForm: {
        reason: '',
        cancelErrors: []
      },
      detailVisible: false,
      currentOrder: null,
      currentOrderId: null
    }
  },
  computed: {
    ...mapState({
      currentUser: state => state.user.currentUser,
      isAuthenticated: state => state.user.isAuthenticated
    }),
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
    handleSortChange(column) {
      // 处理排序变化
      if (!column.prop) return
      // 可以根据需要实现排序逻辑
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
          if (error.response && error.response.data) {
            const errors = error.response.data.errors || []
            if (errors.length > 0) {
              this.$message.error(errors[0])
            } else {
              this.$message.error('提交失败')
            }
          } else {
            this.$message.error('提交失败')
          }
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
        console.error('[ERROR] Form submit error:', error)
        if (error.response && error.response.data) {
          // 尝试从不同的字段获取错误信息
          const responseData = error.response.data
          this.submitErrors = responseData.errors || []

          // 如果没有 errors 字段，尝试其他可能的字段
          if (this.submitErrors.length === 0) {
            if (responseData.detail) {
              this.submitErrors = [responseData.detail]
            } else if (responseData.non_field_errors) {
              this.submitErrors = responseData.non_field_errors
            } else if (typeof responseData === 'string') {
              this.submitErrors = [responseData]
            } else {
              // 尝试将所有错误收集起来
              const allErrors = []
              for (const key in responseData) {
                if (Array.isArray(responseData[key])) {
                  allErrors.push(`${key}: ${responseData[key].join(', ')}`)
                }
              }
              this.submitErrors = allErrors.length > 0 ? allErrors : ['保存失败，请检查输入']
            }
          }

          if (this.submitErrors.length > 0) {
            this.$message.error(this.submitErrors[0])
          }
        } else {
          this.$message.error('保存失败')
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
        await approveSalesOrder(this.approveOrder.id, { approval_comment: this.approveForm.approval_comment })
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
    handleReject(row) {
      if (!row) return
      this.approveOrder = row
      this.approveForm.approval_comment = ''
      this.approveForm.approveErrors = []
      this.approveVisible = true
    },
    handleCancel(row) {
      if (!row) return
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
    async confirmReject() {
      try {
        await cancelSalesOrder(this.approveOrder.id, { reason: this.approveForm.reason })
        this.$message.success('已取消')
        this.approveVisible = false
        this.fetchData()
      } catch (error) {
        if (error.response && error.response.data) {
          this.approveErrors = error.response.data.errors || []
          this.$message.error('取消失败')
        } else {
          this.$message.error('取消失败')
        }
      }
    },
    handleDetail(row) {
      this.currentOrderId = row.id
      this.detailVisible = true
    },
    handleCommand(command, row) {
      switch (command) {
        case 'handleView':
          this.handleView(row)
          break
        case 'handleDetail':
          this.handleDetail(row)
          break
        case 'handleCancel':
          this.handleCancel(row)
          break
        case 'handleApprove':
          this.handleApprove(row)
          break
        case 'handleReject':
          this.handleReject(row)
          break
        case 'handleDelete':
          this.handleDelete(row)
          break
      }
    },
    handleDialogClose() {
      this.submitForm = null
      this.submitErrors = []
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
    }
  }
}
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
