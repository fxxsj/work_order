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
              @input="handleSearchDebounced"
              @clear="handleSearchDebounced"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
            </el-input>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.status"
              placeholder="状态"
              clearable
              @change="handleSearchDebounced"
            >
              <el-option label="待开始" value="pending" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已暂停" value="paused" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.priority"
              placeholder="优先级"
              clearable
              @change="handleSearchDebounced"
            >
              <el-option label="低" value="low" />
              <el-option label="普通" value="normal" />
              <el-option label="高" value="high" />
              <el-option label="紧急" value="urgent" />
            </el-select>
          </el-col>
          <el-col v-if="isSalesperson" :span="3">
            <el-select
              v-model="filters.approval_status"
              placeholder="审核状态"
              clearable
              @change="handleSearchDebounced"
            >
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select
              v-model="filters.customer__salesperson"
              placeholder="业务员"
              clearable
              @change="handleSearchDebounced"
            >
              <el-option
                v-for="salesperson in salespersons"
                :key="salesperson.id"
                :label="salesperson.username"
                :value="salesperson.id"
              />
            </el-select>
          </el-col>
          <el-col :span="isSalesperson ? 7 : 10" style="text-align: right;">
            <el-button
              icon="el-icon-refresh"
              circle
              title="重置筛选"
              @click="handleReset"
            />
            <el-button
              v-if="canExport()"
              type="success"
              icon="el-icon-download"
              :loading="exporting"
              style="margin-left: 10px;"
              @click="handleExport"
            >
              导出Excel
            </el-button>
            <el-button
              type="primary"
              icon="el-icon-plus"
              style="margin-left: 10px;"
              @click="handleCreate"
            >
              新建施工单
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 骨架屏 -->
      <SkeletonLoader
        v-if="loading && tableData.length === 0"
        type="table"
        :rows="5"
        :columns="11"
        :column-widths="['18%', '20%', '12%', '12%', '20%', '12%', '12%', '10%', '10%', '10%', '30%']"
        style="margin-top: 20px;"
      />

      <!-- 表格 -->
      <el-table
        v-else
        v-loading="loading && tableData.length > 0"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
        @row-click="handleRowClick"
      >
        <el-table-column
          prop="order_number"
          label="施工单号"
          width="150"
          fixed
        />
        <el-table-column prop="customer_name" label="客户" width="150" />
        <el-table-column prop="salesperson_name" label="业务员" width="100">
          <template slot-scope="scope">
            {{ scope.row.salesperson_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="product_name" label="产品名称" min-width="200" />
        <el-table-column
          prop="quantity"
          label="生产数量"
          width="120"
          align="right"
        >
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
            />
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
        <el-table-column prop="manager_name" label="制表人" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click.stop="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click.stop="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
              type="text"
              size="small"
              style="color: #F56C6C;"
              @click.stop="handleDelete(scope.row)"
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
    </el-card>
  </div>
</template>

<script>
import { workOrderAPI, authAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import exportMixin from '@/mixins/exportMixin'
import { debounce } from '@/utils/debounce'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'WorkOrderList',
  components: { SkeletonLoader, Pagination },
  mixins: [listPageMixin, crudPermissionMixin, exportMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: workOrderAPI,
      permissionPrefix: 'workorder',

      // 自定义数据
      salespersons: [],
      filters: {
        search: '',
        status: '',
        priority: '',
        approval_status: '',
        customer__salesperson: '',
        delivery_date__gte: '',
        delivery_date__lte: ''
      }
    }
  },
  computed: {
    // 检查用户是否为业务员
    isSalesperson() {
      const userInfo = this.$store.getters['user/currentUser']
      return userInfo && userInfo.is_salesperson
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
    if (this.$route.query.status) {
      this.filters.status = this.$route.query.status
    }
    if (this.$route.query.priority) {
      this.filters.priority = this.$route.query.priority
    }
    if (this.$route.query.delivery_date__gte) {
      this.filters.delivery_date__gte = this.$route.query.delivery_date__gte
    }
    if (this.$route.query.delivery_date__lte) {
      this.filters.delivery_date__lte = this.$route.query.delivery_date__lte
    }
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
        ordering: '-created_at'
      }
      if (this.filters.search) params.search = this.filters.search
      if (this.filters.status) params.status = this.filters.status
      if (this.filters.priority) params.priority = this.filters.priority
      if (this.filters.approval_status) params.approval_status = this.filters.approval_status
      if (this.filters.customer__salesperson) params.customer__salesperson = this.filters.customer__salesperson
      if (this.filters.delivery_date__gte) params.delivery_date__gte = this.filters.delivery_date__gte
      if (this.filters.delivery_date__lte) params.delivery_date__lte = this.filters.delivery_date__lte
      return await this.apiService.getList(params)
    },
    async loadSalespersons() {
      try {
        this.salespersons = await authAPI.getSalespersons() || []
      } catch (error) {
        console.error('加载业务员列表失败:', error)
        this.salespersons = []
      }
    },
    handleSearch() { this.currentPage = 1; this.loadData() },
    handleSearchDebounced: debounce(function () { this.currentPage = 1; this.loadData() }, 300),
    handleReset() {
      this.filters = {
        search: '',
        status: '',
        priority: '',
        approval_status: '',
        customer__salesperson: '',
        delivery_date__gte: '',
        delivery_date__lte: ''
      }
      this.currentPage = 1
      if (Object.keys(this.$route.query).length > 0) {
        this.$router.replace({ query: {} }).catch(err => {
          if (err.name !== 'NavigationDuplicated') console.error('导航错误:', err)
        })
      }
      this.loadData()
    },
    handleCreate() { this.$router.push('/workorders/create') },
    handleView(row) { this.$router.push(`/workorders/${row.id}`) },
    handleEdit(row) { if (row.approval_status === 'approved') { this.$confirm('该施工单已审核通过。核心字段（产品、工序、版选择等）不能修改，非核心字段（备注、交货日期等）可以修改。确定要继续编辑吗？', '编辑已审核的施工单', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(() => { this.$router.push(`/workorders/${row.id}/edit`) }).catch(() => {}) } else { this.$router.push(`/workorders/${row.id}/edit`) } },
    handleRowClick(row) { this.handleView(row) },
    handleDelete(row) { this.$confirm(`确定要删除施工单 ${row.order_number} 吗？`, '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }).then(async () => { try { await workOrderAPI.delete(row.id); this.$message.success('删除成功'); this.loadData() } catch { this.$message.error('删除失败') } }).catch(() => {}) },
    getDeliveryDateStyle(date, status) {
      if (status === 'completed' || status === 'cancelled') return {}
      const diffDays = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
      if (diffDays < 0) return { color: '#F56C6C', fontWeight: 'bold' }
      if (diffDays <= 3) return { color: '#E6A23C', fontWeight: 'bold' }
      return {}
    },
    async handleExport() {
      try {
        this.exporting = true
        const params = {}
        if (this.filters.search) params.search = this.filters.search
        if (this.filters.status) params.status = this.filters.status
        if (this.filters.priority) params.priority = this.filters.priority
        if (this.filters.approval_status) params.approval_status = this.filters.approval_status
        if (this.filters.customer__salesperson) params.customer__salesperson = this.filters.customer__salesperson
        if (this.filters.delivery_date__gte) params.delivery_date__gte = this.filters.delivery_date__gte
        if (this.filters.delivery_date__lte) params.delivery_date__lte = this.filters.delivery_date__lte
        const now = new Date()
        const filename = `施工单列表_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.xlsx`
        params.filename = filename
        const response = await workOrderAPI.export(params)
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        if (error.response && error.response.data) {
          const reader = new FileReader()
          reader.onload = () => { this.$message.error(reader.result) }
          reader.readAsText(error.response.data)
        } else { this.$message.error('导出失败：' + (error.message || '未知错误')) }
      } finally { this.exporting = false }
    }
  }
}
</script>

<style scoped>
.workorder-list { padding: 20px; }
.filter-section { margin-bottom: 20px; }
.el-table { cursor: pointer; }
</style>

