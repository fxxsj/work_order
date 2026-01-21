<template>
  <el-dialog
    title="库存不足预警"
    :visible.sync="dialogVisible"
    width="800px"
  >
    <el-alert
      v-if="materials.length > 0"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    >
      <template slot="title">
        发现 {{ materials.length }} 种物料库存不足，建议及时采购补货
      </template>
    </el-alert>

    <el-table
      v-if="materials.length > 0"
      v-loading="loading"
      :data="materials"
      border
    >
      <el-table-column prop="code" label="物料编码" width="120" />
      <el-table-column prop="name" label="物料名称" width="200" />
      <el-table-column
        prop="stock_quantity"
        label="当前库存"
        width="120"
        align="right"
      >
        <template slot-scope="scope">
          <span :class="{ 'low-stock': scope.row.stock_quantity < scope.row.min_stock_quantity }">
            {{ scope.row.stock_quantity }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        prop="min_stock_quantity"
        label="最小库存"
        width="120"
        align="right"
      />
      <el-table-column
        prop="needed_quantity"
        label="需要采购"
        width="120"
        align="right"
      >
        <template slot-scope="scope">
          <span class="needed-quantity">{{ scope.row.needed_quantity }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="default_supplier__name" label="默认供应商" min-width="180">
        <template slot-scope="scope">
          {{ scope.row.default_supplier__name || '-' }}
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else description="暂无库存不足的物料" />

    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button
        v-if="materials.length > 0"
        type="primary"
        @click="handleCreatePurchase"
      >
        创建采购单
      </el-button>
    </span>
  </el-dialog>
</template>

<script>
import { purchaseOrderAPI } from '@/api/modules'
import ErrorHandler from '@/utils/errorHandler'

export default {
  name: 'LowStockAlertDialog',

  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      loading: false,
      materials: []
    }
  },

  computed: {
    dialogVisible: {
      get() {
        return this.visible
      },
      set(val) {
        this.$emit('update:visible', val)
      }
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.fetchLowStockMaterials()
      }
    }
  },

  methods: {
    /**
     * 获取库存预警物料
     */
    async fetchLowStockMaterials() {
      this.loading = true
      try {
        const response = await purchaseOrderAPI.getLowStockMaterials()
        this.materials = response.materials || []
      } catch (error) {
        ErrorHandler.showMessage(error, '获取库存预警')
      } finally {
        this.loading = false
      }
    },

    /**
     * 创建采购单
     */
    handleCreatePurchase() {
      this.dialogVisible = false
      this.$emit('create-purchase', this.materials)
    }
  }
}
</script>

<style scoped>
.low-stock {
  color: #F56C6C;
  font-weight: bold;
}

.needed-quantity {
  color: #E6A23C;
  font-weight: bold;
}
</style>
