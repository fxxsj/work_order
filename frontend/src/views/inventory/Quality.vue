<template>
  <div class="quality-container">
    <!-- 页面头部 -->
    <div class="header">
      <h2>质量检验</h2>
      <div class="actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
          新建质检
        </el-button>
        <el-button icon="el-icon-refresh" @click="fetchQualityList">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="检验单号">
          <el-input v-model="filters.inspection_number" placeholder="检验单号" clearable />
        </el-form-item>
        <el-form-item label="产品">
          <el-select
            v-model="filters.product"
            placeholder="全部产品"
            clearable
            filterable
          >
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="product.name"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="检验类型">
          <el-select
            v-model="filters.inspection_type"
            placeholder="全部类型"
            clearable
            @change="handleSearch"
          >
            <el-option label="入库检验" value="incoming" />
            <el-option label="过程检验" value="in_process" />
            <el-option label="最终检验" value="final" />
            <el-option label="出货检验" value="outgoing" />
          </el-select>
        </el-form-item>
        <el-form-item label="检验结果">
          <el-select
            v-model="filters.result"
            placeholder="全部结果"
            clearable
            @change="handleSearch"
          >
            <el-option label="合格" value="passed" />
            <el-option label="不合格" value="failed" />
            <el-option label="条件接收" value="conditional" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="全部状态"
            clearable
            @change="handleSearch"
          >
            <el-option label="待检验" value="pending" />
            <el-option label="检验中" value="in_progress" />
            <el-option label="已完成" value="completed" />
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

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="qualityList"
        border
        style="width: 100%"
      >
        <el-table-column prop="inspection_number" label="检验单号" width="150" />
        <el-table-column prop="inspection_type_display" label="检验类型" width="100" />
        <el-table-column
          prop="product_name"
          label="产品名称"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="batch_number" label="批次号" width="150" />
        <el-table-column prop="inspection_date" label="检验日期" width="120" />
        <el-table-column prop="inspector_name" label="检验员" width="100" />
        <el-table-column
          prop="sample_quantity"
          label="抽样数量"
          width="100"
          align="right"
        />
        <el-table-column
          prop="qualified_quantity"
          label="合格数量"
          width="100"
          align="right"
        />
        <el-table-column
          prop="defective_quantity"
          label="不合格数量"
          width="100"
          align="right"
        />
        <el-table-column
          prop="defective_rate"
          label="不合格率"
          width="100"
          align="right"
        >
          <template #default="{ row }">
            <span :class="getDefectiveRateClass(row)">{{ row.defective_rate !== null ? row.defective_rate.toFixed(1) + '%' : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="result_display" label="检验结果" width="100">
          <template #default="{ row }">
            <el-tag :type="getResultTagType(row.result)">
              {{ row.result_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'in_progress'"
              size="small"
              type="primary"
              @click="handleInspect(row)"
            >
              检验
            </el-button>
            <el-button
              v-if="row.status === 'in_progress'"
              size="small"
              type="success"
              @click="handleComplete(row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 质检详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      title="质检详情"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div v-if="currentQuality">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="检验单号">
            {{ currentQuality.inspection_number }}
          </el-descriptions-item>
          <el-descriptions-item label="检验类型">
            {{ currentQuality.inspection_type_display }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentQuality.status)">
              {{ currentQuality.status_display }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="产品名称">
            {{ currentQuality.product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="批次号">
            {{ currentQuality.batch_number || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="检验日期">
            {{ currentQuality.inspection_date }}
          </el-descriptions-item>
          <el-descriptions-item label="检验员">
            {{ currentQuality.inspector_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="检验标准">
            {{ currentQuality.standard || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="检验结果">
            <el-tag :type="getResultTagType(currentQuality.result)">
              {{ currentQuality.result_display }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="inspection-data">
          <h3>检验数据</h3>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">
                    送检数量
                  </div><div class="data-value">
                    {{ currentQuality.inspection_quantity || '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">
                    抽样数量
                  </div><div class="data-value">
                    {{ currentQuality.sample_quantity || '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">
                    合格数量
                  </div><div class="data-value success">
                    {{ currentQuality.qualified_quantity || '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">
                    不合格数量
                  </div><div class="data-value danger">
                    {{ currentQuality.defective_quantity || '-' }}
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
        </el-button><el-button type="primary" @click="handlePrint">
          打印
        </el-button>
      </template>
    </el-dialog>

    <!-- 检验表单对话框 -->
    <el-dialog
      :visible.sync="inspectDialogVisible"
      title="质量检验"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="inspectFormRef"
        :model="inspectForm"
        :rules="inspectRules"
        label-width="100px"
      >
        <el-form-item label="抽样数量" prop="sample_quantity">
          <el-input-number v-model="inspectForm.sample_quantity" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="合格数量" prop="qualified_quantity">
          <el-input-number v-model="inspectForm.qualified_quantity" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="不合格数量" prop="defective_quantity">
          <el-input-number v-model="inspectForm.defective_quantity" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="检验结果" prop="result">
          <el-radio-group v-model="inspectForm.result">
            <el-radio label="passed">
              合格
            </el-radio>
            <el-radio label="failed">
              不合格
            </el-radio>
            <el-radio label="conditional">
              条件接收
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="检验备注">
          <el-input
            v-model="inspectForm.inspection_notes"
            type="textarea"
            :rows="3"
            placeholder="请输入检验备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inspectDialogVisible = false">
          取消
        </el-button><el-button type="primary" @click="handleSaveInspect">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { qualityInspectionAPI } from '@/api/modules'
import Pagination from '@/components/common/Pagination.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'

export default {
  name: 'QualityList',
  components: { Pagination },
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: qualityInspectionAPI,
      permissionPrefix: 'qualityinspection',

      loading: false,
      qualityList: [],
      productList: [],
      currentQuality: null,
      detailDialogVisible: false,
      inspectDialogVisible: false,
      filters: { inspection_number: '', product: '', inspection_type: '', result: '', status: '' },
      inspectForm: { sample_quantity: null, qualified_quantity: null, defective_quantity: null, result: 'passed', inspection_notes: '' },
      inspectRules: {
        sample_quantity: [{ required: true, message: '请输入抽样数量', trigger: 'blur' }],
        qualified_quantity: [{ required: true, message: '请输入合格数量', trigger: 'blur' }],
        defective_quantity: [{ required: true, message: '请输入不合格数量', trigger: 'blur' }],
        result: [{ required: true, message: '请选择检验结果', trigger: 'change' }]
      }
    }
  },
  created() {
    this.fetchQualityList()
    this.fetchProducts()
  },
  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize
      }
      if (this.filters.inspection_number) params.inspection_number = this.filters.inspection_number
      if (this.filters.product) params.product = this.filters.product
      if (this.filters.inspection_type) params.inspection_type = this.filters.inspection_type
      if (this.filters.result) params.result = this.filters.result
      if (this.filters.status) params.status = this.filters.status
      return await this.apiService.getList(params)
    },

    async fetchQualityList() {
      this.loading = true
      try {
        const response = await this.fetchData()
        this.qualityList = response.results || []
        this.total = response.count || 0
      } catch (error) {
        this.$message.error('获取质检列表失败')
      } finally {
        this.loading = false
      }
    },
    async fetchProducts() {
      try { this.productList = [] } catch (error) { console.error('获取产品列表失败', error) }
    },
    handleSearch() { this.currentPage = 1; this.fetchQualityList() },
    handleReset() {
      this.filters = { inspection_number: '', product: '', inspection_type: '', result: '', status: '' }
      this.currentPage = 1
      this.fetchQualityList()
    },
    handleSizeChange(size) { this.pageSize = size; this.currentPage = 1; this.fetchQualityList() },
    handlePageChange(page) { this.currentPage = page; this.fetchQualityList() },
    handleCreate() { this.$message.info('新建质检功能开发中') },
    async handleView(row) {
      try { const response = await qualityInspectionAPI.getDetail(row.id); this.currentQuality = response; this.detailDialogVisible = true } catch (error) { this.$message.error('获取质检详情失败') }
    },
    handleInspect(row) {
      this.currentQuality = row
      this.inspectForm = { sample_quantity: row.sample_quantity || 0, qualified_quantity: row.qualified_quantity || 0, defective_quantity: row.defective_quantity || 0, result: row.result || 'passed', inspection_notes: row.inspection_notes || '' }
      this.inspectDialogVisible = true
    },
    handleSaveInspect() {
      this.$refs.inspectFormRef.validate(async (valid) => {
        if (!valid) return
        try { await qualityInspectionAPI.update(this.currentQuality.id, this.inspectForm); this.$message.success('保存成功'); this.inspectDialogVisible = false; this.fetchQualityList() } catch (error) { this.$message.error('保存失败') }
      })
    },
    handleComplete(row) {
      this.$confirm('确认完成该质检单？', '提示').then(async () => { try { await qualityInspectionAPI.complete(row.id, {}); this.$message.success('完成成功'); this.fetchQualityList() } catch (error) { this.$message.error('完成失败') } })
    },
    handlePrint() { window.print() },
    getDefectiveRateClass(row) {
      if (row.defective_rate === null) return ''
      if (row.defective_rate > 5) return 'high-defective'
      if (row.defective_rate > 2) return 'medium-defective'
      return ''
    },
    getResultTagType(result) { const typeMap = { passed: 'success', failed: 'danger', conditional: 'warning' }; return typeMap[result] || '' },
    getStatusType(status) { const typeMap = { pending: 'info', in_progress: 'warning', completed: 'success' }; return typeMap[status] || '' }
  }
}
</script>

<style scoped>
.quality-container { padding: 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.filter-section { margin-bottom: 20px; padding: 20px; background: #f5f5f5; border-radius: 4px; }
.filter-form { margin-bottom: 0; }
.table-section { background: #fff; border-radius: 4px; padding: 20px; }
.inspection-data { margin-top: 20px; }
.data-item { text-align: center; padding: 10px 0; }
.data-label { font-size: 14px; color: #909399; margin-bottom: 8px; }
.data-value { font-size: 24px; font-weight: bold; color: #303133; }
.data-value.success { color: #67c23a; }
.data-value.danger { color: #f56c6c; }
.high-defective { color: #f56c6c; font-weight: bold; }
.medium-defective { color: #e6a23c; font-weight: bold; }
</style>
