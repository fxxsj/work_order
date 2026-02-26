<template>
  <div v-loading="loading" class="workorder-detail">
    <el-card v-if="workOrder">
      <!-- 顶部操作栏 -->
      <WorkOrderHeaderActions
        :can-edit="canEdit"
        @back="$router.back()"
        @print="handlePrint"
        @edit="handleEdit"
        @status-change="handleStatusChange"
      />

      <!-- 基本信息 -->
      <WorkOrderBasicInfo :work-order="workOrder" />

      <!-- 审核流程 -->
      <WorkOrderApproval
        :work-order="workOrder"
        :can-approve="canApprove"
        :can-resubmit="canResubmit"
        :can-request-reapproval="canRequestReapproval"
        :approving="approving"
        :resubmitting="resubmitting"
        :requesting-reapproval="requestingReapproval"
        :approval-form="approvalForm"
        :reapproval-form="reapprovalForm"
        :approval-rules="approvalRules"
        :show-rejection-reason="showRejectionReason"
        @approve="handleApprove"
        @resubmit="handleResubmitForApproval"
        @request-reapproval="handleRequestReapproval"
        @update:approvalForm="approvalForm = $event"
        @update:reapprovalForm="reapprovalForm = $event"
      />


      <!-- 图稿和刀模信息 -->
      <WorkOrderArtworkDie
        :artwork-codes="workOrder.artwork_codes"
        :artwork-names="workOrder.artwork_names"
        :die-codes="workOrder.die_codes"
        :die-names="workOrder.die_names"
        :printing-type="workOrder.printing_type"
        :printing-colors-display="workOrder.printing_colors_display"
        :artwork-colors="workOrder.artwork_colors"
      />

      <!-- 物料信息 -->
      <WorkOrderMaterials
        :materials="workOrder.materials"
        @add-material="showAddMaterialDialog"
        @update-status="handleUpdateMaterialStatus"
      />

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
            <el-input :value="materialStatusForm.material_name" disabled />
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
              />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="materialStatusForm.purchase_status === 'ordered'"
            label="采购日期"
            prop="purchase_date"
          >
            <el-date-picker
              v-model="materialStatusForm.purchase_date"
              type="date"
              placeholder="选择采购日期"
              style="width: 100%;"
              value-format="yyyy-MM-dd"
            />
          </el-form-item>
          <el-form-item
            v-if="materialStatusForm.purchase_status === 'received'"
            label="回料日期"
            prop="received_date"
          >
            <el-date-picker
              v-model="materialStatusForm.received_date"
              type="date"
              placeholder="选择回料日期"
              style="width: 100%;"
              value-format="yyyy-MM-dd"
            />
          </el-form-item>
          <el-form-item
            v-if="materialStatusForm.purchase_status === 'cut'"
            label="开料日期"
            prop="cut_date"
          >
            <el-date-picker
              v-model="materialStatusForm.cut_date"
              type="date"
              placeholder="选择开料日期"
              style="width: 100%;"
              value-format="yyyy-MM-dd"
            />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="materialStatusDialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" :loading="updatingMaterialStatus" @click="submitMaterialStatusUpdate">
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
            <el-input :value="currentUpdateTask?.work_content" disabled />
          </el-form-item>
          <el-form-item label="生产数量">
            <el-input-number
              :value="currentUpdateTask?.production_quantity"
              disabled
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item v-if="currentUpdateTask" label="当前完成数量">
            <el-input-number
              :value="currentUpdateTask.quantity_completed || 0"
              disabled
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="本次完成数量" prop="quantity_completed" required>
            <el-input-number
              v-model="updateTaskForm.quantity_completed"
              :min="0"
              :max="currentUpdateTask ? (currentUpdateTask.production_quantity - (currentUpdateTask.quantity_completed || 0)) : 999999"
              style="width: 100%;"
            />
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
            />
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
              />
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
              />
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
            />
          </el-form-item>
        </el-form>
        <div slot="footer">
          <el-button @click="updateTaskDialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" :loading="updatingTask" @click="handleUpdateTaskFromDialog">
            确定
          </el-button>
        </div>
      </el-dialog>

      <!-- 完成工序对话框 -->
      <el-dialog
        title="完成工序"
        :visible.sync="completeProcessDialogVisible"
        width="600px"
      >
        <el-form
          ref="completeProcessForm"
          :model="completeProcessForm"
          label-width="120px"
          :rules="completeProcessRules"
        >
          <el-form-item label="工序名称">
            <el-input :value="currentProcess ? currentProcess.process_name : ''" disabled />
          </el-form-item>
          <el-form-item label="任务完成情况">
            <div v-if="currentProcess && currentProcess.tasks">
              <div style="margin-bottom: 10px;">
                <span>总任务数：{{ currentProcess.tasks.length }}</span>
                <span style="margin-left: 20px;">已完成：{{ getCompletedTaskCount(currentProcess.tasks) }}</span>
                <span v-if="getIncompleteTaskCount(currentProcess.tasks) > 0" style="margin-left: 20px; color: #E6A23C;">
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
                  <p style="margin-top: 5px;">
                    建议：先完成所有任务，工序会自动完成。如需强制完成，请勾选下方选项并填写原因。
                  </p>
                </div>
              </el-alert>
            </div>
          </el-form-item>
          <el-form-item label="完成数量">
            <el-input-number
              v-model="completeProcessForm.quantity_completed"
              :min="0"
              style="width: 100%;"
            />
          </el-form-item>
          <el-form-item label="不良品数量">
            <el-input-number
              v-model="completeProcessForm.quantity_defective"
              :min="0"
              style="width: 100%;"
            />
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
            />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="completeProcessDialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" :loading="completingProcess" @click="handleCompleteProcess">
            确定
          </el-button>
        </div>
      </el-dialog>

      <!-- 其他信息 -->
      <WorkOrderNotes :notes="workOrder.notes" />

      <!-- 产品列表 -->
      <WorkOrderProducts
        v-if="workOrder.products && workOrder.products.length > 0"
        :products="workOrder.products"
      />
    </el-card>

    <!-- 打印区域（隐藏，仅在打印时显示） -->
    <div v-if="workOrder" id="print-area" class="print-area">
      <div class="print-header">
        <div class="print-company">
          {{ companyName }}
        </div>
        <div class="print-title">
          生产施工单
        </div>
        <div class="print-order-number">
          No: {{ workOrder.order_number }}
        </div>
      </div>

      <div class="print-dates">
        <span>下单日期：{{ workOrder.order_date | formatDate }}</span>
        <span>交货日期：{{ workOrder.delivery_date | formatDate }}</span>
      </div>

      <div class="print-content">
        <!-- 基本信息 -->
        <div class="print-section">
          <div class="print-section-title">
            基本信息
          </div>
          <table class="print-info-table">
            <tr>
              <td class="print-label">
                客户：
              </td>
              <td class="print-value">
                {{ workOrder.customer_name }}
              </td>
              <td class="print-label">
                产品名称：
              </td>
              <td class="print-value">
                {{ workOrder.product_name || '-' }}
              </td>
            </tr>
            <tr>
              <td class="print-label">
                生产数量：
              </td>
              <td class="print-value">
                {{ ((workOrder.production_quantity || 0) + (workOrder.defective_quantity || 0)) }} 车
              </td>
              <td class="print-label">
                优先级：
              </td>
              <td class="print-value">
                {{ workOrder.priority_display }}
              </td>
            </tr>
            <tr v-if="workOrder.actual_delivery_date">
              <td class="print-label">
                实际交货日期：
              </td>
              <td class="print-value">
                {{ workOrder.actual_delivery_date | formatDate }}
              </td>
              <td class="print-label"></td>
              <td class="print-value"></td>
            </tr>
            <tr v-if="workOrder.approval_comment">
              <td class="print-label">
                审核意见：
              </td>
              <td class="print-value" colspan="3">
                {{ workOrder.approval_comment }}
              </td>
            </tr>
            <tr v-if="workOrder.specification">
              <td class="print-label">
                产品规格：
              </td>
              <td class="print-value" colspan="3">
                {{ workOrder.specification }}
              </td>
            </tr>
          </table>
        </div>

        <!-- 工序信息 -->
        <div v-if="workOrder.order_processes && workOrder.order_processes.length > 0" class="print-section">
          <div class="print-section-title">
            工序信息
          </div>
          <table class="print-data-table">
            <thead>
              <tr>
                <th></th>
                <th v-for="process in workOrder.order_processes" :key="process.id">
                  {{ process.process_name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="print-label" style="font-weight: bold;">
                  完成数量
                </td>
                <td v-for="process in workOrder.order_processes" :key="process.id">
                  {{ process.quantity_completed || '' }}
                </td>
              </tr>
              <tr>
                <td class="print-label" style="font-weight: bold;">
                  完成日期
                </td>
                <td v-for="process in workOrder.order_processes" :key="process.id">
                  {{ process.actual_end_time ? formatDate(process.actual_end_time) : '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 图稿和刀模信息 -->
        <div class="print-section">
          <div class="print-section-title">
            图稿和刀模
          </div>
          <table class="print-info-table">
            <tr>
              <td class="print-label">
                图稿（CTP版）：
              </td>
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
              <td class="print-label">
                印刷要求：
              </td>
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
              <td class="print-label">
                刀模：
              </td>
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
        <div v-if="workOrder.materials && workOrder.materials.length > 0" class="print-section">
          <div class="print-section-title">
            物料信息
          </div>
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
        <div v-if="workOrder.notes" class="print-section">
          <div class="print-section-title">
            备注
          </div>
          <div class="print-notes">
            {{ workOrder.notes }}
          </div>
        </div>

        <!-- 产品列表 -->
        <div v-if="workOrder.products && workOrder.products.length > 0" class="print-section">
          <div class="print-section-title">
            产品列表
          </div>
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
            <td class="print-label">
              业务员：
            </td>
            <td class="print-value">
              {{ workOrder.customer_detail && workOrder.customer_detail.salesperson_name ? workOrder.customer_detail.salesperson_name : '-' }}
            </td>
            <td class="print-label">
              制表：
            </td>
            <td class="print-value">
              {{ workOrder.manager_name || '-' }}
            </td>
            <td class="print-label">
              审核：
            </td>
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
    <WorkOrderProcessTasks
      v-if="workOrder"
      :work-order="workOrder"
      :view-mode="workflowViewMode"
      :all-tasks="getAllTasks()"
      @view-mode-change="workflowViewMode = $event"
      @add-process="showAddProcessDialog"
      @process-click="handleProcessClickFromFlowChart"
      @start-process="handleStartProcess"
      @complete-process="showCompleteProcessDialog"
      @reassign-process="showReassignProcessDialog"
      @complete-task="handleCompleteTask"
      @update-task="showUpdateTaskDialog"
      @assign-task="showTaskAssignDialog"
      @split-task="showTaskSplitDialog"
    />

    <!-- 添加工序对话框 -->
    <AddProcessDialog
      :visible.sync="addProcessDialog"
      :process-list="processList"
      :next-sequence="workOrder ? workOrder.order_processes.length + 1 : 1"
      :loading="addingProcess"
      @submit="handleAddProcess"
    />

    <!-- 添加物料对话框 -->
    <AddMaterialDialog
      :visible.sync="addMaterialDialog"
      :material-list="materialList"
      :loading="addingMaterial"
      @submit="handleAddMaterial"
    />

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
          <el-tag type="success">
            已完成
          </el-tag>
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
          />
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
          />
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
          />
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
            />
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
            />
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
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="completeTaskDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="completingTask" @click="handleConfirmCompleteTask">
          确定
        </el-button>
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
          <el-input :value="currentReassignProcess ? currentReassignProcess.process_name : ''" disabled />
        </el-form-item>
        <el-form-item label="任务数量">
          <el-input :value="currentReassignProcess && currentReassignProcess.tasks ? currentReassignProcess.tasks.length : 0" disabled />
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
            />
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
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="reassignProcessForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写调整原因（必填，便于追溯）"
          />
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
          />
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
        <el-button @click="reassignProcessDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="reassigningProcess" @click="handleReassignProcess">
          确定
        </el-button>
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
          <el-input :value="currentTask?.work_content" disabled />
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
            />
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
            />
          </el-select>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input
            v-model="taskAssignForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入调整原因（可选）"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="taskAssignForm.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="taskAssignDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="assigningTask" @click="handleTaskAssign">
          确定
        </el-button>
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
          <el-input :value="currentSplitTask?.work_content" disabled />
        </el-form-item>
        <el-form-item label="生产数量">
          <el-input-number
            :value="currentSplitTask?.production_quantity"
            disabled
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="子任务列表" prop="splits">
          <div style="margin-bottom: 10px;">
            <el-button type="primary" size="small" @click="addSplitItem">
              添加子任务
            </el-button>
            <span style="color: #909399; font-size: 12px; margin-left: 10px;">
              至少需要2个子任务，子任务数量总和不能超过父任务数量
            </span>
          </div>
          <el-table :data="splitForm.splits" border style="width: 100%;">
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
                  :max="currentSplitTask?.production_quantity || 999999"
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
                  :disabled="splitForm.splits.length <= 2"
                  @click="removeSplitItem(scope.$index)"
                />
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
        <el-button @click="splitDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="splittingTask" @click="handleSplitTask">
          确定拆分
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Vue from 'vue'
import {
  workOrderAPI,
  materialAPI,
  workOrderProcessAPI,
  workOrderMaterialAPI,
  workOrderTaskAPI,
  departmentAPI,
  artworkAPI,
  dieAPI,
  processAPI,
  authAPI
} from '@/api/modules'
import WorkOrderHeaderActions from './components/WorkOrderHeaderActions.vue'
import WorkOrderBasicInfo from './components/WorkOrderBasicInfo.vue'
import WorkOrderArtworkDie from './components/WorkOrderArtworkDie.vue'
import WorkOrderNotes from './components/WorkOrderNotes.vue'
import WorkOrderProducts from './components/WorkOrderProducts.vue'
import WorkOrderMaterials from './components/WorkOrderMaterials.vue'
import WorkOrderApproval from './components/WorkOrderApproval.vue'
import WorkOrderProcessTasks from './components/WorkOrderProcessTasks.vue'
import AddMaterialDialog from './components/AddMaterialDialog.vue'
import AddProcessDialog from './components/AddProcessDialog.vue'
// 配置文件（默认值）
const config = {
  companyName: '肇庆市高要区新西彩包装有限公司'
}

export default {
  name: 'WorkOrderDetail',
  components: {
    WorkOrderHeaderActions,
    WorkOrderBasicInfo,
    WorkOrderArtworkDie,
    WorkOrderNotes,
    WorkOrderProducts,
    WorkOrderMaterials,
    WorkOrderApproval,
    WorkOrderProcessTasks,
    AddMaterialDialog,
    AddProcessDialog
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
  data() {
    return {
      loading: false,
      workOrder: null,
      workflowViewMode: 'list', // 'timeline', 'flowchart', 'list'
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
      addingMaterial: false,
      addingProcess: false,
      approving: false,
      resubmitting: false,
      requestingReapproval: false,
      approvalForm: {
        comment: '',
        rejection_reason: ''
      },
      reapprovalForm: {
        reason: ''
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
    // 检查是否可以请求重新审核（制表人、创建人或有编辑权限的用户）
    canRequestReapproval() {
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
    },
    // 检查是否可以编辑
    canEdit() {
      const userInfo = this.$store.getters.currentUser
      if (!userInfo || !this.workOrder) return false
      // 检查是否是制表人或创建人
      if (this.workOrder.manager === userInfo.id || this.workOrder.created_by === userInfo.id) {
        return true
      }
      // 检查是否有编辑权限
      return true
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
    getAllTasks() {
      if (!this.workOrder || !this.workOrder.order_processes) {
        return []
      }
      const allTasks = []
      this.workOrder.order_processes.forEach(process => {
        if (process.tasks && process.tasks.length > 0) {
          allTasks.push(...process.tasks)
        }
      })
      return allTasks
    },
    handleProcessClickFromFlowChart(process) {
      // 滚动到对应的工序位置
      const element = document.querySelector(`[data-process-id="${process.id}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
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
      this.addProcessDialog = true
    },
    async handleAddProcess({ process_id: processId, sequence }) {
      this.addingProcess = true
      try {
        await workOrderAPI.addProcess(this.workOrder.id, { process_id: processId, sequence })
        this.$message.success('添加成功')
        this.addProcessDialog = false
        this.loadData()
      } catch (error) {
        this.$message.error('添加失败')
        console.error(error)
      } finally {
        this.addingProcess = false
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
          const response = await authAPI.getUsersByDepartment(departmentId)
          this.userList = response || []
        } else {
          // 如果没有指定部门，获取所有用户（排除超级管理员）
          const response = await authAPI.getUsersByDepartment(null)
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
    getStatusText(status) {
      const statusMap = {
        pending: '待开始',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
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
      this.addMaterialDialog = true
    },
    async handleAddMaterial({ material_id: materialId, notes }) {
      this.addingMaterial = true
      try {
        await workOrderAPI.addMaterial(this.workOrder.id, { material_id: materialId, notes })
        this.$message.success('添加成功')
        this.addMaterialDialog = false
        this.loadData()
      } catch (error) {
        this.$message.error('添加失败')
        console.error(error)
      } finally {
        this.addingMaterial = false
      }
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
    async handleRequestReapproval() {
      // 请求重新审核
      if (!this.workOrder) return

      this.$confirm('确定要请求重新审核吗？请求后，施工单状态将重置为"待审核"，需要重新审核后才能开始生产。', '请求重新审核', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.requestingReapproval = true
        try {
          const response = await workOrderAPI.requestReapproval(this.workOrder.id, {
            reason: this.reapprovalForm.reason
          })
          this.$message.success(response.data?.message || '重新审核请求已提交，已通知原审核人')
          // 重置表单
          this.reapprovalForm.reason = ''
          // 重新加载数据
          await this.loadData()
        } catch (error) {
          const errorMsg = error.response?.data?.error || error.response?.data?.detail || '请求重新审核失败'
          this.$message.error(errorMsg)
          console.error('请求重新审核失败:', error)
        } finally {
          this.requestingReapproval = false
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

