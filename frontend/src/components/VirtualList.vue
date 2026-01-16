<template>
  <div class="virtual-list-wrapper">
    <!-- 静态表格（仅用于表头） -->
    <div class="virtual-list-header" :style="{ width: '100%' }">
      <el-table
        :data="[]"
        :height="headerHeight"
        border
        :header-row-style="headerRowStyle"
        :header-cell-style="headerCellStyle"
      >
        <slot name="columns"></slot>
      </el-table>
    </div>

    <!-- 虚拟滚动列表 -->
    <RecycleScroller
      class="virtual-list-scroller"
      :items="displayItems"
      :item-size="itemSize"
      key-field="id"
      :buffer="buffer"
      v-slot="{ item, index }"
    >
      <div
        class="virtual-list-item"
        :style="itemStyle"
        @click="handleRowClick(item, index)"
      >
        <slot name="item" :item="item" :index="index"></slot>
      </div>
    </RecycleScroller>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="virtual-list-loadmore">
      <el-button
        v-if="!loading"
        type="primary"
        plain
        size="small"
        @click="handleLoadMore"
      >
        加载更多
      </el-button>
      <span v-else>加载中...</span>
    </div>

    <!-- 分页器（可选） -->
    <div v-if="showPagination" class="virtual-list-pagination">
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        :layout="paginationLayout"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller'

export default {
  name: 'VirtualList',

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
      default: 48
    },
    // 缓冲区大小
    buffer: {
      type: Number,
      default: 300
    },
    // 列表高度
    height: {
      type: String,
      default: '600px'
    },
    // 表头高度
    headerHeight: {
      type: String,
      default: 'auto'
    },
    // 是否有更多数据
    hasMore: {
      type: Boolean,
      default: false
    },
    // 是否显示分页
    showPagination: {
      type: Boolean,
      default: false
    },
    // 当前页
    currentPage: {
      type: Number,
      default: 1
    },
    // 每页数量
    pageSize: {
      type: Number,
      default: 20
    },
    // 总数
    total: {
      type: Number,
      default: 0
    },
    // 分页大小选项
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    // 分页布局
    paginationLayout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    // 加载状态
    loading: {
      type: Boolean,
      default: false
    },
    // 表头行样式
    headerRowStyle: {
      type: [Object, Function],
      default: () => ({ backgroundColor: '#f5f7fa' })
    },
    // 表头单元格样式
    headerCellStyle: {
      type: [Object, Function],
      default: () => ({ backgroundColor: '#f5f7fa', color: '#606266', fontWeight: 'bold' })
    },
    // 列表项样式
    itemStyle: {
      type: Object,
      default: () => ({})
    }
  },

  computed: {
    displayItems() {
      return this.items || []
    }
  },

  methods: {
    handleRowClick(item, index) {
      this.$emit('row-click', item, index)
    },

    handleLoadMore() {
      this.$emit('load-more')
    },

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
.virtual-list-wrapper {
  width: 100%;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.virtual-list-header {
  width: 100%;
  overflow: hidden;
}

.virtual-list-scroller {
  height: v-bind(height);
  overflow-y: auto;
}

.virtual-list-item {
  display: flex;
  align-items: center;
  padding: 0;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.25s ease;
  cursor: pointer;
}

.virtual-list-item:hover {
  background-color: #f5f7fa;
}

.virtual-list-loadmore {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
}

.virtual-list-pagination {
  padding: 16px;
  text-align: right;
  border-top: 1px solid #ebeef5;
  background-color: #fafafa;
}

/* 滚动条样式优化 */
.virtual-list-scroller::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.virtual-list-scroller::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 4px;
}

.virtual-list-scroller::-webkit-scrollbar-thumb:hover {
  background-color: #c0c4cc;
}

.virtual-list-scroller::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}
</style>
