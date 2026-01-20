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

      <!-- 空状态显示 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无物料数据"
        :image-size="200"
      >
        <el-button v-if="canCreate()" type="primary" @click="showCreateDialog()">
          创建第一个物料
        </el-button>
      </el-empty>

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
      width="650px"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="110px"
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
        <el-form-item label="单价" prop="unit_price">
          <el-input-number
            v-model="form.unit_price"
            :min="0"
            :max="999999999.99"
            :precision="2"
            :step="0.01"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock_quantity">
          <el-input-number
            v-model="form.stock_quantity"
            :min="0"
            :precision="3"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="最小库存" prop="min_stock_quantity">
          <el-input-number
            v-model="form.min_stock_quantity"
            :min="0"
            :precision="3"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="采购周期（天）" prop="lead_time_days">
          <el-input-number
            v-model="form.lead_time_days"
            :min="0"
            :max="365"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="需要开料">
          <el-switch v-model="form.need_cutting" />
        </el-form-item>
        <el-form-item label="默认供应商">
          <el-select
            v-model="form.default_supplier"
            filterable
            clearable
            placeholder="请选择供应商"
            style="width: 100%;"
          >
            <el-option
              v-for="supplier in supplierList"
              :key="supplier.id"
              :label="`${supplier.code} - ${supplier.name}`"
              :value="supplier.id"
            />
          </el-select>
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
import { materialAPI, supplierAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import formDialogMixin from '@/mixins/formDialogMixin'
import Pagination from '@/components/common/Pagination.vue'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'MaterialList',
  components: { Pagination },
  mixins: [listPageMixin, crudPermissionMixin, formDialogMixin],

  data() {
    return {
      // API 服务和权限配置
      apiService: materialAPI,
      permissionPrefix: 'material',

      // 对话框状态
      dialogVisible: false,
      dialogType: 'create',
      formLoading: false,
      currentRow: null,

      // 表单初始值常量（避免重复）
      formInitialValues: {
        code: '',
        name: '',
        specification: '',
        unit: '个',
        unit_price: 0,
        stock_quantity: 0,
        min_stock_quantity: 0,
        lead_time_days: 7,
        need_cutting: false,
        default_supplier: null,
        notes: ''
      },

      // 表单相关
      form: { ...this.formInitialValues },
      supplierList: [],

      rules: {
        code: [
          { required: true, message: '请输入物料编码', trigger: 'blur' },
          { pattern: /^[A-Za-z0-9-]+$/, message: '物料编码只能包含字母、数字和连字符', trigger: 'blur' },
          { min: 2, max: 50, message: '物料编码长度必须在2-50个字符之间', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入物料名称', trigger: 'blur' },
          { min: 1, max: 200, message: '物料名称不能超过200个字符', trigger: 'blur' }
        ],
        unit: [
          { required: true, message: '请输入单位', trigger: 'blur' }
        ],
        unit_price: [
          { type: 'number', min: 0, max: 999999999.99, message: '单价必须在0-999999999.99之间', trigger: 'blur' }
        ],
        stock_quantity: [
          { type: 'number', min: 0, message: '库存数量不能为负数', trigger: 'blur' }
        ],
        min_stock_quantity: [
          { type: 'number', min: 0, message: '最小库存不能为负数', trigger: 'blur' }
        ],
        lead_time_days: [
          { type: 'number', min: 0, max: 365, message: '采购周期必须在0-365天之间', trigger: 'blur' }
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
        // 使用Number()处理数字，避免精度丢失
        this.form = {
          code: this.currentRow.code,
          name: this.currentRow.name,
          specification: this.currentRow.specification || '',
          unit: this.currentRow.unit,
          unit_price: Number(this.currentRow.unit_price) || 0,
          stock_quantity: Number(this.currentRow.stock_quantity) || 0,
          min_stock_quantity: Number(this.currentRow.min_stock_quantity) || 0,
          lead_time_days: this.currentRow.lead_time_days || 7,
          need_cutting: this.currentRow.need_cutting || false,
          default_supplier: this.currentRow.default_supplier || null,
          notes: this.currentRow.notes || ''
        }
      }
    }
  },

  created() {
    this.loadData()
    this.loadSuppliers()
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

    // 加载供应商列表
    async loadSuppliers() {
      try {
        const response = await supplierAPI.getList({ page_size: 1000, status: 'active' })
        this.supplierList = response.results || []
      } catch (error) {
        console.error('加载供应商列表失败:', error)
      }
    },

    showCreateDialog() {
      this.resetForm()
      this.dialogVisible = true
      this.dialogType = 'create'
      this.currentRow = null
    },

    showEditDialog(row) {
      this.dialogVisible = true
      this.dialogType = 'edit'
      this.currentRow = row
    },

    handleEdit(row) {
      this.showEditDialog(row)
    },

    resetForm() {
      // 使用初始值常量重置表单
      this.form = { ...this.formInitialValues }
    },

    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return false

        this.formLoading = true
        try {
          if (this.dialogType === 'edit') {
            await this.apiService.update(this.currentRow.id, this.form)
            ErrorHandler.showSuccess('保存成功')
          } else {
            await this.apiService.create(this.form)
            ErrorHandler.showSuccess('创建成功')
          }

          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          ErrorHandler.showMessage(error, this.dialogType === 'edit' ? '保存失败' : '创建失败')
        } finally {
          this.formLoading = false
        }
      })
    },

    async handleDelete(row) {
      try {
        await ErrorHandler.confirm(`确定要删除物料"${row.name}"吗？此操作不可撤销。`)
        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '删除')
        }
      }
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
