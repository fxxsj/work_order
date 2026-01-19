<template>
  <div class="filter-section">
    <el-form :inline="true" :model="localValue" class="filter-form">
      <el-form-item label="发货状态">
        <el-select v-model="localValue.status" placeholder="全部" clearable @change="handleChange">
          <el-option label="待发货" value="pending"></el-option>
          <el-option label="已发货" value="shipped"></el-option>
          <el-option label="运输中" value="in_transit"></el-option>
          <el-option label="已签收" value="received"></el-option>
          <el-option label="拒收" value="rejected"></el-option>
          <el-option label="已退货" value="returned"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="客户">
        <el-select v-model="localValue.customer" placeholder="全部客户" clearable filterable @change="handleChange">
          <el-option
            v-for="customer in customerList"
            :key="customer.id"
            :label="customer.name"
            :value="customer.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="物流单号">
        <el-input v-model="localValue.tracking_number" placeholder="物流单号" clearable @input="handleChange" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="$emit('search')">查询</el-button>
        <el-button @click="$emit('reset')">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'DeliveryFilters',
  props: {
    value: {
      type: Object,
      default: () => ({})
    },
    customerList: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    localValue: {
      get() { return this.value },
      set(val) { this.$emit('input', val) }
    }
  },
  methods: {
    handleChange() {
      this.$emit('input', this.localValue)
    }
  }
}
</script>

<style scoped>
.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-form {
  margin-bottom: 0;
}
</style>
