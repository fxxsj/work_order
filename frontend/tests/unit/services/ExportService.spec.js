/**
 * ExportService 单元测试
 */

import exportService from '@/services/ExportService'

// Mock xlsx library
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    json_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn()
  },
  writeFile: jest.fn(() => {})
}))

describe('ExportService', () => {
  describe('exportToExcel', () => {
    test('应该导出数据为 Excel 文件', async () => {
      const data = [
        { id: 1, name: '测试1', value: 100 },
        { id: 2, name: '测试2', value: 200 }
      ]

      const columns = [
        { field: 'id', label: 'ID' },
        { field: 'name', label: '名称' },
        { field: 'value', label: '数值' }
      ]

      const result = await exportService.exportToExcel(data, {
        filename: 'test_export',
        sheetName: '测试',
        columns
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('导出成功')
    })

    test('应该使用默认文件名', async () => {
      const data = [{ id: 1, name: '测试' }]
      const result = await exportService.exportToExcel(data)

      expect(result.success).toBe(true)
      expect(result.message).toContain('export')
    })

    test('应该处理空数据', async () => {
      const result = await exportService.exportToExcel([])

      expect(result.success).toBe(true)
    })

    test('应该应用 formatter 格式化数据', async () => {
      const data = [
        { id: 1, date: '2026-01-15', status: 'pending' }
      ]

      const columns = [
        {
          field: 'status',
          label: '状态',
          formatter: (value) => value === 'pending' ? '待开始' : value
        }
      ]

      const result = await exportService.exportToExcel(data, { columns })

      expect(result.success).toBe(true)
    })
  })

  describe('exportToCSV', () => {
    test('应该导出数据为 CSV 文件', async () => {
      const data = [
        { id: 1, name: '测试1', value: 100 },
        { id: 2, name: '测试2', value: 200 }
      ]

      const columns = [
        { field: 'id', label: 'ID' },
        { field: 'name', label: '名称' },
        { field: 'value', label: '数值' }
      ]

      // Mock URL.createObjectURL and related methods
      global.URL.createObjectURL = jest.fn(() => 'blob:url')
      global.URL.revokeObjectURL = jest.fn()

      const createElementSpy = jest.spyOn(document, 'createElement')
      const appendChildSpy = jest.spyOn(document.body, 'appendChild')
      const removeChildSpy = jest.spyOn(document.body, 'removeChild')

      createElementSpy.mockReturnValue({
        href: '',
        download: '',
        click: jest.fn()
      })

      const result = await exportService.exportToCSV(data, {
        filename: 'test_csv',
        columns
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('导出成功')

      // 清理
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    test('应该处理包含分隔符的值', async () => {
      const data = [
        { id: 1, description: '测试,包含,逗号' }
      ]

      const columns = [
        { field: 'id', label: 'ID' },
        { field: 'description', label: '描述' }
      ]

      global.URL.createObjectURL = jest.fn(() => 'blob:url')
      global.URL.revokeObjectURL = jest.fn()

      const createElementSpy = jest.spyOn(document, 'createElement')
      createElementSpy.mockReturnValue({
        href: '',
        download: '',
        click: jest.fn()
      })

      const appendChildSpy = jest.spyOn(document.body, 'appendChild')
      const removeChildSpy = jest.spyOn(document.body, 'removeChild')

      const result = await exportService.exportToCSV(data, { columns })

      expect(result.success).toBe(true)

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })

  describe('exportTasks', () => {
    test('应该导出任务列表', async () => {
      const tasks = [
        {
          id: 1,
          work_content: '测试任务1',
          production_quantity: 100,
          quantity_completed: 50,
          status: 'in_progress',
          status_display: '进行中',
          task_type_display: '通用任务',
          process_name: '印刷',
          quantity_defective: 0,
          assigned_department_name: '印刷车间',
          assigned_operator_name: '张三',
          created_at: '2026-01-15T10:30:00'
        }
      ]

      const result = await exportService.exportTasks(tasks, {})

      expect(result.success).toBe(true)
      expect(result.message).toContain('任务列表')
    })

    test('应该使用正确的列定义', async () => {
      const tasks = [
        {
          id: 1,
          work_content: '测试任务',
          production_quantity: 100,
          quantity_completed: 100,
          status: 'completed',
          status_display: '已完成',
          task_type_display: '通用任务',
          process_name: '印刷',
          quantity_defective: 0,
          created_at: '2026-01-15T10:30:00'
        }
      ]

      const result = await exportService.exportTasks(tasks)

      expect(result.success).toBe(true)
    })

    test('应该生成带时间戳的文件名', async () => {
      const tasks = [
        {
          id: 1,
          work_content: '测试',
          status_display: '待开始',
          task_type_display: '通用任务',
          process_name: '印刷',
          created_at: '2026-01-15T10:30:00'
        }
      ]

      const result = await exportService.exportTasks(tasks)

      expect(result.success).toBe(true)
      expect(result.message).toMatch(/任务列表_\d{8}_\d{6}\.xlsx/)
    })
  })

  describe('exportWorkOrders', () => {
    test('应该导出施工单列表', async () => {
      const workOrders = [
        {
          id: 1,
          order_number: 'WO2026001',
          customer_name: '测试客户',
          product_name: '测试产品',
          quantity: 100,
          unit: '件',
          status: 'pending',
          status_display: '待开始',
          priority: 'normal',
          priority_display: '普通',
          order_date: '2026-01-15',
          delivery_date: '2026-12-31',
          production_quantity: 100,
          progress_percentage: 0,
          manager_name: '张三',
          created_at: '2026-01-15T10:00:00'
        }
      ]

      const result = await exportService.exportWorkOrders(workOrders, {})

      expect(result.success).toBe(true)
      expect(result.message).toContain('施工单列表')
    })

    test('应该格式化施工单数据', async () => {
      const workOrders = [
        {
          id: 1,
          order_number: 'WO2026001',
          customer_name: '客户A',
          product_name: '测试产品',
          quantity: 100,
          unit: '件',
          status: 'pending',
          status_display: '待开始',
          priority: 'high',
          priority_display: '紧急',
          order_date: '2026-01-15',
          delivery_date: '2026-12-31',
          production_quantity: 100,
          progress_percentage: 0,
          manager_name: '张三',
          created_at: '2026-01-15T10:00:00'
        }
      ]

      const result = await exportService.exportWorkOrders(workOrders)

      expect(result.success).toBe(true)
    })

    test('应该生成带时间戳的文件名', async () => {
      const workOrders = [
        {
          id: 1,
          order_number: 'WO001',
          customer_name: '客户',
          product_name: '产品',
          quantity: 100,
          unit: '件',
          status: 'pending',
          status_display: '待开始',
          priority: 'normal',
          priority_display: '普通',
          order_date: '2026-01-15',
          delivery_date: '2026-12-31',
          production_quantity: 100,
          progress_percentage: 0,
          manager_name: '李四',
          created_at: '2026-01-15T10:00:00'
        }
      ]

      const result = await exportService.exportWorkOrders(workOrders)

      expect(result.success).toBe(true)
      expect(result.message).toMatch(/施工单列表_\d{8}_\d{6}\.xlsx/)
    })
  })

  describe('preparePrintData', () => {
    test('应该准备打印数据', () => {
      const data = [
        { id: 1, name: '项目1', value: 100 },
        { id: 2, name: '项目2', value: 200 }
      ]

      const columns = [
        { field: 'id', label: 'ID' },
        { field: 'name', label: '名称' },
        { field: 'value', label: '数值' }
      ]

      const printData = exportService.preparePrintData(data, {
        title: '测试报表',
        columns,
        pageSize: 'A4',
        orientation: 'portrait'
      })

      expect(printData.title).toBe('测试报表')
      expect(printData.data).toEqual(data)
      expect(printData.columns).toEqual(columns)
      expect(printData.totalCount).toBe(2)
      expect(printData.pageSize).toBe('A4')
      expect(printData.orientation).toBe('portrait')
      expect(printData.printTime).toBeDefined()
    })

    test('应该使用默认选项', () => {
      const data = [{ id: 1, name: '测试' }]
      const columns = [{ field: 'id', label: 'ID' }]

      const printData = exportService.preparePrintData(data, { columns })

      expect(printData.title).toBe('')
      expect(printData.pageSize).toBe('A4')
      expect(printData.orientation).toBe('portrait')
    })
  })

  describe('generatePrintHTML', () => {
    test('应该生成打印 HTML', () => {
      const printData = {
        title: '测试报表',
        data: [
          { id: 1, name: '项目1', value: 100 },
          { id: 2, name: '项目2', value: 200 }
        ],
        columns: [
          { field: 'id', label: 'ID' },
          { field: 'name', label: '名称' },
          { field: 'value', label: '数值' }
        ],
        printTime: '2026-01-15 10:00:00'
      }

      const html = exportService.generatePrintHTML(printData)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('测试报表')
      expect(html).toContain('打印时间：2026-01-15 10:00:00')
      expect(html).toContain('<table>')
      expect(html).toContain('ID')
      expect(html).toContain('名称')
      expect(html).toContain('数值')
      expect(html).toContain('项目1')
      expect(html).toContain('项目2')
    })

    test('应该包含打印样式', () => {
      const printData = {
        title: '测试',
        data: [{ id: 1 }],
        columns: [{ field: 'id', label: 'ID' }],
        printTime: '2026-01-15'
      }

      const html = exportService.generatePrintHTML(printData)

      expect(html).toContain('@media print')
      expect(html).toContain('print-color-adjust')
    })
  })

  describe('_formatDate', () => {
    test('应该格式化日期为 YYYY-MM-DD', () => {
      const date = new Date('2026-01-15T10:30:00')
      const formatted = exportService._formatDate(date, 'YYYY-MM-DD')
      expect(formatted).toBe('2026-01-15')
    })

    test('应该格式化日期为 YYYYMMDD_HHmmss', () => {
      const date = new Date('2026-01-15T10:30:00')
      const formatted = exportService._formatDate(date, 'YYYYMMDD_HHmmss')
      expect(formatted).toBe('20260115_103000')
    })

    test('应该处理 null 日期', () => {
      const formatted = exportService._formatDate(null)
      expect(formatted).toBe('')
    })

    test('应该处理 undefined 日期', () => {
      const formatted = exportService._formatDate(undefined)
      expect(formatted).toBe('')
    })

    test('应该处理无效日期', () => {
      const formatted = exportService._formatDate('invalid')
      expect(formatted).toBe('')
    })
  })

  describe('print', () => {
    test('应该打开打印窗口', () => {
      const printData = {
        title: '测试',
        data: [{ id: 1 }],
        columns: [{ field: 'id', label: 'ID' }],
        printTime: '2026-01-15'
      }

      // Mock window.open
      const mockWindow = {
        document: {
          write: jest.fn(),
          close: jest.fn()
        },
        print: jest.fn()
      }

      global.window.open = jest.fn(() => mockWindow)

      exportService.print(printData)

      expect(global.window.open).toHaveBeenCalledWith('', '_blank')
      expect(mockWindow.document.write).toHaveBeenCalled()
      expect(mockWindow.document.close).toHaveBeenCalled()
      expect(mockWindow.print).toHaveBeenCalled()
    })

    test('应该处理打印窗口打开失败', () => {
      const printData = {
        title: '测试',
        data: [{ id: 1 }],
        columns: [{ field: 'id', label: 'ID' }],
        printTime: '2026-01-15'
      }

      // Mock window.open 返回 null
      global.window.open = jest.fn(() => null)

      // 不应该抛出错误
      expect(() => {
        exportService.print(printData)
      }).not.toThrow()
    })
  })

  describe('_prepareWorksheetData', () => {
    test('应该准备工作表数据', () => {
      const data = [
        { id: 1, name: '测试1', value: 100 },
        { id: 2, name: '测试2', value: 200 }
      ]

      const columns = [
        { field: 'id', label: 'ID' },
        { field: 'name', label: '名称' },
        {
          field: 'value',
          label: '数值',
          formatter: (val) => `¥${val}`
        }
      ]

      const result = exportService._prepareWorksheetData(data, columns)

      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('ID')
      expect(result[0]).toHaveProperty('名称')
      expect(result[0]).toHaveProperty('数值')
      expect(result[0]['数值']).toBe('¥100')
    })

    test('没有指定列时应该返回原数据', () => {
      const data = [{ id: 1, name: '测试' }]
      const result = exportService._prepareWorksheetData(data, [])

      expect(result).toEqual(data)
    })

    test('应该应用 formatter 格式化字段值', () => {
      const data = [
        { status: 'pending', value: 100 }
      ]

      const columns = [
        {
          field: 'status',
          label: '状态',
          formatter: (val) => val === 'pending' ? '待开始' : val
        },
        {
          field: 'value',
          label: '数值',
          formatter: (val) => val * 2
        }
      ]

      const result = exportService._prepareWorksheetData(data, columns)

      expect(result[0]['状态']).toBe('待开始')
      expect(result[0]['数值']).toBe(200)
    })
  })
})
