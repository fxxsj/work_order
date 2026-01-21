<template>
  <div class="product-group-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索产品组编码、名称"
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
          @click="handleAdd()"
        >
          新增产品组
        </el-button>
      </div>

      <!-- 空状态显示 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无产品组数据"
        :image-size="200"
        style="margin-top: 40px;"
      >
        <el-button v-if="canCreate()" type="primary" @click="handleAdd()">
          创建第一个产品组
        </el-button>
      </el-empty>

      <el-table
        v-else
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="编码" width="150" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column
          prop="is_active"
          label="状态"
          width="100"
          align="center"
        >
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'" size="small">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="items_count"
          label="子项数量"
          width="100"
          align="center"
        >
          <template slot-scope="scope">
            {{ scope.row.items ? scope.row.items.length : 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="canEdit()"
              size="mini"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canDelete()"
              size="mini"
              type="danger"
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入编码" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>

        <el-divider content-position="left">
          子产品配置
        </el-divider>

        <el-form-item label="子产品列表">
          <el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="addItem"
          >
            添加子产品
          </el-button>
          <div style="margin-top: 15px;">
            <el-table
              :data="form.items"
              border
              style="width: 100%"
            >
              <el-table-column label="产品" min-width="200">
                <template slot-scope="scope">
                  <el-select
                    v-model="scope.row.product"
                    placeholder="请选择产品"
                    filterable
                    style="width: 100%;"
                  >
                    <el-option
                      v-for="product in productList"
                      :key="product.id"
                      :label="`${product.name} (${product.code})`"
                      :value="product.id"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="子产品名称" min-width="180">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.item_name"
                    placeholder="如：天盒、地盒"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="排序" width="120" align="center">
                <template slot-scope="scope">
                  <el-input-number
                    v-model="scope.row.sort_order"
                    :min="0"
                    size="small"
                    style="width: 100%;"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="scope">
                  <el-button
                    type="danger"
                    size="mini"
                    icon="el-icon-delete"
                    :disabled="form.items.length <= 1"
                    @click="removeItem(scope.$index)"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
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
import { productGroupAPI, productAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import formDialogMixin from '@/mixins/formDialogMixin'
import ErrorHandler from '@/utils/errorHandler'
import Pagination from '@/components/common/Pagination.vue'

// 表单初始值
const getFormInitialValues = () => ({
  id: null,
  code: '',
  name: '',
  description: '',
  is_active: true,
  items: [
    {
      product: null,
      item_name: '',
      sort_order: 0
    }
  ]
})

export default {
  name: 'ProductGroupList',
  components: { Pagination },
  mixins: [listPageMixin, crudPermissionMixin, formDialogMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: productGroupAPI,
      permissionPrefix: 'productgroup',

      // 表单相关
      productList: [],
      formLoading: false,
      form: getFormInitialValues(),
      rules: {
        code: [
          { required: true, message: '请输入编码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' }
        ]
      }
    }
  },
  watch: {
    // 监听对话框显示状态，编辑时填充表单
    dialogVisible(val) {
      if (!val) {
        this.$nextTick(() => {
          if (this.$refs.form) {
            this.$refs.form.clearValidate()
          }
        })
      }
    }
  },
  created() {
    this.loadData()
    this.loadProductList()
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

    async loadProductList() {
      try {
        const response = await productAPI.getList({ page_size: 1000 })
        this.productList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载产品列表')
      }
    },

    handleAdd() {
      this.dialogType = 'create'
      this.dialogTitle = '新增产品组'
      this.currentRow = null
      this.form = getFormInitialValues()
      this.dialogVisible = true
    },

    async handleEdit(row) {
      this.dialogType = 'edit'
      this.dialogTitle = '编辑产品组'
      this.currentRow = row

      try {
        const detail = await this.apiService.getDetail(row.id)
        this.form = {
          id: detail.id,
          code: detail.code,
          name: detail.name,
          description: detail.description || '',
          is_active: detail.is_active,
          items: detail.items && detail.items.length > 0
            ? detail.items.map(item => ({
              id: item.id,
              product: item.product,
              item_name: item.item_name,
              sort_order: item.sort_order
            }))
            : [
              {
                product: null,
                item_name: '',
                sort_order: 0
              }
            ]
        }
        this.dialogVisible = true
      } catch (error) {
        ErrorHandler.showMessage(error, '加载详情')
      }
    },

    async handleDelete(row) {
      const confirmed = await ErrorHandler.confirm(
        `确定要删除产品组"${row.name}"吗？此操作不可撤销。`
      )
      if (!confirmed) return

      try {
        await this.apiService.delete(row.id)
        ErrorHandler.showSuccess('删除成功')
        await this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, '删除失败')
      }
    },

    addItem() {
      this.form.items.push({
        product: null,
        item_name: '',
        sort_order: this.form.items.length
      })
    },

    removeItem(index) {
      this.form.items.splice(index, 1)
    },

    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }

        // 验证子产品列表
        if (!this.form.items || this.form.items.length === 0) {
          ErrorHandler.showWarning('请至少添加一个子产品')
          return
        }

        for (let i = 0; i < this.form.items.length; i++) {
          const item = this.form.items[i]
          if (!item.product) {
            ErrorHandler.showWarning(`请选择第 ${i + 1} 个子产品的产品`)
            return
          }
          if (!item.item_name) {
            ErrorHandler.showWarning(`请输入第 ${i + 1} 个子产品的名称`)
            return
          }
        }

        this.formLoading = true
        try {
          // 构建提交数据，包含 items
          const data = {
            code: this.form.code,
            name: this.form.name,
            description: this.form.description,
            is_active: this.form.is_active,
            items_write: this.form.items.map(item => ({
              product: item.product,
              item_name: item.item_name,
              sort_order: item.sort_order
            }))
          }

          if (this.form.id) {
            // 更新
            await this.apiService.update(this.form.id, data)
            ErrorHandler.showSuccess('更新成功')
          } else {
            // 创建
            await this.apiService.create(data)
            ErrorHandler.showSuccess('创建成功')
          }

          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          ErrorHandler.showMessage(error, this.form.id ? '更新失败' : '创建失败')
        } finally {
          this.formLoading = false
        }
      })
    },

    // 对话框关闭处理
    handleDialogClose() {
      this.$refs.form && this.$refs.form.resetFields()
      this.form = getFormInitialValues()
    },

    // 自定义重置表单方法（formDialogMixin 会调用）
    customResetForm() {
      this.form = getFormInitialValues()
    }
  }
}
</script>

<style scoped>
.product-group-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
