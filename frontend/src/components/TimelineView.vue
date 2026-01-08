<template>
  <div class="timeline-view">
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in timelineItems"
        :key="index"
        :timestamp="item.timestamp"
        :type="item.type"
        :icon="item.icon"
        :color="item.color"
        placement="top"
        size="large"
      >
        <el-card class="timeline-card" :class="`card-${item.type}`">
          <div class="card-header">
            <h4 class="card-title">{{ item.title }}</h4>
            <el-tag
              :type="getTagType(item.type)"
              size="small"
            >
              {{ item.typeLabel }}
            </el-tag>
          </div>
          <div class="card-content">
            <p v-if="item.content">{{ item.content }}</p>
            <div v-if="item.details" class="card-details">
              <div
                v-for="(detail, key) in item.details"
                :key="key"
                class="detail-item"
              >
                <span class="detail-label">{{ getDetailLabel(key) }}:</span>
                <span class="detail-value">{{ detail }}</span>
              </div>
            </div>
          </div>
          <div v-if="item.operator" class="card-footer">
            <i class="el-icon-user"></i>
            <span>{{ item.operator }}</span>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-if="timelineItems.length === 0" description="暂无时间线数据"></el-empty>
  </div>
</template>

<script>
export default {
  name: 'TimelineView',
  props: {
    workOrder: {
      type: Object,
      default: null
    },
    processes: {
      type: Array,
      default: () => []
    },
    tasks: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    timelineItems() {
      const items = []

      // 施工单创建
      if (this.workOrder && this.workOrder.created_at) {
        items.push({
          timestamp: this.formatDateTime(this.workOrder.created_at),
          type: 'primary',
          icon: 'el-icon-plus',
          color: '#409eff',
          title: '施工单创建',
          content: `施工单 ${this.workOrder.order_number} 已创建`,
          typeLabel: '创建',
          operator: this.workOrder.created_by_name || '-',
          details: {
            customer: this.workOrder.customer_name,
            product: this.workOrder.product_name,
            quantity: this.workOrder.production_quantity
          }
        })
      }

      // 审核记录
      if (this.workOrder && this.workOrder.approval_logs) {
        this.workOrder.approval_logs.forEach(log => {
          items.push({
            timestamp: this.formatDateTime(log.approved_at),
            type: log.approval_status === 'approved' ? 'success' : 'danger',
            icon: log.approval_status === 'approved' ? 'el-icon-check' : 'el-icon-close',
            color: log.approval_status === 'approved' ? '#67c23a' : '#f56c6c',
            title: log.approval_status === 'approved' ? '审核通过' : '审核拒绝',
            content: log.approval_status === 'approved'
              ? `施工单已通过审核，状态变更为"进行中"`
              : `施工单审核被拒绝：${log.rejection_reason || ''}`,
            typeLabel: log.approval_status === 'approved' ? '审核通过' : '审核拒绝',
            operator: log.approved_by_name || '-',
            details: {
              comment: log.approval_comment || '-'
            }
          })
        })
      }

      // 工序时间线
      if (this.processes && this.processes.length > 0) {
        this.processes.forEach(process => {
          // 工序开始
          if (process.actual_start_time) {
            items.push({
              timestamp: this.formatDateTime(process.actual_start_time),
              type: 'warning',
              icon: 'el-icon-video-play',
              color: '#e6a23c',
              title: `工序开始：${process.process_name}`,
              content: `工序"${process.process_name}"已开始`,
              typeLabel: '工序开始',
              operator: process.operator_name || '-',
              details: {
                department: process.department_name || '-',
                sequence: `第 ${process.sequence || 0} 步`
              }
            })
          }

          // 工序完成
          if (process.actual_end_time) {
            items.push({
              timestamp: this.formatDateTime(process.actual_end_time),
              type: 'success',
              icon: 'el-icon-circle-check',
              color: '#67c23a',
              title: `工序完成：${process.process_name}`,
              content: `工序"${process.process_name}"已完成`,
              typeLabel: '工序完成',
              operator: process.operator_name || '-',
              details: {
                quantity_completed: process.quantity_completed || 0,
                quantity_defective: process.quantity_defective || 0,
                duration: process.duration_hours ? `${process.duration_hours} 小时` : '-'
              }
            })
          }
        })
      }

      // 任务时间线（关键任务）
      if (this.tasks && this.tasks.length > 0) {
        this.tasks.forEach(task => {
          // 任务完成
          if (task.status === 'completed' && task.updated_at) {
            items.push({
              timestamp: this.formatDateTime(task.updated_at),
              type: 'success',
              icon: 'el-icon-check',
              color: '#67c23a',
              title: `任务完成：${task.work_content}`,
              content: `任务"${task.work_content}"已完成`,
              typeLabel: '任务完成',
              operator: task.assigned_operator_name || '-',
              details: {
                quantity_completed: task.quantity_completed || 0,
                production_quantity: task.production_quantity || 0,
                task_type: this.getTaskTypeDisplay(task.task_type)
              }
            })
          }
        })
      }

      // 施工单完成
      if (this.workOrder && this.workOrder.status === 'completed' && this.workOrder.updated_at) {
        items.push({
          timestamp: this.formatDateTime(this.workOrder.updated_at),
          type: 'success',
          icon: 'el-icon-trophy',
          color: '#67c23a',
          title: '施工单完成',
          content: `施工单 ${this.workOrder.order_number} 所有工序已完成`,
          typeLabel: '施工单完成',
          operator: this.workOrder.manager_name || '-',
          details: {
            progress: `${this.workOrder.progress_percentage || 0}%`,
            total_processes: this.processes ? this.processes.length : 0
          }
        })
      }

      // 按时间倒序排序（最新的在前）
      return items.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp)
      })
    }
  },
  methods: {
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    getTagType(type) {
      const typeMap = {
        primary: 'primary',
        success: 'success',
        warning: 'warning',
        danger: 'danger',
        info: 'info'
      }
      return typeMap[type] || 'info'
    },
    getDetailLabel(key) {
      const labelMap = {
        customer: '客户',
        product: '产品',
        quantity: '数量',
        comment: '审核意见',
        department: '部门',
        sequence: '工序顺序',
        quantity_completed: '完成数量',
        quantity_defective: '不良品数量',
        duration: '耗时',
        production_quantity: '生产数量',
        task_type: '任务类型',
        progress: '进度',
        total_processes: '总工序数'
      }
      return labelMap[key] || key
    },
    getTaskTypeDisplay(taskType) {
      const displayMap = {
        plate_making: '制版',
        cutting: '开料',
        printing: '印刷',
        foiling: '烫金',
        embossing: '压凸',
        die_cutting: '模切',
        packaging: '包装',
        general: '通用'
      }
      return displayMap[taskType] || taskType
    }
  }
}
</script>

<style scoped>
.timeline-view {
  padding: 20px;
}

.timeline-card {
  margin-bottom: 10px;
  transition: all 0.3s;
}

.timeline-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.card-content {
  margin-bottom: 12px;
}

.card-content p {
  margin: 0 0 10px 0;
  color: #606266;
  line-height: 1.6;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.detail-item {
  display: flex;
  font-size: 13px;
  color: #606266;
}

.detail-label {
  font-weight: bold;
  margin-right: 8px;
  color: #909399;
  min-width: 80px;
}

.detail-value {
  flex: 1;
  word-break: break-word;
}

.card-footer {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #909399;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.card-footer i {
  margin-right: 6px;
}

.card-primary {
  border-left: 4px solid #409eff;
}

.card-success {
  border-left: 4px solid #67c23a;
}

.card-warning {
  border-left: 4px solid #e6a23c;
}

.card-danger {
  border-left: 4px solid #f56c6c;
}
</style>

