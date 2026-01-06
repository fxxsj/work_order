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
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button 
          v-if="canCreate" 
          type="primary" 
          icon="el-icon-plus" 
          @click="showDialog()">
          新建部门
        </el-button>
      </div>

      <el-table
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
        <el-table-column prop="sort_order" label="排序" width="100" align="center"></el-table-column>
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
              v-if="canEdit" 
              type="text" 
              size="small" 
              @click="showDialog(scope.row)">
              编辑
            </el-button>
            <el-button 
              v-if="canDelete" 
              type="text" 
              size="small" 
              style="color: #F56C6C;" 
              @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; text-align: right;"
        @current-change="handlePageChange"
      >
      </el-pagination>
    </el-card>

    <!-- 部门表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="500px"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入部门编码（英文，如：prepress）" :disabled="isEdit"></el-input>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            建议使用英文小写，如：prepress、printing、surface等
          </div>
        </el-form-item>
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称（中文）"></el-input>
        </el-form-item>
        <el-form-item label="上级部门">
          <el-select
            v-model="form.parent"
            placeholder="请选择上级部门（可选）"
            clearable
            filterable
            style="width: 100%;"
            :disabled="isEdit && form.children_count > 0"
          >
            <el-option
              v-for="dept in availableParents"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            >
            </el-option>
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
          ></el-input-number>
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
          <el-switch v-model="form.is_active"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { departmentAPI, processAPI } from '@/api/workorder'

export default {
  name: 'DepartmentList',
  data() {
    return {
      loading: false,
      tableData: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      searchText: '',
      dialogVisible: false,
      isEdit: false,
      editId: null,
      allProcesses: [],
      allDepartments: [],
      expandedProcesses: {}, // 记录每行工序的展开状态，key为部门ID
      form: {
        code: '',
        name: '',
        parent: null,
        sort_order: 0,
        is_active: true,
        processes: [],
        children_count: 0
      },
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
    dialogTitle() {
      return this.isEdit ? '编辑部门' : '新建部门'
    },
    canCreate() {
      return this.hasPermission('workorder.add_department')
    },
    canEdit() {
      return this.hasPermission('workorder.change_department')
    },
    canDelete() {
      return this.hasPermission('workorder.delete_department')
    },
    availableParents() {
      // 可选的上级部门：排除自己和自己的子部门（避免循环引用）
      if (this.isEdit && this.editId) {
        return this.allDepartments.filter(dept => {
          // 排除自己
          if (dept.id === this.editId) return false
          // 排除自己的子部门（简单检查，实际应该递归检查）
          // 这里简化处理，只排除直接子部门
          return true
        })
      }
      return this.allDepartments
    }
  },
  created() {
    this.loadAllProcesses()
    this.loadAllDepartments()
    this.loadData()
  },
  methods: {
    // 检查用户是否有指定权限
    hasPermission(permission) {
      const userInfo = this.$store.getters.currentUser
      if (!userInfo) return false
      
      // 超级用户拥有所有权限
      if (userInfo.is_superuser) return true
      
      // 检查权限列表
      const permissions = userInfo.permissions || []
      if (permissions.includes('*')) return true
      
      return permissions.includes(permission)
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
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          page_size: this.pageSize
        }
        
        // 简单搜索（后端可能需要添加search字段支持）
        const response = await departmentAPI.getList(params)
        let results = response.results || []
        
        // 前端过滤搜索
        if (this.searchText) {
          const searchLower = this.searchText.toLowerCase()
          results = results.filter(item => 
            item.name.toLowerCase().includes(searchLower) ||
            item.code.toLowerCase().includes(searchLower)
          )
        }
        
        this.tableData = results
        this.total = response.count || results.length
      } catch (error) {
        this.$message.error('加载数据失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.currentPage = 1
      this.loadData()
    },
    handlePageChange(page) {
      this.currentPage = page
      this.loadData()
    },
    async loadAllProcesses() {
      try {
        // 分页加载所有工序
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
            // 检查是否还有更多数据
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }
        
        this.allProcesses = allProcesses
      } catch (error) {
        console.error('加载工序列表失败:', error)
        this.allProcesses = []
      }
    },
    async loadAllDepartments() {
      try {
        // 加载所有部门，用于选择上级部门
        let allDepartments = []
        let page = 1
        let hasMore = true
        
        while (hasMore) {
          const response = await departmentAPI.getList({ 
            page_size: 100,
            page: page
          })
          
          if (response.results && response.results.length > 0) {
            allDepartments = allDepartments.concat(response.results)
            // 检查是否还有更多数据
            hasMore = response.next !== null && response.next !== undefined
            page++
          } else {
            hasMore = false
          }
        }
        
        this.allDepartments = allDepartments
      } catch (error) {
        console.error('加载部门列表失败:', error)
        this.allDepartments = []
      }
    },
    showDialog(row = null) {
      if (row) {
        this.isEdit = true
        this.editId = row.id
        this.form = {
          code: row.code,
          name: row.name,
          parent: row.parent || null,
          sort_order: row.sort_order,
          is_active: row.is_active,
          processes: row.processes || [],
          children_count: row.children_count || 0
        }
      } else {
        this.isEdit = false
        this.editId = null
        this.form = {
          code: '',
          name: '',
          parent: null,
          sort_order: 0,
          is_active: true,
          processes: [],
          children_count: 0
        }
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },
    getRowClassName({ row }) {
      // 为子部门添加样式，便于区分层级
      if (row.parent) {
        return 'child-department-row'
      }
      return ''
    },
    handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        try {
          if (this.isEdit) {
            await departmentAPI.update(this.editId, this.form)
            this.$message.success('保存成功')
          } else {
            await departmentAPI.create(this.form)
            this.$message.success('创建成功')
          }
          
          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          const errorMsg = error.response?.data?.detail || error.response?.data?.error || 
                          (this.isEdit ? '保存失败' : '创建失败')
          this.$message.error(errorMsg)
          console.error(error)
        }
      })
    },
    handleDelete(row) {
      this.$confirm(`确定要删除部门 "${row.name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await departmentAPI.delete(row.id)
          this.$message.success('删除成功')
          this.loadData()
        } catch (error) {
          const errorMsg = error.response?.data?.detail || '删除失败，该部门可能已被工序使用'
          this.$message.error(errorMsg)
          console.error(error)
        }
      }).catch(() => {})
    },
    // 获取要显示的工序列表
    getDisplayedProcesses(row) {
      if (!row.process_names || row.process_names.length === 0) {
        return []
      }
      const isExpanded = this.expandedProcesses[row.id]
      // 如果已展开或只有一个工序，显示全部
      if (isExpanded || row.process_names.length <= 1) {
        return row.process_names
      }
      // 否则只显示第一个
      return [row.process_names[0]]
    },
    // 判断是否需要显示 "+n" 按钮
    shouldShowMoreButton(row) {
      if (!row.process_names || row.process_names.length <= 1) {
        return false
      }
      // 工序数量大于1时，需要显示展开/收起按钮
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

