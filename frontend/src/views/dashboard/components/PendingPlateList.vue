<template>
  <div class="pending-plate-list">
    <div v-if="items.length > 0">
      <el-table
        :data="items.slice(0, 5)"
        style="width: 100%"
        max-height="200"
        size="mini"
      >
        <el-table-column
          prop="code"
          label="编码"
          width="120"
          show-overflow-tooltip
        />
        <el-table-column
          prop="name"
          label="名称"
          min-width="100"
          show-overflow-tooltip
        />
        <el-table-column label="操作" width="80" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="mini"
              :loading="confirmingItem === `${type}-${scope.row.id}`"
              @click="$emit('confirm', { type, item: scope.row })"
            >
              确认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="items.length > 5" class="more-items">
        还有 {{ items.length - 5 }} 项...
      </div>
    </div>
    <div v-else class="empty-state">
      暂无待确认{{ typeLabel }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PendingPlateList',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    confirmingItem: {
      type: String,
      default: null
    },
    type: {
      type: String,
      required: true
    }
  },
  computed: {
    typeLabel() {
      const labels = {
        artwork: '图稿',
        die: '刀模',
        foiling_plate: '烫金版',
        embossing_plate: '压凸版'
      }
      return labels[this.type] || '项目'
    }
  }
}
</script>

<style scoped>
.pending-plate-list {
  width: 100%;
}

.more-items {
  text-align: center;
  padding: 10px;
  color: #909399;
  font-size: 12px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #909399;
}
</style>
