<template>
  <div class="task-list">
    <el-card>
      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="5">
            <el-input
              v-model="filters.search"
              placeholder="搜索任务内容、施工单号"
              clearable
              @clear="handleSearch"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
            </el-input>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.status" placeholder="任务状态" clearable @change="handleSearch">
              <el-option label="待开始" value="pending"></el-option>
              <el-option label="进行中" value="in_progress"></el-option>
              <el-option label="已完成" value="completed"></el-option>
              <el-option label="已取消" value="cancelled"></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.task_type" placeholder="任务类型" clearable @change="handleSearch">
              <el-option label="制版任务" value="plate_making"></el-option>
              <el-option label="开料任务" value="cutting"></el-option>
              <el-option label="印刷任务" value="printing"></el-option>
              <el-option label="烫金任务" value="foiling"></el-option>
              <el-option label="压凸任务" value="embossing"></el-option>
              <el-option label="模切任务" value="die_cutting"></el-option>
              <el-option label="包装任务" value="packaging"></el-option>
              <el-option label="通用任务" value="general"></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.work_order_process" placeholder="工序" clearable filterable @change="handleSearch">
              <el-option
                v-for="process in processList"
                :key="process.id"
                :label="process.name"
                :value="process.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button type="primary" icon="el-icon-refresh" @click="loadData">刷新</el-button>
            <el-button icon="el-icon-refresh-left" @click="handleReset">重置筛选</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 任务列表 -->
      <el-table
        v-loading="loading"
        :data="taskList"
        border
        style="width: 100%; margin-top: 20px;"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" label="ID" width="80" sortable="custom"></el-table-column>
        <el-table-column label="施工单号" width="150">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.work_order_process_info?.work_order?.id"
              type="primary"
              @click="goToWorkOrderDetail(scope.row.work_order_process_info.work_order)"
            >
              {{ scope.row.work_order_process_info.work_order.order_number || '-' }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="工序" width="120">
          <template slot-scope="scope">
            {{ scope.row.work_order_process_info?.process?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="work_content" label="任务内容" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column prop="task_type_display" label="任务类型" width="100"></el-table-column>
        <el-table-column label="关联对象" width="150">
          <template slot-scope="scope">
            <div v-if="scope.row.artwork_code">
              <span>{{ scope.row.artwork_code }}</span>
              <el-tag
                v-if="scope.row.artwork_confirmed !== null"
                :type="scope.row.artwork_confirmed ? 'success' : 'info'"
                size="mini"
                style="margin-left: 5px;"
              >
                {{ scope.row.artwork_confirmed ? '已确认' : '未确认' }}
              </el-tag>
            </div>
            <span v-else-if="scope.row.die_code">{{ scope.row.die_code }}</span>
            <div v-else-if="scope.row.product_code">
              <span>{{ scope.row.product_code }}</span>
              <span v-if="scope.row.product_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
                ({{ scope.row.product_name }})
              </span>
            </div>
            <div v-else-if="scope.row.material_code">
              <span>{{ scope.row.material_code }}</span>
              <el-tag
                v-if="scope.row.material_purchase_status"
                :type="getMaterialStatusTagType(scope.row.material_purchase_status)"
                size="mini"
                style="margin-left: 5px;"
              >
                {{ getMaterialStatusText(scope.row.material_purchase_status) }}
              </el-tag>
            </div>
            <div v-else-if="scope.row.foiling_plate_code">
              <span>{{ scope.row.foiling_plate_code }}</span>
              <span v-if="scope.row.foiling_plate_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
                ({{ scope.row.foiling_plate_name }})
              </span>
            </div>
            <div v-else-if="scope.row.embossing_plate_code">
              <span>{{ scope.row.embossing_plate_code }}</span>
              <span v-if="scope.row.embossing_plate_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
                ({{ scope.row.embossing_plate_name }})
              </span>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="production_quantity" label="生产数量" width="100" align="right"></el-table-column>
        <el-table-column prop="quantity_completed" label="完成数量" width="100" align="right"></el-table-column>
        <el-table-column prop="status_display" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              size="small"
            >
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.status !== 'completed' && canCompleteTask(scope.row)"
              type="success"
              size="mini"
              @click="handleCompleteTask(scope.row)"
            >
              完成
            </el-button>
            <el-button
              v-if="scope.row.status === 'in_progress' && !scope.row.auto_calculate_quantity"
              type="primary"
              size="mini"
              @click="showUpdateDialog(scope.row)"
            >
              更新数量
            </el-button>
            <el-button
              v-if="scope.row.work_order_process_info?.work_order?.id"
              type="text"
              size="small"
              @click="goToWorkOrderDetail(scope.row.work_order_process_info.work_order)"
            >
              查看施工单
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section" style="margin-top: 20px; text-align: right;">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.page_size"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 更新数量对话框 -->
    <el-dialog
      title="更新完成数量"
      :visible.sync="updateDialogVisible"
      width="400px"
    >
      <el-form :model="updateForm" label-width="100px">
        <el-form-item label="任务内容">
          <el-input :value="currentTask?.work_content" disabled></el-input>
        </el-form-item>
        <el-form-item label="生产数量">
          <el-input-number
            :value="currentTask?.production_quantity"
            disabled
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="完成数量" required>
          <el-input-number
            v-model="updateForm.quantity_completed"
            :min="0"
            :max="currentTask?.production_quantity"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateTask">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { workOrderTaskAPI } from '@/api/workorder'
import { processAPI } from '@/api/workorder'

export default {
  name: 'TaskList',
  data() {
    return {
      loading: false,
      taskList: [],
      processList: [],
      filters: {
        search: '',
        status: '',
        task_type: '',
        work_order_process: ''
      },
      pagination: {
        page: 1,
        page_size: 20,
        total: 0
      },
      ordering: '-created_at',
      updateDialogVisible: false,
      currentTask: null,
      updateForm: {
        quantity_completed: 0
      }
    }
  },
  created() {
    this.loadProcessList()
    this.loadData()
  },
  methods: {
    async loadProcessList() {
      try {
        const response = await processAPI.getList({ is_active: true, page_size: 1000 })
        // API 响应已经被 Axios 拦截器处理，直接使用 response
        this.processList = response.results || []
      } catch (error) {
        console.error('加载工序列表失败:', error)
      }
    },
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.page_size,
          ordering: this.ordering
        }
        
        // 添加筛选条件
        if (this.filters.status) {
          params.status = this.filters.status
        }
        if (this.filters.task_type) {
          params.task_type = this.filters.task_type
        }
        if (this.filters.work_order_process) {
          params.process = this.filters.work_order_process
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }
        
        const response = await workOrderTaskAPI.getList(params)
        // 响应拦截器已经返回了 response.data，所以这里直接使用 response
        if (Array.isArray(response)) {
          // 如果直接返回数组
          this.taskList = response
          this.pagination.total = response.length
        } else if (response.results) {
          // 如果返回分页格式（PageNumberPagination）
          this.taskList = response.results || []
          this.pagination.total = response.count || 0
        } else {
          this.taskList = []
          this.pagination.total = 0
        }
      } catch (error) {
        const errorMessage = error.response?.data?.detail || error.response?.data?.error || error.message || '加载任务列表失败'
        this.$message.error(errorMessage)
        console.error('加载任务列表失败:', error)
        this.taskList = []
        this.pagination.total = 0
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.loadData()
    },
    handleReset() {
      this.filters = {
        search: '',
        status: '',
        task_type: '',
        work_order_process: ''
      }
      this.pagination.page = 1
      this.loadData()
    },
    handleSizeChange(val) {
      this.pagination.page_size = val
      this.pagination.page = 1
      this.loadData()
    },
    handleCurrentChange(val) {
      this.pagination.page = val
      this.loadData()
    },
    handleSortChange({ prop, order }) {
      if (order && prop) {
        this.ordering = order === 'ascending' ? prop : `-${prop}`
        // 更新排序参数并重新加载数据
        this.pagination.page = 1
        this.loadData()
      }
    },
    getStatusType(status) {
      const types = {
        'pending': 'info',
        'in_progress': 'warning',
        'completed': 'success',
        'cancelled': 'danger'
      }
      return types[status] || 'info'
    },
    getMaterialStatusTagType(status) {
      const statusMap = {
        'pending': 'info',
        'ordered': 'primary',
        'received': 'success',
        'cut': 'warning',
        'completed': 'success'
      }
      return statusMap[status] || 'info'
    },
    getMaterialStatusText(status) {
      const statusMap = {
        'pending': '待采购',
        'ordered': '已下单',
        'received': '已回料',
        'cut': '已开料',
        'completed': '已完成'
      }
      return statusMap[status] || status
    },
    canCompleteTask(task) {
      // 制版任务：如果关联图稿，需要图稿已确认
      if (task.task_type === 'plate_making' && task.artwork && task.artwork_confirmed === false) {
        return false
      }
      // 开料任务：需要物料已开料
      // 注意：采购不属于施工单工序，采购任务通过其他系统管理
      if (task.task_type === 'cutting' && task.material_purchase_status) {
        const processName = task.work_order_process_info?.process?.name || ''
        if ((processName.includes('开料') || processName.includes('裁切')) && task.material_purchase_status !== 'cut') {
          return false
        }
      }
      return true
    },
    async handleCompleteTask(task) {
      try {
        // 使用 complete API，支持新任务类型
        const data = {
          status: 'completed',
          quantity_completed: task.quantity_completed || task.production_quantity || 0,
          notes: ''
        }
        
        // 制版任务：状态固定为已完成，完成数量固定为1
        if (task.task_type === 'plate_making') {
          data.status = 'completed'
          data.quantity_completed = 1
        }
        
        await workOrderTaskAPI.complete(task.id, data)
        this.$message.success('任务已完成')
        this.loadData()
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                           (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
        this.$message.error(errorMessage)
        console.error('完成任务失败:', error)
      }
    },
    showUpdateDialog(task) {
      this.currentTask = task
      this.updateForm.quantity_completed = task.quantity_completed || 0
      this.updateDialogVisible = true
    },
    async handleUpdateTask() {
      if (!this.currentTask) return
      
      try {
        await workOrderTaskAPI.update(this.currentTask.id, {
          quantity_completed: this.updateForm.quantity_completed
        })
        this.$message.success('更新成功')
        this.updateDialogVisible = false
        this.loadData()
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                           (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '更新失败'
        this.$message.error(errorMessage)
        console.error('更新任务失败:', error)
      }
    },
    goToWorkOrderDetail(workOrder) {
      if (workOrder && workOrder.id) {
        this.$router.push(`/workorders/${workOrder.id}`)
      } else {
        this.$message.warning('施工单信息不存在')
      }
    }
  }
}
</script>

<style scoped>
.task-list {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.pagination-section {
  margin-top: 20px;
}
</style>

