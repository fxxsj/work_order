<template>
  <div class="product-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索产品名称、编码"
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
          新建产品
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="产品编码" width="120" />
        <el-table-column prop="name" label="产品名称" width="200" />
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
          width="100"
          align="right"
        />
        <el-table-column
          prop="min_stock_quantity"
          label="最小库存"
          width="100"
          align="right"
        />
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="description"
          label="描述"
          min-width="150"
          show-overflow-tooltip
        />
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

      <!-- 空状态显示 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无产品数据"
        :image-size="200"
        style="margin-top: 50px;"
      >
        <el-button v-if="canCreate()" type="primary" @click="showCreateDialog()">
          创建第一个产品
        </el-button>
      </el-empty>
    </el-card>

    <!-- 产品表单对话框 -->
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
        <el-form-item label="产品编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入产品编码" :disabled="dialogType === 'edit'" />
        </el-form-item>
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="form.specification" placeholder="请输入产品规格" />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="如：件、张、本" />
        </el-form-item>
        <el-form-item label="单价" prop="unit_price">
          <el-input-number
            v-model="form.unit_price"
            :min="0"
            :precision="2"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="库存数量" prop="stock_quantity">
          <el-input-number
            v-model="form.stock_quantity"
            :min="0"
            :precision="0"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="最小库存" prop="min_stock_quantity">
          <el-input-number
            v-model="form.min_stock_quantity"
            :min="0"
            :precision="0"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="产品描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="请输入产品描述"
          />
        </el-form-item>

        <el-divider content-position="left">
          默认物料配置
        </el-divider>

        <el-form-item label="物料列表">
          <el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="addProductMaterialItem"
          >
            添加物料
          </el-button>
          <div style="margin-top: 15px;">
            <el-table
              :data="productMaterialItems"
              border
              style="width: 100%"
            >
              <el-table-column label="物料名称" width="200">
                <template slot-scope="scope">
                  <el-select
                    v-model="scope.row.material"
                    placeholder="请选择物料"
                    filterable
                    style="width: 100%;"
                  >
                    <el-option
                      v-for="material in materialList"
                      :key="material.id"
                      :label="`${material.name} (${material.code})`"
                      :value="material.id"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="尺寸" width="180">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.material_size"
                    placeholder="如：A4、210x297mm"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="用量" width="180">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.material_usage"
                    placeholder="如：1000张、50平方米"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="需要开料" width="100" align="center">
                <template slot-scope="scope">
                  <el-switch
                    v-model="scope.row.need_cutting"
                    size="small"
                  />
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="200">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.notes"
                    placeholder="请输入备注"
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
                    @click="removeProductMaterialItem(scope.$index)"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>

        <el-divider content-position="left">
          默认工序配置
        </el-divider>

        <el-form-item label="默认工序">
          <el-checkbox-group v-model="form.default_processes" style="width: 100%;">
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
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { productAPI, processAPI, materialAPI, productMaterialAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'ProductList',
  components: { Pagination },
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: productAPI,
      permissionPrefix: 'product',

      // 对话框状态（crudMixin 提供的属性）
      dialogVisible: false,
      dialogType: 'create',
      formLoading: false,
      currentRow: null,

      // 自定义数据
      allProcesses: [],
      materialList: [],
      productMaterialItems: [],
      form: {
        code: '',
        name: '',
        specification: '',
        unit: '件',
        unit_price: 0,
        stock_quantity: 0,
        min_stock_quantity: 0,
        description: '',
        is_active: true,
        default_processes: []
      },
      rules: {
        code: [
          { required: true, message: '请输入产品编码', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入产品名称', trigger: 'blur' }
        ],
        specification: [
          { required: true, message: '请输入产品规格', trigger: 'blur' }
        ],
        unit: [
          { required: true, message: '请输入单位', trigger: 'blur' }
        ],
        unit_price: [
          { required: true, message: '请输入单价', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    formTitle() {
      return this.dialogType === 'edit' ? '编辑产品' : '新建产品'
    }
  },
  watch: {
    // 监听对话框显示状态，编辑时填充表单
    dialogVisible(val) {
      if (val && this.dialogType === 'edit' && this.currentRow) {
        this.loadProductDetail(this.currentRow)
      }
    }
  },
  created() {
    this.loadData()
    this.loadAllProcesses()
    this.loadMaterialList()
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
        console.error('加载工序列表失败:', error)
      }
    },

    async loadMaterialList() {
      try {
        const response = await materialAPI.getList({ page_size: 100 })
        this.materialList = response.results || []
      } catch (error) {
        console.error('加载物料列表失败:', error)
      }
    },

    addProductMaterialItem() {
      this.productMaterialItems.push({
        material: null,
        material_size: '',
        material_usage: '',
        need_cutting: false,
        notes: '',
        sort_order: this.productMaterialItems.length
      })
    },

    removeProductMaterialItem(index) {
      this.productMaterialItems.splice(index, 1)
    },

    showCreateDialog() {
      this.resetForm()
      this.dialogType = 'create'
      this.currentRow = null
      this.dialogVisible = true
    },

    handleEdit(row) {
      this.dialogType = 'edit'
      this.currentRow = row
      this.loadProductDetail(row)
      this.dialogVisible = true
    },

    async handleDelete(row) {
      try {
        await this.$confirm(
          `确定要删除产品"${row.name}"吗？此操作不可撤销。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        await this.apiService.delete(row.id)
        this.$message.success('删除成功')
        await this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除失败:', error)
          this.$message.error('删除失败')
        }
      }
    },

    showMessage(error, defaultMessage = '操作失败') {
      let message = defaultMessage

      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          message = error.response.data
        } else if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        } else if (error.response.data.error) {
          message = error.response.data.error
        }
      } else if (error.message) {
        message = error.message
      }

      this.$message.error(message)
    },

    resetForm() {
      this.form = {
        code: '',
        name: '',
        specification: '',
        unit: '件',
        unit_price: 0,
        stock_quantity: 0,
        min_stock_quantity: 0,
        description: '',
        is_active: true,
        default_processes: []
      }
      this.productMaterialItems = []
    },

    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return false

        this.formLoading = true
        try {
          let productId
          if (this.dialogType === 'edit') {
            await this.apiService.update(this.currentRow.id, this.form)
            productId = this.currentRow.id
            this.showSuccess('保存成功')
          } else {
            const result = await this.apiService.create(this.form)
            productId = result.id
            this.showSuccess('创建成功')
          }

          // 保存产品物料
          await this.saveProductMaterials(productId)

          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.showMessage(error, this.dialogType === 'edit' ? '保存失败' : '创建失败')
        } finally {
          this.formLoading = false
        }
      })
    },

    async saveProductMaterials(productId) {
      // 如果是编辑模式，先删除所有现有物料，然后重新添加
      if (this.dialogType === 'edit') {
        try {
          const existingMaterials = await productMaterialAPI.getList({ product: productId })
          for (const material of existingMaterials.results || []) {
            await productMaterialAPI.delete(material.id)
          }
        } catch (error) {
          console.error('删除现有物料失败:', error)
        }
      }

      // 添加新物料
      for (let i = 0; i < this.productMaterialItems.length; i++) {
        const item = this.productMaterialItems[i]
        if (item.material) {
          try {
            await productMaterialAPI.create({
              product: productId,
              material: item.material,
              material_size: item.material_size || '',
              material_usage: item.material_usage || '',
              need_cutting: item.need_cutting || false,
              notes: item.notes || '',
              sort_order: i
            })
          } catch (error) {
            console.error('保存物料失败:', error)
          }
        }
      }
    },

    async loadProductDetail(row) {
      try {
        const detail = await this.apiService.getDetail(row.id)
        this.form = {
          code: detail.code,
          name: detail.name,
          specification: detail.specification || '',
          unit: detail.unit,
          unit_price: parseFloat(detail.unit_price),
          stock_quantity: detail.stock_quantity || 0,
          min_stock_quantity: detail.min_stock_quantity || 0,
          description: detail.description || '',
          is_active: detail.is_active,
          default_processes: detail.default_processes || []
        }

        // 加载产品物料
        if (detail.default_materials && detail.default_materials.length > 0) {
          this.productMaterialItems = detail.default_materials.map(m => ({
            id: m.id,
            material: m.material,
            material_size: m.material_size || '',
            material_usage: m.material_usage || '',
            need_cutting: m.need_cutting || false,
            notes: m.notes || '',
            sort_order: m.sort_order || 0
          }))
        } else {
          this.productMaterialItems = []
        }
      } catch (error) {
        console.error('加载产品详情失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.product-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
