<template>
  <el-select
    :value="value"
    placeholder="请选择产品"
    filterable
    :loading="loading"
    :disabled="disabled"
    style="width: 100%;"
    @input="handleInput"
  >
    <el-option
      v-for="product in productList"
      :key="product.id"
      :label="`${product.name} (${product.code})`"
      :value="product.id"
    >
      <span style="float: left">{{ product.name }}</span>
      <span style="float: right; color: #8492a6; font-size: 13px">
        ¥{{ product.unit_price }}
      </span>
    </el-option>
  </el-select>
</template>

<script>
import { productAPI } from '@/api/workorder'

export default {
  name: 'ProductSelector',
  props: {
    value: {
      type: Number,
      default: null
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      productList: []
    }
  },
  async created() {
    await this.loadProductList()
  },
  methods: {
    async loadProductList() {
      this.loading = true
      try {
        const response = await productAPI.getList({ is_active: true, page_size: 1000 })
        this.productList = response.results || []
      } catch (error) {
        console.error('加载产品列表失败:', error)
        this.$message.error('加载产品列表失败')
      } finally {
        this.loading = false
      }
    },
    handleInput(value) {
      this.$emit('input', value)
      this.$emit('change', value)
    }
  }
}
</script>
