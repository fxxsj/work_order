<template>
  <div class="quality-container">
    <!-- 页面头部 -->
    <div class="header">
      <h2>质量检验</h2>
      <div class="actions">
        <el-button type="primary" icon="el-icon-plus" @click="handleCreate">
          新建质检
        </el-button>
        <el-button icon="el-icon-refresh" @click="fetchQualityList">刷新</el-button>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="检验单号">
          <el-input v-model="filters.inspection_number" placeholder="检验单号" clearable />
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="filters.product" placeholder="全部产品" clearable filterable>
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="product.name"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="检验类型">
          <el-select v-model="filters.inspection_type" placeholder="全部类型" clearable @change="handleSearch">
            <el-option label="入库检验" value="incoming"></el-option>
            <el-option label="过程检验" value="in_process"></el-option>
            <el-option label="最终检验" value="final"></el-option>
            <el-option label="出货检验" value="outgoing"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="检验结果">
          <el-select v-model="filters.result" placeholder="全部结果" clearable @change="handleSearch">
            <el-option label="合格" value="passed"></el-option>
            <el-option label="不合格" value="failed"></el-option>
            <el-option label="条件接收" value="conditional"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="待检验" value="pending"></el-option>
            <el-option label="检验中" value="in_progress"></el-option>
            <el-option label="已完成" value="completed"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
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
        <el-table-column prop="product_name" label="产品名称" width="200" show-overflow-tooltip />
        <el-table-column prop="batch_number" label="批次号" width="150" />
        <el-table-column prop="inspection_date" label="检验日期" width="120" />
        <el-table-column prop="inspector_name" label="检验员" width="100" />
        <el-table-column prop="sample_quantity" label="抽样数量" width="100" align="right" />
        <el-table-column prop="qualified_quantity" label="合格数量" width="100" align="right" />
        <el-table-column prop="defective_quantity" label="不合格数量" width="100" align="right" />
        <el-table-column prop="defective_rate" label="不合格率" width="100" align="right">
          <template #default="{ row }">
            <span :class="getDefectiveRateClass(row)">
              {{ row.defective_rate !== null ? row.defective_rate.toFixed(1) + '%' : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="result_display" label="检验结果" width="100">
          <template #default="{ row }">
            <el-tag :type="getResultTagType(row.result)">{{ row.result_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
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
      <div class="pagination-section">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 质检详情对话框 -->
    <el-dialog
      :visible.sync="detailDialogVisible"
      title="质检详情"
      width="1000px"
      :close-on-click-modal="false"
    >
      <div v-if="currentQuality">
        <!-- 基本信息 -->
        <el-descriptions :column="3" border>
          <el-descriptions-item label="检验单号">{{ currentQuality.inspection_number }}</el-descriptions-item>
          <el-descriptions-item label="检验类型">{{ currentQuality.inspection_type_display }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentQuality.status)">{{ currentQuality.status_display }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ currentQuality.product_name }}</el-descriptions-item>
          <el-descriptions-item label="批次号">{{ currentQuality.batch_number || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检验日期">{{ currentQuality.inspection_date }}</el-descriptions-item>
          <el-descriptions-item label="检验员">{{ currentQuality.inspector_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检验标准">{{ currentQuality.standard || '-' }}</el-descriptions-item>
          <el-descriptions-item label="检验结果">
            <el-tag :type="getResultTagType(currentQuality.result)">{{ currentQuality.result_display }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 检验数据 -->
        <div class="inspection-data">
          <h3>检验数据</h3>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">送检数量</div>
                  <div class="data-value">{{ currentQuality.inspection_quantity || '-' }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">抽样数量</div>
                  <div class="data-value">{{ currentQuality.sample_quantity || '-' }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">合格数量</div>
                  <div class="data-value success">{{ currentQuality.qualified_quantity || '-' }}</div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card>
                <div class="data-item">
                  <div class="data-label">不合格数量</div>
                  <div class="data-value danger">{{ currentQuality.defective_quantity || '-' }}</div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="12">
              <el-card>
                <div class="data-item">
                  <div class="data-label">合格率</div>
                  <div class="data-value success">
                    {{ currentQuality.qualified_rate !== null ? currentQuality.qualified_rate.toFixed(1) + '%' : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <div class="data-item">
                  <div class="data-label">不合格率</div>
                  <div class="data-value danger">
                    {{ currentQuality.defective_rate !== null ? currentQuality.defective_rate.toFixed(1) + '%' : '-' }}
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 缺陷记录 -->
        <div v-if="currentQuality.defects && currentQuality.defects.length > 0" class="defects-section">
          <h3>缺陷记录</h3>
          <el-table :data="currentQuality.defects" border style="width: 100%; margin-top: 10px;">
            <el-table-column prop="defect_type_display" label="缺陷类型" width="120" />
            <el-table-column prop="defect_description" label="缺陷描述" show-overflow-tooltip />
            <el-table-column prop="quantity" label="缺陷数量" width="100" align="right" />
            <el-table-column prop="severity_display" label="严重程度" width="100">
              <template #default="{ row }">
                <el-tag :type="getSeverityTagType(row.severity)">{{ row.severity_display }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="缺陷位置" width="120" />
            <el-table-column prop="disposition_display" label="处理方式" width="100" />
          </el-table>
        </div>

        <!-- 处理意见 -->
        <div class="disposition-section">
          <h3>处理意见</h3>
          <el-descriptions :column="2" border style="margin-top: 10px;">
            <el-descriptions-item label="处理方式">{{ currentQuality.disposition_display || '-' }}</el-descriptions-item>
            <el-descriptions-item label="返工数量">{{ currentQuality.rework_quantity || '-' }}</el-descriptions-item>
            <el-descriptions-item label="报废数量">{{ currentQuality.scrap_quantity || '-' }}</el-descriptions-item>
            <el-descriptions-item label="退货数量">{{ currentQuality.return_quantity || '-' }}</el-descriptions-item>
            <el-descriptions-item label="特采数量">{{ currentQuality.special_use_quantity || '-' }}</el-descriptions-item>
            <el-descriptions-item label="检验备注" :span="2">{{ currentQuality.inspection_notes || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handlePrint">打印</el-button>
      </template>
    </el-dialog>

    <!-- 检验表单对话框 -->
    <el-dialog
      :visible.sync="inspectDialogVisible"
      title="质量检验"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="inspectForm" :rules="inspectRules" ref="inspectFormRef" label-width="100px">
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
            <el-radio label="passed">合格</el-radio>
            <el-radio label="failed">不合格</el-radio>
            <el-radio label="conditional">条件接收</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理方式" prop="disposition">
          <el-select v-model="inspectForm.disposition" placeholder="请选择处理方式" style="width: 100%;">
            <el-option label="正常接收" value="accept"></el-option>
            <el-option label="返工" value="rework"></el-option>
            <el-option label="报废" value="scrap"></el-option>
            <el-option label="退货" value="return"></el-option>
            <el-option label="特采" value="special_use"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="返工数量" v-if="inspectForm.disposition === 'rework'">
          <el-input-number v-model="inspectForm.rework_quantity" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="报废数量" v-if="inspectForm.disposition === 'scrap'">
          <el-input-number v-model="inspectForm.scrap_quantity" :min="0" style="width: 100%;" />
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
        <el-button @click="inspectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveInspect">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  getQualityInspections,
  getQualityInspectionDetail,
  updateQualityInspection,
  completeQualityInspection
} from '@/api/inventory'

export default {
  name: 'QualityList',
  data() {
    return {
      loading: false,
      qualityList: [],
      productList: [],
      currentQuality: null,
      detailDialogVisible: false,
      inspectDialogVisible: false,
      filters: {
        inspection_number: '',
        product: '',
        inspection_type: '',
        result: '',
        status: ''
      },
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      inspectForm: {
        sample_quantity: null,
        qualified_quantity: null,
        defective_quantity: null,
        result: 'passed',
        disposition: 'accept',
        rework_quantity: 0,
        scrap_quantity: 0,
        return_quantity: 0,
        special_use_quantity: 0,
        inspection_notes: ''
      },
      inspectRules: {
        sample_quantity: [{ required: true, message: '请输入抽样数量', trigger: 'blur' }],
        qualified_quantity: [{ required: true, message: '请输入合格数量', trigger: 'blur' }],
        defective_quantity: [{ required: true, message: '请输入不合格数量', trigger: 'blur' }],
        result: [{ required: true, message: '请选择检验结果', trigger: 'change' }],
        disposition: [{ required: true, message: '请选择处理方式', trigger: 'change' }]
      }
    }
  },
  created() {
    this.fetchQualityList()
    this.fetchProducts()
  },
  methods: {
    // 获取质检列表
    async fetchQualityList() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize
        }

        if (this.filters.inspection_number) {
          params.inspection_number = this.filters.inspection_number
        }
        if (this.filters.product) {
          params.product = this.filters.product
        }
        if (this.filters.inspection_type) {
          params.inspection_type = this.filters.inspection_type
        }
        if (this.filters.result) {
          params.result = this.filters.result
        }
        if (this.filters.status) {
          params.status = this.filters.status
        }

        const response = await getQualityInspections(params)
        this.qualityList = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        // 提供更详细的错误信息
        let errorMessage = '获取质检列表失败'
        if (error.response) {
          const status = error.response.status
          if (status === 401) {
            errorMessage = '登录已过期，请重新登录'
          } else if (status === 403) {
            errorMessage = '您没有权限访问此功能'
          } else if (status >= 500) {
            errorMessage = '服务器错误，请稍后重试'
          } else if (error.response.data?.detail) {
            errorMessage = `获取质检列表失败: ${error.response.data.detail}`
          }
        } else if (error.message) {
          errorMessage = `网络错误: ${error.message}`
        }
        this.$message.error(errorMessage)
        console.error('获取质检列表失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 获取产品列表
    async fetchProducts() {
      try {
        // TODO: 从API获取产品列表
        this.productList = []
      } catch (error) {
        console.error('获取产品列表失败', error)
      }
    },

    // 搜索
    handleSearch() {
      this.pagination.page = 1
      this.fetchQualityList()
    },

    // 重置
    handleReset() {
      this.filters = {
        inspection_number: '',
        product: '',
        inspection_type: '',
        result: '',
        status: ''
      }
      this.pagination.page = 1
      this.fetchQualityList()
    },

    // 查看详情
    async handleView(row) {
      try {
        const response = await getQualityInspectionDetail(row.id)
        this.currentQuality = response
        this.detailDialogVisible = true
      } catch (error) {
        this.$message.error('获取质检详情失败')
        console.error(error)
      }
    },

    // 新建
    handleCreate() {
      this.$message.info('新建质检功能开发中')
    },

    // 检验
    handleInspect(row) {
      this.currentQuality = row
      this.inspectForm = {
        sample_quantity: row.sample_quantity || 0,
        qualified_quantity: row.qualified_quantity || 0,
        defective_quantity: row.defective_quantity || 0,
        result: row.result || 'passed',
        disposition: row.disposition || 'accept',
        rework_quantity: row.rework_quantity || 0,
        scrap_quantity: row.scrap_quantity || 0,
        return_quantity: row.return_quantity || 0,
        special_use_quantity: row.special_use_quantity || 0,
        inspection_notes: row.inspection_notes || ''
      }
      this.inspectDialogVisible = true
    },

    // 保存检验
    async handleSaveInspect() {
      this.$refs.inspectFormRef.validate(async (valid) => {
        if (!valid) return

        try {
          await updateQualityInspection(this.currentQuality.id, this.inspectForm)
          this.$message.success('保存成功')
          this.inspectDialogVisible = false
          this.fetchQualityList()
        } catch (error) {
          this.$message.error('保存失败')
          console.error(error)
        }
      })
    },

    // 完成检验
    handleComplete(row) {
      this.$confirm('确认完成该质检单？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async () => {
        try {
          await completeQualityInspection(row.id, {})
          this.$message.success('完成成功')
          this.fetchQualityList()
        } catch (error) {
          this.$message.error('完成失败')
          console.error(error)
        }
      })
    },

    // 打印
    handlePrint() {
      window.print()
    },

    // 分页
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.pagination.page = 1
      this.fetchQualityList()
    },

    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchQualityList()
    },

    // 不合格率样式
    getDefectiveRateClass(row) {
      if (row.defective_rate === null) return ''
      if (row.defective_rate > 5) {
        return 'high-defective'
      } else if (row.defective_rate > 2) {
        return 'medium-defective'
      }
      return ''
    },

    // 结果标签类型
    getResultTagType(result) {
      const typeMap = {
        passed: 'success',
        failed: 'danger',
        conditional: 'warning'
      }
      return typeMap[result] || ''
    },

    // 状态标签类型
    getStatusType(status) {
      const typeMap = {
        pending: 'info',
        in_progress: 'warning',
        completed: 'success'
      }
      return typeMap[status] || ''
    },

    // 严重程度标签类型
    getSeverityTagType(severity) {
      const typeMap = {
        critical: 'danger',
        major: 'warning',
        minor: 'info'
      }
      return typeMap[severity] || ''
    }
  }
}
</script>

<style scoped>
.quality-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-form {
  margin-bottom: 0;
}

.table-section {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.inspection-data,
.defects-section,
.disposition-section {
  margin-top: 20px;
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
