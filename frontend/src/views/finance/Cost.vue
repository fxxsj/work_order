<template>
  <div class="cost-container">
    <!-- 统计卡片（与 TaskStats 样式一致） -->
    <cost-stats :stats="stats" :loading="statsLoading" />

    <!-- 主内容卡片 -->
    <el-card>
      <!-- 头部搜索栏（与 Board.vue 一致） -->
      <div class="header-section">
        <div class="filter-group">
          <el-select
            v-model="filters.work_order"
            placeholder="选择施工单"
            clearable
            filterable
            style="width: 180px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option
              v-for="order in workOrderList"
              :key="order.id"
              :label="order.order_number"
              :value="order.id"
            />
          </el-select>
          <el-select
            v-model="filters.cost_center"
            placeholder="成本中心"
            clearable
            style="width: 140px;"
            @change="handleSearch"
          >
            <el-option
              v-for="center in costCenterList"
              :key="center.id"
              :label="center.name"
              :value="center.id"
            />
          </el-select>
        </div>
        <div class="action-group">
          <el-button
            :loading="loading"
            icon="el-icon-refresh"
            @click="loadData"
          >
            刷新
          </el-button>
          <el-button
            icon="el-icon-data-analysis"
            type="primary"
            @click="handleStats"
          >
            成本统计
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-if="tableData.length > 0"
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="work_order_number" label="施工单号" width="150" />
        <el-table-column
          prop="product_name"
          label="产品名称"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column
          prop="material_cost"
          label="材料成本"
          width="100"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.material_cost ? scope.row.material_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="labor_cost"
          label="人工成本"
          width="100"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.labor_cost ? scope.row.labor_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="equipment_cost"
          label="设备成本"
          width="100"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.equipment_cost ? scope.row.equipment_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="overhead_cost"
          label="制造费用"
          width="100"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.overhead_cost ? scope.row.overhead_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="actual_cost"
          label="实际成本"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            <span style="font-weight: bold;">
              ¥{{ scope.row.actual_cost ? scope.row.actual_cost.toLocaleString() : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="standard_cost"
          label="标准成本"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.standard_cost ? scope.row.standard_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="variance"
          label="成本差异"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            <span :class="getVarianceClass(scope.row)">
              ¥{{ scope.row.variance !== null ? scope.row.variance.toLocaleString() : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="variance_rate"
          label="差异率"
          width="100"
          align="right"
        >
          <template slot-scope="scope">
            <span :class="getVarianceClass(scope.row)">
              {{ scope.row.variance_rate !== null ? scope.row.variance_rate.toFixed(1) + '%' : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              style="color: #409EFF;"
              @click="handleCalculate(scope.row)"
            >
              计算
            </el-button>
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              style="color: #E6A23C;"
              @click="handleEdit(scope.row)"
            >
              调整
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无成本数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="hasFilters" type="primary" @click="handleReset">
          重置筛选
        </el-button>
      </el-empty>
    </el-card>

    <!-- 成本详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      title="成本详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="currentCost">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="施工单号">
            {{ currentCost.work_order_number }}
          </el-descriptions-item>
          <el-descriptions-item label="产品名称">
            {{ currentCost.product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="成本中心">
            {{ currentCost.cost_center_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="计算时间">
            {{ currentCost.calculated_at || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="cost-breakdown">
          <h4>成本构成</h4>
          <el-table :data="getCostBreakdown(currentCost)" border style="width: 100%; margin-top: 10px;">
            <el-table-column prop="item" label="成本项目" width="150" />
            <el-table-column
              prop="amount"
              label="金额"
              width="150"
              align="right"
            >
              <template slot-scope="scope">
                ¥{{ scope.row.amount ? scope.row.amount.toLocaleString() : '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="proportion"
              label="占比"
              width="100"
              align="right"
            >
              <template slot-scope="scope">
                {{ scope.row.proportion ? scope.row.proportion.toFixed(1) + '%' : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
          </el-table>
        </div>

        <div v-if="currentCost.standard_cost" class="cost-comparison">
          <h4>成本对比</h4>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="12">
              <el-card>
                <div class="comparison-item">
                  <div class="comparison-label">
                    标准成本
                  </div>
                  <div class="comparison-value">
                    ¥{{ currentCost.standard_cost ? currentCost.standard_cost.toLocaleString() : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <div class="comparison-item">
                  <div class="comparison-label">
                    实际成本
                  </div>
                  <div class="comparison-value">
                    ¥{{ currentCost.actual_cost ? currentCost.actual_cost.toLocaleString() : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>

      <template slot="footer">
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 成本调整对话框 -->
    <el-dialog
      :visible.sync="adjustDialogVisible"
      title="成本调整"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="材料成本" prop="material_cost">
          <el-input-number
            v-model="form.material_cost"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="人工成本" prop="labor_cost">
          <el-input-number
            v-model="form.labor_cost"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="设备成本" prop="equipment_cost">
          <el-input-number
            v-model="form.equipment_cost"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="制造费用" prop="overhead_cost">
          <el-input-number
            v-model="form.overhead_cost"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="调整原因" prop="adjust_reason">
          <el-input
            v-model="form.adjust_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>

      <template slot="footer">
        <el-button @click="adjustDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSaveAdjust">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { productionCostAPI, workOrderAPI } from '@/api/modules'
import CostStats from './components/CostStats.vue'
import Pagination from '@/components/common/Pagination.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'

// 表单初始值常量
const FORM_INITIAL = {
  id: null,
  material_cost: null,
  labor_cost: null,
  equipment_cost: null,
  overhead_cost: null,
  adjust_reason: ''
}

export default {
  name: 'CostList',
  components: {
    CostStats,
    Pagination
  },
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: productionCostAPI,
      permissionPrefix: 'productioncost',

      // 页面状态
      statsLoading: false,
      submitting: false,

      // 数据
      workOrderList: [],
      costCenterList: [],
      currentCost: null,
      stats: {},

      // 对话框
      detailDialogVisible: false,
      adjustDialogVisible: false,

      // 表单数据
      form: { ...FORM_INITIAL },

      // 表单验证规则
      rules: {
        adjust_reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
      },

      // 筛选条件
      filters: {
        work_order: '',
        cost_center: ''
      }
    }
  },

  computed: {
    hasFilters() {
      return this.filters.work_order || this.filters.cost_center
    }
  },

  created() {
    this.loadData()
    this.fetchStats()
    this.fetchWorkOrders()
  },

  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ...(this.filters.work_order && { work_order: this.filters.work_order }),
        ...(this.filters.cost_center && { cost_center: this.filters.cost_center })
      }
      return await this.apiService.getList(params)
    },

    async fetchStats() {
      this.statsLoading = true
      try {
        const response = await productionCostAPI.getStats()
        this.stats = response || {}
      } catch (error) {
        this.stats = {}
      } finally {
        this.statsLoading = false
      }
    },

    async fetchWorkOrders() {
      try {
        const response = await workOrderAPI.getList({ page_size: 1000 })
        this.workOrderList = response.results || []
      } catch (error) {
        // 静默处理
      }
    },

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filters = { work_order: '', cost_center: '' }
      this.currentPage = 1
      this.loadData()
    },

    async handleView(row) {
      try {
        const response = await productionCostAPI.getDetail(row.id)
        this.currentCost = response
        this.detailDialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '获取成本详情失败')
      }
    },

    async handleCalculate(row) {
      try {
        await ErrorHandler.confirm('确认重新计算该订单成本？')
        await productionCostAPI.calculateTotal(row.id)
        ErrorHandler.showSuccess('计算成功')
        this.loadData()
        this.fetchStats()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '计算失败')
        }
      }
    },

    handleEdit(row) {
      this.form = {
        id: row.id,
        material_cost: row.material_cost,
        labor_cost: row.labor_cost,
        equipment_cost: row.equipment_cost,
        overhead_cost: row.overhead_cost,
        adjust_reason: ''
      }
      this.adjustDialogVisible = true
    },

    async handleSaveAdjust() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return

        this.submitting = true
        try {
          await productionCostAPI.update(this.form.id, this.form)
          ErrorHandler.showSuccess('调整成功')
          this.adjustDialogVisible = false
          this.loadData()
          this.fetchStats()
        } catch (error) {
          ErrorHandler.showMessage(error, '调整失败')
        } finally {
          this.submitting = false
        }
      })
    },

    async handleStats() {
      await this.fetchStats()
      ErrorHandler.showSuccess('统计数据已更新')
    },

    getVarianceClass(row) {
      if (!row.variance) return ''
      return row.variance > 0 ? 'variance-positive' : 'variance-negative'
    },

    getCostBreakdown(cost) {
      const total = cost.actual_cost || 1
      return [
        { item: '材料成本', amount: cost.material_cost, proportion: (cost.material_cost / total) * 100, description: '直接材料消耗成本' },
        { item: '人工成本', amount: cost.labor_cost, proportion: (cost.labor_cost / total) * 100, description: '直接人工成本' },
        { item: '设备成本', amount: cost.equipment_cost, proportion: (cost.equipment_cost / total) * 100, description: '设备折旧和使用成本' },
        { item: '制造费用', amount: cost.overhead_cost, proportion: (cost.overhead_cost / total) * 100, description: '间接制造费用' },
        { item: '总成本', amount: cost.actual_cost, proportion: 100, description: '实际生产总成本' }
      ]
    }
  }
}
</script>

<style scoped>
.cost-container {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.el-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.cost-breakdown,
.cost-comparison {
  margin-top: 20px;
}

.cost-breakdown h4,
.cost-comparison h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.comparison-item {
  text-align: center;
  padding: 10px 0;
}

.comparison-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.comparison-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.variance-positive {
  color: #f56c6c;
  font-weight: bold;
}

.variance-negative {
  color: #67c23a;
  font-weight: bold;
}
</style>
