<template>
  <div class="audit-log-list">
    <el-card>
      <el-row v-if="stats" :gutter="20" class="stats-section">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #409EFF;">
                <i class="el-icon-s-order"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total_count || 0 }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #67C23A;">
                <i class="el-icon-plus"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.action_type_stats?.create || 0 }}</div>
                <div class="stat-label">创建</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #E6A23C;">
                <i class="el-icon-edit"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.action_type_stats?.update || 0 }}</div>
                <div class="stat-label">更新</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #F56C6C;">
                <i class="el-icon-delete"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.action_type_stats?.delete || 0 }}</div>
                <div class="stat-label">删除</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <div class="header-section">
        <div class="filter-group">
          <el-select
            v-model="filters.action_type"
            placeholder="操作类型"
            clearable
            style="width: 140px;"
            @change="handleSearch"
          >
            <el-option
              v-for="item in actionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="filters.model"
            placeholder="对象类型"
            clearable
            style="width: 160px;"
            @change="handleSearch"
          >
            <el-option
              v-for="item in modelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input
            v-model="filters.user"
            placeholder="用户ID"
            clearable
            style="width: 120px;"
            @clear="handleSearch"
            @keyup.enter.native="handleSearch"
          />
          <el-input
            v-model="filters.object_id"
            placeholder="对象ID"
            clearable
            style="width: 140px;"
            @clear="handleSearch"
            @keyup.enter.native="handleSearch"
          />
          <el-input
            v-model="filters.ip_address"
            placeholder="IP地址"
            clearable
            style="width: 150px;"
            @clear="handleSearch"
            @keyup.enter.native="handleSearch"
          />
          <el-date-picker
            v-model="filters.start_date"
            type="date"
            placeholder="开始日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            style="width: 150px;"
            @change="handleSearch"
          />
          <el-date-picker
            v-model="filters.end_date"
            type="date"
            placeholder="结束日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            style="width: 150px;"
            @change="handleSearch"
          />
        </div>
        <div class="action-group">
          <el-input
            v-model="searchText"
            placeholder="搜索对象/用户名/IP"
            clearable
            style="width: 240px;"
            @input="handleSearchDebounced"
            @clear="handleSearch"
          >
            <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
          </el-input>
          <el-button @click="resetFilters">
            重置
          </el-button>
          <el-button
            v-if="canExportAuditLog"
            type="primary"
            icon="el-icon-download"
            @click="exportDialogVisible = true"
          >
            导出
          </el-button>
          <el-button
            v-if="canViewAuditExport"
            type="info"
            icon="el-icon-document"
            @click="openExportList"
          >
            导出记录
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="created_at" label="时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.created_at | formatDateTime }}
          </template>
        </el-table-column>
        <el-table-column prop="action_type" label="操作类型" width="120">
          <template slot-scope="scope">
            <el-tag :type="actionTagType(scope.row.action_type)" size="small">
              {{ actionTypeLabel(scope.row.action_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="content_type_name" label="对象类型" width="140" />
        <el-table-column prop="object_repr" label="对象" min-width="220" />
        <el-table-column prop="object_id" label="对象ID" width="120" />
        <el-table-column prop="ip_address" label="IP" width="140">
          <template slot-scope="scope">
            {{ scope.row.ip_address || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="changed_fields" label="变更字段" min-width="180">
          <template slot-scope="scope">
            <el-tag
              v-for="field in scope.row.changed_fields || []"
              :key="field"
              size="mini"
              style="margin: 2px 4px 2px 0;"
            >
              {{ field }}
            </el-tag>
            <span v-if="!scope.row.changed_fields || scope.row.changed_fields.length === 0">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              @click="openDiff(scope.row)"
            >
              查看变更
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <el-dialog
      title="变更详情"
      :visible.sync="diffVisible"
      width="720px"
    >
      <el-skeleton v-if="diffLoading" rows="8" animated />
      <div v-else>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="操作类型">
            {{ actionTypeLabel(diffData?.action_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ diffData?.user || diffData?.username || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="对象">
            {{ diffData?.object_repr || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="时间">
            {{ diffData?.created_at | formatDateTime }}
          </el-descriptions-item>
        </el-descriptions>
        <div class="diff-section">
          <div class="diff-title">变更内容</div>
          <pre class="diff-content">{{ formattedDiff }}</pre>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="diffVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="导出审计日志"
      :visible.sync="exportDialogVisible"
      width="520px"
    >
      <el-form label-width="90px">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="exportRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="exportFilters.action_type" clearable style="width: 100%;">
            <el-option
              v-for="item in actionTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="exportFilters.model" clearable style="width: 100%;">
            <el-option
              v-for="item in modelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="exportFilters.user_id" placeholder="可选" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="exportLoading" @click="handleExport">
          确认导出
        </el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="导出记录"
      :visible.sync="exportListVisible"
      width="860px"
    >
      <div class="export-filter">
        <el-select
          v-model="exportListFilters.status"
          placeholder="状态"
          clearable
          style="width: 160px;"
          @change="loadExportList"
        >
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="completed" />
          <el-option label="失败" value="failed" />
        </el-select>
        <el-input
          v-model="exportListFilters.user_id"
          placeholder="用户ID"
          clearable
          style="width: 140px;"
          @clear="loadExportList"
          @keyup.enter.native="loadExportList"
        />
        <el-date-picker
          v-model="exportListFilters.start_date"
          type="date"
          placeholder="开始日期"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          style="width: 150px;"
          @change="loadExportList"
        />
        <el-date-picker
          v-model="exportListFilters.end_date"
          type="date"
          placeholder="结束日期"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          style="width: 150px;"
          @change="loadExportList"
        />
      </div>
      <el-table
        v-loading="exportListLoading"
        :data="exportList"
        style="width: 100%;"
      >
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ scope.row.created_at | formatDateTime }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="status_display" label="状态" width="120" />
        <el-table-column prop="record_count" label="记录数" width="100" />
        <el-table-column prop="file_size" label="文件大小" width="120">
          <template slot-scope="scope">
            {{ formatFileSize(scope.row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column prop="error_message" label="错误信息" min-width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="scope">
            <el-button
              type="text"
              size="small"
              :disabled="scope.row.status !== 'completed'"
              @click="downloadExport(scope.row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <Pagination
        v-if="exportListTotal > 0"
        :current-page="exportListPage"
        :page-size="exportListPageSize"
        :total="exportListTotal"
        @current-change="handleExportPageChange"
        @size-change="handleExportPageSizeChange"
      />
      <div slot="footer">
        <el-button @click="exportListVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { auditLogAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import unwrapApiResponse from '@/utils/apiResponse'
import Pagination from '@/components/common/Pagination.vue'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'AuditLogList',
  components: { Pagination },
  mixins: [listPageMixin],
  data() {
    return {
      filters: {
        action_type: '',
        model: '',
        user: '',
        object_id: '',
        ip_address: '',
        start_date: '',
        end_date: ''
      },
      actionTypeOptions: [
        { value: 'create', label: '创建' },
        { value: 'update', label: '更新' },
        { value: 'delete', label: '删除' },
        { value: 'view', label: '查看' },
        { value: 'export', label: '导出' },
        { value: 'import', label: '导入' },
        { value: 'approve', label: '审核通过' },
        { value: 'reject', label: '审核拒绝' },
        { value: 'login', label: '登录' },
        { value: 'logout', label: '登出' }
      ],
      modelOptions: [
        { value: 'workorder', label: '施工单' },
        { value: 'workorderprocess', label: '施工单工序' },
        { value: 'workordertask', label: '施工单任务' },
        { value: 'customer', label: '客户' },
        { value: 'product', label: '产品' },
        { value: 'material', label: '物料' }
      ],
      diffVisible: false,
      diffLoading: false,
      diffData: null,
      stats: null,
      exportDialogVisible: false,
      exportLoading: false,
      exportRange: [],
      exportFilters: {
        action_type: '',
        model: '',
        user_id: ''
      },
      exportListVisible: false,
      exportListLoading: false,
      exportList: [],
      exportListPage: 1,
      exportListPageSize: 20,
      exportListTotal: 0,
      exportListFilters: {
        status: '',
        user_id: '',
        start_date: '',
        end_date: ''
      }
    }
  },
  created() {
    this.loadData()
    this.loadStats()
  },
  methods: {
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize,
        ordering: '-created_at'
      }

      if (this.searchText) params.search = this.searchText
      if (this.filters.action_type) params.action_type = this.filters.action_type
      if (this.filters.model) params.model = this.filters.model
      if (this.filters.user) params.user = this.filters.user
      if (this.filters.object_id) params.object_id = this.filters.object_id
      if (this.filters.ip_address) params.ip_address = this.filters.ip_address
      if (this.filters.start_date) params.start_date = this.filters.start_date
      if (this.filters.end_date) params.end_date = this.filters.end_date

      return auditLogAPI.getList(params)
    },
    async loadStats() {
      try {
        const response = await auditLogAPI.getStatistics()
        const payload = unwrapApiResponse(response)
        this.stats = payload?.data || payload
      } catch (error) {
        ErrorHandler.handle(error, 'AuditLogList.loadStats')
      }
    },
    actionTypeLabel(action) {
      const option = this.actionTypeOptions.find(item => item.value === action)
      return option ? option.label : action || '-'
    },
    actionTagType(action) {
      const map = {
        create: 'success',
        update: 'warning',
        delete: 'danger',
        view: 'info',
        export: 'info',
        import: 'info',
        approve: 'success',
        reject: 'danger',
        login: 'success',
        logout: 'info'
      }
      return map[action] || 'info'
    },
    async openDiff(row) {
      this.diffVisible = true
      this.diffLoading = true
      this.diffData = null
      try {
        const response = await auditLogAPI.getDiff(row.id)
        const payload = unwrapApiResponse(response)
        this.diffData = payload?.data || payload
      } catch (error) {
        ErrorHandler.handle(error, 'AuditLogList.openDiff')
        this.$message.error('获取变更详情失败')
      } finally {
        this.diffLoading = false
      }
    },
    async handleExport() {
      this.exportLoading = true
      try {
        const [startDate, endDate] = this.exportRange || []
        const filters = {}
        if (this.exportFilters.action_type) filters.action_type = this.exportFilters.action_type
        if (this.exportFilters.model) filters.model = this.exportFilters.model
        if (this.exportFilters.user_id) filters.user_id = this.exportFilters.user_id

        const payload = {
          start_date: startDate,
          end_date: endDate,
          filters
        }

        const response = await auditLogAPI.exportLogs(payload)
        const data = unwrapApiResponse(response)
        const exportInfo = data?.data || data
        this.$message.success(`导出任务已创建: ${exportInfo.export_id || '-'}`)
        this.exportDialogVisible = false
      } catch (error) {
        ErrorHandler.handle(error, 'AuditLogList.handleExport')
        this.$message.error('创建导出任务失败')
      } finally {
        this.exportLoading = false
      }
    },
    async openExportList() {
      this.exportListVisible = true
      this.exportListPage = 1
      await this.loadExportList()
    },
    async loadExportList() {
      this.exportListLoading = true
      try {
        const params = {
          page: this.exportListPage,
          page_size: this.exportListPageSize
        }
        if (this.exportListFilters.status) params.status = this.exportListFilters.status
        if (this.exportListFilters.user_id) params.user_id = this.exportListFilters.user_id
        if (this.exportListFilters.start_date) params.start_date = this.exportListFilters.start_date
        if (this.exportListFilters.end_date) params.end_date = this.exportListFilters.end_date

        const response = await auditLogAPI.getExportList(params)
        const payload = unwrapApiResponse(response)
        const listData = payload?.results || payload?.items || payload
        this.exportList = Array.isArray(listData) ? listData : []
        this.exportListTotal = payload?.count || payload?.pagination?.total_items || 0
      } catch (error) {
        ErrorHandler.handle(error, 'AuditLogList.loadExportList')
        this.$message.error('加载导出记录失败')
      } finally {
        this.exportListLoading = false
      }
    },
    handleExportPageChange(page) {
      this.exportListPage = page
      this.loadExportList()
    },
    handleExportPageSizeChange(size) {
      this.exportListPageSize = size
      this.exportListPage = 1
      this.loadExportList()
    },
    async downloadExport(row) {
      try {
        const blob = await auditLogAPI.downloadExport(row.id)
        const filename = this.getExportFilename(row)
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        ErrorHandler.handle(error, 'AuditLogList.downloadExport')
        this.$message.error('下载导出文件失败')
      }
    },
    getExportFilename(row) {
      if (row.file_path) {
        const parts = String(row.file_path).split('/')
        return parts[parts.length - 1]
      }
      return `audit_log_${row.id}.csv`
    },
    formatFileSize(size) {
      if (!size) return '-'
      if (size < 1024) return `${size} B`
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    },
    maskSensitiveFields(input) {
      const sensitiveKeys = [
        'password',
        'token',
        'secret',
        'csrf',
        'api_key',
        'access',
        'refresh'
      ]

      const isSensitive = (key) => {
        if (!key) return false
        const normalized = String(key).toLowerCase()
        return sensitiveKeys.some(item => normalized.includes(item))
      }

      const walk = (value) => {
        if (Array.isArray(value)) {
          return value.map(item => walk(item))
        }
        if (value && typeof value === 'object') {
          const result = {}
          Object.keys(value).forEach((key) => {
            if (isSensitive(key)) {
              result[key] = '***'
            } else {
              result[key] = walk(value[key])
            }
          })
          return result
        }
        return value
      }

      return walk(input)
    }
  },
  computed: {
    formattedDiff() {
      if (!this.diffData || !this.diffData.changes) return '-'
      try {
        const masked = this.maskSensitiveFields(this.diffData.changes)
        return JSON.stringify(masked, null, 2)
      } catch (e) {
        return String(this.diffData.changes)
      }
    },
    canExportAuditLog() {
      const hasPermission = this.$store.getters['user/hasPermission']
      return hasPermission('workorder.add_auditlogexport')
    },
    canViewAuditExport() {
      const hasPermission = this.$store.getters['user/hasPermission']
      return hasPermission('workorder.view_auditlogexport')
    }
  }
}
</script>

<style scoped>
.header-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.action-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.diff-section {
  margin-top: 16px;
}

.diff-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.diff-content {
  background: #f7f9fb;
  border: 1px solid #e6ebf5;
  padding: 12px;
  border-radius: 4px;
  max-height: 360px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 10px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.export-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}
</style>
