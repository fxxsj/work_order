<template>
  <div class="product-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索产品名称、编码"
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
          新建产品
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column prop="code" label="产品编码" width="120"></el-table-column>
        <el-table-column prop="name" label="产品名称" width="200"></el-table-column>
        <el-table-column prop="specification" label="规格" min-width="150"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80" align="center"></el-table-column>
        <el-table-column prop="unit_price" label="单价" width="120" align="right">
          <template slot-scope="scope">
            ¥{{ scope.row.unit_price }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip></el-table-column>
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

    <!-- 产品表单对话框 -->
    <el-dialog
      :title="dialogTitle"
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
          <el-input v-model="form.code" placeholder="请输入产品编码" :disabled="isEdit"></el-input>
        </el-form-item>
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入产品名称"></el-input>
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="form.specification" placeholder="请输入产品规格"></el-input>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="form.unit" placeholder="如：件、张、本"></el-input>
        </el-form-item>
        <el-form-item label="单价" prop="unit_price">
          <el-input-number
            v-model="form.unit_price"
            :min="0"
            :precision="2"
            style="width: 100%;"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="产品描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入产品描述"></el-input>
        </el-form-item>
        
        <el-divider content-position="left">默认物料配置</el-divider>
        
        <el-form-item label="物料列表">
          <el-button type="primary" size="small" icon="el-icon-plus" @click="addProductMaterialItem">
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
                    ></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="尺寸" width="180">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.material_size"
                    placeholder="如：A4、210x297mm"
                    size="small"
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="用量" width="180">
                <template slot-scope="scope">
                  <el-input
                    v-model="scope.row.material_usage"
                    placeholder="如：1000张、50平方米"
                    size="small"
                  ></el-input>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template slot-scope="scope">
                  <el-button
                    type="danger"
                    size="mini"
                    icon="el-icon-delete"
                    @click="removeProductMaterialItem(scope.$index)"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
        
        <el-divider content-position="left">默认工序配置</el-divider>
        
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
import { productAPI, processAPI, materialAPI, productMaterialAPI } from '@/api/workorder'

export default {
  name: 'ProductList',
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
      materialList: [],
      productMaterialItems: [], // 产品物料列表
      form: {
        code: '',
        name: '',
        specification: '',
        unit: '件',
        unit_price: 0,
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
    dialogTitle() {
      return this.isEdit ? '编辑产品' : '新建产品'
    },
    canCreate() {
      return this.hasPermission('workorder.add_product')
    },
    canEdit() {
      return this.hasPermission('workorder.change_product')
    },
    canDelete() {
      return this.hasPermission('workorder.delete_product')
    }
  },
  created() {
    this.loadData()
    this.loadAllProcesses()
    this.loadMaterialList()
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
        sort_order: this.productMaterialItems.length
      })
    },
    removeProductMaterialItem(index) {
      this.productMaterialItems.splice(index, 1)
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
        
        const response = await productAPI.getList(params)
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
    async showDialog(row = null) {
      if (row) {
        this.isEdit = true
        this.editId = row.id
        
        // 加载产品详情（包含default_processes）
        try {
          const detail = await productAPI.getDetail(row.id)
          this.form = {
            code: detail.code,
            name: detail.name,
            specification: detail.specification || '',
            unit: detail.unit,
            unit_price: parseFloat(detail.unit_price),
            description: detail.description || '',
            is_active: detail.is_active,
            default_processes: detail.default_processes || []
          }
          
          // 加载产品物料
          if (detail.default_materials && detail.default_materials.length > 0) {
            this.productMaterialItems = detail.default_materials.map(m => ({
              id: m.id, // 编辑时保留ID
              material: m.material,
              material_size: m.material_size || '',
              material_usage: m.material_usage || '',
              sort_order: m.sort_order || 0
            }))
          } else {
            this.productMaterialItems = []
          }
        } catch (error) {
          console.error('加载产品详情失败:', error)
        }
      } else {
        this.isEdit = false
        this.editId = null
        this.form = {
          code: '',
          name: '',
          specification: '',
          unit: '件',
          unit_price: 0,
          description: '',
          is_active: true,
          default_processes: []
        }
        this.productMaterialItems = []
      }
      this.dialogVisible = true
    },
    async handleSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) {
          return false
        }
        
        try {
          let productId
          if (this.isEdit) {
            await productAPI.update(this.editId, this.form)
            productId = this.editId
            this.$message.success('保存成功')
          } else {
            const result = await productAPI.create(this.form)
            productId = result.id
            this.$message.success('创建成功')
          }
          
          // 保存产品物料
          await this.saveProductMaterials(productId)
          
          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.$message.error(this.isEdit ? '保存失败' : '创建失败')
          console.error(error)
        }
      })
    },
    async saveProductMaterials(productId) {
      // 如果是编辑模式，先删除所有现有物料，然后重新添加
      if (this.isEdit) {
        try {
          // 获取现有物料列表
          const existingMaterials = await productMaterialAPI.getList({ product: productId })
          // 删除现有物料
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
              sort_order: i
            })
          } catch (error) {
            console.error('保存物料失败:', error)
          }
        }
      }
    },
    handleDelete(row) {
      this.$confirm(`确定要删除产品 ${row.name} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await productAPI.delete(row.id)
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
.product-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

