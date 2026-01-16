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
              @input="handleSearchDebounced"
              @clear="handleSearchDebounced"
            >
              <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
            </el-input>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.status" placeholder="任务状态" clearable @change="handleSearchDebounced">
              <el-option label="待开始" value="pending"></el-option>
              <el-option label="进行中" value="in_progress"></el-option>
              <el-option label="已完成" value="completed"></el-option>
              <el-option label="已取消" value="cancelled"></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.task_type" placeholder="任务类型" clearable @change="handleSearchDebounced">
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
            <el-select v-model="filters.assigned_department" placeholder="分派部门" clearable filterable @change="handleSearchDebounced">
              <el-option
                v-for="dept in departmentList"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="3">
            <el-select v-model="filters.work_order_process" placeholder="工序" clearable filterable @change="handleSearchDebounced">
              <el-option
                v-for="process in processList"
                :key="process.id"
                :label="process.name"
                :value="process.id"
              ></el-option>
            </el-select>
          </el-col>
          <el-col :span="10" style="text-align: right;">
            <el-button icon="el-icon-refresh-left" @click="handleReset">重置筛选</el-button>
            <el-button 
              type="success" 
              icon="el-icon-download" 
              @click="handleExport" 
              :loading="exporting"
              style="margin-left: 10px;"
              v-if="canExport()">
              导出Excel
            </el-button>
            <el-button type="primary" icon="el-icon-refresh" @click="loadData" style="margin-left: 10px;">刷新</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 视图切换 -->
      <div style="margin-top: 20px; margin-bottom: 10px; text-align: right;">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="table">列表视图</el-radio-button>
          <el-radio-button label="kanban">看板视图</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 骨架屏 -->
      <SkeletonLoader
        v-if="loading && taskList.length === 0"
        type="table"
        :rows="5"
        :columns="13"
        :column-widths="['18%', '15%', '10%', '30%', '15%', '12%', '12%', '12%', '12%', '10%', '20%', '20%', '30%']"
        style="margin-top: 20px;"
      />

      <!-- 看板视图 -->
      <TaskKanban
        v-if="viewMode === 'kanban'"
        :tasks="taskList"
        @task-click="handleTaskClickFromKanban"
      />

      <!-- 任务列表 -->
      <el-table
        v-if="viewMode === 'table'"
        v-loading="loading && taskList.length > 0"
        :data="taskList"
        border
        style="width: 100%; margin-top: 20px;"
        @sort-change="handleSortChange"
        :row-key="getRowKey"
      >
        <el-table-column type="expand" width="50">
          <template slot-scope="scope">
            <!-- 任务操作历史 -->
            <div v-if="scope.row.logs && scope.row.logs.length > 0" style="padding: 20px; background-color: #f5f7fa;">
              <div style="font-weight: bold; margin-bottom: 15px; color: #409EFF;">
                {{ scope.row.work_content }} - 操作记录（{{ scope.row.logs.length }}条）
              </div>
              <el-table :data="scope.row.logs" border size="small" style="width: 100%;">
                <el-table-column prop="created_at" label="操作时间" width="160">
                  <template slot-scope="logScope">
                    {{ formatDateTime(logScope.row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column prop="operator_name" label="操作人" width="120"></el-table-column>
                <el-table-column prop="log_type_display" label="操作类型" width="100"></el-table-column>
                <el-table-column label="数量变化" width="180">
                  <template slot-scope="logScope">
                    <span v-if="logScope.row.quantity_before !== null && logScope.row.quantity_after !== null">
                      {{ logScope.row.quantity_before }} → {{ logScope.row.quantity_after }}
                      <span v-if="logScope.row.quantity_increment > 0" style="color: #67C23A; margin-left: 5px; font-weight: bold;">
                        (+{{ logScope.row.quantity_increment }})
                      </span>
                      <span v-else-if="logScope.row.quantity_increment < 0" style="color: #F56C6C; margin-left: 5px; font-weight: bold;">
                        ({{ logScope.row.quantity_increment }})
                      </span>
                    </span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="状态变化" width="150">
                  <template slot-scope="logScope">
                    <span v-if="logScope.row.status_before && logScope.row.status_after">
                      {{ getStatusText(logScope.row.status_before) }} → {{ getStatusText(logScope.row.status_after) }}
                    </span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="content" label="操作内容" min-width="200" show-overflow-tooltip></el-table-column>
              </el-table>
            </div>
            <div v-else style="padding: 20px; text-align: center; color: #909399;">
              暂无操作记录
            </div>
          </template>
        </el-table-column>
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
        <el-table-column label="分派部门" width="120">
          <template slot-scope="scope">
            {{ scope.row.assigned_department_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="分派操作员" width="120">
          <template slot-scope="scope">
            {{ scope.row.assigned_operator_name || '-' }}
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="280" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.status !== 'completed' && canCompleteTask(scope.row)"
              type="success"
              size="mini"
              @click="handleCompleteTask(scope.row)"
            >
              完成
            </el-button>
            <span v-else-if="scope.row.status !== 'completed'" style="color: #909399; font-size: 12px;">
              {{ getTaskBlockReason(scope.row) }}
            </span>
            <el-button
              v-if="scope.row.status !== 'completed' && !scope.row.auto_calculate_quantity"
              type="primary"
              size="mini"
              @click="showUpdateDialog(scope.row)"
              style="margin-left: 5px;"
            >
              更新
            </el-button>
            <el-button
              type="warning"
              size="mini"
              @click="showAssignDialog(scope.row)"
              style="margin-left: 5px;"
            >
              分派
            </el-button>
            <el-button
              v-if="scope.row.status !== 'completed' && !scope.row.is_subtask && !scope.row.subtasks_count"
              type="info"
              size="mini"
              @click="showSplitDialog(scope.row)"
              style="margin-left: 5px;"
            >
              拆分
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

    <!-- 完成任务对话框 -->
    <el-dialog
      title="完成任务"
      :visible.sync="completeTaskDialogVisible"
      width="600px"
      @close="resetCompleteTaskForm"
    >
      <el-form
        ref="completeTaskForm"
        :model="completeTaskForm"
        label-width="120px"
      >
        <el-form-item label="状态">
          <el-tag type="success">已完成</el-tag>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            强制完成任务，状态将标记为已完成
          </div>
        </el-form-item>
        
        <el-form-item 
          v-if="currentTask && currentTask.task_type === 'plate_making'"
          label="完成数量"
        >
          <el-input-number
            v-model="completeTaskForm.quantity_completed"
            :min="1"
            :max="1"
            :step="1"
            disabled
            style="width: 100%;"
          ></el-input-number>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            制版任务完成数量固定为1
          </div>
        </el-form-item>
        
        <el-form-item 
          v-if="currentTask && currentTask.task_type !== 'plate_making'"
          label="当前完成数量"
        >
          <el-input-number
            :value="currentTask.quantity_completed || 0"
            disabled
            style="width: 100%;"
          ></el-input-number>
          <div v-if="currentTask && currentTask.production_quantity" style="color: #909399; font-size: 12px; margin-top: 4px;">
            计划数量：{{ currentTask.production_quantity }}
            <span v-if="(currentTask.quantity_completed || 0) < currentTask.production_quantity" style="color: #E6A23C; margin-left: 10px;">
              （当前完成数量小于计划数量，将强制标记为已完成）
            </span>
          </div>
        </el-form-item>
        
        <el-form-item label="完成理由">
          <el-input
            v-model="completeTaskForm.completion_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入完成理由（可选，用于说明为什么在完成数量小于生产数量时强制完成）"
          ></el-input>
        </el-form-item>

        <el-form-item
          v-if="currentTask && (currentTask.work_content.includes('设计图稿') || currentTask.work_content.includes('更新图稿'))"
          label="选择图稿"
          prop="artwork_ids"
          :rules="[{ required: true, message: '请至少选择一个图稿', trigger: 'change' }]"
        >
          <el-select
            v-model="completeTaskForm.artwork_ids"
            multiple
            filterable
            placeholder="请选择图稿"
            style="width: 100%;"
            :loading="loadingArtworks"
            @focus="loadArtworkList"
          >
            <el-option
              v-for="artwork in artworkList"
              :key="artwork.id"
              :label="`${artwork.code || artwork.base_code || ''} - ${artwork.name || ''}`"
              :value="artwork.id"
            ></el-option>
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            选中的图稿将自动关联到施工单
          </div>
        </el-form-item>
        <el-form-item
          v-if="currentTask && (currentTask.work_content.includes('设计刀模') || currentTask.work_content.includes('更新刀模'))"
          label="选择刀模"
          prop="die_ids"
          :rules="[{ required: true, message: '请至少选择一个刀模', trigger: 'change' }]"
        >
          <el-select
            v-model="completeTaskForm.die_ids"
            multiple
            filterable
            placeholder="请选择刀模"
            style="width: 100%;"
            :loading="loadingDies"
            @focus="loadDieList"
          >
            <el-option
              v-for="die in dieList"
              :key="die.id"
              :label="`${die.code} - ${die.name}`"
              :value="die.id"
            ></el-option>
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            选中的刀模将自动关联到施工单
          </div>
        </el-form-item>
        <el-form-item label="任务备注">
          <el-input
            v-model="completeTaskForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入任务备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="completeTaskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCompleteTask" :loading="completingTask">确定</el-button>
      </div>
    </el-dialog>

    <!-- 更新数量对话框 -->
    <el-dialog
      title="更新任务"
      :visible.sync="updateDialogVisible"
      width="600px"
    >
      <el-form
        ref="updateForm"
        :model="updateForm"
        label-width="120px"
      >
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
        <el-form-item label="当前完成数量" v-if="currentTask">
          <el-input-number
            :value="currentTask.quantity_completed || 0"
            disabled
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="本次完成数量" prop="quantity_completed" required>
          <el-input-number
            v-model="updateForm.quantity_completed"
            :min="0"
            :max="currentTask?.production_quantity ? (currentTask.production_quantity - (currentTask.quantity_completed || 0)) : 999999"
            style="width: 100%;"
          ></el-input-number>
          <div v-if="currentTask?.production_quantity" style="color: #909399; font-size: 12px; margin-top: 4px;">
            计划数量：{{ currentTask.production_quantity }}，
            当前完成：{{ currentTask.quantity_completed || 0 }}，
            更新后：{{ (currentTask.quantity_completed || 0) + (updateForm.quantity_completed || 0) }}
            <span v-if="(currentTask.quantity_completed || 0) + (updateForm.quantity_completed || 0) >= currentTask.production_quantity" style="color: #67C23A;">
              （完成数量将达到计划数量，状态将自动标记为已完成）
            </span>
            <span v-else style="color: #E6A23C;">
              （完成数量未达到计划数量，状态将保持为进行中）
            </span>
          </div>
        </el-form-item>
        <el-form-item label="本次不良品数量">
          <el-input-number
            v-model="updateForm.quantity_defective"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            当前不良品：{{ currentTask?.quantity_defective || 0 }}，
            更新后：{{ (currentTask?.quantity_defective || 0) + (updateForm.quantity_defective || 0) }}
          </div>
        </el-form-item>
        <el-form-item
          v-if="currentTask && (currentTask.work_content && (currentTask.work_content.includes('设计图稿') || currentTask.work_content.includes('更新图稿')))"
          label="选择图稿"
          prop="artwork_ids"
        >
          <el-select
            v-model="updateForm.artwork_ids"
            multiple
            filterable
            placeholder="请选择图稿"
            style="width: 100%;"
            :loading="loadingArtworks"
            @focus="loadArtworkList"
          >
            <el-option
              v-for="artwork in artworkList"
              :key="artwork.id"
              :label="`${artwork.code || artwork.base_code || ''} - ${artwork.name || ''}`"
              :value="artwork.id"
            ></el-option>
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            选中的图稿将自动关联到施工单
          </div>
        </el-form-item>
        <el-form-item
          v-if="currentTask && (currentTask.work_content && (currentTask.work_content.includes('设计刀模') || currentTask.work_content.includes('更新刀模')))"
          label="选择刀模"
          prop="die_ids"
        >
          <el-select
            v-model="updateForm.die_ids"
            multiple
            filterable
            placeholder="请选择刀模"
            style="width: 100%;"
            :loading="loadingDies"
            @focus="loadDieList"
          >
            <el-option
              v-for="die in dieList"
              :key="die.id"
              :label="`${die.code} - ${die.name}`"
              :value="die.id"
            ></el-option>
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            选中的刀模将自动关联到施工单
          </div>
        </el-form-item>
        <el-form-item label="任务备注">
          <el-input
            v-model="updateForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入任务备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateTask" :loading="updatingTask">确定</el-button>
      </div>
    </el-dialog>

    <!-- 分派任务对话框 -->
    <el-dialog
      title="调整任务分派"
      :visible.sync="assignDialogVisible"
      width="600px"
      @close="resetAssignForm"
    >
      <el-form
        ref="assignForm"
        :model="assignForm"
        label-width="120px"
        :rules="assignRules"
      >
        <el-form-item label="任务内容">
          <el-input :value="currentTask?.work_content" disabled></el-input>
        </el-form-item>
        <el-form-item label="分派部门" prop="assigned_department">
          <el-select
            v-model="assignForm.assigned_department"
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
            v-model="assignForm.assigned_operator"
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
            v-model="assignForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入调整原因（可选，便于追溯）"
          ></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="assignForm.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignTask" :loading="assigningTask">确定</el-button>
      </div>
    </el-dialog>

    <!-- 拆分任务对话框 -->
    <el-dialog
      title="拆分任务"
      :visible.sync="splitDialogVisible"
      width="800px"
      @close="resetSplitForm"
    >
      <el-form
        ref="splitForm"
        :model="splitForm"
        label-width="120px"
        :rules="splitRules"
      >
        <el-form-item label="父任务">
          <el-input :value="currentSplitTask?.work_content" disabled></el-input>
        </el-form-item>
        <el-form-item label="生产数量">
          <el-input-number
            :value="currentSplitTask?.production_quantity"
            disabled
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="子任务列表" prop="splits">
          <div style="margin-bottom: 10px;">
            <el-button type="primary" size="small" @click="addSplitItem">添加子任务</el-button>
            <span style="color: #909399; font-size: 12px; margin-left: 10px;">
              至少需要2个子任务，子任务数量总和不能超过父任务数量
            </span>
          </div>
          <el-table :data="splitForm.splits" border style="width: 100%;">
            <el-table-column label="序号" width="60" align="center">
              <template slot-scope="scope">{{ scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="生产数量" width="150">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.production_quantity"
                  :min="1"
                  :max="currentSplitTask?.production_quantity || 999999"
                  style="width: 100%;"
                ></el-input-number>
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
                  ></el-option>
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
                  ></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="工作内容" min-width="200">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.work_content"
                  placeholder="可选，默认使用父任务内容"
                ></el-input>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="danger"
                  size="mini"
                  icon="el-icon-delete"
                  @click="removeSplitItem(scope.$index)"
                  :disabled="splitForm.splits.length <= 2"
                ></el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top: 10px; color: #909399; font-size: 12px;">
            子任务数量总和：{{ getTotalSplitQuantity() }} / {{ currentSplitTask?.production_quantity || 0 }}
            <span v-if="getTotalSplitQuantity() > (currentSplitTask?.production_quantity || 0)" style="color: #F56C6C;">
              （超出父任务数量）
            </span>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="splitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSplitTask" :loading="splittingTask">确定拆分</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { workOrderTaskAPI, processAPI, artworkAPI, dieAPI, departmentAPI } from '@/api/workorder'
import { getUsersByDepartment } from '@/api/auth'
import { debounce } from '@/utils/debounce'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import TaskKanban from '@/components/TaskKanban.vue'

export default {
  name: 'TaskList',
  components: {
    SkeletonLoader,
    TaskKanban
  },
  data() {
    return {
      loading: false,
      exporting: false,
      taskList: [],
      viewMode: 'table', // 'table' or 'kanban'
      processList: [],
      filters: {
        search: '',
        status: '',
        task_type: '',
        work_order_process: '',
        assigned_department: ''
      },
      pagination: {
        page: 1,
        page_size: 20,
        total: 0
      },
      ordering: '-created_at',
      updateDialogVisible: false,
      currentTask: null,
      updatingTask: false,
      updateForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: ''
      },
      // 完成任务对话框
      completeTaskDialogVisible: false,
      completingTask: false,
      completeTaskForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: '',
        completion_reason: ''
      },
      // 图稿和刀模列表
      artworkList: [],
      dieList: [],
      loadingArtworks: false,
      loadingDies: false,
      // 部门和用户列表
      departmentList: [],
      userList: [],
      loadingDepartments: false,
      loadingUsers: false,
      // 分派对话框
      assignDialogVisible: false,
      assigningTask: false,
      assignForm: {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: ''
      },
      assignRules: {
        // 部门和操作员都是可选的，不需要必填验证
      },
      // 拆分任务对话框
      splitDialogVisible: false,
      splittingTask: false,
      currentSplitTask: null,
      splitForm: {
        splits: []
      },
      splitRules: {
        splits: [
          { required: true, message: '至少需要2个子任务', trigger: 'change' },
          {
            validator: (rule, value, callback) => {
              if (!value || value.length < 2) {
                callback(new Error('至少需要2个子任务'))
              } else {
                const total = value.reduce((sum, item) => sum + (item.production_quantity || 0), 0)
                if (total > (this.currentSplitTask?.production_quantity || 0)) {
                  callback(new Error('子任务数量总和不能超过父任务数量'))
                } else {
                  callback()
                }
              }
            },
            trigger: 'change'
          }
        ]
      }
    }
  },
  created() {
    this.loadProcessList()
    this.loadDepartmentList()
    this.loadData()
  },
  methods: {
    handleTaskClickFromKanban(task) {
      // 跳转到施工单详情页
      if (task.work_order_id) {
        this.$router.push(`/workorders/${task.work_order_id}`)
      }
    },
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
        if (this.filters.assigned_department) {
          params.assigned_department = this.filters.assigned_department
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
    handleSearchDebounced: debounce(function() {
      this.pagination.page = 1
      this.loadData()
    }, 300),
    handleReset() {
      this.filters = {
        search: '',
        status: '',
        task_type: '',
        work_order_process: '',
        assigned_department: ''
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
    getRowKey(row) {
      return row.id
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
    getStatusText(status) {
      const statusMap = {
        'pending': '待开始',
        'in_progress': '进行中',
        'completed': '已完成',
        'cancelled': '已取消'
      }
      return statusMap[status] || status
    },
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
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
      // 制版任务：需要图稿已确认（如果是图稿任务）
      if (task.task_type === 'plate_making' && task.artwork && !task.artwork_confirmed) {
        return false
      }
      // 开料任务：需要物料已开料（如果存在开料工序）
      // 注意：采购不属于施工单工序，采购任务通过其他系统管理
      const processName = task.work_order_process_info?.process?.name || ''
      if (task.task_type === 'cutting' && processName && (processName.includes('开料') || processName.includes('裁切'))) {
        if (task.material_purchase_status !== 'cut') {
          return false
        }
      }
      return true
    },
    // 获取任务被阻止的原因
    getTaskBlockReason(task) {
      // 制版任务：需要图稿确认（如果是图稿任务）
      if (task.task_type === 'plate_making' && task.artwork && !task.artwork_confirmed) {
        return '需确认图稿'
      }
      // 开料任务：需要物料开料（如果存在开料工序）
      // 注意：采购不属于施工单工序，采购任务通过其他系统管理
      const processName = task.work_order_process_info?.process?.name || ''
      if (task.task_type === 'cutting' && processName && (processName.includes('开料') || processName.includes('裁切'))) {
        if (task.material_purchase_status !== 'cut') {
          return '需物料开料'
        }
      }
      return ''
    },
    handleCompleteTask(task) {
      this.currentTask = { ...task }
      
      // 制版任务：完成数量固定为1
      if (task.task_type === 'plate_making') {
        this.completeTaskForm = {
          quantity_completed: 1,
          quantity_defective: task.quantity_defective || 0,
          artwork_ids: [],
          die_ids: [],
          notes: '',
          completion_reason: ''
        }
      } else {
        // 其他任务：预填数量（已有完成数，否则计划数，否则 0）
        const qty = task.quantity_completed != null ? task.quantity_completed
          : (task.production_quantity != null ? task.production_quantity : 0)
        this.completeTaskForm = {
          quantity_completed: qty,
          quantity_defective: task.quantity_defective || 0,
          artwork_ids: [],
          die_ids: [],
          notes: '',
          completion_reason: ''
        }
      }
      
      // 如果是设计类任务，预加载列表
      const isDesignArtworkTask = task.work_content && (task.work_content.includes('设计图稿') || task.work_content.includes('更新图稿'))
      const isDesignDieTask = task.work_content && (task.work_content.includes('设计刀模') || task.work_content.includes('更新刀模'))
      if (isDesignArtworkTask) {
        this.loadArtworkList()
      }
      if (isDesignDieTask) {
        this.loadDieList()
      }
      this.completeTaskDialogVisible = true
    },
    async loadArtworkList() {
      if (this.artworkList.length > 0) {
        return // 已经加载过，不再重复加载
      }
      this.loadingArtworks = true
      try {
        const response = await artworkAPI.getList({ page_size: 1000 })
        this.artworkList = response.results || []
      } catch (error) {
        console.error('加载图稿列表失败:', error)
        this.$message.error('加载图稿列表失败')
      } finally {
        this.loadingArtworks = false
      }
    },
    async loadDieList() {
      if (this.dieList.length > 0) {
        return // 已经加载过，不再重复加载
      }
      this.loadingDies = true
      try {
        const response = await dieAPI.getList({ page_size: 1000 })
        this.dieList = response.results || []
      } catch (error) {
        console.error('加载刀模列表失败:', error)
        this.$message.error('加载刀模列表失败')
      } finally {
        this.loadingDies = false
      }
    },
    resetCompleteTaskForm() {
      this.currentTask = null
      this.completeTaskForm = {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: '',
        completion_reason: ''
      }
      this.$nextTick(() => {
        if (this.$refs.completeTaskForm) {
          this.$refs.completeTaskForm.clearValidate()
        }
      })
    },
    async handleConfirmCompleteTask() {
      this.$refs.completeTaskForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        this.completingTask = true
        try {
          const data = {
            completion_reason: this.completeTaskForm.completion_reason,
            quantity_defective: this.completeTaskForm.quantity_defective || 0,
            notes: this.completeTaskForm.notes
          }
          
          // 设计图稿/设计刀模任务：需要传递图稿或刀模ID
          if (this.currentTask.work_content && (this.currentTask.work_content.includes('设计图稿') || this.currentTask.work_content.includes('更新图稿'))) {
            data.artwork_ids = this.completeTaskForm.artwork_ids
          }
          
          if (this.currentTask.work_content && (this.currentTask.work_content.includes('设计刀模') || this.currentTask.work_content.includes('更新刀模'))) {
            data.die_ids = this.completeTaskForm.die_ids
          }
          
          await workOrderTaskAPI.complete(this.currentTask.id, data)
          this.$message.success('任务已强制完成')
          this.completeTaskDialogVisible = false
          this.loadData()
        } catch (error) {
          // 处理并发冲突
          if (error.response?.status === 409) {
            this.$message.warning('任务已被其他操作员更新，请刷新页面后重试')
            this.loadData()  // 刷新数据
          } else {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
          this.$message.error(errorMessage)
          }
          console.error('完成任务失败:', error)
        } finally {
          this.completingTask = false
        }
      })
    },
    showUpdateDialog(task) {
      this.currentTask = { ...task }
      this.updateForm = {
        quantity_completed: 0,  // 本次完成数量（增量），初始为0
        artwork_ids: [],
        die_ids: [],
        notes: ''
      }
      
      // 如果是设计类任务，预加载列表
      const isDesignArtworkTask = task.work_content && (task.work_content.includes('设计图稿') || task.work_content.includes('更新图稿'))
      const isDesignDieTask = task.work_content && (task.work_content.includes('设计刀模') || task.work_content.includes('更新刀模'))
      if (isDesignArtworkTask) {
        this.loadArtworkList()
      }
      if (isDesignDieTask) {
        this.loadDieList()
      }
      
      this.updateDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.updateForm) {
          this.$refs.updateForm.clearValidate()
        }
      })
    },
    async handleUpdateTask() {
      if (!this.currentTask) return
      
      this.$refs.updateForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        this.updatingTask = true
        try {
          // 传递增量值给后端（后端会累加）
          const data = {
            quantity_increment: this.updateForm.quantity_completed || 0,  // 传递本次完成数量（增量）
            quantity_defective: this.updateForm.quantity_defective || 0,  // 传递本次不良品数量（增量）
            version: this.currentTask.version,  // 传递版本号（乐观锁）
            notes: this.updateForm.notes
          }
          
          // 设计图稿/设计刀模任务：需要传递图稿或刀模ID
          if (this.currentTask.work_content && (this.currentTask.work_content.includes('设计图稿') || this.currentTask.work_content.includes('更新图稿'))) {
            data.artwork_ids = this.updateForm.artwork_ids
          }
          
          if (this.currentTask.work_content && (this.currentTask.work_content.includes('设计刀模') || this.currentTask.work_content.includes('更新刀模'))) {
            data.die_ids = this.updateForm.die_ids
          }
          
          await workOrderTaskAPI.update_quantity(this.currentTask.id, data)
          this.$message.success('更新成功')
          this.updateDialogVisible = false
          this.loadData()
        } catch (error) {
          // 处理并发冲突
          if (error.response?.status === 409) {
            this.$message.warning('任务已被其他操作员更新，请刷新页面后重试')
            this.loadData()  // 刷新数据
          } else {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '更新失败'
          this.$message.error(errorMessage)
          }
          console.error('更新任务失败:', error)
        } finally {
          this.updatingTask = false
        }
      })
    },
    goToWorkOrderDetail(workOrder) {
      if (workOrder && workOrder.id) {
        this.$router.push(`/workorders/${workOrder.id}`)
      } else {
        this.$message.warning('施工单信息不存在')
      }
    },
    async loadDepartmentList() {
      if (this.departmentList.length > 0) {
        return
      }
      this.loadingDepartments = true
      try {
        const response = await departmentAPI.getList({ is_active: true, page_size: 1000 })
        this.departmentList = response.results || []
      } catch (error) {
        console.error('加载部门列表失败:', error)
      } finally {
        this.loadingDepartments = false
      }
    },
    loadDepartmentListForProcess(task) {
      // 根据任务的工序获取关联的部门列表
      if (task.work_order_process_info && task.work_order_process_info.process) {
        const processDepartments = task.work_order_process_info.process.departments || []
        if (processDepartments.length > 0) {
          // 只显示与工序关联的部门
          this.departmentList = processDepartments
        } else {
          // 如果工序没有关联部门，加载所有部门（兼容处理）
          this.loadDepartmentList()
        }
      } else {
        // 如果没有工序信息，加载所有部门（兼容处理）
        this.loadDepartmentList()
      }
    },
    async loadUserList(departmentId = null) {
      this.loadingUsers = true
      try {
        // 如果指定了部门，根据部门获取用户列表
        if (departmentId) {
          const response = await getUsersByDepartment(departmentId)
          this.userList = response || []
        } else {
          // 如果没有指定部门，获取所有用户（排除超级管理员）
          const response = await getUsersByDepartment(null)
          this.userList = response || []
        }
      } catch (error) {
        console.error('加载用户列表失败:', error)
        this.userList = []
      } finally {
        this.loadingUsers = false
      }
    },
    showAssignDialog(task) {
      this.currentTask = { ...task }
      this.assignForm = {
        assigned_department: task.assigned_department || null,
        assigned_operator: task.assigned_operator || null,
        reason: '',
        notes: ''
      }
      // 根据工序过滤部门列表
      this.loadDepartmentListForProcess(task)
      // 如果任务已有部门，根据部门加载用户列表
      this.loadUserList(task.assigned_department || null)
      this.assignDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.assignForm) {
          this.$refs.assignForm.clearValidate()
        }
      })
    },
    async handleAssignTask() {
      this.$refs.assignForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        this.assigningTask = true
        try {
          const data = {
            assigned_department: this.assignForm.assigned_department,
            assigned_operator: this.assignForm.assigned_operator,
            reason: this.assignForm.reason || '',
            notes: this.assignForm.notes || ''
          }
          
          await workOrderTaskAPI.assign(this.currentTask.id, data)
          this.$message.success('任务分派已更新')
          this.assignDialogVisible = false
          this.loadData()
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
          this.$message.error(errorMessage)
          console.error('分派任务失败:', error)
        } finally {
          this.assigningTask = false
        }
      })
    },
    resetAssignForm() {
      this.assignForm = {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: ''
      }
      this.$nextTick(() => {
        if (this.$refs.assignForm) {
          this.$refs.assignForm.clearValidate()
        }
      })
    },
    handleDepartmentChange() {
      // 当部门改变时，根据部门过滤操作员列表
      const departmentId = this.assignForm.assigned_department
      this.loadUserList(departmentId)
      // 如果部门改变，清空已选的操作员（因为操作员可能不属于新部门）
      if (departmentId) {
        // 检查当前选中的操作员是否在新部门的用户列表中
        const currentOperator = this.userList.find(u => u.id === this.assignForm.assigned_operator)
        if (!currentOperator) {
          this.assignForm.assigned_operator = null
        }
      }
    },
    showSplitDialog(task) {
      this.currentSplitTask = { ...task }
      // 默认创建2个子任务，平均分配数量
      const defaultQuantity = Math.floor(task.production_quantity / 2)
      this.splitForm = {
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
      this.splitDialogVisible = true
      // 根据工序过滤部门列表
      this.loadDepartmentListForProcess(task)
      this.loadUserList()
    },
    addSplitItem() {
      this.splitForm.splits.push({
        production_quantity: 0,
        assigned_department: null,
        assigned_operator: null,
        work_content: ''
      })
    },
    removeSplitItem(index) {
      if (this.splitForm.splits.length > 2) {
        this.splitForm.splits.splice(index, 1)
      }
    },
    getTotalSplitQuantity() {
      return this.splitForm.splits.reduce((sum, item) => sum + (item.production_quantity || 0), 0)
    },
    resetSplitForm() {
      this.currentSplitTask = null
      this.splitForm = {
        splits: []
      }
      this.$nextTick(() => {
        if (this.$refs.splitForm) {
          this.$refs.splitForm.clearValidate()
        }
      })
    },
    async handleSplitTask() {
      this.$refs.splitForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        if (!this.currentSplitTask || !this.currentSplitTask.id) {
          this.$message.error('任务信息不存在')
          return
        }
        
        // 验证数量总和
        const total = this.getTotalSplitQuantity()
        if (total > this.currentSplitTask.production_quantity) {
          this.$message.error('子任务数量总和不能超过父任务数量')
          return
        }
        
        this.splittingTask = true
        try {
          const data = {
            splits: this.splitForm.splits.map(split => ({
              production_quantity: split.production_quantity,
              assigned_department: split.assigned_department || null,
              assigned_operator: split.assigned_operator || null,
              work_content: split.work_content || ''
            }))
          }
          
          await workOrderTaskAPI.split(this.currentSplitTask.id, data)
          this.$message.success('任务拆分成功')
          this.splitDialogVisible = false
          this.loadData()
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || '操作失败'
          this.$message.error(errorMessage)
          console.error('拆分任务失败:', error)
        } finally {
          this.splittingTask = false
        }
      })
    },
    // 导出任务列表
    async handleExport() {
      try {
        this.exporting = true
        
        // 构建导出参数（使用当前筛选条件）
        const params = {}
        if (this.filters.search) params.search = this.filters.search
        if (this.filters.status) params.status = this.filters.status
        if (this.filters.task_type) params.task_type = this.filters.task_type
        if (this.filters.work_order_process) params.work_order_process = this.filters.work_order_process
        if (this.filters.assigned_department) params.assigned_department = this.filters.assigned_department
        
        // 生成文件名
        const now = new Date()
        const filename = `任务列表_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.xlsx`
        params.filename = filename
        
        const response = await workOrderTaskAPI.export(params)
        
        // 创建下载链接
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        if (error.response && error.response.data) {
          // 如果是文本错误消息
          const reader = new FileReader()
          reader.onload = () => {
            this.$message.error(reader.result)
          }
          reader.readAsText(error.response.data)
        } else {
          this.$message.error('导出失败：' + (error.message || '未知错误'))
        }
      } finally {
        this.exporting = false
      }
    },
    // 检查是否有导出权限
    canExport() {
      const userInfo = this.$store.getters['user/currentUser']
      if (!userInfo) return false
      if (userInfo.is_superuser) return true
      const permissions = userInfo.permissions || []
      return permissions.includes('workorder.view_workorder')
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

