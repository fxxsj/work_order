<template>
  <div class="pagination-wrapper">
    <el-pagination
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="layout"
      :background="background"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
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
      required: true
    },
    // 页码选项
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    // 组件布局
    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    // 是否显示背景色
    background: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    // 处理页码变化
    handleCurrentChange(page) {
      this.$emit('current-change', page)
    },
    // 处理每页数量变化
    handleSizeChange(size) {
      this.$emit('size-change', size)
    }
  }
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 10px 0;
}
</style>
