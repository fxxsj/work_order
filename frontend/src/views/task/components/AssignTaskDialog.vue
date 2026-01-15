<template>
  <el-dialog
    title="调整任务分派"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="formData"
      label-width="120px"
    >
      <el-form-item label="任务内容">
        <el-input :value="task?.work_content" disabled></el-input>
      </el-form-item>

      <el-form-item label="分派部门" prop="assigned_department">
        <el-select
          v-model="formData.assigned_department"
          placeholder="请选择部门"
          filterable
          clearable
          style="width: 100%;"
          :loading="loadingDepartments"
          @change="handleDepartmentChange"
        >
          <el-option
            v-for="dept in departmentList"
            :key="dept.id"
            :label="dept.name"
            :value="dept.id"
          ></el-option>
        </el-select>
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          选择任务分派到的部门，留空表示不清空现有分派
        </div>
      </el-form-item>

      <el-form-item label="分派操作员" prop="assigned_operator">
        <el-select
          v-model="formData.assigned_operator"
          placeholder="请选择操作员"
          filterable
          clearable
          style="width: 100%;"
          :loading="loadingUsers"
        >
          <el-option
            v-for="user in userList"
            :key="user.id"
            :label="user.username || `${(user.first_name || '')}${(user.last_name || '')}`.trim() || user.id"
            :value="user.id"
          ></el-option>
        </el-select>
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          选择任务分派到的操作员，留空表示不清空现有分派
        </div>
      </el-form-item>

      <el-form-item label="调整原因">
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="2"
          placeholder="请输入调整原因（可选，便于追溯）"
        ></el-input>
      </el-form-item>

      <el-form-item label="备注">
        <el-input
          v-model="formData.notes"
          type="textarea"
          :rows="2"
          placeholder="请输入备注（可选）"
        ></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="submitting">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'AssignTaskDialog',
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
    loadingDepartments: {
      type: Boolean,
      default: false
    },
    loadingUsers: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      submitting: false,
      formData: {
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
    task(newTask) {
      if (newTask) {
        this.initFormData(newTask)
      }
    },
    visible(val) {
      if (val && this.task) {
        this.initFormData(this.task)
      }
    }
  },
  methods: {
    initFormData(task) {
      this.formData = {
        assigned_department: task.assigned_department || null,
        assigned_operator: task.assigned_operator || null,
        reason: '',
        notes: ''
      }
    },
    handleDepartmentChange(departmentId) {
      this.$emit('department-change', departmentId)
      // 如果部门改变，清空已选的操作员（因为操作员可能不属于新部门）
      if (departmentId && this.formData.assigned_operator) {
        const currentOperator = this.userList.find(u => u.id === this.formData.assigned_operator)
        if (!currentOperator) {
          this.formData.assigned_operator = null
        }
      }
    },
    handleConfirm() {
      this.$emit('confirm', this.formData)
    },
    handleClose() {
      this.dialogVisible = false
      this.resetForm()
    },
    resetForm() {
      this.formData = {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: ''
      }
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    }
  }
}
</script>
