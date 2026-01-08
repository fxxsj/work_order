<template>
  <div class="gantt-chart">
    <div class="gantt-header">
      <div class="gantt-controls">
        <el-button-group>
          <el-button size="mini" @click="zoomOut" :disabled="scale <= 0.5">
            <i class="el-icon-zoom-out"></i> 缩小
          </el-button>
          <el-button size="mini" @click="resetZoom">
            <i class="el-icon-refresh"></i> 重置
          </el-button>
          <el-button size="mini" @click="zoomIn" :disabled="scale >= 2">
            <i class="el-icon-zoom-in"></i> 放大
          </el-button>
        </el-button-group>
        <el-button-group style="margin-left: 10px;">
          <el-button size="mini" @click="viewMode = 'day'" :type="viewMode === 'day' ? 'primary' : ''">
            日视图
          </el-button>
          <el-button size="mini" @click="viewMode = 'week'" :type="viewMode === 'week' ? 'primary' : ''">
            周视图
          </el-button>
          <el-button size="mini" @click="viewMode = 'month'" :type="viewMode === 'month' ? 'primary' : ''">
            月视图
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="gantt-container" ref="ganttContainer">
      <!-- 左侧工序列表 -->
      <div class="gantt-sidebar">
        <div class="sidebar-header">
          <div class="header-cell">工序</div>
          <div class="header-cell">状态</div>
          <div class="header-cell">部门</div>
        </div>
        <div
          v-for="process in sortedProcesses"
          :key="process.id"
          class="sidebar-row"
          :class="{ 'row-active': process.status === 'in_progress' }"
        >
          <div class="row-cell process-name">
            <span class="sequence">{{ process.sequence }}.</span>
            {{ process.process_name }}
          </div>
          <div class="row-cell">
            <el-tag :type="getStatusTagType(process.status)" size="mini">
              {{ getStatusDisplay(process.status) }}
            </el-tag>
          </div>
          <div class="row-cell">
            {{ process.department_name || '-' }}
          </div>
        </div>
      </div>

      <!-- 右侧时间轴和任务条 -->
      <div class="gantt-content" ref="ganttContent" @scroll="handleScroll">
        <!-- 时间轴头部 -->
        <div class="gantt-timeline-header" :style="{ width: timelineWidth + 'px' }">
          <div
            v-for="date in timelineDates"
            :key="date.key"
            class="timeline-header-cell"
            :style="{ width: dateWidth + 'px' }"
          >
            <div class="header-date">{{ date.label }}</div>
            <div class="header-day" v-if="viewMode === 'day'">{{ date.day }}</div>
          </div>
        </div>

        <!-- 任务条区域 -->
        <div class="gantt-timeline-body" :style="{ width: timelineWidth + 'px', height: (sortedProcesses.length * rowHeight) + 'px' }">
          <!-- 网格线 -->
          <div
            v-for="(date, index) in timelineDates"
            :key="'grid-' + index"
            class="grid-line"
            :style="{ left: (index * dateWidth) + 'px' }"
          ></div>

          <!-- 任务条 -->
          <div
            v-for="(process, processIndex) in sortedProcesses"
            :key="process.id"
            class="gantt-row"
            :style="{ top: (processIndex * rowHeight) + 'px', height: rowHeight + 'px' }"
          >
            <!-- 计划时间条 -->
            <div
              v-if="process.planned_start_time && process.planned_end_time"
              class="gantt-bar planned-bar"
              :style="getBarStyle(process, 'planned')"
              :title="getBarTooltip(process, 'planned')"
            >
              <span class="bar-label">计划</span>
            </div>

            <!-- 实际时间条 -->
            <div
              v-if="process.actual_start_time"
              class="gantt-bar actual-bar"
              :class="getBarClass(process.status)"
              :style="getBarStyle(process, 'actual')"
              :title="getBarTooltip(process, 'actual')"
            >
              <span class="bar-label">{{ getStatusDisplay(process.status) }}</span>
            </div>

            <!-- 里程碑标记 -->
            <div
              v-if="process.actual_end_time"
              class="milestone"
              :style="{ left: getMilestonePosition(process) + 'px' }"
              :title="'完成时间: ' + formatDateTime(process.actual_end_time)"
            >
              <i class="el-icon-check"></i>
            </div>
          </div>

          <!-- 当前时间线 -->
          <div
            v-if="showCurrentTime"
            class="current-time-line"
            :style="{ left: currentTimePosition + 'px' }"
          >
            <div class="time-line-marker"></div>
            <div class="time-line-label">现在</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="gantt-legend">
      <div class="legend-item">
        <div class="legend-color planned-color"></div>
        <span>计划时间</span>
      </div>
      <div class="legend-item">
        <div class="legend-color actual-pending-color"></div>
        <span>待开始</span>
      </div>
      <div class="legend-item">
        <div class="legend-color actual-progress-color"></div>
        <span>进行中</span>
      </div>
      <div class="legend-item">
        <div class="legend-color actual-completed-color"></div>
        <span>已完成</span>
      </div>
      <div class="legend-item">
        <i class="el-icon-check milestone-icon"></i>
        <span>完成里程碑</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GanttChart',
  props: {
    workOrder: {
      type: Object,
      default: null
    },
    processes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      scale: 1, // 缩放比例
      viewMode: 'day', // 'day', 'week', 'month'
      rowHeight: 50, // 每行高度
      dateWidth: 50, // 每个日期单元格宽度（基础宽度）
      showCurrentTime: true,
      sidebarWidth: 300
    }
  },
  computed: {
    sortedProcesses() {
      if (!this.processes || this.processes.length === 0) {
        return []
      }
      return [...this.processes].sort((a, b) => {
        return (a.sequence || 0) - (b.sequence || 0)
      })
    },
    // 计算时间轴日期范围
    dateRange() {
      if (!this.workOrder || !this.processes || this.processes.length === 0) {
        const today = new Date()
        const endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 30)
        return { start: today, end: endDate }
      }

      let startDate = null
      let endDate = null

      // 从施工单日期开始
      if (this.workOrder.order_date) {
        startDate = new Date(this.workOrder.order_date)
      } else if (this.workOrder.created_at) {
        startDate = new Date(this.workOrder.created_at)
      }

      if (this.workOrder.delivery_date) {
        endDate = new Date(this.workOrder.delivery_date)
      }

      // 遍历所有工序，找到最早和最晚的时间
      this.processes.forEach(process => {
        if (process.planned_start_time) {
          const plannedStart = new Date(process.planned_start_time)
          if (!startDate || plannedStart < startDate) startDate = plannedStart
        }
        if (process.actual_start_time) {
          const actualStart = new Date(process.actual_start_time)
          if (!startDate || actualStart < startDate) startDate = actualStart
        }
        if (process.planned_end_time) {
          const plannedEnd = new Date(process.planned_end_time)
          if (!endDate || plannedEnd > endDate) endDate = plannedEnd
        }
        if (process.actual_end_time) {
          const actualEnd = new Date(process.actual_end_time)
          if (!endDate || actualEnd > endDate) endDate = actualEnd
        }
      })

      // 如果没有找到任何时间，使用默认值
      if (!startDate) {
        startDate = new Date()
      }
      if (!endDate) {
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 30)
      }

      // 扩展范围，前后各加7天
      startDate = new Date(startDate)
      startDate.setDate(startDate.getDate() - 7)
      endDate = new Date(endDate)
      endDate.setDate(endDate.getDate() + 7)

      return { start: startDate, end: endDate }
    },
    // 生成时间轴日期数组
    timelineDates() {
      const dates = []
      const { start, end } = this.dateRange
      const current = new Date(start)

      while (current <= end) {
        const dateKey = current.toISOString().split('T')[0]
        dates.push({
          key: dateKey,
          date: new Date(current),
          label: this.formatDateLabel(current),
          day: current.getDate()
        })

        // 根据视图模式增加日期
        if (this.viewMode === 'day') {
          current.setDate(current.getDate() + 1)
        } else if (this.viewMode === 'week') {
          current.setDate(current.getDate() + 7)
        } else {
          current.setMonth(current.getMonth() + 1)
        }
      }

      return dates
    },
    // 计算时间轴总宽度
    timelineWidth() {
      return this.timelineDates.length * this.dateWidth * this.scale
    },
    // 当前时间位置
    currentTimePosition() {
      if (!this.showCurrentTime) return 0
      const now = new Date()
      const { start } = this.dateRange
      const daysDiff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
      return daysDiff * this.dateWidth * this.scale
    }
  },
  methods: {
    formatDateLabel(date) {
      if (this.viewMode === 'day') {
        return `${date.getMonth() + 1}/${date.getDate()}`
      } else if (this.viewMode === 'week') {
        return `第${this.getWeekNumber(date)}周`
      } else {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }
    },
    getWeekNumber(date) {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      const dayNum = d.getUTCDay() || 7
      d.setUTCDate(d.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    },
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
    getStatusTagType(status) {
      const typeMap = {
        pending: 'info',
        in_progress: 'warning',
        completed: 'success',
        skipped: 'info'
      }
      return typeMap[status] || 'info'
    },
    getStatusDisplay(status) {
      const displayMap = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        skipped: '已跳过'
      }
      return displayMap[status] || status
    },
    // 计算任务条样式
    getBarStyle(process, type) {
      const { start } = this.dateRange
      let startTime, endTime

      if (type === 'planned') {
        startTime = process.planned_start_time
        endTime = process.planned_end_time
      } else {
        startTime = process.actual_start_time
        endTime = process.actual_end_time
      }

      if (!startTime) return { display: 'none' }

      const startDate = new Date(startTime)
      // 如果没有结束时间，使用当前时间或计划结束时间
      let endDate
      if (endTime) {
        endDate = new Date(endTime)
      } else if (type === 'actual' && process.status === 'in_progress') {
        endDate = new Date() // 进行中的任务，结束时间使用当前时间
      } else if (process.planned_end_time) {
        endDate = new Date(process.planned_end_time) // 使用计划结束时间作为估算
      } else {
        // 如果没有结束时间，默认显示1天
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 1)
      }

      // 计算相对于时间轴起点的位置和宽度
      const daysFromStart = Math.floor((startDate - start) / (1000 * 60 * 60 * 24))
      const duration = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))

      const left = daysFromStart * this.dateWidth * this.scale
      const width = duration * this.dateWidth * this.scale

      return {
        left: left + 'px',
        width: Math.max(20, width) + 'px' // 最小宽度20px，确保可见
      }
    },
    // 获取任务条样式类
    getBarClass(status) {
      return {
        'bar-pending': status === 'pending',
        'bar-in-progress': status === 'in_progress',
        'bar-completed': status === 'completed',
        'bar-skipped': status === 'skipped'
      }
    },
    // 获取任务条提示信息
    getBarTooltip(process, type) {
      const startTime = type === 'planned' ? process.planned_start_time : process.actual_start_time
      const endTime = type === 'planned' ? process.planned_end_time : process.actual_end_time

      let tooltip = `${process.process_name}\n`
      tooltip += type === 'planned' ? '计划时间: ' : '实际时间: '
      tooltip += `${this.formatDateTime(startTime)}`
      if (endTime) {
        tooltip += ` - ${this.formatDateTime(endTime)}`
      }
      if (process.duration_hours) {
        tooltip += `\n耗时: ${process.duration_hours} 小时`
      }

      return tooltip
    },
    // 计算里程碑位置
    getMilestonePosition(process) {
      if (!process.actual_end_time) return 0
      const { start } = this.dateRange
      const endDate = new Date(process.actual_end_time)
      const daysFromStart = Math.floor((endDate - start) / (1000 * 60 * 60 * 24))
      return daysFromStart * this.dateWidth * this.scale
    },
    // 缩放控制
    zoomIn() {
      if (this.scale < 2) {
        this.scale = Math.min(2, this.scale + 0.25)
      }
    },
    zoomOut() {
      if (this.scale > 0.5) {
        this.scale = Math.max(0.5, this.scale - 0.25)
      }
    },
    resetZoom() {
      this.scale = 1
    },
    // 同步滚动
    handleScroll() {
      // 可以在这里实现左右滚动同步
    }
  }
}
</script>

<style scoped>
.gantt-chart {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.gantt-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.gantt-controls {
  display: flex;
  align-items: center;
}

.gantt-container {
  display: flex;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.gantt-sidebar {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  background: #fafafa;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  background: #f0f2f5;
  border-bottom: 1px solid #e4e7ed;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-cell {
  padding: 10px;
  font-weight: bold;
  font-size: 13px;
  color: #303133;
  border-right: 1px solid #e4e7ed;
  flex: 1;
  text-align: center;
}

.header-cell:last-child {
  border-right: none;
}

.sidebar-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  min-height: 50px;
  align-items: center;
}

.sidebar-row.row-active {
  background: #ecf5ff;
}

.row-cell {
  padding: 10px;
  font-size: 13px;
  color: #606266;
  border-right: 1px solid #f0f0f0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.row-cell.process-name {
  justify-content: flex-start;
  font-weight: 500;
}

.row-cell:last-child {
  border-right: none;
}

.sequence {
  color: #909399;
  margin-right: 6px;
  font-weight: bold;
}

.gantt-content {
  flex: 1;
  overflow: auto;
  position: relative;
}

.gantt-timeline-header {
  position: sticky;
  top: 0;
  background: #f0f2f5;
  border-bottom: 2px solid #e4e7ed;
  z-index: 5;
  display: flex;
}

.timeline-header-cell {
  border-right: 1px solid #e4e7ed;
  padding: 8px 4px;
  text-align: center;
  flex-shrink: 0;
}

.header-date {
  font-size: 12px;
  font-weight: bold;
  color: #303133;
}

.header-day {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.gantt-timeline-body {
  position: relative;
  background: #fff;
}

.grid-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #f0f0f0;
  z-index: 1;
}

.gantt-row {
  position: absolute;
  left: 0;
  right: 0;
  border-bottom: 1px solid #f5f5f5;
}

.gantt-bar {
  position: absolute;
  top: 8px;
  height: 34px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.gantt-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.planned-bar {
  background: #e4e7ed;
  border: 1px dashed #909399;
  opacity: 0.6;
}

.actual-bar {
  border: 2px solid;
}

.bar-pending {
  background: #f0f2f5;
  border-color: #c0c4cc;
}

.bar-in-progress {
  background: #ecf5ff;
  border-color: #409eff;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.bar-completed {
  background: #f0f9ff;
  border-color: #67c23a;
}

.bar-skipped {
  background: #f5f7fa;
  border-color: #909399;
  opacity: 0.6;
}

.bar-label {
  font-size: 11px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
}

.milestone {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  background: #67c23a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  z-index: 3;
  box-shadow: 0 2px 4px rgba(103, 194, 58, 0.3);
}

.current-time-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #f56c6c;
  z-index: 4;
  pointer-events: none;
}

.time-line-marker {
  position: absolute;
  top: 0;
  left: -4px;
  width: 10px;
  height: 10px;
  background: #f56c6c;
  border-radius: 50%;
}

.time-line-label {
  position: absolute;
  top: -20px;
  left: -20px;
  background: #f56c6c;
  color: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  white-space: nowrap;
}

.gantt-legend {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #606266;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.planned-color {
  background: #e4e7ed;
  border-style: dashed;
}

.actual-pending-color {
  background: #f0f2f5;
  border-color: #c0c4cc;
}

.actual-progress-color {
  background: #ecf5ff;
  border-color: #409eff;
}

.actual-completed-color {
  background: #f0f9ff;
  border-color: #67c23a;
}

.milestone-icon {
  color: #67c23a;
  font-size: 16px;
}

@media (max-width: 768px) {
  .gantt-sidebar {
    width: 200px;
  }

  .dateWidth {
    min-width: 30px;
  }
}
</style>

