<template>
  <div class="stock-container">
    <!-- 统计卡片（与 TaskStats 样式一致） -->
    <stock-stats :stats="stats" :loading="statsLoading" />

    <!-- 主内容卡片 -->
    <el-card>
      <!-- 头部搜索栏（与 Board.vue 一致） -->
      <div class="header-section">
        <div class="filter-group">
          <el-select
            v-model="filters.product"
            placeholder="选择产品"
            clearable
            filterable
            style="width: 160px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="product.name"
              :value="product.id"
            />
          </el-select>
          <el-select
            v-model="filters.status"
            placeholder="库存状态"
            clearable
            style="width: 120px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option label="在库" value="in_stock" />
            <el-option label="已预留" value="reserved" />
            <el-option label="质检中" value="quality_check" />
            <el-option label="次品" value="defective" />
          </el-select>
          <el-input
            v-model="filters.batch_number"
            placeholder="搜索批次号、库位"
            style="width: 220px;"
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
          <el-button icon="el-icon-warning" type="warning" @click="handleLowStock">
            库存预警
          </el-button>
          <el-button icon="el-icon-time" type="danger" @click="handleExpired">
            过期库存
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
        <el-table-column prop="product_name" label="产品名称" width="200" />
        <el-table-column prop="batch_no" label="批次号" width="150" />
        <el-table-column
          prop="quantity"
          label="库存数量"
          width="100"
          align="right"
        >
          <template slot-scope="scope">
            <span :class="getQuantityClass(scope.row)">{{ scope.row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="reserved_quantity"
          label="预留数量"
          width="100"
          align="right"
        />
        <el-table-column label="可用数量" width="100" align="right">
          <template slot-scope="scope">
            {{ scope.row.available_quantity }}
          </template>
        </el-table-column>
        <el-table-column
          prop="min_stock_level"
          label="最小库存"
          width="100"
          align="right"
        />
        <el-table-column prop="location" label="库位" width="120" />
        <el-table-column prop="production_date" label="生产日期" width="120" />
        <el-table-column label="过期日期" width="120">
          <template slot-scope="scope">
            <span :class="getExpiryClass(scope.row)">{{ scope.row.expiry_date || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="过期天数" width="100" align="right">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.days_until_expiry !== null" :type="getExpiryTagType(scope.row.days_until_expiry)">
              {{ scope.row.days_until_expiry > 0 ? `${scope.row.days_until_expiry}天` : `已过期${Math.abs(scope.row.days_until_expiry)}天` }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click="handleAdjust(scope.row)"
            >
              调整
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
        description="暂无库存数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="hasFilters" type="primary" @click="handleReset">
          重置筛选
        </el-button>
      </el-empty>
    </el-card>

    <!-- 库存详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      title="库存详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-descriptions v-if="currentStock" :column="2" border>
        <el-descriptions-item label="产品名称">
          {{ currentStock.product_name }}
        </el-descriptions-item>
        <el-descriptions-item label="批次号">
          {{ currentStock.batch_no }}
        </el-descriptions-item>
        <el-descriptions-item label="库存数量">
          {{ currentStock.quantity }}
        </el-descriptions-item>
        <el-descriptions-item label="预留数量">
          {{ currentStock.reserved_quantity }}
        </el-descriptions-item>
        <el-descriptions-item label="可用数量">
          {{ currentStock.available_quantity }}
        </el-descriptions-item>
        <el-descriptions-item label="最小库存">
          {{ currentStock.min_stock_level }}
        </el-descriptions-item>
        <el-descriptions-item label="库位">
          {{ currentStock.location || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="生产日期">
          {{ currentStock.production_date || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="过期日期">
          {{ currentStock.expiry_date || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ currentStock.status_display }}
        </el-descriptions-item>
        <el-descriptions-item label="单位成本">
          ¥{{ currentStock.unit_cost ? currentStock.unit_cost.toLocaleString() : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="总价值">
          ¥{{ currentStock.total_value ? currentStock.total_value.toLocaleString() : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ currentStock.created_at }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentStock.notes" label="备注" :span="2">
          <pre style="margin: 0; white-space: pre-wrap;">{{ currentStock.notes }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template slot="footer">
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 库存预警对话框 -->
    <el-dialog :visible.sync="lowStockDialogVisible" title="库存预警" width="900px">
      <el-empty v-if="!loadingLowStock && lowStockList.length === 0" description="暂无低库存预警" />
      <el-table
        v-else
        v-loading="loadingLowStock"
        :data="lowStockList"
        border
        max-height="400"
      >
        <el-table-column prop="product_name" label="产品名称" width="200" />
        <el-table-column prop="batch_no" label="批次号" width="150" />
        <el-table-column
          prop="quantity"
          label="当前库存"
          width="100"
          align="right"
        />
        <el-table-column
          prop="min_stock_level"
          label="最小库存"
          width="100"
          align="right"
        />
        <el-table-column label="可用数量" width="100" align="right">
          <template slot-scope="scope">
            <span style="color: #f56c6c; font-weight: bold;">{{ scope.row.available_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="120" />
      </el-table>
    </el-dialog>

    <!-- 过期库存对话框 -->
    <el-dialog :visible.sync="expiredDialogVisible" title="过期库存" width="900px">
      <el-empty v-if="!loadingExpired && expiredList.length === 0" description="暂无过期库存" />
      <el-table
        v-else
        v-loading="loadingExpired"
        :data="expiredList"
        border
        max-height="400"
      >
        <el-table-column prop="product_name" label="产品名称" width="200" />
        <el-table-column prop="batch_no" label="批次号" width="150" />
        <el-table-column
          prop="quantity"
          label="库存数量"
          width="100"
          align="right"
        />
        <el-table-column prop="expiry_date" label="过期日期" width="120" />
        <el-table-column label="过期天数" width="100" align="right">
          <template slot-scope="scope">
            <el-tag type="danger">
              已过期{{ Math.abs(scope.row.days_until_expiry) }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="120" />
      </el-table>
    </el-dialog>

    <!-- 库存调整对话框 -->
    <stock-adjust-dialog
      :visible.sync="adjustDialogVisible"
      :stock="currentStock"
      :loading="adjustLoading"
      @confirm="handleAdjustConfirm"
    />
  </div>
</template>

<script>
import { productStockAPI, productAPI } from '@/api/modules'
import StockStats from './components/StockStats.vue'
import Pagination from '@/components/common/Pagination.vue'
import StockAdjustDialog from './components/StockAdjustDialog.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'StockList',
  components: {
    Pagination,
    StockStats,
    StockAdjustDialog
  },
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: productStockAPI,
      permissionPrefix: 'productstock',

      // 页面状态
      statsLoading: false,
      loadingLowStock: false,
      loadingExpired: false,
      adjustLoading: false,

      // 数据
      productList: [],
      lowStockList: [],
      expiredList: [],
      currentStock: null,
      stats: {},

      // 对话框
      detailDialogVisible: false,
      lowStockDialogVisible: false,
      expiredDialogVisible: false,
      adjustDialogVisible: false,

      // 筛选条件
      filters: {
        product: '',
        status: '',
        batch_number: ''
      },

      // 搜索防抖定时器
      searchTimer: null
    }
  },

  computed: {
    hasFilters() {
      return this.filters.product || this.filters.status || this.filters.batch_number
    }
  },

  created() {
    this.loadData()
    this.fetchStockSummary()
    this.fetchProducts()
  },

  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ...(this.filters.product && { product: this.filters.product }),
        ...(this.filters.status && { status: this.filters.status }),
        ...(this.filters.batch_number && { batch_number: this.filters.batch_number })
      }
      return await this.apiService.getList(params)
    },

    async fetchStockSummary() {
      this.statsLoading = true
      try {
        const response = await productStockAPI.getSummary()
        this.stats = response || {}
      } catch (error) {
        // 统计信息加载失败不阻塞页面，静默处理
        this.stats = {}
      } finally {
        this.statsLoading = false
      }
    },

    async fetchProducts() {
      try {
        const response = await productAPI.getList({ page_size: 100, is_active: true })
        this.productList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '获取产品列表失败')
      }
    },

    // 搜索防抖处理（与 Board.vue 一致）
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
      this.filters = { product: '', status: '', batch_number: '' }
      this.currentPage = 1
      this.loadData()
    },

    handleView(row) {
      this.currentStock = row
      this.detailDialogVisible = true
    },

    handleAdjust(row) {
      this.currentStock = row
      this.adjustDialogVisible = true
    },

    async handleAdjustConfirm(formData) {
      if (!this.currentStock) return

      this.adjustLoading = true
      try {
        await productStockAPI.adjust(this.currentStock.id, formData)
        ErrorHandler.showSuccess('库存调整成功')
        this.adjustDialogVisible = false
        this.loadData()
        this.fetchStockSummary()
      } catch (error) {
        ErrorHandler.showMessage(error, '库存调整失败')
      } finally {
        this.adjustLoading = false
      }
    },

    async handleLowStock() {
      this.lowStockDialogVisible = true
      this.loadingLowStock = true
      try {
        const response = await productStockAPI.getLowStock()
        this.lowStockList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '获取库存预警失败')
      } finally {
        this.loadingLowStock = false
      }
    },

    async handleExpired() {
      this.expiredDialogVisible = true
      this.loadingExpired = true
      try {
        const response = await productStockAPI.getExpired()
        this.expiredList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '获取过期库存失败')
      } finally {
        this.loadingExpired = false
      }
    },

    getQuantityClass(row) {
      if (row.is_low_stock) {
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
  gap: 10px;
  flex-wrap: wrap;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
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
