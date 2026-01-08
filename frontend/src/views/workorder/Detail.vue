<template>
  <div class="workorder-detail" v-loading="loading">
    <el-card v-if="workOrder">
      <!-- 顶部操作栏 -->
      <div class="header-actions">
        <el-button icon="el-icon-back" @click="$router.back()">返回</el-button>
        <div>
          <el-button icon="el-icon-printer" @click="handlePrint">打印</el-button>
          <el-button type="primary" icon="el-icon-edit" @click="handleEdit" style="margin-left: 10px;">编辑</el-button>
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
        <el-descriptions-item label="业务员">{{ workOrder.customer_detail && workOrder.customer_detail.salesperson_name ? workOrder.customer_detail.salesperson_name : '-' }}</el-descriptions-item>
        <el-descriptions-item label="制表人">{{ workOrder.manager_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品名称" v-if="workOrder.product_name">{{ workOrder.product_name }}</el-descriptions-item>
        <el-descriptions-item label="生产数量" v-if="workOrder.production_quantity !== null || workOrder.defective_quantity !== null">
          {{ ((workOrder.production_quantity || 0) + (workOrder.defective_quantity || 0)) }} 车
        </el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ workOrder.total_amount }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span :class="'status-badge status-' + workOrder.status">
            {{ workOrder.status_display }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <span :class="'status-badge approval-' + workOrder.approval_status">
            {{ workOrder.approval_status_display || '待审核' }}
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
          {{ formatDate(workOrder.actual_delivery_date) }}
        </el-descriptions-item>
        <el-descriptions-item label="审核人" v-if="workOrder.approved_by_name">
          {{ workOrder.approved_by_name }}
        </el-descriptions-item>
        <el-descriptions-item label="审核时间" v-if="workOrder.approved_at">
          {{ workOrder.approved_at | formatDateTime }}
        </el-descriptions-item>
        <el-descriptions-item label="审核意见" :span="3" v-if="workOrder.approval_comment">
          {{ workOrder.approval_comment }}
        </el-descriptions-item>
        <el-descriptions-item label="产品规格" :span="3" v-if="workOrder.specification">{{ workOrder.specification }}</el-descriptions-item>
      </el-descriptions>

      <!-- 业务员审核操作 -->
      <el-card v-if="canApprove && workOrder.approval_status === 'pending'" style="margin-top: 20px;">
        <div slot="header" class="card-header">
          <span>业务员审核</span>
        </div>
        <el-form :model="approvalForm" label-width="100px" :rules="approvalRules" ref="approvalForm">
          <el-form-item label="审核意见" prop="comment">
            <el-input
              v-model="approvalForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入审核意见（可选）"
            ></el-input>
          </el-form-item>
          <el-form-item label="拒绝原因" prop="rejection_reason" v-if="showRejectionReason">
            <el-input
              v-model="approvalForm.rejection_reason"
              type="textarea"
              :rows="3"
              placeholder="请填写拒绝原因（必填）"
            ></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="success" @click="handleApprove('approved')" :loading="approving">
              <i class="el-icon-check"></i> 通过审核
            </el-button>
            <el-button type="danger" @click="handleApprove('rejected')" :loading="approving" style="margin-left: 10px;">
              <i class="el-icon-close"></i> 拒绝审核
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 重新提交审核操作（审核拒绝后） -->
      <el-card v-if="canResubmit && workOrder.approval_status === 'rejected'" style="margin-top: 20px;">
        <div slot="header" class="card-header">
          <span>重新提交审核</span>
        </div>
        <el-alert
          type="warning"
          :closable="false"
          style="margin-bottom: 15px;"
        >
          <div slot="title">
            <p>该施工单已被拒绝审核。请修改施工单内容后，点击"重新提交审核"按钮。</p>
            <p v-if="workOrder.approval_comment" style="margin-top: 5px;">
              <strong>审核意见：</strong>{{ workOrder.approval_comment }}
            </p>
            <p v-if="workOrder.approval_logs && workOrder.approval_logs.length > 0">
              <strong>拒绝原因：</strong>
              <span v-for="(log, index) in workOrder.approval_logs" :key="index">
                <span v-if="log.approval_status === 'rejected' && log.rejection_reason">
                  {{ log.rejection_reason }}
                </span>
              </span>
            </p>
          </div>
        </el-alert>
        <el-form-item>
          <el-button type="primary" @click="handleResubmitForApproval" :loading="resubmitting">
            <i class="el-icon-refresh"></i> 重新提交审核
          </el-button>
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">
            提示：修改施工单内容后，审核状态会自动重置为"待审核"
          </span>
        </el-form-item>
      </el-card>

      <!-- 审核历史记录 -->
      <el-card v-if="workOrder.approval_logs && workOrder.approval_logs.length > 0" style="margin-top: 20px;">
        <div slot="header" class="card-header">
          <span>审核历史</span>
        </div>
        <el-timeline>
          <el-timeline-item
            v-for="(log, index) in workOrder.approval_logs"
            :key="index"
            :timestamp="log.approved_at | formatDateTime"
            placement="top"
          >
            <el-card>
              <h4>
                <span :class="'status-badge approval-' + log.approval_status">
                  {{ log.approval_status_display }}
                </span>
                <span style="margin-left: 10px; color: #909399;">审核人：{{ log.approved_by_name || '-' }}</span>
              </h4>
              <p v-if="log.approval_comment" style="margin-top: 10px;">
                <strong>审核意见：</strong>{{ log.approval_comment }}
              </p>
              <p v-if="log.rejection_reason" style="margin-top: 10px; color: #F56C6C;">
                <strong>拒绝原因：</strong>{{ log.rejection_reason }}
              </p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>


      <!-- 图稿和刀模信息 -->
      <el-descriptions title="图稿和刀模" :column="1" border style="margin-top: 20px;">
        <el-descriptions-item label="图稿（CTP版）">
          <span v-if="workOrder.artwork_codes && workOrder.artwork_codes.length > 0">
            <span v-for="(code, index) in workOrder.artwork_codes" :key="index">
              {{ code }}<span v-if="workOrder.artwork_names && workOrder.artwork_names[index]"> - {{ workOrder.artwork_names[index] }}</span>
              <span v-if="index < workOrder.artwork_codes.length - 1">、</span>
            </span>
          </span>
          <span v-else style="color: #909399;">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="印刷要求" v-if="workOrder.printing_type && workOrder.printing_type !== 'none'">
          <span v-if="workOrder.printing_colors_display || workOrder.artwork_colors">
            {{ workOrder.printing_colors_display || workOrder.artwork_colors }} {{ getPrintingTypeDisplay(workOrder.printing_type) }}
          </span>
          <span v-else>
            {{ getPrintingTypeDisplay(workOrder.printing_type) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="刀模">
          <span v-if="workOrder.die_codes && workOrder.die_codes.length > 0">
            <span v-for="(code, index) in workOrder.die_codes" :key="index">
              {{ code }}<span v-if="workOrder.die_names && workOrder.die_names[index]"> - {{ workOrder.die_names[index] }}</span>
              <span v-if="index < workOrder.die_codes.length - 1">、</span>
            </span>
          </span>
          <span v-else style="color: #909399;">-</span>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 物料信息 -->
      <div style="margin-top: 20px;">
        <div class="detail-section-title card-header">
          <span>物料信息</span>
          <el-button size="small" type="primary" icon="el-icon-plus" @click="showAddMaterialDialog">
            添加物料
          </el-button>
        </div>
        
        <el-table
          v-if="workOrder.materials && workOrder.materials.length > 0"
          :data="workOrder.materials"
          border
          style="width: 100%"
        >
          <el-table-column prop="material_name" label="物料名称" width="200">
            <template slot-scope="scope">
              {{ scope.row.material_name }} ({{ scope.row.material_code }})
            </template>
          </el-table-column>
          <el-table-column prop="material_size" label="尺寸" width="150"></el-table-column>
          <el-table-column prop="material_usage" label="用量" width="150"></el-table-column>
          <el-table-column prop="notes" label="备注" min-width="200" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.notes || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="purchase_status_display" label="采购状态" width="120">
            <template slot-scope="scope">
              <el-tag :type="getPurchaseStatusType(scope.row.purchase_status)" size="small">
                {{ scope.row.purchase_status_display }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="purchase_date" label="采购日期" width="120">
            <template slot-scope="scope">
              {{ scope.row.purchase_date | formatDate }}
            </template>
          </el-table-column>
          <el-table-column prop="received_date" label="回料日期" width="120">
            <template slot-scope="scope">
              {{ scope.row.received_date | formatDate }}
            </template>
          </el-table-column>
          <el-table-column prop="cut_date" label="开料日期" width="120">
            <template slot-scope="scope">
              {{ scope.row.cut_date | formatDate }}
            </template>
          </el-table-column>
          <el-table-column prop="notes" label="备注" show-overflow-tooltip></el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="primary"
                size="mini"
                @click="handleUpdateMaterialStatus(scope.row)"
                :disabled="scope.row.purchase_status === 'completed'"
              >
                更新状态
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-else-if="workOrder && (!workOrder.materials || workOrder.materials.length === 0)" description="暂无物料信息"></el-empty>
      </div>

      <!-- 物料状态更新对话框 -->
      <el-dialog
        title="更新物料采购状态"
        :visible.sync="materialStatusDialogVisible"
        width="500px"
        @close="resetMaterialStatusForm"
      >
        <el-form
          ref="materialStatusForm"
          :model="materialStatusForm"
          :rules="materialStatusRules"
          label-width="120px"
        >
          <el-form-item label="物料名称">
            <el-input :value="materialStatusForm.material_name" disabled></el-input>
          </el-form-item>
          <el-form-item label="当前状态">
            <el-tag :type="getPurchaseStatusType(materialStatusForm.current_status)" size="small">
              {{ getPurchaseStatusDisplay(materialStatusForm.current_status) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="更新为" prop="purchase_status">
            <el-select
              v-model="materialStatusForm.purchase_status"
              placeholder="请选择状态"
              style="width: 100%;"
              @change="handleMaterialStatusChange"
            >
              <el-option
                v-for="status in availableStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            label="采购日期"
            prop="purchase_date"
            v-if="materialStatusForm.purchase_status === 'ordered'"
          >
            <el-date-picker
              v-model="materialStatusForm.purchase_date"
              type="date"
              placeholder="选择采购日期"
              style="width: 100%;"
              value-format="yyyy-MM-dd"
            ></el-date-picker>
          </el-form-item>
          <el-form-item
            label="回料日期"
            prop="received_date"
            v-if="materialStatusForm.purchase_status === 'received'"
          >
            <el-date-picker
              v-model="materialStatusForm.received_date"
              type="date"
              placeholder="选择回料日期"
              style="width: 100%;"
              value-format="yyyy-MM-dd"
            ></el-date-picker>
          </el-form-item>
          <el-form-item
            label="开料日期"
            prop="cut_date"
            v-if="materialStatusForm.purchase_status === 'cut'"
          >
            <el-date-picker
              v-model="materialStatusForm.cut_date"
              type="date"
              placeholder="选择开料日期"
              style="width: 100%;"
              value-format="yyyy-MM-dd"
            ></el-date-picker>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="materialStatusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMaterialStatusUpdate" :loading="updatingMaterialStatus">
            确定
          </el-button>
        </div>
      </el-dialog>

      <!-- 更新任务数量对话框 -->
      <el-dialog
        title="更新任务"
        :visible.sync="updateTaskDialogVisible"
        width="600px"
      >
        <el-form
          ref="updateTaskForm"
          :model="updateTaskForm"
          label-width="120px"
        >
          <el-form-item label="任务内容">
            <el-input :value="currentUpdateTask?.work_content" disabled></el-input>
          </el-form-item>
          <el-form-item label="生产数量">
            <el-input-number
              :value="currentUpdateTask?.production_quantity"
              disabled
              style="width: 100%;"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="当前完成数量" v-if="currentUpdateTask">
            <el-input-number
              :value="currentUpdateTask.quantity_completed || 0"
              disabled
              style="width: 100%;"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="本次完成数量" prop="quantity_completed" required>
            <el-input-number
              v-model="updateTaskForm.quantity_completed"
              :min="0"
              :max="currentUpdateTask ? (currentUpdateTask.production_quantity - (currentUpdateTask.quantity_completed || 0)) : 999999"
              style="width: 100%;"
            ></el-input-number>
            <div v-if="currentUpdateTask?.production_quantity" style="color: #909399; font-size: 12px; margin-top: 4px;">
              计划数量：{{ currentUpdateTask.production_quantity }}，
              当前完成：{{ currentUpdateTask.quantity_completed || 0 }}，
              更新后：{{ (currentUpdateTask.quantity_completed || 0) + (updateTaskForm.quantity_completed || 0) }}
              <span v-if="(currentUpdateTask.quantity_completed || 0) + (updateTaskForm.quantity_completed || 0) >= currentUpdateTask.production_quantity" style="color: #67C23A;">
                （完成数量将达到计划数量，状态将自动标记为已完成）
              </span>
              <span v-else style="color: #E6A23C;">
                （完成数量未达到计划数量，状态将保持为进行中）
              </span>
            </div>
          </el-form-item>
          <el-form-item label="本次不良品数量">
            <el-input-number
              v-model="updateTaskForm.quantity_defective"
              :min="0"
              style="width: 100%;"
            ></el-input-number>
            <div style="color: #909399; font-size: 12px; margin-top: 4px;">
              当前不良品：{{ currentUpdateTask?.quantity_defective || 0 }}，
              更新后：{{ (currentUpdateTask?.quantity_defective || 0) + (updateTaskForm.quantity_defective || 0) }}
            </div>
          </el-form-item>
          <el-form-item
            v-if="currentUpdateTask && (currentUpdateTask.work_content && (currentUpdateTask.work_content.includes('设计图稿') || currentUpdateTask.work_content.includes('更新图稿')))"
            label="选择图稿"
            prop="artwork_ids"
          >
            <el-select
              v-model="updateTaskForm.artwork_ids"
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
            v-if="currentUpdateTask && (currentUpdateTask.work_content && (currentUpdateTask.work_content.includes('设计刀模') || currentUpdateTask.work_content.includes('更新刀模')))"
            label="选择刀模"
            prop="die_ids"
          >
            <el-select
              v-model="updateTaskForm.die_ids"
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
              v-model="updateTaskForm.notes"
              type="textarea"
              :rows="3"
              placeholder="请输入任务备注（可选）"
            ></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button @click="updateTaskDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateTaskFromDialog" :loading="updatingTask">确定</el-button>
        </div>
      </el-dialog>

      <!-- 完成工序对话框 -->
      <el-dialog
        title="完成工序"
        :visible.sync="completeProcessDialogVisible"
        width="600px"
      >
        <el-form :model="completeProcessForm" label-width="120px" :rules="completeProcessRules" ref="completeProcessForm">
          <el-form-item label="工序名称">
            <el-input :value="currentProcess ? currentProcess.process_name : ''" disabled></el-input>
          </el-form-item>
          <el-form-item label="任务完成情况">
            <div v-if="currentProcess && currentProcess.tasks">
              <div style="margin-bottom: 10px;">
                <span>总任务数：{{ currentProcess.tasks.length }}</span>
                <span style="margin-left: 20px;">已完成：{{ getCompletedTaskCount(currentProcess.tasks) }}</span>
                <span style="margin-left: 20px; color: #E6A23C;" v-if="getIncompleteTaskCount(currentProcess.tasks) > 0">
                  未完成：{{ getIncompleteTaskCount(currentProcess.tasks) }}
                </span>
              </div>
              <el-alert
                v-if="getIncompleteTaskCount(currentProcess.tasks) > 0"
                type="warning"
                :closable="false"
                style="margin-bottom: 10px;"
              >
                <div slot="title">
                  <p>该工序还有 {{ getIncompleteTaskCount(currentProcess.tasks) }} 个任务未完成。</p>
                  <p style="margin-top: 5px;">建议：先完成所有任务，工序会自动完成。如需强制完成，请勾选下方选项并填写原因。</p>
                </div>
              </el-alert>
            </div>
          </el-form-item>
          <el-form-item label="完成数量">
            <el-input-number
              v-model="completeProcessForm.quantity_completed"
              :min="0"
              style="width: 100%;"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="不良品数量">
            <el-input-number
              v-model="completeProcessForm.quantity_defective"
              :min="0"
              style="width: 100%;"
            ></el-input-number>
          </el-form-item>
          <el-form-item v-if="currentProcess && getIncompleteTaskCount(currentProcess.tasks) > 0">
            <el-checkbox v-model="completeProcessForm.force_complete">
              强制完成（即使任务未完成）
            </el-checkbox>
            <div style="color: #909399; font-size: 12px; margin-top: 5px;">
              强制完成会将所有未完成的任务标记为已完成，请谨慎使用
            </div>
          </el-form-item>
          <el-form-item 
            v-if="completeProcessForm.force_complete"
            label="强制完成原因"
            prop="force_reason"
            :rules="[{ required: true, message: '请填写强制完成原因', trigger: 'blur' }]"
          >
            <el-input
              v-model="completeProcessForm.force_reason"
              type="textarea"
              :rows="3"
              placeholder="请说明为什么需要强制完成工序（必填）"
            ></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="completeProcessDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCompleteProcess" :loading="completingProcess">确定</el-button>
        </div>
      </el-dialog>

      <!-- 其他信息 -->
      <el-descriptions title="其他信息" :column="1" border style="margin-top: 20px;">
        <el-descriptions-item label="备注">{{ workOrder.notes || '-' }}</el-descriptions-item>
      </el-descriptions>

      <!-- 产品列表（场景2：一个施工单包含多个产品） -->
      <div v-if="workOrder.products && workOrder.products.length > 0" style="margin-top: 20px;">
        <div class="detail-section-title">产品列表</div>
        <el-table :data="workOrder.products" border style="width: 100%">
          <el-table-column prop="product_name" label="产品名称" width="200">
            <template slot-scope="scope">
              {{ scope.row.product_name }} ({{ scope.row.product_code }})
            </template>
          </el-table-column>
          <el-table-column prop="specification" label="规格" show-overflow-tooltip>
            <template slot-scope="scope">
              {{ scope.row.specification || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="imposition_quantity" label="拼版" width="100" align="center">
            <template slot-scope="scope">
              {{ (scope.row.imposition_quantity || 1) }}拼
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="120" align="right">
            <template slot-scope="scope">
              {{ scope.row.quantity }} {{ scope.row.unit }}
            </template>
          </el-table-column>
          <el-table-column label="小计" width="150" align="right">
            <template slot-scope="scope">
              <span v-if="scope.row.product_detail">
                ¥{{ parseFloat((scope.row.product_detail.unit_price * scope.row.quantity).toFixed(2)) }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 打印区域（隐藏，仅在打印时显示） -->
    <div id="print-area" class="print-area" v-if="workOrder">
      <div class="print-header">
        <div class="print-company">{{ companyName }}</div>
        <div class="print-title">生产施工单</div>
        <div class="print-order-number">No: {{ workOrder.order_number }}</div>
      </div>
      
      <div class="print-dates">
        <span>下单日期：{{ workOrder.order_date | formatDate }}</span>
        <span>交货日期：{{ workOrder.delivery_date | formatDate }}</span>
      </div>

      <div class="print-content">
        <!-- 基本信息 -->
        <div class="print-section">
          <div class="print-section-title">基本信息</div>
          <table class="print-info-table">
            <tr>
              <td class="print-label">客户：</td>
              <td class="print-value">{{ workOrder.customer_name }}</td>
              <td class="print-label">产品名称：</td>
              <td class="print-value">{{ workOrder.product_name || '-' }}</td>
            </tr>
            <tr>
              <td class="print-label">生产数量：</td>
              <td class="print-value">{{ ((workOrder.production_quantity || 0) + (workOrder.defective_quantity || 0)) }} 车</td>
              <td class="print-label">优先级：</td>
              <td class="print-value">{{ workOrder.priority_display }}</td>
            </tr>
            <tr v-if="workOrder.actual_delivery_date">
              <td class="print-label">实际交货日期：</td>
              <td class="print-value">{{ workOrder.actual_delivery_date | formatDate }}</td>
              <td class="print-label"></td>
              <td class="print-value"></td>
            </tr>
            <tr v-if="workOrder.approval_comment">
              <td class="print-label">审核意见：</td>
              <td class="print-value" colspan="3">{{ workOrder.approval_comment }}</td>
            </tr>
            <tr v-if="workOrder.specification">
              <td class="print-label">产品规格：</td>
              <td class="print-value" colspan="3">{{ workOrder.specification }}</td>
            </tr>
          </table>
        </div>

        <!-- 工序信息 -->
        <div class="print-section" v-if="workOrder.order_processes && workOrder.order_processes.length > 0">
          <div class="print-section-title">工序信息</div>
          <table class="print-data-table">
            <thead>
              <tr>
                <th></th>
                <th v-for="process in workOrder.order_processes" :key="process.id">{{ process.process_name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="print-label" style="font-weight: bold;">完成数量</td>
                <td v-for="process in workOrder.order_processes" :key="process.id">
                  {{ process.quantity_completed || '' }}
                </td>
              </tr>
              <tr>
                <td class="print-label" style="font-weight: bold;">完成日期</td>
                <td v-for="process in workOrder.order_processes" :key="process.id">
                  {{ process.actual_end_time ? formatDate(process.actual_end_time) : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 图稿和刀模信息 -->
        <div class="print-section">
          <div class="print-section-title">图稿和刀模</div>
          <table class="print-info-table">
            <tr>
              <td class="print-label">图稿（CTP版）：</td>
              <td class="print-value">
                <span v-if="workOrder.artwork_codes && workOrder.artwork_codes.length > 0">
                  <span v-for="(code, index) in workOrder.artwork_codes" :key="index">
                    {{ code }}<span v-if="workOrder.artwork_names && workOrder.artwork_names[index]"> - {{ workOrder.artwork_names[index] }}</span>
                    <span v-if="index < workOrder.artwork_codes.length - 1">、</span>
                  </span>
                </span>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="workOrder.printing_type && workOrder.printing_type !== 'none'">
              <td class="print-label">印刷要求：</td>
              <td class="print-value" colspan="3">
                <span v-if="workOrder.printing_colors_display || workOrder.artwork_colors">
                  {{ workOrder.printing_colors_display || workOrder.artwork_colors }} {{ getPrintingTypeDisplay(workOrder.printing_type) }}
                </span>
                <span v-else>
                  {{ getPrintingTypeDisplay(workOrder.printing_type) }}
                </span>
              </td>
            </tr>
            <tr>
              <td class="print-label">刀模：</td>
              <td class="print-value">
                <span v-if="workOrder.die_codes && workOrder.die_codes.length > 0">
                  <span v-for="(code, index) in workOrder.die_codes" :key="index">
                    {{ code }}<span v-if="workOrder.die_names && workOrder.die_names[index]"> - {{ workOrder.die_names[index] }}</span>
                    <span v-if="index < workOrder.die_codes.length - 1">、</span>
                  </span>
                </span>
                <span v-else>-</span>
              </td>
            </tr>
          </table>
        </div>

        <!-- 物料信息 -->
        <div class="print-section" v-if="workOrder.materials && workOrder.materials.length > 0">
          <div class="print-section-title">物料信息</div>
          <table class="print-data-table">
            <thead>
              <tr>
                <th>物料名称</th>
                <th>尺寸</th>
                <th>用量</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="material in workOrder.materials" :key="material.id">
                <td>{{ material.material_name }} ({{ material.material_code }})</td>
                <td>{{ material.material_size || '-' }}</td>
                <td>{{ material.material_usage || '-' }}</td>
                <td>{{ material.notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 备注 -->
        <div class="print-section" v-if="workOrder.notes">
          <div class="print-section-title">备注</div>
          <div class="print-notes">{{ workOrder.notes }}</div>
        </div>

        <!-- 产品列表 -->
        <div class="print-section" v-if="workOrder.products && workOrder.products.length > 0">
          <div class="print-section-title">产品列表</div>
          <table class="print-data-table">
            <thead>
              <tr>
                <th>产品名称</th>
                <th>规格</th>
                <th>拼版</th>
                <th>数量</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in workOrder.products" :key="product.id">
                <td>{{ product.product_name }} ({{ product.product_code }})</td>
                <td>{{ product.specification || '-' }}</td>
                <td>{{ (product.imposition_quantity || 1) }}拼</td>
                <td>{{ product.quantity }} {{ product.unit }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 底部信息（固定在A4底部） -->
      <div class="print-footer">
        <table class="print-footer-table">
          <tr>
            <td class="print-label">业务员：</td>
            <td class="print-value">{{ workOrder.customer_detail && workOrder.customer_detail.salesperson_name ? workOrder.customer_detail.salesperson_name : '-' }}</td>
            <td class="print-label">制表：</td>
            <td class="print-value">{{ workOrder.manager_name || '-' }}</td>
            <td class="print-label">审核：</td>
            <td class="print-value">
              <span v-if="workOrder.approval_status === 'pending'">待审核</span>
              <span v-else-if="workOrder.approval_status === 'approved'">{{ workOrder.approved_by_name || '-' }}</span>
              <span v-else-if="workOrder.approval_status === 'rejected'">已拒绝</span>
              <span v-else>-</span>
            </td>
          </tr>
        </table>
      </div>
    </div>

      <!-- 工序和任务管理 -->
    <el-card style="margin-top: 20px;">
      <div slot="header" class="card-header">
          <span>工序和任务管理</span>
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
                  <span :class="'status-badge status-' + process.status" style="margin-left: 10px;">
                  {{ process.status_display }}
                </span>
                  <span style="color: #909399; font-size: 12px; margin-left: 15px;">
                    {{ getProcessDisplayDepartment(process) }}
                </span>
              </div>
              <div v-if="process.status !== 'completed'">
                <el-button
                  v-if="process.status === 'pending'"
                  type="primary"
                  size="small"
                  @click="handleStartProcess(process)"
                    :disabled="!process.can_start"
                  >
                    <i class="el-icon-video-play"></i> 开始工序
                  </el-button>
                  <el-button
                    v-if="process.status === 'pending' && !process.can_start"
                    type="info"
                    size="small"
                    disabled
                    style="margin-left: 10px;"
                  >
                    等待前置工序完成
                </el-button>
                <el-button
                  v-if="process.status === 'in_progress'"
                  type="success"
                  size="small"
                    @click="showCompleteProcessDialog(process)"
                >
                    <i class="el-icon-check"></i> 完成工序
                </el-button>
                <el-button
                  v-if="process.status === 'in_progress' && process.tasks && process.tasks.length > 0"
                  type="warning"
                  size="small"
                  @click="showReassignProcessDialog(process)"
                  style="margin-left: 5px;"
                >
                  <i class="el-icon-sort"></i> 批量调整分派
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
                {{ formatDateTime(process.actual_start_time) }}
              </el-descriptions-item>
              <el-descriptions-item label="结束时间">
                {{ formatDateTime(process.actual_end_time) }}
              </el-descriptions-item>
              <el-descriptions-item label="耗时">
                {{ process.duration_hours ? process.duration_hours + ' 小时' : '-' }}
              </el-descriptions-item>
            </el-descriptions>
            
              <!-- 任务列表 -->
              <div v-if="process.tasks && process.tasks.length > 0" style="margin-top: 15px;">
                <el-divider content-position="left">
                  <span style="font-weight: bold;">任务列表</span>
                </el-divider>
                <el-table :data="process.tasks" border size="small" :row-key="(row) => row.id">
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
                  <el-table-column prop="work_content" label="任务内容" min-width="200"></el-table-column>
                  <el-table-column label="关联对象" width="150">
                    <template slot-scope="scope">
                      <div v-if="scope.row.artwork_code">
                        <span>{{ scope.row.artwork_code }}</span>
                        <el-tag
                          v-if="scope.row.artwork_code && isPlateMakingProcess(process)"
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
                          v-if="isMaterialProcess(process) && scope.row.material_purchase_status"
                          :type="getMaterialStatusTagTypeByStatus(scope.row.material_purchase_status)"
                          size="mini"
                          style="margin-left: 5px;"
                        >
                          {{ getMaterialStatusTextByStatus(scope.row.material_purchase_status) }}
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
                  <el-table-column prop="quantity_defective" label="不良品" width="80" align="right"></el-table-column>
                  <el-table-column label="任务类型" width="100">
                    <template slot-scope="scope">
                      <el-tag v-if="scope.row.is_subtask" type="info" size="small">子任务</el-tag>
                      <el-tag v-else-if="scope.row.subtasks_count > 0" type="success" size="small">父任务({{ scope.row.subtasks_count }})</el-tag>
                      <span v-else>-</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status_display" label="状态" width="100">
                    <template slot-scope="scope">
                      <el-tag
                        :type="getTaskStatusType(scope.row.status)"
                        size="small"
                      >
                        {{ scope.row.status_display }}
                      </el-tag>
                    </template>
                  </el-table-column>
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
                  <el-table-column label="操作" width="280" v-if="process.status === 'in_progress'">
                    <template slot-scope="scope">
                      <el-button
                        v-if="scope.row.status !== 'completed' && canCompleteTask(scope.row, process)"
                        type="success"
                        size="mini"
                        @click="handleCompleteTask(scope.row)"
                      >
                        完成
                      </el-button>
                      <span v-else-if="scope.row.status !== 'completed'" style="color: #909399; font-size: 12px;">
                        {{ getTaskBlockReason(scope.row, process) }}
                      </span>
                      <el-button
                        v-if="scope.row.status !== 'completed' && !scope.row.auto_calculate_quantity"
                        type="primary"
                        size="mini"
                        @click="showUpdateTaskDialog(scope.row)"
                        style="margin-left: 5px;"
                      >
                        更新
                      </el-button>
                      <el-button
                        type="warning"
                        size="mini"
                        @click="showTaskAssignDialog(scope.row)"
                        style="margin-left: 5px;"
                      >
                        分派
                      </el-button>
                      <el-button
                        v-if="scope.row.status !== 'completed' && !scope.row.is_subtask && !scope.row.subtasks_count"
                        type="info"
                        size="mini"
                        @click="showTaskSplitDialog(scope.row)"
                        style="margin-left: 5px;"
                      >
                        拆分
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else-if="process.status === 'in_progress' || process.status === 'completed'" style="margin-top: 15px;">
                <el-divider content-position="left">
                  <span style="font-weight: bold;">任务列表</span>
                </el-divider>
                <div style="color: #909399; padding: 20px; text-align: center;">
                  暂无任务
                </div>
              </div>
              
              <div v-if="process.notes" style="margin-top: 15px;">
                <el-divider></el-divider>
              <strong>备注：</strong>{{ process.notes }}
            </div>
            
            <!-- 工序日志 -->
              <div v-if="process.logs && process.logs.length > 0" style="margin-top: 15px;">
                <el-divider content-position="left">
                  <span style="font-weight: bold;">操作记录</span>
                </el-divider>
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
        <el-form-item label="备注">
          <el-input
            v-model="materialForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addMaterialDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddMaterial">确定</el-button>
      </div>
    </el-dialog>

    <!-- 完成任务对话框（通用，设计任务额外选择图稿/刀模） -->
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

    <!-- 批量调整工序分派对话框 -->
    <el-dialog
      title="批量调整工序分派"
      :visible.sync="reassignProcessDialogVisible"
      width="600px"
    >
      <el-form
        ref="reassignProcessForm"
        :model="reassignProcessForm"
        label-width="140px"
        :rules="{
          reason: [{ required: true, message: '请填写调整原因', trigger: 'blur' }]
        }"
      >
        <el-form-item label="工序名称">
          <el-input :value="currentReassignProcess ? currentReassignProcess.process_name : ''" disabled></el-input>
        </el-form-item>
        <el-form-item label="任务数量">
          <el-input :value="currentReassignProcess && currentReassignProcess.tasks ? currentReassignProcess.tasks.length : 0" disabled></el-input>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            将调整该工序下所有任务的分派
          </div>
        </el-form-item>
        <el-form-item label="新分派部门" prop="assigned_department">
          <el-select
            v-model="reassignProcessForm.assigned_department"
            placeholder="请选择部门"
            filterable
            clearable
            style="width: 100%;"
            @change="handleReassignProcessDepartmentChange"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="新分派操作员" prop="assigned_operator">
          <el-select
            v-model="reassignProcessForm.assigned_operator"
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
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="reassignProcessForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写调整原因（必填，便于追溯）"
          ></el-input>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            例如：包装车间设备故障，无法处理裱坑工序
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="reassignProcessForm.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="reassignProcessForm.update_process_department">
            同时更新工序级别的部门（影响后续生成的任务）
          </el-checkbox>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            如果勾选，后续生成的任务也会分派到新部门
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="reassignProcessDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReassignProcess" :loading="reassigningProcess">确定</el-button>
      </div>
    </el-dialog>

    <!-- 任务分派对话框 -->
    <el-dialog
      title="调整任务分派"
      :visible.sync="taskAssignDialogVisible"
      width="600px"
    >
      <el-form
        ref="taskAssignForm"
        :model="taskAssignForm"
        label-width="120px"
      >
        <el-form-item label="任务内容">
          <el-input :value="currentTask?.work_content" disabled></el-input>
        </el-form-item>
        <el-form-item label="分派部门">
          <el-select
            v-model="taskAssignForm.assigned_department"
            placeholder="请选择部门"
            filterable
            clearable
            style="width: 100%;"
            @change="handleTaskAssignDepartmentChange"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分派操作员">
          <el-select
            v-model="taskAssignForm.assigned_operator"
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
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input
            v-model="taskAssignForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入调整原因（可选）"
          ></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="taskAssignForm.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="taskAssignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTaskAssign" :loading="assigningTask">确定</el-button>
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
import Vue from 'vue'
import { workOrderAPI, processAPI, materialAPI, workOrderProcessAPI, workOrderMaterialAPI, workOrderTaskAPI, departmentAPI, artworkAPI, dieAPI } from '@/api/workorder'
import { getUsersByDepartment } from '@/api/auth'
// 配置文件（默认值）
const config = {
  companyName: '肇庆市高要区新西彩包装有限公司'
}

export default {
  name: 'WorkOrderDetail',
  data() {
    return {
      loading: false,
      workOrder: null,
      processList: [],
      materialList: [],
      departmentList: [],
      userList: [],
      addProcessDialog: false,
      completeProcessDialogVisible: false,
      completingProcess: false,
      currentProcess: null,
      completeProcessForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        force_complete: false,
        force_reason: ''
      },
      completeProcessRules: {
        force_reason: [
          { required: true, message: '请填写强制完成原因', trigger: 'blur' }
        ]
      },
      materialStatusDialogVisible: false,
      updatingMaterialStatus: false,
      materialStatusForm: {
        id: null,
        material_name: '',
        current_status: '',
        purchase_status: '',
        purchase_date: '',
        received_date: '',
        cut_date: ''
      },
      materialStatusRules: {
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
      },
      addMaterialDialog: false,
      processForm: {
        process_id: null,
        sequence: 1
      },
      materialForm: {
        material_id: null,
        planned_quantity: 0
      },
      approving: false,
      resubmitting: false,
      approvalForm: {
        comment: '',
        rejection_reason: ''
      },
      approvalRules: {
        rejection_reason: [
          { required: false, message: '请填写拒绝原因', trigger: 'blur' }
        ]
      },
      showRejectionReason: false,
      // 完成任务对话框
      completeTaskDialogVisible: false,
      currentTask: null,
      completeTaskForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: '',
        completion_reason: ''
      },
      artworkList: [],
      dieList: [],
      loadingArtworks: false,
      loadingDies: false,
      completingTask: false,
      // 更新任务数量对话框
      updateTaskDialogVisible: false,
      currentUpdateTask: null,
      updatingTask: false,
      updateTaskForm: {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: ''
      },
      // 批量调整工序分派对话框
      reassignProcessDialogVisible: false,
      reassigningProcess: false,
      reassignProcessForm: {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: '',
        update_process_department: false
      },
      // 任务分派对话框
      taskAssignDialogVisible: false,
      assigningTask: false,
      taskAssignForm: {
        assigned_department: null,
        assigned_operator: null,
        reason: '',
        notes: ''
      },
      currentReassignProcess: null,
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
  computed: {
    // 公司名称（从配置文件读取）
    companyName() {
      return config.companyName
    },
    // 检查是否可以审核（用户是业务员且负责该施工单的客户）
    canApprove() {
      const userInfo = this.$store.getters.currentUser
      if (!userInfo || !userInfo.is_salesperson) return false
      if (!this.workOrder || !this.workOrder.customer_detail) return false
      // 检查施工单的客户对应的业务员是否是当前登录的业务员
      return this.workOrder.customer_detail.salesperson === userInfo.id
    },
    // 检查是否可以重新提交审核（制表人、创建人或有编辑权限的用户）
    canResubmit() {
      const userInfo = this.$store.getters.currentUser
      if (!userInfo || !this.workOrder) return false
      // 检查是否是制表人或创建人
      if (this.workOrder.manager === userInfo.id || this.workOrder.created_by === userInfo.id) {
        return true
      }
      // 检查是否有编辑权限（这里简化处理，实际应该检查权限）
      // 注意：前端无法准确判断权限，这里允许所有登录用户尝试，后端会验证
      return true
    },
    availableStatuses() {
      const currentStatus = this.materialStatusForm.current_status
      const statusMap = {
        pending: [
          { value: 'ordered', label: '已下单' }
        ],
        ordered: [
          { value: 'received', label: '已回料' }
        ],
        received: [
          { value: 'cut', label: '已开料' }
        ],
        cut: [
          { value: 'completed', label: '已完成' }
        ],
        completed: []
      }
      return statusMap[currentStatus] || []
    }
  },
  filters: {
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    }
  },
  beforeCreate() {
    // 确保过滤器可用（从全局过滤器复制）
    if (!this.$options.filters) {
      this.$options.filters = {}
    }
    // 从 Vue 全局过滤器复制
    if (Vue.filter('formatDate') && !this.$options.filters.formatDate) {
      this.$options.filters.formatDate = Vue.filter('formatDate')
    }
    if (Vue.filter('formatDateTime') && !this.$options.filters.formatDateTime) {
      this.$options.filters.formatDateTime = Vue.filter('formatDateTime')
    }
  },
  created() {
    this.loadData()
    this.loadProcessList()
    this.loadMaterialList()
    this.loadDepartmentList()
    this.loadUserList()
  },
  methods: {
    // 日期格式化方法（供模板中直接调用）
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    formatDateTime(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (isNaN(date.getTime())) return value
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
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
        // 分页加载所有工序
        let allProcesses = []
        let page = 1
        let hasMore = true
        
        while (hasMore) {
          const response = await processAPI.getList({ 
            is_active: true, 
            page_size: 100,
            page: page
          })
          
          if (response.results && response.results.length > 0) {
            allProcesses = allProcesses.concat(response.results)
            // 检查是否还有更多数据
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }
        
        this.processList = allProcesses
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
      // 如果审核通过且没有编辑核心字段的权限，显示提示
      if (this.workOrder.approval_status === 'approved') {
        this.$confirm(
          '该施工单已审核通过。核心字段（产品、工序、版选择等）不能修改，非核心字段（备注、交货日期等）可以修改。确定要继续编辑吗？',
          '编辑已审核的施工单',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        ).then(() => {
          this.$router.push(`/workorders/${this.workOrder.id}/edit`)
        }).catch(() => {
          // 用户取消
        })
      } else {
        this.$router.push(`/workorders/${this.workOrder.id}/edit`)
      }
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
    async loadDepartmentList() {
      try {
        const response = await departmentAPI.getList({ page_size: 100 })
        this.departmentList = response.results || []
      } catch (error) {
        console.error('加载部门列表失败:', error)
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
      }
    },
    showReassignProcessDialog(process) {
      this.currentReassignProcess = process
      this.reassignProcessForm = {
        assigned_department: process.department || null,
        assigned_operator: null,
        reason: '',
        notes: '',
        update_process_department: false
      }
      // 如果工序已有部门，根据部门加载用户列表
      this.loadUserList(process.department || null)
      this.reassignProcessDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.reassignProcessForm) {
          this.$refs.reassignProcessForm.clearValidate()
        }
      })
    },
    async handleReassignProcess() {
      this.$refs.reassignProcessForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        if (!this.reassignProcessForm.reason) {
          this.$message.warning('请填写调整原因')
          return
        }
        
        this.reassigningProcess = true
        try {
          const data = {
            assigned_department: this.reassignProcessForm.assigned_department,
            assigned_operator: this.reassignProcessForm.assigned_operator,
            reason: this.reassignProcessForm.reason,
            notes: this.reassignProcessForm.notes || '',
            update_process_department: this.reassignProcessForm.update_process_department
          }
          
          await workOrderProcessAPI.reassign_tasks(this.currentReassignProcess.id, data)
          this.$message.success('批量调整分派成功')
          this.reassignProcessDialogVisible = false
          this.loadData()
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
          this.$message.error(errorMessage)
          console.error('批量调整分派失败:', error)
        } finally {
          this.reassigningProcess = false
        }
      })
    },
    showTaskAssignDialog(task) {
      this.currentTask = { ...task }
      this.taskAssignForm = {
        assigned_department: task.assigned_department || null,
        assigned_operator: task.assigned_operator || null,
        reason: '',
        notes: ''
      }
      // 根据工序过滤部门列表
      this.loadDepartmentListForProcess(task)
      // 如果任务已有部门，根据部门加载用户列表
      this.loadUserList(task.assigned_department || null)
      this.taskAssignDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.taskAssignForm) {
          this.$refs.taskAssignForm.clearValidate()
        }
      })
    },
    async handleTaskAssign() {
      this.$refs.taskAssignForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        this.assigningTask = true
        try {
          const data = {
            assigned_department: this.taskAssignForm.assigned_department,
            assigned_operator: this.taskAssignForm.assigned_operator,
            reason: this.taskAssignForm.reason || '',
            notes: this.taskAssignForm.notes || ''
          }
          
          await workOrderTaskAPI.assign(this.currentTask.id, data)
          this.$message.success('任务分派已更新')
          this.taskAssignDialogVisible = false
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
    showTaskSplitDialog(task) {
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
    handleReassignProcessDepartmentChange() {
      // 当批量调整分派的部门改变时，根据部门过滤操作员列表
      const departmentId = this.reassignProcessForm.assigned_department
      this.loadUserList(departmentId)
      // 如果部门改变，清空已选的操作员（因为操作员可能不属于新部门）
      if (departmentId) {
        const currentOperator = this.userList.find(u => u.id === this.reassignProcessForm.assigned_operator)
        if (!currentOperator) {
          this.reassignProcessForm.assigned_operator = null
        }
      }
    },
    handleTaskAssignDepartmentChange() {
      // 当任务分派的部门改变时，根据部门过滤操作员列表
      const departmentId = this.taskAssignForm.assigned_department
      this.loadUserList(departmentId)
      // 如果部门改变，清空已选的操作员（因为操作员可能不属于新部门）
      if (departmentId) {
        const currentOperator = this.userList.find(u => u.id === this.taskAssignForm.assigned_operator)
        if (!currentOperator) {
          this.taskAssignForm.assigned_operator = null
        }
      }
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
    async handleStartProcess(process) {
      try {
        // 直接开始工序，使用默认部门
        await workOrderProcessAPI.start(process.id, {})
        this.$message.success('工序已开始，任务已生成')
        this.loadData()
      } catch (error) {
        if (error.response && error.response.data && error.response.data.error) {
          this.$message.error(error.response.data.error)
        } else {
          this.$message.error('操作失败：' + (error.message || '未知错误'))
        }
        console.error(error)
      }
    },
    showCompleteProcessDialog(process) {
      this.currentProcess = process
      this.completeProcessForm = {
        quantity_completed: process.quantity_completed || 0,
        quantity_defective: process.quantity_defective || 0,
        force_complete: false,
        force_reason: ''
      }
      this.completeProcessDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.completeProcessForm) {
          this.$refs.completeProcessForm.clearValidate()
        }
      })
    },
    getCompletedTaskCount(tasks) {
      if (!tasks || !Array.isArray(tasks)) return 0
      return tasks.filter(task => task.status === 'completed').length
    },
    getIncompleteTaskCount(tasks) {
      if (!tasks || !Array.isArray(tasks)) return 0
      return tasks.filter(task => task.status !== 'completed').length
    },
    async handleCompleteProcess() {
      this.$refs.completeProcessForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        try {
          if (!this.currentProcess || !this.currentProcess.id) {
            this.$message.error('工序信息不存在')
            return
          }
          
          this.completingProcess = true
          
          // 检查是否有未完成任务
          const incompleteCount = this.getIncompleteTaskCount(this.currentProcess.tasks)
          if (incompleteCount > 0 && !this.completeProcessForm.force_complete) {
            this.$message.warning(`该工序还有 ${incompleteCount} 个任务未完成，请先完成任务或选择强制完成`)
            this.completingProcess = false
            return
          }
          
          const data = {
            quantity_completed: this.completeProcessForm.quantity_completed,
            quantity_defective: this.completeProcessForm.quantity_defective
          }
          
          if (this.completeProcessForm.force_complete) {
            data.force_complete = true
            data.force_reason = this.completeProcessForm.force_reason
          }
          
          await workOrderProcessAPI.complete(this.currentProcess.id, data)
          this.$message.success('工序已完成')
          this.completeProcessDialogVisible = false
          this.loadData()
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message || '操作失败'
          
          // 如果是需要强制完成的错误，提示用户
          if (error.response?.data?.requires_force) {
            this.$message.warning(error.response.data.message || errorMessage)
            // 自动勾选强制完成选项
            this.completeProcessForm.force_complete = true
          } else {
            this.$message.error(errorMessage)
          }
          console.error('完成工序失败:', error)
        } finally {
          this.completingProcess = false
        }
      })
    },
    async handleUpdateTask(task) {
      try {
        await workOrderTaskAPI.update(task.id, {
          quantity_completed: task.quantity_completed
        })
        // 不显示消息，避免频繁提示
      } catch (error) {
        this.$message.error('更新任务失败')
        console.error(error)
      }
    },
    async handleCompleteTask(task) {
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
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '操作失败'
          this.$message.error(errorMessage)
          console.error('完成任务失败:', error)
        } finally {
          this.completingTask = false
        }
      })
    },
    getProcessStatusType(status) {
      const types = {
        'pending': 'info',
        'in_progress': 'warning',
        'completed': 'success',
        'skipped': 'info'
      }
      return types[status] || 'info'
    },
    getTaskStatusType(status) {
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
    // 判断是否为制版工序（使用编码匹配）
    isPlateMakingProcess(process) {
      return process.process_code === 'CTP'
    },
    // 判断是否为物料相关工序（开料，使用编码匹配）
    // 注意：采购不属于施工单工序，采购任务通过其他系统管理
    isMaterialProcess(process) {
      return process.process_code === 'CUT'
    },
    // 根据状态获取物料状态标签类型
    getMaterialStatusTagTypeByStatus(status) {
      const statusMap = {
        'pending': 'info',
        'ordered': 'primary',
        'received': 'success',
        'cut': 'warning',
        'completed': 'success'
      }
      return statusMap[status] || 'info'
    },
    // 根据状态获取物料状态文本
    getMaterialStatusTextByStatus(status) {
      const statusMap = {
        'pending': '待采购',
        'ordered': '已下单',
        'received': '已回料',
        'cut': '已开料',
        'completed': '已完成'
      }
      return statusMap[status] || status
    },
    // 判断任务是否可以完成
    canCompleteTask(task, process) {
      // 制版任务：需要图稿已确认（如果是图稿任务）
      if (task.task_type === 'plate_making' && task.artwork && !task.artwork_confirmed) {
        return false
      }
      // 开料任务：需要物料已开料（如果存在开料工序，使用编码匹配）
      // 注意：采购不属于施工单工序，采购任务通过其他系统管理
      if (task.task_type === 'cutting' && process.process_code === 'CUT') {
        if (task.material_purchase_status !== 'cut') {
          return false
        }
      }
      return true
    },
    // 获取任务被阻止的原因
    getTaskBlockReason(task, process) {
      // 制版任务：需要图稿确认（如果是图稿任务）
      if (task.task_type === 'plate_making' && task.artwork && !task.artwork_confirmed) {
        return '需确认图稿'
      }
      // 开料任务：需要物料开料（如果存在开料工序，使用编码匹配）
      // 注意：采购不属于施工单工序，采购任务通过其他系统管理
      if (task.task_type === 'cutting' && process.process_code === 'CUT') {
        if (task.material_purchase_status !== 'cut') {
          return '需物料开料'
        }
      }
      return ''
    },
    showUpdateTaskDialog(task) {
      this.currentUpdateTask = { ...task }
      this.updateTaskForm = {
        quantity_completed: 0,  // 默认本次完成数量为0，用户输入增量值
        quantity_defective: 0,  // 默认本次不良品数量为0，用户输入增量值
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
      
      this.updateTaskDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.updateTaskForm) {
          this.$refs.updateTaskForm.clearValidate()
        }
      })
    },
    async handleUpdateTaskFromDialog() {
      if (!this.currentUpdateTask) return
      
      this.$refs.updateTaskForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        this.updatingTask = true
        try {
          // 传递增量值给后端（后端会累加）
          const data = {
            quantity_increment: this.updateTaskForm.quantity_completed || 0,  // 传递本次完成数量（增量）
            quantity_defective: this.updateTaskForm.quantity_defective || 0,  // 传递本次不良品数量（增量）
            version: this.currentUpdateTask.version,  // 传递版本号（乐观锁）
            notes: this.updateTaskForm.notes
          }
          
          // 设计图稿/设计刀模任务：需要传递图稿或刀模ID
          if (this.currentUpdateTask.work_content && (this.currentUpdateTask.work_content.includes('设计图稿') || this.currentUpdateTask.work_content.includes('更新图稿'))) {
            data.artwork_ids = this.updateTaskForm.artwork_ids
          }
          
          if (this.currentUpdateTask.work_content && (this.currentUpdateTask.work_content.includes('设计刀模') || this.currentUpdateTask.work_content.includes('更新刀模'))) {
            data.die_ids = this.updateTaskForm.die_ids
          }
          
          await workOrderTaskAPI.update_quantity(this.currentUpdateTask.id, data)
          this.$message.success('更新成功')
          this.updateTaskDialogVisible = false
          this.loadData()
        } catch (error) {
          const errorMessage = error.response?.data?.error || error.response?.data?.detail || 
                             (error.response?.data ? JSON.stringify(error.response.data) : error.message) || '更新失败'
          this.$message.error(errorMessage)
          console.error('更新任务失败:', error)
        } finally {
          this.updatingTask = false
        }
      })
    },
    showAddMaterialDialog() {
      this.materialForm = {
        material_id: null,
        notes: ''
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
    },
    getProcessDisplayDepartment(process) {
      // 如果有任务，根据任务的分派情况显示
      if (process.tasks && process.tasks.length > 0) {
        // 获取所有任务的分派部门（去重）
        const departments = process.tasks
          .map(task => task.assigned_department_name)
          .filter(dept => dept && dept.trim() !== '')
        
        if (departments.length === 0) {
          // 所有任务都未分派，显示工序级别的部门
          return process.department_name || '未分配部门'
        } else {
          // 去重
          const uniqueDepartments = [...new Set(departments)]
          if (uniqueDepartments.length === 1) {
            // 所有任务都分派到同一部门
            return uniqueDepartments[0]
          } else {
            // 任务分派到多个部门
            return uniqueDepartments.join('、') + ` (${uniqueDepartments.length}个部门)`
          }
        }
      }
      
      // 没有任务时，显示工序级别的部门
      return process.department_name || '未分配部门'
    },
    getPurchaseStatusType(status) {
      const typeMap = {
        pending: 'info',
        ordered: 'primary',
        received: 'success',
        cut: 'warning',
        completed: 'success'
      }
      return typeMap[status] || 'info'
    },
    getPurchaseStatusDisplay(status) {
      const statusMap = {
        pending: '待采购',
        ordered: '已下单',
        received: '已回料',
        cut: '已开料',
        completed: '已完成'
      }
      return statusMap[status] || status
    },
    getPrintingTypeDisplay(printingType) {
      const typeMap = {
        none: '不需要印刷',
        front: '正面印刷',
        back: '背面印刷',
        self_reverse: '自反印刷',
        reverse_gripper: '反咬口印刷',
        register: '套版印刷'
      }
      return typeMap[printingType] || printingType
    },
    handleUpdateMaterialStatus(row) {
      this.materialStatusForm = {
        id: row.id,
        material_name: `${row.material_name} (${row.material_code})`,
        current_status: row.purchase_status,
        purchase_status: '',
        purchase_date: row.purchase_date || '',
        received_date: row.received_date || '',
        cut_date: row.cut_date || ''
      }
      this.materialStatusDialogVisible = true
    },
    handleMaterialStatusChange() {
      // 当物料状态改变时，自动设置日期为今天（如果为空）
      const today = new Date().toISOString().split('T')[0]
      if (this.materialStatusForm.purchase_status === 'ordered' && !this.materialStatusForm.purchase_date) {
        this.materialStatusForm.purchase_date = today
      } else if (this.materialStatusForm.purchase_status === 'received' && !this.materialStatusForm.received_date) {
        this.materialStatusForm.received_date = today
      } else if (this.materialStatusForm.purchase_status === 'cut' && !this.materialStatusForm.cut_date) {
        this.materialStatusForm.cut_date = today
      }
    },
    resetMaterialStatusForm() {
      this.$refs.materialStatusForm && this.$refs.materialStatusForm.resetFields()
      this.materialStatusForm = {
        id: null,
        material_name: '',
        current_status: '',
        purchase_status: '',
        purchase_date: '',
        received_date: '',
        cut_date: ''
      }
    },
    async submitMaterialStatusUpdate() {
      this.$refs.materialStatusForm.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        this.updatingMaterialStatus = true
        try {
          const updateData = {
            purchase_status: this.materialStatusForm.purchase_status
          }
          
          // 根据状态添加相应的日期
          if (this.materialStatusForm.purchase_status === 'ordered' && this.materialStatusForm.purchase_date) {
            updateData.purchase_date = this.materialStatusForm.purchase_date
          }
          if (this.materialStatusForm.purchase_status === 'received' && this.materialStatusForm.received_date) {
            updateData.received_date = this.materialStatusForm.received_date
            // 如果之前没有采购日期，也更新
            if (!this.materialStatusForm.purchase_date) {
              updateData.purchase_date = this.materialStatusForm.received_date
            }
          }
          if (this.materialStatusForm.purchase_status === 'cut' && this.materialStatusForm.cut_date) {
            updateData.cut_date = this.materialStatusForm.cut_date
            // 如果之前没有回料日期，也更新
            if (!this.materialStatusForm.received_date) {
              updateData.received_date = this.materialStatusForm.cut_date
            }
            // 如果之前没有采购日期，也更新
            if (!this.materialStatusForm.purchase_date) {
              updateData.purchase_date = this.materialStatusForm.cut_date
            }
          }
          if (this.materialStatusForm.purchase_status === 'completed') {
            // 完成时，确保所有日期都已填写
            if (!this.materialStatusForm.cut_date) {
              updateData.cut_date = new Date().toISOString().split('T')[0]
            }
            if (!this.materialStatusForm.received_date) {
              updateData.received_date = updateData.cut_date
            }
            if (!this.materialStatusForm.purchase_date) {
              updateData.purchase_date = updateData.cut_date
            }
          }
          
          await workOrderMaterialAPI.update(this.materialStatusForm.id, updateData)
          
          this.$message.success('物料状态更新成功')
          this.materialStatusDialogVisible = false
          
          // 重新加载施工单数据
          await this.loadData()
        } catch (error) {
          console.error('更新物料状态失败:', error)
          this.$message.error('更新物料状态失败: ' + (error.response?.data?.detail || error.message))
        } finally {
          this.updatingMaterialStatus = false
        }
      })
    },
    async handleApprove(status) {
      // status: 'approved' 或 'rejected'
      if (!this.workOrder) return
      
      // 如果是拒绝，显示拒绝原因输入框并验证
      if (status === 'rejected') {
        this.showRejectionReason = true
        // 等待下一个 tick，确保 DOM 更新
        await this.$nextTick()
        // 验证拒绝原因
        if (!this.approvalForm.rejection_reason || this.approvalForm.rejection_reason.trim() === '') {
          this.$message.error('审核拒绝时，必须填写拒绝原因')
          return
        }
      } else {
        this.showRejectionReason = false
      }
      
      this.approving = true
      try {
        const requestData = {
          approval_status: status,
          approval_comment: this.approvalForm.comment || ''
        }
        
        // 如果是拒绝，添加拒绝原因
        if (status === 'rejected') {
          requestData.rejection_reason = this.approvalForm.rejection_reason || ''
        }
        
        await workOrderAPI.approve(this.workOrder.id, requestData)
        
        this.$message.success(status === 'approved' ? '审核通过' : '审核已拒绝')
        // 清空表单
        this.approvalForm.comment = ''
        this.approvalForm.rejection_reason = ''
        this.showRejectionReason = false
        
        // 重新加载数据
        await this.loadData()
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.response?.data?.detail || '审核失败'
        const errorDetails = error.response?.data?.details
        if (errorDetails && Array.isArray(errorDetails)) {
          this.$message.error(errorMsg + '：' + errorDetails.join('；'))
        } else {
          this.$message.error(errorMsg)
        }
        console.error('审核失败:', error)
      } finally {
        this.approving = false
      }
    },
    async handleResubmitForApproval() {
      // 重新提交审核
      if (!this.workOrder) return
      
      this.$confirm('确定要重新提交审核吗？修改施工单内容后，审核状态会自动重置为"待审核"。', '重新提交审核', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        this.resubmitting = true
        try {
          await workOrderAPI.resubmitForApproval(this.workOrder.id)
          this.$message.success('重新提交审核成功，审核状态已重置为"待审核"')
          // 重新加载数据
          await this.loadData()
        } catch (error) {
          const errorMsg = error.response?.data?.error || error.response?.data?.detail || '重新提交审核失败'
          this.$message.error(errorMsg)
          console.error('重新提交审核失败:', error)
        } finally {
          this.resubmitting = false
        }
      }).catch(() => {
        // 用户取消
      })
    },
    handlePrint() {
      // 创建新窗口用于打印
      const printWindow = window.open('', '_blank')
      const printContent = document.getElementById('print-area')
      
      if (!printContent) {
        this.$message.error('打印内容不存在')
        return
      }
      
      // 获取打印内容的HTML
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>施工单详情 - ${this.workOrder.order_number}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
              font-size: 13px;
              line-height: 1.8;
              color: #000;
            }
            .print-header {
              position: relative;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }
            .print-company {
              position: absolute;
              left: 0;
              top: 0;
              font-size: 14px;
              font-weight: bold;
            }
            .print-title {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              margin: 0 auto;
            }
            .print-order-number {
              position: absolute;
              right: 0;
              top: 0;
              font-size: 16px;
              font-weight: bold;
              color: #f00;
            }
            .print-dates {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-size: 13px;
            }
            .print-content {
              min-height: calc(100vh - 200px);
              margin-bottom: 60px;
            }
            .print-section {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .print-section-title {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 8px;
              padding: 3px 0;
              border-bottom: 1px solid #000;
            }
            .print-info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .print-info-table td {
              padding: 5px 8px;
              border: 1px solid #000;
              font-size: 13px;
            }
            .print-label {
              width: 120px;
              font-weight: bold;
              background-color: #f0f0f0;
            }
            .print-value {
              width: auto;
            }
            .print-data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            .print-data-table thead {
              background-color: #f0f0f0;
            }
            .print-data-table th {
              padding: 8px;
              border: 1px solid #000;
              text-align: center;
              font-weight: bold;
              font-size: 13px;
            }
            .print-data-table td {
              padding: 6px 8px;
              border: 1px solid #000;
              font-size: 13px;
              text-align: center;
            }
            .print-data-table tbody td:first-child {
              text-align: left;
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .print-data-table thead th:first-child {
              background-color: #f0f0f0;
            }
            .print-notes {
              padding: 8px;
              border: 1px solid #000;
              font-size: 13px;
              white-space: pre-wrap;
              line-height: 1.6;
            }
            .print-processes-list {
              padding: 8px;
              border: 1px solid #000;
              font-size: 13px;
              line-height: 2;
            }
            .print-process-item {
              display: inline;
            }
            .print-checkbox {
              display: inline-block;
              width: 16px;
              height: 16px;
              border: 1px solid #000;
              margin-right: 8px;
              text-align: center;
              line-height: 14px;
              font-size: 14px;
              vertical-align: middle;
              color: #0066cc;
            }
            .print-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              padding: 10px 0;
              border-top: 1px solid #000;
              background-color: #fff;
              margin-top: 20px;
            }
            .print-footer-table {
              width: 100%;
              border-collapse: collapse;
            }
            .print-footer-table td {
              padding: 5px 10px;
              font-size: 13px;
            }
            .print-footer-table .print-label {
              width: 80px;
              font-weight: bold;
            }
            @media print {
              body {
                margin: 0;
              }
              .print-content {
                margin-bottom: 80px;
              }
              .print-footer {
                position: fixed;
                bottom: 0;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
        </html>
      `
      
      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      // 等待内容加载完成后打印
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
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

.detail-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
  padding: 0;
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

/* 打印区域样式（屏幕显示时隐藏） */
.print-area {
  display: none;
}

@media print {
  .print-area {
    display: block;
  }
  .workorder-detail > .el-card {
    display: none;
  }
}
</style>

