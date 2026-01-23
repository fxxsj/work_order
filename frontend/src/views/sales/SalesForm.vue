<template>
  <div class="sales-order-form">
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="客户" prop="customer">
            <el-select
              v-model="form.customer"
              placeholder="请选择客户"
              filterable
              style="width: 100%"
              @change="handleCustomerChange"
            >
              <el-option
                v-for="item in customerOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="订单日期" prop="order_date">
            <el-date-picker
              v-model="form.order_date"
              type="date"
              placeholder="请选择订单日期"
              value-format="yyyy-MM-dd"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="交货日期" prop="delivery_date">
            <el-date-picker
              v-model="form.delivery_date"
              type="date"
              placeholder="请选择交货日期"
              value-format="yyyy-MM-dd"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="联系人" prop="contact_person">
            <el-input v-model="form.contact_person" placeholder="请输入联系人" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="联系电话" prop="contact_phone">
            <el-input v-model="form.contact_phone" placeholder="请输入联系电话" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="送货地址" prop="shipping_address">
            <el-input
              v-model="form.shipping_address"
              type="textarea"
              :rows="1"
              placeholder="请输入送货地址"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider>订单明细</el-divider>
      <el-button
        size="small"
        type="primary"
        icon="el-icon-plus"
        @click="handleAddItem"
      >
        添加明细
      </el-button>
      <el-table :data="form.items" border style="margin-top: 10px">
        <el-table-column label="产品" width="250">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.product"
              placeholder="请选择产品"
              filterable
              @change="handleProductChange(scope.row)"
            >
              <el-option
                v-for="item in productOptions"
                :key="item.id"
                :label="`${item.code} - ${item.name}`"
                :value="item.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120">
          <template slot-scope="scope">
            <el-input-number v-model="scope.row.quantity" :min="1" :precision="0" />
          </template>
        </el-table-column>
        <el-table-column label="单位" width="100">
          <template slot-scope="scope">
            <el-input v-model="scope.row.unit" placeholder="件" />
          </template>
        </el-table-column>
        <el-table-column label="单价" width="150">
          <template slot-scope="scope">
            <el-input-number v-model="scope.row.unit_price" :min="0" :precision="2" />
          </template>
        </el-table-column>
        <el-table-column label="税率(%)" width="120">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.tax_rate"
              :min="0"
              :max="100"
              :precision="2"
            />
          </template>
        </el-table-column>
        <el-table-column label="折扣金额" width="120">
          <template slot-scope="scope">
            <el-input-number v-model="scope.row.discount_amount" :min="0" :precision="2" />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="120" align="right">
          <template slot-scope="scope">
            ¥{{ calculateItemSubtotal(scope.row).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template slot-scope="scope">
            <el-input v-model="scope.row.notes" placeholder="请输入备注" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click="handleDeleteItem(scope.$index)"
            />
          </template>
        </el-table-column>
      </el-table>
      <el-divider>金额信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="小计">
            <el-input v-model="subtotal" disabled>
              <template slot="prepend">
                ¥
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="税率(%)">
            <el-input-number
              v-model="form.tax_rate"
              :min="0"
              :max="100"
              :precision="2"
              style="width: 100%"
              @change="calculateTotals"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="税额">
            <el-input v-model="taxAmount" disabled>
              <template slot="prepend">
                ¥
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="折扣金额">
            <el-input-number
              v-model="form.discount_amount"
              :min="0"
              :precision="2"
              style="width: 100%"
              @change="calculateTotals"
            />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="订单总金额">
            <el-input :value="totalAmount" disabled>
              <template slot="prepend">
                ¥
              </template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
      <el-divider>其他信息</el-divider>
      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="$emit('cancel')">
        取消
      </el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </div>
  </div>
</template>

<script>
import { customerAPI, productAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

// 表单初始值常量
const FORM_INITIAL = {
  customer: null,
  order_date: '',
  delivery_date: '',
  contact_person: '',
  contact_phone: '',
  shipping_address: '',
  tax_rate: 13,
  discount_amount: 0,
  notes: '',
  items: []
}

export default {
  name: 'SalesOrderForm',
  props: {
    formData: {
      type: Object,
      default: () => ({})
    },
    dialogMode: {
      type: String,
      default: 'add' // 'add' or 'edit'
    }
  },
  data() {
    return {
      form: { ...FORM_INITIAL },
      customerOptions: [],
      productOptions: [],
      workOrderOptions: [],
      submitting: false,
      rules: {
        customer: [
          { required: true, message: '请选择客户', trigger: 'change' }
        ],
        order_date: [
          { required: true, message: '请选择订单日期', trigger: 'change' }
        ],
        delivery_date: [
          { required: true, message: '请选择交货日期', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    subtotal() {
      return this.form.items.reduce((sum, item) => sum + this.calculateItemSubtotal(item), 0).toFixed(2)
    },
    taxAmount() {
      const subtotal = parseFloat(this.subtotal)
      return (subtotal * this.form.tax_rate / 100).toFixed(2)
    },
    totalAmount() {
      const subtotal = parseFloat(this.subtotal)
      const taxAmount = parseFloat(this.taxAmount)
      return (subtotal + taxAmount - this.form.discount_amount).toFixed(2)
    }
  },
  async created() {
    await this.fetchCustomers()
    await this.fetchProducts()
    if (this.dialogMode === 'edit' && this.formData.id) {
      this.form = { ...this.form, ...this.formData }
    } else {
      this.form.order_date = new Date().toISOString().split('T')[0]
      this.form.delivery_date = new Date().toISOString().split('T')[0]
    }
  },
  methods: {
    async fetchCustomers() {
      try {
        const response = await customerAPI.getList({ page_size: 1000 })
        this.customerOptions = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '获取客户列表失败')
      }
    },
    async fetchProducts() {
      try {
        const response = await productAPI.getList({ page_size: 1000 })
        this.productOptions = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '获取产品列表失败')
      }
    },
    handleCustomerChange(customerId) {
      // 根据选择的客户自动填充联系人、电话、地址信息
      const customer = this.customerOptions.find(c => c.id === customerId)
      if (customer) {
        this.form.contact_person = customer.contact_person || ''
        this.form.contact_phone = customer.phone || customer.contact_phone || ''
        this.form.shipping_address = customer.address || ''
      }
    },
    handleProductChange(row) {
      const product = this.productOptions.find(p => p.id === row.product)
      if (product) {
        if (!row.unit) {
          row.unit = product.unit
        }
        if (!row.unit_price) {
          row.unit_price = product.unit_price
        }
      }
    },
    calculateItemSubtotal(item) {
      const quantity = item.quantity || 0
      const unitPrice = item.unit_price || 0
      const discount = item.discount_amount || 0
      return quantity * unitPrice - discount
    },
    calculateTotals() {
      // 计算由computed属性自动处理
    },
    handleAddItem() {
      this.form.items.push({
        product: null,
        quantity: 1,
        unit: '件',
        unit_price: 0,
        tax_rate: this.form.tax_rate,
        discount_amount: 0,
        notes: ''
      })
    },
    handleDeleteItem(index) {
      this.form.items.splice(index, 1)
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return

        if (this.form.items.length === 0) {
          this.$message.error('请至少添加一条订单明细')
          return
        }

        this.submitting = true
        try {
          // 准备提交数据，确保字段类型正确
          const submitData = {
            customer: this.form.customer,
            order_date: this.form.order_date,
            delivery_date: this.form.delivery_date,
            tax_rate: parseFloat(this.form.tax_rate) || 0,
            discount_amount: parseFloat(this.form.discount_amount) || 0,
            items: this.form.items.map(item => ({
              product: item.product,
              quantity: parseInt(item.quantity) || 0,
              unit: item.unit || '件',
              unit_price: parseFloat(item.unit_price) || 0,
              tax_rate: parseFloat(item.tax_rate) || 0,
              discount_amount: parseFloat(item.discount_amount) || 0,
              notes: item.notes || ''
            }))
          }

          // 只添加有值的可选字段
          if (this.form.contact_person) {
            submitData.contact_person = this.form.contact_person
          }
          if (this.form.contact_phone) {
            submitData.contact_phone = this.form.contact_phone
          }
          if (this.form.shipping_address) {
            submitData.shipping_address = this.form.shipping_address
          }
          if (this.form.notes) {
            submitData.notes = this.form.notes
          }

          this.$emit('submit', submitData)
        } catch (error) {
          ErrorHandler.showMessage(error, '保存失败')
        } finally {
          this.submitting = false
        }
      })
    }
  }
}
</script>

<style scoped>
.sales-order-form {
  padding: 20px;
}

.dialog-footer {
  margin-top: 20px;
  text-align: right;
}
</style>
