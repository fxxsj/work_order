<template>
  <div>
    <!-- 物料信息 -->
    <el-card>
      <div slot="header" class="card-header">
        <span>物料信息</span>
        <el-button
          v-if="editable"
          type="primary"
          size="small"
          icon="el-icon-plus"
          @click="handleAddMaterial"
        >
          添加物料
        </el-button>
      </div>
      <el-table :data="materials" border style="width: 100%">
        <el-table-column prop="material_name" label="物料名称" width="200"></el-table-column>
        <el-table-column prop="material_size" label="尺寸" width="150"></el-table-column>
        <el-table-column prop="material_usage" label="用量" width="150"></el-table-column>
        <el-table-column prop="notes" label="备注" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column label="采购状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="getPurchaseStatusType(scope.row.purchase_status)" size="small">
              {{ getPurchaseStatusDisplay(scope.row.purchase_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="purchase_date" label="采购日期" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.purchase_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="received_date" label="回料日期" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.received_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="cut_date" label="开料日期" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.cut_date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-edit"
              @click="handleUpdateStatus(scope.row)"
              :disabled="!editable"
            >
              更新状态
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加物料对话框 -->
    <el-dialog
      title="添加物料"
      :visible.sync="addDialogVisible"
      width="600px"
    >
      <el-form :model="addForm" label-width="120px" :rules="addRules" ref="addFormRef">
        <el-form-item label="物料" prop="material_id">
          <el-select
            v-model="addForm.material_id"
            filterable
            placeholder="请选择物料"
            style="width: 100%"
          >
            <el-option
              v-for="material in availableMaterials"
              :key="material.id"
              :label="`${material.name} - ${material.specification || ''}`"
              :value="material.id"
            >
              <span>{{ material.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 12px">
                {{ material.specification }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量" prop="planned_quantity">
          <el-input-number
            v-model="addForm.planned_quantity"
            :min="0"
            :step="1"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAdd" :loading="adding">
          确定
        </el-button>
      </div>
    </el-dialog>

    <!-- 物料状态更新对话框 -->
    <el-dialog
      title="更新物料状态"
      :visible.sync="statusDialogVisible"
      width="600px"
    >
      <el-form :model="statusForm" label-width="120px" :rules="statusRules" ref="statusFormRef">
        <el-form-item label="物料名称">
          <el-input v-model="statusForm.material_name" disabled></el-input>
        </el-form-item>
        <el-form-item label="当前状态">
          <el-input v-model="statusForm.current_status" disabled></el-input>
        </el-form-item>
        <el-form-item label="采购状态" prop="purchase_status">
          <el-select v-model="statusForm.purchase_status" placeholder="请选择状态" style="width: 100%">
            <el-option label="未采购" value="not_purchased"></el-option>
            <el-option label="采购中" value="purchasing"></el-option>
            <el-option label="已采购" value="purchased"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          label="采购日期"
          prop="purchase_date"
          v-if="statusForm.purchase_status !== 'not_purchased'"
        >
          <el-date-picker
            v-model="statusForm.purchase_date"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item
          label="回料日期"
          prop="received_date"
          v-if="statusForm.purchase_status === 'purchased'"
        >
          <el-date-picker
            v-model="statusForm.received_date"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
        <el-form-item
          label="开料日期"
          prop="cut_date"
          v-if="statusForm.purchase_status === 'purchased'"
        >
          <el-date-picker
            v-model="statusForm.cut_date"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
            style="width: 100%"
          ></el-date-picker>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmUpdateStatus" :loading="updating">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'MaterialManagement',
  props: {
    materials: {
      type: Array,
      default: () => []
    },
    editable: {
      type: Boolean,
      default: false
    },
    availableMaterials: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      addDialogVisible: false,
      statusDialogVisible: false,
      adding: false,
      updating: false,
      currentMaterial: null,
      addForm: {
        material_id: null,
        planned_quantity: 0
      },
      statusForm: {
        id: null,
        material_name: '',
        current_status: '',
        purchase_status: '',
        purchase_date: '',
        received_date: '',
        cut_date: ''
      },
      addRules: {
        material_id: [
          { required: true, message: '请选择物料', trigger: 'change' }
        ],
        planned_quantity: [
          { required: true, message: '请输入计划数量', trigger: 'blur' }
        ]
      },
      statusRules: {
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
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN')
    },
    getPurchaseStatusType(status) {
      const typeMap = {
        not_purchased: 'info',
        purchasing: 'warning',
        purchased: 'success'
      }
      return typeMap[status] || ''
    },
    getPurchaseStatusDisplay(status) {
      const displayMap = {
        not_purchased: '未采购',
        purchasing: '采购中',
        purchased: '已采购'
      }
      return displayMap[status] || status
    },
    handleAddMaterial() {
      this.addForm = {
        material_id: null,
        planned_quantity: 0
      }
      this.addDialogVisible = true
    },
    handleConfirmAdd() {
      this.$refs.addFormRef.validate((valid) => {
        if (valid) {
          this.$emit('add-material', { ...this.addForm })
          this.addDialogVisible = false
        }
      })
    },
    handleUpdateStatus(material) {
      this.currentMaterial = material
      this.statusForm = {
        id: material.id,
        material_name: material.material_name,
        current_status: this.getPurchaseStatusDisplay(material.purchase_status),
        purchase_status: material.purchase_status,
        purchase_date: material.purchase_date || '',
        received_date: material.received_date || '',
        cut_date: material.cut_date || ''
      }
      this.statusDialogVisible = true
    },
    handleConfirmUpdateStatus() {
      this.$refs.statusFormRef.validate((valid) => {
        if (valid) {
          this.$emit('update-status', {
            materialId: this.statusForm.id,
            data: {
              purchase_status: this.statusForm.purchase_status,
              purchase_date: this.statusForm.purchase_date,
              received_date: this.statusForm.received_date,
              cut_date: this.statusForm.cut_date
            }
          })
          this.statusDialogVisible = false
        }
      })
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
