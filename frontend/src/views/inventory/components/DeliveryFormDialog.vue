<template>
  <el-dialog
    :visible="localVisible"
    :title="isEdit ? '编辑发货单' : '新建发货单'"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="localForm" :rules="rules" ref="formRef" label-width="120px">
      <h4 class="form-section-title">基本信息</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="销售订单" prop="sales_order">
            <el-select
              v-model="localForm.sales_order"
              placeholder="请选择销售订单"
              filterable
              @change="handleSalesOrderChange"
              style="width: 100%"
            >
              <el-option
                v-for="so in salesOrderList"
                :key="so.id"
                :label="`${so.order_number} - ${so.customer_name || ''}`"
                :value="so.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户" prop="customer">
            <el-select
              v-model="localForm.customer"
              placeholder="请选择客户"
              filterable
              @change="handleCustomerChange"
              style="width: 100%"
            >
              <el-option
                v-for="customer in customerList"
                :key="customer.id"
                :label="customer.name"
                :value="customer.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <h4 class="form-section-title">收货信息</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="收货人" prop="receiver_name">
            <el-input v-model="localForm.receiver_name" placeholder="请输入收货人" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系电话" prop="receiver_phone">
            <el-input v-model="localForm.receiver_phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="送货地址" prop="delivery_address">
        <el-input v-model="localForm.delivery_address" type="textarea" :rows="2" placeholder="请输入送货地址" />
      </el-form-item>

      <h4 class="form-section-title">物流信息</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="发货日期" prop="delivery_date">
            <el-date-picker
              v-model="localForm.delivery_date"
              type="date"
              placeholder="请选择发货日期"
              value-format="yyyy-MM-dd"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="物流公司">
            <el-select v-model="localForm.logistics_company" placeholder="请选择物流公司" filterable allow-create style="width: 100%">
              <el-option label="顺丰速运" value="顺丰速运" />
              <el-option label="中通快递" value="中通快递" />
              <el-option label="圆通速递" value="圆通速递" />
              <el-option label="申通快递" value="申通快递" />
              <el-option label="韵达快递" value="韵达快递" />
              <el-option label="德邦物流" value="德邦物流" />
              <el-option label="京东物流" value="京东物流" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="物流单号">
            <el-input v-model="localForm.tracking_number" placeholder="请输入物流单号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="运费（元）">
            <el-input-number v-model="localForm.freight" :precision="2" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="包裹数量" prop="package_count">
            <el-input-number v-model="localForm.package_count" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="总重量（kg）">
            <el-input-number v-model="localForm.package_weight" :precision="2" :min="0" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <h4 class="form-section-title">
        发货明细
        <el-button type="primary" size="small" icon="el-icon-plus" @click="addItem" style="margin-left: 10px">
          添加明细
        </el-button>
      </h4>
      <el-table :data="localForm.items_data" border style="width: 100%">
        <el-table-column label="产品" width="250">
          <template slot-scope="scope">
            <el-select v-model="scope.row.product" placeholder="请选择产品" filterable style="width: 100%">
              <el-option
                v-for="product in productList"
                :key="product.id"
                :label="`${product.name} (${product.code || ''})`"
                :value="product.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="150">
          <template slot-scope="scope">
            <el-input-number v-model="scope.row.quantity" :min="1" :precision="2" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="单位" width="100">
          <template slot-scope="scope">
            <el-input v-model="scope.row.unit" placeholder="单位" />
          </template>
        </el-table-column>
        <el-table-column label="单价（元）" width="150">
          <template slot-scope="scope">
            <el-input-number v-model="scope.row.unit_price" :min="0" :precision="2" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="小计（元）" width="120">
          <template slot-scope="scope">
            ¥{{ calculateSubtotal(scope.row).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button type="danger" size="small" icon="el-icon-delete" @click="removeItem(scope.$index)" />
          </template>
        </el-table-column>
      </el-table>

      <el-form-item label="备注" style="margin-top: 20px">
        <el-input v-model="localForm.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'DeliveryFormDialog',
  props: {
    visible: Boolean,
    isEdit: Boolean,
    submitting: Boolean,
    form: Object,
    customerList: Array,
    salesOrderList: Array,
    productList: Array
  },
  data() {
    return {
      rules: {
        customer: [{ required: true, message: '请选择客户', trigger: 'change' }],
        sales_order: [{ required: true, message: '请选择销售订单', trigger: 'change' }],
        receiver_name: [{ required: true, message: '请输入收货人', trigger: 'blur' }],
        receiver_phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
        ],
        delivery_address: [{ required: true, message: '请输入送货地址', trigger: 'blur' }],
        delivery_date: [{ required: true, message: '请选择发货日期', trigger: 'change' }],
        package_count: [
          { required: true, message: '请输入包裹数量', trigger: 'blur' },
          { type: 'number', min: 1, message: '包裹数量至少为1', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    localVisible: {
      get() { return this.visible },
      set() { this.$emit('close') }
    },
    localForm: {
      get() { return this.form },
      set() {} // Ignore setter
    }
  },
  methods: {
    handleClose() {
      this.$emit('close')
    },
    handleSalesOrderChange(value) {
      this.$emit('sales-order-change', value)
    },
    handleCustomerChange(value) {
      this.$emit('customer-change', value)
    },
    addItem() {
      this.$emit('add-item')
    },
    removeItem(index) {
      this.localForm.items_data.splice(index, 1)
    },
    calculateSubtotal(item) {
      return (item.quantity || 0) * (item.unit_price || 0)
    },
    validateItems() {
      if (this.localForm.items_data.length === 0) {
        this.$message.warning('请至少添加一条发货明细')
        return false
      }
      for (let i = 0; i < this.localForm.items_data.length; i++) {
        const item = this.localForm.items_data[i]
        if (!item.product) {
          this.$message.error(`第${i + 1}行：请选择产品`)
          return false
        }
        if (!item.quantity || item.quantity <= 0) {
          this.$message.error(`第${i + 1}行：请输入有效的发货数量`)
          return false
        }
        if (!item.unit_price || item.unit_price < 0) {
          this.$message.error(`第${i + 1}行：请输入有效的单价`)
          return false
        }
      }
      return true
    },
    handleSubmit() {
      this.$refs.formRef.validate((valid) => {
        if (!valid) return
        if (!this.validateItems()) return
        this.$emit('submit')
      })
    }
  }
}
</script>

<style scoped>
.form-section-title {
  margin: 20px 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.form-section-title:first-child {
  margin-top: 0;
}
</style>
