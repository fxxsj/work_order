<template>
  <el-dialog
    title="更新任务"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item label="任务内容">
        <el-input :value="task ? task.work_content : ''" disabled />
      </el-form-item>
      <el-form-item label="生产数量">
        <el-input-number
          :value="task ? task.production_quantity : 0"
          disabled
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item v-if="task" label="当前完成数量">
        <el-input-number
          :value="task.quantity_completed || 0"
          disabled
          style="width: 100%;"
        />
      </el-form-item>
      <el-form-item label="本次完成数量" prop="quantity_completed" required>
        <el-input-number
          v-model="form.quantity_completed"
          :min="0"
          :max="maxCompleted"
          style="width: 100%;"
        />
        <div v-if="task && task.production_quantity" style="color: #909399; font-size: 12px; margin-top: 4px;">
          计划数量：{{ task.production_quantity }}，
          当前完成：{{ task.quantity_completed || 0 }}，
          更新后：{{ (task.quantity_completed || 0) + (form.quantity_completed || 0) }}
          <span v-if="(task.quantity_completed || 0) + (form.quantity_completed || 0) >= task.production_quantity" style="color: #67C23A;">
            （完成数量将达到计划数量，状态将自动标记为已完成）
          </span>
          <span v-else style="color: #E6A23C;">
            （完成数量未达到计划数量，状态将保持为进行中）
          </span>
        </div>
      </el-form-item>
      <el-form-item label="本次不良品数量">
        <el-input-number
          v-model="form.quantity_defective"
          :min="0"
          style="width: 100%;"
        />
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          当前不良品：{{ task ? (task.quantity_defective || 0) : 0 }}，
          更新后：{{ (task ? (task.quantity_defective || 0) : 0) + (form.quantity_defective || 0) }}
        </div>
      </el-form-item>
      <el-form-item
        v-if="isDesignArtworkTask"
        label="选择图稿"
        prop="artwork_ids"
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
  name: 'UpdateTaskDialog',
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
        notes: ''
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
    maxCompleted() {
      if (!this.task) return 999999
      return this.task.production_quantity - (this.task.quantity_completed || 0)
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
        this.form = {
          quantity_completed: 0,
          quantity_defective: 0,
          artwork_ids: [],
          die_ids: [],
          notes: ''
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
        notes: ''
      }
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleSubmit() {
      this.$refs.form.validate((valid) => {
        if (!valid) return
        if (!this.task) return

        const data = {
          quantity_increment: this.form.quantity_completed || 0,
          quantity_defective: this.form.quantity_defective || 0,
          version: this.task.version,
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
