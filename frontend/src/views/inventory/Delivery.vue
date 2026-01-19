<template>
  <div class="delivery-container">
    <!-- 页面头部 -->
    <div class="header">
      <h2>发货管理</h2>
      <div class="actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
          新建发货单
        </el-button>
        <el-button icon="el-icon-refresh" @click="fetchDeliveryOrders">刷新</el-button>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="发货状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="handleSearch">
            <el-option label="待发货" value="pending"></el-option>
            <el-option label="已发货" value="shipped"></el-option>
            <el-option label="运输中" value="in_transit"></el-option>
            <el-option label="已签收" value="received"></el-option>
            <el-option label="拒收" value="rejected"></el-option>
            <el-option label="已退货" value="returned"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="filters.customer" placeholder="全部客户" clearable filterable>
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.name"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="filters.tracking_number" placeholder="物流单号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="deliveryList"
        border
        style="width: 100%"
      >
        <el-table-column prop="order_number" label="发货单号" width="150" />
        <el-table-column prop="customer_name" label="客户名称" width="150" />
        <el-table-column prop="sales_order_number" label="销售订单" width="150" />
        <el-table-column prop="receiver_name" label="收货人" width="100" />
        <el-table-column prop="receiver_phone" label="联系电话" width="120" />
        <el-table-column prop="delivery_address" label="送货地址" show-overflow-tooltip width="200" />
        <el-table-column prop="logistics_company" label="物流公司" width="120" />
        <el-table-column prop="tracking_number" label="物流单号" width="150">
          <template slot-scope="scope">
            <el-link v-if="scope.row.tracking_number" :href="getTrackingUrl(scope.row)" target="_blank">
              {{ scope.row.tracking_number }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="发货日期" width="120" />
        <el-table-column prop="status_display" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              size="small"
              type="primary"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              size="small"
              type="primary"
              @click="handleShip(scope.row)"
            >
              发货
            </el-button>
            <el-button
              v-if="scope.row.status === 'shipped' || scope.row.status === 'in_transit'"
              size="small"
              type="success"
              @click="handleReceive(scope.row)"
            >
              签收
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 发货详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      title="发货单详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="currentDelivery" :column="2" border>
        <el-descriptions-item label="发货单号">{{ currentDelivery.order_number }}</el-descriptions-item>
        <el-descriptions-item label="销售订单">{{ currentDelivery.sales_order_number || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentDelivery.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="收货人">{{ currentDelivery.receiver_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDelivery.receiver_phone }}</el-descriptions-item>
        <el-descriptions-item label="发货日期">{{ currentDelivery.delivery_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流公司" :span="2">{{ currentDelivery.logistics_company || '-' }}</el-descriptions-item>
        <el-descriptions-item label="物流单号" :span="2">
          <el-link v-if="currentDelivery.tracking_number" :href="getTrackingUrl(currentDelivery)" target="_blank">
            {{ currentDelivery.tracking_number }}
          </el-link>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="运费">¥{{ currentDelivery.freight ? currentDelivery.freight.toLocaleString() : '-' }}</el-descriptions-item>
        <el-descriptions-item label="包裹数量">{{ currentDelivery.package_count }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentDelivery.status_display }}</el-descriptions-item>
        <el-descriptions-item label="送货地址" :span="2">{{ currentDelivery.delivery_address }}</el-descriptions-item>
      </el-descriptions>

      <!-- 发货明细 -->
      <div v-if="currentDelivery && currentDelivery.items && currentDelivery.items.length > 0" class="items-section">
        <h3>发货明细</h3>
        <el-table :data="currentDelivery.items" border style="width: 100%; margin-top: 10px;">
          <el-table-column prop="product_name" label="产品名称" />
          <el-table-column prop="quantity" label="发货数量" width="100" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="unit_price" label="单价" width="100">
            <template slot-scope="scope">
              ¥{{ scope.row.unit_price ? scope.row.unit_price.toLocaleString() : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="subtotal" label="小计" width="120">
            <template slot-scope="scope">
              ¥{{ scope.row.subtotal ? scope.row.subtotal.toLocaleString() : '-' }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 签收对话框 -->
    <el-dialog
      :visible.sync="receiveDialogVisible"
      title="签收确认"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="receiveForm" label-width="100px">
        <el-form-item label="签收状态">
          <el-radio-group v-model="receiveForm.received">
            <el-radio label="received">正常签收</el-radio>
            <el-radio label="rejected">拒收</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="签收备注" v-if="receiveForm.received === 'rejected'">
          <el-input
            v-model="receiveForm.received_notes"
            type="textarea"
            :rows="3"
            placeholder="请输入拒收原因"
          />
        </el-form-item>
        <el-form-item label="签收照片">
          <el-upload
            action=""
            :http-request="uploadReceipt"
            :show-file-list="false"
            accept="image/*"
            :limit="1"
            list-type="picture"
          >
            <el-button size="small">上传签收照片</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png 图片，且不超过 2MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmReceive">确认</el-button>
      </template>
    </el-dialog>

    <!-- 新建/编辑发货单对话框 -->
    <el-dialog
      :visible.sync="formDialogVisible"
      :title="dialogTitle"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <!-- 基本信息 -->
        <h4 class="form-section-title">基本信息</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售订单" prop="sales_order">
              <el-select
                v-model="form.sales_order"
                placeholder="请选择销售订单"
                filterable
                @change="handleSalesOrderChange"
                style="width: 100%"
              >
                <el-option
                  v-for="so in salesOrderList"
                  :key="so.id"
                  :label="`${so.order_number} - ${so.customer_name || ''}`"
                  :value="so.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户" prop="customer">
              <el-select
                v-model="form.customer"
                placeholder="请选择客户"
                filterable
                @change="handleCustomerChange"
                style="width: 100%"
              >
                <el-option
                  v-for="customer in customerList"
                  :key="customer.id"
                  :label="customer.name"
                  :value="customer.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 收货信息 -->
        <h4 class="form-section-title">收货信息</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收货人" prop="receiver_name">
              <el-input v-model="form.receiver_name" placeholder="请输入收货人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="receiver_phone">
              <el-input v-model="form.receiver_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="送货地址" prop="delivery_address">
          <el-input v-model="form.delivery_address" type="textarea" :rows="2" placeholder="请输入送货地址" />
        </el-form-item>

        <!-- 物流信息 -->
        <h4 class="form-section-title">物流信息</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发货日期" prop="delivery_date">
              <el-date-picker
                v-model="form.delivery_date"
                type="date"
                placeholder="请选择发货日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物流公司">
              <el-select v-model="form.logistics_company" placeholder="请选择物流公司" filterable allow-create style="width: 100%">
                <el-option label="顺丰速运" value="顺丰速运" />
                <el-option label="中通快递" value="中通快递" />
                <el-option label="圆通速递" value="圆通速递" />
                <el-option label="申通快递" value="申通快递" />
                <el-option label="韵达快递" value="韵达快递" />
                <el-option label="德邦物流" value="德邦物流" />
                <el-option label="京东物流" value="京东物流" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物流单号">
              <el-input v-model="form.tracking_number" placeholder="请输入物流单号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运费（元）">
              <el-input-number v-model="form.freight" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="包裹数量" prop="package_count">
              <el-input-number v-model="form.package_count" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总重量（kg）">
              <el-input-number v-model="form.package_weight" :precision="2" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 发货明细 -->
        <h4 class="form-section-title">
          发货明细
          <el-button type="primary" size="small" icon="el-icon-plus" @click="addItem" style="margin-left: 10px">
            添加明细
          </el-button>
        </h4>
        <el-table :data="form.items_data" border style="width: 100%">
          <el-table-column label="产品" width="250">
            <template slot-scope="scope">
              <el-select v-model="scope.row.product" placeholder="请选择产品" filterable style="width: 100%">
                <el-option
                  v-for="product in productList"
                  :key="product.id"
                  :label="`${product.name} (${product.code || ''})`"
                  :value="product.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="150">
            <template slot-scope="scope">
              <el-input-number v-model="scope.row.quantity" :min="1" :precision="2" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="100">
            <template slot-scope="scope">
              <el-input v-model="scope.row.unit" placeholder="单位" />
            </template>
          </el-table-column>
          <el-table-column label="单价（元）" width="150">
            <template slot-scope="scope">
              <el-input-number v-model="scope.row.unit_price" :min="0" :precision="2" style="width: 100%" />
            </template>
          </el-table-column>
          <el-table-column label="小计（元）" width="120">
            <template slot-scope="scope">
              ¥{{ calculateSubtotal(scope.row).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80">
            <template slot-scope="scope">
              <el-button type="danger" size="small" icon="el-icon-delete" @click="removeItem(scope.$index)" />
            </template>
          </el-table-column>
        </el-table>

        <!-- 备注 -->
        <el-form-item label="备注" style="margin-top: 20px">
          <el-input v-model="form.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getDeliveryOrders, createDeliveryOrder, updateDeliveryOrder, shipDeliveryOrder, receiveDeliveryOrder, getProductStocks } from '@/api/inventory'
import { getSalesOrderList } from '@/api/sales'
import { getCustomerList } from '@/api/purchase'
import { productAPI } from '@/api/workorder'

export default {
  name: 'DeliveryList',
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
      rules: {
        customer: [{ required: true, message: '请选择客户', trigger: 'change' }],
        sales_order: [{ required: true, message: '请选择销售订单', trigger: 'change' }],
        receiver_name: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
        receiver_phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
        ],
        delivery_address: [{ required: true, message: '请输入送货地址', trigger: 'blur' }],
        delivery_date: [{ required: true, message: '请选择发货日期', trigger: 'change' }],
        package_count: [
          { required: true, message: '请输入包裹数量', trigger: 'blur' },
          { type: 'number', min: 1, message: '包裹数量至少为1', trigger: 'blur' }
        ]
      },
      receiveForm: {
        delivery_id: null,
        received: 'received',
        received_notes: '',
        receiver_signature: ''
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
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑发货单' : '新建发货单'
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
    // 获取发货单列表
    async fetchDeliveryOrders() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize
        }

        if (this.filters.status) {
          params.status = this.filters.status
        }
        if (this.filters.customer) {
          params.customer = this.filters.customer
        }
        if (this.filters.tracking_number) {
          params.tracking_number = this.filters.tracking_number
        }

        const response = await getDeliveryOrders(params)
        this.deliveryList = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        let errorMessage = '获取发货单列表失败'
        if (error.response) {
          const status = error.response.status
          if (status === 401) {
            errorMessage = '登录已过期，请重新登录'
          } else if (status === 403) {
            errorMessage = '您没有权限访问此功能'
          } else if (status >= 500) {
            errorMessage = '服务器错误，请稍后重试'
          } else if (error.response.data?.detail) {
            errorMessage = `获取发货单列表失败: ${error.response.data.detail}`
          }
        } else if (error.message) {
          errorMessage = `网络错误: ${error.message}`
        }
        this.$message.error(errorMessage)
        console.error('获取发货单列表失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 获取客户列表
    async fetchCustomers() {
      try {
        const response = await getCustomerList({ page_size: 1000 })
        this.customerList = response.results || []
      } catch (error) {
        console.error('获取客户列表失败', error)
      }
    },

    // 获取销售订单列表
    async fetchSalesOrders() {
      try {
        const response = await getSalesOrderList({ status: 'approved', page_size: 1000 })
        this.salesOrderList = response.results || []
      } catch (error) {
        console.error('获取销售订单列表失败', error)
      }
    },

    // 获取产品列表
    async fetchProducts() {
      try {
        const response = await productAPI.getList({ page_size: 1000 })
        this.productList = response.results || []
      } catch (error) {
        console.error('获取产品列表失败', error)
      }
    },

    // 获取库存列表
    async fetchStocks() {
      try {
        const response = await getProductStocks({ page_size: 1000 })
        this.stockList = response.results || []
      } catch (error) {
        console.error('获取库存列表失败', error)
      }
    },

    // 搜索
    handleSearch() {
      this.pagination.page = 1
      this.fetchDeliveryOrders()
    },

    // 重置
    handleReset() {
      this.filters = {
        status: '',
        customer: '',
        tracking_number: ''
      }
      this.pagination.page = 1
      this.fetchDeliveryOrders()
    },

    // 查看详情
    handleView(row) {
      this.currentDelivery = row
      this.detailDialogVisible = true
    },

    // 新建
    handleCreate() {
      this.isEdit = false
      this.resetForm()
      this.formDialogVisible = true
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },

    // 编辑
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
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },

    // 重置表单
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

    // 销售订单变更
    async handleSalesOrderChange(value) {
      const salesOrder = this.salesOrderList.find(so => so.id === value)
      if (salesOrder) {
        // 自动填充客户
        if (salesOrder.customer) {
          this.form.customer = salesOrder.customer
          // 获取客户详细信息
          const customer = this.customerList.find(c => c.id === salesOrder.customer)
          if (customer) {
            this.form.receiver_name = customer.contact_person || ''
            this.form.receiver_phone = customer.contact_phone || ''
            this.form.delivery_address = customer.address || ''
          }
        }

        // TODO: 从销售订单明细自动填充发货明细
        // 这里需要获取销售订单的明细项
      }
    },

    // 客户变更
    handleCustomerChange(value) {
      const customer = this.customerList.find(c => c.id === value)
      if (customer) {
        this.form.receiver_name = customer.contact_person || ''
        this.form.receiver_phone = customer.contact_phone || ''
        this.form.delivery_address = customer.address || ''
      }
    },

    // 添加发货明细
    addItem() {
      this.form.items_data.push({
        product: null,
        quantity: 1,
        unit: '件',
        unit_price: 0,
        notes: ''
      })
    },

    // 删除发货明细
    removeItem(index) {
      this.form.items_data.splice(index, 1)
    },

    // 计算小计
    calculateSubtotal(item) {
      return (item.quantity || 0) * (item.unit_price || 0)
    },

    // 验证发货明细
    validateItems() {
      if (this.form.items_data.length === 0) {
        this.$message.warning('请至少添加一条发货明细')
        return false
      }

      for (let i = 0; i < this.form.items_data.length; i++) {
        const item = this.form.items_data[i]
        if (!item.product) {
          this.$message.error(`第${i + 1}行：请选择产品`)
          return false
        }
        if (!item.quantity || item.quantity <= 0) {
          this.$message.error(`第${i + 1}行：请输入有效的发货数量`)
          return false
        }
        if (!item.unit_price || item.unit_price < 0) {
          this.$message.error(`第${i + 1}行：请输入有效的单价`)
          return false
        }
      }

      return true
    },

    // 提交表单
    async handleSubmit() {
      // 验证表单
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return false

        // 验证明细
        if (!this.validateItems()) return false

        this.submitting = true
        try {
          const data = { ...this.form }
          delete data.id

          if (this.isEdit) {
            // 编辑
            await updateDeliveryOrder(this.form.id, data)
            this.$message.success('发货单更新成功')
          } else {
            // 新建
            await createDeliveryOrder(data)
            this.$message.success('发货单创建成功')
          }

          this.formDialogVisible = false
          this.fetchDeliveryOrders()
        } catch (error) {
          let errorMessage = this.isEdit ? '更新发货单失败' : '创建发货单失败'
          if (error.response?.data) {
            const errors = error.response.data
            if (typeof errors === 'string') {
              errorMessage = errors
            } else if (errors.detail) {
              errorMessage = errors.detail
            } else {
              // 处理字段错误
              const errorFields = Object.keys(errors)
              if (errorFields.length > 0) {
                const firstError = errorFields[0]
                errorMessage = `${firstError}: ${Array.isArray(errors[firstError]) ? errors[firstError][0] : errors[firstError]}`
              }
            }
          } else if (error.message) {
            errorMessage = `网络错误: ${error.message}`
          }
          this.$message.error(errorMessage)
          console.error('提交失败:', error)
        } finally {
          this.submitting = false
        }
      })
    },

    // 发货
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

    // 签收
    handleReceive(row) {
      this.receiveForm.delivery_id = row.id
      this.receiveDialogVisible = true
    },

    // 确认签收
    async handleConfirmReceive() {
      try {
        await receiveDeliveryOrder(this.receiveForm.delivery_id, this.receiveForm)
        this.$message.success('签收成功')
        this.receiveDialogVisible = false
        this.fetchDeliveryOrders()
      } catch (error) {
        this.$message.error('签收失败')
        console.error(error)
      }
    },

    // 上传签收照片
    uploadReceipt(item) {
      // TODO: 实现文件上传
      console.log('上传签收照片', item)
    },

    // 分页
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.page = 1
      this.fetchDeliveryOrders()
    },

    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchDeliveryOrders()
    },

    // 状态标签类型
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

    // 物流查询URL
    getTrackingUrl(delivery) {
      if (delivery.logistics_company && delivery.tracking_number) {
        // TODO: 根据物流公司返回对应的查询URL
        return '#'
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-form {
  margin-bottom: 0;
}

.table-section {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.items-section {
  margin-top: 20px;
}

.form-section-title {
  margin: 20px 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.form-section-title:first-child {
  margin-top: 0;
}
</style>
