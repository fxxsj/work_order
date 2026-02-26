<template>
  <el-dialog
    title="更新物料采购状态"
    :visible.sync="dialogVisible"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <el-form-item label="物料名称">
        <el-input :value="material.material_name" disabled />
      </el-form-item>
      <el-form-item label="当前状态">
        <el-tag :type="statusType" size="small">
          {{ material.purchase_status_display }}
        </el-tag>
      </el-form-item>
      <el-form-item label="更新为" prop="purchase_status">
        <el-select
          v-model="form.purchase_status"
          placeholder="请选择状态"
          style="width: 100%;"
          @change="handleStatusChange"
        >
          <el-option
            v-for="status in availableStatuses"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="form.purchase_status === 'ordered'"
        label="采购日期"
        prop="purchase_date"
      >
        <el-date-picker
          v-model="form.purchase_date"
          type="date"
          placeholder="选择采购日期"
          style="width: 100%;"
          value-format="yyyy-MM-dd"
        />
      </el-form-item>
      <el-form-item
        v-if="form.purchase_status === 'received'"
        label="回料日期"
        prop="received_date"
      >
        <el-date-picker
          v-model="form.received_date"
          type="date"
          placeholder="选择回料日期"
          style="width: 100%;"
          value-format="yyyy-MM-dd"
        />
      </el-form-item>
      <el-form-item
        v-if="form.purchase_status === 'cut'"
        label="开料日期"
        prop="cut_date"
      >
        <el-date-picker
          v-model="form.cut_date"
          type="date"
          placeholder="选择开料日期"
          style="width: 100%;"
          value-format="yyyy-MM-dd"
        />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
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
export default {
  name: 'MaterialStatusDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    material: {
      type: Object,
      default: () => ({})
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        purchase_status: '',
        purchase_date: '',
        received_date: '',
        cut_date: ''
      },
      rules: {
        purchase_status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ],
        purchase_date: [
          { required: true, message: '请选择采购日期', trigger: 'change' }
        ],
        received_date: [
          { required: true, message: '请选择回料日期', trigger: 'change' }
        ],
        cut_date: [
          { required: true, message: '请选择开料日期', trigger: 'change' }
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
    statusType() {
      const typeMap = {
        pending: 'info',
        ordered: 'primary',
        received: 'success',
        cut: 'warning',
        completed: 'success'
      }
      return typeMap[this.material.purchase_status] || 'info'
    },
    availableStatuses() {
      const status = this.material.purchase_status
      const statusMap = {
        pending: [{ value: 'ordered', label: '已下单' }],
        ordered: [{ value: 'received', label: '已回料' }],
        received: [{ value: 'cut', label: '已开料' }],
        cut: [{ value: 'completed', label: '已完成' }],
        completed: []
      }
      return statusMap[status] || []
    }
  },
  watch: {
    material: {
      handler(val) {
        if (val) {
          this.form = {
            purchase_status: '',
            purchase_date: val.purchase_date || '',
            received_date: val.received_date || '',
            cut_date: val.cut_date || ''
          }
        }
      },
      immediate: true
    }
  },
  methods: {
    handleStatusChange() {
      const today = new Date().toISOString().split('T')[0]
      if (this.form.purchase_status === 'ordered' && !this.form.purchase_date) {
        this.form.purchase_date = today
      } else if (this.form.purchase_status === 'received' && !this.form.received_date) {
        this.form.received_date = today
      } else if (this.form.purchase_status === 'cut' && !this.form.cut_date) {
        this.form.cut_date = today
      }
    },
    handleClose() {
      this.$refs.form && this.$refs.form.resetFields()
      this.form = {
        purchase_status: '',
        purchase_date: '',
        received_date: '',
        cut_date: ''
      }
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return

        const updateData = {
          purchase_status: this.form.purchase_status
        }

        if (this.form.purchase_status === 'ordered' && this.form.purchase_date) {
          updateData.purchase_date = this.form.purchase_date
        }
        if (this.form.purchase_status === 'received' && this.form.received_date) {
          updateData.received_date = this.form.received_date
          if (!this.form.purchase_date) {
            updateData.purchase_date = this.form.received_date
          }
        }
        if (this.form.purchase_status === 'cut' && this.form.cut_date) {
          updateData.cut_date = this.form.cut_date
          if (!this.form.received_date) {
            updateData.received_date = this.form.cut_date
          }
          if (!this.form.purchase_date) {
            updateData.purchase_date = this.form.cut_date
          }
        }
        if (this.form.purchase_status === 'completed') {
          if (!this.form.cut_date) {
            updateData.cut_date = new Date().toISOString().split('T')[0]
          }
          if (!this.form.received_date) {
            updateData.received_date = updateData.cut_date
          }
          if (!this.form.purchase_date) {
            updateData.purchase_date = updateData.cut_date
          }
        }

        this.$emit('submit', { id: this.material.id, data: updateData })
      })
    }
  }
}
</script>
