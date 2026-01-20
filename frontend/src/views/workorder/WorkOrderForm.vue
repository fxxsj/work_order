<template>
  <div class="workorder-form-simplified">
    <el-card class="form-card">
      <div slot="header" class="form-header">
        <div class="header-left">
          <i class="el-icon-document"></i>
          <span>{{ isEdit ? '编辑施工单' : '新建施工单' }}</span>
        </div>
        <div class="header-right">
          <el-tooltip content="保存为草稿" placement="top">
            <el-button
              type="info"
              size="small"
              :loading="saving"
              @click="saveDraft"
            >
              <i class="el-icon-document"></i>
              草稿
            </el-button>
          </el-tooltip>

          <el-tooltip v-if="!isEdit || form.approval_status === 'rejected'" content="提交审核" placement="top">
            <el-button
              type="success"
              size="small"
              :loading="submitting"
              @click="submitForApproval"
            >
              <i class="el-icon-check"></i>
              提交审核
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 简化的表单布局 -->
      <div class="form-content">
        <!-- 步骤指示器 -->
        <el-steps :active="currentStep" align-center class="form-steps">
          <el-step title="基本信息" icon="el-icon-info" />
          <el-step title="产品配置" icon="el-icon-goods" />
          <el-step title="工序安排" icon="el-icon-setting" />
          <el-step title="物料资产" icon="el-icon-box" />
          <el-step title="确认提交" icon="el-icon-check" />
        </el-steps>

        <!-- 步骤内容 -->
        <div class="step-content">
          <el-form
            ref="workOrderForm"
            :model="form"
            :rules="rules"
            label-width="100px"
          >
            <!-- 步骤1: 基本信息 -->
            <div v-show="currentStep === 0" class="step-panel">
              <h3>基本信息</h3>
              <el-row :gutter="20">
                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="客户" prop="customer">
                    <customer-selector
                      v-model="form.customer"
                      :disabled="isApproved"
                      @change="onCustomerChange"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="优先级" prop="priority">
                    <el-select v-model="form.priority" style="width: 100%;">
                      <el-option
                        v-for="item in priorityOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      >
                        <span :style="{color: item.color}">{{ item.label }}</span>
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="12" :md="8">
                  <el-form-item label="制表人" prop="manager">
                    <el-select
                      v-model="form.manager"
                      filterable
                      style="width: 100%;"
                      :disabled="isApproved"
                    >
                      <el-option
                        v-for="user in managerList"
                        :key="user.id"
                        :label="user.username"
                        :value="user.id"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :xs="24" :sm="12">
                  <el-form-item label="下单日期" prop="order_date">
                    <el-date-picker
                      v-model="form.order_date"
                      type="date"
                      placeholder="选择下单日期"
                      style="width: 100%;"
                      value-format="yyyy-MM-dd"
                      :disabled="isApproved"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="12">
                  <el-form-item label="交货日期" prop="delivery_date">
                    <el-date-picker
                      v-model="form.delivery_date"
                      type="date"
                      placeholder="选择交货日期"
                      style="width: 100%;"
                      value-format="yyyy-MM-dd"
                      :disabled="isApproved"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="备注">
                <el-input
                  v-model="form.notes"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入备注信息"
                  :disabled="isApproved"
                />
              </el-form-item>
            </div>

            <!-- 步骤2: 产品配置 -->
            <div v-show="currentStep === 1" class="step-panel">
              <div class="panel-header">
                <h3>产品配置</h3>
                <el-button type="primary" size="small" @click="addProduct">
                  <i class="el-icon-plus"></i>
                  添加产品
                </el-button>
              </div>

              <product-list-editor
                v-model="form.products"
                :disabled="isApproved"
                @change="onProductsChange"
              />
            </div>

            <!-- 步骤3: 工序安排 -->
            <div v-show="currentStep === 2" class="step-panel">
              <div class="panel-header">
                <h3>工序安排</h3>
                <el-button-group>
                  <el-button size="small" @click="autoArrangeProcesses">
                    <i class="el-icon-magic-stick"></i>
                    智能排程
                  </el-button>
                  <el-button size="small" @click="addProcess">
                    <i class="el-icon-plus"></i>
                    添加工序
                  </el-button>
                </el-button-group>
              </div>

              <process-selector
                v-model="form.processes"
                :disabled="isApproved"
                @change="onProcessesChange"
              />
            </div>

            <!-- 步骤4: 物料资产 -->
            <div v-show="currentStep === 3" class="step-panel">
              <el-tabs v-model="materialTab" class="material-tabs">
                <el-tab-pane label="物料配置" name="materials">
                  <material-management
                    v-model="form.materials"
                    :disabled="isApproved"
                    @change="onMaterialsChange"
                  />
                </el-tab-pane>

                <el-tab-pane label="图稿" name="artworks">
                  <artwork-and-die-info
                    v-model="form.artworks"
                    type="artwork"
                    :disabled="isApproved"
                  />
                </el-tab-pane>

                <el-tab-pane label="刀模" name="dies">
                  <artwork-and-die-info
                    v-model="form.dies"
                    type="die"
                    :disabled="isApproved"
                  />
                </el-tab-pane>

                <el-tab-pane label="烫金版" name="foiling_plates">
                  <artwork-and-die-info
                    v-model="form.foiling_plates"
                    type="foiling_plate"
                    :disabled="isApproved"
                  />
                </el-tab-pane>
              </el-tabs>
            </div>

            <!-- 步骤5: 确认提交 -->
            <div v-show="currentStep === 4" class="step-panel">
              <h3>确认信息</h3>
              <div class="summary-section">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="summary-card">
                      <h4>基本信息</h4>
                      <div class="summary-item">
                        <span class="label">客户：</span>
                        <span class="value">{{ selectedCustomerName }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="label">优先级：</span>
                        <el-tag :type="getPriorityTagType(form.priority)">
                          {{ getPriorityLabel(form.priority) }}
                        </el-tag>
                      </div>
                      <div class="summary-item">
                        <span class="label">交货日期：</span>
                        <span class="value">{{ form.delivery_date }}</span>
                      </div>
                    </div>
                  </el-col>

                  <el-col :span="12">
                    <div class="summary-card">
                      <h4>配置统计</h4>
                      <div class="summary-item">
                        <span class="label">产品数量：</span>
                        <span class="value">{{ form.products.length }} 款</span>
                      </div>
                      <div class="summary-item">
                        <span class="label">工序数量：</span>
                        <span class="value">{{ form.processes.length }} 个</span>
                      </div>
                      <div class="summary-item">
                        <span class="label">物料数量：</span>
                        <span class="value">{{ form.materials.length }} 种</span>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-form>
        </div>

        <!-- 步骤导航按钮 -->
        <div class="step-navigation">
          <el-button
            v-if="currentStep > 0"
            :disabled="saving || submitting"
            @click="prevStep"
          >
            <i class="el-icon-arrow-left"></i>
            上一步
          </el-button>

          <el-button
            v-if="currentStep < 4"
            type="primary"
            :disabled="!canGoNext || saving || submitting"
            @click="nextStep"
          >
            <i class="el-icon-arrow-right"></i>
            下一步
          </el-button>

          <el-button
            v-if="currentStep === 4"
            type="success"
            :loading="saving || submitting"
            size="medium"
            @click="saveAll"
          >
            <i class="el-icon-check"></i>
            {{ isEdit ? '更新施工单' : '创建施工单' }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import CustomerSelector from './components/CustomerSelector.vue'
import ProductListEditor from './components/ProductListEditor.vue'
import ProcessSelector from './components/ProcessSelector.vue'
import MaterialManagement from './components/MaterialManagement.vue'
import ArtworkAndDieInfo from './components/ArtworkAndDieInfo.vue'
// 导入 API 模块
import { customerAPI } from '@/api/modules/customer'
import { workOrderAPI } from '@/api/modules/workorder'
import { authAPI } from '@/api/modules/auth'
import { productAPI } from '@/api/modules/product'

export default {
  name: 'WorkOrderFormSimplified',
  components: {
    CustomerSelector,
    ProductListEditor,
    ProcessSelector,
    MaterialManagement,
    ArtworkAndDieInfo
  },
  props: {
    id: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      // 当前步骤
      currentStep: 0,

      // 物料标签页
      materialTab: 'materials',

      // 表单数据
      form: {
        customer: null,
        manager: null,
        status: 'pending',
        priority: 'normal',
        order_date: new Date(),
        delivery_date: '',
        actual_delivery_date: '',
        production_quantity: null,
        defective_quantity: null,
        total_amount: 0,
        notes: '',
        products: [],
        processes: [],
        materials: [],
        artworks: [],
        dies: [],
        foiling_plates: [],
        embossing_plates: [],
        printing_type: 'none',
        printing_cmyk_colors: [],
        printing_other_colors: []
      },

      // 加载状态
      saving: false,
      submitting: false,

      // 表单验证规则
      rules: {
        customer: [
          { required: true, message: '请选择客户', trigger: 'change' }
        ],
        delivery_date: [
          { required: true, message: '请选择交货日期', trigger: 'change' }
        ],
        priority: [
          { required: true, message: '请选择优先级', trigger: 'change' }
        ]
      },

      // 选项数据
      priorityOptions: [
        { label: '低', value: 'low', color: '#67C23A' },
        { label: '普通', value: 'normal', color: '#409EFF' },
        { label: '高', value: 'high', color: '#E6A23C' },
        { label: '紧急', value: 'urgent', color: '#F56C6C' }
      ],

      // 列表数据
      customerList: [],
      managerList: []
    }
  },
  computed: {
    isEdit() {
      return !!this.id
    },
    isApproved() {
      return this.form.approval_status === 'approved'
    },
    selectedCustomerName() {
      const customer = this.customerList.find(c => c.id === this.form.customer)
      return customer ? customer.name : '未选择'
    },
    canGoNext() {
      // 根据当前步骤判断是否可以进入下一步
      switch (this.currentStep) {
        case 0:
          return this.form.customer && this.form.delivery_date
        case 1:
          return this.form.products.length > 0
        case 2:
          return this.form.processes.length > 0
        case 3:
          return true // 物料和资产是可选的
        default:
          return true
      }
    }
  },
  watch: {
    // 监听表单数据变化，自动保存草稿
    form: {
      handler(newVal) {
        if (!this.isEdit) {
          // 仅在新建模式下自动保存草稿
          this.saveDraftToLocalStorage(newVal)
        }
      },
      deep: true
    },
    // 监听当前步骤变化
    currentStep(newVal) {
      this.saveDraftToLocalStorage({ ...this.form, _step: newVal })
    }
  },
  async mounted() {
    await this.loadData()
    if (this.isEdit) {
      await this.loadWorkOrder()
    } else {
      // 恢复本地存储的草稿
      this.restoreDraftFromLocalStorage()
    }
  },
  methods: {
    saveDraftToLocalStorage(formData) {
      try {
        const draft = {
          formData: formData || this.form,
          currentStep: this.currentStep,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem('workorder_draft', JSON.stringify(draft))
      } catch (error) {
        console.error('保存草稿失败:', error)
      }
    },

    restoreDraftFromLocalStorage() {
      try {
        const draftStr = localStorage.getItem('workorder_draft')
        if (!draftStr) return

        const draft = JSON.parse(draftStr)

        // 检查草稿是否过期（24小时）
        const draftTime = new Date(draft.timestamp)
        const now = new Date()
        const hoursDiff = (now - draftTime) / (1000 * 60 * 60)

        if (hoursDiff > 24) {
          localStorage.removeItem('workorder_draft')
          return
        }

        // 恢复表单数据和步骤
        this.form = { ...this.form, ...draft.formData }
        this.currentStep = draft.currentStep || 0

        // 提示用户
        this.$message.info('已恢复上次的草稿数据')
      } catch (error) {
        console.error('恢复草稿失败:', error)
        localStorage.removeItem('workorder_draft')
      }
    },

    clearDraftFromLocalStorage() {
      localStorage.removeItem('workorder_draft')
    },

    async loadData() {
      // 并行加载基础数据
      try {
        const [customersRes, managersRes] = await Promise.all([
          customerAPI.getList(),
          authAPI.getUsersByDepartment()
        ])

        this.customerList = customersRes.results || customersRes.data || customersRes
        this.managerList = managersRes.results || managersRes.data || managersRes
      } catch (error) {
        console.error('加载基础数据失败:', error)
        this.$message.error('加载基础数据失败')
      }
    },

    async loadWorkOrder() {
      try {
        const response = await workOrderAPI.getDetail(this.id)
        const data = response.data || response
        this.form = { ...this.form, ...data }
      } catch (error) {
        this.$message.error('加载施工单失败')
      }
    },

    // 步骤导航
    nextStep() {
      if (this.currentStep < 4) {
        this.currentStep++
      }
    },

    prevStep() {
      if (this.currentStep > 0) {
        this.currentStep--
      }
    },

    // 事件处理
    onCustomerChange(customer) {
      this.form.customer = customer
      // 可以根据客户信息预填充其他字段
    },

    onProductsChange(products) {
      this.form.products = products
      this.calculateProductionQuantity()
    },

    onProcessesChange(processes) {
      this.form.processes = processes
    },

    onMaterialsChange(materials) {
      this.form.materials = materials
    },

    calculateProductionQuantity() {
      // 根据产品计算生产数量
      const totalQuantity = this.form.products.reduce((sum, product) => sum + (product.quantity || 0), 0)
      this.form.production_quantity = totalQuantity
    },

    // 智能排程
    async autoArrangeProcesses() {
      if (!this.form.products.length) {
        this.$message.warning('请先添加产品')
        return
      }

      // 根据产品自动推荐工序（基于产品的 default_processes 字段）
      try {
        const recommendedProcesses = await this.getRecommendedProcesses(this.form.products)
        this.form.processes = recommendedProcesses
        this.$message.success(`已自动推荐 ${recommendedProcesses.length} 个工序`)
      } catch (error) {
        this.$message.error('智能排程失败')
      }
    },

    async getRecommendedProcesses(products) {
      // 收集所有产品的默认工序 ID
      const processIds = new Set()

      for (const productItem of products) {
        if (!productItem.product) continue

        try {
          // 获取产品详情，包含默认工序
          const response = await productAPI.getDetail(productItem.product)
          const productDetail = response.data || response

          // 添加产品的默认工序 ID
          if (productDetail.default_processes && Array.isArray(productDetail.default_processes)) {
            productDetail.default_processes.forEach(process => {
              processIds.add(process.id || process) // 支持 ID 和对象两种格式
            })
          }
        } catch (error) {
          console.error(`获取产品 ${productItem.product} 的默认工序失败:`, error)
        }
      }

      // 转换为数组
      return Array.from(processIds)
    },

    // 添加操作（已移除：子组件内部有自己的添加按钮）
    // ProductListEditor 和 ProcessSelector 组件内部已包含添加功能

    // 保存操作
    async saveDraft() {
      this.saving = true
      try {
        const data = { ...this.form, status: 'draft' }
        if (this.isEdit) {
          await workOrderAPI.update(this.id, data)
        } else {
          await workOrderAPI.create(data)
        }
        this.$message.success('草稿保存成功')
      } catch (error) {
        this.$message.error('草稿保存失败')
      } finally {
        this.saving = false
      }
    },

    async submitForApproval() {
      this.submitting = true
      try {
        // 准备提交数据（与 saveAll 相同的格式）
        const submitData = {
          ...this.form,
          approval_status: 'pending',
          // 转换产品数据格式
          products_data: this.form.products.map(p => ({
            product: p.product,
            quantity: p.quantity,
            unit: p.unit || '件',
            specification: p.specification || '',
            sort_order: p.sort_order || 0
          })),
          // 转换工序数据为 ID 数组
          processes: this.form.processes,
          // 转换物料数据格式
          materials_data: (this.form.materials || []).map(m => ({
            material: m.material || m.id,
            material_size: m.material_size || '',
            material_usage: m.material_usage || '',
            need_cutting: m.need_cutting || false,
            notes: m.notes || '',
            purchase_status: m.purchase_status || 'pending'
          }))
        }

        if (this.isEdit) {
          await workOrderAPI.update(this.id, submitData)
        } else {
          await workOrderAPI.create(submitData)
        }
        this.$message.success('提交审核成功')

        // 清除本地存储的草稿
        localStorage.removeItem('workorder_draft')
        this.$router.push('/workorders')
      } catch (error) {
        this.$message.error('提交审核失败：' + (error.response?.data?.detail || error.message))
      } finally {
        this.submitting = false
      }
    },

    async saveAll() {
      if (this.saving || this.submitting) return

      this.saving = true
      try {
        // 准备提交数据
        const submitData = {
          ...this.form,
          // 转换产品数据格式
          products_data: this.form.products.map(p => ({
            product: p.product,
            quantity: p.quantity,
            unit: p.unit || '件',
            specification: p.specification || '',
            sort_order: p.sort_order || 0
          })),
          // 转换工序数据为 ID 数组
          processes: this.form.processes,
          // 转换物料数据格式
          materials_data: (this.form.materials || []).map(m => ({
            material: m.material || m.id,
            material_size: m.material_size || '',
            material_usage: m.material_usage || '',
            need_cutting: m.need_cutting || false,
            notes: m.notes || '',
            purchase_status: m.purchase_status || 'pending'
          }))
        }

        if (this.isEdit) {
          await workOrderAPI.update(this.id, submitData)
          this.$message.success('施工单更新成功')
        } else {
          await workOrderAPI.create(submitData)
          this.$message.success('施工单创建成功')
        }

        // 清除本地存储的草稿
        localStorage.removeItem('workorder_draft')
        this.$router.push('/workorders')
      } catch (error) {
        this.$message.error('保存失败：' + (error.response?.data?.detail || error.message))
      } finally {
        this.saving = false
      }
    },

    // 工具方法
    getPriorityLabel(priority) {
      const option = this.priorityOptions.find(opt => opt.value === priority)
      return option ? option.label : priority
    },

    getPriorityTagType(priority) {
      const typeMap = {
        low: 'info',
        normal: 'primary',
        high: 'warning',
        urgent: 'danger'
      }
      return typeMap[priority] || 'info'
    }
  }
}
</script>

<style scoped>
.workorder-form-simplified {
  padding: 20px;
}

.form-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.header-left i {
  margin-right: 8px;
  color: #409EFF;
}

.header-right {
  display: flex;
  gap: 10px;
}

.form-content {
  margin-top: 20px;
}

.form-steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 400px;
}

.step-panel {
  background: #fafafa;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.step-panel h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
  font-size: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0;
}

.summary-section {
  margin-top: 20px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
  height: 100%;
}

.summary-card h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 14px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
}

.summary-item .label {
  color: #606266;
  font-size: 14px;
}

.summary-item .value {
  color: #303133;
  font-weight: 500;
}

.step-navigation {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.material-tabs {
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workorder-form-simplified {
    padding: 10px;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .step-navigation {
    flex-direction: column;
    align-items: stretch;
  }

  .step-panel {
    padding: 15px;
  }

  .summary-section .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .form-steps {
    display: none;
  }

  .step-panel {
    padding: 10px;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
