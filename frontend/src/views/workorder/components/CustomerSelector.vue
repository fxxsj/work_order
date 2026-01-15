<template>
  <el-form-item label="客户" prop="customer" required>
    <el-select
      :value="value"
      @input="handleInput"
      placeholder="请选择客户"
      filterable
      :loading="loading"
      :disabled="disabled"
      style="width: 100%;"
    >
      <el-option
        v-for="customer in customerList"
        :key="customer.id"
        :label="customer.name"
        :value="customer.id"
      >
        <span style="float: left">{{ customer.name }}</span>
        <span style="float: right; color: #8492a6; font-size: 13px">
          {{ customer.code }}
        </span>
      </el-option>
    </el-select>
  </el-form-item>
</template>

<script>
import { customerAPI } from '@/api/workorder'

export default {
  name: 'CustomerSelector',
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
      customerList: []
    }
  },
  async created() {
    await this.loadCustomerList()
  },
  methods: {
    async loadCustomerList() {
      this.loading = true
      try {
        const response = await customerAPI.getList({ page_size: 1000 })
        this.customerList = response.results || []
      } catch (error) {
        console.error('加载客户列表失败:', error)
        this.$message.error('加载客户列表失败')
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
