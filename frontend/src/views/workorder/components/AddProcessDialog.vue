<template>
  <el-dialog
    title="添加工序"
    :visible.sync="dialogVisible"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="form" :model="form" label-width="80px">
      <el-form-item label="工序">
        <el-select
          v-model="form.process_id"
          placeholder="请选择工序"
          style="width: 100%;"
        >
          <el-option
            v-for="process in processList"
            :key="process.id"
            :label="process.name"
            :value="process.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="顺序">
        <el-input-number
          v-model="form.sequence"
          :min="1"
          :max="100"
          style="width: 100%;"
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
  name: 'AddProcessDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    processList: {
      type: Array,
      default: () => []
    },
    nextSequence: {
      type: Number,
      default: 1
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        process_id: null,
        sequence: 1
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
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.form.sequence = this.nextSequence
      }
    }
  },
  methods: {
    handleClose() {
      this.form = {
        process_id: null,
        sequence: 1
      }
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleSubmit() {
      if (!this.form.process_id) {
        this.$message.warning('请选择工序')
        return
      }
      this.$emit('submit', { ...this.form })
    }
  }
}
</script>
