<template>
  <el-form-item label="产品列表" required>
    <div v-for="(item, index) in items" :key="index" class="product-item">
      <el-row :gutter="10" type="flex" align="middle">
        <el-col :span="9">
          <ProductSelector
            :value="item.product"
            :disabled="disabled"
            @change="handleProductChange(index, $event)"
          />
        </el-col>
        <el-col :span="5">
          <el-input
            :value="getProductSpecification(item.product)"
            placeholder="选择产品后自动填充"
            disabled
            style="color: #909399;"
          ></el-input>
        </el-col>
        <el-col :span="4">
          <el-input
            :value="(getImpositionQuantity(item.product) || 1) + '拼'"
            placeholder="选择产品后自动填充"
            disabled
            style="color: #909399;"
          ></el-input>
        </el-col>
        <el-col :span="4">
          <el-input
            :value="item.quantity"
            @input="handleQuantityChange(index, $event)"
            type="number"
            placeholder="数量"
            :disabled="disabled"
          >
            <template slot="suffix">
              <span style="color: #909399; padding-right: 8px;">{{ item.unit || '件' }}</span>
            </template>
          </el-input>
        </el-col>
        <el-col :span="2" style="text-align: right;">
          <el-button
            v-if="items.length > 1"
            type="danger"
            size="mini"
            icon="el-icon-delete"
            @click="removeItem(index)"
            circle
            style="margin-right: 5px;"
          ></el-button>
          <el-button
            v-if="index === items.length - 1"
            type="primary"
            size="mini"
            icon="el-icon-plus"
            @click="addItem"
            circle
          ></el-button>
        </el-col>
      </el-row>
    </div>

    <div v-if="items.length === 0" class="empty-state">
      <el-button type="primary" icon="el-icon-plus" @click="addItem">
        添加产品
      </el-button>
    </div>

    <div class="hint-text">
      如果一套图稿（CTP版）中同时拼版了多个产品（如纸卡、吊牌、说明书），请在此添加
    </div>
  </el-form-item>
</template>

<script>
import { productAPI } from '@/api/workorder'
import ProductSelector from './ProductSelector.vue'

export default {
  name: 'ProductListEditor',
  components: {
    ProductSelector
  },
  props: {
    value: {
      type: Array,
      default: () => []
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      items: this.value || [],
      productList: [],
      productCache: new Map() // 缓存产品详情
    }
  },
  watch: {
    value: {
      handler(newVal) {
        this.items = newVal || []
      },
      deep: true
    },
    items: {
      handler(newVal) {
        this.$emit('input', newVal)
        this.$emit('change', newVal)
      },
      deep: true
    }
  },
  async created() {
    await this.loadProductList()
  },
  methods: {
    async loadProductList() {
      try {
        const response = await productAPI.getList({ is_active: true, page_size: 1000 })
        this.productList = response.results || []
      } catch (error) {
        console.error('加载产品列表失败:', error)
      }
    },
    getProductSpecification(productId) {
      if (!productId) return ''
      const product = this.productList.find(p => p.id === productId)
      return product ? product.specification : ''
    },
    getImpositionQuantity(productId) {
      if (!productId) return 1
      const product = this.productList.find(p => p.id === productId)
      return product ? product.imposition_quantity : 1
    },
    handleProductChange(index, productId) {
      this.$set(this.items, index, {
        ...this.items[index],
        product: productId,
        quantity: this.calculateQuantity(productId)
      })
    },
    handleQuantityChange(index, value) {
      this.$set(this.items, index, {
        ...this.items[index],
        quantity: parseInt(value) || 0
      })
    },
    calculateQuantity(productId) {
      const product = this.productList.find(p => p.id === productId)
      if (!product) return 1

      const imposition = product.imposition_quantity || 1
      return imposition
    },
    addItem() {
      this.items.push({
        product: null,
        quantity: 1,
        unit: '件'
      })
    },
    removeItem(index) {
      if (this.items.length > 1) {
        this.items.splice(index, 1)
      }
    }
  }
}
</script>

<style scoped>
.product-item {
  margin-bottom: 15px;
}

.empty-state {
  text-align: center;
  padding: 20px;
}

.hint-text {
  color: #909399;
  font-size: 12px;
  display: block;
  margin-top: 10px;
}
</style>
