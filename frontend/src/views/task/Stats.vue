<template>
  <div class="task-stats">
    <el-card>
      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-date-picker
              v-model="filters.start_date"
              type="date"
              placeholder="开始日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              style="width: 100%;"
              @change="handleSearch"
            ></el-date-picker>
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
            ></el-date-picker>
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
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="6" style="text-align: right;">
            <el-button icon="el-icon-refresh-left" @click="handleReset">重置</el-button>
            <el-button type="primary" icon="el-icon-refresh" @click="loadData" style="margin-left: 10px;">刷新</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 统计摘要 -->
      <div v-if="summary" class="summary-section" style="margin-top: 20px;">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">操作员总数</div>
                <div class="summary-value">{{ summary.total_operators }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">任务总数</div>
                <div class="summary-value">{{ summary.total_tasks }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">已完成任务</div>
                <div class="summary-value">{{ summary.total_completed_tasks }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">完成总数</div>
                <div class="summary-value">{{ summary.total_completed_quantity }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">不良品总数</div>
                <div class="summary-value" style="color: #F56C6C;">{{ summary.total_defective_quantity }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="summary-item">
                <div class="summary-label">总体不良品率</div>
                <div class="summary-value" :style="{ color: summary.overall_defective_rate > 5 ? '#F56C6C' : '#67C23A' }">
                  {{ summary.overall_defective_rate }}%
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 操作员统计表格 -->
      <el-table
        v-loading="loading"
        :data="statsList"
        border
        style="width: 100%; margin-top: 20px;"
        :default-sort="{prop: 'total_completed_quantity', order: 'descending'}"
      >
        <el-table-column prop="operator_name" label="操作员" width="150" fixed="left">
          <template slot-scope="scope">
            <div>
              <div style="font-weight: bold;">{{ scope.row.operator_name }}</div>
              <div style="font-size: 12px; color: #909399;">{{ scope.row.operator_username }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="departments" label="所属部门" width="200">
          <template slot-scope="scope">
            <el-tag
              v-for="dept in scope.row.departments"
              :key="dept"
              size="small"
              style="margin-right: 5px;"
            >{{ dept }}</el-tag>
            <span v-if="scope.row.departments.length === 0" style="color: #909399;">未分配</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_tasks" label="任务总数" width="100" sortable>
          <template slot-scope="scope">
            <el-tag size="small">{{ scope.row.total_tasks }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务状态" width="220">
          <template slot-scope="scope">
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div>
                <el-tag type="success" size="small">已完成: {{ scope.row.completed_tasks }}</el-tag>
              </div>
              <div>
                <el-tag type="warning" size="small">进行中: {{ scope.row.in_progress_tasks }}</el-tag>
                <el-tag type="info" size="small" style="margin-left: 5px;">待开始: {{ scope.row.pending_tasks }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="completion_rate" label="完成率" width="100" sortable>
          <template slot-scope="scope">
            <el-progress
              :percentage="scope.row.completion_rate"
              :color="getProgressColor(scope.row.completion_rate)"
            ></el-progress>
          </template>
        </el-table-column>
        <el-table-column prop="total_completed_quantity" label="完成总数" width="120" sortable>
          <template slot-scope="scope">
            <span style="font-weight: bold; color: #409EFF;">{{ scope.row.total_completed_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_defective_quantity" label="不良品数" width="120" sortable>
          <template slot-scope="scope">
            <span style="color: #F56C6C;">{{ scope.row.total_defective_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="defective_rate" label="不良品率" width="120" sortable>
          <template slot-scope="scope">
            <el-tag
              :type="getDefectiveRateType(scope.row.defective_rate)"
              size="small"
            >{{ scope.row.defective_rate }}%</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avg_completion_hours" label="平均完成时间(小时)" width="150" sortable>
          <template slot-scope="scope">
            <span v-if="scope.row.avg_completion_hours !== null">
              {{ scope.row.avg_completion_hours }} 小时
            </span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { workOrderTaskAPI, departmentAPI } from '@/api/workorder'

export default {
  name: 'TaskStats',
  data() {
    return {
      loading: false,
      statsList: [],
      summary: null,
      departmentList: [],
      filters: {
        start_date: null,
        end_date: null,
        department_id: null
      }
    }
  },
  mounted() {
    this.loadDepartmentList()
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
    async loadData() {
      this.loading = true
      try {
        const params = {}
        if (this.filters.start_date) {
          params.start_date = this.filters.start_date
        }
        if (this.filters.end_date) {
          params.end_date = this.filters.end_date
        }
        if (this.filters.department_id) {
          params.department_id = this.filters.department_id
        }

        const res = await workOrderTaskAPI.getCollaborationStats(params)
        this.statsList = res.results || []
        this.summary = res.summary || null
      } catch (error) {
        console.error('加载统计数据失败:', error)
        this.$message.error('加载统计数据失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.loadData()
    },
    handleReset() {
      this.filters = {
        start_date: null,
        end_date: null,
        department_id: null
      }
      this.loadData()
    },
    getProgressColor(percentage) {
      if (percentage >= 80) return '#67C23A'
      if (percentage >= 50) return '#E6A23C'
      return '#F56C6C'
    },
    getDefectiveRateType(rate) {
      if (rate > 5) return 'danger'
      if (rate > 2) return 'warning'
      return 'success'
    }
  }
}
</script>

<style scoped>
.task-stats {
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

