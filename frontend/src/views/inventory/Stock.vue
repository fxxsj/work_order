<template>
  <div class="stock-container">
    <!-- 页面头部 -->
    <div class="header">
      <h2>成品库存</h2>
      <div class="actions">
        <el-button icon="el-icon-warning" type="warning" @click="handleLowStock">库存预警</el-button>
        <el-button icon="el-icon-time" type="danger" @click="handleExpired">过期库存</el-button>
        <el-button icon="el-icon-refresh" @click="fetchStockList">刷新</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">总库存数</div>
              <div class="stat-value">{{ stats.total_quantity || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-label">产品种类</div>
              <div class="stat-value">{{ stats.total_products || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card warning">
            <div class="stat-item">
              <div class="stat-label">低库存</div>
              <div class="stat-value">{{ stats.low_stock_count || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card danger">
            <div class="stat-item">
              <div class="stat-label">过期批次</div>
              <div class="stat-value">{{ stats.expired_count || 0 }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和过滤 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="产品">
          <el-select v-model="filters.product" placeholder="全部产品" clearable filterable>
            <el-option v-for="product in productList" :key="product.id" :label="product.name" :value="product.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="在库" value="in_stock"></el-option>
            <el-option label="已预留" value="reserved"></el-option>
            <el-option label="质检中" value="quality_check"></el-option>
            <el-option label="已损坏" value="defective"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="filters.batch_number" placeholder="批次号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table v-loading="loading" :data="stockList" border style="width: 100%">
        <el-table-column prop="product_name" label="产品名称" width="200" />
        <el-table-column prop="batch_number" label="批次号" width="150" />
        <el-table-column prop="quantity" label="库存数量" width="100" align="right">
          <template #default="{ row }">
            <span :class="getQuantityClass(row)">{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reserved_quantity" label="预留数量" width="100" align="right" />
        <el-table-column prop="available_quantity" label="可用数量" width="100" align="right">
          <template #default="{ row }">
            {{ row.quantity - row.reserved_quantity }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="120" />
        <el-table-column prop="production_date" label="生产日期" width="120" />
        <el-table-column prop="expiry_date" label="过期日期" width="120">
          <template #default="{ row }">
            <span :class="getExpiryClass(row)">{{ row.expiry_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="days_until_expiry" label="过期天数" width="100" align="right">
          <template #default="{ row }">
            <el-tag v-if="row.days_until_expiry !== null" :type="getExpiryTagType(row.days_until_expiry)">
              {{ row.days_until_expiry > 0 ? `${row.days_until_expiry}天` : `已过期${Math.abs(row.days_until_expiry)}天` }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleAdjust(row)">调整</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 库存详情对话框 -->
    <el-dialog :visible.sync="detailDialogVisible" title="库存详情" width="800px" :close-on-click-modal="false">
      <el-descriptions v-if="currentStock" :column="2" border>
        <el-descriptions-item label="产品名称">{{ currentStock.product_name }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ currentStock.batch_number }}</el-descriptions-item>
        <el-descriptions-item label="库存数量">{{ currentStock.quantity }}</el-descriptions-item>
        <el-descriptions-item label="预留数量">{{ currentStock.reserved_quantity }}</el-descriptions-item>
        <el-descriptions-item label="可用数量">{{ currentStock.quantity - currentStock.reserved_quantity }}</el-descriptions-item>
        <el-descriptions-item label="库位">{{ currentStock.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="生产日期">{{ currentStock.production_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="过期日期">{{ currentStock.expiry_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentStock.status_display }}</el-descriptions-item>
        <el-descriptions-item label="单位成本">¥{{ currentStock.unit_cost ? currentStock.unit_cost.toLocaleString() : '-' }}</el-descriptions-item>
        <el-descriptions-item label="总价值" :span="2">¥{{ currentStock.total_value ? currentStock.total_value.toLocaleString() : '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentStock.created_at }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 库存预警对话框 -->
    <el-dialog :visible.sync="lowStockDialogVisible" title="库存预警" width="900px">
      <el-table v-loading="loadingLowStock" :data="lowStockList" border max-height="400">
        <el-table-column prop="product_name" label="产品名称" width="200" />
        <el-table-column prop="batch_number" label="批次号" width="150" />
        <el-table-column prop="quantity" label="当前库存" width="100" align="right" />
        <el-table-column prop="min_stock_level" label="最小库存" width="100" align="right" />
        <el-table-column prop="available_quantity" label="可用数量" width="100" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">{{ row.quantity - row.reserved_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="120" />
      </el-table>
    </el-dialog>

    <!-- 过期库存对话框 -->
    <el-dialog :visible.sync="expiredDialogVisible" title="过期库存" width="900px">
      <el-table v-loading="loadingExpired" :data="expiredList" border max-height="400">
        <el-table-column prop="product_name" label="产品名称" width="200" />
        <el-table-column prop="batch_number" label="批次号" width="150" />
        <el-table-column prop="quantity" label="库存数量" width="100" align="right" />
        <el-table-column prop="expiry_date" label="过期日期" width="120" />
        <el-table-column prop="days_until_expiry" label="过期天数" width="100" align="right">
          <template #default="{ row }">
            <el-tag type="danger">已过期{{ Math.abs(row.days_until_expiry) }}天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="120" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { getProductStocks, getLowStock, getExpiredStock, getStockSummary } from '@/api/inventory'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'StockList',
  components: {
    Pagination
  },
  data() {
    return {
      loading: false,
      loadingLowStock: false,
      loadingExpired: false,
      stockList: [],
      productList: [],
      lowStockList: [],
      expiredList: [],
      currentStock: null,
      detailDialogVisible: false,
      lowStockDialogVisible: false,
      expiredDialogVisible: false,
      stats: {},
      filters: {
        product: '',
        status: '',
        batch_number: ''
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      }
    }
  },
  created() {
    this.fetchStockList()
    this.fetchStockSummary()
    this.fetchProducts()
  },
  methods: {
    async fetchStockList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize,
          ...(this.filters.product && { product: this.filters.product }),
          ...(this.filters.status && { status: this.filters.status }),
          ...(this.filters.batch_number && { batch_number: this.filters.batch_number })
        }
        const response = await getProductStocks(params)
        this.stockList = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        this.$message.error('获取库存列表失败')
      } finally {
        this.loading = false
      }
    },
    async fetchStockSummary() {
      try {
        const response = await getStockSummary()
        this.stats = response || {}
      } catch (error) {
        console.error('获取库存汇总失败', error)
      }
    },
    async fetchProducts() {
      try {
        this.productList = []
      } catch (error) {
        console.error('获取产品列表失败', error)
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.fetchStockList()
    },
    handleReset() {
      this.filters = { product: '', status: '', batch_number: '' }
      this.pagination.page = 1
      this.fetchStockList()
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.page = 1
      this.fetchStockList()
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.fetchStockList()
    },
    handleView(row) {
      this.currentStock = row
      this.detailDialogVisible = true
    },
    handleAdjust() {
      this.$message.info('库存调整功能开发中')
    },
    async handleLowStock() {
      this.lowStockDialogVisible = true
      this.loadingLowStock = true
      try {
        const response = await getLowStock()
        this.lowStockList = response.results || []
      } catch (error) {
        this.$message.error('获取库存预警失败')
      } finally {
        this.loadingLowStock = false
      }
    },
    async handleExpired() {
      this.expiredDialogVisible = true
      this.loadingExpired = true
      try {
        const response = await getExpiredStock()
        this.expiredList = response.results || []
      } catch (error) {
        this.$message.error('获取过期库存失败')
      } finally {
        this.loadingExpired = false
      }
    },
    getQuantityClass(row) {
      const available = row.quantity - row.reserved_quantity
      if (row.min_stock_level && available <= row.min_stock_level) {
        return 'low-stock'
      }
      return ''
    },
    getExpiryClass(row) {
      if (row.days_until_expiry === null) return ''
      if (row.days_until_expiry < 0) return 'expired'
      if (row.days_until_expiry <= 30) return 'expiring-soon'
      return ''
    },
    getExpiryTagType(days) {
      if (days < 0) return 'danger'
      if (days <= 30) return 'warning'
      return 'success'
    },
    getStatusType(status) {
      const typeMap = {
        in_stock: 'success',
        reserved: 'warning',
        quality_check: 'info',
        defective: 'danger'
      }
      return typeMap[status] || ''
    }
  }
}
</script>

<style scoped>
.stock-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 4px;
}

.stat-card.warning {
  border-color: #e6a23c;
}

.stat-card.danger {
  border-color: #f56c6c;
}

.stat-item {
  text-align: center;
  padding: 10px 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
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

.low-stock {
  color: #e6a23c;
  font-weight: bold;
}

.expired {
  color: #f56c6c;
  font-weight: bold;
}

.expiring-soon {
  color: #e6a23c;
  font-weight: bold;
}
</style>
