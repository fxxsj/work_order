<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisibleSync"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="form"
      v-loading="loading"
      label-width="120px"
      :model="form"
      :rules="rules"
    >
      <el-form-item label="刀模编码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="留空则系统自动生成（格式：DIE + yyyymm + 序号）"
          :disabled="isEdit && initialData && initialData.confirmed"
        />
        <div style="font-size: 12px; color: #909399; margin-top: 5px;">
          留空则自动生成，格式：DIE202412001
        </div>
      </el-form-item>
      <el-form-item label="刀模名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入刀模名称"
          :disabled="isEdit && initialData && initialData.confirmed"
        />
      </el-form-item>
      <el-form-item label="刀模类型" prop="die_type">
        <el-select
          v-model="form.die_type"
          placeholder="请选择刀模类型"
          style="width: 100%;"
          :disabled="isEdit && initialData && initialData.confirmed"
        >
          <el-option
            v-for="option in dieTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <span>{{ option.label }}</span>
            <span style="float: right; color: #8492a6; font-size: 12px;">{{ option.description }}</span>
          </el-option>
        </el-select>
        <div style="font-size: 12px; color: #909399; margin-top: 5px;">
          拼版刀模：多产品同时切割 | 专用刀模：单产品专用 | 通用刀模：多产品可共用
        </div>
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="尺寸" prop="size">
            <el-input
              v-model="form.size"
              placeholder="如：420x594mm"
              :disabled="isEdit && initialData && initialData.confirmed"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="材质" prop="material">
            <el-input
              v-model="form.material"
              placeholder="如：木板、胶板"
              :disabled="isEdit && initialData && initialData.confirmed"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="厚度" prop="thickness">
        <el-input
          v-model="form.thickness"
          placeholder="如：3mm、5mm"
          :disabled="isEdit && initialData && initialData.confirmed"
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
          :disabled="!canAddMoreProducts"
          @click="addProductItem"
        >
          添加产品
        </el-button>
        <div style="font-size: 12px; color: #909399; margin-top: 5px;">
          {{ productListHint }}
        </div>
        <div style="margin-top: 15px;">
          <el-table
            :data="productItems"
            border
            style="width: 100%"
          >
            <el-table-column label="产品名称" min-width="250">
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
            <el-table-column label="拼版个数" width="120">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  style="width: 100%;"
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
                  @click="removeProductItem(scope.$index)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form-item>

      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
        />
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="handleCancel">
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
const FORM_INITIAL_VALUES = {
  code: '',
  name: '',
  die_type: 'dedicated',
  size: '',
  material: '',
  thickness: '',
  notes: ''
}

// 刀模类型选项
const DIE_TYPE_OPTIONS = [
  { value: 'combined', label: '拼版刀模', description: '多产品同时切割，一次模切产出多种产品' },
  { value: 'dedicated', label: '专用刀模', description: '单产品专用，只能切割一种产品' },
  { value: 'universal', label: '通用刀模', description: '多产品可共用，但每次只切一种产品' }
]

export default {
  name: 'DieFormDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dialogType: {
      type: String,
      default: 'create', // 'create' | 'edit'
      validator: value => ['create', 'edit'].includes(value)
    },
    initialData: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    productList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      form: { ...FORM_INITIAL_VALUES },
      productItems: [],
      dieTypeOptions: DIE_TYPE_OPTIONS,
      rules: {
        name: [
          { required: true, message: '请输入刀模名称', trigger: 'blur' },
          { max: 200, message: '刀模名称不能超过200个字符', trigger: 'blur' }
        ],
        code: [
          { max: 50, message: '刀模编码不能超过50个字符', trigger: 'blur' }
        ],
        die_type: [
          { required: true, message: '请选择刀模类型', trigger: 'change' }
        ],
        size: [
          { max: 100, message: '尺寸不能超过100个字符', trigger: 'blur' }
        ],
        material: [
          { max: 100, message: '材质不能超过100个字符', trigger: 'blur' }
        ],
        thickness: [
          { max: 50, message: '厚度不能超过50个字符', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogVisibleSync: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    dialogTitle() {
      return this.dialogType === 'edit' ? '编辑刀模' : '新建刀模'
    },
    isEdit() {
      return this.dialogType === 'edit'
    },
    // 是否可以添加多个产品（专用刀模只能添加1个产品）
    canAddMoreProducts() {
      if (this.form.die_type === 'dedicated') {
        return this.productItems.length < 1
      }
      return true
    },
    // 产品列表提示文字
    productListHint() {
      const hints = {
        combined: '拼版刀模：可添加多个产品，一次模切同时产出所有产品',
        dedicated: '专用刀模：只能添加1个产品，此刀模专属该产品使用',
        universal: '通用刀模：可添加多个产品，每次模切只产出其中一种'
      }
      return hints[this.form.die_type] || ''
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.initForm()
      }
    },
    // 监听刀模类型变化，专用刀模时只保留第一个产品
    'form.die_type'(newType) {
      if (newType === 'dedicated' && this.productItems.length > 1) {
        this.$confirm('专用刀模只能关联1个产品，是否只保留第一个产品？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.productItems = this.productItems.slice(0, 1)
        }).catch(() => {
          // 用户取消，恢复为之前的类型不做处理
        })
      }
    }
  },
  methods: {
    initForm() {
      if (this.dialogType === 'edit' && this.initialData) {
        this.form = {
          code: this.initialData.code || '',
          name: this.initialData.name || '',
          die_type: this.initialData.die_type || 'dedicated',
          size: this.initialData.size || '',
          material: this.initialData.material || '',
          thickness: this.initialData.thickness || '',
          notes: this.initialData.notes || ''
        }

        if (this.initialData.products && this.initialData.products.length > 0) {
          this.productItems = this.initialData.products.map(p => ({
            id: p.id,
            product: p.product,
            quantity: p.quantity,
            sort_order: p.sort_order || 0
          }))
        } else {
          this.productItems = []
        }
      } else {
        this.form = { ...FORM_INITIAL_VALUES }
        this.productItems = []
      }
    },

    resetForm() {
      this.form = { ...FORM_INITIAL_VALUES }
      this.productItems = []
      if (this.$refs.form) {
        this.$refs.form.clearValidate()
      }
    },

    addProductItem() {
      // 专用刀模只能添加1个产品
      if (!this.canAddMoreProducts) {
        this.$message.warning('专用刀模只能添加1个产品')
        return
      }
      this.productItems.push({
        product: null,
        quantity: 1,
        sort_order: this.productItems.length
      })
    },

    removeProductItem(index) {
      this.productItems.splice(index, 1)
    },

    handleSubmit() {
      this.$refs.form.validate(valid => {
        if (!valid) {
          return false
        }

        const data = { ...this.form }

        // 新建时如果编码为空，删除 code 字段让后端自动生成
        if (!this.isEdit && !data.code) {
          delete data.code
        }

        // 根据刀模类型自动设置关联类型
        // 拼版刀模 -> imposition，其他 -> exclusive
        const relationTypeByDieType = this.form.die_type === 'combined' ? 'imposition' : 'exclusive'

        const productsData = this.productItems
          .filter(item => item.product)
          .map(item => ({
            product: item.product,
            quantity: item.quantity || 1,
            relation_type: relationTypeByDieType
          }))

        data.products_data = productsData

        this.$emit('submit', data)
      })
    },

    handleCancel() {
      this.dialogVisibleSync = false
    },

    handleClose() {
      this.resetForm()
      this.$emit('close')
    }
  }
}
</script>
