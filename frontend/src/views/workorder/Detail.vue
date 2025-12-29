<template>
  <div class="workorder-detail" v-loading="loading">
    <el-card v-if="workOrder">
      <!-- 顶部操作栏 -->
      <div class="header-actions">
        <el-button icon="el-icon-back" @click="$router.back()">返回</el-button>
        <div>
          <el-button type="primary" icon="el-icon-edit" @click="handleEdit">编辑</el-button>
          <el-dropdown @command="handleStatusChange" style="margin-left: 10px;">
            <el-button type="success">
              更改状态<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="pending">待开始</el-dropdown-item>
              <el-dropdown-item command="in_progress">进行中</el-dropdown-item>
              <el-dropdown-item command="paused">已暂停</el-dropdown-item>
              <el-dropdown-item command="completed">已完成</el-dropdown-item>
              <el-dropdown-item command="cancelled">已取消</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </div>

      <!-- 基本信息 -->
      <el-descriptions title="基本信息" :column="3" border style="margin-top: 20px;">
        <el-descriptions-item label="施工单号">{{ workOrder.order_number }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ workOrder.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="制表人">{{ workOrder.manager_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ workOrder.product_name }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ workOrder.quantity }} {{ workOrder.unit }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ workOrder.total_amount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="'status-badge status-' + workOrder.status">
            {{ workOrder.status_display }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <span :class="'status-badge priority-' + workOrder.priority">
            {{ workOrder.priority_display }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="进度">
          <el-progress
            :percentage="workOrder.progress_percentage"
            :color="workOrder.progress_percentage === 100 ? '#67C23A' : '#409EFF'"
          ></el-progress>
        </el-descriptions-item>
        <el-descriptions-item label="下单日期">{{ workOrder.order_date | formatDate }}</el-descriptions-item>
        <el-descriptions-item label="交货日期">{{ workOrder.delivery_date | formatDate }}</el-descriptions-item>
        <el-descriptions-item label="实际交货日期">
          {{ workOrder.actual_delivery_date ? (workOrder.actual_delivery_date | formatDate) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="产品规格" :span="3">{{ workOrder.specification || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 主材信息 -->
      <el-descriptions title="主材信息" :column="3" border style="margin-top: 20px;">
        <el-descriptions-item label="纸张类型">{{ workOrder.paper_type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="纸张克数">{{ workOrder.paper_weight || '-' }}</el-descriptions-item>
        <el-descriptions-item label="纸张品牌">{{ workOrder.paper_brand || '-' }}</el-descriptions-item>
        <el-descriptions-item label="板材厚度">{{ workOrder.board_thickness || '-' }}</el-descriptions-item>
        <el-descriptions-item label="尺寸">{{ workOrder.material_size || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用量">{{ workOrder.material_usage || '-' }}</el-descriptions-item>
        <el-descriptions-item label="主材备注" :span="3">{{ workOrder.material_notes || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 其他信息 -->
      <el-descriptions title="其他信息" :column="1" border style="margin-top: 20px;">
        <el-descriptions-item label="备注">{{ workOrder.notes || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 工序信息 -->
    <el-card style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>工序跟踪</span>
        <el-button size="small" type="primary" icon="el-icon-plus" @click="showAddProcessDialog">
          添加工序
        </el-button>
      </div>
      
      <el-timeline v-if="workOrder && workOrder.order_processes && workOrder.order_processes.length > 0">
        <el-timeline-item
          v-for="process in workOrder.order_processes"
          :key="process.id"
          :color="getProcessColor(process.status)"
        >
          <el-card>
            <div class="process-header">
              <div>
                <h3>{{ process.sequence }}. {{ process.process_name }}</h3>
                <span :class="'status-badge status-' + process.status">
                  {{ process.status_display }}
                </span>
              </div>
              <div v-if="process.status !== 'completed'">
                <el-button
                  v-if="process.status === 'pending'"
                  type="primary"
                  size="small"
                  @click="handleStartProcess(process)"
                >
                  开始
                </el-button>
                <el-button
                  v-if="process.status === 'in_progress'"
                  type="success"
                  size="small"
                  @click="handleCompleteProcess(process)"
                >
                  完成
                </el-button>
              </div>
            </div>
            
            <el-descriptions :column="3" size="small" style="margin-top: 10px;">
              <el-descriptions-item label="操作员">
                {{ process.operator_name || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="完成数量">
                {{ process.quantity_completed }}
              </el-descriptions-item>
              <el-descriptions-item label="不良品数量">
                {{ process.quantity_defective }}
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">
                {{ process.actual_start_time ? (process.actual_start_time | formatDateTime) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="结束时间">
                {{ process.actual_end_time ? (process.actual_end_time | formatDateTime) : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="耗时">
                {{ process.duration_hours ? process.duration_hours + ' 小时' : '-' }}
              </el-descriptions-item>
            </el-descriptions>
            
            <div v-if="process.notes" style="margin-top: 10px;">
              <strong>备注：</strong>{{ process.notes }}
            </div>
            
            <!-- 工序日志 -->
            <div v-if="process.logs && process.logs.length > 0" style="margin-top: 10px;">
              <el-divider></el-divider>
              <strong>操作记录：</strong>
              <ul class="process-logs">
                <li v-for="log in process.logs" :key="log.id">
                  <span class="log-time">{{ log.created_at | formatDateTime }}</span>
                  <span class="log-type">{{ log.log_type_display }}</span>
                  <span class="log-content">{{ log.content }}</span>
                  <span class="log-operator">{{ log.operator_name }}</span>
                </li>
              </ul>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <el-empty v-else description="暂无工序信息"></el-empty>
    </el-card>

    <!-- 物料信息 -->
    <el-card style="margin-top: 20px;">
      <div slot="header" class="card-header">
        <span>物料清单</span>
        <el-button size="small" type="primary" icon="el-icon-plus" @click="showAddMaterialDialog">
          添加物料
        </el-button>
      </div>
      
      <el-table
        v-if="workOrder && workOrder.materials && workOrder.materials.length > 0"
        :data="workOrder.materials"
        style="width: 100%"
      >
        <el-table-column prop="material_code" label="物料编码" width="150"></el-table-column>
        <el-table-column prop="material_name" label="物料名称"></el-table-column>
        <el-table-column prop="planned_quantity" label="计划用量" align="right">
          <template slot-scope="scope">
            {{ scope.row.planned_quantity }} {{ scope.row.material_unit }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_quantity" label="实际用量" align="right">
          <template slot-scope="scope">
            {{ scope.row.actual_quantity }} {{ scope.row.material_unit }}
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注"></el-table-column>
      </el-table>
      
      <el-empty v-else description="暂无物料信息"></el-empty>
    </el-card>

    <!-- 添加工序对话框 -->
    <el-dialog title="添加工序" :visible.sync="addProcessDialog" width="500px">
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="工序">
          <el-select v-model="processForm.process_id" placeholder="请选择工序" style="width: 100%;">
            <el-option
              v-for="process in processList"
              :key="process.id"
              :label="process.name"
              :value="process.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="顺序">
          <el-input-number
            v-model="processForm.sequence"
            :min="1"
            :max="100"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addProcessDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddProcess">确定</el-button>
      </div>
    </el-dialog>

    <!-- 完成工序对话框 -->
    <el-dialog title="完成工序" :visible.sync="completeProcessDialog" width="500px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="完成数量">
          <el-input-number
            v-model="completeForm.quantity_completed"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="不良品数量">
          <el-input-number
            v-model="completeForm.quantity_defective"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="completeProcessDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCompleteProcess">确定</el-button>
      </div>
    </el-dialog>

    <!-- 添加物料对话框 -->
    <el-dialog title="添加物料" :visible.sync="addMaterialDialog" width="500px">
      <el-form :model="materialForm" label-width="80px">
        <el-form-item label="物料">
          <el-select v-model="materialForm.material_id" placeholder="请选择物料" style="width: 100%;">
            <el-option
              v-for="material in materialList"
              :key="material.id"
              :label="material.name"
              :value="material.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="计划用量">
          <el-input-number
            v-model="materialForm.planned_quantity"
            :min="0"
            :precision="2"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addMaterialDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddMaterial">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { workOrderAPI, processAPI, materialAPI, workOrderProcessAPI } from '@/api/workorder'

export default {
  name: 'WorkOrderDetail',
  data() {
    return {
      loading: false,
      workOrder: null,
      processList: [],
      materialList: [],
      addProcessDialog: false,
      addMaterialDialog: false,
      completeProcessDialog: false,
      processForm: {
        process_id: null,
        sequence: 1
      },
      materialForm: {
        material_id: null,
        planned_quantity: 0
      },
      completeForm: {
        quantity_completed: 0,
        quantity_defective: 0
      },
      currentProcess: null
    }
  },
  created() {
    this.loadData()
    this.loadProcessList()
    this.loadMaterialList()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        const id = this.$route.params.id
        this.workOrder = await workOrderAPI.getDetail(id)
      } catch (error) {
        this.$message.error('加载数据失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    async loadProcessList() {
      try {
        const response = await processAPI.getList({ is_active: true, page_size: 100 })
        this.processList = response.results || []
      } catch (error) {
        console.error('加载工序列表失败:', error)
      }
    },
    async loadMaterialList() {
      try {
        const response = await materialAPI.getList({ page_size: 100 })
        this.materialList = response.results || []
      } catch (error) {
        console.error('加载物料列表失败:', error)
      }
    },
    handleEdit() {
      this.$router.push(`/workorders/${this.workOrder.id}/edit`)
    },
    async handleStatusChange(status) {
      try {
        await workOrderAPI.updateStatus(this.workOrder.id, status)
        this.$message.success('状态更新成功')
        this.loadData()
      } catch (error) {
        this.$message.error('状态更新失败')
        console.error(error)
      }
    },
    showAddProcessDialog() {
      this.processForm = {
        process_id: null,
        sequence: this.workOrder.order_processes.length + 1
      }
      this.addProcessDialog = true
    },
    async handleAddProcess() {
      if (!this.processForm.process_id) {
        this.$message.warning('请选择工序')
        return
      }
      
      try {
        await workOrderAPI.addProcess(this.workOrder.id, this.processForm)
        this.$message.success('添加成功')
        this.addProcessDialog = false
        this.loadData()
      } catch (error) {
        this.$message.error('添加失败')
        console.error(error)
      }
    },
    async handleStartProcess(process) {
      try {
        await workOrderProcessAPI.start(process.id)
        this.$message.success('工序已开始')
        this.loadData()
      } catch (error) {
        this.$message.error('操作失败')
        console.error(error)
      }
    },
    handleCompleteProcess(process) {
      this.currentProcess = process
      this.completeForm = {
        quantity_completed: this.workOrder.quantity,
        quantity_defective: 0
      }
      this.completeProcessDialog = true
    },
    async confirmCompleteProcess() {
      try {
        await workOrderProcessAPI.complete(this.currentProcess.id, this.completeForm)
        this.$message.success('工序已完成')
        this.completeProcessDialog = false
        this.loadData()
      } catch (error) {
        this.$message.error('操作失败')
        console.error(error)
      }
    },
    showAddMaterialDialog() {
      this.materialForm = {
        material_id: null,
        planned_quantity: 0
      }
      this.addMaterialDialog = true
    },
    async handleAddMaterial() {
      if (!this.materialForm.material_id) {
        this.$message.warning('请选择物料')
        return
      }
      
      try {
        await workOrderAPI.addMaterial(this.workOrder.id, this.materialForm)
        this.$message.success('添加成功')
        this.addMaterialDialog = false
        this.loadData()
      } catch (error) {
        this.$message.error('添加失败')
        console.error(error)
      }
    },
    getProcessColor(status) {
      const colorMap = {
        pending: '#909399',
        in_progress: '#409EFF',
        completed: '#67C23A',
        skipped: '#E6A23C'
      }
      return colorMap[status] || '#909399'
    }
  }
}
</script>

<style scoped>
.workorder-detail {
  padding: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.process-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.process-header h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.process-logs {
  list-style: none;
  padding: 0;
  margin: 10px 0 0 0;
}

.process-logs li {
  padding: 5px 0;
  font-size: 13px;
  color: #606266;
}

.log-time {
  color: #909399;
  margin-right: 10px;
}

.log-type {
  margin-right: 10px;
  font-weight: bold;
}

.log-operator {
  color: #909399;
  margin-left: 10px;
}
</style>

