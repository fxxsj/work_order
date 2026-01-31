<template>
  <div class="task-section" v-loading="loading">
    <!-- 统计头部 -->
    <div class="task-stats">
      <el-row :gutter="20" align="middle">
        <el-col :span="5">
          <div class="stat-item">
            <div class="stat-value">{{ taskStats.total }}</div>
            <div class="stat-label">全部任务</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item draft">
            <div class="stat-value">{{ taskStats.draft }}</div>
            <div class="stat-label">草稿</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item pending">
            <div class="stat-value">{{ taskStats.pending }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item completed">
            <div class="stat-value">{{ taskStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="progress-display">
            <div class="progress-label">完成进度</div>
            <el-progress 
              :percentage="taskStats.progressPercentage" 
              :stroke-width="8"
              :status="taskStats.progressPercentage === 100 ? 'success' : ''"
            ></el-progress>
          </div>
        </el-col>
      </el-row>
      <!-- 操作按钮 -->
      <div class="task-actions" v-if="editable && workOrderId">
        <el-button type="primary" size="small" icon="el-icon-plus" @click="showAddTaskDialog">
          添加任务
        </el-button>
      </div>
    </div>

    <!-- 任务列表 -->
    <div v-if="tasks.length > 0" class="task-list">
      <el-table
        :data="tasks"
        border
        style="width: 100%"
        size="small"
      >
        <el-table-column
          prop="id"
          label="ID"
          width="80"
          align="center"
        />
        <el-table-column label="工序" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.process_name || scope.row.work_order_process_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="任务内容" min-width="200">
          <template slot-scope="scope">
            {{ scope.row.work_content || scope.row.task_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="分派状态" width="150">
          <template slot-scope="scope">
            <el-tag
              v-if="scope.row.assigned_department_name || scope.row.department_name"
              type="success"
              size="small"
            >
              {{ scope.row.assigned_department_name || scope.row.department_name }}
              <span v-if="scope.row.assigned_operator_name || scope.row.operator_name">
                / {{ scope.row.assigned_operator_name || scope.row.operator_name }}
              </span>
            </el-tag>
            <el-tag
              v-else
              type="info"
              size="small"
            >
              未分派
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              size="small"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120" align="center">
          <template slot-scope="scope">
            {{ scope.row.quantity_completed || 0 }} / {{ scope.row.production_quantity || 0 }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="暂无任务" :image-size="80">
        <template v-if="editable">
          <el-button type="primary" size="small" @click="$emit('generate-tasks')">
            生成任务
          </el-button>
        </template>
      </el-empty>
    </div>

    <!-- 添加任务对话框 -->
    <el-dialog
      title="添加任务"
      :visible.sync="addTaskDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newTask" :rules="addTaskRules" ref="addTaskForm" label-width="100px">
        <el-form-item label="工序" prop="work_order_process">
          <el-select 
            v-model="newTask.work_order_process" 
            placeholder="请选择工序"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="process in availableProcesses"
              :key="process.id"
              :label="process.process_name"
              :value="process.id"
            >
              <span>{{ process.process_name }}</span>
              <span style="color: #909399; font-size: 12px; margin-left: 10px;">
                {{ process.department_name || '未配置部门' }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="任务类型" prop="task_type">
          <el-select 
            v-model="newTask.task_type" 
            placeholder="请选择任务类型"
            style="width: 100%"
          >
            <el-option label="通用" value="general" />
            <el-option label="制版" value="plate_making" />
            <el-option label="开料" value="cutting" />
            <el-option label="印刷" value="printing" />
            <el-option label="覆膜" value="laminating" />
            <el-option label="烫金" value="foiling" />
            <el-option label="压凸" value="embossing" />
            <el-option label="模切" value="die_cutting" />
            <el-option label="包装" value="packaging" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="production_quantity">
          <el-input-number 
            v-model="newTask.production_quantity" 
            :min="1" 
            :max="999999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="newTask.priority" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="普通" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产要求" prop="production_requirements">
          <el-input
            type="textarea"
            v-model="newTask.production_requirements"
            :rows="3"
            placeholder="请输入生产要求"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addTaskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createTask" :loading="creatingTask">
          {{ creatingTask ? '创建中...' : '确定' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { workOrderTaskAPI } from '@/api/modules/workorder-task'
import { processAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'TaskSection',
  props: {
    workOrderId: {
      type: [String, Number],
      default: null
    },
    tasks: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      addTaskDialogVisible: false,
      creatingTask: false,
      availableProcesses: [],
      newTask: {
        work_order: null,
        work_order_process: null,
        task_type: 'general',
        production_quantity: 1,
        priority: 'normal',
        production_requirements: ''
      },
      addTaskRules: {
        work_order_process: [
          { required: true, message: '请选择工序', trigger: 'change' }
        ],
        production_quantity: [
          { required: true, message: '请输入数量', trigger: 'blur' },
          { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    taskStats() {
      const stats = {
        total: 0,
        draft: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        progressPercentage: 0
      }

      const taskList = this.tasks || []
      stats.total = taskList.length

      taskList.forEach(task => {
        if (task.status === 'draft' || task.is_draft) {
          stats.draft++
        } else if (task.status === 'pending') {
          stats.pending++
        } else if (task.status === 'in_progress') {
          stats.inProgress++
        } else if (task.status === 'completed') {
          stats.completed++
        }
      })

      // Calculate progress percentage
      if (stats.total > 0) {
        const completedCount = stats.completed
        stats.progressPercentage = Math.round((completedCount / stats.total) * 100)
      }

      return stats
    }
  },
  methods: {
    showAddTaskDialog() {
      if (!this.workOrderId) {
        ErrorHandler.showMessage('请先保存施工单后再添加任务')
        return
      }
      
      // Reset form
      this.newTask = {
        work_order: this.workOrderId,
        work_order_process: null,
        task_type: 'general',
        production_quantity: 1,
        priority: 'normal',
        production_requirements: ''
      }
      
      // Load available processes
      this.loadAvailableProcesses()
      this.addTaskDialogVisible = true
    },
    
    async loadAvailableProcesses() {
      try {
        const response = await processAPI.getList({
          page_size: 100,
          status: 'active'
        })
        
        if (response.data && response.data.results) {
          this.availableProcesses = response.data.results
        } else {
          this.availableProcesses = response.data || []
        }
      } catch (error) {
        console.error('加载工序列表失败:', error)
        ErrorHandler.showMessage('加载工序列表失败')
      }
    },
    
    async createTask() {
      try {
        await this.$refs.addTaskForm.validate()
      } catch (error) {
        return // Validation failed
      }
      
      this.creatingTask = true
      
      try {
        const taskData = {
          work_order: this.workOrderId,
          work_order_process: this.newTask.work_order_process,
          task_type: this.newTask.task_type,
          production_quantity: this.newTask.production_quantity,
          priority: this.newTask.priority,
          production_requirements: this.newTask.production_requirements
        }
        
        const response = await workOrderTaskAPI.create(taskData)
        
        ErrorHandler.showSuccess('任务创建成功')
        
        // Emit event to refresh tasks
        this.$emit('task-created', response.data)
        
        // Close dialog
        this.addTaskDialogVisible = false
        
      } catch (error) {
        console.error('创建任务失败:', error)
        ErrorHandler.showMessage(error, '创建任务失败')
      } finally {
        this.creatingTask = false
      }
    },
    
    getStatusType(status) {
      const statusMap = {
        'draft': 'info',
        'pending': 'warning',
        'in_progress': 'primary',
        'completed': 'success',
        'cancelled': 'danger'
      }
      return statusMap[status] || 'info'
    },
    getStatusText(status) {
      const statusTextMap = {
        'draft': '草稿',
        'pending': '待处理',
        'in_progress': '进行中',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return statusTextMap[status] || status
    }
  }
}
</script>

<style scoped>
.task-section {
  margin-top: 10px;
}

.task-stats {
  background: #f5f7fa;
  padding: 15px 20px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.stat-item.draft .stat-value {
  color: #909399;
}

.stat-item.pending .stat-value {
  color: #e6a23c;
}

.stat-item.completed .stat-value {
  color: #67c23a;
}

.progress-display {
  text-align: center;
}

.progress-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.task-actions {
  margin-top: 15px;
  text-align: right;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.task-list {
  margin-top: 15px;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.el-table {
  margin-top: 0;
}
</style>
