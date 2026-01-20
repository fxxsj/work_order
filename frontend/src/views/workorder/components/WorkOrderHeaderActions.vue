<template>
  <div class="header-actions">
    <el-button icon="el-icon-back" @click="$emit('back')">
      返回
    </el-button>
    <div>
      <el-button icon="el-icon-printer" @click="$emit('print')">
        打印
      </el-button>
      <el-button
        type="primary"
        icon="el-icon-edit"
        style="margin-left: 10px;"
        :disabled="!canEdit"
        @click="$emit('edit')"
      >
        编辑
      </el-button>
      <el-dropdown style="margin-left: 10px;" @command="handleStatusChange">
        <el-button type="success">
          更改状态<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="pending">
            待开始
          </el-dropdown-item>
          <el-dropdown-item command="in_progress">
            进行中
          </el-dropdown-item>
          <el-dropdown-item command="paused">
            已暂停
          </el-dropdown-item>
          <el-dropdown-item command="completed">
            已完成
          </el-dropdown-item>
          <el-dropdown-item command="cancelled">
            已取消
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkOrderHeaderActions',
  props: {
    canEdit: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    handleStatusChange(command) {
      this.$emit('status-change', command)
    }
  }
}
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
