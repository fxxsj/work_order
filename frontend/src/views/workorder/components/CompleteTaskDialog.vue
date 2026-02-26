<template>
  <el-dialog
    title="完成任务"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item label="状态">
        <el-tag type="success">
          已完成
        </el-tag>
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          强制完成任务，状态将标记为已完成
        </div>
      </el-form-item>

      <el-form-item
        v-if="isPlateMakingTask"
        label="完成数量"
      >
        <el-input-number
          v-model="form.quantity_completed"
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
        v-else
        label="当前完成数量"
      >
        <el-input-number
          :value="task ? (task.quantity_completed || 0) : 0"
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
          v-model="form.completion_reason"
          type="textarea"
          :rows="3"
          placeholder="请输入完成理由（可选，用于说明为什么在完成数量小于生产数量时强制完成）"
        />
      </el-form-item>

      <el-form-item
        v-if="isDesignArtworkTask"
        label="选择图稿"
        prop="artwork_ids"
        :rules="[{ required: true, message: '请至少选择一个图稿', trigger: 'change' }]"
      >
        <el-select
          v-model="form.artwork_ids"
          multiple
          filterable
          placeholder="请选择图稿"
          style="width: 100%;"
          :loading="loadingArtworks"
          @focus="$emit('load-artworks')"
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
        :rules="[{ required: true, message: '请至少选择一个刀模', trigger: 'change' }]"
      >
        <el-select
          v-model="form.die_ids"
          multiple
          filterable
          placeholder="请选择刀模"
          style="width: 100%;"
          :loading="loadingDies"
          @focus="$emit('load-dies')"
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
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入任务备注（可选）"
        />
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="handleCancel">
        取消
      </el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
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
    },
    artworkList: {
      type: Array,
      default: () => []
    },
    dieList: {
      type: Array,
      default: () => []
    },
    loadingArtworks: {
      type: Boolean,
      default: false
    },
    loadingDies: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
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
    isPlateMakingTask() {
      return this.task && this.task.task_type === 'plate_making'
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
    visible(val) {
      if (val && this.task) {
        if (this.isPlateMakingTask) {
          this.form = {
            quantity_completed: 1,
            quantity_defective: this.task.quantity_defective || 0,
            artwork_ids: [],
            die_ids: [],
            notes: '',
            completion_reason: ''
          }
        } else {
          const qty = this.task.quantity_completed != null
            ? this.task.quantity_completed
            : (this.task.production_quantity != null ? this.task.production_quantity : 0)
          this.form = {
            quantity_completed: qty,
            quantity_defective: this.task.quantity_defective || 0,
            artwork_ids: [],
            die_ids: [],
            notes: '',
            completion_reason: ''
          }
        }
      }
    }
  },
  methods: {
    handleClose() {
      this.$refs.form && this.$refs.form.clearValidate()
      this.form = {
        quantity_completed: 0,
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: '',
        completion_reason: ''
      }
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return

        const data = {
          completion_reason: this.form.completion_reason,
          quantity_defective: this.form.quantity_defective || 0,
          notes: this.form.notes
        }

        if (this.isDesignArtworkTask) {
          data.artwork_ids = this.form.artwork_ids
        }

        if (this.isDesignDieTask) {
          data.die_ids = this.form.die_ids
        }

        this.$emit('submit', { taskId: this.task.id, data })
      })
    }
  }
}
</script>
