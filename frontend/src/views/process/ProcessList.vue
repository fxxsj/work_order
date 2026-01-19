<template>
  <div class="process-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索工序名称、编码"
          style="width: 300px;"
          clearable
          @input="handleSearchDebounced"
          @clear="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="showCreateDialog()">
          新建工序
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="工序编码" width="120"></el-table-column>
        <el-table-column prop="name" label="工序名称" width="180"></el-table-column>
        <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        <el-table-column prop="standard_duration" label="标准工时(小时)" width="140" align="right"></el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center"></el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
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

    <!-- 工序表单对话框 -->
    <el-dialog
      :title="formTitle"
      :visible.sync="dialogVisible"
      width="600px"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="工序编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入工序编码" :disabled="dialogType === 'edit'"></el-input>
        </el-form-item>
        <el-form-item label="工序名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入工序名称"></el-input>
        </el-form-item>
        <el-form-item label="工序描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入工序描述"></el-input>
        </el-form-item>
        <el-form-item label="标准工时(小时)">
          <el-input-number
            v-model="form.standard_duration"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="form.sort_order"
            :min="0"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="form.is_active"></el-switch>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { processAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'

export default {
  name: 'ProcessList',
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: processAPI,
      permissionPrefix: 'process',

      // 表单相关
      form: {
        code: '',
        name: '',
        description: '',
        standard_duration: 0,
        sort_order: 0,
        is_active: true
      },
      rules: {
        code: [
          { required: true, message: '请输入工序编码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入工序名称', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    formTitle() {
      return this.dialogType === 'edit' ? '编辑工序' : '新建工序'
    }
  },
  created() {
    this.loadData()
  },
  methods: {
    // 实现 fetchData 方法（listPageMixin 要求）
    async fetchData() {
      const params = {
        page: this.currentPage,
        page_size: this.pageSize
      }

      if (this.searchText) {
        params.search = this.searchText
      }

      return this.apiService.getList(params)
    },

    showCreateDialog() {
      this.resetForm()
      this.handleCreate()
    },

    resetForm() {
      this.form = {
        code: '',
        name: '',
        description: '',
        standard_duration: 0,
        sort_order: 0,
        is_active: true
      }
    },

    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return false

        this.formLoading = true
        try {
          if (this.dialogType === 'edit') {
            await this.apiService.update(this.currentRow.id, this.form)
            this.showSuccess('保存成功')
          } else {
            await this.apiService.create(this.form)
            this.showSuccess('创建成功')
          }

          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.showMessage(error, this.dialogType === 'edit' ? '保存失败' : '创建失败')
        } finally {
          this.formLoading = false
        }
      })
    }
  },
  watch: {
    // 监听对话框显示状态，编辑时填充表单
    dialogVisible(val) {
      if (val && this.dialogType === 'edit' && this.currentRow) {
        this.form = {
          code: this.currentRow.code,
          name: this.currentRow.name,
          description: this.currentRow.description || '',
          standard_duration: this.currentRow.standard_duration,
          sort_order: this.currentRow.sort_order,
          is_active: this.currentRow.is_active
        }
      }
    }
  }
}
</script>

<style scoped>
.process-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
