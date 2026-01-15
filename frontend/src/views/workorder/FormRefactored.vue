<template>
  <div class="workorder-form">
    <el-card>
      <div slot="header">
        <span>{{ isEdit ? '编辑施工单' : '新建施工单' }}</span>
      </div>

      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="form-container"
        v-loading="loading"
      >
        <!-- 施工单号（编辑模式） -->
        <el-form-item label="施工单号" v-if="isEdit">
          <el-input v-model="form.order_number" disabled></el-input>
          <span class="hint-text">系统自动生成</span>
        </el-form-item>

        <!-- 客户选择 -->
        <CustomerSelector
          v-model="form.customer"
          @change="handleCustomerChange"
        />

        <!-- 状态和优先级 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" style="width: 100%;">
                <el-option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" style="width: 100%;">
                <el-option
                  v-for="priority in priorityOptions"
                  :key="priority.value"
                  :label="priority.label"
                  :value="priority.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 日期信息 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="下单日期" prop="order_date">
              <el-date-picker
                v-model="form.order_date"
                type="date"
                placeholder="选择下单日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              ></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交货日期" prop="delivery_date">
              <el-date-picker
                v-model="form.delivery_date"
                type="date"
                placeholder="选择交货日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 实际交货日期（编辑模式） -->
        <el-form-item label="实际交货日期" v-if="isEdit">
          <el-date-picker
            v-model="form.actual_delivery_date"
            type="date"
            placeholder="选择实际交货日期"
            style="width: 100%;"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>

        <!-- 生产数量 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产数量" prop="production_quantity">
              <el-input
                v-model.number="form.production_quantity"
                type="number"
                placeholder="请输入生产数量"
                min="0"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit" placeholder="如：件、套"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 产品列表 -->
        <ProductListEditor
          v-model="productItems"
          :disabled="isEdit && form.approval_status === 'approved'"
        />

        <!-- 工序选择 -->
        <ProcessSelector
          v-model="form.processes"
          :disabled="isEdit && form.approval_status === 'approved'"
        />

        <!-- 备注 -->
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入备注信息"
          ></el-input>
        </el-form-item>

        <!-- 表单操作 -->
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { workOrderService } from '@/services'
import { formValidationService } from '@/services'
import CustomerSelector from './components/CustomerSelector.vue'
import ProductListEditor from './components/ProductListEditor.vue'
import ProcessSelector from './components/ProcessSelector.vue'

export default {
  name: 'WorkOrderFormRefactored',
  components: {
    CustomerSelector,
    ProductListEditor,
    ProcessSelector
  },
  data() {
    return {
      // 服务实例
      workOrderService,
      formValidationService,

      // 状态
      loading: false,
      submitting: false,
      isEdit: false,

      // 表单数据
      form: {
        customer: null,
        status: 'pending',
        priority: 'normal',
        order_date: '',
        delivery_date: '',
        actual_delivery_date: '',
        production_quantity: 0,
        unit: '件',
        processes: [],
        notes: ''
      },

      // 产品列表
      productItems: [],

      // 表单验证规则
      rules: {
        customer: [
          { required: true, message: '请选择客户', trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ],
        priority: [
          { required: true, message: '请选择优先级', trigger: 'change' }
        ],
        order_date: [
          { required: true, message: '请选择下单日期', trigger: 'change' }
        ],
        delivery_date: [
          { required: true, message: '请选择交货日期', trigger: 'change' }
        ],
        production_quantity: [
          { required: true, message: '请输入生产数量', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value <= 0) {
                callback(new Error('生产数量必须大于0'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ]
      },

      // 选项列表
      statusOptions: [
        { value: 'pending', label: '待开始' },
        { value: 'in_progress', label: '进行中' },
        { value: 'paused', label: '已暂停' },
        { value: 'completed', label: '已完成' },
        { value: 'cancelled', label: '已取消' }
      ],

      priorityOptions: [
        { value: 'low', label: '低' },
        { value: 'normal', label: '普通' },
        { value: 'high', label: '高' },
        { value: 'urgent', label: '紧急' }
      ]
    }
  },
  async created() {
    this.isEdit = !!this.$route.params.id

    if (this.isEdit) {
      await this.loadData()
    } else {
      this.initDefaultValues()
    }
  },
  methods: {
    // 初始化默认值
    initDefaultValues() {
      const today = new Date()
      this.form.order_date = this.formatDate(today)

      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 7)
      this.form.delivery_date = this.formatDate(deliveryDate)

      // 初始化一个空的产品项
      this.productItems = [{
        product: null,
        quantity: 1,
        unit: '件'
      }]
    },

    // 加载编辑数据
    async loadData() {
      this.loading = true
      try {
        const id = this.$route.params.id
        const result = await this.workOrderService.getWorkOrderDetail(id)

        if (result.success) {
          const workOrder = result.data
          this.form = {
            customer: workOrder.customer,
            status: workOrder.status,
            priority: workOrder.priority,
            order_date: workOrder.order_date,
            delivery_date: workOrder.delivery_date,
            actual_delivery_date: workOrder.actual_delivery_date,
            production_quantity: workOrder.production_quantity,
            unit: workOrder.unit,
            processes: workOrder.processes?.map(p => p.id) || [],
            notes: workOrder.notes
          }

          // 加载产品列表
          this.productItems = workOrder.products?.map(p => ({
            product: p.product,
            quantity: p.quantity,
            unit: p.unit
          })) || []
        } else {
          this.$message.error(result.error || '加载施工单失败')
          this.$router.back()
        }
      } catch (error) {
        console.error('加载施工单失败:', error)
        this.$message.error('加载施工单失败')
        this.$router.back()
      } finally {
        this.loading = false
      }
    },

    // 客户变更处理
    handleCustomerChange(customerId) {
      // 可以在这里添加客户变更时的逻辑
      console.log('客户变更:', customerId)
    },

    // 提交表单
    async handleSubmit() {
      // 表单验证
      const valid = await this.$refs.form.validate().catch(() => false)
      if (!valid) {
        this.$message.warning('请检查表单填写')
        return
      }

      // Service 层验证
      const validation = this.formValidationService.validateWorkOrderForm({
        ...this.form,
        products: this.productItems
      })

      if (!validation.valid) {
        this.$message.error('表单验证失败')
        console.log(validation.errors)
        return
      }

      this.submitting = true
      try {
        // 准备提交数据
        const submitData = this.prepareSubmitData()

        let result
        if (this.isEdit) {
          result = await this.workOrderService.updateWorkOrder(
            this.$route.params.id,
            submitData
          )
        } else {
          result = await this.workOrderService.createWorkOrder(submitData)
        }

        if (result.success) {
          this.$message.success(this.isEdit ? '更新成功' : '创建成功')
          this.$router.back()
        } else {
          this.$message.error(result.error || '操作失败')
        }
      } catch (error) {
        console.error('提交失败:', error)
        this.$message.error('操作失败')
      } finally {
        this.submitting = false
      }
    },

    // 准备提交数据
    prepareSubmitData() {
      return {
        customer: this.form.customer,
        status: this.form.status,
        priority: this.form.priority,
        order_date: this.form.order_date,
        delivery_date: this.form.delivery_date,
        actual_delivery_date: this.form.actual_delivery_date,
        production_quantity: this.form.production_quantity,
        unit: this.form.unit,
        processes: this.form.processes,
        notes: this.form.notes,
        products_data: this.productItems.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit: item.unit
        }))
      }
    },

    // 取消
    handleCancel() {
      this.$router.back()
    },

    // 日期格式化
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
}
</script>

<style scoped>
.workorder-form {
  padding: 20px;
}

.form-container {
  max-width: 1000px;
}

.hint-text {
  color: #909399;
  font-size: 12px;
  display: block;
  margin-top: 5px;
}
</style>
