<template>
  <div class="crud-table-actions">
    <el-button
      v-if="showView"
      type="text"
      size="small"
      @click="$emit('view')"
    >
      查看
    </el-button>
    <el-button
      v-if="showEdit"
      type="text"
      size="small"
      @click="$emit('edit')"
    >
      编辑
    </el-button>
    <el-button
      v-if="showDelete"
      type="text"
      size="small"
      style="color: #F56C6C;"
      @click="$emit('delete')"
    >
      删除
    </el-button>
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: 'CrudTableActions',
  props: {
    // 是否显示查看按钮
    showView: {
      type: Boolean,
      default: true
    },
    // 是否显示编辑按钮
    showEdit: {
      type: Boolean,
      default: true
    },
    // 是否显示删除按钮
    showDelete: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style scoped>
.crud-table-actions {
  display: inline-flex;
  gap: 8px;
}
</style>
