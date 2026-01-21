<template>
  <el-dialog
    :title="isEdit ? '编辑采购单' : '新增采购单'"
    :visible.sync="dialogVisible"
    width="900px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="localForm"
      :rules="rules"
      label-width="100px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="供应商" prop="supplier">
            <el-select
              v-model="localForm.supplier"
              placeholder="请选择供应商"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="item in supplierOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="关联施工单">
            <el-input
              v-model="localForm.work_order_number"
              placeholder="请输入施工单号"
              disabled
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注">
        <el-input
          v-model="localForm.notes"
          type="textarea"
          :rows="2"
          placeholder="请输入备注"
        />
      </el-form-item>
      <el-divider>采购明细</el-divider>
      <el-button
        size="small"
        type="primary"
        icon="el-icon-plus"
        @click="handleAddItem"
      >
        添加明细
      </el-button>
      <el-table :data="localForm.items" border style="margin-top: 10px">
        <el-table-column label="物料" width="250">
          <template slot-scope="scope">
            <el-select
              v-model="scope.row.material"
              placeholder="请选择物料"
              filterable
              style="width: 100%"
              @change="handleMaterialChange(scope.row)"
            >
              <el-option
                v-for="item in materialOptions"
                :key="item.id"
                :label="`${item.code} - ${item.name}`"
                :value="item.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="采购数量" width="150">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.quantity"
              :min="1"
              :precision="2"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="单价" width="150">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.unit_price"
              :min="0"
              :precision="2"
              style="width: 100%"
            />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="120" align="right">
          <template slot-scope="scope">
            ¥{{ ((scope.row.quantity || 0) * (scope.row.unit_price || 0)).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template slot-scope="scope">
            <el-button type="text" style="color: #F56C6C" @click="handleDeleteItem(scope.$index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="localForm.items.length > 0" class="total-amount">
        <span>合计金额：</span>
        <span class="amount">¥{{ totalAmount }}</span>
      </div>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { supplierAPI, materialAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

// 表单初始值常量
const FORM_INITIAL = {
  supplier: null,
  work_order_number: '',
  notes: '',
  items: []
}

export default {
  name: 'PurchaseFormDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    formData: {
      type: Object,
      default: () => ({ ...FORM_INITIAL })
    },
    isEdit: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      loading: false,
      localForm: { ...FORM_INITIAL, items: [] },
      supplierOptions: [],
      materialOptions: [],
      rules: {
        supplier: [{ required: true, message: '请选择供应商', trigger: 'change' }]
      }
    }
  },

  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    totalAmount() {
      return this.localForm.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0).toFixed(2)
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.fetchOptions()
        // 复制 formData 到 localForm
        this.localForm = {
          ...this.formData,
          items: (this.formData.items || []).map(item => ({ ...item }))
        }
      }
    }
  },

  methods: {
    /**
     * 加载选项数据
     */
    async fetchOptions() {
      try {
        const [supplierRes, materialRes] = await Promise.all([
          supplierAPI.getList({ page_size: 1000, status: 'active' }),
          materialAPI.getList({ page_size: 1000 })
        ])
        this.supplierOptions = supplierRes.results || []
        this.materialOptions = materialRes.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '获取选项数据')
      }
    },

    /**
     * 添加明细行
     */
    handleAddItem() {
      this.localForm.items.push({
        material: null,
        quantity: 1,
        unit_price: 0
      })
    },

    /**
     * 删除明细行
     */
    handleDeleteItem(index) {
      this.localForm.items.splice(index, 1)
    },

    /**
     * 物料变化时自动填充单价
     */
    handleMaterialChange(row) {
      const material = this.materialOptions.find(m => m.id === row.material)
      if (material && material.unit_price) {
        row.unit_price = material.unit_price
      }
    },

    /**
     * 提交表单
     */
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return

        // 验证明细数据
        if (!this.localForm.items || this.localForm.items.length === 0) {
          ErrorHandler.showWarning('请至少添加一条采购明细')
          return
        }

        // 验证明细完整性
        const invalidItem = this.localForm.items.find(item => !item.material)
        if (invalidItem) {
          ErrorHandler.showWarning('请选择所有明细的物料')
          return
        }

        this.loading = true
        try {
          this.$emit('confirm', { ...this.localForm })
        } finally {
          this.loading = false
        }
      })
    },

    /**
     * 关闭对话框
     */
    handleClose() {
      this.$refs.form && this.$refs.form.resetFields()
      this.localForm = { ...FORM_INITIAL, items: [] }
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.total-amount {
  margin-top: 16px;
  text-align: right;
  font-size: 14px;
}

.total-amount .amount {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}
</style>
