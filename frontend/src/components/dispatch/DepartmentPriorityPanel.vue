<template>
  <div class="department-priority-panel">
    <el-card class="panel-card" shadow="hover">
      <div slot="header" class="card-header">
        <div class="header-content">
          <span class="card-title">{{ displayTitle }}</span>
          <el-button
            v-if="process && allDepartments.length > 0"
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="handleAddDepartment"
          >
            添加部门
          </el-button>
        </div>
      </div>

      <el-empty
        v-if="!loading && !process"
        description="请从左侧选择一个工序"
        :image-size="120"
      />

      <el-empty
        v-else-if="!loading && departmentList.length === 0"
        description="该工序暂未配置部门规则"
        :image-size="120"
      >
        <el-button
          v-if="process"
          type="primary"
          icon="el-icon-plus"
          @click="handleAddDepartment"
        >
          配置第一个部门
        </el-button>
      </el-empty>

      <div v-else class="department-list">
        <div
          v-for="(dept, index) in departmentList"
          :key="dept.id"
          class="department-card"
          draggable="true"
          @dragstart="handleDragStart(index, $event)"
          @dragover.prevent="handleDragOver(index)"
          @drop="handleDrop(index)"
          @dragend="handleDragEnd"
        >
          <!-- 优先级徽章 -->
          <div class="priority-badge">
            {{ index + 1 }}
          </div>

          <!-- 拖拽手柄 -->
          <i class="el-icon-rank drag-handle"></i>

          <!-- 部门信息 -->
          <div class="dept-info">
            <div class="dept-name">{{ dept.department_name }}</div>
            <div class="dept-stats">
              <span>当前负载: {{ dept.current_load || 0 }} 个任务</span>
              <el-divider direction="vertical" />
              <span>优先级: {{ dept.priority }}</span>
            </div>
            <div class="dept-strategy">
              <el-tag size="mini" type="info">
                {{ getStrategyDisplay(dept.operator_selection_strategy) }}
              </el-tag>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="dept-actions">
            <el-switch
              :disabled="!canEdit"
              :value="dept.is_active"
              @change="handleToggleActive(dept)"
            />
            <el-button
              v-if="canEdit"
              type="text"
              size="small"
              icon="el-icon-edit"
              @click="handleEdit(dept)"
            />
            <el-button
              v-if="canDelete"
              type="text"
              size="small"
              icon="el-icon-delete"
              style="color: #F56C6C;"
              @click="handleDelete(dept)"
            />
          </div>
        </div>

        <el-skeleton
          v-if="loading"
          :rows="4"
          animated
          style="margin-top: 16px;"
        />
      </div>
    </el-card>

    <!-- 添加部门对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      @close="resetDialogForm"
    >
      <el-form
        ref="dialogForm"
        :model="dialogForm"
        :rules="dialogRules"
        label-width="140px"
      >
        <el-form-item label="部门" prop="department">
          <el-select
            v-model="dialogForm.department"
            placeholder="请选择部门"
            filterable
            style="width: 100%;"
            :disabled="isEditMode"
          >
            <el-option
              v-for="dept in availableDepartments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number
            v-model="dialogForm.priority"
            :min="0"
            :max="100"
            style="width: 100%;"
          />
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            优先级越高越优先匹配（0-100），也可以通过拖拽调整
          </div>
        </el-form-item>
        <el-form-item label="操作员选择策略" prop="operator_selection_strategy">
          <el-select
            v-model="dialogForm.operator_selection_strategy"
            placeholder="请选择策略"
            style="width: 100%;"
          >
            <el-option
              label="任务数量最少（工作量均衡）"
              value="least_tasks"
            />
            <el-option
              label="随机选择"
              value="random"
            />
            <el-option
              label="轮询分配"
              value="round_robin"
            />
            <el-option
              label="第一个可用"
              value="first_available"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否启用" prop="is_active">
          <el-switch
            v-model="dialogForm.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="dialogForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleDialogSubmit">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'DepartmentPriorityPanel',
  props: {
    // 当前选中的工序
    process: {
      type: Object,
      default: null
    },
    // 部门规则列表
    departments: {
      type: Array,
      default: () => []
    },
    // 所有可用部门
    allDepartments: {
      type: Array,
      default: () => []
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 权限
    canEdit: {
      type: Boolean,
      default: true
    },
    canDelete: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // 本地部门列表（用于拖拽）
      departmentList: [],
      // 拖拽相关
      draggedIndex: null,
      dragOverIndex: null,
      // 对话框
      dialogVisible: false,
      dialogTitle: '添加部门',
      isEditMode: false,
      currentEditId: null,
      submitting: false,
      dialogForm: {
        department: null,
        priority: 50,
        operator_selection_strategy: 'least_tasks',
        is_active: true,
        notes: ''
      },
      dialogRules: {
        department: [
          { required: true, message: '请选择部门', trigger: 'change' }
        ],
        priority: [
          { required: true, message: '请输入优先级', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    /**
     * 显示标题
     */
    displayTitle() {
      if (!this.process) return '部门优先级配置'
      return `${this.process.name} - 部门优先级`
    },

    /**
     * 可用部门列表（排除已配置的部门）
     */
    availableDepartments() {
      if (!this.allDepartments.length) return []

      const configuredDeptIds = this.departmentList.map(d => d.department)
      return this.allDepartments.filter(dept => !configuredDeptIds.includes(dept.id))
    }
  },
  watch: {
    departments: {
      immediate: true,
      deep: true,
      handler(val) {
        this.departmentList = [...val]
      }
    }
  },
  methods: {
    /**
     * 获取策略显示文本
     */
    getStrategyDisplay(strategy) {
      const strategyMap = {
        least_tasks: '工作量均衡',
        random: '随机',
        round_robin: '轮询',
        first_available: '首个可用'
      }
      return strategyMap[strategy] || strategy
    },

    /**
     * 拖拽开始
     */
    handleDragStart(index, event) {
      this.draggedIndex = index
      event.dataTransfer.effectAllowed = 'move'
      // 设置拖拽图像
      event.dataTransfer.setData('text/html', event.target)
    },

    /**
     * 拖拽经过
     */
    handleDragOver(index) {
      this.dragOverIndex = index
    },

    /**
     * 放下
     */
    handleDrop(dropIndex) {
      if (this.draggedIndex === null || this.draggedIndex === dropIndex) {
        return
      }

      // 重新排列数组
      const draggedItem = this.departmentList[this.draggedIndex]
      const newOrder = [...this.departmentList]
      newOrder.splice(this.draggedIndex, 1)
      newOrder.splice(dropIndex, 0, draggedItem)

      // 重新计算优先级
      const updates = newOrder.map((item, index) => ({
        id: item.id,
        priority: 100 - index // 越靠前优先级越高
      }))

      this.departmentList = newOrder
      this.$emit('update-priority', updates)

      this.draggedIndex = null
      this.dragOverIndex = null
    },

    /**
     * 拖拽结束
     */
    handleDragEnd() {
      this.draggedIndex = null
      this.dragOverIndex = null
    },

    /**
     * 切换启用状态
     */
    handleToggleActive(dept) {
      this.$emit('toggle-active', {
        id: dept.id,
        is_active: !dept.is_active
      })
    },

    /**
     * 添加部门
     */
    handleAddDepartment() {
      this.isEditMode = false
      this.currentEditId = null
      this.dialogTitle = '添加部门到工序'
      this.resetDialogForm()
      this.dialogVisible = true
    },

    /**
     * 编辑部门
     */
    handleEdit(dept) {
      this.isEditMode = true
      this.currentEditId = dept.id
      this.dialogTitle = '编辑部门规则'
      this.dialogForm = {
        department: dept.department,
        priority: dept.priority,
        operator_selection_strategy: dept.operator_selection_strategy,
        is_active: dept.is_active,
        notes: dept.notes || ''
      }
      this.dialogVisible = true
    },

    /**
     * 删除部门
     */
    async handleDelete(dept) {
      this.$emit('remove-department', dept)
    },

    /**
     * 提交对话框表单
     */
    async handleDialogSubmit() {
      this.$refs.dialogForm.validate(async (valid) => {
        if (!valid) {
          return false
        }

        this.submitting = true
        try {
          const formData = { ...this.dialogForm }

          if (this.isEditMode && this.currentEditId) {
            // 编辑模式
            this.$emit('edit-department', {
              id: this.currentEditId,
              ...formData
            })
          } else {
            // 添加模式
            this.$emit('add-department', {
              process: this.process.id,
              ...formData
            })
          }

          this.dialogVisible = false
        } finally {
          this.submitting = false
        }
      })
    },

    /**
     * 重置对话框表单
     */
    resetDialogForm() {
      this.dialogForm = {
        department: null,
        priority: 50,
        operator_selection_strategy: 'least_tasks',
        is_active: true,
        notes: ''
      }
      this.$nextTick(() => {
        if (this.$refs.dialogForm) {
          this.$refs.dialogForm.clearValidate()
        }
      })
    }
  }
}
</script>

<style scoped>
.department-priority-panel {
  height: 100%;
}

.panel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.department-list {
  max-height: 500px;
  overflow-y: auto;
  padding-right: 4px;
}

/* 自定义滚动条 */
.department-list::-webkit-scrollbar {
  width: 6px;
}

.department-list::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.department-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.department-list::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.department-card {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s ease;
}

.department-card:hover {
  background: #f5f7fa;
  border-color: #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.priority-badge {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  margin-right: 12px;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

.drag-handle {
  flex-shrink: 0;
  font-size: 18px;
  color: #909399;
  margin-right: 12px;
  cursor: move;
}

.department-card:hover .drag-handle {
  color: #409eff;
}

.dept-info {
  flex: 1;
  min-width: 0;
}

.dept-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}

.dept-stats {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.dept-strategy {
  margin-top: 4px;
}

.dept-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}
</style>
