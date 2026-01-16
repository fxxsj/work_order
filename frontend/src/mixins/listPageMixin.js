/**
 * 列表页面 Mixin
 * 提供统一的列表页面逻辑，包括分页、搜索、加载等
 */
import { debounce } from 'lodash'

export default {
  data() {
    return {
      loading: false,
      tableData: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      searchText: '',
      // 筛选条件
      filters: {}
    }
  },

  created() {
    // 创建防抖搜索方法
    this.handleSearchDebounced = debounce(this.handleSearch, 300)
  },

  methods: {
    /**
     * 处理搜索
     */
    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },

    /**
     * 处理分页变化
     * @param {number} page - 页码
     */
    handlePageChange(page) {
      this.currentPage = page
      this.loadData()
    },

    /**
     * 处理每页数量变化
     * @param {number} size - 每页数量
     */
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.loadData()
    },

    /**
     * 重置筛选条件
     */
    resetFilters() {
      this.filters = {}
      this.searchText = ''
      this.currentPage = 1
      this.loadData()
    },

    /**
     * 加载数据（子组件需要实现此方法）
     */
    async loadData() {
      this.loading = true
      try {
        const response = await this.fetchData()
        this.tableData = response.results || response.data || []
        this.total = response.count || response.total || 0
      } catch (error) {
        console.error('加载数据失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.loading = false
      }
    },

    /**
     * 获取数据（子组件必须实现此方法）
     */
    fetchData() {
      throw new Error('子组件必须实现 fetchData 方法')
    },

    /**
     * 显示成功消息
     * @param {string} message - 消息内容
     */
    showSuccess(message) {
      this.$message.success(message)
    },

    /**
     * 显示错误消息
     * @param {string} message - 消息内容
     */
    showError(message) {
      this.$message.error(message)
    },

    /**
     * 显示警告消息
     * @param {string} message - 消息内容
     */
    showWarning(message) {
      this.$message.warning(message)
    },

    /**
     * 显示信息消息
     * @param {string} message - 消息内容
     */
    showInfo(message) {
      this.$message.info(message)
    }
  }
}
