<template>
  <div style="margin-top: 20px;">
    <div class="detail-section-title card-header">
      <span>物料信息</span>
      <el-button
        size="small"
        type="primary"
        icon="el-icon-plus"
        @click="$emit('add-material')"
      >
        添加物料
      </el-button>
    </div>

    <el-table
      v-if="materials && materials.length > 0"
      :data="materials"
      border
      style="width: 100%"
    >
      <el-table-column prop="material_name" label="物料名称" width="200">
        <template slot-scope="scope">
          {{ scope.row.material_name }} ({{ scope.row.material_code }})
        </template>
      </el-table-column>
      <el-table-column prop="material_size" label="尺寸" width="150" />
      <el-table-column prop="material_usage" label="用量" width="150" />
      <el-table-column prop="notes" label="备注" min-width="200" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.notes || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="purchase_status_display" label="采购状态" width="120">
        <template slot-scope="scope">
          <el-tag :type="getPurchaseStatusType(scope.row.purchase_status)" size="small">
            {{ scope.row.purchase_status_display }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="purchase_date" label="采购日期" width="120">
        <template slot-scope="scope">
          {{ formatDate(scope.row.purchase_date) }}
        </template>
      </el-table-column>
      <el-table-column prop="received_date" label="回料日期" width="120">
        <template slot-scope="scope">
          {{ formatDate(scope.row.received_date) }}
        </template>
      </el-table-column>
      <el-table-column prop="cut_date" label="开料日期" width="120">
        <template slot-scope="scope">
          {{ formatDate(scope.row.cut_date) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="primary"
            size="mini"
            :disabled="scope.row.purchase_status === 'completed'"
            @click="$emit('update-status', scope.row)"
          >
            更新状态
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else description="暂无物料信息" />
  </div>
</template>

<script>
export default {
  name: 'WorkOrderMaterials',
  props: {
    materials: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}/${month}/${day}`
    },
    getPurchaseStatusType(status) {
      const typeMap = {
        not_purchased: 'info',
        ordered: 'warning',
        received: 'primary',
        cut: 'success',
        completed: 'success'
      }
      return typeMap[status] || ''
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}
</style>
