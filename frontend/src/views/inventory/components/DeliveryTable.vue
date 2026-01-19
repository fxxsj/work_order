<template>
  <div class="table-section">
    <el-table
      v-loading="loading"
      :data="data"
      border
      style="width: 100%"
    >
      <el-table-column prop="order_number" label="发货单号" width="150" />
      <el-table-column prop="customer_name" label="客户名称" width="150" />
      <el-table-column prop="sales_order_number" label="销售订单" width="150" />
      <el-table-column prop="receiver_name" label="收货人" width="100" />
      <el-table-column prop="receiver_phone" label="联系电话" width="120" />
      <el-table-column prop="delivery_address" label="送货地址" show-overflow-tooltip width="200" />
      <el-table-column prop="logistics_company" label="物流公司" width="120" />
      <el-table-column prop="tracking_number" label="物流单号" width="150">
        <template slot-scope="scope">
          <el-link v-if="scope.row.tracking_number" :href="getTrackingUrl(scope.row)" target="_blank">
            {{ scope.row.tracking_number }}
          </el-link>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="delivery_date" label="发货日期" width="120" />
      <el-table-column prop="status_display" label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status_display }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250" fixed="right">
        <template slot-scope="scope">
          <el-button size="small" @click="$emit('view', scope.row)">查看</el-button>
          <el-button
            v-if="scope.row.status === 'pending'"
            size="small"
            type="primary"
            @click="$emit('edit', scope.row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.status === 'pending'"
            size="small"
            type="primary"
            @click="$emit('ship', scope.row)"
          >
            发货
          </el-button>
          <el-button
            v-if="scope.row.status === 'shipped' || scope.row.status === 'in_transit'"
            size="small"
            type="success"
            @click="$emit('receive', scope.row)"
          >
            签收
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-section">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="$emit('size-change', $event)"
        @current-change="$emit('page-change', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeliveryTable',
  props: {
    loading: Boolean,
    data: {
      type: Array,
      default: () => []
    },
    pagination: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    getStatusType(status) {
      const typeMap = {
        pending: 'info',
        shipped: 'warning',
        in_transit: 'primary',
        received: 'success',
        rejected: 'danger',
        returned: 'info'
      }
      return typeMap[status] || ''
    },
    getTrackingUrl(delivery) {
      if (delivery.logistics_company && delivery.tracking_number) {
        return '#'
      }
      return '#'
    }
  }
}
</script>

<style scoped>
.table-section {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
