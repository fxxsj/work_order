<template>
  <div class="artwork-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索图稿编码、名称、拼版尺寸"
          style="width: 300px;"
          clearable
          @clear="handleSearch"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button type="primary" icon="el-icon-plus" @click="showDialog()">
          新建图稿
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="图稿编码" width="150"></el-table-column>
        <el-table-column prop="name" label="图稿名称" width="200"></el-table-column>
        <el-table-column prop="color_count" label="色数" width="100" align="center">
          <template slot-scope="scope">
            <el-tag>{{ scope.row.color_count }}色</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="imposition_size" label="拼版尺寸" width="180"></el-table-column>
        <el-table-column label="包含产品" min-width="200">
          <template slot-scope="scope">
            <el-tag
              v-for="product in scope.row.products"
              :key="product.id"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ product.product_name }} ({{ product.imposition_quantity }}拼)
            </el-tag>
            <span v-if="!scope.row.products || scope.row.products.length === 0" style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="showDialog(scope.row)">
              编辑
            </el-button>
            <el-button type="text" size="small" style="color: #F56C6C;" @click="handleDelete(scope.row)">
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

    <!-- 图稿表单对话框 -->
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
        <el-form-item label="图稿编码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="留空则系统自动生成（格式：ART + yyyymm + 序号）"
            :disabled="isEdit"
          ></el-input>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            {{ isEdit ? '编码不可修改' : '留空则自动生成，格式：ART202412001' }}
          </div>
        </el-form-item>
        <el-form-item label="图稿名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入图稿名称"></el-input>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="色数" prop="color_count">
              <el-input-number
                v-model="form.color_count"
                :min="1"
                :max="10"
                style="width: 100%;"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="拼版尺寸">
              <el-input v-model="form.imposition_size" placeholder="如：420x594mm"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">包含产品及拼版数量</el-divider>
        
        <el-form-item label="产品列表">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="addProductItem">
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
                    ></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="拼版数量" width="150">
                <template slot-scope="scope">
                  <el-input-number
                    v-model="scope.row.imposition_quantity"
                    :min="1"
                    style="width: 100%;"
                    size="small"
                  ></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="scope">
                  <el-button
                    type="danger"
                    size="mini"
                    icon="el-icon-delete"
                    @click="removeProductItem(scope.$index)"
                  ></el-button>
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
          ></el-input>
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
import { artworkAPI, artworkProductAPI, productAPI } from '@/api/workorder'

export default {
  name: 'ArtworkList',
  data() {
    return {
      loading: false,
      tableData: [],
      productList: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      searchText: '',
      dialogVisible: false,
      isEdit: false,
      editId: null,
      productItems: [], // 产品列表
      form: {
        code: '',
        name: '',
        color_count: 4,
        imposition_size: '',
        notes: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入图稿名称', trigger: 'blur' }
        ],
        color_count: [
          { required: true, message: '请输入色数', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑图稿' : '新建图稿'
    }
  },
  created() {
    this.loadData()
    this.loadProductList()
  },
  methods: {
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
    async loadData() {
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          page_size: this.pageSize
        }
        
        if (this.searchText) {
          params.search = this.searchText
        }
        
        const response = await artworkAPI.getList(params)
        this.tableData = response.results || []
        this.total = response.count || 0
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
    addProductItem() {
      this.productItems.push({
        product: null,
        imposition_quantity: 1,
        sort_order: this.productItems.length
      })
    },
    removeProductItem(index) {
      this.productItems.splice(index, 1)
    },
    async showDialog(row = null) {
      if (row) {
        this.isEdit = true
        this.editId = row.id
        
        // 加载图稿详情
        try {
          const detail = await artworkAPI.getDetail(row.id)
          this.form = {
            code: detail.code,
            name: detail.name,
            color_count: detail.color_count,
            imposition_size: detail.imposition_size || '',
            notes: detail.notes || ''
          }
          
          // 加载产品列表
          if (detail.products && detail.products.length > 0) {
            this.productItems = detail.products.map(p => ({
              id: p.id, // 编辑时保留ID
              product: p.product,
              imposition_quantity: p.imposition_quantity,
              sort_order: p.sort_order || 0
            }))
          } else {
            this.productItems = []
          }
        } catch (error) {
          console.error('加载图稿详情失败:', error)
        }
      } else {
        this.isEdit = false
        this.editId = null
        this.form = {
          code: '',
          name: '',
          color_count: 4,
          imposition_size: '',
          notes: ''
        }
        this.productItems = []
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.clearValidate()
        }
      })
    },
    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        try {
          const data = { ...this.form }
          
          // 如果是新建且编码为空，不传编码字段（让后端自动生成）
          if (!this.isEdit && !data.code) {
            delete data.code
          }
          
          // 准备产品数据
          const productsData = this.productItems
            .filter(item => item.product)
            .map(item => ({
              product: item.product,
              imposition_quantity: item.imposition_quantity || 1
            }))
          
          // 将产品数据添加到请求中
          data.products_data = productsData
          
          if (this.isEdit) {
            await artworkAPI.update(this.editId, data)
            this.$message.success('保存成功')
          } else {
            await artworkAPI.create(data)
            this.$message.success('创建成功')
          }
          
          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.$message.error(this.isEdit ? '保存失败' : '创建失败')
          console.error(error)
        }
      })
    },
    handleDelete(row) {
      this.$confirm(`确定要删除图稿 ${row.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await artworkAPI.delete(row.id)
          this.$message.success('删除成功')
          this.loadData()
        } catch (error) {
          this.$message.error('删除失败')
          console.error(error)
        }
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.artwork-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

