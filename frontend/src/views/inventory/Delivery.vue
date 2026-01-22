<template>
  <div class="delivery-container">
    <!-- 统计卡片（与 TaskStats 样式一致） -->
    <delivery-stats :stats="stats" :loading="statsLoading" />

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
            placeholder="发货状态"
            clearable
            style="width: 120px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option label="待发货" value="pending" />
            <el-option label="已发货" value="shipped" />
            <el-option label="运输中" value="in_transit" />
            <el-option label="已签收" value="received" />
            <el-option label="拒收" value="rejected" />
            <el-option label="已退货" value="returned" />
          </el-select>
          <el-input
            v-model="filters.tracking_number"
            placeholder="搜索物流单号"
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
            新建发货单
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
        <el-table-column prop="order_number" label="发货单号" width="150" />
        <el-table-column prop="customer_name" label="客户名称" width="150" />
        <el-table-column prop="sales_order_number" label="销售订单" width="150" />
        <el-table-column prop="receiver_name" label="收货人" width="100" />
        <el-table-column prop="receiver_phone" label="联系电话" width="120" />
        <el-table-column
          prop="delivery_address"
          label="送货地址"
          show-overflow-tooltip
          min-width="150"
        />
        <el-table-column prop="logistics_company" label="物流公司" width="120" />
        <el-table-column prop="tracking_number" label="物流单号" width="150">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.tracking_number"
              :href="getTrackingUrl(scope.row)"
              target="_blank"
            >
              {{ scope.row.tracking_number }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="发货日期" width="120" />
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
              v-if="canEdit() && scope.row.status === 'pending'"
              type="text"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canEdit() && scope.row.status === 'pending'"
              type="text"
              size="small"
              style="color: #E6A23C;"
              @click="handleShip(scope.row)"
            >
              发货
            </el-button>
            <el-button
              v-if="canEdit() && (scope.row.status === 'shipped' || scope.row.status === 'in_transit')"
              type="text"
              size="small"
              style="color: #67C23A;"
              @click="handleReceive(scope.row)"
            >
              签收
            </el-button>
            <el-button
              v-if="canEdit() && (scope.row.status === 'shipped' || scope.row.status === 'in_transit')"
              type="text"
              size="small"
              style="color: #E6A23C;"
              @click="handleReject(scope.row)"
            >
              拒收
            </el-button>
            <el-button
              v-if="canDelete() && scope.row.status === 'pending'"
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
        description="暂无发货单数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="hasFilters" type="primary" @click="handleReset">
          重置筛选
        </el-button>
        <el-button v-else-if="canCreate()" type="primary" @click="handleCreate">
          创建第一个发货单
        </el-button>
      </el-empty>
    </el-card>

    <!-- 发货详情对话框 -->
    <DeliveryDetailDialog
      :visible.sync="detailDialogVisible"
      :data="currentDelivery"
    />

    <!-- 签收对话框 -->
    <DeliveryReceiveDialog
      :visible.sync="receiveDialogVisible"
      :delivery="currentDelivery"
      :loading="receiving"
      @confirm="handleConfirmReceive"
    />

    <!-- 新建/编辑发货单对话框 -->
    <DeliveryFormDialog
      :visible.sync="formDialogVisible"
      :is-edit="isEdit"
      :submitting="submitting"
      :form="form"
      :customer-list="customerList"
      :sales-order-list="salesOrderList"
      :product-list="productList"
      @submit="handleSubmit"
      @sales-order-change="handleSalesOrderChange"
      @customer-change="handleCustomerChange"
    />
  </div>
</template>

<script>
import { deliveryOrderAPI, productStockAPI, salesOrderAPI, customerAPI } from '@/api/modules'
import { productAPI } from '@/api/modules'
import DeliveryStats from './components/DeliveryStats.vue'
import Pagination from '@/components/common/Pagination.vue'
import DeliveryDetailDialog from './components/DeliveryDetailDialog.vue'
import DeliveryReceiveDialog from './components/DeliveryReceiveDialog.vue'
import DeliveryFormDialog from './components/DeliveryFormDialog.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'

// 表单初始值常量
const FORM_INITIAL = {
  id: null,
  sales_order: null,
  customer: null,
  delivery_date: '',
  receiver_name: '',
  receiver_phone: '',
  delivery_address: '',
  logistics_company: '',
  tracking_number: '',
  freight: 0,
  package_count: 1,
  package_weight: '',
  notes: '',
  items_data: []
}

export default {
  name: 'DeliveryList',
  components: {
    DeliveryStats,
    Pagination,
    DeliveryDetailDialog,
    DeliveryReceiveDialog,
    DeliveryFormDialog
  },
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: deliveryOrderAPI,
      permissionPrefix: 'deliveryorder',

      // 页面状态
      statsLoading: false,
      submitting: false,
      receiving: false,

      // 数据
      customerList: [],
      salesOrderList: [],
      productList: [],
      stockList: [],
      currentDelivery: null,
      stats: {},

      // 对话框
      detailDialogVisible: false,
      formDialogVisible: false,
      receiveDialogVisible: false,
      isEdit: false,

      // 表单数据
      form: { ...FORM_INITIAL },

      // 筛选条件
      filters: {
        status: '',
        customer: '',
        tracking_number: ''
      },

      // 搜索防抖定时器
      searchTimer: null
    }
  },

  computed: {
    hasFilters() {
      return this.filters.status || this.filters.customer || this.filters.tracking_number
    }
  },

  created() {
    this.loadData()
    this.fetchStats()
    this.fetchCustomers()
    this.fetchSalesOrders()
    this.fetchProducts()
    this.fetchStocks()
  },

  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ...(this.filters.status && { status: this.filters.status }),
        ...(this.filters.customer && { customer: this.filters.customer }),
        ...(this.filters.tracking_number && { tracking_number: this.filters.tracking_number })
      }
      return await this.apiService.getList(params)
    },

    async fetchStats() {
      this.statsLoading = true
      try {
        // 使用后端 summary 接口获取统计数据
        const response = await this.apiService.getSummary()
        this.stats = {
          total: response.summary?.total_count || 0,
          pending: response.summary?.pending_count || 0,
          in_transit: (response.summary?.shipped_count || 0) + (response.summary?.in_transit_count || 0),
          received: response.summary?.received_count || 0
        }
      } catch (error) {
        // 降级：基于本地数据计算统计
        try {
          const response = await this.apiService.getList({ page_size: 1000 })
          const list = response.results || []
          this.stats = {
            total: list.length,
            pending: list.filter(d => d.status === 'pending').length,
            in_transit: list.filter(d => d.status === 'shipped' || d.status === 'in_transit').length,
            received: list.filter(d => d.status === 'received').length
          }
        } catch (e) {
          this.stats = {}
        }
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

    async fetchSalesOrders() {
      try {
        // 获取可用于发货的销售订单（已审核、生产中状态）
        const response = await salesOrderAPI.getList({
          page_size: 1000
        })
        // 去重处理：按 id 去重（确保唯一）
        const seen = new Set()
        this.salesOrderList = (response.results || []).filter(so => {
          // 只显示已审核或生产中的订单
          if (!['approved', 'in_production'].includes(so.status)) {
            return false
          }
          // 按 ID 去重
          if (seen.has(so.id)) {
            return false
          }
          seen.add(so.id)
          return true
        })
      } catch (error) {
        // 静默处理
      }
    },

    async fetchProducts() {
      try {
        const response = await productAPI.getList({ page_size: 1000 })
        this.productList = response.results || []
      } catch (error) {
        // 静默处理
      }
    },

    async fetchStocks() {
      try {
        const response = await productStockAPI.getList({ page_size: 1000 })
        this.stockList = response.results || []
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
      this.filters = { status: '', customer: '', tracking_number: '' }
      this.currentPage = 1
      this.loadData()
    },

    handleView(row) {
      this.currentDelivery = row
      this.detailDialogVisible = true
    },

    handleCreate() {
      this.isEdit = false
      this.resetForm()
      this.formDialogVisible = true
    },

    handleEdit(row) {
      this.isEdit = true
      this.form = {
        id: row.id,
        sales_order: row.sales_order,
        customer: row.customer,
        delivery_date: row.delivery_date || '',
        receiver_name: row.receiver_name || '',
        receiver_phone: row.receiver_phone || '',
        delivery_address: row.delivery_address || '',
        logistics_company: row.logistics_company || '',
        tracking_number: row.tracking_number || '',
        freight: row.freight || 0,
        package_count: row.package_count || 1,
        package_weight: row.package_weight || '',
        notes: row.notes || '',
        items_data: row.items ? row.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          notes: item.notes || ''
        })) : []
      }
      this.formDialogVisible = true
    },

    resetForm() {
      this.form = { ...FORM_INITIAL, items_data: [] }
    },

    async handleSalesOrderChange(value) {
      const salesOrder = this.salesOrderList.find(so => so.id === value)
      if (salesOrder && salesOrder.customer) {
        // 1. 自动填充客户信息
        this.form.customer = salesOrder.customer
        const customer = this.customerList.find(c => c.id === salesOrder.customer)
        if (customer) {
          this.form.receiver_name = customer.contact_person || ''
          this.form.receiver_phone = customer.contact_phone || ''
          this.form.delivery_address = customer.address || ''
        }

        // 2. 自动填充销售订单中的产品明细
        try {
          // 获取销售订单详情（包含 items）
          const orderDetail = await salesOrderAPI.getDetail(value)
          if (orderDetail && orderDetail.items && orderDetail.items.length > 0) {
            // 将销售订单明细转换为发货明细
            this.form.items_data = orderDetail.items.map(item => ({
              product: item.product,
              sales_order_item: item.id, // 关联销售订单明细
              quantity: item.quantity - (item.delivered_quantity || 0), // 待发货数量
              unit: item.unit || '件',
              unit_price: item.unit_price || 0,
              notes: ''
            })).filter(item => item.quantity > 0) // 只显示待发货的产品

            // 如果没有待发货的产品，提示用户
            if (this.form.items_data.length === 0) {
              this.$message.warning('该销售订单的所有产品已全部发货')
            }
          }
        } catch (error) {
          console.error('获取销售订单详情失败:', error)
        }
      }
    },

    handleCustomerChange(value) {
      const customer = this.customerList.find(c => c.id === value)
      if (customer) {
        this.form.receiver_name = customer.contact_person || ''
        this.form.receiver_phone = customer.contact_phone || ''
        this.form.delivery_address = customer.address || ''
      }
    },

    async handleSubmit() {
      this.submitting = true
      try {
        const data = { ...this.form }
        delete data.id

        if (this.isEdit) {
          await deliveryOrderAPI.update(this.form.id, data)
          ErrorHandler.showSuccess('发货单更新成功')
        } else {
          await deliveryOrderAPI.create(data)
          ErrorHandler.showSuccess('发货单创建成功')
        }

        this.formDialogVisible = false
        this.loadData()
        this.fetchStats()
      } catch (error) {
        ErrorHandler.showMessage(error, this.isEdit ? '更新发货单失败' : '创建发货单失败')
      } finally {
        this.submitting = false
      }
    },

    async handleShip(row) {
      try {
        await ErrorHandler.confirm('确认发货该订单？')
        await deliveryOrderAPI.ship(row.id, {})
        ErrorHandler.showSuccess('发货成功')
        this.loadData()
        this.fetchStats()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '发货失败')
        }
      }
    },

    async handleDelete(row) {
      try {
        await ErrorHandler.confirm('确定要删除此发货单吗？删除后无法恢复。')
        await deliveryOrderAPI.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        this.loadData()
        this.fetchStats()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '删除失败')
        }
      }
    },

    async handleReject(row) {
      try {
        const { value } = await this.$prompt('请输入拒收原因', '拒收确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /\S+/,
          inputErrorMessage: '拒收原因不能为空'
        })
        await deliveryOrderAPI.reject(row.id, { reject_reason: value })
        ErrorHandler.showSuccess('拒收处理成功，库存已回退')
        this.loadData()
        this.fetchStats()
      } catch (error) {
        if (error !== 'cancel' && error !== 'close') {
          ErrorHandler.showMessage(error, '拒收处理失败')
        }
      }
    },

    handleReceive(row) {
      this.currentDelivery = row
      this.receiveDialogVisible = true
    },

    async handleConfirmReceive(formData) {
      this.receiving = true
      try {
        await deliveryOrderAPI.receive(this.currentDelivery.id, formData)
        ErrorHandler.showSuccess('签收成功')
        this.receiveDialogVisible = false
        this.loadData()
        this.fetchStats()
      } catch (error) {
        ErrorHandler.showMessage(error, '签收失败')
      } finally {
        this.receiving = false
      }
    },

    getStatusType(status) {
      const typeMap = {
        pending: 'info',
        shipped: 'warning',
        in_transit: 'primary',
        received: 'success',
        rejected: 'danger',
        returned: 'info'
      }
      return typeMap[status] || ''
    },

    getTrackingUrl(delivery) {
      // 物流公司代码映射
      const companyMap = {
        顺丰速运: 'shunfeng',
        顺丰: 'shunfeng',
        中通快递: 'zhongtong',
        中通: 'zhongtong',
        圆通速递: 'yuantong',
        圆通: 'yuantong',
        申通快递: 'shentong',
        申通: 'shentong',
        韵达快递: 'yunda',
        韵达: 'yunda',
        德邦物流: 'debangwuliu',
        德邦: 'debangwuliu',
        京东物流: 'jd',
        京东: 'jd',
        EMS: 'ems',
        邮政: 'youzhengguonei'
      }
      if (delivery.logistics_company && delivery.tracking_number) {
        const code = companyMap[delivery.logistics_company] || 'auto'
        return `https://www.kuaidi100.com/chaxun?com=${code}&nu=${delivery.tracking_number}`
      }
      return '#'
    }
  }
}
</script>

<style scoped>
.delivery-container {
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
