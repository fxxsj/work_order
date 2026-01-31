<template>
  <div class="supervisor-dashboard">
    <el-card v-loading="loading">
      <!-- 页面头部：部门选择器 -->
      <div slot="header" class="header-section">
        <div class="header-title">
          <i class="el-icon-s-data" />
          <span>主管看板</span>
        </div>
        <div class="header-actions">
          <el-select
            v-if="departmentList.length > 1"
            v-model="selectedDepartment"
            placeholder="选择部门"
            filterable
            @change="handleDepartmentChange"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
          <el-tag v-else-if="departmentList.length === 1" type="info">
            {{ departmentList[0].name }}
          </el-tag>
          <el-button-group style="margin-left: 10px;">
            <el-button
              :type="viewMode === 'dashboard' ? 'primary' : ''"
              icon="el-icon-s-data"
              @click="viewMode = 'dashboard'"
            >
              统计视图
            </el-button>
            <el-button
              :type="viewMode === 'dragdrop' ? 'primary' : ''"
              icon="el-icon-rank"
              @click="viewMode = 'dragdrop'"
            >
              拖拽分派
            </el-button>
          </el-button-group>
          <el-button icon="el-icon-refresh" @click="loadWorkloadData">刷新</el-button>
        </div>
      </div>

      <!-- 权限检查 -->
      <el-alert
        v-if="!isSupervisor"
        title="权限不足"
        type="error"
        description="您没有权限访问主管看板，需要具有施工单修改权限。"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />

      <!-- 拖拽分派视图 -->
      <div v-else-if="viewMode === 'dragdrop'">
        <task-drag-drop-list
          v-if="!loading && departmentTasks.length > 0"
          :tasks="departmentTasks"
          :operators="operators"
          @task-assigned="handleTaskAssigned"
          @task-reassigned="handleTaskReassigned"
          @task-unassigned="handleTaskUnassigned"
        />
        <el-empty
          v-else-if="!loading && departmentTasks.length === 0"
          description="暂无任务数据"
          :image-size="200"
        />
      </div>

      <!-- 数据内容 -->
      <div v-else-if="viewMode === 'dashboard' && workloadData">
        <!-- 汇总统计卡片 -->
        <el-row :gutter="20" class="summary-cards">
          <el-col :span="6">
            <el-card shadow="hover" class="summary-card">
              <div class="stat-item">
                <div class="stat-icon total">
                  <i class="el-icon-document" />
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ workloadData.summary.total_tasks }}</div>
                  <div class="stat-label">总任务数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="summary-card">
              <div class="stat-item">
                <div class="stat-icon pending">
                  <i class="el-icon-time" />
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ workloadData.summary.pending_tasks }}</div>
                  <div class="stat-label">待处理</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="summary-card">
              <div class="stat-item">
                <div class="stat-icon progress">
                  <i class="el-icon-loading" />
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ workloadData.summary.in_progress_tasks }}</div>
                  <div class="stat-label">进行中</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="summary-card">
              <div class="stat-item">
                <div class="stat-icon completed">
                  <i class="el-icon-circle-check" />
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ workloadData.summary.completed_tasks }}</div>
                  <div class="stat-label">已完成</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 完成率统计 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card shadow="hover">
              <div slot="header" class="card-header">
                <span>部门完成率</span>
              </div>
              <div class="completion-rate">
                <el-progress
                  type="circle"
                  :percentage="workloadData.summary.completion_rate"
                  :color="getProgressColor(workloadData.summary.completion_rate)"
                  :width="150"
                >
                  <template slot="default">
                    <span class="progress-text">{{ workloadData.summary.completion_rate }}%</span>
                  </template>
                </el-progress>
              </div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover">
              <div slot="header" class="card-header">
                <span>优先级分布</span>
              </div>
              <div class="priority-distribution">
                <div class="priority-item">
                  <span class="priority-label">紧急</span>
                  <el-tag size="small" type="danger">{{ workloadData.priority_distribution.urgent }}</el-tag>
                </div>
                <div class="priority-item">
                  <span class="priority-label">高</span>
                  <el-tag size="small" type="warning">{{ workloadData.priority_distribution.high }}</el-tag>
                </div>
                <div class="priority-item">
                  <span class="priority-label">普通</span>
                  <el-tag size="small" type="info">{{ workloadData.priority_distribution.normal }}</el-tag>
                </div>
                <div class="priority-item">
                  <span class="priority-label">低</span>
                  <el-tag size="small">{{ workloadData.priority_distribution.low }}</el-tag>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 操作员工作负载 -->
        <el-card shadow="hover" style="margin-top: 20px;">
          <div slot="header" class="card-header">
            <span>操作员工作负载</span>
          </div>
          <el-empty
            v-if="workloadData.operators.length === 0"
            description="暂无操作员数据"
            :image-size="100"
          />
          <el-row v-else :gutter="20">
            <el-col
              v-for="operator in workloadData.operators"
              :key="operator.operator_id"
              :span="8"
              style="margin-bottom: 20px;"
            >
              <el-card shadow="hover" class="operator-card" @click.native="handleOperatorClick(operator.operator_id)">
                <div class="operator-header">
                  <div class="operator-avatar">
                    <i class="el-icon-user" />
                  </div>
                  <div class="operator-info">
                    <div class="operator-name">{{ operator.operator_name }}</div>
                    <div class="operator-total">共 {{ operator.total_count }} 个任务</div>
                  </div>
                </div>
                <div class="operator-stats">
                  <div class="stat-row">
                    <span class="stat-label">待处理:</span>
                    <el-tag size="mini" type="warning">{{ operator.pending_count }}</el-tag>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">进行中:</span>
                    <el-tag size="mini" type="primary">{{ operator.in_progress_count }}</el-tag>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">已完成:</span>
                    <el-tag size="mini" type="success">{{ operator.completed_count }}</el-tag>
                  </div>
                </div>
                <div class="operator-progress">
                  <el-progress
                    :percentage="operator.completion_rate"
                    :color="getProgressColor(operator.completion_rate)"
                    :stroke-width="8"
                  />
                  <div class="progress-label">完成率: {{ operator.completion_rate }}%</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-else-if="!loading"
        description="暂无数据"
        :image-size="200"
      />
    </el-card>
  </div>
</template>

<script>
import { workOrderTaskAPI, departmentAPI, authAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'
import TaskDragDropList from './components/TaskDragDropList.vue'

export default {
  name: 'SupervisorDashboard',
  components: {
    TaskDragDropList
  },

  data() {
    return {
      loading: false,
      viewMode: 'dashboard', // dashboard or dragdrop
      departmentList: [],
      selectedDepartment: null,
      workloadData: null,
      departmentTasks: [],
      operators: []
    }
  },

  computed: {
    isSupervisor() {
      return this.$store.getters['auth/hasPermission']('workorder.change_workorder')
    }
  },

  created() {
    this.initData()
  },

  methods: {
    /**
     * 初始化数据
     */
    async initData() {
      await this.loadDepartmentList()
      if (this.departmentList.length > 0) {
        this.selectedDepartment = this.departmentList[0].id
        await this.loadWorkloadData()
      }
    },

    /**
     * 加载部门列表（加载用户所属的部门）
     */
    async loadDepartmentList() {
      this.loading = true
      try {
        // 获取用户所属的部门
        const user = this.$store.getters['auth/currentUser']
        if (user && user.profile && user.profile.departments) {
          this.departmentList = user.profile.departments.map(dept => ({
            id: dept.id,
            name: dept.name
          }))
        } else {
          // 如果用户没有部门信息，从API获取所有部门
          const response = await departmentAPI.getList({ page_size: 1000 })
          this.departmentList = response.results || []
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '加载部门列表')
      } finally {
        this.loading = false
      }
    },

    /**
     * 加载工作负载数据
     */
    async loadWorkloadData() {
      if (!this.selectedDepartment) return

      this.loading = true
      try {
        // 加载工作负载统计数据
        const response = await workOrderTaskAPI.getDepartmentWorkload({
          department_id: this.selectedDepartment
        })
        this.workloadData = response

        // 加载部门任务列表（用于拖拽视图）
        await this.loadDepartmentTasks()

        // 加载操作员列表
        await this.loadOperators()
      } catch (error) {
        ErrorHandler.showMessage(error, '加载工作负载数据')
      } finally {
        this.loading = false
      }
    },

    /**
     * 加载部门任务列表
     */
    async loadDepartmentTasks() {
      if (!this.selectedDepartment) return

      try {
        const response = await workOrderTaskAPI.getList({
          assigned_department: this.selectedDepartment,
          page_size: 1000,
          ordering: '-created_at'
        })
        // 展开任务数据以包含关联字段
        this.departmentTasks = (response.results || []).map(task => ({
          ...task,
          work_order__order_number: task.work_order?.order_number,
          work_order__priority: task.work_order?.priority,
          process_name: task.work_order_process_info?.process?.name
        }))
      } catch (error) {
        ErrorHandler.showMessage(error, '加载任务列表')
      }
    },

    /**
     * 加载部门操作员列表
     */
    async loadOperators() {
      if (!this.selectedDepartment) return

      try {
        const response = await authAPI.getUsersByDepartment(this.selectedDepartment)
        const users = response.data || response || []
        this.operators = users.map(user => ({
          id: user.id,
          name: `${user.first_name}${user.last_name}`.trim() || user.username
        }))
      } catch (error) {
        ErrorHandler.showMessage(error, '加载操作员列表')
      }
    },

    /**
     * 部门变化处理
     */
    handleDepartmentChange() {
      this.loadWorkloadData()
    },

    /**
     * 处理任务分配
     */
    async handleTaskAssigned({ task, operator }) {
      try {
        await this.$confirm(
          `将任务 "${task.work_content}" 分派给 ${operator.name}?`,
          '确认分派',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await workOrderTaskAPI.assign(task.id, {
          operator_id: operator.id
        })

        this.$message.success('分派成功')
        await this.loadWorkloadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '任务分派')
        }
      }
    },

    /**
     * 处理任务重新分配
     */
    async handleTaskReassigned({ task, fromOperator, toOperator }) {
      try {
        await this.$confirm(
          `将任务从 ${fromOperator.name} 转派给 ${toOperator.name}?`,
          '确认转派',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await workOrderTaskAPI.assign(task.id, {
          operator_id: toOperator.id
        })

        this.$message.success('转派成功')
        await this.loadWorkloadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '任务转派')
        }
      }
    },

    /**
     * 处理取消任务分配
     */
    async handleTaskUnassigned({ task, fromOperator }) {
      try {
        await this.$confirm(
          `取消将任务 "${task.work_content}" 分派给 ${fromOperator.name}?`,
          '确认取消分配',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await workOrderTaskAPI.assign(task.id, {
          operator_id: null
        })

        this.$message.success('取消分配成功')
        await this.loadWorkloadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '取消任务分配')
        }
      }
    },

    /**
     * 操作员卡片点击处理
     */
    handleOperatorClick(operatorId) {
      // 跳转到任务列表，并按操作员筛选
      this.$router.push({
        path: '/tasks',
        query: { assigned_operator: operatorId }
      })
    },

    /**
     * 获取进度条颜色
     */
    getProgressColor(percentage) {
      if (percentage >= 80) return '#67c23a' // green
      if (percentage >= 50) return '#e6a23c' // orange
      return '#f56c6c' // red
    }
  }
}
</script>

<style scoped>
.supervisor-dashboard {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.header-title i {
  margin-right: 8px;
  font-size: 20px;
  color: #409eff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.summary-cards {
  margin-bottom: 20px;
}

.summary-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-item {
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
  margin-right: 15px;
}

.stat-icon i {
  font-size: 28px;
  color: #fff;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.progress {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.completion-rate {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.progress-text {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.priority-distribution {
  padding: 10px 0;
}

.priority-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.priority-item:last-child {
  border-bottom: none;
}

.priority-label {
  font-size: 14px;
  color: #606266;
}

.operator-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #ebeef5;
}

.operator-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
  border-color: #409eff;
}

.operator-header {
  display: flex;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 15px;
}

.operator-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.operator-avatar i {
  font-size: 24px;
  color: #fff;
}

.operator-info {
  flex: 1;
}

.operator-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.operator-total {
  font-size: 12px;
  color: #909399;
}

.operator-stats {
  margin-bottom: 15px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.stat-row .stat-label {
  font-size: 13px;
  color: #606266;
}

.operator-progress {
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.progress-label {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>
