<template>
  <el-dialog
    :visible="localVisible"
    title="签收确认"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="签收状态">
        <el-radio-group v-model="form.received">
          <el-radio label="received">正常签收</el-radio>
          <el-radio label="rejected">拒收</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="签收备注" v-if="form.received === 'rejected'">
        <el-input
          v-model="form.received_notes"
          type="textarea"
          :rows="3"
          placeholder="请输入拒收原因"
        />
      </el-form-item>
      <el-form-item label="签收照片">
        <el-upload
          action=""
          :http-request="uploadReceipt"
          :show-file-list="false"
          accept="image/*"
          :limit="1"
          list-type="picture"
        >
          <el-button size="small">上传签收照片</el-button>
          <template #tip>
            <div class="el-upload__tip">支持 jpg/png 图片，且不超过 2MB</div>
          </template>
        </el-upload>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="$emit('confirm', form)">确认</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'DeliveryReceiveDialog',
  props: {
    visible: Boolean
  },
  data() {
    return {
      form: {
        delivery_id: null,
        received: 'received',
        received_notes: '',
        receiver_signature: ''
      }
    }
  },
  computed: {
    localVisible: {
      get() { return this.visible },
      set() { this.$emit('close') }
    }
  },
  methods: {
    handleClose() {
      this.$emit('close')
    },
    uploadReceipt(item) {
      console.log('上传签收照片', item)
    }
  }
}
</script>
