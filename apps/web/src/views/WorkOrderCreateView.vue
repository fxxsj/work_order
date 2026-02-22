<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goBack">返回</el-button>
        <div class="title">新建施工单（vNext）</div>
      </div>
      <div class="right">
        <el-button type="primary" :loading="submitting" @click="submit">提交</el-button>
      </div>
    </div>

    <el-card>
      <el-form :model="form" label-width="120px">
        <el-form-item label="客户" required>
          <el-select
            v-model="form.customer"
            filterable
            remote
            reserve-keyword
            :remote-method="searchCustomers"
            :loading="customerLoading"
            placeholder="搜索客户"
            style="width: 100%"
          >
            <el-option v-for="c in customerOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" required>
          <el-select v-model="form.priority" style="width: 240px">
            <el-option label="低" value="low" />
            <el-option label="普通" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>

        <el-form-item label="交货日期" required>
          <el-date-picker
            v-model="form.delivery_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择交货日期"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="3" />
        </el-form-item>

        <el-divider />

        <div class="section-title">产品列表</div>
        <el-table :data="form.products_data" style="width: 100%">
          <el-table-column label="产品" min-width="220">
            <template #default="{ row }">
              <el-select
                v-model="row.product"
                filterable
                remote
                reserve-keyword
                :remote-method="(q: string) => searchProducts(q)"
                :loading="productLoading"
                placeholder="搜索产品"
                style="width: 100%"
              >
                <el-option
                  v-for="p in productOptions"
                  :key="p.id"
                  :label="p.code ? `${p.name} (${p.code})` : p.name"
                  :value="p.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="140">
            <template #default="{ row }">
              <el-input-number v-model="row.quantity" :min="1" :max="999999" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="140">
            <template #default="{ row }">
              <el-input v-model="row.unit" placeholder="件/盒/车..." />
            </template>
          </el-table-column>
          <el-table-column label="规格" min-width="200">
            <template #default="{ row }">
              <el-input v-model="row.specification" placeholder="可选" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ $index }">
              <el-button type="danger" size="small" @click="removeProduct($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div style="margin-top: 10px">
          <el-button size="small" @click="addProduct">添加产品</el-button>
        </div>

        <el-alert
          title="提示"
          type="info"
          show-icon
          :closable="false"
          style="margin-top: 12px"
        >
          <template #default>
            未选择工序时，后端会根据产品的默认工序自动创建工序与草稿任务。
          </template>
        </el-alert>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { listCustomers, listProducts, type CustomerOption, type ProductOption } from '../api/catalog'
import { createWorkOrder } from '../api/workorders'

const router = useRouter()

const submitting = ref(false)

const customerLoading = ref(false)
const productLoading = ref(false)

const customerOptions = ref<CustomerOption[]>([])
const productOptions = ref<ProductOption[]>([])

const form = reactive({
  customer: null as number | null,
  priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  delivery_date: '',
  notes: '',
  products_data: [
    {
      product: null as number | null,
      quantity: 1,
      unit: '件',
      specification: '',
      sort_order: 0
    }
  ]
})

function addProduct() {
  form.products_data.push({
    product: null,
    quantity: 1,
    unit: '件',
    specification: '',
    sort_order: form.products_data.length
  })
}

function removeProduct(index: number) {
  form.products_data.splice(index, 1)
  if (form.products_data.length === 0) {
    addProduct()
  }
}

async function searchCustomers(query: string) {
  customerLoading.value = true
  try {
    const data = await listCustomers({ page_size: 50, search: query || undefined })
    customerOptions.value = data.results || []
  } catch {
    // ignore
  } finally {
    customerLoading.value = false
  }
}

async function searchProducts(query: string) {
  productLoading.value = true
  try {
    const data = await listProducts({ page_size: 50, search: query || undefined })
    productOptions.value = data.results || []
  } catch {
    // ignore
  } finally {
    productLoading.value = false
  }
}

async function submit() {
  if (!form.customer) {
    ElMessage.warning('请选择客户')
    return
  }
  if (!form.delivery_date) {
    ElMessage.warning('请选择交货日期')
    return
  }
  const invalid = form.products_data.some(p => !p.product || !p.quantity || !p.unit)
  if (invalid) {
    ElMessage.warning('请完善产品信息')
    return
  }

  submitting.value = true
  try {
    const payload = {
      customer: form.customer,
      priority: form.priority,
      delivery_date: form.delivery_date,
      notes: form.notes,
      products_data: form.products_data.map((p, idx) => ({
        product: p.product as number,
        quantity: p.quantity,
        unit: p.unit,
        specification: p.specification,
        sort_order: idx
      }))
    }

    const created = await createWorkOrder(payload)
    ElMessage.success('创建成功')
    router.push({ name: 'workorder-detail', params: { id: created.id } })
  } catch (err: any) {
    ElMessage.error(err?.response?.data?.error || err?.response?.data?.detail || err?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  searchCustomers('')
  searchProducts('')
})
</script>

<style scoped>
.page {
  padding: 16px;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.section-title {
  font-weight: 600;
  margin: 8px 0;
}
</style>

