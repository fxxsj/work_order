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
      label-width="100px"
    >
      <el-form-item label="产品编码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入产品编码"
          :disabled="isEditMode"
        />
      </el-form-item>
      <el-form-item label="产品名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入产品名称" />
      </el-form-item>
      <el-form-item label="规格" prop="specification">
        <el-input v-model="form.specification" placeholder="请输入产品规格" />
      </el-form-item>
      <el-form-item label="单位" prop="unit">
        <el-input v-model="form.unit" placeholder="如：件、张、本" />
      </el-form-item>
      <el-form-item label="单价" prop="unit_price">
        <el-input-number
          v-model="form.unit_price"
          :min="0"
          :precision="2"
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item label="库存数量" prop="stock_quantity">
        <el-input-number
          v-model="form.stock_quantity"
          :min="0"
          :precision="0"
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item label="最小库存" prop="min_stock_quantity">
        <el-input-number
          v-model="form.min_stock_quantity"
          :min="0"
          :precision="0"
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item label="产品描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入产品描述"
        />
      </el-form-item>

      <el-divider content-position="left">
        默认物料配置
      </el-divider>

      <el-form-item label="物料列表">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="addMaterialItem"
        >
          添加物料
        </el-button>
        <div style="margin-top: 15px;">
          <el-table
            :data="materialItems"
            border
            style="width: 100%"
          >
            <el-table-column label="物料名称" width="200">
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.material"
                  placeholder="请选择物料"
                  filterable
                  style="width: 100%;"
                >
                  <el-option
                    v-for="material in materials"
                    :key="material.id"
                    :label="`${material.name} (${material.code})`"
                    :value="material.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="尺寸" width="150">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.material_size"
                  placeholder="如：A4、210x297mm"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="用量" width="150">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.material_usage"
                  placeholder="如：1000张"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="需要开料" width="80" align="center">
              <template slot-scope="scope">
                <el-switch
                  v-model="scope.row.need_cutting"
                  size="small"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="danger"
                  size="mini"
                  icon="el-icon-delete"
                  @click="removeMaterialItem(scope.$index)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>

      <el-divider content-position="left">
        默认工序配置
      </el-divider>

      <el-form-item label="默认工序">
        <el-checkbox-group v-model="form.default_processes" style="width: 100%;">
          <el-checkbox
            v-for="process in processes"
            :key="process.id"
            :label="process.id"
            :disabled="!process.is_active"
          >
            {{ process.name }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="是否启用">
        <el-switch v-model="form.is_active" />
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
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
  specification: '',
  unit: '件',
  unit_price: 0,
  stock_quantity: 0,
  min_stock_quantity: 0,
  description: '',
  is_active: true,
  default_processes: []
}

export default {
  name: 'ProductFormDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dialogType: {
      type: String,
      default: 'create' // 'create' | 'edit'
    },
    product: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    materials: {
      type: Array,
      default: () => []
    },
    processes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      form: { ...FORM_INITIAL },
      materialItems: [],
      rules: {
        code: [
          { required: true, message: '请输入产品编码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        specification: [
          { required: true, message: '请输入产品规格', trigger: 'blur' }
        ],
        unit: [
          { required: true, message: '请输入单位', trigger: 'blur' }
        ],
        unit_price: [
          { required: true, message: '请输入单价', trigger: 'blur' }
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
      return this.dialogType === 'edit' ? '编辑产品' : '新建产品'
    },
    isEditMode() {
      return this.dialogType === 'edit'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        if (this.dialogType === 'edit' && this.product) {
          this.initFormFromProduct()
        } else {
          this.resetForm()
        }
      }
    }
  },
  methods: {
    initFormFromProduct() {
      if (!this.product) return

      this.form = {
        code: this.product.code || '',
        name: this.product.name || '',
        specification: this.product.specification || '',
        unit: this.product.unit || '件',
        unit_price: parseFloat(this.product.unit_price) || 0,
        stock_quantity: this.product.stock_quantity || 0,
        min_stock_quantity: this.product.min_stock_quantity || 0,
        description: this.product.description || '',
        is_active: this.product.is_active !== false,
        default_processes: this.product.default_processes || []
      }

      // 初始化物料列表
      if (this.product.default_materials && this.product.default_materials.length > 0) {
        this.materialItems = this.product.default_materials.map(m => ({
          id: m.id,
          material: m.material,
          material_size: m.material_size || '',
          material_usage: m.material_usage || '',
          need_cutting: m.need_cutting || false,
          notes: m.notes || '',
          sort_order: m.sort_order || 0
        }))
      } else {
        this.materialItems = []
      }

      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },
    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.materialItems = []
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },
    addMaterialItem() {
      this.materialItems.push({
        material: null,
        material_size: '',
        material_usage: '',
        need_cutting: false,
        notes: '',
        sort_order: this.materialItems.length
      })
    },
    removeMaterialItem(index) {
      this.materialItems.splice(index, 1)
    },
    handleSubmit() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          this.$emit('confirm', {
            form: { ...this.form },
            materialItems: [...this.materialItems]
          })
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
.el-divider {
  margin: 20px 0;
}
</style>
