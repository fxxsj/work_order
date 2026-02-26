<template>
  <el-dialog
    title="添加物料"
    :visible.sync="dialogVisible"
    width="500px"
    @close="handleClose"
  >
    <el-form ref="form" :model="form" label-width="80px">
      <el-form-item label="物料">
        <el-select
          v-model="form.material_id"
          placeholder="请选择物料"
          style="width: 100%;"
          filterable
        >
          <el-option
            v-for="item in materialList"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注（可选）"
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
  name: 'AddMaterialDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    materialList: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        material_id: null,
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
    }
  },
  methods: {
    handleClose() {
      this.form = {
        material_id: null,
        notes: ''
      }
    },
    handleCancel() {
      this.dialogVisible = false
    },
    handleSubmit() {
      if (!this.form.material_id) {
        this.$message.warning('请选择物料')
        return
      }
      this.$emit('submit', { ...this.form })
    }
  }
}
</script>
