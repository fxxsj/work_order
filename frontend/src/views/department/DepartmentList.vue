<template>
  <div class="department-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索部门名称、编码"
          style="width: 300px;"
          clearable
          @clear="handleSearch"
          @keyup.enter.native="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
        </el-input>
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="showCreateDialog()"
        >
          新建部门
        </el-button>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无部门数据"
        style="margin-top: 40px;"
      >
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="showCreateDialog()"
        >
          新建部门
        </el-button>
      </el-empty>

      <el-table
        v-else
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="code" label="部门编码" width="150">
          <template slot-scope="scope">
            {{ scope.row.code }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="部门名称" width="180">
          <template slot-scope="scope">
            <span v-if="scope.row.parent" style="color: #4087FA;">{{ scope.row.name }}</span>
            <span v-else>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="parent_name" label="上级部门" width="120">
          <template slot-scope="scope">
            <span v-if="scope.row.parent_name" style="color: #409EFF;">{{ scope.row.parent_name }}</span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="子部门" width="100" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.children_count > 0" type="info" size="small">
              {{ scope.row.children_count }}个
            </el-tag>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="工序" min-width="200">
          <template slot-scope="scope">
            <template v-if="!scope.row.process_names || scope.row.process_names.length === 0">
              <span style="color: #909399;">-</span>
            </template>
            <template v-else>
              <el-tag
                v-for="processName in getDisplayedProcesses(scope.row)"
                :key="processName"
                size="small"
                style="margin-right: 5px; margin-bottom: 5px;"
              >
                {{ processName }}
              </el-tag>
              <el-tag
                v-if="shouldShowMoreButton(scope.row)"
                size="small"
                style="margin-right: 5px; margin-bottom: 5px; cursor: pointer;"
                @click.native="toggleProcessExpansion(scope.row)"
              >
                {{ getMoreButtonText(scope.row) }}
              </el-tag>
            </template>
          </template>
        </el-table-column>
        <el-table-column
          prop="sort_order"
          label="排序"
          width="100"
          align="center"
        />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
              type="text"
              size="small"
              style="color: #F56C6C;"
              @click="handleDelete(scope.row)"
            >
              删除
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

    <!-- 部门表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="部门编码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="请输入部门编码（英文，如：prepress）"
            :disabled="isEditMode"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            建议使用英文小写，如：prepress、printing、surface等
          </div>
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称（中文）" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select
            v-model="form.parent"
            placeholder="请选择上级部门（可选）"
            clearable
            filterable
            style="width: 100%;"
            :disabled="isEditMode && form.children_count > 0"
          >
            <el-option
              v-for="dept in availableParents"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            选择上级部门可建立部门层级关系（如：生产部 > 裁切车间）
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="form.sort_order"
            :min="0"
            style="width: 100%;"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            数字越小越靠前显示
          </div>
        </el-form-item>
        <el-form-item label="工序">
          <el-checkbox-group v-model="form.processes" style="width: 100%;">
            <el-checkbox
              v-for="process in allProcesses"
              :key="process.id"
              :label="process.id"
              :disabled="!process.is_active"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { departmentAPI, processAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import formDialogMixin from '@/mixins/formDialogMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import ErrorHandler from '@/utils/errorHandler'
import Pagination from '@/components/common/Pagination.vue'

// 表单初始值常量
const formInitialValues = {
  code: '',
  name: '',
  parent: null,
  sort_order: 0,
  is_active: true,
  processes: [],
  children_count: 0
}

export default {
  name: 'DepartmentList',
  components: { Pagination },
  mixins: [listPageMixin, formDialogMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: departmentAPI,
      permissionPrefix: 'department',

      // 自定义数据
      allProcesses: [],
      allDepartments: [],
      expandedProcesses: {}, // 记录每行工序的展开状态，key为部门ID
      currentRow: null, // 当前编辑的行

      // 表单数据
      form: { ...formInitialValues },
      rules: {
        code: [
          { required: true, message: '请输入部门编码', trigger: 'blur' },
          { pattern: /^[a-z0-9_]+$/, message: '部门编码只能包含小写字母、数字和下划线', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入部门名称', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    availableParents() {
      // 可选的上级部门：排除自己和自己的子部门（避免循环引用）
      if (this.isEditMode && this.currentRow) {
        return this.allDepartments.filter(dept => {
          // 排除自己
          if (dept.id === this.currentRow.id) return false
          // 排除层级太深的部门（最多3级）
          if (dept.level >= 2) return false
          return true
        })
      }
      // 创建时只能选择层级不超过2的部门作为上级
      return this.allDepartments.filter(dept => dept.level < 2)
    }
  },
  created() {
    this.loadAllProcesses()
    this.loadAllDepartments()
    this.loadData()
  },
  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize
      }

      // 使用后端搜索参数
      if (this.searchText) {
        params.search = this.searchText
      }

      const response = await this.apiService.getList(params)

      return {
        results: response.results || [],
        count: response.count || 0
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    async loadAllProcesses() {
      try {
        let allProcesses = []
        let page = 1
        let hasMore = true

        while (hasMore) {
          const response = await processAPI.getList({
            is_active: true,
            page_size: 100,
            page: page
          })

          if (response.results && response.results.length > 0) {
            allProcesses = allProcesses.concat(response.results)
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }

        this.allProcesses = allProcesses
      } catch (error) {
        ErrorHandler.showMessage(error, '加载工序列表')
        this.allProcesses = []
      }
    },

    async loadAllDepartments() {
      try {
        // 使用新的 getAll API
        const response = await departmentAPI.getAll()
        this.allDepartments = response || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载部门列表')
        this.allDepartments = []
      }
    },

    // 重写 showCreateDialog（覆盖 formDialogMixin 的默认实现）
    showCreateDialog() {
      this.dialogType = 'create'
      this.dialogTitle = '新建部门'
      this.currentRow = null
      this.customResetForm()
      this.dialogVisible = true
    },

    // 编辑方法
    handleEdit(row) {
      this.dialogType = 'edit'
      this.dialogTitle = '编辑部门'
      this.currentRow = row
      this.form = {
        code: row.code,
        name: row.name,
        parent: row.parent || null,
        sort_order: row.sort_order,
        is_active: row.is_active,
        processes: row.processes || [],
        children_count: row.children_count || 0
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },

    // 自定义重置表单方法（formDialogMixin 会调用）
    customResetForm() {
      this.form = { ...formInitialValues }
      this.currentRow = null
    },

    // 删除方法
    async handleDelete(row) {
      const confirmed = await ErrorHandler.confirm(
        `确定要删除部门「${row.name}」吗？`,
        '确认删除'
      )

      if (!confirmed) return

      try {
        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        this.loadData()
        this.loadAllDepartments() // 刷新部门列表
      } catch (error) {
        ErrorHandler.showMessage(error, '删除部门')
      }
    },

    getRowClassName({ row }) {
      // 为子部门添加样式，便于区分层级
      if (row.parent) {
        return 'child-department-row'
      }
      return ''
    },

    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return false

        this.dialogLoading = true
        try {
          if (this.isEditMode) {
            await this.apiService.update(this.currentRow.id, this.form)
            ErrorHandler.showSuccess('保存成功')
          } else {
            await this.apiService.create(this.form)
            ErrorHandler.showSuccess('创建成功')
          }

          this.dialogVisible = false
          this.loadData()
          this.loadAllDepartments() // 刷新部门列表
        } catch (error) {
          ErrorHandler.showMessage(error, this.isEditMode ? '保存部门' : '创建部门')
        } finally {
          this.dialogLoading = false
        }
      })
    },

    // 获取要显示的工序列表
    getDisplayedProcesses(row) {
      if (!row.process_names || row.process_names.length === 0) {
        return []
      }
      const isExpanded = this.expandedProcesses[row.id]
      if (isExpanded || row.process_names.length <= 1) {
        return row.process_names
      }
      return [row.process_names[0]]
    },

    // 判断是否需要显示 "+n" 按钮
    shouldShowMoreButton(row) {
      if (!row.process_names || row.process_names.length <= 1) {
        return false
      }
      return true
    },

    // 获取 "+n" 按钮的文本
    getMoreButtonText(row) {
      if (!row.process_names || row.process_names.length <= 1) {
        return ''
      }
      const isExpanded = this.expandedProcesses[row.id]
      if (isExpanded) {
        return '收起'
      }
      const remainingCount = row.process_names.length - 1
      return `+${remainingCount}`
    },

    // 切换工序展开/收起状态
    toggleProcessExpansion(row) {
      const rowId = row.id
      this.$set(this.expandedProcesses, rowId, !this.expandedProcesses[rowId])
    }
  }
}
</script>

<style scoped>
.department-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 子部门行样式 */
::v-deep .child-department-row {
  background-color: #f5f7fa;
}

::v-deep .child-department-row:hover {
  background-color: #ecf5ff;
}
</style>
