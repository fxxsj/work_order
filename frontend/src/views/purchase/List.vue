<template>
  <div class="purchase-order-list">
    <el-card>
      <!-- 搜索和筛选 -->
      <el-form :inline="true" :model="filters" class="search-form" @keyup.enter.native="handleSearch">
        <el-form-item label="采购单号">
          <el-input v-model="filters.search" placeholder="请输入采购单号" clearable />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="filters.supplier_name" placeholder="请输入供应商名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="请选择" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已批准" value="approved" />
            <el-option label="已下单" value="ordered" />
            <el-option label="已收货" value="received" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增采购单</el-button>
          <el-button type="warning" @click="handleLowStock">库存预警</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_number" label="采购单号" width="150" />
        <el-table-column prop="supplier_name" label="供应商" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="items_count" label="明细数量" width="100" align="center" />
        <el-table-column prop="total_amount" label="总金额" width="120" align="right">
          <template slot-scope="scope">
            ¥{{ (scope.row.total_amount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="received_progress" label="收货进度" width="120">
          <template slot-scope="scope">
            <el-progress :percentage="scope.row.received_progress" :color="getProgressColor(scope.row.received_progress)" />
          </template>
        </el-table-column>
        <el-table-column prop="submitted_by_name" label="提交人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="300" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" @click="handleView(scope.row)">查看</el-button>
            <el-button v-if="scope.row.status === 'draft'" size="mini" type="success" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button v-if="scope.row.status === 'draft'" size="mini" type="warning" @click="handleSubmit(scope.row)">提交</el-button>
            <el-button v-if="scope.row.status === 'submitted'" size="mini" type="success" @click="handleApprove(scope.row)">批准</el-button>
            <el-button v-if="scope.row.status === 'submitted'" size="mini" type="danger" @click="handleReject(scope.row)">拒绝</el-button>
            <el-button v-if="scope.row.status === 'approved'" size="mini" type="warning" @click="handlePlaceOrder(scope.row)">下单</el-button>
            <el-button v-if="scope.row.status === 'ordered'" size="mini" type="success" @click="handleReceive(scope.row)">收货</el-button>
            <el-button v-if="['draft', 'submitted', 'approved'].includes(scope.row.status)" size="mini" type="danger" @click="handleCancel(scope.row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="900px" @close="handleDialogClose">
      <el-form :model="form" :rules="rules" ref="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-select v-model="form.supplier" placeholder="请选择供应商" filterable>
                <el-option
                  v-for="item in supplierOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联施工单">
              <el-input v-model="form.work_order_number" placeholder="请输入施工单号" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.notes" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
        <el-divider>采购明细</el-divider>
        <el-button size="small" type="primary" @click="handleAddItem">添加明细</el-button>
        <el-table :data="form.items" border style="margin-top: 10px">
          <el-table-column label="物料" width="250">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.material"
                placeholder="请选择物料"
                filterable
                @change="handleMaterialChange(scope.row)">
                <el-option
                  v-for="item in materialOptions"
                  :key="item.id"
                  :label="`${item.code} - ${item.name}`"
                  :value="item.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="采购数量" width="150">
            <template slot-scope="scope">
              <el-input-number v-model="scope.row.quantity" :min="1" :precision="2" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="150">
            <template slot-scope="scope">
              <el-input-number v-model="scope.row.unit_price" :min="0" :precision="2" />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="120">
            <template slot-scope="scope">
              ¥{{ ((scope.row.quantity || 0) * (scope.row.unit_price || 0)).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template slot-scope="scope">
              <el-button size="mini" type="danger" @click="handleDeleteItem(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit">确定</el-button>
      </span>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog title="采购单详情" :visible.sync="detailDialogVisible" width="900px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="采购单号">{{ detailData.order_number }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailData.supplier_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ detailData.status_display }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ (detailData.total_amount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="提交人">{{ detailData.submitted_by_name }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ detailData.submitted_at }}</el-descriptions-item>
        <el-descriptions-item label="审核人">{{ detailData.approved_by_name }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ detailData.approved_at }}</el-descriptions-item>
        <el-descriptions-item label="下单日期">{{ detailData.ordered_date }}</el-descriptions-item>
        <el-descriptions-item label="预计到货日期">{{ detailData.expected_date }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.notes }}</el-descriptions-item>
      </el-descriptions>
      <el-divider>采购明细</el-divider>
      <el-table :data="detailData.items" border>
        <el-table-column prop="material_name" label="物料" width="200" />
        <el-table-column prop="material_code" label="物料编码" width="120" />
        <el-table-column prop="quantity" label="采购数量" width="120" align="right" />
        <el-table-column prop="received_quantity" label="已收货数量" width="120" align="right" />
        <el-table-column prop="unit_price" label="单价" width="120" align="right">
          <template slot-scope="scope">¥{{ (scope.row.unit_price || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="subtotal" label="小计" width="120" align="right">
          <template slot-scope="scope">¥{{ scope.row.subtotal.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="status_display" label="收货状态" width="120">
          <template slot-scope="scope">
            <el-tag :type="getItemStatusType(scope.row.status)">{{ scope.row.status_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 库存预警对话框 -->
    <el-dialog title="库存不足预警" :visible.sync="lowStockDialogVisible" width="800px">
      <el-table :data="lowStockMaterials" border>
        <el-table-column prop="code" label="物料编码" width="120" />
        <el-table-column prop="name" label="物料名称" width="200" />
        <el-table-column prop="stock_quantity" label="当前库存" width="120" align="right" />
        <el-table-column prop="min_stock_quantity" label="最小库存" width="120" align="right" />
        <el-table-column prop="needed_quantity" label="需要采购" width="120" align="right">
          <template slot-scope="scope">
            <span style="color: #f56c6c;">{{ scope.row.needed_quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="default_supplier" label="默认供应商" width="180" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="lowStockDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleCreatePurchaseFromLowStock">创建采购单</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getPurchaseOrderList, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, submitPurchaseOrder, approvePurchaseOrder, rejectPurchaseOrder, placePurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, getLowStockMaterials, getSupplierList, getMaterialList } from '@/api/purchase'
import Pagination from '@/components/common/Pagination.vue'

export default {
  name: 'PurchaseOrderList',
  components: {
    Pagination
  },
  data() {
    return {
      loading: false,
      filters: {
        search: '',
        supplier_name: '',
        status: ''
      },
      tableData: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      },
      dialogVisible: false,
      dialogMode: 'add',
      form: {
        supplier: null,
        work_order_number: '',
        notes: '',
        items: []
      },
      rules: {
        supplier: [{ required: true, message: '请选择供应商', trigger: 'change' }]
      },
      supplierOptions: [],
      materialOptions: [],
      detailDialogVisible: false,
      detailData: {},
      lowStockDialogVisible: false,
      lowStockMaterials: []
    }
  },
  computed: {
    dialogTitle() {
      return this.dialogMode === 'add' ? '新增采购单' : '编辑采购单'
    }
  },
  created() {
    this.fetchData()
    this.fetchOptions()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          page_size: this.pagination.pageSize,
          search: this.filters.search || undefined,
          status: this.filters.status || undefined
        }
        const response = await getPurchaseOrderList(params)
        this.tableData = response.results || []
        this.pagination.total = response.count || 0
      } catch (error) {
        this.$message.error(`获取采购单列表失败: ${error.message || error}`)
      } finally {
        this.loading = false
      }
    },
    async fetchOptions() {
      try {
        const [supplierRes, materialRes] = await Promise.all([
          getSupplierList({ page_size: 1000, status: 'active' }),
          getMaterialList({ page_size: 1000 })
        ])
        this.supplierOptions = supplierRes.results || []
        this.materialOptions = materialRes.results || []
      } catch (error) {
        this.$message.error(`获取选项数据失败: ${error.message || error}`)
      }
    },
    handleSearch() {
      this.pagination.page = 1
      this.fetchData()
    },
    handleReset() {
      this.filters = { search: '', supplier_name: '', status: '' }
      this.pagination.page = 1
      this.fetchData()
    },
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.page = 1
      this.fetchData()
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.fetchData()
    },
    handleAdd() {
      this.dialogMode = 'add'
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    handleView(row) {
      this.detailData = { ...row }
      this.detailDialogVisible = true
    },
    handleEdit(row) {
      this.dialogMode = 'edit'
      this.form = {
        ...row,
        items: row.items.map(item => ({
          id: item.id,
          material: item.material,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.form && this.$refs.form.clearValidate()
      })
    },
    handleDelete(row) {
      this.$confirm(`确定要删除采购单"${row.order_number}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deletePurchaseOrder(row.id)
          this.$message.success('删除成功')
          this.fetchData()
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => {})
    },
    handleAction(row, actionFn, successMsg) {
      this.$confirm(`确定要${successMsg}采购单"${row.order_number}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await actionFn(row.id)
          this.$message.success(`${successMsg}成功`)
          this.fetchData()
        } catch (error) {
          this.$message.error(`${successMsg}失败`)
        }
      }).catch(() => {})
    },
    handleSubmit(row) {
      this.handleAction(row, submitPurchaseOrder, '提交')
    },
    handleApprove(row) {
      this.handleAction(row, approvePurchaseOrder, '批准')
    },
    handleReject(row) {
      this.$prompt('请输入拒绝原因', '拒绝采购单', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S+/,
        inputErrorMessage: '拒绝原因不能为空'
      }).then(async ({ value }) => {
        try {
          await rejectPurchaseOrder(row.id, { rejection_reason: value })
          this.$message.success('拒绝成功')
          this.fetchData()
        } catch (error) {
          this.$message.error('拒绝失败')
        }
      }).catch(() => {})
    },
    handlePlaceOrder(row) {
      this.handleAction(row, (id) => placePurchaseOrder(id, { ordered_date: new Date().toISOString().split('T')[0] }), '下单')
    },
    handleReceive(row) {
      this.$confirm(`确定要收货采购单"${row.order_number}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const items = row.items.map(item => ({ id: item.id, received_quantity: item.quantity }))
          await receivePurchaseOrder(row.id, { items })
          this.$message.success('收货成功')
          this.fetchData()
        } catch (error) {
          this.$message.error('收货失败')
        }
      }).catch(() => {})
    },
    handleCancel(row) {
      this.handleAction(row, cancelPurchaseOrder, '取消')
    },
    handleLowStock() {
      this.fetchLowStockMaterials()
    },
    async fetchLowStockMaterials() {
      try {
        const response = await getLowStockMaterials()
        this.lowStockMaterials = response.data.materials
        this.lowStockDialogVisible = true
      } catch (error) {
        this.$message.error('获取库存不足物料失败')
      }
    },
    handleCreatePurchaseFromLowStock() {
      this.lowStockDialogVisible = false
      this.handleAdd()
    },
    handleAddItem() {
      this.form.items.push({ material: null, quantity: 1, unit_price: 0 })
    },
    handleDeleteItem(index) {
      this.form.items.splice(index, 1)
    },
    handleMaterialChange(row) {
      const material = this.materialOptions.find(m => m.id === row.material)
      if (material) {
        row.unit_price = material.unit_price
      }
    },
    handleFormSubmit() {
      this.$refs.form.validate(async (valid) => {
        if (!valid) return

        if (this.form.items.length === 0) {
          this.$message.warning('请至少添加一条采购明细')
          return
        }

        try {
          const data = {
            ...this.form,
            items: this.form.items.map(item => ({
              material: item.material,
              quantity: item.quantity,
              unit_price: item.unit_price
            }))
          }
          if (this.dialogMode === 'add') {
            await createPurchaseOrder(data)
            this.$message.success('创建成功')
          } else {
            await updatePurchaseOrder(this.form.id, data)
            this.$message.success('更新成功')
          }
          this.dialogVisible = false
          this.fetchData()
        } catch (error) {
          this.$message.error(this.dialogMode === 'add' ? '创建失败' : '更新失败')
        }
      })
    },
    handleDialogClose() {
      this.form = { supplier: null, work_order_number: '', notes: '', items: [] }
    },
    getStatusType(status) {
      const map = {
        draft: 'info',
        submitted: 'warning',
        approved: 'success',
        ordered: 'primary',
        received: 'success',
        cancelled: 'danger'
      }
      return map[status] || 'info'
    },
    getItemStatusType(status) {
      const map = {
        pending: 'info',
        partial: 'warning',
        received: 'success'
      }
      return map[status] || 'info'
    },
    getProgressColor(percentage) {
      if (percentage >= 100) return '#67c23a'
      if (percentage >= 50) return '#e6a23c'
      return '#f56c6c'
    }
  }
}
</script>

<style scoped>
.purchase-order-list {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}
</style>
