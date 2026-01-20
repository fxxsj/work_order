<template>
  <el-dialog
    title="拆分任务"
    :visible.sync="dialogVisible"
    width="800px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="formData"
      label-width="120px"
    >
      <el-form-item label="父任务">
        <el-input :value="task?.work_content" disabled />
      </el-form-item>

      <el-form-item label="生产数量">
        <el-input-number
          :value="task?.production_quantity"
          disabled
          style="width: 100%;"
        />
      </el-form-item>

      <el-form-item label="子任务列表" prop="splits" required>
        <div style="margin-bottom: 10px;">
          <el-button type="primary" size="small" @click="addSplitItem">
            添加子任务
          </el-button>
          <span style="color: #909399; font-size: 12px; margin-left: 10px;">
            至少需要2个子任务，子任务数量总和不能超过父任务数量
          </span>
        </div>
        <el-table :data="formData.splits" border style="width: 100%;">
          <el-table-column label="序号" width="60" align="center">
            <template slot-scope="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="生产数量" width="150">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.production_quantity"
                :min="1"
                :max="task?.production_quantity || 999999"
                style="width: 100%;"
              />
            </template>
          </el-table-column>
          <el-table-column label="分派部门" width="180">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.assigned_department"
                placeholder="请选择部门"
                filterable
                clearable
                style="width: 100%;"
                :loading="loadingDepartments"
              >
                <el-option
                  v-for="dept in departmentList"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="分派操作员" width="180">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.assigned_operator"
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
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="工作内容" min-width="200">
            <template slot-scope="scope">
              <el-input
                v-model="scope.row.work_content"
                placeholder="可选，默认使用父任务内容"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template slot-scope="scope">
              <el-button
                type="danger"
                size="mini"
                icon="el-icon-delete"
                :disabled="formData.splits.length <= 2"
                @click="removeSplitItem(scope.$index)"
              />
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 10px; color: #909399; font-size: 12px;">
          子任务数量总和：{{ getTotalSplitQuantity() }} / {{ task?.production_quantity || 0 }}
          <span v-if="getTotalSplitQuantity() > (task?.production_quantity || 0)" style="color: #F56C6C;">
            （超出父任务数量）
          </span>
        </div>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">
        确定拆分
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: 'SplitTaskDialog',
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
        splits: []
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
      // 默认创建2个子任务，平均分配数量
      const defaultQuantity = Math.floor(task.production_quantity / 2)
      this.formData = {
        splits: [
          {
            production_quantity: defaultQuantity,
            assigned_department: null,
            assigned_operator: null,
            work_content: ''
          },
          {
            production_quantity: task.production_quantity - defaultQuantity,
            assigned_department: null,
            assigned_operator: null,
            work_content: ''
          }
        ]
      }
    },
    addSplitItem() {
      this.formData.splits.push({
        production_quantity: 0,
        assigned_department: null,
        assigned_operator: null,
        work_content: ''
      })
    },
    removeSplitItem(index) {
      if (this.formData.splits.length > 2) {
        this.formData.splits.splice(index, 1)
      }
    },
    getTotalSplitQuantity() {
      return this.formData.splits.reduce((sum, item) => sum + (item.production_quantity || 0), 0)
    },
    handleConfirm() {
      // 验证
      if (!this.formData.splits || this.formData.splits.length < 2) {
        this.$message.error('至少需要2个子任务')
        return
      }

      const total = this.getTotalSplitQuantity()
      if (total > (this.task?.production_quantity || 0)) {
        this.$message.error('子任务数量总和不能超过父任务数量')
        return
      }

      const data = {
        splits: this.formData.splits.map(split => ({
          production_quantity: split.production_quantity,
          assigned_department: split.assigned_department || null,
          assigned_operator: split.assigned_operator || null,
          work_content: split.work_content || ''
        }))
      }

      this.$emit('confirm', data)
    },
    handleClose() {
      this.dialogVisible = false
      this.resetForm()
    },
    resetForm() {
      this.formData = {
        splits: []
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
