<template>
  <div class="quality-container">
    <!-- 统计卡片（与 TaskStats 样式一致） -->
    <quality-stats :stats="stats" :loading="statsLoading" />

    <!-- 主内容卡片 -->
    <el-card>
      <!-- 头部搜索栏（与 Board.vue 一致） -->
      <div class="header-section">
        <div class="filter-group">
          <el-input
            v-model="filters.inspection_number"
            placeholder="搜索检验单号"
            style="width: 160px; margin-right: 10px;"
            clearable
            @input="handleSearchDebounced"
            @clear="handleSearch"
          >
            <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
          </el-input>
          <el-select
            v-model="filters.inspection_type"
            placeholder="检验类型"
            clearable
            style="width: 120px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option label="来料检验" value="incoming" />
            <el-option label="过程检验" value="process" />
            <el-option label="成品检验" value="final" />
            <el-option label="客诉检验" value="customer" />
          </el-select>
          <el-select
            v-model="filters.result"
            placeholder="检验结果"
            clearable
            style="width: 120px; margin-right: 10px;"
            @change="handleSearch"
          >
            <el-option label="待检验" value="pending" />
            <el-option label="合格" value="passed" />
            <el-option label="不合格" value="failed" />
            <el-option label="条件接收" value="conditional" />
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
            v-if="canCreate()"
            type="primary"
            icon="el-icon-plus"
            @click="handleCreate"
          >
            新建质检
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
        <el-table-column prop="inspection_number" label="检验单号" width="150" />
        <el-table-column prop="inspection_type_display" label="检验类型" width="100" />
        <el-table-column
          prop="product_name"
          label="产品名称"
          width="200"
          show-overflow-tooltip
        />
        <el-table-column prop="batch_no" label="批次号" width="150" />
        <el-table-column prop="inspection_date" label="检验日期" width="120" />
        <el-table-column prop="inspector_name" label="检验员" width="100" />
        <el-table-column
          prop="inspection_quantity"
          label="检验数量"
          width="100"
          align="right"
        />
        <el-table-column
          prop="passed_quantity"
          label="合格数量"
          width="100"
          align="right"
        />
        <el-table-column
          prop="failed_quantity"
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
          <template slot-scope="scope">
            <span :class="getDefectiveRateClass(scope.row)">
              {{ scope.row.defective_rate !== null ? scope.row.defective_rate.toFixed(1) + '%' : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="result_display" label="检验结果" width="100">
          <template slot-scope="scope">
            <el-tag :type="getResultTagType(scope.row.result)">
              {{ scope.row.result_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="canEdit() && scope.row.result === 'pending'"
              type="text"
              size="small"
              style="color: #409EFF;"
              @click="handleInspect(scope.row)"
            >
              检验
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
        description="暂无质检数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="hasFilters" type="primary" @click="handleReset">
          重置筛选
        </el-button>
        <el-button v-else-if="canCreate()" type="primary" @click="handleCreate">
          创建第一个质检单
        </el-button>
      </el-empty>
    </el-card>

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
          <el-descriptions-item label="产品名称">
            {{ currentQuality.product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="批次号">
            {{ currentQuality.batch_no || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="检验日期">
            {{ currentQuality.inspection_date }}
          </el-descriptions-item>
          <el-descriptions-item label="检验员">
            {{ currentQuality.inspector_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="检验标准">
            {{ currentQuality.inspection_standard || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="检验结果">
            <el-tag :type="getResultTagType(currentQuality.result)">
              {{ currentQuality.result_display }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="inspection-data">
          <h4>检验数据</h4>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">
                    送检数量
                  </div>
                  <div class="data-value">
                    {{ currentQuality.inspection_quantity || '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">
                    检验数量
                  </div>
                  <div class="data-value">
                    {{ currentQuality.inspection_quantity || '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">
                    合格数量
                  </div>
                  <div class="data-value success">
                    {{ currentQuality.passed_quantity || '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">
                    不合格数量
                  </div>
                  <div class="data-value danger">
                    {{ currentQuality.failed_quantity || '-' }}
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
        <el-button type="primary" @click="handlePrint">
          打印
        </el-button>
      </template>
    </el-dialog>

    <!-- 检验表单对话框 -->
    <el-dialog
      :visible.sync="inspectDialogVisible"
      title="质量检验"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="检验数量" prop="inspection_quantity">
          <el-input-number v-model="form.inspection_quantity" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="合格数量" prop="passed_quantity">
          <el-input-number v-model="form.passed_quantity" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="不合格数量" prop="failed_quantity">
          <el-input-number v-model="form.failed_quantity" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="检验结果" prop="result">
          <el-radio-group v-model="form.result">
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
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入检验备注"
          />
        </el-form-item>
      </el-form>

      <template slot="footer">
        <el-button @click="inspectDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSaveInspect">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { qualityInspectionAPI } from '@/api/modules'
import QualityStats from './components/QualityStats.vue'
import Pagination from '@/components/common/Pagination.vue'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'
import unwrapApiResponse from '@/utils/apiResponse'

// 表单初始值常量
const FORM_INITIAL = {
  inspection_quantity: null,
  passed_quantity: null,
  failed_quantity: null,
  result: 'passed',
  notes: ''
}

export default {
  name: 'QualityList',
  components: {
    QualityStats,
    Pagination
  },
  mixins: [listPageMixin, crudPermissionMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: qualityInspectionAPI,
      permissionPrefix: 'qualityinspection',

      // 页面状态
      statsLoading: false,
      submitting: false,

      // 数据
      currentQuality: null,
      stats: {},

      // 对话框
      detailDialogVisible: false,
      inspectDialogVisible: false,

      // 表单数据
      form: { ...FORM_INITIAL },

      // 表单验证规则
      rules: {
        inspection_quantity: [{ required: true, message: '请输入检验数量', trigger: 'blur' }],
        passed_quantity: [{ required: true, message: '请输入合格数量', trigger: 'blur' }],
        failed_quantity: [{ required: true, message: '请输入不合格数量', trigger: 'blur' }],
        result: [{ required: true, message: '请选择检验结果', trigger: 'change' }]
      },

      // 筛选条件
      filters: {
        inspection_number: '',
        inspection_type: '',
        result: ''
      },

      // 搜索防抖定时器
      searchTimer: null
    }
  },

  computed: {
    hasFilters() {
      return this.filters.inspection_number ||
        this.filters.inspection_type || this.filters.result
    }
  },

  created() {
    this.loadData()
    this.fetchStats()
  },

  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ...(this.filters.inspection_type && { type: this.filters.inspection_type }),
        ...(this.filters.result && { result: this.filters.result }),
        ...(this.filters.inspection_number && { search: this.filters.inspection_number })
      }
      return await this.apiService.getList(params)
    },

    async fetchStats() {
      this.statsLoading = true
      try {
        const response = await qualityInspectionAPI.getSummary()
        const payload = unwrapApiResponse(response)
        const summary = payload?.summary || {}
        const byResult = payload?.by_result || []
        const findCount = (result) => {
          const item = byResult.find(row => row.result === result)
          return item ? item.count || 0 : 0
        }

        this.stats = {
          total_count: summary.total_count || 0,
          pending_count: findCount('pending'),
          passed_count: findCount('passed'),
          failed_count: findCount('failed')
        }
      } catch (error) {
        // 降级：基于本地数据计算统计
        try {
          const response = await this.apiService.getList({ page_size: 1000 })
          const list = response.results || []
          this.stats = {
            total_count: list.length,
            pending_count: list.filter(q => q.result === 'pending').length,
            passed_count: list.filter(q => q.result === 'passed').length,
            failed_count: list.filter(q => q.result === 'failed').length
          }
        } catch (e) {
          this.stats = {}
        }
      } finally {
        this.statsLoading = false
      }
    },

    // 搜索防抖处理
    handleSearchDebounced() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.handleSearch()
      }, 300)
    },

    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    handleReset() {
      this.filters = {
        inspection_number: '',
        inspection_type: '',
        result: ''
      }
      this.currentPage = 1
      this.loadData()
    },

    handleCreate() {
      ErrorHandler.showInfo('新建质检功能开发中')
    },

    async handleView(row) {
      try {
        const response = await qualityInspectionAPI.getDetail(row.id)
        this.currentQuality = response
        this.detailDialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '获取质检详情失败')
      }
    },

    handleInspect(row) {
      this.currentQuality = row
      this.form = {
        inspection_quantity: row.inspection_quantity || 0,
        passed_quantity: row.passed_quantity || 0,
        failed_quantity: row.failed_quantity || 0,
        result: row.result || 'passed',
        notes: row.notes || ''
      }
      this.inspectDialogVisible = true
    },

    async handleSaveInspect() {
      this.$refs.formRef.validate(async (valid) => {
        if (!valid) return

        this.submitting = true
        try {
          await qualityInspectionAPI.update(this.currentQuality.id, this.form)
          ErrorHandler.showSuccess('保存成功')
          this.inspectDialogVisible = false
          this.loadData()
          this.fetchStats()
        } catch (error) {
          ErrorHandler.showMessage(error, '保存失败')
        } finally {
          this.submitting = false
        }
      })
    },

    handlePrint() {
      window.print()
    },

    getDefectiveRateClass(row) {
      if (row.defective_rate === null) return ''
      if (row.defective_rate > 5) return 'high-defective'
      if (row.defective_rate > 2) return 'medium-defective'
      return ''
    },

    getResultTagType(result) {
      const typeMap = {
        pending: 'info',
        passed: 'success',
        failed: 'danger',
        conditional: 'warning'
      }
      return typeMap[result] || ''
    },

  }
}
</script>

<style scoped>
.quality-container {
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

.inspection-data {
  margin-top: 20px;
}

.inspection-data h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 16px;
}

.data-item {
  text-align: center;
  padding: 10px 0;
}

.data-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.data-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.data-value.success {
  color: #67c23a;
}

.data-value.danger {
  color: #f56c6c;
}

.high-defective {
  color: #f56c6c;
  font-weight: bold;
}

.medium-defective {
  color: #e6a23c;
  font-weight: bold;
}
</style>
