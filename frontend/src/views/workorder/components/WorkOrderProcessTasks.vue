<template>
  <el-card style="margin-top: 20px;">
    <div slot="header" class="card-header">
      <span>工序和任务管理</span>
      <div>
        <el-radio-group :value="viewMode" @input="$emit('view-mode-change', $event)" size="small" style="margin-right: 10px;">
          <el-radio-button label="timeline">
            时间线
          </el-radio-button>
          <el-radio-button label="flowchart">
            流程图
          </el-radio-button>
          <el-radio-button label="gantt">
            甘特图
          </el-radio-button>
          <el-radio-button label="list">
            列表
          </el-radio-button>
        </el-radio-group>
        <el-button
          size="small"
          type="primary"
          icon="el-icon-plus"
          @click="$emit('add-process')"
        >
          添加工序
        </el-button>
      </div>
    </div>

    <!-- 时间线视图 -->
    <div v-if="viewMode === 'timeline'">
      <TimelineView
        :work-order="workOrder"
        :processes="workOrder.order_processes"
        :tasks="allTasks"
      />
    </div>

    <!-- 流程图视图 -->
    <div v-else-if="viewMode === 'flowchart'">
      <ProcessFlowChart
        :processes="workOrder.order_processes"
        @process-click="$emit('process-click', $event)"
      />
    </div>

    <!-- 甘特图视图 -->
    <div v-else-if="viewMode === 'gantt'">
      <GanttChart
        :work-order="workOrder"
        :processes="workOrder.order_processes"
      />
    </div>

    <!-- 列表视图（原有视图） -->
    <div v-else>
      <el-timeline v-if="workOrder && workOrder.order_processes && workOrder.order_processes.length > 0">
        <el-timeline-item
          v-for="process in workOrder.order_processes"
          :key="process.id"
          :color="getProcessColor(process.status)"
        >
          <el-card>
            <div class="process-header">
              <div>
                <h3>{{ process.sequence }}. {{ process.process_name }}</h3>
                <span :class="'status-badge status-' + process.status" style="margin-left: 10px;">
                  {{ process.status_display }}
                </span>
                <span style="color: #909399; font-size: 12px; margin-left: 15px;">
                  {{ getProcessDisplayDepartment(process) }}
                </span>
              </div>
              <div v-if="process.status !== 'completed'">
                <el-button
                  v-if="process.status === 'pending'"
                  type="primary"
                  size="small"
                  :disabled="!process.can_start"
                  @click="$emit('start-process', process)"
                >
                  <i class="el-icon-video-play"></i> 开始工序
                </el-button>
                <el-button
                  v-if="process.status === 'pending' && !process.can_start"
                  type="info"
                  size="small"
                  disabled
                  style="margin-left: 10px;"
                >
                  等待前置工序完成
                </el-button>
                <el-button
                  v-if="process.status === 'in_progress'"
                  type="success"
                  size="small"
                  @click="$emit('complete-process', process)"
                >
                  <i class="el-icon-check"></i> 完成工序
                </el-button>
                <el-button
                  v-if="process.status === 'in_progress' && process.tasks && process.tasks.length > 0"
                  type="warning"
                  size="small"
                  style="margin-left: 5px;"
                  @click="$emit('reassign-process', process)"
                >
                  <i class="el-icon-sort"></i> 批量调整分派
                </el-button>
              </div>
            </div>

            <el-descriptions :column="3" size="small" style="margin-top: 10px;">
              <el-descriptions-item label="操作员">
                {{ process.operator_name || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="完成数量">
                {{ process.quantity_completed }}
              </el-descriptions-item>
              <el-descriptions-item label="不良品数量">
                {{ process.quantity_defective }}
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">
                {{ formatDateTime(process.actual_start_time) }}
              </el-descriptions-item>
              <el-descriptions-item label="结束时间">
                {{ formatDateTime(process.actual_end_time) }}
              </el-descriptions-item>
              <el-descriptions-item label="耗时">
                {{ process.duration_hours ? process.duration_hours + ' 小时' : '-' }}
              </el-descriptions-item>
            </el-descriptions>

            <!-- 任务列表 -->
            <div v-if="process.tasks && process.tasks.length > 0" style="margin-top: 15px;">
              <el-divider content-position="left">
                <span style="font-weight: bold;">任务列表</span>
              </el-divider>
              <el-table
                :data="process.tasks"
                border
                size="small"
                :row-key="(row) => row.id"
              >
                <el-table-column type="expand" width="50">
                  <template slot-scope="scope">
                    <!-- 任务操作历史 -->
                    <div v-if="scope.row.logs && scope.row.logs.length > 0" style="padding: 20px; background-color: #f5f7fa;">
                      <div style="font-weight: bold; margin-bottom: 15px; color: #409EFF;">
                        {{ scope.row.work_content }} - 操作记录（{{ scope.row.logs.length }}条）
                      </div>
                      <el-table
                        :data="scope.row.logs"
                        border
                        size="small"
                        style="width: 100%;"
                      >
                        <el-table-column prop="created_at" label="操作时间" width="160">
                          <template slot-scope="logScope">
                            {{ formatDateTime(logScope.row.created_at) }}
                          </template>
                        </el-table-column>
                        <el-table-column prop="operator_name" label="操作人" width="120" />
                        <el-table-column prop="log_type_display" label="操作类型" width="100" />
                        <el-table-column label="数量变化" width="180">
                          <template slot-scope="logScope">
                            <span v-if="logScope.row.quantity_before !== null && logScope.row.quantity_after !== null">
                              {{ logScope.row.quantity_before }} → {{ logScope.row.quantity_after }}
                              <span v-if="logScope.row.quantity_increment > 0" style="color: #67C23A; margin-left: 5px; font-weight: bold;">
                                (+{{ logScope.row.quantity_increment }})
                              </span>
                              <span v-else-if="logScope.row.quantity_increment < 0" style="color: #F56C6C; margin-left: 5px; font-weight: bold;">
                                ({{ logScope.row.quantity_increment }})
                              </span>
                            </span>
                            <span v-else>-</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="状态变化" width="150">
                          <template slot-scope="logScope">
                            <span v-if="logScope.row.status_before && logScope.row.status_after">
                              {{ getStatusText(logScope.row.status_before) }} → {{ getStatusText(logScope.row.status_after) }}
                            </span>
                            <span v-else>-</span>
                          </template>
                        </el-table-column>
                        <el-table-column
                          prop="content"
                          label="操作内容"
                          min-width="200"
                          show-overflow-tooltip
                        />
                      </el-table>
                    </div>
                    <div v-else style="padding: 20px; text-align: center; color: #909399;">
                      暂无操作记录
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="work_content" label="任务内容" min-width="200" />
                <el-table-column label="关联对象" width="150">
                  <template slot-scope="scope">
                    <div v-if="scope.row.artwork_code">
                      <span>{{ scope.row.artwork_code }}</span>
                      <el-tag
                        v-if="scope.row.artwork_code && isPlateMakingProcess(process)"
                        :type="scope.row.artwork_confirmed ? 'success' : 'info'"
                        size="mini"
                        style="margin-left: 5px;"
                      >
                        {{ scope.row.artwork_confirmed ? '已确认' : '未确认' }}
                      </el-tag>
                    </div>
                    <span v-else-if="scope.row.die_code">{{ scope.row.die_code }}</span>
                    <div v-else-if="scope.row.product_code">
                      <span>{{ scope.row.product_code }}</span>
                      <span v-if="scope.row.product_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
                        ({{ scope.row.product_name }})
                      </span>
                    </div>
                    <div v-else-if="scope.row.material_code">
                      <span>{{ scope.row.material_code }}</span>
                      <el-tag
                        v-if="isMaterialProcess(process) && scope.row.material_purchase_status"
                        :type="getMaterialStatusTagTypeByStatus(scope.row.material_purchase_status)"
                        size="mini"
                        style="margin-left: 5px;"
                      >
                        {{ getMaterialStatusTextByStatus(scope.row.material_purchase_status) }}
                      </el-tag>
                    </div>
                    <div v-else-if="scope.row.foiling_plate_code">
                      <span>{{ scope.row.foiling_plate_code }}</span>
                      <span v-if="scope.row.foiling_plate_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
                        ({{ scope.row.foiling_plate_name }})
                      </span>
                    </div>
                    <div v-else-if="scope.row.embossing_plate_code">
                      <span>{{ scope.row.embossing_plate_code }}</span>
                      <span v-if="scope.row.embossing_plate_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
                        ({{ scope.row.embossing_plate_name }})
                      </span>
                    </div>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="production_quantity"
                  label="生产数量"
                  width="100"
                  align="right"
                />
                <el-table-column
                  prop="quantity_completed"
                  label="完成数量"
                  width="100"
                  align="right"
                />
                <el-table-column
                  prop="quantity_defective"
                  label="不良品"
                  width="80"
                  align="right"
                />
                <el-table-column label="任务类型" width="100">
                  <template slot-scope="scope">
                    <el-tag v-if="scope.row.is_subtask" type="info" size="small">
                      子任务
                    </el-tag>
                    <el-tag v-else-if="scope.row.subtasks_count > 0" type="success" size="small">
                      父任务({{ scope.row.subtasks_count }})
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status_display" label="状态" width="100">
                  <template slot-scope="scope">
                    <el-tag
                      :type="getTaskStatusType(scope.row.status)"
                      size="small"
                    >
                      {{ scope.row.status_display }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="分派部门" width="120">
                  <template slot-scope="scope">
                    {{ scope.row.assigned_department_name || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="分派操作员" width="120">
                  <template slot-scope="scope">
                    {{ scope.row.assigned_operator_name || '-' }}
                  </template>
                </el-table-column>
                <el-table-column v-if="process.status === 'in_progress'" label="操作" width="280">
                  <template slot-scope="scope">
                    <el-button
                      v-if="scope.row.status !== 'completed' && canCompleteTask(scope.row, process)"
                      type="success"
                      size="mini"
                      @click="$emit('complete-task', scope.row)"
                    >
                      完成
                    </el-button>
                    <span v-else-if="scope.row.status !== 'completed'" style="color: #909399; font-size: 12px;">
                      {{ getTaskBlockReason(scope.row, process) }}
                    </span>
                    <el-button
                      v-if="scope.row.status !== 'completed' && !scope.row.auto_calculate_quantity"
                      type="primary"
                      size="mini"
                      style="margin-left: 5px;"
                      @click="$emit('update-task', scope.row)"
                    >
                      更新
                    </el-button>
                    <el-button
                      type="warning"
                      size="mini"
                      style="margin-left: 5px;"
                      @click="$emit('assign-task', scope.row)"
                    >
                      分派
                    </el-button>
                    <el-button
                      v-if="scope.row.status !== 'completed' && !scope.row.is_subtask && !scope.row.subtasks_count"
                      type="info"
                      size="mini"
                      style="margin-left: 5px;"
                      @click="$emit('split-task', scope.row)"
                    >
                      拆分
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else-if="process.status === 'in_progress' || process.status === 'completed'" style="margin-top: 15px;">
              <el-divider content-position="left">
                <span style="font-weight: bold;">任务列表</span>
              </el-divider>
              <div style="color: #909399; padding: 20px; text-align: center;">
                暂无任务
              </div>
            </div>

            <div v-if="process.notes" style="margin-top: 15px;">
              <el-divider />
              <strong>备注：</strong>{{ process.notes }}
            </div>

            <!-- 工序日志 -->
            <div v-if="process.logs && process.logs.length > 0" style="margin-top: 15px;">
              <el-divider content-position="left">
                <span style="font-weight: bold;">操作记录</span>
              </el-divider>
              <ul class="process-logs">
                <li v-for="log in process.logs" :key="log.id">
                  <span class="log-time">{{ log.created_at | formatDateTime }}</span>
                  <span class="log-type">{{ log.log_type_display }}</span>
                  <span class="log-content">{{ log.content }}</span>
                  <span class="log-operator">{{ log.operator_name }}</span>
                </li>
              </ul>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暂无工序信息" />
    </div>
  </el-card>
</template>

<script>
import ProcessFlowChart from '@/components/ProcessFlowChart.vue'
import TimelineView from '@/components/TimelineView.vue'
import GanttChart from '@/components/GanttChart.vue'

export default {
  name: 'WorkOrderProcessTasks',
  components: {
    ProcessFlowChart,
    TimelineView,
    GanttChart
  },
  props: {
    workOrder: {
      type: Object,
      required: true
    },
    viewMode: {
      type: String,
      default: 'list'
    },
    allTasks: {
      type: Array,
      default: () => []
    }
  },
  filters: {
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
  },
  methods: {
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    getProcessColor(status) {
      const colors = {
        pending: '#909399',
        in_progress: '#E6A23C',
        completed: '#67C23A',
        skipped: '#909399'
      }
      return colors[status] || '#909399'
    },
    getProcessDisplayDepartment(process) {
      if (process.department_name) {
        return process.department_name
      }
      if (process.department && typeof process.department === 'object') {
        return process.department.name
      }
      return '-'
    },
    getTaskStatusType(status) {
      const types = {
        pending: 'info',
        in_progress: 'warning',
        completed: 'success',
        cancelled: 'danger'
      }
      return types[status] || 'info'
    },
    getStatusText(status) {
      const statusMap = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    },
    isPlateMakingProcess(process) {
      return process.process_code === 'CTP'
    },
    isMaterialProcess(process) {
      return process.process_code === 'CUT'
    },
    getMaterialStatusTagTypeByStatus(status) {
      const statusMap = {
        pending: 'info',
        ordered: 'primary',
        received: 'success',
        cut: 'warning',
        completed: 'success'
      }
      return statusMap[status] || 'info'
    },
    getMaterialStatusTextByStatus(status) {
      const statusMap = {
        pending: '待采购',
        ordered: '已下单',
        received: '已回料',
        cut: '已开料',
        completed: '已完成'
      }
      return statusMap[status] || status
    },
    canCompleteTask(task, process) {
      if (task.task_type === 'plate_making' && task.artwork && !task.artwork_confirmed) {
        return false
      }
      if (task.task_type === 'cutting' && process.process_code === 'CUT') {
        if (task.material_purchase_status !== 'cut') {
          return false
        }
      }
      return true
    },
    getTaskBlockReason(task, process) {
      if (task.task_type === 'plate_making' && task.artwork && !task.artwork_confirmed) {
        return '需确认图稿'
      }
      if (task.task_type === 'cutting' && process.process_code === 'CUT') {
        if (task.material_purchase_status !== 'cut') {
          const statusText = {
            pending: '待采购',
            ordered: '已下单',
            received: '已回料',
            cut: '已开料'
          }
          return '物料' + (statusText[task.material_purchase_status] || '')
        }
      }
      return '-'
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.process-logs {
  list-style: none;
  padding: 0;
  margin: 0;
}

.process-logs li {
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.process-logs li:last-child {
  border-bottom: none;
}

.log-time {
  color: #909399;
  font-size: 12px;
  margin-right: 10px;
}

.log-type {
  display: inline-block;
  padding: 2px 6px;
  background-color: #ECF5FF;
  color: #409EFF;
  border-radius: 3px;
  font-size: 12px;
  margin-right: 10px;
}

.log-content {
  flex: 1;
  margin-right: 10px;
}

.log-operator {
  color: #909399;
  font-size: 12px;
}
</style>
