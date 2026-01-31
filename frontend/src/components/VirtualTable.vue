<template>
  <div class="virtual-table-container">
    <div class="virtual-table-header">
      <el-table
        :data="displayData"
        border
        style="width: 100%"
        :header-row-class-name="headerRowClassName"
      >
        <slot>
          <slot name="columns"></slot>
        </slot>
      </el-table>
    </div>

    <RecycleScroller
      v-if="displayData.length > 0"
      class="virtual-table-body"
      :items="displayData"
      :item-size="itemSize"
      key-field="id"
      :buffer="buffer"
      v-slot="{ item, index }"
    >
      <div :class="['virtual-table-row', rowClassName]">
        <el-table
          :data="[item]"
          border
          style="width: 100%"
          :row-class-name="rowClassName"
          :show-header="false"
        >
          <slot>
            <slot name="columns" :item="item" :index="index"></slot>
          </slot>
        </el-table>
      </div>
    </RecycleScroller>

    <div v-else class="virtual-table-empty">
      <slot name="empty">
        <el-empty description="暂无数据" />
      </slot>
    </div>

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
    data: {
      type: Array,
      default: () => []
    },
    items: {
      type: Array,
      default: () => []
    },
    itemSize: {
      type: Number,
      default: 50
    },
    buffer: {
      type: Number,
      default: 200
    },
    rowClassName: {
      type: String,
      default: ''
    },
    headerRowClassName: {
      type: String,
      default: ''
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    currentPage: {
      type: Number,
      default: 1
    },
    pageSize: {
      type: Number,
      default: 20
    },
    total: {
      type: Number,
      default: 0
    },
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100, 200]
    }
  },

  computed: {
    displayData() {
      return this.data.length > 0 ? this.data : this.items
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
