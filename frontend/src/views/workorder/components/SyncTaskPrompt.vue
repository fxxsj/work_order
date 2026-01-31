<template>
  <el-dialog
    title="任务同步确认"
    :visible.sync="dialogVisible"
    width="600px"
    :before-close="handleClose"
  >
    <div v-loading="loading">
      <!-- 预览警告 -->
      <el-alert
        v-if="preview && preview.tasks_to_remove > 0"
        title="警告"
        :description="`将删除 ${preview.tasks_to_remove} 个草稿任务，此操作不可恢复`"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 15px;"
      />

      <!-- 同步预览摘要 -->
      <div v-if="preview" class="sync-preview">
        <el-card shadow="never">
          <div slot="header" class="preview-header">
            <span>同步预览</span>
          </div>
          <div class="preview-content">
            <div class="preview-item">
              <i class="el-icon-delete"></i>
              <span>将删除 <strong>{{ preview.tasks_to_remove }}</strong> 个草稿任务</span>
            </div>
            <div class="preview-item">
              <i class="el-icon-plus"></i>
              <span>将新增 <strong>{{ preview.tasks_to_add }}</strong> 个任务</span>
            </div>
            <div v-if="preview.tasks_to_remove > 0 || preview.tasks_to_add > 0" class="preview-item affected">
              <i class="el-icon-warning-outline"></i>
              <span>此操作将影响施工单的任务结构</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 无需同步提示 -->
      <el-alert
        v-if="preview && preview.tasks_to_remove === 0 && preview.tasks_to_add === 0"
        title="无需同步"
        description="当前工序配置与任务一致，无需进行同步操作"
        type="success"
        :closable="false"
        show-icon
      />
    </div>

    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button
        v-if="preview && (preview.tasks_to_remove > 0 || preview.tasks_to_add > 0)"
        type="primary"
        :loading="syncing"
        @click="handleConfirm"
      >
        确认同步
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { workOrderAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'SyncTaskPrompt',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    workOrderId: {
      type: [Number, String],
      required: true
    },
    processIds: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      loading: false,
      syncing: false,
      preview: null
    }
  },
  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        if (!val) {
          this.handleClose()
        }
      }
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadPreview()
      }
    }
  },
  methods: {
    async loadPreview() {
      if (!this.workOrderId || !this.processIds || this.processIds.length === 0) {
        ErrorHandler.showMessage('缺少必要参数', '加载同步预览')
        return
      }

      this.loading = true
      try {
        const result = await workOrderAPI.syncTasksPreview(this.workOrderId, this.processIds)
        if (result.data) {
          this.preview = result.data.preview || result.data
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '加载同步预览')
        this.handleClose()
      } finally {
        this.loading = false
      }
    },
    async handleConfirm() {
      if (!this.preview) {
        ErrorHandler.showMessage('请先加载同步预览', '任务同步')
        return
      }

      // 如果有删除操作，需要额外确认
      if (this.preview.tasks_to_remove > 0) {
        try {
          await ErrorHandler.confirm(
            `确认要删除 ${this.preview.tasks_to_remove} 个草稿任务吗？此操作不可恢复`,
            '确认删除',
            {
              confirmButtonText: '确认删除',
              cancelButtonText: '取消',
              type: 'warning'
            }
          )
        } catch {
          return
        }
      }

      this.syncing = true
      try {
        const result = await workOrderAPI.syncTasksExecute(this.workOrderId, this.processIds)
        if (result.data) {
          const message = result.data.message || '任务同步完成'
          ErrorHandler.showSuccess(message)
          this.$emit('synced', result.data)
          this.handleClose()
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '任务同步')
      } finally {
        this.syncing = false
      }
    },
    handleClose() {
      this.preview = null
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.preview-header {
  font-weight: bold;
  color: #303133;
}

.preview-content {
  padding: 10px 0;
}

.preview-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
  color: #606266;
}

.preview-item:last-child {
  border-bottom: none;
}

.preview-item i {
  font-size: 20px;
  margin-right: 12px;
}

.preview-item.affected {
  color: #E6A23C;
}

.preview-item.affected i {
  color: #E6A23C;
}

.preview-item strong {
  color: #303133;
  font-size: 16px;
  margin: 0 4px;
}

.dialog-footer {
  text-align: right;
}
</style>
