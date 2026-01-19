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
              @click="saveDraft"
              :loading="saving"
            >
              <i class="el-icon-document"></i>
              草稿
            </el-button>
          </el-tooltip>
          
          <el-tooltip content="提交审核" placement="top" v-if="!isEdit || form.approval_status === 'rejected'">
            <el-button 
              type="success" 
              size="small" 
              @click="submitForApproval"
              :loading="submitting"
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
          <el-step title="基本信息" icon="el-icon-info"></el-step>
          <el-step title="产品配置" icon="el-icon-goods"></el-step>
          <el-step title="工序安排" icon="el-icon-setting"></el-step>
          <el-step title="物料资产" icon="el-icon-box"></el-step>
          <el-step title="确认提交" icon="el-icon-check"></el-step>
        </el-steps>

        <!-- 步骤内容 -->
        <div class="step-content">
          <!-- 步骤1: 基本信息 -->
          <div v-show="currentStep === 0" class="step-panel">
            <h3>基本信息</h3>
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="8">
                <el-form-item label="客户" prop="customer">
                  <customer-selector 
                    v-model="form.customer" 
                    @change="onCustomerChange"
                    :disabled="isApproved"
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
        </div>

        <!-- 步骤导航按钮 -->
        <div class="step-navigation">
          <el-button 
            v-if="currentStep > 0" 
            @click="prevStep"
            :disabled="saving || submitting"
          >
            <i class="el-icon-arrow-left"></i>
            上一步
          </el-button>
          
          <el-button 
            v-if="currentStep < 4" 
            type="primary" 
            @click="nextStep"
            :disabled="!canGoNext || saving || submitting"
          >
            <i class="el-icon-arrow-right"></i>
            下一步
          </el-button>
          
          <el-button 
            v-if="currentStep === 4" 
            type="success" 
            @click="saveAll"
            :loading="saving || submitting"
            size="medium"
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
  async mounted() {
    await this.loadData()
    if (this.isEdit) {
      await this.loadWorkOrder()
    }
  },
  methods: {
    async loadData() {
      // 并行加载基础数据
      const [customers, managers] = await Promise.all([
        this.$api.customer.getList(),
        this.$api.user.getManagers()
      ])
      
      this.customerList = customers.data
      this.managerList = managers.data
    },
    
    async loadWorkOrder() {
      try {
        const response = await this.$api.workorder.getDetail(this.id)
        this.form = { ...this.form, ...response.data }
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
      const totalQuantity = this.form.products.reduce((sum, product) => {
        return sum + (product.quantity || 0)
      }, 0)
      this.form.production_quantity = totalQuantity
    },
    
    // 智能排程
    autoArrangeProcesses() {
      if (!this.form.products.length) {
        this.$message.warning('请先添加产品')
        return
      }
      
      // 根据产品自动推荐工序
      const recommendedProcesses = this.getRecommendedProcesses(this.form.products)
      this.form.processes = recommendedProcesses
    },
    
    getRecommendedProcesses(products) {
      // 简化版：根据产品类型推荐工序
      const processMap = {
        '印刷品': ['CTP', 'CUT', 'PRT', 'PACK'],
        '包装盒': ['CTP', 'CUT', 'PRT', 'DIE', 'BOX', 'PACK'],
        '标签': ['CTP', 'CUT', 'PRT', 'DIE', 'PACK']
      }
      
      // 获取产品类型并返回对应工序
      const productTypes = products.map(p => p.category)
      const uniqueTypes = [...new Set(productTypes)]
      
      let allProcesses = []
      uniqueTypes.forEach(type => {
        if (processMap[type]) {
          allProcesses.push(...processMap[type])
        }
      })
      
      return [...new Set(allProcesses)] // 去重
    },
    
    // 添加操作
    addProduct() {
      // 触发产品选择器
      this.$refs.productSelector.show()
    },
    
    addProcess() {
      // 触发工序选择器
      this.$refs.processSelector.show()
    },
    
    // 保存操作
    async saveDraft() {
      this.saving = true
      try {
        await this.$api.workorder.saveDraft(this.form)
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
        await this.$api.workorder.submitForApproval(this.form)
        this.$message.success('提交审核成功')
        this.$router.push('/workorders')
      } catch (error) {
        this.$message.error('提交审核失败')
      } finally {
        this.submitting = false
      }
    },
    
    async saveAll() {
      if (this.saving || this.submitting) return
      
      this.saving = true
      try {
        if (this.isEdit) {
          await this.$api.workorder.update(this.id, this.form)
          this.$message.success('施工单更新成功')
        } else {
          await this.$api.workorder.create(this.form)
          this.$message.success('施工单创建成功')
        }
        
        this.$router.push('/workorders')
      } catch (error) {
        this.$message.error('保存失败')
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
        'low': 'info',
        'normal': 'primary',
        'high': 'warning',
        'urgent': 'danger'
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