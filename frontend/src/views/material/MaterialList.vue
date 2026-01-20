<template>
  <div class="material-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索物料名称、编码"
          style="width: 300px;"
          clearable
          @input="handleSearchDebounced"
          @clear="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
        </el-input>
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="showCreateDialog()"
        >
          新建物料
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="物料编码" width="120" />
        <el-table-column prop="name" label="物料名称" width="200" />
        <el-table-column prop="specification" label="规格" min-width="150" />
        <el-table-column
          prop="unit"
          label="单位"
          width="80"
          align="center"
        />
        <el-table-column
          prop="unit_price"
          label="单价"
          width="120"
          align="right"
        >
          <template slot-scope="scope">
            ¥{{ scope.row.unit_price }}
          </template>
        </el-table-column>
        <el-table-column
          prop="stock_quantity"
          label="库存数量"
          width="120"
          align="right"
        />
        <el-table-column prop="notes" label="备注" min-width="150" />
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

    <!-- 物料表单对话框 -->
    <el-dialog
      :title="formTitle"
      :visible.sync="dialogVisible"
      width="600px"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="物料编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入物料编码" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="物料名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.specification" placeholder="请输入规格" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="如：个、张、本" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number
            v-model="form.unit_price"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="库存数量">
          <el-input-number
            v-model="form.stock_quantity"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { materialAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'MaterialList',
  components: { Pagination },
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: materialAPI,
      permissionPrefix: 'material',

      // 表单相关
      form: {
        code: '',
        name: '',
        specification: '',
        unit: '个',
        unit_price: 0,
        stock_quantity: 0,
        notes: ''
      },
      rules: {
        code: [
          { required: true, message: '请输入物料编码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入物料名称', trigger: 'blur' }
        ],
        unit: [
          { required: true, message: '请输入单位', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    formTitle() {
      return this.dialogType === 'edit' ? '编辑物料' : '新建物料'
    }
  },
  watch: {
    // 监听对话框显示状态，编辑时填充表单
    dialogVisible(val) {
      if (val && this.dialogType === 'edit' && this.currentRow) {
        this.form = {
          code: this.currentRow.code,
          name: this.currentRow.name,
          specification: this.currentRow.specification || '',
          unit: this.currentRow.unit,
          unit_price: parseFloat(this.currentRow.unit_price),
          stock_quantity: parseFloat(this.currentRow.stock_quantity),
          notes: this.currentRow.notes || ''
        }
      }
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
        specification: '',
        unit: '个',
        unit_price: 0,
        stock_quantity: 0,
        notes: ''
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
  }
}
</script>

<style scoped>
.material-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
