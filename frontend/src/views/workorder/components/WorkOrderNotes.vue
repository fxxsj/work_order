<template>
  <el-descriptions
    title="其他信息"
    :column="1"
    border
    style="margin-top: 20px;"
  >
    <el-descriptions-item label="备注">
      {{ notes || '-' }}
    </el-descriptions-item>
  </el-descriptions>
</template>

<script>
export default {
  name: 'WorkOrderNotes',
  props: {
    notes: {
      type: String,
      default: ''
    }
  }
}
</script>
