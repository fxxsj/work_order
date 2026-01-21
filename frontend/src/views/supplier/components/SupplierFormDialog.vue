<template>
  <el-dialog
    :title="dialogTitle"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="供应商编码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入供应商编码"
          :disabled="isEditMode"
        />
      </el-form-item>
      <el-form-item label="供应商名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入供应商名称" />
      </el-form-item>
      <el-form-item label="联系人" prop="contact_person">
        <el-input v-model="form.contact_person" placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input
          v-model="form.address"
          type="textarea"
          :rows="3"
          placeholder="请输入地址"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio label="active">
            启用
          </el-radio>
          <el-radio label="inactive">
            停用
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注"
        />
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
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  status: 'active',
  notes: ''
}

export default {
  name: 'SupplierFormDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    dialogType: {
      type: String,
      default: 'create' // 'create' | 'edit'
    },
    supplier: {
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
        code: [
          { required: true, message: '请输入供应商编码', trigger: 'blur' },
          { min: 2, max: 50, message: '编码长度在2-50个字符之间', trigger: 'blur' },
          { pattern: /^[A-Za-z0-9-]+$/, message: '编码只能包含字母、数字和连字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入供应商名称', trigger: 'blur' }
        ],
        phone: [
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的联系电话', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
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
      return this.dialogType === 'edit' ? '编辑供应商' : '新增供应商'
    },
    isEditMode() {
      return this.dialogType === 'edit'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        if (this.dialogType === 'edit' && this.supplier) {
          this.initFormFromSupplier()
        } else {
          this.resetForm()
        }
      }
    }
  },
  methods: {
    initFormFromSupplier() {
      if (!this.supplier) return

      this.form = {
        id: this.supplier.id,
        code: this.supplier.code || '',
        name: this.supplier.name || '',
        contact_person: this.supplier.contact_person || '',
        phone: this.supplier.phone || '',
        email: this.supplier.email || '',
        address: this.supplier.address || '',
        status: this.supplier.status || 'active',
        notes: this.supplier.notes || ''
      }

      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },
    resetForm() {
      this.form = { ...FORM_INITIAL }
      this.$nextTick(() => {
        this.$refs.formRef?.clearValidate()
      })
    },
    handleSubmit() {
      this.$refs.formRef.validate((valid) => {
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
