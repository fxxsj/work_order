<template>
  <div class="workorder-list">
    <el-card>
      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="5">
            <el-input
              v-model="filters.search"
              placeholder="搜索施工单号、产品名称、客户"
              clearable
              @clear="handleSearch"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
            </el-input>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.status" placeholder="状态" clearable @change="handleSearch">
              <el-option label="待开始" value="pending"></el-option>
              <el-option label="进行中" value="in_progress"></el-option>
              <el-option label="已暂停" value="paused"></el-option>
              <el-option label="已完成" value="completed"></el-option>
              <el-option label="已取消" value="cancelled"></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.priority" placeholder="优先级" clearable @change="handleSearch">
              <el-option label="低" value="low"></el-option>
              <el-option label="普通" value="normal"></el-option>
              <el-option label="高" value="high"></el-option>
              <el-option label="紧急" value="urgent"></el-option>
            </el-select>
          </el-col>
          <el-col :span="3" v-if="isSalesperson">
            <el-select v-model="filters.approval_status" placeholder="审核状态" clearable @change="handleSearch">
              <el-option label="待审核" value="pending"></el-option>
              <el-option label="已通过" value="approved"></el-option>
              <el-option label="已拒绝" value="rejected"></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.customer__salesperson" placeholder="业务员" clearable @change="handleSearch">
              <el-option
                v-for="salesperson in salespersons"
                :key="salesperson.id"
                :label="salesperson.username"
                :value="salesperson.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="isSalesperson ? 7 : 10" style="text-align: right;">
            <el-button icon="el-icon-refresh" @click="handleReset">重置筛选</el-button>
            <el-button type="primary" icon="el-icon-plus" @click="handleCreate" style="margin-left: 10px;">
              新建施工单
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
        @row-click="handleRowClick"
      >
        <el-table-column prop="order_number" label="施工单号" width="150" fixed></el-table-column>
        <el-table-column prop="customer_name" label="客户" width="150"></el-table-column>
        <el-table-column prop="salesperson_name" label="业务员" width="100">
          <template slot-scope="scope">
            {{ scope.row.salesperson_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="product_name" label="产品名称" min-width="200"></el-table-column>
        <el-table-column prop="quantity" label="生产数量" width="120" align="right">
          <template slot-scope="scope">
            {{ (scope.row.production_quantity || 0) + (scope.row.defective_quantity || 0) }} 车
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <span :class="'status-badge status-' + scope.row.status">
              {{ scope.row.status_display }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template slot-scope="scope">
            <span :class="'status-badge priority-' + scope.row.priority">
              {{ scope.row.priority_display }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template slot-scope="scope">
            <el-progress
              :percentage="scope.row.progress_percentage"
              :color="scope.row.progress_percentage === 100 ? '#67C23A' : '#409EFF'"
            ></el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="order_date" label="下单日期" width="120">
          <template slot-scope="scope">
            {{ scope.row.order_date | formatDate }}
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="交货日期" width="120">
          <template slot-scope="scope">
            <span :style="getDeliveryDateStyle(scope.row.delivery_date, scope.row.status)">
              {{ scope.row.delivery_date | formatDate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="manager_name" label="制表人" width="100"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click.stop="handleView(scope.row)">
              查看
            </el-button>
            <el-button 
              v-if="canEdit" 
              type="text" 
              size="small" 
              @click.stop="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button 
              v-if="canDelete" 
              type="text" 
              size="small" 
              style="color: #F56C6C;" 
              @click.stop="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; text-align: right;"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      >
      </el-pagination>
    </el-card>
  </div>
</template>

<script>
import { workOrderAPI } from '@/api/workorder'
import { getSalespersons } from '@/api/auth'

export default {
  name: 'WorkOrderList',
  data() {
    return {
      loading: false,
      tableData: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      salespersons: [],
      filters: {
        search: '',
        status: '',
        priority: '',
        approval_status: '',
        customer__salesperson: ''
      }
    }
  },
  computed: {
    // 检查用户是否为业务员
    isSalesperson() {
      const userInfo = this.$store.getters.currentUser
      return userInfo && userInfo.is_salesperson
    },
    // 检查是否有编辑权限
    canEdit() {
      return this.hasPermission('workorder.change_workorder')
    },
    // 检查是否有删除权限
    canDelete() {
      return this.hasPermission('workorder.delete_workorder')
    }
  },
  async created() {
    // 加载业务员列表
    await this.loadSalespersons()
    
    // 检查URL参数中是否有筛选条件
    if (this.$route.query.approval_status) {
      this.filters.approval_status = this.$route.query.approval_status
    }
    if (this.$route.query.customer__salesperson) {
      this.filters.customer__salesperson = this.$route.query.customer__salesperson
    }
    this.loadData()
  },
  methods: {
    // 检查用户是否有指定权限
    hasPermission(permission) {
      const userInfo = this.$store.getters.currentUser
      if (!userInfo) return false
      
      // 超级用户拥有所有权限
      if (userInfo.is_superuser) return true
      
      // 检查权限列表
      const permissions = userInfo.permissions || []
      if (permissions.includes('*')) return true
      
      return permissions.includes(permission)
    },
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          page_size: this.pageSize,
          ordering: '-created_at'
        }
        
        if (this.filters.search) {
          params.search = this.filters.search
        }
        if (this.filters.status) {
          params.status = this.filters.status
        }
        if (this.filters.priority) {
          params.priority = this.filters.priority
        }
        if (this.filters.approval_status) {
          params.approval_status = this.filters.approval_status
        }
        if (this.filters.customer__salesperson) {
          params.customer__salesperson = this.filters.customer__salesperson
        }
        
        const response = await workOrderAPI.getList(params)
        this.tableData = response.results || []
        this.total = response.count || 0
      } catch (error) {
        this.$message.error('加载数据失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    async loadSalespersons() {
      try {
        const response = await getSalespersons()
        this.salespersons = response || []
      } catch (error) {
        console.error('加载业务员列表失败:', error)
        this.salespersons = []
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },
    handleReset() {
      // 重置所有筛选条件
      this.filters = {
        search: '',
        status: '',
        priority: '',
        approval_status: '',
        customer__salesperson: ''
      }
      this.currentPage = 1
      // 清除URL参数
      this.$router.replace({ query: {} })
      this.loadData()
    },
    handleSizeChange(size) {
      this.pageSize = size
      this.loadData()
    },
    handlePageChange(page) {
      this.currentPage = page
      this.loadData()
    },
    handleCreate() {
      this.$router.push('/workorders/create')
    },
    handleView(row) {
      this.$router.push(`/workorders/${row.id}`)
    },
    handleEdit(row) {
      this.$router.push(`/workorders/${row.id}/edit`)
    },
    handleRowClick(row) {
      this.handleView(row)
    },
    handleDelete(row) {
      this.$confirm(`确定要删除施工单 ${row.order_number} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await workOrderAPI.delete(row.id)
          this.$message.success('删除成功')
          this.loadData()
        } catch (error) {
          this.$message.error('删除失败')
          console.error(error)
        }
      }).catch(() => {})
    },
    getDeliveryDateStyle(date, status) {
      if (status === 'completed' || status === 'cancelled') {
        return {}
      }
      
      const today = new Date()
      const deliveryDate = new Date(date)
      const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) {
        return { color: '#F56C6C', fontWeight: 'bold' } // 已逾期
      } else if (diffDays <= 3) {
        return { color: '#E6A23C', fontWeight: 'bold' } // 即将到期
      }
      return {}
    }
  }
}
</script>

<style scoped>
.workorder-list {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.el-table {
  cursor: pointer;
}
</style>

