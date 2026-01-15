<template>
  <el-dialog
    title="更新任务"
    :visible.sync="dialogVisible"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="form"
      :model="formData"
      label-width="120px"
    >
      <el-form-item label="任务内容">
        <el-input :value="task?.work_content" disabled></el-input>
      </el-form-item>

      <el-form-item label="生产数量">
        <el-input-number
          :value="task?.production_quantity"
          disabled
          style="width: 100%;"
        ></el-input-number>
      </el-form-item>

      <el-form-item label="当前完成数量" v-if="task">
        <el-input-number
          :value="task.quantity_completed || 0"
          disabled
          style="width: 100%;"
        ></el-input-number>
      </el-form-item>

      <el-form-item label="本次完成数量" prop="quantity_completed" required>
        <el-input-number
          v-model="formData.quantity_completed"
          :min="0"
          :max="task?.production_quantity ? (task.production_quantity - (task.quantity_completed || 0)) : 999999"
          style="width: 100%;"
        ></el-input-number>
        <div v-if="task?.production_quantity" style="color: #909399; font-size: 12px; margin-top: 4px;">
          计划数量：{{ task.production_quantity }}，
          当前完成：{{ task.quantity_completed || 0 }}，
          更新后：{{ (task.quantity_completed || 0) + (formData.quantity_completed || 0) }}
          <span v-if="(task.quantity_completed || 0) + (formData.quantity_completed || 0) >= task.production_quantity" style="color: #67C23A;">
            （完成数量将达到计划数量，状态将自动标记为已完成）
          </span>
          <span v-else style="color: #E6A23C;">
            （完成数量未达到计划数量，状态将保持为进行中）
          </span>
        </div>
      </el-form-item>

      <el-form-item label="本次不良品数量">
        <el-input-number
          v-model="formData.quantity_defective"
          :min="0"
          style="width: 100%;"
        ></el-input-number>
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          当前不良品：{{ task?.quantity_defective || 0 }}，
          更新后：{{ (task?.quantity_defective || 0) + (formData.quantity_defective || 0) }}
        </div>
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
          ></el-option>
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
          ></el-option>
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
        ></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="submitting">确定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { artworkAPI, dieAPI } from '@/api/workorder'

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
        this.initFormData()
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
    initFormData() {
      this.formData = {
        quantity_completed: 0, // 本次完成数量（增量）
        quantity_defective: 0,
        artwork_ids: [],
        die_ids: [],
        notes: ''
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
        quantity_increment: this.formData.quantity_completed || 0,
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
        notes: ''
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
