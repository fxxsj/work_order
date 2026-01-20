<template>
  <el-dialog
    :visible="localVisible"
    title="发货单详情"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-descriptions v-if="data" :column="2" border>
      <el-descriptions-item label="发货单号">
        {{ data.order_number }}
      </el-descriptions-item>
      <el-descriptions-item label="销售订单">
        {{ data.sales_order_number || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="客户名称">
        {{ data.customer_name }}
      </el-descriptions-item>
      <el-descriptions-item label="收货人">
        {{ data.receiver_name }}
      </el-descriptions-item>
      <el-descriptions-item label="联系电话">
        {{ data.receiver_phone }}
      </el-descriptions-item>
      <el-descriptions-item label="发货日期">
        {{ data.delivery_date || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="物流公司" :span="2">
        {{ data.logistics_company || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="物流单号" :span="2">
        <el-link v-if="data.tracking_number" :href="getTrackingUrl(data)" target="_blank">
          {{ data.tracking_number }}
        </el-link>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item label="运费">
        ¥{{ data.freight ? data.freight.toLocaleString() : '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="包裹数量">
        {{ data.package_count }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        {{ data.status_display }}
      </el-descriptions-item>
      <el-descriptions-item label="送货地址" :span="2">
        {{ data.delivery_address }}
      </el-descriptions-item>
    </el-descriptions>

    <div v-if="data && data.items && data.items.length > 0" class="items-section">
      <h3>发货明细</h3>
      <el-table :data="data.items" border style="width: 100%; margin-top: 10px;">
        <el-table-column prop="product_name" label="产品名称" />
        <el-table-column prop="quantity" label="发货数量" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="unit_price" label="单价" width="100">
          <template slot-scope="scope">
            ¥{{ scope.row.unit_price ? scope.row.unit_price.toLocaleString() : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="subtotal" label="小计" width="120">
          <template slot-scope="scope">
            ¥{{ scope.row.subtotal ? scope.row.subtotal.toLocaleString() : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="handleClose">
        关闭
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'DeliveryDetailDialog',
  props: {
    visible: Boolean,
    data: {
      type: Object,
      default: null
    }
  },
  computed: {
    localVisible: {
      get() { return this.visible },
      set() { this.$emit('close') }
    }
  },
  methods: {
    handleClose() {
      this.$emit('close')
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
.items-section {
  margin-top: 20px;
}
</style>
