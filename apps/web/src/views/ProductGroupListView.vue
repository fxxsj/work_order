<template>
  <div class="page">
    <div class="bar">
      <div class="left">
        <el-button size="small" @click="goHome">返回</el-button>
        <div class="title">产品组（vNext）</div>
      </div>
      <div class="right">
        <el-select v-model="active" size="small" clearable placeholder="启用" style="width: 120px" @change="reload">
          <el-option label="启用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
        <el-input
          v-model="search"
          size="small"
          clearable
          placeholder="搜索编码/名称"
          style="width: 240px"
          @keyup.enter="reload"
        />
        <el-button size="small" :loading="loading" @click="reload">查询</el-button>
        <el-button size="small" type="primary" @click="openCreate">新建</el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="items" v-loading="loading" style="width: 100%">
        <el-table-column prop="code" label="编码" width="160" />
        <el-table-column prop="name" label="名称" min-width="220" />
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_active" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="子项" width="90">
          <template #default="{ row }">
            {{ (row.items || []).length }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="240" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row.id)">查看</el-button>
            <el-button size="small" @click="openEdit(row.id)">编辑</el-button>
            <el-button size="small" type="danger" :loading="deletingId === row.id" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-size="pageSize"
          :current-page="page"
          @update:current-page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailOpen" title="产品组详情" size="760px">
      <div v-if="detail" class="detail">
        <div class="detail-line"><b>编码：</b>{{ detail.code }}</div>
        <div class="detail-line"><b>名称：</b>{{ detail.name }}</div>
        <div class="detail-line"><b>启用：</b>{{ detail.is_active ? '是' : '否' }}</div>
        <div class="detail-line"><b>描述：</b><span class="muted">{{ detail.description || '—' }}</span></div>
        <el-divider />
        <div class="sub-title">子项</div>
        <el-table :data="detail.items || []" size="small" style="width: 100%">
          <el-table-column prop="sort_order" label="排序" width="90" />
          <el-table-column prop="item_name" label="子项名称" width="160" />
          <el-table-column label="产品" min-width="280">
            <template #default="{ row }">
              <span class="muted">{{ row.product_code }} - {{ row.product_name }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else class="muted">加载中…</div>
    </el-drawer>

    <el-dialog v-model="editOpen" :title="editing ? '编辑产品组' : '新建产品组'" width="980px" :close-on-click-modal="false">
      <el-form :model="form" label-width="140px">
        <el-form-item label="编码" required>
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>

        <el-divider />
        <div class="sub-title">子项配置</div>
        <el-table :data="form.items_write" size="small" style="width: 100%">
          <el-table-column label="排序" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.sort_order" :min="0" :precision="0" :step="1" />
            </template>
          </el-table-column>
          <el-table-column label="子项名称" width="200">
            <template #default="{ row }">
              <el-input v-model="row.item_name" placeholder="例如：天盒/地盒" />
            </template>
          </el-table-column>
          <el-table-column label="产品" min-width="360">
            <template #default="{ row }">
              <el-select
                v-model="row.product"
                filterable
                remote
                clearable
                :remote-method="remoteSearchProducts"
                :loading="productSearching"
                placeholder="输入名称/编码搜索"
                style="width: 100%"
              >
                <el-option v-for="p in productOptions" :key="p.id" :label="`${p.code} - ${p.name}`" :value="p.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ $index }">
              <el-button size="small" type="danger" @click="removeItemRow($index)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="row-actions">
          <el-button size="small" @click="addItemRow">添加子项</el-button>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Product } from '../api/products'
import { listProducts } from '../api/products'
import type { ProductGroup } from '../api/productGroups'
import { createProductGroup, deleteProductGroup, getProductGroup, listProductGroups, updateProductGroup } from '../api/productGroups'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const deletingId = ref<number | null>(null)

const items = ref<ProductGroup[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const active = ref<boolean | null>(null)

const detailOpen = ref(false)
const detail = ref<ProductGroup | null>(null)

const editOpen = ref(false)
const editing = ref(false)
const editingId = ref<number | null>(null)

const productOptions = ref<Product[]>([])
const productSearching = ref(false)

const form = reactive({
  code: '',
  name: '',
  description: '',
  is_active: true,
  items_write: [] as any[]
})

function formatError(err: any, fallback: string) {
  const data = err?.response?.data
  if (typeof data?.error === 'string') return data.error
  if (typeof data?.detail === 'string') return data.detail
  if (data && typeof data === 'object') {
    try {
      return JSON.stringify(data)
    } catch {
      // ignore
    }
  }
  return err?.message || fallback
}

async function fetchList() {
  loading.value = true
  try {
    const data = await listProductGroups({
      page: page.value,
      page_size: pageSize.value,
      search: search.value || undefined,
      is_active: active.value === null ? undefined : active.value
    })
    items.value = data.results
    total.value = data.count
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载失败'))
  } finally {
    loading.value = false
  }
}

function reload() {
  page.value = 1
  fetchList()
}

function handlePageChange(next: number) {
  page.value = next
  fetchList()
}

function handlePageSizeChange(next: number) {
  pageSize.value = next
  page.value = 1
  fetchList()
}

async function openDetail(id: number) {
  detailOpen.value = true
  detail.value = null
  try {
    detail.value = await getProductGroup(id)
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载失败'))
  }
}

function resetForm() {
  form.code = ''
  form.name = ''
  form.description = ''
  form.is_active = true
  form.items_write = []
}

function addItemRow() {
  form.items_write.push({ product: null, item_name: '', sort_order: form.items_write.length })
}

function removeItemRow(index: number) {
  form.items_write.splice(index, 1)
}

function openCreate() {
  editing.value = false
  editingId.value = null
  resetForm()
  addItemRow()
  editOpen.value = true
}

async function openEdit(id: number) {
  editing.value = true
  editingId.value = id
  resetForm()
  editOpen.value = true
  try {
    const d = await getProductGroup(id)
    form.code = d.code || ''
    form.name = d.name || ''
    form.description = d.description || ''
    form.is_active = d.is_active !== false
    form.items_write =
      (d.items || []).map((it: any) => ({
        product: it.product,
        item_name: it.item_name || '',
        sort_order: it.sort_order || 0
      })) || []
    if (!form.items_write.length) addItemRow()
  } catch (err: any) {
    ElMessage.error(formatError(err, '加载失败'))
  }
}

async function remoteSearchProducts(query: string) {
  if (!query || !query.trim()) {
    productOptions.value = []
    return
  }
  productSearching.value = true
  try {
    const data = await listProducts({ page: 1, page_size: 20, search: query.trim() })
    productOptions.value = data.results
  } catch {
    productOptions.value = []
  } finally {
    productSearching.value = false
  }
}

async function save() {
  if (!form.code.trim()) {
    ElMessage.warning('请输入编码')
    return
  }
  if (!form.name.trim()) {
    ElMessage.warning('请输入名称')
    return
  }

  const cleaned = form.items_write
    .map((r: any, idx: number) => ({ ...r, sort_order: r.sort_order ?? idx }))
    .filter((r: any) => !!r.product && !!(r.item_name || '').trim())

  submitting.value = true
  try {
    const payload: any = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description || '',
      is_active: form.is_active,
      items_write: cleaned.map((r: any) => ({
        product: r.product,
        item_name: (r.item_name || '').trim(),
        sort_order: Number(r.sort_order || 0)
      }))
    }
    if (editing.value && editingId.value) {
      await updateProductGroup(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await createProductGroup(payload)
      ElMessage.success('已创建')
    }
    editOpen.value = false
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '保存失败'))
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await ElMessageBox.confirm('确认删除该产品组？', '提示', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = id
  try {
    await deleteProductGroup(id)
    ElMessage.success('已删除')
    await fetchList()
  } catch (err: any) {
    ElMessage.error(formatError(err, '删除失败'))
  } finally {
    deletingId.value = null
  }
}

function goHome() {
  router.push({ name: 'dashboard' })
}

onMounted(() => fetchList())
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
  flex-wrap: wrap;
  justify-content: flex-end;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.muted {
  color: #666;
}
.detail {
  padding: 6px 0;
}
.detail-line {
  margin-bottom: 8px;
}
.sub-title {
  font-weight: 600;
  margin-bottom: 8px;
}
.row-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>

