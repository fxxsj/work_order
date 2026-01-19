/**
 * 统计卡片 Mixin
 * 提供统一的统计卡片数据处理和格式化
 *
 * 使用方式：
 * import statisticsMixin from '@/mixins/statisticsMixin'
 *
 * export default {
 *   mixins: [statisticsMixin],
 *   data() {
 *     return {
 *       stats: {}
 *     }
 *   },
 *   methods: {
 *     async fetchStatistics() {
 *       const res = await this.apiService.getStatistics()
 *       this.stats = res.data
 *     }
 *   }
 * }
 */
export default {
  data() {
    return {
      // 统计数据
      stats: {},
      statsLoading: false
    }
  },

  methods: {
    /**
     * 加载统计数据
     */
    async loadStatistics() {
      if (typeof this.fetchStatistics !== 'function') {
        return
      }

      this.statsLoading = true
      try {
        await this.fetchStatistics()
      } catch (error) {
        console.error('加载统计数据失败:', error)
        this.$message.error('加载统计数据失败')
      } finally {
        this.statsLoading = false
      }
    },

    /**
     * 格式化金额
     * @param {number} value - 金额值
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的金额
     */
    formatMoney(value, decimals = 2) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0.00'
      }
      return Number(value).toLocaleString('zh-CN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    },

    /**
     * 格式化数量
     * @param {number} value - 数量值
     * @returns {string} 格式化后的数量
     */
    formatNumber(value) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0'
      }
      return Number(value).toLocaleString('zh-CN')
    },

    /**
     * 格式化百分比
     * @param {number} value - 百分比值（0-100）
     * @param {number} decimals - 小数位数
     * @returns {string} 格式化后的百分比
     */
    formatPercent(value, decimals = 2) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0%'
      }
      return `${Number(value).toFixed(decimals)}%`
    },

    /**
     * 计算增长率
     * @param {number} current - 当前值
     * @param {number} previous - 之前值
     * @returns {Object} { rate: number, isIncrease: boolean }
     */
    calculateGrowthRate(current, previous) {
      if (!previous || previous === 0) {
        return { rate: 0, isIncrease: current > 0 }
      }

      const rate = ((current - previous) / previous) * 100
      return {
        rate: Math.abs(rate),
        isIncrease: rate > 0
      }
    },

    /**
     * 获取统计值
     * @param {string} key - 统计键名
     * @param {any} defaultValue - 默认值
     * @returns {any} 统计值
     */
    getStatValue(key, defaultValue = 0) {
      return this.stats[key] !== undefined ? this.stats[key] : defaultValue
    },

    /**
     * 获取卡片颜色类型
     * @param {number} value - 数值
     * @param {number} threshold - 阈值
     * @returns {string} 颜色类型
     */
    getCardType(value, threshold = 0) {
      if (value > threshold) return 'success'
      if (value < threshold) return 'danger'
      return 'info'
    }
  }
}
