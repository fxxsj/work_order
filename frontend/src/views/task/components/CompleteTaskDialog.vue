<template>
  <el-dialog
    title="完成任务"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="formData"
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
        v-if="task && task.task_type === 'plate_making'"
        label="完成数量"
      >
        <el-input-number
          v-model="formData.quantity_completed"
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
        v-if="task && task.task_type !== 'plate_making'"
        label="当前完成数量"
      >
        <el-input-number
          :value="task.quantity_completed || 0"
          disabled
          style="width: 100%;"
        />
        <div v-if="task && task.production_quantity" style="color: #909399; font-size: 12px; margin-top: 4px;">
          计划数量：{{ task.production_quantity }}
          <span v-if="(task.quantity_completed || 0) < task.production_quantity" style="color: #E6A23C; margin-left: 10px;">
            （当前完成数量小于计划数量，将强制标记为已完成）
          </span>
        </div>
      </el-form-item>

      <el-form-item label="完成理由">
        <el-input
          v-model="formData.completion_reason"
          type="textarea"
          :rows="3"
          placeholder="请输入完成理由（可选，用于说明为什么在完成数量小于生产数量时强制完成）"
        />
      </el-form-item>

      <el-form-item
        v-if="isDesignArtworkTask"
        label="选择图稿"
        prop="artwork_ids"
      >
        <el-select
          v-model="formData.artwork_ids"
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
        v-if="isDesignDieTask"
        label="选择刀模"
        prop="die_ids"
      >
        <el-select
          v-model="formData.die_ids"
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
          v-model="formData.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入任务备注（可选）"
        />
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="handleClose">
        取消
      </el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">
        确定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import { artworkAPI, dieAPI } from '@/api/modules'

export default {
  name: 'CompleteTaskDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    task: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      submitting: false,
      artworkList: [],
      dieList: [],
      loadingArtworks: false,
      loadingDies: false,
      formData: {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: '',
        completion_reason: ''
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
    },
    isDesignArtworkTask() {
      return this.task && this.task.work_content &&
        (this.task.work_content.includes('设计图稿') || this.task.work_content.includes('更新图稿'))
    },
    isDesignDieTask() {
      return this.task && this.task.work_content &&
        (this.task.work_content.includes('设计刀模') || this.task.work_content.includes('更新刀模'))
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
        if (this.isDesignArtworkTask) {
          this.loadArtworkList()
        }
        if (this.isDesignDieTask) {
          this.loadDieList()
        }
      }
    }
  },
  methods: {
    initFormData(task) {
      // 制版任务：完成数量固定为1
      if (task.task_type === 'plate_making') {
        this.formData = {
          quantity_completed: 1,
          quantity_defective: task.quantity_defective || 0,
          artwork_ids: [],
          die_ids: [],
          notes: '',
          completion_reason: ''
        }
      } else {
        // 其他任务
        const qty = task.quantity_completed != null ? task.quantity_completed
          : (task.production_quantity != null ? task.production_quantity : 0)
        this.formData = {
          quantity_completed: qty,
          quantity_defective: task.quantity_defective || 0,
          artwork_ids: [],
          die_ids: [],
          notes: '',
          completion_reason: ''
        }
      }
    },
    async loadArtworkList() {
      if (this.artworkList.length > 0) return

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
      if (this.dieList.length > 0) return

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
    handleConfirm() {
      const data = {
        completion_reason: this.formData.completion_reason,
        quantity_defective: this.formData.quantity_defective || 0,
        notes: this.formData.notes
      }

      // 设计图稿/设计刀模任务：需要传递图稿或刀模ID
      if (this.isDesignArtworkTask) {
        data.artwork_ids = this.formData.artwork_ids
      }
      if (this.isDesignDieTask) {
        data.die_ids = this.formData.die_ids
      }

      this.$emit('confirm', data)
    },
    handleClose() {
      this.dialogVisible = false
      this.resetForm()
    },
    resetForm() {
      this.formData = {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: '',
        completion_reason: ''
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
