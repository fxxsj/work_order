<template>
  <div class="page-container">
    <!-- 搜索栏：使用 header-section 布局 -->
    <div class="header-section">
      <div class="filter-group">
        <el-input
          v-model="searchText"
          placeholder="搜索采购单号"
          prefix-icon="el-icon-search"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleSearch"
          @clear="handleSearch"
        />
        <el-input
          v-model="filters.supplier_name"
          placeholder="供应商名称"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-model="filters.status"
          placeholder="状态"
          clearable
          style="width: 120px"
          @change="handleSearch"
        >
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-button icon="el-icon-refresh" @click="resetFilters">
          重置
        </el-button>
      </div>
      <div class="action-group">
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="showCreateDialog"
        >
          新增采购单
        </el-button>
        <el-button icon="el-icon-warning" @click="showLowStockDialog">
          库存预警
        </el-button>
      </div>
    </div>

    <el-card shadow="never">
      <!-- 数据表格：添加条件渲染 -->
      <el-table
        v-if="tableData.length > 0"
        v-loading="loading"
        :data="tableData"
        border
        stripe
      >
        <el-table-column prop="order_number" label="采购单号" width="150" />
        <el-table-column prop="supplier_name" label="供应商" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="items_count"
          label="明细数量"
          width="100"
          align="center"
        />
        <el-table-column
          prop="total_amount"
          label="总金额"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ Number(scope.row.total_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="received_progress" label="收货进度" width="120">
          <template slot-scope="scope">
            <el-progress
              :percentage="Math.round(scope.row.received_progress || 0)"
              :color="getProgressColor(scope.row.received_progress)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="submitted_by_name" label="提交人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <!-- 操作列：使用下拉菜单收纳 -->
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'draft' && canEdit()"
              type="text"
              @click="showEditDialog(scope.row)"
            >
              编辑
            </el-button>
            <el-dropdown
              v-if="hasStatusActions(scope.row)"
              trigger="click"
              @command="(cmd) => handleStatusAction(cmd, scope.row)"
            >
              <el-button type="text">
                更多<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-if="scope.row.status === 'draft'" command="submit">
                  提交
                </el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status === 'submitted'" command="approve">
                  批准
                </el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status === 'submitted'" command="reject">
                  拒绝
                </el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status === 'approved'" command="placeOrder">
                  下单
                </el-dropdown-item>
                <el-dropdown-item v-if="scope.row.status === 'ordered'" command="receive">
                  收货
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="['draft', 'submitted', 'approved'].includes(scope.row.status)"
                  command="cancel"
                  divided
                >
                  <span style="color: #F56C6C">取消</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <el-empty v-if="!loading && tableData.length === 0" description="暂无采购单数据">
        <el-button v-if="canCreate()" type="primary" @click="showCreateDialog">
          创建第一个采购单
        </el-button>
      </el-empty>

      <!-- 分页 -->
      <Pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 表单对话框组件 -->
    <PurchaseFormDialog
      :visible.sync="dialogVisible"
      :form-data="form"
      :is-edit="isEditMode"
      @confirm="handleFormConfirm"
      @close="resetForm"
    />

    <!-- 详情对话框组件 -->
    <PurchaseDetailDialog
      ref="detailDialog"
      :visible.sync="detailDialogVisible"
      :purchase-id="currentPurchaseId"
    />

    <!-- 库存预警对话框组件 -->
    <LowStockAlertDialog
      :visible.sync="lowStockDialogVisible"
      @create-purchase="handleCreateFromLowStock"
    />
  </div>
</template>

<script>
import { purchaseOrderAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import Pagination from '@/components/common/Pagination.vue'
import ErrorHandler from '@/utils/errorHandler'
import {
  PurchaseFormDialog,
  PurchaseDetailDialog,
  LowStockAlertDialog
} from './components'

// 表单初始值常量
const FORM_INITIAL = {
  supplier: null,
  work_order_number: '',
  notes: '',
  items: []
}

// 状态选项
const STATUS_OPTIONS = [
  { label: '草稿', value: 'draft' },
  { label: '已提交', value: 'submitted' },
  { label: '已批准', value: 'approved' },
  { label: '已下单', value: 'ordered' },
  { label: '已收货', value: 'received' },
  { label: '已取消', value: 'cancelled' }
]

export default {
  name: 'PurchaseOrderList',

  components: {
    Pagination,
    PurchaseFormDialog,
    PurchaseDetailDialog,
    LowStockAlertDialog
  },

  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: purchaseOrderAPI,
      permissionPrefix: 'purchaseorder',

      // 状态选项
      statusOptions: STATUS_OPTIONS,

      // 表单数据
      form: { ...FORM_INITIAL },
      isEditMode: false,
      dialogVisible: false,

      // 详情对话框
      detailDialogVisible: false,
      currentPurchaseId: null,

      // 库存预警对话框
      lowStockDialogVisible: false
    }
  },

  created() {
    this.loadData()
  },

  methods: {
    /**
     * 获取数据（listPageMixin 要求实现）
     */
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        search: this.searchText || undefined,
        supplier_name: this.filters.supplier_name || undefined,
        status: this.filters.status || undefined
      }
      return await this.apiService.getList(params)
    },

    /**
     * 显示创建对话框
     */
    showCreateDialog() {
      this.isEditMode = false
      this.form = { ...FORM_INITIAL, items: [] }
      this.dialogVisible = true
    },

    /**
     * 显示编辑对话框
     */
    showEditDialog(row) {
      this.isEditMode = true
      this.form = {
        id: row.id,
        supplier: row.supplier,
        work_order_number: row.work_order_number || '',
        notes: row.notes || '',
        items: (row.items || []).map(item => ({
          id: item.id,
          material: item.material,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      }
      this.dialogVisible = true
    },

    /**
     * 重置表单
     */
    resetForm() {
      this.form = { ...FORM_INITIAL, items: [] }
      this.isEditMode = false
    },

    /**
     * 处理表单确认
     */
    async handleFormConfirm(formData) {
      try {
        // 准备提交数据
        const data = {
          supplier: formData.supplier,
          work_order_number: formData.work_order_number,
          notes: formData.notes,
          items_data: formData.items.map(item => ({
            material: item.material,
            quantity: item.quantity,
            unit_price: item.unit_price
          }))
        }

        if (this.isEditMode) {
          await this.apiService.update(formData.id, data)
          ErrorHandler.showSuccess('更新成功')
        } else {
          await this.apiService.create(data)
          ErrorHandler.showSuccess('创建成功')
        }

        this.dialogVisible = false
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, this.isEditMode ? '更新' : '创建')
      }
    },

    /**
     * 查看详情
     */
    handleView(row) {
      this.currentPurchaseId = row.id
      this.$refs.detailDialog.setDetailData(row)
      this.detailDialogVisible = true
    },

    /**
     * 检查是否有状态操作按钮
     */
    hasStatusActions(row) {
      const actionsMap = {
        draft: ['submit', 'cancel'],
        submitted: ['approve', 'reject', 'cancel'],
        approved: ['placeOrder', 'cancel'],
        ordered: ['receive']
      }
      return (actionsMap[row.status] || []).length > 0
    },

    /**
     * 处理状态操作
     */
    handleStatusAction(command, row) {
      const actionMap = {
        submit: this.handleSubmit,
        approve: this.handleApprove,
        reject: this.handleReject,
        placeOrder: this.handlePlaceOrder,
        receive: this.handleReceive,
        cancel: this.handleCancel
      }
      const action = actionMap[command]
      if (action) {
        action.call(this, row)
      }
    },

    /**
     * 提交采购单
     */
    async handleSubmit(row) {
      try {
        await ErrorHandler.confirm(`确定要提交采购单"${row.order_number}"吗？`)
        await this.apiService.submit(row.id)
        ErrorHandler.showSuccess('提交成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '提交')
        }
      }
    },

    /**
     * 批准采购单
     */
    async handleApprove(row) {
      try {
        await ErrorHandler.confirm(`确定要批准采购单"${row.order_number}"吗？`)
        await this.apiService.approve(row.id)
        ErrorHandler.showSuccess('批准成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '批准')
        }
      }
    },

    /**
     * 拒绝采购单
     */
    async handleReject(row) {
      try {
        const { value } = await this.$prompt('请输入拒绝原因', '拒绝采购单', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /\S+/,
          inputErrorMessage: '拒绝原因不能为空'
        })
        await this.apiService.reject(row.id, { rejection_reason: value })
        ErrorHandler.showSuccess('拒绝成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '拒绝')
        }
      }
    },

    /**
     * 下单
     */
    async handlePlaceOrder(row) {
      try {
        await ErrorHandler.confirm(`确定要下单采购单"${row.order_number}"吗？`)
        await this.apiService.placeOrder(row.id, {
          ordered_date: new Date().toISOString().split('T')[0]
        })
        ErrorHandler.showSuccess('下单成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '下单')
        }
      }
    },

    /**
     * 收货
     */
    async handleReceive(row) {
      try {
        await ErrorHandler.confirm(`确定要收货采购单"${row.order_number}"吗？`)
        const items = (row.items || []).map(item => ({
          id: item.id,
          received_quantity: item.quantity
        }))
        await this.apiService.receive(row.id, { items })
        ErrorHandler.showSuccess('收货成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '收货')
        }
      }
    },

    /**
     * 取消采购单
     */
    async handleCancel(row) {
      try {
        await ErrorHandler.confirm(`确定要取消采购单"${row.order_number}"吗？`)
        await this.apiService.cancel(row.id)
        ErrorHandler.showSuccess('取消成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '取消')
        }
      }
    },

    /**
     * 显示库存预警对话框
     */
    showLowStockDialog() {
      this.lowStockDialogVisible = true
    },

    /**
     * 从库存预警创建采购单
     */
    handleCreateFromLowStock() {
      this.showCreateDialog()
    },

    /**
     * 获取状态类型
     */
    getStatusType(status) {
      const map = {
        draft: 'info',
        submitted: 'warning',
        approved: 'success',
        ordered: 'primary',
        received: 'success',
        cancelled: 'danger'
      }
      return map[status] || 'info'
    },

    /**
     * 获取进度条颜色
     */
    getProgressColor(percentage) {
      if (percentage >= 100) return '#67c23a'
      if (percentage >= 50) return '#e6a23c'
      return '#f56c6c'
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
