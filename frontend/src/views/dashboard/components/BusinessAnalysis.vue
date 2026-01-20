<template>
  <div class="business-analysis">
    <el-row :gutter="20">
      <!-- 客户统计 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>客户统计（Top 10）</span>
          </div>
          <el-table
            :data="businessAnalysis.customer_statistics || []"
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="customer" label="客户" min-width="150" />
            <el-table-column
              prop="total"
              label="施工单数"
              width="100"
              align="right"
            />
            <el-table-column
              prop="completed"
              label="已完成"
              width="100"
              align="right"
            />
            <el-table-column label="完成率" width="120" align="right">
              <template slot-scope="scope">
                <el-progress
                  :percentage="scope.row.completion_rate || 0"
                  :color="getProgressColor(scope.row.completion_rate)"
                  :stroke-width="8"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 产品统计 -->
      <el-col :xs="24" :sm="12" :md="12">
        <el-card>
          <div slot="header" class="card-header">
            <span>产品统计（Top 10）</span>
          </div>
          <el-table
            :data="businessAnalysis.product_statistics || []"
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="product_name" label="产品名称" min-width="150" />
            <el-table-column prop="product_code" label="产品编码" width="120" />
            <el-table-column
              prop="order_count"
              label="施工单数"
              width="100"
              align="right"
            />
            <el-table-column
              prop="total_quantity"
              label="总数量"
              width="100"
              align="right"
            />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 部门任务统计 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="24" :md="24">
        <el-card>
          <div slot="header" class="card-header">
            <span>部门任务统计</span>
          </div>
          <el-table
            :data="departmentStatistics"
            style="width: 100%"
            :row-style="{ cursor: 'pointer' }"
            @row-click="(row) => $emit('navigate-tasks', { assigned_department__name: row.department })"
          >
            <el-table-column prop="department" label="部门" min-width="150" />
            <el-table-column
              prop="total"
              label="任务总数"
              width="120"
              align="right"
            />
            <el-table-column
              prop="completed"
              label="已完成"
              width="120"
              align="right"
            />
            <el-table-column label="完成率" width="200" align="right">
              <template slot-scope="scope">
                <div class="progress-wrapper">
                  <el-progress
                    :percentage="scope.row.completion_rate || 0"
                    :color="getProgressColor(scope.row.completion_rate)"
                    :stroke-width="10"
                    class="progress-bar"
                  />
                  <span class="progress-text">{{ scope.row.completion_rate || 0 }}%</span>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'BusinessAnalysis',
  props: {
    businessAnalysis: {
      type: Object,
      default: () => ({})
    },
    departmentStatistics: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getProgressColor(percentage) {
      if (percentage >= 80) return '#67C23A'
      if (percentage >= 50) return '#E6A23C'
      return '#F56C6C'
    }
  }
}
</script>

<style scoped>
.business-analysis {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
}

.progress-text {
  min-width: 50px;
  text-align: right;
  font-weight: bold;
}
</style>
