<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="700px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="烫金版编码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="留空则系统自动生成（格式：FP + yyyymm + 序号）"
          :disabled="isConfirmed"
        />
        <div style="font-size: 12px; color: #909399; margin-top: 5px;">
          留空则自动生成，格式：FP202412001
        </div>
      </el-form-item>
      <el-form-item label="烫金版名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入烫金版名称"
          :disabled="isConfirmed"
        />
      </el-form-item>
      <el-form-item label="类型" prop="foiling_type">
        <el-select
          v-model="form.foiling_type"
          placeholder="请选择类型"
          style="width: 100%;"
        >
          <el-option label="烫金" value="gold" />
          <el-option label="烫银" value="silver" />
        </el-select>
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="尺寸">
            <el-input
              v-model="form.size"
              placeholder="如：420x594mm"
              :disabled="isConfirmed"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="材质">
            <el-input
              v-model="form.material"
              placeholder="如：铜版、锌版"
              :disabled="isConfirmed"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="厚度">
        <el-input
          v-model="form.thickness"
          placeholder="如：3mm、5mm"
          :disabled="isConfirmed"
        />
      </el-form-item>

      <el-divider content-position="left">
        包含产品及数量
      </el-divider>

      <el-form-item label="产品列表">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="addProductItem"
        >
          添加产品
        </el-button>
        <div style="margin-top: 15px;">
          <el-table
            :data="productItems"
            border
            style="width: 100%"
          >
            <el-table-column label="产品名称" width="250">
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.product"
                  placeholder="请选择产品"
                  filterable
                  style="width: 100%;"
                >
                  <el-option
                    v-for="product in productList"
                    :key="product.id"
                    :label="`${product.name} (${product.code})`"
                    :value="product.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="150">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  style="width: 100%;"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template slot-scope="scope">
                <el-button
                  type="danger"
                  size="mini"
                  icon="el-icon-delete"
                  @click="removeProductItem(scope.$index)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
        />
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        确定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
// 表单初始值常量
const FORM_INITIAL = {
  code: '',
  name: '',
  foiling_type: 'gold',
  size: '',
  material: '',
  thickness: '',
  notes: ''
}

export default {
  name: 'FoilingPlateFormDialog',

  props: {
    visible: { type: Boolean, default: false },
    dialogType: { type: String, default: 'create' },
    foilingPlate: { type: Object, default: null },
    loading: { type: Boolean, default: false },
    productList: { type: Array, default: () => [] }
  },

  data() {
    return {
      form: { ...FORM_INITIAL },
      productItems: [],
      rules: {
        name: [{ required: true, message: '请输入烫金版名称', trigger: 'blur' }]
      }
    }
  },

  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(val) { this.$emit('update:visible', val) }
    },
    dialogTitle() {
      return this.dialogType === 'edit' ? '编辑烫金版' : '新建烫金版'
    },
    isConfirmed() {
      return this.dialogType === 'edit' && this.foilingPlate && this.foilingPlate.confirmed
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initForm()
      }
    }
  },

  methods: {
    initForm() {
      if (this.dialogType === 'edit' && this.foilingPlate) {
        this.form = {
          code: this.foilingPlate.code,
          name: this.foilingPlate.name,
          foiling_type: this.foilingPlate.foiling_type || 'gold',
          size: this.foilingPlate.size || '',
          material: this.foilingPlate.material || '',
          thickness: this.foilingPlate.thickness || '',
          notes: this.foilingPlate.notes || ''
        }
        this.productItems = (this.foilingPlate.products || []).map(p => ({
          id: p.id,
          product: p.product,
          quantity: p.quantity,
          sort_order: p.sort_order || 0
        }))
      } else {
        this.resetForm()
      }
      this.$nextTick(() => {
        if (this.$refs.formRef) {
          this.$refs.formRef.clearValidate()
        }
      })
    },

    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.productItems = []
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields()
      }
    },

    handleConfirm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.$emit('confirm', {
            form: { ...this.form },
            productItems: [...this.productItems]
          })
        }
      })
    },

    handleClose() {
      this.resetForm()
      this.dialogVisible = false
    },

    addProductItem() {
      this.productItems.push({ product: null, quantity: 1, sort_order: this.productItems.length })
    },

    removeProductItem(index) {
      this.productItems.splice(index, 1)
    }
  }
}
</script>
