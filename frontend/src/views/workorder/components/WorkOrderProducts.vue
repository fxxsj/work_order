<template>
  <div v-if="hasProducts" style="margin-top: 20px;">
    <div class="detail-section-title">
      产品列表
    </div>
    <el-table :data="products" border style="width: 100%">
      <el-table-column prop="product_name" label="产品名称" width="200">
        <template slot-scope="scope">
          {{ scope.row.product_name }} ({{ scope.row.product_code }})
        </template>
      </el-table-column>
      <el-table-column prop="specification" label="规格" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.specification || '-' }}
        </template>
      </el-table-column>
      <el-table-column
        prop="imposition_quantity"
        label="拼版"
        width="100"
        align="center"
      >
        <template slot-scope="scope">
          {{ (scope.row.imposition_quantity || 1) }}拼
        </template>
      </el-table-column>
      <el-table-column
        prop="quantity"
        label="数量"
        width="120"
        align="right"
      >
        <template slot-scope="scope">
          {{ scope.row.quantity }} {{ scope.row.unit }}
        </template>
      </el-table-column>
      <el-table-column label="小计" width="150" align="right">
        <template slot-scope="scope">
          <span v-if="scope.row.product_detail">
            ¥{{ parseFloat((scope.row.product_detail.unit_price * scope.row.quantity).toFixed(2)) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  name: 'WorkOrderProducts',
  props: {
    products: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    hasProducts() {
      return this.products && this.products.length > 0
    }
  }
}
</script>

<style scoped>
.detail-section-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 15px;
}
</style>
