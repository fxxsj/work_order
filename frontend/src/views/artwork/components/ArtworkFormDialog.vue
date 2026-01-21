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
      <el-form-item label="图稿主编码" prop="base_code">
        <el-input
          v-model="form.base_code"
          placeholder="留空则系统自动生成（格式：ART + yyyymm + 序号）"
          :disabled="isEditMode"
        />
        <div style="font-size: 12px; color: #909399; margin-top: 5px;">
          {{ isEditMode ? '主编码不可修改' : '留空则自动生成，格式：ART202412001' }}
        </div>
      </el-form-item>
      <el-form-item v-if="isEditMode" label="版本号" prop="version">
        <el-input-number
          v-model="form.version"
          :min="1"
          :disabled="true"
          style="width: 100%;"
        />
        <div style="font-size: 12px; color: #909399; margin-top: 5px;">
          完整编码：{{ form.base_code }}{{ form.version > 1 ? '-v' + form.version : '' }}
        </div>
      </el-form-item>
      <el-form-item label="图稿名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入图稿名称" />
      </el-form-item>
      <el-form-item label="CMYK颜色">
        <el-checkbox-group v-model="form.cmyk_colors">
          <el-checkbox label="C">
            C
          </el-checkbox>
          <el-checkbox label="M">
            M
          </el-checkbox>
          <el-checkbox label="Y">
            Y
          </el-checkbox>
          <el-checkbox label="K">
            K
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="其他颜色">
        <div v-for="(color, index) in form.other_colors" :key="index" style="margin-bottom: 10px; display: flex; align-items: center;">
          <el-input
            v-model="form.other_colors[index]"
            placeholder="请输入颜色名称，如：528C、金色"
            style="flex: 1; margin-right: 10px;"
          />
          <el-button
            type="danger"
            size="small"
            icon="el-icon-delete"
            circle
            @click="removeOtherColor(index)"
          />
        </div>
        <el-button
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="addOtherColor"
        >
          添加颜色
        </el-button>
      </el-form-item>
      <el-form-item label="拼版尺寸">
        <el-input v-model="form.imposition_size" placeholder="如：420x594mm" />
      </el-form-item>
      <el-form-item label="关联刀模">
        <el-select
          v-model="form.dies"
          placeholder="请选择刀模（可多选）"
          filterable
          clearable
          multiple
          style="width: 100%;"
        >
          <el-option
            v-for="die in dieList"
            :key="die.id"
            :label="`${die.name} (${die.code})`"
            :value="die.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关联烫金版">
        <el-select
          v-model="form.foiling_plates"
          placeholder="请选择烫金版（可多选）"
          filterable
          clearable
          multiple
          style="width: 100%;"
        >
          <el-option
            v-for="plate in foilingPlateList"
            :key="plate.id"
            :label="`${plate.name} (${plate.code})`"
            :value="plate.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="关联压凸版">
        <el-select
          v-model="form.embossing_plates"
          placeholder="请选择压凸版（可多选）"
          filterable
          clearable
          multiple
          style="width: 100%;"
        >
          <el-option
            v-for="plate in embossingPlateList"
            :key="plate.id"
            :label="`${plate.name} (${plate.code})`"
            :value="plate.id"
          />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">
        包含产品及拼版数量
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
            <el-table-column label="拼版数量" width="150">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.imposition_quantity"
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
  base_code: '',
  version: 1,
  name: '',
  cmyk_colors: [],
  other_colors: [],
  imposition_size: '',
  dies: [],
  foiling_plates: [],
  embossing_plates: [],
  notes: ''
}

export default {
  name: 'ArtworkFormDialog',

  props: {
    // 对话框可见性
    visible: {
      type: Boolean,
      default: false
    },
    // 当前编辑的图稿数据（编辑模式）
    artwork: {
      type: Object,
      default: null
    },
    // 提交加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 产品列表
    productList: {
      type: Array,
      default: () => []
    },
    // 刀模列表
    dieList: {
      type: Array,
      default: () => []
    },
    // 烫金版列表
    foilingPlateList: {
      type: Array,
      default: () => []
    },
    // 压凸版列表
    embossingPlateList: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      form: { ...FORM_INITIAL },
      productItems: [],
      rules: {
        name: [
          { required: true, message: '请输入图稿名称', trigger: 'blur' }
        ]
      }
    }
  },

  computed: {
    // 双向绑定 visible
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    },
    // 是否编辑模式
    isEditMode() {
      return !!this.artwork
    },
    // 对话框标题
    dialogTitle() {
      return this.isEditMode ? '编辑图稿' : '新建图稿'
    }
  },

  watch: {
    // 监听 visible 变化初始化表单
    visible(val) {
      if (val) {
        this.initForm()
      }
    }
  },

  methods: {
    // 初始化表单
    initForm() {
      if (this.artwork) {
        // 编辑模式：填充数据
        this.form = {
          base_code: this.artwork.base_code || '',
          version: this.artwork.version || 1,
          name: this.artwork.name || '',
          cmyk_colors: this.artwork.cmyk_colors || [],
          other_colors: Array.isArray(this.artwork.other_colors)
            ? this.artwork.other_colors
            : (this.artwork.other_colors ? [this.artwork.other_colors] : []),
          imposition_size: this.artwork.imposition_size || '',
          dies: this.artwork.dies || [],
          foiling_plates: this.artwork.foiling_plates || [],
          embossing_plates: this.artwork.embossing_plates || [],
          notes: this.artwork.notes || ''
        }

        if (this.artwork.products && this.artwork.products.length > 0) {
          this.productItems = this.artwork.products.map(p => ({
            id: p.id,
            product: p.product,
            imposition_quantity: p.imposition_quantity,
            sort_order: p.sort_order || 0
          }))
        } else {
          this.productItems = []
        }
      } else {
        // 创建模式：重置表单
        this.resetForm()
      }

      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },

    // 重置表单
    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.productItems = []
      this.$refs.formRef?.resetFields()
    },

    // 添加产品项
    addProductItem() {
      this.productItems.push({
        product: null,
        imposition_quantity: 1,
        sort_order: this.productItems.length
      })
    },

    // 移除产品项
    removeProductItem(index) {
      this.productItems.splice(index, 1)
    },

    // 添加其他颜色
    addOtherColor() {
      this.form.other_colors.push('')
    },

    // 移除其他颜色
    removeOtherColor(index) {
      this.form.other_colors.splice(index, 1)
    },

    // 确认提交
    handleConfirm() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          const data = { ...this.form }

          // 新建时，如果 base_code 为空则删除让后端生成
          if (!this.isEditMode && !data.base_code) {
            delete data.base_code
          }
          if (!this.isEditMode) {
            delete data.version
          }

          // 过滤空的其他颜色
          if (data.other_colors) {
            data.other_colors = data.other_colors.filter(color => color && color.trim())
          }

          // 产品数据
          const productsData = this.productItems
            .filter(item => item.product)
            .map(item => ({
              product: item.product,
              imposition_quantity: item.imposition_quantity || 1
            }))

          data.products_data = productsData

          this.$emit('confirm', data)
        }
      })
    },

    // 关闭对话框
    handleClose() {
      this.resetForm()
      this.dialogVisible = false
    }
  }
}
</script>
