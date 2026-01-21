<template>
  <div class="task-stats">
    <!-- 统计摘要（卡片外部，与任务看板风格统一） -->
    <div v-if="summary" class="summary-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #409EFF;">
                <i class="el-icon-user"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ summary.total_operators }}
                </div>
                <div class="stat-label">
                  操作员总数
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #909399;">
                <i class="el-icon-s-order"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ summary.total_tasks }}
                </div>
                <div class="stat-label">
                  任务总数
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #67C23A;">
                <i class="el-icon-circle-check"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ summary.total_completed_tasks }}
                </div>
                <div class="stat-label">
                  已完成任务
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #E6A23C;">
                <i class="el-icon-s-data"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ summary.total_completed_quantity }}
                </div>
                <div class="stat-label">
                  完成总数
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #F56C6C;">
                <i class="el-icon-warning"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ summary.total_defective_quantity }}
                </div>
                <div class="stat-label">
                  不良品总数
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card">
            <div class="stat-content">
              <div
                class="stat-icon"
                :style="{ backgroundColor: summary.overall_defective_rate > 5 ? '#F56C6C' : '#67C23A' }"
              >
                <i class="el-icon-pie-chart"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ summary.overall_defective_rate }}%
                </div>
                <div class="stat-label">
                  总体不良品率
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主内容卡片 -->
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
          <el-col :span="6" style="text-align: right;">
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

      <!-- 空状态显示 -->
      <el-empty
        v-if="!loading && statsList.length === 0"
        description="暂无统计数据"
        :image-size="200"
      >
        <p style="color: #909399; font-size: 14px;">
          请调整筛选条件或等待任务完成
        </p>
      </el-empty>

      <!-- 操作员统计表格 -->
      <el-table
        v-else
        v-loading="loading"
        :data="statsList"
        border
        style="width: 100%; margin-top: 20px;"
        :default-sort="{prop: 'total_completed_quantity', order: 'descending'}"
      >
        <el-table-column
          prop="operator_name"
          label="操作员"
          width="150"
          fixed="left"
        >
          <template slot-scope="scope">
            <div>
              <div style="font-weight: bold;">
                {{ scope.row.operator_name }}
              </div>
              <div style="font-size: 12px; color: #909399;">
                {{ scope.row.operator_username }}
              </div>
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
            >
              {{ dept }}
            </el-tag>
            <span v-if="scope.row.departments.length === 0" style="color: #909399;">未分配</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="total_tasks"
          label="任务总数"
          width="100"
          sortable
        >
          <template slot-scope="scope">
            <el-tag size="small">
              {{ scope.row.total_tasks }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务状态" width="220">
          <template slot-scope="scope">
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div>
                <el-tag type="success" size="small">
                  已完成: {{ scope.row.completed_tasks }}
                </el-tag>
              </div>
              <div>
                <el-tag type="warning" size="small">
                  进行中: {{ scope.row.in_progress_tasks }}
                </el-tag>
                <el-tag type="info" size="small" style="margin-left: 5px;">
                  待开始: {{ scope.row.pending_tasks }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="completion_rate"
          label="完成率"
          width="100"
          sortable
        >
          <template slot-scope="scope">
            <el-progress
              :percentage="scope.row.completion_rate"
              :color="getProgressColor(scope.row.completion_rate)"
            />
          </template>
        </el-table-column>
        <el-table-column
          prop="total_completed_quantity"
          label="完成总数"
          width="120"
          sortable
        >
          <template slot-scope="scope">
            <span style="font-weight: bold; color: #409EFF;">{{ scope.row.total_completed_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="total_defective_quantity"
          label="不良品数"
          width="120"
          sortable
        >
          <template slot-scope="scope">
            <span style="color: #F56C6C;">{{ scope.row.total_defective_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="defective_rate"
          label="不良品率"
          width="120"
          sortable
        >
          <template slot-scope="scope">
            <el-tag
              :type="getDefectiveRateType(scope.row.defective_rate)"
              size="small"
            >
              {{ scope.row.defective_rate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="avg_completion_hours"
          label="平均完成时间(小时)"
          width="150"
          sortable
        >
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
import { workOrderTaskAPI, departmentAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

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
        ErrorHandler.showMessage(error, '加载部门列表')
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
        ErrorHandler.showMessage(error, '加载统计数据')
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

/* 统计卡片样式（与任务看板 TaskStats 组件保持一致） */
.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  margin-right: 12px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}
</style>

