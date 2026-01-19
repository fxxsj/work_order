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
          <el-button slot="append" icon="el-icon-search" @click="handleSearch"></el-button>
        </el-input>
        <el-button
          v-if="canCreate()"
          type="primary"
          icon="el-icon-plus"
          @click="handleAdd()">
          新增产品组
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%; margin-top: 20px;"
      >
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
              v-if="canEdit()"
              size="mini"
              @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              v-if="canDelete()"
              size="mini"
              type="danger"
              @click="handleDelete(scope.row)">删除</el-button>
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
        <el-button type="primary" @click="handleSubmit" :loading="formLoading">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { product-groupAPI, productAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'

export default {
  name: 'ProductGroupList',
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: product-groupAPI,
      permissionPrefix: 'productgroup',

      // 表单相关
      productList: [],
      dialogTitle: '新增产品组',
      isEdit: false,
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
        console.error('加载产品列表失败:', error)
      }
    },

    handleAdd() {
      this.dialogTitle = '新增产品组'
      this.isEdit = false
      this.currentRow = null
      this.dialogType = 'create'
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
      this.isEdit = true
      this.currentRow = row
      this.dialogType = 'edit'

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
        this.showMessage(error, '加载详情失败')
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

        this.formLoading = true
        try {
          const data = {
            code: this.form.code,
            name: this.form.name,
            description: this.form.description,
            is_active: this.form.is_active
          }

          if (this.form.id) {
            // 更新
            await this.apiService.update(this.form.id, data)
            this.showSuccess('更新成功')
          } else {
            // 创建
            await this.apiService.create(data)
            this.showSuccess('创建成功')
          }

          this.dialogVisible = false
          this.loadData()
        } catch (error) {
          this.showMessage(error, this.form.id ? '更新失败' : '创建失败')
        } finally {
          this.formLoading = false
        }
      })
    },

    resetForm() {
      this.$refs.form && this.$refs.form.resetFields()
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
