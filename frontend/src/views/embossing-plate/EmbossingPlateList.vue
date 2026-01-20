<template>
  <div class="embossing-plate-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索压凸版编码、名称、尺寸、材质"
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
          @click="showDialog()"
        >
          新建压凸版
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="压凸版编码" width="150" />
        <el-table-column prop="name" label="压凸版名称" width="200" />
        <el-table-column prop="size" label="尺寸" width="180" />
        <el-table-column prop="material" label="材质" width="120" />
        <el-table-column prop="thickness" label="厚度" width="100" />
        <el-table-column label="包含产品" min-width="200">
          <template slot-scope="scope">
            <el-tag
              v-for="product in scope.row.products"
              :key="product.id"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ product.product_name }} ({{ product.quantity }}个)
            </el-tag>
            <span v-if="!scope.row.products || scope.row.products.length === 0" style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="notes"
          label="备注"
          min-width="150"
          show-overflow-tooltip
        />
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
              @click="showDialog(scope.row)"
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

    <!-- 压凸版表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="700px"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="压凸版编码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="留空则系统自动生成（格式：EP + yyyymm + 序号）"
          />
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            留空则自动生成，格式：EP202412001
          </div>
        </el-form-item>
        <el-form-item label="压凸版名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入压凸版名称" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="尺寸">
              <el-input v-model="form.size" placeholder="如：420x594mm" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="材质">
              <el-input v-model="form.material" placeholder="如：铜版、锌版" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="厚度">
          <el-input v-model="form.thickness" placeholder="如：3mm、5mm" />
        </el-form-item>

        <el-divider content-position="left">
          包含产品及数量
        </el-divider>

        <el-form-item label="产品列表">
          <el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="addProductItem"
          >
            添加产品
          </el-button>
          <div style="margin-top: 15px;">
            <el-table
              :data="productItems"
              border
              style="width: 100%"
            >
              <el-table-column label="产品名称" width="250">
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
              <el-table-column label="数量" width="150">
                <template slot-scope="scope">
                  <el-input-number
                    v-model="scope.row.quantity"
                    :min="1"
                    style="width: 100%;"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="scope">
                  <el-button
                    type="danger"
                    size="mini"
                    icon="el-icon-delete"
                    @click="removeProductItem(scope.$index)"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
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
import { embossingPlateAPI, productAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'EmbossingPlateList',
  components: { Pagination },
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: embossingPlateAPI,
      permissionPrefix: 'embossing-plate',

      // 表单相关
      productList: [],
      isEdit: false,
      productItems: [],
      form: {
        code: '',
        name: '',
        size: '',
        material: '',
        thickness: '',
        notes: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入压凸版名称', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑压凸版' : '新建压凸版'
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

    async loadProductList() {
      try {
        const response = await productAPI.getList({ is_active: true, page_size: 100 })
        this.productList = response.results || []
      } catch (error) {
        console.error('加载产品列表失败:', error)
      }
    },

    addProductItem() {
      this.productItems.push({
        product: null,
        quantity: 1,
        sort_order: this.productItems.length
      })
    },

    removeProductItem(index) {
      this.productItems.splice(index, 1)
    },

    async showDialog(row = null) {
      if (row) {
        this.isEdit = true
        this.currentRow = row
        this.dialogType = 'edit'

        try {
          const detail = await embossingPlateAPI.getDetail(row.id)
          this.form = {
            code: detail.code,
            name: detail.name,
            size: detail.size || '',
            material: detail.material || '',
            thickness: detail.thickness || '',
            notes: detail.notes || ''
          }

          if (detail.products && detail.products.length > 0) {
            this.productItems = detail.products.map(p => ({
              id: p.id,
              product: p.product,
              quantity: p.quantity,
              sort_order: p.sort_order || 0
            }))
          } else {
            this.productItems = []
          }
        } catch (error) {
          console.error('加载压凸版详情失败:', error)
        }
      } else {
        this.isEdit = false
        this.currentRow = null
        this.dialogType = 'create'
        this.form = {
          code: '',
          name: '',
          size: '',
          material: '',
          thickness: '',
          notes: ''
        }
        this.productItems = []
      }
      this.dialogVisible = true
    },

    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }

        this.formLoading = true
        try {
          const data = { ...this.form }

          if (!this.isEdit && !data.code) {
            delete data.code
          }

          const productsData = this.productItems
            .filter(item => item.product)
            .map(item => ({
              product: item.product,
              quantity: item.quantity || 1
            }))

          data.products_data = productsData

          if (this.isEdit) {
            await this.apiService.update(this.currentRow.id, data)
            this.showSuccess('保存成功')
          } else {
            await this.apiService.create(data)
            this.showSuccess('创建成功')
          }

          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.showMessage(error, this.isEdit ? '保存失败' : '创建失败')
        } finally {
          this.formLoading = false
        }
      })
    }
  }
}
</script>

<style scoped>
.embossing-plate-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
