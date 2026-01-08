<template>
  <div class="process-flow-chart">
    <div class="flow-container" v-if="processes && processes.length > 0">
      <div
        v-for="(process, index) in sortedProcesses"
        :key="process.id"
        class="flow-item"
      >
        <!-- 连接线 -->
        <div
          v-if="index > 0"
          class="flow-connector"
          :class="{
            'connector-completed': isProcessCompleted(processes[index - 1]),
            'connector-active': isProcessActive(processes[index - 1])
          }"
        ></div>

        <!-- 工序节点 -->
        <div
          class="process-node"
          :class="{
            'node-pending': process.status === 'pending',
            'node-in-progress': process.status === 'in_progress',
            'node-completed': process.status === 'completed',
            'node-skipped': process.status === 'skipped',
            'node-parallel': isParallelProcess(process)
          }"
          @click="handleProcessClick(process)"
        >
          <div class="node-icon">
            <i
              :class="{
                'el-icon-time': process.status === 'pending',
                'el-icon-loading': process.status === 'in_progress',
                'el-icon-circle-check': process.status === 'completed',
                'el-icon-remove': process.status === 'skipped'
              }"
            ></i>
          </div>
          <div class="node-content">
            <div class="node-name">{{ process.process_name }}</div>
            <div class="node-status">
              <el-tag
                :type="getStatusTagType(process.status)"
                size="mini"
              >
                {{ getStatusDisplay(process.status) }}
              </el-tag>
            </div>
            <div class="node-info" v-if="process.tasks && process.tasks.length > 0">
              <span class="task-count">
                任务: {{ getCompletedTaskCount(process.tasks) }}/{{ process.tasks.length }}
              </span>
            </div>
            <div class="node-progress" v-if="process.status === 'in_progress'">
              <el-progress
                :percentage="getProcessProgress(process)"
                :stroke-width="4"
                :show-text="false"
              ></el-progress>
            </div>
          </div>
        </div>

        <!-- 并行标识 -->
        <div
          v-if="isParallelProcess(process) && index < sortedProcesses.length - 1"
          class="parallel-indicator"
        >
          <span>可并行</span>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无工序信息"></el-empty>
  </div>
</template>

<script>
export default {
  name: 'ProcessFlowChart',
  props: {
    processes: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    sortedProcesses() {
      if (!this.processes || this.processes.length === 0) {
        return []
      }
      // 按 sequence 排序
      return [...this.processes].sort((a, b) => {
        return (a.sequence || 0) - (b.sequence || 0)
      })
    }
  },
  methods: {
    isProcessCompleted(process) {
      return process.status === 'completed'
    },
    isProcessActive(process) {
      return process.status === 'in_progress'
    },
    isParallelProcess(process) {
      // 检查工序是否可并行（基于 process.is_parallel 或 process.code）
      return process.is_parallel || false
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
    getCompletedTaskCount(tasks) {
      if (!tasks || tasks.length === 0) {
        return 0
      }
      return tasks.filter(task => task.status === 'completed').length
    },
    getProcessProgress(process) {
      if (!process.tasks || process.tasks.length === 0) {
        return 0
      }
      const completedCount = this.getCompletedTaskCount(process.tasks)
      return Math.round((completedCount / process.tasks.length) * 100)
    },
    handleProcessClick(process) {
      this.$emit('process-click', process)
    }
  }
}
</script>

<style scoped>
.process-flow-chart {
  padding: 20px;
}

.flow-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.flow-item {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.flow-connector {
  width: 2px;
  height: 30px;
  background-color: #e4e7ed;
  margin: 0 auto;
  transition: all 0.3s;
}

.flow-connector.connector-completed {
  background-color: #67c23a;
}

.flow-connector.connector-active {
  background: linear-gradient(to bottom, #67c23a 0%, #409eff 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.process-node {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  min-width: 200px;
  max-width: 300px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.process-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.process-node.node-pending {
  border-color: #c0c4cc;
  background: #f5f7fa;
}

.process-node.node-in-progress {
  border-color: #409eff;
  background: #ecf5ff;
  animation: glow 2s infinite;
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.2);
  }
  50% {
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
  }
}

.process-node.node-completed {
  border-color: #67c23a;
  background: #f0f9ff;
}

.process-node.node-skipped {
  border-color: #909399;
  background: #f5f7fa;
  opacity: 0.6;
}

.process-node.node-parallel {
  border-style: dashed;
}

.node-icon {
  font-size: 24px;
  margin-right: 12px;
  color: #909399;
}

.node-pending .node-icon {
  color: #c0c4cc;
}

.node-in-progress .node-icon {
  color: #409eff;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.node-completed .node-icon {
  color: #67c23a;
}

.node-content {
  flex: 1;
  min-width: 0;
}

.node-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 6px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-status {
  margin-bottom: 6px;
}

.node-info {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.node-progress {
  margin-top: 8px;
}

.parallel-indicator {
  position: absolute;
  right: -80px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
}

@media (max-width: 768px) {
  .process-node {
    min-width: 150px;
    max-width: 200px;
    padding: 12px 15px;
  }
  
  .parallel-indicator {
    position: static;
    transform: none;
    margin-top: 8px;
    display: inline-block;
  }
}
</style>

