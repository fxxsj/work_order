<template>
  <el-form-item label="客户" prop="customer" required>
    <el-select
      :value="value"
      placeholder="请选择客户"
      filterable
      remote
      :remote-method="searchCustomers"
      :loading="loading"
      :disabled="disabled"
      style="width: 100%;"
      @input="handleInput"
      @focus="onFocus"
    >
      <el-option
        v-for="customer in customerList"
        :key="customer.id"
        :label="customer.name"
        :value="customer.id"
      >
        <span style="float: left">{{ customer.name }}</span>
        <span v-if="customer.contact_person" style="float: right; color: #8492a6; font-size: 13px">
          {{ customer.contact_person }}
        </span>
      </el-option>
    </el-select>
  </el-form-item>
</template>

<script>
import { customerAPI } from '@/api/modules/customer'
import ErrorHandler from '@/utils/errorHandler'

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
  beforeDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  },
  methods: {
    async loadCustomerList(search = '') {
      this.loading = true
      try {
        const params = {
          page_size: 20
        }
        if (search) {
          params.search = search
        }
        const response = await customerAPI.getList(params)
        this.customerList = response.results || response.data || response
      } catch (error) {
        ErrorHandler.showMessage(error, '加载客户列表失败')
      } finally {
        this.loading = false
      }
    },

    searchCustomers(query) {
      // 远程搜索：防抖处理
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.loadCustomerList(query)
      }, 300)
    },

    onFocus() {
      // 聚焦时加载初始列表
      if (this.customerList.length === 0) {
        this.loadCustomerList()
      }
    },

    handleInput(value) {
      this.$emit('input', value)
      this.$emit('change', value)
    }
  }
}
</script>
