<template>
  <div class="page">
    <ResourceList
      ref="listRef"
      title="生产成本（vNext）"
      :api="productionCostListApi"
      search-placeholder="搜索：施工单号/客户（后端支持 search 时可用）"
      :can-create="false"
    >
      <template #columns>
        <el-table-column prop="period" label="期间" width="110" />
        <el-table-column prop="work_order_number" label="施工单" width="150" />
        <el-table-column prop="customer_name" label="客户" width="160" />
        <el-table-column prop="total_cost" label="总成本" width="120" />
        <el-table-column prop="variance" label="差异" width="120" />
        <el-table-column prop="variance_rate_formatted" label="差异率" width="110" />
        <el-table-column prop="calculated_by_name" label="核算人" width="120" />
        <el-table-column prop="calculated_at" label="核算时间" width="170" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button size="small" :loading="actioningId === row.id" @click="calcMaterial(row.id)">算材料</el-button>
            <el-button size="small" :loading="actioningId === row.id" @click="calcTotal(row.id)">算总成本</el-button>
          </template>
        </el-table-column>
      </template>
    </ResourceList>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import ResourceList from './base/ResourceList.vue'
import { productionCostApi, productionCostListApi } from '../api/productionCosts'

const listRef = ref<InstanceType<typeof ResourceList> | null>(null)
const actioningId = ref<number | null>(null)

async function refresh() {
  await listRef.value?.loadData()
}

async function calcMaterial(id: number) {
  actioningId.value = id
  try {
    await productionCostApi.calculateMaterial(id)
    ElMessage.success('已计算')
    await refresh()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '计算失败')
  } finally {
    actioningId.value = null
  }
}

async function calcTotal(id: number) {
  actioningId.value = id
  try {
    await productionCostApi.calculateTotal(id)
    ElMessage.success('已计算')
    await refresh()
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.message || '计算失败')
  } finally {
    actioningId.value = null
  }
}
</script>

<style scoped>
.page {
  padding: 0;
}
</style>

