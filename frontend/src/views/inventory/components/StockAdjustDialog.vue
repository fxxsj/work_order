<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <!-- 只读信息 -->
      <el-form-item label="产品名称">
        <el-input :value="stock ? stock.product_name : ''" disabled />
      </el-form-item>
      <el-form-item label="批次号">
        <el-input :value="stock ? stock.batch_no : ''" disabled />
      </el-form-item>
      <el-form-item label="当前库存">
        <el-input :value="stock ? stock.quantity : ''" disabled />
      </el-form-item>

      <!-- 可编辑字段 -->
      <el-form-item label="调整类型" prop="adjust_type">
        <el-radio-group v-model="form.adjust_type">
          <el-radio label="add">
            增加
          </el-radio>
          <el-radio label="subtract">
            减少
          </el-radio>
          <el-radio label="set">
            设置为
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="调整数量" prop="quantity">
        <el-input-number
          v-model="form.quantity"
          :min="0"
          :precision="2"
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item label="调整后库存">
        <el-input :value="previewQuantity" disabled>
          <template slot="suffix">
            <span v-if="quantityChange !== 0" :style="{ color: quantityChange > 0 ? '#67c23a' : '#f56c6c' }">
              ({{ quantityChange > 0 ? '+' : '' }}{{ quantityChange }})
            </span>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="调整原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入调整原因"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template slot="footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
const FORM_INITIAL = {
  adjust_type: 'add',
  quantity: 0,
  reason: ''
}

export default {
  name: 'StockAdjustDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    stock: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      form: { ...FORM_INITIAL },
      rules: {
        adjust_type: [
          { required: true, message: '请选择调整类型', trigger: 'change' }
        ],
        quantity: [
          { required: true, message: '请输入调整数量', trigger: 'blur' },
          {
            validator: (rule, value, callback) => {
              if (value < 0) {
                callback(new Error('调整数量不能为负数'))
              } else if (this.form.adjust_type === 'subtract' && this.stock && value > this.stock.quantity) {
                callback(new Error('减少数量不能大于当前库存'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        reason: [
          { required: true, message: '请输入调整原因', trigger: 'blur' },
          { min: 2, max: 500, message: '调整原因长度在 2 到 500 个字符', trigger: 'blur' }
        ]
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

    dialogTitle() {
      return '库存调整'
    },

    previewQuantity() {
      if (!this.stock) return 0

      const currentQty = parseFloat(this.stock.quantity) || 0
      const adjustQty = parseFloat(this.form.quantity) || 0

      switch (this.form.adjust_type) {
        case 'add':
          return (currentQty + adjustQty).toFixed(2)
        case 'subtract':
          return Math.max(0, currentQty - adjustQty).toFixed(2)
        case 'set':
          return adjustQty.toFixed(2)
        default:
          return currentQty.toFixed(2)
      }
    },

    quantityChange() {
      if (!this.stock) return 0

      const currentQty = parseFloat(this.stock.quantity) || 0
      const previewQty = parseFloat(this.previewQuantity) || 0

      return parseFloat((previewQty - currentQty).toFixed(2))
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.resetForm()
      }
    }
  },

  methods: {
    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.$nextTick(() => {
        if (this.$refs.formRef) {
          this.$refs.formRef.clearValidate()
        }
      })
    },

    handleConfirm() {
      this.$refs.formRef.validate(valid => {
        if (valid) {
          this.$emit('confirm', { ...this.form })
        }
      })
    },

    handleClose() {
      this.resetForm()
      this.dialogVisible = false
    }
  }
}
</script>

<style scoped>
/* 组件样式 */
</style>
