<template>
  <el-dialog
    title="调整任务分派"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item label="任务内容">
        <el-input :value="task ? task.work_content : ''" disabled />
      </el-form-item>
      <el-form-item label="分派部门">
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
      <el-form-item label="分派操作员">
        <el-select
          v-model="form.assigned_operator"
          placeholder="请选择操作员"
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
      <el-form-item label="调整原因">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="2"
          placeholder="请输入调整原因（可选）"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="请输入备注（可选）"
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
export default {
  name: 'TaskAssignDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    task: {
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
        notes: ''
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
      if (val && this.task) {
        this.form = {
          assigned_department: this.task.assigned_department || null,
          assigned_operator: this.task.assigned_operator || null,
          reason: '',
          notes: ''
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
        notes: ''
      }
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleSubmit() {
      this.$emit('submit', { taskId: this.task.id, data: { ...this.form } })
    }
  }
}
</script>
