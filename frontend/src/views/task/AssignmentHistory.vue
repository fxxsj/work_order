<template>
  <div class="assignment-history">
    <el-card>
      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="filters.task_id"
              placeholder="任务ID"
              clearable
              @clear="handleSearch"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="filters.start_date"
              type="date"
              placeholder="开始日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              style="width: 100%;"
              @change="handleSearch"
            />
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="filters.end_date"
              type="date"
              placeholder="结束日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              style="width: 100%;"
              @change="handleSearch"
            />
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="filters.department_id"
              placeholder="部门筛选"
              clearable
              filterable
              style="width: 100%;"
              @change="handleSearch"
            >
              <el-option
                v-for="dept in departmentList"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 10px;">
          <el-col :span="6">
            <el-select
              v-model="filters.operator_id"
              placeholder="操作员筛选"
              clearable
              filterable
              style="width: 100%;"
              @change="handleSearch"
            >
              <el-option
                v-for="user in userList"
                :key="user.id"
                :label="user.username"
                :value="user.id"
              />
            </el-select>
          </el-col>
          <el-col :span="18" style="text-align: right;">
            <el-button icon="el-icon-refresh-left" @click="handleReset">
              重置
            </el-button>
            <el-button
              type="primary"
              icon="el-icon-refresh"
              style="margin-left: 10px;"
              @click="loadData"
            >
              刷新
            </el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 统计摘要 -->
      <div v-if="summary" class="summary-section" style="margin-top: 20px;">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">
                  总记录数
                </div>
                <div class="summary-value">
                  {{ summary.total }}
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">
                  涉及任务数
                </div>
                <div class="summary-value">
                  {{ summary.unique_tasks }}
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">
                  涉及部门数
                </div>
                <div class="summary-value">
                  {{ summary.unique_departments }}
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">
                  涉及操作员数
                </div>
                <div class="summary-value">
                  {{ summary.unique_operators }}
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 分派历史表格 -->
      <el-table
        v-loading="loading"
        :data="historyList"
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
      <div class="pagination-section" style="margin-top: 20px; text-align: right;">
        <el-pagination
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.page_size"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { workOrderTaskAPI, departmentAPI, authAPI } from '@/api/modules'

export default {
  name: 'AssignmentHistory',
  data() {
    return {
      loading: false,
      historyList: [],
      summary: null,
      departmentList: [],
      userList: [],
      filters: {
        task_id: null,
        start_date: null,
        end_date: null,
        department_id: null,
        operator_id: null
      },
      pagination: {
        page: 1,
        page_size: 20,
        total: 0
      }
    }
  },
  mounted() {
    this.loadDepartmentList()
    this.loadUserList()
    this.loadData()
  },
  methods: {
    async loadDepartmentList() {
      try {
        const res = await departmentAPI.getList({ page_size: 1000 })
        this.departmentList = res.results || []
      } catch (error) {
        console.error('加载部门列表失败:', error)
        this.$message.error('加载部门列表失败')
      }
    },
    async loadUserList() {
      try {
        const response = await authAPI.getUsersByDepartment(null)
        this.userList = response || []
      } catch (error) {
        console.error('加载用户列表失败:', error)
        this.userList = []
      }
    },
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.page_size
        }

        if (this.filters.task_id) {
          params.task_id = this.filters.task_id
        }
        if (this.filters.start_date) {
          params.start_date = this.filters.start_date
        }
        if (this.filters.end_date) {
          params.end_date = this.filters.end_date
        }
        if (this.filters.department_id) {
          params.department_id = this.filters.department_id
        }
        if (this.filters.operator_id) {
          params.operator_id = this.filters.operator_id
        }

        const res = await workOrderTaskAPI.getAssignmentHistory(params)
        this.historyList = res.results || []
        this.pagination.total = res.total || 0

        // 计算统计摘要
        this.calculateSummary()
      } catch (error) {
        console.error('加载分派历史失败:', error)
        this.$message.error('加载分派历史失败')
      } finally {
        this.loading = false
      }
    },
    calculateSummary() {
      if (!this.historyList || this.historyList.length === 0) {
        this.summary = {
          total: 0,
          unique_tasks: 0,
          unique_departments: 0,
          unique_operators: 0
        }
        return
      }

      const uniqueTasks = new Set()
      const uniqueDepartments = new Set()
      const uniqueOperators = new Set()

      this.historyList.forEach(item => {
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
        total: this.pagination.total,
        unique_tasks: uniqueTasks.size,
        unique_departments: uniqueDepartments.size,
        unique_operators: uniqueOperators.size
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadData()
    },
    handleReset() {
      this.filters = {
        task_id: null,
        start_date: null,
        end_date: null,
        department_id: null,
        operator_id: null
      }
      this.pagination.page = 1
      this.loadData()
    },
    handleSizeChange(val) {
      this.pagination.page_size = val
      this.pagination.page = 1
      this.loadData()
    },
    handleCurrentChange(val) {
      this.pagination.page = val
      this.loadData()
    },
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

.filter-section {
  margin-bottom: 20px;
}

.summary-section {
  margin-bottom: 20px;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
</style>

