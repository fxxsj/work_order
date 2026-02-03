<template>
  <el-dialog
    :visible.sync="dialogVisible"
    title="签收确认"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="签收状态" prop="received">
        <el-radio-group v-model="form.received">
          <el-radio label="received">
            正常签收
          </el-radio>
          <el-radio label="rejected">
            拒收
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="form.received === 'rejected'" label="拒收原因" prop="received_notes">
        <el-input
          v-model="form.received_notes"
          type="textarea"
          :rows="3"
          placeholder="请输入拒收原因"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="签收照片">
        <el-upload
          action=""
          :http-request="uploadReceipt"
          :show-file-list="false"
          accept="image/*"
          :limit="1"
          list-type="picture"
        >
          <el-button size="small" icon="el-icon-upload2">
            上传签收照片
          </el-button>
          <div slot="tip" class="el-upload__tip">
            支持 jpg/png 图片，且不超过 2MB
          </div>
        </el-upload>
      </el-form-item>
    </el-form>

    <template slot="footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleConfirm">
        确认
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
const FORM_INITIAL = {
  received: 'received',
  received_notes: '',
  receiver_signature: ''
}

export default {
  name: 'DeliveryReceiveDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    delivery: {
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
        received: [
          { required: true, message: '请选择签收状态', trigger: 'change' }
        ],
        received_notes: [
          {
            validator: (rule, value, callback) => {
              if (this.form.received === 'rejected' && !value) {
                callback(new Error('请输入拒收原因'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
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

    handleClose() {
      this.resetForm()
      this.dialogVisible = false
    },

    handleConfirm() {
      this.$refs.formRef.validate(valid => {
        if (valid) {
          this.$emit('confirm', { ...this.form })
        }
      })
    },

    uploadReceipt(options) {
      // 图片上传占位符 - 如需实现，请参考其他上传组件的模式
    }
  }
}
</script>

<style scoped>
.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 7px;
}
</style>
