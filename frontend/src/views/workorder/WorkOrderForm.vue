<template>
  <div v-loading="pageLoading" class="workorder-form">
    <el-card>
      <div slot="header" class="form-header">
        <span>{{ isEdit ? '编辑施工单' : '新建施工单' }}</span>
        <div class="header-actions">
          <el-button size="small" @click="handleCancel">
            取消
          </el-button>
          <el-button
            v-if="!isEdit"
            type="info"
            size="small"
            :loading="saving"
            @click="saveDraft"
          >
            <i class="el-icon-document"></i> 保存草稿
          </el-button>
          <el-button
            v-if="!isEdit || form.approval_status === 'rejected'"
            type="success"
            size="small"
            :loading="submitting"
            @click="submitForApproval"
          >
            <i class="el-icon-check"></i> 提交审核
          </el-button>
          <el-button
            type="primary"
            size="small"
            :loading="saving"
            @click="handleSubmit"
          >
            <i class="el-icon-check"></i> {{ isEdit ? '保存' : '创建' }}
          </el-button>
        </div>
      </div>

      <el-form
        ref="form"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="form-container"
      >
        <!-- 施工单号（编辑时显示） -->
        <el-form-item v-if="isEdit" label="施工单号">
          <el-input v-model="form.order_number" disabled>
            <template slot="append">
              <span style="color: #909399;">系统自动生成</span>
            </template>
          </el-input>
        </el-form-item>

        <!-- 基本信息 -->
        <el-divider content-position="left">
          基本信息
        </el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户" prop="customer">
              <el-select
                v-model="form.customer"
                placeholder="请选择客户"
                filterable
                style="width: 100%;"
                :disabled="isApproved"
              >
                <el-option
                  v-for="customer in customerList"
                  :key="customer.id"
                  :label="customer.name"
                  :value="customer.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" style="width: 100%;">
                <el-option
                  v-for="item in priorityOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                  <span :style="{color: item.color}">{{ item.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="下单日期" prop="order_date">
              <el-date-picker
                v-model="form.order_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
                :disabled="isApproved"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交货日期" prop="delivery_date">
              <el-date-picker
                v-model="form.delivery_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
                :disabled="isApproved"
                :picker-options="deliveryDatePickerOptions"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产数量" prop="production_quantity">
              <el-input-number
                v-model="form.production_quantity"
                :min="1"
                style="width: 100%;"
                :disabled="isApproved"
                controls-position="right"
                @change="calculateProductQuantities"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预损数量">
              <el-input-number
                v-model="form.defective_quantity"
                :min="0"
                style="width: 100%;"
                :disabled="isApproved"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item v-if="isEdit" label="实际交货日期">
              <el-date-picker
                v-model="form.actual_delivery_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%;"
                value-format="yyyy-MM-dd"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 产品信息 -->
        <el-divider content-position="left">
          产品信息
          <el-button
            type="primary"
            size="mini"
            icon="el-icon-plus"
            style="margin-left: 10px;"
            :disabled="isApproved"
            @click="addProduct"
          >
            添加产品
          </el-button>
        </el-divider>

        <div v-if="form.products.length > 0" class="product-table-wrapper">
          <el-table :data="form.products" border style="width: 100%">
            <el-table-column label="产品名称" min-width="200">
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.product"
                  placeholder="请选择产品"
                  filterable
                  style="width: 100%;"
                  :disabled="isApproved"
                  @change="handleProductChange(scope.$index, scope.row.product)"
                >
                  <el-option
                    v-for="product in productList"
                    :key="product.id"
                    :label="`${product.name} (${product.code})`"
                    :value="product.id"
                  >
                    <span style="float: left">{{ product.name }}</span>
                    <span style="float: right; color: #8492a6; font-size: 13px">{{ product.code }}</span>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="规格" width="150">
              <template slot-scope="scope">
                <el-input
                  :value="getProductSpecification(scope.row.product)"
                  placeholder="规格"
                  size="small"
                  disabled
                />
              </template>
            </el-table-column>
            <el-table-column label="拼版数" width="120" align="center">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.imposition_quantity"
                  :min="1"
                  :max="100"
                  size="small"
                  style="width: 100%;"
                  :disabled="isApproved"
                  controls-position="right"
                  @change="calculateProductQuantities"
                />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="120" align="center">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  size="small"
                  style="width: 100%;"
                  :disabled="isApproved"
                  controls-position="right"
                  @change="calculateTotalQuantity"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="danger"
                  size="mini"
                  icon="el-icon-delete"
                  :disabled="isApproved || form.products.length <= 1"
                  @click="removeProduct(scope.$index)"
                />
              </template>
            </el-table-column>
          </el-table>
          <div class="hint-text">
            选择产品后将自动加载该产品的默认工序和物料配置
          </div>
        </div>

        <div v-else class="empty-product-hint">
          <i class="el-icon-info"></i> 暂无产品信息，请点击上方按钮添加产品
        </div>

        <!-- 图稿和刀模 -->
        <el-divider content-position="left">
          图稿和刀模
        </el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图稿（CTP版）">
              <el-select
                v-model="form.artworks"
                placeholder="请选择图稿"
                filterable
                clearable
                multiple
                style="width: 100%;"
                :disabled="isApproved"
                @change="handleArtworksChange"
              >
                <el-option
                  v-for="artwork in artworkList"
                  :key="artwork.id"
                  :label="`${artwork.code} - ${artwork.name}`"
                  :value="artwork.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="刀模">
              <el-select
                v-model="form.dies"
                placeholder="请选择刀模"
                filterable
                clearable
                multiple
                style="width: 100%;"
                :disabled="isApproved"
              >
                <el-option
                  v-for="die in dieList"
                  :key="die.id"
                  :label="`${die.code} - ${die.name}`"
                  :value="die.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="烫金版">
              <el-select
                v-model="form.foiling_plates"
                placeholder="请选择烫金版"
                filterable
                clearable
                multiple
                style="width: 100%;"
                :disabled="isApproved"
              >
                <el-option
                  v-for="plate in foilingPlateList"
                  :key="plate.id"
                  :label="`${plate.code} - ${plate.name}`"
                  :value="plate.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="击凸版">
              <el-select
                v-model="form.embossing_plates"
                placeholder="请选择击凸版"
                filterable
                clearable
                multiple
                style="width: 100%;"
                :disabled="isApproved"
              >
                <el-option
                  v-for="plate in embossingPlateList"
                  :key="plate.id"
                  :label="`${plate.code} - ${plate.name}`"
                  :value="plate.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 印刷信息 -->
        <el-divider content-position="left">
          印刷信息
        </el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="印刷形式">
              <el-select
                v-model="form.printing_type"
                placeholder="请选择印刷形式"
                style="width: 100%;"
                :disabled="isApproved"
              >
                <el-option
                  v-for="item in printingTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="CMYK颜色">
              <el-checkbox-group v-model="form.printing_cmyk_colors" :disabled="isApproved">
                <el-checkbox label="C">
                  C
                </el-checkbox>
                <el-checkbox label="M">
                  M
                </el-checkbox>
                <el-checkbox label="Y">
                  Y
                </el-checkbox>
                <el-checkbox label="K">
                  K
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="其他颜色">
              <el-select
                v-model="form.printing_other_colors"
                placeholder="输入专色编号，回车添加"
                multiple
                filterable
                allow-create
                default-first-option
                style="width: 100%;"
                :disabled="isApproved"
              >
                <el-option
                  v-for="color in commonSpotColors"
                  :key="color"
                  :label="color"
                  :value="color"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 工序选择 -->
        <el-divider content-position="left">
          工序选择
          <el-tag
            v-if="selectedProcessIds.length > 0"
            size="small"
            type="success"
            style="margin-left: 10px;"
          >
            已选 {{ selectedProcessIds.length }} 个工序
          </el-tag>
        </el-divider>

        <div class="process-wrapper">
          <el-checkbox-group v-model="selectedProcessIds" :disabled="isApproved" class="process-checkbox-group">
            <el-checkbox
              v-for="process in allProcesses"
              :key="process.id"
              :label="process.id"
              class="process-checkbox"
            >
              {{ process.name }}
            </el-checkbox>
          </el-checkbox-group>
          <div v-if="allProcesses.length === 0" class="no-process-hint">
            <i class="el-icon-warning"></i> 暂无可用工序，请先在工序管理中添加工序
          </div>
        </div>

        <!-- 物料信息 -->
        <el-divider content-position="left">
          物料信息
          <el-button
            type="primary"
            size="mini"
            icon="el-icon-plus"
            style="margin-left: 10px;"
            :disabled="isApproved"
            @click="addMaterialItem"
          >
            添加物料
          </el-button>
        </el-divider>

        <div v-if="form.materials.length > 0" class="material-table-wrapper">
          <el-table :data="form.materials" border style="width: 100%">
            <el-table-column label="物料名称" width="200">
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.material"
                  placeholder="请选择物料"
                  filterable
                  style="width: 100%;"
                  :disabled="isApproved"
                >
                  <el-option
                    v-for="material in materialList"
                    :key="material.id"
                    :label="`${material.name} (${material.code})`"
                    :value="material.id"
                  />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="尺寸" width="150">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.material_size"
                  placeholder="如：A4、210x297mm"
                  size="small"
                  :disabled="isApproved"
                />
              </template>
            </el-table-column>
            <el-table-column label="用量" width="150">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.material_usage"
                  placeholder="如：1000张"
                  size="small"
                  :disabled="isApproved"
                />
              </template>
            </el-table-column>
            <el-table-column label="是否开料" width="100" align="center">
              <template slot-scope="scope">
                <el-switch v-model="scope.row.need_cutting" :disabled="isApproved" />
              </template>
            </el-table-column>
            <el-table-column label="备注">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.notes"
                  placeholder="备注"
                  size="small"
                  :disabled="isApproved"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button
                  type="danger"
                  size="mini"
                  icon="el-icon-delete"
                  :disabled="isApproved"
                  @click="removeMaterialItem(scope.$index)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div v-else class="empty-material-hint">
          <i class="el-icon-info"></i> 暂无物料信息，选择产品后将自动加载默认物料，或点击上方按钮手动添加
        </div>

        <!-- 其他信息 -->
        <el-divider content-position="left">
          其他信息
        </el-divider>

        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            :disabled="isApproved"
          />
        </el-form-item>

        <!-- 底部操作按钮 -->
        <el-form-item class="form-actions">
          <el-button @click="handleCancel">
            取消
          </el-button>
          <el-button
            v-if="!isEdit"
            type="info"
            :loading="saving"
            @click="saveDraft"
          >
            <i class="el-icon-document"></i> 保存草稿
          </el-button>
          <el-button
            v-if="!isEdit || form.approval_status === 'rejected'"
            type="success"
            :loading="submitting"
            @click="submitForApproval"
          >
            <i class="el-icon-check"></i> 提交审核
          </el-button>
          <el-button type="primary" :loading="saving" @click="handleSubmit">
            {{ isEdit ? '保存' : '创建' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// 导入 API 模块
import { customerAPI } from '@/api/modules/customer'
import { productAPI } from '@/api/modules/product'
import { processAPI } from '@/api/modules/process'
import { materialAPI } from '@/api/modules/material'
import { workOrderAPI } from '@/api/modules/workorder'
import { artworkAPI } from '@/api/modules/artwork'
import { dieAPI } from '@/api/modules/die'
import { foilingPlateAPI } from '@/api/modules/foiling-plate'
import { embossingPlateAPI } from '@/api/modules/embossing-plate'
// 导入错误处理工具
import ErrorHandler from '@/utils/errorHandler'

/**
 * 防抖函数
 */
function debounce(fn, delay) {
  let timer = null
  const debouncedFn = function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
  debouncedFn.cancel = function () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return debouncedFn
}

export default {
  name: 'WorkOrderForm',
  props: {
    id: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    // 自定义验证器：交货日期必须晚于或等于下单日期
    const validateDeliveryDate = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请选择交货日期'))
      } else if (this.form.order_date && new Date(value) < new Date(this.form.order_date)) {
        callback(new Error('交货日期不能早于下单日期'))
      } else {
        callback()
      }
    }

    return {
      // 加载状态
      pageLoading: false,
      saving: false,
      submitting: false,

      // 列表数据
      customerList: [],
      productList: [],
      materialList: [],
      artworkList: [],
      dieList: [],
      foilingPlateList: [],
      embossingPlateList: [],
      allProcesses: [],

      // 选中的工序ID列表
      selectedProcessIds: [],

      // 表单数据
      form: {
        order_number: '',
        customer: null,
        priority: 'normal',
        order_date: '',
        delivery_date: '',
        actual_delivery_date: '',
        production_quantity: 0,
        notes: '',
        approval_status: 'pending',
        // 产品列表
        products: [],
        // 图稿和刀模（多选）
        artworks: [],
        dies: [],
        foiling_plates: [],
        embossing_plates: [],
        // 印刷信息
        printing_type: 'none',
        printing_cmyk_colors: [],
        printing_other_colors: [],
        // 预损数量
        defective_quantity: null,
        // 物料列表
        materials: []
      },

      // 表单验证规则
      rules: {
        customer: [
          { required: true, message: '请选择客户', trigger: 'change' }
        ],
        order_date: [
          { required: true, message: '请选择下单日期', trigger: 'change' }
        ],
        delivery_date: [
          { required: true, validator: validateDeliveryDate, trigger: 'change' }
        ],
        priority: [
          { required: true, message: '请选择优先级', trigger: 'change' }
        ]
      },

      // 优先级选项
      priorityOptions: [
        { label: '低', value: 'low', color: '#67C23A' },
        { label: '普通', value: 'normal', color: '#409EFF' },
        { label: '高', value: 'high', color: '#E6A23C' },
        { label: '紧急', value: 'urgent', color: '#F56C6C' }
      ],

      // 印刷形式选项
      printingTypeOptions: [
        { label: '不需要印刷', value: 'none' },
        { label: '正面印刷', value: 'front' },
        { label: '背面印刷', value: 'back' },
        { label: '自反印刷', value: 'self_reverse' },
        { label: '反咬口印刷', value: 'reverse_gripper' },
        { label: '套版印刷', value: 'register' }
      ],

      // 常用专色列表
      commonSpotColors: [
        '528C', '485C', '186C', '032C', '021C',
        '金色', '银色', '珠光', '荧光绿', '荧光橙'
      ],

      // 防抖保存草稿函数
      debouncedSaveDraft: null
    }
  },
  computed: {
    isEdit() {
      return !!this.id
    },
    isApproved() {
      return this.form.approval_status === 'approved'
    },
    // 交货日期选择器选项
    deliveryDatePickerOptions() {
      const orderDate = this.form.order_date
      return {
        disabledDate: (date) => {
          if (!orderDate) return false
          return date < new Date(orderDate)
        }
      }
    }
  },
  watch: {
    // 监听表单变化，防抖保存草稿
    form: {
      handler() {
        if (!this.isEdit && this.debouncedSaveDraft) {
          this.debouncedSaveDraft()
        }
      },
      deep: true
    },
    // 监听下单日期变化
    'form.order_date'() {
      if (this.form.delivery_date) {
        this.$refs.form?.validateField('delivery_date')
      }
    }
  },
  created() {
    // 初始化防抖函数
    this.debouncedSaveDraft = debounce(() => {
      this.saveDraftToLocalStorage()
    }, 2000)
  },
  async mounted() {
    await this.loadAllData()
    if (this.isEdit) {
      await this.loadWorkOrder()
    } else {
      this.initNewForm()
      this.restoreDraftFromLocalStorage()
    }
  },
  beforeDestroy() {
    if (this.debouncedSaveDraft) {
      this.debouncedSaveDraft.cancel()
    }
  },
  methods: {
    // ==================== 数据加载 ====================

    async loadAllData() {
      this.pageLoading = true
      try {
        const [
          customersRes,
          productsRes,
          materialsRes,
          artworksRes,
          diesRes,
          foilingPlatesRes,
          embossingPlatesRes,
          processesRes
        ] = await Promise.all([
          customerAPI.getList({ page_size: 1000 }),
          productAPI.getList({ is_active: true, page_size: 1000 }),
          materialAPI.getList({ page_size: 1000 }),
          artworkAPI.getList({ page_size: 1000 }),
          dieAPI.getList({ page_size: 1000 }),
          foilingPlateAPI.getList({ page_size: 1000 }),
          embossingPlateAPI.getList({ page_size: 1000 }),
          processAPI.getList({ is_active: true, page_size: 1000, ordering: 'sort_order' })
        ])

        this.customerList = customersRes.results || customersRes || []
        this.productList = productsRes.results || productsRes || []
        this.materialList = materialsRes.results || materialsRes || []
        this.artworkList = artworksRes.results || artworksRes || []
        this.dieList = diesRes.results || diesRes || []
        this.foilingPlateList = foilingPlatesRes.results || foilingPlatesRes || []
        this.embossingPlateList = embossingPlatesRes.results || embossingPlatesRes || []
        this.allProcesses = processesRes.results || processesRes || []
      } catch (error) {
        ErrorHandler.showMessage(error, '加载数据')
      } finally {
        this.pageLoading = false
      }
    },

    async loadWorkOrder() {
      this.pageLoading = true
      try {
        const response = await workOrderAPI.getDetail(this.id)
        const data = response.data || response

        // 填充基本信息
        this.form = {
          ...this.form,
          order_number: data.order_number,
          customer: data.customer,
          priority: data.priority,
          order_date: data.order_date,
          delivery_date: data.delivery_date,
          actual_delivery_date: data.actual_delivery_date || '',
          production_quantity: data.production_quantity || 0,
          defective_quantity: data.defective_quantity || null,
          notes: data.notes || '',
          approval_status: data.approval_status || 'pending',
          // 图稿和刀模（多选）
          artworks: data.artworks || [],
          dies: data.dies || [],
          foiling_plates: data.foiling_plates || [],
          embossing_plates: data.embossing_plates || [],
          // 印刷信息
          printing_type: data.printing_type || 'none',
          printing_cmyk_colors: data.printing_cmyk_colors || [],
          printing_other_colors: data.printing_other_colors || []
        }

        // 填充产品列表
        if (data.products && data.products.length > 0) {
          this.form.products = data.products.map(p => ({
            product: p.product || p.id,
            quantity: p.quantity || 1,
            imposition_quantity: p.imposition_quantity || 1,
            unit: p.unit || '件'
          }))
        } else {
          this.form.products = []
        }

        // 填充物料列表
        if (data.materials && data.materials.length > 0) {
          this.form.materials = data.materials.map(m => ({
            id: m.id,
            material: m.material,
            material_size: m.material_size || '',
            material_usage: m.material_usage || '',
            need_cutting: m.need_cutting || false,
            notes: m.notes || ''
          }))
        }

        // 填充已选工序（直接使用工序ID数组）
        if (data.processes && data.processes.length > 0) {
          this.selectedProcessIds = [...data.processes]
        }
      } catch (error) {
        ErrorHandler.showMessage(error, '加载施工单')
      } finally {
        this.pageLoading = false
      }
    },

    initNewForm() {
      // 设置默认日期
      const today = new Date()
      this.form.order_date = this.formatDate(today)

      const deliveryDate = new Date()
      deliveryDate.setDate(deliveryDate.getDate() + 7)
      this.form.delivery_date = this.formatDate(deliveryDate)

      // 添加一个空产品项
      this.form.products = [{
        product: null,
        quantity: 1,
        imposition_quantity: 1,
        unit: '件'
      }]
    },

    // ==================== 产品相关 ====================

    addProduct() {
      this.form.products.push({
        product: null,
        quantity: 1,
        imposition_quantity: 1,
        unit: '件'
      })
    },

    removeProduct(index) {
      if (this.form.products.length > 1) {
        this.form.products.splice(index, 1)
        this.calculateTotalQuantity()
      }
    },

    getProductSpecification(productId) {
      if (!productId) return ''
      const product = this.productList.find(p => p.id === productId)
      return product ? product.specification : ''
    },

    async handleProductChange(index, productId) {
      if (!productId) return

      try {
        // 获取产品详情（包含默认工序和物料）
        const response = await productAPI.getDetail(productId)
        const productDetail = response.data || response

        // 自动加载默认工序
        if (productDetail.default_processes && productDetail.default_processes.length > 0) {
          let addedCount = 0
          productDetail.default_processes.forEach(processId => {
            // 避免重复添加
            if (!this.selectedProcessIds.includes(processId)) {
              this.selectedProcessIds.push(processId)
              addedCount++
            }
          })
          if (addedCount > 0) {
            this.$message.success(`已自动加载 ${addedCount} 个默认工序`)
          }
        }

        // 自动加载默认物料（如果产品有关联物料）
        if (productDetail.default_materials && productDetail.default_materials.length > 0) {
          let addedCount = 0
          productDetail.default_materials.forEach(m => {
            // 避免重复添加
            const exists = this.form.materials.some(fm => fm.material === m.material)
            if (!exists) {
              this.form.materials.push({
                material: m.material,
                material_size: m.material_size || '',
                material_usage: m.material_usage || '',
                need_cutting: m.need_cutting || false,
                notes: ''
              })
              addedCount++
            }
          })
          if (addedCount > 0) {
            this.$message.success(`已自动加载 ${addedCount} 个默认物料`)
          }
        }

        this.calculateTotalQuantity()
      } catch (error) {
        console.warn('加载产品默认信息失败:', error)
      }
    },

    calculateTotalQuantity() {
      this.form.production_quantity = this.form.products.reduce(
        (sum, p) => sum + (p.quantity || 0),
        0
      )
    },

    calculateProductQuantities() {
      // 根据生产数量和拼版数计算每个产品的数量
      // 公式：产品数量 = 生产数量 * 拼版数
      const productionQty = this.form.production_quantity || 0
      this.form.products.forEach(p => {
        const impositionQty = p.imposition_quantity || 1
        p.quantity = productionQty * impositionQty
      })
    },

    // ==================== 图稿相关 ====================

    async handleArtworksChange(artworkIds) {
      if (!artworkIds || artworkIds.length === 0) return

      try {
        // 获取所有选中图稿的详情
        for (const artworkId of artworkIds) {
          const artwork = this.artworkList.find(a => a.id === artworkId)
          if (!artwork) continue

          // 如果图稿有 CMYK 颜色，自动填充（合并不重复）
          if (artwork.cmyk_colors && artwork.cmyk_colors.length > 0) {
            artwork.cmyk_colors.forEach(color => {
              if (!this.form.printing_cmyk_colors.includes(color)) {
                this.form.printing_cmyk_colors.push(color)
              }
            })
          }

          // 如果图稿有其他颜色，自动填充（合并不重复）
          if (artwork.other_colors && artwork.other_colors.length > 0) {
            artwork.other_colors.forEach(color => {
              if (!this.form.printing_other_colors.includes(color)) {
                this.form.printing_other_colors.push(color)
              }
            })
          }

          // 如果图稿有关联刀模，自动填充（合并不重复）
          if (artwork.dies && artwork.dies.length > 0) {
            artwork.dies.forEach(dieId => {
              if (!this.form.dies.includes(dieId)) {
                this.form.dies.push(dieId)
              }
            })
          }

          // 如果图稿有关联烫金版，自动填充（合并不重复）
          if (artwork.foiling_plates && artwork.foiling_plates.length > 0) {
            artwork.foiling_plates.forEach(plateId => {
              if (!this.form.foiling_plates.includes(plateId)) {
                this.form.foiling_plates.push(plateId)
              }
            })
          }

          // 如果图稿有关联压凸版，自动填充（合并不重复）
          if (artwork.embossing_plates && artwork.embossing_plates.length > 0) {
            artwork.embossing_plates.forEach(plateId => {
              if (!this.form.embossing_plates.includes(plateId)) {
                this.form.embossing_plates.push(plateId)
              }
            })
          }
        }

        // 如果选择了图稿且印刷形式为"不需要印刷"，自动改为"正面印刷"
        if (this.form.printing_type === 'none' && artworkIds.length > 0) {
          this.form.printing_type = 'front'
        }

        this.$message.success('已自动加载图稿关联信息')
      } catch (error) {
        console.warn('加载图稿信息失败:', error)
      }
    },

    // ==================== 物料相关 ====================

    addMaterialItem() {
      this.form.materials.push({
        material: null,
        material_size: '',
        material_usage: '',
        need_cutting: false,
        notes: ''
      })
    },

    removeMaterialItem(index) {
      this.form.materials.splice(index, 1)
    },

    // ==================== 草稿管理 ====================

    saveDraftToLocalStorage() {
      try {
        const draft = {
          form: this.form,
          selectedProcessIds: this.selectedProcessIds,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem('workorder_draft', JSON.stringify(draft))
      } catch (error) {
        console.error('保存草稿失败:', error)
      }
    },

    restoreDraftFromLocalStorage() {
      // 只在新建模式下恢复草稿，编辑模式不恢复
      if (this.isEdit) return

      try {
        const draftStr = localStorage.getItem('workorder_draft')
        if (!draftStr) return

        const draft = JSON.parse(draftStr)
        const draftTime = new Date(draft.timestamp)
        const hoursDiff = (new Date() - draftTime) / (1000 * 60 * 60)

        if (hoursDiff > 24) {
          localStorage.removeItem('workorder_draft')
          return
        }

        // 恢复数据
        if (draft.form) {
          this.form = { ...this.form, ...draft.form }
        }
        if (draft.selectedProcessIds) {
          this.selectedProcessIds = [...draft.selectedProcessIds]
        }

        this.$message.info('已恢复上次的草稿数据')
      } catch (error) {
        console.error('恢复草稿失败:', error)
        localStorage.removeItem('workorder_draft')
      }
    },

    clearDraftFromLocalStorage() {
      localStorage.removeItem('workorder_draft')
    },

    // ==================== 表单验证 ====================

    async validateForm() {
      // 验证基础表单
      try {
        await this.$refs.form.validate()
      } catch {
        ErrorHandler.showWarning('请完善基本信息')
        return false
      }

      // 验证产品
      const validProducts = this.form.products.filter(p => p.product && p.quantity > 0)
      if (validProducts.length === 0) {
        ErrorHandler.showWarning('请添加至少一个产品')
        return false
      }

      // 验证工序
      if (this.selectedProcessIds.length === 0) {
        ErrorHandler.showWarning('请选择至少一个工序')
        return false
      }

      return true
    },

    // ==================== 数据准备 ====================

    prepareSubmitData(options = {}) {
      const validProducts = this.form.products.filter(p => p.product && p.quantity > 0)
      const validMaterials = this.form.materials.filter(m => m.material)

      return {
        customer: this.form.customer,
        priority: this.form.priority,
        order_date: this.form.order_date,
        delivery_date: this.form.delivery_date,
        actual_delivery_date: this.form.actual_delivery_date || null,
        production_quantity: this.form.production_quantity,
        defective_quantity: this.form.defective_quantity || null,
        notes: this.form.notes || '',
        // 图稿和刀模（多选）
        artworks: this.form.artworks || [],
        dies: this.form.dies || [],
        foiling_plates: this.form.foiling_plates || [],
        embossing_plates: this.form.embossing_plates || [],
        // 印刷信息
        printing_type: this.form.printing_type || 'none',
        printing_cmyk_colors: this.form.printing_cmyk_colors || [],
        printing_other_colors: this.form.printing_other_colors || [],
        // 状态覆盖
        ...(options.status && { status: options.status }),
        ...(options.approval_status && { approval_status: options.approval_status }),
        // 产品数据
        products_data: validProducts.map((p, index) => ({
          product: p.product,
          quantity: p.quantity,
          imposition_quantity: p.imposition_quantity || 1,
          unit: p.unit || '件',
          sort_order: index
        })),
        // 工序数据
        processes: [...this.selectedProcessIds],
        // 物料数据
        materials_data: validMaterials.map(m => ({
          material: m.material,
          material_size: m.material_size || '',
          material_usage: m.material_usage || '',
          need_cutting: m.need_cutting || false,
          notes: m.notes || '',
          purchase_status: m.purchase_status || 'pending'
        }))
      }
    },

    // ==================== 保存操作 ====================

    async saveDraft() {
      this.saving = true
      try {
        const data = this.prepareSubmitData({ status: 'draft' })
        if (this.isEdit) {
          await workOrderAPI.update(this.id, data)
        } else {
          await workOrderAPI.create(data)
        }
        ErrorHandler.showSuccess('草稿保存成功')
        this.clearDraftFromLocalStorage()
      } catch (error) {
        ErrorHandler.showMessage(error, '保存草稿')
      } finally {
        this.saving = false
      }
    },

    async submitForApproval() {
      const isValid = await this.validateForm()
      if (!isValid) return

      this.submitting = true
      try {
        const data = this.prepareSubmitData({ approval_status: 'pending' })
        if (this.isEdit) {
          await workOrderAPI.update(this.id, data)
        } else {
          await workOrderAPI.create(data)
        }
        ErrorHandler.showSuccess('提交审核成功')
        this.clearDraftFromLocalStorage()
        this.$router.push('/workorders')
      } catch (error) {
        ErrorHandler.showMessage(error, '提交审核')
      } finally {
        this.submitting = false
      }
    },

    async handleSubmit() {
      const isValid = await this.validateForm()
      if (!isValid) return

      this.saving = true
      try {
        const data = this.prepareSubmitData()
        if (this.isEdit) {
          await workOrderAPI.update(this.id, data)
          ErrorHandler.showSuccess('施工单更新成功')
        } else {
          await workOrderAPI.create(data)
          ErrorHandler.showSuccess('施工单创建成功')
        }
        this.clearDraftFromLocalStorage()
        this.$router.push('/workorders')
      } catch (error) {
        ErrorHandler.showMessage(error, '保存施工单')
      } finally {
        this.saving = false
      }
    },

    handleCancel() {
      this.$router.back()
    },

    // ==================== 工具方法 ====================

    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
}
</script>

<style scoped>
.workorder-form {
  padding: 20px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-header span {
  font-size: 18px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.form-container {
  max-width: 1000px;
}

/* 产品表格容器 */
.product-table-wrapper {
  margin-bottom: 20px;
  margin-left: 40px;
}

/* 工序选择容器 */
.process-wrapper {
  margin-bottom: 20px;
  margin-left: 40px;
}

/* 物料表格容器 */
.material-table-wrapper {
  margin-bottom: 20px;
  margin-left: 40px;
}

/* 产品列表空状态样式 */
.empty-product-hint {
  background: #f5f7fa;
  padding: 20px;
  text-align: center;
  color: #909399;
  border-radius: 4px;
  margin-bottom: 20px;
}

.hint-text {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

/* 工序选择样式 */
.process-checkbox-group {
  display: flex;
  flex-wrap: wrap;
}

.process-checkbox {
  width: 150px;
  margin-right: 20px;
  margin-bottom: 15px;
}

.process-section {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.process-section .el-form-item {
  margin-bottom: 15px;
}

.process-section .el-checkbox {
  margin-right: 15px;
  margin-bottom: 8px;
}

.no-process-hint {
  color: #909399;
  font-size: 13px;
}

/* 物料表格样式 */
.empty-material-hint {
  background: #f5f7fa;
  padding: 20px;
  text-align: center;
  color: #909399;
  border-radius: 4px;
  margin-bottom: 20px;
}

/* 底部操作按钮 */
.form-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
}

/* 分割线样式 */
.el-divider--horizontal {
  margin: 25px 0 20px;
}

/* 响应式 */
@media (max-width: 768px) {
  .workorder-form {
    padding: 10px;
  }

  .form-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .product-item .el-row {
    flex-direction: column;
  }

  .product-item .el-col {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
