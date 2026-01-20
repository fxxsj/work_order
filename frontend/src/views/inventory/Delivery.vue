<template>
  <div class="delivery-container">
    <!-- 页面头部 -->
    <div class="header">
      <h2>发货管理</h2>
      <div class="actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
          新建发货单
        </el-button>
        <el-button icon="el-icon-refresh" @click="fetchDeliveryOrders">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <DeliveryFilters
      v-model="filters"
      :customer-list="customerList"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- 数据表格 -->
    <DeliveryTable
      :loading="loading"
      :data="deliveryList"
      :pagination="pagination"
      @view="handleView"
      @edit="handleEdit"
      @ship="handleShip"
      @receive="handleReceive"
      @size-change="handleSizeChange"
      @page-change="handleCurrentChange"
    />

    <!-- 发货详情对话框 -->
    <DeliveryDetailDialog
      :visible="detailDialogVisible"
      :data="currentDelivery"
      @close="detailDialogVisible = false"
    />

    <!-- 签收对话框 -->
    <DeliveryReceiveDialog
      :visible="receiveDialogVisible"
      @close="receiveDialogVisible = false"
      @confirm="handleConfirmReceive"
    />

    <!-- 新建/编辑发货单对话框 -->
    <DeliveryFormDialog
      :visible="formDialogVisible"
      :is-edit="isEdit"
      :submitting="submitting"
      :form="form"
      :customer-list="customerList"
      :sales-order-list="salesOrderList"
      :product-list="productList"
      @close="formDialogVisible = false"
      @submit="handleSubmit"
      @sales-order-change="handleSalesOrderChange"
      @customer-change="handleCustomerChange"
    />
  </div>
</template>

<script>
import { getDeliveryOrders, createDeliveryOrder, updateDeliveryOrder, shipDeliveryOrder, receiveDeliveryOrder, getProductStocks } from '@/api/inventory'
import { getSalesOrderList } from '@/api/sales'
import { getCustomerList } from '@/api/purchase'
import { productAPI } from '@/api/workorder'
import DeliveryFilters from './components/DeliveryFilters.vue'
import DeliveryTable from './components/DeliveryTable.vue'
import DeliveryDetailDialog from './components/DeliveryDetailDialog.vue'
import DeliveryReceiveDialog from './components/DeliveryReceiveDialog.vue'
import DeliveryFormDialog from './components/DeliveryFormDialog.vue'

export default {
  name: 'DeliveryList',
  components: {
    DeliveryFilters,
    DeliveryTable,
    DeliveryDetailDialog,
    DeliveryReceiveDialog,
    DeliveryFormDialog
  },
  data() {
    return {
      loading: false,
      deliveryList: [],
      customerList: [],
      salesOrderList: [],
      productList: [],
      stockList: [],
      currentDelivery: null,
      detailDialogVisible: false,
      formDialogVisible: false,
      receiveDialogVisible: false,
      isEdit: false,
      submitting: false,
      form: {
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
      },
      filters: {
        status: '',
        customer: '',
        tracking_number: ''
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      }
    }
  },
  created() {
    this.fetchDeliveryOrders()
    this.fetchCustomers()
    this.fetchSalesOrders()
    this.fetchProducts()
    this.fetchStocks()
  },
  methods: {
    async fetchDeliveryOrders() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize
        }

        if (this.filters.status) params.status = this.filters.status
        if (this.filters.customer) params.customer = this.filters.customer
        if (this.filters.tracking_number) params.tracking_number = this.filters.tracking_number

        const response = await getDeliveryOrders(params)
        this.deliveryList = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        let errorMessage = '获取发货单列表失败'
        if (error.response) {
          const status = error.response.status
          if (status === 401) errorMessage = '登录已过期，请重新登录'
          else if (status === 403) errorMessage = '您没有权限访问此功能'
          else if (status >= 500) errorMessage = '服务器错误，请稍后重试'
          else if (error.response.data?.detail) errorMessage = `获取发货单列表失败: ${error.response.data.detail}`
        } else if (error.message) errorMessage = `网络错误: ${error.message}`
        this.$message.error(errorMessage)
        console.error('获取发货单列表失败:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchCustomers() {
      try {
        const response = await getCustomerList({ page_size: 1000 })
        this.customerList = response.results || []
      } catch (error) {
        console.error('获取客户列表失败', error)
      }
    },

    async fetchSalesOrders() {
      try {
        const response = await getSalesOrderList({ status: 'approved', page_size: 1000 })
        this.salesOrderList = response.results || []
      } catch (error) {
        console.error('获取销售订单列表失败', error)
      }
    },

    async fetchProducts() {
      try {
        const response = await productAPI.getList({ page_size: 1000 })
        this.productList = response.results || []
      } catch (error) {
        console.error('获取产品列表失败', error)
      }
    },

    async fetchStocks() {
      try {
        const response = await getProductStocks({ page_size: 1000 })
        this.stockList = response.results || []
      } catch (error) {
        console.error('获取库存列表失败', error)
      }
    },

    handleSearch() {
      this.pagination.page = 1
      this.fetchDeliveryOrders()
    },

    handleReset() {
      this.filters = { status: '', customer: '', tracking_number: '' }
      this.pagination.page = 1
      this.fetchDeliveryOrders()
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
      this.form = {
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
    },

    async handleSalesOrderChange(value) {
      const salesOrder = this.salesOrderList.find(so => so.id === value)
      if (salesOrder && salesOrder.customer) {
        this.form.customer = salesOrder.customer
        const customer = this.customerList.find(c => c.id === salesOrder.customer)
        if (customer) {
          this.form.receiver_name = customer.contact_person || ''
          this.form.receiver_phone = customer.contact_phone || ''
          this.form.delivery_address = customer.address || ''
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
          await updateDeliveryOrder(this.form.id, data)
          this.$message.success('发货单更新成功')
        } else {
          await createDeliveryOrder(data)
          this.$message.success('发货单创建成功')
        }

        this.formDialogVisible = false
        this.fetchDeliveryOrders()
      } catch (error) {
        let errorMessage = this.isEdit ? '更新发货单失败' : '创建发货单失败'
        if (error.response?.data) {
          const errors = error.response.data
          if (typeof errors === 'string') errorMessage = errors
          else if (errors.detail) errorMessage = errors.detail
          else {
            const errorFields = Object.keys(errors)
            if (errorFields.length > 0) {
              const firstError = errorFields[0]
              errorMessage = `${firstError}: ${Array.isArray(errors[firstError]) ? errors[firstError][0] : errors[firstError]}`
            }
          }
        } else if (error.message) errorMessage = `网络错误: ${error.message}`
        this.$message.error(errorMessage)
        console.error('提交失败:', error)
      } finally {
        this.submitting = false
      }
    },

    handleShip(row) {
      this.$confirm('确认发货该订单？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await shipDeliveryOrder(row.id, {})
          this.$message.success('发货成功')
          this.fetchDeliveryOrders()
        } catch (error) {
          this.$message.error('发货失败')
          console.error(error)
        }
      })
    },

    handleReceive() {
      this.receiveDialogVisible = true
    },

    async handleConfirmReceive(form) {
      try {
        await receiveDeliveryOrder(form.delivery_id, form)
        this.$message.success('签收成功')
        this.receiveDialogVisible = false
        this.fetchDeliveryOrders()
      } catch (error) {
        this.$message.error('签收失败')
        console.error(error)
      }
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.page = 1
      this.fetchDeliveryOrders()
    },

    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchDeliveryOrders()
    }
  }
}
</script>

<style scoped>
.delivery-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
