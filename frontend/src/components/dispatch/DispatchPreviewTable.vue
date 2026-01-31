<template>
  <div class="dispatch-preview">
    <el-alert
      v-if="!globalDispatchEnabled"
      type="warning"
      title="自动分派已禁用"
      description="预览显示的是配置效果，但任务不会实际分派"
      :closable="false"
      style="margin-bottom: 16px;"
    />

    <el-table
      v-loading="loading"
      :data="previewData"
      border
      stripe
      style="width: 100%;"
    >
      <el-table-column prop="process_name" label="工序" width="150">
        <template slot-scope="scope">
          <div>
            <div style="font-weight: bold;">
              {{ scope.row.process_name }}
            </div>
            <div style="font-size: 12px; color: #909399;">
              {{ scope.row.process_code }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="target_department_name" label="目标部门" width="180">
        <template slot-scope="scope">
          <el-tag type="success" size="medium">
            {{ scope.row.target_department_name }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="current_load" label="当前负载" width="200">
        <template slot-scope="scope">
          <div>
            <el-progress
              :percentage="calculateLoadPercentage(scope.row.current_load)"
              :color="getLoadColor(scope.row.current_load)"
              :stroke-width="8"
              :show-text="false"
            />
            <div style="margin-top: 4px; font-size: 12px; color: #606266;">
              {{ scope.row.current_load }} 个待处理任务
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="priority" label="优先级" width="100"
        align="center">
        <template slot-scope="scope">
          <el-tag :type="getPriorityTagType(scope.row.priority)">
            {{ scope.row.priority }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="operator_selection_strategy" label="操作员选择策略" min-width="180">
        <template slot-scope="scope">
          {{ getStrategyDisplay(scope.row.operator_selection_strategy) }}
        </template>
      </el-table-column>

      <el-table-column label="状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.is_active ? 'success' : 'info'" size="small">
            {{ scope.row.is_active ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-empty
      v-if="!loading && previewData.length === 0"
      description="暂无分派预览数据"
      :image-size="120"
      style="margin-top: 40px;"
    />
  </div>
</template>

<script>
export default {
  name: 'DispatchPreviewTable',
  props: {
    // 预览数据
    previewData: {
      type: Array,
      default: () => []
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 全局分派开关
    globalDispatchEnabled: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    /**
     * 计算负载百分比（用于进度条）
     * 将任务数转换为百分比，最大100%
     */
    calculateLoadPercentage(load) {
      // 假设20个任务为满负载
      const maxLoad = 20
      return Math.min(Math.round((load / maxLoad) * 100), 100)
    },

    /**
     * 根据负载获取进度条颜色
     */
    getLoadColor(load) {
      if (load >= 20) return '#F56C6C' // 红色 - 高负载
      if (load >= 10) return '#E6A23C' // 橙色 - 中等负载
      return '#67C23A' // 绿色 - 低负载
    },

    /**
     * 根据优先级获取标签类型
     */
    getPriorityTagType(priority) {
      if (priority >= 80) return 'danger'
      if (priority >= 50) return 'warning'
      if (priority >= 20) return 'success'
      return 'info'
    },

    /**
     * 获取操作员选择策略的显示文本
     */
    getStrategyDisplay(strategy) {
      const strategyMap = {
        least_tasks: '任务数量最少（工作量均衡）',
        random: '随机选择',
        round_robin: '轮询分配',
        first_available: '第一个可用'
      }
      return strategyMap[strategy] || strategy
    }
  }
}
</script>

<style scoped>
.dispatch-preview {
  margin-top: 20px;
}
</style>
