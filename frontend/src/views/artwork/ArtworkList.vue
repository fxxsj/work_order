<template>
  <div class="artwork-list">
    <el-card>
      <div class="header-section">
        <div class="filter-group">
          <el-input
            v-model="searchText"
            placeholder="搜索图稿编码、名称、拼版尺寸"
            style="width: 300px;"
            clearable
            @input="handleSearchDebounced"
            @clear="handleSearch"
          >
            <el-button slot="append" icon="el-icon-search" @click="handleSearch" />
          </el-input>
        </div>
        <div class="action-group">
          <el-button icon="el-icon-refresh" @click="loadData">刷新</el-button>
          <el-button
            v-if="canCreate()"
            type="primary"
            icon="el-icon-plus"
            @click="showDialog()"
          >
            新建图稿
          </el-button>
        </div>
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
        <el-table-column prop="name" label="图稿名称" width="200" />
        <el-table-column
          prop="color_display"
          label="色数"
          width="200"
          align="center"
        >
          <template slot-scope="scope">
            <el-tag v-if="scope.row.color_display && scope.row.color_display !== '-'">
              {{ scope.row.color_display }}
            </el-tag>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="imposition_size" label="拼版尺寸" width="180" />
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
        <el-table-column label="操作" width="180" fixed="right">
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
              v-if="canEdit()"
              type="text"
              size="small"
              @click="createNewVersion(scope.row)"
            >
              创建新版本
            </el-button>
            <el-button
              v-if="!scope.row.confirmed && canConfirm()"
              type="text"
              size="small"
              style="color: #67C23A;"
              @click="handleConfirm(scope.row)"
            >
              确认
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

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && tableData.length === 0"
        description="暂无图稿数据"
        :image-size="200"
      >
        <el-button v-if="canCreate()" type="primary" @click="showDialog()">
          创建第一个图稿
        </el-button>
      </el-empty>
    </el-card>

    <!-- 图稿表单对话框 -->
    <ArtworkFormDialog
      :visible.sync="dialogVisible"
      :artwork="currentArtwork"
      :loading="formLoading"
      :product-list="productList"
      :die-list="dieList"
      :foiling-plate-list="foilingPlateList"
      :embossing-plate-list="embossingPlateList"
      @confirm="handleFormConfirm"
    />
  </div>
</template>

<script>
import { artworkAPI, productAPI, dieAPI, foilingPlateAPI, embossingPlateAPI } from '@/api/modules'
import listPageMixin from '@/mixins/listPageMixin'
import crudPermissionMixin from '@/mixins/crudPermissionMixin'
import Pagination from '@/components/common/Pagination.vue'
import ArtworkFormDialog from './components/ArtworkFormDialog.vue'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'ArtworkList',
  components: { Pagination, ArtworkFormDialog },
  mixins: [listPageMixin, crudPermissionMixin],
  data() {
    return {
      // API 服务和权限配置
      apiService: artworkAPI,
      permissionPrefix: 'artwork',

      // 对话框状态
      dialogVisible: false,
      formLoading: false,
      currentArtwork: null,

      // 下拉列表数据
      productList: [],
      dieList: [],
      foilingPlateList: [],
      embossingPlateList: []
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
        ErrorHandler.showMessage(error, '加载产品列表失败')
      }
    },

    async loadDieList() {
      try {
        const response = await dieAPI.getList({ page_size: 100 })
        this.dieList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载刀模列表失败')
      }
    },

    async loadFoilingPlateList() {
      try {
        const response = await foilingPlateAPI.getList({ page_size: 100 })
        this.foilingPlateList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载烫金版列表失败')
      }
    },

    async loadEmbossingPlateList() {
      try {
        const response = await embossingPlateAPI.getList({ page_size: 100 })
        this.embossingPlateList = response.results || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载压凸版列表失败')
      }
    },

    async handleConfirm(row) {
      try {
        await ErrorHandler.confirm('确认该图稿？', '确认操作')
        await artworkAPI.confirm(row.id)
        ErrorHandler.showSuccess('图稿已确认')
        this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '确认失败')
        }
      }
    },

    async createNewVersion(row) {
      const fullCode = row.code || (row.base_code + (row.version > 1 ? '-v' + row.version : ''))
      try {
        await ErrorHandler.confirm(`确定要基于 "${fullCode}" 创建新版本吗？`, '创建新版本')
        await artworkAPI.createVersion(row.id)
        ErrorHandler.showSuccess('新版本创建成功')
        this.loadData()
      } catch (error) {
        if (error !== 'cancel') {
          ErrorHandler.showMessage(error, '创建新版本失败')
        }
      }
    },

    // 打开对话框
    async showDialog(row = null) {
      if (row) {
        // 编辑模式：加载详情
        try {
          const detail = await artworkAPI.getDetail(row.id)
          this.currentArtwork = detail
        } catch (error) {
          ErrorHandler.showMessage(error, '加载图稿详情失败')
          return
        }
      } else {
        // 创建模式
        this.currentArtwork = null
      }
      this.dialogVisible = true
    },

    // 处理表单提交
    async handleFormConfirm(formData) {
      this.formLoading = true
      try {
        if (this.currentArtwork) {
          // 编辑模式
          await this.apiService.update(this.currentArtwork.id, formData)
          ErrorHandler.showSuccess('保存成功')
        } else {
          // 创建模式
          await this.apiService.create(formData)
          ErrorHandler.showSuccess('创建成功')
        }
        this.dialogVisible = false
        this.loadData()
      } catch (error) {
        ErrorHandler.showMessage(error, this.currentArtwork ? '保存失败' : '创建失败')
      } finally {
        this.formLoading = false
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
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group,
.action-group {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
