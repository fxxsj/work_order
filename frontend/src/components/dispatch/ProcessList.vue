<template>
  <div class="process-list">
    <el-card class="process-list-card" shadow="hover">
      <div slot="header" class="card-header">
        <span class="card-title">工序列表</span>
        <el-badge :value="processes.length" class="badge" type="primary" />
      </div>

      <el-empty
        v-if="!loading && processes.length === 0"
        description="暂无工序数据"
        :image-size="100"
      />

      <div v-else class="process-items">
        <div
          v-for="process in displayProcesses"
          :key="process.id"
          class="process-item"
          :class="{ 'is-selected': isSelected(process) }"
          @click="handleSelect(process)"
        >
          <div class="process-main">
            <div class="process-name">
              {{ process.name }}
            </div>
            <div class="process-code">
              {{ process.code }}
            </div>
          </div>
          <i v-if="isSelected(process)" class="el-icon-check selected-icon"></i>
        </div>

        <el-skeleton
          v-if="loading"
          :rows="5"
          animated
          style="margin-top: 16px;"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ProcessList',
  props: {
    // 工序列表
    processes: {
      type: Array,
      default: () => []
    },
    // 当前选中的工序
    selectedProcess: {
      type: Object,
      default: null
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    /**
     * 显示的工序列表（支持搜索过滤）
     */
    displayProcesses() {
      return this.processes
    }
  },
  methods: {
    /**
     * 检查工序是否被选中
     */
    isSelected(process) {
      if (!this.selectedProcess) return false
      return this.selectedProcess.id === process.id
    },

    /**
     * 处理工序选择
     */
    handleSelect(process) {
      if (this.isSelected(process)) {
        // 如果已选中，再次点击取消选择
        this.$emit('select', null)
      } else {
        this.$emit('select', process)
      }
    }
  }
}
</script>

<style scoped>
.process-list {
  height: 100%;
}

.process-list-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.badge {
  flex-shrink: 0;
}

.process-items {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 自定义滚动条 */
.process-items::-webkit-scrollbar {
  width: 6px;
}

.process-items::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.process-items::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.process-items::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.process-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.process-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.process-item.is-selected {
  background: #ecf5ff;
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.process-main {
  flex: 1;
  min-width: 0;
}

.process-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.process-code {
  font-size: 12px;
  color: #909399;
  font-family: 'Courier New', monospace;
}

.selected-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: #409eff;
  margin-left: 8px;
}
</style>
