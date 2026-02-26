<template>
  <el-dialog
    title="批量调整工序分派"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="form"
      label-width="140px"
      :rules="rules"
    >
      <el-form-item label="工序名称">
        <el-input :value="process ? process.process_name : ''" disabled />
      </el-form-item>
      <el-form-item label="任务数量">
        <el-input :value="process && process.tasks ? process.tasks.length : 0" disabled />
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          将调整该工序下所有任务的分派
        </div>
      </el-form-item>
      <el-form-item label="新分派部门" prop="assigned_department">
        <el-select
          v-model="form.assigned_department"
          placeholder="请选择部门"
          filterable
          clearable
          style="width: 100%;"
          @change="handleDepartmentChange"
        >
          <el-option
            v-for="dept in departmentList"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="新分派操作员" prop="assigned_operator">
        <el-select
          v-model="form.assigned_operator"
          placeholder="请选择操作员（可选）"
          filterable
          clearable
          style="width: 100%;"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.username || `${(user.first_name || '')}${(user.last_name || '')}`.trim() || user.id"
            :value="user.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="调整原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          placeholder="请填写调整原因（必填，便于追溯）"
        />
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          例如：包装车间设备故障，无法处理裱坑工序
        </div>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="请输入备注（可选）"
        />
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="form.update_process_department">
          同时更新工序级别的部门（影响后续生成的任务）
        </el-checkbox>
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          如果勾选，后续生成的任务也会分派到新部门
        </div>
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
export default {
  name: 'ReassignProcessDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    process: {
      type: Object,
      default: null
    },
    departmentList: {
      type: Array,
      default: () => []
    },
    userList: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: '',
        update_process_department: false
      },
      rules: {
        reason: [{ required: true, message: '请填写调整原因', trigger: 'blur' }]
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
      if (val && this.process) {
        this.form = {
          assigned_department: this.process.department || null,
          assigned_operator: null,
          reason: '',
          notes: '',
          update_process_department: false
        }
      }
    }
  },
  methods: {
    handleDepartmentChange() {
      this.$emit('department-change', this.form.assigned_department)
      if (this.form.assigned_department) {
        const currentOperator = this.userList.find(
          u => u.id === this.form.assigned_operator
        )
        if (!currentOperator) {
          this.form.assigned_operator = null
        }
      }
    },
    handleClose() {
      this.$refs.form && this.$refs.form.clearValidate()
      this.form = {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: '',
        update_process_department: false
      }
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return
        if (!this.form.reason) {
          this.$message.warning('请填写调整原因')
          return
        }
        this.$emit('submit', { processId: this.process.id, data: { ...this.form } })
      })
    }
  }
}
</script>
