<template>
  <div>
    <div v-if="task.artwork_code">
      <span>{{ task.artwork_code }}</span>
      <el-tag
        v-if="task.artwork_confirmed !== null"
        :type="task.artwork_confirmed ? 'success' : 'info'"
        size="mini"
        style="margin-left: 5px;"
      >
        {{ task.artwork_confirmed ? '已确认' : '未确认' }}
      </el-tag>
    </div>
    <span v-else-if="task.die_code">{{ task.die_code }}</span>
    <div v-else-if="task.product_code">
      <span>{{ task.product_code }}</span>
      <span v-if="task.product_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
        ({{ task.product_name }})
      </span>
    </div>
    <div v-else-if="task.material_code">
      <span>{{ task.material_code }}</span>
      <el-tag
        v-if="task.material_purchase_status"
        :type="getMaterialStatusTagType(task.material_purchase_status)"
        size="mini"
        style="margin-left: 5px;"
      >
        {{ getMaterialStatusText(task.material_purchase_status) }}
      </el-tag>
    </div>
    <div v-else-if="task.foiling_plate_code">
      <span>{{ task.foiling_plate_code }}</span>
      <span v-if="task.foiling_plate_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
        ({{ task.foiling_plate_name }})
      </span>
    </div>
    <div v-else-if="task.embossing_plate_code">
      <span>{{ task.embossing_plate_code }}</span>
      <span v-if="task.embossing_plate_name" style="color: #909399; font-size: 12px; margin-left: 5px;">
        ({{ task.embossing_plate_name }})
      </span>
    </div>
    <span v-else>-</span>
  </div>
</template>

<script>
export default {
  name: 'TaskRelatedInfo',
  props: {
    task: {
      type: Object,
      required: true
    }
  },
  methods: {
    getMaterialStatusTagType(status) {
      const statusMap = {
        pending: 'info',
        ordered: 'primary',
        received: 'success',
        cut: 'warning',
        completed: 'success'
      }
      return statusMap[status] || 'info'
    },
    getMaterialStatusText(status) {
      const statusMap = {
        pending: '待采购',
        ordered: '已下单',
        received: '已回料',
        cut: '已开料',
        completed: '已完成'
      }
      return statusMap[status] || status
    }
  }
}
</script>
