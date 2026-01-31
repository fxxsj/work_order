<template>
  <div class="operator-center">
    <!-- Summary cards row -->
    <el-row :gutter="20" class="summary-row">
      <el-col :span="6">
        <el-card class="summary-card">
          <div class="stat-value">{{ summary.my_total || 0 }}</div>
          <div class="stat-label">我的任务</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="summary-card pending">
          <div class="stat-value">{{ summary.my_pending || 0 }}</div>
          <div class="stat-label">待开始</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="summary-card progress">
          <div class="stat-value">{{ summary.my_in_progress || 0 }}</div>
          <div class="stat-label">进行中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="summary-card claimable">
          <div class="stat-value">{{ summary.claimable_count || 0 }}</div>
          <div class="stat-label">可认领</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Two-column layout: My Tasks | Claimable Tasks -->
    <el-row :gutter="20" class="task-pools">
      <!-- My Tasks -->
      <el-col :span="12">
        <el-card class="task-pool-card">
          <div slot="header" class="card-header">
            <span>我的任务</span>
            <el-tag :type="getPoolType('my')">{{ summary.my_total || 0 }}</el-tag>
          </div>
          <el-tabs v-model="myTasksActiveTab">
            <el-tab-pane label="全部" name="all">
              <OperatorTaskList
                :tasks="myTasks"
                :empty-text="'暂无任务'"
                :show-update-buttons="true"
                @task-click="handleTaskClick"
                @update="showUpdateDialog"
                @complete="showCompleteDialog"
              />
            </el-tab-pane>
            <el-tab-pane label="待开始" name="pending">
              <OperatorTaskList
                :tasks="myTasksByStatus('pending')"
                :empty-text="'暂无待开始任务'"
                :show-update-buttons="true"
                @task-click="handleTaskClick"
                @update="showUpdateDialog"
                @complete="showCompleteDialog"
              />
            </el-tab-pane>
            <el-tab-pane label="进行中" name="in_progress">
              <OperatorTaskList
                :tasks="myTasksByStatus('in_progress')"
                :empty-text="'暂无进行中任务'"
                :show-update-buttons="true"
                @task-click="handleTaskClick"
                @update="showUpdateDialog"
                @complete="showCompleteDialog"
              />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>

      <!-- Claimable Tasks -->
      <el-col :span="12">
        <el-card class="task-pool-card">
          <div slot="header" class="card-header">
            <span>可认领任务</span>
            <el-tag type="warning">{{ summary.claimable_count || 0 }}</el-tag>
          </div>
          <OperatorTaskList
            :tasks="claimableTasks"
            :show-claim-button="true"
            :claiming-task-id="claimingTaskId"
            :empty-text="'暂无可认领任务'"
            @claim="handleClaim"
            @task-click="handleTaskClick"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- Task Update Dialog -->
    <OperatorTaskUpdateDialog
      :visible.sync="updateDialogVisible"
      :task="currentTask"
      @success="handleUpdateSuccess"
    />
  </div>
</template>

<script>
import { workOrderTaskAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'
import OperatorTaskList from './components/OperatorTaskList.vue'
import OperatorTaskUpdateDialog from './components/OperatorTaskUpdateDialog.vue'

export default {
  name: 'OperatorCenter',

  components: {
    OperatorTaskList,
    OperatorTaskUpdateDialog
  },

  data() {
    return {
      loading: false,
      myTasks: [],
      claimableTasks: [],
      summary: {},
      myTasksActiveTab: 'all',
      claimingTaskId: null,
      updateDialogVisible: false,
      currentTask: null
    }
  },

  computed: {
    isOperator() {
      return !this.$store.getters['user/hasPermission']('workorder.change_workorder')
    },
    myTasksByStatus() {
      return (status) => this.myTasks.filter(t => t.status === status)
    },
    currentUser() {
      return this.$store.getters['user/currentUser']
    }
  },

  created() {
    if (!this.isOperator) {
      this.$message.warning('此页面仅供操作员使用')
      this.$router.push('/tasks')
      return
    }
    this.loadData()
  },

  methods: {
    async loadData() {
      this.loading = true
      try {
        const response = await workOrderTaskAPI.getOperatorCenterData()
        this.myTasks = response.my_tasks || []
        this.claimableTasks = response.claimable_tasks || []
        this.summary = response.summary || {}
      } catch (error) {
        ErrorHandler.showMessage(error, '加载任务中心')
      } finally {
        this.loading = false
      }
    },

    async handleClaim(task) {
      try {
        this.claimingTaskId = task.id
        await workOrderTaskAPI.claimTask(task.id)
        ErrorHandler.showSuccess('任务认领成功')
        await this.loadData()
      } catch (error) {
        ErrorHandler.handleTaskError(error)
      } finally {
        this.claimingTaskId = null
      }
    },

    handleTaskClick(task) {
      this.$router.push(`/tasks?task=${task.id}`)
    },

    showUpdateDialog(task) {
      this.currentTask = { ...task }
      this.updateDialogVisible = true
    },

    showCompleteDialog(task) {
      this.currentTask = { ...task }
      this.updateDialogVisible = true
      // Set complete mode after dialog opens
      this.$nextTick(() => {
        // Find the dialog component and set its mode
        const dialog = this.$children.find(c => c.$options.name === 'OperatorTaskUpdateDialog')
        if (dialog) {
          dialog.updateMode = 'complete'
        }
      })
    },

    async handleUpdateSuccess() {
      await this.loadData()
    },

    isMyTask(task) {
      return task.assigned_operator === this.currentUser?.id
    },

    canComplete(task) {
      return this.isMyTask(task) && ['pending', 'in_progress'].includes(task.status)
    },

    getPoolType(pool) {
      return pool === 'claimable' ? 'warning' : 'primary'
    }
  }
}
</script>

<style scoped>
.operator-center {
  padding: 20px;
}

.summary-row {
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;
  cursor: default;
}

.summary-card .stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 10px;
}

.summary-card.pending .stat-value {
  color: #E6A23C;
}

.summary-card.progress .stat-value {
  color: #67C23A;
}

.summary-card.claimable .stat-value {
  color: #F56C6C;
}

.summary-card .stat-label {
  font-size: 14px;
  color: #606266;
}

.task-pools {
  margin-top: 20px;
}

.task-pool-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
