<template>
  <div class="task-drag-drop">
    <!-- Unassigned tasks column (left) -->
    <div class="column unassigned-column">
      <div class="column-header">
        <span class="column-title">待分派任务</span>
        <el-badge :value="unassignedTasks.length" type="warning" />
      </div>
      <div
        class="column-content"
        :class="{ 'drag-over': dragOverColumn === 'unassigned' }"
        @dragover.prevent
        @dragenter="handleDragEnterUnassigned"
        @dragleave="handleDragLeave"
      >
        <draggable
          v-model="unassignedTasks"
          :group="{ name: 'tasks', pull: true, put: true }"
          item-key="id"
          class="task-list"
          :class="{ 'empty': unassignedTasks.length === 0 }"
          @end="onDragEnd"
        >
          <template #item="{ element: task }">
            <div
              class="task-card"
              draggable="true"
              :class="getPriorityClass(task)"
              @dragstart="onDragStart(task, $event)"
            >
              <div class="card-header">
                <div class="card-title">
                  {{ task.work_content }}
                </div>
                <el-tag
                  v-if="task.work_order__priority"
                  :type="getPriorityType(task.work_order__priority)"
                  size="mini"
                >
                  {{ getPriorityLabel(task.work_order__priority) }}
                </el-tag>
              </div>
              <div class="card-body">
                <div class="info-item">
                  <i class="el-icon-document"></i>
                  <span>{{ task.work_order__order_number || '-' }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-setting"></i>
                  <span>{{ task.process_name || '-' }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-tickets"></i>
                  <span>数量: {{ task.production_quantity }}</span>
                </div>
              </div>
              <div class="card-footer">
                <el-tag size="mini" :type="getStatusType(task.status)">
                  {{ getStatusLabel(task.status) }}
                </el-tag>
              </div>
            </div>
          </template>
        </draggable>
        <el-empty
          v-if="unassignedTasks.length === 0"
          description="暂无待分派任务"
          :image-size="80"
        />
      </div>
    </div>

    <!-- Operator columns (middle) -->
    <div
      v-for="operator in operators"
      :key="operator.id"
      class="column operator-column"
      :class="{ 'drag-over': dragOverOperator === operator.id }"
      @drop="handleDropOperator(operator, $event)"
      @dragover.prevent
      @dragenter="handleDragEnterOperator(operator)"
      @dragleave="handleDragLeave"
    >
      <div class="column-header">
        <span class="column-title">{{ operator.name }}</span>
        <el-badge :value="getOperatorTaskCount(operator.id)" type="primary" />
      </div>
      <div class="column-content">
        <draggable
          v-model="operatorTasks[operator.id]"
          :group="{ name: 'tasks', pull: true, put: true }"
          item-key="id"
          class="task-list"
          :class="{ 'empty': !operatorTasks[operator.id] || operatorTasks[operator.id].length === 0 }"
          @end="onDragEnd"
        >
          <template #item="{ element: task }">
            <div
              class="task-card"
              :class="getPriorityClass(task)"
            >
              <div class="card-header">
                <div class="card-title">
                  {{ task.work_content }}
                </div>
                <el-tag
                  v-if="task.work_order__priority"
                  :type="getPriorityType(task.work_order__priority)"
                  size="mini"
                >
                  {{ getPriorityLabel(task.work_order__priority) }}
                </el-tag>
              </div>
              <div class="card-body">
                <div class="info-item">
                  <i class="el-icon-document"></i>
                  <span>{{ task.work_order__order_number || '-' }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-setting"></i>
                  <span>{{ task.process_name || '-' }}</span>
                </div>
                <div class="info-item">
                  <i class="el-icon-tickets"></i>
                  <span>数量: {{ task.production_quantity }}</span>
                </div>
              </div>
              <div class="card-footer">
                <el-tag size="mini" :type="getStatusType(task.status)">
                  {{ getStatusLabel(task.status) }}
                </el-tag>
              </div>
            </div>
          </template>
        </draggable>
        <el-empty
          v-if="!operatorTasks[operator.id] || operatorTasks[operator.id].length === 0"
          description="暂无任务"
          :image-size="60"
        />
      </div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'TaskDragDropList',
  components: {
    draggable
  },
  props: {
    tasks: {
      type: Array,
      default: () => []
    },
    operators: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      unassignedTasks: [],
      operatorTasks: {},
      dragOverOperator: null,
      dragOverColumn: null,
      draggedTask: null,
      draggedFromOperator: null
    }
  },
  watch: {
    tasks: {
      handler() {
        this.organizeTasks()
      },
      immediate: true,
      deep: true
    },
    operators: {
      handler() {
        this.initializeOperatorTasks()
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    /**
     * 组织任务到未分配和操作员列表
     */
    organizeTasks() {
      // 重置未分配任务
      this.unassignedTasks = this.tasks.filter(
        task => !task.assigned_operator && task.status !== 'completed'
      )

      // 按操作员分组任务
      this.operatorTasks = {}
      this.operators.forEach(operator => {
        this.operatorTasks[operator.id] = this.tasks.filter(
          task => task.assigned_operator === operator.id
        )
      })
    },

    /**
     * 初始化操作员任务列表
     */
    initializeOperatorTasks() {
      if (!this.operatorTasks) {
        this.operatorTasks = {}
      }
      this.operators.forEach(operator => {
        if (!this.operatorTasks[operator.id]) {
          this.operatorTasks[operator.id] = []
        }
      })
    },

    /**
     * 获取操作员的任务数量
     */
    getOperatorTaskCount(operatorId) {
      return this.operatorTasks[operatorId]?.length || 0
    },

    /**
     * 开始拖拽
     */
    onDragStart(task, event) {
      this.draggedTask = task
      this.draggedFromOperator = task.assigned_operator
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', task.id.toString())
    },

    /**
     * 拖拽进入操作员列
     */
    handleDragEnterOperator(operator) {
      this.dragOverOperator = operator.id
      this.dragOverColumn = null
    },

    /**
     * 拖拽进入未分配列
     */
    handleDragEnterUnassigned() {
      this.dragOverColumn = 'unassigned'
      this.dragOverOperator = null
    },

    /**
     * 拖拽离开
     */
    handleDragLeave(event) {
      // 只在真正离开列时清除高亮
      if (!event.currentTarget.contains(event.relatedTarget)) {
        this.dragOverOperator = null
        this.dragOverColumn = null
      }
    },

    /**
     * 拖拽结束
     */
    onDragEnd(event) {
      const taskId = parseInt(event.item.getAttribute('data-id') || event.dataTransfer.getData('text/plain'))

      // 检查是否拖拽到操作员列
      if (this.dragOverOperator) {
        const operator = this.operators.find(op => op.id === this.dragOverOperator)
        if (operator) {
          this.handleDropOperator(operator, event, taskId)
        }
      }
      // 检查是否拖拽到未分配列
      else if (this.dragOverColumn === 'unassigned') {
        this.handleDropUnassigned(event, taskId)
      }

      // 清除拖拽状态
      this.dragOverOperator = null
      this.dragOverColumn = null
      this.draggedTask = null
      this.draggedFromOperator = null
    },

    /**
     * 放置到操作员列
     */
    handleDropOperator(operator, event, taskId = null) {
      if (!this.draggedTask && !taskId) return

      const task = this.draggedTask || this.tasks.find(t => t.id === taskId)
      if (!task) return

      // 如果任务已经在该操作员名下，不做任何操作
      if (task.assigned_operator === operator.id) return

      // 发送分配或重新分配事件
      if (this.draggedFromOperator) {
        // 重新分配
        const fromOperator = this.operators.find(op => op.id === this.draggedFromOperator)
        this.$emit('task-reassigned', {
          task,
          fromOperator,
          toOperator: operator
        })
      } else {
        // 新分配
        this.$emit('task-assigned', {
          task,
          operator
        })
      }
    },

    /**
     * 放置到未分配列
     */
    handleDropUnassigned(event, taskId = null) {
      if (!this.draggedTask && !taskId) return

      const task = this.draggedTask || this.tasks.find(t => t.id === taskId)
      if (!task) return

      // 只有已分配的任务才能取消分配
      if (task.assigned_operator) {
        const fromOperator = this.operators.find(op => op.id === task.assigned_operator)
        this.$emit('task-unassigned', {
          task,
          fromOperator
        })
      }
    },

    /**
     * 获取优先级样式类
     */
    getPriorityClass(task) {
      const priority = task.work_order__priority || 'normal'
      return `priority-${priority}`
    },

    /**
     * 获取优先级标签类型
     */
    getPriorityType(priority) {
      const typeMap = {
        low: '',
        normal: 'info',
        high: 'warning',
        urgent: 'danger'
      }
      return typeMap[priority] || 'info'
    },

    /**
     * 获取优先级标签文本
     */
    getPriorityLabel(priority) {
      const labelMap = {
        low: '低',
        normal: '普通',
        high: '高',
        urgent: '紧急'
      }
      return labelMap[priority] || '普通'
    },

    /**
     * 获取状态标签类型
     */
    getStatusType(status) {
      const typeMap = {
        draft: 'info',
        pending: 'warning',
        in_progress: 'primary',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'info'
    },

    /**
     * 获取状态标签文本
     */
    getStatusLabel(status) {
      const labelMap = {
        draft: '草稿',
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return labelMap[status] || status
    }
  }
}
</script>

<style scoped>
.task-drag-drop {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 20px 0;
  min-height: 500px;
}

.column {
  min-width: 300px;
  max-width: 350px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 250px);
  min-height: 400px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.column.drag-over {
  border-color: #409eff;
  background: #ecf5ff;
  border-style: dashed;
}

.column-header {
  padding: 15px 20px;
  background: #fff;
  border-bottom: 2px solid #e4e7ed;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.column-title {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.column-content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 100px;
}

.task-list.empty {
  min-height: 200px;
}

.task-card {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  cursor: move;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #909399;
  user-select: none;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.task-card.priority-urgent {
  border-left-color: #f56c6c;
}

.task-card.priority-high {
  border-left-color: #e6a23c;
}

.task-card.priority-normal {
  border-left-color: #409eff;
}

.task-card.priority-low {
  border-left-color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.card-title {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 1;
  margin-right: 8px;
  line-height: 1.4;
  word-break: break-word;
}

.card-body {
  margin-bottom: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item i {
  margin-right: 6px;
  color: #909399;
  font-size: 14px;
}

.card-footer {
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

.unassigned-column {
  background: #fef0f0;
}

.unassigned-column .column-header {
  background: #fff;
  border-bottom-color: #fbc4c4;
}

.operator-column {
  background: #f5f7fa;
}

@media (max-width: 1200px) {
  .column {
    min-width: 250px;
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .task-drag-drop {
    flex-direction: column;
    overflow-x: hidden;
  }

  .column {
    width: 100%;
    max-width: 100%;
    height: auto;
    min-height: 300px;
  }
}
</style>
