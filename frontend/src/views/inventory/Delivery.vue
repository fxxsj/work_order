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
  </div>
</template>

<script>
import { getDeliveryOrders, shipDeliveryOrder, receiveDeliveryOrder } from '@/api/inventory'

export default {
  name: 'DeliveryList',
  data() {
    return {
      loading: false,
      deliveryList: [],
      customerList: [],
      currentDelivery: null,
      detailDialogVisible: false,
      receiveDialogVisible: false,
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
  created() {
    this.fetchDeliveryOrders()
    this.fetchCustomers()
  },
  methods: {
    // 获取发货单列表
    async fetchDeliveryOrders() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page - 1,
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
        // TODO: 从API获取客户列表
        this.customerList = []
      } catch (error) {
        console.error('获取客户列表失败', error)
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
      this.$message.info('新建发货单功能开发中')
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
</style>
