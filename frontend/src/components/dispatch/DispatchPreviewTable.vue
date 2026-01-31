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
      <el-table-column type="expand">
        <template slot-scope="scope">
          <div v-if="scope.row.all_departments && scope.row.all_departments.length > 0" class="expand-content">
            <div class="expand-header">
              <span>所有配置部门 ({{ scope.row.all_departments.length }})</span>
              <el-tag size="mini" type="info">
                按优先级排序
              </el-tag>
            </div>
            <el-table
              :data="scope.row.all_departments"
              size="small"
              :show-header="true"
              style="margin: 0 16px 16px 16px;"
            >
              <el-table-column prop="department_name" label="部门" width="180">
                <template slot-scope="deptScope">
                  <div style="display: flex; align-items: center;">
                    <span>{{ deptScope.row.department_name }}</span>
                    <el-tag
                      v-if="deptScope.row.department_id === scope.row.target_department_id"
                      size="mini"
                      type="success"
                      style="margin-left: 8px;"
                    >
                      当前选择
                    </el-tag>
                    <el-tag
                      v-if="isLeastLoadedInPriority(scope.row, deptScope.row)"
                      size="mini"
                      type="warning"
                      style="margin-left: 4px;"
                    >
                      负载最低
                    </el-tag>
                  </div>
                </template>
              </el-table-column>

              <el-table-column
                prop="priority"
                label="优先级"
                width="100"
                align="center"
              >
                <template slot-scope="deptScope">
                  <el-tag :type="getPriorityTagType(deptScope.row.priority)">
                    {{ deptScope.row.priority }}
                  </el-tag>
                </template>
              </el-table-column>

              <el-table-column prop="load" label="当前负载" width="200">
                <template slot-scope="deptScope">
                  <div>
                    <el-progress
                      :percentage="calculateLoadPercentage(deptScope.row.load)"
                      :color="getLoadColor(deptScope.row.load)"
                      :stroke-width="6"
                      :show-text="false"
                    />
                    <div style="margin-top: 2px; font-size: 11px; color: #606266;">
                      {{ deptScope.row.load }} 个待处理任务
                    </div>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="operator_selection_strategy" label="选择策略" min-width="150">
                <template slot-scope="deptScope">
                  {{ getStrategyDisplay(deptScope.row.operator_selection_strategy) }}
                </template>
              </el-table-column>

              <el-table-column label="状态" width="80" align="center">
                <template slot-scope="deptScope">
                  <el-tag :type="deptScope.row.is_active ? 'success' : 'info'" size="mini">
                    {{ deptScope.row.is_active ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>

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

      <el-table-column
        prop="priority"
        label="优先级"
        width="100"
        align="center"
      >
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
    },

    /**
     * 判断是否为同优先级组中负载最低的部门
     */
    isLeastLoadedInPriority(row, dept) {
      if (!row.all_departments || row.all_departments.length <= 1) {
        return false
      }

      // 找到所有相同优先级的部门
      const samePriorityDepts = row.all_departments.filter(
        d => d.priority === dept.priority && d.is_active
      )

      // 如果只有1个相同优先级的部门，不显示标记
      if (samePriorityDepts.length <= 1) {
        return false
      }

      // 找到最低负载
      const minLoad = Math.min(...samePriorityDepts.map(d => d.load || 0))

      // 当前部门是负载最低的之一
      return (dept.load || 0) === minLoad
    }
  }
}
</script>

<style scoped>
.dispatch-preview {
  margin-top: 20px;
}

.expand-content {
  background: #f5f7fa;
  padding: 12px 0;
}

.expand-header {
  padding: 0 16px 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}
</style>
