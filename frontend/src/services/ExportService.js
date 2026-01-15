/**
 * 导出服务
 *
 * 提供统一的导出功能，支持导出为 Excel、CSV 等格式
 */

import BaseService from './base/BaseService'
import * as XLSX from 'xlsx'

/**
 * 导出服务类
 */
class ExportService extends BaseService {
  constructor() {
    super(null) // ExportService 不需要 API 客户端
  }

  /**
   * 导出数据为 Excel 文件
   * @param {Array} data - 要导出的数据
   * @param {Object} options - 导出选项
   * @returns {Promise} 导出结果
   */
  async exportToExcel(data, options = {}) {
    const {
      filename = 'export',
      sheetName = 'Sheet1',
      columns = [],
      title = null,
      author = '印刷施工单系统'
    } = options

    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new()

      // 转换数据为工作表
      const worksheetData = this._prepareWorksheetData(data, columns)
      const worksheet = XLSX.utils.json_to_sheet(worksheetData)

      // 设置列宽
      if (columns.length > 0) {
        const colWidths = columns.map(col => {
          const maxWidth = Math.max(
            col.label.length,
            ...data.map(row => String(row[col.field] || '').length)
          )
          return { wch: maxWidth + 2 }
        })
        worksheet['!cols'] = colWidths
      }

      // 添加工作表
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // 设置工作簿属性
      workbook.Props = {
        Title: title || filename,
        Subject: filename,
        Author: author,
        CreatedDate: new Date()
      }

      // 生成文件
      XLSX.writeFile(workbook, `${filename}.xlsx`)

      return {
        success: true,
        message: `导出成功：${filename}.xlsx`
      }
    } catch (error) {
      console.error('Export Error:', error)
      return {
        success: false,
        error: '导出失败：' + error.message
      }
    }
  }

  /**
   * 导出数据为 CSV 文件
   * @param {Array} data - 要导出的数据
   * @param {Object} options - 导出选项
   * @returns {Promise} 导出结果
   */
  async exportToCSV(data, options = {}) {
    const {
      filename = 'export',
      columns = [],
      separator = ','
    } = options

    try {
      // 准备 CSV 内容
      const headers = columns.map(col => col.label).join(separator)
      const rows = data.map(row =>
        columns.map(col => {
          let value = row[col.field]
          // 处理包含分隔符的值
          if (typeof value === 'string' && value.includes(separator)) {
            value = `"${value}"`
          }
          return value || ''
        }).join(separator)
      )

      const csv = [headers, ...rows].join('\n')

      // 创建 Blob 并下载
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
      this._downloadBlob(blob, `${filename}.csv`)

      return {
        success: true,
        message: `导出成功：${filename}.csv`
      }
    } catch (error) {
      console.error('Export Error:', error)
      return {
        success: false,
        error: '导出失败：' + error.message
      }
    }
  }

  /**
   * 导出任务列表
   * @param {Array} tasks - 任务列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise} 导出结果
   */
  async exportTasks(tasks, filters = {}) {
    // 定义导出列
    const columns = [
      { field: 'id', label: '任务ID' },
      { field: 'work_order', label: '施工单号', formatter: (value) => value?.order_number || '' },
      { field: 'process_name', label: '工序名称' },
      { field: 'work_content', label: '工作内容' },
      { field: 'task_type_display', label: '任务类型' },
      { field: 'production_quantity', label: '生产数量' },
      { field: 'quantity_completed', label: '完成数量' },
      { field: 'quantity_defective', label: '不良品数量' },
      { field: 'status_display', label: '状态' },
      { field: 'assigned_department_name', label: '分派部门' },
      { field: 'assigned_operator_name', label: '分派操作员' },
      { field: 'created_at', label: '创建时间', formatter: (value) => this._formatDate(value) }
    ]

    // 准备数据
    const exportData = tasks.map(task => {
      const row = {}
      columns.forEach(col => {
        let value = task[col.field]
        if (col.formatter) {
          value = col.formatter(value, task)
        }
        row[col.field] = value
      })
      return row
    })

    // 生成文件名
    const dateStr = this._formatDate(new Date(), 'YYYYMMDD_HHmmss')
    const filename = `任务列表_${dateStr}`

    return this.exportToExcel(exportData, {
      filename,
      sheetName: '任务列表',
      columns,
      title: '任务列表导出'
    })
  }

  /**
   * 导出施工单列表
   * @param {Array} workOrders - 施工单列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise} 导出结果
   */
  async exportWorkOrders(workOrders, filters = {}) {
    const columns = [
      { field: 'order_number', label: '施工单号' },
      { field: 'customer_name', label: '客户名称' },
      { field: 'product_name', label: '产品名称' },
      { field: 'quantity', label: '数量' },
      { field: 'unit', label: '单位' },
      { field: 'status_display', label: '状态' },
      { field: 'priority_display', label: '优先级' },
      { field: 'order_date', label: '下单日期', formatter: (value) => this._formatDate(value) },
      { field: 'delivery_date', label: '交货日期', formatter: (value) => this._formatDate(value) },
      { field: 'production_quantity', label: '生产数量' },
      { field: 'progress_percentage', label: '完成进度(%)', formatter: (value) => value || 0 },
      { field: 'manager_name', label: '制单人' },
      { field: 'created_at', label: '创建时间', formatter: (value) => this._formatDate(value) }
    ]

    const exportData = workOrders.map(wo => {
      const row = {}
      columns.forEach(col => {
        let value = wo[col.field]
        if (col.formatter) {
          value = col.formatter(value, wo)
        }
        row[col.field] = value
      })
      return row
    })

    const dateStr = this._formatDate(new Date(), 'YYYYMMDD_HHmmss')
    const filename = `施工单列表_${dateStr}`

    return this.exportToExcel(exportData, {
      filename,
      sheetName: '施工单列表',
      columns,
      title: '施工单列表导出'
    })
  }

  /**
   * 准备工作表数据
   * @param {Array} data - 原始数据
   * @param {Array} columns - 列定义
   * @returns {Array} 工作表数据
   */
  _prepareWorksheetData(data, columns) {
    if (columns.length === 0) {
      // 没有指定列，使用所有字段
      return data
    }

    return data.map(row => {
      const newRow = {}
      columns.forEach(col => {
        newRow[col.label] = col.formatter
          ? col.formatter(row[col.field], row)
          : row[col.field] || ''
      })
      return newRow
    })
  }

  /**
   * 下载 Blob
   * @param {Blob} blob - Blob 对象
   * @param {string} filename - 文件名
   */
  _downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  /**
   * 格式化日期
   * @param {Date|string} date - 日期
   * @param {string} format - 格式
   * @returns {string} 格式化后的日期字符串
   */
  _formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) {
      return ''
    }

    const d = new Date(date)
    if (isNaN(d.getTime())) {
      return ''
    }

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  /**
   * 导出打印预览数据
   * @param {Array} data - 数据
   * @param {Object} options - 选项
   * @returns {Object} 预览数据
   */
  preparePrintData(data, options = {}) {
    const {
      title = '',
      columns = [],
      pageSize = 'A4',
      orientation = 'portrait'
    } = options

    return {
      title,
      data,
      columns,
      pageSize,
      orientation,
      totalCount: data.length,
      printTime: new Date().toLocaleString()
    }
  }

  /**
   * 生成打印 HTML
   * @param {Object} printData - 打印数据
   * @returns {string} HTML 字符串
   */
  generatePrintHTML(printData) {
    const { title, data, columns, printTime } = printData

    // 生成表头
    const headerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1>${title}</h1>
        <p style="color: #666;">打印时间：${printTime}</p>
      </div>
    `

    // 生成表格
    const tableHeader = `
      <thead>
        <tr>
          ${columns.map(col => `<th>${col.label}</th>`).join('')}
        </tr>
      </thead>
    `

    const tableBody = `
      <tbody>
        ${data.map((row, index) => `
          <tr>
            ${columns.map(col => `
              <td>${row[col.field] || ''}</td>
            `).join('')}
          </tr>
        `).join('')}
      </tbody>
    `

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print {
            body { padding: 0; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${headerHTML}
        <table>
          ${tableHeader}
          ${tableBody}
        </table>
      </body>
      </html>
    `
  }

  /**
   * 打印数据
   * @param {Object} printData - 打印数据
   */
  print(printData) {
    const html = this.generatePrintHTML(printData)

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.print()
    }
  }
}

// 创建单例实例
const exportService = new ExportService()

export default exportService
