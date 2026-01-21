<template>
  <div class="assignment-history">
    <!-- 1. 统计信息 - 放在卡片外部，与 TaskStats 风格一致 -->
    <el-row v-if="summary" :gutter="20" class="stats-section">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409EFF;">
              <i class="el-icon-s-order"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.total }}</div>
              <div class="stat-label">总记录数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67C23A;">
              <i class="el-icon-s-claim"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.unique_tasks }}</div>
              <div class="stat-label">涉及任务数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #E6A23C;">
              <i class="el-icon-office-building"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.unique_departments }}</div>
              <div class="stat-label">涉及部门数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #909399;">
              <i class="el-icon-user"></i>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.unique_operators }}</div>
              <div class="stat-label">涉及操作员数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 主内容卡片 -->
    <el-card>
      <!-- 头部筛选区域 - 使用 header-section 布局 -->
      <div class="header-section">
        <div class="filter-group">
          <el-date-picker
            v-model="filters.start_date"
            type="date"
            placeholder="开始日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            style="width: 150px;"
            @change="handleSearch"
          />
          <el-date-picker
            v-model="filters.end_date"
            type="date"
            placeholder="结束日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            style="width: 150px;"
            @change="handleSearch"
          />
          <el-select
            v-model="filters.department_id"
            placeholder="部门筛选"
            clearable
            filterable
            style="width: 150px;"
            @change="handleSearch"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
          <el-select
            v-model="filters.operator_id"
            placeholder="操作员筛选"
            clearable
            filterable
            style="width: 150px;"
            @change="handleSearch"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </div>
        <div class="action-group">
          <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
          <el-button type="primary" icon="el-icon-refresh" @click="loadData">刷新</el-button>
        </div>
      </div>

      <!-- 分派历史表格：只在有数据时显示 -->
      <el-table
        v-if="tableData.length > 0"
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%; margin-top: 20px;"
        :default-sort="{prop: 'created_at', order: 'descending'}"
      >
        <el-table-column
          prop="created_at"
          label="调整时间"
          width="180"
          sortable
        >
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="work_order_info" label="施工单" width="150">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.work_order_info"
              type="primary"
              @click="goToWorkOrder(scope.row.work_order_info.id)"
            >
              {{ scope.row.work_order_info.order_number }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="task_info" label="任务" width="200">
          <template slot-scope="scope">
            <div v-if="scope.row.task_info">
              <div style="font-weight: bold;">
                {{ scope.row.task_info.work_content }}
              </div>
              <div style="font-size: 12px; color: #909399;">
                任务ID: {{ scope.row.task_info.id }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="调整内容" min-width="300">
          <template slot-scope="scope">
            <div style="white-space: pre-wrap;">
              {{ scope.row.content }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="task_info" label="当前分派" width="200">
          <template slot-scope="scope">
            <div v-if="scope.row.task_info">
              <div>
                <el-tag v-if="scope.row.task_info.assigned_department" size="small">
                  {{ scope.row.task_info.assigned_department }}
                </el-tag>
                <span v-else style="color: #909399;">未分配部门</span>
              </div>
              <div style="margin-top: 5px;">
                <el-tag v-if="scope.row.task_info.assigned_operator" size="small" type="info">
                  {{ scope.row.task_info.assigned_operator }}
                </el-tag>
                <span v-else style="color: #909399;">未分配操作员</span>
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="操作人" width="120">
          <template slot-scope="scope">
            {{ scope.row.operator_name || '-' }}
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
        description="暂无分派历史记录"
        :image-size="200"
      >
        <el-button v-if="hasFilters" @click="handleReset">重置筛选</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script>
import { workOrderTaskAPI, departmentAPI, authAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'
import Pagination from '@/components/common/Pagination.vue'

// 筛选条件初始值常量
const FILTERS_INITIAL = {
  start_date: null,
  end_date: null,
  department_id: null,
  operator_id: null
}

export default {
  name: 'AssignmentHistory',
  components: { Pagination },
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // Mixin 需要的属性
      apiService: workOrderTaskAPI,
      permissionPrefix: 'workordertask',

      // 筛选条件（覆盖 mixin 的 filters）
      filters: { ...FILTERS_INITIAL },

      // 统计摘要
      summary: null,

      // 下拉列表数据
      departmentList: [],
      userList: []
    }
  },

  computed: {
    /**
     * 是否有筛选条件
     */
    hasFilters() {
      return Object.values(this.filters).some(v => v !== null && v !== '')
    }
  },

  mounted() {
    this.loadDepartmentList()
    this.loadUserList()
    this.loadData()
  },

  methods: {
    /**
     * 实现 fetchData 方法（listPageMixin 要求）
     */
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize
      }

      // 添加筛选参数
      Object.entries(this.filters).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          params[key] = value
        }
      })

      const response = await workOrderTaskAPI.getAssignmentHistory(params)

      // 计算统计摘要
      this.calculateSummary(response.results || [], response.total || 0)

      return response
    },

    /**
     * 计算统计摘要
     */
    calculateSummary(historyList, totalCount) {
      if (!historyList || historyList.length === 0) {
        this.summary = {
          total: totalCount,
          unique_tasks: 0,
          unique_departments: 0,
          unique_operators: 0
        }
        return
      }

      const uniqueTasks = new Set()
      const uniqueDepartments = new Set()
      const uniqueOperators = new Set()

      historyList.forEach(item => {
        if (item.task_info && item.task_info.id) {
          uniqueTasks.add(item.task_info.id)
        }
        if (item.task_info && item.task_info.assigned_department) {
          uniqueDepartments.add(item.task_info.assigned_department)
        }
        if (item.task_info && item.task_info.assigned_operator) {
          uniqueOperators.add(item.task_info.assigned_operator)
        }
        if (item.operator_name) {
          uniqueOperators.add(item.operator_name)
        }
      })

      this.summary = {
        total: totalCount,
        unique_tasks: uniqueTasks.size,
        unique_departments: uniqueDepartments.size,
        unique_operators: uniqueOperators.size
      }
    },

    /**
     * 加载部门列表
     */
    async loadDepartmentList() {
      try {
        const res = await departmentAPI.getList({ page_size: 1000 })
        this.departmentList = res.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载部门列表')
      }
    },

    /**
     * 加载用户列表
     */
    async loadUserList() {
      try {
        const response = await authAPI.getUsersByDepartment(null)
        this.userList = response || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载用户列表')
        this.userList = []
      }
    },

    /**
     * 重置筛选条件
     */
    handleReset() {
      this.filters = { ...FILTERS_INITIAL }
      this.currentPage = 1
      this.loadData()
    },

    /**
     * 格式化日期时间
     */
    formatDateTime(datetime) {
      if (!datetime) return '-'
      const date = new Date(datetime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },

    /**
     * 跳转到施工单详情
     */
    goToWorkOrder(workOrderId) {
      this.$router.push({
        name: 'WorkOrderDetail',
        params: { id: workOrderId }
      })
    }
  }
}
</script>

<style scoped>
.assignment-history {
  padding: 20px;
}

/* 统计区域样式 - 与 TaskStats 保持一致 */
.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  margin-right: 15px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 头部筛选区域 - 符合规范的布局 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group,
.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
</style>
