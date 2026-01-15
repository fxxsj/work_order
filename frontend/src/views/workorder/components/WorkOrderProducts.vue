<template>
  <el-card v-if="hasProducts">
    <div slot="header" class="card-header">
      <span>产品列表</span>
    </div>
    <el-table :data="products" border style="width: 100%">
      <el-table-column prop="product_name" label="产品名称" width="200">
        <template slot-scope="scope">
          {{ scope.row.product_name || scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column prop="specification" label="规格" min-width="200" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.specification || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="imposition_quantity" label="拼版" width="100" align="center">
        <template slot-scope="scope">
          {{ scope.row.imposition_quantity || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="120" align="right">
        <template slot-scope="scope">
          {{ scope.row.quantity || 0 }}
        </template>
      </el-table-column>
      <el-table-column label="小计" width="150" align="right">
        <template slot-scope="scope">
          ¥{{ calculateSubtotal(scope.row) }}
        </template>
      </el-table-column>
    </el-table>
    <div style="text-align: right; margin-top: 10px;">
      <strong>总计：¥{{ totalAmount }}</strong>
    </div>
  </el-card>
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
  },
  methods: {
    calculateSubtotal(product) {
      const quantity = product.quantity || 0
      const unitPrice = product.unit_price || 0
      return (quantity * unitPrice).toFixed(2)
    },
    calculateTotal() {
      return this.products.reduce((sum, product) => {
        const quantity = product.quantity || 0
        const unitPrice = product.unit_price || 0
        return sum + (quantity * unitPrice)
      }, 0)
    }
  },
  computed: {
    totalAmount() {
      return this.calculateTotal().toFixed(2)
    }
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
