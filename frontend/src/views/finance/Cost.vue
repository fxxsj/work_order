<template>
  <div class="cost-container">
    <div class="header">
      <h2>成本核算</h2>
      <div class="actions">
        <el-button icon="el-icon-refresh" @click="fetchCostList">
          刷新
        </el-button>
        <el-button icon="el-icon-data-analysis" @click="handleStats">
          成本统计
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <stats-cards :items="statsItems" />

    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="施工单">
          <el-select
            v-model="filters.work_order"
            placeholder="全部施工单"
            clearable
            filterable
          >
            <el-option
              v-for="order in workOrderList"
              :key="order.id"
              :label="order.order_number"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="成本中心">
          <el-select v-model="filters.cost_center" placeholder="全部中心" clearable>
            <el-option
              v-for="center in costCenterList"
              :key="center.id"
              :label="center.name"
              :value="center.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="costList"
        border
        style="width: 100%"
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
          <template #default="{ row }">
            ¥{{ row.material_cost ? row.material_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="labor_cost"
          label="人工成本"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ row.labor_cost ? row.labor_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="equipment_cost"
          label="设备成本"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ row.equipment_cost ? row.equipment_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="overhead_cost"
          label="制造费用"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ row.overhead_cost ? row.overhead_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="actual_cost"
          label="实际成本"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span style="font-weight: bold;">¥{{ row.actual_cost ? row.actual_cost.toLocaleString() : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="standard_cost"
          label="标准成本"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            ¥{{ row.standard_cost ? row.standard_cost.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="variance"
          label="成本差异"
          width="120"
          align="right"
        >
          <template #default="{ row }">
            <span :class="getVarianceClass(row)">¥{{ row.variance !== null ? row.variance.toLocaleString() : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="variance_rate"
          label="差异率"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            <span :class="getVarianceClass(row)">{{ row.variance_rate !== null ? row.variance_rate.toFixed(1) + '%' : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">
              查看
            </el-button><el-button size="small" type="primary" @click="handleCalculate(row)">
              计算
            </el-button><el-button size="small" type="warning" @click="handleEdit(row)">
              调整
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

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
          <h3>成本构成</h3>
          <el-table :data="getCostBreakdown(currentCost)" border style="width: 100%; margin-top: 10px;">
            <el-table-column prop="item" label="成本项目" width="150" />
            <el-table-column
              prop="amount"
              label="金额"
              width="150"
              align="right"
            >
              <template #default="{ row }">
                ¥{{ row.amount ? row.amount.toLocaleString() : '-' }}
              </template>
            </el-table-column>
            <el-table-column
              prop="proportion"
              label="占比"
              width="100"
              align="right"
            >
              <template #default="{ row }">
                {{ row.proportion ? row.proportion.toFixed(1) + '%' : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
          </el-table>
        </div>

        <div v-if="currentCost.standard_cost" class="cost-comparison">
          <h3>成本对比</h3>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="12">
              <el-card>
                <div class="comparison-item">
                  <div class="comparison-label">
                    标准成本
                  </div><div class="comparison-value">
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
                  </div><div class="comparison-value">
                    ¥{{ currentCost.actual_cost ? currentCost.actual_cost.toLocaleString() : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      :visible.sync="adjustDialogVisible"
      title="成本调整"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="adjustFormRef"
        :model="adjustForm"
        :rules="adjustRules"
        label-width="120px"
      >
        <el-form-item label="材料成本" prop="material_cost">
          <el-input-number
            v-model="adjustForm.material_cost"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="人工成本" prop="labor_cost">
          <el-input-number
            v-model="adjustForm.labor_cost"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="设备成本" prop="equipment_cost">
          <el-input-number
            v-model="adjustForm.equipment_cost"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="制造费用" prop="overhead_cost">
          <el-input-number
            v-model="adjustForm.overhead_cost"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="调整原因" prop="adjust_reason">
          <el-input
            v-model="adjustForm.adjust_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">
          取消
        </el-button><el-button type="primary" @click="handleSaveAdjust">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { productionCostAPI } from '@/api/modules'
import StatsCards from '@/components/common/StatsCards.vue'
import Pagination from '@/components/common/Pagination.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import statisticsMixin from '@/mixins/statisticsMixin'

export default {
  name: 'CostList',
  components: { Pagination, StatsCards },
  mixins: [listPageMixin, crudPermissionMixin, statisticsMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: productionCostAPI,
      permissionPrefix: 'productioncost',

      loading: false,
      costList: [],
      workOrderList: [],
      costCenterList: [],
      currentCost: null,
      detailDialogVisible: false,
      adjustDialogVisible: false,
      stats: {},
      filters: { work_order: '', cost_center: '' },
      adjustForm: { id: null, material_cost: null, labor_cost: null, equipment_cost: null, overhead_cost: null, adjust_reason: '' },
      adjustRules: { adjust_reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }] }
    }
  },
  computed: {
    statsItems() {
      return [
        { label: '订单数量', value: this.stats.total_orders || 0, type: 'primary' },
        { label: '平均材料成本', value: ((this.stats.avg_material_cost || 0) / 1000).toFixed(1), suffix: 'k', prefix: '¥', type: 'info' },
        { label: '平均人工成本', value: ((this.stats.avg_labor_cost || 0) / 1000).toFixed(1), suffix: 'k', prefix: '¥', type: 'info' },
        { label: '平均总成本', value: ((this.stats.avg_total_cost || 0) / 1000).toFixed(1), suffix: 'k', prefix: '¥', type: 'success' }
      ]
    }
  },
  created() {
    this.fetchCostList()
    this.fetchCostStats()
    this.fetchWorkOrders()
    this.fetchCostCenters()
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

    async fetchCostList() {
      this.loading = true
      try {
        const response = await this.fetchData()
        this.costList = response.results || []
        this.total = response.count || 0
      } catch (error) {
        this.$message.error('获取成本列表失败')
      } finally {
        this.loading = false
      }
    },
    async fetchCostStats() {
      try { const response = await productionCostAPI.getStats(); this.stats = response || {} } catch (error) { console.error('获取成本统计失败', error) }
    },
    async fetchWorkOrders() {
      try { this.workOrderList = [] } catch (error) { console.error('获取施工单列表失败', error) }
    },
    async fetchCostCenters() {
      try { this.costCenterList = [] } catch (error) { console.error('获取成本中心列表失败', error) }
    },
    handleSearch() { this.currentPage = 1; this.fetchCostList() },
    handleReset() {
      this.filters = { work_order: '', cost_center: '' }
      this.currentPage = 1
      this.fetchCostList()
    },
    handleSizeChange(size) { this.pageSize = size; this.currentPage = 1; this.fetchCostList() },
    handlePageChange(page) { this.currentPage = page; this.fetchCostList() },
    async handleView(row) {
      try { const response = await productionCostAPI.getDetail(row.id); this.currentCost = response; this.detailDialogVisible = true } catch (error) { this.$message.error('获取成本详情失败') }
    },
    async handleCalculate(row) {
      this.$confirm('确认重新计算该订单成本？', '提示').then(async () => { try { await productionCostAPI.calculateTotal(row.id); this.$message.success('计算成功'); this.fetchCostList() } catch (error) { this.$message.error('计算失败') } })
    },
    handleEdit(row) {
      this.adjustForm = { id: row.id, material_cost: row.material_cost, labor_cost: row.labor_cost, equipment_cost: row.equipment_cost, overhead_cost: row.overhead_cost, adjust_reason: '' }
      this.adjustDialogVisible = true
    },
    async handleSaveAdjust() {
      this.$refs.adjustFormRef.validate(async (valid) => {
        if (!valid) return
        try { await productionCostAPI.update(this.adjustForm.id, this.adjustForm); this.$message.success('调整成功'); this.adjustDialogVisible = false; this.fetchCostList() } catch (error) { this.$message.error('调整失败') }
      })
    },
    async handleStats() {
      await this.fetchCostStats()
      this.$message.success('统计数据已更新')
    },
    getVarianceClass(row) { if (!row.variance) return ''; return row.variance > 0 ? 'variance-positive' : 'variance-negative' },
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
.cost-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.stats-cards { margin-bottom: 20px; }
.stat-card { border-radius: 4px; }
.stat-item { text-align: center; padding: 10px 0; }
.stat-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: bold; color: #303133; }
.filter-section { margin-bottom: 20px; padding: 20px; background: #f5f5f5; border-radius: 4px; }
.filter-form { margin-bottom: 0; }
.table-section { background: #fff; border-radius: 4px; padding: 20px; }
.cost-breakdown, .cost-comparison { margin-top: 20px; }
.comparison-item { text-align: center; padding: 10px 0; }
.comparison-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.comparison-value { font-size: 20px; font-weight: bold; color: #303133; }
.variance-positive { color: #f56c6c; font-weight: bold; }
.variance-negative { color: #67c23a; font-weight: bold; }
</style>
