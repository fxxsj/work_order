<template>
  <div class="virtual-table-container">
    <!-- 表头 -->
    <div class="virtual-table-header">
      <slot name="header">
        <el-table
          :data="[]"
          border
          style="width: 100%"
          :header-row-class-name="headerRowClassName"
        >
          <slot name="columns"></slot>
        </el-table>
      </slot>
    </div>

    <!-- 虚拟滚动列表 -->
    <RecycleScroller
      v-if="items.length > 0"
      class="virtual-table-body"
      :items="items"
      :item-size="itemSize"
      key-field="id"
      :buffer="buffer"
      v-slot="{ item, index }"
    >
      <div :class="['virtual-table-row', rowClassName]">
        <slot name="row" :item="item" :index="index"></slot>
      </div>
    </RecycleScroller>

    <!-- 空状态 -->
    <div v-else class="virtual-table-empty">
      <slot name="empty">
        <el-empty description="暂无数据" />
      </slot>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="virtual-table-pagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default {
  name: 'VirtualTable',

  components: {
    RecycleScroller
  },

  props: {
    // 数据列表
    items: {
      type: Array,
      default: () => []
    },
    // 每行高度（px）
    itemSize: {
      type: Number,
      default: 50
    },
    // 缓冲区大小（额外渲染的行数）
    buffer: {
      type: Number,
      default: 200
    },
    // 行类名
    rowClassName: {
      type: String,
      default: ''
    },
    // 表头行类名
    headerRowClassName: {
      type: String,
      default: ''
    },
    // 是否显示分页
    showPagination: {
      type: Boolean,
      default: true
    },
    // 当前页码
    currentPage: {
      type: Number,
      default: 1
    },
    // 每页数量
    pageSize: {
      type: Number,
      default: 20
    },
    // 总数量
    total: {
      type: Number,
      default: 0
    },
    // 分页大小选项
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100, 200]
    }
  },

  methods: {
    handlePageChange(page) {
      this.$emit('page-change', page)
    },

    handleSizeChange(size) {
      this.$emit('size-change', size)
    }
  }
}
</script>

<style scoped>
.virtual-table-container {
  width: 100%;
  position: relative;
}

.virtual-table-header {
  width: 100%;
  overflow-x: auto;
}

.virtual-table-body {
  height: 600px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-top: none;
}

.virtual-table-row {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.25s ease;
}

.virtual-table-row:hover {
  background-color: #f5f7fa;
}

.virtual-table-empty {
  padding: 40px 0;
  text-align: center;
}

.virtual-table-pagination {
  margin-top: 20px;
  text-align: right;
}

/* 滚动条样式 */
.virtual-table-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.virtual-table-body::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 4px;
}

.virtual-table-body::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}

.virtual-table-body::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}
</style>
