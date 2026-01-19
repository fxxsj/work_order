<template>
  <div class="artwork-list">
    <el-card>
      <div class="header-section">
        <el-input
          v-model="searchText"
          placeholder="搜索图稿编码、名称、拼版尺寸"
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
          @click="showDialog()">
          新建图稿
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%; margin-top: 20px;"
      >
        <el-table-column label="图稿编码" width="180">
          <template slot-scope="scope">
            {{ scope.row.code || (scope.row.base_code + (scope.row.version > 1 ? '-v' + scope.row.version : '')) }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="图稿名称" width="200"></el-table-column>
        <el-table-column prop="color_display" label="色数" width="200" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.color_display && scope.row.color_display !== '-'">
              {{ scope.row.color_display }}
            </el-tag>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="imposition_size" label="拼版尺寸" width="180"></el-table-column>
        <el-table-column label="确认状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag
              :type="scope.row.confirmed ? 'success' : 'info'"
              size="small"
            >
              {{ scope.row.confirmed ? '已确认' : '未确认' }}
            </el-tag>
            <div v-if="scope.row.confirmed && scope.row.confirmed_by_name" style="font-size: 12px; color: #909399; margin-top: 5px;">
              {{ scope.row.confirmed_by_name }}
            </div>
            <div v-if="scope.row.confirmed && scope.row.confirmed_at" style="font-size: 12px; color: #909399;">
              {{ formatDate(scope.row.confirmed_at) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="关联刀模" min-width="200">
          <template slot-scope="scope">
            <el-tag
              v-for="(code, index) in scope.row.die_codes"
              :key="index"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ code }}<span v-if="scope.row.die_names && scope.row.die_names[index]"> - {{ scope.row.die_names[index] }}</span>
            </el-tag>
            <span v-if="!scope.row.die_codes || scope.row.die_codes.length === 0" style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="关联烫金版" min-width="200">
          <template slot-scope="scope">
            <el-tag
              v-for="(code, index) in scope.row.foiling_plate_codes"
              :key="index"
              type="success"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ code }}<span v-if="scope.row.foiling_plate_names && scope.row.foiling_plate_names[index]"> - {{ scope.row.foiling_plate_names[index] }}</span>
            </el-tag>
            <span v-if="!scope.row.foiling_plate_codes || scope.row.foiling_plate_codes.length === 0" style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column label="关联压凸版" min-width="200">
          <template slot-scope="scope">
            <el-tag
              v-for="(code, index) in scope.row.embossing_plate_codes"
              :key="index"
              type="warning"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ code }}<span v-if="scope.row.embossing_plate_names && scope.row.embossing_plate_names[index]"> - {{ scope.row.embossing_plate_names[index] }}</span>
            </el-tag>
            <span v-if="!scope.row.embossing_plate_codes || scope.row.embossing_plate_codes.length === 0" style="color: #909399;">-</span>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="280" fixed="right">
          <template slot-scope="scope">
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click="showDialog(scope.row)">
              编辑
            </el-button>
            <el-button
              v-if="canEdit()"
              type="text"
              size="small"
              @click="createNewVersion(scope.row)">
              创建新版本
            </el-button>
            <el-button
              v-if="!scope.row.confirmed && canConfirm()"
              type="text"
              size="small"
              style="color: #67C23A;"
              @click="handleConfirm(scope.row)">
              确认
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
        <el-form-item label="图稿主编码" prop="base_code">
          <el-input
            v-model="form.base_code"
            placeholder="留空则系统自动生成（格式：ART + yyyymm + 序号）"
            :disabled="isEdit"
          ></el-input>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            {{ isEdit ? '主编码不可修改' : '留空则自动生成，格式：ART202412001' }}
          </div>
        </el-form-item>
        <el-form-item label="版本号" prop="version" v-if="isEdit">
          <el-input-number
            v-model="form.version"
            :min="1"
            :disabled="true"
            style="width: 100%;"
          ></el-input-number>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            完整编码：{{ form.base_code }}{{ form.version > 1 ? '-v' + form.version : '' }}
          </div>
        </el-form-item>
        <el-form-item label="图稿名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入图稿名称"></el-input>
        </el-form-item>
        <el-form-item label="CMYK颜色">
          <el-checkbox-group v-model="form.cmyk_colors">
            <el-checkbox label="C">C</el-checkbox>
            <el-checkbox label="M">M</el-checkbox>
            <el-checkbox label="Y">Y</el-checkbox>
            <el-checkbox label="K">K</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="其他颜色">
          <div v-for="(color, index) in form.other_colors" :key="index" style="margin-bottom: 10px; display: flex; align-items: center;">
            <el-input
              v-model="form.other_colors[index]"
              placeholder="请输入颜色名称，如：528C、金色"
              style="flex: 1; margin-right: 10px;"
            ></el-input>
            <el-button
              type="danger"
              size="small"
              icon="el-icon-delete"
              @click="removeOtherColor(index)"
              circle
            ></el-button>
          </div>
          <el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            @click="addOtherColor"
          >
            添加颜色
          </el-button>
        </el-form-item>
        <el-form-item label="拼版尺寸">
          <el-input v-model="form.imposition_size" placeholder="如：420x594mm"></el-input>
        </el-form-item>
        <el-form-item label="关联刀模">
          <el-select
            v-model="form.dies"
            placeholder="请选择刀模（可多选）"
            filterable
            clearable
            multiple
            style="width: 100%;"
          >
            <el-option
              v-for="die in dieList"
              :key="die.id"
              :label="`${die.name} (${die.code})`"
              :value="die.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联烫金版">
          <el-select
            v-model="form.foiling_plates"
            placeholder="请选择烫金版（可多选）"
            filterable
            clearable
            multiple
            style="width: 100%;"
          >
            <el-option
              v-for="plate in foilingPlateList"
              :key="plate.id"
              :label="`${plate.name} (${plate.code})`"
              :value="plate.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关联压凸版">
          <el-select
            v-model="form.embossing_plates"
            placeholder="请选择压凸版（可多选）"
            filterable
            clearable
            multiple
            style="width: 100%;"
          >
            <el-option
              v-for="plate in embossingPlateList"
              :key="plate.id"
              :label="`${plate.name} (${plate.code})`"
              :value="plate.id"
            ></el-option>
          </el-select>
        </el-form-item>

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
        <el-button type="primary" :loading="formLoading" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { artworkAPI, productAPI, dieAPI, foilingPlateAPI, embossingPlateAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'

export default {
  name: 'ArtworkList',
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: artworkAPI,
      permissionPrefix: 'artwork',

      // 表单相关
      productList: [],
      dieList: [],
      foilingPlateList: [],
      embossingPlateList: [],
      isEdit: false,
      productItems: [],
      form: {
        base_code: '',
        version: 1,
        name: '',
        cmyk_colors: [],
        other_colors: [],
        imposition_size: '',
        dies: [],
        foiling_plates: [],
        embossing_plates: [],
        notes: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入图稿名称', trigger: 'blur' }
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
    this.loadDieList()
    this.loadFoilingPlateList()
    this.loadEmbossingPlateList()
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

    canConfirm() {
      // 设计部用户可以确认图稿，这里可以根据用户部门判断
      // 暂时使用 change_artwork 权限
      return this.checkPermission('change')
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

    async loadDieList() {
      try {
        const response = await dieAPI.getList({ page_size: 100 })
        this.dieList = response.results || []
      } catch (error) {
        console.error('加载刀模列表失败:', error)
      }
    },

    async loadFoilingPlateList() {
      try {
        const response = await foilingPlateAPI.getList({ page_size: 100 })
        this.foilingPlateList = response.results || []
      } catch (error) {
        console.error('加载烫金版列表失败:', error)
      }
    },

    async loadEmbossingPlateList() {
      try {
        const response = await embossingPlateAPI.getList({ page_size: 100 })
        this.embossingPlateList = response.results || []
      } catch (error) {
        console.error('加载压凸版列表失败:', error)
      }
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

    addOtherColor() {
      this.form.other_colors.push('')
    },

    removeOtherColor(index) {
      this.form.other_colors.splice(index, 1)
    },

    async handleConfirm(row) {
      try {
        await this.$confirm('确认该图稿？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await artworkAPI.confirm(row.id)
        this.showSuccess('图稿已确认')
        this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          this.showMessage(error, '确认失败')
        }
      }
    },

    async createNewVersion(row) {
      const fullCode = row.code || (row.base_code + (row.version > 1 ? '-v' + row.version : ''))
      this.$confirm(`确定要基于 "${fullCode}" 创建新版本吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        try {
          await artworkAPI.createVersion(row.id)
          this.showSuccess('新版本创建成功')
          this.loadData()
        } catch (error) {
          console.error('创建新版本失败:', error)
          this.showMessage(error, '创建新版本失败')
        }
      }).catch(() => {})
    },

    async showDialog(row = null) {
      if (row) {
        this.isEdit = true
        this.currentRow = row
        this.dialogType = 'edit'

        try {
          const detail = await artworkAPI.getDetail(row.id)
          this.form = {
            base_code: detail.base_code || '',
            version: detail.version || 1,
            name: detail.name,
            cmyk_colors: detail.cmyk_colors || [],
            other_colors: Array.isArray(detail.other_colors) ? detail.other_colors : (detail.other_colors ? [detail.other_colors] : []),
            imposition_size: detail.imposition_size || '',
            dies: detail.dies || [],
            foiling_plates: detail.foiling_plates || [],
            embossing_plates: detail.embossing_plates || [],
            notes: detail.notes || ''
          }

          if (detail.products && detail.products.length > 0) {
            this.productItems = detail.products.map(p => ({
              id: p.id,
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
        this.currentRow = null
        this.dialogType = 'create'
        this.form = {
          base_code: '',
          version: 1,
          name: '',
          cmyk_colors: [],
          other_colors: [],
          imposition_size: '',
          dies: [],
          foiling_plates: [],
          embossing_plates: [],
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

          if (!this.isEdit && !data.base_code) {
            delete data.base_code
          }
          if (!this.isEdit) {
            delete data.version
          }

          if (data.other_colors) {
            data.other_colors = data.other_colors.filter(color => color && color.trim())
          }

          const productsData = this.productItems
            .filter(item => item.product)
            .map(item => ({
              product: item.product,
              imposition_quantity: item.imposition_quantity || 1
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
.artwork-list {
  padding: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
