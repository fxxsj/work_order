/**
 * 导出功能 Mixin
 * 提供统一的 Excel/CSV 导出功能
 *
 * 使用方式：
 * import exportMixin from '@/mixins/exportMixin'
 *
 * export default {
 *   mixins: [exportMixin],
 *   methods: {
 *     handleExport() {
 *       this.exportExcel(
 *         this.tableData,
 *         ['id', 'name', 'age'],
 *         ['ID', '姓名', '年龄'],
 *         '用户数据'
 *       )
 *     }
 *   }
 * }
 */
import * as XLSX from 'xlsx'

export default {
  data() {
    return {
      exporting: false
    }
  },

  methods: {
    /**
     * 导出为 Excel
     * @param {Array} data - 数据数组
     * @param {Array} columns - 列字段名数组
     * @param {Array} headers - 列标题数组
     * @param {string} filename - 文件名
     */
    exportExcel(data, columns, headers, filename = '导出数据') {
      if (!data || data.length === 0) {
        this.$message.warning('没有可导出的数据')
        return
      }

      this.exporting = true
      try {
        // 准备导出数据
        const exportData = data.map(item => {
          const row = {}
          columns.forEach((col, index) => {
            const header = headers[index] || col
            row[header] = this._getNestedValue(item, col)
          })
          return row
        })

        // 创建工作表
        const ws = XLSX.utils.json_to_sheet(exportData)

        // 创建工作簿
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')

        // 生成文件名
        const fileName = `${filename}_${this._formatDate(new Date())}.xlsx`

        // 导出文件
        XLSX.writeFile(wb, fileName)

        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败')
      } finally {
        this.exporting = false
      }
    },

    /**
     * 导出为 CSV
     * @param {Array} data - 数据数组
     * @param {Array} columns - 列字段名数组
     * @param {Array} headers - 列标题数组
     * @param {string} filename - 文件名
     */
    exportCSV(data, columns, headers, filename = '导出数据') {
      if (!data || data.length === 0) {
        this.$message.warning('没有可导出的数据')
        return
      }

      this.exporting = true
      try {
        // 构建 CSV 内容
        let csvContent = '\ufeff' // UTF-8 BOM

        // 添加表头
        csvContent += headers.join(',') + '\n'

        // 添加数据行
        data.forEach(item => {
          const row = columns.map(col => {
            const value = this._getNestedValue(item, col)
            // 处理包含逗号或引号的字段
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          csvContent += row.join(',') + '\n'
        })

        // 创建 Blob
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

        // 生成文件名
        const fileName = `${filename}_${this._formatDate(new Date())}.csv`

        // 创建下载链接
        const link = document.createElement('a')
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob)
          link.setAttribute('href', url)
          link.setAttribute('download', fileName)
          link.style.visibility = 'hidden'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }

        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败')
      } finally {
        this.exporting = false
      }
    },

    /**
     * 从 API 导出数据
     * @param {string} url - 导出 API 地址
     * @param {Object} params - 查询参数
     * @param {string} filename - 文件名
     */
    async exportFromAPI(url, params = {}, filename = '导出数据') {
      this.exporting = true
      try {
        const response = await this.$http({
          url,
          method: 'post',
          data: params,
          responseType: 'blob'
        })

        // 从响应头获取文件名（如果有）
        const contentDisposition = response.headers['content-disposition']
        let fileName = filename
        if (contentDisposition) {
          const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
          if (match && match[1]) {
            fileName = match[1].replace(/['"]/g, '')
          }
        }

        // 创建下载链接
        const blob = new Blob([response.data])
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        link.click()
        URL.revokeObjectURL(link.href)

        this.$message.success('导出成功')
      } catch (error) {
        console.error('导出失败:', error)
        this.$message.error('导出失败')
      } finally {
        this.exporting = false
      }
    },

    /**
     * 获取嵌套对象的值
     * @param {Object} obj - 对象
     * @param {string} path - 路径（支持点分隔）
     * @returns {any} 值
     */
    _getNestedValue(obj, path) {
      if (!path || !obj) return ''

      const keys = path.split('.')
      let value = obj

      for (const key of keys) {
        if (value === null || value === undefined) return ''
        value = value[key]
      }

      return value === null || value === undefined ? '' : value
    },

    /**
     * 格式化日期
     * @param {Date} date - 日期对象
     * @returns {string} 格式化后的日期字符串
     */
    _formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      return `${year}${month}${day}_${hours}${minutes}${seconds}`
    }
  }
}
