<template>
  <div class="product-group-list">
    <el-card>
      <div slot="header" class="card-header">
        <span>产品组管理</span>
        <el-button 
          v-if="canCreate" 
          type="primary" 
          icon="el-icon-plus" 
          @click="handleAdd">新增产品组</el-button>
      </div>

      <el-table :data="list" border style="width: 100%" v-loading="loading">
        <el-table-column prop="code" label="编码" width="150"></el-table-column>
        <el-table-column prop="name" label="名称"></el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip></el-table-column>
        <el-table-column prop="is_active" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'info'" size="small">
              {{ scope.row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="items_count" label="子项数量" width="100" align="center">
          <template slot-scope="scope">
            {{ scope.row.items ? scope.row.items.length : 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button 
              v-if="canEdit" 
              size="mini" 
              @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              v-if="canDelete" 
              size="mini" 
              type="danger" 
              @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > 0"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        :current-page="page"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        style="margin-top: 20px; text-align: right;"
      ></el-pagination>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入编码"></el-input>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          ></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="form.is_active"
            active-text="启用"
            inactive-text="禁用"
          ></el-switch>
        </el-form-item>

        <el-divider>子产品列表</el-divider>
        <div v-for="(item, index) in form.items" :key="index" style="margin-bottom: 15px; padding: 15px; border: 1px solid #e4e7ed; border-radius: 4px;">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item :label="index === 0 ? '产品' : ''" :prop="`items.${index}.product`">
                <el-select
                  v-model="item.product"
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
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="index === 0 ? '子产品名称' : ''" :prop="`items.${index}.item_name`">
                <el-input v-model="item.item_name" placeholder="如：天盒、地盒"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="index === 0 ? '排序' : ''">
                <el-input-number v-model="item.sort_order" :min="0" style="width: 100%;"></el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="4" style="text-align: right; padding-top: 30px;">
              <el-button
                v-if="form.items.length > 1"
                type="danger"
                size="mini"
                icon="el-icon-delete"
                @click="removeItem(index)"
                circle
              ></el-button>
              <el-button
                v-if="index === form.items.length - 1"
                type="primary"
                size="mini"
                icon="el-icon-plus"
                @click="addItem"
                circle
              ></el-button>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { productGroupAPI, productGroupItemAPI, productAPI } from '@/api/workorder'

export default {
  name: 'ProductGroupList',
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      page: 1,
      pageSize: 20,
      dialogVisible: false,
      dialogTitle: '新增产品组',
      submitting: false,
      productList: [],
      form: {
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
      },
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
  computed: {
    canCreate() {
      return this.hasPermission('workorder.add_productgroup')
    },
    canEdit() {
      return this.hasPermission('workorder.change_productgroup')
    },
    canDelete() {
      return this.hasPermission('workorder.delete_productgroup')
    }
  },
  created() {
    this.loadData()
    this.loadProductList()
  },
  methods: {
    // 检查用户是否有指定权限
    hasPermission(permission) {
      const userInfo = this.$store.getters['user/currentUser']
      if (!userInfo) return false
      
      // 超级用户拥有所有权限
      if (userInfo.is_superuser) return true
      
      // 检查权限列表
      const permissions = userInfo.permissions || []
      if (permissions.includes('*')) return true
      
      return permissions.includes(permission)
    },
    async loadData() {
      this.loading = true
      try {
        const response = await productGroupAPI.getList({
          page: this.page,
          page_size: this.pageSize
        })
        this.list = response.results || []
        this.total = response.count || 0
      } catch (error) {
        this.$message.error('加载数据失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },
    async loadProductList() {
      try {
        const response = await productAPI.getList({ page_size: 1000 })
        this.productList = response.results || []
      } catch (error) {
        console.error('加载产品列表失败:', error)
      }
    },
    handleAdd() {
      this.dialogTitle = '新增产品组'
      this.form = {
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
      }
      this.dialogVisible = true
    },
    async handleEdit(row) {
      this.dialogTitle = '编辑产品组'
      try {
        const detail = await productGroupAPI.getDetail(row.id)
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
        this.$message.error('加载详情失败')
        console.error(error)
      }
    },
    async handleDelete(row) {
      try {
        await this.$confirm('确定要删除该产品组吗？', '提示', {
          type: 'warning'
        })
        await productGroupAPI.delete(row.id)
        this.$message.success('删除成功')
        this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
          console.error(error)
        }
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
          this.$message.warning('请至少添加一个子产品')
          return
        }

        for (let i = 0; i < this.form.items.length; i++) {
          const item = this.form.items[i]
          if (!item.product) {
            this.$message.warning(`请选择第 ${i + 1} 个子产品的产品`)
            return
          }
          if (!item.item_name) {
            this.$message.warning(`请输入第 ${i + 1} 个子产品的名称`)
            return
          }
        }

        this.submitting = true
        try {
          const data = {
            code: this.form.code,
            name: this.form.name,
            description: this.form.description,
            is_active: this.form.is_active
          }

          if (this.form.id) {
            // 更新
            await productGroupAPI.update(this.form.id, data)
            
            // 更新子产品列表
            const existingItems = await productGroupItemAPI.getList({ product_group: this.form.id })
            const existingIds = (existingItems.results || []).map(item => item.id)
            const newIds = this.form.items.filter(item => item.id).map(item => item.id)
            
            // 删除不存在的子产品
            for (const id of existingIds) {
              if (!newIds.includes(id)) {
                await productGroupItemAPI.delete(id)
              }
            }
            
            // 创建或更新子产品
            for (let i = 0; i < this.form.items.length; i++) {
              const item = this.form.items[i]
              const itemData = {
                product_group: this.form.id,
                product: item.product,
                item_name: item.item_name,
                sort_order: i
              }
              
              if (item.id) {
                await productGroupItemAPI.update(item.id, itemData)
              } else {
                await productGroupItemAPI.create(itemData)
              }
            }
            
            this.$message.success('更新成功')
          } else {
            // 创建
            const result = await productGroupAPI.create(data)
            const groupId = result.id
            
            // 创建子产品
            for (let i = 0; i < this.form.items.length; i++) {
              const item = this.form.items[i]
              await productGroupItemAPI.create({
                product_group: groupId,
                product: item.product,
                item_name: item.item_name,
                sort_order: i
              })
            }
            
            this.$message.success('创建成功')
          }
          
          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.$message.error(this.form.id ? '更新失败' : '创建失败')
          console.error(error)
        } finally {
          this.submitting = false
        }
      })
    },
    resetForm() {
      this.$refs.form && this.$refs.form.resetFields()
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.page = 1
      this.loadData()
    },
    handlePageChange(val) {
      this.page = val
      this.loadData()
    }
  }
}
</script>

<style scoped>
.product-group-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

