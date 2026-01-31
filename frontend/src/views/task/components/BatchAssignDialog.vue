<template>
  <el-dialog
    :visible.sync="dialogVisible"
    :title="`批量分派 ${taskCount} 个任务`"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="form" :model="form" :rules="rules" label-width="100px">
      <!-- 分派部门 -->
      <el-form-item label="分派部门" prop="assigned_department">
        <el-select
          v-model="form.assigned_department"
          placeholder="请选择部门"
          filterable
          clearable
          :loading="loadingDepartments"
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

      <!-- 分派操作员 -->
      <el-form-item label="分派操作员" prop="assigned_operator">
        <el-select
          v-model="form.assigned_operator"
          placeholder="请选择操作员"
          filterable
          clearable
          :loading="loadingOperators"
          :disabled="!form.assigned_department"
        >
          <el-option
            v-for="operator in operatorList"
            :key="operator.id"
            :label="operator.username || `${operator.first_name}${operator.last_name}`"
            :value="operator.id"
          />
        </el-select>
        <div class="form-tip">留空则只分派部门，不分派具体操作员</div>
      </el-form-item>

      <!-- 调整原因 -->
      <el-form-item label="调整原因" prop="reason">
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入调整原因（可选）"
        />
      </el-form-item>

      <!-- 备注 -->
      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          placeholder="请输入备注（可选）"
        />
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定分派
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { departmentAPI } from '@/api/modules'
import { getUserList } from '@/api/user'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'BatchAssignDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    },
    taskCount: {
      type: Number,
      default: 0
    },
    departmentList: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      form: {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: ''
      },
      rules: {
        assigned_department: [
          { required: true, message: '请选择分派部门', trigger: 'change' }
        ]
      },
      operatorList: [],
      loadingOperators: false,
      loadingDepartments: false,
      submitting: false
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
      this.form = {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: ''
      }
      this.operatorList = []
      if (this.$refs.form) {
        this.$refs.form.clearValidate()
      }
    },

    async handleDepartmentChange(departmentId) {
      this.form.assigned_operator = null
      if (!departmentId) {
        this.operatorList = []
        return
      }
      this.loadingOperators = true
      try {
        const response = await getUserList({ department: departmentId })
        this.operatorList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载操作员列表')
      } finally {
        this.loadingOperators = false
      }
    },

    handleClose() {
      this.resetForm()
      this.dialogVisible = false
    },

    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return

        this.$emit('confirm', { ...this.form })
      })
    }
  }
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  text-align: right;
}
</style>
